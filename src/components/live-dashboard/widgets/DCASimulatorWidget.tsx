'use client';

import { useState, useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart } from 'echarts/charts';
import { GridComponent, TooltipComponent, LegendComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useShallow } from 'zustand/react/shallow';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import {
  getSiteThemeClasses,
  getThemeColors,
  getEchartsTheme,
  formatCompact,
  CHART_HEIGHT_MAP,
} from '@/lib/live-dashboard/theme';

echarts.use([LineChart, GridComponent, TooltipComponent, LegendComponent, CanvasRenderer]);

/* ---------- helpers ---------- */

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addInterval(date: Date, interval: 'weekly' | 'biweekly' | 'monthly'): Date {
  const d = new Date(date);
  if (interval === 'weekly') d.setDate(d.getDate() + 7);
  else if (interval === 'biweekly') d.setDate(d.getDate() + 14);
  else d.setMonth(d.getMonth() + 1);
  return d;
}

/** Build a simple simulated BTC price series for the fallback case */
function generateMockPriceHistory(startDate: Date, endDate: Date): { date: Date; price: number }[] {
  const points: { date: Date; price: number }[] = [];
  let price = 28000 + Math.random() * 5000;
  const d = new Date(startDate);
  while (d <= endDate) {
    // Random walk with slight upward bias
    price *= 1 + (Math.random() - 0.48) * 0.03;
    price = Math.max(price, 5000);
    points.push({ date: new Date(d), price });
    d.setDate(d.getDate() + 1);
  }
  return points;
}

/** Interpolate the price for a given date from a sorted price history */
function priceAtDate(
  history: { date: Date; price: number }[],
  target: Date,
): number | null {
  if (history.length === 0) return null;
  const t = target.getTime();
  if (t <= history[0].date.getTime()) return history[0].price;
  if (t >= history[history.length - 1].date.getTime()) return history[history.length - 1].price;
  // Binary-search closest
  let lo = 0;
  let hi = history.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (history[mid].date.getTime() <= t) lo = mid;
    else hi = mid;
  }
  // Linear interpolation between lo and hi
  const tLo = history[lo].date.getTime();
  const tHi = history[hi].date.getTime();
  const frac = (t - tLo) / (tHi - tLo || 1);
  return history[lo].price + (history[hi].price - history[lo].price) * frac;
}

/* ---------- component ---------- */

export function DCASimulatorWidget() {
  const data = useLiveDashboardStore((s) => s.data);
  const { siteTheme, colorTheme, chartHeight, vsCurrency } = useLiveDashboardStore(useShallow((s) => ({
    siteTheme: s.siteTheme,
    colorTheme: s.customization.colorTheme,
    chartHeight: s.customization.chartHeight,
    vsCurrency: s.customization.vsCurrency,
  })));
  const showAnimations = useLiveDashboardStore((s) => s.customization.showAnimations);
  const chartStyle = useLiveDashboardStore((s) => s.customization.chartStyle);

  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(colorTheme);
  const echartsTheme = getEchartsTheme(siteTheme);
  const height = CHART_HEIGHT_MAP[chartHeight];

  // ---- Input state ----
  const defaultStart = new Date();
  defaultStart.setFullYear(defaultStart.getFullYear() - 1);

  const [amount, setAmount] = useState(100);
  const [interval, setInterval] = useState<'weekly' | 'biweekly' | 'monthly'>('monthly');
  const [startDateStr, setStartDateStr] = useState(toDateStr(defaultStart));
  const [coin, setCoin] = useState('bitcoin');

  // ---- Simulation ----
  const simulation = useMemo(() => {
    const now = new Date();
    const startDate = new Date(startDateStr);
    if (isNaN(startDate.getTime()) || startDate >= now) return null;

    // Build price history from store or mock
    let priceHistory: { date: Date; price: number }[] = [];

    if (data.coinHistory && data.coinHistory[coin]) {
      // coinHistory format: { prices: [[timestamp, price], ...] }
      const raw = data.coinHistory[coin];
      const prices: number[][] = raw.prices || raw;
      if (Array.isArray(prices) && prices.length > 0) {
        priceHistory = prices.map((p: number[]) => ({
          date: new Date(p[0]),
          price: p[1],
        }));
      }
    }

    // If no real data, generate mock
    if (priceHistory.length === 0) {
      priceHistory = generateMockPriceHistory(startDate, now);
    }

    // DCA simulation
    const dcaDates: Date[] = [];
    const dcaValues: number[] = [];
    const lumpValues: number[] = [];
    const investedArr: number[] = [];

    let cumulativeQty = 0;
    let cumulativeInvested = 0;
    let currentDate = new Date(startDate);

    // For lump sum: total investment amount determined after counting intervals
    const intervals: Date[] = [];
    while (currentDate <= now) {
      intervals.push(new Date(currentDate));
      currentDate = addInterval(currentDate, interval);
    }

    const totalInvested = intervals.length * amount;
    const firstPrice = priceAtDate(priceHistory, intervals[0]);
    const lumpQty = firstPrice && firstPrice > 0 ? totalInvested / firstPrice : 0;

    for (const d of intervals) {
      const p = priceAtDate(priceHistory, d);
      if (!p || p <= 0) continue;

      const qty = amount / p;
      cumulativeQty += qty;
      cumulativeInvested += amount;

      dcaDates.push(d);
      investedArr.push(cumulativeInvested);
      dcaValues.push(cumulativeQty * p);
      lumpValues.push(lumpQty * p);
    }

    // Also compute final values using the latest price
    const latestPrice = priceAtDate(priceHistory, now);
    const finalDcaValue = latestPrice ? cumulativeQty * latestPrice : dcaValues[dcaValues.length - 1] || 0;
    const finalLumpValue = latestPrice ? lumpQty * latestPrice : lumpValues[lumpValues.length - 1] || 0;
    const dcaReturn = cumulativeInvested > 0 ? ((finalDcaValue - cumulativeInvested) / cumulativeInvested) * 100 : 0;
    const vsLumpDiff = finalDcaValue - finalLumpValue;

    return {
      dates: dcaDates.map((d) => toDateStr(d)),
      dcaValues,
      lumpValues,
      investedArr,
      totalInvested: cumulativeInvested,
      finalDcaValue,
      finalLumpValue,
      dcaReturn,
      vsLumpDiff,
      isMock: priceHistory.length > 0 && !(data.coinHistory && data.coinHistory[coin]),
    };
  }, [data.coinHistory, coin, startDateStr, amount, interval]);

  // ---- Chart option ----
  const option = useMemo(() => {
    if (!simulation) return null;

    return {
      ...echartsTheme,
      animation: showAnimations,
      grid: { left: '3%', right: '3%', bottom: '5%', top: '15%', containLabel: true },
      legend: {
        show: true,
        top: 0,
        textStyle: {
          color: echartsTheme.textStyle.color,
          fontSize: 10,
        },
      },
      tooltip: {
        ...echartsTheme.tooltip,
        trigger: 'axis' as const,
        formatter: (params: any) => {
          let html = `<b>${params[0]?.axisValue}</b><br/>`;
          for (const p of params) {
            html += `<span style="color:${p.color}">\u25CF</span> ${p.seriesName}: $${Number(p.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}<br/>`;
          }
          return html;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: simulation.dates,
        ...echartsTheme.xAxis,
        boundaryGap: false,
        axisLabel: {
          ...echartsTheme.xAxis.axisLabel,
          interval: Math.max(Math.floor(simulation.dates.length / 6), 1),
          formatter: (v: string) => {
            const parts = v.split('-');
            return `${parts[1]}/${parts[2]}`;
          },
        },
      },
      yAxis: {
        type: 'value' as const,
        ...echartsTheme.yAxis,
        axisLabel: {
          ...echartsTheme.yAxis.axisLabel,
          formatter: (v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}K` : v.toFixed(0)}`,
        },
      },
      series: [
        {
          name: 'DCA Value',
          type: 'line' as const,
          data: simulation.dcaValues,
          smooth: chartStyle === 'smooth',
          showSymbol: false,
          lineStyle: { width: 2, color: themeColors.primary },
          itemStyle: { color: themeColors.primary },
          areaStyle: {
            opacity: 0.15,
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: themeColors.primary },
              { offset: 1, color: 'transparent' },
            ]),
          },
        },
        {
          name: 'Lump Sum',
          type: 'line' as const,
          data: simulation.lumpValues,
          smooth: chartStyle === 'smooth',
          showSymbol: false,
          lineStyle: { width: 1.5, color: '#6b7280', type: 'dashed' as const },
          itemStyle: { color: '#6b7280' },
        },
      ],
    };
  }, [simulation, echartsTheme, themeColors, showAnimations, chartStyle]);

  // ---- KPI formatting ----
  const kpiItems = useMemo(() => {
    if (!simulation) return [];
    return [
      {
        label: 'Total Invested',
        value: formatCompact(simulation.totalInvested, vsCurrency),
        color: echartsTheme.textStyle.color,
      },
      {
        label: 'Current Value (DCA)',
        value: formatCompact(simulation.finalDcaValue, vsCurrency),
        color: themeColors.primary,
      },
      {
        label: 'DCA Return %',
        value: `${simulation.dcaReturn >= 0 ? '+' : ''}${simulation.dcaReturn.toFixed(2)}%`,
        color: simulation.dcaReturn >= 0 ? '#34d399' : '#ef4444',
      },
      {
        label: 'vs Lump Sum',
        value: `${simulation.vsLumpDiff >= 0 ? '+' : ''}${formatCompact(Math.abs(simulation.vsLumpDiff), vsCurrency)}`,
        color: simulation.vsLumpDiff >= 0 ? '#34d399' : '#ef4444',
      },
    ];
  }, [simulation, themeColors, vsCurrency, echartsTheme]);

  // ---- Render ----
  const inputClasses = `${st.inputBg} rounded-lg px-3 py-2 text-xs outline-none focus:border-white/[0.2] transition-colors`;

  return (
    <div className="space-y-4">
      {/* Input Row */}
      <div className="flex flex-wrap gap-3 items-end">
        {/* Amount */}
        <div className="flex-1 min-w-[100px]">
          <label className={`text-[10px] uppercase tracking-wider ${st.textDim} font-medium mb-1 block`}>
            Amount
          </label>
          <input
            type="number"
            min={1}
            step={10}
            value={amount}
            onChange={(e) => setAmount(Math.max(1, Number(e.target.value) || 1))}
            className={inputClasses + ' w-full'}
          />
        </div>

        {/* Interval */}
        <div className="flex-1 min-w-[110px]">
          <label className={`text-[10px] uppercase tracking-wider ${st.textDim} font-medium mb-1 block`}>
            Interval
          </label>
          <select
            value={interval}
            onChange={(e) => setInterval(e.target.value as 'weekly' | 'biweekly' | 'monthly')}
            className={inputClasses + ' w-full appearance-none'}
          >
            <option value="weekly" className={st.selectOptionBg}>Weekly</option>
            <option value="biweekly" className={st.selectOptionBg}>Biweekly</option>
            <option value="monthly" className={st.selectOptionBg}>Monthly</option>
          </select>
        </div>

        {/* Start Date */}
        <div className="flex-1 min-w-[130px]">
          <label className={`text-[10px] uppercase tracking-wider ${st.textDim} font-medium mb-1 block`}>
            Start Date
          </label>
          <input
            type="date"
            value={startDateStr}
            max={toDateStr(new Date())}
            onChange={(e) => setStartDateStr(e.target.value)}
            className={inputClasses + ' w-full'}
          />
        </div>

        {/* Coin */}
        <div className="flex-1 min-w-[100px]">
          <label className={`text-[10px] uppercase tracking-wider ${st.textDim} font-medium mb-1 block`}>
            Coin
          </label>
          <input
            type="text"
            value={coin}
            onChange={(e) => setCoin(e.target.value.toLowerCase().trim())}
            placeholder="bitcoin"
            className={inputClasses + ' w-full'}
          />
        </div>
      </div>

      {/* KPI Row */}
      {simulation && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {kpiItems.map((kpi) => (
            <div
              key={kpi.label}
              className={`${st.subtleBg} rounded-xl p-3 text-center`}
            >
              <p className={`text-[10px] uppercase tracking-wider ${st.textDim} font-medium mb-1`}>
                {kpi.label}
              </p>
              <p className="text-sm font-bold tabular-nums" style={{ color: kpi.color }}>
                {kpi.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Chart */}
      {option ? (
        <div>
          <ReactEChartsCore
            echarts={echarts}
            option={option}
            style={{ height, width: '100%' }}
            opts={{ renderer: 'canvas' }}
            notMerge
          />
          {simulation?.isMock && (
            <p className={`text-[10px] ${st.textDim} mt-1 text-center italic`}>
              Simulated prices — connect API key and load coin history for real data
            </p>
          )}
        </div>
      ) : (
        <div className={`flex items-center justify-center h-40 ${st.textDim} text-sm`}>
          Adjust parameters above to run DCA simulation
        </div>
      )}
    </div>
  );
}
