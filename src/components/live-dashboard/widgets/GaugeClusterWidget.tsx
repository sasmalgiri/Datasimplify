'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([GaugeChart, TooltipComponent, CanvasRenderer]);

interface GaugeClusterWidgetProps {}

function makeGauge(
  center: [string, string],
  value: number,
  name: string,
  primary: string,
): any {
  return {
    type: 'gauge',
    center,
    radius: '68%',
    min: 0,
    max: 100,
    startAngle: 210,
    endAngle: -30,
    axisLine: {
      lineStyle: {
        width: 12,
        color: [
          [0.3, '#ef4444'],
          [0.7, '#f59e0b'],
          [1, primary],
        ],
      },
    },
    pointer: {
      length: '55%',
      width: 4,
      itemStyle: { color: '#fff' },
    },
    axisTick: { show: false },
    splitLine: {
      length: 8,
      distance: 2,
      lineStyle: { color: 'rgba(255,255,255,0.15)', width: 1 },
    },
    axisLabel: { show: false },
    detail: {
      formatter: '{value}',
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
      offsetCenter: [0, '65%'],
    },
    title: {
      show: true,
      offsetCenter: [0, '88%'],
      color: 'rgba(255,255,255,0.5)',
      fontSize: 11,
    },
    data: [{ value: Math.round(value), name }],
  };
}

export function GaugeClusterWidget({}: GaugeClusterWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = CHART_HEIGHT_MAP[customization.chartHeight || 'normal'];

  const { option, insight } = useMemo(() => {
    const markets = data.markets;
    const global = data.global;
    if (!markets?.length) return { option: null, insight: '' };

    const top50 = markets.slice(0, 50);

    // Momentum: % of top 50 with positive 24h change
    const positive = top50.filter((c) => (c.price_change_percentage_24h || 0) > 0).length;
    const momentum = (positive / top50.length) * 100;

    // Volatility: average absolute 24h change × 10 (clamped to 100)
    const avgAbs =
      top50.reduce((s, c) => s + Math.abs(c.price_change_percentage_24h || 0), 0) / top50.length;
    const volatility = Math.min(100, avgAbs * 10);

    // Volume Strength: (24h vol / total mcap) × 1000 (clamped to 100)
    const totalVol = global?.total_volume?.usd || markets.reduce((s, c) => s + (c.total_volume || 0), 0);
    const totalMcap = global?.total_market_cap?.usd || markets.reduce((s, c) => s + (c.market_cap || 0), 0);
    const volStrength = totalMcap > 0 ? Math.min(100, (totalVol / totalMcap) * 1000) : 0;

    const mRound = Math.round(momentum);
    const vRound = Math.round(volatility);
    const vsRound = Math.round(volStrength);
    const rating = (mRound >= 60 && vRound < 60 && vsRound >= 40) ? 'Healthy market — bullish momentum with moderate volatility'
      : (mRound < 40) ? 'Weak momentum — most coins declining, caution advised'
      : (vRound >= 70) ? 'High volatility — market is swinging, expect large moves'
      : 'Mixed signals — monitor closely for direction';

    return {
      option: {
        ...ECHARTS_THEME,
        series: [
          makeGauge(['17%', '55%'], momentum, 'Momentum', themeColors.primary),
          makeGauge(['50%', '55%'], volatility, 'Volatility', themeColors.primary),
          makeGauge(['83%', '55%'], volStrength, 'Volume', themeColors.primary),
        ],
      },
      insight: rating,
    };
  }, [data.markets, data.global, themeColors]);

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
      {insight && (
        <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>
      )}
    </div>
  );
}
