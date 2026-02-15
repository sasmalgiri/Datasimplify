'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent, DataZoomComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, DataZoomComponent, CanvasRenderer]);

interface DrawdownChartWidgetProps {
  limit?: number;
}

export function DrawdownChartWidget({ limit = 6 }: DrawdownChartWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = CHART_HEIGHT_MAP[customization.chartHeight];

  const { option, insight } = useMemo(() => {
    if (!data.markets?.length) return { option: null, insight: '' };

    // Pick coins with sparkline data
    const coinsWithSparkline = data.markets.filter((c) => c.sparkline_in_7d?.price?.length).slice(0, limit);
    if (coinsWithSparkline.length === 0) return { option: null, insight: '' };

    const sparkLen = coinsWithSparkline[0].sparkline_in_7d!.price.length;
    const now = Date.now();
    const timeLabels = Array.from({ length: sparkLen }, (_, i) => {
      const ts = now - (sparkLen - 1 - i) * 3600 * 1000;
      const d = new Date(ts);
      return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:00`;
    });

    const drawdownStats: { symbol: string; maxDD: number }[] = [];
    const series = coinsWithSparkline.map((coin, idx) => {
      const prices = coin.sparkline_in_7d!.price;
      // Calculate drawdown from running max
      let runningMax = prices[0];
      const drawdowns = prices.map((p) => {
        if (p > runningMax) runningMax = p;
        return ((p - runningMax) / runningMax) * 100;
      });
      drawdownStats.push({ symbol: coin.symbol.toUpperCase(), maxDD: Math.min(...drawdowns) });

      const color = themeColors.palette[idx % themeColors.palette.length];

      return {
        name: coin.symbol.toUpperCase(),
        type: 'line' as const,
        data: drawdowns,
        smooth: customization.chartStyle === 'smooth',
        showSymbol: false,
        lineStyle: { width: 1.5, color },
        itemStyle: { color },
        areaStyle: {
          opacity: 0.1,
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'transparent' },
            { offset: 1, color },
          ]),
        },
        emphasis: { focus: 'series' as const },
      };
    });

    drawdownStats.sort((a, b) => a.maxDD - b.maxDD);
    const deepest = drawdownStats[0];
    const shallowest = drawdownStats[drawdownStats.length - 1];
    const insightText = `Deepest dip: ${deepest.symbol} (${deepest.maxDD.toFixed(1)}%) · Shallowest: ${shallowest.symbol} (${shallowest.maxDD.toFixed(1)}%)`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      grid: { left: '3%', right: '3%', bottom: '15%', top: '15%', containLabel: true },
      legend: {
        show: true,
        top: 0,
        textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
      },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        formatter: (params: any) => {
          let html = `<b>${params[0]?.axisValue}</b><br/>`;
          for (const p of params) {
            html += `<span style="color:${p.color}">●</span> ${p.seriesName}: ${p.value.toFixed(2)}%<br/>`;
          }
          return html;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: timeLabels,
        ...ECHARTS_THEME.xAxis,
        boundaryGap: false,
        axisLabel: {
          ...ECHARTS_THEME.xAxis.axisLabel,
          interval: Math.floor(sparkLen / 7),
          formatter: (v: string) => v.split(' ')[0],
        },
      },
      yAxis: {
        type: 'value' as const,
        ...ECHARTS_THEME.yAxis,
        max: 0,
        axisLabel: { ...ECHARTS_THEME.yAxis.axisLabel, formatter: (v: number) => `${v.toFixed(0)}%` },
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
      series,
    } };
  }, [data.markets, limit, themeColors, customization]);

  if (!data.markets) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        Connect API key to load data
      </div>
    );
  }

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No sparkline data for drawdown chart
      </div>
    );
  }

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
