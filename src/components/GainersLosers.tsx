'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { RefreshCw, TrendingUp, TrendingDown, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface MarketMover {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  market_cap_rank: number;
  total_volume: number;
}

interface GainersLosersProps {
  type?: 'gainers' | 'losers' | 'both';
  limit?: number;
  showTitle?: boolean;
  compact?: boolean;
  className?: string;
}

export function GainersLosers({
  type = 'both',
  limit = 5,
  showTitle = true,
  compact = false,
  className = '',
}: GainersLosersProps) {
  const [gainers, setGainers] = useState<MarketMover[]>([]);
  const [losers, setLosers] = useState<MarketMover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'gainers' | 'losers'>(type === 'losers' ? 'losers' : 'gainers');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/crypto/gainers-losers?type=${type}&limit=${limit}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch data');
      }

      if (result.data.gainers) setGainers(result.data.gainers);
      if (result.data.losers) setLosers(result.data.losers);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching gainers/losers:', err);
      setError('Unable to load market movers');
    } finally {
      setLoading(false);
    }
  }, [type, limit]);

  useEffect(() => {
    fetchData();
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatPrice = (price: number) => {
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const formatChange = (change: number) => {
    const formatted = Math.abs(change).toFixed(2);
    return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  const displayData = activeTab === 'gainers' ? gainers : losers;

  if (loading && gainers.length === 0 && losers.length === 0) {
    return (
      <div className={`bg-gray-900 rounded-xl border border-gray-800 p-6 ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-white">Market Movers</h2>
          </div>
        )}
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin" />
          <span className="ml-2 text-gray-400">Loading market movers...</span>
        </div>
      </div>
    );
  }

  if (error && gainers.length === 0 && losers.length === 0) {
    return (
      <div className={`bg-gray-900 rounded-xl border border-gray-800 p-6 ${className}`}>
        {showTitle && (
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-white">Market Movers</h2>
          </div>
        )}
        <div className="text-center py-8">
          <p className="text-gray-400">{error}</p>
          <button
            onClick={fetchData}
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
              {activeTab === 'gainers' ? (
                <TrendingUp className="w-5 h-5 text-emerald-500" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-500" />
              )}
              <h2 className="text-lg font-semibold text-white">
                {activeTab === 'gainers' ? 'Top Gainers' : 'Top Losers'}
              </h2>
            </div>
            {type === 'both' && (
              <div className="flex bg-gray-800 rounded-lg p-1">
                <button
                  onClick={() => setActiveTab('gainers')}
                  className={`px-3 py-1 text-sm rounded transition ${
                    activeTab === 'gainers'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Gainers
                </button>
                <button
                  onClick={() => setActiveTab('losers')}
                  className={`px-3 py-1 text-sm rounded transition ${
                    activeTab === 'losers'
                      ? 'bg-red-600 text-white'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Losers
                </button>
              </div>
            )}
          </div>
        )}
        <div className="divide-y divide-gray-800">
          {displayData.map((coin, index) => (
            <Link
              key={coin.id}
              href={`/coin/${coin.id}`}
              className="flex items-center gap-3 p-3 hover:bg-gray-800/50 transition"
            >
              <span className="text-gray-500 font-medium w-4">{index + 1}</span>
              {coin.image && (
                <div className="relative w-6 h-6">
                  <Image
                    src={coin.image}
                    alt={coin.name}
                    fill
                    className="rounded-full object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <span className="text-white font-medium truncate block">{coin.symbol}</span>
              </div>
              <span
                className={`text-sm font-medium flex items-center gap-1 ${
                  coin.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {coin.price_change_percentage_24h >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {formatChange(coin.price_change_percentage_24h)}
              </span>
            </Link>
          ))}
        </div>
        <div className="p-2 bg-gray-800/50 border-t border-gray-800">
          <Link
            href="/gainers-losers"
            className="flex items-center justify-center gap-1 text-sm text-emerald-400 hover:text-emerald-300 transition"
          >
            View all market movers
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
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <TrendingDown className="w-5 h-5 text-red-500" />
            <h2 className="text-lg font-semibold text-white">Market Movers</h2>
            <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">24h</span>
          </div>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {type === 'both' && (
        <div className="flex border-b border-gray-800">
          <button
            onClick={() => setActiveTab('gainers')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'gainers'
                ? 'bg-emerald-600/10 text-emerald-400 border-b-2 border-emerald-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Top Gainers
          </button>
          <button
            onClick={() => setActiveTab('losers')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition flex items-center justify-center gap-2 ${
              activeTab === 'losers'
                ? 'bg-red-600/10 text-red-400 border-b-2 border-red-500'
                : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Top Losers
          </button>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-gray-400 text-sm border-b border-gray-800">
              <th className="text-left py-3 px-4 font-medium">#</th>
              <th className="text-left py-3 px-4 font-medium">Coin</th>
              <th className="text-right py-3 px-4 font-medium">Price</th>
              <th className="text-right py-3 px-4 font-medium">24h Change</th>
              <th className="text-right py-3 px-4 font-medium hidden md:table-cell">Market Cap</th>
              <th className="text-right py-3 px-4 font-medium hidden lg:table-cell">Volume</th>
            </tr>
          </thead>
          <tbody>
            {displayData.map((coin, index) => (
              <tr
                key={coin.id}
                className="border-b border-gray-800/50 hover:bg-gray-800/30 transition"
              >
                <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                <td className="py-3 px-4">
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
                      <span className="text-white font-medium group-hover:text-emerald-400 transition">
                        {coin.name}
                      </span>
                      <span className="text-gray-500 text-sm ml-2">{coin.symbol}</span>
                    </div>
                  </Link>
                </td>
                <td className="py-3 px-4 text-right text-white font-mono">
                  {formatPrice(coin.current_price)}
                </td>
                <td className="py-3 px-4 text-right">
                  <span
                    className={`font-medium flex items-center justify-end gap-1 ${
                      coin.price_change_percentage_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {coin.price_change_percentage_24h >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {formatChange(coin.price_change_percentage_24h)}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-gray-300 font-mono hidden md:table-cell">
                  {formatMarketCap(coin.market_cap)}
                </td>
                <td className="py-3 px-4 text-right text-gray-300 font-mono hidden lg:table-cell">
                  {formatMarketCap(coin.total_volume)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-3 bg-gray-800/50 border-t border-gray-800 flex items-center justify-between">
        <span className="text-xs text-gray-500">Data provided by CoinGecko</span>
        <Link
          href="/gainers-losers"
          className="text-sm text-emerald-400 hover:text-emerald-300 transition flex items-center gap-1"
        >
          View more
          <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}
