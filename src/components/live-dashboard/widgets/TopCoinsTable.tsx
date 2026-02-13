'use client';

import { useLiveDashboardStore, type MarketCoin } from '@/lib/live-dashboard/store';
import Image from 'next/image';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

function formatCompact(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  return `$${n.toLocaleString()}`;
}

function MiniSparkline({ prices }: { prices: number[] }) {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = prices.map((p, i) => `${(i / (prices.length - 1)) * w},${h - ((p - min) / range) * h}`).join(' ');
  const isUp = prices[prices.length - 1] >= prices[0];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={isUp ? '#10b981' : '#ef4444'}
        strokeWidth={1.5}
      />
    </svg>
  );
}

interface TopCoinsTableProps {
  limit?: number;
  category?: string;
}

export function TopCoinsTable({ limit = 20 }: TopCoinsTableProps) {
  const { data } = useLiveDashboardStore();
  const coins = data.markets?.slice(0, limit) || [];

  if (!data.markets) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-12 bg-gray-800/50 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
            <th className="text-left py-3 px-2">#</th>
            <th className="text-left py-3 px-2">Coin</th>
            <th className="text-right py-3 px-2">Price</th>
            <th className="text-right py-3 px-2">24h %</th>
            <th className="text-right py-3 px-2 hidden md:table-cell">7d %</th>
            <th className="text-right py-3 px-2 hidden md:table-cell">Market Cap</th>
            <th className="text-right py-3 px-2 hidden lg:table-cell">Volume (24h)</th>
            <th className="text-center py-3 px-2 hidden lg:table-cell">7d Chart</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin: MarketCoin) => (
            <tr key={coin.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition">
              <td className="py-3 px-2 text-gray-400">{coin.market_cap_rank}</td>
              <td className="py-3 px-2">
                <div className="flex items-center gap-2">
                  {coin.image && (
                    <Image src={coin.image} alt={coin.name} width={24} height={24} className="rounded-full" />
                  )}
                  <div>
                    <span className="text-white font-medium">{coin.name}</span>
                    <span className="text-gray-500 ml-1.5 uppercase text-xs">{coin.symbol}</span>
                  </div>
                </div>
              </td>
              <td className="py-3 px-2 text-right text-white font-medium">
                ${coin.current_price < 1 ? coin.current_price.toFixed(6) : coin.current_price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </td>
              <td className="py-3 px-2 text-right">
                <span className={`flex items-center justify-end gap-0.5 font-medium ${(coin.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(coin.price_change_percentage_24h ?? 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
                </span>
              </td>
              <td className="py-3 px-2 text-right hidden md:table-cell">
                <span className={`font-medium ${(coin.price_change_percentage_7d_in_currency ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(coin.price_change_percentage_7d_in_currency ?? 0) >= 0 ? '+' : ''}
                  {(coin.price_change_percentage_7d_in_currency ?? 0).toFixed(2)}%
                </span>
              </td>
              <td className="py-3 px-2 text-right text-gray-300 hidden md:table-cell">{formatCompact(coin.market_cap)}</td>
              <td className="py-3 px-2 text-right text-gray-300 hidden lg:table-cell">{formatCompact(coin.total_volume)}</td>
              <td className="py-3 px-2 text-center hidden lg:table-cell">
                <MiniSparkline prices={coin.sparkline_in_7d?.price || []} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
