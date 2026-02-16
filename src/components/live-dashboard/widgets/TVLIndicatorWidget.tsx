'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { TrendingUp, TrendingDown, DollarSign, Layers, BarChart3, Percent } from 'lucide-react';

function formatCompact(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

export function TVLIndicatorWidget() {
  const { data } = useLiveDashboardStore();
  const defi = data.defiGlobal;
  const global = data.global;

  const { cards, insight } = useMemo(() => {
    if (!defi) return { cards: null, insight: null };

    const defiMcap = parseFloat(defi.defi_market_cap) || 0;
    const ethMcap = parseFloat(defi.eth_market_cap) || 0;
    const defiToEth = parseFloat(defi.defi_to_eth_ratio) || 0;
    const volume24h = parseFloat(defi.trading_volume_24h) || 0;
    const defiDom = parseFloat(defi.defi_dominance) || 0;
    const topCoin = defi.top_coin_name || 'N/A';
    const topCoinDom = defi.top_coin_defi_dominance || 0;

    const totalMcap = global?.total_market_cap?.usd || 0;
    const defiShare = totalMcap > 0 ? (defiMcap / totalMcap) * 100 : 0;

    const cardData = [
      { label: 'DeFi Market Cap', value: formatCompact(defiMcap), icon: DollarSign, sub: `${defiShare.toFixed(1)}% of total` },
      { label: 'DeFi / ETH Ratio', value: `${(defiToEth * 100).toFixed(1)}%`, icon: Layers, sub: `ETH MCap: ${formatCompact(ethMcap)}` },
      { label: 'DeFi Dominance', value: `${defiDom.toFixed(2)}%`, icon: Percent, sub: `Top: ${topCoin} (${topCoinDom.toFixed(1)}%)` },
      { label: '24h DeFi Volume', value: formatCompact(volume24h), icon: BarChart3, sub: 'Across DeFi protocols' },
    ];

    const insightText = `DeFi represents ${defiShare.toFixed(1)}% of total crypto market cap · Top protocol: ${topCoin} at ${topCoinDom.toFixed(1)}% DeFi dominance`;

    return { cards: cardData, insight: insightText };
  }, [defi, global]);

  if (!defi) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 animate-pulse">
            <div className="h-3 bg-gray-700 rounded w-20 mb-3" />
            <div className="h-7 bg-gray-700 rounded w-28 mb-2" />
            <div className="h-3 bg-gray-700 rounded w-24" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-2 gap-3">
        {cards?.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase tracking-wider">
                <Icon className="w-3.5 h-3.5" />
                {card.label}
              </div>
              <div className="text-xl font-bold text-white mt-2">{card.value}</div>
              <div className="text-[11px] text-gray-500 mt-1">{card.sub}</div>
            </div>
          );
        })}
      </div>
      {insight && <p className="text-[10px] text-gray-400 mt-2 text-center italic">{insight}</p>}
    </div>
  );
}
