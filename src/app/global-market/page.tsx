'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { RefreshCw, Globe, TrendingUp, TrendingDown, BarChart3, ExternalLink } from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface GlobalHistory {
  market_cap: Array<[number, number]>;
  volume: Array<[number, number]>;
}

interface GlobalStats {
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  active_cryptocurrencies: number;
  markets: number;
}

export default function GlobalMarketPage() {
  const [history, setHistory] = useState<GlobalHistory | null>(null);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<number>(30);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [historyRes, globalRes] = await Promise.all([
        fetch(`/api/crypto/global-history?days=${timeRange}`),
        fetch('/api/crypto/global'),
      ]);

      const [historyData, globalData] = await Promise.all([
        historyRes.json(),
        globalRes.json(),
      ]);

      if (historyData.success) {
        setHistory(historyData.data);
      }

      if (globalData.success) {
        setGlobalStats(globalData.data);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching global data:', err);
      setError('Unable to load global market data');
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatMarketCap = (cap: number) => {
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    return `$${cap.toLocaleString()}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const chartData = history?.market_cap.map((item, index) => ({
    date: item[0],
    marketCap: item[1],
    volume: history.volume[index]?.[1] || 0,
  })) || [];

  return (
    <div className="min-h-screen bg-gray-950">
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-white">Global Crypto Market</h1>
            </div>
            <p className="text-gray-400">
              Total market capitalization and volume history.
            </p>
          </div>
          <div className="flex items-center gap-3">
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
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Stats Cards */}
        {globalStats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                <BarChart3 className="w-4 h-4" />
                Total Market Cap
              </div>
              <div className="text-2xl font-bold text-white">
                {formatMarketCap(globalStats.total_market_cap?.usd || 0)}
              </div>
              <div
                className={`flex items-center gap-1 text-sm mt-1 ${
                  globalStats.market_cap_change_percentage_24h_usd >= 0
                    ? 'text-emerald-400'
                    : 'text-red-400'
                }`}
              >
                {globalStats.market_cap_change_percentage_24h_usd >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {globalStats.market_cap_change_percentage_24h_usd.toFixed(2)}% (24h)
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-gray-400 text-sm mb-2">24h Trading Volume</div>
              <div className="text-2xl font-bold text-white">
                {formatMarketCap(globalStats.total_volume?.usd || 0)}
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-gray-400 text-sm mb-2">BTC Dominance</div>
              <div className="text-2xl font-bold text-orange-400">
                {(globalStats.market_cap_percentage?.btc || 0).toFixed(1)}%
              </div>
            </div>

            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-gray-400 text-sm mb-2">Active Cryptocurrencies</div>
              <div className="text-2xl font-bold text-white">
                {globalStats.active_cryptocurrencies?.toLocaleString() || '—'}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Across {globalStats.markets?.toLocaleString()} markets
              </div>
            </div>
          </div>
        )}

        {/* Time Range Selector */}
        <div className="flex items-center gap-2 mb-6">
          <span className="text-gray-400 text-sm">Time Range:</span>
          {[7, 30, 90, 180, 365].map((days) => (
            <button
              key={days}
              onClick={() => setTimeRange(days)}
              className={`px-3 py-1 rounded-lg text-sm transition ${
                timeRange === days
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && !history && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading market history...</p>
          </div>
        )}

        {/* Error State */}
        {error && !history && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchData}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Market Cap Chart */}
        {chartData.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Market Cap History</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="marketCapGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatMarketCap(value)}
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    formatter={(value) => [formatMarketCap(Number(value)), 'Market Cap']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="marketCap"
                    name="Total Market Cap"
                    stroke="#3b82f6"
                    fill="url(#marketCapGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Volume Chart */}
        {chartData.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
            <h2 className="text-xl font-semibold text-white mb-4">Volume History</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="volumeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                  />
                  <YAxis
                    tickFormatter={(value) => formatMarketCap(value)}
                    stroke="#9ca3af"
                    tick={{ fill: '#9ca3af' }}
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(label) => new Date(label).toLocaleDateString()}
                    formatter={(value) => [formatMarketCap(Number(value)), 'Volume']}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    name="24h Volume"
                    stroke="#10b981"
                    fill="url(#volumeGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Template Download CTA */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Globe className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">Download Excel Templates</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Get Excel templates with formulas that fetch live data via your CryptoSheets add-in.
          </p>
          <Link
            href="/templates"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
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
              className="text-blue-400 hover:underline"
            >
              CoinGecko
            </a>
            . Updated every 5 minutes.
          </p>
        </div>
      </main>
    </div>
  );
}
