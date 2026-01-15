'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Flame,
  Sparkles,
  Gem,
  Building2,
  Layers,
  Globe,
  BarChart3,
  ExternalLink,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  Droplets,
} from 'lucide-react';

// Types
interface GlobalStats {
  total_market_cap: Record<string, number>;
  total_volume: Record<string, number>;
  market_cap_percentage: Record<string, number>;
  market_cap_change_percentage_24h_usd: number;
  active_cryptocurrencies: number;
}

interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  price_usd?: number;
  price_change_24h?: number;
  market_cap_rank?: number;
}

interface MarketMover {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price: number;
  price_change_percentage_24h: number;
}

interface RecentCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
}

interface NFT {
  id: string;
  name: string;
  symbol: string;
  image?: string;
  floor_price_usd?: number;
  floor_price_change_24h?: number;
}

interface Exchange {
  id: string;
  name: string;
  image: string;
  trust_score: number;
  trade_volume_24h_btc: number;
}

interface Category {
  id: string;
  name: string;
  market_cap: number;
  market_cap_change_24h: number;
}

interface DexPool {
  id: string;
  name: string;
  dex: string;
  base_token_price_usd: number;
  reserve_usd: number;
  price_change_24h: number;
}

export default function AnalystHubPage() {
  const [loading, setLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [trending, setTrending] = useState<TrendingCoin[]>([]);
  const [gainers, setGainers] = useState<MarketMover[]>([]);
  const [losers, setLosers] = useState<MarketMover[]>([]);
  const [recentCoins, setRecentCoins] = useState<RecentCoin[]>([]);
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dexPools, setDexPools] = useState<DexPool[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAllData = useCallback(async () => {
    setLoading(true);
    try {
      const [
        globalRes,
        trendingRes,
        gainersLosersRes,
        recentRes,
        nftRes,
        exchangeRes,
        categoryRes,
        dexPoolsRes,
      ] = await Promise.all([
        fetch('/api/crypto/global'),
        fetch('/api/crypto/trending'),
        fetch('/api/crypto/gainers-losers?type=both&limit=5'),
        fetch('/api/crypto/recently-added?limit=5'),
        fetch('/api/crypto/nfts?limit=5'),
        fetch('/api/crypto/exchanges?limit=5'),
        fetch('/api/crypto/categories?limit=6'),
        fetch('/api/crypto/dex-pools?network=eth&type=trending&limit=5'),
      ]);

      const [
        globalData,
        trendingData,
        gainersLosersData,
        recentData,
        nftData,
        exchangeData,
        categoryData,
        dexPoolsData,
      ] = await Promise.all([
        globalRes.json(),
        trendingRes.json(),
        gainersLosersRes.json(),
        recentRes.json(),
        nftRes.json(),
        exchangeRes.json(),
        categoryRes.json(),
        dexPoolsRes.json(),
      ]);

      if (globalData.success) setGlobalStats(globalData.data);
      if (trendingData.success) setTrending(trendingData.data.coins?.slice(0, 5) || []);
      if (gainersLosersData.success) {
        setGainers(gainersLosersData.data.gainers || []);
        setLosers(gainersLosersData.data.losers || []);
      }
      if (recentData.success) setRecentCoins(recentData.data || []);
      if (nftData.success) setNfts(nftData.data || []);
      if (exchangeData.success) setExchanges(exchangeData.data || []);
      if (categoryData.success) setCategories(categoryData.data || []);
      if (dexPoolsData.success) setDexPools(dexPoolsData.data || []);

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  const formatPrice = (price: number | undefined) => {
    if (!price) return '—';
    if (price < 0.01) return `$${price.toFixed(4)}`;
    if (price < 1) return `$${price.toFixed(3)}`;
    return `$${price.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  };

  const formatMarketCap = (cap: number | undefined) => {
    if (!cap) return '—';
    if (cap >= 1e12) return `$${(cap / 1e12).toFixed(2)}T`;
    if (cap >= 1e9) return `$${(cap / 1e9).toFixed(1)}B`;
    if (cap >= 1e6) return `$${(cap / 1e6).toFixed(1)}M`;
    return `$${cap.toLocaleString()}`;
  };

  const formatChange = (change: number | undefined) => {
    if (change === undefined || change === null) return '—';
    const formatted = Math.abs(change).toFixed(1);
    return change >= 0 ? `+${formatted}%` : `-${formatted}%`;
  };

  const formatVolume = (btc: number) => {
    if (btc >= 1000000) return `${(btc / 1000000).toFixed(1)}M`;
    if (btc >= 1000) return `${(btc / 1000).toFixed(1)}K`;
    return btc.toFixed(0);
  };

  return (
    <div className="min-h-screen bg-gray-950">
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-emerald-500" />
              Analyst Hub
            </h1>
            <p className="text-gray-400 text-sm">All CoinGecko Analyst data in one view</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-gray-500">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={fetchAllData}
              disabled={loading}
              aria-label="Refresh data"
              className="p-2 bg-gray-800 text-gray-400 hover:text-white rounded-lg transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Global Stats Bar */}
        {globalStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
              <div className="text-xs text-gray-500 mb-1">Total Market Cap</div>
              <div className="text-lg font-bold text-white">
                {formatMarketCap(globalStats.total_market_cap?.usd)}
              </div>
              <div className={`text-xs flex items-center gap-1 ${
                globalStats.market_cap_change_percentage_24h_usd >= 0 ? 'text-emerald-400' : 'text-red-400'
              }`}>
                {globalStats.market_cap_change_percentage_24h_usd >= 0 ? (
                  <ArrowUpRight className="w-3 h-3" />
                ) : (
                  <ArrowDownRight className="w-3 h-3" />
                )}
                {formatChange(globalStats.market_cap_change_percentage_24h_usd)}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
              <div className="text-xs text-gray-500 mb-1">24h Volume</div>
              <div className="text-lg font-bold text-white">
                {formatMarketCap(globalStats.total_volume?.usd)}
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
              <div className="text-xs text-gray-500 mb-1">BTC Dominance</div>
              <div className="text-lg font-bold text-orange-400">
                {(globalStats.market_cap_percentage?.btc || 0).toFixed(1)}%
              </div>
            </div>
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-3">
              <div className="text-xs text-gray-500 mb-1">Active Coins</div>
              <div className="text-lg font-bold text-white">
                {globalStats.active_cryptocurrencies?.toLocaleString()}
              </div>
            </div>
          </div>
        )}

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Column 1: Trending + Gainers */}
          <div className="space-y-4">
            {/* Trending */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="font-semibold text-white text-sm">Trending</span>
                </div>
                <Link href="/trending" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  More <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-800">
                {trending.map((coin, i) => (
                  <Link key={coin.id} href={`/coin/${coin.id}`} className="flex items-center gap-2 p-2 hover:bg-gray-800/50 transition">
                    <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                    {coin.thumb && (
                      <Image src={coin.thumb} alt={coin.name} width={20} height={20} className="rounded-full" unoptimized />
                    )}
                    <span className="text-white text-sm flex-1 truncate">{coin.symbol}</span>
                    {coin.price_change_24h !== undefined && (
                      <span className={`text-xs ${coin.price_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {formatChange(coin.price_change_24h)}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>

            {/* Gainers */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="font-semibold text-white text-sm">Top Gainers</span>
                </div>
                <Link href="/gainers-losers" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  More <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-800">
                {gainers.map((coin, i) => (
                  <Link key={coin.id} href={`/coin/${coin.id}`} className="flex items-center gap-2 p-2 hover:bg-gray-800/50 transition">
                    <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                    {coin.image && (
                      <Image src={coin.image} alt={coin.name} width={20} height={20} className="rounded-full" unoptimized />
                    )}
                    <span className="text-white text-sm flex-1 truncate">{coin.symbol}</span>
                    <span className="text-emerald-400 text-xs font-medium">
                      {formatChange(coin.price_change_percentage_24h)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Losers */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-red-500" />
                  <span className="font-semibold text-white text-sm">Top Losers</span>
                </div>
                <Link href="/gainers-losers" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  More <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-800">
                {losers.map((coin, i) => (
                  <Link key={coin.id} href={`/coin/${coin.id}`} className="flex items-center gap-2 p-2 hover:bg-gray-800/50 transition">
                    <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                    {coin.image && (
                      <Image src={coin.image} alt={coin.name} width={20} height={20} className="rounded-full" unoptimized />
                    )}
                    <span className="text-white text-sm flex-1 truncate">{coin.symbol}</span>
                    <span className="text-red-400 text-xs font-medium">
                      {formatChange(coin.price_change_percentage_24h)}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Column 2: Recently Added + NFTs */}
          <div className="space-y-4">
            {/* Recently Added */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-white text-sm">Recently Added</span>
                </div>
                <Link href="/recently-added" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  More <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-800">
                {recentCoins.map((coin, i) => (
                  <Link key={coin.id} href={`/coin/${coin.id}`} className="flex items-center gap-2 p-2 hover:bg-gray-800/50 transition">
                    <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                    {coin.image && (
                      <Image src={coin.image} alt={coin.name} width={20} height={20} className="rounded-full" unoptimized />
                    )}
                    <span className="text-white text-sm flex-1 truncate">{coin.symbol}</span>
                    <span className="text-gray-400 text-xs">{formatPrice(coin.current_price)}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* NFTs */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Gem className="w-4 h-4 text-purple-500" />
                  <span className="font-semibold text-white text-sm">Top NFTs</span>
                </div>
                <Link href="/nft" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  More <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-800">
                {nfts.map((nft, i) => (
                  <div key={nft.id} className="flex items-center gap-2 p-2">
                    <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                    {nft.image ? (
                      <Image src={nft.image} alt={nft.name} width={20} height={20} className="rounded" unoptimized />
                    ) : (
                      <div className="w-5 h-5 bg-purple-600/30 rounded flex items-center justify-center">
                        <Gem className="w-3 h-3 text-purple-400" />
                      </div>
                    )}
                    <span className="text-white text-sm flex-1 truncate">{nft.name}</span>
                    <div className="text-right">
                      <div className="text-gray-400 text-xs">{formatPrice(nft.floor_price_usd)}</div>
                      {nft.floor_price_change_24h !== undefined && (
                        <div className={`text-[10px] ${nft.floor_price_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatChange(nft.floor_price_change_24h)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DEX Pools */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Droplets className="w-4 h-4 text-cyan-500" />
                  <span className="font-semibold text-white text-sm">DEX Pools</span>
                </div>
                <Link href="/dex-pools" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  More <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-800">
                {dexPools.map((pool, i) => (
                  <div key={pool.id} className="flex items-center gap-2 p-2">
                    <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-white text-sm truncate">{pool.name}</div>
                      <div className="text-[10px] text-gray-500 capitalize">{pool.dex}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-gray-400 text-xs">{formatPrice(pool.base_token_price_usd)}</div>
                      {pool.price_change_24h !== undefined && (
                        <div className={`text-[10px] ${pool.price_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatChange(pool.price_change_24h)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Global Market Link */}
            <Link
              href="/global-market"
              className="block bg-gradient-to-r from-blue-600/20 to-blue-900/20 border border-blue-500/30 rounded-xl p-4 hover:border-blue-500/50 transition"
            >
              <div className="flex items-center gap-3">
                <Globe className="w-8 h-8 text-blue-400" />
                <div>
                  <div className="font-semibold text-white">Global Market Charts</div>
                  <div className="text-xs text-gray-400">Historical market cap & volume trends</div>
                </div>
                <ChevronRight className="w-5 h-5 text-blue-400 ml-auto" />
              </div>
            </Link>
          </div>

          {/* Column 3: Exchanges + Categories */}
          <div className="space-y-4">
            {/* Exchanges */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  <span className="font-semibold text-white text-sm">Top Exchanges</span>
                </div>
                <Link href="/exchanges" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  More <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-800">
                {exchanges.map((ex, i) => (
                  <div key={ex.id} className="flex items-center gap-2 p-2">
                    <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                    {ex.image && (
                      <Image src={ex.image} alt={ex.name} width={20} height={20} className="rounded-full" unoptimized />
                    )}
                    <span className="text-white text-sm flex-1 truncate">{ex.name}</span>
                    <div className="text-right">
                      <div className="text-gray-400 text-xs">{formatVolume(ex.trade_volume_24h_btc)} BTC</div>
                      <div className="text-[10px] text-blue-400">Score: {ex.trust_score}/10</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b border-gray-800">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span className="font-semibold text-white text-sm">Top Categories</span>
                </div>
                <Link href="/categories" className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1">
                  More <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="divide-y divide-gray-800">
                {categories.map((cat, i) => (
                  <div key={cat.id} className="flex items-center gap-2 p-2">
                    <span className="text-gray-500 text-xs w-4">{i + 1}</span>
                    <span className="text-white text-sm flex-1 truncate">{cat.name}</span>
                    <div className="text-right">
                      <div className="text-gray-400 text-xs">{formatMarketCap(cat.market_cap)}</div>
                      {cat.market_cap_change_24h !== undefined && (
                        <div className={`text-[10px] ${cat.market_cap_change_24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {formatChange(cat.market_cap_change_24h)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
              <div className="text-sm font-semibold text-white mb-3">Quick Links</div>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/market" className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-xs text-gray-300">
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  Market
                </Link>
                <Link href="/charts" className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-xs text-gray-300">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Charts
                </Link>
                <Link href="/dex-pools" className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-xs text-gray-300">
                  <Droplets className="w-4 h-4 text-cyan-400" />
                  DEX Pools
                </Link>
                <Link href="/templates" className="flex items-center gap-2 p-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition text-xs text-gray-300">
                  <ExternalLink className="w-4 h-4 text-orange-400" />
                  Templates
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Attribution */}
        <div className="mt-6 text-center text-xs text-gray-500">
          Data provided by{' '}
          <a href="https://www.coingecko.com/en/api" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
            CoinGecko
          </a>
          {' '}Analyst API &{' '}
          <a href="https://www.geckoterminal.com" target="_blank" rel="noopener noreferrer" className="text-cyan-400 hover:underline">
            GeckoTerminal
          </a>
          {' '}• Auto-refreshes every 5 minutes
        </div>
      </main>
    </div>
  );
}
