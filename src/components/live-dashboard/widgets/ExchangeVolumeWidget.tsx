'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, formatCompact, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([BarChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

export function ExchangeVolumeWidget() {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const option = useMemo(() => {
    // Try derivatives exchanges, then regular exchanges
    const rawExchanges = (data.derivativesExchanges && data.derivativesExchanges.length > 0)
      ? data.derivativesExchanges
      : data.exchanges;

    if (rawExchanges && Array.isArray(rawExchanges) && rawExchanges.length > 0) {
      const exchanges = rawExchanges
        .filter((e: any) => e.trade_volume_24h_btc != null || e.open_interest_btc != null)
        .slice(0, 15);

      if (exchanges.length > 0) {
        const names = exchanges.map((e: any) =>
          e.name?.length > 14 ? e.name.slice(0, 14) + '..' : e.name,
        );
        const volumes = exchanges.map((e: any) => Number(e.trade_volume_24h_btc) || e.open_interest_btc || 0);

        return {
          ...ECHARTS_THEME,
          animation: customization.showAnimations,
          tooltip: {
            ...ECHARTS_THEME.tooltip,
            trigger: 'axis' as const,
            axisPointer: { type: 'shadow' as const },
            formatter: (params: any) => {
              const p = Array.isArray(params) ? params[0] : params;
              return `<strong>${exchanges[p.dataIndex]?.name || p.name}</strong><br/>Volume: ${(p.value as number).toLocaleString()} BTC`;
            },
          },
          xAxis: {
            type: 'category' as const,
            data: names,
            ...ECHARTS_THEME.xAxis,
            axisLabel: { ...ECHARTS_THEME.xAxis.axisLabel, rotate: 30, fontSize: 9 },
          },
          yAxis: {
            type: 'value' as const,
            ...ECHARTS_THEME.yAxis,
            axisLabel: {
              ...ECHARTS_THEME.yAxis.axisLabel,
              formatter: (v: number) => `${(v / 1000).toFixed(0)}K`,
            },
          },
          dataZoom: [{ type: 'inside' as const }],
          series: [{
            type: 'bar' as const,
            data: volumes,
            barMaxWidth: 28,
            itemStyle: {
              borderRadius: [4, 4, 0, 0],
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: themeColors.primary },
                { offset: 1, color: themeColors.fill },
              ]),
            },
            animationDelay: (idx: number) => idx * 40,
          }],
          animationEasing: 'cubicOut' as const,
        };
      }
    }

    // Fallback: use coin volume from markets
    if (!data.markets) return null;

    const coins = data.markets.slice(0, 12);
    const names = coins.map((c) => c.symbol.toUpperCase());
    const volumes = coins.map((c) => c.total_volume);

    return {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (params: any) => {
          const p = Array.isArray(params) ? params[0] : params;
          return `<strong>${p.name}</strong><br/>Volume: ${formatCompact(p.value)}`;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: names,
        ...ECHARTS_THEME.xAxis,
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
        type: 'bar' as const,
        data: volumes,
        barMaxWidth: 28,
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: themeColors.primary },
            { offset: 1, color: themeColors.fill },
          ]),
        },
        animationDelay: (idx: number) => idx * 40,
      }],
      animationEasing: 'cubicOut' as const,
    };
  }, [data.exchanges, data.derivativesExchanges, data.markets, customization]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No exchange data available
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
