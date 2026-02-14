'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  RefreshCw,
  Droplets,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity,
  DollarSign,
  Clock,
  Sparkles,
} from 'lucide-react';

interface Pool {
  id: string;
  name: string;
  address: string;
  network: string;
  dex: string;
  base_token_price_usd: number;
  reserve_usd: number;
  volume_24h: number;
  price_change_24h: number;
  transactions_24h: number;
  created_at: string;
}

const NETWORKS = [
  { id: 'eth', name: 'Ethereum', color: 'text-blue-400' },
  { id: 'bsc', name: 'BNB Chain', color: 'text-yellow-400' },
  { id: 'polygon_pos', name: 'Polygon', color: 'text-purple-400' },
  { id: 'arbitrum', name: 'Arbitrum', color: 'text-blue-300' },
  { id: 'base', name: 'Base', color: 'text-blue-500' },
  { id: 'solana', name: 'Solana', color: 'text-emerald-400' },
  { id: 'avalanche', name: 'Avalanche', color: 'text-red-400' },
];

const POOL_TYPES = [
  { id: 'trending', name: 'Trending', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'new', name: 'New Pools', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'top_gainers', name: 'Top Volume', icon: <Activity className="w-4 h-4" /> },
];

export default function DexPoolsPage() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState('eth');
  const [selectedType, setSelectedType] = useState('trending');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchPools = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/crypto/dex-pools?network=${selectedNetwork}&type=${selectedType}&limit=30`
      );
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch pools');
      }

      setPools(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching pools:', err);
      setError('Unable to load DEX pools');
    } finally {
      setLoading(false);
    }
  }, [selectedNetwork, selectedType]);

  useEffect(() => {
    fetchPools();
    const interval = setInterval(fetchPools, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchPools]);

  const formatPrice = (price: number) => {
    if (!price) return '—';
    if (price < 0.000001) return `$${price.toExponential(2)}`;
    if (price < 0.01) return `$${price.toFixed(6)}`;
    if (price < 1) return `$${price.toFixed(4)}`;
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const formatVolume = (vol: number) => {
    if (!vol) return '—';
    if (vol >= 1e9) return `$${(vol / 1e9).toFixed(2)}B`;
    if (vol >= 1e6) return `$${(vol / 1e6).toFixed(2)}M`;
    if (vol >= 1e3) return `$${(vol / 1e3).toFixed(2)}K`;
    return `$${vol.toFixed(2)}`;
  };

  const formatChange = (change: number) => {
    if (change === undefined || change === null) return '—';
    const formatted = Math.abs(change).toFixed(2);
    return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const formatAge = (dateStr: string) => {
    if (!dateStr) return '—';
    const created = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 30) return `${Math.floor(diffDays / 30)}mo`;
    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    return 'New';
  };

  const shortenAddress = (addr: string) => {
    if (!addr) return '—';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Droplets className="w-8 h-8 text-cyan-500" />
              <h1 className="text-3xl font-bold text-white">DEX Pools</h1>
            </div>
            <p className="text-gray-400">
              Trending liquidity pools across decentralized exchanges.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchPools}
              disabled={loading}
              aria-label="Refresh"
              title="Refresh"
              className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg transition"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Network Selector */}
          <div className="flex flex-wrap gap-2">
            {NETWORKS.map((network) => (
              <button
                key={network.id}
                onClick={() => setSelectedNetwork(network.id)}
                className={`px-3 py-1.5 rounded-lg text-sm transition ${
                  selectedNetwork === network.id
                    ? `bg-cyan-600 text-white`
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {network.name}
              </button>
            ))}
          </div>

          {/* Type Selector */}
          <div className="flex gap-2">
            {POOL_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-3 py-1.5 rounded-lg text-sm flex items-center gap-1.5 transition ${
                  selectedType === type.id
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                {type.icon}
                {type.name}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && pools.length === 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading DEX pools...</p>
          </div>
        )}

        {/* Error State */}
        {error && pools.length === 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchPools}
              className="px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Pools Table */}
        {pools.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-800">
                    <th className="text-left py-4 px-4 font-medium">#</th>
                    <th className="text-left py-4 px-4 font-medium">Pool</th>
                    <th className="text-left py-4 px-4 font-medium">DEX</th>
                    <th className="text-right py-4 px-4 font-medium">Price</th>
                    <th className="text-right py-4 px-4 font-medium">24h %</th>
                    <th className="text-right py-4 px-4 font-medium hidden md:table-cell">Liquidity</th>
                    <th className="text-right py-4 px-4 font-medium hidden md:table-cell">Volume 24h</th>
                    <th className="text-right py-4 px-4 font-medium hidden lg:table-cell">Txns 24h</th>
                    <th className="text-center py-4 px-4 font-medium hidden lg:table-cell">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {pools.map((pool, index) => (
                    <tr
                      key={pool.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition"
                    >
                      <td className="py-3 px-4 text-gray-500">{index + 1}</td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="text-white font-medium">{pool.name}</div>
                          <div className="text-xs text-gray-500">{shortenAddress(pool.address)}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-400 text-sm capitalize">{pool.dex}</span>
                      </td>
                      <td className="py-3 px-4 text-right text-white font-mono">
                        {formatPrice(pool.base_token_price_usd)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span
                          className={`flex items-center justify-end gap-1 font-medium ${
                            pool.price_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {pool.price_change_24h >= 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {formatChange(pool.price_change_24h)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300 font-mono hidden md:table-cell">
                        {formatVolume(pool.reserve_usd)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-300 font-mono hidden md:table-cell">
                        {formatVolume(pool.volume_24h)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-400 hidden lg:table-cell">
                        {pool.transactions_24h.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-center hidden lg:table-cell">
                        <span className="text-xs text-gray-500 flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatAge(pool.created_at)}
                        </span>
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
            <Droplets className="w-6 h-6 text-cyan-500" />
            <h2 className="text-xl font-semibold text-white">Export DEX Data</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Download DEX pool data as Excel templates with prefetched data.
          </p>
          <Link
            href="/downloads"
            className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-500 transition"
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
              href="https://www.geckoterminal.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-cyan-400 hover:underline"
            >
              GeckoTerminal
            </a>
            {' '}(CoinGecko). Updated every 5 minutes.
          </p>
        </div>
      </main>
    </div>
  );
}
