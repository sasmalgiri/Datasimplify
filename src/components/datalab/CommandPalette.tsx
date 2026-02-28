'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Search, X, Zap, BarChart3, Layers, Keyboard } from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { OVERLAY_PRESETS, PRESET_CATEGORIES } from '@/lib/datalab/presets';
import { DATA_SOURCE_OPTIONS } from '@/lib/datalab/types';
import { isPresetAllowed, getFilteredDataSources } from '@/lib/datalab/modeConfig';
import { SHORTCUTS } from '@/lib/datalab/keyboardShortcuts';

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

interface PaletteItem {
  id: string;
  label: string;
  description: string;
  category: string;
  action: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const dataLabMode = useDataLabStore((s) => s.dataLabMode);
  const loadPreset = useDataLabStore((s) => s.loadPreset);
  const addLayer = useDataLabStore((s) => s.addLayer);
  const recalculateLayers = useDataLabStore((s) => s.recalculateLayers);
  const toggleLogScale = useDataLabStore((s) => s.toggleLogScale);
  const toggleNormalize = useDataLabStore((s) => s.toggleNormalize);
  const toggleTable = useDataLabStore((s) => s.toggleTable);
  const toggleRegimes = useDataLabStore((s) => s.toggleRegimes);
  const toggleEvents = useDataLabStore((s) => s.toggleEvents);

  // Build items list
  const buildItems = useCallback((): PaletteItem[] => {
    const items: PaletteItem[] = [];

    // Presets
    for (const cat of PRESET_CATEGORIES) {
      for (const pId of cat.presetIds) {
        if (!isPresetAllowed(dataLabMode, pId)) continue;
        const p = OVERLAY_PRESETS.find((pr) => pr.id === pId);
        if (!p) continue;
        items.push({
          id: `preset-${p.id}`,
          label: p.name,
          description: p.description,
          category: 'Presets',
          action: () => { loadPreset(p.id); onClose(); },
        });
      }
    }

    // Data sources / indicators
    const filteredSources = getFilteredDataSources(dataLabMode);
    for (const opt of filteredSources) {
      items.push({
        id: `source-${opt.source}-${opt.chartType}`,
        label: `Add ${opt.label}`,
        description: `${opt.chartType} chart on ${opt.yAxis} axis`,
        category: 'Indicators',
        action: () => {
          addLayer({
            label: opt.label,
            source: opt.source,
            chartType: opt.chartType,
            yAxis: opt.yAxis,
            color: opt.color,
            visible: true,
            gridIndex: opt.gridIndex,
          });
          recalculateLayers();
          onClose();
        },
      });
    }

    // Actions
    items.push(
      { id: 'action-log', label: 'Toggle Log Scale', description: 'Switch between linear and logarithmic price axis', category: 'Actions', action: () => { toggleLogScale(); onClose(); } },
      { id: 'action-normalize', label: 'Toggle Normalize', description: 'Rebase all series to 100 at start', category: 'Actions', action: () => { toggleNormalize(); onClose(); } },
      { id: 'action-table', label: 'Toggle Data Table', description: 'Show/hide the editable data table', category: 'Actions', action: () => { toggleTable(); onClose(); } },
      { id: 'action-regimes', label: 'Toggle Regimes', description: 'Auto-detect market regimes on chart', category: 'Actions', action: () => { toggleRegimes(); onClose(); } },
      { id: 'action-events', label: 'Toggle Events', description: 'Show key market events as markers', category: 'Actions', action: () => { toggleEvents(); onClose(); } },
    );

    // Shortcuts reference
    for (const s of SHORTCUTS) {
      items.push({
        id: `shortcut-${s.action}`,
        label: `${s.label} — ${s.description}`,
        description: `Keyboard shortcut`,
        category: 'Shortcuts',
        action: () => onClose(),
      });
    }

    return items;
  }, [dataLabMode, loadPreset, addLayer, recalculateLayers, toggleLogScale, toggleNormalize, toggleTable, toggleRegimes, toggleEvents, onClose]);

  const allItems = buildItems();

  // Filter by query
  const filtered = query.trim()
    ? allItems.filter((item) => {
        const q = query.toLowerCase();
        return item.label.toLowerCase().includes(q) || item.description.toLowerCase().includes(q) || item.category.toLowerCase().includes(q);
      })
    : allItems;

  // Clamp selectedIdx
  useEffect(() => {
    setSelectedIdx(0);
  }, [query]);

  // Auto-focus input
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIdx((prev) => Math.min(prev + 1, filtered.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIdx((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filtered[selectedIdx]) filtered[selectedIdx].action();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open, filtered, selectedIdx, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const el = listRef.current.children[selectedIdx] as HTMLElement;
      el?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIdx]);

  if (!open) return null;

  // Group items by category
  const groups = new Map<string, PaletteItem[]>();
  for (const item of filtered.slice(0, 50)) {
    const arr = groups.get(item.category) ?? [];
    arr.push(item);
    groups.set(item.category, arr);
  }

  const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
    Presets: Zap,
    Indicators: BarChart3,
    Actions: Layers,
    Shortcuts: Keyboard,
  };

  let globalIdx = -1;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-gray-900 border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <Search className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search presets, indicators, actions..."
            className="flex-1 bg-transparent text-white text-sm focus:outline-none placeholder:text-gray-600"
          />
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-1.5">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-600 text-sm">
              No results for &quot;{query}&quot;
            </div>
          ) : (
            Array.from(groups.entries()).map(([category, items]) => {
              const CatIcon = CATEGORY_ICON[category] ?? Layers;
              return (
                <div key={category}>
                  <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                    <CatIcon className="w-3 h-3" />
                    {category}
                  </div>
                  {items.map((item) => {
                    globalIdx++;
                    const isSelected = globalIdx === selectedIdx;
                    const idx = globalIdx;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => item.action()}
                        onMouseEnter={() => setSelectedIdx(idx)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition flex items-center gap-3 ${
                          isSelected ? 'bg-white/[0.06] text-white' : 'text-gray-400 hover:bg-white/[0.04]'
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium truncate">{item.label}</div>
                          <div className="text-[10px] text-gray-600 truncate">{item.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-4 px-4 py-2 border-t border-white/[0.06] text-[10px] text-gray-600">
          <span><kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[9px]">&uarr;&darr;</kbd> Navigate</span>
          <span><kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[9px]">Enter</kbd> Select</span>
          <span><kbd className="px-1 py-0.5 bg-white/[0.06] rounded text-[9px]">Esc</kbd> Close</span>
        </div>
      </div>
    </div>
  );
}
