'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { RefreshCw, Layers, ExternalLink, TrendingUp, TrendingDown, Search } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  market_cap: number;
  market_cap_change_24h: number;
  volume_24h: number;
  top_3_coins: string[];
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crypto/categories?limit=100');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch categories');
      }

      setCategories(result.data);
      setFilteredCategories(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Unable to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    const interval = setInterval(fetchCategories, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchCategories]);

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = categories.filter((cat) =>
        cat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  const formatMarketCap = (cap: number) => {
    if (!cap) return '—';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  const formatChange = (change: number) => {
    if (change === undefined || change === null) return null;
    const formatted = Math.abs(change).toFixed(2);
    return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Layers className="w-8 h-8 text-indigo-500" />
              <h1 className="text-3xl font-bold text-white">Coin Categories</h1>
            </div>
            <p className="text-gray-400">
              Browse cryptocurrencies by category - DeFi, Layer 1, Gaming, and more.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-indigo-500"
              />
            </div>
            {lastUpdated && (
              <span className="text-xs text-gray-500 hidden md:block">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && categories.length === 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading categories...</p>
          </div>
        )}

        {/* Error State */}
        {error && categories.length === 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchCategories}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Categories Grid */}
        {filteredCategories.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map((category, index) => (
              <div
                key={category.id}
                className="bg-gray-900 rounded-xl border border-gray-800 p-4 hover:border-indigo-500/50 transition group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-gray-500 text-sm">#{index + 1}</span>
                    <h3 className="font-semibold text-white group-hover:text-indigo-400 transition">
                      {category.name}
                    </h3>
                  </div>
                  {category.market_cap_change_24h !== undefined && (
                    <span
                      className={`flex items-center gap-1 text-sm font-medium px-2 py-0.5 rounded ${
                        category.market_cap_change_24h >= 0
                          ? 'text-emerald-400 bg-emerald-500/20'
                          : 'text-red-400 bg-red-500/20'
                      }`}
                    >
                      {category.market_cap_change_24h >= 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : (
                        <TrendingDown className="w-3 h-3" />
                      )}
                      {formatChange(category.market_cap_change_24h)}
                    </span>
                  )}
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Market Cap</span>
                    <span className="text-white font-mono">{formatMarketCap(category.market_cap)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">24h Volume</span>
                    <span className="text-white font-mono">{formatMarketCap(category.volume_24h)}</span>
                  </div>
                </div>

                {/* Top 3 Coins */}
                {category.top_3_coins && category.top_3_coins.length > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500 mr-2">Top coins:</span>
                    <div className="flex -space-x-2">
                      {category.top_3_coins.slice(0, 3).map((coinImg, i) => (
                        <div key={i} className="relative w-6 h-6">
                          <Image
                            src={coinImg}
                            alt={`Top ${i + 1}`}
                            fill
                            className="rounded-full object-cover border-2 border-gray-900"
                            unoptimized
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {filteredCategories.length === 0 && !loading && !error && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-gray-400">No categories found matching &quot;{searchQuery}&quot;</p>
          </div>
        )}

        {/* Export Options */}
        <div className="mt-8 bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Layers className="w-6 h-6 text-indigo-500" />
            <h2 className="text-xl font-semibold text-white">Export Category Data</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Download category data as Excel templates with prefetched data.
          </p>
          <Link
            href="/downloads"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
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
              className="text-indigo-400 hover:underline"
            >
              CoinGecko
            </a>
            . Updated every 30 minutes.
          </p>
        </div>
      </main>
    </div>
  );
}
