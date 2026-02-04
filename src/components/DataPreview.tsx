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
} from 'recharts';
import { RefreshCw, Table2, BarChart3, PieChartIcon, TrendingUp, TrendingDown, LayoutDashboard, Activity, Filter, SortAsc, SortDesc, ChevronDown, X } from 'lucide-react';

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
}

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

type ViewMode = 'table' | 'bar' | 'pie' | 'line' | 'volume' | 'dashboard';
type SortField = 'symbol' | 'price' | 'change24h' | 'marketCap' | 'volume';
type SortOrder = 'asc' | 'desc';
type ChangeFilter = 'all' | 'gainers' | 'losers';

export function DataPreview({ selectedCoins, timeframe, onDataLoad }: DataPreviewProps) {
  const [data, setData] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Filter and sort state
  const [showFilters, setShowFilters] = useState(false);
  const [sortField, setSortField] = useState<SortField>('marketCap');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [changeFilter, setChangeFilter] = useState<ChangeFilter>('all');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [showTopN, setShowTopN] = useState<number>(0); // 0 means show all

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
        <thead>
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
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value) => [formatPrice(Number(value) || 0), 'Price']}
            />
            <Bar dataKey="price" radius={[4, 4, 0, 0]}>
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
              formatter={(value) => [formatMarketCap(Number(value) || 0), 'Market Cap']}
            />
            <Legend
              wrapperStyle={{ paddingTop: '20px' }}
              formatter={(value) => <span className="text-gray-300">{value}</span>}
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
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value) => [`${(Number(value) || 0).toFixed(2)}%`, '24h Change']}
            />
            {/* Reference line at 0 */}
            <CartesianGrid horizontal={false} />
            <Bar dataKey="change" radius={[4, 4, 0, 0]}>
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
              labelStyle={{ color: '#F3F4F6' }}
              formatter={(value) => [formatMarketCap(Number(value) || 0), '24h Volume']}
            />
            <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
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
                    formatter={(value) => [formatPrice(Number(value) || 0), 'Price']}
                  />
                  <Bar dataKey="price" radius={[4, 4, 0, 0]}>
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
                    formatter={(value) => [formatMarketCap(Number(value) || 0), 'Market Cap']}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px' }} />
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
                    formatter={(value) => [`${(Number(value) || 0).toFixed(2)}%`, '24h Change']}
                  />
                  <Bar dataKey="change" radius={[4, 4, 0, 0]}>
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
                    formatter={(value) => [formatMarketCap(Number(value) || 0), 'Volume']}
                  />
                  <Bar dataKey="volume" radius={[4, 4, 0, 0]}>
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
          💡 This preview shows live data. In Excel, CRK formulas will fetch the latest data using your own API key (BYOK).
        </p>
      </div>
    </div>
  );
}
