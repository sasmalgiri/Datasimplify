'use client';

import { useState } from 'react';
import {
  Target, Brain, Gauge, RefreshCw, Layers,
  Eye, EyeOff, Trash2, Plus, ChevronDown,
  RotateCcw, Table2, Maximize2,
} from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { OVERLAY_PRESETS, getPresetById } from '@/lib/datalab/presets';
import { DATA_SOURCE_OPTIONS } from '@/lib/datalab/types';
import type { ParameterDef } from '@/lib/datalab/types';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Target, Brain, Gauge, RefreshCw, Layers,
};

const TIME_RANGES = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '1y', value: 365 },
  { label: '2y', value: 730 },
];

export function DataLabToolbar() {
  const {
    coin, days, activePreset, layers, parameters, normalizeMode, showTable,
    setCoin, setDays, loadPreset, loadData, recalculateLayers,
    toggleLayer, removeLayer, addLayer, setParameter,
    toggleNormalize, toggleTable, resetEdits, resetParameters,
  } = useDataLabStore();

  const [showAddLayer, setShowAddLayer] = useState(false);
  const [coinInput, setCoinInput] = useState(coin);
  const preset = activePreset ? getPresetById(activePreset) : null;

  const handleCoinChange = async () => {
    const trimmed = coinInput.trim().toLowerCase();
    if (trimmed && trimmed !== coin) {
      useDataLabStore.setState({ coin: trimmed });
      await loadData();
    }
  };

  const handleDaysChange = async (d: number) => {
    setDays(d);
    await loadData();
  };

  // Collect parameter defs from the active preset
  const paramDefs: ParameterDef[] = preset?.parameterDefs ?? [];

  return (
    <div className="w-72 flex-shrink-0 border-r border-white/[0.06] bg-white/[0.02] overflow-y-auto">
      <div className="p-4 space-y-5">
        {/* Presets */}
        <section>
          <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
            Overlay Presets
          </h3>
          <div className="space-y-1.5">
            {OVERLAY_PRESETS.map((p) => {
              const Icon = ICON_MAP[p.icon];
              const isActive = activePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => loadPreset(p.id)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                    isActive
                      ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                      : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
                    <span className="font-medium">{p.name}</span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5 ml-5.5">{p.description}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Coin + Time Range */}
        <section>
          <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-medium mb-2">
            Settings
          </h3>

          {/* Coin */}
          <div className="mb-3">
            <label className="text-[10px] text-gray-500 mb-1 block">Coin ID</label>
            <div className="flex gap-1">
              <input
                type="text"
                value={coinInput}
                onChange={(e) => setCoinInput(e.target.value)}
                onBlur={handleCoinChange}
                onKeyDown={(e) => e.key === 'Enter' && handleCoinChange()}
                className="flex-1 bg-white/[0.04] border border-white/[0.1] text-white text-xs px-2.5 py-1.5 rounded-lg focus:outline-none focus:border-emerald-400/40"
              />
            </div>
          </div>

          {/* Time Range */}
          <div>
            <label className="text-[10px] text-gray-500 mb-1 block">Time Range</label>
            <div className="flex gap-1">
              {TIME_RANGES.map((tr) => (
                <button
                  key={tr.value}
                  type="button"
                  onClick={() => handleDaysChange(tr.value)}
                  className={`flex-1 py-1 text-[10px] font-medium rounded-md transition ${
                    days === tr.value
                      ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                      : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
                  }`}
                >
                  {tr.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Layers */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
              Layers ({layers.length})
            </h3>
            <button
              type="button"
              onClick={() => setShowAddLayer(!showAddLayer)}
              className="text-emerald-400 hover:text-emerald-300 transition"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Add Layer Dropdown */}
          {showAddLayer && (
            <div className="mb-2 bg-white/[0.04] border border-white/[0.06] rounded-lg p-2 space-y-1">
              {DATA_SOURCE_OPTIONS.map((opt) => {
                const alreadyAdded = layers.some((l) => l.source === opt.source && l.chartType === opt.chartType);
                return (
                  <button
                    key={`${opt.source}-${opt.chartType}`}
                    type="button"
                    disabled={alreadyAdded}
                    onClick={() => {
                      addLayer({
                        label: opt.label,
                        source: opt.source,
                        chartType: opt.chartType,
                        yAxis: opt.yAxis,
                        color: opt.color,
                        visible: true,
                        gridIndex: opt.gridIndex,
                      });
                      setShowAddLayer(false);
                      recalculateLayers();
                    }}
                    className={`w-full text-left px-2 py-1 text-[10px] rounded transition ${
                      alreadyAdded
                        ? 'text-gray-600 cursor-not-allowed'
                        : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                    }`}
                  >
                    <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: opt.color }} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Layer List */}
          <div className="space-y-1">
            {layers.map((layer) => (
              <div
                key={layer.id}
                className="flex items-center gap-1.5 px-2 py-1.5 bg-white/[0.03] border border-white/[0.06] rounded-lg"
              >
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: layer.color }} />
                <span className={`flex-1 text-[10px] truncate ${layer.visible ? 'text-gray-300' : 'text-gray-600 line-through'}`}>
                  {layer.label}
                </span>
                <button
                  type="button"
                  onClick={() => toggleLayer(layer.id)}
                  className="text-gray-500 hover:text-white transition"
                >
                  {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={() => removeLayer(layer.id)}
                  className="text-gray-600 hover:text-red-400 transition"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Parameters */}
        {paramDefs.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
                Parameters
              </h3>
              <button
                type="button"
                onClick={() => {
                  resetParameters();
                  recalculateLayers();
                }}
                className="text-gray-600 hover:text-gray-400 transition"
                title="Reset parameters"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            </div>
            <div className="space-y-3">
              {paramDefs.map((pd) => {
                const value = parameters[pd.key] ?? pd.defaultValue;
                return (
                  <div key={pd.key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-gray-400">{pd.label}</span>
                      <span className="text-[10px] text-emerald-400 font-mono">{value}{pd.unit || ''}</span>
                    </div>
                    <input
                      type="range"
                      min={pd.min}
                      max={pd.max}
                      step={pd.step}
                      value={value}
                      onChange={(e) => {
                        setParameter(pd.key, Number(e.target.value));
                        // Update matching layer params and recalculate
                        const { layers } = useDataLabStore.getState();
                        const updated = layers.map((l) => {
                          if (l.source !== pd.layerSource) return l;
                          // Map param key to layer param key
                          const paramKey = pd.key.includes('rsi') ? 'period' : 'window';
                          return { ...l, params: { ...(l.params || {}), [paramKey]: Number(e.target.value) } };
                        });
                        useDataLabStore.setState({ layers: updated });
                        recalculateLayers();
                      }}
                      className="w-full h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Toggles */}
        <section className="space-y-2">
          <button
            type="button"
            onClick={toggleNormalize}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition ${
              normalizeMode
                ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
            }`}
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Normalize (Base 100)
          </button>

          <button
            type="button"
            onClick={toggleTable}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition ${
              showTable
                ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
            }`}
          >
            <Table2 className="w-3.5 h-3.5" />
            Data Table
          </button>

          <button
            type="button"
            onClick={() => resetEdits()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset All Edits
          </button>
        </section>
      </div>
    </div>
  );
}
