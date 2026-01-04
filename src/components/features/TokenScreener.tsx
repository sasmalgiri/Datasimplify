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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Category mapping for coins
  const categoryMap: Record<string, string> = {
    'BTC': 'Store of Value', 'ETH': 'Smart Contract', 'SOL': 'Smart Contract',
    'DOGE': 'Meme', 'XRP': 'Payment', 'ADA': 'Smart Contract', 'AVAX': 'Smart Contract',
    'DOT': 'Infrastructure', 'LINK': 'Oracle', 'SHIB': 'Meme', 'UNI': 'DeFi',
    'PEPE': 'Meme', 'MATIC': 'Layer 2', 'ARB': 'Layer 2', 'OP': 'Layer 2',
    'AAVE': 'DeFi', 'MKR': 'DeFi', 'LDO': 'DeFi', 'BNB': 'Exchange',
    'TRX': 'Payment', 'LTC': 'Payment', 'ATOM': 'Infrastructure', 'NEAR': 'Smart Contract'
  };

  useEffect(() => {
    const fetchTokenData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/crypto?limit=50');

        if (response.ok) {
          const result = await response.json();

          if (result.success && result.data) {
            const transformedTokens: TokenData[] = result.data
              .map((coin: any) => {
                const symbol = String(coin.symbol || '').toUpperCase();
                const name = String(coin.name || symbol);

                const price = typeof coin.current_price === 'number'
                  ? coin.current_price
                  : typeof coin.price === 'number'
                    ? coin.price
                    : 0;

                const marketCap = typeof coin.market_cap === 'number' ? coin.market_cap : 0;
                const volume24h = typeof coin.total_volume === 'number'
                  ? coin.total_volume
                  : typeof coin.volume_24h === 'number'
                    ? coin.volume_24h
                    : 0;

                const change1h = typeof coin.price_change_percentage_1h_in_currency === 'number'
                  ? coin.price_change_percentage_1h_in_currency
                  : typeof coin.price_change_1h === 'number'
                    ? coin.price_change_1h
                    : 0;

                const change24h = typeof coin.price_change_percentage_24h === 'number'
                  ? coin.price_change_percentage_24h
                  : typeof coin.price_change_24h === 'number'
                    ? coin.price_change_24h
                    : 0;

                const change7d = typeof coin.price_change_percentage_7d_in_currency === 'number'
                  ? coin.price_change_percentage_7d_in_currency
                  : typeof coin.price_change_7d === 'number'
                    ? coin.price_change_7d
                    : 0;

                // RSI estimate based on real price change (simplified)
                const estimatedRsi = Math.max(20, Math.min(80, 50 + change24h * 2));

                // Deterministic volatility estimate from observed % changes
                const volatility = Math.round((Math.abs(change24h) + Math.abs(change7d) / 3) * 10) / 10;

                return {
                  id: symbol.toLowerCase(),
                  symbol,
                  name,
                  price,
                  market_cap: marketCap,
                  volume_24h: volume24h,
                  change_1h: change1h,
                  change_24h: change24h,
                  change_7d: change7d,
                  rsi: Math.round(estimatedRsi),
                  volatility,
                  category: categoryMap[symbol] || 'Other',
                };
              })
              .filter((t: TokenData) => t.symbol && t.price > 0);

            setTokens(transformedTokens);
          } else {
            setError('Failed to parse token data');
          }
        } else {
          setError('Failed to fetch token data');
        }
      } catch (err) {
        console.error('Token screener fetch error:', err);
        setError('Failed to load token data');
      }

      setLoading(false);
    };

    fetchTokenData();

    // Refresh every 2 minutes
    const interval = setInterval(fetchTokenData, 2 * 60 * 1000);
    return () => clearInterval(interval);
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

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Loading token data...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
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
          <thead className="sticky top-0 z-10 bg-white">
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
