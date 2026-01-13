'use client';

import { useState, useEffect, useRef } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

// State bar segment using ref to set width dynamically (avoids inline style attribute)
function StateBarSegment({ width, className }: { width: number; className: string }) {
  const barRef = useRef<HTMLDivElement>(null);
  const safeWidth = Math.max(0, Math.min(100, width || 0));

  useEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${safeWidth}%`;
    }
  }, [safeWidth]);

  return <div ref={barRef} className={className} />;
}

interface TechnicalIndicator {
  name: string;
  shortName: string;
  value: number | string;
  state: 'bullish' | 'bearish' | 'neutral';
  description: string;
  interpretation: string;
}

interface TechnicalSummary {
  bullishCount: number;
  bearishCount: number;
  neutralCount: number;
  overallTrend: string;
  currentPrice: number;
  sma20: number;
  sma50: number;
  sma200: number;
}

interface TechnicalAnalysisProps {
  coin?: string;
  showBeginnerTips?: boolean;
}

export function TechnicalAnalysis({ coin = 'BTC', showBeginnerTips = true }: TechnicalAnalysisProps) {
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '1d' | '1w'>('1d');
  const [indicators, setIndicators] = useState<TechnicalIndicator[]>([]);
  const [summary, setSummary] = useState<TechnicalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<string>('');

  // Map display coin symbol to API coin id
  const coinMap: Record<string, string> = {
    'BTC': 'bitcoin',
    'ETH': 'ethereum',
    'SOL': 'solana',
    'BNB': 'binancecoin',
    'XRP': 'ripple',
    'ADA': 'cardano',
    'DOGE': 'dogecoin',
    'DOT': 'polkadot',
  };

  useEffect(() => {
    const fetchTechnicalData = async () => {
      setLoading(true);
      setError(null);

      try {
        const coinId = coinMap[coin] || coin.toLowerCase();
        const response = await fetch(`/api/technical?coin=${coinId}&timeframe=${timeframe}`);

        if (response.ok) {
          const result = await response.json();

          if (result.success && result.data) {
            setIndicators(result.data.indicators);
            setSummary(result.data.summary);
            setDataSource(result.data.meta?.source || 'unknown');
          } else {
            setError('Failed to parse technical data');
          }
        } else {
          setError('Failed to fetch technical indicators');
        }
      } catch (err) {
        console.error('Technical analysis fetch error:', err);
        setError('Failed to load technical analysis');
      }

      setLoading(false);
    };

    fetchTechnicalData();

    // Refresh every 5 minutes
    const interval = setInterval(fetchTechnicalData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [coin, timeframe]);

  // Calculate indicator states from data
  const bullishCount = summary?.bullishCount || indicators.filter(i => i.state === 'bullish').length;
  const bearishCount = summary?.bearishCount || indicators.filter(i => i.state === 'bearish').length;
  const neutralCount = summary?.neutralCount || indicators.filter(i => i.state === 'neutral').length;
  const overallTrend = summary?.overallTrend || 'Loading...';
  const totalIndicators = Math.max(1, indicators.length);

  const getTrendColor = (trend: string) => {
    if (trend.includes('Bullish')) return 'text-green-600 bg-green-50';
    if (trend.includes('Bearish')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getStateEmoji = (state: 'bullish' | 'bearish' | 'neutral') => {
    if (state === 'bullish') return '🟢';
    if (state === 'bearish') return '🔴';
    return '⚪';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          📊 Technical Indicators - {coin}
          <InfoButton explanation="Technical indicators are mathematical calculations based on historical price data. They help analyze market conditions but are for educational purposes only." />
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Educational analysis of market indicators
        </p>
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 What are Technical Indicators?">
          Technical indicators use <strong>math and charts</strong> to analyze market conditions.
          <br/><br/>
          • 🟢 <strong>Bullish</strong> = Indicator suggests upward momentum
          <br/>
          • 🔴 <strong>Bearish</strong> = Indicator suggests downward momentum
          <br/>
          • ⚪ <strong>Neutral</strong> = No clear direction
          <br/><br/>
          ⚠️ <strong>Important:</strong> Indicators are for <em>educational analysis only</em>. They are not predictions or recommendations.
        </BeginnerTip>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Calculating indicators...</span>
        </div>
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-6">
        {(['1h', '4h', '1d', '1w'] as const).map((tf) => (
          <button
            type="button"
            key={tf}
            onClick={() => setTimeframe(tf)}
            className={`px-4 py-2 rounded-lg text-sm font-medium ${
              timeframe === tf
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {tf === '1h' ? '1 Hour' : tf === '4h' ? '4 Hours' : tf === '1d' ? '1 Day' : '1 Week'}
          </button>
        ))}
      </div>

      {/* Overall Trend */}
      <div className={`p-6 rounded-lg mb-6 ${getTrendColor(overallTrend)}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-75">Overall Trend ({timeframe})</p>
            <p className="text-3xl font-bold">{overallTrend}</p>
          </div>
          <div className="text-right">
            <div className="flex gap-4">
              <div>
                <span className="text-2xl">🟢</span>
                <p className="text-sm">{bullishCount} Bullish</p>
              </div>
              <div>
                <span className="text-2xl">⚪</span>
                <p className="text-sm">{neutralCount} Neutral</p>
              </div>
              <div>
                <span className="text-2xl">🔴</span>
                <p className="text-sm">{bearishCount} Bearish</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Indicator Summary Bar */}
      <div className="mb-6">
        <div className="flex h-4 rounded-full overflow-hidden">
          <StateBarSegment width={(bullishCount / totalIndicators) * 100} className="bg-green-500" />
          <StateBarSegment width={(neutralCount / totalIndicators) * 100} className="bg-gray-300" />
          <StateBarSegment width={(bearishCount / totalIndicators) * 100} className="bg-red-500" />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Bullish ({Math.round((bullishCount / totalIndicators) * 100)}%)</span>
          <span>Neutral ({Math.round((neutralCount / totalIndicators) * 100)}%)</span>
          <span>Bearish ({Math.round((bearishCount / totalIndicators) * 100)}%)</span>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {indicators.map((indicator) => (
          <div
            key={indicator.shortName}
            className={`p-4 rounded-lg border ${
              indicator.state === 'bullish' ? 'border-green-200 bg-green-50' :
              indicator.state === 'bearish' ? 'border-red-200 bg-red-50' :
              'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">{indicator.shortName}</p>
                <p className="text-xs text-gray-500">{indicator.name}</p>
              </div>
              <div className="text-right">
                <span className="text-xl">{getStateEmoji(indicator.state)}</span>
                <p className="text-sm font-bold">{indicator.value}</p>
              </div>
            </div>
            {showBeginnerTips && (
              <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                💡 {indicator.interpretation}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Moving Average Summary */}
      {summary && !loading && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-bold text-blue-800 mb-3">📈 Moving Average Analysis</h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-blue-600">Short-term</p>
              <p className="text-xl">{summary.currentPrice > summary.sma20 ? '🟢' : '🔴'}</p>
              <p className="text-xs text-blue-700">
                SMA 20: {summary.currentPrice > summary.sma20 ? 'Above' : 'Below'}
              </p>
              <p className="text-xs text-gray-500">${summary.sma20.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Medium-term</p>
              <p className="text-xl">{summary.currentPrice > summary.sma50 ? '🟢' : '🔴'}</p>
              <p className="text-xs text-blue-700">
                SMA 50: {summary.currentPrice > summary.sma50 ? 'Above' : 'Below'}
              </p>
              <p className="text-xs text-gray-500">${summary.sma50.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
            <div>
              <p className="text-sm text-blue-600">Long-term</p>
              <p className="text-xl">{summary.currentPrice > summary.sma200 ? '🟢' : '🔴'}</p>
              <p className="text-xs text-blue-700">
                SMA 200: {summary.currentPrice > summary.sma200 ? 'Above' : 'Below'}
              </p>
              <p className="text-xs text-gray-500">${summary.sma200.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
            </div>
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          ⚠️ <strong>Disclaimer:</strong> Technical indicators are for <em>educational purposes only</em>.
          They are based on historical data and do not predict future performance.
          This is not financial advice. Always do your own research.
        </p>
      </div>
    </div>
  );
}

export default TechnicalAnalysis;
