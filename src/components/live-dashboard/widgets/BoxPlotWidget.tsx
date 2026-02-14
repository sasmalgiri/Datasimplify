'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BoxplotChart, ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, CHART_COLORS } from '@/lib/live-dashboard/theme';

echarts.use([BoxplotChart, ScatterChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface BoxPlotWidgetProps {
  coinIds?: string[];
  limit?: number;
}

function computeBoxStats(arr: number[]): [number, number, number, number, number] {
  const sorted = [...arr].sort((a, b) => a - b);
  const n = sorted.length;
  const q1 = sorted[Math.floor(n * 0.25)];
  const median = sorted[Math.floor(n * 0.5)];
  const q3 = sorted[Math.floor(n * 0.75)];
  const min = sorted[0];
  const max = sorted[n - 1];
  return [min, q1, median, q3, max];
}

export function BoxPlotWidget({ coinIds, limit = 10 }: BoxPlotWidgetProps) {
  const { data } = useLiveDashboardStore();

  const option = useMemo(() => {
    if (!data.markets) return null;

    const candidates = coinIds
      ? data.markets.filter((c) => coinIds.includes(c.id))
      : data.markets.slice(0, limit);

    const coins = candidates.filter((c) => c.sparkline_in_7d?.price?.length);
    if (coins.length === 0) return null;

    const symbols = coins.map((c) => c.symbol.toUpperCase());

    // Normalize sparkline prices to percentage change from first value
    const boxData = coins.map((c) => {
      const prices = c.sparkline_in_7d!.price;
      const base = prices[0];
      const pctChanges = prices.map((p) => ((p - base) / base) * 100);
      return computeBoxStats(pctChanges);
    });

    // Find outliers for scatter overlay
    const outliers: [number, number][] = [];
    coins.forEach((c, idx) => {
      const prices = c.sparkline_in_7d!.price;
      const base = prices[0];
      const pctChanges = prices.map((p) => ((p - base) / base) * 100);
      const [, q1, , q3] = boxData[idx];
      const iqr = q3 - q1;
      const lower = q1 - 1.5 * iqr;
      const upper = q3 + 1.5 * iqr;
      pctChanges.forEach((v) => {
        if (v < lower || v > upper) outliers.push([idx, parseFloat(v.toFixed(2))]);
      });
    });

    return {
      ...ECHARTS_THEME,
      grid: { left: '3%', right: '3%', bottom: '12%', top: '8%', containLabel: true },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'item' as const,
        formatter: (p: any) => {
          if (p.componentType === 'series' && p.seriesType === 'boxplot') {
            const d = p.data;
            return `<strong>${symbols[p.dataIndex]}</strong><br/>` +
              `Max: ${d[5]?.toFixed(2) ?? d[4]?.toFixed(2)}%<br/>` +
              `Q3: ${d[4]?.toFixed(2) ?? d[3]?.toFixed(2)}%<br/>` +
              `Median: ${d[3]?.toFixed(2) ?? d[2]?.toFixed(2)}%<br/>` +
              `Q1: ${d[2]?.toFixed(2) ?? d[1]?.toFixed(2)}%<br/>` +
              `Min: ${d[1]?.toFixed(2) ?? d[0]?.toFixed(2)}%`;
          }
          return '';
        },
      },
      xAxis: {
        type: 'category' as const,
        data: symbols,
        ...ECHARTS_THEME.xAxis,
        axisLabel: { ...ECHARTS_THEME.xAxis.axisLabel, rotate: symbols.length > 6 ? 30 : 0 },
      },
      yAxis: {
        type: 'value' as const,
        ...ECHARTS_THEME.yAxis,
        name: '7d Price Change (%)',
        nameTextStyle: { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
        axisLabel: {
          ...ECHARTS_THEME.yAxis.axisLabel,
          formatter: (v: number) => `${v.toFixed(1)}%`,
        },
      },
      dataZoom: [{ type: 'inside' as const }],
      series: [
        {
          type: 'boxplot' as const,
          data: boxData,
          itemStyle: {
            color: 'rgba(52,211,153,0.15)',
            borderColor: '#34d399',
            borderWidth: 1.5,
          },
          emphasis: {
            itemStyle: {
              borderColor: '#60a5fa',
              borderWidth: 2,
            },
          },
          animationDuration: 800,
        },
        {
          type: 'scatter' as const,
          data: outliers,
          itemStyle: { color: 'rgba(239,68,68,0.6)' },
          symbolSize: 5,
        },
      ],
    };
  }, [data.markets, coinIds, limit]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No sparkline data for box plot
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: '300px', width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
}
