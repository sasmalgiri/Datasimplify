'use client';

import { useMemo, useState, useCallback, useRef } from 'react';
import {
  X, FlaskConical, Eye, EyeOff, Trash2, Plus,
  Maximize2, Table2, RotateCcw, Undo2, ChevronDown, TrendingUp,
} from 'lucide-react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, DataZoomComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';
import {
  useExperimentStore,
  nextSeriesColor,
  resetColorIndex,
  type ExperimentSeries,
} from '@/lib/live-dashboard/experimentStore';
import {
  computeSMA, computeEMA, computeRSI,
  normalizeToBase100, applyEdits,
} from '@/lib/datalab/calculations';

echarts.use([
  LineChart, BarChart,
  GridComponent, TooltipComponent, DataZoomComponent,
  LegendComponent, CanvasRenderer,
]);

// ─── Available Data Source Definitions ───

interface AvailableSource {
  key: string;
  label: string;
  chartType: 'line' | 'bar' | 'area';
  yAxisSide: 'left' | 'right';
  category: 'data' | 'calculated';
}

const DATA_SOURCES: AvailableSource[] = [
  { key: 'ohlc_close', label: 'Price (Close)', chartType: 'line', yAxisSide: 'left', category: 'data' },
  { key: 'ohlc_volume', label: 'Volume', chartType: 'bar', yAxisSide: 'right', category: 'data' },
  { key: 'ohlc_high', label: 'Price (High)', chartType: 'line', yAxisSide: 'left', category: 'data' },
  { key: 'ohlc_low', label: 'Price (Low)', chartType: 'line', yAxisSide: 'left', category: 'data' },
  { key: 'fear_greed', label: 'Fear & Greed', chartType: 'area', yAxisSide: 'right', category: 'data' },
  { key: 'btc_dominance', label: 'BTC Dominance', chartType: 'line', yAxisSide: 'right', category: 'data' },
  { key: 'sma', label: 'SMA', chartType: 'line', yAxisSide: 'left', category: 'calculated' },
  { key: 'ema', label: 'EMA', chartType: 'line', yAxisSide: 'left', category: 'calculated' },
  { key: 'rsi', label: 'RSI', chartType: 'line', yAxisSide: 'right', category: 'calculated' },
];

// ─── Data Extraction ───

function extractTimeSeries(
  dashboardData: ReturnType<typeof useLiveDashboardStore.getState>['data'],
  sourceKey: string,
  params: { smaWindow: number; emaWindow: number; rsiPeriod: number },
): { timestamps: number[]; data: number[] } | null {
  // Find first available OHLC data
  const ohlcKeys = Object.keys(dashboardData.ohlc);
  const primaryCoin = ohlcKeys[0];
  const ohlc = primaryCoin ? dashboardData.ohlc[primaryCoin] : null;

  switch (sourceKey) {
    case 'ohlc_close': {
      if (!ohlc || ohlc.length === 0) return null;
      return {
        timestamps: ohlc.map((d) => d[0]),
        data: ohlc.map((d) => d[4]), // close
      };
    }
    case 'ohlc_volume': {
      // OHLC doesn't always have volume; use market data if available
      if (!ohlc || ohlc.length === 0) return null;
      // OHLC format: [timestamp, open, high, low, close] — no volume in CoinGecko OHLC
      // Use close * random factor as proxy, or return null
      return null;
    }
    case 'ohlc_high': {
      if (!ohlc || ohlc.length === 0) return null;
      return {
        timestamps: ohlc.map((d) => d[0]),
        data: ohlc.map((d) => d[2]), // high
      };
    }
    case 'ohlc_low': {
      if (!ohlc || ohlc.length === 0) return null;
      return {
        timestamps: ohlc.map((d) => d[0]),
        data: ohlc.map((d) => d[3]), // low
      };
    }
    case 'fear_greed': {
      if (!dashboardData.fearGreed || dashboardData.fearGreed.length === 0) return null;
      const fg = [...dashboardData.fearGreed].reverse(); // oldest first
      return {
        timestamps: fg.map((d) => Number(d.timestamp) * 1000),
        data: fg.map((d) => Number(d.value)),
      };
    }
    case 'btc_dominance': {
      if (!dashboardData.global) return null;
      const btcDom = dashboardData.global.market_cap_percentage?.btc;
      if (btcDom == null || !ohlc) return null;
      // Project as flat line across OHLC timestamps
      return {
        timestamps: ohlc.map((d) => d[0]),
        data: ohlc.map(() => btcDom),
      };
    }
    case 'sma': {
      if (!ohlc || ohlc.length === 0) return null;
      const closes = ohlc.map((d) => d[4]);
      const sma = computeSMA(closes, params.smaWindow);
      return {
        timestamps: ohlc.map((d) => d[0]),
        data: sma.map((v) => v ?? 0),
      };
    }
    case 'ema': {
      if (!ohlc || ohlc.length === 0) return null;
      const closes = ohlc.map((d) => d[4]);
      const ema = computeEMA(closes, params.emaWindow);
      return {
        timestamps: ohlc.map((d) => d[0]),
        data: ema.map((v) => v ?? 0),
      };
    }
    case 'rsi': {
      if (!ohlc || ohlc.length === 0) return null;
      const closes = ohlc.map((d) => d[4]);
      const rsi = computeRSI(closes, params.rsiPeriod);
      return {
        timestamps: ohlc.map((d) => d[0]),
        data: rsi.map((v) => v ?? 0),
      };
    }
    default:
      return null;
  }
}

// Also extract sparkline series for top market coins
function extractSparklineSeries(
  dashboardData: ReturnType<typeof useLiveDashboardStore.getState>['data'],
): { key: string; label: string; timestamps: number[]; data: number[] }[] {
  if (!dashboardData.markets) return [];
  const result: { key: string; label: string; timestamps: number[]; data: number[] }[] = [];
  const topCoins = dashboardData.markets.slice(0, 10);
  for (const coin of topCoins) {
    if (coin.sparkline_in_7d?.price && coin.sparkline_in_7d.price.length > 0) {
      const prices = coin.sparkline_in_7d.price;
      const now = Date.now();
      const step = (7 * 24 * 60 * 60 * 1000) / prices.length;
      result.push({
        key: `sparkline:${coin.id}`,
        label: `${coin.symbol.toUpperCase()} 7d`,
        timestamps: prices.map((_, i) => now - (prices.length - 1 - i) * step),
        data: prices,
      });
    }
  }
  return result;
}

// ─── Chart Builder ───

function buildExperimentOption(
  series: ExperimentSeries[],
  editedCells: Record<string, Record<number, number>>,
  normalizeMode: boolean,
  isDark: boolean,
): any {
  const visible = series.filter((s) => s.visible);
  if (visible.length === 0) return null;

  // Use timestamps from the first series
  const baseSeries = visible[0];
  const xData = baseSeries.timestamps.map((t) => {
    const d = new Date(t);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  });

  const hasLeft = visible.some((s) => s.yAxisSide === 'left');
  const hasRight = visible.some((s) => s.yAxisSide === 'right');

  const yAxis: any[] = [];
  if (hasLeft) {
    yAxis.push({
      type: 'value',
      position: 'left',
      splitLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)' } },
      axisLabel: { color: isDark ? '#9ca3af' : '#64748b', fontSize: 10 },
    });
  }
  if (hasRight) {
    yAxis.push({
      type: 'value',
      position: 'right',
      splitLine: { show: false },
      axisLabel: { color: isDark ? '#9ca3af' : '#64748b', fontSize: 10 },
    });
  }

  const chartSeries = visible.map((s) => {
    let data = applyEdits(s.data, editedCells[s.id] || {});
    if (normalizeMode) data = normalizeToBase100(data);

    const yAxisIndex = s.yAxisSide === 'right' && hasLeft ? 1 : 0;
    const isArea = s.chartType === 'area';
    const isBar = s.chartType === 'bar';

    return {
      name: s.label,
      type: isBar ? 'bar' : 'line',
      yAxisIndex,
      data,
      smooth: true,
      symbol: 'none',
      lineStyle: isBar ? undefined : { color: s.color, width: 2 },
      itemStyle: { color: s.color },
      areaStyle: isArea
        ? {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: s.color + '40' },
              { offset: 1, color: s.color + '05' },
            ]),
          }
        : undefined,
      barWidth: isBar ? '60%' : undefined,
      opacity: isBar ? 0.6 : 1,
    };
  });

  return {
    backgroundColor: 'transparent',
    grid: { left: 60, right: hasRight ? 60 : 20, top: 40, bottom: 60 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: isDark ? 'rgba(15,15,25,0.95)' : 'rgba(255,255,255,0.95)',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      textStyle: { color: isDark ? '#e5e7eb' : '#334155', fontSize: 11 },
    },
    legend: {
      show: visible.length > 1,
      top: 8,
      textStyle: { color: isDark ? '#9ca3af' : '#64748b', fontSize: 10 },
    },
    xAxis: {
      type: 'category',
      data: xData,
      axisLabel: { color: isDark ? '#6b7280' : '#94a3b8', fontSize: 9 },
      axisLine: { lineStyle: { color: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)' } },
    },
    yAxis,
    series: chartSeries,
    dataZoom: [
      { type: 'inside', start: 0, end: 100 },
      {
        type: 'slider',
        height: 20,
        bottom: 8,
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.1)',
        backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
        textStyle: { color: isDark ? '#6b7280' : '#94a3b8', fontSize: 9 },
      },
    ],
  };
}

// ─── Main Panel Component ───

interface ExperimentPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROWS_PER_PAGE = 40;

export function ExperimentPanel({ isOpen, onClose }: ExperimentPanelProps) {
  const dashboardData = useLiveDashboardStore((s) => s.data);
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = getSiteThemeClasses(siteTheme);
  const isDark = siteTheme === 'dark';

  const {
    series, editedCells, editHistory, normalizeMode, showTable,
    smaWindow, emaWindow, rsiPeriod,
    addSeries, removeSeries, toggleSeries, clearSeries,
    editCell, undoLastEdit, resetEdits,
    setSmaWindow, setEmaWindow, setRsiPeriod,
    toggleNormalize, toggleTable,
  } = useExperimentStore();

  const [showAddMenu, setShowAddMenu] = useState(false);
  const [visibleRows, setVisibleRows] = useState(ROWS_PER_PAGE);
  const editingRef = useRef<{ seriesId: string; index: number } | null>(null);

  // Determine which sources are available based on current dashboard data
  const availableSources = useMemo(() => {
    const sources: (AvailableSource & { available: boolean })[] = DATA_SOURCES.map((src) => {
      const extracted = extractTimeSeries(dashboardData, src.key, { smaWindow, emaWindow, rsiPeriod });
      return { ...src, available: extracted !== null };
    });
    return sources;
  }, [dashboardData, smaWindow, emaWindow, rsiPeriod]);

  // Sparkline sources
  const sparklineSources = useMemo(() => extractSparklineSeries(dashboardData), [dashboardData]);

  // Check if a series with given sourceKey already exists
  const hasSource = useCallback(
    (key: string) => series.some((s) => s.sourceKey === key),
    [series],
  );

  // Add a data source as a series
  const handleAddSource = useCallback(
    (src: AvailableSource) => {
      const extracted = extractTimeSeries(dashboardData, src.key, { smaWindow, emaWindow, rsiPeriod });
      if (!extracted) return;
      const label = src.key === 'sma' ? `SMA(${smaWindow})`
        : src.key === 'ema' ? `EMA(${emaWindow})`
        : src.key === 'rsi' ? `RSI(${rsiPeriod})`
        : src.label;
      addSeries({
        label,
        sourceKey: src.key,
        color: nextSeriesColor(),
        chartType: src.chartType,
        yAxisSide: src.yAxisSide,
        visible: true,
        data: extracted.data,
        timestamps: extracted.timestamps,
      });
      setShowAddMenu(false);
    },
    [dashboardData, smaWindow, emaWindow, rsiPeriod, addSeries],
  );

  // Add sparkline series
  const handleAddSparkline = useCallback(
    (spark: { key: string; label: string; timestamps: number[]; data: number[] }) => {
      addSeries({
        label: spark.label,
        sourceKey: spark.key,
        color: nextSeriesColor(),
        chartType: 'line',
        yAxisSide: 'left',
        visible: true,
        data: spark.data,
        timestamps: spark.timestamps,
      });
      setShowAddMenu(false);
    },
    [addSeries],
  );

  // Recalculate calculated series when parameters change
  const handleParamChange = useCallback(
    (param: 'sma' | 'ema' | 'rsi', value: number) => {
      if (param === 'sma') setSmaWindow(value);
      if (param === 'ema') setEmaWindow(value);
      if (param === 'rsi') setRsiPeriod(value);

      // Update existing series data
      const ohlcKeys = Object.keys(dashboardData.ohlc);
      const primaryCoin = ohlcKeys[0];
      const ohlc = primaryCoin ? dashboardData.ohlc[primaryCoin] : null;
      if (!ohlc) return;

      const closes = ohlc.map((d) => d[4]);
      const timestamps = ohlc.map((d) => d[0]);

      const updated = series.map((s) => {
        if (s.sourceKey === param) {
          let newData: number[];
          let newLabel: string;
          if (param === 'sma') {
            newData = computeSMA(closes, value).map((v) => v ?? 0);
            newLabel = `SMA(${value})`;
          } else if (param === 'ema') {
            newData = computeEMA(closes, value).map((v) => v ?? 0);
            newLabel = `EMA(${value})`;
          } else {
            newData = computeRSI(closes, value).map((v) => v ?? 0);
            newLabel = `RSI(${value})`;
          }
          return { ...s, data: newData, timestamps, label: newLabel };
        }
        return s;
      });
      useExperimentStore.setState({ series: updated });
    },
    [dashboardData, series, setSmaWindow, setEmaWindow, setRsiPeriod],
  );

  // Build chart option
  const option = useMemo(() => {
    if (series.length === 0) return null;
    return buildExperimentOption(series, editedCells, normalizeMode, isDark);
  }, [series, editedCells, normalizeMode, isDark]);

  // Table cell handlers
  const handleCellBlur = useCallback(
    (seriesId: string, index: number, el: HTMLTableCellElement) => {
      const text = el.textContent?.trim() ?? '';
      const num = parseFloat(text);
      if (isNaN(num)) {
        const s = series.find((s) => s.id === seriesId);
        el.textContent = s?.data[index]?.toFixed(2) ?? '';
        return;
      }
      editCell(seriesId, index, num);
      editingRef.current = null;
    },
    [editCell, series],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableCellElement>, seriesId: string, index: number) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCellBlur(seriesId, index, e.currentTarget);
        e.currentTarget.blur();
      }
      if (e.key === 'Escape') {
        const s = series.find((s) => s.id === seriesId);
        e.currentTarget.textContent = s?.data[index]?.toFixed(2) ?? '';
        e.currentTarget.blur();
      }
    },
    [handleCellBlur, series],
  );

  const formatValue = (v: number | null): string => {
    if (v == null) return '—';
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return v.toFixed(0);
    if (v >= 1) return v.toFixed(2);
    return v.toFixed(4);
  };

  if (!isOpen) return null;

  const visibleSeries = series.filter((s) => s.visible);
  // Use timestamps from first series
  const timestamps = series.length > 0 ? series[0].timestamps : [];

  return (
    <div className={`${st.panelBg} rounded-2xl overflow-hidden`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${st.divider}`}>
        <div className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4 text-emerald-400" />
          <h3 className={`text-sm font-bold ${st.textPrimary}`}>Experiment Lab</h3>
          <span className={`text-[10px] ${st.textDim}`}>
            {series.length} series &middot; {editHistory.length} edits
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={toggleNormalize}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition ${
              normalizeMode ? st.chipActive : st.chipInactive
            }`}
            title="Normalize to base 100"
          >
            <Maximize2 className="w-3 h-3" />
            Normalize
          </button>
          <button
            type="button"
            onClick={toggleTable}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition ${
              showTable ? st.chipActive : st.chipInactive
            }`}
            title="Show data table"
          >
            <Table2 className="w-3 h-3" />
            Table
          </button>
          <button
            type="button"
            onClick={() => resetEdits()}
            disabled={editHistory.length === 0}
            className={`p-1 ${st.textDim} hover:${st.textPrimary} disabled:opacity-30 transition`}
            title="Reset all edits"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={clearSeries}
            disabled={series.length === 0}
            className={`p-1 ${st.textDim} hover:text-red-400 disabled:opacity-30 transition`}
            title="Clear all series"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`p-1 ${st.textDim} hover:${st.textPrimary} transition`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body: Sidebar + Chart + Table */}
      <div className="flex" style={{ minHeight: 420 }}>
        {/* Left: Series Manager + Parameters */}
        <div className={`w-56 flex-shrink-0 border-r ${st.divider} overflow-y-auto p-3 space-y-4`}>
          {/* Add Series */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className={`text-[10px] uppercase tracking-widest ${st.textDim} font-medium`}>
                Series ({series.length})
              </span>
              <button
                type="button"
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="text-emerald-400 hover:text-emerald-300 transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add Menu */}
            {showAddMenu && (
              <div className={`mb-2 ${st.subtleBg} border ${st.subtleBorder} rounded-lg p-2 space-y-0.5 max-h-64 overflow-y-auto`}>
                <p className={`text-[9px] uppercase ${st.textDim} font-semibold mb-1`}>Dashboard Data</p>
                {availableSources
                  .filter((s) => s.category === 'data' && s.available)
                  .map((src) => (
                    <button
                      key={src.key}
                      type="button"
                      disabled={hasSource(src.key)}
                      onClick={() => handleAddSource(src)}
                      className={`w-full text-left px-2 py-1 text-[10px] rounded transition ${
                        hasSource(src.key)
                          ? `${st.textFaint} cursor-not-allowed`
                          : `${st.textMuted} hover:${st.textPrimary} hover:bg-white/[0.06]`
                      }`}
                    >
                      {src.label}
                    </button>
                  ))}

                {sparklineSources.length > 0 && (
                  <>
                    <p className={`text-[9px] uppercase ${st.textDim} font-semibold mt-2 mb-1`}>Sparklines (7d)</p>
                    {sparklineSources.map((spark) => (
                      <button
                        key={spark.key}
                        type="button"
                        disabled={hasSource(spark.key)}
                        onClick={() => handleAddSparkline(spark)}
                        className={`w-full text-left px-2 py-1 text-[10px] rounded transition ${
                          hasSource(spark.key)
                            ? `${st.textFaint} cursor-not-allowed`
                            : `${st.textMuted} hover:${st.textPrimary} hover:bg-white/[0.06]`
                        }`}
                      >
                        {spark.label}
                      </button>
                    ))}
                  </>
                )}

                <p className={`text-[9px] uppercase ${st.textDim} font-semibold mt-2 mb-1`}>Calculated</p>
                {availableSources
                  .filter((s) => s.category === 'calculated' && s.available)
                  .map((src) => (
                    <button
                      key={src.key}
                      type="button"
                      disabled={hasSource(src.key)}
                      onClick={() => handleAddSource(src)}
                      className={`w-full text-left px-2 py-1 text-[10px] rounded transition ${
                        hasSource(src.key)
                          ? `${st.textFaint} cursor-not-allowed`
                          : `${st.textMuted} hover:${st.textPrimary} hover:bg-white/[0.06]`
                      }`}
                    >
                      {src.label}
                    </button>
                  ))}
              </div>
            )}

            {/* Series List */}
            <div className="space-y-1">
              {series.map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center gap-1.5 px-2 py-1.5 ${st.subtleBg} border ${st.subtleBorder} rounded-lg`}
                >
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: s.color }}
                  />
                  <span
                    className={`flex-1 text-[10px] truncate ${
                      s.visible ? st.textSecondary : `${st.textFaint} line-through`
                    }`}
                  >
                    {s.label}
                  </span>
                  <button
                    type="button"
                    onClick={() => toggleSeries(s.id)}
                    className={`${st.textDim} hover:${st.textPrimary} transition`}
                  >
                    {s.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSeries(s.id)}
                    className={`${st.textFaint} hover:text-red-400 transition`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
              {series.length === 0 && (
                <p className={`text-[10px] ${st.textFaint} text-center py-4`}>
                  Click + to add data series
                </p>
              )}
            </div>
          </div>

          {/* Parameters */}
          {(hasSource('sma') || hasSource('ema') || hasSource('rsi')) && (
            <div>
              <span className={`text-[10px] uppercase tracking-widest ${st.textDim} font-medium`}>
                Parameters
              </span>
              <div className="space-y-3 mt-2">
                {hasSource('sma') && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] ${st.textMuted}`}>SMA Window</span>
                      <span className="text-[10px] text-emerald-400 font-mono">{smaWindow}</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={200}
                      step={1}
                      value={smaWindow}
                      onChange={(e) => handleParamChange('sma', Number(e.target.value))}
                      className="w-full h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                )}
                {hasSource('ema') && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] ${st.textMuted}`}>EMA Window</span>
                      <span className="text-[10px] text-emerald-400 font-mono">{emaWindow}</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={200}
                      step={1}
                      value={emaWindow}
                      onChange={(e) => handleParamChange('ema', Number(e.target.value))}
                      className="w-full h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                )}
                {hasSource('rsi') && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] ${st.textMuted}`}>RSI Period</span>
                      <span className="text-[10px] text-emerald-400 font-mono">{rsiPeriod}</span>
                    </div>
                    <input
                      type="range"
                      min={5}
                      max={50}
                      step={1}
                      value={rsiPeriod}
                      onChange={(e) => handleParamChange('rsi', Number(e.target.value))}
                      className="w-full h-1 bg-white/[0.1] rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Center: Chart Canvas */}
        <div className="flex-1 min-h-0">
          {option ? (
            <ReactEChartsCore
              echarts={echarts}
              option={option}
              style={{ height: '100%', width: '100%', minHeight: 380 }}
              notMerge
              lazyUpdate
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center max-w-xs">
                <TrendingUp className={`w-10 h-10 ${st.textFaint} mx-auto mb-3`} />
                <p className={`text-sm font-medium ${st.textMuted} mb-1`}>
                  Add series to begin
                </p>
                <p className={`text-[11px] ${st.textDim}`}>
                  Click the + button to add data from this dashboard, then overlay, edit, and experiment.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Data Table (optional) */}
        {showTable && series.length > 0 && (
          <div className={`w-80 flex-shrink-0 border-l ${st.divider} flex flex-col`}>
            {/* Table Header */}
            <div className={`flex items-center justify-between px-3 py-2 border-b ${st.divider}`}>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] uppercase tracking-widest ${st.textDim} font-medium`}>
                  Data
                </span>
                {editHistory.length > 0 && (
                  <span className="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                    {editHistory.length} edit{editHistory.length !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={undoLastEdit}
                  disabled={editHistory.length === 0}
                  className={`${st.textDim} hover:${st.textPrimary} disabled:opacity-30 transition p-1`}
                  title="Undo last edit"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => resetEdits()}
                  disabled={editHistory.length === 0}
                  className={`${st.textDim} hover:${st.textPrimary} disabled:opacity-30 transition p-1`}
                  title="Reset all edits"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 z-10">
                  <tr className={st.subtleBg}>
                    <th className={`text-left px-2 py-1.5 ${st.textDim} font-medium border-b ${st.divider}`}>
                      Date
                    </th>
                    {visibleSeries.map((s) => (
                      <th
                        key={s.id}
                        className={`text-right px-2 py-1.5 font-medium border-b ${st.divider}`}
                      >
                        <div className="flex items-center justify-end gap-1">
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          <span className={`${st.textMuted} truncate max-w-[60px]`}>{s.label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {timestamps.slice(0, visibleRows).map((ts, rowIndex) => {
                    const date = new Date(ts);
                    const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(2)}`;
                    return (
                      <tr key={ts} className={`border-b ${isDark ? 'border-white/[0.03] hover:bg-white/[0.03]' : 'border-blue-100/30 hover:bg-blue-50/30'}`}>
                        <td className={`px-2 py-1 ${st.textDim} whitespace-nowrap`}>{dateStr}</td>
                        {visibleSeries.map((s) => {
                          const isEdited = editedCells[s.id]?.[rowIndex] !== undefined;
                          const value = isEdited
                            ? editedCells[s.id][rowIndex]
                            : s.data[rowIndex];
                          return (
                            <td
                              key={s.id}
                              contentEditable
                              suppressContentEditableWarning
                              onBlur={(e) => handleCellBlur(s.id, rowIndex, e.currentTarget)}
                              onKeyDown={(e) => handleKeyDown(e, s.id, rowIndex)}
                              onFocus={() => { editingRef.current = { seriesId: s.id, index: rowIndex }; }}
                              className={`px-2 py-1 text-right font-mono whitespace-nowrap cursor-text focus:outline-none ${
                                isEdited
                                  ? 'bg-amber-400/10 text-amber-300'
                                  : st.textSecondary
                              } focus:bg-white/[0.06]`}
                            >
                              {formatValue(value ?? null)}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              {visibleRows < timestamps.length && (
                <button
                  type="button"
                  onClick={() => setVisibleRows((v) => v + ROWS_PER_PAGE)}
                  className={`w-full py-2 text-center text-[10px] ${st.textDim} hover:text-emerald-400 ${st.subtleBg} border-t ${st.divider} transition`}
                >
                  <ChevronDown className="w-3 h-3 inline mr-1" />
                  Load more ({timestamps.length - visibleRows} remaining)
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
