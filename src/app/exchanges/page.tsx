'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { RefreshCw, Building2, ExternalLink, Shield, Globe } from 'lucide-react';

interface Exchange {
  id: string;
  name: string;
  year_established: number | null;
  country: string | null;
  url: string;
  image: string;
  trust_score: number;
  trust_score_rank: number;
  trade_volume_24h_btc: number;
  trade_volume_24h_btc_normalized: number;
}

export default function ExchangesPage() {
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchExchanges = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/crypto/exchanges?limit=50');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch exchanges');
      }

      setExchanges(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching exchanges:', err);
      setError('Unable to load exchanges');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchExchanges();
    const interval = setInterval(fetchExchanges, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchExchanges]);

  const formatVolume = (btc: number) => {
    if (btc >= 1000000) return `${(btc / 1000000).toFixed(2)}M BTC`;
    if (btc >= 1000) return `${(btc / 1000).toFixed(2)}K BTC`;
    return `${btc.toFixed(2)} BTC`;
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 8) return 'text-emerald-400 bg-emerald-500/20';
    if (score >= 6) return 'text-yellow-400 bg-yellow-500/20';
    if (score >= 4) return 'text-orange-400 bg-orange-500/20';
    return 'text-red-400 bg-red-500/20';
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
              <Building2 className="w-8 h-8 text-blue-500" />
              <h1 className="text-3xl font-bold text-white">Cryptocurrency Exchanges</h1>
            </div>
            <p className="text-gray-400">
              Top exchanges ranked by trust score and 24h trading volume.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchExchanges}
              disabled={loading}
              className="p-2 text-gray-400 hover:text-white rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && exchanges.length === 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Loading exchanges...</p>
          </div>
        )}

        {/* Error State */}
        {error && exchanges.length === 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
            <p className="text-gray-400 mb-4">{error}</p>
            <button
              onClick={fetchExchanges}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Exchanges Table */}
        {exchanges.length > 0 && (
          <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-gray-400 text-sm border-b border-gray-800">
                    <th className="text-left py-4 px-4 font-medium">#</th>
                    <th className="text-left py-4 px-4 font-medium">Exchange</th>
                    <th className="text-center py-4 px-4 font-medium">Trust Score</th>
                    <th className="text-right py-4 px-4 font-medium">24h Volume (BTC)</th>
                    <th className="text-right py-4 px-4 font-medium hidden md:table-cell">Normalized Volume</th>
                    <th className="text-left py-4 px-4 font-medium hidden lg:table-cell">Country</th>
                    <th className="text-center py-4 px-4 font-medium hidden lg:table-cell">Year</th>
                    <th className="text-center py-4 px-4 font-medium">Link</th>
                  </tr>
                </thead>
                <tbody>
                  {exchanges.map((exchange) => (
                    <tr
                      key={exchange.id}
                      className="border-b border-gray-800/50 hover:bg-gray-800/30 transition"
                    >
                      <td className="py-4 px-4 text-gray-500">{exchange.trust_score_rank}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          {exchange.image && (
                            <div className="relative w-8 h-8">
                              <Image
                                src={exchange.image}
                                alt={exchange.name}
                                fill
                                className="rounded-full object-cover"
                                unoptimized
                              />
                            </div>
                          )}
                          <span className="text-white font-medium">{exchange.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${getTrustScoreColor(
                            exchange.trust_score
                          )}`}
                        >
                          <Shield className="w-3 h-3" />
                          {exchange.trust_score}/10
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right text-white font-mono">
                        {formatVolume(exchange.trade_volume_24h_btc)}
                      </td>
                      <td className="py-4 px-4 text-right text-gray-300 font-mono hidden md:table-cell">
                        {formatVolume(exchange.trade_volume_24h_btc_normalized)}
                      </td>
                      <td className="py-4 px-4 text-gray-400 hidden lg:table-cell">
                        <div className="flex items-center gap-1">
                          <Globe className="w-3 h-3" />
                          {exchange.country || '—'}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center text-gray-400 hidden lg:table-cell">
                        {exchange.year_established || '—'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <a
                          href={exchange.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open ${exchange.name} website`}
                          title={`Open ${exchange.name} website`}
                          className="text-blue-400 hover:text-blue-300 transition"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
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
            <Building2 className="w-6 h-6 text-blue-500" />
            <h2 className="text-xl font-semibold text-white">Export Exchange Data</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Download exchange rankings as Excel templates with live CryptoSheets formulas.
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
