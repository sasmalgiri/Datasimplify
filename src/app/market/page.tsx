'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

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
  sparkline_in_7d?: { price: number[] };
}

interface GlobalData {
  total_market_cap: { usd: number };
  total_volume: { usd: number };
  market_cap_change_percentage_24h_usd: number;
  active_cryptocurrencies: number;
}

export default function MarketPage() {
  const [coins, setCoins] = useState<CoinData[]>([]);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [fearGreed, setFearGreed] = useState<{ value: number; classification: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      // Fetch coins
      const coinsRes = await fetch('/api/crypto?limit=100');
      const coinsData = await coinsRes.json();
      if (coinsData.data) setCoins(coinsData.data);

      // Fetch global data
      const globalRes = await fetch('/api/crypto/global');
      const globalJson = await globalRes.json();
      if (globalJson.data) setGlobalData(globalJson.data);

      // Fetch fear & greed
      const fgRes = await fetch('/api/sentiment');
      const fgData = await fgRes.json();
      if (fgData.value) setFearGreed(fgData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    if (price >= 1) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 6 })}`;
  };

  const getFearGreedColor = (value: number) => {
    if (value <= 25) return 'text-red-500';
    if (value <= 45) return 'text-orange-500';
    if (value <= 55) return 'text-yellow-500';
    if (value <= 75) return 'text-lime-500';
    return 'text-green-500';
  };

  const filteredCoins = coins.filter(coin =>
    coin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto mb-4"></div>
          <p className="text-gray-400">Loading market data...</p>
        </div>
      </div>
    );
  }

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
              <Link href="/market" className="text-emerald-400 font-medium">Market</Link>
              <Link href="/compare" className="text-gray-300 hover:text-white">Compare</Link>
              <Link href="/chat" className="text-gray-300 hover:text-white">AI Chat</Link>
              <Link href="/glossary" className="text-gray-300 hover:text-white">Glossary</Link>
              <Link href="/pricing" className="text-gray-300 hover:text-white">Pricing</Link>
              <Link href="/login" className="px-4 py-2 bg-emerald-500 rounded-lg hover:bg-emerald-600">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Market Overview */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Cryptocurrency Market</h1>
          <p className="text-gray-400">Real-time prices for top 100 cryptocurrencies • No login required</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Total Market Cap</p>
            <p className="text-xl font-bold">{globalData ? formatNumber(globalData.total_market_cap.usd) : '-'}</p>
            {globalData && (
              <p className={`text-sm ${globalData.market_cap_change_percentage_24h_usd >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {globalData.market_cap_change_percentage_24h_usd >= 0 ? '↑' : '↓'} {Math.abs(globalData.market_cap_change_percentage_24h_usd).toFixed(2)}%
              </p>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">24h Volume</p>
            <p className="text-xl font-bold">{globalData ? formatNumber(globalData.total_volume.usd) : '-'}</p>
          </div>

          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Fear & Greed Index</p>
            {fearGreed ? (
              <>
                <p className={`text-xl font-bold ${getFearGreedColor(fearGreed.value)}`}>{fearGreed.value}</p>
                <p className="text-sm text-gray-400">{fearGreed.classification}</p>
              </>
            ) : (
              <p className="text-xl font-bold">-</p>
            )}
          </div>

          <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
            <p className="text-gray-400 text-sm">Active Cryptos</p>
            <p className="text-xl font-bold">{globalData?.active_cryptocurrencies?.toLocaleString() || '-'}</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <input
            type="text"
            placeholder="Search coins..."
            className="w-full md:w-96 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-emerald-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Coins Table */}
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">#</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Coin</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Price</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">24h %</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Market Cap</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium hidden lg:table-cell">Volume (24h)</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredCoins.map((coin) => (
                  <tr key={coin.id} className="border-t border-gray-700 hover:bg-gray-700/50 transition">
                    <td className="px-4 py-4 text-gray-400">{coin.market_cap_rank}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <img src={coin.image} alt={coin.name} className="w-8 h-8 rounded-full" />
                        <div>
                          <p className="font-medium">{coin.name}</p>
                          <p className="text-sm text-gray-400 uppercase">{coin.symbol}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-right font-mono">{formatPrice(coin.current_price)}</td>
                    <td className={`px-4 py-4 text-right font-medium ${coin.price_change_percentage_24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {coin.price_change_percentage_24h >= 0 ? '+' : ''}{coin.price_change_percentage_24h?.toFixed(2)}%
                    </td>
                    <td className="px-4 py-4 text-right text-gray-300 hidden md:table-cell">
                      {formatNumber(coin.market_cap)}
                    </td>
                    <td className="px-4 py-4 text-right text-gray-300 hidden lg:table-cell">
                      {formatNumber(coin.total_volume)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Link
                        href={`/coin/${coin.id}`}
                        className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm hover:bg-emerald-500/30 transition"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-8 bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-xl p-6 text-center">
          <h3 className="text-xl font-bold mb-2">Want More Features?</h3>
          <p className="text-gray-300 mb-4">
            Download data as Excel/CSV, use AI chat, compare coins side-by-side, and more!
          </p>
          <div className="flex justify-center gap-4">
            <Link
              href="/signup"
              className="px-6 py-2 bg-emerald-500 rounded-lg font-medium hover:bg-emerald-600 transition"
            >
              Sign Up Free
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-2 bg-gray-700 rounded-lg font-medium hover:bg-gray-600 transition"
            >
              View Pricing
            </Link>
          </div>
        </div>

        {/* Footer Note */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>Data provided by CoinGecko API • Updates every 60 seconds</p>
          <p className="mt-1">Not financial advice. Always do your own research (DYOR).</p>
        </div>
      </div>
    </div>
  );
}
