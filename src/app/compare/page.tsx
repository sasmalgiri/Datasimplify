'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadButton } from '@/components/TemplateDownloadButton';
import { SUPPORTED_COINS } from '@/lib/dataTypes';

// Help icon with tooltip
function HelpIcon({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center ml-2"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="cursor-help w-5 h-5 rounded-full bg-gray-700 text-emerald-400 text-xs flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors font-bold">
        ?
      </span>
      {isVisible && (
        <span className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 text-sm text-white bg-gray-900 rounded-lg shadow-2xl border border-emerald-500/50 min-w-[250px] max-w-[350px] text-left">
          {text}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></span>
        </span>
      )}
    </span>
  );
}

interface Coin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  high_24h?: number;
  low_24h?: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
  price_change_percentage_1y_in_currency?: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation?: number;
  total_volume: number;
  circulating_supply: number;
  total_supply?: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  roi?: {
    times: number;
    currency: string;
    percentage: number;
  } | null;
  last_updated: string;
}

// Categories with colors
const CATEGORIES = [
  { id: 'all', label: 'All', color: 'bg-gray-600' },
  { id: 'layer1', label: 'Layer 1', color: 'bg-blue-600' },
  { id: 'layer2', label: 'Layer 2', color: 'bg-purple-600' },
  { id: 'defi', label: 'DeFi', color: 'bg-green-600' },
  { id: 'gaming', label: 'Gaming', color: 'bg-pink-600' },
  { id: 'meme', label: 'Meme', color: 'bg-yellow-600' },
  { id: 'exchange', label: 'Exchange', color: 'bg-orange-600' },
  { id: 'payments', label: 'Payments', color: 'bg-cyan-600' },
  { id: 'storage', label: 'Storage', color: 'bg-indigo-600' },
  { id: 'ai', label: 'AI', color: 'bg-red-600' },
];

// Initial coin list from static config (will be replaced with dynamic list)
const INITIAL_ALL_COINS = SUPPORTED_COINS.map(coin => ({
  id: coin.symbol.toLowerCase(),
  symbol: coin.symbol,
  name: coin.name,
  category: coin.category,
}));

// This will be populated dynamically - use INITIAL_ALL_COINS as fallback
let ALL_COINS = INITIAL_ALL_COINS;

// Sort options
const SORT_OPTIONS = [
  { id: 'market_cap_desc', label: 'Market Cap (High to Low)' },
  { id: 'market_cap_asc', label: 'Market Cap (Low to High)' },
  { id: 'price_change_24h_desc', label: '24h Change (Best First)' },
  { id: 'price_change_24h_asc', label: '24h Change (Worst First)' },
  { id: 'volume_desc', label: 'Volume (High to Low)' },
  { id: 'ath_change_desc', label: 'Closest to ATH' },
  { id: 'ath_change_asc', label: 'Furthest from ATH' },
];

// Visible columns configuration - expanded to match Download page parity
const COLUMN_OPTIONS = [
  // Market Data
  { id: 'price', label: 'Price', default: true, category: 'Market' },
  { id: 'change_24h', label: '24h Change', default: true, category: 'Market' },
  { id: 'change_7d', label: '7d Change', default: true, category: 'Market' },
  { id: 'change_30d', label: '30d Change', default: false, category: 'Market' },
  { id: 'change_1y', label: '1Y Change', default: false, category: 'Market' },
  { id: 'market_cap', label: 'Market Cap', default: true, category: 'Market' },
  { id: 'fdv', label: 'Fully Diluted Val.', default: false, category: 'Market' },
  { id: 'volume', label: '24h Volume', default: true, category: 'Market' },
  { id: 'vol_mcap_ratio', label: 'Vol/MCap Ratio', default: false, category: 'Market' },
  { id: 'circulating', label: 'Circulating Supply', default: false, category: 'Market' },
  { id: 'max_supply', label: 'Max Supply', default: false, category: 'Market' },
  { id: 'supply_ratio', label: 'Circ/Max Supply %', default: false, category: 'Market' },

  // Price Levels
  { id: 'ath', label: 'ATH', default: true, category: 'Price Levels' },
  { id: 'from_ath', label: 'From ATH', default: true, category: 'Price Levels' },
  { id: 'atl', label: 'ATL', default: false, category: 'Price Levels' },
  { id: 'from_atl', label: 'From ATL', default: false, category: 'Price Levels' },
  { id: 'high_24h', label: '24h High', default: false, category: 'Price Levels' },
  { id: 'low_24h', label: '24h Low', default: false, category: 'Price Levels' },
  { id: 'price_range_24h', label: '24h Range %', default: false, category: 'Price Levels' },

  // Technical Indicators (real, derived from candles)
  { id: 'rsi', label: 'RSI (14)', default: false, category: 'Technical' },
  { id: 'volatility', label: 'Volatility (30d)', default: false, category: 'Technical' },
  { id: 'momentum', label: 'Momentum (30d)', default: false, category: 'Technical' },

  // Market Dominance
  { id: 'dominance', label: 'Market Dominance', default: false, category: 'Dominance' },
];

type TechnicalMetrics = {
  rsi14: number | null;
  volatility30dPct: number | null;
  momentum30dPct: number | null;
  source: string | null;
  lastUpdate: string | null;
};

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['bitcoin', 'ethereum', 'solana']);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [technicals, setTechnicals] = useState<Map<string, TechnicalMetrics>>(new Map());
  const [technicalsLoading, setTechnicalsLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('market_cap_desc');
  const [visibleColumns, setVisibleColumns] = useState<string[]>(
    COLUMN_OPTIONS.filter(c => c.default).map(c => c.id)
  );
  const [showFilters, setShowFilters] = useState(false);
  const [availableCoins, setAvailableCoins] = useState(INITIAL_ALL_COINS);

  // Fetch all available coins dynamically (600+)
  useEffect(() => {
    async function fetchAllCoins() {
      try {
        const res = await fetch('/api/crypto/all');
        const data = await res.json();
        if (data.success && data.coins && data.coins.length > 0) {
          const coinsList = data.coins.map((c: { id: string; name: string; symbol: string; category: string }) => ({
            id: c.id,
            symbol: c.symbol,
            name: c.name,
            category: c.category || 'other',
          }));
          setAvailableCoins(coinsList);
          // Update module-level ALL_COINS for backwards compatibility
          ALL_COINS = coinsList;
        }
      } catch (error) {
        console.error('Failed to fetch coins:', error);
      }
    }
    fetchAllCoins();
  }, []);

  const fetchCoins = async () => {
    if (selectedIds.length === 0) {
      setCoins([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const ids = selectedIds.join(',');
      // Use internal API which checks Supabase cache first, then falls back to CoinGecko
      const res = await fetch(`/api/crypto?ids=${ids}`);
      const json = await res.json();
      const data = json.data;

      if (Array.isArray(data)) {
        // Sort data based on selection
        const sortedData = [...data];
        switch (sortBy) {
          case 'market_cap_asc':
            sortedData.sort((a, b) => a.market_cap - b.market_cap);
            break;
          case 'price_change_24h_desc':
            sortedData.sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0));
            break;
          case 'price_change_24h_asc':
            sortedData.sort((a, b) => (a.price_change_percentage_24h || 0) - (b.price_change_percentage_24h || 0));
            break;
          case 'volume_desc':
            sortedData.sort((a, b) => b.total_volume - a.total_volume);
            break;
          case 'ath_change_desc':
            sortedData.sort((a, b) => (b.ath_change_percentage || -100) - (a.ath_change_percentage || -100));
            break;
          case 'ath_change_asc':
            sortedData.sort((a, b) => (a.ath_change_percentage || -100) - (b.ath_change_percentage || -100));
            break;
          default:
            sortedData.sort((a, b) => b.market_cap - a.market_cap);
        }
        setCoins(sortedData);
      } else {
        setError('Failed to load data');
      }
    } catch {
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
  }, [selectedIds, sortBy]);

  // Fetch technicals when coins are loaded
  useEffect(() => {
    if (coins.length > 0) {
      fetchTechnicals();
    }
  }, [coins]);

  const fetchTechnicals = async () => {
    setTechnicalsLoading(true);
    try {
      const requests = coins.map(async (coin) => {
        try {
          const res = await fetch(`/api/technical?coin=${encodeURIComponent(coin.id)}&timeframe=1d`);
          const json = await res.json();

          if (!res.ok || !json?.success || !json?.data) {
            return [coin.id, {
              rsi14: null,
              volatility30dPct: null,
              momentum30dPct: null,
              source: null,
              lastUpdate: null,
            }] as const;
          }

          const indicators = Array.isArray(json.data.indicators) ? json.data.indicators : [];
          const rsi = indicators.find((i: { shortName?: string; name?: string }) =>
            i?.shortName === 'RSI (14)' || i?.name === 'Relative Strength Index'
          )?.value;

          const metrics = json.data.metrics || {};

          return [coin.id, {
            rsi14: typeof rsi === 'number' ? rsi : null,
            volatility30dPct: typeof metrics.volatility30dPct === 'number' ? metrics.volatility30dPct : null,
            momentum30dPct: typeof metrics.momentum30dPct === 'number' ? metrics.momentum30dPct : null,
            source: typeof json.data?.meta?.source === 'string' ? json.data.meta.source : null,
            lastUpdate: typeof json.data?.meta?.lastUpdate === 'string' ? json.data.meta.lastUpdate : null,
          }] as const;
        } catch {
          return [coin.id, {
            rsi14: null,
            volatility30dPct: null,
            momentum30dPct: null,
            source: null,
            lastUpdate: null,
          }] as const;
        }
      });

      const results = await Promise.all(requests);
      const next = new Map<string, TechnicalMetrics>();
      for (const [coinId, data] of results) next.set(coinId, data);
      setTechnicals(next);
    } finally {
      setTechnicalsLoading(false);
    }
  };

  const toggleCoin = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 10) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const toggleColumn = (colId: string) => {
    setVisibleColumns(prev =>
      prev.includes(colId)
        ? prev.filter(c => c !== colId)
        : [...prev, colId]
    );
  };

  const selectAllInCategory = (cat: string) => {
    const catCoins = availableCoins.filter(c => c.category === cat).map(c => c.id);
    const newSelection = [...new Set([...selectedIds, ...catCoins])].slice(0, 10);
    setSelectedIds(newSelection);
  };

  const clearSelection = () => {
    setSelectedIds([]);
  };

  // Filter coins for display (uses dynamic availableCoins)
  const filteredCoins = availableCoins.filter(coin => {
    const matchesCategory = categoryFilter === 'all' || coin.category === categoryFilter;
    const matchesSearch = searchQuery === '' ||
      coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Format helpers
  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (price >= 0.0001) return `$${price.toFixed(6)}`;
    return `$${price.toExponential(2)}`;
  };

  const formatLargeNumber = (num: number | undefined) => {
    if (num === undefined || num === null) return 'Unavailable';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatSupply = (num: number | undefined) => {
    if (num === undefined || num === null) return 'Unavailable';
    if (num >= 1e12) return `${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const formatPercent = (pct: number | undefined) => {
    if (pct === undefined || pct === null) return 'Unavailable';
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  };

  const formatNullablePercent = (pct: number | null | undefined) => {
    if (pct === undefined || pct === null) return 'Unavailable';
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  };

  // Find best/worst for highlighting
  const getBestWorst = (field: keyof Coin) => {
    if (coins.length === 0) return { best: '', worst: '' };
    const values = coins.map(c => ({ id: c.id, val: Number(c[field]) || 0 }));
    values.sort((a, b) => b.val - a.val);
    return { best: values[0]?.id, worst: values[values.length - 1]?.id };
  };

  const priceChangeBW = getBestWorst('price_change_percentage_24h');
  const marketCapBW = getBestWorst('market_cap');
  const volumeBW = getBestWorst('total_volume');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Compare Cryptocurrencies</h1>
            <p className="text-gray-400">Compare up to 10 coins side-by-side with 50+ cryptocurrencies • Free, no login required</p>
          </div>
          <div className="flex gap-2 mt-4 md:mt-0">
            <TemplateDownloadButton
              pageContext={{
                pageId: 'compare',
                comparedCoins: selectedIds,
                visibleColumns,
                timeframe: '24h',
                currency: 'USD',
                customizations: {
                  sortBy,
                  categoryFilter,
                  includeCharts: true,
                },
              }}
              variant="outline"
              size="md"
            />
          </div>
        </div>

        {/* Feature Highlight */}
        <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/30 rounded-lg p-4 mb-6">
          <p className="text-emerald-400 text-sm flex items-start gap-2">
            <span>🚀</span>
            <span>
              <strong>Powerful comparison tools!</strong> Compare up to 10 coins side-by-side.
              Filter by category, 50+ coins, 7d/30d changes, ATH/ATL, FDV, and more!
            </span>
          </p>
        </div>

        {/* Filters Section */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center">
              🔍 Filter & Search
              <HelpIcon text="Filter coins by category, search by name/symbol, or select from the list below. You can compare up to 10 coins at once." />
            </h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="text-sm text-emerald-400 hover:text-emerald-300"
            >
              {showFilters ? '▼ Hide Advanced' : '▶ Show Advanced'}
            </button>
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search coins by name or symbol..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-2 mb-4">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  categoryFilter === cat.id
                    ? `${cat.color} text-white`
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {cat.label}
                <span className="ml-1 text-xs opacity-75">
                  ({cat.id === 'all' ? availableCoins.length : availableCoins.filter(c => c.category === cat.id).length})
                </span>
              </button>
            ))}
          </div>

          {/* Advanced Filters */}
          {showFilters && (
            <div className="border-t border-gray-700 pt-4 mt-4 space-y-4">
              {/* Sort By */}
              <div>
                <label htmlFor="sort-select" className="block text-sm font-medium text-gray-400 mb-2">Sort Results By</label>
                <select
                  id="sort-select"
                  title="Sort Results By"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full md:w-64 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:border-emerald-500 focus:outline-none"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Column Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Visible Columns</label>
                <div className="flex flex-wrap gap-2">
                  {COLUMN_OPTIONS.map((col) => (
                    <button
                      key={col.id}
                      onClick={() => toggleColumn(col.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        visibleColumns.includes(col.id)
                          ? 'bg-emerald-600 text-white'
                          : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {col.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Quick Actions</label>
                <div className="flex flex-wrap gap-2">
                  {categoryFilter !== 'all' && (
                    <button
                      onClick={() => selectAllInCategory(categoryFilter)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-xs font-medium text-white"
                    >
                      Select All {CATEGORIES.find(c => c.id === categoryFilter)?.label}
                    </button>
                  )}
                  <button
                    onClick={clearSelection}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-xs font-medium text-white"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Coin Selection */}
        <div className="bg-gray-800 rounded-xl p-6 mb-6 border border-gray-700 shadow-sm">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
            Select Coins to Compare ({selectedIds.length}/10)
            <HelpIcon text="Click on any coin to add or remove it from comparison. Selected coins appear with a green border. Maximum 10 coins." />
          </h2>
          <div className="flex flex-wrap gap-2 max-h-[300px] overflow-y-auto pr-2">
            {filteredCoins.map((coin) => {
              const isSelected = selectedIds.includes(coin.id);
              const catColor = CATEGORIES.find(c => c.id === coin.category)?.color || 'bg-gray-600';
              return (
                <button
                  key={coin.id}
                  onClick={() => toggleCoin(coin.id)}
                  disabled={!isSelected && selectedIds.length >= 10}
                  className={`px-3 py-2 rounded-lg border-2 transition-all text-sm ${
                    isSelected
                      ? 'bg-emerald-600 border-emerald-400 text-white shadow-lg'
                      : selectedIds.length >= 10
                        ? 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  <span className="font-medium">{coin.symbol}</span>
                  <span className="text-xs opacity-75 ml-1">({coin.name})</span>
                  <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${catColor} opacity-75`}>
                    {coin.category}
                  </span>
                </button>
              );
            })}
          </div>
          {filteredCoins.length === 0 && (
            <p className="text-gray-400 text-center py-4">No coins match your search/filter criteria</p>
          )}
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-4 mb-6 text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        )}

        {/* Column Guide */}
        {!loading && coins.length > 0 && (
          <div className="bg-gray-800 rounded-lg p-4 mb-4 border border-gray-700">
            <p className="text-gray-300 text-sm mb-2 font-medium">📊 Column Guide:</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
              {visibleColumns.includes('price') && <span className="text-gray-400"><span className="text-emerald-400 font-medium">Price:</span> Current USD</span>}
              {visibleColumns.includes('change_24h') && <span className="text-gray-400"><span className="text-emerald-400 font-medium">24h:</span> Day change</span>}
              {visibleColumns.includes('change_7d') && <span className="text-gray-400"><span className="text-emerald-400 font-medium">7d:</span> Week change</span>}
              {visibleColumns.includes('change_30d') && <span className="text-gray-400"><span className="text-emerald-400 font-medium">30d:</span> Month change</span>}
              {visibleColumns.includes('market_cap') && <span className="text-gray-400"><span className="text-emerald-400 font-medium">MCap:</span> Market cap</span>}
              {visibleColumns.includes('fdv') && <span className="text-gray-400"><span className="text-emerald-400 font-medium">FDV:</span> Fully diluted value</span>}
              {visibleColumns.includes('volume') && <span className="text-gray-400"><span className="text-emerald-400 font-medium">Vol:</span> 24h volume</span>}
              {visibleColumns.includes('ath') && <span className="text-gray-400"><span className="text-emerald-400 font-medium">ATH:</span> All-time high</span>}
              {visibleColumns.includes('from_ath') && <span className="text-gray-400"><span className="text-emerald-400 font-medium">%ATH:</span> Distance from peak</span>}
              {visibleColumns.includes('atl') && <span className="text-gray-400"><span className="text-emerald-400 font-medium">ATL:</span> All-time low</span>}
              {visibleColumns.includes('from_atl') && <span className="text-gray-400"><span className="text-emerald-400 font-medium">%ATL:</span> Gain from bottom</span>}
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {!loading && coins.length > 0 && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-gray-900">
                  <tr className="bg-gray-900 border-b border-gray-700">
                    <th className="px-4 py-3 text-left text-emerald-400 font-medium sticky left-0 bg-gray-900">#</th>
                    <th className="px-4 py-3 text-left text-emerald-400 font-medium">Coin</th>
                    {visibleColumns.includes('price') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Price</th>}
                    {visibleColumns.includes('change_24h') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">24h</th>}
                    {visibleColumns.includes('change_7d') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">7d</th>}
                    {visibleColumns.includes('change_30d') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">30d</th>}
                    {visibleColumns.includes('change_1y') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">1Y</th>}
                    {visibleColumns.includes('market_cap') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Market Cap</th>}
                    {visibleColumns.includes('fdv') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">FDV</th>}
                    {visibleColumns.includes('volume') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Volume 24h</th>}
                    {visibleColumns.includes('vol_mcap_ratio') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Vol/MCap</th>}
                    {visibleColumns.includes('circulating') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Circulating</th>}
                    {visibleColumns.includes('max_supply') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Max Supply</th>}
                    {visibleColumns.includes('supply_ratio') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Circ/Max</th>}
                    {visibleColumns.includes('ath') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">ATH</th>}
                    {visibleColumns.includes('from_ath') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">From ATH</th>}
                    {visibleColumns.includes('atl') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">ATL</th>}
                    {visibleColumns.includes('from_atl') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">From ATL</th>}
                    {visibleColumns.includes('high_24h') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">24h High</th>}
                    {visibleColumns.includes('low_24h') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">24h Low</th>}
                    {visibleColumns.includes('price_range_24h') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">24h Range</th>}
                    {visibleColumns.includes('rsi') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">RSI</th>}
                    {visibleColumns.includes('volatility') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Vol (30d)</th>}
                    {visibleColumns.includes('momentum') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Mom (30d)</th>}
                    {visibleColumns.includes('dominance') && <th className="px-4 py-3 text-right text-emerald-400 font-medium">Dominance</th>}
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin, index) => (
                    <tr
                      key={coin.id}
                      className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors group"
                    >
                      <td className="px-4 py-3 text-gray-400 sticky left-0 bg-gray-800 group-hover:bg-gray-700/50">{index + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                          <div>
                            <span className="font-medium text-white group-hover:text-emerald-400 transition-colors">{coin.name}</span>
                            <span className="text-gray-400 ml-2 uppercase text-xs">{coin.symbol}</span>
                          </div>
                        </div>
                      </td>
                      {visibleColumns.includes('price') && (
                        <td className="px-4 py-3 text-right font-medium text-white">{formatPrice(coin.current_price)}</td>
                      )}
                      {visibleColumns.includes('change_24h') && (
                        <td className={`px-4 py-3 text-right font-medium ${
                          coin.id === priceChangeBW.best ? 'text-green-400 bg-green-400/10' :
                          coin.id === priceChangeBW.worst && coins.length > 2 ? 'text-red-400 bg-red-400/10' :
                          (coin.price_change_percentage_24h || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercent(coin.price_change_percentage_24h)}
                          {coin.id === priceChangeBW.best && <span className="ml-1">🏆</span>}
                        </td>
                      )}
                      {visibleColumns.includes('change_7d') && (
                        <td className={`px-4 py-3 text-right font-medium ${
                          (coin.price_change_percentage_7d_in_currency || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercent(coin.price_change_percentage_7d_in_currency)}
                        </td>
                      )}
                      {visibleColumns.includes('change_30d') && (
                        <td className={`px-4 py-3 text-right font-medium ${
                          (coin.price_change_percentage_30d_in_currency || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercent(coin.price_change_percentage_30d_in_currency)}
                        </td>
                      )}
                      {visibleColumns.includes('change_1y') && (
                        <td className={`px-4 py-3 text-right font-medium ${
                          (coin.price_change_percentage_1y_in_currency || 0) >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {formatPercent(coin.price_change_percentage_1y_in_currency)}
                        </td>
                      )}
                      {visibleColumns.includes('market_cap') && (
                        <td className={`px-4 py-3 text-right ${
                          coin.id === marketCapBW.best ? 'text-blue-400 font-medium' : 'text-gray-300'
                        }`}>
                          {formatLargeNumber(coin.market_cap)}
                          {coin.id === marketCapBW.best && <span className="ml-1">👑</span>}
                        </td>
                      )}
                      {visibleColumns.includes('fdv') && (
                        <td className="px-4 py-3 text-right text-gray-300">{formatLargeNumber(coin.fully_diluted_valuation)}</td>
                      )}
                      {visibleColumns.includes('volume') && (
                        <td className={`px-4 py-3 text-right ${
                          coin.id === volumeBW.best ? 'text-purple-400 font-medium' : 'text-gray-300'
                        }`}>
                          {formatLargeNumber(coin.total_volume)}
                          {coin.id === volumeBW.best && <span className="ml-1">🔥</span>}
                        </td>
                      )}
                      {visibleColumns.includes('vol_mcap_ratio') && (
                        <td className="px-4 py-3 text-right text-gray-300">
                          {coin.market_cap > 0 && coin.total_volume >= 0
                            ? `${(coin.total_volume / coin.market_cap).toFixed(3)}`
                            : 'Unavailable'
                          }
                        </td>
                      )}
                      {visibleColumns.includes('circulating') && (
                        <td className="px-4 py-3 text-right text-gray-300">{formatSupply(coin.circulating_supply)}</td>
                      )}
                      {visibleColumns.includes('max_supply') && (
                        <td className="px-4 py-3 text-right text-gray-300">
                          {typeof coin.max_supply === 'number' ? formatSupply(coin.max_supply) : 'Unavailable'}
                        </td>
                      )}
                      {visibleColumns.includes('supply_ratio') && (
                        <td className="px-4 py-3 text-right text-gray-300">
                          {typeof coin.max_supply === 'number' && coin.max_supply > 0
                            ? `${((coin.circulating_supply / coin.max_supply) * 100).toFixed(1)}%`
                            : 'Unavailable'
                          }
                        </td>
                      )}
                      {visibleColumns.includes('ath') && (
                        <td className="px-4 py-3 text-right text-gray-300">{formatPrice(coin.ath)}</td>
                      )}
                      {visibleColumns.includes('from_ath') && (
                        <td className={`px-4 py-3 text-right ${
                          (coin.ath_change_percentage || -100) >= -10 ? 'text-green-400' :
                          (coin.ath_change_percentage || -100) >= -50 ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {formatPercent(coin.ath_change_percentage)}
                        </td>
                      )}
                      {visibleColumns.includes('atl') && (
                        <td className="px-4 py-3 text-right text-gray-300">{formatPrice(coin.atl)}</td>
                      )}
                      {visibleColumns.includes('from_atl') && (
                        <td className="px-4 py-3 text-right text-green-400">
                          {formatPercent(coin.atl_change_percentage)}
                        </td>
                      )}
                      {visibleColumns.includes('high_24h') && (
                        <td className="px-4 py-3 text-right text-gray-300">
                          {typeof coin.high_24h === 'number' ? formatPrice(coin.high_24h) : 'Unavailable'}
                        </td>
                      )}
                      {visibleColumns.includes('low_24h') && (
                        <td className="px-4 py-3 text-right text-gray-300">
                          {typeof coin.low_24h === 'number' ? formatPrice(coin.low_24h) : 'Unavailable'}
                        </td>
                      )}
                      {visibleColumns.includes('price_range_24h') && (
                        <td className="px-4 py-3 text-right text-gray-300">
                          {typeof coin.high_24h === 'number' && typeof coin.low_24h === 'number' && coin.low_24h > 0
                            ? formatNullablePercent(((coin.high_24h - coin.low_24h) / coin.low_24h) * 100)
                            : 'Unavailable'
                          }
                        </td>
                      )}
                      {visibleColumns.includes('rsi') && (
                        <td className="px-4 py-3 text-right text-gray-300">
                          {technicalsLoading ? 'Loading…' : (technicals.get(coin.id)?.rsi14 ?? null) ?? 'Unavailable'}
                        </td>
                      )}
                      {visibleColumns.includes('volatility') && (
                        <td className="px-4 py-3 text-right text-gray-300">
                          {technicalsLoading ? 'Loading…' : formatNullablePercent(technicals.get(coin.id)?.volatility30dPct)}
                        </td>
                      )}
                      {visibleColumns.includes('momentum') && (
                        <td className="px-4 py-3 text-right text-gray-300">
                          {technicalsLoading ? 'Loading…' : formatNullablePercent(technicals.get(coin.id)?.momentum30dPct)}
                        </td>
                      )}
                      {visibleColumns.includes('dominance') && (
                        <td className="px-4 py-3 text-right text-gray-300">Unavailable</td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* No Selection */}
        {!loading && coins.length === 0 && selectedIds.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-6xl mb-4">📊</p>
            <p className="text-xl">Select coins above to compare them</p>
            <p className="text-sm mt-2">You can compare up to 10 coins side-by-side</p>
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-gray-800 rounded-lg p-4 border border-gray-700">
          <h3 className="font-medium text-white mb-3">Understanding the Data:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm text-gray-400">
            <div><span className="text-green-400">🏆 Trophy</span> = Best 24h performer</div>
            <div><span className="text-blue-400">👑 Crown</span> = Highest market cap</div>
            <div><span className="text-purple-400">🔥 Fire</span> = Highest volume</div>
            <div><span className="text-green-400">Green %</span> = Positive change</div>
            <div><span className="text-red-400">Red %</span> = Negative change</div>
            <div><span className="text-yellow-400">Yellow %</span> = Within 50% of ATH</div>
            <div><span className="text-gray-300">∞</span> = No max supply (inflationary)</div>
            <div><span className="text-gray-300">FDV</span> = Price × Max Supply</div>
            <div><span className="text-gray-300">ATH/ATL</span> = All-Time High/Low</div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-400 text-sm">
          <p className="mb-2">
            <a
              href="https://www.coingecko.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:text-emerald-300 underline font-medium"
            >
              Powered by CoinGecko
            </a>
            {' '}• Updates frequently • 50+ coins available
          </p>
          <p>
            Want historical charts, alerts, and advanced analytics? <Link href="/pricing" className="text-emerald-400 hover:underline">View pricing</Link> for upcoming Pro features!
          </p>
        </div>
      </div>
    </div>
  );
}
