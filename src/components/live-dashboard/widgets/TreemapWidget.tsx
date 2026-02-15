'use client';

import { useMemo } from 'react';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import * as echarts from 'echarts/core';
import { TreemapChart } from 'echarts/charts';
import { TooltipComponent } from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ECHARTS_THEME, getThemeColors, CHART_HEIGHT_MAP } from '@/lib/live-dashboard/theme';

echarts.use([TreemapChart, TooltipComponent, CanvasRenderer]);

interface TreemapWidgetProps {
  limit?: number;
}

export function TreemapWidget({ limit = 30 }: TreemapWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { option, insight } = useMemo(() => {
    if (!data.markets || data.markets.length === 0) return { option: null, insight: null };

    const coins = data.markets.slice(0, limit);
    const treeData = coins.map((coin) => {
      const change = coin.price_change_percentage_24h || 0;
      const isPositive = change >= 0;
      return {
        name: coin.symbol.toUpperCase(),
        value: coin.market_cap,
        label: {
          show: true,
          formatter: `{b}\n${change >= 0 ? '+' : ''}${change.toFixed(1)}%`,
          color: '#fff',
          fontSize: 10,
          lineHeight: 14,
        },
        itemStyle: {
          color: isPositive
            ? `${themeColors.primary}${Math.round((0.3 + Math.min(Math.abs(change) / 15, 0.6)) * 255).toString(16).padStart(2, '0')}`
            : `rgba(239, 68, 68, ${0.3 + Math.min(Math.abs(change) / 15, 0.6)})`,
          borderColor: 'rgba(10, 10, 15, 0.8)',
          borderWidth: 2,
          borderRadius: 4,
        },
      };
    });

    const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
    const top3Mcap = [...coins].sort((a, b) => b.market_cap - a.market_cap).slice(0, 3).reduce((s, c) => s + c.market_cap, 0);
    const top3Pct = totalMcap > 0 ? ((top3Mcap / totalMcap) * 100).toFixed(1) : '0';
    const gaining = coins.filter((c) => (c.price_change_percentage_24h || 0) >= 0).length;
    const losing = coins.length - gaining;
    const insightText = `Top 3 coins hold ${top3Pct}% of displayed market cap · ${gaining} gaining, ${losing} losing`;

    return { insight: insightText, option: {
      ...ECHARTS_THEME,
      animation: customization.showAnimations,
      tooltip: {
        ...ECHARTS_THEME.tooltip,
        formatter: (p: any) => {
          const coin = coins.find((c) => c.symbol.toUpperCase() === p.name);
          if (!coin) return p.name;
          const change = coin.price_change_percentage_24h || 0;
          return `<strong>${coin.name} (${p.name})</strong><br/>
            Market Cap: $${(coin.market_cap / 1e9).toFixed(2)}B<br/>
            Price: $${coin.current_price.toLocaleString()}<br/>
            24h: <span style="color:${change >= 0 ? themeColors.primary : '#ef4444'}">${change >= 0 ? '+' : ''}${change.toFixed(2)}%</span>`;
        },
      },
      series: [
        {
          type: 'treemap' as const,
          data: treeData,
          roam: false,
          nodeClick: false,
          breadcrumb: { show: false },
          levels: [
            {
              itemStyle: {
                borderColor: 'rgba(10,10,15,0.8)',
                borderWidth: 2,
                gapWidth: 2,
              },
            },
          ],
        },
      ],
    }};
  }, [data.markets, limit, customization]);

  if (!data.markets || !option) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        No market data available
      </div>
    );
  }

  return (
    <div>
      <ReactEChartsCore
        echarts={echarts}
        option={option}
        style={{ height: `${CHART_HEIGHT_MAP[customization.chartHeight]}px`, width: '100%' }}
        notMerge
        lazyUpdate
      />
      {insight && <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>}
    </div>
  );
}
