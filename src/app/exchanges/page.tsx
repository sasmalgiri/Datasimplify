'use client';

import { useState, useEffect } from 'react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { ArrowUpRight, TrendingUp, Shield, Globe, Search } from 'lucide-react';

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
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchExchanges() {
      try {
        setLoading(true);
        const res = await fetch('/api/crypto/exchanges?limit=50');
        const data = await res.json();

        if (data.success && data.data) {
          setExchanges(data.data);
        } else {
          setError(data.error || 'Failed to load exchanges');
        }
      } catch (err) {
        setError('Failed to fetch exchanges');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchExchanges();
  }, []);

  const filteredExchanges = exchanges.filter(
    (ex) =>
      ex.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ex.country && ex.country.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatVolume = (btc: number) => {
    if (btc >= 1000000) return `${(btc / 1000000).toFixed(2)}M BTC`;
    if (btc >= 1000) return `${(btc / 1000).toFixed(2)}K BTC`;
    return `${btc.toFixed(2)} BTC`;
  };

  const getTrustColor = (score: number) => {
    if (score >= 8) return 'text-green-400 bg-green-500/20';
    if (score >= 5) return 'text-yellow-400 bg-yellow-500/20';
    return 'text-red-400 bg-red-500/20';
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cryptocurrency Exchanges</h1>
          <p className="text-gray-400">
            Top crypto exchanges ranked by trust score and trading volume
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
              placeholder="Search exchanges..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-96 pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Total Exchanges</div>
            <div className="text-2xl font-bold">{exchanges.length}</div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Top Volume (24h)</div>
            <div className="text-2xl font-bold text-green-400">
              {exchanges[0] ? formatVolume(exchanges[0].trade_volume_24h_btc) : '-'}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">High Trust Score</div>
            <div className="text-2xl font-bold text-blue-400">
              {exchanges.filter(e => e.trust_score >= 8).length}
            </div>
          </div>
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="text-gray-400 text-sm mb-1">Countries</div>
            <div className="text-2xl font-bold text-purple-400">
              {new Set(exchanges.map(e => e.country).filter(Boolean)).size}
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center">
            <p className="text-red-400">{error}</p>
            <p className="text-gray-400 text-sm mt-2">
              Exchange data requires CoinGecko API access
            </p>
          </div>
        )}

        {/* Exchanges Table */}
        {!loading && !error && (
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-700/50 text-left">
                    <th className="px-4 py-3 text-gray-400 font-medium">#</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Exchange</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Trust Score</th>
                    <th className="px-4 py-3 text-gray-400 font-medium text-right">Volume (24h)</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Country</th>
                    <th className="px-4 py-3 text-gray-400 font-medium">Year</th>
                    <th className="px-4 py-3 text-gray-400 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExchanges.map((exchange, index) => (
                    <tr
                      key={exchange.id}
                      className="border-t border-gray-700 hover:bg-gray-700/30 transition-colors"
                    >
                      <td className="px-4 py-4 text-gray-500">{index + 1}</td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          {exchange.image && (
                            <img
                              src={exchange.image}
                              alt={exchange.name}
                              className="w-8 h-8 rounded-full"
                            />
                          )}
                          <div>
                            <div className="font-medium">{exchange.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Shield className="w-4 h-4 text-gray-500" />
                          <span
                            className={`px-2 py-0.5 rounded text-sm font-medium ${getTrustColor(
                              exchange.trust_score
                            )}`}
                          >
                            {exchange.trust_score}/10
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <TrendingUp className="w-4 h-4 text-green-400" />
                          <span>{formatVolume(exchange.trade_volume_24h_btc)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-300">
                            {exchange.country || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-gray-400">
                        {exchange.year_established || '-'}
                      </td>
                      <td className="px-4 py-4">
                        <a
                          href={exchange.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Visit
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
