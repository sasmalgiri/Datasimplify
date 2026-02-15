'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP, formatCompact } from '@/lib/live-dashboard/theme';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

interface WhaleDistributionWidgetProps {}

const TIERS = [
  { label: 'Whale (>$50B)', emoji: '\u{1F40B}', min: 50e9 },
  { label: 'Shark ($10B–$50B)', emoji: '\u{1F988}', min: 10e9 },
  { label: 'Dolphin ($1B–$10B)', emoji: '\u{1F42C}', min: 1e9 },
  { label: 'Fish ($100M–$1B)', emoji: '\u{1F41F}', min: 100e6 },
  { label: 'Shrimp (<$100M)', emoji: '\u{1F990}', min: 0 },
] as const;

function getTier(mcap: number) {
  for (const t of TIERS) if (mcap >= t.min) return t;
  return TIERS[4];
}

export function WhaleDistributionWidget({}: WhaleDistributionWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = CHART_HEIGHT_MAP[customization.chartHeight || 'normal'];

  const option = useMemo(() => {
    if (!data.markets?.length) return null;

    const tierStats = TIERS.map(() => ({ count: 0, totalMcap: 0, totalChange: 0 }));

    for (const coin of data.markets) {
      const tier = getTier(coin.market_cap || 0);
      const idx = TIERS.indexOf(tier);
      tierStats[idx].count += 1;
      tierStats[idx].totalMcap += coin.market_cap || 0;
      tierStats[idx].totalChange += coin.price_change_percentage_24h || 0;
    }

    const palette = themeColors.palette;
    const seriesData = TIERS.map((tier, i) => ({
      name: `${tier.emoji} ${tier.label}`,
      value: tierStats[i].totalMcap,
      count: tierStats[i].count,
      avgChange: tierStats[i].count > 0 ? tierStats[i].totalChange / tierStats[i].count : 0,
      itemStyle: { color: palette[i % palette.length] },
    })).filter((d) => d.value > 0);

    return {
      ...ECHARTS_THEME,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        formatter: (params: any) => {
          const d = params.data;
          const sign = d.avgChange >= 0 ? '+' : '';
          return `<b>${d.name}</b><br/>${d.count} coins<br/>Market Cap: ${formatCompact(d.value)}<br/>Avg 24h: ${sign}${d.avgChange.toFixed(2)}%`;
        },
      },
      legend: {
        bottom: 0,
        textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        itemWidth: 12,
        itemHeight: 12,
      },
      series: [
        {
          type: 'pie',
          roseType: 'area',
          center: ['50%', '45%'],
          radius: ['12%', '75%'],
          data: seriesData,
          label: {
            show: true,
            position: 'outside',
            color: 'rgba(255,255,255,0.7)',
            fontSize: 10,
            formatter: (p: any) => `${p.data.count} coins`,
          },
          labelLine: { lineStyle: { color: 'rgba(255,255,255,0.15)' } },
          itemStyle: { borderColor: '#0a0a0f', borderWidth: 2 },
          emphasis: { scaleSize: 8 },
          animationType: 'scale',
          animationEasing: 'elasticOut',
        },
      ],
    };
  }, [data.markets, themeColors]);

  if (!data.markets) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        Connect API key to load data
      </div>
    );
  }

  if (!option) return null;

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: chartHeight, width: '100%' }}
      opts={{ renderer: 'canvas' }}
      notMerge
    />
  );
}
