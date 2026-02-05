'use client';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, ExternalLink, Info, Building2, Landmark, Coins, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface RWACategory {
  id: string;
  name: string;
  totalValue: number;
  totalValueFormatted: string;
  change7d?: number;
  change30d?: number;
  apy7d?: number;
  totalAssets?: number;
  holders?: number;
  holdersChange7d?: number;
  holdersChange30d?: number;
  description?: string;
  topProtocols?: { name: string; value: number; share: number }[];
}

interface RWAData {
  overview: {
    totalMarketCap: number;
    totalMarketCapFormatted: string;
    growth30d: number;
    totalAssets: number;
    totalHolders: number;
    totalNetworks: number;
    totalIssuers: number;
  };
  categories: RWACategory[];
  networkDistribution: { network: string; share: number; value: number }[];
}

interface RWADashboardProps {
  className?: string;
}

export function RWADashboard({ className = '' }: RWADashboardProps) {
  const [data, setData] = useState<RWAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSampleData, setIsSampleData] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<RWACategory | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/rwa');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch RWA data');
      }

      setData(result.data);
      setIsSampleData(result.isSampleData);
    } catch (err) {
      console.error('Error fetching RWA data:', err);
      setError('Unable to load RWA data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10 * 60 * 1000); // Refresh every 10 minutes
    return () => clearInterval(interval);
  }, [fetchData]);

  const formatValue = (value: number): string => {
    if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
    if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
    return `$${value.toLocaleString()}`;
  };

  const getCategoryIcon = (id: string) => {
    switch (id) {
      case 'treasuries':
        return <Landmark className="w-5 h-5" />;
      case 'private-credit':
        return <Building2 className="w-5 h-5" />;
      case 'commodities':
        return <Coins className="w-5 h-5" />;
      case 'stocks':
        return <BarChart3 className="w-5 h-5" />;
      case 'real-estate':
        return <Building2 className="w-5 h-5" />;
      default:
        return <Coins className="w-5 h-5" />;
    }
  };

  if (loading && !data) {
    return (
      <div className={`bg-gray-900 rounded-xl border border-gray-800 p-8 text-center ${className}`}>
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading RWA tokenization data...</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className={`bg-gray-900 rounded-xl border border-gray-800 p-8 text-center ${className}`}>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Real World Asset Tokenization
              {isSampleData ? (
                <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Sample Data
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                  Live Data
                </span>
              )}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-white rounded transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <a
              href="https://rwa.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
            >
              Data by RWA.xyz
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Sample Data Notice */}
      {isSampleData && (
        <div className="mx-4 mt-4 p-3 bg-amber-900/20 border border-amber-500/30 rounded-lg">
          <p className="text-xs text-amber-400">
            <strong>Sample Data Notice:</strong> This dashboard displays illustrative data based on publicly available RWA.xyz information.
            For live data, RWA.xyz API access is required. Contact{' '}
            <a href="mailto:team@rwa.xyz" className="underline hover:text-amber-300">team@rwa.xyz</a> for API access.
          </p>
        </div>
      )}

      {/* Overview Stats */}
      <div className="p-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Total RWA Market</p>
            <p className="text-xl font-bold text-white">{data.overview.totalMarketCapFormatted}</p>
            <p className={`text-xs ${data.overview.growth30d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {data.overview.growth30d >= 0 ? '+' : ''}{data.overview.growth30d}% (30d)
            </p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Total Assets</p>
            <p className="text-xl font-bold text-white">{data.overview.totalAssets.toLocaleString()}</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Total Holders</p>
            <p className="text-xl font-bold text-white">{(data.overview.totalHolders / 1000).toFixed(0)}K+</p>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <p className="text-gray-400 text-xs mb-1">Networks</p>
            <p className="text-xl font-bold text-white">{data.overview.totalNetworks}</p>
          </div>
        </div>

        {/* Categories */}
        <h3 className="text-sm font-medium text-gray-300 mb-3">Asset Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category)}
              className="text-left bg-gray-800/30 hover:bg-gray-800/60 border border-gray-700 hover:border-indigo-500/50 rounded-lg p-4 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-indigo-400">{getCategoryIcon(category.id)}</span>
                  <span className="font-medium text-white group-hover:text-indigo-400 transition text-sm">
                    {category.name}
                  </span>
                </div>
                {(category.change7d !== undefined || category.change30d !== undefined) && (
                  <span
                    className={`flex items-center gap-0.5 text-xs font-medium ${
                      (category.change7d ?? category.change30d ?? 0) >= 0
                        ? 'text-emerald-400'
                        : 'text-red-400'
                    }`}
                  >
                    {(category.change7d ?? category.change30d ?? 0) >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {(category.change7d ?? category.change30d ?? 0) >= 0 ? '+' : ''}
                    {(category.change7d ?? category.change30d ?? 0).toFixed(2)}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-white mb-1">{category.totalValueFormatted}</p>
              {category.apy7d && (
                <p className="text-xs text-emerald-400">{category.apy7d.toFixed(2)}% APY</p>
              )}
              {category.holders && (
                <p className="text-xs text-gray-500 mt-1">
                  {(category.holders / 1000).toFixed(1)}K holders
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Network Distribution */}
        {data.networkDistribution && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-300 mb-3">Network Distribution</h3>
            <div className="bg-gray-800/30 rounded-lg p-4">
              <div className="flex h-4 rounded-full overflow-hidden mb-3">
                {data.networkDistribution.map((network, i) => (
                  <div
                    key={network.network}
                    style={{ width: `${network.share}%` }}
                    className={`${
                      i === 0 ? 'bg-indigo-500' :
                      i === 1 ? 'bg-purple-500' :
                      i === 2 ? 'bg-blue-500' :
                      i === 3 ? 'bg-cyan-500' :
                      i === 4 ? 'bg-teal-500' :
                      'bg-gray-600'
                    }`}
                    title={`${network.network}: ${network.share}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                {data.networkDistribution.map((network, i) => (
                  <div key={network.network} className="flex items-center gap-1.5 text-xs">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        i === 0 ? 'bg-indigo-500' :
                        i === 1 ? 'bg-purple-500' :
                        i === 2 ? 'bg-blue-500' :
                        i === 3 ? 'bg-cyan-500' :
                        i === 4 ? 'bg-teal-500' :
                        'bg-gray-600'
                      }`}
                    />
                    <span className="text-gray-400">{network.network}</span>
                    <span className="text-white font-medium">{network.share}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Category Detail Modal */}
      {selectedCategory && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setSelectedCategory(null)}
        >
          <div
            className="bg-gray-900 rounded-xl border border-gray-700 max-w-lg w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-indigo-400">{getCategoryIcon(selectedCategory.id)}</span>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedCategory.name}</h3>
                  {isSampleData && (
                    <span className="text-xs text-amber-400">(Sample Data)</span>
                  )}
                </div>
              </div>
              {(selectedCategory.change7d !== undefined || selectedCategory.change30d !== undefined) && (
                <span
                  className={`flex items-center gap-1 text-lg font-bold px-3 py-1 rounded-lg ${
                    (selectedCategory.change7d ?? selectedCategory.change30d ?? 0) >= 0
                      ? 'text-emerald-400 bg-emerald-500/20'
                      : 'text-red-400 bg-red-500/20'
                  }`}
                >
                  {(selectedCategory.change7d ?? selectedCategory.change30d ?? 0) >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {(selectedCategory.change7d ?? selectedCategory.change30d ?? 0) >= 0 ? '+' : ''}
                  {(selectedCategory.change7d ?? selectedCategory.change30d ?? 0).toFixed(2)}%
                </span>
              )}
            </div>

            <p className="text-gray-400 text-sm mb-4">{selectedCategory.description}</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Total Value</p>
                <p className="text-white font-semibold">{selectedCategory.totalValueFormatted}</p>
              </div>
              {selectedCategory.apy7d && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">7D APY</p>
                  <p className="text-emerald-400 font-semibold">{selectedCategory.apy7d.toFixed(2)}%</p>
                </div>
              )}
              {selectedCategory.holders && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Holders</p>
                  <p className="text-white font-semibold">{selectedCategory.holders.toLocaleString()}</p>
                </div>
              )}
              {selectedCategory.totalAssets && (
                <div className="bg-gray-800 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Total Assets</p>
                  <p className="text-white font-semibold">{selectedCategory.totalAssets}</p>
                </div>
              )}
            </div>

            {selectedCategory.topProtocols && selectedCategory.topProtocols.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-2">Top Protocols</p>
                <div className="space-y-2">
                  {selectedCategory.topProtocols.map((protocol) => (
                    <div key={protocol.name} className="flex items-center justify-between">
                      <span className="text-white text-sm">{protocol.name}</span>
                      <div className="text-right">
                        <span className="text-white text-sm font-medium">{formatValue(protocol.value)}</span>
                        <span className="text-gray-400 text-xs ml-2">({protocol.share}%)</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setSelectedCategory(null)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default RWADashboard;
