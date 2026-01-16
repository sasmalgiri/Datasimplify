'use client';

import { useState, useEffect } from 'react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Sparkles, TrendingUp, TrendingDown, Clock, Search } from 'lucide-react';
import Link from 'next/link';

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
  listed_date?: string;
}

export default function RecentlyAddedPage() {
  const [coins, setCoins] = useState<RecentCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchRecentCoins() {
      try {
        setLoading(true);
        const res = await fetch('/api/crypto/recently-added?limit=30');
        const data = await res.json();

        if (data.success && data.data) {
          setCoins(data.data);
        } else {
          setError(data.error || 'Failed to load recently added coins');
        }
      } catch (err) {
        setError('Failed to fetch recently added coins');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecentCoins();
  }, []);

  const filteredCoins = coins.filter(
    (coin) =>
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatPrice = (price: number) => {
    if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    if (price >= 0.01) return `$${price.toFixed(4)}`;
    return `$${price.toFixed(8)}`;
  };

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    if (cap >= 1e3) return `$${(cap / 1e3).toFixed(2)}K`;
    return `$${cap.toFixed(0)}`;
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-yellow-400" />
            <h1 className="text-3xl font-bold">Recently Added Coins</h1>
          </div>
          <p className="text-gray-400">
            Discover newly listed cryptocurrencies and emerging tokens
          </p>
        </div>

        {/* Display Only Notice */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2 text-blue-400 text-sm">
            <span className="px-2 py-0.5 bg-blue-500/20 rounded text-xs font-medium">Display Only</span>
            <span className="text-gray-400">Data provided by CoinGecko</span>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search new coins..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-96 pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">New Coins Listed</div>
            <div className="text-2xl font-bold">{coins.length}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Gainers (24h)</div>
            <div className="text-2xl font-bold text-green-400">
              {coins.filter(c => c.price_change_percentage_24h > 0).length}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Losers (24h)</div>
            <div className="text-2xl font-bold text-red-400">
              {coins.filter(c => c.price_change_percentage_24h < 0).length}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">With Market Cap</div>
            <div className="text-2xl font-bold text-purple-400">
              {coins.filter(c => c.market_cap_rank).length}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
            <p className="text-gray-400 text-sm mt-2">
              Recently added coins data requires CoinGecko API access
            </p>
          </div>
        )}

        {/* Coins Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCoins.map((coin) => (
              <Link
                key={coin.id}
                href={`/coin/${coin.id}`}
                className="bg-gray-800 rounded-xl p-4 hover:bg-gray-700/50 transition-colors border border-gray-700 hover:border-yellow-500/50"
              >
                <div className="flex items-center gap-3 mb-3">
                  {coin.image && (
                    <img
                      src={coin.image}
                      alt={coin.name}
                      className="w-10 h-10 rounded-full"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{coin.name}</div>
                    <div className="text-gray-400 text-sm">{coin.symbol}</div>
                  </div>
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded text-sm font-medium ${
                      coin.price_change_percentage_24h >= 0
                        ? 'text-green-400 bg-green-500/20'
                        : 'text-red-400 bg-red-500/20'
                    }`}
                  >
                    {coin.price_change_percentage_24h >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <div className="text-gray-500">Price</div>
                    <div className="font-medium">{formatPrice(coin.current_price)}</div>
                  </div>
                  <div>
                    <div className="text-gray-500">Market Cap</div>
                    <div className="font-medium">
                      {coin.market_cap ? formatMarketCap(coin.market_cap) : 'N/A'}
                    </div>
                  </div>
                </div>

                {coin.listed_date && (
                  <div className="mt-3 pt-3 border-t border-gray-700 flex items-center gap-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>Listed: {formatDate(coin.listed_date)}</span>
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredCoins.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">No recently added coins found</p>
          </div>
        )}

        {/* Attribution */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            Data provided by{' '}
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-400 hover:underline"
            >
              CoinGecko
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
