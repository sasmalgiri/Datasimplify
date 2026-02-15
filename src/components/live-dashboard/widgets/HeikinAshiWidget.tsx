'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { CandlestickChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([CandlestickChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface HeikinAshiWidgetProps {
  coinId?: string;
}

export function HeikinAshiWidget({ coinId = 'bitcoin' }: HeikinAshiWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = CHART_HEIGHT_MAP[customization.chartHeight || 'normal'];
  const ohlcData = data.ohlc?.[coinId];

  const option = useMemo(() => {
    if (!ohlcData || ohlcData.length === 0) return null;

    // Convert OHLC to Heikin-Ashi
    // HA Close = (O + H + L + C) / 4
    // HA Open[0] = (O + C) / 2, HA Open[n] = (HA Open[n-1] + HA Close[n-1]) / 2
    // HA High = max(H, HA Open, HA Close)
    // HA Low = min(L, HA Open, HA Close)

    const ha: { date: string; open: number; close: number; low: number; high: number }[] = [];

    for (let i = 0; i < ohlcData.length; i++) {
      const [ts, o, h, l, c] = ohlcData[i];
      const haClose = (o + h + l + c) / 4;
      const haOpen = i === 0
        ? (o + c) / 2
        : (ha[i - 1].open + ha[i - 1].close) / 2;
      const haHigh = Math.max(h, haOpen, haClose);
      const haLow = Math.min(l, haOpen, haClose);

      const dt = new Date(ts);
      ha.push({
        date: `${dt.getMonth() + 1}/${dt.getDate()}`,
        open: haOpen,
        close: haClose,
        low: haLow,
        high: haHigh,
      });
    }

    const dates = ha.map((d) => d.date);
    const values = ha.map((d) => [d.open, d.close, d.low, d.high]);

    return {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      grid: { left: '8%', right: '3%', bottom: '15%', top: '5%' },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'cross' as const },
        formatter: (params: any) => {
          const p = params[0];
          if (!p) return '';
          const d = p.data;
          return `<b>${p.axisValue}</b><br/>Open: $${d[1].toFixed(2)}<br/>Close: $${d[2].toFixed(2)}<br/>Low: $${d[3].toFixed(2)}<br/>High: $${d[4].toFixed(2)}`;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: dates,
        ...ECHARTS_THEME.xAxis,
        boundaryGap: true,
      },
      yAxis: {
        type: 'value' as const,
        ...ECHARTS_THEME.yAxis,
        scale: true,
        axisLabel: {
          ...ECHARTS_THEME.yAxis.axisLabel,
          formatter: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v.toFixed(0),
        },
      },
      dataZoom: [
        { type: 'inside' as const, start: 0, end: 100 },
        {
          type: 'slider' as const,
          start: 0,
          end: 100,
          height: 20,
          bottom: 5,
          borderColor: 'transparent',
          backgroundColor: 'rgba(255,255,255,0.02)',
          fillerColor: themeColors.fill,
          handleStyle: { color: themeColors.primary, borderColor: themeColors.primary },
          textStyle: { color: 'rgba(255,255,255,0.3)', fontSize: 9 },
        },
      ],
      series: [
        {
          type: 'candlestick' as const,
          data: values,
          itemStyle: {
            color: themeColors.primary,
            color0: '#ef4444',
            borderColor: themeColors.primary,
            borderColor0: '#ef4444',
          },
        },
      ],
    };
  }, [ohlcData, themeColors, customization]);

  if (!ohlcData || !option) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600 text-sm">
        No OHLC data for Heikin-Ashi chart
      </div>
    );
  }

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
