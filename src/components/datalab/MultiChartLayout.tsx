'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { LineChart, BarChart } from 'echarts/charts';
import {
  GridComponent, TooltipComponent, DataZoomComponent,
  LegendComponent,
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { X, Plus, Settings } from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { isFeatureAvailable } from '@/lib/datalab/modeConfig';

echarts.use([
  LineChart, BarChart,
  GridComponent, TooltipComponent, DataZoomComponent,
  LegendComponent, CanvasRenderer,
]);

const DEFAULT_COINS = ['ethereum', 'solana', 'cardano'];

interface MiniChartState {
  id: number;
  coin: string;
  data: number[];
  timestamps: number[];
  loading: boolean;
  error: string | null;
}

interface MultiChartLayoutProps {
  show: boolean;
  onClose: () => void;
}

export function MultiChartLayout({ show, onClose }: MultiChartLayoutProps) {
  const dataLabMode = useDataLabStore((s) => s.dataLabMode);
  const primaryCoin = useDataLabStore((s) => s.coin);
  const primaryTimestamps = useDataLabStore((s) => s.timestamps);
  const primaryData = useDataLabStore((s) => s.rawData);
  const days = useDataLabStore((s) => s.days);

  const [charts, setCharts] = useState<MiniChartState[]>([
    { id: 1, coin: DEFAULT_COINS[0], data: [], timestamps: [], loading: false, error: null },
  ]);

  if (!isFeatureAvailable(dataLabMode, 'multiChart')) return null;
  if (!show) return null;

  const primaryCloses = primaryData.price as number[] | undefined;

  const fetchCoinData = useCallback(async (coin: string): Promise<{ prices: number[]; timestamps: number[] }> => {
    try {
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/${coin}/market_chart?vs_currency=usd&days=${days}`
      );
      if (!res.ok) throw new Error('API error');
      const json = await res.json();
      const prices = (json.prices as [number, number][]).map(([, p]) => p);
      const ts = (json.prices as [number, number][]).map(([t]) => t);
      return { prices, timestamps: ts };
    } catch {
      return { prices: [], timestamps: [] };
    }
  }, [days]);

  const loadChart = useCallback(async (chartId: number, coin: string) => {
    setCharts((prev) => prev.map((c) => c.id === chartId ? { ...c, loading: true, error: null, coin } : c));
    const result = await fetchCoinData(coin);
    setCharts((prev) =>
      prev.map((c) =>
        c.id === chartId
          ? { ...c, data: result.prices, timestamps: result.timestamps, loading: false, error: result.prices.length === 0 ? 'Failed to load' : null }
          : c
      )
    );
  }, [fetchCoinData]);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    for (const chart of charts) {
      if (chart.data.length === 0 && !chart.loading && !chart.error) {
        loadChart(chart.id, chart.coin);
      }
    }
  }, [charts, loadChart]);

  const addChart = () => {
    if (charts.length >= 3) return;
    const usedCoins = new Set(charts.map((c) => c.coin));
    const nextCoin = DEFAULT_COINS.find((c) => !usedCoins.has(c)) ?? 'dogecoin';
    const newId = Math.max(...charts.map((c) => c.id)) + 1;
    setCharts((prev) => [
      ...prev,
      { id: newId, coin: nextCoin, data: [], timestamps: [], loading: false, error: null },
    ]);
  };

  const removeChart = (id: number) => {
    setCharts((prev) => prev.filter((c) => c.id !== id));
  };

  const buildMiniOption = (chart: MiniChartState) => ({
    grid: { top: 30, right: 10, bottom: 30, left: 50 },
    tooltip: { trigger: 'axis' as const },
    xAxis: {
      type: 'category' as const,
      data: chart.timestamps.map((t) => new Date(t).toLocaleDateString()),
      axisLabel: { color: '#6b7280', fontSize: 9 },
      axisLine: { lineStyle: { color: '#333' } },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#6b7280', fontSize: 9 },
      splitLine: { lineStyle: { color: '#1f2937' } },
    },
    series: [
      {
        name: chart.coin.toUpperCase(),
        type: 'line' as const,
        data: chart.data,
        smooth: true,
        lineStyle: { width: 1.5 },
        symbol: 'none',
        itemStyle: { color: '#60a5fa' },
        areaStyle: { color: 'rgba(96,165,250,0.05)' },
      },
    ],
    dataZoom: [{ type: 'inside' as const, start: 0, end: 100 }],
  });

  const primaryOption = {
    grid: { top: 30, right: 10, bottom: 30, left: 50 },
    tooltip: { trigger: 'axis' as const },
    xAxis: {
      type: 'category' as const,
      data: primaryTimestamps.map((t) => new Date(t).toLocaleDateString()),
      axisLabel: { color: '#6b7280', fontSize: 9 },
      axisLine: { lineStyle: { color: '#333' } },
    },
    yAxis: {
      type: 'value' as const,
      axisLabel: { color: '#6b7280', fontSize: 9 },
      splitLine: { lineStyle: { color: '#1f2937' } },
    },
    series: [
      {
        name: primaryCoin.toUpperCase(),
        type: 'line' as const,
        data: primaryCloses ?? [],
        smooth: true,
        lineStyle: { width: 1.5 },
        symbol: 'none',
        itemStyle: { color: '#34d399' },
        areaStyle: { color: 'rgba(52,211,153,0.05)' },
      },
    ],
    dataZoom: [{ type: 'inside' as const, start: 0, end: 100 }],
  };

  const colsClass = charts.length === 1 ? 'grid-cols-2' : charts.length === 2 ? 'grid-cols-3' : 'grid-cols-2';

  return (
    <div className="border-t border-white/[0.04] bg-white/[0.01] max-w-[1800px] mx-auto">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-white flex items-center gap-2">
            <Settings className="w-3.5 h-3.5 text-cyan-400" />
            Multi-Chart Comparison
            <span className="text-[10px] text-gray-500 font-normal ml-2">
              {1 + charts.length} charts &middot; {days}d
            </span>
          </h4>
          <div className="flex items-center gap-2">
            {charts.length < 3 && (
              <button type="button" title="Add chart" onClick={addChart}
                className="text-gray-500 hover:text-white">
                <Plus className="w-3.5 h-3.5" />
              </button>
            )}
            <button type="button" title="Close multi-chart" onClick={onClose}
              className="text-gray-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className={`grid ${colsClass} gap-2`}>
          {/* Primary chart mini */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2">
            <div className="text-[10px] text-emerald-400 font-medium mb-1">
              {primaryCoin.toUpperCase()} (Primary)
            </div>
            <ReactEChartsCore
              echarts={echarts}
              option={primaryOption}
              style={{ height: 180 }}
              opts={{ renderer: 'canvas' }}
              notMerge
            />
          </div>

          {/* Secondary charts */}
          {charts.map((chart) => (
            <div key={chart.id} className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-2">
              <div className="flex items-center justify-between mb-1">
                <select
                  title="Select coin"
                  value={chart.coin}
                  onChange={(e) => loadChart(chart.id, e.target.value)}
                  className="bg-transparent text-[10px] text-blue-400 font-medium border-none focus:outline-none cursor-pointer"
                >
                  {['ethereum', 'solana', 'cardano', 'dogecoin', 'polkadot', 'avalanche-2', 'chainlink', 'polygon-pos'].map((c) => (
                    <option key={c} value={c}>{c.toUpperCase()}</option>
                  ))}
                </select>
                <button type="button" title="Remove chart" onClick={() => removeChart(chart.id)}
                  className="text-gray-600 hover:text-red-400">
                  <X className="w-3 h-3" />
                </button>
              </div>
              {chart.loading ? (
                <div className="flex items-center justify-center h-[180px] text-[10px] text-gray-500">Loading...</div>
              ) : chart.error ? (
                <div className="flex items-center justify-center h-[180px] text-[10px] text-red-400">{chart.error}</div>
              ) : (
                <ReactEChartsCore
                  echarts={echarts}
                  option={buildMiniOption(chart)}
                  style={{ height: 180 }}
                  opts={{ renderer: 'canvas' }}
                  notMerge
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
