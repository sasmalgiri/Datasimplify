// Builds a multi-axis ECharts option from DataLab store state

import type { OverlayLayer } from './types';
import { normalizeToBase100, applyEdits } from './calculations';
import { ECHARTS_THEME, CHART_COLORS } from '@/lib/live-dashboard/theme';
import type { SiteTheme } from '@/lib/live-dashboard/store';
import { getEchartsTheme } from '@/lib/live-dashboard/theme';

interface BuildOptions {
  layers: OverlayLayer[];
  timestamps: number[];
  ohlcRaw: number[][] | null;
  editedCells: Record<string, Record<number, number>>;
  normalizeMode: boolean;
  siteTheme?: SiteTheme;
}

function formatDate(ts: number): string {
  const d = new Date(ts);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export function buildChartOption(opts: BuildOptions) {
  const { layers, timestamps, ohlcRaw, editedCells, normalizeMode, siteTheme = 'dark' } = opts;
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
      yAxes.push({
        type: 'value' as const,
        ...theme.yAxis,
        gridIndex: layer.gridIndex,
        position: layer.yAxis,
        scale: true,
        axisLabel: {
          ...theme.yAxis.axisLabel,
          formatter: (v: number) => {
            if (Math.abs(v) >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
            if (Math.abs(v) >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
            if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
            if (Math.abs(v) < 1) return v.toFixed(4);
            return v.toFixed(0);
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

      series.push(seriesConfig);
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

  // Tooltip
  const tooltip = {
    ...theme.tooltip,
    trigger: 'axis' as const,
    axisPointer: { type: 'cross' as const, crossStyle: { color: '#999' } },
  };

  // Legend
  const legend = {
    data: visibleLayers.map((l) => l.label),
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
