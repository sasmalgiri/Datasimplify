'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME } from '@/lib/live-dashboard/theme';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface SupplyWidgetProps {
  limit?: number;
}

export function SupplyWidget({ limit = 12 }: SupplyWidgetProps) {
  const { data } = useLiveDashboardStore();

  const option = useMemo(() => {
    if (!data.markets) return null;

    const coins = data.markets
      .filter((c) => c.circulating_supply && c.max_supply && c.max_supply > 0)
      .slice(0, limit);

    if (coins.length === 0) return null;

    const names = coins.map((c) => c.symbol.toUpperCase());
    const circulating = coins.map((c) => parseFloat(((c.circulating_supply! / c.max_supply!) * 100).toFixed(1)));
    const remaining = coins.map((c) => parseFloat((100 - (c.circulating_supply! / c.max_supply!) * 100).toFixed(1)));

    return {
      ...ECHARTS_THEME,
      legend: {
        show: true,
        bottom: 0,
        textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        data: ['Circulating', 'Remaining'],
      },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          const name = params[0].name;
          return `<strong>${name}</strong><br/>${params.map((p: any) => `${p.seriesName}: ${p.value}%`).join('<br/>')}`;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: names,
        ...ECHARTS_THEME.xAxis,
      },
      yAxis: {
        type: 'value' as const,
        ...ECHARTS_THEME.yAxis,
        max: 100,
        axisLabel: {
          ...ECHARTS_THEME.yAxis.axisLabel,
          formatter: (v: number) => `${v}%`,
        },
      },
      series: [
        {
          name: 'Circulating',
          type: 'bar' as const,
          stack: 'supply',
          data: circulating,
          barMaxWidth: 24,
          itemStyle: { color: 'rgba(52,211,153,0.6)' },
          animationDelay: (idx: number) => idx * 30,
        },
        {
          name: 'Remaining',
          type: 'bar' as const,
          stack: 'supply',
          data: remaining,
          barMaxWidth: 24,
          itemStyle: {
            color: 'rgba(255,255,255,0.06)',
            borderRadius: [4, 4, 0, 0],
          },
          animationDelay: (idx: number) => idx * 30 + 200,
        },
      ],
      animationEasing: 'cubicOut' as const,
    };
  }, [data.markets, limit]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No supply data available
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: '280px', width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
}
