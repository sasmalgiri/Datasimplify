'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, CHART_COLORS, getThemeColors, CHART_HEIGHT_MAP, formatCompact } from '@/lib/live-dashboard/theme';

echarts.use([LineChart, BarChart, GridComponent, TooltipComponent, DataZoomComponent, CanvasRenderer]);

interface HistoricalPriceWidgetProps {
  coinId?: string;
  days?: number;
  metric?: 'price' | 'volume' | 'all';
}

export function HistoricalPriceWidget({ coinId = 'bitcoin', days, metric = 'all' }: HistoricalPriceWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const history = data.coinHistory;

  const option = useMemo(() => {
    if (!history?.prices) return null;

    const prices: [number, number][] = history.prices;
    const volumes: [number, number][] = history.total_volumes ?? [];

    if (prices.length === 0) return null;

    const showPrice = metric === 'price' || metric === 'all';
    const showVolume = metric === 'volume' || metric === 'all';
    const dualAxis = showPrice && showVolume;

    const dates = prices.map((p) => {
      const dt = new Date(p[0]);
      return `${dt.getMonth() + 1}/${dt.getDate()}`;
    });

    const grids = dualAxis
      ? [
          { left: '8%', right: '8%', top: '5%', bottom: '32%' },
          { left: '8%', right: '8%', top: '73%', bottom: '5%' },
        ]
      : [{ left: '8%', right: '5%', bottom: '15%', top: '8%', containLabel: true }];

    const xAxes: any[] = [];
    const yAxes: any[] = [];
    const series: any[] = [];

    if (showPrice) {
      const xIdx = 0;
      const yIdx = 0;
      xAxes.push({
        type: 'category' as const,
        data: dates,
        ...ECHARTS_THEME.xAxis,
        gridIndex: dualAxis ? 0 : 0,
        boundaryGap: false,
      });
      yAxes.push({
        type: 'value' as const,
        ...ECHARTS_THEME.yAxis,
        gridIndex: dualAxis ? 0 : 0,
        axisLabel: {
          ...ECHARTS_THEME.yAxis.axisLabel,
          formatter: (v: number) => formatCompact(v).replace('$', ''),
        },
      });
      series.push({
        name: 'Price',
        type: 'line' as const,
        data: prices.map((p) => p[1]),
        xAxisIndex: xIdx,
        yAxisIndex: yIdx,
        smooth: customization.chartStyle === 'smooth',
        symbol: 'none',
        lineStyle: { color: themeColors.primary, width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: themeColors.fill },
            { offset: 1, color: 'rgba(52,211,153,0.02)' },
          ]),
        },
        itemStyle: { color: themeColors.primary },
      });
    }

    if (showVolume) {
      const volDates = volumes.map((v) => {
        const dt = new Date(v[0]);
        return `${dt.getMonth() + 1}/${dt.getDate()}`;
      });
      const xIdx = dualAxis ? 1 : showPrice ? 1 : 0;
      const yIdx = dualAxis ? 1 : showPrice ? 1 : 0;

      xAxes.push({
        type: 'category' as const,
        data: dualAxis ? volDates : volDates,
        ...ECHARTS_THEME.xAxis,
        gridIndex: dualAxis ? 1 : 0,
        axisLabel: dualAxis ? { show: false } : ECHARTS_THEME.xAxis.axisLabel,
      });
      yAxes.push({
        type: 'value' as const,
        ...ECHARTS_THEME.yAxis,
        gridIndex: dualAxis ? 1 : 0,
        axisLabel: dualAxis
          ? { show: false }
          : {
              ...ECHARTS_THEME.yAxis.axisLabel,
              formatter: (v: number) => formatCompact(v).replace('$', ''),
            },
        splitLine: dualAxis ? { show: false } : ECHARTS_THEME.yAxis.splitLine,
      });
      series.push({
        name: 'Volume',
        type: 'bar' as const,
        data: volumes.map((v) => v[1]),
        xAxisIndex: xIdx,
        yAxisIndex: yIdx,
        barMaxWidth: 8,
        itemStyle: {
          color: 'rgba(96,165,250,0.4)',
          borderRadius: [2, 2, 0, 0],
        },
      });
    }

    const dataZoomAxes = dualAxis ? [0, 1] : [0];

    return {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      grid: grids,
      xAxis: xAxes,
      yAxis: yAxes,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'cross' as const },
        formatter: (params: any) => {
          const items = Array.isArray(params) ? params : [params];
          let html = `<strong>${items[0].axisValue}</strong>`;
          items.forEach((p: any) => {
            const val = p.seriesName === 'Price'
              ? `$${p.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
              : formatCompact(p.value);
            html += `<br/>${p.marker} ${p.seriesName}: ${val}`;
          });
          return html;
        },
      },
      dataZoom: [
        {
          type: 'slider' as const,
          xAxisIndex: dataZoomAxes,
          bottom: dualAxis ? '1%' : '2%',
          height: 18,
          start: 0,
          end: 100,
          borderColor: 'rgba(255,255,255,0.06)',
          backgroundColor: 'rgba(255,255,255,0.03)',
          fillerColor: themeColors.fill,
          handleStyle: { color: themeColors.primary, borderColor: themeColors.primary },
          textStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 9 },
          dataBackground: {
            lineStyle: { color: themeColors.primary },
            areaStyle: { color: themeColors.fill },
          },
        },
        {
          type: 'inside' as const,
          xAxisIndex: dataZoomAxes,
          start: 0,
          end: 100,
        },
      ],
      series,
    };
  }, [history, metric, customization]);

  if (!history?.prices || !option) {
    return (
      <div className="flex items-center justify-center h-[280px] text-gray-600 text-sm">
        No data available
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
