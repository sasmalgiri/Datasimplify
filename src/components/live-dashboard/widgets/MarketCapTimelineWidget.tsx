'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, formatCompact, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([LineChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface MarketCapTimelineWidgetProps {
  coinId?: string;
  days?: number;
}

export function MarketCapTimelineWidget({ coinId = 'bitcoin', days = 90 }: MarketCapTimelineWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { option, insight } = useMemo(() => {
    let dates: string[] = [];
    let values: number[] = [];

    // Try coin_history data first
    if (data.coinHistory) {
      const history = data.coinHistory as any;
      const mcaps = history.market_caps;
      if (mcaps && Array.isArray(mcaps)) {
        dates = mcaps.map((d: [number, number]) =>
          new Date(d[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        );
        values = mcaps.map((d: [number, number]) => d[1]);
      }
    }

    // Fallback: use OHLC data as proxy
    if (values.length === 0) {
      const ohlcData = data.ohlc?.[coinId];
      if (ohlcData && ohlcData.length > 0) {
        const coin = data.markets?.find((c) => c.id === coinId);
        const supply = coin?.circulating_supply || 19_500_000;
        dates = ohlcData.map((d) =>
          new Date(d[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        );
        values = ohlcData.map((d) => d[4] * supply);
      }
    }

    if (values.length === 0) return { option: null, insight: null };

    const firstVal = values[0];
    const lastVal = values[values.length - 1];
    const peakVal = Math.max(...values);
    const change = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;
    const dir = change >= 0 ? 'grew' : 'shrank';
    const insightText = `Market cap ${dir} ${Math.abs(change).toFixed(2)}% over period · Current: ${formatCompact(lastVal)} · Peak: ${formatCompact(peakVal)}`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `${p.name}<br/>Market Cap: ${formatCompact(p.value)}`;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: dates,
        ...ECHARTS_THEME.xAxis,
        axisLabel: { ...ECHARTS_THEME.xAxis.axisLabel, fontSize: 9 },
        boundaryGap: false,
      },
      yAxis: {
        type: 'value' as const,
        ...ECHARTS_THEME.yAxis,
        axisLabel: {
          ...ECHARTS_THEME.yAxis.axisLabel,
          formatter: (v: number) => formatCompact(v).replace('$', ''),
        },
      },
      dataZoom: [{ type: 'inside' as const }],
      series: [{
        type: 'line' as const,
        data: values,
        smooth: customization.chartStyle === 'smooth',
        symbol: 'none',
        lineStyle: { color: themeColors.primary, width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: themeColors.fill },
            { offset: 1, color: 'rgba(0,0,0,0)' },
          ]),
        },
        animationDuration: 1500,
        animationEasing: 'cubicOut' as const,
      }],
    }};
  }, [data.coinHistory, data.ohlc, data.markets, coinId, customization]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No historical data available
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
