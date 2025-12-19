'use client';

import { useState, useEffect, useRef } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

// Signal bar segment using ref to set width dynamically (avoids inline style attribute)
function SignalBarSegment({ width, className }: { width: number; className: string }) {
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
  signal: 'buy' | 'sell' | 'neutral';
  description: string;
  beginnerExplanation: string;
}

interface TechnicalAnalysisProps {
  coin?: string;
  showBeginnerTips?: boolean;
}

export function TechnicalAnalysis({ coin = 'BTC', showBeginnerTips = true }: TechnicalAnalysisProps) {
  const [timeframe, setTimeframe] = useState<'1h' | '4h' | '1d' | '1w'>('1d');

  // Sample indicators - in production would be calculated from price data
  const indicators: TechnicalIndicator[] = [
    {
      name: 'Relative Strength Index',
      shortName: 'RSI (14)',
      value: 62,
      signal: 'neutral',
      description: 'Momentum oscillator measuring speed of price changes',
      beginnerExplanation: 'Above 70 = overbought (might drop). Below 30 = oversold (might rise). Currently neutral.'
    },
    {
      name: 'Moving Average (20)',
      shortName: 'SMA 20',
      value: '$95,200',
      signal: 'buy',
      description: 'Average price over last 20 periods',
      beginnerExplanation: 'Price is ABOVE the 20-day average = bullish trend. Good sign!'
    },
    {
      name: 'Moving Average (50)',
      shortName: 'SMA 50',
      value: '$88,500',
      signal: 'buy',
      description: 'Average price over last 50 periods',
      beginnerExplanation: 'Price is ABOVE the 50-day average = longer-term bullish trend.'
    },
    {
      name: 'Moving Average (200)',
      shortName: 'SMA 200',
      value: '$62,800',
      signal: 'buy',
      description: 'Average price over last 200 periods',
      beginnerExplanation: 'Price above 200-day average = strong long-term uptrend!'
    },
    {
      name: 'MACD',
      shortName: 'MACD',
      value: '+1,250',
      signal: 'buy',
      description: 'Moving Average Convergence Divergence',
      beginnerExplanation: 'Positive MACD = bullish momentum. The trend is your friend!'
    },
    {
      name: 'Bollinger Bands',
      shortName: 'BB',
      value: 'Middle',
      signal: 'neutral',
      description: 'Volatility bands around price',
      beginnerExplanation: 'Price is in the middle band = no extreme condition.'
    },
    {
      name: 'Stochastic RSI',
      shortName: 'StochRSI',
      value: 58,
      signal: 'neutral',
      description: 'RSI applied to RSI for more sensitivity',
      beginnerExplanation: 'Currently neutral. Neither overbought nor oversold.'
    },
    {
      name: 'Average Directional Index',
      shortName: 'ADX',
      value: 42,
      signal: 'buy',
      description: 'Measures trend strength',
      beginnerExplanation: 'Above 25 = strong trend. Currently showing a strong upward trend.'
    },
    {
      name: 'Commodity Channel Index',
      shortName: 'CCI (20)',
      value: 85,
      signal: 'neutral',
      description: 'Identifies cyclical trends',
      beginnerExplanation: 'Between -100 and +100 is normal. Currently slightly above average.'
    },
    {
      name: 'Williams %R',
      shortName: 'Williams %R',
      value: -35,
      signal: 'neutral',
      description: 'Momentum indicator similar to Stochastic',
      beginnerExplanation: 'Between -20 and -80 is neutral zone. Currently healthy.'
    },
    {
      name: 'Ichimoku Cloud',
      shortName: 'Ichimoku',
      value: 'Above Cloud',
      signal: 'buy',
      description: 'Japanese indicator showing support/resistance',
      beginnerExplanation: 'Price above the cloud = bullish! Strong support below.'
    },
    {
      name: 'Pivot Points',
      shortName: 'Pivot',
      value: '$94,500',
      signal: 'buy',
      description: 'Key support and resistance levels',
      beginnerExplanation: 'Price above pivot point = bullish for today.'
    },
  ];

  // Calculate overall signal
  const buySignals = indicators.filter(i => i.signal === 'buy').length;
  const sellSignals = indicators.filter(i => i.signal === 'sell').length;
  const neutralSignals = indicators.filter(i => i.signal === 'neutral').length;

  const overallSignal = buySignals > sellSignals + 2 ? 'Strong Buy' :
                       buySignals > sellSignals ? 'Buy' :
                       sellSignals > buySignals + 2 ? 'Strong Sell' :
                       sellSignals > buySignals ? 'Sell' : 'Neutral';

  const getSignalColor = (signal: string) => {
    if (signal.includes('Buy')) return 'text-green-600 bg-green-50';
    if (signal.includes('Sell')) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getSignalEmoji = (signal: 'buy' | 'sell' | 'neutral') => {
    if (signal === 'buy') return '🟢';
    if (signal === 'sell') return '🔴';
    return '⚪';
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          📊 Technical Analysis - {coin}
          <InfoButton explanation="Technical analysis uses mathematical indicators to predict future price movements based on historical data. These are commonly used by traders." />
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          What the charts are telling us
        </p>
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 What is Technical Analysis?">
          Technical analysis uses <strong>math and charts</strong> to predict where prices might go.
          <br/><br/>
          • 🟢 <strong>Buy Signal</strong> = Indicator suggests price might go UP
          <br/>
          • 🔴 <strong>Sell Signal</strong> = Indicator suggests price might go DOWN
          <br/>
          • ⚪ <strong>Neutral</strong> = No clear direction
          <br/><br/>
          ⚠️ <strong>Remember:</strong> No indicator is 100% accurate! Use them as one input, not the only input.
        </BeginnerTip>
      )}

      {/* Timeframe Selector */}
      <div className="flex gap-2 mb-6">
        {(['1h', '4h', '1d', '1w'] as const).map((tf) => (
          <button
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

      {/* Overall Signal */}
      <div className={`p-6 rounded-lg mb-6 ${getSignalColor(overallSignal)}`}>
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm opacity-75">Overall Signal ({timeframe})</p>
            <p className="text-3xl font-bold">{overallSignal}</p>
          </div>
          <div className="text-right">
            <div className="flex gap-4">
              <div>
                <span className="text-2xl">🟢</span>
                <p className="text-sm">{buySignals} Buy</p>
              </div>
              <div>
                <span className="text-2xl">⚪</span>
                <p className="text-sm">{neutralSignals} Neutral</p>
              </div>
              <div>
                <span className="text-2xl">🔴</span>
                <p className="text-sm">{sellSignals} Sell</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Signal Summary Bar */}
      <div className="mb-6">
        <div className="flex h-4 rounded-full overflow-hidden">
          <SignalBarSegment width={(buySignals / indicators.length) * 100} className="bg-green-500" />
          <SignalBarSegment width={(neutralSignals / indicators.length) * 100} className="bg-gray-300" />
          <SignalBarSegment width={(sellSignals / indicators.length) * 100} className="bg-red-500" />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Buy ({Math.round((buySignals / indicators.length) * 100)}%)</span>
          <span>Neutral ({Math.round((neutralSignals / indicators.length) * 100)}%)</span>
          <span>Sell ({Math.round((sellSignals / indicators.length) * 100)}%)</span>
        </div>
      </div>

      {/* Indicators Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {indicators.map((indicator) => (
          <div
            key={indicator.shortName}
            className={`p-4 rounded-lg border ${
              indicator.signal === 'buy' ? 'border-green-200 bg-green-50' :
              indicator.signal === 'sell' ? 'border-red-200 bg-red-50' :
              'border-gray-200 bg-gray-50'
            }`}
          >
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-bold">{indicator.shortName}</p>
                <p className="text-xs text-gray-500">{indicator.name}</p>
              </div>
              <div className="text-right">
                <span className="text-xl">{getSignalEmoji(indicator.signal)}</span>
                <p className="text-sm font-bold">{indicator.value}</p>
              </div>
            </div>
            {showBeginnerTips && (
              <p className="text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                💡 {indicator.beginnerExplanation}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Moving Average Summary */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-bold text-blue-800 mb-3">📈 Moving Average Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-sm text-blue-600">Short-term</p>
            <p className="text-xl">🟢</p>
            <p className="text-xs text-blue-700">SMA 20: Bullish</p>
          </div>
          <div>
            <p className="text-sm text-blue-600">Medium-term</p>
            <p className="text-xl">🟢</p>
            <p className="text-xs text-blue-700">SMA 50: Bullish</p>
          </div>
          <div>
            <p className="text-sm text-blue-600">Long-term</p>
            <p className="text-xl">🟢</p>
            <p className="text-xs text-blue-700">SMA 200: Bullish</p>
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-xs text-yellow-800">
          ⚠️ <strong>Disclaimer:</strong> Technical indicators are based on historical data and do not guarantee future performance. 
          Always combine technical analysis with fundamental analysis and never invest more than you can afford to lose.
        </p>
      </div>
    </div>
  );
}

export default TechnicalAnalysis;
