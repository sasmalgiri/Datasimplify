'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME } from '@/lib/live-dashboard/theme';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

interface WaterfallChartWidgetProps {
  limit?: number;
  metric?: '24h' | '7d';
}

export function WaterfallChartWidget({ limit = 12, metric = '24h' }: WaterfallChartWidgetProps) {
  const { data } = useLiveDashboardStore();

  const option = useMemo(() => {
    if (!data.markets) return null;

    // Sort by absolute change for interesting waterfall
    const sorted = [...data.markets]
      .filter((c) => {
        const val = metric === '7d' ? c.price_change_percentage_7d_in_currency : c.price_change_percentage_24h;
        return val !== null && val !== undefined;
      })
      .sort((a, b) => {
        const aVal = metric === '7d' ? (a.price_change_percentage_7d_in_currency || 0) : a.price_change_percentage_24h;
        const bVal = metric === '7d' ? (b.price_change_percentage_7d_in_currency || 0) : b.price_change_percentage_24h;
        return bVal - aVal; // biggest gainers first
      })
      .slice(0, limit);

    if (sorted.length === 0) return null;

    const names = sorted.map((c) => c.symbol.toUpperCase());
    const changes = sorted.map((c) =>
      parseFloat((metric === '7d' ? (c.price_change_percentage_7d_in_currency || 0) : c.price_change_percentage_24h).toFixed(2))
    );

    // Waterfall: transparent base bars + colored change bars
    // Cumulative running total
    let running = 0;
    const baseData: number[] = [];
    const gainData: (number | string)[] = [];
    const lossData: (number | string)[] = [];

    changes.forEach((change) => {
      if (change >= 0) {
        baseData.push(running);
        gainData.push(change);
        lossData.push('-');
      } else {
        baseData.push(running + change);
        gainData.push('-');
        lossData.push(Math.abs(change));
      }
      running += change;
    });

    // Add total bar
    names.push('TOTAL');
    if (running >= 0) {
      baseData.push(0);
      gainData.push(parseFloat(running.toFixed(2)));
      lossData.push('-');
    } else {
      baseData.push(running);
      gainData.push('-');
      lossData.push(parseFloat(Math.abs(running).toFixed(2)));
    }

    return {
      ...ECHARTS_THEME,
      grid: { left: '3%', right: '3%', bottom: '12%', top: '8%', containLabel: true },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          const idx = params[0].dataIndex;
          const name = names[idx];
          const val = idx < changes.length ? changes[idx] : running;
          const prefix = val >= 0 ? '+' : '';
          return `<strong>${name}</strong><br/>${metric} Change: ${prefix}${val.toFixed(2)}%`;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: names,
        ...ECHARTS_THEME.xAxis,
        axisLabel: {
          ...ECHARTS_THEME.xAxis.axisLabel,
          rotate: names.length > 8 ? 30 : 0,
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
          name: 'Base',
          type: 'bar' as const,
          stack: 'waterfall',
          data: baseData,
          barMaxWidth: 20,
          itemStyle: { color: 'transparent' },
          emphasis: { itemStyle: { color: 'transparent' } },
        },
        {
          name: 'Gain',
          type: 'bar' as const,
          stack: 'waterfall',
          data: gainData,
          barMaxWidth: 20,
          itemStyle: {
            color: 'rgba(52,211,153,0.7)',
            borderRadius: [3, 3, 0, 0],
          },
          animationDelay: (idx: number) => idx * 40,
        },
        {
          name: 'Loss',
          type: 'bar' as const,
          stack: 'waterfall',
          data: lossData,
          barMaxWidth: 20,
          itemStyle: {
            color: 'rgba(239,68,68,0.7)',
            borderRadius: [3, 3, 0, 0],
          },
          animationDelay: (idx: number) => idx * 40,
        },
      ],
      animationEasing: 'cubicOut' as const,
    };
  }, [data.markets, limit, metric]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No data for waterfall chart
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
