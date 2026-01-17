'use client';

import { useState, useEffect } from 'react';
import { Info, RefreshCw, AlertCircle, Check } from 'lucide-react';

/**
 * Wallet Distribution - Ocean Animals Theme
 *
 * Shows Bitcoin holder distribution by balance size.
 * Data fetched from blockchain.info when available.
 *
 * For other coins: Premium services required (Glassnode, IntoTheBlock)
 */

interface DistributionCategory {
  name: string;
  emoji: string;
  range: string;
  min: number;
  max: number | null;
  color: string;
  addresses: number;
  addressPercent: number;
  btcHeld: number;
  btcHeldPercent: number;
}

interface DistributionResponse {
  success: boolean;
  coin: string;
  data: DistributionCategory[];
  meta?: {
    totalAddresses: number;
    totalBtc: number;
    source: string;
    isLive: boolean;
    timestamp: string;
  };
  disclaimer?: string;
  error?: string;
  message?: string;
  supportedCoins?: string[];
}

const SUPPORTED_COINS = [
  { symbol: 'BTC', name: 'Bitcoin', supported: true, free: true },
  { symbol: 'ETH', name: 'Ethereum', supported: false, free: false },
  { symbol: 'SOL', name: 'Solana', supported: false, free: false },
  { symbol: 'BNB', name: 'BNB Chain', supported: false, free: false },
];

const colorClasses: Record<string, string> = {
  pink: 'bg-pink-500/80',
  orange: 'bg-orange-500/80',
  cyan: 'bg-cyan-500/80',
  purple: 'bg-purple-500/80',
  blue: 'bg-blue-500/80',
  slate: 'bg-slate-500/80',
  indigo: 'bg-indigo-500/80',
  emerald: 'bg-emerald-500/80',
};

function formatNumber(num: number): string {
  if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
  return num.toLocaleString();
}

function CategoryCard({ category, isHovered, onHover }: {
  category: DistributionCategory;
  isHovered: boolean;
  onHover: (name: string | null) => void;
}) {
  const size = Math.max(80, Math.sqrt(category.btcHeldPercent) * 45);
  const bgColor = colorClasses[category.color] || 'bg-gray-500/80';

  return (
    <div
      className={`relative rounded-xl p-4 transition-all duration-300 cursor-pointer ${bgColor} ${
        isHovered ? 'scale-105 ring-2 ring-white/50 z-10' : 'hover:scale-102'
      }`}
      style={{
        minWidth: `${size}px`,
        minHeight: `${size}px`,
        flex: `${category.btcHeldPercent} 1 0%`,
      }}
      onMouseEnter={() => onHover(category.name)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex flex-col h-full justify-between">
        <div>
          <span className="text-3xl">{category.emoji}</span>
          <h3 className="font-bold text-white mt-1">{category.name}</h3>
        </div>
        <div className="text-xs text-white/90 mt-2">
          <div className="font-semibold">{category.btcHeldPercent}% BTC</div>
          <div className="text-white/70">{category.range}</div>
        </div>
      </div>

      {isHovered && (
        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 translate-y-full bg-gray-900 border border-gray-600 rounded-lg p-3 shadow-xl z-20 w-56">
          <div className="text-sm text-white font-medium">{category.name}</div>
          <div className="text-xs text-gray-400 mt-1">{category.range}</div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div>
              <span className="text-gray-500">Addresses:</span>
              <div className="text-white font-medium">{formatNumber(category.addresses)}</div>
              <div className="text-gray-400">({category.addressPercent}%)</div>
            </div>
            <div>
              <span className="text-gray-500">BTC Held:</span>
              <div className="text-emerald-400 font-medium">{formatNumber(category.btcHeld)}</div>
              <div className="text-gray-400">({category.btcHeldPercent}%)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DistributionBar({ categories }: { categories: DistributionCategory[] }) {
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      {/* BTC Holdings Distribution */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>BTC Holdings Distribution</span>
          <span>100%</span>
        </div>
        <div className="flex h-10 rounded-lg overflow-hidden gap-0.5">
          {categories.map((cat) => {
            const bgColor = colorClasses[cat.color] || 'bg-gray-500/80';
            return (
              <div
                key={cat.name}
                className={`${bgColor} relative group transition-all duration-300 ${
                  hoveredCategory === cat.name ? 'scale-y-110' : ''
                }`}
                style={{ width: `${cat.btcHeldPercent}%` }}
                onMouseEnter={() => setHoveredCategory(cat.name)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {cat.btcHeldPercent > 8 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl">{cat.emoji}</span>
                  </div>
                )}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 border border-gray-700">
                  <div className="font-medium">{cat.name}</div>
                  <div>{cat.btcHeldPercent}% ({formatNumber(cat.btcHeld)} BTC)</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Address Count Distribution */}
      <div>
        <div className="flex justify-between text-xs text-gray-400 mb-2">
          <span>Address Count Distribution</span>
          <span>100%</span>
        </div>
        <div className="flex h-10 rounded-lg overflow-hidden gap-0.5">
          {categories.map((cat) => {
            const bgColor = colorClasses[cat.color] || 'bg-gray-500/80';
            return (
              <div
                key={cat.name}
                className={`${bgColor} relative group transition-all duration-300 ${
                  hoveredCategory === cat.name ? 'scale-y-110' : ''
                }`}
                style={{ width: `${cat.addressPercent}%` }}
                onMouseEnter={() => setHoveredCategory(cat.name)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                {cat.addressPercent > 8 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-xl">{cat.emoji}</span>
                  </div>
                )}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-10 border border-gray-700">
                  <div className="font-medium">{cat.name}</div>
                  <div>{cat.addressPercent}% ({formatNumber(cat.addresses)} addresses)</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function WalletDistributionTreemap() {
  const [selectedCoin, setSelectedCoin] = useState('BTC');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'cards' | 'bars'>('cards');
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DistributionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async (coin: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/onchain/distribution?coin=${coin}`);
      const result: DistributionResponse = await response.json();

      if (result.success) {
        setData(result);
      } else {
        setError(result.message || result.error || 'Failed to fetch data');
        setData(null);
      }
    } catch (err) {
      setError('Failed to connect to API');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(selectedCoin);
  }, [selectedCoin]);

  const handleCoinChange = (coin: string) => {
    const coinInfo = SUPPORTED_COINS.find(c => c.symbol === coin);
    if (coinInfo?.supported) {
      setSelectedCoin(coin);
    } else {
      // Show contact sales message
      setData(null);
      setError(`Wallet distribution data for ${coin} is a premium feature. Bitcoin (BTC) data is available for free!`);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-900 text-white rounded-xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🐋</span>
          <div>
            <h2 className="text-xl font-bold">Wallet Distribution</h2>
            <p className="text-gray-400 text-sm">Holder categories by balance size</p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Coin Selector */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            {SUPPORTED_COINS.map((coin) => (
              <button
                key={coin.symbol}
                type="button"
                onClick={() => handleCoinChange(coin.symbol)}
                className={`px-3 py-1.5 rounded-md text-sm transition flex items-center gap-1 ${
                  selectedCoin === coin.symbol
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : coin.supported
                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'text-gray-600 hover:text-gray-400 hover:bg-gray-700/50'
                }`}
                title={coin.supported ? `${coin.name} - FREE` : `${coin.name} - Contact Sales`}
              >
                {coin.symbol}
                {coin.free && (
                  <span className="text-[10px] px-1 py-0.5 bg-emerald-500/30 text-emerald-400 rounded font-medium">FREE</span>
                )}
                {!coin.supported && (
                  <span className="text-[10px] px-1 py-0.5 bg-amber-500/30 text-amber-400 rounded font-medium">PRO</span>
                )}
              </button>
            ))}
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                viewMode === 'cards'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Cards
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bars')}
              className={`px-3 py-1.5 rounded-md text-sm transition ${
                viewMode === 'bars'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Bars
            </button>
          </div>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={() => fetchData(selectedCoin)}
            disabled={loading}
            className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700 transition disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Data Source Info */}
      {data?.meta && (
        <div className={`mx-4 mt-4 p-3 rounded-lg flex items-start gap-2 ${
          data.meta.isLive
            ? 'bg-emerald-500/10 border border-emerald-500/20'
            : 'bg-blue-500/10 border border-blue-500/20'
        }`}>
          <Info className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
            data.meta.isLive ? 'text-emerald-400' : 'text-blue-400'
          }`} />
          <div className="text-xs">
            <span className={data.meta.isLive ? 'text-emerald-300' : 'text-blue-300'}>
              <strong>Source:</strong> {data.meta.source}
            </span>
            {data.meta.totalAddresses && (
              <span className="text-gray-400 ml-3">
                {formatNumber(data.meta.totalAddresses)} addresses | {formatNumber(data.meta.totalBtc)} BTC
              </span>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mx-4 mt-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-amber-400">Premium Feature</h4>
              <p className="text-sm text-gray-300 mt-1">{error}</p>
              <div className="mt-3 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-sm text-white font-medium mb-2">Want distribution data for other coins?</p>
                <p className="text-xs text-gray-400 mb-3">
                  Bitcoin (BTC) distribution is <span className="text-emerald-400 font-medium">FREE</span>.
                  For ETH, SOL, BNB and other coins, please contact our sales team.
                </p>
                <a
                  href="mailto:sales@cryptoreportkit.com?subject=Wallet%20Distribution%20Data%20Inquiry"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium rounded-lg transition"
                >
                  Contact Sales Team
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center">
          <RefreshCw className="w-8 h-8 animate-spin text-emerald-400 mx-auto mb-3" />
          <p className="text-gray-400">Loading distribution data...</p>
        </div>
      )}

      {/* Content */}
      {!loading && data?.data && (
        <div className="p-4">
          {viewMode === 'cards' ? (
            <div className="flex flex-wrap gap-3">
              {data.data.map((category) => (
                <CategoryCard
                  key={category.name}
                  category={category}
                  isHovered={hoveredCategory === category.name}
                  onHover={setHoveredCategory}
                />
              ))}
            </div>
          ) : (
            <DistributionBar categories={data.data} />
          )}

          {/* Legend */}
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {data.data.map((cat) => {
              const bgColor = colorClasses[cat.color] || 'bg-gray-500/80';
              return (
                <div
                  key={cat.name}
                  className={`flex items-center gap-2 p-2 rounded-lg transition cursor-pointer ${
                    hoveredCategory === cat.name ? 'bg-gray-800' : 'hover:bg-gray-800/50'
                  }`}
                  onMouseEnter={() => setHoveredCategory(cat.name)}
                  onMouseLeave={() => setHoveredCategory(null)}
                >
                  <div className={`w-3 h-3 rounded ${bgColor}`} />
                  <span className="text-xl">{cat.emoji}</span>
                  <div className="text-xs">
                    <div className="font-medium text-white">{cat.name}</div>
                    <div className="text-gray-500">{cat.range}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Key Insight */}
          <div className="mt-4 p-4 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-lg">
            <h4 className="font-semibold text-amber-400 flex items-center gap-2">
              <span>💡</span> Key Insight
            </h4>
            <p className="text-sm text-gray-300 mt-1">
              While Humpback whales (1,000+ BTC) represent only ~{data.data[7]?.addressPercent || 0.05}% of addresses,
              they hold ~{data.data[7]?.btcHeldPercent || 56}% of all Bitcoin.
              This concentration is typical of cryptocurrency markets.
            </p>
          </div>

          {/* Disclaimer */}
          {data.disclaimer && (
            <p className="mt-4 text-xs text-gray-500 text-center">
              {data.disclaimer}
            </p>
          )}
        </div>
      )}

      {/* No Data Fallback */}
      {!loading && !data?.data && !error && (
        <div className="p-8 text-center">
          <span className="text-5xl mb-4 block">🐋</span>
          <p className="text-gray-400">Select a coin to view distribution</p>
        </div>
      )}
    </div>
  );
}
