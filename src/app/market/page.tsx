'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Minus, Database } from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { getClientCache, setClientCache, CACHE_TTL } from '@/lib/clientCache';
import { isFeatureEnabled } from '@/lib/featureFlags';

// Tooltip Component for hover explanations - improved visibility
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="cursor-help border-b-2 border-dotted border-emerald-500 hover:border-emerald-400 hover:text-emerald-400 transition-colors">
        {children}
      </span>
      {/* Tooltip popup */}
      {isVisible && (
        <span className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 text-sm text-white bg-gray-900 rounded-lg shadow-2xl border border-emerald-500/50 min-w-[200px] max-w-[300px] text-center whitespace-normal">
          {text}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></span>
        </span>
      )}
    </span>
  );
}

// Help Icon with tooltip - Reserved for future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        <span className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 text-sm text-white bg-gray-900 rounded-lg shadow-2xl border border-emerald-500/50 min-w-[250px] max-w-[350px] text-left whitespace-normal">
          {text}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></span>
        </span>
      )}
    </span>
  );
}

// Info Button for mobile-friendly tooltips (click to show)
function InfoButton({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span className="relative inline-flex ml-1">
      <button
        onClick={(e) => { e.stopPropagation(); setIsVisible(!isVisible); }}
        className="w-5 h-5 rounded-full bg-emerald-600/30 text-emerald-400 text-xs font-bold hover:bg-emerald-500 hover:text-white transition-all border border-emerald-500/50"
      >
        ?
      </button>
      {isVisible && (
        <div className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 text-sm text-white bg-gray-900 rounded-lg w-64 shadow-2xl border border-emerald-500/50">
          {text}
          <button
            onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
            className="absolute top-2 right-2 text-gray-400 hover:text-white text-lg leading-none"
          >
            ×
          </button>
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></span>
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

interface CoinPrediction {
  coinId: string;
  prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
}

export default function MarketPage() {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [globalData, setGlobalData] = useState<GlobalData | null>(null);
  const [fearGreed, setFearGreed] = useState<FearGreed | null>(null);
  const [predictions, setPredictions] = useState<Map<string, CoinPrediction>>(new Map());
  const [predictionsLoading, setPredictionsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'market_cap' | 'price_change' | 'volume'>('market_cap');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [predictionFilter, setPredictionFilter] = useState<'all' | 'BULLISH' | 'BEARISH' | 'NEUTRAL'>('all');
  const [dataFromCache, setDataFromCache] = useState(false);

  const fetchData = useCallback(async (forceRefresh = false) => {
    try {
      // Try cache first for coins (unless forcing refresh)
      if (!forceRefresh) {
        const cachedCoins = getClientCache<Coin[]>('market_coins');
        const cachedGlobal = getClientCache<GlobalData>('market_global');
        const cachedFearGreed = getClientCache<FearGreed>('market_fear_greed');

        if (cachedCoins && cachedCoins.length > 0) {
          setCoins(cachedCoins);
          setDataFromCache(true);
          setLoading(false);

          if (cachedGlobal) setGlobalData(cachedGlobal);
          if (cachedFearGreed) setFearGreed(cachedFearGreed);

          // Still fetch in background to update
          fetchFreshData();
          return;
        }
      }

      setDataFromCache(false);
      await fetchFreshData();
    } catch (error) {
      console.error('Error fetching data:', error);
      setLoading(false);
    }
  }, []);

  const fetchFreshData = async () => {
    try {
      // Fetch coins from internal API (uses Supabase cache first, then CoinGecko)
      const coinsRes = await fetch('/api/crypto?limit=100');
      const coinsJson = await coinsRes.json();
      if (coinsJson?.data && Array.isArray(coinsJson.data)) {
        setCoins(coinsJson.data);
        // Cache for 5 minutes
        setClientCache('market_coins', coinsJson.data, CACHE_TTL.PRICE_DATA);
      }

      // Fetch global data from internal cached endpoint
      const globalRes = await fetch('/api/cached?type=dashboard');
      const globalJson = await globalRes.json();
      if (globalJson?.data?.marketOverview) {
        const overview = globalJson.data.marketOverview;
        const globalData = {
          total_market_cap: overview.totalMarketCap || 0,
          total_volume: overview.totalVolume24h || 0,
          market_cap_change_percentage_24h: overview.marketCapChange24h || 0,
          active_cryptocurrencies: overview.activeCryptocurrencies || 0,
          btc_dominance: overview.btcDominance || 0,
        };
        setGlobalData(globalData);
        setClientCache('market_global', globalData, CACHE_TTL.MARKET_DATA);

        // Also get Fear & Greed from dashboard
        if (globalJson.data.fearGreed) {
          const value = globalJson.data.fearGreed.value;
          if (typeof value === 'number' && Number.isFinite(value)) {
            const fg = {
              value,
              value_classification: globalJson.data.fearGreed.label || 'Unknown',
            };
            setFearGreed(fg);
            setClientCache('market_fear_greed', fg, CACHE_TTL.MARKET_DATA);
          }
        }
      } else {
        // Fallback to direct API if cache is empty
        const directGlobalRes = await fetch('/api/crypto/global');
        const directGlobalJson = await directGlobalRes.json();
        if (directGlobalJson?.data) {
          const globalData = {
            total_market_cap: directGlobalJson.data.total_market_cap?.usd || 0,
            total_volume: directGlobalJson.data.total_volume?.usd || 0,
            market_cap_change_percentage_24h: directGlobalJson.data.market_cap_change_percentage_24h_usd || 0,
            active_cryptocurrencies: directGlobalJson.data.active_cryptocurrencies || 0,
            btc_dominance: directGlobalJson.data.market_cap_percentage?.btc || 0,
          };
          setGlobalData(globalData);
          setClientCache('market_global', globalData, CACHE_TTL.MARKET_DATA);
        }

        // Fallback Fear & Greed (internal API)
        const fgRes = await fetch('/api/sentiment');
        const fgData = await fgRes.json();
        if (fgData?.success && typeof fgData.value === 'number' && Number.isFinite(fgData.value)) {
          const fg = {
            value: fgData.value,
            value_classification: fgData.classification || 'Unknown',
          };
          setFearGreed(fg);
          setClientCache('market_fear_greed', fg, CACHE_TTL.MARKET_DATA);
        }
      }
    } catch (error) {
      console.error('Error fetching fresh data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(() => fetchData(true), 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Fetch predictions when coins are loaded
  const fetchPredictions = useCallback(async (forceRefresh = false) => {
    if (!isFeatureEnabled('predictions') || !isFeatureEnabled('macro')) {
      setPredictions(new Map());
      setPredictionsLoading(false);
      return;
    }

    // Try cache first (unless forcing refresh)
    if (!forceRefresh) {
      const cachedPredictions = getClientCache<Array<{ coinId: string; prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; confidence: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' }>>('market_predictions');
      if (cachedPredictions && cachedPredictions.length > 0) {
        const predMap = new Map<string, CoinPrediction>();
        cachedPredictions.forEach(pred => {
          predMap.set(pred.coinId, pred);
        });
        setPredictions(predMap);
        // Still fetch fresh in background
        fetchFreshPredictions();
        return;
      }
    }

    setPredictionsLoading(true);
    await fetchFreshPredictions();
  }, [coins]);

  const fetchFreshPredictions = async () => {
    if (coins.length === 0) return;
    if (!isFeatureEnabled('predictions') || !isFeatureEnabled('macro')) {
      setPredictions(new Map());
      setPredictionsLoading(false);
      return;
    }

    try {
      // Fetch predictions for top 50 coins
      const topCoins = coins.slice(0, 50).map(c => ({ id: c.id, name: c.name }));

      const response = await fetch('/api/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coins: topCoins })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && Array.isArray(result.data)) {
          const predMap = new Map<string, CoinPrediction>();
          const predArray: Array<{ coinId: string; prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; confidence: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' }> = [];

          result.data.forEach((pred: { coinId: string; prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL'; confidence: number; riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME' }) => {
            if (pred.coinId && pred.prediction) {
              const predData = {
                coinId: pred.coinId,
                prediction: pred.prediction,
                confidence: pred.confidence || 50,
                riskLevel: pred.riskLevel || 'MEDIUM'
              };
              predMap.set(pred.coinId, predData);
              predArray.push(predData);
            }
          });
          setPredictions(predMap);
          // Cache predictions for 10 minutes
          setClientCache('market_predictions', predArray, CACHE_TTL.MARKET_DATA);
        }
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    } finally {
      setPredictionsLoading(false);
    }
  };

  useEffect(() => {
    if (!isFeatureEnabled('predictions') || !isFeatureEnabled('macro')) return;
    if (coins.length > 0) {
      fetchPredictions();
    }
  }, [coins, fetchPredictions]);

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
    .filter(coin => {
      // Apply prediction filter
      if (predictionFilter === 'all') return true;
      const pred = predictions.get(coin.id);
      return pred?.prediction === predictionFilter;
    })
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

  // Get prediction badge component
  const getPredictionBadge = (coinId: string) => {
    const pred = predictions.get(coinId);
    if (!pred) {
      return predictionsLoading ? (
        <span className="text-gray-500 text-xs">Loading...</span>
      ) : (
        <span className="text-gray-500 text-xs">-</span>
      );
    }

    const { prediction, confidence } = pred;
    const styles = {
      BULLISH: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', Icon: TrendingUp },
      BEARISH: { bg: 'bg-red-500/20', text: 'text-red-400', Icon: TrendingDown },
      NEUTRAL: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', Icon: Minus }
    };

    const style = styles[prediction];
    const Icon = style.Icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
        <Icon className="w-3 h-3" />
        <span>{prediction === 'BULLISH' ? 'Bull' : prediction === 'BEARISH' ? 'Bear' : 'Neutral'}</span>
        <span className="opacity-60">{confidence}%</span>
      </span>
    );
  };

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
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Cryptocurrency Market</h1>
            <p className="text-gray-400 flex items-center gap-2">
              Live prices for top cryptocurrencies • No login required
              {dataFromCache && (
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
                  <Database className="w-3 h-3" />
                  Cached
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3 mt-4 md:mt-0">
            <button
              type="button"
              onClick={() => { fetchData(true); fetchPredictions(true); }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
            >
              🔄 Refresh
            </button>
            <button
              type="button"
              onClick={downloadCSV}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium flex items-center gap-2 transition-colors"
            >
              <span>📥</span> Download CSV
            </button>
          </div>
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
        <div className="flex flex-col md:flex-row gap-4 mb-4">
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
              type="button"
              onClick={() => handleSort('market_cap')}
              className={`px-4 py-2 rounded-lg border transition-all ${sortBy === 'market_cap' ? 'bg-emerald-600 border-emerald-600' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
            >
              Market Cap {sortBy === 'market_cap' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              type="button"
              onClick={() => handleSort('price_change')}
              className={`px-4 py-2 rounded-lg border transition-all ${sortBy === 'price_change' ? 'bg-emerald-600 border-emerald-600' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
            >
              24h Change {sortBy === 'price_change' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
            <button
              type="button"
              onClick={() => handleSort('volume')}
              className={`px-4 py-2 rounded-lg border transition-all ${sortBy === 'volume' ? 'bg-emerald-600 border-emerald-600' : 'bg-gray-800 border-gray-700 hover:border-gray-600'}`}
            >
              Volume {sortBy === 'volume' && (sortOrder === 'desc' ? '↓' : '↑')}
            </button>
          </div>
        </div>

        {/* AI Prediction Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <span className="text-gray-400 text-sm mr-2">🤖 AI Prediction:</span>
          <button
            type="button"
            onClick={() => setPredictionFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${predictionFilter === 'all' ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setPredictionFilter('BULLISH')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1 ${predictionFilter === 'BULLISH' ? 'bg-emerald-600 text-white' : 'bg-gray-800 text-emerald-400 hover:bg-emerald-900/50'}`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Bullish
          </button>
          <button
            type="button"
            onClick={() => setPredictionFilter('BEARISH')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1 ${predictionFilter === 'BEARISH' ? 'bg-red-600 text-white' : 'bg-gray-800 text-red-400 hover:bg-red-900/50'}`}
          >
            <TrendingDown className="w-3.5 h-3.5" /> Bearish
          </button>
          <button
            type="button"
            onClick={() => setPredictionFilter('NEUTRAL')}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all flex items-center gap-1 ${predictionFilter === 'NEUTRAL' ? 'bg-yellow-600 text-white' : 'bg-gray-800 text-yellow-400 hover:bg-yellow-900/50'}`}
          >
            <Minus className="w-3.5 h-3.5" /> Neutral
          </button>
          {predictionsLoading && (
            <span className="text-gray-500 text-sm ml-2 flex items-center gap-1">
              <span className="animate-spin h-3 w-3 border-2 border-emerald-500 border-t-transparent rounded-full"></span>
              Loading predictions...
            </span>
          )}
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

        {/* Table Header Explanations - shown above table to avoid overflow clipping */}
        <div className="bg-gray-800/50 rounded-lg p-4 mb-4 border border-gray-700">
          <p className="text-gray-400 text-sm mb-2 font-medium">📊 Column Guide:</p>
          <div className="flex flex-wrap gap-4 text-sm">
            <span className="text-gray-300"><span className="text-emerald-400 font-medium">Coin:</span> Name & symbol</span>
            <span className="text-gray-300"><span className="text-emerald-400 font-medium">Price:</span> Current USD price</span>
            <span className="text-gray-300"><span className="text-emerald-400 font-medium">24h %:</span> Price change in 24 hours</span>
            <span className="text-gray-300"><span className="text-emerald-400 font-medium">AI Signal:</span> AI prediction (Bull/Bear/Neutral)</span>
            <span className="text-gray-300"><span className="text-emerald-400 font-medium">Market Cap:</span> Price × Supply</span>
            <span className="text-gray-300"><span className="text-emerald-400 font-medium">Volume:</span> 24h trading activity</span>
          </div>
        </div>

        {/* Coins Table */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-700">
            <table className="w-full">
              <thead className="bg-gray-800 sticky top-0 z-10">
                <tr className="border-b border-gray-700">
                  <th className="px-4 py-4 text-left text-gray-400 font-medium">#</th>
                  <th className="px-4 py-4 text-left text-emerald-400 font-medium">Coin</th>
                  <th className="px-4 py-4 text-right text-emerald-400 font-medium">Price</th>
                  <th className="px-4 py-4 text-right text-emerald-400 font-medium">24h %</th>
                  <th className="px-4 py-4 text-center text-emerald-400 font-medium">AI Signal</th>
                  <th className="px-4 py-4 text-right text-emerald-400 font-medium">Market Cap</th>
                  <th className="px-4 py-4 text-right text-emerald-400 font-medium">Volume (24h)</th>
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
                    <td className="px-4 py-4 text-center">
                      {getPredictionBadge(coin.id)}
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
          <p>Data updates every 60 seconds • Powered by Binance market data</p>
          <p className="mt-2">
            Want more features? <Link href="/pricing" className="text-emerald-400 hover:underline">Upgrade to Pro</Link> for unlimited downloads, AI analysis, and more!
          </p>
        </div>
      </div>
    </div>
  );
}
