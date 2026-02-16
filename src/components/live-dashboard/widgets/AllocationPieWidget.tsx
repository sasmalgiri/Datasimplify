'use client';

import { useState, useEffect, useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import {
  getSiteThemeClasses,
  getThemeColors,
  getEchartsTheme,
  CHART_HEIGHT_MAP,
  CHART_COLORS,
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

export function AllocationPieWidget() {
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

  /* ---- compute pie data ---- */
  const option = useMemo(() => {
    if (holdings.length === 0) return null;

    // Aggregate current value per coin
    const valueMap = new Map<string, { name: string; value: number }>();

    for (const h of holdings) {
      const coin = markets.find(
        (c) => c.id === h.coinId || c.name.toLowerCase() === h.coinId.toLowerCase(),
      );
      const currentPrice = coin?.current_price;
      if (currentPrice == null) continue;

      const currentValue = h.quantity * currentPrice;
      const existing = valueMap.get(h.coinId);
      if (existing) {
        existing.value += currentValue;
      } else {
        valueMap.set(h.coinId, { name: h.coinName, value: currentValue });
      }
    }

    const slices = Array.from(valueMap.values()).sort((a, b) => b.value - a.value);

    if (slices.length === 0) return null;

    const totalValue = slices.reduce((s, d) => s + d.value, 0);

    const chartData = slices.map((item, i) => ({
      name: item.name,
      value: parseFloat(item.value.toFixed(2)),
      itemStyle: { color: CHART_COLORS[i % CHART_COLORS.length] },
    }));

    const borderColor = siteTheme === 'light-blue' ? 'rgba(255,255,255,1)' : 'rgba(10,10,15,1)';

    return {
      ...echartsTheme,
      animation: showAnimations,
      tooltip: {
        ...echartsTheme.tooltip,
        trigger: 'item' as const,
        formatter: (p: any) => {
          const pct = totalValue > 0 ? ((p.value / totalValue) * 100).toFixed(1) : '0';
          return `<strong>${p.name}</strong><br/>
Value: ${formatCompact(p.value, vsCurrency)}<br/>
Allocation: ${pct}%`;
        },
      },
      legend: {
        orient: 'vertical' as const,
        right: 10,
        top: 'center' as const,
        textStyle: {
          ...echartsTheme.textStyle,
          fontSize: 10,
        },
      },
      series: [
        {
          type: 'pie' as const,
          radius: ['45%', '72%'],
          center: ['35%', '50%'],
          avoidLabelOverlap: true,
          padAngle: 2,
          itemStyle: {
            borderColor,
            borderWidth: 2,
            borderRadius: 4,
          },
          label: {
            show: true,
            formatter: (p: any) => {
              const pct = totalValue > 0 ? ((p.value / totalValue) * 100).toFixed(1) : '0';
              return `${p.name}\n${pct}%`;
            },
            fontSize: 10,
            color: echartsTheme.textStyle.color,
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 12,
              fontWeight: 'bold' as const,
            },
            itemStyle: {
              shadowBlur: 10,
              shadowColor: themeColors.fill,
            },
          },
          animationType: 'scale' as const,
          animationEasing: 'elasticOut' as const,
          data: chartData,
        },
      ],
    };
  }, [holdings, markets, echartsTheme, showAnimations, vsCurrency, siteTheme, themeColors]);

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
