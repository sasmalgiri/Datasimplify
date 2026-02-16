'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
  Treemap,
  AreaChart,
  Area,
  ZAxis,
  Sankey,
  FunnelChart,
  Funnel,
  LabelList,
  RadialBarChart,
  RadialBar,
  ComposedChart,
} from 'recharts';
import { RefreshCw, Table2, BarChart3, PieChartIcon, TrendingUp, TrendingDown, LayoutDashboard, Activity, Filter, SortAsc, SortDesc, ChevronDown, X, Target, ScatterChart as ScatterIcon, Grid3X3, Layers, Flame, MoreHorizontal, GitBranch, Triangle, CircleDot, Combine, Users } from 'lucide-react';

interface CoinData {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume: number;
}

interface DataPreviewProps {
  selectedCoins: string[];
  timeframe: string;
  onDataLoad?: (data: CoinData[]) => void;
  defaultViewMode?: ViewMode;
}

// Holder distribution data from GeckoTerminal API
interface HolderDistributionData {
  name: string | null;
  symbol: string | null;
  holders: number | null;
  distribution: {
    top_10_percentage: number | null;
    top_25_percentage: number | null;
    top_50_percentage: number | null;
    rest_percentage: number | null;
  };
  scores: {
    total_score: number | null;
    pool_score: number | null;
    transaction_score: number | null;
    holders_score: number | null;
  };
}

// Token contract address mapping for GeckoTerminal API
// Format: symbol -> { network, address }
const TOKEN_CONTRACT_MAP: Record<string, { network: string; address: string }> = {
  // Ethereum ERC20 tokens
  'ETH': { network: 'eth', address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' }, // WETH
  'USDT': { network: 'eth', address: '0xdac17f958d2ee523a2206206994597c13d831ec7' },
  'USDC': { network: 'eth', address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' },
  'LINK': { network: 'eth', address: '0x514910771af9ca656af840dff83e8264ecf986ca' },
  'UNI': { network: 'eth', address: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984' },
  'AAVE': { network: 'eth', address: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' },
  'MKR': { network: 'eth', address: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2' },
  'COMP': { network: 'eth', address: '0xc00e94cb662c3520282e6f5717214004a7f26888' },
  'SHIB': { network: 'eth', address: '0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce' },
  'MATIC': { network: 'eth', address: '0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0' },
  'LDO': { network: 'eth', address: '0x5a98fcbea516cf06857215779fd812ca3bef1b32' },
  'APE': { network: 'eth', address: '0x4d224452801aced8b2f0aebe155379bb5d594381' },
  'CRV': { network: 'eth', address: '0xd533a949740bb3306d119cc777fa900ba034cd52' },
  'SNX': { network: 'eth', address: '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f' },
  'PEPE': { network: 'eth', address: '0x6982508145454ce325ddbe47a25d4ec3d2311933' },
  // BNB Chain tokens
  'BNB': { network: 'bsc', address: '0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c' }, // WBNB
  'CAKE': { network: 'bsc', address: '0x0e09fabb73bd3ade0a17ecc321fd13a19e81ce82' },
  // Polygon tokens
  'POL': { network: 'polygon', address: '0x0000000000000000000000000000000000001010' },
  // Solana tokens (using symbol as fallback - actual fetching may need SPL addresses)
  'SOL': { network: 'solana', address: 'So11111111111111111111111111111111111111112' }, // WSOL
};

// Chart colors matching CryptoReportKit dark theme
const CHART_COLORS = [
  '#10B981', // Emerald
  '#3B82F6', // Blue
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#6366F1', // Indigo
];

type ViewMode = 'table' | 'bar' | 'pie' | 'line' | 'volume' | 'dashboard' | 'radar' | 'scatter' | 'treemap' | 'area' | 'bubble' | 'heatmap' | 'sankey' | 'funnel' | 'radialbar' | 'composed' | 'distribution';
type SortField = 'symbol' | 'price' | 'change24h' | 'marketCap' | 'volume';
type SortOrder = 'asc' | 'desc';
type ChangeFilter = 'all' | 'gainers' | 'losers';

export function DataPreview({ selectedCoins, timeframe, onDataLoad, defaultViewMode = 'table' }: DataPreviewProps) {
  const [data, setData] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(defaultViewMode);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter and sort state
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [showTopN, setShowTopN] = useState<number>(0); // 0 means show all

  // Distribution chart state
  const [distributionCoin, setDistributionCoin] = useState<string>(selectedCoins[0] || 'BTC');
  const [holderData, setHolderData] = useState<HolderDistributionData | null>(null);
  const [holderLoading, setHolderLoading] = useState(false);
  const [holderError, setHolderError] = useState<string | null>(null);

  const fetchPreviewData = useCallback(async () => {
    if (selectedCoins.length === 0) {
      setData([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Fetch data from our API (which gets data from BYOK-compatible sources)
      const response = await fetch(`/api/crypto?ids=${selectedCoins.join(',')}&limit=${selectedCoins.length}`);

      if (!response.ok) {
        throw new Error('Failed to fetch preview data');
      }

      const result = await response.json();

      // Transform API response to our format
      const transformedData: CoinData[] = (result.data || result || [])
        .filter((coin: { symbol?: string }) =>
          selectedCoins.includes(coin.symbol?.toUpperCase() || '')
        )
        .map((coin: {
          symbol?: string;
          name?: string;
          current_price?: number;
          price_change_percentage_24h?: number;
          market_cap?: number;
          total_volume?: number;
        }) => ({
          symbol: coin.symbol?.toUpperCase() || '',
          name: coin.name || coin.symbol || '',
          price: coin.current_price || 0,
          change24h: coin.price_change_percentage_24h || 0,
          marketCap: coin.market_cap || 0,
          volume: coin.total_volume || 0,
        }));

      // Sort by selected coins order
      const sortedData = selectedCoins
        .map(symbol => transformedData.find(d => d.symbol === symbol))
        .filter((d): d is CoinData => d !== undefined);

      setData(sortedData);
      setLastUpdated(new Date());
      onDataLoad?.(sortedData);
    } catch (err) {
      console.error('Preview data fetch error:', err);
      setError('Unable to load preview. Data will be available in Excel via BYOK (your own API key).');

      // Show placeholder data so users can see the format
      const placeholderData: CoinData[] = selectedCoins.slice(0, 10).map((symbol, i) => ({
        symbol,
        name: symbol,
        price: 0,
        change24h: 0,
        marketCap: 0,
        volume: 0,
      }));
      setData(placeholderData);
    } finally {
      setLoading(false);
    }
  }, [selectedCoins, onDataLoad]);

  useEffect(() => {
    fetchPreviewData();
  }, [fetchPreviewData]);

  // Fetch holder distribution data for the selected token
  const fetchHolderData = useCallback(async (symbol: string) => {
    const tokenInfo = TOKEN_CONTRACT_MAP[symbol.toUpperCase()];

    // If no contract address mapping, we can't fetch holder data
    if (!tokenInfo) {
      setHolderData(null);
      setHolderError('Holder data not available for this coin (no contract address)');
      return;
    }

    setHolderLoading(true);
    setHolderError(null);

    try {
      const response = await fetch(
        `/api/v1/holders?network=${tokenInfo.network}&address=${tokenInfo.address}`
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to fetch holder data');
      }

      const result = await response.json();
      setHolderData(result);
    } catch (err) {
      console.error('Holder data fetch error:', err);
      setHolderError(err instanceof Error ? err.message : 'Failed to load holder data');
      setHolderData(null);
    } finally {
      setHolderLoading(false);
    }
  }, []);

  // Fetch holder data when distribution coin changes
  useEffect(() => {
    if (viewMode === 'distribution' && distributionCoin) {
      fetchHolderData(distributionCoin);
    }
  }, [distributionCoin, viewMode, fetchHolderData]);

  const formatPrice = (price: number) => {
    if (price === 0) return '—';
    if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
    if (price >= 1) return `$${price.toFixed(2)}`;
    return `$${price.toFixed(6)}`;
  };

  const formatMarketCap = (cap: number) => {
    if (cap === 0) return '—';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(2)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(2)}M`;
    return `$${cap.toLocaleString()}`;
  };

  const formatChange = (change: number) => {
    if (change === 0) return '—';
    const formatted = change.toFixed(2);
    return change >= 0 ? `+${formatted}%` : `${formatted}%`;
  };

  // Filter and sort the data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply change filter
    if (changeFilter === 'gainers') {
      result = result.filter(coin => coin.change24h > 0);
    } else if (changeFilter === 'losers') {
      result = result.filter(coin => coin.change24h < 0);
    }

    // Apply price range filter
    const minP = parseFloat(minPrice);
    const maxP = parseFloat(maxPrice);
    if (!isNaN(minP) && minP > 0) {
      result = result.filter(coin => coin.price >= minP);
    }
    if (!isNaN(maxP) && maxP > 0) {
      result = result.filter(coin => coin.price <= maxP);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: number, bVal: number;
      switch (sortField) {
        case 'symbol':
          return sortOrder === 'asc'
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        case 'price':
          aVal = a.price; bVal = b.price;
          break;
        case 'change24h':
          aVal = a.change24h; bVal = b.change24h;
          break;
        case 'marketCap':
          aVal = a.marketCap; bVal = b.marketCap;
          break;
        case 'volume':
          aVal = a.volume; bVal = b.volume;
          break;
        default:
          aVal = a.marketCap; bVal = b.marketCap;
      }
      return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
    });

    // Apply top N limit
    if (showTopN > 0 && showTopN < result.length) {
      result = result.slice(0, showTopN);
    }

    return result;
  }, [data, sortField, sortOrder, changeFilter, minPrice, maxPrice, showTopN]);

  // Reset filters
  const resetFilters = () => {
    setSortField('marketCap');
    setSortOrder('desc');
    setChangeFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setShowTopN(0);
  };

  // Check if any filters are active
  const hasActiveFilters = sortField !== 'marketCap' || sortOrder !== 'desc' || changeFilter !== 'all' || minPrice || maxPrice || showTopN > 0;

  // Filter Panel Component
  const FilterPanel = () => (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white flex items-center gap-2">
          <Filter className="w-4 h-4" />
          Filters & Sorting
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Reset
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Sort By */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Sort By</label>
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as SortField)}
            aria-label="Sort by field"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="marketCap">Market Cap</option>
            <option value="price">Price</option>
            <option value="change24h">24h Change</option>
            <option value="volume">Volume</option>
            <option value="symbol">Name (A-Z)</option>
          </select>
        </div>

        {/* Sort Order */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Order</label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSortOrder('desc')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition ${
                sortOrder === 'desc'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <SortDesc className="w-4 h-4" />
              High→Low
            </button>
            <button
              type="button"
              onClick={() => setSortOrder('asc')}
              className={`flex-1 px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition ${
                sortOrder === 'asc'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              <SortAsc className="w-4 h-4" />
              Low→High
            </button>
          </div>
        </div>

        {/* Change Filter */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Show</label>
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setChangeFilter('all')}
              className={`flex-1 px-2 py-2 rounded-lg text-xs transition ${
                changeFilter === 'all'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setChangeFilter('gainers')}
              className={`flex-1 px-2 py-2 rounded-lg text-xs transition ${
                changeFilter === 'gainers'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              📈 Gainers
            </button>
            <button
              type="button"
              onClick={() => setChangeFilter('losers')}
              className={`flex-1 px-2 py-2 rounded-lg text-xs transition ${
                changeFilter === 'losers'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              📉 Losers
            </button>
          </div>
        </div>

        {/* Top N */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Limit Results</label>
          <select
            value={showTopN}
            onChange={(e) => setShowTopN(Number(e.target.value))}
            aria-label="Limit number of results"
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            <option value={0}>Show All</option>
            <option value={3}>Top 3</option>
            <option value={5}>Top 5</option>
            <option value={10}>Top 10</option>
            <option value={20}>Top 20</option>
          </select>
        </div>
      </div>

      {/* Price Range */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <label className="block text-xs text-gray-400 mb-2">Price Range (USD)</label>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
          <span className="text-gray-500">to</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex flex-wrap gap-2">
            {sortField !== 'marketCap' && (
              <span className="px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded text-xs">
                Sorted by {sortField}
              </span>
            )}
            {changeFilter !== 'all' && (
              <span className={`px-2 py-1 rounded text-xs ${
                changeFilter === 'gainers' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'
              }`}>
                {changeFilter === 'gainers' ? 'Gainers only' : 'Losers only'}
              </span>
            )}
            {(minPrice || maxPrice) && (
              <span className="px-2 py-1 bg-blue-600/20 text-blue-400 rounded text-xs">
                Price: ${minPrice || '0'} - ${maxPrice || '∞'}
              </span>
            )}
            {showTopN > 0 && (
              <span className="px-2 py-1 bg-purple-600/20 text-purple-400 rounded text-xs">
                Top {showTopN}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Showing {filteredData.length} of {data.length} coins
          </p>
        </div>
      )}
    </div>
  );

  // Table View
  const TableView = () => (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="select-none">
          <tr className="border-b border-gray-700">
            <th className="text-left py-3 px-4 text-gray-400 font-medium">Coin</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Price</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">24h Change</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Market Cap</th>
            <th className="text-right py-3 px-4 text-gray-400 font-medium">Volume (24h)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((coin, index) => (
            <tr key={coin.symbol} className="border-b border-gray-800 hover:bg-gray-800/50">
              <td className="py-3 px-4">
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                  >
                    {coin.symbol.charAt(0)}
                  </span>
                  <span className="text-white font-medium">{coin.symbol}</span>
                  <span className="text-gray-500 text-xs">{coin.name}</span>
                </div>
              </td>
              <td className="text-right py-3 px-4 text-white font-mono">
                {formatPrice(coin.price)}
              </td>
              <td className={`text-right py-3 px-4 font-mono ${
                coin.change24h > 0 ? 'text-emerald-400' : coin.change24h < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                <span className="flex items-center justify-end gap-1">
                  {coin.change24h > 0 ? <TrendingUp className="w-3 h-3" /> : coin.change24h < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                  {formatChange(coin.change24h)}
                </span>
              </td>
              <td className="text-right py-3 px-4 text-gray-300 font-mono">
                {formatMarketCap(coin.marketCap)}
              </td>
              <td className="text-right py-3 px-4 text-gray-300 font-mono">
                {formatMarketCap(coin.volume)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  // Bar Chart View - Price Comparison
  const BarChartView = () => {
    const chartData = filteredData.map((coin, i) => ({
      name: coin.symbol,
      price: coin.price,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(value) => formatPrice(value)}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value) => [formatPrice(Number(value) || 0), 'Price']}
            />
            <Bar dataKey="price" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="name" position="top" fill="#FFFFFF" fontSize={10} />
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Pie Chart View - Market Cap Distribution
  const PieChartView = () => {
    const chartData = filteredData.map((coin, i) => ({
      name: coin.symbol,
      value: coin.marketCap,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    const totalMarketCap = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
              labelLine={{ stroke: '#6B7280' }}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value) => [formatMarketCap(Number(value) || 0), 'Market Cap']}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-white">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center text-sm text-gray-400 mt-2">
          Total: {formatMarketCap(totalMarketCap)}
        </div>
      </div>
    );
  };

  // Line Chart View - 24h Change Comparison
  const LineChartView = () => {
    const chartData = filteredData.map((coin, i) => ({
      name: coin.symbol,
      change: coin.change24h,
      fill: coin.change24h >= 0 ? '#10B981' : '#EF4444',
    }));

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(value) => `${value.toFixed(1)}%`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value) => [`${(Number(value) || 0).toFixed(2)}%`, '24h Change']}
            />
            {/* Reference line at 0 */}
            <CartesianGrid horizontal={false} />
            <Bar dataKey="change" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="change" position="top" fill="#FFFFFF" fontSize={10} formatter={(v) => { const num = Number(v) || 0; return `${num >= 0 ? '+' : ''}${num.toFixed(1)}%`; }} />
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Volume Chart View - Trading Volume Comparison
  const VolumeChartView = () => {
    const chartData = filteredData.map((coin, i) => ({
      name: coin.symbol,
      volume: coin.volume,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              tickFormatter={(value) => formatMarketCap(value)}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value) => [formatMarketCap(Number(value) || 0), '24h Volume']}
            />
            <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
              <LabelList dataKey="name" position="top" fill="#FFFFFF" fontSize={10} />
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Dashboard View - All Charts Together
  const DashboardView = () => {
    const priceData = filteredData.map((coin, i) => ({
      name: coin.symbol,
      price: coin.price,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    const marketCapData = filteredData.map((coin, i) => ({
      name: coin.symbol,
      value: coin.marketCap,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    const changeData = filteredData.map((coin) => ({
      name: coin.symbol,
      change: coin.change24h,
      fill: coin.change24h >= 0 ? '#10B981' : '#EF4444',
    }));

    const volumeData = filteredData.map((coin, i) => ({
      name: coin.symbol,
      volume: coin.volume,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {filteredData.slice(0, 4).map((coin, i) => (
            <div key={coin.symbol} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                >
                  {coin.symbol.charAt(0)}
                </span>
                <span className="text-white font-medium">{coin.symbol}</span>
              </div>
              <div className="text-xl font-bold text-white">{formatPrice(coin.price)}</div>
              <div className={`text-sm flex items-center gap-1 ${
                coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {coin.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {formatChange(coin.change24h)}
              </div>
            </div>
          ))}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Price Chart */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Price Comparison</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={priceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#FFFFFF' }}
                    itemStyle={{ color: '#FFFFFF' }}
                    formatter={(value) => [formatPrice(Number(value) || 0), 'Price']}
                  />
                  <Bar dataKey="price" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="name" position="top" fill="#FFFFFF" fontSize={8} />
                    {priceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Market Cap Pie */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">Market Cap Distribution</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={marketCapData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {marketCapData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#FFFFFF' }}
                    itemStyle={{ color: '#FFFFFF' }}
                    formatter={(value) => [formatMarketCap(Number(value) || 0), 'Market Cap']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} formatter={(value) => <span style={{ color: '#FFFFFF' }}>{value}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 24h Change */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">24h Price Change</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={changeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(v) => `${v.toFixed(0)}%`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#FFFFFF' }}
                    itemStyle={{ color: '#FFFFFF' }}
                    formatter={(value) => [`${(Number(value) || 0).toFixed(2)}%`, '24h Change']}
                  />
                  <Bar dataKey="change" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="change" position="top" fill="#FFFFFF" fontSize={8} formatter={(v) => { const num = Number(v) || 0; return `${num >= 0 ? '+' : ''}${num.toFixed(0)}%`; }} />
                    {changeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Volume */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h3 className="text-sm font-medium text-gray-400 mb-3">24h Trading Volume</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} />
                  <YAxis tick={{ fill: '#9CA3AF', fontSize: 10 }} tickFormatter={(v) => `$${(v/1e9).toFixed(0)}B`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#FFFFFF' }}
                    itemStyle={{ color: '#FFFFFF' }}
                    formatter={(value) => [formatMarketCap(Number(value) || 0), 'Volume']}
                  />
                  <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="name" position="top" fill="#FFFFFF" fontSize={8} />
                    {volumeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-gray-400 mb-3">Complete Data Table</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Coin</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Price</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">24h</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Market Cap</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Volume</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((coin, index) => (
                  <tr key={coin.symbol} className="border-b border-gray-700/50">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                          style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                        >
                          {coin.symbol.charAt(0)}
                        </span>
                        <span className="text-white font-medium">{coin.symbol}</span>
                      </div>
                    </td>
                    <td className="text-right py-2 px-3 text-white font-mono text-xs">{formatPrice(coin.price)}</td>
                    <td className={`text-right py-2 px-3 font-mono text-xs ${
                      coin.change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}>{formatChange(coin.change24h)}</td>
                    <td className="text-right py-2 px-3 text-gray-300 font-mono text-xs">{formatMarketCap(coin.marketCap)}</td>
                    <td className="text-right py-2 px-3 text-gray-300 font-mono text-xs">{formatMarketCap(coin.volume)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // Radar Chart View - Multi-metric comparison
  const RadarChartView = () => {
    // Normalize data for radar chart (0-100 scale)
    const maxPrice = Math.max(...filteredData.map(c => c.price));
    const maxMarketCap = Math.max(...filteredData.map(c => c.marketCap));
    const maxVolume = Math.max(...filteredData.map(c => c.volume));
    const maxChange = Math.max(...filteredData.map(c => Math.abs(c.change24h)));

    const radarData = [
      { metric: 'Price', fullMark: 100, ...Object.fromEntries(filteredData.map(c => [c.symbol, maxPrice > 0 ? (c.price / maxPrice) * 100 : 0])) },
      { metric: 'Market Cap', fullMark: 100, ...Object.fromEntries(filteredData.map(c => [c.symbol, maxMarketCap > 0 ? (c.marketCap / maxMarketCap) * 100 : 0])) },
      { metric: 'Volume', fullMark: 100, ...Object.fromEntries(filteredData.map(c => [c.symbol, maxVolume > 0 ? (c.volume / maxVolume) * 100 : 0])) },
      { metric: '24h Change', fullMark: 100, ...Object.fromEntries(filteredData.map(c => [c.symbol, maxChange > 0 ? (Math.abs(c.change24h) / maxChange) * 100 : 0])) },
      { metric: 'Vol/MCap Ratio', fullMark: 100, ...Object.fromEntries(filteredData.map(c => [c.symbol, c.marketCap > 0 ? Math.min((c.volume / c.marketCap) * 1000, 100) : 0])) },
    ];

    return (
      <div className="h-96">
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400">Normalized comparison (0-100 scale)</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#6B7280', fontSize: 10 }} />
            {filteredData.slice(0, 6).map((coin, i) => (
              <Radar
                key={coin.symbol}
                name={coin.symbol}
                dataKey={coin.symbol}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                fill={CHART_COLORS[i % CHART_COLORS.length]}
                fillOpacity={0.2}
              />
            ))}
            <Legend wrapperStyle={{ paddingTop: '20px' }} formatter={(value) => <span style={{ color: '#FFFFFF' }}>{value}</span>} />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value) => [`${(Number(value) || 0).toFixed(1)}%`, '']}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Scatter Plot View - Price vs Volume correlation
  const ScatterPlotView = () => {
    const scatterData = filteredData.map((coin, i) => ({
      name: coin.symbol,
      x: coin.marketCap / 1e9, // Market cap in billions
      y: coin.volume / 1e9, // Volume in billions
      z: Math.abs(coin.change24h), // Bubble size based on change
      change: coin.change24h,
      fill: coin.change24h >= 0 ? '#10B981' : '#EF4444',
    }));

    return (
      <div className="h-80">
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400">Market Cap vs 24h Volume (bubble size = volatility)</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="x"
              name="Market Cap"
              unit="B"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              label={{ value: 'Market Cap ($B)', position: 'bottom', fill: '#6B7280', fontSize: 11 }}
            />
            <YAxis
              dataKey="y"
              name="Volume"
              unit="B"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              label={{ value: 'Volume ($B)', angle: -90, position: 'left', fill: '#6B7280', fontSize: 11 }}
            />
            <ZAxis dataKey="z" range={[100, 1000]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value, name) => {
                const v = Number(value) || 0;
                if (name === 'Market Cap') return [`$${v.toFixed(2)}B`, name];
                if (name === 'Volume') return [`$${v.toFixed(2)}B`, name];
                return [v, name];
              }}
              labelFormatter={(label) => scatterData.find(d => d.x === label)?.name || ''}
            />
            <Scatter name="Coins" data={scatterData}>
              {scatterData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> Gainers</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500"></span> Losers</span>
        </div>
      </div>
    );
  };

  // Treemap View - Market Cap Dominance
  const TreemapView = () => {
    const totalMarketCap = filteredData.reduce((sum, c) => sum + c.marketCap, 0);
    const treemapData = filteredData.map((coin, i) => ({
      name: coin.symbol,
      size: coin.marketCap,
      percentage: totalMarketCap > 0 ? ((coin.marketCap / totalMarketCap) * 100).toFixed(1) : '0',
      fill: CHART_COLORS[i % CHART_COLORS.length],
      price: coin.price,
      change: coin.change24h,
    }));

    const CustomTreemapContent = (props: { x: number; y: number; width: number; height: number; name: string; percentage: string; fill: string }) => {
      const { x, y, width, height, name, percentage, fill } = props;
      if (width < 40 || height < 30) return null;

      return (
        <g>
          <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#1F2937" strokeWidth={2} rx={4} />
          <text x={x + width / 2} y={y + height / 2 - 6} textAnchor="middle" fill="#fff" fontSize={width > 80 ? 14 : 11} fontWeight="bold">
            {name}
          </text>
          <text x={x + width / 2} y={y + height / 2 + 10} textAnchor="middle" fill="#D1D5DB" fontSize={width > 80 ? 12 : 10}>
            {percentage}%
          </text>
        </g>
      );
    };

    return (
      <div className="h-80">
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400">Market Cap Dominance - Total: {formatMarketCap(totalMarketCap)}</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <Treemap
            data={treemapData}
            dataKey="size"
            aspectRatio={4 / 3}
            stroke="#1F2937"
            content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" percentage="" fill="" />}
          >
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value, _name, props) => {
                const item = (props as { payload?: { name?: string; percentage?: string; price?: number; change?: number } }).payload;
                const v = Number(value) || 0;
                return [
                  <div key="tooltip" className="text-sm text-white">
                    <div className="font-bold text-white">{item?.name}</div>
                    <div className="text-white">Market Cap: {formatMarketCap(v)}</div>
                    <div className="text-white">Share: {item?.percentage}%</div>
                    <div className="text-white">Price: {formatPrice(item?.price || 0)}</div>
                    <div className={item?.change && item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      24h: {formatChange(item?.change || 0)}
                    </div>
                  </div>,
                  ''
                ];
              }}
            />
          </Treemap>
        </ResponsiveContainer>
      </div>
    );
  };

  // Area Chart View - Cumulative Market Cap
  const AreaChartView = () => {
    // Sort by market cap for cumulative view
    const sortedByMarketCap = [...filteredData].sort((a, b) => b.marketCap - a.marketCap);
    let cumulative = 0;
    const areaData = sortedByMarketCap.map((coin, i) => {
      cumulative += coin.marketCap;
      return {
        name: coin.symbol,
        marketCap: coin.marketCap,
        cumulative: cumulative,
        volume: coin.volume,
        fill: CHART_COLORS[i % CHART_COLORS.length],
      };
    });

    return (
      <div className="h-80">
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400">Cumulative Market Cap Distribution</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={areaData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            <defs>
              <linearGradient id="colorMarketCap" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
              </linearGradient>
              <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              tickFormatter={(v) => formatMarketCap(v)}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value, name) => [formatMarketCap(Number(value) || 0), name === 'cumulative' ? 'Cumulative' : 'Individual']}
            />
            <Legend formatter={(value) => <span style={{ color: '#FFFFFF' }}>{value}</span>} />
            <Area type="monotone" dataKey="cumulative" name="Cumulative" stroke="#10B981" fillOpacity={1} fill="url(#colorMarketCap)" />
            <Area type="monotone" dataKey="marketCap" name="Individual" stroke="#3B82F6" fillOpacity={1} fill="url(#colorVolume)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Bubble Chart View - Price vs Change with Volume as size
  const BubbleChartView = () => {
    const maxVolume = Math.max(...filteredData.map(c => c.volume));
    const bubbleData = filteredData.map((coin, i) => ({
      name: coin.symbol,
      price: coin.price,
      change: coin.change24h,
      volume: coin.volume,
      // Normalize volume to reasonable bubble size (50-500)
      bubbleSize: maxVolume > 0 ? 50 + (coin.volume / maxVolume) * 450 : 100,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
      <div className="h-80">
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400">Price vs 24h Change (bubble size = volume)</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="price"
              name="Price"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              tickFormatter={(v) => formatPrice(v)}
              label={{ value: 'Price (USD)', position: 'bottom', fill: '#6B7280', fontSize: 11 }}
            />
            <YAxis
              dataKey="change"
              name="24h Change"
              unit="%"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              label={{ value: '24h Change (%)', angle: -90, position: 'left', fill: '#6B7280', fontSize: 11 }}
            />
            <ZAxis dataKey="bubbleSize" range={[50, 500]} />
            <Tooltip
              cursor={{ strokeDasharray: '3 3' }}
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const data = payload[0].payload;
                return (
                  <div className="bg-gray-800 p-3 rounded-lg border border-gray-700">
                    <p className="font-bold text-white">{data.name}</p>
                    <p className="text-gray-300">Price: {formatPrice(data.price)}</p>
                    <p className={data.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      24h: {formatChange(data.change)}
                    </p>
                    <p className="text-gray-300">Volume: {formatMarketCap(data.volume)}</p>
                  </div>
                );
              }}
            />
            <Scatter name="Coins" data={bubbleData}>
              {bubbleData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Heatmap View - Performance Grid
  const HeatmapView = () => {
    const metrics = ['Price', 'Change 24h', 'Market Cap', 'Volume'];

    // Calculate percentile ranks for each metric
    const priceRanks = [...filteredData].sort((a, b) => b.price - a.price).map((c, i) => ({ symbol: c.symbol, rank: i + 1 }));
    const changeRanks = [...filteredData].sort((a, b) => b.change24h - a.change24h).map((c, i) => ({ symbol: c.symbol, rank: i + 1 }));
    const mcapRanks = [...filteredData].sort((a, b) => b.marketCap - a.marketCap).map((c, i) => ({ symbol: c.symbol, rank: i + 1 }));
    const volumeRanks = [...filteredData].sort((a, b) => b.volume - a.volume).map((c, i) => ({ symbol: c.symbol, rank: i + 1 }));

    const getHeatColor = (rank: number, total: number) => {
      const percentile = ((total - rank) / total) * 100;
      if (percentile >= 80) return 'bg-emerald-600';
      if (percentile >= 60) return 'bg-emerald-700';
      if (percentile >= 40) return 'bg-gray-600';
      if (percentile >= 20) return 'bg-orange-700';
      return 'bg-red-700';
    };

    const getMetricValue = (coin: CoinData, metric: string) => {
      switch (metric) {
        case 'Price': return formatPrice(coin.price);
        case 'Change 24h': return formatChange(coin.change24h);
        case 'Market Cap': return formatMarketCap(coin.marketCap);
        case 'Volume': return formatMarketCap(coin.volume);
        default: return '-';
      }
    };

    const getRank = (symbol: string, metric: string) => {
      const ranks = metric === 'Price' ? priceRanks :
                    metric === 'Change 24h' ? changeRanks :
                    metric === 'Market Cap' ? mcapRanks : volumeRanks;
      return ranks.find(r => r.symbol === symbol)?.rank || filteredData.length;
    };

    return (
      <div className="overflow-x-auto">
        <div className="text-center mb-3">
          <p className="text-xs text-gray-400">Performance Heatmap (greener = higher percentile)</p>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-700">
              <th className="text-left py-2 px-3 text-gray-400 font-medium sticky left-0 bg-gray-900">Coin</th>
              {metrics.map(m => (
                <th key={m} className="text-center py-2 px-3 text-gray-400 font-medium">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredData.map((coin, index) => (
              <tr key={coin.symbol} className="border-b border-gray-800">
                <td className="py-2 px-3 sticky left-0 bg-gray-900">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold text-white"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    >
                      {coin.symbol.charAt(0)}
                    </span>
                    <span className="text-white font-medium">{coin.symbol}</span>
                  </div>
                </td>
                {metrics.map(metric => (
                  <td key={metric} className="py-2 px-3 text-center">
                    <div className={`py-1.5 px-2 rounded ${getHeatColor(getRank(coin.symbol, metric), filteredData.length)}`}>
                      <span className="text-white text-xs font-mono">{getMetricValue(coin, metric)}</span>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <div className="flex justify-center items-center gap-4 mt-4 text-xs text-gray-400">
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-600"></span> Top 20%</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-emerald-700"></span> 60-80%</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-gray-600"></span> 40-60%</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-orange-700"></span> 20-40%</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-red-700"></span> Bottom 20%</span>
        </div>
      </div>
    );
  };

  // Sankey Chart View - Flow visualization of market cap distribution
  const SankeyChartView = () => {
    // Create sankey data: shows flow from "Market" to each tier, then to individual coins
    const sortedByMarketCap = [...filteredData].sort((a, b) => b.marketCap - a.marketCap);
    const totalMarketCap = filteredData.reduce((sum, c) => sum + c.marketCap, 0);

    // Group coins by tier based on market cap
    const largeCap = sortedByMarketCap.filter(c => c.marketCap > totalMarketCap * 0.15);
    const midCap = sortedByMarketCap.filter(c => c.marketCap <= totalMarketCap * 0.15 && c.marketCap > totalMarketCap * 0.05);
    const smallCap = sortedByMarketCap.filter(c => c.marketCap <= totalMarketCap * 0.05);

    const nodes = [
      { name: 'Total Market' },
      { name: 'Large Cap' },
      { name: 'Mid Cap' },
      { name: 'Small Cap' },
      ...filteredData.map(c => ({ name: c.symbol }))
    ];

    const links: { source: number; target: number; value: number }[] = [];

    // Market to tiers
    const largeCapTotal = largeCap.reduce((s, c) => s + c.marketCap, 0);
    const midCapTotal = midCap.reduce((s, c) => s + c.marketCap, 0);
    const smallCapTotal = smallCap.reduce((s, c) => s + c.marketCap, 0);

    if (largeCapTotal > 0) links.push({ source: 0, target: 1, value: largeCapTotal / 1e9 });
    if (midCapTotal > 0) links.push({ source: 0, target: 2, value: midCapTotal / 1e9 });
    if (smallCapTotal > 0) links.push({ source: 0, target: 3, value: smallCapTotal / 1e9 });

    // Tiers to coins
    largeCap.forEach(c => {
      const coinIndex = nodes.findIndex(n => n.name === c.symbol);
      if (coinIndex > 0) links.push({ source: 1, target: coinIndex, value: c.marketCap / 1e9 });
    });
    midCap.forEach(c => {
      const coinIndex = nodes.findIndex(n => n.name === c.symbol);
      if (coinIndex > 0) links.push({ source: 2, target: coinIndex, value: c.marketCap / 1e9 });
    });
    smallCap.forEach(c => {
      const coinIndex = nodes.findIndex(n => n.name === c.symbol);
      if (coinIndex > 0) links.push({ source: 3, target: coinIndex, value: c.marketCap / 1e9 });
    });

    const sankeyData = { nodes, links };

    // Custom node component with labels
    const SankeyNode = ({ x, y, width, height, index, payload }: { x: number; y: number; width: number; height: number; index: number; payload: { name: string } }) => {
      const isCategory = index < 4; // First 4 are categories
      return (
        <g>
          <rect
            x={x}
            y={y}
            width={width}
            height={height}
            fill={isCategory ? '#10B981' : CHART_COLORS[index % CHART_COLORS.length]}
            stroke="#059669"
            strokeWidth={1}
          />
          <text
            x={isCategory ? x - 5 : x + width + 5}
            y={y + height / 2}
            textAnchor={isCategory ? 'end' : 'start'}
            dominantBaseline="middle"
            fill="#FFFFFF"
            fontSize={11}
            fontWeight={isCategory ? 'bold' : 'normal'}
          >
            {payload.name}
          </text>
        </g>
      );
    };

    return (
      <div className="h-96">
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400">Market Cap Flow: Total → Tier → Individual Coins (in $B)</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <Sankey
            data={sankeyData}
            nodePadding={30}
            nodeWidth={10}
            linkCurvature={0.5}
            margin={{ left: 100, right: 100, top: 20, bottom: 20 }}
            node={<SankeyNode x={0} y={0} width={0} height={0} index={0} payload={{ name: '' }} />}
            link={{
              stroke: '#374151',
              strokeOpacity: 0.5,
            }}
          >
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value) => [`$${(Number(value) || 0).toFixed(2)}B`, 'Market Cap']}
            />
          </Sankey>
        </ResponsiveContainer>
        <div className="flex justify-center gap-6 mt-2 text-xs text-gray-400">
          <span>Large Cap: &gt;15% share</span>
          <span>Mid Cap: 5-15% share</span>
          <span>Small Cap: &lt;5% share</span>
        </div>
      </div>
    );
  };

  // Funnel Chart View - Market cap ranking funnel
  const FunnelChartView = () => {
    const sortedByMarketCap = [...filteredData].sort((a, b) => b.marketCap - a.marketCap);
    const funnelData = sortedByMarketCap.slice(0, 8).map((coin, i) => ({
      name: coin.symbol,
      value: coin.marketCap / 1e9,
      fill: CHART_COLORS[i % CHART_COLORS.length],
      price: coin.price,
      change: coin.change24h,
    }));

    return (
      <div className="h-80">
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400">Market Cap Ranking Funnel (Top 8 by Market Cap)</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <FunnelChart>
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value, name, props) => {
                const item = props.payload;
                return [
                  <div key="tooltip" className="text-sm text-white">
                    <div className="font-bold text-white">{item.name}</div>
                    <div className="text-white">Market Cap: ${(Number(value) || 0).toFixed(2)}B</div>
                    <div className="text-white">Price: {formatPrice(item.price)}</div>
                    <div className={item.change >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      24h: {formatChange(item.change)}
                    </div>
                  </div>,
                  ''
                ];
              }}
            />
            <Funnel
              dataKey="value"
              data={funnelData}
              isAnimationActive
            >
              <LabelList position="right" fill="#fff" stroke="none" dataKey="name" fontSize={12} />
              <LabelList position="center" fill="#fff" stroke="none" dataKey="value" fontSize={10} formatter={(v) => `$${(Number(v) || 0).toFixed(1)}B`} />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Radial Bar Chart View - Circular comparison
  const RadialBarChartView = () => {
    const maxMarketCap = Math.max(...filteredData.map(c => c.marketCap));
    const radialData = filteredData.slice(0, 8).map((coin, i) => ({
      name: coin.symbol,
      value: maxMarketCap > 0 ? (coin.marketCap / maxMarketCap) * 100 : 0,
      marketCap: coin.marketCap,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
      <div className="h-96">
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400">Market Cap Comparison (% of largest)</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="20%"
            outerRadius="90%"
            data={radialData}
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              background={{ fill: '#374151' }}
              dataKey="value"
              cornerRadius={5}
              label={{ position: 'insideStart', fill: '#fff', fontSize: 10 }}
            />
            <Legend
              iconSize={10}
              layout="vertical"
              verticalAlign="middle"
              align="right"
              wrapperStyle={{ paddingLeft: '10px' }}
              formatter={(value, entry) => {
                const item = radialData.find(d => d.name === value);
                return <span className="text-xs text-white">{value} ({item?.value.toFixed(0)}%)</span>;
              }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value, name, props) => {
                const item = props.payload;
                return [`${formatMarketCap(item.marketCap)} (${(Number(value) || 0).toFixed(1)}%)`, item.name];
              }}
            />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Composed Chart View - Combined bar + line + area
  const ComposedChartView = () => {
    const composedData = filteredData.map((coin, i) => ({
      name: coin.symbol,
      price: coin.price,
      marketCap: coin.marketCap / 1e9, // In billions
      volume: coin.volume / 1e9, // In billions
      change: coin.change24h,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
      <div className="h-80">
        <div className="text-center mb-2">
          <p className="text-xs text-gray-400">Combined View: Market Cap (bars) + Volume (area) + Change % (line)</p>
        </div>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={composedData} margin={{ top: 20, right: 60, left: 20, bottom: 60 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey="name"
              tick={{ fill: '#9CA3AF', fontSize: 11 }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis
              yAxisId="left"
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              tickFormatter={(v) => `$${v}B`}
              label={{ value: 'MCap/Vol ($B)', angle: -90, position: 'insideLeft', fill: '#6B7280', fontSize: 10 }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fill: '#9CA3AF', fontSize: 10 }}
              tickFormatter={(v) => `${v}%`}
              label={{ value: 'Change %', angle: 90, position: 'insideRight', fill: '#6B7280', fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#FFFFFF' }}
              itemStyle={{ color: '#FFFFFF' }}
              formatter={(value, name) => {
                const v = Number(value) || 0;
                if (name === 'Market Cap') return [`$${v.toFixed(2)}B`, name];
                if (name === 'Volume') return [`$${v.toFixed(2)}B`, name];
                if (name === '24h Change') return [`${v.toFixed(2)}%`, name];
                return [v, name];
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} formatter={(value) => <span style={{ color: '#FFFFFF' }}>{value}</span>} />
            <Bar yAxisId="left" dataKey="marketCap" name="Market Cap" fill="#10B981" opacity={0.8}>
              <LabelList dataKey="name" position="top" fill="#FFFFFF" fontSize={9} />
            </Bar>
            <Area yAxisId="left" type="monotone" dataKey="volume" name="Volume" fill="#3B82F6" stroke="#3B82F6" fillOpacity={0.3} />
            <Line yAxisId="right" type="monotone" dataKey="change" name="24h Change" stroke="#F59E0B" strokeWidth={2} dot={{ fill: '#F59E0B', strokeWidth: 2 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    );
  };

  // Coin Distribution Chart View - Wallet holder distribution
  const DistributionChartView = () => {
    // Get the selected coin for distribution analysis
    const selectedCoinData = data.find(c => c.symbol === distributionCoin) || data[0];
    const coinSymbol = selectedCoinData?.symbol || 'BTC';
    const coinPrice = selectedCoinData?.price || 0;
    const coinMarketCap = selectedCoinData?.marketCap || 0;

    // Check if we have real holder data
    const hasRealData = holderData && holderData.distribution.top_10_percentage !== null;

    // Transform real holder data into our display format
    const getRealHolderCategories = () => {
      if (!holderData || !hasRealData) return null;

      const top10 = holderData.distribution.top_10_percentage || 0;
      const top25 = holderData.distribution.top_25_percentage || 0;
      const top50 = holderData.distribution.top_50_percentage || 0;
      const rest = holderData.distribution.rest_percentage || (100 - top50);

      // Calculate tier breakdowns from the cumulative percentages
      const tier10 = top10;
      const tier25 = top25 - top10;
      const tier50 = top50 - top25;
      const tierRest = rest;

      return [
        {
          category: 'Top 10%',
          range: 'Largest',
          emoji: '🐋',
          color: '#10B981',
          coinPercent: tier10,
          addressPercent: 10,
          avgHolding: 0,
          dayChange: 0,
          weekChange: 0,
          monthChange: 0,
        },
        {
          category: 'Top 11-25%',
          range: 'Large',
          emoji: '🐳',
          color: '#3B82F6',
          coinPercent: tier25 > 0 ? tier25 : 0,
          addressPercent: 15,
          avgHolding: 0,
          dayChange: 0,
          weekChange: 0,
          monthChange: 0,
        },
        {
          category: 'Top 26-50%',
          range: 'Medium',
          emoji: '🦈',
          color: '#8B5CF6',
          coinPercent: tier50 > 0 ? tier50 : 0,
          addressPercent: 25,
          avgHolding: 0,
          dayChange: 0,
          weekChange: 0,
          monthChange: 0,
        },
        {
          category: 'Bottom 50%',
          range: 'Small',
          emoji: '🦐',
          color: '#EF4444',
          coinPercent: tierRest > 0 ? tierRest : 0,
          addressPercent: 50,
          avgHolding: 0,
          dayChange: 0,
          weekChange: 0,
          monthChange: 0,
        },
      ].filter(cat => cat.coinPercent > 0); // Only show categories with data
    };

    // Holder categories with realistic distribution patterns (sample data fallback)
    // These are simulated based on typical crypto holder distributions
    const sampleHolderCategories = [
      {
        category: 'Humpback',
        range: '>10K',
        emoji: '🐋',
        color: '#10B981',
        // Humpbacks hold most of supply but are few addresses
        coinPercent: 42.5,
        addressPercent: 0.01,
        avgHolding: 15000,
        dayChange: 0.12,
        weekChange: -0.34,
        monthChange: 1.23,
      },
      {
        category: 'Whale',
        range: '1K-10K',
        emoji: '🐳',
        color: '#3B82F6',
        coinPercent: 28.3,
        addressPercent: 0.08,
        avgHolding: 3500,
        dayChange: -0.05,
        weekChange: 0.21,
        monthChange: -0.89,
      },
      {
        category: 'Shark',
        range: '100-1K',
        emoji: '🦈',
        color: '#8B5CF6',
        coinPercent: 15.7,
        addressPercent: 0.42,
        avgHolding: 350,
        dayChange: 0.08,
        weekChange: 0.15,
        monthChange: 2.34,
      },
      {
        category: 'Fish',
        range: '10-100',
        emoji: '🐟',
        color: '#F59E0B',
        coinPercent: 8.9,
        addressPercent: 2.85,
        avgHolding: 42,
        dayChange: 0.23,
        weekChange: 0.67,
        monthChange: 3.12,
      },
      {
        category: 'Crab',
        range: '1-10',
        emoji: '🦀',
        color: '#EC4899',
        coinPercent: 3.4,
        addressPercent: 12.64,
        avgHolding: 4.2,
        dayChange: 0.45,
        weekChange: 1.23,
        monthChange: 5.67,
      },
      {
        category: 'Shrimp',
        range: '<1',
        emoji: '🦐',
        color: '#EF4444',
        coinPercent: 1.2,
        addressPercent: 84.0,
        avgHolding: 0.15,
        dayChange: 0.67,
        weekChange: 2.34,
        monthChange: 8.91,
      },
    ];

    // Use real data if available, otherwise fall back to sample data
    const holderCategories = getRealHolderCategories() || sampleHolderCategories;

    // Calculate estimated values based on coin data
    const totalSupply = coinMarketCap > 0 && coinPrice > 0 ? coinMarketCap / coinPrice : 21000000; // Default to BTC supply
    const estimatedAddresses = holderData?.holders || Math.floor(totalSupply * 0.1); // Use real holder count if available

    const distributionData = holderCategories.map(cat => ({
      ...cat,
      coinAmount: (totalSupply * cat.coinPercent / 100),
      coinValue: (totalSupply * cat.coinPercent / 100) * coinPrice,
      addressCount: Math.floor(estimatedAddresses * cat.addressPercent / 100),
    }));

    // Treemap data for coin distribution (includes emoji for visual appeal)
    const coinDistributionData = distributionData.map(d => ({
      name: d.category,
      value: d.coinPercent,
      fill: d.color,
      emoji: d.emoji,
    }));

    // Treemap data for address distribution (includes emoji for visual appeal)
    const addressDistributionData = distributionData.map(d => ({
      name: d.category,
      value: d.addressPercent,
      fill: d.color,
      emoji: d.emoji,
    }));

    return (
      <div className="space-y-6">
        {/* Coin Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-500" />
              {coinSymbol} Coin Distribution
            </h3>
            <span className={`text-xs px-2 py-1 rounded ${hasRealData ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-800 text-gray-500'}`}>
              {holderLoading ? 'Loading...' : hasRealData ? '✓ Live Data' : 'Sample Data'}
            </span>
          </div>
          <select
            value={distributionCoin}
            onChange={(e) => setDistributionCoin(e.target.value)}
            aria-label="Select coin for distribution analysis"
            className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
          >
            {selectedCoins.map(coin => (
              <option key={coin} value={coin}>{coin}</option>
            ))}
          </select>
        </div>

        {/* Distribution Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {distributionData.map((cat) => (
            <div key={cat.category} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">{cat.emoji}</span>
                <div>
                  <div className="text-sm font-medium text-white">{cat.category}</div>
                  <div className="text-xs text-gray-500">{cat.range} {coinSymbol}</div>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Coins:</span>
                  <span className="text-white font-mono">{cat.coinPercent.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Addresses:</span>
                  <span className="text-white font-mono">{cat.addressPercent.toFixed(2)}%</span>
                </div>
                <div className={`text-xs text-right ${cat.dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {cat.dayChange >= 0 ? '+' : ''}{cat.dayChange.toFixed(2)}% (24h)
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Treemap Charts Grid - Tree-like Visualization */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Coin Distribution Treemap */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <span>💰</span> Coin Distribution (Treemap)
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={coinDistributionData}
                  dataKey="value"
                  aspectRatio={4/3}
                  stroke="#1F2937"
                  content={(props) => {
                    const { x, y, width, height, name, value, fill, index } = props;
                    // Find emoji from data
                    const item = coinDistributionData.find(d => d.name === name);
                    const emoji = item?.emoji || '';
                    const displayName = String(name || '');
                    const displayValue = Number(value) || 0;
                    const showFullLabel = width > 60 && height > 50;
                    const showCompactLabel = width > 35 && height > 25;
                    const filterId = `shadow-coin-${index}`;
                    return (
                      <g>
                        {/* Drop shadow filter for text */}
                        <defs>
                          <filter id={filterId} x="-20%" y="-20%" width="140%" height="140%">
                            <feDropShadow dx="0" dy="1" stdDeviation="1" floodOpacity="0.5"/>
                          </filter>
                        </defs>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={String(fill)}
                          stroke="#1F2937"
                          strokeWidth={2}
                          rx={8}
                        />
                        {showFullLabel ? (
                          <>
                            {/* Emoji with subtle glow */}
                            <text
                              x={x + width / 2}
                              y={y + height / 2 - 16}
                              textAnchor="middle"
                              fontSize={26}
                              style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}
                            >
                              {emoji}
                            </text>
                            {/* Category Name - Bold with stroke for contrast */}
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 10}
                              textAnchor="middle"
                              fill="#FFFFFF"
                              stroke="rgba(0,0,0,0.6)"
                              strokeWidth={3}
                              paintOrder="stroke"
                              fontSize={13}
                              fontWeight="700"
                              style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
                            >
                              {displayName}
                            </text>
                            {/* Percentage - Large emerald green */}
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 28}
                              textAnchor="middle"
                              fill="#10B981"
                              stroke="rgba(0,0,0,0.7)"
                              strokeWidth={4}
                              paintOrder="stroke"
                              fontSize={16}
                              fontWeight="800"
                            >
                              {displayValue.toFixed(1)}%
                            </text>
                          </>
                        ) : showCompactLabel ? (
                          <>
                            {/* Emoji for smaller blocks */}
                            <text
                              x={x + width / 2}
                              y={y + height / 2 - 4}
                              textAnchor="middle"
                              fontSize={16}
                              style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))' }}
                            >
                              {emoji}
                            </text>
                            {/* Percentage - compact but readable */}
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 12}
                              textAnchor="middle"
                              fill="#10B981"
                              stroke="rgba(0,0,0,0.6)"
                              strokeWidth={2}
                              paintOrder="stroke"
                              fontSize={11}
                              fontWeight="700"
                            >
                              {displayValue.toFixed(1)}%
                            </text>
                          </>
                        ) : null}
                      </g>
                    );
                  }}
                >
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#FFFFFF' }}
                    itemStyle={{ color: '#FFFFFF' }}
                    formatter={(value) => [`${(Number(value) || 0).toFixed(1)}%`, 'Share of Supply']}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Block size = proportion of total coin supply held</p>
          </div>

          {/* Address Distribution Treemap */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-400 mb-3 flex items-center gap-2">
              <span>👛</span> Address Distribution (Treemap)
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={addressDistributionData}
                  dataKey="value"
                  aspectRatio={4/3}
                  stroke="#1F2937"
                  content={(props) => {
                    const { x, y, width, height, name, value, fill, index } = props;
                    // Find emoji from data
                    const item = addressDistributionData.find(d => d.name === name);
                    const emoji = item?.emoji || '';
                    const displayName = String(name || '');
                    const displayValue = Number(value) || 0;
                    const showFullLabel = width > 60 && height > 50;
                    const showCompactLabel = width > 35 && height > 25;
                    return (
                      <g>
                        <rect
                          x={x}
                          y={y}
                          width={width}
                          height={height}
                          fill={String(fill)}
                          stroke="#1F2937"
                          strokeWidth={2}
                          rx={8}
                        />
                        {showFullLabel ? (
                          <>
                            {/* Emoji with subtle glow */}
                            <text
                              x={x + width / 2}
                              y={y + height / 2 - 16}
                              textAnchor="middle"
                              fontSize={26}
                              style={{ filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.3))' }}
                            >
                              {emoji}
                            </text>
                            {/* Category Name - Bold with stroke for contrast */}
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 10}
                              textAnchor="middle"
                              fill="#FFFFFF"
                              stroke="rgba(0,0,0,0.6)"
                              strokeWidth={3}
                              paintOrder="stroke"
                              fontSize={13}
                              fontWeight="700"
                              style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}
                            >
                              {displayName}
                            </text>
                            {/* Percentage - Large emerald green */}
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 28}
                              textAnchor="middle"
                              fill="#10B981"
                              stroke="rgba(0,0,0,0.7)"
                              strokeWidth={4}
                              paintOrder="stroke"
                              fontSize={16}
                              fontWeight="800"
                            >
                              {displayValue.toFixed(1)}%
                            </text>
                          </>
                        ) : showCompactLabel ? (
                          <>
                            {/* Emoji for smaller blocks */}
                            <text
                              x={x + width / 2}
                              y={y + height / 2 - 4}
                              textAnchor="middle"
                              fontSize={16}
                              style={{ filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.2))' }}
                            >
                              {emoji}
                            </text>
                            {/* Percentage - compact but readable */}
                            <text
                              x={x + width / 2}
                              y={y + height / 2 + 12}
                              textAnchor="middle"
                              fill="#10B981"
                              stroke="rgba(0,0,0,0.6)"
                              strokeWidth={2}
                              paintOrder="stroke"
                              fontSize={11}
                              fontWeight="700"
                            >
                              {displayValue.toFixed(1)}%
                            </text>
                          </>
                        ) : null}
                      </g>
                    );
                  }}
                >
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#FFFFFF' }}
                    itemStyle={{ color: '#FFFFFF' }}
                    formatter={(value) => [`${(Number(value) || 0).toFixed(2)}%`, 'Share of Addresses']}
                  />
                </Treemap>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-gray-500 mt-2 text-center">Block size = proportion of total addresses</p>
          </div>
        </div>

        {/* Bar Chart - Comparison */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">Coin vs Address Distribution</h4>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={distributionData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#FFFFFF' }}
                  itemStyle={{ color: '#FFFFFF' }}
                  formatter={(value, name) => [`${(Number(value) || 0).toFixed(2)}%`, name]}
                />
                <Legend formatter={(value) => <span style={{ color: '#FFFFFF' }}>{value}</span>} />
                <Bar dataKey="coinPercent" name="Coin %" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="addressPercent" name="Address %" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Detailed Table */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-400 mb-3">{coinSymbol} Distribution Details</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Category</th>
                  <th className="text-left py-2 px-3 text-gray-400 font-medium">Range</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Coin %</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Address %</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Avg Holding</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Day</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Week</th>
                  <th className="text-right py-2 px-3 text-gray-400 font-medium">Month</th>
                </tr>
              </thead>
              <tbody>
                {distributionData.map((cat, index) => (
                  <tr key={cat.category} className="border-b border-gray-700/50 hover:bg-gray-700/30">
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.emoji}</span>
                        <span className="text-white font-medium">{cat.category}</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-300 font-mono text-xs">{cat.range} {coinSymbol}</td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full"
                            style={{ width: `${Math.min(cat.coinPercent * 2, 100)}%`, backgroundColor: cat.color }}
                          />
                        </div>
                        <span className="text-white font-mono text-xs w-12 text-right">{cat.coinPercent.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 bg-gray-700 rounded-full h-2">
                          <div
                            className="h-2 rounded-full bg-blue-500"
                            style={{ width: `${Math.min(cat.addressPercent, 100)}%` }}
                          />
                        </div>
                        <span className="text-white font-mono text-xs w-14 text-right">{cat.addressPercent.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="py-2 px-3 text-right text-gray-300 font-mono text-xs">
                      {cat.avgHolding >= 1000 ? `${(cat.avgHolding / 1000).toFixed(1)}K` : cat.avgHolding.toFixed(2)} {coinSymbol}
                    </td>
                    <td className={`py-2 px-3 text-right font-mono text-xs ${cat.dayChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {cat.dayChange >= 0 ? '+' : ''}{cat.dayChange.toFixed(2)}%
                    </td>
                    <td className={`py-2 px-3 text-right font-mono text-xs ${cat.weekChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {cat.weekChange >= 0 ? '+' : ''}{cat.weekChange.toFixed(2)}%
                    </td>
                    <td className={`py-2 px-3 text-right font-mono text-xs ${cat.monthChange >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {cat.monthChange >= 0 ? '+' : ''}{cat.monthChange.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loading indicator */}
        {holderLoading && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
            <p className="text-xs text-gray-400">Loading holder distribution data from GeckoTerminal...</p>
          </div>
        )}

        {/* Info Note - Dynamic based on data availability */}
        {hasRealData ? (
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
            <p className="text-xs text-emerald-400">
              <strong>✓ Live Data:</strong> Holder distribution data is from GeckoTerminal (CoinGecko on-chain data).
              {holderData?.holders && ` Total holders: ${holderData.holders.toLocaleString()}.`}
              {holderData?.scores?.total_score && ` Trust score: ${holderData.scores.total_score}/100.`}
            </p>
          </div>
        ) : (
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-xs text-blue-400">
              <strong>Note:</strong> {holderError || 'Distribution data shown above is sample data for layout preview.'}
              {!TOKEN_CONTRACT_MAP[coinSymbol.toUpperCase()] && ' This coin does not have an ERC20/token contract address for on-chain holder data.'}
              {' '}Download our Excel templates for detailed token holder analytics with prefetched data.
            </p>
          </div>
        )}
      </div>
    );
  };

  if (selectedCoins.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="text-center py-8">
          <div className="text-4xl mb-3">📊</div>
          <h3 className="text-lg font-medium text-white mb-2">No Coins Selected</h3>
          <p className="text-gray-400 text-sm">
            Select coins above to preview your data and charts
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-800">
        <div>
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span>📊</span>
            Data Preview
          </h2>
          <p className="text-gray-400 text-xs mt-1">
            Preview how your data will appear in Excel • Data via BYOK
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-gray-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`p-2 rounded transition ${
                viewMode === 'table'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Table View"
            >
              <Table2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('bar')}
              className={`p-2 rounded transition ${
                viewMode === 'bar'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Price Chart"
            >
              <BarChart3 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('pie')}
              className={`p-2 rounded transition ${
                viewMode === 'pie'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Market Cap Distribution"
            >
              <PieChartIcon className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('line')}
              className={`p-2 rounded transition ${
                viewMode === 'line'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="24h Change"
            >
              <TrendingUp className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('volume')}
              className={`p-2 rounded transition ${
                viewMode === 'volume'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Trading Volume"
            >
              <Activity className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setViewMode('dashboard')}
              className={`p-2 rounded transition ${
                viewMode === 'dashboard'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
              title="Dashboard (All Charts)"
            >
              <LayoutDashboard className="w-4 h-4" />
            </button>
          </div>

          {/* Advanced Charts Dropdown */}
          <div className="relative group">
            <button
              type="button"
              className={`p-2 rounded-lg transition flex items-center gap-1 ${
                ['radar', 'scatter', 'treemap', 'area', 'bubble', 'heatmap', 'sankey', 'funnel', 'radialbar', 'composed', 'distribution'].includes(viewMode)
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
              title="Advanced Charts"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-1 w-56 bg-gray-800 border border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 max-h-96 overflow-y-auto">
              <div className="p-2 space-y-1">
                <p className="text-xs text-gray-500 px-2 py-1 font-medium">Advanced Charts</p>
                <button
                  type="button"
                  onClick={() => setViewMode('radar')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    viewMode === 'radar' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  Radar Chart
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('scatter')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    viewMode === 'scatter' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <ScatterIcon className="w-4 h-4" />
                  Scatter Plot
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('treemap')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    viewMode === 'treemap' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  Treemap
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('area')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    viewMode === 'area' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Area Chart
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('bubble')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    viewMode === 'bubble' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Flame className="w-4 h-4" />
                  Bubble Chart
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('heatmap')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    viewMode === 'heatmap' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                  Heatmap
                </button>

                <div className="border-t border-gray-700 my-1"></div>
                <p className="text-xs text-gray-500 px-2 py-1 font-medium">Pro Charts</p>

                <button
                  type="button"
                  onClick={() => setViewMode('sankey')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    viewMode === 'sankey' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <GitBranch className="w-4 h-4" />
                  Sankey Flow
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('funnel')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    viewMode === 'funnel' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Triangle className="w-4 h-4" />
                  Funnel Chart
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('radialbar')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    viewMode === 'radialbar' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <CircleDot className="w-4 h-4" />
                  Radial Bar
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('composed')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    viewMode === 'composed' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Combine className="w-4 h-4" />
                  Composed Chart
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('distribution')}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm transition ${
                    viewMode === 'distribution' ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Coin Distribution
                </button>
              </div>
            </div>
          </div>

          {/* Filter Toggle Button */}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2 rounded-lg transition flex items-center gap-1 ${
              showFilters || hasActiveFilters
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            title="Toggle Filters"
          >
            <Filter className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded">
                {filteredData.length}
              </span>
            )}
          </button>

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchPreviewData}
            disabled={loading}
            className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg transition disabled:opacity-50"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Filter Panel */}
        {showFilters && <FilterPanel />}

        {loading && data.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-6 h-6 text-emerald-500 animate-spin mr-3" />
            <span className="text-gray-400">Loading preview data...</span>
          </div>
        ) : error && data.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-gray-400">{error}</p>
          </div>
        ) : (
          <>
            {viewMode === 'table' && <TableView />}
            {viewMode === 'bar' && <BarChartView />}
            {viewMode === 'pie' && <PieChartView />}
            {viewMode === 'line' && <LineChartView />}
            {viewMode === 'volume' && <VolumeChartView />}
            {viewMode === 'dashboard' && <DashboardView />}
            {viewMode === 'radar' && <RadarChartView />}
            {viewMode === 'scatter' && <ScatterPlotView />}
            {viewMode === 'treemap' && <TreemapView />}
            {viewMode === 'area' && <AreaChartView />}
            {viewMode === 'bubble' && <BubbleChartView />}
            {viewMode === 'heatmap' && <HeatmapView />}
            {viewMode === 'sankey' && <SankeyChartView />}
            {viewMode === 'funnel' && <FunnelChartView />}
            {viewMode === 'radialbar' && <RadialBarChartView />}
            {viewMode === 'composed' && <ComposedChartView />}
            {viewMode === 'distribution' && <DistributionChartView />}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-800/50 border-t border-gray-800 flex items-center justify-between">
        <div className="text-xs text-gray-500">
          {data.length} coin{data.length !== 1 ? 's' : ''} • Timeframe: {timeframe}
        </div>
        {lastUpdated && (
          <div className="text-xs text-gray-500">
            Updated: {lastUpdated.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* BYOK Note */}
      <div className="px-4 py-2 bg-emerald-900/20 border-t border-emerald-500/30">
        <p className="text-xs text-emerald-400 text-center">
          💡 This preview shows data from CoinGecko. Download our static Excel templates for prefetched data you can analyze offline.
        </p>
      </div>
    </div>
  );
}
