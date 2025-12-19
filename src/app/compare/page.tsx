'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Help icon with tooltip for coin selection
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
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  circulating_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
}

// Top coins to select from
const TOP_COINS = [
  { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
  { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
  { id: 'solana', symbol: 'SOL', name: 'Solana' },
  { id: 'binancecoin', symbol: 'BNB', name: 'BNB' },
  { id: 'ripple', symbol: 'XRP', name: 'XRP' },
  { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
  { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
  { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin' },
  { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
  { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
  { id: 'tron', symbol: 'TRX', name: 'TRON' },
  { id: 'litecoin', symbol: 'LTC', name: 'Litecoin' },
  { id: 'uniswap', symbol: 'UNI', name: 'Uniswap' },
  { id: 'matic-network', symbol: 'MATIC', name: 'Polygon' },
  { id: 'cosmos', symbol: 'ATOM', name: 'Cosmos' },
  { id: 'stellar', symbol: 'XLM', name: 'Stellar' },
];

export default function ComparePage() {
  const [selectedIds, setSelectedIds] = useState<string[]>(['bitcoin', 'ethereum', 'solana']);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchCoins = async () => {
    if (selectedIds.length === 0) {
      setCoins([]);
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const ids = selectedIds.join(',');
      const res = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc`
      );
      const data = await res.json();
      
      if (Array.isArray(data)) {
        setCoins(data);
      } else {
        setError('Failed to load data');
      }
    } catch (err) {
      setError('Failed to fetch data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoins();
  }, [selectedIds]);

  const toggleCoin = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else if (selectedIds.length < 10) {
      setSelectedIds([...selectedIds, id]);
    }
  };

  // Format helpers
  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })}`;
  };

  const formatLargeNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatSupply = (num: number) => {
    if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
    return num.toLocaleString();
  };

  const formatPercent = (pct: number) => {
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  };

  // Download as Excel/CSV
  const downloadExcel = () => {
    if (coins.length === 0) return;
    
    const headers = ['Name', 'Symbol', 'Price (USD)', '24h Change %', 'Market Cap', 'Volume (24h)', 'Circulating Supply', 'Max Supply', 'ATH', 'From ATH %'];
    const rows = coins.map(coin => [
      coin.name,
      coin.symbol.toUpperCase(),
      coin.current_price,
      coin.price_change_percentage_24h?.toFixed(2) || '0',
      coin.market_cap,
      coin.total_volume,
      coin.circulating_supply,
      coin.max_supply || 'Unlimited',
      coin.ath,
      coin.ath_change_percentage?.toFixed(2) || '0'
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto-comparison-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Find best/worst for highlighting
  const getBestWorst = (field: keyof Coin) => {
    if (coins.length === 0) return { best: '', worst: '' };
    const values = coins.map(c => ({ id: c.id, val: Number(c[field]) || 0 }));
    values.sort((a, b) => b.val - a.val);
    return { best: values[0]?.id, worst: values[values.length - 1]?.id };
  };

  const priceChangeBW = getBestWorst('price_change_percentage_24h');

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="text-xl font-bold text-emerald-400">DataSimplify</span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/market" className="text-gray-300 hover:text-white transition-colors">Market</Link>
            <Link href="/compare" className="text-emerald-400 font-medium">Compare</Link>
            <Link href="/download" className="text-gray-300 hover:text-white transition-colors">Download</Link>
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

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Compare Cryptocurrencies</h1>
            <p className="text-gray-400">Select up to 10 coins to compare side-by-side • No login required</p>
          </div>
          <button
            onClick={downloadExcel}
            disabled={coins.length === 0}
            className="mt-4 md:mt-0 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <span>📥</span> Download Excel
          </button>
        </div>

        {/* Beginner Tip */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-6">
          <p className="text-blue-300 text-sm flex items-start gap-2">
            <span>💡</span>
            <span>
              <strong>Beginner Tip:</strong> Compare coins to see which has better performance, market cap, or trading volume. 
              The <span className="text-green-400">green highlighted</span> values show the best performer in each category!
            </span>
          </p>
        </div>

        {/* Coin Selection */}
        <div className="bg-gray-800 rounded-xl p-6 mb-8 border border-gray-700">
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            Select Coins to Compare ({selectedIds.length}/10)
            <HelpIcon text="Click on any coin to add or remove it from comparison. You can select up to 10 coins at once. Selected coins appear in green." />
          </h2>
          <div className="flex flex-wrap gap-3">
            {TOP_COINS.map((coin) => {
              const isSelected = selectedIds.includes(coin.id);
              return (
                <button
                  key={coin.id}
                  onClick={() => toggleCoin(coin.id)}
                  className={`px-4 py-2 rounded-lg border transition-all ${
                    isSelected 
                      ? 'bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                      : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-600'
                  }`}
                >
                  <span className="font-medium">{coin.symbol}</span>
                  <span className="text-sm opacity-75 ml-1">({coin.name})</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 rounded-lg p-4 mb-6 text-red-300">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        )}

        {/* Column Guide - shown above table to avoid overflow clipping */}
        {!loading && coins.length > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700">
            <p className="text-gray-400 text-sm mb-2 font-medium">📊 Column Guide:</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <span className="text-gray-300"><span className="text-emerald-400 font-medium">Coin:</span> Name & symbol</span>
              <span className="text-gray-300"><span className="text-emerald-400 font-medium">Price:</span> Current USD price</span>
              <span className="text-gray-300"><span className="text-emerald-400 font-medium">24h Change:</span> Price change in 24h</span>
              <span className="text-gray-300"><span className="text-emerald-400 font-medium">Market Cap:</span> Price × Supply</span>
              <span className="text-gray-300"><span className="text-emerald-400 font-medium">Volume:</span> 24h trading activity</span>
              <span className="text-gray-300"><span className="text-emerald-400 font-medium">Circulating:</span> Coins in circulation</span>
              <span className="text-gray-300"><span className="text-emerald-400 font-medium">Max Supply:</span> Total coins ever</span>
              <span className="text-gray-300"><span className="text-emerald-400 font-medium">ATH:</span> All-time high price</span>
              <span className="text-gray-300"><span className="text-emerald-400 font-medium">From ATH:</span> Distance from peak</span>
            </div>
          </div>
        )}

        {/* Comparison Table */}
        {!loading && coins.length > 0 && (
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-900/50 border-b border-gray-700">
                    <th className="px-6 py-4 text-left text-emerald-400 font-medium">Coin</th>
                    <th className="px-6 py-4 text-right text-emerald-400 font-medium">Price</th>
                    <th className="px-6 py-4 text-right text-emerald-400 font-medium">24h Change</th>
                    <th className="px-6 py-4 text-right text-emerald-400 font-medium">Market Cap</th>
                    <th className="px-6 py-4 text-right text-emerald-400 font-medium">Volume (24h)</th>
                    <th className="px-6 py-4 text-right text-emerald-400 font-medium">Circulating Supply</th>
                    <th className="px-6 py-4 text-right text-emerald-400 font-medium">Max Supply</th>
                    <th className="px-6 py-4 text-right text-emerald-400 font-medium">ATH</th>
                    <th className="px-6 py-4 text-right text-emerald-400 font-medium">From ATH</th>
                  </tr>
                </thead>
                <tbody>
                  {coins.map((coin) => (
                    <tr 
                      key={coin.id} 
                      className="border-b border-gray-700 hover:bg-gray-700/50 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img 
                            src={coin.image} 
                            alt={coin.name} 
                            className="w-10 h-10 rounded-full group-hover:scale-110 transition-transform"
                          />
                          <div>
                            <span className="font-medium group-hover:text-emerald-400 transition-colors">{coin.name}</span>
                            <span className="text-gray-500 ml-2 uppercase text-sm">{coin.symbol}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">{formatPrice(coin.current_price)}</td>
                      <td className={`px-6 py-4 text-right font-medium ${
                        coin.id === priceChangeBW.best ? 'text-green-400 bg-green-400/10 rounded' :
                        coin.id === priceChangeBW.worst && coins.length > 2 ? 'text-red-400 bg-red-400/10 rounded' :
                        coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {formatPercent(coin.price_change_percentage_24h || 0)}
                        {coin.id === priceChangeBW.best && <span className="ml-1">🏆</span>}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">{formatLargeNumber(coin.market_cap)}</td>
                      <td className="px-6 py-4 text-right text-gray-300">{formatLargeNumber(coin.total_volume)}</td>
                      <td className="px-6 py-4 text-right text-gray-300">{formatSupply(coin.circulating_supply)}</td>
                      <td className="px-6 py-4 text-right text-gray-300">
                        {coin.max_supply ? formatSupply(coin.max_supply) : '∞'}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-300">{formatPrice(coin.ath)}</td>
                      <td className={`px-6 py-4 text-right ${coin.ath_change_percentage >= -10 ? 'text-green-400' : coin.ath_change_percentage >= -50 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {formatPercent(coin.ath_change_percentage || 0)}
                      </td>
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
          </div>
        )}

        {/* Legend */}
        <div className="mt-8 bg-gray-800/50 rounded-lg p-4 border border-gray-700">
          <h3 className="font-medium mb-2">Understanding the Data:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm text-gray-400">
            <div>
              <span className="text-green-400">🏆 Green highlight</span> = Best performer in that category
            </div>
            <div>
              <span className="text-yellow-400">Yellow</span> = Within 50% of ATH (close to peak)
            </div>
            <div>
              <span className="text-red-400">Red</span> = More than 50% below ATH
            </div>
            <div>
              <span>∞</span> = No maximum supply (inflationary token)
            </div>
            <div>
              <span>ATH</span> = All-Time High (highest price ever)
            </div>
            <div>
              <span>From ATH</span> = How far below the peak price
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Data from CoinGecko • Updates in real-time</p>
          <p className="mt-2">
            Need advanced comparisons? <Link href="/pricing" className="text-emerald-400 hover:underline">Upgrade to Pro</Link> for historical charts, more coins, and AI insights!
          </p>
        </div>
      </div>
    </div>
  );
}
