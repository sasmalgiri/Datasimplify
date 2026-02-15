'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, formatCompact, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([BarChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface VolumeChartWidgetProps {
  limit?: number;
}

export function VolumeChartWidget({ limit = 15 }: VolumeChartWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { option, insight } = useMemo(() => {
    if (!data.markets) return { option: null, insight: null };

    const coins = data.markets.slice(0, limit);
    const names = coins.map((c) => c.symbol.toUpperCase());
    const volumes = coins.map((c) => ({
      value: c.total_volume,
      itemStyle: {
        color: (c.price_change_percentage_24h || 0) >= 0
          ? themeColors.fill
          : 'rgba(239,68,68,0.5)',
      },
    }));

    const sorted = [...coins].sort((a, b) => b.total_volume - a.total_volume);
    const topCoin = sorted[0];
    const totalVol = coins.reduce((s, c) => s + c.total_volume, 0);
    const top3Vol = sorted.slice(0, 3).reduce((s, c) => s + c.total_volume, 0);
    const top3Pct = totalVol > 0 ? ((top3Vol / totalVol) * 100).toFixed(1) : '0';
    const insightText = `Top volume: ${topCoin.symbol.toUpperCase()} (${formatCompact(topCoin.total_volume)}) · Top 3 = ${top3Pct}% of displayed volume`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
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
    }};
  }, [data.markets, limit, customization]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No volume data available
      </div>
    );
  }

  return (
    <div>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: `${CHART_HEIGHT_MAP[customization.chartHeight]}px`, width: '100%' }}
        notMerge
        lazyUpdate
      />
      {insight && <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>}
    </div>
  );
}
