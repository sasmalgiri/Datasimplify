'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { HeatmapChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, VisualMapComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([HeatmapChart, GridComponent, TooltipComponent, VisualMapComponent, CanvasRenderer]);

interface CorrelationWidgetProps {
  coinIds?: string[];
}

export function CorrelationWidget({ coinIds }: CorrelationWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const option = useMemo(() => {
    // Use sparkline data from markets as a proxy for correlation
    if (!data.markets) return null;

    const coins = coinIds
      ? data.markets.filter((c) => coinIds.includes(c.id))
      : data.markets.filter((c) => c.sparkline_in_7d?.price?.length).slice(0, 8);

    if (coins.length < 2) return null;

    const symbols = coins.map((c) => c.symbol.toUpperCase());

    // Calculate Pearson correlation from sparkline data
    const correlations: number[][] = [];
    for (let i = 0; i < coins.length; i++) {
      correlations[i] = [];
      for (let j = 0; j < coins.length; j++) {
        if (i === j) {
          correlations[i][j] = 1;
        } else {
          const a = coins[i].sparkline_in_7d?.price || [];
          const b = coins[j].sparkline_in_7d?.price || [];
          correlations[i][j] = pearsonCorrelation(a, b);
        }
      }
    }

    const heatmapData: [number, number, number][] = [];
    for (let i = 0; i < symbols.length; i++) {
      for (let j = 0; j < symbols.length; j++) {
        heatmapData.push([j, i, parseFloat(correlations[i][j].toFixed(2))]);
      }
    }

    return {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      grid: { left: '15%', right: '5%', top: '5%', bottom: '15%' },
      xAxis: {
        type: 'category' as const,
        data: symbols,
        splitArea: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10, rotate: 45 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      yAxis: {
        type: 'category' as const,
        data: symbols,
        splitArea: { show: false },
        axisLabel: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
        axisLine: { show: false },
        axisTick: { show: false },
      },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        formatter: (p: any) => {
          return `${symbols[p.data[1]]} vs ${symbols[p.data[0]]}: <strong>${p.data[2]}</strong>`;
        },
      },
      visualMap: {
        min: -1,
        max: 1,
        inRange: {
          color: ['#ef4444', '#1f1f2e', themeColors.primary],
        },
        textStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
        show: false,
      },
      series: [
        {
          type: 'heatmap' as const,
          data: heatmapData,
          label: {
            show: true,
            color: '#fff',
            fontSize: 10,
            formatter: (p: any) => p.data[2].toFixed(2),
          },
          itemStyle: {
            borderColor: 'rgba(10,10,15,1)',
            borderWidth: 2,
            borderRadius: 4,
          },
        },
      ],
    };
  }, [data.markets, coinIds, customization]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        Insufficient data for correlation matrix
      </div>
    );
  }

  return (
    <ReactEChartsCore
      echarts={echarts}
      option={option}
      style={{ height: `${CHART_HEIGHT_MAP[customization.chartHeight]}px`, width: '100%' }}
      notMerge
      lazyUpdate
    />
  );
}

function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 5) return 0;

  let sumA = 0, sumB = 0, sumAB = 0, sumA2 = 0, sumB2 = 0;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
    sumAB += a[i] * b[i];
    sumA2 += a[i] * a[i];
    sumB2 += b[i] * b[i];
  }

  const numerator = n * sumAB - sumA * sumB;
  const denominator = Math.sqrt((n * sumA2 - sumA * sumA) * (n * sumB2 - sumB * sumB));

  if (denominator === 0) return 0;
  return numerator / denominator;
}
