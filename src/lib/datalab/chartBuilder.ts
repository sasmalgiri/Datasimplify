// Builds a multi-axis ECharts option from DataLab store state

import type { OverlayLayer, ZoneRule } from './types';
import type { Drawing } from './drawingTypes';
import { computeFibLevels } from './drawingTypes';
import { normalizeToBase100, applyEdits } from './calculations';
import { ECHARTS_THEME, CHART_COLORS } from '@/lib/live-dashboard/theme';
import type { SiteTheme } from '@/lib/live-dashboard/store';
import { getEchartsTheme } from '@/lib/live-dashboard/theme';
import type { MarketRegime } from './regimeDetection';
import { REGIME_COLORS, REGIME_LABELS, segmentRegimes } from './regimeDetection';
import type { EventCategory, MarketEvent } from './eventMarkers';
import { getEventsInRange, findNearestIndex, EVENT_CATEGORY_COLORS } from './eventMarkers';

interface BuildOptions {
  layers: OverlayLayer[];
  timestamps: number[];
  ohlcRaw: number[][] | null;
  editedCells: Record<string, Record<number, number>>;
  normalizeMode: boolean;
  logScale?: boolean;
  vsCurrency?: string;
  zones?: ZoneRule[];
  drawings?: Drawing[];
  siteTheme?: SiteTheme;
  // New features
  regimes?: MarketRegime[];
  showRegimes?: boolean;
  showEvents?: boolean;
  eventCategories?: EventCategory[];
  customEvents?: MarketEvent[];
}

const CURRENCY_SYMBOLS: Record<string, string> = {
  usd: '$', eur: '€', gbp: '£', jpy: '¥', btc: '₿', eth: 'Ξ',
  aud: 'A$', cad: 'C$', chf: 'CHF', cny: '¥', inr: '₹', krw: '₩',
};

function fmtNum(v: number, currency?: string): string {
  const sym = currency ? (CURRENCY_SYMBOLS[currency] ?? '') : '';
  const abs = Math.abs(v);
  if (abs >= 1e12) return `${sym}${(v / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `${sym}${(v / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `${sym}${(v / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `${sym}${(v / 1e3).toFixed(1)}K`;
  if (abs >= 1) return `${sym}${v.toFixed(2)}`;
  if (abs >= 0.01) return `${sym}${v.toFixed(4)}`;
  return `${sym}${v.toFixed(6)}`;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function buildChartOption(opts: BuildOptions) {
  const {
    layers, timestamps, ohlcRaw, editedCells, normalizeMode,
    logScale = false, vsCurrency = 'usd', zones = [], drawings = [],
    siteTheme = 'dark', regimes = [], showRegimes = false,
    showEvents = false, eventCategories = [], customEvents = [],
  } = opts;
  const theme = getEchartsTheme(siteTheme);

  if (timestamps.length === 0 || layers.length === 0) return null;

  const dates = timestamps.map(formatDate);
  const visibleLayers = layers.filter((l) => l.visible);

  // Determine which grids we need
  const hasBottomGrid = visibleLayers.some((l) => l.gridIndex === 1);

  // Build grids
  const grids = hasBottomGrid
    ? [
        { left: '8%', right: '4%', top: '4%', bottom: '32%' },
        { left: '8%', right: '4%', top: '72%', bottom: '4%' },
      ]
    : [{ left: '8%', right: '4%', top: '4%', bottom: '8%' }];

  // Build xAxes (one per grid)
  const xAxes = grids.map((_, gi) => ({
    type: 'category' as const,
    data: dates,
    ...theme.xAxis,
    gridIndex: gi,
    axisLabel: gi === 0
      ? theme.xAxis.axisLabel
      : { ...theme.xAxis.axisLabel, show: gi === grids.length - 1 },
  }));

  // Build yAxes — we need one per unique (gridIndex, yAxisSide) combo
  const yAxisMap: Record<string, number> = {};
  const yAxes: any[] = [];

  for (const layer of visibleLayers) {
    const key = `${layer.gridIndex}-${layer.yAxis}`;
    if (!(key in yAxisMap)) {
      const idx = yAxes.length;
      yAxisMap[key] = idx;
      // Apply log scale only to price axes (gridIndex 0, left side)
      const isPriceAxis = layer.gridIndex === 0 && layer.yAxis === 'left';
      const axisType = logScale && isPriceAxis ? 'log' as const : 'value' as const;
      const sym = CURRENCY_SYMBOLS[vsCurrency] ?? '';

      yAxes.push({
        type: axisType,
        ...theme.yAxis,
        gridIndex: layer.gridIndex,
        position: layer.yAxis,
        scale: true,
        ...(axisType === 'log' ? { logBase: 10 } : {}),
        axisLabel: {
          ...theme.yAxis.axisLabel,
          formatter: (v: number) => {
            const prefix = isPriceAxis ? sym : '';
            if (Math.abs(v) >= 1e9) return `${prefix}${(v / 1e9).toFixed(1)}B`;
            if (Math.abs(v) >= 1e6) return `${prefix}${(v / 1e6).toFixed(1)}M`;
            if (Math.abs(v) >= 1e3) return `${prefix}${(v / 1e3).toFixed(1)}K`;
            if (Math.abs(v) < 1) return `${prefix}${v.toFixed(4)}`;
            return `${prefix}${v.toFixed(0)}`;
          },
        },
        splitLine: {
          lineStyle: { color: theme.yAxis.splitLine.lineStyle.color },
        },
        // Only show splitLine for left axes to avoid clutter
        ...(layer.yAxis === 'right' ? { splitLine: { show: false } } : {}),
      });
    }
  }

  // Build series
  const series: any[] = [];

  for (const layer of visibleLayers) {
    const yAxisKey = `${layer.gridIndex}-${layer.yAxis}`;
    const yAxisIndex = yAxisMap[yAxisKey];
    const xAxisIndex = layer.gridIndex;
    const edits = editedCells[layer.id] || {};

    if (layer.source === 'ohlc' && layer.chartType === 'candlestick' && ohlcRaw) {
      // Candlestick series: [open, close, low, high]
      const values = ohlcRaw.map((d, i) => {
        const open = i in edits ? edits[i] : d[1]; // Edit affects open
        return [open, d[4], d[3], d[2]];
      });
      series.push({
        name: layer.label,
        type: 'candlestick',
        data: values,
        xAxisIndex,
        yAxisIndex,
        itemStyle: {
          color: layer.color,
          color0: '#ef4444',
          borderColor: layer.color,
          borderColor0: '#ef4444',
        },
      });
    } else {
      // Regular series (line, bar, area, scatter)
      let data = applyEdits(layer.data, edits);

      if (normalizeMode && (layer.chartType === 'line' || layer.chartType === 'area')) {
        data = normalizeToBase100(data);
      }

      const seriesConfig: any = {
        name: layer.label,
        type: layer.chartType === 'area' ? 'line' : layer.chartType,
        data,
        xAxisIndex,
        yAxisIndex,
        itemStyle: { color: layer.color },
        lineStyle: { color: layer.color, width: 2 },
        showSymbol: layer.chartType === 'scatter',
        smooth: layer.chartType === 'line' || layer.chartType === 'area',
      };

      if (layer.chartType === 'area') {
        seriesConfig.areaStyle = {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: layer.color + '40' },
              { offset: 1, color: layer.color + '05' },
            ],
          },
        };
      }

      if (layer.chartType === 'bar') {
        seriesConfig.barMaxWidth = 8;
        seriesConfig.itemStyle = {
          color: (params: any) => {
            const val = params.data;
            if (val == null) return layer.color;
            return val >= 0 ? layer.color : '#ef4444';
          },
        };
      }

      // Bollinger Bands → dashed lines for visual distinction
      if (layer.source === 'bollinger_upper' || layer.source === 'bollinger_lower') {
        seriesConfig.lineStyle = { ...seriesConfig.lineStyle, type: 'dashed' };
      }

      // Drawdown area → always red gradient (negative values)
      if (layer.source === 'drawdown' && layer.chartType === 'area') {
        seriesConfig.areaStyle = {
          color: {
            type: 'linear',
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#ef444450' },
              { offset: 1, color: '#ef444408' },
            ],
          },
        };
        seriesConfig.lineStyle = { color: '#ef4444', width: 1.5 };
        seriesConfig.itemStyle = { color: '#ef4444' };
      }

      series.push(seriesConfig);
    }
  }

  // Snapshot data → dashed reference lines (BTC Dominance, Funding Rate)
  // These are current values only — no historical API available — rendered honestly
  for (const layer of visibleLayers) {
    if (layer.source === 'btc_dominance' || layer.source === 'funding_rate') {
      // Check if all values are identical (snapshot projected as flat line)
      const vals = layer.data.filter((v) => v != null) as number[];
      if (vals.length > 0 && vals.every((v) => v === vals[0])) {
        // Replace the solid line/bar with a dashed reference line
        const existing = series.find((s) => s.name === layer.label);
        if (existing) {
          existing.lineStyle = {
            color: layer.color,
            width: 2,
            type: 'dashed',
          };
          existing.symbol = 'none';
          // Override to line type for consistent rendering
          existing.type = 'line';
          delete existing.barMaxWidth;
          delete existing.areaStyle;
          // Add label showing the value
          const val = vals[0];
          const formatted = layer.source === 'funding_rate'
            ? `${val.toFixed(4)}%`
            : `${val.toFixed(1)}%`;
          existing.name = `${layer.label} ${formatted}`;
          existing.endLabel = {
            show: true,
            formatter: formatted,
            color: layer.color,
            fontSize: 10,
          };
        }
      }
    }
  }

  // RSI reference lines (30/70 overbought/oversold)
  const hasRsi = visibleLayers.some((l) => l.source === 'rsi');
  if (hasRsi) {
    const rsiLayer = visibleLayers.find((l) => l.source === 'rsi')!;
    const yAxisKey = `${rsiLayer.gridIndex}-${rsiLayer.yAxis}`;
    const rsiYAxisIndex = yAxisMap[yAxisKey];
    series.push({
      name: 'Overbought (70)',
      type: 'line',
      data: timestamps.map(() => 70),
      xAxisIndex: rsiLayer.gridIndex,
      yAxisIndex: rsiYAxisIndex,
      lineStyle: { color: '#ef444460', type: 'dashed', width: 1 },
      symbol: 'none',
      silent: true,
    });
    series.push({
      name: 'Oversold (30)',
      type: 'line',
      data: timestamps.map(() => 30),
      xAxisIndex: rsiLayer.gridIndex,
      yAxisIndex: rsiYAxisIndex,
      lineStyle: { color: '#34d39960', type: 'dashed', width: 1 },
      symbol: 'none',
      silent: true,
    });
  }

  // Stochastic reference lines (80/20 overbought/oversold)
  const hasStoch = visibleLayers.some((l) => l.source === 'stochastic_k' || l.source === 'stochastic_d');
  if (hasStoch) {
    const stochLayer = visibleLayers.find((l) => l.source === 'stochastic_k' || l.source === 'stochastic_d')!;
    const stochYKey = `${stochLayer.gridIndex}-${stochLayer.yAxis}`;
    const stochYAxisIndex = yAxisMap[stochYKey];
    series.push({
      name: 'Overbought (80)',
      type: 'line',
      data: timestamps.map(() => 80),
      xAxisIndex: stochLayer.gridIndex,
      yAxisIndex: stochYAxisIndex,
      lineStyle: { color: '#ef444460', type: 'dashed', width: 1 },
      symbol: 'none',
      silent: true,
    });
    series.push({
      name: 'Oversold (20)',
      type: 'line',
      data: timestamps.map(() => 20),
      xAxisIndex: stochLayer.gridIndex,
      yAxisIndex: stochYAxisIndex,
      lineStyle: { color: '#34d39960', type: 'dashed', width: 1 },
      symbol: 'none',
      silent: true,
    });
  }

  // Volume Ratio reference line at 1.0 (normal volume baseline)
  const hasVolRatio = visibleLayers.some((l) => l.source === 'volume_ratio');
  if (hasVolRatio) {
    const vrLayer = visibleLayers.find((l) => l.source === 'volume_ratio')!;
    const vrYKey = `${vrLayer.gridIndex}-${vrLayer.yAxis}`;
    const vrYAxisIndex = yAxisMap[vrYKey];
    series.push({
      name: 'Normal Volume (1x)',
      type: 'line',
      data: timestamps.map(() => 1),
      xAxisIndex: vrLayer.gridIndex,
      yAxisIndex: vrYAxisIndex,
      lineStyle: { color: '#ffffff40', type: 'dashed', width: 1 },
      symbol: 'none',
      silent: true,
    });
  }

  // Zone Shading (markArea on matching series)
  if (zones.length > 0) {
    for (const zone of zones) {
      // Find the layer that provides this zone's data source
      const sourceLayer = visibleLayers.find((l) => l.source === zone.source);
      if (!sourceLayer) continue;

      // Find the series for this layer
      const targetSeries = series.find((s) => s.name === sourceLayer.label);
      if (!targetSeries) continue;

      // Build contiguous ranges where condition is met
      const data = sourceLayer.data;
      const areas: any[] = [];
      let start: number | null = null;

      for (let i = 0; i < data.length; i++) {
        const v = data[i];
        const meets = v != null && (
          (zone.condition === 'below' && v < zone.threshold) ||
          (zone.condition === 'above' && v > zone.threshold)
        );
        if (meets && start === null) {
          start = i;
        } else if (!meets && start !== null) {
          areas.push([
            { xAxis: dates[start], name: zone.label || '' },
            { xAxis: dates[i - 1] },
          ]);
          start = null;
        }
      }
      if (start !== null) {
        areas.push([
          { xAxis: dates[start], name: zone.label || '' },
          { xAxis: dates[data.length - 1] },
        ]);
      }

      if (areas.length > 0) {
        if (!targetSeries.markArea) {
          targetSeries.markArea = { silent: true, data: [] };
        }
        for (const area of areas) {
          targetSeries.markArea.data.push(area);
        }
        targetSeries.markArea.itemStyle = {
          color: zone.color,
          opacity: zone.opacity,
        };
        targetSeries.markArea.label = {
          show: true,
          position: 'insideTop',
          color: zone.color,
          fontSize: 9,
          opacity: 0.7,
        };
      }
    }
  }

  // Drawing Tools → rendered as markLine on the price series
  if (drawings.length > 0) {
    // Find the price series (first series on gridIndex 0, left yAxis)
    const priceSeriesIdx = series.findIndex((s) => {
      const layer = visibleLayers.find((l) => l.label === s.name);
      return layer && layer.gridIndex === 0 && layer.yAxis === 'left';
    });
    const targetSeries = priceSeriesIdx >= 0 ? series[priceSeriesIdx] : series[0];

    if (targetSeries) {
      if (!targetSeries.markLine) {
        targetSeries.markLine = {
          silent: true,
          symbol: 'none',
          data: [],
          label: { show: true, position: 'end', fontSize: 10 },
        };
      }

      for (const drawing of drawings) {
        if (drawing.type === 'hline') {
          const y = drawing.points[0]?.y;
          if (y != null) {
            targetSeries.markLine.data.push({
              yAxis: y,
              name: drawing.label || `H-Line ${fmtNum(y)}`,
              lineStyle: { color: drawing.color, type: 'dashed', width: 1.5 },
              label: {
                show: true,
                formatter: drawing.label || fmtNum(y),
                color: drawing.color,
                fontSize: 10,
              },
            });
          }
        } else if (drawing.type === 'trendline') {
          // Trendline: use markLine with coord pairs (fixes broken graphic elements)
          if (drawing.points.length >= 2) {
            const [p1, p2] = drawing.points;
            // Find nearest date indices for the two points
            const idx1 = findNearestTimestampIdx(timestamps, p1.x);
            const idx2 = findNearestTimestampIdx(timestamps, p2.x);
            if (idx1 >= 0 && idx2 >= 0) {
              targetSeries.markLine.data.push([
                {
                  coord: [idx1, p1.y],
                  lineStyle: { color: drawing.color, type: 'dashed', width: 2 },
                  label: { show: false },
                  symbol: 'circle',
                  symbolSize: 6,
                },
                {
                  coord: [idx2, p2.y],
                  symbol: 'circle',
                  symbolSize: 6,
                },
              ]);
            }
          }
        } else if (drawing.type === 'text') {
          if (drawing.points.length >= 1 && drawing.label) {
            const p = drawing.points[0];
            const idx = findNearestTimestampIdx(timestamps, p.x);
            if (idx >= 0) {
              if (!targetSeries.markPoint) {
                targetSeries.markPoint = {
                  symbol: 'pin',
                  symbolSize: 0,
                  data: [],
                  label: { show: true },
                };
              }
              targetSeries.markPoint.data.push({
                coord: [idx, p.y],
                value: '',
                symbol: 'circle',
                symbolSize: 6,
                itemStyle: { color: drawing.color },
                label: {
                  show: true,
                  formatter: drawing.label,
                  color: drawing.color,
                  fontSize: 11,
                  fontWeight: 'bold',
                  position: 'top',
                  distance: 8,
                  backgroundColor: 'rgba(15,23,42,0.8)',
                  padding: [2, 6],
                  borderRadius: 3,
                },
              });
            }
          }
        } else if (drawing.type === 'fibonacci') {
          if (drawing.points.length >= 2) {
            const high = Math.max(drawing.points[0].y, drawing.points[1].y);
            const low = Math.min(drawing.points[0].y, drawing.points[1].y);
            const fibs = computeFibLevels(high, low);
            for (const fib of fibs) {
              targetSeries.markLine.data.push({
                yAxis: fib.value,
                name: `Fib ${(fib.level * 100).toFixed(1)}%`,
                lineStyle: {
                  color: drawing.color,
                  type: fib.level === 0 || fib.level === 1 ? 'solid' : 'dashed',
                  width: fib.level === 0.5 ? 1.5 : 1,
                  opacity: 0.7,
                },
                label: {
                  show: true,
                  formatter: `${(fib.level * 100).toFixed(1)}% (${fmtNum(fib.value)})`,
                  color: drawing.color,
                  fontSize: 9,
                },
              });
            }
          }
        }
      }
    }
  }

  // Regime Detection Overlay → markArea on the first price series
  if (showRegimes && regimes.length > 0) {
    const priceSeries = series.find((s) => {
      const layer = visibleLayers.find((l) => l.label === s.name);
      return layer && layer.gridIndex === 0 && layer.yAxis === 'left';
    }) ?? series[0];
    if (priceSeries) {
      const segments = segmentRegimes(regimes);
      if (!priceSeries.markArea) {
        priceSeries.markArea = { silent: true, data: [] };
      }
      for (const seg of segments) {
        if (seg.regime === 'trend') continue; // Skip trend (default) to reduce visual noise
        priceSeries.markArea.data.push([
          {
            xAxis: dates[seg.startIdx],
            name: REGIME_LABELS[seg.regime],
            itemStyle: { color: REGIME_COLORS[seg.regime], opacity: 0.06 },
          },
          { xAxis: dates[seg.endIdx] },
        ]);
      }
      priceSeries.markArea.label = {
        show: true,
        position: 'insideTop',
        fontSize: 9,
        color: 'rgba(255,255,255,0.4)',
      };
    }
  }

  // Event Markers → vertical markLine on first price series
  if (showEvents && timestamps.length >= 2) {
    const priceSeries = series.find((s) => {
      const layer = visibleLayers.find((l) => l.label === s.name);
      return layer && layer.gridIndex === 0 && layer.yAxis === 'left';
    }) ?? series[0];
    if (priceSeries) {
      const startMs = timestamps[0];
      const endMs = timestamps[timestamps.length - 1];
      const events = getEventsInRange(startMs, endMs, eventCategories, customEvents);

      if (!priceSeries.markLine) {
        priceSeries.markLine = { silent: true, symbol: 'none', data: [], label: { show: true, position: 'end', fontSize: 10 } };
      }

      for (const evt of events) {
        const idx = findNearestIndex(timestamps, evt.date);
        if (idx < 0) continue;
        priceSeries.markLine.data.push({
          xAxis: dates[idx],
          name: evt.label,
          lineStyle: {
            color: EVENT_CATEGORY_COLORS[evt.category],
            type: 'dashed',
            width: 1,
            opacity: 0.6,
          },
          label: {
            show: true,
            formatter: evt.label,
            color: EVENT_CATEGORY_COLORS[evt.category],
            fontSize: 9,
            position: 'start',
            rotate: 90,
            offset: [10, 0],
          },
        });
      }
    }
  }

  // DataZoom (spans all grids)
  const dataZoom = [
    {
      type: 'inside' as const,
      xAxisIndex: grids.map((_, i) => i),
      start: 0,
      end: 100,
    },
    {
      type: 'slider' as const,
      xAxisIndex: grids.map((_, i) => i),
      bottom: hasBottomGrid ? '0%' : '0%',
      height: 20,
      borderColor: 'transparent',
      backgroundColor: 'rgba(255,255,255,0.02)',
      fillerColor: 'rgba(52,211,153,0.1)',
      handleStyle: { color: '#34d399' },
      textStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
    },
  ];

  // Rich Tooltip with formatted values and % change
  const refLineNames = new Set([
    'Overbought (70)', 'Oversold (30)', 'Overbought (80)', 'Oversold (20)', 'Normal Volume (1x)',
  ]);
  // Cache first non-null value per series for % change calculation
  const seriesFirstValues: Record<string, number> = {};
  for (const s of series) {
    if (refLineNames.has(s.name)) continue;
    const arr = s.data;
    if (Array.isArray(arr)) {
      for (const v of arr) {
        const num = Array.isArray(v) ? v[1] : v; // candlestick [o,c,l,h] → use close (idx 1)
        if (num != null && typeof num === 'number' && isFinite(num)) {
          seriesFirstValues[s.name] = num;
          break;
        }
      }
    }
  }
  const tooltip = {
    ...theme.tooltip,
    trigger: 'axis' as const,
    axisPointer: { type: 'cross' as const, crossStyle: { color: '#999' } },
    backgroundColor: 'rgba(15,23,42,0.95)',
    borderColor: 'rgba(255,255,255,0.1)',
    padding: [12, 16],
    textStyle: { fontSize: 12, color: '#e2e8f0' },
    formatter: (params: any) => {
      if (!Array.isArray(params) || params.length === 0) return '';
      const dateIdx = params[0]?.dataIndex ?? 0;
      const ts = timestamps[dateIdx];
      const dateStr = ts ? new Date(ts).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric',
      }) : dates[dateIdx] ?? '';
      let html = `<div style="font-weight:600;margin-bottom:8px;color:#94a3b8;font-size:11px">${dateStr}`;
      // Show regime label in tooltip if active
      if (showRegimes && regimes[dateIdx]) {
        const r = regimes[dateIdx];
        html += ` <span style="color:${REGIME_COLORS[r]};font-size:10px;margin-left:6px">${REGIME_LABELS[r]}</span>`;
      }
      html += `</div>`;
      for (const p of params) {
        if (refLineNames.has(p.seriesName)) continue;
        const val = Array.isArray(p.value)
          ? p.value[1] // candlestick close
          : p.value;
        if (val == null) continue;
        const numVal = Number(val);
        const formatted = fmtNum(numVal, undefined);
        const first = seriesFirstValues[p.seriesName];
        let pctStr = '';
        if (first != null && first !== 0) {
          const pct = ((numVal - first) / Math.abs(first)) * 100;
          const pctColor = pct >= 0 ? '#34d399' : '#ef4444';
          pctStr = `<span style="color:${pctColor};margin-left:6px;font-size:10px">${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%</span>`;
        }
        html += `<div style="display:flex;align-items:center;gap:6px;margin:3px 0">`;
        html += `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color}"></span>`;
        html += `<span style="color:#94a3b8;flex:1">${p.seriesName}</span>`;
        html += `<span style="font-weight:600;font-variant-numeric:tabular-nums">${formatted}</span>`;
        html += pctStr;
        html += `</div>`;
      }
      return html;
    },
  };

  // Legend
  const legend = {
    data: series.map((s) => s.name).filter((n) =>
      n !== 'Overbought (70)' && n !== 'Oversold (30)' &&
      n !== 'Overbought (80)' && n !== 'Oversold (20)' &&
      n !== 'Normal Volume (1x)'
    ),
    textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
    top: 0,
    right: '5%',
    itemWidth: 12,
    itemHeight: 8,
  };

  return {
    ...theme,
    backgroundColor: 'transparent',
    grid: grids,
    xAxis: xAxes,
    yAxis: yAxes,
    series,
    dataZoom,
    tooltip,
    legend,
    animation: true,
    color: CHART_COLORS,
  };
}

/** Find nearest timestamp index for a given ms value */
function findNearestTimestampIdx(timestamps: number[], targetMs: number): number {
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < timestamps.length; i++) {
    const dist = Math.abs(timestamps[i] - targetMs);
    if (dist < bestDist) {
      bestDist = dist;
      best = i;
    }
  }
  return bestDist < 5 * 86400_000 ? best : -1;
}
