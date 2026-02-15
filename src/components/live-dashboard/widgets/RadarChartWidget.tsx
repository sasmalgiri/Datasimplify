'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, CHART_COLORS, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([RadarChart, TooltipComponent, LegendComponent, CanvasRenderer]);

interface RadarChartWidgetProps {
  coinIds?: string[];
}

export function RadarChartWidget({ coinIds }: RadarChartWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { option, insight } = useMemo(() => {
    if (!data.markets) return { option: null, insight: null };

    const selectedCoins = coinIds
      ? data.markets.filter((c) => coinIds.includes(c.id))
      : data.markets.slice(0, 5);

    if (selectedCoins.length === 0) return { option: null, insight: null };

    const maxMcap = Math.max(...selectedCoins.map((c) => c.market_cap));
    const maxVol = Math.max(...selectedCoins.map((c) => c.total_volume));
    const maxAbsChange = Math.max(...selectedCoins.map((c) => Math.abs(c.price_change_percentage_24h || 0)));
    const maxAthDiff = Math.max(...selectedCoins.map((c) => Math.abs(c.ath_change_percentage || 0)));

    const indicators = [
      { name: 'Market Cap', max: 100 },
      { name: 'Volume', max: 100 },
      { name: '24h Change', max: 100 },
      { name: 'ATH Proximity', max: 100 },
      { name: 'Rank Score', max: 100 },
    ];

    const seriesData = selectedCoins.map((coin, idx) => ({
      name: coin.symbol.toUpperCase(),
      value: [
        maxMcap ? Math.round((coin.market_cap / maxMcap) * 100) : 0,
        maxVol ? Math.round((coin.total_volume / maxVol) * 100) : 0,
        maxAbsChange ? Math.round((Math.abs(coin.price_change_percentage_24h || 0) / maxAbsChange) * 100) : 0,
        maxAthDiff ? Math.round((100 - Math.abs(coin.ath_change_percentage || 0)) / 100 * 100) : 50,
        Math.max(0, 100 - (coin.market_cap_rank - 1) * 10),
      ],
      lineStyle: { color: themeColors.palette[idx % themeColors.palette.length], width: 2 },
      itemStyle: { color: themeColors.palette[idx % themeColors.palette.length] },
      areaStyle: { color: themeColors.palette[idx % themeColors.palette.length], opacity: 0.08 },
    }));

    // Compute insight: most balanced, strongest MCap, strongest Volume
    const coinScores = seriesData.map((s) => {
      const vals = s.value;
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((a, v) => a + (v - avg) ** 2, 0) / vals.length;
      return { name: s.name, avg, variance, mcap: vals[0], volume: vals[1] };
    });
    const mostBalanced = [...coinScores].sort((a, b) => a.variance - b.variance)[0];
    const strongestMcap = [...coinScores].sort((a, b) => b.mcap - a.mcap)[0];
    const strongestVol = [...coinScores].sort((a, b) => b.volume - a.volume)[0];
    const insightText = coinScores.length >= 2
      ? `Most balanced: ${mostBalanced.name} · Strongest MCap: ${strongestMcap.name} · Strongest Volume: ${strongestVol.name}`
      : coinScores.length === 1
        ? `${coinScores[0].name} — avg score: ${coinScores[0].avg.toFixed(0)}/100`
        : '';

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      legend: {
        show: true,
        bottom: 0,
        textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 11 },
      },
      tooltip: { ...ECHARTS_THEME.tooltip },
      radar: {
        indicator: indicators,
        shape: 'polygon' as const,
        splitNumber: 4,
        axisName: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
        splitArea: { show: false },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.06)' } },
      },
      series: [{
        type: 'radar' as const,
        data: seriesData,
        symbol: 'circle',
        symbolSize: 4,
        animationDuration: 1200,
      }],
    }};
  }, [data.markets, coinIds, customization]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No data for radar chart
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
