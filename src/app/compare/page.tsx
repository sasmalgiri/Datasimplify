'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency?: number;
  total_volume: number;
  circulating_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
}

// Top coins for selection
const TOP_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png' },
  { id: 'solana', symbol: 'SOL', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/small/solana.png' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/small/cardano.png' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png' },
  { id: 'tron', symbol: 'TRX', name: 'TRON', image: 'https://assets.coingecko.com/coins/images/1094/small/tron-logo.png' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin', image: 'https://assets.coingecko.com/coins/images/2/small/litecoin.png' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap', image: 'https://assets.coingecko.com/coins/images/12504/small/uni.jpg' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos', image: 'https://assets.coingecko.com/coins/images/1481/small/cosmos_hub.png' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar', image: 'https://assets.coingecko.com/coins/images/100/small/Stellar_symbol_black_RGB.png' },
];

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['bitcoin', 'ethereum', 'solana']);
  const [coinData, setCoinData] = useState<CoinData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchCoinData();
  }, [selectedIds]);

  const fetchCoinData = async () => {
    if (selectedIds.length === 0) {
      setCoinData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const ids = selectedIds.join(',');
      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h,7d`
      );
      const data = await response.json();
      setCoinData(data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setIsLoading(false);
  };

  const toggleCoin = (id: string) => {
    setSelectedIds(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= 10) {
        alert('Maximum 10 coins for comparison');
        return prev;
      }
      return [...prev, id];
    });
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1) return `$${num.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    return `$${num.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
  };

  const formatSupply = (num: number | null) => {
    if (num === null) return 'N/A';
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const downloadExcel = () => {
    const headers = ['Metric', ...coinData.map(c => c.symbol.toUpperCase())];
    const rows = [
      ['Price', ...coinData.map(c => c.current_price)],
      ['Market Cap', ...coinData.map(c => c.market_cap)],
      ['24h Change %', ...coinData.map(c => c.price_change_percentage_24h)],
      ['Volume (24h)', ...coinData.map(c => c.total_volume)],
      ['Circulating Supply', ...coinData.map(c => c.circulating_supply)],
      ['Max Supply', ...coinData.map(c => c.max_supply || 'N/A')],
      ['ATH', ...coinData.map(c => c.ath)],
      ['ATH Change %', ...coinData.map(c => c.ath_change_percentage)],
    ];

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comparison');
    XLSX.writeFile(wb, `crypto-comparison-${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl">📊</span>
              <span className="text-xl font-bold text-emerald-400">DataSimplify</span>
            </Link>
            <div className="flex items-center gap-6">
              <Link href="/market" className="text-gray-300 hover:text-white">Market</Link>
              <Link href="/compare" className="text-emerald-400 font-medium">Compare</Link>
              <Link href="/chat" className="text-gray-300 hover:text-white">AI Chat</Link>
              <Link href="/glossary" className="text-gray-300 hover:text-white">Glossary</Link>
              <Link href="/learn" className="text-gray-300 hover:text-white">Learn</Link>
              <Link href="/pricing" className="text-gray-300 hover:text-white">Pricing</Link>
              <Link href="/login" className="px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <span>⚖️</span> Compare Cryptocurrencies
          </h1>
          <p className="text-gray-400">Select up to 10 coins for side-by-side comparison • No login required</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Panel - Coin Selection */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-400 mb-2">Filter by Category</label>
                <select 
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white"
                >
                  <option value="all">All Categories</option>
                  <option value="layer1">Layer 1</option>
                  <option value="defi">DeFi</option>
                  <option value="meme">Meme</option>
                </select>
              </div>

              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-medium">Select Coins ({selectedIds.length}/10)</span>
                <button 
                  onClick={() => setSelectedIds([])}
                  className="text-xs text-gray-400 hover:text-white"
                >
                  Clear all
                </button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {TOP_COINS.map(coin => (
                  <label
                    key={coin.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition ${
                      selectedIds.includes(coin.id) 
                        ? 'bg-emerald-500/20 border border-emerald-500/50' 
                        : 'hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(coin.id)}
                      onChange={() => toggleCoin(coin.id)}
                      className="w-4 h-4 rounded bg-gray-700 border-gray-600 text-emerald-500 focus:ring-emerald-500"
                    />
                    <img src={coin.image} alt={coin.name} className="w-6 h-6 rounded-full" />
                    <div>
                      <span className="font-medium">{coin.symbol}</span>
                      <span className="text-gray-400 text-sm ml-2">{coin.name}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel - Comparison */}
          <div className="lg:col-span-3">
            {/* Selected Coins Tags */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
              <div className="flex flex-wrap gap-2">
                {selectedIds.map(id => {
                  const coin = TOP_COINS.find(c => c.id === id);
                  return coin ? (
                    <span 
                      key={id}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-gray-700 rounded-full"
                    >
                      <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full" />
                      <span>{coin.symbol}</span>
                      <button 
                        onClick={() => toggleCoin(id)}
                        className="text-gray-400 hover:text-white"
                      >
                        ×
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>

            {/* Comparison Table */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading comparison data...</p>
                </div>
              ) : coinData.length === 0 ? (
                <div className="p-12 text-center text-gray-400">
                  Select coins from the left panel to compare
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-900">
                      <tr>
                        <th className="text-left px-4 py-3 text-gray-400 font-medium">Metric</th>
                        {coinData.map(coin => (
                          <th key={coin.id} className="text-right px-4 py-3 text-white font-medium">
                            <div className="flex items-center justify-end gap-2">
                              <img src={coin.image} alt={coin.name} className="w-5 h-5 rounded-full" />
                              {coin.symbol.toUpperCase()}
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-gray-700">
                        <td className="px-4 py-3 text-gray-400">Price</td>
                        {coinData.map(coin => (
                          <td key={coin.id} className="px-4 py-3 text-right font-mono">
                            {formatNumber(coin.current_price)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-gray-700 bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-400">24h Change</td>
                        {coinData.map(coin => (
                          <td key={coin.id} className={`px-4 py-3 text-right font-medium ${
                            coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-gray-700">
                        <td className="px-4 py-3 text-gray-400">Market Cap</td>
                        {coinData.map(coin => (
                          <td key={coin.id} className="px-4 py-3 text-right">
                            {formatNumber(coin.market_cap)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-gray-700 bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-400">Volume (24h)</td>
                        {coinData.map(coin => (
                          <td key={coin.id} className="px-4 py-3 text-right">
                            {formatNumber(coin.total_volume)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-gray-700">
                        <td className="px-4 py-3 text-gray-400">Circulating Supply</td>
                        {coinData.map(coin => (
                          <td key={coin.id} className="px-4 py-3 text-right">
                            {formatSupply(coin.circulating_supply)} {coin.symbol.toUpperCase()}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-gray-700 bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-400">Max Supply</td>
                        {coinData.map(coin => (
                          <td key={coin.id} className="px-4 py-3 text-right">
                            {coin.max_supply ? formatSupply(coin.max_supply) : '∞'}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-gray-700">
                        <td className="px-4 py-3 text-gray-400">All-Time High</td>
                        {coinData.map(coin => (
                          <td key={coin.id} className="px-4 py-3 text-right font-mono">
                            {formatNumber(coin.ath)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-t border-gray-700 bg-gray-800/50">
                        <td className="px-4 py-3 text-gray-400">From ATH</td>
                        {coinData.map(coin => (
                          <td key={coin.id} className="px-4 py-3 text-right text-red-400">
                            {coin.ath_change_percentage?.toFixed(2)}%
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {/* Download Button */}
              {coinData.length > 0 && (
                <div className="p-4 border-t border-gray-700 flex justify-end">
                  <button
                    onClick={downloadExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download Excel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Data provided by CoinGecko API • Real-time prices</p>
        </div>
      </div>
    </div>
  );
}
