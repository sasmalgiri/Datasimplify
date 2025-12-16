'use client';

import { useState, useEffect } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

interface TokenData {
  id: string;
  symbol: string;
  name: string;
  price: number;
  market_cap: number;
  volume_24h: number;
  change_1h: number;
  change_24h: number;
  change_7d: number;
  rsi: number;
  volatility: number;
  exchanges: number;
  category: string;
}

interface Filter {
  field: string;
  operator: 'gt' | 'lt' | 'eq';
  value: number;
}

export function TokenScreener({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sortBy, setSortBy] = useState<keyof TokenData>('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activePreset, setActivePreset] = useState<string | null>(null);

  useEffect(() => {
    // Sample data
    const sampleTokens: TokenData[] = [
      { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', price: 97245, market_cap: 1920000000000, volume_24h: 45000000000, change_1h: 0.5, change_24h: 2.3, change_7d: 5.8, rsi: 62, volatility: 3.2, exchanges: 450, category: 'Store of Value' },
      { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', price: 3890, market_cap: 468000000000, volume_24h: 22000000000, change_1h: 0.3, change_24h: 1.8, change_7d: 4.2, rsi: 58, volatility: 4.1, exchanges: 420, category: 'Smart Contract' },
      { id: 'solana', symbol: 'SOL', name: 'Solana', price: 220, market_cap: 95000000000, volume_24h: 5500000000, change_1h: 1.2, change_24h: 5.5, change_7d: 12.3, rsi: 71, volatility: 6.5, exchanges: 180, category: 'Smart Contract' },
      { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', price: 0.41, market_cap: 58000000000, volume_24h: 8500000000, change_1h: 2.5, change_24h: 15.2, change_7d: 28.5, rsi: 82, volatility: 12.3, exchanges: 280, category: 'Meme' },
      { id: 'xrp', symbol: 'XRP', name: 'Ripple', price: 2.35, market_cap: 125000000000, volume_24h: 12000000000, change_1h: -0.5, change_24h: -2.1, change_7d: 8.5, rsi: 45, volatility: 5.8, exchanges: 350, category: 'Payment' },
      { id: 'cardano', symbol: 'ADA', name: 'Cardano', price: 1.05, market_cap: 37000000000, volume_24h: 1200000000, change_1h: 0.2, change_24h: 1.2, change_7d: 3.5, rsi: 52, volatility: 5.2, exchanges: 220, category: 'Smart Contract' },
      { id: 'avalanche', symbol: 'AVAX', name: 'Avalanche', price: 48, market_cap: 18500000000, volume_24h: 850000000, change_1h: 0.8, change_24h: 3.2, change_7d: 8.1, rsi: 61, volatility: 7.2, exchanges: 150, category: 'Smart Contract' },
      { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', price: 9.2, market_cap: 12500000000, volume_24h: 450000000, change_1h: 0.1, change_24h: 0.8, change_7d: 2.1, rsi: 48, volatility: 5.5, exchanges: 180, category: 'Infrastructure' },
      { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', price: 22.5, market_cap: 13200000000, volume_24h: 950000000, change_1h: 1.5, change_24h: 8.5, change_7d: 15.2, rsi: 68, volatility: 6.8, exchanges: 220, category: 'Oracle' },
      { id: 'shiba', symbol: 'SHIB', name: 'Shiba Inu', price: 0.000025, market_cap: 14800000000, volume_24h: 1500000000, change_1h: 3.2, change_24h: 18.5, change_7d: 35.2, rsi: 78, volatility: 15.2, exchanges: 180, category: 'Meme' },
      { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', price: 15.8, market_cap: 9500000000, volume_24h: 380000000, change_1h: 0.5, change_24h: 2.8, change_7d: 5.5, rsi: 55, volatility: 5.8, exchanges: 150, category: 'DeFi' },
      { id: 'pepe', symbol: 'PEPE', name: 'Pepe', price: 0.000021, market_cap: 8800000000, volume_24h: 2200000000, change_1h: 5.5, change_24h: 25.8, change_7d: 52.1, rsi: 88, volatility: 18.5, exchanges: 120, category: 'Meme' },
    ];
    setTokens(sampleTokens);
  }, []);

  // Preset filters
  const presets = [
    { id: 'gainers', name: '🚀 Top Gainers', filters: [{ field: 'change_24h', operator: 'gt' as const, value: 5 }] },
    { id: 'losers', name: '📉 Top Losers', filters: [{ field: 'change_24h', operator: 'lt' as const, value: -5 }] },
    { id: 'oversold', name: '💰 Oversold (RSI < 30)', filters: [{ field: 'rsi', operator: 'lt' as const, value: 30 }] },
    { id: 'overbought', name: '⚠️ Overbought (RSI > 70)', filters: [{ field: 'rsi', operator: 'gt' as const, value: 70 }] },
    { id: 'highvolume', name: '📊 High Volume', filters: [{ field: 'volume_24h', operator: 'gt' as const, value: 1000000000 }] },
    { id: 'lowvolatility', name: '🛡️ Low Volatility', filters: [{ field: 'volatility', operator: 'lt' as const, value: 5 }] },
    { id: 'memes', name: '🐸 Meme Coins', filters: [] },
  ];

  const applyPreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setFilters(preset.filters);
      setActivePreset(presetId);
    }
  };

  const clearFilters = () => {
    setFilters([]);
    setActivePreset(null);
  };

  // Apply filters
  const filteredTokens = tokens.filter(token => {
    if (activePreset === 'memes') {
      return token.category === 'Meme';
    }
    return filters.every(filter => {
      const value = token[filter.field as keyof TokenData] as number;
      switch (filter.operator) {
        case 'gt': return value > filter.value;
        case 'lt': return value < filter.value;
        case 'eq': return value === filter.value;
        default: return true;
      }
    });
  });

  // Sort
  const sortedTokens = [...filteredTokens].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    }
    return 0;
  });

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
    return `$${num.toFixed(2)}`;
  };

  const getRSIColor = (rsi: number) => {
    if (rsi >= 70) return 'text-red-600 bg-red-50';
    if (rsi <= 30) return 'text-green-600 bg-green-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🔍 Token Screener
          <InfoButton explanation="Filter and find cryptocurrencies based on specific criteria like price changes, volume, RSI, and more. Great for finding trading opportunities!" />
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Find tokens that match your criteria
        </p>
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 What is a Screener?">
          A screener helps you <strong>filter</strong> through thousands of coins to find ones that match your criteria.
          <br/><br/>
          For example, you can find:
          <br/>• Coins that went up a lot today (momentum)
          <br/>• Coins that are "oversold" (might bounce back)
          <br/>• Coins with high trading volume (lots of interest)
        </BeginnerTip>
      )}

      {/* Preset Filters */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Quick Filters:</p>
        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                activePreset === preset.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {preset.name}
            </button>
          ))}
          {filters.length > 0 && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-red-100 text-red-600 hover:bg-red-200"
            >
              ✕ Clear
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <p className="text-sm text-gray-500 mb-4">
        Showing {sortedTokens.length} of {tokens.length} tokens
      </p>

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2">#</th>
              <th className="text-left py-3 px-2">Token</th>
              <th className="text-right py-3 px-2 cursor-pointer hover:bg-gray-50" onClick={() => { setSortBy('price'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                Price {sortBy === 'price' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-3 px-2 cursor-pointer hover:bg-gray-50" onClick={() => { setSortBy('change_24h'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                24h % {sortBy === 'change_24h' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-3 px-2 cursor-pointer hover:bg-gray-50" onClick={() => { setSortBy('change_7d'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                7d % {sortBy === 'change_7d' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-3 px-2 cursor-pointer hover:bg-gray-50" onClick={() => { setSortBy('market_cap'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                Market Cap {sortBy === 'market_cap' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-3 px-2 cursor-pointer hover:bg-gray-50" onClick={() => { setSortBy('volume_24h'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>
                Volume {sortBy === 'volume_24h' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-center py-3 px-2">
                RSI
                <InfoButton explanation="RSI (Relative Strength Index) measures if a coin is overbought (>70) or oversold (<30). Overbought = might drop. Oversold = might bounce." />
              </th>
              <th className="text-center py-3 px-2">Category</th>
            </tr>
          </thead>
          <tbody>
            {sortedTokens.map((token, index) => (
              <tr key={token.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-2 text-gray-500">{index + 1}</td>
                <td className="py-3 px-2">
                  <div className="font-bold">{token.symbol}</div>
                  <div className="text-xs text-gray-500">{token.name}</div>
                </td>
                <td className="py-3 px-2 text-right font-medium">
                  ${token.price < 1 ? token.price.toFixed(6) : token.price.toLocaleString()}
                </td>
                <td className={`py-3 px-2 text-right font-medium ${token.change_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {token.change_24h >= 0 ? '+' : ''}{token.change_24h.toFixed(1)}%
                </td>
                <td className={`py-3 px-2 text-right font-medium ${token.change_7d >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {token.change_7d >= 0 ? '+' : ''}{token.change_7d.toFixed(1)}%
                </td>
                <td className="py-3 px-2 text-right">{formatNumber(token.market_cap)}</td>
                <td className="py-3 px-2 text-right">{formatNumber(token.volume_24h)}</td>
                <td className="py-3 px-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getRSIColor(token.rsi)}`}>
                    {token.rsi}
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                    {token.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedTokens.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No tokens match your filters</p>
          <button
            onClick={clearFilters}
            className="mt-2 text-blue-600 hover:underline"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* RSI Legend */}
      {showBeginnerTips && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">📊 Understanding RSI</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">0-30</span>
              <p className="mt-1 text-gray-600">Oversold</p>
              <p className="text-xs text-gray-500">Might bounce up</p>
            </div>
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full font-bold">30-70</span>
              <p className="mt-1 text-gray-600">Neutral</p>
              <p className="text-xs text-gray-500">Normal range</p>
            </div>
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full font-bold">70-100</span>
              <p className="mt-1 text-gray-600">Overbought</p>
              <p className="text-xs text-gray-500">Might drop down</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenScreener;
