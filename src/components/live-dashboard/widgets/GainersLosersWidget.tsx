'use client';

import { useState, useMemo } from 'react';
import { useLiveDashboardStore, type MarketCoin } from '@/lib/live-dashboard/store';
import { TABLE_DENSITY_MAP, formatPrice } from '@/lib/live-dashboard/theme';
import Image from 'next/image';
import { TrendingUp, TrendingDown } from 'lucide-react';

export function GainersLosersWidget() {
  const { data, customization } = useLiveDashboardStore();
  const density = TABLE_DENSITY_MAP[customization.tableDensity];
  const cur = customization.vsCurrency || 'usd';
  const [tab, setTab] = useState<'gainers' | 'losers'>('gainers');

  const insight = useMemo(() => {
    if (!data.markets?.length) return null;
    const allSorted = [...data.markets].sort((a, b) =>
      (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0),
    );
    const topGainer = allSorted[0];
    const topLoser = allSorted[allSorted.length - 1];
    const gainerChange = Math.abs(topGainer.price_change_percentage_24h ?? 0);
    const loserChange = Math.abs(topLoser.price_change_percentage_24h ?? 0);
    const ratio = loserChange > 0 ? (gainerChange / loserChange).toFixed(1) : '~';
    const gainerSign = (topGainer.price_change_percentage_24h ?? 0) >= 0 ? '+' : '';
    const loserSign = (topLoser.price_change_percentage_24h ?? 0) >= 0 ? '+' : '';
    return `Top gainer: ${topGainer.symbol.toUpperCase()} (${gainerSign}${(topGainer.price_change_percentage_24h ?? 0).toFixed(2)}%) \u00B7 Top loser: ${topLoser.symbol.toUpperCase()} (${loserSign}${(topLoser.price_change_percentage_24h ?? 0).toFixed(2)}%) \u00B7 Gain/loss magnitude ratio: ${ratio}x`;
  }, [data.markets]);

  if (!data.markets) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-gray-700 rounded" />
        ))}
      </div>
    );
  }

  const sorted = [...data.markets].sort((a, b) =>
    tab === 'gainers'
      ? (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0)
      : (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0),
  );
  const top = sorted.slice(0, 8);

  return (
    <div>
      <div className="flex gap-1 mb-4">
        <button
          onClick={() => setTab('gainers')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            tab === 'gainers' ? 'bg-emerald-500/20 text-emerald-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <TrendingUp className="w-3 h-3 inline mr-1" /> Gainers
        </button>
        <button
          onClick={() => setTab('losers')}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
            tab === 'losers' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'
          }`}
        >
          <TrendingDown className="w-3 h-3 inline mr-1" /> Losers
        </button>
      </div>

      <div className="space-y-2">
        {top.map((coin: MarketCoin) => (
          <div key={coin.id} className={`flex items-center justify-between ${density.py} ${density.px} rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition`}>
            <div className="flex items-center gap-2">
              {coin.image && <Image src={coin.image} alt={coin.name} width={20} height={20} className="rounded-full" />}
              <span className="text-white text-sm font-medium">{coin.name}</span>
              <span className="text-gray-500 text-xs uppercase">{coin.symbol}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-gray-300 text-sm">
                {formatPrice(coin.current_price, cur)}
              </span>
              <span className={`text-sm font-semibold min-w-[60px] text-right ${
                (coin.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {(coin.price_change_percentage_24h ?? 0) >= 0 ? '+' : ''}
                {(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
              </span>
            </div>
          </div>
        ))}
      </div>
      {insight && <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>}
    </div>
  );
}
