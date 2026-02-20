'use client';

import { useLiveDashboardStore, type MarketCoin } from '@/lib/live-dashboard/store';
import { useUserPrefsStore } from '@/lib/live-dashboard/user-prefs-store';
import { TABLE_DENSITY_MAP, formatCompact, formatPrice } from '@/lib/live-dashboard/theme';
import { Star, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import Image from 'next/image';

/* ---------- mini sparkline ---------- */

function MiniSparkline({ prices }: { prices: number[] }) {
  if (!prices || prices.length < 2) return null;
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;
  const w = 80;
  const h = 24;
  const points = prices
    .map((p, i) => `${(i / (prices.length - 1)) * w},${h - ((p - min) / range) * h}`)
    .join(' ');
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

/* ---------- component ---------- */

export function WatchlistWidget() {
  const { data, customization } = useLiveDashboardStore();
  const { watchlist, toggleWatchlist, isInWatchlist } = useUserPrefsStore();
  const density = TABLE_DENSITY_MAP[customization.tableDensity];
  const cur = customization.vsCurrency || 'usd';

  // Filter market data to only coins in the watchlist
  const watchlistCoins: MarketCoin[] = (data.markets ?? []).filter((coin) =>
    watchlist.includes(coin.id),
  );

  // Preserve the user's watchlist order
  const sortedCoins = watchlistCoins.sort(
    (a, b) => watchlist.indexOf(a.id) - watchlist.indexOf(b.id),
  );

  /* -- empty state -- */
  if (watchlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <Star className="w-6 h-6 text-gray-500" />
        </div>
        <p className="text-gray-400 text-sm font-medium mb-1">No watchlist coins yet</p>
        <p className="text-gray-500 text-xs max-w-[220px]">
          Star coins from the table below to add them here
        </p>
      </div>
    );
  }

  /* -- loading state (markets haven't loaded yet) -- */
  if (!data.markets) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: Math.min(watchlist.length, 5) }).map((_, i) => (
          <div key={i} className="h-10 bg-white/[0.04] rounded-lg" />
        ))}
      </div>
    );
  }

  /* -- no matching coins found (watchlist has IDs but none match market data) -- */
  if (sortedCoins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <p className="text-gray-400 text-sm">
          Watchlist coins not found in current market data.
        </p>
        <p className="text-gray-500 text-xs mt-1">
          Try refreshing the dashboard to load updated data.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${density.text}`}>
        <thead>
          <tr className="text-gray-400 text-xs uppercase border-b border-white/[0.06]">
            <th className={`text-center ${density.py} px-2`} style={{ width: 36 }} />
            <th className={`text-left ${density.py} ${density.px}`}>Coin</th>
            <th className={`text-right ${density.py} ${density.px}`}>Price</th>
            <th className={`text-right ${density.py} ${density.px}`}>24h %</th>
            <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>
              Market Cap
            </th>
            <th className={`text-center ${density.py} ${density.px} hidden lg:table-cell`}>
              7d Chart
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCoins.map((coin) => {
            const change = coin.price_change_percentage_24h ?? 0;
            const isPositive = change >= 0;

            return (
              <tr
                key={coin.id}
                className="border-b border-white/[0.04] hover:bg-white/[0.03] transition-colors"
              >
                {/* Star button */}
                <td className={`${density.py} px-2 text-center`}>
                  <button
                    onClick={() => toggleWatchlist(coin.id)}
                    className="p-1 rounded-md hover:bg-white/[0.06] transition-colors"
                    aria-label={
                      isInWatchlist(coin.id)
                        ? `Remove ${coin.name} from watchlist`
                        : `Add ${coin.name} to watchlist`
                    }
                  >
                    <Star
                      className="w-4 h-4 transition-colors"
                      fill={isInWatchlist(coin.id) ? '#facc15' : 'none'}
                      stroke={isInWatchlist(coin.id) ? '#facc15' : '#6b7280'}
                    />
                  </button>
                </td>

                {/* Coin name + icon */}
                <td className={`${density.py} ${density.px}`}>
                  <div className="flex items-center gap-2">
                    {coin.image && (
                      <Image
                        src={coin.image}
                        alt={coin.name}
                        width={22}
                        height={22}
                        className="rounded-full"
                      />
                    )}
                    <div className="flex items-baseline gap-1.5 min-w-0">
                      <span className="text-white font-medium truncate">{coin.name}</span>
                      <span className="text-gray-500 uppercase text-[10px] shrink-0">
                        {coin.symbol}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Price */}
                <td
                  className={`${density.py} ${density.px} text-right text-white font-medium tabular-nums`}
                >
                  {formatPrice(coin.current_price, cur)}
                </td>

                {/* 24h change */}
                <td className={`${density.py} ${density.px} text-right`}>
                  <span
                    className={`inline-flex items-center gap-0.5 font-medium ${
                      isPositive ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {isPositive ? (
                      <ArrowUpRight className="w-3 h-3" />
                    ) : (
                      <ArrowDownRight className="w-3 h-3" />
                    )}
                    {Math.abs(change).toFixed(2)}%
                  </span>
                </td>

                {/* Market cap */}
                <td
                  className={`${density.py} ${density.px} text-right text-gray-300 hidden md:table-cell`}
                >
                  {formatCompact(coin.market_cap, cur)}
                </td>

                {/* Mini sparkline */}
                <td
                  className={`${density.py} ${density.px} text-center hidden lg:table-cell`}
                >
                  <MiniSparkline prices={coin.sparkline_in_7d?.price || []} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
