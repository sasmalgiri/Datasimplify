'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { GaugeChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME } from '@/lib/live-dashboard/theme';

echarts.use([GaugeChart, TooltipComponent, CanvasRenderer]);

interface AltseasonWidgetProps {
  topN?: number;
}

function getSeasonLabel(score: number): string {
  if (score <= 33) return 'Bitcoin Season';
  if (score <= 66) return 'Neutral';
  return 'Altseason';
}

function getSeasonColor(score: number): string {
  if (score <= 33) return '#ef4444';
  if (score <= 66) return '#eab308';
  return '#22c55e';
}

export function AltseasonWidget({ topN = 50 }: AltseasonWidgetProps) {
  const { data } = useLiveDashboardStore();

  const scoreData = useMemo(() => {
    if (!data.markets || !data.global?.market_cap_percentage) return null;

    const btcCoin = data.markets.find((c) => c.id === 'bitcoin');
    if (!btcCoin) return null;

    const btcChange = btcCoin.price_change_percentage_24h ?? 0;
    const topCoins = data.markets.slice(0, topN);
    const outperformers = topCoins.filter(
      (c) => c.id !== 'bitcoin' && (c.price_change_percentage_24h ?? 0) > btcChange
    );
    const altRatio = outperformers.length / (topN - 1);

    const btcDominance = data.global.market_cap_percentage.btc ?? 50;
    const domScore = btcDominance < 45 ? 30 : btcDominance < 50 ? 15 : 0;

    const score = Math.min(100, Math.round(altRatio * 70 + domScore));

    return { score, btcDominance, outperformers: outperformers.length, total: topN - 1 };
  }, [data.markets, data.global, topN]);

  const option = useMemo(() => {
    if (!scoreData) return null;

    const { score } = scoreData;

    return {
      ...ECHARTS_THEME,
      series: [
        {
          type: 'gauge' as const,
          startAngle: 200,
          endAngle: -20,
          min: 0,
          max: 100,
          splitNumber: 10,
          radius: '90%',
          center: ['50%', '55%'],
          axisLine: {
            lineStyle: {
              width: 16,
              color: [
                [0.33, '#ef4444'],
                [0.66, '#eab308'],
                [1, '#22c55e'],
              ],
            },
          },
          pointer: {
            icon: 'path://M12.8,0.7l12,40.1H0.7L12.8,0.7z',
            length: '55%',
            width: 8,
            offsetCenter: [0, '-10%'],
            itemStyle: {
              color: 'auto',
            },
          },
          axisTick: {
            length: 6,
            lineStyle: {
              color: 'auto',
              width: 1,
            },
          },
          splitLine: {
            length: 12,
            lineStyle: {
              color: 'auto',
              width: 2,
            },
          },
          axisLabel: {
            distance: 20,
            color: 'rgba(255,255,255,0.35)',
            fontSize: 10,
            formatter: (value: number) => {
              if (value === 0) return '0';
              if (value === 50) return '50';
              if (value === 100) return '100';
              return '';
            },
          },
          title: {
            show: false,
          },
          detail: {
            valueAnimation: true,
            formatter: '{value}',
            color: getSeasonColor(score),
            fontSize: 32,
            fontWeight: 'bold' as const,
            offsetCenter: [0, '20%'],
          },
          data: [
            {
              value: score,
            },
          ],
        },
      ],
    };
  }, [scoreData]);

  if (!scoreData || !option) {
    return (
      <div className="flex items-center justify-center h-[280px] text-gray-600 text-sm">
        No data available
      </div>
    );
  }

  const { score, btcDominance, outperformers, total } = scoreData;
  const label = getSeasonLabel(score);
  const labelColor = getSeasonColor(score);

  return (
    <div className="flex flex-col items-center">
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: '220px', width: '100%' }}
        notMerge
        lazyUpdate
      />
      <span className="text-lg font-semibold -mt-2" style={{ color: labelColor }}>
        {label}
      </span>
      <div className="flex gap-4 mt-2 text-xs text-gray-500">
        <span>BTC Dom: {btcDominance.toFixed(1)}%</span>
        <span>Outperformers: {outperformers}/{total}</span>
      </div>
    </div>
  );
}
