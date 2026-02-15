'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP, formatCompact } from '@/lib/live-dashboard/theme';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

interface ComposedChartWidgetProps {
  limit?: number;
}

export function ComposedChartWidget({ limit = 15 }: ComposedChartWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = CHART_HEIGHT_MAP[customization.chartHeight];

  const { option, insight } = useMemo(() => {
    if (!data.markets?.length) return { option: null, insight: '' };

    const coins = data.markets.slice(0, limit);
    const labels = coins.map((c) => c.symbol.toUpperCase());

    const volumeData = coins.map((c) => c.total_volume);
    const changeData = coins.map((c) => c.price_change_percentage_24h || 0);
    const mcapData = coins.map((c) => c.market_cap);

    // Find coins where high volume + positive change (strong signal)
    const strongSignals = coins.filter((c, i) => changeData[i] > 1 && volumeData[i] > volumeData[0] * 0.1);
    const insightText = strongSignals.length > 0
      ? `Strong signals: ${strongSignals.map(c => c.symbol.toUpperCase()).join(', ')} — rising price backed by high volume`
      : 'No strong volume-backed moves detected right now';

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      grid: { left: '3%', right: '8%', bottom: '15%', top: '15%', containLabel: true },
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
          const idx = params[0]?.dataIndex;
          if (idx == null) return '';
          const coin = coins[idx];
          const sign = (coin.price_change_percentage_24h || 0) >= 0 ? '+' : '';
          return `<b>${coin.name} (${coin.symbol.toUpperCase()})</b><br/>Volume: ${formatCompact(coin.total_volume)}<br/>MCap: ${formatCompact(coin.market_cap)}<br/>24h: ${sign}${(coin.price_change_percentage_24h || 0).toFixed(2)}%`;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: labels,
        ...ECHARTS_THEME.xAxis,
        axisLabel: { ...ECHARTS_THEME.xAxis.axisLabel, rotate: 30 },
      },
      yAxis: [
        {
          type: 'value' as const,
          name: 'Volume',
          ...ECHARTS_THEME.yAxis,
          axisLabel: {
            ...ECHARTS_THEME.yAxis.axisLabel,
            formatter: (v: number) => {
              if (v >= 1e9) return `${(v / 1e9).toFixed(0)}B`;
              if (v >= 1e6) return `${(v / 1e6).toFixed(0)}M`;
              return String(v);
            },
          },
        },
        {
          type: 'value' as const,
          name: '24h %',
          ...ECHARTS_THEME.yAxis,
          axisLabel: {
            ...ECHARTS_THEME.yAxis.axisLabel,
            formatter: (v: number) => `${v.toFixed(0)}%`,
          },
        },
      ],
      dataZoom: [{ type: 'inside' as const, start: 0, end: 100 }],
      series: [
        {
          name: 'Volume',
          type: 'bar',
          data: volumeData.map((v, i) => ({
            value: v,
            itemStyle: {
              color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: themeColors.palette[0] },
                { offset: 1, color: 'transparent' },
              ]),
            },
          })),
          barWidth: '50%',
          opacity: 0.7,
        },
        {
          name: '24h Change',
          type: 'line',
          yAxisIndex: 1,
          data: changeData,
          smooth: customization.chartStyle === 'smooth',
          lineStyle: { width: 2.5, color: '#f59e0b' },
          itemStyle: { color: '#f59e0b' },
          symbolSize: 6,
          areaStyle: {
            opacity: 0.1,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#f59e0b' },
              { offset: 1, color: 'transparent' },
            ]),
          },
        },
      ],
    } };
  }, [data.markets, limit, themeColors, customization]);

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
