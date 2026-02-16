'use client';

import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import {
  getSiteThemeClasses,
  getThemeColors,
  getEchartsTheme,
  CHART_HEIGHT_MAP,
  formatCompact,
} from '@/lib/live-dashboard/theme';

/* ---------- data model ---------- */

interface PortfolioHolding {
  id: string;
  coinId: string;
  coinName: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
}

/* ---------- component ---------- */

export function PLChartWidget() {
  const { siteTheme, colorTheme, chartHeight, vsCurrency, data, showAnimations } =
    useLiveDashboardStore((s) => ({
      siteTheme: s.siteTheme,
      colorTheme: s.customization.colorTheme,
      chartHeight: s.customization.chartHeight,
      vsCurrency: s.customization.vsCurrency,
      data: s.data,
      showAnimations: s.customization.showAnimations,
    }));
  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(colorTheme);
  const echartsTheme = getEchartsTheme(siteTheme);

  /* ---- localStorage persistence ---- */
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('crk-portfolio-holdings') || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('crk-portfolio-holdings', JSON.stringify(holdings));
  }, [holdings]);

  /* ---- listen for external changes ---- */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'crk-portfolio-holdings') {
        try {
          setHoldings(JSON.parse(e.newValue || '[]'));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const markets = data.markets ?? [];

  /* ---- compute chart data ---- */
  const option = useMemo(() => {
    if (holdings.length === 0) return null;

    const bars: { name: string; pnl: number; cost: number; value: number }[] = [];

    for (const h of holdings) {
      const coin = markets.find(
        (c) => c.id === h.coinId || c.name.toLowerCase() === h.coinId.toLowerCase(),
      );
      const currentPrice = coin?.current_price;
      if (currentPrice == null) continue;

      const cost = h.quantity * h.buyPrice;
      const value = h.quantity * currentPrice;
      const pnl = value - cost;

      bars.push({
        name: h.coinName,
        pnl: parseFloat(pnl.toFixed(2)),
        cost: parseFloat(cost.toFixed(2)),
        value: parseFloat(value.toFixed(2)),
      });
    }

    if (bars.length === 0) return null;

    const names = bars.map((b) => b.name);
    const pnlValues = bars.map((b) => b.pnl);

    return {
      ...echartsTheme,
      animation: showAnimations,
      grid: { left: '3%', right: '3%', bottom: '12%', top: '10%', containLabel: true },
      tooltip: {
        ...echartsTheme.tooltip,
        trigger: 'axis' as const,
        axisPointer: { type: 'shadow' as const },
        formatter: (params: any) => {
          if (!Array.isArray(params) || params.length === 0) return '';
          const idx = params[0].dataIndex;
          const bar = bars[idx];
          if (!bar) return '';
          const pnlSign = bar.pnl >= 0 ? '+' : '';
          return `<strong>${bar.name}</strong><br/>
Cost: ${formatCompact(bar.cost, vsCurrency)}<br/>
Value: ${formatCompact(bar.value, vsCurrency)}<br/>
P&L: ${pnlSign}${formatCompact(Math.abs(bar.pnl), vsCurrency)}`;
        },
      },
      xAxis: {
        type: 'category' as const,
        data: names,
        ...echartsTheme.xAxis,
        axisLabel: {
          ...echartsTheme.xAxis.axisLabel,
          rotate: names.length > 6 ? 30 : 0,
        },
      },
      yAxis: {
        type: 'value' as const,
        ...echartsTheme.yAxis,
        axisLabel: {
          ...echartsTheme.yAxis.axisLabel,
          formatter: (v: number) => formatCompact(Math.abs(v), vsCurrency),
        },
      },
      series: [
        {
          type: 'bar' as const,
          data: pnlValues.map((v) => ({
            value: v,
            itemStyle: {
              color: v >= 0 ? '#34d399' : '#ef4444',
              borderRadius: v >= 0 ? [4, 4, 0, 0] : [0, 0, 4, 4],
            },
          })),
          barMaxWidth: 40,
          animationDelay: (idx: number) => idx * 50,
        },
      ],
      animationEasing: 'cubicOut' as const,
    };
  }, [holdings, markets, echartsTheme, showAnimations, vsCurrency]);

  /* ---- empty state ---- */
  if (!option) {
    return (
      <div className="flex items-center justify-center h-48 text-sm" style={{ color: 'rgba(128,128,128,0.6)' }}>
        {holdings.length === 0
          ? 'No holdings yet — add some in the Portfolio Input widget'
          : 'Waiting for market data...'}
      </div>
    );
  }

  return (
    <div>
      <ReactECharts
        option={option}
        style={{ height: `${CHART_HEIGHT_MAP[chartHeight]}px`, width: '100%' }}
        notMerge
        lazyUpdate
      />
    </div>
  );
}
