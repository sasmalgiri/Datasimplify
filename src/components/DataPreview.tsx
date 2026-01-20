'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { RefreshCw, Table2, BarChart3, PieChartIcon, TrendingUp, TrendingDown } from 'lucide-react';

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

type ViewMode = 'table' | 'bar' | 'pie' | 'line';

export function DataPreview({ selectedCoins, timeframe, onDataLoad }: DataPreviewProps) {
  const [data, setData] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
          {data.map((coin, index) => (
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
    const chartData = data.map((coin, i) => ({
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
    const chartData = data.map((coin, i) => ({
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
    const chartData = data.map((coin, i) => ({
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
          </div>

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
