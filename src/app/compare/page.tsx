'use client';

import { useState, useEffect } from 'react';
import { SUPPORTED_COINS } from '@/lib/dataTypes';
import { formatCurrency, formatPercent } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { FreeNavbar } from '@/components/FreeNavbar';

// Interfaces
interface CompareData {
  symbol: string;
  name: string;
  image: string;
  category: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  quoteVolume24h: number;
  marketCap: number;
  circulatingSupply: number;
  maxSupply: number | null;
  bidPrice: number;
  askPrice: number;
  spread: number;
  vwap: number;
}

// Icons
const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Comparison metrics
const METRICS = [
  { key: 'price', label: 'Price', format: 'currency' },
  { key: 'priceChangePercent24h', label: '24h Change', format: 'percent' },
  { key: 'high24h', label: '24h High', format: 'currency' },
  { key: 'low24h', label: '24h Low', format: 'currency' },
  { key: 'quoteVolume24h', label: '24h Volume', format: 'currency' },
  { key: 'marketCap', label: 'Market Cap', format: 'currency' },
  { key: 'circulatingSupply', label: 'Circulating Supply', format: 'number' },
  { key: 'maxSupply', label: 'Max Supply', format: 'number' },
  { key: 'vwap', label: 'VWAP', format: 'currency' },
  { key: 'spread', label: 'Spread', format: 'currency' },
  { key: 'bidPrice', label: 'Bid Price', format: 'currency' },
  { key: 'askPrice', label: 'Ask Price', format: 'currency' },
];

export default function ComparePage() {
  // State
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTC', 'ETH', 'SOL']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>([
    'price', 'priceChangePercent24h', 'quoteVolume24h', 'marketCap'
  ]);
  const [compareData, setCompareData] = useState<CompareData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Filter coins by category
  const filteredCoins = selectedCategory === 'all' 
    ? SUPPORTED_COINS 
    : SUPPORTED_COINS.filter(c => c.category === selectedCategory);

  // Toggle coin selection
  const toggleCoin = (symbol: string) => {
    setSelectedCoins(prev => {
      if (prev.includes(symbol)) {
        return prev.filter(s => s !== symbol);
      }
      if (prev.length >= 10) {
        alert('Maximum 10 coins for comparison');
        return prev;
      }
      return [...prev, symbol];
    });
  };

  // Toggle metric selection
  const toggleMetric = (key: string) => {
    setSelectedMetrics(prev => 
      prev.includes(key) 
        ? prev.filter(m => m !== key)
        : [...prev, key]
    );
  };

  // Fetch comparison data
  const fetchData = async () => {
    if (selectedCoins.length === 0) {
      setCompareData([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await fetch(`/api/download?category=market_overview&format=json&symbols=${selectedCoins.join(',')}`);
      const result = await response.json();
      
      const data: CompareData[] = result.data?.map((d: Record<string, unknown>) => ({
        symbol: d.Symbol as string,
        name: d.Name as string,
        image: SUPPORTED_COINS.find(c => c.symbol === d.Symbol)?.image || '',
        category: d.Category as string,
        price: d.Price as number,
        priceChange24h: d['Price Change 24h'] as number,
        priceChangePercent24h: d['Price Change % 24h'] as number,
        high24h: d['High 24h'] as number,
        low24h: d['Low 24h'] as number,
        volume24h: d['Volume 24h'] as number,
        quoteVolume24h: d['Quote Volume 24h'] as number,
        marketCap: d['Market Cap'] as number,
        circulatingSupply: d['Circulating Supply'] as number,
        maxSupply: d['Max Supply'] as number | null,
        bidPrice: d['Bid Price'] as number,
        askPrice: d['Ask Price'] as number,
        spread: d.Spread as number,
        vwap: d.VWAP as number,
      })) || [];
      
      setCompareData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setIsLoading(false);
  };

  // Sort data
  const sortedData = [...compareData].sort((a, b) => {
    if (!sortBy) return 0;
    const aVal = (a as unknown as Record<string, number>)[sortBy] || 0;
    const bVal = (b as unknown as Record<string, number>)[sortBy] || 0;
    return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
  });

  // Format value based on type
  const formatValue = (value: unknown, format: string) => {
    if (value === null || value === undefined) return 'N/A';
    const num = value as number;
    switch (format) {
      case 'currency':
        return formatCurrency(num);
      case 'percent':
        return formatPercent(num);
      case 'number':
        return num.toLocaleString();
      default:
        return String(value);
    }
  };

  // Get best/worst for highlighting
  const getBestWorst = (metricKey: string) => {
    const values = sortedData
      .map(d => ({ symbol: d.symbol, value: (d as unknown as Record<string, number>)[metricKey] }))
      .filter(v => v.value !== null && v.value !== undefined);
    
    if (values.length === 0) return { best: '', worst: '' };
    
    const sorted = [...values].sort((a, b) => b.value - a.value);
    return {
      best: sorted[0].symbol,
      worst: sorted[sorted.length - 1].symbol,
    };
  };

  // Download comparison
  const handleDownload = (format: 'xlsx' | 'csv') => {
    const headers = ['Metric', ...sortedData.map(d => d.symbol)];
    const rows = selectedMetrics.map(metricKey => {
      const metric = METRICS.find(m => m.key === metricKey)!;
      return [
        metric.label,
        ...sortedData.map(d => (d as unknown as Record<string, unknown>)[metricKey])
      ];
    });
    
    const data = [headers, ...rows];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comparison');
    
    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      const blob = new Blob([csv], { type: 'text/csv' });
      downloadBlob(blob, 'comparison.csv');
    } else {
      const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      downloadBlob(blob, 'comparison.xlsx');
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Fetch data when coins change
  useEffect(() => {
    fetchData();
  }, [selectedCoins]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">⚖️ Compare Cryptocurrencies</h1>
          <p className="text-gray-400">
            Select up to 10 coins for side-by-side comparison • No login required
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Category Filter */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <h3 className="font-semibold mb-3">Filter by Category</h3>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-white"
              >
                <option value="all">All Categories</option>
                <option value="layer1">Layer 1</option>
                <option value="layer2">Layer 2</option>
                <option value="defi">DeFi</option>
                <option value="gaming">Gaming</option>
                <option value="meme">Meme</option>
                <option value="payments">Payments</option>
                <option value="exchange">Exchange</option>
              </select>
            </div>

            {/* Coin Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-900">Select Coins ({selectedCoins.length}/10)</h3>
                <button 
                  onClick={() => setSelectedCoins([])}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear all
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto space-y-1">
                {filteredCoins.map(coin => (
                  <label
                    key={coin.symbol}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                      selectedCoins.includes(coin.symbol)
                        ? 'bg-orange-50 border border-orange-200'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedCoins.includes(coin.symbol)}
                      onChange={() => toggleCoin(coin.symbol)}
                      className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                    <div>
                      <span className="font-medium text-gray-900">{coin.symbol}</span>
                      <span className="text-xs text-gray-500 ml-2">{coin.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Metric Selection */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Select Metrics</h3>
              <div className="space-y-2">
                {METRICS.map(metric => (
                  <label
                    key={metric.key}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedMetrics.includes(metric.key)}
                      onChange={() => toggleMetric(metric.key)}
                      className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm text-gray-700">{metric.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Download Buttons */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-3">Download Comparison</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleDownload('xlsx')}
                  disabled={compareData.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  <DownloadIcon />
                  Excel
                </button>
                <button
                  onClick={() => handleDownload('csv')}
                  disabled={compareData.length === 0}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-900 text-white font-medium py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  <DownloadIcon />
                  CSV
                </button>
              </div>
            </div>
          </div>

          {/* Main Content - Comparison Table */}
          <div className="lg:col-span-3">
            {/* Selected Coins Bar */}
            {selectedCoins.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
                <div className="flex flex-wrap gap-2">
                  {selectedCoins.map(symbol => {
                    const coin = SUPPORTED_COINS.find(c => c.symbol === symbol);
                    return (
                      <span
                        key={symbol}
                        className="inline-flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1 rounded-full"
                      >
                        <img src={coin?.image} alt={symbol} className="w-5 h-5 rounded-full" />
                        {symbol}
                        <button
                          onClick={() => toggleCoin(symbol)}
                          className="hover:text-orange-900"
                        >
                          <XIcon />
                        </button>
                      </span>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comparison Table */}
            {isLoading ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 flex items-center justify-center">
                <SpinnerIcon />
                <span className="ml-2 text-gray-500">Loading comparison data...</span>
              </div>
            ) : compareData.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <p className="text-gray-500">Select coins from the left panel to compare</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="text-left py-4 px-4 font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10">
                          Metric
                        </th>
                        {sortedData.map(coin => (
                          <th key={coin.symbol} className="text-center py-4 px-4 min-w-[140px]">
                            <div className="flex flex-col items-center gap-2">
                              <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                              <span className="font-semibold text-gray-900">{coin.symbol}</span>
                              <span className="text-xs text-gray-500">{coin.name}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedMetrics.map((metricKey, idx) => {
                        const metric = METRICS.find(m => m.key === metricKey)!;
                        const { best, worst } = getBestWorst(metricKey);
                        
                        return (
                          <tr 
                            key={metricKey}
                            className={`border-b border-gray-100 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                          >
                            <td className="py-4 px-4 font-medium text-gray-700 sticky left-0 bg-inherit z-10">
                              <button
                                onClick={() => {
                                  if (sortBy === metricKey) {
                                    setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc');
                                  } else {
                                    setSortBy(metricKey);
                                    setSortOrder('desc');
                                  }
                                }}
                                className="flex items-center gap-1 hover:text-orange-600"
                              >
                                {metric.label}
                                {sortBy === metricKey && (
                                  <span className="text-orange-500">
                                    {sortOrder === 'desc' ? '↓' : '↑'}
                                  </span>
                                )}
                              </button>
                            </td>
                            {sortedData.map(coin => {
                              const value = (coin as unknown as Record<string, unknown>)[metricKey];
                              const isBest = coin.symbol === best && metricKey !== 'spread';
                              const isWorst = coin.symbol === worst && metricKey !== 'spread';
                              
                              return (
                                <td 
                                  key={coin.symbol}
                                  className={`py-4 px-4 text-center font-medium ${
                                    isBest ? 'text-green-600 bg-green-50' :
                                    isWorst ? 'text-red-600 bg-red-50' :
                                    'text-gray-900'
                                  }`}
                                >
                                  {formatValue(value, metric.format)}
                                  {isBest && <span className="ml-1">🏆</span>}
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Legend */}
            {compareData.length > 0 && (
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-green-100 border border-green-300 rounded"></span>
                  Best value 🏆
                </span>
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 bg-red-100 border border-red-300 rounded"></span>
                  Lowest value
                </span>
                <span className="text-gray-400">Click metric name to sort</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
