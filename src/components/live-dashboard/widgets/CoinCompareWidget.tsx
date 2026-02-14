'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { formatCompact, formatPercent, percentColor, getThemeColors } from '@/lib/live-dashboard/theme';
import { CARD_CLASSES_STATIC } from '@/lib/live-dashboard/theme';

interface CoinCompareWidgetProps {
  coinIds?: string[];
}

export function CoinCompareWidget({ coinIds = ['bitcoin', 'ethereum'] }: CoinCompareWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const coins = useMemo(() => {
    if (!data.markets) return [];
    return coinIds
      .map((id) => data.markets!.find((c) => c.id === id))
      .filter(Boolean) as typeof data.markets;
  }, [data.markets, coinIds]);

  if (!coins || coins.length < 2) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-600 text-sm">
        Select at least 2 coins to compare
      </div>
    );
  }

  const metrics = [
    { label: 'Price', render: (c: any) => `$${c.current_price.toLocaleString()}` },
    { label: 'Market Cap', render: (c: any) => formatCompact(c.market_cap) },
    { label: '24h Volume', render: (c: any) => formatCompact(c.total_volume) },
    { label: '24h Change', render: (c: any) => formatPercent(c.price_change_percentage_24h), isPercent: true },
    { label: '7d Change', render: (c: any) => formatPercent(c.price_change_percentage_7d_in_currency), isPercent: true },
    { label: 'Rank', render: (c: any) => `#${c.market_cap_rank}` },
    { label: 'ATH Change', render: (c: any) => formatPercent(c.ath_change_percentage), isPercent: true },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.06]">
            <th className="text-left text-[10px] text-gray-500 uppercase tracking-wider py-2 px-2">Metric</th>
            {coins.map((coin) => (
              <th key={coin.id} className="text-right text-[10px] text-gray-500 uppercase tracking-wider py-2 px-2">
                <div className="flex items-center justify-end gap-1.5">
                  {coin.image && (
                    <img src={coin.image} alt="" className="w-4 h-4 rounded-full" />
                  )}
                  {coin.symbol.toUpperCase()}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {metrics.map((m) => (
            <tr key={m.label} className="border-b border-white/[0.03]">
              <td className="text-gray-500 text-xs py-2.5 px-2">{m.label}</td>
              {coins.map((coin) => {
                const val = m.render(coin);
                const colorClass = m.isPercent
                  ? percentColor(
                      m.label === '24h Change' ? coin.price_change_percentage_24h
                      : m.label === '7d Change' ? coin.price_change_percentage_7d_in_currency
                      : coin.ath_change_percentage
                    )
                  : 'text-white';
                return (
                  <td key={coin.id} className={`text-right font-medium text-xs py-2.5 px-2 ${colorClass}`}>
                    {val}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
