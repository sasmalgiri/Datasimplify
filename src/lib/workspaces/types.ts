/**
 * Workspace & Snapshot Types
 *
 * Mirrors the Supabase table schemas for user_workspaces and workspace_snapshots.
 * Used by the workspace Zustand store and all workspace-related components.
 */

export interface WorkspaceConfig {
  coins: string[];
  vsCurrency: string;
  dashboardType?: string;
  reportPackId?: string;
  customWidgets?: string[];
}

export interface Workspace {
  id: string;
  name: string;
  mode: 'holdings' | 'watchlist';
  config: WorkspaceConfig;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Snapshot {
  id: string;
  workspace_id: string;
  kpi_return_7d: number | null;
  kpi_return_30d: number | null;
  kpi_value: number | null;
  asset_count: number;
  top_mover_symbol: string | null;
  top_mover_change: number | null;
  used_cache: boolean;
  positions_json: PositionSnapshot[] | null;
  created_at: string;
}

export interface PositionSnapshot {
  symbol: string;
  coinId: string;
  price: number;
  change24h: number;
  marketCap: number;
}

export interface SnapshotDiff {
  return_7d_change: number | null;
  return_30d_change: number | null;
  value_change: number | null;
  value_pct_change: number | null;
}

export interface SnapshotWithDiff extends Snapshot {
  diff: SnapshotDiff | null;
}

export interface SnapshotInput {
  workspace_id: string;
  kpi_return_7d?: number;
  kpi_return_30d?: number;
  kpi_value?: number;
  asset_count?: number;
  top_mover_symbol?: string;
  top_mover_change?: number;
  used_cache?: boolean;
  positions_json?: PositionSnapshot[];
}

export interface WorkspaceCreateInput {
  name: string;
  mode: 'holdings' | 'watchlist';
  config: WorkspaceConfig;
}

export interface WorkspaceUpdateInput {
  name?: string;
  mode?: 'holdings' | 'watchlist';
  config?: WorkspaceConfig;
  is_active?: boolean;
}
