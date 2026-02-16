'use client';

import { useMemo, useState } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import {
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import {
  getEchartsTheme,
  getThemeColors,
  getSiteThemeClasses,
  CHART_HEIGHT_MAP,
} from '@/lib/live-dashboard/theme';
import { BTC_CYCLES } from '@/lib/live-dashboard/cycle-data';

echarts.use([
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  MarkLineComponent,
  MarkPointComponent,
  CanvasRenderer,
]);

/** Calculate the number of days since the 2024 halving */
function daysSince2024Halving(): number {
  const halving = new Date('2024-04-19T00:00:00Z');
  const now = new Date();
  return Math.floor((now.getTime() - halving.getTime()) / (1000 * 60 * 60 * 24));
}

export function CycleComparisonWidget() {
  const { siteTheme, colorTheme, chartHeight, data, customization } =
    useLiveDashboardStore((s) => ({
      siteTheme: s.siteTheme,
      colorTheme: s.customization.colorTheme,
      chartHeight: s.customization.chartHeight,
      data: s.data,
      customization: s.customization,
    }));

  const theme = getSiteThemeClasses(siteTheme);
  const echartsTheme = getEchartsTheme(siteTheme);
  const themeColors = getThemeColors(colorTheme);
  const height = CHART_HEIGHT_MAP[chartHeight];
  const currentDay = daysSince2024Halving();

  // Toggle visibility per cycle
  const [visible, setVisible] = useState<Record<string, boolean>>({
    '2012 Cycle': true,
    '2016 Cycle': true,
    '2020 Cycle': true,
    '2024 Cycle': true,
  });

  const toggleCycle = (label: string) => {
    setVisible((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const option = useMemo(() => {
    const series: any[] = [];

    for (const cycle of BTC_CYCLES) {
      if (!visible[cycle.label]) continue;

      const isCurrentCycle = cycle.label === '2024 Cycle';

      // Use live coinHistory data for the 2024 cycle if available
      let seriesData = cycle.data.map((d) => [d.daysSinceHalving, d.normalizedPrice]);

      if (isCurrentCycle && data.coinHistory?.bitcoin) {
        // coinHistory has { prices: [[timestamp, price], ...] }
        const history = data.coinHistory.bitcoin;
        if (history.prices && Array.isArray(history.prices) && history.prices.length > 0) {
          const halvingTs = new Date('2024-04-19T00:00:00Z').getTime();
          const halvingPrice = cycle.halvingPrice;
          const liveData: [number, number][] = [];
          for (const [ts, price] of history.prices) {
            const daysDiff = Math.round((ts - halvingTs) / (1000 * 60 * 60 * 24));
            const normalized = (price / halvingPrice) * 100;
            liveData.push([daysDiff, Math.round(normalized * 10) / 10]);
          }
          if (liveData.length > 0) {
            seriesData = liveData;
          }
        }
      }

      const seriesItem: any = {
        name: cycle.label,
        type: 'line',
        smooth: true,
        symbol: 'none',
        data: seriesData,
        lineStyle: {
          width: isCurrentCycle ? 3 : 1.5,
          color: cycle.color,
          type: isCurrentCycle ? 'solid' : 'solid',
        },
        itemStyle: { color: cycle.color },
        emphasis: { lineStyle: { width: isCurrentCycle ? 4 : 2.5 } },
        z: isCurrentCycle ? 10 : 1,
      };

      // Add markLine on the first visible series for the halving reference line at x=0
      if (series.length === 0) {
        seriesItem.markLine = {
          silent: true,
          symbol: 'none',
          data: [
            {
              xAxis: 0,
              label: {
                formatter: 'Halving',
                position: 'insideStartTop',
                color: siteTheme === 'light-blue' ? '#475569' : 'rgba(255,255,255,0.6)',
                fontSize: 10,
                fontWeight: 'bold',
              },
              lineStyle: {
                color: siteTheme === 'light-blue' ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.15)',
                type: 'dashed',
                width: 2,
              },
            },
          ],
        };
      }

      // Add "Current Day" marker on the 2024 cycle
      if (isCurrentCycle) {
        // Find the closest data point to currentDay
        let closestPoint = seriesData[seriesData.length - 1];
        let minDist = Infinity;
        for (const pt of seriesData) {
          const dist = Math.abs(pt[0] - currentDay);
          if (dist < minDist) {
            minDist = dist;
            closestPoint = pt;
          }
        }

        seriesItem.markPoint = {
          symbol: 'circle',
          symbolSize: 10,
          data: [
            {
              coord: closestPoint,
              name: 'Today',
              label: {
                formatter: 'Today',
                position: 'top',
                color: cycle.color,
                fontSize: 10,
                fontWeight: 'bold',
                distance: 12,
              },
              itemStyle: {
                color: cycle.color,
                borderColor: siteTheme === 'light-blue' ? '#fff' : '#0a0a0f',
                borderWidth: 2,
              },
            },
          ],
        };
      }

      series.push(seriesItem);
    }

    const labelColor =
      siteTheme === 'light-blue' ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.4)';
    const splitLineColor =
      siteTheme === 'light-blue' ? 'rgba(59,130,246,0.08)' : 'rgba(255,255,255,0.04)';

    return {
      ...echartsTheme,
      animation: customization.showAnimations,
      grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
      tooltip: {
        ...echartsTheme.tooltip,
        trigger: 'axis' as const,
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const day = params[0]?.value?.[0] ?? params[0]?.data?.[0] ?? 0;
          let html = `<b>Day ${day >= 0 ? '+' : ''}${day}</b><br/>`;
          for (const p of params) {
            const val = p.value?.[1] ?? p.data?.[1] ?? 0;
            html += `<span style="color:${p.color}">\u25CF</span> ${p.seriesName}: ${val.toFixed(0)} (${(val / 100).toFixed(2)}x)<br/>`;
          }
          return html;
        },
      },
      legend: { show: false }, // Using custom toggle chips instead
      xAxis: {
        type: 'value' as const,
        name: 'Days since halving',
        nameLocation: 'middle' as const,
        nameGap: 30,
        nameTextStyle: { color: labelColor, fontSize: 11 },
        min: -90,
        max: 600,
        axisLine: echartsTheme.xAxis.axisLine,
        axisTick: { show: false },
        axisLabel: {
          color: labelColor,
          fontSize: 10,
          formatter: (v: number) => (v === 0 ? '0' : v > 0 ? `+${v}` : `${v}`),
        },
        splitLine: { lineStyle: { color: splitLineColor } },
      },
      yAxis: {
        type: 'log' as const,
        name: 'Normalized Price',
        nameTextStyle: { color: labelColor, fontSize: 10 },
        min: 30,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: labelColor,
          fontSize: 10,
          formatter: (v: number) => {
            if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
            return `${v}`;
          },
        },
        splitLine: { lineStyle: { color: splitLineColor } },
      },
      series,
    };
  }, [visible, data.coinHistory, echartsTheme, siteTheme, customization, currentDay]);

  return (
    <div>
      {/* Cycle toggle chips */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {BTC_CYCLES.map((cycle) => (
          <button
            key={cycle.label}
            onClick={() => toggleCycle(cycle.label)}
            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all duration-200 border ${
              visible[cycle.label]
                ? 'border-opacity-40'
                : siteTheme === 'light-blue'
                  ? 'bg-blue-50/50 text-slate-400 border-blue-200/30 opacity-50'
                  : 'bg-white/[0.04] text-gray-500 border-white/[0.06] opacity-50'
            }`}
            style={
              visible[cycle.label]
                ? {
                    backgroundColor: `${cycle.color}20`,
                    color: cycle.color,
                    borderColor: `${cycle.color}40`,
                  }
                : undefined
            }
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full mr-1"
              style={{ backgroundColor: cycle.color, opacity: visible[cycle.label] ? 1 : 0.3 }}
            />
            {cycle.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: `${height}px`, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
        lazyUpdate
      />

      {/* Insight footer */}
      <p className={`text-[10px] mt-1 text-center italic ${theme.textDim}`}>
        Day {currentDay} of 2024 cycle &middot; Prices normalized to 100 at halving &middot; Y-axis
        log scale
      </p>
    </div>
  );
}
