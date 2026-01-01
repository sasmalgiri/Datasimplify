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
  Brain,
  BarChart3,
  Users,
  Zap,
  Clock,
  Target,
  Database
} from 'lucide-react';
import PriceChart from '@/components/PriceChart';
import DownloadButton from '@/components/DownloadButton';
import { PredictionCard, PredictionBadge, RiskBadge } from '@/components/PredictionCard';
import PredictionFactors, { PredictionFactorsData } from '@/components/PredictionFactors';
import { TechnicalAnalysisPanel } from '@/components/TechnicalAnalysisPanel';
import { RiskScoreCard, OnChainMetrics } from '@/components/RiskScoreCard';
import { CoinMarketData } from '@/types/crypto';
import { formatCurrency, formatPercent, formatNumber, formatDate, getPriceChangeColor } from '@/lib/utils';
import { fetchWithCache, CACHE_TTL, getCacheStats } from '@/lib/clientCache';

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

// Prediction types
interface PredictionData {
  coinId: string;
  coinName: string;
  prediction: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  confidence: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';
  reasons: string[];
  technicalScore: number;
  sentimentScore: number;
  onChainScore: number;
  macroScore: number;
  overallScore: number;
  timestamp: string;
}

interface TechnicalData {
  rsi14: number;
  macdSignal: 'bullish_cross' | 'bearish_cross' | 'neutral';
  priceVs200MA: 'above' | 'below' | 'near';
  priceVs50MA: 'above' | 'below' | 'near';
  bollingerPosition: 'upper' | 'middle' | 'lower';
  volumeTrend: 'increasing' | 'decreasing' | 'stable';
}

interface OnChainData {
  exchangeFlow: 'inflow' | 'outflow' | 'neutral';
  whaleActivity: 'buying' | 'selling' | 'neutral';
  activeAddresses: 'increasing' | 'decreasing' | 'stable';
}

interface SentimentInfo {
  fearGreedIndex: number;
  fearGreedLabel: string;
}

export default function CoinDetailPage() {
  const params = useParams();
  const coinId = params.id as string;

  const [coin, setCoin] = useState<CoinMarketData | null>(null);
  const [priceHistory, setPriceHistory] = useState<Array<{ timestamp: number; price: number }>>([]);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [sentiment, setSentiment] = useState<SentimentInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [predictionLoading, setPredictionLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDetailedPrediction, setShowDetailedPrediction] = useState(false);
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
      fetchPrediction();
      fetchSentiment();
    }
  }, [coinId, fetchCoinData]);

  const fetchPrediction = async () => {
    try {
      setPredictionLoading(true);
      const res = await fetch(`/api/predict?coin=${coinId}&quick=true`);
      const data = await res.json();
      if (data.success && data.data) {
        setPrediction(data.data);
      }
    } catch (error) {
      console.error('Error fetching prediction:', error);
    } finally {
      setPredictionLoading(false);
    }
  };

  const fetchSentiment = async () => {
    try {
      const res = await fetch('https://api.alternative.me/fng/?limit=1');
      const data = await res.json();
      if (data.data?.[0]) {
        setSentiment({
          fearGreedIndex: parseInt(data.data[0].value),
          fearGreedLabel: data.data[0].value_classification
        });
      }
    } catch (error) {
      console.error('Error fetching sentiment:', error);
    }
  };

  const refreshAllData = async () => {
    setRefreshing(true);
    setLoading(true);
    // Force refresh all data (bypass cache)
    await Promise.all([
      fetchCoinData(true),
      fetchPrediction(),
      fetchSentiment()
    ]);
    setRefreshing(false);
  };

  // Simulate technical data from market data
  const getTechnicalData = (): TechnicalData | null => {
    if (!coin) return null;

    const priceChange = (coin.price_change_percentage_24h || 0) + (coin.price_change_percentage_7d || 0) * 0.5;
    let rsi14 = 50 + priceChange * 2;
    rsi14 = Math.max(10, Math.min(90, rsi14));

    let macdSignal: 'bullish_cross' | 'bearish_cross' | 'neutral' = 'neutral';
    if ((coin.price_change_percentage_24h || 0) > 3 && (coin.price_change_percentage_7d || 0) > 5) {
      macdSignal = 'bullish_cross';
    } else if ((coin.price_change_percentage_24h || 0) < -3 && (coin.price_change_percentage_7d || 0) < -5) {
      macdSignal = 'bearish_cross';
    }

    let priceVs200MA: 'above' | 'below' | 'near' = 'near';
    let priceVs50MA: 'above' | 'below' | 'near' = 'near';
    if ((coin.price_change_percentage_30d || 0) > 10) {
      priceVs200MA = 'above';
      priceVs50MA = 'above';
    } else if ((coin.price_change_percentage_30d || 0) < -10) {
      priceVs200MA = 'below';
      priceVs50MA = 'below';
    }

    const volatility = Math.abs(coin.high_24h - coin.low_24h) / coin.current_price * 100;
    let bollingerPosition: 'upper' | 'middle' | 'lower' = 'middle';
    if ((coin.price_change_percentage_24h || 0) > 5 && volatility > 5) {
      bollingerPosition = 'upper';
    } else if ((coin.price_change_percentage_24h || 0) < -5 && volatility > 5) {
      bollingerPosition = 'lower';
    }

    const volumeToMarketCap = coin.total_volume / coin.market_cap;
    let volumeTrend: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (volumeToMarketCap > 0.15) {
      volumeTrend = 'increasing';
    } else if (volumeToMarketCap < 0.05) {
      volumeTrend = 'decreasing';
    }

    return { rsi14, macdSignal, priceVs200MA, priceVs50MA, bollingerPosition, volumeTrend };
  };

  // Simulate on-chain data
  const getOnChainData = (): OnChainData | null => {
    if (!coin) return null;

    let exchangeFlow: 'inflow' | 'outflow' | 'neutral' = 'neutral';
    if ((coin.price_change_percentage_7d || 0) > 5) {
      exchangeFlow = 'outflow';
    } else if ((coin.price_change_percentage_7d || 0) < -5) {
      exchangeFlow = 'inflow';
    }

    let whaleActivity: 'buying' | 'selling' | 'neutral' = 'neutral';
    if ((coin.price_change_percentage_24h || 0) > 3 && coin.total_volume > coin.market_cap * 0.1) {
      whaleActivity = 'buying';
    } else if ((coin.price_change_percentage_24h || 0) < -3 && coin.total_volume > coin.market_cap * 0.1) {
      whaleActivity = 'selling';
    }

    const volumeRatio = coin.total_volume / coin.market_cap;
    let activeAddresses: 'increasing' | 'decreasing' | 'stable' = 'stable';
    if (volumeRatio > 0.12) {
      activeAddresses = 'increasing';
    } else if (volumeRatio < 0.03) {
      activeAddresses = 'decreasing';
    }

    return { exchangeFlow, whaleActivity, activeAddresses };
  };

  // Build PredictionFactorsData for detailed view
  const buildPredictionFactorsData = (): PredictionFactorsData | null => {
    if (!prediction || !coin || !sentiment) return null;

    const tech = getTechnicalData();
    const onchain = getOnChainData();

    return {
      technicalScore: prediction.technicalScore,
      sentimentScore: prediction.sentimentScore,
      onChainScore: prediction.onChainScore,
      macroScore: prediction.macroScore,
      overallScore: prediction.overallScore,
      prediction: prediction.prediction,
      confidence: prediction.confidence,
      technical: tech ? {
        rsi: { value: tech.rsi14, signal: tech.rsi14 < 30 ? 'Oversold' : tech.rsi14 > 70 ? 'Overbought' : 'Neutral' },
        macd: { signal: tech.macdSignal === 'bullish_cross' ? 'Bullish crossover' : tech.macdSignal === 'bearish_cross' ? 'Bearish crossover' : 'Neutral', histogram: 0 },
        priceVsMA200: { percentage: coin.price_change_percentage_30d || 0, signal: tech.priceVs200MA === 'above' ? 'Bullish' : tech.priceVs200MA === 'below' ? 'Bearish' : 'Neutral' },
        bollingerPosition: tech.bollingerPosition === 'upper' ? 'Upper band' : tech.bollingerPosition === 'lower' ? 'Lower band' : 'Middle band',
        volumeTrend: tech.volumeTrend === 'increasing' ? 'Increasing' : tech.volumeTrend === 'decreasing' ? 'Decreasing' : 'Stable',
        supportResistance: coin.price_change_percentage_24h && coin.price_change_percentage_24h > 0 ? 'Testing resistance' : 'Testing support',
      } : undefined,
      sentiment: {
        fearGreedIndex: { value: sentiment.fearGreedIndex, label: sentiment.fearGreedLabel },
        socialSentiment: sentiment.fearGreedIndex > 50 ? 'Mostly positive' : sentiment.fearGreedIndex < 30 ? 'Mostly negative' : 'Mixed',
        newsAnalysis: 'Neutral',
        twitterMentions: { trend: 'Stable', change: 0 },
      },
      onChain: onchain ? {
        exchangeFlow: { net: onchain.exchangeFlow === 'outflow' ? 'Outflow' : onchain.exchangeFlow === 'inflow' ? 'Inflow' : 'Neutral', signal: onchain.exchangeFlow === 'outflow' ? 'Bullish' : onchain.exchangeFlow === 'inflow' ? 'Bearish' : 'Neutral' },
        whaleActivity: onchain.whaleActivity === 'buying' ? 'Accumulating' : onchain.whaleActivity === 'selling' ? 'Distributing' : 'Neutral',
        activeAddresses: { trend: onchain.activeAddresses === 'increasing' ? 'Increasing' : onchain.activeAddresses === 'decreasing' ? 'Decreasing' : 'Stable', change: 0 },
        holdingDistribution: 'Normal distribution',
      } : undefined,
      macro: {
        vix: { value: 20, signal: 'Neutral' },
        dxy: { value: 104, signal: 'Neutral' },
        riskEnvironment: 'Risk-on',
        btcCorrelation: coinId === 'bitcoin' ? 100 : 75,
        marketCycle: 'Mid-cycle',
      },
      derivatives: {
        fundingRate: { value: 0.01, signal: 'Neutral' },
        openInterest: { change: 5, signal: 'Bullish' },
        liquidations24h: { value: 120000000, predominant: 'Shorts' },
        longShortRatio: 1.2,
      },
    };
  };

  const technicalData = getTechnicalData();
  const onChainData = getOnChainData();
  const predictionFactorsData = buildPredictionFactorsData();

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
                {prediction && (
                  <PredictionBadge
                    prediction={prediction.prediction}
                    confidence={prediction.confidence}
                    size="md"
                  />
                )}
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

        {/* AI Prediction Panel */}
        <div className="mb-8">
          {/* Toggle Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Brain className="w-6 h-6 text-purple-400" />
              AI Prediction Analysis
            </h2>
            {prediction && (
              <button
                type="button"
                onClick={() => setShowDetailedPrediction(!showDetailedPrediction)}
                className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
              >
                {showDetailedPrediction ? 'Show Summary' : 'Show All Factors'}
              </button>
            )}
          </div>

          {predictionLoading ? (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 animate-pulse">
              <div className="h-6 bg-gray-700 rounded w-32 mb-4" />
              <div className="h-4 bg-gray-700 rounded w-full mb-2" />
              <div className="h-4 bg-gray-700 rounded w-3/4" />
            </div>
          ) : prediction && showDetailedPrediction && predictionFactorsData ? (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <PredictionFactors
                data={predictionFactorsData}
                coinName={coin.name}
                coinSymbol={coin.symbol.toUpperCase()}
                showDisclaimer={true}
              />
            </div>
          ) : prediction ? (
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <PredictionCard
                  prediction={prediction.prediction}
                  confidence={prediction.confidence}
                  riskLevel={prediction.riskLevel}
                  reasons={prediction.reasons}
                  technicalScore={prediction.technicalScore}
                  sentimentScore={prediction.sentimentScore}
                  onChainScore={prediction.onChainScore}
                  macroScore={prediction.macroScore}
                  overallScore={prediction.overallScore}
                  coinName={coin.name}
                  showDetails={true}
                />
              </div>
              {/* Sentiment Panel - moved inside the grid for summary view */}
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
                  {prediction && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Risk Level</span>
                      <RiskBadge level={prediction.riskLevel} size="xs" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 text-center">
              <Brain className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-gray-400">Prediction unavailable</p>
            </div>
          )}
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

          {/* Risk Assessment */}
          {prediction && (
            <RiskScoreCard
              overallRisk={prediction.riskLevel}
              riskScore={100 - prediction.overallScore}
              technicalRisk={prediction.technicalScore < 40 ? 'HIGH' : prediction.technicalScore > 60 ? 'LOW' : 'MEDIUM'}
              sentimentRisk={prediction.sentimentScore < 40 ? 'HIGH' : prediction.sentimentScore > 60 ? 'LOW' : 'MEDIUM'}
              compact={true}
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
              <div className={`text-xl font-semibold ${getPriceChangeColor(coin.price_change_percentage_7d || 0)}`}>
                {coin.price_change_percentage_7d ? formatPercent(coin.price_change_percentage_7d) : '-'}
              </div>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-gray-400 text-sm mb-1">30 Days</div>
              <div className={`text-xl font-semibold ${getPriceChangeColor(coin.price_change_percentage_30d || 0)}`}>
                {coin.price_change_percentage_30d ? formatPercent(coin.price_change_percentage_30d) : '-'}
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
