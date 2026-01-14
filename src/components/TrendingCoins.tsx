'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RefreshCw, TrendingUp, ExternalLink, Flame } from 'lucide-react';

interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  small: string;
  large: string;
  market_cap_rank: number;
  price_btc: number;
  score: number;
  price_usd?: number;
  price_change_24h?: number;
  market_cap?: string;
  total_volume?: string;
  sparkline?: string;
}

interface TrendingCoinsProps {
  limit?: number;
  showTitle?: boolean;
  compact?: boolean;
  className?: string;
}

export function TrendingCoins({
  limit = 7,
  showTitle = true,
  compact = false,
  className = '',
}: TrendingCoinsProps) {
  const [coins, setCoins] = useState<TrendingCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchTrending = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crypto/trending');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch trending');
      }

      setCoins(result.data.coins.slice(0, limit));
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching trending:', err);
      setError('Unable to load trending coins');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTrending();
    // Refresh every 5 minutes
    const interval = setInterval(fetchTrending, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchTrending]);

  const formatPrice = (price: number | undefined) => {
    if (price === undefined || price === null) return '—';
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const formatChange = (change: number | undefined) => {
    if (change === undefined || change === null) return null;
    const formatted = Math.abs(change).toFixed(2);
    return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  if (loading && coins.length === 0) {
    return (
      <div className={`bg-gray-900 rounded-xl border border-gray-800 p-6 ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-white">Trending</h2>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
          <span className="ml-2 text-gray-400">Loading trending coins...</span>
        </div>
      </div>
    );
  }

  if (error && coins.length === 0) {
    return (
      <div className={`bg-gray-900 rounded-xl border border-gray-800 p-6 ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-white">Trending</h2>
          </div>
        )}
        <div className="text-center py-8">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchTrending}
            className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={`bg-gray-900 rounded-xl border border-gray-800 overflow-hidden ${className}`}>
        {showTitle && (
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-white">Trending</h2>
            </div>
            <button
              onClick={fetchTrending}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        )}
        <div className="divide-y divide-gray-800">
          {coins.map((coin, index) => (
            <Link
              key={coin.id}
              href={`/coin/${coin.id}`}
              className="flex items-center gap-3 p-3 hover:bg-gray-800/50 transition"
            >
              <span className="text-gray-500 font-medium w-4">{index + 1}</span>
              <div className="relative w-6 h-6">
                <Image
                  src={coin.thumb}
                  alt={coin.name}
                  fill
                  className="rounded-full object-cover"
                  unoptimized
                />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-white font-medium truncate block">{coin.symbol}</span>
              </div>
              {coin.price_change_24h !== undefined && (
                <span
                  className={`text-sm font-medium ${
                    coin.price_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {formatChange(coin.price_change_24h)}
                </span>
              )}
            </Link>
          ))}
        </div>
        <div className="p-2 bg-gray-800/50 border-t border-gray-800">
          <Link
            href="/trending"
            className="flex items-center justify-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition"
          >
            View all trending
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 overflow-hidden ${className}`}>
      {showTitle && (
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold text-white">Trending Coins</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
              CoinGecko
            </span>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchTrending}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4">
        {coins.map((coin, index) => (
          <Link
            key={coin.id}
            href={`/coin/${coin.id}`}
            className="bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="relative">
                <span className="absolute -top-1 -left-1 w-4 h-4 bg-orange-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                  {index + 1}
                </span>
                <div className="relative w-10 h-10">
                  <Image
                    src={coin.small}
                    alt={coin.name}
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-white truncate group-hover:text-emerald-400 transition">
                  {coin.name}
                </h3>
                <p className="text-sm text-gray-400">{coin.symbol}</p>
              </div>
              <TrendingUp className="w-4 h-4 text-orange-400 opacity-50" />
            </div>

            <div className="space-y-1">
              {coin.price_usd !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Price</span>
                  <span className="text-white font-mono">{formatPrice(coin.price_usd)}</span>
                </div>
              )}
              {coin.price_change_24h !== undefined && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">24h</span>
                  <span
                    className={`font-medium ${
                      coin.price_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatChange(coin.price_change_24h)}
                  </span>
                </div>
              )}
              {coin.market_cap_rank && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Rank</span>
                  <span className="text-white">#{coin.market_cap_rank}</span>
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>

      <div className="p-3 bg-gray-800/50 border-t border-gray-800 flex items-center justify-between">
        <span className="text-xs text-gray-500">Data provided by CoinGecko</span>
        <Link
          href="/trending"
          className="text-sm text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
        >
          View full list
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
