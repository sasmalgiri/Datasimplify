'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DATA_CATEGORIES, SUPPORTED_COINS, DataCategory } from '@/lib/dataTypes';

// Icons (inline SVG for simplicity)
const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function DownloadPage() {
  // State
  const [selectedCategory, setSelectedCategory] = useState<DataCategory>('market_overview');
  const [selectedCoins, setSelectedCoins] = useState<string[]>([]);
  const [selectedCoinCategory, setSelectedCoinCategory] = useState('all');
  const [selectedInterval, setSelectedInterval] = useState('1d');
  const [selectedLimit, setSelectedLimit] = useState('500');
  const [selectedDepth, setSelectedDepth] = useState('20');
  const [selectedGainerType, setSelectedGainerType] = useState('both');
  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'csv' | 'json'>('xlsx');
  const [sortBy, setSortBy] = useState('market_cap');
  const [minMarketCap, setMinMarketCap] = useState('0');
  const [isLoading, setIsLoading] = useState(false);
  const [downloadCount, setDownloadCount] = useState(0);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[] | null>(null);

  // Get category info
  const categoryInfo = DATA_CATEGORIES.find(c => c.id === selectedCategory);

  // Get unique coin categories
  const coinCategories = ['all', ...new Set(SUPPORTED_COINS.map(c => c.category))];
  
  // Filter coins by category
  const filteredCoins = selectedCoinCategory === 'all' 
    ? SUPPORTED_COINS 
    : SUPPORTED_COINS.filter(c => c.category === selectedCoinCategory);

  // Select/Deselect all coins
  const selectAllCoins = () => {
    setSelectedCoins(filteredCoins.map(c => c.symbol));
  };

  const deselectAllCoins = () => {
    setSelectedCoins([]);
  };

  // Toggle coin selection
  const toggleCoin = (symbol: string) => {
    setSelectedCoins(prev => 
      prev.includes(symbol) 
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  // Fetch preview data
  const fetchPreview = async () => {
    setIsLoading(true);
    try {
      let url = `/api/download?category=${selectedCategory}&format=json&preview=true`;
      
      if (selectedCategory === 'market_overview') {
        if (selectedCoins.length > 0) url += `&symbols=${selectedCoins.join(',')}`;
        if (selectedCoinCategory !== 'all') url += `&coinCategory=${selectedCoinCategory}`;
        url += `&sortBy=${sortBy}&minMarketCap=${minMarketCap}`;
      } else if (selectedCategory === 'historical_prices') {
        url += `&symbol=${selectedCoins[0] || 'BTC'}&interval=${selectedInterval}&limit=${selectedLimit}`;
      } else if (selectedCategory === 'order_book') {
        url += `&symbol=${selectedCoins[0] || 'BTC'}&depth=${selectedDepth}`;
      } else if (selectedCategory === 'recent_trades') {
        url += `&symbol=${selectedCoins[0] || 'BTC'}&limit=${selectedLimit}`;
      } else if (selectedCategory === 'gainers_losers') {
        url += `&type=${selectedGainerType}&limit=${selectedLimit}`;
      }
      
      const response = await fetch(url);
      const data = await response.json();
      setPreviewData(data.data?.slice(0, 5) || []);
    } catch (error) {
      console.error('Preview error:', error);
    }
    setIsLoading(false);
  };

  // Download data
  const handleDownload = async () => {
    setIsLoading(true);
    try {
      let url = `/api/download?category=${selectedCategory}&format=${selectedFormat}`;
      
      if (selectedCategory === 'market_overview') {
        if (selectedCoins.length > 0) url += `&symbols=${selectedCoins.join(',')}`;
        if (selectedCoinCategory !== 'all') url += `&coinCategory=${selectedCoinCategory}`;
        url += `&sortBy=${sortBy}&minMarketCap=${minMarketCap}`;
      } else if (selectedCategory === 'historical_prices') {
        url += `&symbol=${selectedCoins[0] || 'BTC'}&interval=${selectedInterval}&limit=${selectedLimit}`;
      } else if (selectedCategory === 'order_book') {
        url += `&symbol=${selectedCoins[0] || 'BTC'}&depth=${selectedDepth}`;
      } else if (selectedCategory === 'recent_trades') {
        url += `&symbol=${selectedCoins[0] || 'BTC'}&limit=${selectedLimit}`;
      } else if (selectedCategory === 'gainers_losers') {
        url += `&type=${selectedGainerType}&limit=${selectedLimit}`;
      }
      
      const response = await fetch(url);
      
      if (selectedFormat === 'json') {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `datasimplify_${selectedCategory}.json`);
      } else {
        const blob = await response.blob();
        const ext = selectedFormat === 'xlsx' ? 'xlsx' : 'csv';
        downloadBlob(blob, `datasimplify_${selectedCategory}.${ext}`);
      }
      
      setDownloadCount(prev => prev + 1);
    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed. Please try again.');
    }
    setIsLoading(false);
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

  // Load preview on category change
  useEffect(() => {
    fetchPreview();
  }, [selectedCategory, selectedCoins.slice(0, 1).join(','), selectedInterval, selectedLimit, selectedDepth, selectedGainerType]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">DS</span>
              </div>
              <span className="text-white font-semibold text-lg">DataSimplify</span>
            </Link>
            <nav className="flex items-center space-x-6">
              <Link href="/" className="text-gray-400 hover:text-white transition">Market</Link>
              <Link href="/download" className="text-orange-500 font-medium">Download Center</Link>
              <Link href="/pricing" className="text-gray-400 hover:text-white transition">Pricing</Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">📊 Download Center</h1>
          <p className="text-gray-400">
            Download real-time crypto data in Excel, CSV, or JSON format. No coding required!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Data Type Selection */}
          <div className="lg:col-span-1 space-y-6">
            {/* Data Category */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">1️⃣ Select Data Type</h2>
              <div className="space-y-2">
                {DATA_CATEGORIES.filter(c => !c.isPremium).map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedCategory === category.id
                        ? 'bg-orange-500/20 border border-orange-500 text-orange-400'
                        : 'bg-gray-800 border border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <div className="font-medium">{category.name}</div>
                    <div className="text-xs text-gray-500 mt-1">{category.description}</div>
                  </button>
                ))}
              </div>
              
              {/* Premium notice */}
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
                <p className="text-xs text-gray-500">
                  🔓 All data types are <span className="text-green-400">FREE</span> - powered by Binance API
                </p>
              </div>
            </div>

            {/* Format Selection */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">2️⃣ Select Format</h2>
              <div className="flex space-x-2">
                {(['xlsx', 'csv', 'json'] as const).map(format => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                      selectedFormat === format
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    }`}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {selectedFormat === 'xlsx' && '📊 Best for Excel, Google Sheets'}
                {selectedFormat === 'csv' && '📄 Universal format, works everywhere'}
                {selectedFormat === 'json' && '💻 Best for developers & APIs'}
              </p>
            </div>
          </div>

          {/* Middle Column - Filters */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">3️⃣ Customize Filters</h2>
              
              {/* Market Overview Filters */}
              {selectedCategory === 'market_overview' && (
                <div className="space-y-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Coin Category</label>
                    <select
                      value={selectedCoinCategory}
                      onChange={(e) => setSelectedCoinCategory(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="all">All Categories</option>
                      <option value="layer1">Layer 1</option>
                      <option value="layer2">Layer 2</option>
                      <option value="defi">DeFi</option>
                      <option value="gaming">Gaming/Metaverse</option>
                      <option value="meme">Meme Coins</option>
                      <option value="exchange">Exchange Tokens</option>
                      <option value="payments">Payments</option>
                    </select>
                  </div>
                  
                  {/* Sort By */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Sort By</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="market_cap">Market Cap</option>
                      <option value="volume">24h Volume</option>
                      <option value="price_change">Price Change %</option>
                      <option value="price">Price</option>
                    </select>
                  </div>
                  
                  {/* Min Market Cap */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Min Market Cap</label>
                    <select
                      value={minMarketCap}
                      onChange={(e) => setMinMarketCap(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="0">Any</option>
                      <option value="1000000000">$1B+</option>
                      <option value="100000000">$100M+</option>
                      <option value="10000000">$10M+</option>
                    </select>
                  </div>
                  
                  {/* Coin Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">Select Coins ({selectedCoins.length} selected)</label>
                      <div className="space-x-2">
                        <button onClick={selectAllCoins} className="text-xs text-orange-400 hover:text-orange-300">
                          Select All
                        </button>
                        <button onClick={deselectAllCoins} className="text-xs text-gray-500 hover:text-gray-400">
                          Clear
                        </button>
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto bg-gray-800 rounded-lg border border-gray-700 p-2 custom-scrollbar">
                      {filteredCoins.map(coin => (
                        <label
                          key={coin.symbol}
                          className="flex items-center space-x-2 p-2 hover:bg-gray-700 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCoins.includes(coin.symbol)}
                            onChange={() => toggleCoin(coin.symbol)}
                            className="w-4 h-4 rounded border-gray-600 text-orange-500 focus:ring-orange-500"
                          />
                          <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full" />
                          <span className="text-sm text-white">{coin.symbol}</span>
                          <span className="text-xs text-gray-500">{coin.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Historical Prices Filters */}
              {selectedCategory === 'historical_prices' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Select Coin</label>
                    <select
                      value={selectedCoins[0] || 'BTC'}
                      onChange={(e) => setSelectedCoins([e.target.value])}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      {SUPPORTED_COINS.map(coin => (
                        <option key={coin.symbol} value={coin.symbol}>
                          {coin.symbol} - {coin.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Time Interval</label>
                    <select
                      value={selectedInterval}
                      onChange={(e) => setSelectedInterval(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="1m">1 Minute</option>
                      <option value="5m">5 Minutes</option>
                      <option value="15m">15 Minutes</option>
                      <option value="30m">30 Minutes</option>
                      <option value="1h">1 Hour</option>
                      <option value="4h">4 Hours</option>
                      <option value="1d">1 Day</option>
                      <option value="1w">1 Week</option>
                      <option value="1M">1 Month</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Number of Candles</label>
                    <select
                      value={selectedLimit}
                      onChange={(e) => setSelectedLimit(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="100">100 candles</option>
                      <option value="200">200 candles</option>
                      <option value="500">500 candles</option>
                      <option value="1000">1000 candles (max)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Order Book Filters */}
              {selectedCategory === 'order_book' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Select Coin</label>
                    <select
                      value={selectedCoins[0] || 'BTC'}
                      onChange={(e) => setSelectedCoins([e.target.value])}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      {SUPPORTED_COINS.map(coin => (
                        <option key={coin.symbol} value={coin.symbol}>
                          {coin.symbol} - {coin.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Order Book Depth</label>
                    <select
                      value={selectedDepth}
                      onChange={(e) => setSelectedDepth(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="5">Top 5 orders</option>
                      <option value="10">Top 10 orders</option>
                      <option value="20">Top 20 orders</option>
                      <option value="50">Top 50 orders</option>
                      <option value="100">Top 100 orders</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Recent Trades Filters */}
              {selectedCategory === 'recent_trades' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Select Coin</label>
                    <select
                      value={selectedCoins[0] || 'BTC'}
                      onChange={(e) => setSelectedCoins([e.target.value])}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      {SUPPORTED_COINS.map(coin => (
                        <option key={coin.symbol} value={coin.symbol}>
                          {coin.symbol} - {coin.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Number of Trades</label>
                    <select
                      value={selectedLimit}
                      onChange={(e) => setSelectedLimit(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="50">50 trades</option>
                      <option value="100">100 trades</option>
                      <option value="500">500 trades</option>
                      <option value="1000">1000 trades (max)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Gainers/Losers Filters */}
              {selectedCategory === 'gainers_losers' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Show</label>
                    <select
                      value={selectedGainerType}
                      onChange={(e) => setSelectedGainerType(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="both">Both Gainers & Losers</option>
                      <option value="gainers">Top Gainers Only</option>
                      <option value="losers">Top Losers Only</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm text-gray-400 mb-2">Number of Coins</label>
                    <select
                      value={selectedLimit}
                      onChange={(e) => setSelectedLimit(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="10">Top 10</option>
                      <option value="20">Top 20</option>
                      <option value="50">Top 50</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Global Stats / Categories - No filters needed */}
              {(selectedCategory === 'global_stats' || selectedCategory === 'categories' || selectedCategory === 'exchange_info') && (
                <div className="text-center py-4">
                  <p className="text-gray-500">No additional filters needed for this data type.</p>
                  <p className="text-sm text-gray-600 mt-2">Click download to get the data!</p>
                </div>
              )}
            </div>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <SpinnerIcon />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <DownloadIcon />
                  <span>Download {selectedFormat.toUpperCase()}</span>
                </>
              )}
            </button>
          </div>

          {/* Right Column - Preview & Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Data Preview */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">📋 Data Preview</h2>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <SpinnerIcon />
                  <span className="ml-2 text-gray-400">Loading preview...</span>
                </div>
              ) : previewData && previewData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {Object.keys(previewData[0]).slice(0, 4).map(key => (
                          <th key={key} className="text-left text-gray-500 py-2 px-1">
                            {key}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, i) => (
                        <tr key={i} className="border-b border-gray-800/50">
                          {Object.values(row).slice(0, 4).map((val, j) => (
                            <td key={j} className="text-gray-300 py-2 px-1 truncate max-w-[100px]">
                              {typeof val === 'number' 
                                ? val > 1000000 
                                  ? `$${(val / 1000000).toFixed(2)}M`
                                  : val.toFixed(4)
                                : String(val).slice(0, 15)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-gray-600 mt-2">Showing first 5 rows...</p>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No preview available</p>
              )}
            </div>

            {/* Data Fields Info */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">📄 Included Fields</h2>
              <div className="flex flex-wrap gap-2">
                {categoryInfo?.fields.map(field => (
                  <span
                    key={field}
                    className="px-2 py-1 bg-gray-800 text-gray-400 text-xs rounded"
                  >
                    {field}
                  </span>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Source:</span>
                  <span className="text-orange-400">{categoryInfo?.source}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500">Update Frequency:</span>
                  <span className="text-gray-300">{categoryInfo?.updateFrequency}</span>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-xl border border-orange-500/20 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">⚡ Your Usage</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Downloads today:</span>
                  <span className="text-white font-medium">{downloadCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Plan:</span>
                  <span className="text-green-400 font-medium">Free (Unlimited)</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                ✨ All downloads are FREE - powered by Binance public API
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
