'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { PieChart } from 'echarts/charts';
import { TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, CHART_COLORS, formatCompact, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([PieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

interface PieChartWidgetProps {
  mode?: 'dominance' | 'volume';
}

export function PieChartWidget({ mode = 'dominance' }: PieChartWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const option = useMemo(() => {
    let chartData: { name: string; value: number }[] = [];

    if (mode === 'dominance' && data.global) {
      const pcts = data.global.market_cap_percentage;
      const entries = Object.entries(pcts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 8);
      const topSum = entries.reduce((sum, [, v]) => sum + v, 0);
      chartData = entries.map(([name, value]) => ({
        name: name.toUpperCase(),
        value: parseFloat(value.toFixed(2)),
      }));
      if (topSum < 100) {
        chartData.push({ name: 'Others', value: parseFloat((100 - topSum).toFixed(2)) });
      }
    }

    if (mode === 'volume' && data.markets) {
      const top = data.markets.slice(0, 8);
      const totalVol = data.markets.reduce((sum, c) => sum + c.total_volume, 0);
      const topVol = top.reduce((sum, c) => sum + c.total_volume, 0);
      chartData = top.map((coin) => ({
        name: coin.symbol.toUpperCase(),
        value: coin.total_volume,
      }));
      if (topVol < totalVol) {
        chartData.push({ name: 'Others', value: totalVol - topVol });
      }
    }

    if (chartData.length === 0) return null;

    return {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        trigger: 'item' as const,
        formatter: (p: any) => {
          const val = mode === 'dominance' ? `${p.value}%` : formatCompact(p.value);
          return `<strong>${p.name}</strong>: ${val} (${p.percent}%)`;
        },
      },
      legend: {
        orient: 'vertical' as const,
        right: 10,
        top: 'center' as const,
        textStyle: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
      },
      series: [{
        type: 'pie' as const,
        radius: ['45%', '72%'],
        center: ['35%', '50%'],
        avoidLabelOverlap: true,
        padAngle: 2,
        itemStyle: {
          borderColor: 'rgba(10,10,15,1)',
          borderWidth: 2,
          borderRadius: 4,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, color: '#fff', fontSize: 12, fontWeight: 'bold' as const },
          itemStyle: { shadowBlur: 10, shadowColor: themeColors.fill },
        },
        animationType: 'scale' as const,
        animationEasing: 'elasticOut' as const,
        data: chartData.map((item, i) => ({
          ...item,
          itemStyle: { color: themeColors.palette[i % themeColors.palette.length] },
        })),
      }],
    };
  }, [data.global, data.markets, mode, customization]);

  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
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
