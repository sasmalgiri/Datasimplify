'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import html2canvas from 'html2canvas';
import { WalletDistributionTreemap } from '@/components/features/WalletDistributionTreemap';
import { ChartExcelModal, ChartExcelButton, CHART_EXCEL_CONFIG } from '@/components/ChartExcelModal';
import { SUPPORTED_COINS } from '@/lib/dataTypes';
import {
  areAllSourcesRedistributableClient,
  isAnySourceRedistributableClient,
  isDownloadCategoryRedistributableClient,
} from '@/lib/redistributionPolicyClient';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  Brush,
} from 'recharts';

import { LoadingWithAttribution, CoinGeckoAttribution, EmptyWithAttribution } from '@/components/CoinGeckoAttribution';

// Loading fallback for Suspense
function ChartLoading() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <LoadingWithAttribution message="Loading charts" className="min-h-[400px]" />
    </div>
  );
}

// Dynamic bar component using ref to avoid inline style warnings
function DynamicBar({
  width,
  color,
  children,
  className = ''
}: {
  width: number;
  color: string;
  children: React.ReactNode;
  className?: string;
}) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.setProperty('--bar-width', `${width}%`);
      barRef.current.style.setProperty('--bar-color', color);
    }
  }, [width, color]);

  return (
    <div ref={barRef} className={`dynamic-bar ${className}`}>
      {children}
    </div>
  );
}

// Fibonacci card component using ref for dynamic border and text color
function FibCard({ level, price, color, formatFn }: { level: string; price: number; color: string; formatFn: (v: number) => string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (cardRef.current) {
      cardRef.current.style.borderColor = color;
    }
    if (textRef.current) {
      textRef.current.style.color = color;
    }
  }, [color]);

  return (
    <div ref={cardRef} className="bg-gray-700/50 rounded-lg p-3 border-l-4">
      <div className="text-xs text-gray-400">{level}</div>
      <div ref={textRef} className="text-lg font-bold">{formatFn(price)}</div>
    </div>
  );
}

// Progress bar with dynamic width using ref
function WidthBar({ percentage, className = '', children }: { percentage: number; className?: string; children?: React.ReactNode }) {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
    }
  }, [percentage]);

  return <div ref={barRef} className={className}>{children}</div>;
}

// Fear/Greed colored text using ref
function FGColoredText({ value, className = '', children }: { value: number; className?: string; children?: React.ReactNode }) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      const color = value <= 25 ? '#EF4444' : value <= 45 ? '#F59E0B' : value <= 55 ? '#6B7280' : value <= 75 ? '#10B981' : '#22C55E';
      textRef.current.style.color = color;
    }
  }, [value]);

  return <div ref={textRef} className={className}>{children}</div>;
}

// Fear/Greed gauge marker position
function FGMarker({ position }: { position: number }) {
  const markerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (markerRef.current) {
      markerRef.current.style.left = `${Math.max(0, Math.min(100, position))}%`;
    }
  }, [position]);

  return <div ref={markerRef} className="absolute top-0 w-3 h-3 bg-white rounded-full shadow-lg transform -translate-y-0" />;
}

// Chart type definitions - expanded to 19 chart types
type ChartType =
  | 'price_history'
  | 'candlestick'
  | 'volatility'
  | 'correlation'
  | 'racing_bar'
  | 'market_dominance'
  | 'volume_analysis'
  | 'momentum'
  // New chart types
  | 'fibonacci'
  | 'volume_profile'
  | 'funding_rate'
  | 'open_interest'
  | 'liquidation_heatmap'
  | 'whale_flow'
  | 'wallet_distribution'
  | 'active_addresses'
  | 'fear_greed_history'
  | 'social_volume'
  | 'btc_dominance';

interface ChartConfig {
  type: ChartType;
  title: string;
  description: string;
  icon: string;
  category: 'historical' | 'volatility' | 'comparison' | 'onchain' | 'derivatives' | 'sentiment';
}

const CHART_CONFIGS: ChartConfig[] = [
  // Historical Charts
  { type: 'price_history', title: 'Price History', description: 'Historical price trends with moving averages', icon: '📈', category: 'historical' },
  { type: 'candlestick', title: 'Candlestick', description: 'OHLC candlestick chart for trading analysis', icon: '🕯️', category: 'historical' },
  { type: 'volume_analysis', title: 'Volume Analysis', description: 'Trading volume with price overlay', icon: '📊', category: 'historical' },

  // Technical Analysis Charts
  { type: 'volatility', title: 'Volatility Index', description: 'Price volatility over time', icon: '📉', category: 'volatility' },
  { type: 'momentum', title: 'Momentum Indicators', description: 'RSI, MACD, and other momentum metrics', icon: '⚡', category: 'volatility' },
  { type: 'fibonacci', title: 'Fibonacci Retracement', description: 'Key support/resistance levels', icon: '🔢', category: 'volatility' },
  { type: 'volume_profile', title: 'Volume Profile', description: 'Volume distribution at price levels', icon: '📶', category: 'volatility' },

  // Comparison Charts
  { type: 'correlation', title: 'Correlation Matrix', description: 'Asset correlation heatmap', icon: '🔗', category: 'comparison' },
  { type: 'racing_bar', title: 'Racing Bar Chart', description: 'Animated market cap ranking over time', icon: '🏎️', category: 'comparison' },
  { type: 'market_dominance', title: 'Market Dominance', description: 'Market share distribution', icon: '🥧', category: 'comparison' },
  { type: 'btc_dominance', title: 'BTC Dominance History', description: 'Bitcoin dominance over time', icon: '👑', category: 'comparison' },

  // Derivatives Charts
  { type: 'funding_rate', title: 'Funding Rate History', description: 'Futures funding rates over time', icon: '💹', category: 'derivatives' },
  { type: 'open_interest', title: 'Open Interest', description: 'OI changes with price overlay', icon: '📋', category: 'derivatives' },
  { type: 'liquidation_heatmap', title: 'Liquidation Heatmap', description: 'Predicted liquidation levels', icon: '🔥', category: 'derivatives' },

  // On-Chain Charts
  { type: 'whale_flow', title: 'Whale Flow', description: 'Exchange in/out flows by whales', icon: '🐋', category: 'onchain' },
  { type: 'wallet_distribution', title: 'Wallet Distribution', description: 'BTC holder distribution treemap', icon: '🐳', category: 'onchain' },
  { type: 'active_addresses', title: 'Active Addresses', description: 'Network activity over time', icon: '👥', category: 'onchain' },

  // Sentiment Charts
  { type: 'fear_greed_history', title: 'Fear & Greed History', description: 'Historical fear/greed index', icon: '😱', category: 'sentiment' },
  { type: 'social_volume', title: 'Social Volume', description: 'Social mentions & engagement', icon: '📣', category: 'sentiment' },
];

function isChartTypeAllowed(chartType: ChartType): boolean {
  // Chart types that render “unavailable” placeholders are safe to keep.
  if (chartType === 'wallet_distribution' || chartType === 'active_addresses' || chartType === 'social_volume' || chartType === 'liquidation_heatmap') {
    return true;
  }

  // History/candle-based charts: allow if at least one permitted source can serve (coingecko).
  if (
    chartType === 'price_history' ||
    chartType === 'candlestick' ||
    chartType === 'volume_analysis' ||
    chartType === 'volatility' ||
    chartType === 'momentum' ||
    chartType === 'fibonacci' ||
    chartType === 'volume_profile' ||
    chartType === 'correlation' ||
    chartType === 'racing_bar' ||
    chartType === 'market_dominance' ||
    chartType === 'btc_dominance'
  ) {
    return isAnySourceRedistributableClient(['coingecko']);
  }

  if (chartType === 'funding_rate' || chartType === 'open_interest') {
    return areAllSourcesRedistributableClient(['coingecko']);
  }

  if (chartType === 'whale_flow') {
    return areAllSourcesRedistributableClient(['etherscan', 'coingecko']);
  }

  if (chartType === 'fear_greed_history') {
    return areAllSourcesRedistributableClient(['alternativeme']);
  }

  // Default: strict.
  return false;
}

const AVAILABLE_CHART_CONFIGS: ChartConfig[] = CHART_CONFIGS.filter(c => isChartTypeAllowed(c.type));

// Initial coin list from static config (will be replaced with dynamic list)
const INITIAL_COINS = SUPPORTED_COINS.map(coin => ({
  id: coin.symbol.toLowerCase(),
  name: coin.name,
  symbol: coin.symbol,
}));

// This will be populated dynamically - use INITIAL_COINS as fallback
let COINS = INITIAL_COINS;

const TIME_RANGES = [
  { value: '1', label: '24H' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: '365', label: '1Y' },
];

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

// Valid chart types for URL validation
const VALID_CHART_TYPES: ChartType[] = [
  'price_history', 'candlestick', 'volatility', 'correlation', 'racing_bar',
  'market_dominance', 'volume_analysis',
  'momentum', 'fibonacci', 'volume_profile', 'funding_rate', 'open_interest',
  'liquidation_heatmap', 'whale_flow', 'wallet_distribution', 'active_addresses',
  'fear_greed_history', 'social_volume', 'btc_dominance'
];

function ChartsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialized = useRef(false);

  // Initialize state with defaults - URL params loaded in useEffect
  const [selectedChart, setSelectedChart] = useState<ChartType>('price_history');
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [timeRange, setTimeRange] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);
  const [candlestickData, setCandlestickData] = useState<Record<string, unknown>[]>([]);
    const [racingData, setRacingData] = useState<Record<string, unknown>[]>([]);
  const [racingFrame, setRacingFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [derivativesData, setDerivativesData] = useState<Record<string, unknown> | null>(null);
  const [fundingHistory, setFundingHistory] = useState<{ timestamp: number; fundingRate: number; fundingTime: string }[] | null>(null);
  const [oiHistory, setOiHistory] = useState<{ timestamp: number; openInterest: number; openInterestValue: number }[] | null>(null);
  const [longShortHistory, setLongShortHistory] = useState<{ timestamp: number; longShortRatio: number; longPercent: number; shortPercent: number }[] | null>(null);
  const [whaleFlows, setWhaleFlows] = useState<Record<string, unknown>[] | null>(null);
  const [globalStats, setGlobalStats] = useState<Record<string, unknown> | null>(null);
  const [fearGreedHistory, setFearGreedHistory] = useState<Record<string, unknown>[] | null>(null);
  const [correlationMatrix, setCorrelationMatrix] = useState<Record<string, unknown>[] | null>(null);
  const [communityData, setCommunityData] = useState<{
    watchlist_users: number;
    sentiment_up: number;
    sentiment_down: number;
  } | null>(null);
  const [showMA, setShowMA] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [chartStyle, setChartStyle] = useState<'line' | 'area'>('area');
  const [excelModalChart, setExcelModalChart] = useState<{ type: string; title: string } | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const [availableCoins, setAvailableCoins] = useState(INITIAL_COINS);

  // Fetch all available coins dynamically (600+)
  useEffect(() => {
    async function fetchCoins() {
      try {
        const res = await fetch('/api/crypto/all');
        const data = await res.json();
        if (data.success && data.coins && data.coins.length > 0) {
          const coinsList = data.coins.map((c: { id: string; name: string; symbol: string }) => ({
            id: c.id,
            name: c.name,
            symbol: c.symbol,
          }));
          setAvailableCoins(coinsList);
          // Update module-level COINS for backwards compatibility
          COINS = coinsList;
        }
      } catch (error) {
        console.error('Failed to fetch coins:', error);
      }
    }
    fetchCoins();
  }, []);

  // Enforce allowed chart types in strict redistribution mode
  useEffect(() => {
    if (isChartTypeAllowed(selectedChart)) return;
    const fallback = AVAILABLE_CHART_CONFIGS[0]?.type;
    if (fallback) setSelectedChart(fallback);
  }, [selectedChart]);

  // Initialize state from URL params on mount (client-side only)
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const chart = searchParams.get('chart');
    if (chart && VALID_CHART_TYPES.includes(chart as ChartType) && isChartTypeAllowed(chart as ChartType)) {
      setSelectedChart(chart as ChartType);
    }

    const coin = searchParams.get('coin');
    if (coin && COINS.some(c => c.id === coin)) {
      setSelectedCoin(coin);
    }

    const range = searchParams.get('range');
    if (range && TIME_RANGES.some(t => t.value === range)) {
      setTimeRange(range);
    }

    const ma = searchParams.get('ma');
    if (ma === 'false') {
      setShowMA(false);
    }

    const volume = searchParams.get('volume');
    if (volume === 'false') {
      setShowVolume(false);
    }

    const style = searchParams.get('style');
    if (style === 'line' || style === 'area') {
      setChartStyle(style);
    }
  }, [searchParams]);

  // Sync state to URL (only after initialization)
  useEffect(() => {
    if (!isInitialized.current) return;

    const params = new URLSearchParams();
    params.set('chart', selectedChart);
    params.set('coin', selectedCoin);
    params.set('range', timeRange);
    params.set('ma', showMA.toString());
    params.set('volume', showVolume.toString());
    params.set('style', chartStyle);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [selectedChart, selectedCoin, timeRange, showMA, showVolume, chartStyle, router]);

  // Fetch chart data based on selected options
  const generateRacingData = useCallback(async () => {
    try {
      const res = await fetch('/api/crypto?limit=15');
      const json = await res.json();
      const coins = Array.isArray(json?.data) ? json.data : [];

      const frame = {
        date: new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        coins: coins
          .filter((c: any) => c?.symbol && c?.name)
          .map((c: any) => ({
            id: String(c.id ?? c.symbol ?? c.name).toLowerCase(),
            symbol: String(c.symbol).toUpperCase(),
            name: String(c.name),
            marketCap: typeof c.market_cap === 'number' ? c.market_cap : 0,
          }))
          .sort((a: any, b: any) => (b.marketCap || 0) - (a.marketCap || 0)),
      };

      setRacingData([frame]);
      setRacingFrame(0);
      setIsPlaying(false);
    } catch (e) {
      console.error('Error fetching racing data:', e);
      setRacingData([]);
      setRacingFrame(0);
      setIsPlaying(false);
    }
  }, []);

  const fetchChartData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch price history
      const historyRes = await fetch(`/api/charts/history?coin=${selectedCoin}&days=${timeRange}`);
      const historyData = await historyRes.json();

      if (historyData.prices) {
        const processed = historyData.prices.map((p: { timestamp: number; price: number }, i: number, arr: { timestamp: number; price: number }[]) => {
          // Calculate moving averages
          const ma7 = i >= 6 ? arr.slice(i - 6, i + 1).reduce((sum: number, d: { price: number }) => sum + d.price, 0) / 7 : null;
          const ma30 = i >= 29 ? arr.slice(i - 29, i + 1).reduce((sum: number, d: { price: number }) => sum + d.price, 0) / 30 : null;

          // Calculate volatility (simplified)
          const volatility = i > 0 ? Math.abs((p.price - arr[i-1].price) / arr[i-1].price * 100) : 0;

          return {
            date: new Date(p.timestamp).toLocaleDateString(),
            timestamp: p.timestamp,
            price: p.price,
            ma7,
            ma30,
            volatility,
            volume: typeof (historyData.prices[i] as unknown as Record<string, unknown>)?.volume === 'number' ? (historyData.prices[i] as unknown as Record<string, number>).volume : null,
          };
        });
        setChartData(processed);
      }

      // Fetch candlestick data for candlestick chart
      const candleRes = await fetch(`/api/charts/candles?coin=${selectedCoin}&days=${timeRange}`);
      const candleData = await candleRes.json();
      if (candleData.candles) {
        setCandlestickData(candleData.candles.map((c: { timestamp: number; open: number; high: number; low: number; close: number; volume: number }) => ({
          date: new Date(c.timestamp).toLocaleDateString(),
          ...c,
        })));
      }

      // Generate racing bar data
      await generateRacingData();
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setChartData([]);
      setCandlestickData([]);
      setRacingData([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCoin, timeRange, generateRacingData]);

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  useEffect(() => {
    const controller = new AbortController();

    const run = async () => {
      try {
        if (selectedChart === 'funding_rate' || selectedChart === 'open_interest' || selectedChart === 'liquidation_heatmap') {
          const res = await fetch('/api/derivatives', { signal: controller.signal });
          const json = await res.json();
          setDerivativesData(json?.success ? (json.data as Record<string, unknown>) : null);

          // Fetch historical data for charts
          if (selectedChart === 'funding_rate') {
            const [fundingRes, lsRes] = await Promise.all([
              fetch('/api/derivatives/history?type=funding&limit=100', { signal: controller.signal }),
              fetch('/api/derivatives/history?type=longshort&limit=100', { signal: controller.signal })
            ]);
            const fundingJson = await fundingRes.json();
            const lsJson = await lsRes.json();
            setFundingHistory(fundingJson?.success ? fundingJson.data : null);
            setLongShortHistory(lsJson?.success ? lsJson.data : null);
          } else {
            setFundingHistory(null);
            setLongShortHistory(null);
          }

          if (selectedChart === 'open_interest') {
            const oiRes = await fetch('/api/derivatives/history?type=oi&limit=100', { signal: controller.signal });
            const oiJson = await oiRes.json();
            setOiHistory(oiJson?.success ? oiJson.data : null);
          } else {
            setOiHistory(null);
          }
        } else {
          setDerivativesData(null);
          setFundingHistory(null);
          setOiHistory(null);
          setLongShortHistory(null);
        }

        if (selectedChart === 'whale_flow') {
          const res = await fetch('/api/whales?type=exchange-flows', { signal: controller.signal });
          const json = await res.json();
          setWhaleFlows(Array.isArray(json?.data) ? (json.data as Record<string, unknown>[]) : []);
        } else {
          setWhaleFlows(null);
        }

        if (selectedChart === 'btc_dominance') {
          const res = await fetch('/api/crypto/global', { signal: controller.signal });
          const json = await res.json();
          setGlobalStats(json?.data ? (json.data as Record<string, unknown>) : null);
        } else {
          setGlobalStats(null);
        }

        if (selectedChart === 'fear_greed_history') {
          const res = await fetch(`/api/onchain/fear-greed-history?limit=${encodeURIComponent(timeRange)}`, { signal: controller.signal });
          const json = await res.json();
          setFearGreedHistory(Array.isArray(json?.data) ? (json.data as Record<string, unknown>[]) : []);
        } else {
          setFearGreedHistory(null);
        }

        if (selectedChart === 'social_volume') {
          // Use coin details API which includes community data from CoinGecko
          const coinId = selectedCoin || 'bitcoin';
          const res = await fetch(`/api/crypto/${coinId}/details`, { signal: controller.signal });
          const json = await res.json();
          if (json?.success && json?.data) {
            const sentiment = json.data.sentiment;
            setCommunityData({
              watchlist_users: json.data.watchlist_users || 0,
              sentiment_up: sentiment?.votes_up_percentage || 0,
              sentiment_down: sentiment?.votes_down_percentage || 0,
            });
          } else {
            setCommunityData(null);
          }
        } else {
          setCommunityData(null);
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') return;
        console.error('Error fetching aux chart data:', e);
        setDerivativesData(null);
        setWhaleFlows(null);
        setCommunityData(null);
        setGlobalStats(null);
        setFearGreedHistory(null);
      }
    };

    run();
    return () => controller.abort();
  }, [selectedChart, timeRange, selectedCoin]);

  const calculateRSISeries = (prices: number[], period: number = 14): Array<number | null> => {
    if (prices.length < period + 1) return prices.map(() => null);

    const rsis: Array<number | null> = prices.map(() => null);
    let gains = 0;
    let losses = 0;

    for (let i = 1; i <= period; i++) {
      const diff = prices[i] - prices[i - 1];
      if (diff >= 0) gains += diff;
      else losses -= diff;
    }

    let avgGain = gains / period;
    let avgLoss = losses / period;
    const firstRS = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    rsis[period] = 100 - 100 / (1 + firstRS);

    for (let i = period + 1; i < prices.length; i++) {
      const diff = prices[i] - prices[i - 1];
      const gain = diff > 0 ? diff : 0;
      const loss = diff < 0 ? -diff : 0;
      avgGain = (avgGain * (period - 1) + gain) / period;
      avgLoss = (avgLoss * (period - 1) + loss) / period;
      const rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
      rsis[i] = 100 - 100 / (1 + rs);
    }

    return rsis;
  };

  const calculateEMA = (prices: number[], period: number): Array<number | null> => {
    const ema: Array<number | null> = prices.map(() => null);
    if (prices.length < period) return ema;

    const k = 2 / (period + 1);
    let prev = prices.slice(0, period).reduce((s, p) => s + p, 0) / period;
    ema[period - 1] = prev;

    for (let i = period; i < prices.length; i++) {
      prev = prices[i] * k + prev * (1 - k);
      ema[i] = prev;
    }

    return ema;
  };

  const calculateMACD = (prices: number[]) => {
    const ema12 = calculateEMA(prices, 12);
    const ema26 = calculateEMA(prices, 26);
    const macd: Array<number | null> = prices.map(() => null);
    for (let i = 0; i < prices.length; i++) {
      if (ema12[i] === null || ema26[i] === null) continue;
      macd[i] = (ema12[i] as number) - (ema26[i] as number);
    }

    const macdVals = macd.map(v => (v === null ? 0 : v));
    const signalRaw = calculateEMA(macdVals, 9);
    const signal: Array<number | null> = prices.map(() => null);
    for (let i = 0; i < prices.length; i++) {
      if (macd[i] === null || signalRaw[i] === null) continue;
      signal[i] = signalRaw[i];
    }

    return { macd, signal };
  };

  const pearsonCorrelation = (a: number[], b: number[]) => {
    const n = Math.min(a.length, b.length);
    if (n < 3) return null;
    const meanA = a.slice(0, n).reduce((s, v) => s + v, 0) / n;
    const meanB = b.slice(0, n).reduce((s, v) => s + v, 0) / n;
    let num = 0;
    let denA = 0;
    let denB = 0;
    for (let i = 0; i < n; i++) {
      const da = a[i] - meanA;
      const db = b[i] - meanB;
      num += da * db;
      denA += da * da;
      denB += db * db;
    }
    const den = Math.sqrt(denA * denB);
    if (!den) return null;
    return num / den;
  };

  const buildCorrelationMatrix = useCallback(async () => {
    try {
      const selectedCoinData = COINS.find(c => c.id === selectedCoin);
      const otherCoins = COINS.filter(c => c.id !== selectedCoin).slice(0, 5);
      const correlationCoins = selectedCoinData ? [selectedCoinData, ...otherCoins] : COINS.slice(0, 6);

      const histories = await Promise.all(
        correlationCoins.map(async (coin) => {
          const res = await fetch(`/api/charts/history?coin=${coin.id}&days=${timeRange}`);
          const json = await res.json();
          const prices = Array.isArray(json?.prices) ? json.prices.map((p: any) => p.price).filter((v: any) => typeof v === 'number') : [];
          const returns = prices.slice(1).map((p: number, i: number) => {
            const prev = prices[i];
            return prev ? (p - prev) / prev : 0;
          });
          return { symbol: coin.symbol, id: coin.id, returns };
        })
      );

      const matrix = correlationCoins.map((coin1) => {
        const row: Record<string, unknown> = { name: coin1.symbol };
        for (const coin2 of correlationCoins) {
          if (coin1.id === coin2.id) {
            row[coin2.symbol] = 1;
            continue;
          }
          const a = histories.find(h => h.id === coin1.id)?.returns ?? [];
          const b = histories.find(h => h.id === coin2.id)?.returns ?? [];
          const corr = pearsonCorrelation(a, b);
          row[coin2.symbol] = corr === null ? null : Number(corr.toFixed(2));
        }
        return row;
      });

      setCorrelationMatrix(matrix);
    } catch (e) {
      console.error('Error building correlation matrix:', e);
      setCorrelationMatrix([]);
    }
  }, [selectedCoin, timeRange]);

  useEffect(() => {
    if (selectedChart === 'correlation') {
      buildCorrelationMatrix();
    } else {
      setCorrelationMatrix(null);
    }
  }, [selectedChart, buildCorrelationMatrix]);

  // Racing bar animation
  useEffect(() => {
    if (isPlaying && racingData.length > 0) {
      const interval = setInterval(() => {
        setRacingFrame(prev => (prev + 1) % racingData.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, racingData.length]);

  // Download chart as image (PNG/SVG only)
  const downloadChart = async (format: 'png' | 'svg') => {
    if (!chartRef.current) return;

    // For PNG/SVG, use html2canvas for reliable capture
    try {
      if (!chartRef.current) {
        console.error('Chart ref not available');
        return;
      }

      if (format === 'svg') {
        // Try to get SVG directly
        const svg = chartRef.current.querySelector('svg');
        if (svg) {
          const svgData = new XMLSerializer().serializeToString(svg);
          const blob = new Blob([svgData], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${selectedCoin}_${selectedChart}_${timeRange}d.svg`;
          a.click();
          URL.revokeObjectURL(url);
        }
      } else {
        // Use html2canvas for PNG - captures the entire chart container with styles
        const canvas = await html2canvas(chartRef.current, {
          backgroundColor: '#1f2937', // Match the dark background
          scale: 2, // Higher resolution
          logging: false,
          useCORS: true,
          allowTaint: true,
        });

        canvas.toBlob((blob) => {
          if (blob) {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${selectedCoin}_${selectedChart}_${timeRange}d.png`;
            a.click();
            URL.revokeObjectURL(url);
          }
        }, 'image/png', 0.95);
      }
    } catch (error) {
      console.error('Error downloading chart:', error);
      // Fallback: try basic SVG method
      try {
        const svg = chartRef.current?.querySelector('svg');
        if (svg && format === 'png') {
          const svgData = new XMLSerializer().serializeToString(svg);
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          const img = new Image();
          img.onload = () => {
            canvas.width = img.width * 2;
            canvas.height = img.height * 2;
            ctx?.scale(2, 2);
            ctx?.drawImage(img, 0, 0);
            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${selectedCoin}_${selectedChart}_${timeRange}d.png`;
                a.click();
                URL.revokeObjectURL(url);
              }
            }, 'image/png');
          };
          const bytes = new TextEncoder().encode(svgData);
          const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join('');
          img.src = 'data:image/svg+xml;base64,' + btoa(binString);
        }
      } catch (fallbackError) {
        console.error('Fallback download also failed:', fallbackError);
      }
    }
  };

  // Format numbers for display
  const formatValue = (value: number, type: 'price' | 'volume' | 'percent' = 'price') => {
    if (type === 'percent') return `${value.toFixed(2)}%`;
    if (type === 'volume') {
      if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
      if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
      return `$${value.toFixed(0)}`;
    }
    return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Render different chart types
  const renderChart = () => {
    if (isLoading) {
      return <LoadingWithAttribution message="Loading chart data" className="h-96" />;
    }

    if (chartData.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center h-96 gap-4">
          <span className="text-gray-400">No data available</span>
          <CoinGeckoAttribution variant="compact" />
        </div>
      );
    }

    switch (selectedChart) {
      case 'price_history':
        return (
          <ResponsiveContainer width="100%" height={500}>
            {chartStyle === 'area' ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => formatValue(v)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value) => value !== undefined ? [formatValue(value as number), 'Price'] : ['', '']}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#priceGradient)"
                  name="Price"
                />
                {showMA && (
                  <>
                    <Line type="monotone" dataKey="ma7" stroke="#10B981" dot={false} name="MA7" strokeWidth={2} />
                    <Line type="monotone" dataKey="ma30" stroke="#F59E0B" dot={false} name="MA30" strokeWidth={2} />
                  </>
                )}
                <Brush dataKey="date" height={30} stroke="#3B82F6" fill="#1F2937" />
              </AreaChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <YAxis
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => formatValue(v)}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value) => value !== undefined ? [formatValue(value as number), 'Price'] : ['', '']}
                />
                <Legend />
                <Line type="monotone" dataKey="price" stroke="#3B82F6" dot={false} name="Price" strokeWidth={2} />
                {showMA && (
                  <>
                    <Line type="monotone" dataKey="ma7" stroke="#10B981" dot={false} name="MA7" strokeWidth={2} />
                    <Line type="monotone" dataKey="ma30" stroke="#F59E0B" dot={false} name="MA30" strokeWidth={2} />
                  </>
                )}
                <Brush dataKey="date" height={30} stroke="#3B82F6" fill="#1F2937" />
              </LineChart>
            )}
          </ResponsiveContainer>
        );

      case 'candlestick':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={candlestickData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <YAxis
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                domain={['auto', 'auto']}
                tickFormatter={(v) => formatValue(v)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
                formatter={(value, name) => value !== undefined ? [formatValue(value as number), name as string] : ['', '']}
              />
              <Legend />
              {/* Candlestick body simulation using bars */}
              <Bar dataKey="high" fill="#10B981" name="High" />
              <Bar dataKey="low" fill="#EF4444" name="Low" />
              <Line type="monotone" dataKey="open" stroke="#F59E0B" dot={false} name="Open" />
              <Line type="monotone" dataKey="close" stroke="#3B82F6" dot={false} name="Close" />
              {showVolume && (
                <Bar dataKey="volume" fill="#6366F1" opacity={0.3} name="Volume" yAxisId="volume" />
              )}
              <Brush dataKey="date" height={30} stroke="#3B82F6" fill="#1F2937" />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'volatility':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <YAxis
                yAxisId="left"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(v) => `${v.toFixed(2)}%`}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(v) => formatValue(v)}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Area
                yAxisId="left"
                type="monotone"
                dataKey="volatility"
                stroke="#EF4444"
                fill="#EF4444"
                fillOpacity={0.3}
                name="Volatility %"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="price"
                stroke="#3B82F6"
                dot={false}
                name="Price"
                strokeWidth={2}
              />
              <ReferenceLine yAxisId="left" y={2} stroke="#F59E0B" strokeDasharray="5 5" label="High Volatility" />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'volume_analysis':
        return (
          <ResponsiveContainer width="100%" height={500}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
              <YAxis
                yAxisId="price"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(v) => formatValue(v)}
              />
              <YAxis
                yAxisId="volume"
                orientation="right"
                stroke="#9CA3AF"
                tick={{ fill: '#9CA3AF' }}
                tickFormatter={(v) => formatValue(v, 'volume')}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                labelStyle={{ color: '#F3F4F6' }}
              />
              <Legend />
              <Bar
                yAxisId="volume"
                dataKey="volume"
                fill="#6366F1"
                opacity={0.6}
                name="Volume"
              />
              <Line
                yAxisId="price"
                type="monotone"
                dataKey="price"
                stroke="#3B82F6"
                dot={false}
                name="Price"
                strokeWidth={2}
              />
              <Brush dataKey="date" height={30} stroke="#3B82F6" fill="#1F2937" />
            </ComposedChart>
          </ResponsiveContainer>
        );

      case 'momentum':
        {
          const prices = chartData.map(d => d.price as number).filter(p => typeof p === 'number');
          const rsiSeries = calculateRSISeries(prices, 14);
          const { macd, signal } = calculateMACD(prices);
          const momentumData = chartData.map((d, i) => ({
            ...d,
            rsi: rsiSeries[i],
            macd: macd[i],
            signal: signal[i],
          }));

          return (
            <ResponsiveContainer width="100%" height={500}>
              <ComposedChart data={momentumData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <YAxis
                  yAxisId="rsi"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  domain={[0, 100]}
                />
                <YAxis
                  yAxisId="macd"
                  orientation="right"
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend />
                <Line
                  yAxisId="rsi"
                  type="monotone"
                  dataKey="rsi"
                  stroke="#8B5CF6"
                  dot={false}
                  name="RSI"
                  strokeWidth={2}
                />
                <ReferenceLine yAxisId="rsi" y={70} stroke="#EF4444" strokeDasharray="5 5" label="Overbought" />
                <ReferenceLine yAxisId="rsi" y={30} stroke="#10B981" strokeDasharray="5 5" label="Oversold" />
                <Bar
                  yAxisId="macd"
                  dataKey="macd"
                  fill="#3B82F6"
                  opacity={0.6}
                  name="MACD"
                />
                <Line
                  yAxisId="macd"
                  type="monotone"
                  dataKey="signal"
                  stroke="#F59E0B"
                  dot={false}
                  name="Signal"
                  strokeWidth={2}
                />
              </ComposedChart>
            </ResponsiveContainer>
          );
        }

      case 'correlation':
        type CorrelationCell = number | null;
        type CorrelationRow = { name: string } & Record<string, CorrelationCell>;
        // Build dynamic coin list: selected coin + top coins (up to 6 total)
        const selectedCoinData = COINS.find(c => c.id === selectedCoin);
        const otherCoins = COINS.filter(c => c.id !== selectedCoin).slice(0, 5);
        const correlationCoins = selectedCoinData
          ? [selectedCoinData, ...otherCoins]
          : COINS.slice(0, 6);

        const matrix = correlationMatrix as CorrelationRow[] | null;

        if (matrix === null) {
          return <LoadingWithAttribution message="Loading correlation data" className="h-96" />;
        }

        if (matrix.length === 0) {
          return <div className="flex items-center justify-center h-96 text-gray-400">No correlation data available</div>;
        }

        // Download correlation as PNG
        const downloadCorrelationPNG = async () => {
          const element = document.getElementById('correlation-chart');
          if (!element) return;

          const canvas = await html2canvas(element, {
            backgroundColor: '#1f2937',
            scale: 2,
            logging: false,
          });

          const link = document.createElement('a');
          link.download = `correlation_${selectedCoinData?.symbol || 'BTC'}_${new Date().toISOString().split('T')[0]}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
        };

        return (
          <div className="p-4">
            {/* Header with download buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-between mb-4 gap-3">
              <div className="text-center sm:text-left">
                <span className="text-gray-400">Showing correlation for: </span>
                <span className="text-blue-400 font-bold">{selectedCoinData?.name || 'Bitcoin'}</span>
              </div>
            </div>

            {/* Correlation Matrix - with ID for capture */}
            <div id="correlation-chart" className="bg-gray-900 p-4 rounded-xl">
              <div className="text-center mb-3 text-white font-bold">
                {selectedCoinData?.name || 'Bitcoin'} Correlation Matrix
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="sticky top-0 z-10 bg-gray-900">
                    <tr>
                      <th className="p-2 text-left text-gray-400"><span className="sr-only">Coin</span></th>
                      {correlationCoins.map(coin => (
                        <th key={coin.id} className={`p-2 text-center ${coin.id === selectedCoin ? 'text-blue-400 font-bold' : 'text-gray-400'}`}>
                          {coin.symbol}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {matrix.map((row, i) => (
                      <tr key={i} className={correlationCoins[i]?.id === selectedCoin ? 'bg-blue-900/20' : ''}>
                        <td className={`p-2 font-medium ${correlationCoins[i]?.id === selectedCoin ? 'text-blue-400' : 'text-gray-400'}`}>
                          {row.name}
                        </td>
                        {correlationCoins.map((coin, j) => {
                          const value = row[coin.symbol];
                          const isSelected = coin.id === selectedCoin || correlationCoins[i]?.id === selectedCoin;
                          const color = value === null ? 'bg-gray-700' :
                                       value === 1 ? 'bg-blue-600' :
                                       value > 0.7 ? 'bg-green-600' :
                                       value > 0.4 ? 'bg-yellow-600' : 'bg-red-600';
                          return (
                            <td key={j} className={`p-2 text-center ${color} text-white rounded m-1 ${isSelected ? 'ring-2 ring-blue-400' : ''}`}>
                              {value === null ? '—' : value.toFixed(2)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-4 justify-center text-sm">
                <span className="flex items-center gap-2"><div className="w-4 h-4 bg-green-600 rounded"></div> High (0.7+)</span>
                <span className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-600 rounded"></div> Medium (0.4-0.7)</span>
                <span className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded"></div> Low (&lt;0.4)</span>
              </div>
              <div className="text-center text-xs text-gray-500 mt-2">
                Generated by CryptoReportKit
              </div>
            </div>
          </div>
        );

      case 'racing_bar':
        const currentFrame = racingData[racingFrame] || { coins: [], date: '' };
        const maxCap = Math.max(...((currentFrame.coins as { marketCap: number }[])?.map(c => c.marketCap) || [1]));

        return (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-white">{(currentFrame as { date: string }).date}</h3>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`px-4 py-2 rounded-lg font-medium ${isPlaying ? 'bg-red-600' : 'bg-green-600'}`}
              >
                {isPlaying ? 'Pause' : 'Play Animation'}
              </button>
            </div>
            <div className="space-y-3">
              {((currentFrame.coins as { id: string; symbol: string; name: string; marketCap: number }[]) || []).map((coin, index) => (
                <div key={coin.id} className="flex items-center gap-4">
                  <div className="w-8 text-center text-gray-400 font-bold">#{index + 1}</div>
                  <div className="w-16 font-medium">{coin.symbol}</div>
                  <div className="flex-1">
                    <DynamicBar
                      width={(coin.marketCap / maxCap) * 100}
                      color={CHART_COLORS[index % CHART_COLORS.length]}
                      className="h-8 rounded transition-all duration-500 flex items-center px-2 text-white text-sm font-medium"
                    >
                      {formatValue(coin.marketCap, 'volume')}
                    </DynamicBar>
                  </div>
                </div>
              ))}
            </div>
            <input
              type="range"
              min={0}
              max={racingData.length - 1}
              value={racingFrame}
              onChange={(e) => setRacingFrame(parseInt(e.target.value))}
              className="w-full mt-4"
              aria-label="Timeline position"
              title="Slide to change time frame"
            />
          </div>
        );

      case 'market_dominance':
        {
          const marketCapPct = globalStats?.market_cap_percentage as Record<string, number> | undefined;
          if (!marketCapPct) {
            return <div className="flex items-center justify-center h-96 text-gray-400">No market dominance data available</div>;
          }

          const idToGlobalKey: Record<string, string> = {
            bitcoin: 'btc',
            ethereum: 'eth',
            tether: 'usdt',
            solana: 'sol',
            ripple: 'xrp',
            'usd-coin': 'usdc',
            dogecoin: 'doge',
            cardano: 'ada',
            tron: 'trx',
          };

          const dominanceData = COINS.slice(0, 8)
            .map((coin, i) => {
              const key = idToGlobalKey[coin.id];
              const value = key ? marketCapPct[key] : undefined;
              return {
                name: coin.symbol,
                value: typeof value === 'number' ? value : null,
                color: CHART_COLORS[i],
              };
            })
            .filter((d) => typeof d.value === 'number');

          if (dominanceData.length === 0) {
            return <div className="flex items-center justify-center h-96 text-gray-400">No market dominance data available</div>;
          }

          return (
            <ResponsiveContainer width="100%" height={500}>
              <PieChart>
                <Pie
                  data={dominanceData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${(value as number).toFixed(1)}%`}
                  outerRadius={180}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dominanceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(value) => value !== undefined ? [`${(value as number).toFixed(2)}%`, 'Market Share'] : ['', '']}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          );
        }

      case 'fibonacci':
        // Fibonacci retracement levels
        const priceData = chartData.map(d => d.price as number).filter(p => p > 0);
        const high = Math.max(...priceData);
        const low = Math.min(...priceData);
        const diff = high - low;
        const fibLevels = [
          { level: '0%', price: high, color: '#EF4444' },
          { level: '23.6%', price: high - diff * 0.236, color: '#F59E0B' },
          { level: '38.2%', price: high - diff * 0.382, color: '#F59E0B' },
          { level: '50%', price: high - diff * 0.5, color: '#3B82F6' },
          { level: '61.8%', price: high - diff * 0.618, color: '#10B981' },
          { level: '78.6%', price: high - diff * 0.786, color: '#10B981' },
          { level: '100%', price: low, color: '#10B981' },
        ];

        return (
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-xl p-4">
              <h4 className="text-lg font-medium mb-2">Fibonacci Retracement Levels</h4>
              <p className="text-gray-400 text-sm mb-4">Key support/resistance levels based on {parseInt(timeRange)}-day price range</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {fibLevels.map((fib) => (
                  <FibCard key={fib.level} level={fib.level} price={fib.price} color={fib.color} formatFn={formatValue} />
                ))}
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} domain={['auto', 'auto']} tickFormatter={(v) => formatValue(v)} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Area type="monotone" dataKey="price" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.2} name="Price" />
                {fibLevels.map((fib) => (
                  <ReferenceLine key={fib.level} y={fib.price} stroke={fib.color} strokeDasharray="5 5" label={{ value: fib.level, fill: fib.color, fontSize: 10 }} />
                ))}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'volume_profile':
        {
          const candles = candlestickData as Array<{ close: number; volume: number }>;
          if (!Array.isArray(candles) || candles.length < 2) {
            return <div className="flex items-center justify-center h-96 text-gray-400">No volume profile data available</div>;
          }

          const prices = candles.map(c => c.close).filter((p) => typeof p === 'number' && p > 0);
          const volumes = candles.map(c => c.volume).filter((v) => typeof v === 'number' && v >= 0);
          if (prices.length < 2 || volumes.length < 2) {
            return <div className="flex items-center justify-center h-96 text-gray-400">No volume profile data available</div>;
          }

          const vpHigh = Math.max(...prices);
          const vpLow = Math.min(...prices);
          const bins = 20;
          const diff = vpHigh - vpLow;
          if (!diff) {
            return <div className="flex items-center justify-center h-96 text-gray-400">No volume profile data available</div>;
          }

          const bucketVolumes = Array.from({ length: bins }, () => 0);
          for (let i = 0; i < candles.length; i++) {
            const price = candles[i]?.close;
            const volume = candles[i]?.volume;
            if (typeof price !== 'number' || typeof volume !== 'number') continue;
            const idx = Math.max(0, Math.min(bins - 1, Math.floor(((price - vpLow) / diff) * bins)));
            bucketVolumes[idx] += volume;
          }

          const volumeProfileData = Array.from({ length: bins }, (_, i) => {
            const priceLevel = vpLow + (diff / bins) * i;
            return {
              priceLevel: formatValue(priceLevel),
              price: priceLevel,
              volume: bucketVolumes[i] || 0,
            };
          });

          const poc = volumeProfileData.reduce((best, cur) => (cur.volume > best.volume ? cur : best), volumeProfileData[0]);

          return (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <ResponsiveContainer width="100%" height={500}>
                <BarChart data={volumeProfileData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis type="number" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickFormatter={(v) => formatValue(v, 'volume')} />
                  <YAxis type="category" dataKey="priceLevel" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} width={80} />
                  <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} formatter={(v) => formatValue(v as number, 'volume')} />
                  <Bar dataKey="volume" fill="#3B82F6" name="Volume" />
                </BarChart>
              </ResponsiveContainer>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-lg font-medium mb-4">Volume Profile Analysis</h4>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-400">Point of Control (POC)</span>
                    <span className="font-bold text-yellow-400">{formatValue(poc.price)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-400">Range High</span>
                    <span className="font-bold text-green-400">{formatValue(vpHigh)}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-gray-700/50 rounded-lg">
                    <span className="text-gray-400">Range Low</span>
                    <span className="font-bold text-red-400">{formatValue(vpLow)}</span>
                  </div>
                </div>
              </div>
            </div>
          );
        }

      case 'funding_rate':
        {
          const btc = derivativesData?.btc as { fundingRate: number | null; longShortRatio: number | null; volume24h: number | null } | undefined;
          const rate = btc?.fundingRate;
          const ls = btc?.longShortRatio;
          const volume24h = btc?.volume24h;
          const lastUpdated = derivativesData?.lastUpdated as string | undefined;
          const interpretation = derivativesData?.interpretation as string | undefined;

          // Prepare historical funding rate data for chart
          const fundingChartData = fundingHistory?.map((item, idx) => {
            const lsItem = longShortHistory?.[idx];
            return {
              date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }),
              fundingRate: item.fundingRate,
              longPercent: lsItem?.longPercent ?? null,
              shortPercent: lsItem?.shortPercent ?? null,
            };
          }) || [];

          if (typeof rate !== 'number' && fundingChartData.length === 0) {
            return <div className="flex items-center justify-center h-96 text-gray-400">No funding rate data available</div>;
          }

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="text-gray-400 text-sm">Current Rate</div>
                  <div className={`text-xl font-bold ${typeof rate === 'number' && rate > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {typeof rate === 'number' ? `${rate.toFixed(4)}%` : '—'}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="text-gray-400 text-sm">Long/Short Ratio</div>
                  <div className="text-xl font-bold text-blue-400">{typeof ls === 'number' ? ls.toFixed(3) : '—'}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="text-gray-400 text-sm">Futures Volume (24h)</div>
                  <div className="text-xl font-bold text-purple-400">{typeof volume24h === 'number' ? formatValue(volume24h, 'volume') : '—'}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="text-gray-400 text-sm">Interpretation</div>
                  <div className="text-lg font-bold text-yellow-400">{interpretation || '—'}</div>
                  <div className="text-xs text-gray-500 mt-1">{lastUpdated ? new Date(lastUpdated).toLocaleString() : ''}</div>
                </div>
              </div>

              {/* Funding Rate History Chart */}
              <div className="bg-gray-800/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Funding Rate History (8h intervals)</h4>
                {fundingChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <ComposedChart data={fundingChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis
                        yAxisId="rate"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                        tickFormatter={(v) => `${v.toFixed(3)}%`}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        formatter={(value, name) => {
                          const numVal = typeof value === 'number' ? value : 0;
                          if (name === 'Funding Rate') return [`${numVal.toFixed(4)}%`, name];
                          return [`${numVal.toFixed(1)}%`, name];
                        }}
                      />
                      <Legend />
                      <ReferenceLine yAxisId="rate" y={0} stroke="#6B7280" strokeDasharray="3 3" />
                      <Bar yAxisId="rate" dataKey="fundingRate" name="Funding Rate" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <LoadingWithAttribution message="Loading historical data" className="h-48" />
                )}
              </div>

              {/* Long/Short Ratio History */}
              {longShortHistory && longShortHistory.length > 0 && (
                <div className="bg-gray-800/30 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-3">Long/Short Account Ratio History</h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={fundingChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : 0}%`]}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="longPercent" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Long %" />
                      <Area type="monotone" dataKey="shortPercent" stackId="1" stroke="#EF4444" fill="#EF4444" fillOpacity={0.6} name="Short %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="text-xs text-gray-500 text-center">
                Funding rates settle every 8 hours • For display purposes only
              </div>
            </div>
          );
        }

      case 'open_interest':
        {
          const btc = derivativesData?.btc as { openInterest: number | null; openInterestChange24h: number | null; volume24h: number | null } | undefined;
          const oi = btc?.openInterest;
          const oiChange = btc?.openInterestChange24h;
          const volume24h = btc?.volume24h;
          const lastUpdated = derivativesData?.lastUpdated as string | undefined;

          // Prepare historical OI data for chart
          const oiChartData = oiHistory?.map((item) => ({
            date: new Date(item.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }),
            openInterest: item.openInterest,
            openInterestValue: item.openInterestValue,
          })) || [];

          if (typeof oi !== 'number' && oiChartData.length === 0) {
            return <div className="flex items-center justify-center h-96 text-gray-400">No open interest data available</div>;
          }

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="text-gray-400 text-sm">Current OI</div>
                  <div className="text-xl font-bold text-blue-400">{typeof oi === 'number' ? formatValue(oi, 'volume') : '—'}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="text-gray-400 text-sm">24h Change</div>
                  <div className={`text-xl font-bold ${typeof oiChange === 'number' && oiChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {typeof oiChange === 'number' ? `${oiChange.toFixed(2)}%` : '—'}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="text-gray-400 text-sm">Futures Volume (24h)</div>
                  <div className="text-xl font-bold text-purple-400">{typeof volume24h === 'number' ? formatValue(volume24h, 'volume') : '—'}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="text-gray-400 text-sm">Last Updated</div>
                  <div className="text-lg font-bold text-yellow-400">{lastUpdated ? new Date(lastUpdated).toLocaleString() : '—'}</div>
                </div>
              </div>

              {/* Open Interest History Chart */}
              <div className="bg-gray-800/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-gray-300 mb-3">Open Interest History (BTC)</h4>
                {oiChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <ComposedChart data={oiChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF', fontSize: 10 }} interval="preserveStartEnd" />
                      <YAxis
                        yAxisId="oi"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                        tickFormatter={(v) => formatValue(v, 'volume')}
                        orientation="left"
                      />
                      <YAxis
                        yAxisId="oiValue"
                        stroke="#10B981"
                        tick={{ fill: '#10B981' }}
                        tickFormatter={(v) => formatValue(v, 'volume')}
                        orientation="right"
                      />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                        formatter={(value, name) => {
                          const numVal = typeof value === 'number' ? value : 0;
                          if (name === 'OI (BTC)') return [numVal.toLocaleString() + ' BTC', name];
                          return ['$' + formatValue(numVal, 'volume'), name];
                        }}
                      />
                      <Legend />
                      <Area yAxisId="oiValue" type="monotone" dataKey="openInterestValue" stroke="#10B981" fill="#10B981" fillOpacity={0.2} name="OI Value (USD)" />
                      <Line yAxisId="oi" type="monotone" dataKey="openInterest" stroke="#3B82F6" dot={false} name="OI (BTC)" strokeWidth={2} />
                    </ComposedChart>
                  </ResponsiveContainer>
                ) : (
                  <LoadingWithAttribution message="Loading historical data" className="h-48" />
                )}
              </div>

              <div className="text-xs text-gray-500 text-center">
                Hourly intervals • For display purposes only
              </div>
            </div>
          );
        }

      case 'liquidation_heatmap':
        return (
          <div className="flex items-center justify-center h-96 text-gray-400">
            Liquidation heatmap is not available from free public APIs
          </div>
        );

      case 'whale_flow':
        if (whaleFlows === null) {
          return <LoadingWithAttribution message="Loading whale flow data" className="h-96" />;
        }

        if (!Array.isArray(whaleFlows) || whaleFlows.length === 0) {
          return <div className="flex items-center justify-center h-96 text-gray-400">No whale flow data available</div>;
        }

        const flowRows = whaleFlows
          .map((r) => ({
            exchange: typeof r?.exchange === 'string' ? r.exchange : 'Unknown',
            inflowUsd: typeof r?.inflowUsd24h === 'number' ? r.inflowUsd24h : null,
            outflowUsd: typeof r?.outflowUsd24h === 'number' ? r.outflowUsd24h : null,
            netFlowUsd: typeof r?.netFlowUsd24h === 'number' ? r.netFlowUsd24h : null,
          }))
          .filter((r) => typeof r.netFlowUsd === 'number');

        const totals = flowRows.reduce(
          (acc, r) => {
            acc.inflow += typeof r.inflowUsd === 'number' ? r.inflowUsd : 0;
            acc.outflow += typeof r.outflowUsd === 'number' ? r.outflowUsd : 0;
            acc.net += typeof r.netFlowUsd === 'number' ? r.netFlowUsd : 0;
            return acc;
          },
          { inflow: 0, outflow: 0, net: 0 }
        );

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="text-gray-400 text-sm">24h Inflow</div>
                <div className="text-xl font-bold text-red-400">+{formatValue(totals.inflow, 'volume')}</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="text-gray-400 text-sm">24h Outflow</div>
                <div className="text-xl font-bold text-green-400">{formatValue(totals.outflow, 'volume')}</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="text-gray-400 text-sm">Net Flow</div>
                <div className={`text-xl font-bold ${totals.net > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {formatValue(Math.abs(totals.net), 'volume')}
                </div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="text-gray-400 text-sm">Signal</div>
                <div className={`text-lg font-bold ${totals.net < 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {totals.net < 0 ? '🐋 Net Outflow' : '⚠️ Net Inflow'}
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={flowRows}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="exchange" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickFormatter={(v) => formatValue(v as number, 'volume')} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  formatter={(v) => formatValue(v as number, 'volume')}
                />
                <Legend />
                <Bar dataKey="inflowUsd" fill="#EF4444" name="Inflow (USD)" stackId="flow" />
                <Bar dataKey="outflowUsd" fill="#10B981" name="Outflow (USD)" stackId="flow" />
                <Bar dataKey="netFlowUsd" fill="#3B82F6" name="Net (USD)" />
                <ReferenceLine y={0} stroke="#6B7280" strokeDasharray="3 3" />
              </BarChart>
            </ResponsiveContainer>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-gray-400 text-sm">🐋 <strong>Whale Flow</strong> is derived from detected large transfers involving exchanges (not total exchange flow).</p>
            </div>
          </div>
        );

      case 'wallet_distribution':
        // Render Wallet Distribution Treemap
        return (
          <div className="space-y-4">
            <WalletDistributionTreemap />
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-gray-400 text-sm">🐳 <strong>Wallet Distribution</strong> shows how BTC is distributed among different holder categories - from Humpbacks (largest holders) to Shrimps (smallest). Green indicates accumulation, red indicates distribution.</p>
            </div>
          </div>
        );

      case 'active_addresses':
        return (
          <div className="flex items-center justify-center h-96 text-gray-400">
            Active address history is not available from free public APIs
          </div>
        );

      case 'fear_greed_history':
        if (fearGreedHistory === null) {
          return <LoadingWithAttribution message="Loading fear & greed data" className="h-96" />;
        }

        if (!Array.isArray(fearGreedHistory) || fearGreedHistory.length === 0) {
          return <div className="flex items-center justify-center h-96 text-gray-400">No fear & greed data available</div>;
        }

        const priceByDate = new Map<string, number>();
        chartData.forEach((d) => {
          if (typeof d?.date === 'string' && typeof d?.price === 'number') priceByDate.set(d.date, d.price);
        });

        const fgData = fearGreedHistory.map((r) => {
          const d = typeof r?.timestamp === 'string' ? new Date(r.timestamp) : null;
          const date = d ? d.toLocaleDateString() : '';
          const index = typeof r?.value === 'number' ? r.value : null;
          return {
            date,
            index,
            price: priceByDate.get(date),
            classification: typeof r?.classification === 'string' ? r.classification : null,
          };
        }).filter((r) => r.date && typeof r.index === 'number');

        const current = fgData[fgData.length - 1];
        const currentFG = typeof current?.index === 'number' ? current.index : null;
        const fgLabel = current?.classification || (currentFG === null ? 'Unknown' : (
          currentFG <= 25 ? 'Extreme Fear' : currentFG <= 45 ? 'Fear' : currentFG <= 55 ? 'Neutral' : currentFG <= 75 ? 'Greed' : 'Extreme Greed'
        ));

        return (
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-xl p-6 text-center">
              <div className="text-gray-400 text-sm mb-2">Current Fear & Greed Index</div>
              {currentFG === null ? (
                <div className="text-6xl font-bold text-gray-400">—</div>
              ) : (
                <FGColoredText value={currentFG} className="text-6xl font-bold">{currentFG}</FGColoredText>
              )}
              <div className="text-2xl font-medium mt-2 text-gray-200">{fgLabel}</div>
              <div className="flex justify-between mt-4 text-xs text-gray-500">
                <span>😱 Extreme Fear</span>
                <span>😰 Fear</span>
                <span>😐 Neutral</span>
                <span>😊 Greed</span>
                <span>🤑 Extreme Greed</span>
              </div>
              <div className="h-3 rounded-full mt-2 bg-gradient-to-r from-red-500 via-yellow-500 via-gray-500 via-green-500 to-emerald-500">
                <div className="relative h-full">
                  {typeof currentFG === 'number' ? <FGMarker position={currentFG} /> : null}
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={fgData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                <YAxis yAxisId="fg" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} domain={[0, 100]} />
                <YAxis yAxisId="price" orientation="right" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} tickFormatter={(v) => formatValue(v)} />
                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }} />
                <Legend />
                <Area yAxisId="fg" type="monotone" dataKey="index" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.3} name="Fear & Greed Index" />
                <Line yAxisId="price" type="monotone" dataKey="price" stroke="#3B82F6" dot={false} name="Price" strokeWidth={2} />
                <ReferenceLine yAxisId="fg" y={25} stroke="#EF4444" strokeDasharray="3 3" label="Extreme Fear" />
                <ReferenceLine yAxisId="fg" y={75} stroke="#10B981" strokeDasharray="3 3" label="Extreme Greed" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      case 'social_volume':
        {
          if (communityData === null) {
            return <LoadingWithAttribution message="Loading community data" className="h-96" />;
          }

          const formatNumber = (n: number) => {
            if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
            if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
            return n.toString();
          };

          const sentimentData = [
            { name: 'Bullish', value: communityData.sentiment_up, color: '#10B981' },
            { name: 'Bearish', value: communityData.sentiment_down, color: '#EF4444' },
          ];

          const selectedCoinName = COINS.find(c => c.id === selectedCoin)?.name || selectedCoin;
          const hasSentiment = communityData.sentiment_up > 0 || communityData.sentiment_down > 0;

          // Fallback if no data available
          if (!hasSentiment && communityData.watchlist_users === 0) {
            return (
              <div className="flex flex-col items-center justify-center h-96 text-gray-400">
                <p>No community data available for {selectedCoinName}</p>
                <p className="text-sm mt-2">Try selecting a different coin</p>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-bold text-white mb-1">Community Stats: {selectedCoinName}</h3>
                <p className="text-gray-400 text-sm">Sentiment and watchlist data from CoinGecko</p>
              </div>

              {/* Stats Cards - Only available data */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <span>👀</span> Watchlist Users
                  </div>
                  <div className="text-2xl font-bold text-emerald-400">{formatNumber(communityData.watchlist_users)}</div>
                  <div className="text-xs text-gray-500 mt-1">Users tracking this coin</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <span>📈</span> Bullish Votes
                  </div>
                  <div className="text-2xl font-bold text-green-400">{communityData.sentiment_up.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500 mt-1">Community sentiment</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-1">
                    <span>📉</span> Bearish Votes
                  </div>
                  <div className="text-2xl font-bold text-red-400">{communityData.sentiment_down.toFixed(1)}%</div>
                  <div className="text-xs text-gray-500 mt-1">Community sentiment</div>
                </div>
              </div>

              {/* Sentiment Visualization */}
              {hasSentiment && (
                <div className="bg-gray-800/30 rounded-xl p-4">
                  <h4 className="text-sm font-medium text-gray-300 mb-4">Community Sentiment</h4>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Pie Chart */}
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={sentimentData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
                        >
                          {sentimentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                          formatter={(value) => [`${typeof value === 'number' ? value.toFixed(1) : 0}%`]}
                        />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>

                    {/* Sentiment Bar */}
                    <div className="flex flex-col justify-center">
                      <div className="mb-4">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-green-400">Bullish {communityData.sentiment_up.toFixed(1)}%</span>
                          <span className="text-red-400">Bearish {communityData.sentiment_down.toFixed(1)}%</span>
                        </div>
                        <div className="h-4 bg-gray-700 rounded-full overflow-hidden flex">
                          <div
                            className="bg-green-500 h-full transition-all"
                            style={{ width: `${communityData.sentiment_up}%` }}
                          />
                          <div
                            className="bg-red-500 h-full transition-all"
                            style={{ width: `${communityData.sentiment_down}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-center text-gray-400 text-sm">
                        {communityData.sentiment_up > 60 ? 'Strong bullish sentiment' :
                         communityData.sentiment_up > 50 ? 'Slightly bullish' :
                         communityData.sentiment_down > 60 ? 'Strong bearish sentiment' :
                         'Slightly bearish'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-center">
                <CoinGeckoAttribution variant="footer" />
              </div>
              <div className="text-xs text-gray-500 text-center mt-2">
                For educational and display purposes only
              </div>
            </div>
          );
        }

      case 'btc_dominance':
        {
          const marketCapPct = globalStats?.market_cap_percentage as Record<string, number> | undefined;
          const btc = marketCapPct?.btc;
          const eth = marketCapPct?.eth;
          if (typeof btc !== 'number') {
            return <div className="flex items-center justify-center h-96 text-gray-400">No dominance data available</div>;
          }

          const ethValue = typeof eth === 'number' ? eth : 0;
          const alt = Math.max(0, 100 - btc - ethValue);

          const dominanceData = [
            { name: 'BTC', value: btc, color: '#F7931A' },
            ...(typeof eth === 'number' ? [{ name: 'ETH', value: eth, color: '#627EEA' }] : []),
            { name: 'ALT', value: alt, color: '#8B5CF6' },
          ];

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-xl p-4 border-l-4 border-orange-500">
                  <div className="text-gray-400 text-sm">BTC Dominance</div>
                  <div className="text-2xl font-bold text-orange-400">{btc.toFixed(1)}%</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border-l-4 border-blue-500">
                  <div className="text-gray-400 text-sm">ETH Dominance</div>
                  <div className="text-2xl font-bold text-blue-400">{typeof eth === 'number' ? eth.toFixed(1) : '—'}</div>
                </div>
                <div className="bg-gray-800/50 rounded-xl p-4 border-l-4 border-purple-500">
                  <div className="text-gray-400 text-sm">Altcoins</div>
                  <div className="text-2xl font-bold text-purple-400">{alt.toFixed(1)}%</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={dominanceData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${(value as number).toFixed(1)}%`}
                    outerRadius={160}
                    dataKey="value"
                  >
                    {dominanceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    formatter={(v) => `${(v as number).toFixed(1)}%`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            <div className="bg-gray-800/50 rounded-xl p-4">
              <p className="text-gray-400 text-sm">👑 <strong>BTC Dominance</strong> measures Bitcoin&apos;s market cap relative to the total crypto market. Rising dominance often indicates risk-off sentiment, while falling dominance suggests altcoin season.</p>
            </div>
          </div>
          );
        }

      default:
        return <div className="flex items-center justify-center h-96 text-gray-400">Select a chart type</div>;
    }
  };

  const selectedConfig = AVAILABLE_CHART_CONFIGS.find(c => c.type === selectedChart);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-400">
              CryptoReportKit
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/charts/advanced" className="text-purple-400 hover:text-purple-300 font-medium">
                Advanced Charts ✨
              </Link>
              <Link href="/compare" className="text-gray-400 hover:text-white">Compare</Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Interactive Charts</h1>
            <p className="text-gray-400 mt-1">Powerful visualizations for crypto analysis and market trends</p>
          </div>

        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Chart Selection */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sticky top-4">
              <h3 className="font-medium mb-4">Chart Types</h3>

              {['historical', 'volatility', 'comparison', 'derivatives', 'onchain', 'sentiment'].map(category => {
                const categoryCharts = AVAILABLE_CHART_CONFIGS.filter(c => c.category === category);
                if (categoryCharts.length === 0) return null;
                return (
                <div key={category} className="mb-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    {category}
                  </div>
                  {categoryCharts.map(config => {
                    const excelConfig = CHART_EXCEL_CONFIG[config.type];
                    return (
                    <div
                      key={config.type}
                      className={`flex items-center gap-1 rounded-lg mb-1 transition ${
                        selectedChart === config.type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => setSelectedChart(config.type)}
                        className="flex-1 text-left p-3"
                      >
                        <div className="flex items-center gap-2">
                          <span>{config.icon}</span>
                          <span className="text-sm font-medium">{config.title}</span>
                          {excelConfig?.tier === 'pro' && (
                            <span className="text-[8px] px-1 py-0.5 bg-purple-500/30 text-purple-300 rounded">PRO</span>
                          )}
                        </div>
                      </button>
                      <ChartExcelButton
                        chartType={config.type}
                        chartTitle={config.title}
                        onClick={() => setExcelModalChart({ type: config.type, title: config.title })}
                      />
                    </div>
                  )})}
                </div>
              )})}
            </div>
          </div>

          {/* Main Chart Area */}
          <div className="col-span-12 lg:col-span-9">
            {/* Controls */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mb-4">
              <div className="flex flex-wrap gap-4 items-center">
                {/* Coin Selection */}
                <div>
                  <label htmlFor="coin-select" className="block text-xs text-gray-500 mb-1">Cryptocurrency</label>
                  <select
                    id="coin-select"
                    value={selectedCoin}
                    onChange={(e) => setSelectedCoin(e.target.value)}
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 max-h-60"
                  >
                    {availableCoins.map(coin => (
                      <option key={coin.id} value={coin.id}>{coin.name} ({coin.symbol})</option>
                    ))}
                  </select>
                </div>

                {/* Time Range */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Time Range</label>
                  <div className="flex gap-1">
                    {TIME_RANGES.map(range => (
                      <button
                        key={range.value}
                        onClick={() => setTimeRange(range.value)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                          timeRange === range.value
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chart Options */}
                {(selectedChart === 'price_history' || selectedChart === 'candlestick') && (
                  <>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Chart Style</label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => setChartStyle('area')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            chartStyle === 'area' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Area
                        </button>
                        <button
                          onClick={() => setChartStyle('line')}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                            chartStyle === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          }`}
                        >
                          Line
                        </button>
                      </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showMA}
                        onChange={(e) => setShowMA(e.target.checked)}
                        className="rounded border-gray-600"
                      />
                      <span className="text-sm">Moving Averages</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showVolume}
                        onChange={(e) => setShowVolume(e.target.checked)}
                        className="rounded border-gray-600"
                      />
                      <span className="text-sm">Volume</span>
                    </label>
                  </>
                )}
              </div>
            </div>

            {/* Chart Container */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4" ref={chartRef}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>{selectedConfig?.icon}</span>
                    {selectedConfig?.title}
                  </h2>
                  <p className="text-gray-400 text-sm">{selectedConfig?.description}</p>
                </div>
                {isLoading && (
                  <div className="flex items-center gap-2 text-blue-400">
                    <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
                    Loading...
                  </div>
                )}
              </div>

              {renderChart()}
            </div>

            {/* Chart Legend / Info */}
            <div className="mt-4 bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <h3 className="font-medium mb-2">About This Chart</h3>
              <p className="text-gray-400 text-sm">
                {selectedChart === 'price_history' && 'Track historical price movements with optional moving averages (MA7, MA30) to identify trends.'}
                {selectedChart === 'candlestick' && 'OHLC candlestick chart showing open, high, low, and close prices for each period.'}
                {selectedChart === 'volatility' && 'Visualize price volatility over time. Higher volatility indicates greater price swings.'}
                {selectedChart === 'volume_analysis' && 'Analyze trading volume alongside price movements to identify market interest.'}
                {selectedChart === 'momentum' && 'RSI and MACD indicators to identify overbought/oversold conditions and momentum shifts.'}
                {selectedChart === 'correlation' && 'Correlation matrix showing how different cryptocurrencies move in relation to each other.'}
                {selectedChart === 'racing_bar' && 'Animated visualization of market cap rankings over time. Click Play to start the animation.'}
                {selectedChart === 'market_dominance' && 'Pie chart showing the relative market share of top cryptocurrencies.'}
                              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Excel Template Modal */}
      <ChartExcelModal
        chartType={excelModalChart?.type || ''}
        chartTitle={excelModalChart?.title || ''}
        isOpen={!!excelModalChart}
        onClose={() => setExcelModalChart(null)}
      />
    </div>
  );
}

// Default export wrapped in Suspense for useSearchParams
export default function ChartsPage() {
  return (
    <Suspense fallback={<ChartLoading />}>
      <ChartsContent />
    </Suspense>
  );
}
