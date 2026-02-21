'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { FEATURES } from '@/lib/featureFlags';
import type {
  Workspace,
  WorkspaceConfig,
  SnapshotWithDiff,
  SnapshotInput,
} from './types';

interface WorkspaceStoreState {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  snapshots: SnapshotWithDiff[];
  isLoadingWorkspaces: boolean;
  isLoadingSnapshots: boolean;
  error: string | null;

  // Actions
  fetchWorkspaces: () => Promise<void>;
  createWorkspace: (
    name: string,
    mode: 'holdings' | 'watchlist',
    config: WorkspaceConfig,
  ) => Promise<Workspace | null>;
  updateWorkspace: (
    id: string,
    updates: { name?: string; mode?: string; config?: WorkspaceConfig; is_active?: boolean },
  ) => Promise<void>;
  deleteWorkspace: (id: string) => Promise<void>;
  setActiveWorkspace: (id: string | null) => void;

  fetchSnapshots: (workspaceId: string, limit?: number) => Promise<void>;
  createSnapshot: (data: SnapshotInput) => Promise<SnapshotWithDiff | null>;
  clearError: () => void;
}

export const useWorkspaceStore = create<WorkspaceStoreState>()(
  persist(
    (set, get) => ({
      workspaces: [],
      activeWorkspaceId: null,
      snapshots: [],
      isLoadingWorkspaces: false,
      isLoadingSnapshots: false,
      error: null,

      fetchWorkspaces: async () => {
        if (!FEATURES.addinV2) return;
        set({ isLoadingWorkspaces: true, error: null });
        try {
          const res = await fetch('/api/v1/workspaces');
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const { workspaces } = await res.json();
          set({ workspaces: workspaces || [], isLoadingWorkspaces: false });
        } catch (err: any) {
          set({ isLoadingWorkspaces: false, error: err.message || 'Failed to fetch workspaces' });
        }
      },

      createWorkspace: async (name, mode, config) => {
        if (!FEATURES.addinV2) return null;
        set({ error: null });
        try {
          const res = await fetch('/api/v1/workspaces', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, mode, config }),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const { workspace } = await res.json();
          set((state) => ({
            workspaces: [workspace, ...state.workspaces],
            activeWorkspaceId: workspace.id,
          }));
          return workspace;
        } catch (err: any) {
          set({ error: err.message || 'Failed to create workspace' });
          return null;
        }
      },

      updateWorkspace: async (id, updates) => {
        if (!FEATURES.addinV2) return;
        set({ error: null });
        try {
          const res = await fetch(`/api/v1/workspaces?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const { workspace } = await res.json();
          set((state) => ({
            workspaces: state.workspaces.map((w) => (w.id === id ? workspace : w)),
          }));
        } catch (err: any) {
          set({ error: err.message || 'Failed to update workspace' });
        }
      },

      deleteWorkspace: async (id) => {
        if (!FEATURES.addinV2) return;
        set({ error: null });
        try {
          const res = await fetch(`/api/v1/workspaces?id=${id}`, { method: 'DELETE' });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          set((state) => ({
            workspaces: state.workspaces.filter((w) => w.id !== id),
            activeWorkspaceId: state.activeWorkspaceId === id ? null : state.activeWorkspaceId,
            snapshots: state.activeWorkspaceId === id ? [] : state.snapshots,
          }));
        } catch (err: any) {
          set({ error: err.message || 'Failed to delete workspace' });
        }
      },

      setActiveWorkspace: (id) => {
        set({ activeWorkspaceId: id, snapshots: [] });
      },

      fetchSnapshots: async (workspaceId, limit = 20) => {
        if (!FEATURES.addinV2) return;
        set({ isLoadingSnapshots: true, error: null });
        try {
          const res = await fetch(
            `/api/v1/snapshots?workspace_id=${workspaceId}&limit=${limit}`,
          );
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const { snapshots } = await res.json();
          set({ snapshots: snapshots || [], isLoadingSnapshots: false });
        } catch (err: any) {
          set({ isLoadingSnapshots: false, error: err.message || 'Failed to fetch snapshots' });
        }
      },

      createSnapshot: async (data) => {
        if (!FEATURES.addinV2) return null;
        try {
          const res = await fetch('/api/v1/snapshots', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });
          if (!res.ok) {
            const err = await res.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(err.error || `HTTP ${res.status}`);
          }
          const { snapshot } = await res.json();
          // Prepend the new snapshot and recompute diffs locally
          set((state) => {
            const prev = state.snapshots[0] || null;
            const withDiff: SnapshotWithDiff = {
              ...snapshot,
              diff: prev
                ? {
                    return_7d_change:
                      snapshot.kpi_return_7d != null && prev.kpi_return_7d != null
                        ? snapshot.kpi_return_7d - prev.kpi_return_7d
                        : null,
                    return_30d_change:
                      snapshot.kpi_return_30d != null && prev.kpi_return_30d != null
                        ? snapshot.kpi_return_30d - prev.kpi_return_30d
                        : null,
                    value_change:
                      snapshot.kpi_value != null && prev.kpi_value != null
                        ? snapshot.kpi_value - prev.kpi_value
                        : null,
                    value_pct_change:
                      snapshot.kpi_value != null && prev.kpi_value != null && prev.kpi_value !== 0
                        ? Number(
                            (((snapshot.kpi_value - prev.kpi_value) / prev.kpi_value) * 100).toFixed(
                              2,
                            ),
                          )
                        : null,
                  }
                : null,
            };
            return { snapshots: [withDiff, ...state.snapshots] };
          });
          return snapshot;
        } catch (err: any) {
          set({ error: err.message || 'Failed to create snapshot' });
          return null;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'crk-workspaces',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
      partialize: (state) => ({
        activeWorkspaceId: state.activeWorkspaceId,
      }),
    },
  ),
);

// Computed selectors
export function useActiveWorkspace(): Workspace | null {
  return useWorkspaceStore((s) =>
    s.workspaces.find((w) => w.id === s.activeWorkspaceId) ?? null,
  );
}

export function useLatestSnapshot(): SnapshotWithDiff | null {
  return useWorkspaceStore((s) => s.snapshots[0] ?? null);
}

export function usePreviousSnapshot(): SnapshotWithDiff | null {
  return useWorkspaceStore((s) => s.snapshots[1] ?? null);
}
