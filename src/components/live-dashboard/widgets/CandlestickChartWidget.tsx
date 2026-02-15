'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { CandlestickChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([CandlestickChart, BarChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface CandlestickChartWidgetProps {
  coinId?: string;
  days?: number;
}

export function CandlestickChartWidget({ coinId = 'bitcoin', days = 30 }: CandlestickChartWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const ohlcData = data.ohlc?.[coinId];

  const { option, insight } = useMemo(() => {
    if (!ohlcData || ohlcData.length === 0) return { option: null, insight: null };

    // OHLC format from CoinGecko: [timestamp, open, high, low, close]
    const dates = ohlcData.map((d) => {
      const dt = new Date(d[0]);
      return `${dt.getMonth() + 1}/${dt.getDate()}`;
    });
    const values = ohlcData.map((d) => [d[1], d[4], d[3], d[2]]); // [open, close, low, high]
    const volumes = ohlcData.map((d) => {
      const isUp = d[4] >= d[1];
      return { value: Math.abs(d[4] - d[1]) * 1000, itemStyle: { color: isUp ? themeColors.fill : 'rgba(239,68,68,0.3)' } };
    });

    const bullish = ohlcData.filter((d) => d[4] >= d[1]).length;
    const periodHigh = Math.max(...ohlcData.map((d) => d[2]));
    const periodLow = Math.min(...ohlcData.map((d) => d[3]));
    const lastClose = ohlcData[ohlcData.length - 1][4];
    const insightText = `${bullish}/${ohlcData.length} candles bullish · Last close: $${lastClose.toLocaleString()} · Range: $${periodLow.toLocaleString()}–$${periodHigh.toLocaleString()}`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      grid: [
        { left: '8%', right: '3%', top: '5%', bottom: '30%' },
        { left: '8%', right: '3%', top: '75%', bottom: '5%' },
      ],
      xAxis: [
        {
          type: 'category' as const,
          data: dates,
          ...ECHARTS_THEME.xAxis,
          boundaryGap: true,
          gridIndex: 0,
        },
        {
          type: 'category' as const,
          data: dates,
          ...ECHARTS_THEME.xAxis,
          gridIndex: 1,
          axisLabel: { show: false },
        },
      ],
      yAxis: [
        {
          type: 'value' as const,
          ...ECHARTS_THEME.yAxis,
          scale: true,
          gridIndex: 0,
          axisLabel: {
            ...ECHARTS_THEME.yAxis.axisLabel,
            formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0),
          },
        },
        {
          type: 'value' as const,
          ...ECHARTS_THEME.yAxis,
          gridIndex: 1,
          axisLabel: { show: false },
          splitLine: { show: false },
        },
      ],
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'cross' as const },
      },
      dataZoom: [
        {
          type: 'inside' as const,
          xAxisIndex: [0, 1],
          start: 0,
          end: 100,
        },
      ],
      series: [
        {
          name: 'OHLC',
          type: 'candlestick' as const,
          data: values,
          xAxisIndex: 0,
          yAxisIndex: 0,
          itemStyle: {
            color: themeColors.primary,
            color0: '#ef4444',
            borderColor: themeColors.primary,
            borderColor0: '#ef4444',
          },
        },
        {
          name: 'Volume',
          type: 'bar' as const,
          data: volumes,
          xAxisIndex: 1,
          yAxisIndex: 1,
        },
      ],
    }};
  }, [ohlcData, customization]);

  if (!ohlcData || !option) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600 text-sm">
        No OHLC data available
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
