'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { RefreshCw, Sparkles, ExternalLink, TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface RecentCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  total_volume: number;
  price_change_percentage_24h: number;
  listed_date: string;
}

export default function RecentlyAddedPage() {
  const [coins, setCoins] = useState<RecentCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchCoins = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crypto/recently-added?limit=30');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch recently added coins');
      }

      setCoins(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching coins:', err);
      setError('Unable to load recently added coins');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoins();
    const interval = setInterval(fetchCoins, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCoins]);

  const formatPrice = (price: number) => {
    if (!price) return '—';
    if (price < 0.0001) return `$${price.toFixed(8)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const formatMarketCap = (cap: number) => {
    if (!cap) return '—';
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    if (cap >= 1e3) return `$${(cap / 1e3).toFixed(2)}K`;
    return `$${cap.toLocaleString()}`;
  };

  const formatChange = (change: number) => {
    if (change === undefined || change === null) return null;
    const formatted = Math.abs(change).toFixed(2);
    return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="w-8 h-8 text-yellow-500" />
              <h1 className="text-3xl font-bold text-white">Recently Added Coins</h1>
            </div>
            <p className="text-gray-400">
              Discover the newest cryptocurrencies on the market.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchCoins}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && coins.length === 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <RefreshCw className="w-8 h-8 text-yellow-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading recently added coins...</p>
          </div>
        )}

        {/* Error State */}
        {error && coins.length === 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchCoins}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Coins Table */}
        {coins.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-800">
                    <th className="text-left py-4 px-4 font-medium">#</th>
                    <th className="text-left py-4 px-4 font-medium">Coin</th>
                    <th className="text-right py-4 px-4 font-medium">Price</th>
                    <th className="text-right py-4 px-4 font-medium">24h Change</th>
                    <th className="text-right py-4 px-4 font-medium hidden md:table-cell">Market Cap</th>
                    <th className="text-right py-4 px-4 font-medium hidden lg:table-cell">Volume (24h)</th>
                    <th className="text-left py-4 px-4 font-medium hidden lg:table-cell">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin, index) => (
                    <tr
                      key={coin.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition"
                    >
                      <td className="py-4 px-4 text-gray-500">{index + 1}</td>
                      <td className="py-4 px-4">
                        <Link href={`/coin/${coin.id}`} className="flex items-center gap-3 group">
                          {coin.image && (
                            <div className="relative w-8 h-8">
                              <Image
                                src={coin.image}
                                alt={coin.name}
                                fill
                                className="rounded-full object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                          <div>
                            <span className="text-white font-medium group-hover:text-yellow-400 transition">
                              {coin.name}
                            </span>
                            <span className="text-gray-500 text-sm ml-2">{coin.symbol}</span>
                          </div>
                        </Link>
                      </td>
                      <td className="py-4 px-4 text-right text-white font-mono">
                        {formatPrice(coin.current_price)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <span
                          className={`flex items-center justify-end gap-1 font-medium ${
                            coin.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {coin.price_change_percentage_24h >= 0 ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          {formatChange(coin.price_change_percentage_24h)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-gray-300 font-mono hidden md:table-cell">
                        {formatMarketCap(coin.market_cap)}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-300 font-mono hidden lg:table-cell">
                        {formatMarketCap(coin.total_volume)}
                      </td>
                      <td className="py-4 px-4 text-gray-400 hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(coin.listed_date)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="mt-8 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold text-white">Export New Listings</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Download recently added coins as Excel templates with live CryptoSheets formulas.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 transition"
          >
            Get Excel Templates
            <ExternalLink className="w-4 h-4" />
          </Link>
        </div>

        {/* Attribution */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Data provided by{' '}
            <a
              href="https://www.coingecko.com/en/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-yellow-400 hover:underline"
            >
              CoinGecko
            </a>
            . Updated every 10 minutes.
          </p>
        </div>
      </main>
    </div>
  );
}
