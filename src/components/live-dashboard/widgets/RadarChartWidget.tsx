'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { RadarChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, CHART_COLORS } from '@/lib/live-dashboard/theme';

echarts.use([RadarChart, TooltipComponent, LegendComponent, CanvasRenderer]);

interface RadarChartWidgetProps {
  coinIds?: string[];
}

export function RadarChartWidget({ coinIds }: RadarChartWidgetProps) {
  const { data } = useLiveDashboardStore();

  const option = useMemo(() => {
    if (!data.markets) return null;

    const selectedCoins = coinIds
      ? data.markets.filter((c) => coinIds.includes(c.id))
      : data.markets.slice(0, 5);

    if (selectedCoins.length === 0) return null;

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
      lineStyle: { color: CHART_COLORS[idx % CHART_COLORS.length], width: 2 },
      itemStyle: { color: CHART_COLORS[idx % CHART_COLORS.length] },
      areaStyle: { color: CHART_COLORS[idx % CHART_COLORS.length], opacity: 0.08 },
    }));

    return {
      ...ECHARTS_THEME,
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
    };
  }, [data.markets, coinIds]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No data for radar chart
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: '280px', width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
}
