'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, CHART_COLORS } from '@/lib/live-dashboard/theme';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface ReturnsBarWidgetProps {
  coinIds?: string[];
  limit?: number;
}

export function ReturnsBarWidget({ coinIds, limit = 10 }: ReturnsBarWidgetProps) {
  const { data } = useLiveDashboardStore();

  const option = useMemo(() => {
    if (!data.markets) return null;

    const coins = coinIds
      ? data.markets.filter((c) => coinIds.includes(c.id))
      : data.markets.slice(0, limit);

    if (coins.length === 0) return null;

    const symbols = coins.map((c) => c.symbol.toUpperCase());

    // 24h returns
    const returns24h = coins.map((c) => parseFloat((c.price_change_percentage_24h || 0).toFixed(2)));

    // 7d returns
    const returns7d = coins.map((c) => parseFloat((c.price_change_percentage_7d_in_currency || 0).toFixed(2)));

    // 30d returns (estimated from sparkline: first vs last)
    const returns30d = coins.map((c) => {
      const spark = c.sparkline_in_7d?.price;
      if (!spark || spark.length < 2) return 0;
      const first = spark[0];
      const last = spark[spark.length - 1];
      return parseFloat(((last - first) / first * 100).toFixed(2));
    });

    return {
      ...ECHARTS_THEME,
      grid: { left: '3%', right: '3%', bottom: '12%', top: '12%', containLabel: true },
      legend: {
        show: true,
        top: 0,
        textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
      },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          return `<strong>${params[0].name}</strong><br/>` +
            params.map((p: any) => `${p.seriesName}: ${p.value >= 0 ? '+' : ''}${p.value}%`).join('<br/>');
        },
      },
      xAxis: {
        type: 'category' as const,
        data: symbols,
        ...ECHARTS_THEME.xAxis,
        axisLabel: {
          ...ECHARTS_THEME.xAxis.axisLabel,
          rotate: symbols.length > 6 ? 30 : 0,
        },
      },
      yAxis: {
        type: 'value' as const,
        ...ECHARTS_THEME.yAxis,
        axisLabel: {
          ...ECHARTS_THEME.yAxis.axisLabel,
          formatter: (v: number) => `${v}%`,
        },
      },
      series: [
        {
          name: '24h',
          type: 'bar' as const,
          data: returns24h,
          barGap: '10%',
          barMaxWidth: 16,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: (params: any) => params.value >= 0 ? CHART_COLORS[0] : '#ef4444',
          },
          animationDelay: (idx: number) => idx * 30,
        },
        {
          name: '7d',
          type: 'bar' as const,
          data: returns7d,
          barMaxWidth: 16,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: (params: any) => params.value >= 0 ? CHART_COLORS[1] : '#f97316',
          },
          animationDelay: (idx: number) => idx * 30 + 100,
        },
        {
          name: '~7d (sparkline)',
          type: 'bar' as const,
          data: returns30d,
          barMaxWidth: 16,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: (params: any) => params.value >= 0 ? CHART_COLORS[4] : '#dc2626',
          },
          animationDelay: (idx: number) => idx * 30 + 200,
        },
      ],
      animationEasing: 'cubicOut' as const,
    };
  }, [data.markets, coinIds, limit]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No data for returns comparison
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
