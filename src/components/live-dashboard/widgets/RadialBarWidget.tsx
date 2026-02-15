'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { PolarComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP, formatCompact } from '@/lib/live-dashboard/theme';

echarts.use([BarChart, PolarComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface RadialBarWidgetProps {
  limit?: number;
  mode?: 'market_cap' | 'volume' | 'change';
}

export function RadialBarWidget({ limit = 12, mode = 'market_cap' }: RadialBarWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = CHART_HEIGHT_MAP[customization.chartHeight];

  const { option, insight } = useMemo(() => {
    if (!data.markets?.length) return { option: null, insight: null };

    const coins = data.markets.slice(0, limit);
    const palette = themeColors.palette;

    const labels = coins.map((c) => c.symbol.toUpperCase());
    const values = coins.map((c) => {
      switch (mode) {
        case 'volume': return c.total_volume;
        case 'change': return Math.abs(c.price_change_percentage_24h || 0);
        default: return c.market_cap;
      }
    });

    const barData = coins.map((c, i) => ({
      value: values[i],
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
          { offset: 0, color: palette[i % palette.length] },
          { offset: 1, color: palette[(i + 1) % palette.length] },
        ]),
      },
    }));

    // Compute insight
    const leader = coins[0];
    const leaderVal = values[0];
    const runnerUp = coins.length > 1 ? coins[1] : null;
    const runnerUpVal = values.length > 1 ? values[1] : 0;
    const bottom = coins[coins.length - 1];
    const bottomVal = values[values.length - 1];
    const gap = leaderVal > 0 && runnerUpVal > 0 ? (((leaderVal - runnerUpVal) / leaderVal) * 100).toFixed(1) : '0';
    const bottomPct = leaderVal > 0 ? ((bottomVal / leaderVal) * 100).toFixed(1) : '0';
    const insightText = `Leader: ${leader.symbol.toUpperCase()}${runnerUp ? ` \u00B7 Runner-up gap: ${gap}%` : ''} \u00B7 Bottom: ${bottom.symbol.toUpperCase()} at ${bottomPct}% of leader`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        formatter: (params: any) => {
          const coin = coins[params.dataIndex];
          const sign = (coin.price_change_percentage_24h || 0) >= 0 ? '+' : '';
          return `<b>${coin.name} (${coin.symbol.toUpperCase()})</b><br/>${
            mode === 'market_cap' ? 'MCap' : mode === 'volume' ? 'Volume' : '24h Change'
          }: ${mode === 'change' ? sign + (coin.price_change_percentage_24h || 0).toFixed(2) + '%' : formatCompact(values[params.dataIndex])}`;
        },
      },
      polar: { radius: ['12%', '88%'] },
      angleAxis: {
        type: 'value' as const,
        startAngle: 90,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { show: false },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      },
      radiusAxis: {
        type: 'category' as const,
        data: labels,
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        axisTick: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 9 },
      },
      series: [
        {
          type: 'bar',
          coordinateSystem: 'polar',
          data: barData,
          barWidth: '65%',
          roundCap: true,
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' },
          },
        },
      ],
    }};
  }, [data.markets, limit, mode, themeColors, customization]);

  if (!data.markets) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        Connect API key to load data
      </div>
    );
  }

  if (!option) return null;

  return (
    <div>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: chartHeight, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
      {insight && <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>}
    </div>
  );
}
