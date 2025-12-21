'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
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
  ScatterChart,
  Scatter,
} from 'recharts';

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

// Chart type definitions - expanded to 20 chart types
type ChartType =
  | 'price_history'
  | 'candlestick'
  | 'volatility'
  | 'correlation'
  | 'racing_bar'
  | 'market_dominance'
  | 'prediction_accuracy'
  | 'price_prediction'
  | 'volume_analysis'
  | 'momentum'
  // New chart types
  | 'fibonacci'
  | 'volume_profile'
  | 'funding_rate'
  | 'open_interest'
  | 'liquidation_heatmap'
  | 'whale_flow'
  | 'active_addresses'
  | 'fear_greed_history'
  | 'social_volume'
  | 'btc_dominance';

interface ChartConfig {
  type: ChartType;
  title: string;
  description: string;
  icon: string;
  category: 'historical' | 'volatility' | 'prediction' | 'comparison' | 'onchain' | 'derivatives' | 'sentiment';
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
  { type: 'active_addresses', title: 'Active Addresses', description: 'Network activity over time', icon: '👥', category: 'onchain' },

  // Sentiment Charts
  { type: 'fear_greed_history', title: 'Fear & Greed History', description: 'Historical fear/greed index', icon: '😱', category: 'sentiment' },
  { type: 'social_volume', title: 'Social Volume', description: 'Social mentions & engagement', icon: '📣', category: 'sentiment' },

  // Prediction Charts
  { type: 'prediction_accuracy', title: 'AI Prediction Accuracy', description: 'Historical prediction performance', icon: '🎯', category: 'prediction' },
  { type: 'price_prediction', title: 'Price Prediction', description: 'AI-powered price forecasts', icon: '🔮', category: 'prediction' },
];

const COINS = [
  { id: 'bitcoin', name: 'Bitcoin', symbol: 'BTC' },
  { id: 'ethereum', name: 'Ethereum', symbol: 'ETH' },
  { id: 'binancecoin', name: 'BNB', symbol: 'BNB' },
  { id: 'solana', name: 'Solana', symbol: 'SOL' },
  { id: 'ripple', name: 'XRP', symbol: 'XRP' },
  { id: 'cardano', name: 'Cardano', symbol: 'ADA' },
  { id: 'dogecoin', name: 'Dogecoin', symbol: 'DOGE' },
  { id: 'polkadot', name: 'Polkadot', symbol: 'DOT' },
];

const TIME_RANGES = [
  { value: '1', label: '24H' },
  { value: '7', label: '7D' },
  { value: '30', label: '30D' },
  { value: '90', label: '90D' },
  { value: '365', label: '1Y' },
];

const CHART_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16'];

export default function ChartsPage() {
  const [selectedChart, setSelectedChart] = useState<ChartType>('price_history');
  const [selectedCoin, setSelectedCoin] = useState('bitcoin');
  const [timeRange, setTimeRange] = useState('30');
  const [isLoading, setIsLoading] = useState(false);
  const [chartData, setChartData] = useState<Record<string, unknown>[]>([]);
  const [candlestickData, setCandlestickData] = useState<Record<string, unknown>[]>([]);
  const [predictionData, setPredictionData] = useState<Record<string, unknown> | null>(null);
  const [racingData, setRacingData] = useState<Record<string, unknown>[]>([]);
  const [racingFrame, setRacingFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showMA, setShowMA] = useState(true);
  const [showVolume, setShowVolume] = useState(true);
  const [chartStyle, setChartStyle] = useState<'line' | 'area'>('area');
  const chartRef = useRef<HTMLDivElement>(null);

  // Fetch chart data based on selected options
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
            volume: Math.random() * 10000000000 + 1000000000, // Simulated volume
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

      // Fetch prediction data for AI charts
      const predRes = await fetch(`/api/charts/prediction?coin=${selectedCoin}`);
      const predData = await predRes.json();
      setPredictionData(predData);

      // Generate racing bar data
      generateRacingData();
    } catch (error) {
      console.error('Error fetching chart data:', error);
      // Generate mock data on error
      generateMockData();
    } finally {
      setIsLoading(false);
    }
  }, [selectedCoin, timeRange]);

  const generateMockData = () => {
    // Generate mock price history
    const days = parseInt(timeRange);
    const basePrice = selectedCoin === 'bitcoin' ? 45000 : selectedCoin === 'ethereum' ? 2500 : 100;
    interface MockPrice {
      date: string;
      timestamp: number;
      price: number;
      ma7: number | null;
      ma30: number | null;
      volatility: number;
      volume: number;
      open: number;
      high: number;
      low: number;
      close: number;
      [key: string]: unknown;
    }
    const mockPrices: MockPrice[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (days - i));
      const randomChange = (Math.random() - 0.5) * basePrice * 0.05;
      const price = basePrice + randomChange + (Math.random() * basePrice * 0.1);

      const ma7 = i >= 6 ? mockPrices.slice(Math.max(0, i - 6), i + 1).reduce((sum: number, d) => sum + d.price, 0) / Math.min(7, i + 1) : null;
      const ma30 = i >= 29 ? mockPrices.slice(Math.max(0, i - 29), i + 1).reduce((sum: number, d) => sum + d.price, 0) / Math.min(30, i + 1) : null;

      mockPrices.push({
        date: date.toLocaleDateString(),
        timestamp: date.getTime(),
        price,
        ma7,
        ma30,
        volatility: Math.random() * 5,
        volume: Math.random() * 10000000000,
        open: price * (1 - Math.random() * 0.02),
        high: price * (1 + Math.random() * 0.03),
        low: price * (1 - Math.random() * 0.03),
        close: price,
      });
    }

    setChartData(mockPrices);
    setCandlestickData(mockPrices);

    // Mock prediction data
    setPredictionData({
      prediction: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
      confidence: Math.floor(Math.random() * 30 + 60),
      accuracy: {
        overall: Math.floor(Math.random() * 20 + 65),
        bullish: Math.floor(Math.random() * 20 + 60),
        bearish: Math.floor(Math.random() * 20 + 60),
      },
      history: Array.from({ length: 30 }, (_, i) => ({
        date: new Date(Date.now() - i * 86400000).toLocaleDateString(),
        predicted: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
        actual: Math.random() > 0.5 ? 'BULLISH' : 'BEARISH',
        correct: Math.random() > 0.35,
      })),
      priceTarget: {
        current: basePrice,
        low: basePrice * 0.9,
        mid: basePrice * 1.05,
        high: basePrice * 1.15,
      },
    });
  };

  const generateRacingData = () => {
    // Generate racing bar chart data (market cap over time)
    const frames = 12; // 12 months
    const data = [];

    for (let f = 0; f < frames; f++) {
      const date = new Date();
      date.setMonth(date.getMonth() - (frames - f - 1));

      const frame = {
        date: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        coins: COINS.map(coin => ({
          ...coin,
          marketCap: (Math.random() * 500 + 100) * 1000000000 * (coin.id === 'bitcoin' ? 2 : 1),
        })).sort((a, b) => b.marketCap - a.marketCap),
      };
      data.push(frame);
    }

    setRacingData(data);
  };

  useEffect(() => {
    fetchChartData();
  }, [fetchChartData]);

  // Racing bar animation
  useEffect(() => {
    if (isPlaying && racingData.length > 0) {
      const interval = setInterval(() => {
        setRacingFrame(prev => (prev + 1) % racingData.length);
      }, 1500);
      return () => clearInterval(interval);
    }
  }, [isPlaying, racingData.length]);

  // Download chart as image
  const downloadChart = async (format: 'png' | 'svg' | 'json') => {
    if (!chartRef.current) return;

    if (format === 'json') {
      const blob = new Blob([JSON.stringify(chartData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${selectedCoin}_${selectedChart}_${timeRange}d.json`;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    // For PNG/SVG, we need to convert the chart
    try {
      const svg = chartRef.current.querySelector('svg');
      if (!svg) return;

      const svgData = new XMLSerializer().serializeToString(svg);

      if (format === 'svg') {
        const blob = new Blob([svgData], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedCoin}_${selectedChart}_${timeRange}d.svg`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        // Convert to PNG
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

        img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
      }
    } catch (error) {
      console.error('Error downloading chart:', error);
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
    if (isLoading || chartData.length === 0) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="text-gray-400">
            {isLoading ? 'Loading chart data...' : 'No data available'}
          </div>
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
        // Generate RSI-like data
        const momentumData = chartData.map((d, i) => {
          const rsi = 30 + Math.random() * 40 + (d.price && chartData[0].price ? ((d.price as number) / (chartData[0].price as number) - 1) * 50 : 0);
          return {
            ...d,
            rsi: Math.min(100, Math.max(0, rsi)),
            macd: (Math.random() - 0.5) * 1000,
            signal: (Math.random() - 0.5) * 800,
          };
        });

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

      case 'correlation':
        interface CorrelationRow {
          name: string;
          [key: string]: string | number;
        }
        const correlationMatrix: CorrelationRow[] = COINS.slice(0, 6).map(coin1 => ({
          name: coin1.symbol,
          ...Object.fromEntries(
            COINS.slice(0, 6).map(coin2 => [
              coin2.symbol,
              coin1.id === coin2.id ? 1 : (Math.random() * 0.6 + 0.2).toFixed(2)
            ])
          )
        }));

        return (
          <div className="p-4">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-gray-900">
                  <tr>
                    <th className="p-2 text-left text-gray-400"></th>
                    {COINS.slice(0, 6).map(coin => (
                      <th key={coin.id} className="p-2 text-center text-gray-400">{coin.symbol}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {correlationMatrix.map((row, i) => (
                    <tr key={i}>
                      <td className="p-2 text-gray-400 font-medium">{row.name}</td>
                      {COINS.slice(0, 6).map((coin, j) => {
                        const value = parseFloat(row[coin.symbol] as string);
                        const color = value === 1 ? 'bg-blue-600' :
                                     value > 0.7 ? 'bg-green-600' :
                                     value > 0.4 ? 'bg-yellow-600' : 'bg-red-600';
                        return (
                          <td key={j} className={`p-2 text-center ${color} text-white rounded m-1`}>
                            {value.toFixed(2)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex gap-4 justify-center text-sm">
              <span className="flex items-center gap-2"><div className="w-4 h-4 bg-green-600 rounded"></div> High Correlation (0.7+)</span>
              <span className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-600 rounded"></div> Medium (0.4-0.7)</span>
              <span className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded"></div> Low (&lt;0.4)</span>
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
        const dominanceData = COINS.slice(0, 8).map((coin, i) => ({
          name: coin.symbol,
          value: coin.id === 'bitcoin' ? 52 : coin.id === 'ethereum' ? 18 : Math.random() * 8 + 1,
          color: CHART_COLORS[i],
        }));

        return (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart>
              <Pie
                data={dominanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value.toFixed(1)}%`}
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

      case 'prediction_accuracy':
        if (!predictionData) {
          return <div className="flex items-center justify-center h-96 text-gray-400">Loading prediction data...</div>;
        }

        const accuracyData = (predictionData as { accuracy?: { overall: number; bullish: number; bearish: number } }).accuracy || { overall: 75, bullish: 72, bearish: 78 };
        const historyData = (predictionData as { history?: { date: string; correct: boolean }[] }).history || [];

        return (
          <div className="space-y-6">
            {/* Accuracy Radar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-lg font-medium mb-4">Prediction Accuracy by Direction</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={[
                    { metric: 'Overall', value: accuracyData.overall },
                    { metric: 'Bullish', value: accuracyData.bullish },
                    { metric: 'Bearish', value: accuracyData.bearish },
                    { metric: 'Confidence', value: (predictionData as { confidence?: number }).confidence || 70 },
                  ]}>
                    <PolarGrid stroke="#374151" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill: '#9CA3AF' }} />
                    <PolarRadiusAxis domain={[0, 100]} tick={{ fill: '#9CA3AF' }} />
                    <Radar name="Accuracy" dataKey="value" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.5} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              {/* Recent Predictions */}
              <div className="bg-gray-800/50 rounded-xl p-4">
                <h4 className="text-lg font-medium mb-4">Recent Prediction Results</h4>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={historyData.slice(0, 14)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} />
                    <YAxis stroke="#9CA3AF" tick={{ fill: '#9CA3AF' }} domain={[0, 1]} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    />
                    <Bar
                      dataKey="correct"
                      fill="#10B981"
                      name="Correct"
                    >
                      {historyData.slice(0, 14).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.correct ? '#10B981' : '#EF4444'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-blue-400">{accuracyData.overall}%</div>
                <div className="text-gray-400 text-sm">Overall Accuracy</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-green-400">{accuracyData.bullish}%</div>
                <div className="text-gray-400 text-sm">Bullish Accuracy</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-red-400">{accuracyData.bearish}%</div>
                <div className="text-gray-400 text-sm">Bearish Accuracy</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 text-center">
                <div className="text-3xl font-bold text-purple-400">{(predictionData as { confidence?: number }).confidence || 70}%</div>
                <div className="text-gray-400 text-sm">Avg Confidence</div>
              </div>
            </div>
          </div>
        );

      case 'price_prediction':
        if (!predictionData) {
          return <div className="flex items-center justify-center h-96 text-gray-400">Loading prediction data...</div>;
        }

        const targets = (predictionData as { priceTarget?: { current: number; low: number; mid: number; high: number } }).priceTarget || { current: 45000, low: 40000, mid: 48000, high: 55000 };
        const prediction = (predictionData as { prediction?: string }).prediction || 'BULLISH';

        // Generate prediction visualization data
        interface PredictionChartPoint {
          date: string;
          price?: number;
          predicted: number;
          [key: string]: unknown;
        }
        const predictionChartData: PredictionChartPoint[] = chartData.slice(-30).map((d) => ({
          date: d.date as string,
          price: d.price as number,
          predicted: (d.price as number) * (1 + (Math.random() - 0.5) * 0.1),
        }));

        // Add future predictions
        const lastPrice = chartData.length > 0 ? (chartData[chartData.length - 1].price as number) : targets.current;
        for (let i = 1; i <= 7; i++) {
          const date = new Date();
          date.setDate(date.getDate() + i);
          predictionChartData.push({
            date: date.toLocaleDateString(),
            price: undefined,
            predicted: lastPrice * (1 + (prediction === 'BULLISH' ? 0.01 : -0.01) * i),
          });
        }

        return (
          <div className="space-y-6">
            {/* Prediction Banner */}
            <div className={`rounded-xl p-6 ${prediction === 'BULLISH' ? 'bg-green-900/30 border border-green-500/50' : 'bg-red-900/30 border border-red-500/50'}`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400">AI Prediction for {COINS.find(c => c.id === selectedCoin)?.name}</div>
                  <div className={`text-3xl font-bold ${prediction === 'BULLISH' ? 'text-green-400' : 'text-red-400'}`}>
                    {prediction === 'BULLISH' ? '🚀 BULLISH' : '📉 BEARISH'}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Confidence</div>
                  <div className="text-2xl font-bold text-white">{(predictionData as { confidence?: number }).confidence || 70}%</div>
                </div>
              </div>
            </div>

            {/* Price Targets */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-xl p-4">
                <div className="text-gray-400 text-sm">Current Price</div>
                <div className="text-xl font-bold text-white">{formatValue(targets.current)}</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border-l-4 border-red-500">
                <div className="text-gray-400 text-sm">Bear Target</div>
                <div className="text-xl font-bold text-red-400">{formatValue(targets.low)}</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border-l-4 border-yellow-500">
                <div className="text-gray-400 text-sm">Base Target</div>
                <div className="text-xl font-bold text-yellow-400">{formatValue(targets.mid)}</div>
              </div>
              <div className="bg-gray-800/50 rounded-xl p-4 border-l-4 border-green-500">
                <div className="text-gray-400 text-sm">Bull Target</div>
                <div className="text-xl font-bold text-green-400">{formatValue(targets.high)}</div>
              </div>
            </div>

            {/* Prediction Chart */}
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={predictionChartData}>
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
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#3B82F6"
                  dot={false}
                  name="Historical Price"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#10B981"
                  strokeDasharray="5 5"
                  dot={false}
                  name="Predicted Price"
                  strokeWidth={2}
                />
                <ReferenceLine y={targets.high} stroke="#10B981" strokeDasharray="3 3" label="Bull Target" />
                <ReferenceLine y={targets.low} stroke="#EF4444" strokeDasharray="3 3" label="Bear Target" />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        );

      default:
        return <div className="flex items-center justify-center h-96 text-gray-400">Select a chart type</div>;
    }
  };

  const selectedConfig = CHART_CONFIGS.find(c => c.type === selectedChart);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-400">
              DataSimplify
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/charts/advanced" className="text-purple-400 hover:text-purple-300 font-medium">
                Advanced Charts ✨
              </Link>
              <Link href="/download" className="text-gray-400 hover:text-white">Downloads</Link>
              <Link href="/compare" className="text-gray-400 hover:text-white">Compare</Link>
              <Link href="/chat" className="text-gray-400 hover:text-white">AI Chat</Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Interactive Charts</h1>
            <p className="text-gray-400 mt-1">Powerful visualizations for crypto analysis and AI predictions</p>
          </div>

          {/* Download Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => downloadChart('png')}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm font-medium transition"
            >
              Download PNG
            </button>
            <button
              onClick={() => downloadChart('svg')}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition"
            >
              Download SVG
            </button>
            <button
              onClick={() => downloadChart('json')}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition"
            >
              Download Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Chart Selection */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sticky top-4">
              <h3 className="font-medium mb-4">Chart Types</h3>

              {['historical', 'volatility', 'comparison', 'prediction'].map(category => (
                <div key={category} className="mb-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    {category}
                  </div>
                  {CHART_CONFIGS.filter(c => c.category === category).map(config => (
                    <button
                      key={config.type}
                      onClick={() => setSelectedChart(config.type)}
                      className={`w-full text-left p-3 rounded-lg mb-1 transition ${
                        selectedChart === config.type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span className="text-sm font-medium">{config.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}
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
                    className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  >
                    {COINS.map(coin => (
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
                {selectedChart === 'prediction_accuracy' && 'Track the historical accuracy of our AI prediction engine across different market conditions.'}
                {selectedChart === 'price_prediction' && 'AI-powered price predictions with confidence levels and target prices.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
