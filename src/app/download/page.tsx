'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { DATA_CATEGORIES, SUPPORTED_COINS, DataCategory, getFieldDisplayName } from '@/lib/dataTypes';

// Progress bar component using ref to avoid inline style warnings
function ProgressBarRef({ percentage, className }: { percentage: number; className: string }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--progress-width', `${percentage}%`);
    }
  }, [percentage]);

  return <div ref={barRef} className={`${className} progress-bar`} />;
}

// Icons (inline SVG for simplicity)
const DownloadIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Help Icon with Tooltip
function HelpTooltip({ text }: { text: string }) {
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
        <span className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 text-sm text-white bg-gray-900 rounded-lg shadow-2xl border border-emerald-500/50 min-w-[250px] max-w-[350px] text-left whitespace-normal">
          {text}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></span>
        </span>
      )}
    </span>
  );
}

// Category explanations for tooltips
const CATEGORY_EXPLANATIONS: Record<string, string> = {
  'all': 'Show all available cryptocurrencies without any filter',
  'layer1': 'Base blockchain networks like Bitcoin, Ethereum, Solana that process transactions directly',
  'layer2': 'Solutions built on top of Layer 1 to improve speed and reduce costs (e.g., Polygon, Arbitrum)',
  'defi': 'Decentralized Finance tokens for lending, trading, and earning interest without banks',
  'gaming': 'Tokens used in blockchain games and virtual worlds (metaverse)',
  'meme': 'Community-driven tokens often started as jokes (e.g., Dogecoin, Shiba Inu)',
  'exchange': 'Tokens issued by crypto exchanges (e.g., BNB, FTT)',
  'payments': 'Cryptocurrencies designed for fast, cheap payments (e.g., XRP, Litecoin)'
};

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
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // New customization options
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [minVolume, setMinVolume] = useState('');
  const [numberFormat, setNumberFormat] = useState<'full' | 'abbreviated' | 'scientific'>('abbreviated');
  const [decimalPlaces, setDecimalPlaces] = useState('2');
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [columnRenames, setColumnRenames] = useState<Record<string, string>>({});

  // Get category info
  const categoryInfo = DATA_CATEGORIES.find(c => c.id === selectedCategory);

  // Initialize selected fields when category changes
  useEffect(() => {
    if (categoryInfo?.fields) {
      setSelectedFields(categoryInfo.fields);
    }
  }, [selectedCategory, categoryInfo]);

  // Toggle field selection
  const toggleField = (field: string) => {
    setSelectedFields(prev => 
      prev.includes(field)
        ? prev.filter(f => f !== field)
        : [...prev, field]
    );
  };

  // Select/Deselect all fields
  const selectAllFields = () => {
    if (categoryInfo?.fields) {
      setSelectedFields(categoryInfo.fields);
    }
  };

  const deselectAllFields = () => {
    setSelectedFields([]);
  };

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

  // Filter preview data to only show selected fields
  const filteredPreviewData = previewData?.map(row => {
    const filtered: Record<string, unknown> = {};
    selectedFields.forEach(field => {
      if (Object.prototype.hasOwnProperty.call(row, field)) {
        filtered[field] = row[field];
      }
    });
    return filtered;
  });

  // Get first selected coin for dependency tracking
  const firstSelectedCoin = selectedCoins[0] || 'BTC';

  // Fetch preview data
  const fetchPreview = async () => {
    setIsLoading(true);
    try {
      let url = `/api/download?category=${selectedCategory}&format=json&preview=true`;

      // Build URL based on category
      if (selectedCategory === 'market_overview') {
        if (selectedCoins.length > 0) url += `&symbols=${selectedCoins.join(',')}`;
        if (selectedCoinCategory !== 'all') url += `&coinCategory=${selectedCoinCategory}`;
        url += `&sortBy=${sortBy}&minMarketCap=${minMarketCap}`;
      } else if (selectedCategory === 'historical_prices') {
        url += `&symbol=${firstSelectedCoin}&interval=${selectedInterval}&limit=${selectedLimit}`;
      } else if (selectedCategory === 'order_book') {
        url += `&symbol=${firstSelectedCoin}&depth=${selectedDepth}`;
      } else if (selectedCategory === 'recent_trades') {
        url += `&symbol=${firstSelectedCoin}&limit=${selectedLimit}`;
      } else if (selectedCategory === 'gainers_losers') {
        url += `&type=${selectedGainerType}&limit=${selectedLimit}`;
      } else if (selectedCategory === 'sentiment_coin') {
        url += `&symbol=${firstSelectedCoin}`;
      } else if (selectedCategory === 'sentiment_news') {
        url += `&filter=hot`;
      }
      // Derivatives data
      else if (['funding_rates', 'open_interest', 'long_short_ratio', 'liquidations'].includes(selectedCategory)) {
        if (selectedCoins.length > 0) url += `&symbols=${selectedCoins.join(',')}`;
      }
      // Technical analysis
      else if (['technical_indicators', 'correlation_matrix', 'support_resistance'].includes(selectedCategory)) {
        if (selectedCoins.length > 0) url += `&symbols=${selectedCoins.join(',')}`;
      }
      // Token economics
      else if (selectedCategory === 'token_unlocks') {
        url += `&limit=${selectedLimit}`;
      }
      // NFT data
      else if (selectedCategory === 'nft_collections') {
        url += `&limit=${selectedLimit}`;
      }
      // Other categories with limit support
      else if (['defi_protocols', 'defi_yields', 'categories'].includes(selectedCategory)) {
        url += `&limit=${selectedLimit}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setPreviewData(data.data?.slice(0, 5) || []);
    } catch (error) {
      console.error('Preview error:', error);
    }
    setIsLoading(false);
  };

  // Auto-fetch preview when filters change (debounced)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPreview();
    }, 500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, firstSelectedCoin, selectedInterval, selectedLimit, selectedDepth, selectedGainerType]);

  // Download data
  const handleDownload = async () => {
    setIsLoading(true);
    try {
      let url = `/api/download?category=${selectedCategory}&format=${selectedFormat}`;

      // Build URL based on category
      if (selectedCategory === 'market_overview') {
        if (selectedCoins.length > 0) url += `&symbols=${selectedCoins.join(',')}`;
        if (selectedCoinCategory !== 'all') url += `&coinCategory=${selectedCoinCategory}`;
        url += `&sortBy=${sortBy}&minMarketCap=${minMarketCap}`;
      } else if (selectedCategory === 'historical_prices') {
        url += `&symbol=${firstSelectedCoin}&interval=${selectedInterval}&limit=${selectedLimit}`;
      } else if (selectedCategory === 'order_book') {
        url += `&symbol=${firstSelectedCoin}&depth=${selectedDepth}`;
      } else if (selectedCategory === 'recent_trades') {
        url += `&symbol=${firstSelectedCoin}&limit=${selectedLimit}`;
      } else if (selectedCategory === 'gainers_losers') {
        url += `&type=${selectedGainerType}&limit=${selectedLimit}`;
      } else if (selectedCategory === 'sentiment_coin') {
        url += `&symbol=${firstSelectedCoin}`;
      } else if (selectedCategory === 'sentiment_news') {
        url += `&filter=hot`;
      }
      // Derivatives data
      else if (['funding_rates', 'open_interest', 'long_short_ratio', 'liquidations'].includes(selectedCategory)) {
        if (selectedCoins.length > 0) url += `&symbols=${selectedCoins.join(',')}`;
      }
      // Technical analysis
      else if (['technical_indicators', 'correlation_matrix', 'support_resistance'].includes(selectedCategory)) {
        if (selectedCoins.length > 0) url += `&symbols=${selectedCoins.join(',')}`;
      }
      // Token economics
      else if (selectedCategory === 'token_unlocks') {
        url += `&limit=${selectedLimit}`;
      }
      // NFT data
      else if (selectedCategory === 'nft_collections') {
        url += `&limit=${selectedLimit}`;
      }
      // Other categories with limit support
      else if (['defi_protocols', 'defi_yields', 'categories'].includes(selectedCategory)) {
        url += `&limit=${selectedLimit}`;
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

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Header */}
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="text-xl font-bold text-emerald-400">DataSimplify</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/market" className="text-gray-300 hover:text-white transition-colors">Market</Link>
            <Link href="/compare" className="text-gray-300 hover:text-white transition-colors">Compare</Link>
            <Link href="/download" className="text-emerald-400 font-medium">Download</Link>
            <Link href="/chat" className="text-gray-300 hover:text-white transition-colors">AI Chat</Link>
            <Link href="/glossary" className="text-gray-300 hover:text-white transition-colors">Glossary</Link>
            <Link href="/learn" className="text-gray-300 hover:text-white transition-colors">Learn</Link>
            <Link href="/pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</Link>
            <Link href="/login" className="px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600 transition-colors">
              Login
            </Link>
          </div>
        </div>
      </nav>

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
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                1️⃣ Select Data Type
                <HelpTooltip text="Choose what kind of data you want to download. Each type contains different information about cryptocurrencies." />
              </h2>
              <div className="space-y-2">
                {DATA_CATEGORIES.filter(c => !c.isPremium).map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedCategory === category.id
                        ? 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'
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
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                2️⃣ Select Format
                <HelpTooltip text="XLSX works with Excel/Google Sheets. CSV is universal and works anywhere. JSON is for programmers and APIs." />
              </h2>
              <div className="flex space-x-2">
                {(['xlsx', 'csv', 'json'] as const).map(format => (
                  <button
                    key={format}
                    onClick={() => setSelectedFormat(format)}
                    className={`flex-1 py-2 px-3 rounded-lg font-medium transition ${
                      selectedFormat === format
                        ? 'bg-emerald-500 text-white'
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

              {/* Advanced Options */}
              <details className="mt-4">
                <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 flex items-center gap-2">
                  <span>⚙️ Advanced Options</span>
                </summary>
                <div className="mt-3 space-y-4 pt-3 border-t border-gray-800">
                  {/* Number Format */}
                  <div>
                    <label htmlFor="number-format" className="flex items-center text-sm text-gray-400 mb-2">
                      Number Format
                      <HelpTooltip text="Choose how numbers are displayed in your export" />
                    </label>
                    <select
                      id="number-format"
                      value={numberFormat}
                      onChange={(e) => setNumberFormat(e.target.value as 'full' | 'abbreviated' | 'scientific')}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="abbreviated">Abbreviated ($1.5M, $2.3B)</option>
                      <option value="full">Full Numbers (1500000)</option>
                      <option value="scientific">Scientific (1.5e6)</option>
                    </select>
                  </div>

                  {/* Decimal Places */}
                  <div>
                    <label htmlFor="decimal-places" className="flex items-center text-sm text-gray-400 mb-2">
                      Decimal Places
                      <HelpTooltip text="How many decimal places to show for numbers" />
                    </label>
                    <select
                      id="decimal-places"
                      value={decimalPlaces}
                      onChange={(e) => setDecimalPlaces(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
                    >
                      <option value="0">0 (No decimals)</option>
                      <option value="2">2 (Standard)</option>
                      <option value="4">4 (Precise)</option>
                      <option value="8">8 (Crypto prices)</option>
                    </select>
                  </div>

                  {/* Metadata Toggle (XLSX only) */}
                  {selectedFormat === 'xlsx' && (
                    <div className="flex items-center justify-between">
                      <label htmlFor="include-metadata" className="flex items-center text-sm text-gray-400">
                        Include Metadata Sheet
                        <HelpTooltip text="Add a second sheet with export info (date, source, etc.)" />
                      </label>
                      <button
                        id="include-metadata"
                        type="button"
                        onClick={() => setIncludeMetadata(!includeMetadata)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          includeMetadata ? 'bg-emerald-500' : 'bg-gray-600'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            includeMetadata ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </details>
            </div>
          </div>

          {/* Middle Column - Filters */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <h2 className="text-lg font-semibold text-white mb-4 flex items-center">
                3️⃣ Customize Filters
                <HelpTooltip text="Use these filters to narrow down the data you want to download. Each filter helps you get exactly what you need." />
              </h2>

              {/* Market Overview Filters */}
              {selectedCategory === 'market_overview' && (
                <div className="space-y-4">
                  {/* Category Filter */}
                  <div>
                    <label htmlFor="coin-category" className="flex items-center text-sm text-gray-400 mb-2">
                      Coin Category
                      <HelpTooltip text={CATEGORY_EXPLANATIONS[selectedCoinCategory] || 'Filter coins by their type or use case'} />
                    </label>
                    <select
                      id="coin-category"
                      value={selectedCoinCategory}
                      onChange={(e) => setSelectedCoinCategory(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="all">All Categories</option>
                      <option value="layer1">Layer 1 (Base blockchains)</option>
                      <option value="layer2">Layer 2 (Scaling solutions)</option>
                      <option value="defi">DeFi (Decentralized Finance)</option>
                      <option value="gaming">Gaming/Metaverse</option>
                      <option value="meme">Meme Coins</option>
                      <option value="exchange">Exchange Tokens</option>
                      <option value="payments">Payments</option>
                    </select>
                  </div>
                  
                  {/* Sort By */}
                  <div>
                    <label htmlFor="sort-by" className="flex items-center text-sm text-gray-400 mb-2">
                      Sort By
                      <HelpTooltip text="Choose how to order the coins in your download. Market Cap shows the biggest coins first." />
                    </label>
                    <select
                      id="sort-by"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="market_cap">Market Cap (Total Value)</option>
                      <option value="volume">24h Volume (Trading Activity)</option>
                      <option value="price_change">Price Change % (Performance)</option>
                      <option value="price">Price (Current USD Value)</option>
                    </select>
                  </div>

                  {/* Min Market Cap */}
                  <div>
                    <label htmlFor="min-market-cap" className="flex items-center text-sm text-gray-400 mb-2">
                      Min Market Cap
                      <HelpTooltip text="Filter out small coins. $1B+ shows only large, established cryptocurrencies. Smaller caps are riskier but may have more growth potential." />
                    </label>
                    <select
                      id="min-market-cap"
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
                  
                  {/* Value Filters */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="min-price" className="flex items-center text-sm text-gray-400 mb-2">
                        Min Price
                        <HelpTooltip text="Only include coins with price above this value" />
                      </label>
                      <input
                        id="min-price"
                        type="number"
                        placeholder="e.g., 0.01"
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="max-price" className="flex items-center text-sm text-gray-400 mb-2">
                        Max Price
                        <HelpTooltip text="Only include coins with price below this value" />
                      </label>
                      <input
                        id="max-price"
                        type="number"
                        placeholder="e.g., 100000"
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>

                  {/* Min Volume Filter */}
                  <div>
                    <label htmlFor="min-volume" className="flex items-center text-sm text-gray-400 mb-2">
                      Min 24h Volume
                      <HelpTooltip text="Only include coins with 24h trading volume above this value" />
                    </label>
                    <select
                      id="min-volume"
                      value={minVolume}
                      onChange={(e) => setMinVolume(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="">Any</option>
                      <option value="1000000">$1M+</option>
                      <option value="10000000">$10M+</option>
                      <option value="100000000">$100M+</option>
                      <option value="1000000000">$1B+</option>
                    </select>
                  </div>

                  {/* Coin Selection */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-400">Select Coins ({selectedCoins.length} selected)</label>
                      <div className="space-x-2">
                        <button onClick={selectAllCoins} className="text-xs text-emerald-400 hover:text-orange-300">
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
                            className="w-4 h-4 rounded border-gray-600 text-emerald-500 focus:ring-emerald-500"
                          />
                          <Image src={coin.image} alt={coin.name} width={20} height={20} className="rounded-full" />
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
                    <label htmlFor="historical-coin" className="block text-sm text-gray-400 mb-2">Select Coin</label>
                    <select
                      id="historical-coin"
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
                    <label htmlFor="time-interval" className="block text-sm text-gray-400 mb-2">Time Interval</label>
                    <select
                      id="time-interval"
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
                    <label htmlFor="num-candles" className="block text-sm text-gray-400 mb-2">Number of Candles</label>
                    <select
                      id="num-candles"
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

                  {/* Date Range Picker */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="start-date" className="flex items-center text-sm text-gray-400 mb-2">
                        Start Date
                        <HelpTooltip text="Filter data starting from this date. Leave empty to get the most recent data." />
                      </label>
                      <input
                        id="start-date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="end-date" className="flex items-center text-sm text-gray-400 mb-2">
                        End Date
                        <HelpTooltip text="Filter data up to this date. Leave empty for current date." />
                      </label>
                      <input
                        id="end-date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Book Filters */}
              {selectedCategory === 'order_book' && (
                <div className="space-y-4">
                  <div>
                    <label htmlFor="orderbook-coin" className="block text-sm text-gray-400 mb-2">Select Coin</label>
                    <select
                      id="orderbook-coin"
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
                    <label htmlFor="orderbook-depth" className="block text-sm text-gray-400 mb-2">Order Book Depth</label>
                    <select
                      id="orderbook-depth"
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
                    <label htmlFor="trades-coin" className="block text-sm text-gray-400 mb-2">Select Coin</label>
                    <select
                      id="trades-coin"
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
                    <label htmlFor="num-trades" className="block text-sm text-gray-400 mb-2">Number of Trades</label>
                    <select
                      id="num-trades"
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
                    <label htmlFor="gainer-type" className="block text-sm text-gray-400 mb-2">Show</label>
                    <select
                      id="gainer-type"
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
                    <label htmlFor="num-coins" className="block text-sm text-gray-400 mb-2">Number of Coins</label>
                    <select
                      id="num-coins"
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
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition disabled:opacity-50"
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">📋 Data Preview</h2>
                <button
                  onClick={fetchPreview}
                  disabled={isLoading}
                  className="text-xs px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {isLoading ? 'Loading...' : '🔄 Refresh'}
                </button>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <SpinnerIcon />
                  <span className="ml-2 text-gray-400">Loading preview...</span>
                </div>
              ) : filteredPreviewData && filteredPreviewData.length > 0 && selectedFields.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-800">
                        {selectedFields.slice(0, 5).map(key => (
                          <th key={key} className="text-left text-emerald-400 py-2 px-2 font-medium text-xs" title={key}>
                            {getFieldDisplayName(key)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPreviewData.slice(0, 5).map((row, i) => (
                        <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                          {selectedFields.slice(0, 5).map((field, j) => (
                            <td key={j} className="text-gray-300 py-2 px-2 text-xs truncate max-w-[100px]" title={String(row[field] ?? '')}>
                              {row[field] !== undefined
                                ? typeof row[field] === 'number'
                                  ? (row[field] as number) > 1000000
                                    ? `$${((row[field] as number) / 1000000).toFixed(2)}M`
                                    : (row[field] as number) > 1
                                      ? (row[field] as number).toFixed(2)
                                      : (row[field] as number).toFixed(6)
                                  : String(row[field]).slice(0, 15)
                                : '-'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                    <span>Showing {Math.min(5, filteredPreviewData.length)} rows × {Math.min(5, selectedFields.length)} fields</span>
                    {selectedFields.length > 5 && (
                      <span className="text-emerald-400">+{selectedFields.length - 5} more fields in download</span>
                    )}
                  </div>
                </div>
              ) : selectedFields.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-yellow-400 text-sm">⚠️ Select at least 1 field</p>
                  <p className="text-gray-500 text-xs mt-1">Choose fields from &quot;Select Fields&quot; below</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">No preview available</p>
                  <button
                    onClick={fetchPreview}
                    className="mt-2 text-xs text-emerald-400 hover:underline"
                  >
                    Click to load preview
                  </button>
                </div>
              )}
            </div>

            {/* Data Fields Info - Now Interactive! */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-white">📄 Select Fields</h2>
                <div className="flex gap-2">
                  <button
                    onClick={selectAllFields}
                    className="text-xs px-2 py-1 bg-emerald-600/20 text-emerald-400 rounded hover:bg-emerald-600/30 transition"
                  >
                    All
                  </button>
                  <button
                    onClick={deselectAllFields}
                    className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded hover:bg-gray-600 transition"
                  >
                    None
                  </button>
                </div>
              </div>
              
              {/* Toggleable Fields */}
              <div className="flex flex-wrap gap-2">
                {categoryInfo?.fields.map(field => {
                  const isSelected = selectedFields.includes(field);
                  return (
                    <button
                      key={field}
                      onClick={() => toggleField(field)}
                      title={field}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                        isSelected
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                          : 'bg-gray-800 border-gray-700 text-gray-500 hover:border-gray-600'
                      }`}
                    >
                      {isSelected && <span className="mr-1">✓</span>}
                      {getFieldDisplayName(field)}
                    </button>
                  );
                })}
              </div>
              
              {/* Selected count */}
              <p className="text-xs text-gray-500 mt-3">
                {selectedFields.length} of {categoryInfo?.fields.length || 0} fields selected
              </p>
              
              <div className="mt-4 pt-4 border-t border-gray-800">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Source:</span>
                  <span className="text-emerald-400">{categoryInfo?.source}</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-2">
                  <span className="text-gray-500">Update Frequency:</span>
                  <span className="text-gray-300">{categoryInfo?.updateFrequency}</span>
                </div>
              </div>
            </div>

            {/* Usage Stats */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-xl border border-emerald-500/20 p-6">
              <h2 className="text-lg font-semibold text-white mb-4">⚡ Your Usage</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Downloads today:</span>
                  <span className="text-white font-medium">{downloadCount}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Plan:</span>
                  <span className="text-emerald-400 font-medium">Free Tier</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Limit:</span>
                  <span className="text-white font-medium">5 downloads/month</span>
                </div>
                {/* Progress bar */}
                <div className="mt-2">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Used: {downloadCount}/5</span>
                    <span>{Math.max(0, 5 - downloadCount)} remaining</span>
                  </div>
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                    <ProgressBarRef
                      percentage={Math.min((downloadCount / 5) * 100, 100)}
                      className="h-full bg-emerald-500"
                    />
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                💡 <a href="/signup" className="text-emerald-400 hover:underline">Create an account</a> to track your usage and unlock more downloads!
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
