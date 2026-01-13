'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
  Shield,
  BarChart3,
  Users,
  Zap,
  Clock,
  Target,
  Database
} from 'lucide-react';
import PriceChart from '@/components/PriceChart';
import DownloadButton from '@/components/DownloadButton';
import { TechnicalAnalysisPanel } from '@/components/TechnicalAnalysisPanel';
import { OnChainMetrics } from '@/components/RiskScoreCard';
import { CoinMarketData } from '@/types/crypto';
import { formatCurrency, formatPercent, formatNumber, formatDate, getPriceChangeColor } from '@/lib/utils';
import { fetchWithCache, CACHE_TTL } from '@/lib/clientCache';
import { isFeatureEnabled } from '@/lib/featureFlags';

// Calculate support/resistance levels using pivot points from OHLC data
function calculateSupportResistance(high: number, low: number, close: number): {
  pivot: number;
  support1: number;
  support2: number;
  resistance1: number;
  resistance2: number;
} {
  const pivot = (high + low + close) / 3;
  const support1 = 2 * pivot - high;
  const support2 = pivot - (high - low);
  const resistance1 = 2 * pivot - low;
  const resistance2 = pivot + (high - low);
  return { pivot, support1, support2, resistance1, resistance2 };
}

// Format support/resistance for display
function formatSupportResistance(high: number | undefined, low: number | undefined, close: number | undefined): string {
  if (typeof high !== 'number' || typeof low !== 'number' || typeof close !== 'number') {
    return 'Unavailable';
  }
  const levels = calculateSupportResistance(high, low, close);
  const formatPrice = (p: number) => p >= 1 ? `$${p.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : `$${p.toFixed(6)}`;
  return `S1: ${formatPrice(levels.support1)} | R1: ${formatPrice(levels.resistance1)}`;
}

// Sentiment Gauge component using ref to avoid inline styles
function SentimentGauge({ value }: { value: number }) {
  const pointerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (pointerRef.current) {
      pointerRef.current.style.left = `${value}%`;
      pointerRef.current.style.transform = 'translateX(-50%)';
    }
  }, [value]);

  return (
    <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
      <div className="absolute inset-0 flex">
        <div className="w-1/4 bg-red-500/30" />
        <div className="w-1/4 bg-orange-500/30" />
        <div className="w-1/4 bg-yellow-500/30" />
        <div className="w-1/4 bg-emerald-500/30" />
      </div>
      <div
        ref={pointerRef}
        className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg transition-all duration-500"
      />
    </div>
  );
}

type TechnicalSnapshot = {
  rsi14?: number;
  macdSignal?: 'bullish_cross' | 'bearish_cross' | 'neutral';
  priceVs200MA?: 'above' | 'below' | 'near';
  priceVs50MA?: 'above' | 'below' | 'near';
  bollingerPosition?: 'upper' | 'middle' | 'lower';
  volumeTrend?: 'increasing' | 'decreasing' | 'stable';
} | null;

type OnChainSnapshot = {
  exchangeFlow?: 'inflow' | 'outflow' | 'neutral';
  whaleActivity?: 'buying' | 'selling' | 'neutral';
  activeAddresses?: 'increasing' | 'decreasing' | 'stable';
} | null;

interface SentimentInfo {
  fearGreedIndex: number;
  fearGreedLabel: string;
}

type MacroSnapshot = {
  vix?: number;
  dxy?: number;
  riskEnvironment?: string;
} | null;

type DerivativesSnapshot = {
  fundingRate?: number;
  openInterestChange24h?: number;
  liquidations24h?: number;
  longShortRatio?: number;
} | null;

export default function CoinDetailPage() {
  const params = useParams();
  const coinId = params.id as string;

  const macroEnabled = isFeatureEnabled('macro');
  const whalesEnabled = isFeatureEnabled('whales');

  const [coin, setCoin] = useState<CoinMarketData | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ timestamp: number; price: number }>>([]);
  const [sentiment, setSentiment] = useState<SentimentInfo | null>(null);
  const [technical, setTechnical] = useState<TechnicalSnapshot>(null);
  const [onchain, setOnchain] = useState<OnChainSnapshot>(null);
  const [macro, setMacro] = useState<MacroSnapshot>(null);
  const [derivatives, setDerivatives] = useState<DerivativesSnapshot>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dataFromCache, setDataFromCache] = useState(false);

  const fetchCoinData = useCallback(async (forceRefresh = false) => {
    try {
      // Use client-side cache for coin data (30 min cache)
      const { data: coinData, fromCache, error } = await fetchWithCache<CoinMarketData>(
        `/api/crypto/${coinId}`,
        `coin_${coinId}`,
        forceRefresh ? 0 : CACHE_TTL.COIN_DETAILS
      );

      if (error || !coinData || (coinData as { error?: string }).error) {
        setCoin(null);
        setLoading(false);
        return;
      }

      setCoin(coinData);
      setDataFromCache(fromCache);

      // Use client-side cache for price history (1 hour cache)
      const { data: historyData } = await fetchWithCache<{ prices: Array<{ timestamp: number; price: number }> }>(
        `/api/crypto/${coinId}/history?days=30`,
        `history_${coinId}_30d`,
        forceRefresh ? 0 : CACHE_TTL.PRICE_HISTORY
      );

      setPriceHistory(historyData?.prices || []);
    } catch (error) {
      console.error('Error fetching coin data:', error);
      setCoin(null);
    } finally {
      setLoading(false);
    }
  }, [coinId]);

  useEffect(() => {
    if (coinId) {
      fetchCoinData();
      fetchSentiment();
      fetchTechnical();
      if (macroEnabled) fetchMacro();
      fetchDerivatives();
      fetchOnchain();
    }
  }, [coinId, fetchCoinData]);

  const fetchSentiment = async () => {
    try {
      const res = await fetch('/api/sentiment');
      const data = await res.json();
      if (data?.success && typeof data.value === 'number' && Number.isFinite(data.value)) {
        setSentiment({
          fearGreedIndex: data.value,
          fearGreedLabel: data.classification || 'Unknown'
        });
      }
    } catch (error) {
      console.error('Error fetching sentiment:', error);
    }
  };

  const fetchTechnical = async () => {
    try {
      const res = await fetch(`/api/technical?coin=${encodeURIComponent(coinId)}&timeframe=1d`);
      const json = await res.json();
      if (!json?.success || !json?.data?.summary) {
        setTechnical(null);
        return;
      }

      const currentPrice: number | undefined = typeof json.data.summary.currentPrice === 'number' ? json.data.summary.currentPrice : undefined;
      const sma50: number | undefined = typeof json.data.summary.sma50 === 'number' ? json.data.summary.sma50 : undefined;
      const sma200: number | undefined = typeof json.data.summary.sma200 === 'number' ? json.data.summary.sma200 : undefined;

      const rsiRow = Array.isArray(json.data.indicators)
        ? json.data.indicators.find((i: { shortName?: string }) => i?.shortName === 'RSI (14)')
        : null;
      const rsiValue = typeof rsiRow?.value === 'number'
        ? rsiRow.value
        : typeof rsiRow?.value === 'string'
          ? Number.parseFloat(rsiRow.value)
          : undefined;

      const bbRow = Array.isArray(json.data.indicators)
        ? json.data.indicators.find((i: { shortName?: string }) => i?.shortName === 'BB')
        : null;

      const bbText = typeof bbRow?.value === 'string' ? bbRow.value : undefined;
      const bollingerPosition = bbText?.toLowerCase().includes('lower')
        ? 'lower'
        : bbText?.toLowerCase().includes('upper') || bbText?.toLowerCase().includes('above upper')
          ? 'upper'
          : bbText
            ? 'middle'
            : undefined;

      const compareToMA = (price?: number, ma?: number): 'above' | 'below' | 'near' | undefined => {
        if (typeof price !== 'number' || typeof ma !== 'number' || !Number.isFinite(price) || !Number.isFinite(ma) || ma === 0) return undefined;
        const diffPct = ((price - ma) / ma) * 100;
        if (Math.abs(diffPct) <= 1) return 'near';
        return diffPct > 0 ? 'above' : 'below';
      };

      const snapshot: NonNullable<TechnicalSnapshot> = {
        rsi14: typeof rsiValue === 'number' && Number.isFinite(rsiValue) ? rsiValue : undefined,
        priceVs50MA: compareToMA(currentPrice, sma50),
        priceVs200MA: compareToMA(currentPrice, sma200),
        bollingerPosition,
      };

      const hasAny = Object.values(snapshot).some(v => v !== undefined);
      setTechnical(hasAny ? snapshot : null);
    } catch {
      setTechnical(null);
    }
  };

  const fetchMacro = async () => {
    if (!macroEnabled) {
      setMacro(null);
      return;
    }

    try {
      const res = await fetch('/api/macro');
      const json = await res.json();
      const data = json?.data;
      if (!json?.success || !data) {
        setMacro(null);
        return;
      }
      const vix = typeof data.vix === 'number' && Number.isFinite(data.vix) ? data.vix : undefined;
      const dxy = typeof data.dxy === 'number' && Number.isFinite(data.dxy) ? data.dxy : undefined;
      const riskEnvironment = typeof data.riskEnvironment === 'string' ? data.riskEnvironment : undefined;
      const snap: NonNullable<MacroSnapshot> = { vix, dxy, riskEnvironment };
      const hasAny = Object.values(snap).some(v => v !== undefined);
      setMacro(hasAny ? snap : null);
    } catch {
      setMacro(null);
    }
  };

  const fetchDerivatives = async () => {
    try {
      const res = await fetch('/api/derivatives');
      const json = await res.json();
      const data = json?.data;
      if (!json?.success || !data) {
        setDerivatives(null);
        return;
      }
      const btc = data?.btc;
      const fundingRate = typeof btc?.fundingRate === 'number' && Number.isFinite(btc.fundingRate) ? btc.fundingRate : undefined;
      const openInterestChange24h = typeof btc?.openInterestChange24h === 'number' && Number.isFinite(btc.openInterestChange24h) ? btc.openInterestChange24h : undefined;
      const liquidations24h = typeof data?.totalLiquidations24h === 'number' && Number.isFinite(data.totalLiquidations24h) ? data.totalLiquidations24h : undefined;
      const longShortRatio = typeof btc?.longShortRatio === 'number' && Number.isFinite(btc.longShortRatio) ? btc.longShortRatio : undefined;
      const snap: NonNullable<DerivativesSnapshot> = { fundingRate, openInterestChange24h, liquidations24h, longShortRatio };
      const hasAny = Object.values(snap).some(v => v !== undefined);
      setDerivatives(hasAny ? snap : null);
    } catch {
      setDerivatives(null);
    }
  };

  const fetchOnchain = async () => {
    // Coin-specific on-chain is only available for BTC/ETH via free sources.
    try {
      if (coinId.toLowerCase() === 'ethereum') {
        if (!whalesEnabled) {
          setOnchain(null);
          return;
        }
        const res = await fetch('/api/whales?type=eth-whales&minValue=100');
        const json = await res.json();
        const txs = Array.isArray(json?.data) ? json.data : Array.isArray(json?.data?.transactions) ? json.data.transactions : [];
        const inflows = txs.filter((t: { type?: string }) => t?.type === 'exchange_inflow').length;
        const outflows = txs.filter((t: { type?: string }) => t?.type === 'exchange_outflow').length;
        if (inflows === 0 && outflows === 0) {
          setOnchain(null);
          return;
        }
        setOnchain({
          exchangeFlow: outflows > inflows ? 'outflow' : inflows > outflows ? 'inflow' : 'neutral',
          whaleActivity: outflows > inflows ? 'buying' : inflows > outflows ? 'selling' : 'neutral',
        });
        return;
      }

      if (coinId.toLowerCase() === 'bitcoin') {
        const res = await fetch('/api/onchain?type=bitcoin');
        const json = await res.json();
        const stats = json?.data;
        // No direct active address trend here; keep onchain null and let the UI show unavailable.
        if (!stats) {
          setOnchain(null);
          return;
        }
        setOnchain(null);
        return;
      }

      setOnchain(null);
    } catch {
      setOnchain(null);
    }
  };

  const refreshAllData = async () => {
    setRefreshing(true);
    setLoading(true);
    // Force refresh all data (bypass cache)
    await Promise.all([
      fetchCoinData(true),
      fetchSentiment(),
      fetchTechnical(),
      fetchMacro(),
      fetchDerivatives(),
      fetchOnchain()
    ]);
    setRefreshing(false);
  };

  const technicalData = technical;
  const onChainData = onchain;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-700 rounded w-48 mb-8" />
            <div className="h-64 bg-gray-800 rounded-xl mb-8" />
            <div className="grid md:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-800 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!coin) {
    return (
      <div className="min-h-screen bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-20">
            <h1 className="text-2xl font-bold text-white mb-4">Coin not found</h1>
            <Link href="/market" className="text-emerald-400 hover:text-emerald-300">
              ← Back to market
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const StatBox = ({ label, value, subValue, icon }: { label: string; value: string; subValue?: string; icon?: React.ReactNode }) => (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
      <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold text-white">{value}</div>
      {subValue && <div className="text-xs text-gray-500">{subValue}</div>}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back link */}
        <Link
          href="/market"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to market
        </Link>

        {/* Header with Prediction Badge */}
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <Image
              src={coin.image}
              alt={coin.name}
              width={64}
              height={64}
              className="rounded-full"
            />
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-3xl font-bold text-white">{coin.name}</h1>
                <span className="text-gray-500 text-lg uppercase">{coin.symbol}</span>
                <span className="bg-gray-800 text-gray-400 text-xs font-medium px-2 py-1 rounded">
                  Rank #{coin.market_cap_rank}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="text-3xl font-bold text-white">
                  {formatCurrency(coin.current_price, { compact: false })}
                </span>
                <span className={`flex items-center gap-1 text-lg font-medium ${getPriceChangeColor(coin.price_change_percentage_24h)}`}>
                  {coin.price_change_percentage_24h >= 0 ? (
                    <TrendingUp className="w-5 h-5" />
                  ) : (
                    <TrendingDown className="w-5 h-5" />
                  )}
                  {formatPercent(coin.price_change_percentage_24h)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {dataFromCache && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-800/50 px-2 py-1 rounded">
                <Database className="w-3 h-3" />
                <span>Cached</span>
              </div>
            )}
            <button
              type="button"
              onClick={refreshAllData}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <DownloadButton
              coins={[coin]}
              filename={`${coin.symbol}_data`}
            />
          </div>
        </div>

        {/* Market Sentiment Panel */}
        <div className="mb-8">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-purple-400" />
              Market Sentiment
            </h3>
            {sentiment ? (
              <>
                <div className="text-center mb-4">
                  <div className={`text-4xl font-bold mb-1 ${
                    sentiment.fearGreedIndex < 30 ? 'text-red-400' :
                    sentiment.fearGreedIndex > 70 ? 'text-emerald-400' : 'text-yellow-400'
                  }`}>
                    {sentiment.fearGreedIndex}
                  </div>
                  <div className="text-gray-400 text-sm">{sentiment.fearGreedLabel}</div>
                </div>
                <SentimentGauge value={sentiment.fearGreedIndex} />
                <div className="flex justify-between mt-1 text-xs text-gray-500">
                  <span>Fear</span>
                  <span>Greed</span>
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <Activity className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Loading sentiment...</p>
              </div>
            )}
            {/* Quick Stats */}
            <div className="mt-4 pt-4 border-t border-gray-700 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">24h Volume/MCap</span>
                <span className="text-white font-medium">
                  {((coin.total_volume / coin.market_cap) * 100).toFixed(2)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Volatility (24h)</span>
                <span className="text-white font-medium">
                  {((Math.abs(coin.high_24h - coin.low_24h) / coin.current_price) * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Price Chart */}
        <div className="mb-8">
          <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
            <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5 text-blue-400" />
              Price Chart (30 Days)
            </h3>
            <PriceChart data={priceHistory} height={350} />
          </div>
        </div>

        {/* Technical Analysis + On-Chain + Risk */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Technical Analysis */}
          {technicalData && (
            <TechnicalAnalysisPanel
              rsi={technicalData.rsi14}
              macdSignal={technicalData.macdSignal}
              priceVs200MA={technicalData.priceVs200MA}
              priceVs50MA={technicalData.priceVs50MA}
              bollingerPosition={technicalData.bollingerPosition}
              volumeTrend={technicalData.volumeTrend}
              priceChange24h={coin.price_change_percentage_24h}
              priceChange7d={coin.price_change_percentage_7d}
              priceChange30d={coin.price_change_percentage_30d}
            />
          )}

          {/* On-Chain Metrics */}
          {onChainData && (
            <OnChainMetrics
              exchangeFlow={onChainData.exchangeFlow}
              whaleActivity={onChainData.whaleActivity}
              activeAddresses={onChainData.activeAddresses}
            />
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatBox
            label="Market Cap"
            value={formatCurrency(coin.market_cap)}
            subValue={`Rank #${coin.market_cap_rank}`}
            icon={<Target className="w-4 h-4" />}
          />
          <StatBox
            label="24h Trading Volume"
            value={formatCurrency(coin.total_volume)}
            icon={<Activity className="w-4 h-4" />}
          />
          <StatBox
            label="Circulating Supply"
            value={formatNumber(coin.circulating_supply)}
            subValue={coin.symbol.toUpperCase()}
            icon={<Zap className="w-4 h-4" />}
          />
          <StatBox
            label="Total Supply"
            value={coin.total_supply ? formatNumber(coin.total_supply) : '∞'}
            icon={<Shield className="w-4 h-4" />}
          />
          <StatBox
            label="24h High"
            value={formatCurrency(coin.high_24h, { compact: false })}
            icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
          />
          <StatBox
            label="24h Low"
            value={formatCurrency(coin.low_24h, { compact: false })}
            icon={<TrendingDown className="w-4 h-4 text-red-400" />}
          />
          <StatBox
            label="All-Time High"
            value={formatCurrency(coin.ath, { compact: false })}
            subValue={formatDate(coin.ath_date)}
            icon={<Clock className="w-4 h-4" />}
          />
          <StatBox
            label="All-Time Low"
            value={formatCurrency(coin.atl, { compact: false })}
            subValue={formatDate(coin.atl_date)}
            icon={<Clock className="w-4 h-4" />}
          />
        </div>

        {/* Price Changes */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            Price Performance
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm mb-1">24 Hours</div>
              <div className={`text-xl font-semibold ${getPriceChangeColor(coin.price_change_percentage_24h)}`}>
                {formatPercent(coin.price_change_percentage_24h)}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm mb-1">7 Days</div>
              <div className={`text-xl font-semibold ${typeof coin.price_change_percentage_7d === 'number' ? getPriceChangeColor(coin.price_change_percentage_7d) : 'text-gray-500'}`}>
                {typeof coin.price_change_percentage_7d === 'number' ? formatPercent(coin.price_change_percentage_7d) : '-'}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm mb-1">30 Days</div>
              <div className={`text-xl font-semibold ${typeof coin.price_change_percentage_30d === 'number' ? getPriceChangeColor(coin.price_change_percentage_30d) : 'text-gray-500'}`}>
                {typeof coin.price_change_percentage_30d === 'number' ? formatPercent(coin.price_change_percentage_30d) : '-'}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm mb-1">From ATH</div>
              <div className={`text-xl font-semibold ${getPriceChangeColor(coin.ath_change_percentage)}`}>
                {formatPercent(coin.ath_change_percentage)}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm mb-1">From ATL</div>
              <div className={`text-xl font-semibold ${getPriceChangeColor(coin.atl_change_percentage)}`}>
                {formatPercent(coin.atl_change_percentage)}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
