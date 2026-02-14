'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, CHART_COLORS } from '@/lib/live-dashboard/theme';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

interface AreaChartWidgetProps {
  coinIds?: string[];
  limit?: number;
  mode?: 'volume' | 'marketcap';
}

export function AreaChartWidget({ coinIds, limit = 8, mode = 'volume' }: AreaChartWidgetProps) {
  const { data } = useLiveDashboardStore();

  const option = useMemo(() => {
    if (!data.markets) return null;

    const coins = coinIds
      ? data.markets.filter((c) => coinIds.includes(c.id))
      : data.markets.slice(0, limit);

    if (coins.length === 0) return null;

    // Use sparkline data to build time series for stacked area
    const coinsWithSparkline = coins.filter((c) => c.sparkline_in_7d?.price?.length);
    if (coinsWithSparkline.length === 0) return null;

    // Normalize sparkline to hourly timestamps (CoinGecko sparklines are ~168 points for 7d)
    const now = Date.now();
    const sparkLen = coinsWithSparkline[0].sparkline_in_7d!.price.length;
    const timePoints = Array.from({ length: sparkLen }, (_, i) => {
      const ts = now - (sparkLen - 1 - i) * 3600 * 1000;
      return new Date(ts).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });

    // Deduplicate dates for cleaner x-axis
    const uniqueDates: string[] = [];
    const dateIndices: number[] = [];
    timePoints.forEach((d, i) => {
      if (uniqueDates.length === 0 || uniqueDates[uniqueDates.length - 1] !== d) {
        uniqueDates.push(d);
        dateIndices.push(i);
      }
    });

    const series = coinsWithSparkline.map((coin, idx) => {
      const sparkline = coin.sparkline_in_7d!.price;
      const values = mode === 'volume'
        ? sparkline.map((p) => Math.round(p * (coin.total_volume / coin.current_price)))
        : sparkline.map((p) => Math.round(p * (coin.market_cap / coin.current_price)));

      return {
        name: coin.symbol.toUpperCase(),
        type: 'line' as const,
        stack: 'total',
        areaStyle: {
          opacity: 0.3,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: CHART_COLORS[idx % CHART_COLORS.length] },
            { offset: 1, color: 'transparent' },
          ]),
        },
        lineStyle: { width: 1.5, color: CHART_COLORS[idx % CHART_COLORS.length] },
        itemStyle: { color: CHART_COLORS[idx % CHART_COLORS.length] },
        emphasis: { focus: 'series' as const },
        showSymbol: false,
        smooth: true,
        data: values,
        animationDelay: (i: number) => i * 5 + idx * 100,
      };
    });

    return {
      ...ECHARTS_THEME,
      grid: { left: '3%', right: '3%', bottom: '18%', top: '12%', containLabel: true },
      legend: {
        show: true,
        top: 0,
        textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
      },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'cross' as const, label: { backgroundColor: '#1a1a2e' } },
      },
      xAxis: {
        type: 'category' as const,
        data: timePoints,
        ...ECHARTS_THEME.xAxis,
        boundaryGap: false,
        axisLabel: {
          ...ECHARTS_THEME.xAxis.axisLabel,
          interval: Math.floor(sparkLen / 7),
        },
      },
      yAxis: {
        type: 'value' as const,
        ...ECHARTS_THEME.yAxis,
        axisLabel: {
          ...ECHARTS_THEME.yAxis.axisLabel,
          formatter: (v: number) => {
            if (v >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
            if (v >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
            if (v >= 1e3) return `${(v / 1e3).toFixed(0)}K`;
            return String(v);
          },
        },
      },
      dataZoom: [
        { type: 'inside' as const, start: 0, end: 100 },
        {
          type: 'slider' as const,
          start: 0,
          end: 100,
          height: 20,
          bottom: 5,
          borderColor: 'transparent',
          backgroundColor: 'rgba(255,255,255,0.02)',
          fillerColor: 'rgba(52,211,153,0.1)',
          handleStyle: { color: '#34d399', borderColor: '#34d399' },
          textStyle: { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
        },
      ],
      series,
      animationEasing: 'cubicOut' as const,
    };
  }, [data.markets, coinIds, limit, mode]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No sparkline data for area chart
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: '320px', width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
}
