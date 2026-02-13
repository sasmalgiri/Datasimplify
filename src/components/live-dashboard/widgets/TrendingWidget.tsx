'use client';

import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import Image from 'next/image';
import { Flame } from 'lucide-react';

export function TrendingWidget() {
  const { data } = useLiveDashboardStore();
  const trending = data.trending;

  if (!trending) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-10 bg-gray-700 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {trending.slice(0, 7).map((t, idx) => {
        const coin = t.item;
        const change = coin.data?.price_change_percentage_24h?.usd;
        return (
          <div key={coin.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-800/30 hover:bg-gray-800/50 transition">
            <div className="flex items-center gap-3">
              <span className="text-gray-500 text-xs font-bold w-5">{idx + 1}</span>
              {coin.thumb && <Image src={coin.thumb} alt={coin.name} width={20} height={20} className="rounded-full" />}
              <div>
                <span className="text-white text-sm font-medium">{coin.name}</span>
                <span className="text-gray-500 text-xs ml-1.5 uppercase">{coin.symbol}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {coin.data?.price && (
                <span className="text-gray-300 text-sm">${Number(coin.data.price).toFixed(coin.data.price < 1 ? 6 : 2)}</span>
              )}
              {change !== undefined && (
                <span className={`text-xs font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {change >= 0 ? '+' : ''}{change.toFixed(1)}%
                </span>
              )}
              <Flame className="w-3 h-3 text-orange-400" />
            </div>
          </div>
        );
      })}
    </div>
  );
}
