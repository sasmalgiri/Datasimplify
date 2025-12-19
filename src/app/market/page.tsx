'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

// Tooltip Component for hover explanations
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <span className="relative inline-flex items-center">
      <span
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help border-b border-dotted border-gray-500"
      >
        {children}
      </span>
      {isVisible && (
        <span className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg whitespace-nowrap shadow-lg">
          {text}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></span>
        </span>
      )}
    </span>
  );
}

// Info Button for mobile-friendly tooltips
function InfoButton({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <span className="relative inline-flex ml-1">
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="w-4 h-4 rounded-full bg-gray-700 text-gray-300 text-[10px] hover:bg-emerald-600 hover:text-white transition-colors"
      >
        ?
      </button>
      {isVisible && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-800 rounded-lg w-48 shadow-lg border border-gray-700">
          {text}
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute top-1 right-1 text-gray-400 hover:text-white"
          >
            ×
          </button>
        </div>
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
  market_cap_rank: number;
  circulating_supply: number;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
}

interface GlobalData {
  total_market_cap: number;
  total_volume: number;
  market_cap_change_percentage_24h: number;
  active_cryptocurrencies: number;
  btc_dominance: number;
}

interface FearGreed {
  value: number;
  value_classification: string;
}

export default function MarketPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [fearGreed, setFearGreed] = useState<FearGreed | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'market_cap' | 'price_change' | 'volume'>('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch coins
      const coinsRes = await fetch(
        'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false'
      );
      const coinsData = await coinsRes.json();
      if (Array.isArray(coinsData)) {
        setCoins(coinsData);
      }

      // Fetch global data
      const globalRes = await fetch('https://api.coingecko.com/api/v3/global');
      const globalJson = await globalRes.json();
      if (globalJson?.data) {
        setGlobalData({
          total_market_cap: globalJson.data.total_market_cap?.usd || 0,
          total_volume: globalJson.data.total_volume?.usd || 0,
          market_cap_change_percentage_24h: globalJson.data.market_cap_change_percentage_24h_usd || 0,
          active_cryptocurrencies: globalJson.data.active_cryptocurrencies || 0,
          btc_dominance: globalJson.data.market_cap_percentage?.btc || 0,
        });
      }

      // Fetch Fear & Greed
      const fgRes = await fetch('https://api.alternative.me/fng/');
      const fgData = await fgRes.json();
      if (fgData?.data?.[0]) {
        setFearGreed({
          value: parseInt(fgData.data[0].value),
          value_classification: fgData.data[0].value_classification,
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

  const formatPercent = (pct: number) => {
    const sign = pct >= 0 ? '+' : '';
    return `${sign}${pct.toFixed(2)}%`;
  };

  // Filter and sort
  const filteredCoins = coins
    .filter(coin => 
      coin.name.toLowerCase().includes(search.toLowerCase()) ||
      coin.symbol.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      let aVal, bVal;
      switch (sortBy) {
        case 'price_change':
          aVal = a.price_change_percentage_24h;
          bVal = b.price_change_percentage_24h;
          break;
        case 'volume':
          aVal = a.total_volume;
          bVal = b.total_volume;
          break;
        default:
          aVal = a.market_cap;
          bVal = b.market_cap;
      }
      return sortOrder === 'desc' ? bVal - aVal : aVal - bVal;
    });

  // Download as CSV
  const downloadCSV = () => {
    const headers = ['Rank', 'Name', 'Symbol', 'Price (USD)', '24h Change %', 'Market Cap', 'Volume (24h)', 'Circulating Supply', 'Max Supply', 'ATH', 'ATH Change %'];
    const rows = filteredCoins.map(coin => [
      coin.market_cap_rank,
      coin.name,
      coin.symbol.toUpperCase(),
      coin.current_price,
      coin.price_change_percentage_24h?.toFixed(2) || '0',
      coin.market_cap,
      coin.total_volume,
      coin.circulating_supply,
      coin.max_supply || 'N/A',
      coin.ath,
      coin.ath_change_percentage?.toFixed(2) || '0'
    ]);
    
    const csv = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto-market-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // Fear & Greed color
  const getFearGreedColor = (value: number) => {
    if (value <= 25) return 'text-red-500';
    if (value <= 45) return 'text-orange-500';
    if (value <= 55) return 'text-yellow-500';
    if (value <= 75) return 'text-lime-500';
    return 'text-green-500';
  };

  const handleSort = (field: 'market_cap' | 'price_change' | 'volume') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

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
            <Link href="/market" className="text-emerald-400 font-medium">Market</Link>
            <Link href="/compare" className="text-gray-300 hover:text-white transition-colors">Compare</Link>
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
            <h1 className="text-3xl font-bold mb-2">Cryptocurrency Market</h1>
            <p className="text-gray-400">Real-time prices for top 100 cryptocurrencies • No login required</p>
          </div>
          <button
            onClick={downloadCSV}
            className="mt-4 md:mt-0 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            <span>📥</span> Download CSV
          </button>
        </div>

        {/* Global Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          {/* Total Market Cap */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10 group">
            <div className="flex items-center gap-2">
              <p className="text-gray-400 text-sm">
                <Tooltip text="The total value of all cryptocurrencies combined">Total Market Cap</Tooltip>
              </p>
              <InfoButton text="Market cap = price × supply. It shows how 'big' the crypto market is overall." />
            </div>
            <p className="text-2xl font-bold mt-1 group-hover:text-emerald-400 transition-colors">
              {globalData ? formatLargeNumber(globalData.total_market_cap) : '-'}
            </p>
            {globalData && (
              <p className={`text-sm mt-1 ${globalData.market_cap_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {formatPercent(globalData.market_cap_change_percentage_24h)} today
              </p>
            )}
          </div>

          {/* 24h Volume */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-blue-500/50 transition-all hover:shadow-lg hover:shadow-blue-500/10 group">
            <div className="flex items-center gap-2">
              <p className="text-gray-400 text-sm">
                <Tooltip text="Total trading volume in the last 24 hours">24h Volume</Tooltip>
              </p>
              <InfoButton text="High volume = lots of trading activity. Low volume = less interest or harder to buy/sell." />
            </div>
            <p className="text-2xl font-bold mt-1 group-hover:text-blue-400 transition-colors">
              {globalData ? formatLargeNumber(globalData.total_volume) : '-'}
            </p>
          </div>

          {/* Fear & Greed */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-yellow-500/50 transition-all hover:shadow-lg hover:shadow-yellow-500/10 group">
            <div className="flex items-center gap-2">
              <p className="text-gray-400 text-sm">
                <Tooltip text="Measures market sentiment from 0 (Extreme Fear) to 100 (Extreme Greed)">Fear & Greed Index</Tooltip>
              </p>
              <InfoButton text="When people are fearful, prices often drop (buying opportunity). When greedy, prices rise (caution)." />
            </div>
            <p className={`text-2xl font-bold mt-1 ${fearGreed ? getFearGreedColor(fearGreed.value) : 'text-white'}`}>
              {fearGreed ? fearGreed.value : '-'}
            </p>
            <p className="text-sm mt-1 text-gray-400">
              {fearGreed ? fearGreed.value_classification : '-'}
            </p>
          </div>

          {/* BTC Dominance */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-orange-500/50 transition-all hover:shadow-lg hover:shadow-orange-500/10 group">
            <div className="flex items-center gap-2">
              <p className="text-gray-400 text-sm">
                <Tooltip text="Bitcoin's share of the total crypto market cap">BTC Dominance</Tooltip>
              </p>
              <InfoButton text="High dominance = money staying in Bitcoin. Low dominance = altcoin season." />
            </div>
            <p className="text-2xl font-bold mt-1 group-hover:text-orange-400 transition-colors">
              {globalData ? `${globalData.btc_dominance.toFixed(1)}%` : '-'}
            </p>
          </div>

          {/* Active Cryptos */}
          <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10 group">
            <div className="flex items-center gap-2">
              <p className="text-gray-400 text-sm">
                <Tooltip text="Number of cryptocurrencies being tracked">Active Cryptos</Tooltip>
              </p>
            </div>
            <p className="text-2xl font-bold mt-1 group-hover:text-purple-400 transition-colors">
              {globalData ? globalData.active_cryptocurrencies.toLocaleString() : '-'}
            </p>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="🔍 Search coins... (e.g., Bitcoin, ETH)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => handleSort('market_cap')}
              className={`px-4 py-2 rounded-lg border transition-all ${sortBy === 'market_cap' ? 'bg-emerald-600 border-emerald-600' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
            >
              Market Cap {sortBy === 'market_cap' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('price_change')}
              className={`px-4 py-2 rounded-lg border transition-all ${sortBy === 'price_change' ? 'bg-emerald-600 border-emerald-600' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
            >
              24h Change {sortBy === 'price_change' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              onClick={() => handleSort('volume')}
              className={`px-4 py-2 rounded-lg border transition-all ${sortBy === 'volume' ? 'bg-emerald-600 border-emerald-600' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
            >
              Volume {sortBy === 'volume' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        {/* Beginner Tip */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-6">
          <p className="text-blue-300 text-sm flex items-start gap-2">
            <span>💡</span>
            <span>
              <strong>Beginner Tip:</strong> Hover over column headers to learn what each metric means. 
              Green percentages = price went up. Red = price went down. Click on any coin to see more details!
            </span>
          </p>
        </div>

        {/* Coins Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-4 text-left text-gray-400 font-medium">#</th>
                  <th className="px-4 py-4 text-left text-gray-400 font-medium">
                    <Tooltip text="The cryptocurrency's name and trading symbol">Coin</Tooltip>
                  </th>
                  <th className="px-4 py-4 text-right text-gray-400 font-medium">
                    <Tooltip text="Current price in US Dollars">Price</Tooltip>
                  </th>
                  <th className="px-4 py-4 text-right text-gray-400 font-medium">
                    <Tooltip text="Percentage change in the last 24 hours">24h %</Tooltip>
                  </th>
                  <th className="px-4 py-4 text-right text-gray-400 font-medium">
                    <Tooltip text="Total value = price × circulating supply">Market Cap</Tooltip>
                  </th>
                  <th className="px-4 py-4 text-right text-gray-400 font-medium">
                    <Tooltip text="Total trading volume in the last 24 hours">Volume (24h)</Tooltip>
                  </th>
                  <th className="px-4 py-4 text-center text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoins.map((coin) => (
                  <tr 
                    key={coin.id} 
                    className="border-b border-gray-800 hover:bg-gray-800/50 transition-colors group cursor-pointer"
                    onClick={() => window.location.href = `/coin/${coin.id}`}
                  >
                    <td className="px-4 py-4 text-gray-400">{coin.market_cap_rank}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img 
                          src={coin.image} 
                          alt={coin.name} 
                          className="w-8 h-8 rounded-full group-hover:scale-110 transition-transform"
                        />
                        <div>
                          <span className="font-medium group-hover:text-emerald-400 transition-colors">{coin.name}</span>
                          <span className="text-gray-500 ml-2 uppercase text-sm">{coin.symbol}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-medium">{formatPrice(coin.current_price)}</td>
                    <td className={`px-4 py-4 text-right font-medium ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {formatPercent(coin.price_change_percentage_24h || 0)}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-300">{formatLargeNumber(coin.market_cap)}</td>
                    <td className="px-4 py-4 text-right text-gray-300">{formatLargeNumber(coin.total_volume)}</td>
                    <td className="px-4 py-4 text-center">
                      <Link 
                        href={`/coin/${coin.id}`}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Data updates every 60 seconds • Powered by CoinGecko API</p>
          <p className="mt-2">
            Want more features? <Link href="/pricing" className="text-emerald-400 hover:underline">Upgrade to Pro</Link> for unlimited downloads, AI analysis, and more!
          </p>
        </div>
      </div>
    </div>
  );
}
