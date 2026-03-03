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

export function DominanceAreaWidget() {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = CHART_HEIGHT_MAP[customization.chartHeight];

  const { option, insight } = useMemo(() => {
    const global = data.global;
    const markets = data.markets;
    if (!global?.market_cap_percentage || !markets?.length) return { option: null, insight: null };

    // Build dominance breakdown from global data
    const btcDom = global.market_cap_percentage.btc || 0;
    const ethDom = global.market_cap_percentage.eth || 0;

    // Get top altcoins (excluding BTC/ETH) by market cap
    const altcoins = markets.filter((c) => c.id !== 'bitcoin' && c.id !== 'ethereum');
    const totalMcap = global.total_market_cap?.usd || markets.reduce((s, c) => s + (c.market_cap || 0), 0);

    // Top 5 altcoins by market cap
    const topAlts = altcoins.slice(0, 5);
    const topAltDom = topAlts.map((c) => ({
      name: c.symbol.toUpperCase(),
      value: totalMcap > 0 ? (c.market_cap / totalMcap) * 100 : 0,
    }));

    const topAltTotal = topAltDom.reduce((s, a) => s + a.value, 0);
    const others = Math.max(0, 100 - btcDom - ethDom - topAltTotal);

    // Build segments for horizontal stacked bar
    const segments = [
      { name: 'BTC', value: btcDom, color: '#f7931a' },
      { name: 'ETH', value: ethDom, color: '#627eea' },
      ...topAltDom.map((a, i) => ({
        name: a.name,
        value: a.value,
        color: themeColors.palette[(i + 2) % themeColors.palette.length],
      })),
      { name: 'Others', value: others, color: 'rgba(255,255,255,0.15)' },
    ];

    // Each segment becomes its own bar series stacked on the same row
    const series = segments.map((seg) => ({
      name: seg.name,
      type: 'bar' as const,
      stack: 'dominance',
      barWidth: '60%',
      data: [seg.value],
      itemStyle: {
        color: seg.color,
        borderRadius: 0,
      },
      emphasis: {
        itemStyle: { opacity: 0.9 },
      },
      label: {
        show: seg.value >= 4, // only label segments large enough to fit text
        position: 'inside' as const,
        formatter: `${seg.name}\n${seg.value.toFixed(1)}%`,
        fontSize: 10,
        color: '#fff',
        fontWeight: 'bold' as const,
        lineHeight: 14,
      },
    }));

    // Compute insight
    const topAlt = topAltDom.length > 0 ? [...topAltDom].sort((a, b) => b.value - a.value)[0] : null;
    const combinedAltShare = (100 - btcDom).toFixed(1);
    const insightText = `BTC: ${btcDom.toFixed(1)}% \u00B7 ETH: ${ethDom.toFixed(1)}%${topAlt ? ` \u00B7 Top alt: ${topAlt.name} ${topAlt.value.toFixed(1)}%` : ''} \u00B7 Combined alt share: ${combinedAltShare}%`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      grid: { left: '3%', right: '3%', bottom: '3%', top: '40px', containLabel: true },
      legend: {
        show: true,
        top: 0,
        textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
      },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'item' as const,
        formatter: (params: any) => {
          return `<span style="color:${params.color}">\u25CF</span> ${params.seriesName}: ${Number(params.value).toFixed(2)}%`;
        },
      },
      xAxis: {
        type: 'value' as const,
        max: 100,
        show: false,
      },
      yAxis: {
        type: 'category' as const,
        data: ['Market Dominance'],
        show: false,
      },
      series,
    }};
  }, [data.global, data.markets, themeColors, customization]);

  if (!data.global) {
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
        style={{ height: Math.max(120, chartHeight * 0.5), width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
      <p className="text-[10px] text-gray-400 mt-1 text-center">
        Current market dominance snapshot
      </p>
      {insight && <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>}
    </div>
  );
}
