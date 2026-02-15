'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([BarChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface CategoryBarWidgetProps {
  limit?: number;
}

export function CategoryBarWidget({ limit = 15 }: CategoryBarWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { option, insight } = useMemo(() => {
    if (!data.categories || !Array.isArray(data.categories)) return { option: null, insight: null };

    const categories = data.categories
      .filter((c: any) => c.market_cap_change_24h != null && c.name)
      .sort((a: any, b: any) => Math.abs(b.market_cap_change_24h) - Math.abs(a.market_cap_change_24h))
      .slice(0, limit);

    if (categories.length === 0) return { option: null, insight: null };

    const names = categories.map((c: any) =>
      c.name.length > 20 ? c.name.slice(0, 20) + '...' : c.name,
    );
    const values = categories.map((c: any) => ({
      value: parseFloat(c.market_cap_change_24h.toFixed(2)),
      itemStyle: {
        color: c.market_cap_change_24h >= 0
          ? themeColors.fill
          : 'rgba(239,68,68,0.5)',
      },
    }));

    // Compute insight
    const sortedByChange = [...categories].sort((a: any, b: any) => b.market_cap_change_24h - a.market_cap_change_24h);
    const leading = sortedByChange[0];
    const lagging = sortedByChange[sortedByChange.length - 1];
    const avgReturn = categories.reduce((s: number, c: any) => s + c.market_cap_change_24h, 0) / categories.length;
    const insightText = `Leading: ${leading.name} (${leading.market_cap_change_24h >= 0 ? '+' : ''}${leading.market_cap_change_24h.toFixed(1)}%) \u00B7 Lagging: ${lagging.name} (${lagging.market_cap_change_24h >= 0 ? '+' : ''}${lagging.market_cap_change_24h.toFixed(1)}%) \u00B7 Average sector return: ${avgReturn >= 0 ? '+' : ''}${avgReturn.toFixed(1)}%`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      grid: { left: '30%', right: '8%', top: '3%', bottom: '3%', containLabel: false },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          const fullName = categories[p.dataIndex]?.name || p.name;
          const sign = p.value >= 0 ? '+' : '';
          return `<strong>${fullName}</strong><br/>24h: ${sign}${p.value}%`;
        },
      },
      xAxis: {
        type: 'value' as const,
        ...ECHARTS_THEME.xAxis,
        axisLabel: {
          ...ECHARTS_THEME.xAxis.axisLabel,
          formatter: (v: number) => `${v}%`,
        },
      },
      yAxis: {
        type: 'category' as const,
        data: names,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9 },
      },
      series: [{
        type: 'bar' as const,
        data: values,
        barMaxWidth: 16,
        itemStyle: { borderRadius: [0, 4, 4, 0] },
        markLine: {
          silent: true,
          data: [{ xAxis: 0 }],
          lineStyle: { color: 'rgba(255,255,255,0.1)', type: 'solid' as const },
          label: { show: false },
          symbol: 'none',
        },
        animationDelay: (idx: number) => idx * 40,
      }],
      animationEasing: 'cubicOut' as const,
    }};
  }, [data.categories, limit, customization]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No category data available
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
