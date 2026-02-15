'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([BarChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface SupplyWidgetProps {
  limit?: number;
}

export function SupplyWidget({ limit = 12 }: SupplyWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { option, insight } = useMemo(() => {
    if (!data.markets) return { option: null, insight: null };

    const coins = data.markets
      .filter((c) => c.circulating_supply && c.max_supply && c.max_supply > 0)
      .slice(0, limit);

    if (coins.length === 0) return { option: null, insight: null };

    const names = coins.map((c) => c.symbol.toUpperCase());
    const circulating = coins.map((c) => parseFloat(((c.circulating_supply! / c.max_supply!) * 100).toFixed(1)));
    const remaining = coins.map((c) => parseFloat((100 - (c.circulating_supply! / c.max_supply!) * 100).toFixed(1)));

    const sortedByPct = coins.map((c, i) => ({ sym: c.symbol.toUpperCase(), pct: circulating[i] })).sort((a, b) => b.pct - a.pct);
    const mostScarce = sortedByPct[0];
    const leastScarce = sortedByPct[sortedByPct.length - 1];
    const noCap = data.markets.filter((c) => !c.max_supply || c.max_supply === 0).length;
    const insightText = `Most scarce: ${mostScarce.sym} (${mostScarce.pct}% mined) · Most inflationary: ${leastScarce.sym} (${leastScarce.pct}% mined) · ${noCap} coins have no cap`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
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
          itemStyle: { color: themeColors.fill },
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
    }};
  }, [data.markets, limit, customization]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No supply data available
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
