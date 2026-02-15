'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { SunburstChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP, formatCompact } from '@/lib/live-dashboard/theme';

echarts.use([SunburstChart, TooltipComponent, CanvasRenderer]);

interface SunburstWidgetProps {
  limit?: number;
}

const TIERS = [
  { label: 'Mega Cap (>$100B)', min: 100e9, colorIdx: 0 },
  { label: 'Large Cap ($10B–$100B)', min: 10e9, colorIdx: 1 },
  { label: 'Mid Cap ($1B–$10B)', min: 1e9, colorIdx: 2 },
  { label: 'Small Cap (<$1B)', min: 0, colorIdx: 3 },
] as const;

function getTier(mcap: number) {
  for (const t of TIERS) if (mcap >= t.min) return t;
  return TIERS[3];
}

export function SunburstWidget({ limit = 50 }: SunburstWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = CHART_HEIGHT_MAP[customization.chartHeight];

  const { option, insight } = useMemo(() => {
    if (!data.markets?.length) return { option: null, insight: null };

    const coins = data.markets.slice(0, limit);
    const groups = new Map<string, typeof coins>();

    for (const coin of coins) {
      const tier = getTier(coin.market_cap || 0);
      const list = groups.get(tier.label) || [];
      list.push(coin);
      groups.set(tier.label, list);
    }

    const palette = themeColors.palette;
    const children = TIERS.map((tier) => {
      const tierCoins = groups.get(tier.label) || [];
      if (!tierCoins.length) return null;
      return {
        name: tier.label,
        itemStyle: { color: palette[tier.colorIdx] },
        children: tierCoins.map((coin) => {
          const change = coin.price_change_percentage_24h || 0;
          const intensity = Math.min(1, Math.abs(change) / 10);
          return {
            name: coin.symbol.toUpperCase(),
            value: coin.market_cap,
            itemStyle: {
              color: change >= 0
                ? `rgba(34,197,94,${0.3 + intensity * 0.7})`
                : `rgba(239,68,68,${0.3 + intensity * 0.7})`,
            },
            coinName: coin.name,
            change,
          };
        }),
      };
    }).filter(Boolean);

    // Compute insight
    const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
    const tierPcts = TIERS.map((tier) => {
      const tierCoins = groups.get(tier.label) || [];
      const tierMcap = tierCoins.reduce((s, c) => s + (c.market_cap || 0), 0);
      return { label: tier.label, pct: totalMcap > 0 ? (tierMcap / totalMcap) * 100 : 0, count: tierCoins.length };
    });
    const megaPct = tierPcts[0].pct.toFixed(1);
    const largePct = tierPcts[1].pct.toFixed(1);
    const midSmallPct = (tierPcts[2].pct + tierPcts[3].pct).toFixed(1);
    const gainingCount = coins.filter((c) => (c.price_change_percentage_24h || 0) > 0).length;
    const insightText = `Mega caps: ${megaPct}% of market \u00B7 Large: ${largePct}% \u00B7 Mid+Small: ${midSmallPct}% \u00B7 ${gainingCount} coins gaining across tiers`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        formatter: (params: any) => {
          const d = params.data;
          if (d.coinName) {
            const sign = d.change >= 0 ? '+' : '';
            return `<b>${d.coinName} (${d.name})</b><br/>MCap: ${formatCompact(d.value)}<br/>24h: ${sign}${d.change.toFixed(2)}%`;
          }
          return `<b>${d.name}</b>`;
        },
      },
      series: [
        {
          type: 'sunburst',
          data: children,
          radius: ['8%', '92%'],
          sort: undefined,
          emphasis: { focus: 'descendant' },
          levels: [
            {},
            {
              r0: '8%',
              r: '35%',
              label: {
                show: true,
                fontSize: 10,
                color: '#fff',
                fontWeight: 'bold',
                overflow: 'truncate',
                width: 80,
              },
              itemStyle: { borderWidth: 2, borderColor: '#0a0a0f' },
            },
            {
              r0: '35%',
              r: '92%',
              label: {
                show: true,
                fontSize: 9,
                color: 'rgba(255,255,255,0.7)',
                position: 'outside',
                silent: false,
              },
              itemStyle: { borderWidth: 1, borderColor: '#0a0a0f' },
            },
          ],
          animationDurationUpdate: 500,
        },
      ],
    }};
  }, [data.markets, limit, themeColors]);

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
      {insight && <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>}
    </div>
  );
}
