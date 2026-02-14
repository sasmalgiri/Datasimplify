'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, CHART_COLORS, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

interface MultiLineChartWidgetProps {
  coinIds?: string[];
  days?: number;
}

export function MultiLineChartWidget({ coinIds = ['bitcoin', 'ethereum'] }: MultiLineChartWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const option = useMemo(() => {
    if (!data.markets) return null;

    const coins = data.markets.filter((c) => coinIds.includes(c.id) && c.sparkline_in_7d?.price?.length);
    if (coins.length === 0) return null;

    // Normalize prices to % change from start
    const seriesData = coins.map((coin, idx) => {
      const prices = coin.sparkline_in_7d?.price || [];
      const base = prices[0] || 1;
      const normalized = prices.map((p) => parseFloat((((p - base) / base) * 100).toFixed(2)));
      const step = Math.max(1, Math.floor(normalized.length / 50));
      const sampled = normalized.filter((_, i) => i % step === 0);

      return {
        name: coin.symbol.toUpperCase(),
        type: 'line' as const,
        data: sampled,
        smooth: customization.chartStyle === 'smooth',
        symbol: 'none',
        lineStyle: { width: 2, color: themeColors.palette[idx % themeColors.palette.length] },
        itemStyle: { color: themeColors.palette[idx % themeColors.palette.length] },
        emphasis: { lineStyle: { width: 3 } },
        animationDuration: 1500,
        animationEasing: 'cubicOut' as const,
      };
    });

    const maxLen = Math.max(...seriesData.map((s) => s.data.length));

    return {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      legend: {
        show: true,
        bottom: 0,
        textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
      },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        formatter: (params: any) => {
          if (!Array.isArray(params)) return '';
          return params
            .map((p: any) => {
              const v = p.value ?? 0;
              const sign = v >= 0 ? '+' : '';
              return `<span style="color:${p.color}">\u25CF</span> ${p.seriesName}: ${sign}${v.toFixed(2)}%`;
            })
            .join('<br/>');
        },
      },
      xAxis: {
        type: 'category' as const,
        data: Array.from({ length: maxLen }, (_, i) => i),
        ...ECHARTS_THEME.xAxis,
        axisLabel: { show: false },
      },
      yAxis: {
        type: 'value' as const,
        ...ECHARTS_THEME.yAxis,
        axisLabel: {
          ...ECHARTS_THEME.yAxis.axisLabel,
          formatter: (v: number) => `${v > 0 ? '+' : ''}${v}%`,
        },
      },
      dataZoom: [{ type: 'inside' as const }],
      series: seriesData,
    };
  }, [data.markets, coinIds, customization]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No comparison data available
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: `${CHART_HEIGHT_MAP[customization.chartHeight]}px`, width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
}
