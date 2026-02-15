'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, CHART_COLORS, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface ReturnsBarWidgetProps {
  coinIds?: string[];
  limit?: number;
}

export function ReturnsBarWidget({ coinIds, limit = 10 }: ReturnsBarWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { option, insight } = useMemo(() => {
    if (!data.markets) return { option: null, insight: null };

    const coins = coinIds
      ? data.markets.filter((c) => coinIds.includes(c.id))
      : data.markets.slice(0, limit);

    if (coins.length === 0) return { option: null, insight: null };

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

    // Compute insight: best performers per timeframe, count positive across all
    const best24hIdx = returns24h.reduce((best, v, i) => v > returns24h[best] ? i : best, 0);
    const best7dIdx = returns7d.reduce((best, v, i) => v > returns7d[best] ? i : best, 0);
    const positiveAllCount = symbols.filter((_, i) =>
      returns24h[i] >= 0 && returns7d[i] >= 0 && returns30d[i] >= 0
    ).length;
    const insightText = symbols.length > 0
      ? `Best 24h: ${symbols[best24hIdx]} (${returns24h[best24hIdx] >= 0 ? '+' : ''}${returns24h[best24hIdx]}%) · Best 7d: ${symbols[best7dIdx]} (${returns7d[best7dIdx] >= 0 ? '+' : ''}${returns7d[best7dIdx]}%) · ${positiveAllCount}/${symbols.length} positive across all timeframes`
      : '';

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
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
            color: (params: any) => params.value >= 0 ? themeColors.palette[0 % themeColors.palette.length] : '#ef4444',
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
            color: (params: any) => params.value >= 0 ? themeColors.palette[1 % themeColors.palette.length] : '#f97316',
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
            color: (params: any) => params.value >= 0 ? themeColors.palette[4 % themeColors.palette.length] : '#dc2626',
          },
          animationDelay: (idx: number) => idx * 30 + 200,
        },
      ],
      animationEasing: 'cubicOut' as const,
    }};
  }, [data.markets, coinIds, limit, customization]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No data for returns comparison
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
