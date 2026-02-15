'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { FunnelChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP, formatCompact } from '@/lib/live-dashboard/theme';

echarts.use([FunnelChart, TooltipComponent, CanvasRenderer]);

interface FunnelWidgetProps {
  limit?: number;
}

export function FunnelWidget({ limit = 10 }: FunnelWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = CHART_HEIGHT_MAP[customization.chartHeight];

  const option = useMemo(() => {
    if (!data.markets?.length) return null;

    const coins = data.markets.slice(0, limit);
    const palette = themeColors.palette;

    const funnelData = coins.map((coin, i) => ({
      name: coin.symbol.toUpperCase(),
      value: coin.market_cap,
      coinName: coin.name,
      price: coin.current_price,
      change: coin.price_change_percentage_24h || 0,
      itemStyle: { color: palette[i % palette.length] },
    }));

    return {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        formatter: (params: any) => {
          const d = params.data;
          const sign = d.change >= 0 ? '+' : '';
          return `<b>${d.coinName} (${d.name})</b><br/>Market Cap: ${formatCompact(d.value)}<br/>Price: $${d.price?.toLocaleString()}<br/>24h: ${sign}${d.change.toFixed(2)}%`;
        },
      },
      series: [
        {
          type: 'funnel',
          left: '12%',
          width: '76%',
          top: '5%',
          bottom: '5%',
          sort: 'descending',
          gap: 3,
          data: funnelData,
          label: {
            show: true,
            position: 'inside',
            color: '#fff',
            fontSize: 11,
            fontWeight: 'bold',
            formatter: (p: any) => `${p.name}\n${formatCompact(p.value)}`,
          },
          labelLine: { show: false },
          itemStyle: { borderColor: '#0a0a0f', borderWidth: 1 },
          emphasis: {
            label: { fontSize: 13 },
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' },
          },
        },
      ],
    };
  }, [data.markets, limit, themeColors]);

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
