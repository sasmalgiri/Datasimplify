'use client';

import { useState, useEffect, useCallback } from 'react';
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
  volume_mcap_ratio: number;
}

interface Filter {
  id: string;
  field: string;
  operator: 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'between';
  value: number;
  value2?: number; // For 'between' operator
}

interface SavedQuery {
  name: string;
  filters: Filter[];
  createdAt: number;
}

// All available filter fields with metadata
const FILTER_FIELDS = [
  { key: 'price', label: 'Price (USD)', group: 'Price', step: 0.01 },
  { key: 'change_1h', label: '1h Change %', group: 'Price', step: 0.1 },
  { key: 'change_24h', label: '24h Change %', group: 'Price', step: 0.1 },
  { key: 'change_7d', label: '7d Change %', group: 'Price', step: 0.1 },
  { key: 'market_cap', label: 'Market Cap', group: 'Market', step: 1000000 },
  { key: 'volume_24h', label: '24h Volume', group: 'Market', step: 1000000 },
  { key: 'volume_mcap_ratio', label: 'Volume/MCap Ratio', group: 'Market', step: 0.01 },
  { key: 'rsi', label: 'RSI (14)', group: 'Technical', step: 1 },
  { key: 'volatility', label: 'Volatility', group: 'Technical', step: 0.1 },
] as const;

const OPERATOR_LABELS: Record<string, string> = {
  gt: '>', lt: '<', gte: '≥', lte: '≤', eq: '=', between: 'between',
};

export function TokenScreener({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [tokens, setTokens] = useState<TokenData[]>([]);
  const [filters, setFilters] = useState<Filter[]>([]);
  const [sortBy, setSortBy] = useState<keyof TokenData>('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [activePreset, setActivePreset] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showFilterBuilder, setShowFilterBuilder] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [queryName, setQueryName] = useState('');
  const [presetCategory, setPresetCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Load saved queries from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('screener_saved_queries');
      if (saved) setSavedQueries(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  // Category mapping for coins
  const categoryMap: Record<string, string> = {
    'BTC': 'Store of Value', 'ETH': 'Smart Contract', 'SOL': 'Smart Contract',
    'DOGE': 'Meme', 'XRP': 'Payment', 'ADA': 'Smart Contract', 'AVAX': 'Smart Contract',
    'DOT': 'Infrastructure', 'LINK': 'Oracle', 'SHIB': 'Meme', 'UNI': 'DeFi',
    'PEPE': 'Meme', 'MATIC': 'Layer 2', 'ARB': 'Layer 2', 'OP': 'Layer 2',
    'AAVE': 'DeFi', 'MKR': 'DeFi', 'LDO': 'DeFi', 'BNB': 'Exchange',
    'TRX': 'Payment', 'LTC': 'Payment', 'ATOM': 'Infrastructure', 'NEAR': 'Smart Contract',
    'BONK': 'Meme', 'FLOKI': 'Meme', 'WIF': 'Meme', 'BRETT': 'Meme',
    'INJ': 'DeFi', 'RUNE': 'DeFi', 'CRV': 'DeFi', 'SNX': 'DeFi',
    'FIL': 'Infrastructure', 'AR': 'Infrastructure', 'STORJ': 'Infrastructure',
    'IMX': 'Gaming', 'AXS': 'Gaming', 'GALA': 'Gaming', 'SAND': 'Gaming', 'MANA': 'Gaming',
    'FET': 'AI', 'AGIX': 'AI', 'OCEAN': 'AI', 'TAO': 'AI', 'ARKM': 'AI',
    'RNDR': 'AI', 'WLD': 'AI',
  };

  useEffect(() => {
    const fetchTokenData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch('/api/crypto?limit=100');

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

                const estimatedRsi = Math.max(0, Math.min(100, 50 + change24h * 2));
                const volatility = Math.round((Math.abs(change24h) + Math.abs(change7d) / 3) * 10) / 10;
                const volume_mcap_ratio = marketCap > 0 ? Math.round((volume24h / marketCap) * 10000) / 10000 : 0;

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
                  volume_mcap_ratio,
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
    const interval = setInterval(fetchTokenData, 2 * 60 * 1000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 20+ Preset filters organized by category ──
  const presetGroups = [
    {
      category: 'Momentum',
      presets: [
        { id: 'gainers_strong', name: '🚀 Strong Gainers (>10%)', filters: [{ id: '1', field: 'change_24h', operator: 'gt' as const, value: 10 }] },
        { id: 'gainers', name: '📈 Gainers (>5%)', filters: [{ id: '1', field: 'change_24h', operator: 'gt' as const, value: 5 }] },
        { id: 'losers', name: '📉 Losers (<-5%)', filters: [{ id: '1', field: 'change_24h', operator: 'lt' as const, value: -5 }] },
        { id: 'losers_crash', name: '💀 Crashers (<-15%)', filters: [{ id: '1', field: 'change_24h', operator: 'lt' as const, value: -15 }] },
        { id: 'weekly_momentum', name: '🔥 Weekly Rockets (>20%)', filters: [{ id: '1', field: 'change_7d', operator: 'gt' as const, value: 20 }] },
        { id: 'hourly_pump', name: '⚡ 1h Pump (>3%)', filters: [{ id: '1', field: 'change_1h', operator: 'gt' as const, value: 3 }] },
      ],
    },
    {
      category: 'Technical',
      presets: [
        { id: 'oversold', name: '💰 Oversold (RSI < 30)', filters: [{ id: '1', field: 'rsi', operator: 'lt' as const, value: 30 }] },
        { id: 'overbought', name: '⚠️ Overbought (RSI > 70)', filters: [{ id: '1', field: 'rsi', operator: 'gt' as const, value: 70 }] },
        { id: 'neutral_rsi', name: '⚖️ Neutral RSI (40-60)', filters: [{ id: '1', field: 'rsi', operator: 'between' as const, value: 40, value2: 60 }] },
        { id: 'lowvolatility', name: '🛡️ Low Volatility (<3)', filters: [{ id: '1', field: 'volatility', operator: 'lt' as const, value: 3 }] },
        { id: 'highvolatility', name: '🎢 High Volatility (>10)', filters: [{ id: '1', field: 'volatility', operator: 'gt' as const, value: 10 }] },
      ],
    },
    {
      category: 'Volume',
      presets: [
        { id: 'highvolume', name: '📊 High Volume (>$1B)', filters: [{ id: '1', field: 'volume_24h', operator: 'gt' as const, value: 1_000_000_000 }] },
        { id: 'unusual_volume', name: '🔔 Unusual Vol Ratio (>0.15)', filters: [{ id: '1', field: 'volume_mcap_ratio', operator: 'gt' as const, value: 0.15 }] },
        { id: 'low_volume', name: '🔇 Low Volume (<$50M)', filters: [{ id: '1', field: 'volume_24h', operator: 'lt' as const, value: 50_000_000 }] },
      ],
    },
    {
      category: 'Market Cap',
      presets: [
        { id: 'largecap', name: '🏦 Large Cap (>$10B)', filters: [{ id: '1', field: 'market_cap', operator: 'gt' as const, value: 10_000_000_000 }] },
        { id: 'midcap', name: '📦 Mid Cap ($1B-$10B)', filters: [{ id: '1', field: 'market_cap', operator: 'between' as const, value: 1_000_000_000, value2: 10_000_000_000 }] },
        { id: 'smallcap', name: '💎 Small Cap (<$1B)', filters: [{ id: '1', field: 'market_cap', operator: 'lt' as const, value: 1_000_000_000 }] },
        { id: 'microcap', name: '🔬 Micro Cap (<$100M)', filters: [{ id: '1', field: 'market_cap', operator: 'lt' as const, value: 100_000_000 }] },
      ],
    },
    {
      category: 'Category',
      presets: [
        { id: 'memes', name: '🐸 Meme Coins', filters: [] },
        { id: 'defi', name: '🏗️ DeFi', filters: [] },
        { id: 'ai', name: '🤖 AI Tokens', filters: [] },
        { id: 'gaming', name: '🎮 Gaming', filters: [] },
        { id: 'layer2', name: '⚡ Layer 2', filters: [] },
      ],
    },
  ];

  const categoryPresetMap: Record<string, string> = {
    memes: 'Meme', defi: 'DeFi', ai: 'AI', gaming: 'Gaming', layer2: 'Layer 2',
  };

  const applyPreset = (presetId: string) => {
    // Category-based presets
    if (categoryPresetMap[presetId]) {
      setCategoryFilter(categoryPresetMap[presetId]);
      setFilters([]);
      setActivePreset(presetId);
      return;
    }

    const preset = presetGroups.flatMap(g => g.presets).find(p => p.id === presetId);
    if (preset) {
      setFilters(preset.filters);
      setCategoryFilter('all');
      setActivePreset(presetId);
    }
  };

  const clearFilters = () => {
    setFilters([]);
    setCategoryFilter('all');
    setActivePreset(null);
    setSearchQuery('');
  };

  // ── Custom filter builder ──
  const addFilter = () => {
    const newFilter: Filter = {
      id: Date.now().toString(),
      field: 'change_24h',
      operator: 'gt',
      value: 0,
    };
    setFilters(prev => [...prev, newFilter]);
    setActivePreset(null);
  };

  const updateFilter = (id: string, updates: Partial<Filter>) => {
    setFilters(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f));
    setActivePreset(null);
  };

  const removeFilter = (id: string) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  };

  // ── Saved queries ──
  const saveQuery = useCallback(() => {
    if (!queryName.trim() || filters.length === 0) return;
    const newQuery: SavedQuery = { name: queryName.trim(), filters: [...filters], createdAt: Date.now() };
    const updated = [...savedQueries, newQuery];
    setSavedQueries(updated);
    localStorage.setItem('screener_saved_queries', JSON.stringify(updated));
    setQueryName('');
  }, [queryName, filters, savedQueries]);

  const loadQuery = (query: SavedQuery) => {
    setFilters(query.filters);
    setCategoryFilter('all');
    setActivePreset(null);
  };

  const deleteSavedQuery = (idx: number) => {
    const updated = savedQueries.filter((_, i) => i !== idx);
    setSavedQueries(updated);
    localStorage.setItem('screener_saved_queries', JSON.stringify(updated));
  };

  // ── Apply all filters (AND logic) ──
  const filteredTokens = tokens.filter(token => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!token.symbol.toLowerCase().includes(q) && !token.name.toLowerCase().includes(q)) return false;
    }

    // Category filter
    if (categoryFilter !== 'all' && token.category !== categoryFilter) return false;

    // Numeric filters (AND logic)
    return filters.every(filter => {
      const value = token[filter.field as keyof TokenData] as number;
      switch (filter.operator) {
        case 'gt': return value > filter.value;
        case 'lt': return value < filter.value;
        case 'gte': return value >= filter.value;
        case 'lte': return value <= filter.value;
        case 'eq': return Math.abs(value - filter.value) < 0.001;
        case 'between': return value >= filter.value && value <= (filter.value2 ?? filter.value);
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

  const toggleSort = (field: keyof TokenData) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(0)}M`;
    return `$${num.toFixed(2)}`;
  };

  const getRSIColor = (rsi: number) => {
    if (rsi >= 70) return 'text-red-600 bg-red-50';
    if (rsi <= 30) return 'text-green-600 bg-green-50';
    return 'text-gray-400 bg-gray-700/50';
  };

  const allCategories = Array.from(new Set(tokens.map(t => t.category))).sort();
  const visiblePresets = presetCategory === 'all'
    ? presetGroups
    : presetGroups.filter(g => g.category === presetCategory);

  return (
    <div className="bg-gray-800/60 rounded-xl border border-gray-700/50 p-6 text-white">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            🔍 Advanced Token Screener
            <InfoButton explanation="Filter and find cryptocurrencies using 20+ filters across price, volume, market cap, technicals, and categories. Save your favorite filter combinations for quick access." />
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            {sortedTokens.length} of {tokens.length} tokens • {filters.length} active filter{filters.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilterBuilder(!showFilterBuilder)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showFilterBuilder ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {showFilterBuilder ? '✕ Hide Builder' : '⚙ Custom Filters'}
          </button>
          {(filters.length > 0 || categoryFilter !== 'all' || searchQuery) && (
            <button
              onClick={clearFilters}
              className="px-3 py-2 rounded-lg text-sm font-medium bg-red-500/20 text-red-400 hover:bg-red-500/30"
            >
              ✕ Clear All
            </button>
          )}
        </div>
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 What is a Screener?">
          A screener helps you <strong>filter</strong> through coins to find ones that match your criteria.
          <br/><br/>
          Try a preset below, or build your own filter with &quot;Custom Filters&quot;.
          You can combine multiple conditions — all must match (AND logic).
        </BeginnerTip>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-400">Loading token data...</span>
        </div>
      )}

      {error && !loading && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Search + Category Filter */}
      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or symbol..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-700/50 text-sm text-white w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-400"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setActivePreset(null); }}
          className="px-3 py-2 rounded-lg border border-gray-600 bg-gray-700/50 text-sm text-white"
          title="Filter by category"
        >
          <option value="all">All Categories</option>
          {allCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {/* Preset Category Tabs + Preset Buttons */}
      <div className="mb-4">
        <div className="flex gap-1 mb-2 border-b border-gray-700">
          {['all', ...presetGroups.map(g => g.category)].map(cat => (
            <button
              key={cat}
              onClick={() => setPresetCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium transition-colors border-b-2 ${
                presetCategory === cat
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat === 'all' ? 'All Presets' : cat}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {visiblePresets.flatMap(group =>
            group.presets.map(preset => (
              <button
                key={preset.id}
                onClick={() => applyPreset(preset.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activePreset === preset.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {preset.name}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Custom Filter Builder */}
      {showFilterBuilder && (
        <div className="mb-6 p-4 bg-gray-700/50 rounded-xl border border-gray-600">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-gray-300">Custom Filter Builder (AND logic)</h3>
            <button onClick={addFilter} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700">
              + Add Condition
            </button>
          </div>

          {filters.length === 0 && (
            <p className="text-sm text-gray-400 py-2">No custom filters. Click &quot;+ Add Condition&quot; to start.</p>
          )}

          <div className="space-y-2">
            {filters.map((filter, idx) => (
              <div key={filter.id} className="flex flex-wrap items-center gap-2 bg-gray-800/60 p-2 rounded-lg border border-gray-600">
                {idx > 0 && <span className="text-xs font-bold text-blue-600 px-1">AND</span>}
                <select
                  value={filter.field}
                  onChange={(e) => updateFilter(filter.id, { field: e.target.value })}
                  className="px-2 py-1 text-sm border border-gray-600 rounded bg-gray-700/50 text-white"
                  title="Filter field"
                >
                  {FILTER_FIELDS.map(f => (
                    <option key={f.key} value={f.key}>{f.label}</option>
                  ))}
                </select>
                <select
                  value={filter.operator}
                  onChange={(e) => updateFilter(filter.id, { operator: e.target.value as Filter['operator'] })}
                  className="px-2 py-1 text-sm border border-gray-600 rounded bg-gray-700/50 text-white"
                  title="Filter operator"
                >
                  {Object.entries(OPERATOR_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>{v}</option>
                  ))}
                </select>
                <input
                  type="number"
                  step={FILTER_FIELDS.find(f => f.key === filter.field)?.step || 1}
                  value={filter.value}
                  onChange={(e) => updateFilter(filter.id, { value: parseFloat(e.target.value) || 0 })}
                  className="px-2 py-1 text-sm border border-gray-600 rounded bg-gray-700/50 text-white w-28"
                  title="Filter value"
                />
                {filter.operator === 'between' && (
                  <>
                    <span className="text-xs text-gray-500">and</span>
                    <input
                      type="number"
                      step={FILTER_FIELDS.find(f => f.key === filter.field)?.step || 1}
                      value={filter.value2 || 0}
                      onChange={(e) => updateFilter(filter.id, { value2: parseFloat(e.target.value) || 0 })}
                      className="px-2 py-1 text-sm border border-gray-600 rounded bg-gray-700/50 text-white w-28"
                      title="Filter upper bound value"
                    />
                  </>
                )}
                <button
                  onClick={() => removeFilter(filter.id)}
                  className="px-2 py-1 text-red-500 hover:text-red-700 text-sm"
                  title="Remove filter"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          {/* Save Query */}
          {filters.length > 0 && (
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-600">
              <input
                type="text"
                value={queryName}
                onChange={(e) => setQueryName(e.target.value)}
                placeholder="Name this filter set..."
                className="px-2 py-1 text-sm border border-gray-600 rounded bg-gray-700/50 text-white flex-1 placeholder-gray-400"
              />
              <button
                onClick={saveQuery}
                disabled={!queryName.trim()}
                className="px-3 py-1 bg-green-600 text-white text-xs rounded-lg hover:bg-green-700 disabled:bg-gray-600"
              >
                💾 Save
              </button>
            </div>
          )}

          {/* Saved Queries */}
          {savedQueries.length > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-600">
              <p className="text-xs font-medium text-gray-500 mb-2">Saved Queries:</p>
              <div className="flex flex-wrap gap-2">
                {savedQueries.map((q, i) => (
                  <div key={i} className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/30 rounded-lg px-2 py-1">
                    <button onClick={() => loadQuery(q)} className="text-xs font-medium text-yellow-300 hover:underline">
                      {q.name}
                    </button>
                    <button onClick={() => deleteSavedQuery(i)} className="text-yellow-400 hover:text-red-400 text-xs ml-1">✕</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Results Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-gray-800">
            <tr className="border-b border-gray-700">
              <th className="text-left py-3 px-2">#</th>
              <th className="text-left py-3 px-2">Token</th>
              <th className="text-right py-3 px-2 cursor-pointer hover:bg-gray-700" onClick={() => toggleSort('price')}>
                Price {sortBy === 'price' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-3 px-2 cursor-pointer hover:bg-gray-700" onClick={() => toggleSort('change_1h')}>
                1h % {sortBy === 'change_1h' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-3 px-2 cursor-pointer hover:bg-gray-700" onClick={() => toggleSort('change_24h')}>
                24h % {sortBy === 'change_24h' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-3 px-2 cursor-pointer hover:bg-gray-700" onClick={() => toggleSort('change_7d')}>
                7d % {sortBy === 'change_7d' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-3 px-2 cursor-pointer hover:bg-gray-700" onClick={() => toggleSort('market_cap')}>
                Market Cap {sortBy === 'market_cap' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-right py-3 px-2 cursor-pointer hover:bg-gray-700" onClick={() => toggleSort('volume_24h')}>
                Volume {sortBy === 'volume_24h' && (sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="text-center py-3 px-2 cursor-pointer hover:bg-gray-700" onClick={() => toggleSort('volume_mcap_ratio')}>
                V/MC {sortBy === 'volume_mcap_ratio' && (sortOrder === 'desc' ? '↓' : '↑')}
                <InfoButton explanation="Volume to Market Cap ratio. Higher values indicate unusual trading activity relative to the coin's size. Values above 0.15 often signal significant interest." />
              </th>
              <th className="text-center py-3 px-2">
                RSI
                <InfoButton explanation="RSI (Relative Strength Index) measures if a coin is overbought (>70) or oversold (<30)." />
              </th>
              <th className="text-center py-3 px-2">Category</th>
            </tr>
          </thead>
          <tbody>
            {sortedTokens.map((token, index) => (
              <tr key={token.id} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                <td className="py-3 px-2 text-gray-500">{index + 1}</td>
                <td className="py-3 px-2">
                  <div className="font-bold">{token.symbol}</div>
                  <div className="text-xs text-gray-500">{token.name}</div>
                </td>
                <td className="py-3 px-2 text-right font-medium">
                  ${token.price < 1 ? token.price.toFixed(6) : token.price.toLocaleString()}
                </td>
                <td className={`py-3 px-2 text-right font-medium ${token.change_1h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {token.change_1h >= 0 ? '+' : ''}{token.change_1h.toFixed(1)}%
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
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    token.volume_mcap_ratio > 0.15 ? 'text-amber-400 bg-amber-500/10' : 'text-gray-400'
                  }`}>
                    {token.volume_mcap_ratio.toFixed(3)}
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${getRSIColor(token.rsi)}`}>
                    {token.rsi}
                  </span>
                </td>
                <td className="py-3 px-2 text-center">
                  <span className="px-2 py-1 bg-gray-700 rounded text-xs">
                    {token.category}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {sortedTokens.length === 0 && !loading && (
        <div className="text-center py-8">
          <p className="text-gray-500">No tokens match your filters</p>
          <button onClick={clearFilters} className="mt-2 text-blue-600 hover:underline">Clear filters</button>
        </div>
      )}

      {/* RSI Legend */}
      {showBeginnerTips && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">📊 Understanding RSI</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full font-bold">0-30</span>
              <p className="mt-1 text-gray-400">Oversold</p>
              <p className="text-xs text-gray-500">Might bounce up</p>
            </div>
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-gray-700 text-gray-300 rounded-full font-bold">30-70</span>
              <p className="mt-1 text-gray-400">Neutral</p>
              <p className="text-xs text-gray-500">Normal range</p>
            </div>
            <div className="text-center">
              <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full font-bold">70-100</span>
              <p className="mt-1 text-gray-400">Overbought</p>
              <p className="text-xs text-gray-500">Might drop down</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TokenScreener;
