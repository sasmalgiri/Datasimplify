'use client';

import { create } from 'zustand';

// ─── Types ───

export interface ExperimentSeries {
  id: string;
  label: string;
  sourceKey: string; // e.g. 'ohlc:bitcoin:close', 'sparkline:bitcoin', 'fear_greed', 'sma:20'
  color: string;
  chartType: 'line' | 'bar' | 'area';
  yAxisSide: 'left' | 'right';
  visible: boolean;
  data: number[];
  timestamps: number[];
}

interface ExperimentState {
  isOpen: boolean;
  series: ExperimentSeries[];
  editedCells: Record<string, Record<number, number>>; // seriesId → { index: value }
  editHistory: { seriesId: string; index: number; oldValue: number }[];
  smaWindow: number;
  emaWindow: number;
  rsiPeriod: number;
  normalizeMode: boolean;
  showTable: boolean;
  focusWidgetComponent: string | null;
}

interface ExperimentActions {
  open: () => void;
  close: () => void;
  toggle: () => void;
  addSeries: (s: Omit<ExperimentSeries, 'id'>) => void;
  removeSeries: (id: string) => void;
  toggleSeries: (id: string) => void;
  clearSeries: () => void;
  setSeries: (series: ExperimentSeries[]) => void;
  editCell: (seriesId: string, index: number, value: number) => void;
  undoLastEdit: () => void;
  resetEdits: (seriesId?: string) => void;
  setSmaWindow: (v: number) => void;
  setEmaWindow: (v: number) => void;
  setRsiPeriod: (v: number) => void;
  toggleNormalize: () => void;
  toggleTable: () => void;
  setFocusWidget: (component: string | null) => void;
}

type ExperimentStore = ExperimentState & ExperimentActions;

// ─── Colors for auto-assigned series ───

const SERIES_COLORS = [
  '#34d399', '#60a5fa', '#f59e0b', '#a78bfa', '#f43f5e',
  '#22d3ee', '#e879f9', '#fb923c', '#4ade80', '#818cf8',
];

let colorIdx = 0;

export function nextSeriesColor(): string {
  const c = SERIES_COLORS[colorIdx % SERIES_COLORS.length];
  colorIdx++;
  return c;
}

export function resetColorIndex() {
  colorIdx = 0;
}

// ─── Store ───

export const useExperimentStore = create<ExperimentStore>((set, get) => ({
  isOpen: false,
  series: [],
  editedCells: {},
  editHistory: [],
  smaWindow: 20,
  emaWindow: 12,
  rsiPeriod: 14,
  normalizeMode: false,
  showTable: false,
  focusWidgetComponent: null,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),

  addSeries: (s) => {
    const id = `${s.sourceKey}-${Date.now()}`;
    set((state) => ({
      series: [...state.series, { ...s, id }],
    }));
  },

  removeSeries: (id) => {
    set((state) => ({
      series: state.series.filter((s) => s.id !== id),
      editedCells: Object.fromEntries(
        Object.entries(state.editedCells).filter(([k]) => k !== id),
      ),
    }));
  },

  toggleSeries: (id) => {
    set((state) => ({
      series: state.series.map((s) =>
        s.id === id ? { ...s, visible: !s.visible } : s,
      ),
    }));
  },

  clearSeries: () => {
    resetColorIndex();
    set({ series: [], editedCells: {}, editHistory: [] });
  },

  setSeries: (series) => set({ series }),

  editCell: (seriesId, index, value) => {
    const series = get().series.find((s) => s.id === seriesId);
    const oldValue = get().editedCells[seriesId]?.[index] ?? series?.data[index] ?? 0;
    set((state) => ({
      editedCells: {
        ...state.editedCells,
        [seriesId]: { ...(state.editedCells[seriesId] || {}), [index]: value },
      },
      editHistory: [...state.editHistory, { seriesId, index, oldValue }],
    }));
  },

  undoLastEdit: () => {
    const { editHistory, editedCells } = get();
    if (editHistory.length === 0) return;
    const last = editHistory[editHistory.length - 1];
    const layerEdits = { ...(editedCells[last.seriesId] || {}) };
    delete layerEdits[last.index];
    set({
      editedCells: { ...editedCells, [last.seriesId]: layerEdits },
      editHistory: editHistory.slice(0, -1),
    });
  },

  resetEdits: (seriesId) => {
    if (seriesId) {
      set((state) => ({
        editedCells: Object.fromEntries(
          Object.entries(state.editedCells).filter(([k]) => k !== seriesId),
        ),
        editHistory: state.editHistory.filter((h) => h.seriesId !== seriesId),
      }));
    } else {
      set({ editedCells: {}, editHistory: [] });
    }
  },

  setSmaWindow: (v) => set({ smaWindow: v }),
  setEmaWindow: (v) => set({ emaWindow: v }),
  setRsiPeriod: (v) => set({ rsiPeriod: v }),
  toggleNormalize: () => set((s) => ({ normalizeMode: !s.normalizeMode })),
  toggleTable: () => set((s) => ({ showTable: !s.showTable })),
  setFocusWidget: (component) => set({ focusWidgetComponent: component }),
}));
