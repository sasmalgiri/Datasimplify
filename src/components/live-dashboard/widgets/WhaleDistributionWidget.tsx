'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { TreemapChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP, formatCompact } from '@/lib/live-dashboard/theme';

echarts.use([TreemapChart, TooltipComponent, CanvasRenderer]);

interface WhaleDistributionWidgetProps {}

const TIERS = [
  { label: 'Humpback', range: '>$100B', emoji: '\u{1F40B}', min: 100e9, color: '#34d399' },
  { label: 'Whale', range: '$50B–$100B', emoji: '\u{1F433}', min: 50e9, color: '#2dd4bf' },
  { label: 'Shark', range: '$10B–$50B', emoji: '\u{1F988}', min: 10e9, color: '#a78bfa' },
  { label: 'Dolphin', range: '$1B–$10B', emoji: '\u{1F42C}', min: 1e9, color: '#60a5fa' },
  { label: 'Fish', range: '$100M–$1B', emoji: '\u{1F41F}', min: 100e6, color: '#fb923c' },
  { label: 'Shrimp', range: '<$100M', emoji: '\u{1F990}', min: 0, color: '#f472b6' },
] as const;

function getTier(mcap: number) {
  for (const t of TIERS) if (mcap >= t.min) return t;
  return TIERS[5];
}

export function WhaleDistributionWidget({}: WhaleDistributionWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const chartHeight = Math.max(300, CHART_HEIGHT_MAP[customization.chartHeight]);

  const { option, insight } = useMemo(() => {
    if (!data.markets?.length) return { option: null, insight: null };

    const totalMcap = data.markets.reduce((s, c) => s + (c.market_cap || 0), 0);
    const tierStats = TIERS.map(() => ({ count: 0, totalMcap: 0, totalChange: 0, coins: [] as string[] }));

    for (const coin of data.markets) {
      const tier = getTier(coin.market_cap || 0);
      const idx = TIERS.indexOf(tier);
      tierStats[idx].count += 1;
      tierStats[idx].totalMcap += coin.market_cap || 0;
      tierStats[idx].totalChange += coin.price_change_percentage_24h || 0;
      if (tierStats[idx].coins.length < 5) tierStats[idx].coins.push(coin.symbol.toUpperCase());
    }

    const treemapData = TIERS.map((tier, i) => {
      const stats = tierStats[i];
      if (stats.count === 0) return null;
      const pct = totalMcap > 0 ? (stats.totalMcap / totalMcap) * 100 : 0;
      return {
        name: tier.label,
        value: stats.totalMcap,
        pct,
        count: stats.count,
        range: tier.range,
        emoji: tier.emoji,
        avgChange: stats.count > 0 ? stats.totalChange / stats.count : 0,
        topCoins: stats.coins,
        itemStyle: { color: tier.color, borderColor: '#0a0a0f', borderWidth: 3 },
      };
    }).filter(Boolean);

    // Compute insight
    const humpbackIdx = 0; // Humpback tier
    const humpbackPct = totalMcap > 0 ? ((tierStats[humpbackIdx].totalMcap / totalMcap) * 100).toFixed(1) : '0';
    const activeTiers = tierStats.filter((t) => t.count > 0).length;
    let mostCoinsTier: string = TIERS[0].label;
    let mostCoinsCount = 0;
    tierStats.forEach((t, i) => {
      if (t.count > mostCoinsCount) {
        mostCoinsCount = t.count;
        mostCoinsTier = TIERS[i].label;
      }
    });
    const insightText = `Humpbacks hold ${humpbackPct}% of market \u00B7 ${activeTiers} tiers active \u00B7 Most coins in ${mostCoinsTier} tier`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        formatter: (params: any) => {
          const d = params.data;
          const sign = d.avgChange >= 0 ? '+' : '';
          return `<b>${d.emoji} ${d.name} (${d.range})</b><br/>${d.count} coins · ${d.pct.toFixed(1)}% of market<br/>Total MCap: ${formatCompact(d.value)}<br/>Avg 24h: ${sign}${d.avgChange.toFixed(2)}%<br/>Top: ${d.topCoins.join(', ')}`;
        },
      },
      series: [
        {
          type: 'treemap',
          width: '100%',
          height: '100%',
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          data: treemapData,
          label: {
            show: true,
            formatter: (p: any) => {
              const d = p.data;
              return `{emoji|${d.emoji}}\n{name|${d.name.toUpperCase()}}\n{pct|${d.pct.toFixed(1)}%}`;
            },
            rich: {
              emoji: { fontSize: 28, lineHeight: 36, align: 'center' },
              name: {
                fontSize: 13,
                fontWeight: 'bold',
                color: '#fff',
                lineHeight: 20,
                align: 'center',
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowBlur: 4,
              },
              pct: {
                fontSize: 16,
                fontWeight: 'bold',
                color: 'rgba(255,255,255,0.9)',
                lineHeight: 24,
                align: 'center',
                textShadowColor: 'rgba(0,0,0,0.5)',
                textShadowBlur: 4,
              },
            },
            position: 'inside',
            align: 'center',
            verticalAlign: 'middle',
          },
          upperLabel: { show: false },
          levels: [
            {
              itemStyle: {
                borderColor: '#0a0a0f',
                borderWidth: 3,
                gapWidth: 3,
              },
            },
          ],
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowColor: 'rgba(0,0,0,0.5)',
            },
          },
        },
      ],
    }};
  }, [data.markets, themeColors, customization]);

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
      <p className="text-[10px] text-gray-500 mt-0.5 text-center">
        Block size = proportion of total market cap held
      </p>
    </div>
  );
}
