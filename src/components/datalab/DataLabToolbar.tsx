'use client';

import { useState, useRef, type ReactNode } from 'react';
import {
  Target, Brain, Gauge, RefreshCw, Layers,
  Trash2, Plus, Camera, FlaskConical,
  RotateCcw, Table2, Maximize2, Undo2,
} from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { OVERLAY_PRESETS } from '@/lib/datalab/presets';
import { DATA_SOURCE_OPTIONS } from '@/lib/datalab/types';
import type { ParameterDef } from '@/lib/datalab/types';

// ─── Dark-theme hover tooltip ──────────────────────────────────────
function Tip({ children, text, position = 'bottom' }: {
  children: ReactNode;
  text: string;
  position?: 'top' | 'bottom';
}) {
  const [show, setShow] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => { timer.current = setTimeout(() => setShow(true), 200); }}
      onMouseLeave={() => { if (timer.current) clearTimeout(timer.current); setShow(false); }}
    >
      {children}
      {show && text && (
        <span className={`absolute z-[100] ${
          position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        } left-1/2 -translate-x-1/2 px-3 py-2 text-[11px] leading-relaxed text-gray-200 bg-gray-900 border border-white/[0.1] rounded-lg shadow-xl max-w-xs whitespace-normal pointer-events-none`}>
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Icon map ──────────────────────────────────────────────────────
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  Target, Brain, Gauge, RefreshCw, Layers,
};

// ─── Preset tooltip text ───────────────────────────────────────────
const PRESET_META: Record<string, { short: string; tip: string }> = {
  'confluence-zones': {
    short: 'Confluence',
    tip: 'Confluence Zones: RSI oversold + price at MA support + volume spike = high-probability entry.\nLoads: Candlestick, SMA 20/50/200, RSI, Volume',
  },
  'smart-money': {
    short: 'Smart Money',
    tip: 'Smart Money Tracker: Exchange outflows + flat price = smart money accumulation signal.\nLoads: Price, SMA 7, Volume',
  },
  'derivatives-pressure': {
    short: 'Derivatives',
    tip: 'Derivatives Pressure: Extreme funding rate + high open interest = liquidation cascade risk.\nLoads: Price, SMA, Funding Rate, Volume',
  },
  'market-rotation': {
    short: 'Rotation',
    tip: 'Market Rotation: BTC dominance drop + greed rising = altseason entry signal.\nLoads: BTC Price, Dominance %, Fear & Greed',
  },
  'defi-value': {
    short: 'DeFi Value',
    tip: 'DeFi Value Play: DeFi TVL growing faster than ETH price = undervalued ecosystem.\nLoads: ETH Price, SMA, DeFi TVL, Volume',
  },
};

// ─── Data source tooltips ──────────────────────────────────────────
const SOURCE_TIPS: Record<string, string> = {
  price: 'Closing price line chart from OHLC data',
  volume: 'Total trading volume in USD',
  ohlc: 'Candlestick chart — Open / High / Low / Close',
  sma: 'Simple Moving Average — smooths price over N periods',
  ema: 'Exponential Moving Average — weighted toward recent prices',
  rsi: 'Relative Strength Index — momentum oscillator (0-100). <30 oversold, >70 overbought',
  fear_greed: 'Fear & Greed Index — market sentiment from Alternative.me (0-100)',
  btc_dominance: 'BTC market cap as % of total crypto market (current snapshot)',
  funding_rate: 'Perpetual futures funding rate across exchanges (current snapshot)',
  defi_tvl: 'Total Value Locked across all DeFi protocols (DeFiLlama)',
};

// ─── Parameter tooltips ────────────────────────────────────────────
const PARAM_TIPS: Record<string, string> = {
  sma_short: 'Short-term moving average window — averages the last N prices',
  sma_mid: 'Mid-term moving average window — averages the last N prices',
  sma_long: 'Long-term moving average window — averages the last N prices',
  sma_window: 'Moving average window — averages the last N closing prices to smooth trends',
  rsi_period: 'RSI period — measures momentum; <30 = oversold, >70 = overbought',
};

// ─── Time range options ────────────────────────────────────────────
const TIME_RANGES = [
  { label: '7d', value: 7 },
  { label: '30d', value: 30 },
  { label: '90d', value: 90 },
  { label: '1y', value: 365 },
  { label: '2y', value: 730 },
];

// ─── Main Component ────────────────────────────────────────────────
interface DataLabToolbarProps {
  onScreenshot?: () => void;
}

export function DataLabToolbar({ onScreenshot }: DataLabToolbarProps) {
  const {
    coin, days, activePreset, layers, parameters, normalizeMode, showTable,
    editHistory,
    setCoin, setDays, loadPreset, loadData, recalculateLayers,
    toggleLayer, removeLayer, addLayer, setParameter,
    toggleNormalize, toggleTable, resetEdits, resetParameters, undoLastEdit,
  } = useDataLabStore();

  const [showAddLayer, setShowAddLayer] = useState(false);
  const [coinInput, setCoinInput] = useState(coin);

  // Collect parameter defs from the active preset
  const preset = activePreset
    ? OVERLAY_PRESETS.find((p) => p.id === activePreset)
    : null;
  const paramDefs: ParameterDef[] = preset?.parameterDefs ?? [];

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

  const handleParamChange = (pd: ParameterDef, delta: number) => {
    const current = parameters[pd.key] ?? pd.defaultValue;
    const newVal = Math.max(pd.min, Math.min(pd.max, current + delta * pd.step));
    setParameter(pd.key, newVal);
    // Update matching layer params and recalculate
    const { layers: currentLayers } = useDataLabStore.getState();
    const updated = currentLayers.map((l) => {
      if (l.source !== pd.layerSource) return l;
      const paramKey = pd.key.includes('rsi') ? 'period' : 'window';
      return { ...l, params: { ...(l.params || {}), [paramKey]: newVal } };
    });
    useDataLabStore.setState({ layers: updated });
    recalculateLayers();
  };

  const chipActive = 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30';
  const chipInactive = 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08] hover:text-white';

  return (
    <div className="border-b border-white/[0.06] bg-white/[0.02]">
      {/* ── Row 1: Title + Presets + Coin + Time + Screenshot ────── */}
      <div className="px-4 py-2 flex items-center gap-2 flex-wrap max-w-[1800px] mx-auto">
        {/* Brand */}
        <div className="flex items-center gap-2 mr-1">
          <FlaskConical className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-white">DataLab</span>
        </div>

        <div className="w-px h-5 bg-white/[0.08]" />

        {/* Preset Chips */}
        <div className="flex items-center gap-1">
          {OVERLAY_PRESETS.map((p) => {
            const Icon = ICON_MAP[p.icon];
            const isActive = activePreset === p.id;
            const meta = PRESET_META[p.id];
            return (
              <Tip key={p.id} text={meta?.tip ?? p.description}>
                <button
                  type="button"
                  onClick={() => loadPreset(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                    isActive ? chipActive : chipInactive
                  }`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {meta?.short ?? p.name}
                </button>
              </Tip>
            );
          })}
        </div>

        <div className="w-px h-5 bg-white/[0.08]" />

        {/* Coin Input */}
        <Tip text="Enter a CoinGecko coin ID (e.g. bitcoin, ethereum, solana). Press Enter to reload.">
          <input
            type="text"
            value={coinInput}
            onChange={(e) => setCoinInput(e.target.value)}
            onBlur={handleCoinChange}
            onKeyDown={(e) => e.key === 'Enter' && handleCoinChange()}
            className="w-28 bg-white/[0.04] border border-white/[0.1] text-white text-xs px-2.5 py-1 rounded-lg focus:outline-none focus:border-emerald-400/40"
            placeholder="coin id..."
          />
        </Tip>

        {/* Time Range Chips */}
        <Tip text="Select the time range for historical data">
          <div className="flex gap-0.5">
            {TIME_RANGES.map((tr) => (
              <button
                key={tr.value}
                type="button"
                onClick={() => handleDaysChange(tr.value)}
                className={`px-2 py-1 text-[10px] font-medium rounded-md transition ${
                  days === tr.value ? chipActive : chipInactive
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>
        </Tip>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Screenshot */}
        {onScreenshot && (
          <Tip text="Download the current chart as a PNG image">
            <button
              type="button"
              onClick={onScreenshot}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs text-gray-400 hover:text-white hover:bg-white/[0.08] transition"
            >
              <Camera className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Screenshot</span>
            </button>
          </Tip>
        )}
      </div>

      {/* ── Row 2: Layers + Params + Toggles ─────────────────────── */}
      <div className="px-4 py-1.5 flex items-center gap-2 flex-wrap border-t border-white/[0.04] max-w-[1800px] mx-auto">
        {/* Layer Chips */}
        <div className="flex items-center gap-1 flex-wrap">
          {layers.map((layer) => (
            <Tip key={layer.id} text={`${layer.label} — ${layer.chartType} on ${layer.yAxis} axis. Click to toggle visibility.`}>
              <button
                type="button"
                onClick={() => toggleLayer(layer.id)}
                className={`group flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium transition border ${
                  layer.visible
                    ? 'bg-white/[0.04] text-gray-300 border-white/[0.06] hover:border-white/[0.12]'
                    : 'bg-white/[0.02] text-gray-600 border-white/[0.04] line-through'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: layer.visible ? layer.color : '#555' }} />
                <span className="truncate max-w-[72px]">{layer.label}</span>
                <Trash2
                  className="w-2.5 h-2.5 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ml-0.5"
                  onClick={(e) => { e.stopPropagation(); removeLayer(layer.id); }}
                />
              </button>
            </Tip>
          ))}

          {/* Add Layer */}
          <div className="relative">
            <Tip text="Add a new data layer to the chart">
              <button
                type="button"
                onClick={() => setShowAddLayer(!showAddLayer)}
                className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium text-emerald-400 bg-emerald-400/10 border border-emerald-400/20 hover:bg-emerald-400/20 transition"
              >
                <Plus className="w-3 h-3" />
                Add
              </button>
            </Tip>

            {showAddLayer && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-gray-900 border border-white/[0.1] rounded-lg p-1.5 shadow-xl min-w-[220px]">
                {DATA_SOURCE_OPTIONS.map((opt) => {
                  const alreadyAdded = layers.some((l) => l.source === opt.source && l.chartType === opt.chartType);
                  return (
                    <Tip key={`${opt.source}-${opt.chartType}`} text={SOURCE_TIPS[opt.source] ?? ''} position="top">
                      <button
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
                        className={`w-full text-left px-2 py-1 text-[10px] rounded transition flex items-center gap-1.5 ${
                          alreadyAdded
                            ? 'text-gray-600 cursor-not-allowed'
                            : 'text-gray-400 hover:bg-white/[0.06] hover:text-white'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: opt.color }} />
                        {opt.label}
                      </button>
                    </Tip>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Divider (only show if we have params or always for toggles) */}
        <div className="w-px h-4 bg-white/[0.08]" />

        {/* Compact Param Controls */}
        {paramDefs.length > 0 && (
          <>
            <div className="flex items-center gap-2">
              {paramDefs.map((pd) => {
                const value = parameters[pd.key] ?? pd.defaultValue;
                return (
                  <Tip key={pd.key} text={PARAM_TIPS[pd.key] ?? pd.label}>
                    <div className="flex items-center gap-0.5 text-[10px]">
                      <span className="text-gray-500">{pd.label}:</span>
                      <button
                        type="button"
                        title={`Decrease ${pd.label}`}
                        onClick={() => handleParamChange(pd, -1)}
                        className="text-gray-500 hover:text-white transition px-1 py-0.5 rounded hover:bg-white/[0.06]"
                      >
                        -
                      </button>
                      <span className="text-emerald-400 font-mono w-7 text-center">{value}</span>
                      <button
                        type="button"
                        title={`Increase ${pd.label}`}
                        onClick={() => handleParamChange(pd, 1)}
                        className="text-gray-500 hover:text-white transition px-1 py-0.5 rounded hover:bg-white/[0.06]"
                      >
                        +
                      </button>
                    </div>
                  </Tip>
                );
              })}
              <Tip text="Reset all parameters to defaults">
                <button
                  type="button"
                  onClick={() => { resetParameters(); recalculateLayers(); }}
                  className="text-gray-600 hover:text-gray-400 transition p-0.5"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </Tip>
            </div>
            <div className="w-px h-4 bg-white/[0.08]" />
          </>
        )}

        {/* Toggle Buttons (icon-only) */}
        <div className="flex items-center gap-1">
          <Tip text="Rebase all series to 100 at start for easy visual comparison">
            <button
              type="button"
              title="Normalize (Base 100)"
              onClick={toggleNormalize}
              className={`p-1.5 rounded-lg transition ${
                normalizeMode ? chipActive : chipInactive
              }`}
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </Tip>

          <Tip text="Show/hide the editable data table panel">
            <button
              type="button"
              title="Data Table"
              onClick={toggleTable}
              className={`p-1.5 rounded-lg transition ${
                showTable ? chipActive : chipInactive
              }`}
            >
              <Table2 className="w-3.5 h-3.5" />
            </button>
          </Tip>

          <Tip text="Revert all edited data points back to original values">
            <button
              type="button"
              title="Reset All Edits"
              onClick={() => resetEdits()}
              className={`p-1.5 rounded-lg transition ${chipInactive}`}
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </Tip>

          <Tip text="Undo the last data edit">
            <button
              type="button"
              title="Undo"
              onClick={undoLastEdit}
              disabled={editHistory.length === 0}
              className={`p-1.5 rounded-lg transition ${chipInactive} disabled:opacity-30`}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </button>
          </Tip>
        </div>
      </div>
    </div>
  );
}
