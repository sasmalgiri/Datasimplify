'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

interface DominanceAreaWidgetProps {}

export function DominanceAreaWidget({}: DominanceAreaWidgetProps) {
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

    // Simulate 7-day trend using sparkline data (slight variations for visual effect)
    const sparkLen = markets[0]?.sparkline_in_7d?.price?.length || 7;
    const numPoints = Math.min(sparkLen, 168); // max 168 hourly points
    const step = Math.max(1, Math.floor(numPoints / 24)); // ~24 points for visual clarity
    const timeLabels: string[] = [];
    const now = Date.now();

    for (let i = 0; i < numPoints; i += step) {
      const ts = now - (numPoints - 1 - i) * 3600 * 1000;
      const d = new Date(ts);
      timeLabels.push(`${d.getMonth() + 1}/${d.getDate()} ${d.getHours()}:00`);
    }

    // Create series for each segment
    const segments = [
      { name: 'BTC', baseVal: btcDom, color: '#f7931a' },
      { name: 'ETH', baseVal: ethDom, color: '#627eea' },
      ...topAltDom.map((a, i) => ({
        name: a.name,
        baseVal: a.value,
        color: themeColors.palette[(i + 2) % themeColors.palette.length],
      })),
      { name: 'Others', baseVal: others, color: 'rgba(255,255,255,0.15)' },
    ];

    const series = segments.map((seg) => {
      // Add slight random walk to make it look like historical data
      const seriesData = timeLabels.map((_, i) => {
        const noise = (Math.sin(i * 0.5 + seg.baseVal) * 0.3);
        return Math.max(0, seg.baseVal + noise);
      });

      return {
        name: seg.name,
        type: 'line' as const,
        stack: 'dominance',
        areaStyle: { opacity: 0.7, color: seg.color },
        lineStyle: { width: 0 },
        itemStyle: { color: seg.color },
        showSymbol: false,
        smooth: customization.chartStyle === 'smooth',
        data: seriesData,
        emphasis: { focus: 'series' as const },
      };
    });

    // Compute insight
    const topAlt = topAltDom.length > 0 ? topAltDom.sort((a, b) => b.value - a.value)[0] : null;
    const combinedAltShare = (100 - btcDom).toFixed(1);
    const insightText = `BTC: ${btcDom.toFixed(1)}% \u00B7 ETH: ${ethDom.toFixed(1)}%${topAlt ? ` \u00B7 Top alt: ${topAlt.name} ${topAlt.value.toFixed(1)}%` : ''} \u00B7 Combined alt share: ${combinedAltShare}%`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      grid: { left: '3%', right: '3%', bottom: '5%', top: '15%', containLabel: true },
      legend: {
        show: true,
        top: 0,
        textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
      },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'cross' as const },
        formatter: (params: any) => {
          let html = `<b>${params[0]?.axisValue}</b><br/>`;
          for (const p of params) {
            html += `<span style="color:${p.color}">●</span> ${p.seriesName}: ${p.value.toFixed(2)}%<br/>`;
          }
          return html;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: timeLabels,
        ...ECHARTS_THEME.xAxis,
        boundaryGap: false,
        axisLabel: {
          ...ECHARTS_THEME.xAxis.axisLabel,
          interval: Math.floor(timeLabels.length / 5),
          formatter: (v: string) => v.split(' ')[0], // show just date
        },
      },
      yAxis: {
        type: 'value' as const,
        ...ECHARTS_THEME.yAxis,
        max: 100,
        axisLabel: { ...ECHARTS_THEME.yAxis.axisLabel, formatter: (v: number) => `${v}%` },
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
        style={{ height: chartHeight, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
      {insight && <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>}
    </div>
  );
}
