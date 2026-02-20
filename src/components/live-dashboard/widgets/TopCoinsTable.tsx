'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore, type MarketCoin } from '@/lib/live-dashboard/store';
import { useUserPrefsStore } from '@/lib/live-dashboard/user-prefs-store';
import { TABLE_DENSITY_MAP, formatCompact, formatPrice } from '@/lib/live-dashboard/theme';
import Image from 'next/image';
import { ArrowUpRight, ArrowDownRight, Star } from 'lucide-react';

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
  const { data, customization } = useLiveDashboardStore();
  const { watchlist, toggleWatchlist } = useUserPrefsStore();
  const density = TABLE_DENSITY_MAP[customization.tableDensity];
  const cur = customization.vsCurrency || 'usd';
  const coins = data.markets?.slice(0, limit) || [];

  const insight = useMemo(() => {
    if (!coins.length) return null;
    const greenCount = coins.filter((c) => (c.price_change_percentage_24h ?? 0) >= 0).length;
    const avg24h = coins.reduce((s, c) => s + (c.price_change_percentage_24h ?? 0), 0) / coins.length;
    const totalMcap = coins.reduce((s, c) => s + (c.market_cap || 0), 0);
    const totalVol = coins.reduce((s, c) => s + (c.total_volume || 0), 0);
    const volMcapRatio = totalMcap > 0 ? ((totalVol / totalMcap) * 100).toFixed(1) : '0';
    return `${greenCount}/${coins.length} coins green \u00B7 Avg 24h change: ${avg24h >= 0 ? '+' : ''}${avg24h.toFixed(2)}% \u00B7 Total MCap: ${formatCompact(totalMcap, cur)} \u00B7 Vol/MCap ratio: ${volMcapRatio}%`;
  }, [coins, cur]);

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
      <table className={`w-full ${density.text}`}>
        <thead>
          <tr className="text-gray-400 text-xs uppercase border-b border-gray-700">
            <th className={`text-center ${density.py} px-1 w-8`} title="Watchlist"><Star className="w-3 h-3 inline" /></th>
            <th className={`text-left ${density.py} ${density.px}`}>#</th>
            <th className={`text-left ${density.py} ${density.px}`}>Coin</th>
            <th className={`text-right ${density.py} ${density.px}`}>Price</th>
            <th className={`text-right ${density.py} ${density.px}`}>24h %</th>
            <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>7d %</th>
            <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>ATH Dist</th>
            <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>Market Cap</th>
            <th className={`text-right ${density.py} ${density.px} hidden lg:table-cell`}>Volume (24h)</th>
            <th className={`text-center ${density.py} ${density.px} hidden lg:table-cell`}>7d Chart</th>
          </tr>
        </thead>
        <tbody>
          {coins.map((coin: MarketCoin) => (
            <tr key={coin.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition">
              <td className={`${density.py} px-1 text-center`}>
                <button
                  type="button"
                  onClick={() => toggleWatchlist(coin.id)}
                  className="p-0.5 transition hover:scale-110"
                  title={watchlist.includes(coin.id) ? 'Remove from watchlist' : 'Add to watchlist'}
                >
                  <Star className={`w-3.5 h-3.5 ${watchlist.includes(coin.id) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600 hover:text-gray-400'}`} />
                </button>
              </td>
              <td className={`${density.py} ${density.px} text-gray-400`}>{coin.market_cap_rank}</td>
              <td className={`${density.py} ${density.px}`}>
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
              <td className={`${density.py} ${density.px} text-right text-white font-medium`}>
                {formatPrice(coin.current_price, cur)}
              </td>
              <td className={`${density.py} ${density.px} text-right`}>
                <span className={`flex items-center justify-end gap-0.5 font-medium ${(coin.price_change_percentage_24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(coin.price_change_percentage_24h ?? 0) >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {Math.abs(coin.price_change_percentage_24h ?? 0).toFixed(2)}%
                </span>
              </td>
              <td className={`${density.py} ${density.px} text-right hidden md:table-cell`}>
                <span className={`font-medium ${(coin.price_change_percentage_7d_in_currency ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {(coin.price_change_percentage_7d_in_currency ?? 0) >= 0 ? '+' : ''}
                  {(coin.price_change_percentage_7d_in_currency ?? 0).toFixed(2)}%
                </span>
              </td>
              <td className={`${density.py} ${density.px} text-right hidden md:table-cell`}>
                {coin.ath_change_percentage != null ? (
                  <span className={`text-xs font-medium ${coin.ath_change_percentage > -10 ? 'text-emerald-400' : coin.ath_change_percentage > -50 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {coin.ath_change_percentage.toFixed(1)}%
                  </span>
                ) : (
                  <span className="text-gray-600">—</span>
                )}
              </td>
              <td className={`${density.py} ${density.px} text-right text-gray-300 hidden md:table-cell`}>{formatCompact(coin.market_cap, cur)}</td>
              <td className={`${density.py} ${density.px} text-right text-gray-300 hidden lg:table-cell`}>{formatCompact(coin.total_volume, cur)}</td>
              <td className={`${density.py} ${density.px} text-center hidden lg:table-cell`}>
                <MiniSparkline prices={coin.sparkline_in_7d?.price || []} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {insight && <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>}
    </div>
  );
}
