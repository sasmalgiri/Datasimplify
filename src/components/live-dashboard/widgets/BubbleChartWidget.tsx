'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { ScatterChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, CHART_HEIGHT_MAP, getThemeColors, formatCompact } from '@/lib/live-dashboard/theme';

echarts.use([ScatterChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface BubbleChartWidgetProps {
  limit?: number;
}

export function BubbleChartWidget({ limit = 30 }: BubbleChartWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { option, insight } = useMemo(() => {
    if (!data.markets) return { option: null, insight: '' };

    const coins = data.markets.slice(0, limit);

    // Normalize volume to bubble size (10–60 range)
    const volumes = coins.map((c) => c.total_volume);
    const maxVol = Math.max(...volumes);
    const minVol = Math.min(...volumes);
    const volRange = maxVol - minVol || 1;

    const seriesData = coins.map((c) => {
      const change = c.price_change_percentage_24h ?? 0;
      const normalizedSize = 10 + ((c.total_volume - minVol) / volRange) * 50;
      return {
        name: c.symbol.toUpperCase(),
        value: [
          c.market_cap,
          change,
          normalizedSize,
          c.current_price,
          c.total_volume,
        ],
        itemStyle: {
          color: change >= 0 ? themeColors.fill : 'rgba(239,68,68,0.6)',
          borderColor: change >= 0 ? themeColors.primary : '#ef4444',
          borderWidth: 1,
        },
        label: {
          show: true,
          formatter: c.symbol.toUpperCase(),
          position: 'top' as const,
          color: 'rgba(255,255,255,0.6)',
          fontSize: 9,
        },
      };
    });

    // Generate insight
    const gainers = coins.filter(c => (c.price_change_percentage_24h ?? 0) >= 0);
    const bestCoin = coins.reduce((best, c) => (c.price_change_percentage_24h ?? 0) > (best.price_change_percentage_24h ?? 0) ? c : best, coins[0]);
    const worstCoin = coins.reduce((worst, c) => (c.price_change_percentage_24h ?? 0) < (worst.price_change_percentage_24h ?? 0) ? c : worst, coins[0]);
    const insightText = `${gainers.length}/${coins.length} coins gaining · Best: ${bestCoin.symbol.toUpperCase()} (${(bestCoin.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}${(bestCoin.price_change_percentage_24h ?? 0).toFixed(1)}%) · Worst: ${worstCoin.symbol.toUpperCase()} (${(worstCoin.price_change_percentage_24h ?? 0).toFixed(1)}%)`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'item' as const,
        formatter: (params: any) => {
          const d = params.value;
          const changeColor = d[1] >= 0 ? themeColors.primary : '#ef4444';
          const changeSign = d[1] >= 0 ? '+' : '';
          return [
            `<strong>${params.name}</strong>`,
            `Price: $${d[3].toLocaleString(undefined, { maximumFractionDigits: 6 })}`,
            `Change 24h: <span style="color:${changeColor}">${changeSign}${d[1].toFixed(2)}%</span>`,
            `Market Cap: ${formatCompact(d[0])}`,
            `Volume: ${formatCompact(d[4])}`,
          ].join('<br/>');
        },
      },
      grid: {
        left: '8%',
        right: '5%',
        bottom: '12%',
        top: '8%',
        containLabel: true,
      },
      xAxis: {
        type: 'log' as const,
        name: 'Market Cap',
        nameLocation: 'center' as const,
        nameGap: 30,
        nameTextStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
        ...ECHARTS_THEME.xAxis,
        axisLabel: {
          ...ECHARTS_THEME.xAxis.axisLabel,
          formatter: (v: number) => formatCompact(v).replace('$', ''),
        },
      },
      yAxis: {
        type: 'value' as const,
        name: '24h Change %',
        nameLocation: 'center' as const,
        nameGap: 40,
        nameTextStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
        ...ECHARTS_THEME.yAxis,
        axisLabel: {
          ...ECHARTS_THEME.yAxis.axisLabel,
          formatter: (v: number) => `${v.toFixed(0)}%`,
        },
      },
      series: [
        {
          type: 'scatter' as const,
          data: seriesData,
          symbolSize: (val: number[]) => val[2],
          animationDelay: (idx: number) => idx * 20,
        },
      ],
      animationEasing: 'elasticOut' as const,
    } };
  }, [data.markets, limit, customization]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-[280px] text-gray-600 text-sm">
        No data available
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
      {insight && (
        <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>
      )}
    </div>
  );
}
