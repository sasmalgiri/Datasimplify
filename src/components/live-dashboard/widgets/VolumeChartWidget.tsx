'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, formatCompact } from '@/lib/live-dashboard/theme';

echarts.use([BarChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface VolumeChartWidgetProps {
  limit?: number;
}

export function VolumeChartWidget({ limit = 15 }: VolumeChartWidgetProps) {
  const { data } = useLiveDashboardStore();

  const option = useMemo(() => {
    if (!data.markets) return null;

    const coins = data.markets.slice(0, limit);
    const names = coins.map((c) => c.symbol.toUpperCase());
    const volumes = coins.map((c) => ({
      value: c.total_volume,
      itemStyle: {
        color: (c.price_change_percentage_24h || 0) >= 0
          ? 'rgba(52,211,153,0.6)'
          : 'rgba(239,68,68,0.5)',
      },
    }));

    return {
      ...ECHARTS_THEME,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `<strong>${p.name}</strong><br/>Volume: ${formatCompact(p.value)}`;
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
        axisLabel: {
          ...ECHARTS_THEME.yAxis.axisLabel,
          formatter: (v: number) => formatCompact(v).replace('$', ''),
        },
      },
      dataZoom: [{ type: 'inside' as const, start: 0, end: 100 }],
      series: [
        {
          type: 'bar' as const,
          data: volumes,
          barMaxWidth: 32,
          itemStyle: { borderRadius: [4, 4, 0, 0] },
          animationDelay: (idx: number) => idx * 30,
        },
      ],
      animationEasing: 'elasticOut' as const,
    };
  }, [data.markets, limit]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No volume data available
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: '260px', width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
}
