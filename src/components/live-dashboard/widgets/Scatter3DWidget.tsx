'use client';

import { useMemo, useEffect, useRef } from 'react';
import * as echarts from 'echarts/core';
import { TooltipComponent, VisualMapComponent, GridComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import 'echarts-gl';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP, formatCompact } from '@/lib/live-dashboard/theme';

echarts.use([TooltipComponent, VisualMapComponent, GridComponent, CanvasRenderer]);

interface Scatter3DWidgetProps {
  limit?: number;
}

export function Scatter3DWidget({ limit = 30 }: Scatter3DWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = Math.max(400, CHART_HEIGHT_MAP[customization.chartHeight || 'normal']);
  const chartRef = useRef<HTMLDivElement>(null);

  const option = useMemo(() => {
    if (!data.markets?.length) return null;

    const coins = data.markets.slice(0, limit);
    const scatterData = coins.map((coin, idx) => [
      Math.log10(Math.max(1, coin.market_cap || 1)),
      Math.log10(Math.max(1, coin.total_volume || 1)),
      coin.price_change_percentage_24h || 0,
      coin.name,
      coin.symbol.toUpperCase(),
      idx,
    ]);

    return {
      ...ECHARTS_THEME,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        formatter: (params: any) => {
          const d = params.data;
          const sign = d[2] >= 0 ? '+' : '';
          return `<b>${d[3]} (${d[4]})</b><br/>MCap: ${formatCompact(Math.pow(10, d[0]))}<br/>Vol: ${formatCompact(Math.pow(10, d[1]))}<br/>24h: ${sign}${d[2].toFixed(2)}%`;
        },
      },
      visualMap: {
        show: true,
        min: -15,
        max: 15,
        dimension: 2,
        inRange: { color: ['#ef4444', '#f59e0b', themeColors.primary] },
        textStyle: { color: 'rgba(255,255,255,0.5)' },
        right: 10,
        top: 10,
        text: ['+15%', '-15%'],
      },
      xAxis3D: {
        name: 'Market Cap',
        type: 'value',
        nameTextStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
        axisLabel: { show: false },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      },
      yAxis3D: {
        name: 'Volume',
        type: 'value',
        nameTextStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
        axisLabel: { show: false },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      },
      zAxis3D: {
        name: '24h Change %',
        type: 'value',
        nameTextStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
        axisLabel: { color: 'rgba(255,255,255,0.4)', fontSize: 9 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.04)' } },
      },
      grid3D: {
        viewControl: {
          autoRotate: true,
          autoRotateSpeed: 4,
          distance: 220,
          alpha: 25,
          beta: 40,
        },
        light: {
          main: { intensity: 1.2, shadow: false },
          ambient: { intensity: 0.3 },
        },
        boxWidth: 100,
        boxHeight: 80,
        boxDepth: 100,
        environment: 'none',
      },
      series: [
        {
          type: 'scatter3D',
          data: scatterData,
          symbolSize: (val: number[]) => Math.max(6, 22 - val[5] * 0.6),
          itemStyle: {
            opacity: 0.85,
            borderWidth: 1,
            borderColor: 'rgba(255,255,255,0.2)',
          },
          emphasis: {
            itemStyle: { opacity: 1 },
            label: {
              show: true,
              formatter: (p: any) => p.data[4],
              color: '#fff',
              fontSize: 10,
            },
          },
        },
      ],
    };
  }, [data.markets, limit, themeColors]);

  useEffect(() => {
    if (!chartRef.current || !option) return;

    const chart = echarts.init(chartRef.current);
    chart.setOption(option);

    const handleResize = () => chart.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.dispose();
    };
  }, [option]);

  if (!data.markets) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        Connect API key to load data
      </div>
    );
  }

  if (!option) return null;

  return <div ref={chartRef} style={{ height: chartHeight, width: '100%' }} />;
}
