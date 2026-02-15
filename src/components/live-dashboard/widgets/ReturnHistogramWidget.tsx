'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { BarChart } from 'echarts/charts';
import { GridComponent, TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer]);

interface ReturnHistogramWidgetProps {
  limit?: number;
}

export function ReturnHistogramWidget({ limit = 50 }: ReturnHistogramWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = CHART_HEIGHT_MAP[customization.chartHeight];

  const { option, insight } = useMemo(() => {
    if (!data.markets?.length) return { option: null, insight: '' };

    const coins = data.markets.slice(0, limit);
    const changes = coins.map((c) => c.price_change_percentage_24h || 0);

    // Create histogram bins
    const binSize = 2; // 2% bins
    const minVal = Math.floor(Math.min(...changes) / binSize) * binSize;
    const maxVal = Math.ceil(Math.max(...changes) / binSize) * binSize;

    const bins: { range: string; count: number; from: number; to: number }[] = [];
    for (let v = minVal; v < maxVal; v += binSize) {
      const count = changes.filter((c) => c >= v && c < v + binSize).length;
      bins.push({
        range: `${v >= 0 ? '+' : ''}${v}% to ${v + binSize >= 0 ? '+' : ''}${v + binSize}%`,
        count,
        from: v,
        to: v + binSize,
      });
    }

    const labels = bins.map((b) => `${b.from >= 0 ? '+' : ''}${b.from}%`);
    const barData = bins.map((b) => ({
      value: b.count,
      itemStyle: {
        color: b.from >= 0
          ? new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: themeColors.primary },
              { offset: 1, color: themeColors.fill.replace('0.15', '0.6') },
            ])
          : new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#ef4444' },
              { offset: 1, color: 'rgba(239,68,68,0.3)' },
            ]),
      },
    }));

    // Calculate stats
    const mean = changes.reduce((s, c) => s + c, 0) / changes.length;
    const sorted = [...changes].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];

    const positiveCount = changes.filter(c => c >= 0).length;
    const skew = mean > median ? 'right-skewed (more extreme winners)' : mean < median ? 'left-skewed (more extreme losers)' : 'balanced';
    const insightText = `Mean: ${mean >= 0 ? '+' : ''}${mean.toFixed(2)}% · Median: ${median >= 0 ? '+' : ''}${median.toFixed(2)}% · ${positiveCount}/${changes.length} positive · ${skew}`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      grid: { left: '3%', right: '3%', bottom: '10%', top: '12%', containLabel: true },
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'axis' as const,
        formatter: (params: any) => {
          const b = bins[params[0]?.dataIndex];
          if (!b) return '';
          return `<b>${b.range}</b><br/>Coins: ${b.count}<br/>Mean: ${mean >= 0 ? '+' : ''}${mean.toFixed(2)}%<br/>Median: ${median >= 0 ? '+' : ''}${median.toFixed(2)}%`;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: labels,
        ...ECHARTS_THEME.xAxis,
        axisLabel: { ...ECHARTS_THEME.xAxis.axisLabel, rotate: 30 },
      },
      yAxis: {
        type: 'value' as const,
        ...ECHARTS_THEME.yAxis,
        name: 'Coins',
        nameTextStyle: { color: 'rgba(255,255,255,0.4)', fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          data: barData,
          barWidth: '80%',
          emphasis: {
            itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.3)' },
          },
          markLine: {
            silent: true,
            data: [
              {
                xAxis: labels.findIndex((l) => {
                  const val = parseFloat(l.replace('+', ''));
                  return val <= mean && mean < val + binSize;
                }),
                label: {
                  formatter: `Mean: ${mean >= 0 ? '+' : ''}${mean.toFixed(1)}%`,
                  color: '#fff',
                  fontSize: 10,
                },
                lineStyle: { color: '#f59e0b', type: 'dashed' as const, width: 2 },
              },
            ],
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
