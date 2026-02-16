'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';
import { Flame, TrendingUp } from 'lucide-react';

function linearSlope(prices: number[]): number {
  const n = prices.length;
  if (n < 5) return 0;
  let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
  for (let i = 0; i < n; i++) {
    sumX += i;
    sumY += prices[i];
    sumXY += i * prices[i];
    sumXX += i * i;
  }
  const denom = n * sumXX - sumX * sumX;
  if (denom === 0) return 0;
  const slope = (n * sumXY - sumX * sumY) / denom;
  const avgPrice = sumY / n;
  return avgPrice > 0 ? (slope / avgPrice) * 100 : 0; // Normalized % slope per period
}

export function AlphaFinderWidget() {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { alphaCoins, insight } = useMemo(() => {
    const markets = data.markets;
    const trending = data.trending;
    if (!markets || markets.length < 10) return { alphaCoins: null, insight: null };

    // Trending coin IDs for bonus
    const trendingIds = new Set(trending?.map((t) => t.item.id) || []);

    // Exclude top 3 (too big for "alpha")
    const excluded = new Set(['bitcoin', 'ethereum', 'binancecoin']);
    const candidates = markets.filter((m) => !excluded.has(m.id) && m.market_cap > 0 && m.total_volume > 0);

    // Compute median vol/mcap ratio
    const volMcapRatios = candidates.map((m) => m.total_volume / m.market_cap);
    const sortedRatios = [...volMcapRatios].sort((a, b) => a - b);
    const medianRatio = sortedRatios[Math.floor(sortedRatios.length / 2)] || 0.05;

    // Market average 24h change
    const avgChange = candidates.reduce((s, m) => s + (m.price_change_percentage_24h || 0), 0) / candidates.length;

    // Score each coin
    const scored = candidates.map((coin) => {
      const volMcap = coin.total_volume / coin.market_cap;

      // 1. Volume Surge (35%) — how much above median vol/mcap
      const volSurgeMultiple = medianRatio > 0 ? volMcap / medianRatio : 1;
      const volScore = Math.min(100, volSurgeMultiple * 25); // 4x median = 100

      // 2. Price Momentum (30%) — sparkline slope
      let momentumScore = 50;
      if (coin.sparkline_in_7d?.price && coin.sparkline_in_7d.price.length > 20) {
        const slope = linearSlope(coin.sparkline_in_7d.price);
        momentumScore = Math.min(100, Math.max(0, 50 + slope * 10)); // Centered at 50
      }

      // 3. Relative Strength (20%) — 24h change vs market average
      const relStrength = (coin.price_change_percentage_24h || 0) - avgChange;
      const rsScore = Math.min(100, Math.max(0, 50 + relStrength * 3));

      // 4. Trending Bonus (15%)
      const trendingBonus = trendingIds.has(coin.id) ? 100 : 0;

      const total = Math.round(
        volScore * 0.35 +
        momentumScore * 0.30 +
        rsScore * 0.20 +
        trendingBonus * 0.15
      );

      return {
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol.toUpperCase(),
        image: coin.image,
        score: Math.min(100, Math.max(0, total)),
        change24h: coin.price_change_percentage_24h || 0,
        volSurge: volSurgeMultiple,
        isTrending: trendingIds.has(coin.id),
        sparkline: coin.sparkline_in_7d?.price || [],
      };
    });

    const topAlpha = scored.sort((a, b) => b.score - a.score).slice(0, 8);

    const leader = topAlpha[0];
    const insightText = leader
      ? `${leader.symbol} leads alpha with ${leader.score} score — ${leader.volSurge.toFixed(1)}x volume surge, ${leader.change24h >= 0 ? '+' : ''}${leader.change24h.toFixed(1)}% vs market avg ${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(1)}%${leader.isTrending ? ', trending' : ''}.`
      : null;

    return { alphaCoins: topAlpha, insight: insightText };
  }, [data.markets, data.trending]);

  if (!data.markets) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-8 bg-gray-800/50 rounded" />
        ))}
      </div>
    );
  }

  if (!alphaCoins || alphaCoins.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No alpha signals detected</div>;
  }

  const maxScore = alphaCoins[0]?.score || 1;

  return (
    <div>
      <div className="space-y-1.5">
        {alphaCoins.map((coin, i) => (
          <div key={coin.id} className="flex items-center gap-2 text-xs py-1">
            {/* Rank */}
            <span className="text-gray-600 w-4 text-right font-mono">{i + 1}</span>

            {/* Coin info */}
            <div className="flex items-center gap-1.5 w-24">
              {coin.image && (
                <img src={coin.image} alt="" className="w-4 h-4 rounded-full" />
              )}
              <span className="text-white font-medium truncate">{coin.symbol}</span>
              {coin.isTrending && <TrendingUp className="w-3 h-3 text-amber-400 flex-shrink-0" />}
            </div>

            {/* Alpha bar */}
            <div className="flex-1 bg-gray-800 rounded-full h-3 relative overflow-hidden">
              <div
                className="h-3 rounded-full transition-all duration-500"
                style={{
                  width: `${(coin.score / maxScore) * 100}%`,
                  backgroundColor: themeColors.primary,
                  opacity: 0.6 + (coin.score / maxScore) * 0.4,
                }}
              />
              <span className="absolute right-1.5 top-1/2 -translate-y-1/2 text-[9px] font-mono text-gray-300">
                {coin.score}
              </span>
            </div>

            {/* Volume surge */}
            {coin.volSurge >= 2 && (
              <Flame className="w-3 h-3 text-orange-400 flex-shrink-0" />
            )}

            {/* 24h change */}
            <span className={`w-14 text-right font-mono ${coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {coin.change24h >= 0 ? '+' : ''}{coin.change24h.toFixed(1)}%
            </span>

            {/* Mini sparkline */}
            {coin.sparkline.length > 10 && (
              <svg width="40" height="16" viewBox="0 0 40 16" className="flex-shrink-0">
                <polyline
                  fill="none"
                  stroke={coin.change24h >= 0 ? '#22c55e' : '#ef4444'}
                  strokeWidth={1.2}
                  points={coin.sparkline
                    .filter((_, j) => j % Math.ceil(coin.sparkline.length / 20) === 0)
                    .map((p, j, arr) => {
                      const min = Math.min(...arr);
                      const max = Math.max(...arr);
                      const range = max - min || 1;
                      const x = (j / (arr.length - 1)) * 40;
                      const y = 15 - ((p - min) / range) * 14;
                      return `${x},${y}`;
                    })
                    .join(' ')}
                />
              </svg>
            )}
          </div>
        ))}
      </div>

      {insight && <p className="text-[10px] text-gray-400 mt-3 text-center italic">{insight}</p>}
    </div>
  );
}
