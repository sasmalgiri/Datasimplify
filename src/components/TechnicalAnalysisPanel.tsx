'use client';

import React, { useRef, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Target
} from 'lucide-react';

// RSI pointer component using ref to avoid inline style warnings
function RSIPointer({ position }: { position: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const safePosition = Math.min(100, Math.max(0, position));
  useEffect(() => {
    if (ref.current) {
      ref.current.style.left = `${safePosition}%`;
      ref.current.style.transform = 'translateX(-50%)';
    }
  }, [safePosition]);
  return (
    <div
      ref={ref}
      className="absolute top-0 bottom-0 w-1 bg-white rounded-full shadow-lg transition-all duration-500"
    />
  );
}

interface TechnicalIndicator {
  name: string;
  value: number | string;
  signal: 'bullish' | 'bearish' | 'neutral';
  description?: string;
}

interface TechnicalAnalysisPanelProps {
  rsi?: number;
  macdSignal?: 'bullish_cross' | 'bearish_cross' | 'neutral';
  priceVs200MA?: 'above' | 'below' | 'near';
  priceVs50MA?: 'above' | 'below' | 'near';
  bollingerPosition?: 'upper' | 'middle' | 'lower';
  volumeTrend?: 'increasing' | 'decreasing' | 'stable';
  priceChange24h?: number;
  priceChange7d?: number;
  priceChange30d?: number;
  compact?: boolean;
}

export function TechnicalAnalysisPanel({
  rsi,
  macdSignal,
  priceVs200MA,
  priceVs50MA,
  bollingerPosition,
  volumeTrend,
  priceChange24h,
  priceChange7d,
  priceChange30d,
  compact = false
}: TechnicalAnalysisPanelProps) {
  // Build indicators array
  const indicators: TechnicalIndicator[] = [];

  // RSI
  if (rsi !== undefined) {
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    let description = 'Neutral momentum';
    if (rsi < 30) {
      signal = 'bullish';
      description = 'Oversold - potential bounce';
    } else if (rsi > 70) {
      signal = 'bearish';
      description = 'Overbought - potential pullback';
    }
    indicators.push({ name: 'RSI (14)', value: rsi.toFixed(1), signal, description });
  }

  // MACD
  if (macdSignal) {
    indicators.push({
      name: 'MACD',
      value: macdSignal === 'bullish_cross' ? 'Bullish Cross' : macdSignal === 'bearish_cross' ? 'Bearish Cross' : 'Neutral',
      signal: macdSignal === 'bullish_cross' ? 'bullish' : macdSignal === 'bearish_cross' ? 'bearish' : 'neutral',
      description: macdSignal === 'bullish_cross' ? 'Upward momentum' : macdSignal === 'bearish_cross' ? 'Downward momentum' : 'No clear signal'
    });
  }

  // 200 MA
  if (priceVs200MA) {
    indicators.push({
      name: '200-Day MA',
      value: priceVs200MA === 'above' ? 'Above' : priceVs200MA === 'below' ? 'Below' : 'Near',
      signal: priceVs200MA === 'above' ? 'bullish' : priceVs200MA === 'below' ? 'bearish' : 'neutral',
      description: priceVs200MA === 'above' ? 'Long-term uptrend' : priceVs200MA === 'below' ? 'Long-term downtrend' : 'At trend line'
    });
  }

  // 50 MA
  if (priceVs50MA) {
    indicators.push({
      name: '50-Day MA',
      value: priceVs50MA === 'above' ? 'Above' : priceVs50MA === 'below' ? 'Below' : 'Near',
      signal: priceVs50MA === 'above' ? 'bullish' : priceVs50MA === 'below' ? 'bearish' : 'neutral',
      description: priceVs50MA === 'above' ? 'Short-term uptrend' : priceVs50MA === 'below' ? 'Short-term downtrend' : 'At trend line'
    });
  }

  // Bollinger Bands
  if (bollingerPosition) {
    indicators.push({
      name: 'Bollinger Bands',
      value: bollingerPosition === 'upper' ? 'Upper Band' : bollingerPosition === 'lower' ? 'Lower Band' : 'Middle',
      signal: bollingerPosition === 'lower' ? 'bullish' : bollingerPosition === 'upper' ? 'bearish' : 'neutral',
      description: bollingerPosition === 'lower' ? 'Near support' : bollingerPosition === 'upper' ? 'Near resistance' : 'Normal range'
    });
  }

  // Volume Trend
  if (volumeTrend) {
    let signal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
    if (volumeTrend === 'increasing' && priceChange24h && priceChange24h > 0) {
      signal = 'bullish';
    } else if (volumeTrend === 'increasing' && priceChange24h && priceChange24h < 0) {
      signal = 'bearish';
    }
    indicators.push({
      name: 'Volume Trend',
      value: volumeTrend === 'increasing' ? 'Increasing' : volumeTrend === 'decreasing' ? 'Decreasing' : 'Stable',
      signal,
      description: volumeTrend === 'increasing' ? 'High activity' : volumeTrend === 'decreasing' ? 'Low activity' : 'Normal'
    });
  }

  // Calculate overall technical score
  const bullishCount = indicators.filter(i => i.signal === 'bullish').length;
  const bearishCount = indicators.filter(i => i.signal === 'bearish').length;
  const totalIndicators = indicators.length;

  let overallSignal: 'bullish' | 'bearish' | 'neutral' = 'neutral';
  let overallLabel = 'Neutral';
  if (bullishCount > bearishCount + 1) {
    overallSignal = 'bullish';
    overallLabel = 'Bullish';
  } else if (bearishCount > bullishCount + 1) {
    overallSignal = 'bearish';
    overallLabel = 'Bearish';
  }

  const getSignalStyle = (signal: 'bullish' | 'bearish' | 'neutral') => {
    switch (signal) {
      case 'bullish':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: TrendingUp };
      case 'bearish':
        return { bg: 'bg-red-500/20', text: 'text-red-400', icon: TrendingDown };
      default:
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Minus };
    }
  };

  const overallStyle = getSignalStyle(overallSignal);
  const OverallIcon = overallStyle.icon;

  if (compact) {
    return (
      <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-gray-300 font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Technical
          </h3>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${overallStyle.bg} ${overallStyle.text}`}>
            {overallLabel}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gray-900/50 rounded-lg p-2">
            <div className="text-gray-400 text-xs mb-1">RSI</div>
            <div className={`font-medium ${rsi && rsi < 30 ? 'text-emerald-400' : rsi && rsi > 70 ? 'text-red-400' : 'text-gray-300'}`}>
              {rsi?.toFixed(0) || '-'}
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-2">
            <div className="text-gray-400 text-xs mb-1">Trend</div>
            <div className={`font-medium ${priceVs200MA === 'above' ? 'text-emerald-400' : priceVs200MA === 'below' ? 'text-red-400' : 'text-gray-300'}`}>
              {priceVs200MA === 'above' ? 'Up' : priceVs200MA === 'below' ? 'Down' : 'Flat'}
            </div>
          </div>
          <div className="bg-gray-900/50 rounded-lg p-2">
            <div className="text-gray-400 text-xs mb-1">Vol</div>
            <div className={`font-medium ${volumeTrend === 'increasing' ? 'text-emerald-400' : volumeTrend === 'decreasing' ? 'text-red-400' : 'text-gray-300'}`}>
              {volumeTrend === 'increasing' ? 'High' : volumeTrend === 'decreasing' ? 'Low' : 'Normal'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-5 border border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-400" />
          Technical Analysis
        </h3>
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${overallStyle.bg}`}>
          <OverallIcon className={`w-4 h-4 ${overallStyle.text}`} />
          <span className={`text-sm font-medium ${overallStyle.text}`}>{overallLabel}</span>
          <span className="text-gray-500 text-xs">
            ({bullishCount}/{totalIndicators} bullish)
          </span>
        </div>
      </div>

      {/* Price Changes */}
      {(priceChange24h !== undefined || priceChange7d !== undefined || priceChange30d !== undefined) && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          {priceChange24h !== undefined && (
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">24h Change</div>
              <div className={`font-semibold flex items-center gap-1 ${priceChange24h >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {priceChange24h >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {priceChange24h >= 0 ? '+' : ''}{priceChange24h.toFixed(2)}%
              </div>
            </div>
          )}
          {priceChange7d !== undefined && (
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">7d Change</div>
              <div className={`font-semibold flex items-center gap-1 ${priceChange7d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {priceChange7d >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {priceChange7d >= 0 ? '+' : ''}{priceChange7d.toFixed(2)}%
              </div>
            </div>
          )}
          {priceChange30d !== undefined && (
            <div className="bg-gray-900/50 rounded-lg p-3">
              <div className="text-gray-400 text-xs mb-1">30d Change</div>
              <div className={`font-semibold flex items-center gap-1 ${priceChange30d >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {priceChange30d >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                {priceChange30d >= 0 ? '+' : ''}{priceChange30d.toFixed(2)}%
              </div>
            </div>
          )}
        </div>
      )}

      {/* Indicators Grid */}
      <div className="space-y-3">
        {indicators.map((indicator, index) => {
          const style = getSignalStyle(indicator.signal);
          const Icon = style.icon;

          return (
            <div key={index} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded ${style.bg}`}>
                  <Icon className={`w-4 h-4 ${style.text}`} />
                </div>
                <div>
                  <div className="text-gray-300 font-medium text-sm">{indicator.name}</div>
                  {indicator.description && (
                    <div className="text-gray-500 text-xs">{indicator.description}</div>
                  )}
                </div>
              </div>
              <div className={`font-medium text-sm ${style.text}`}>
                {indicator.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* RSI Gauge (if available) */}
      {rsi !== undefined && (
        <div className="mt-5 pt-5 border-t border-gray-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm flex items-center gap-1">
              <Target className="w-4 h-4" />
              RSI Gauge
            </span>
            <span className={`font-semibold ${rsi < 30 ? 'text-emerald-400' : rsi > 70 ? 'text-red-400' : 'text-yellow-400'}`}>
              {rsi.toFixed(1)}
            </span>
          </div>
          <div className="relative h-3 bg-gray-700 rounded-full overflow-hidden">
            {/* Zones */}
            <div className="absolute inset-0 flex">
              <div className="w-[30%] bg-emerald-500/30" />
              <div className="w-[40%] bg-yellow-500/30" />
              <div className="w-[30%] bg-red-500/30" />
            </div>
            {/* Pointer */}
            <RSIPointer position={rsi} />
          </div>
          <div className="flex justify-between mt-1 text-xs text-gray-500">
            <span>Oversold</span>
            <span>Neutral</span>
            <span>Overbought</span>
          </div>
        </div>
      )}
    </div>
  );
}

// Signal summary badge for quick display
export function TechnicalSignalBadge({
  signal,
  score
}: {
  signal: 'bullish' | 'bearish' | 'neutral';
  score?: number;
}) {
  const getStyle = () => {
    switch (signal) {
      case 'bullish':
        return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', icon: TrendingUp };
      case 'bearish':
        return { bg: 'bg-red-500/20', text: 'text-red-400', icon: TrendingDown };
      default:
        return { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: Minus };
    }
  };

  const style = getStyle();
  const Icon = style.icon;

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${style.bg} ${style.text}`}>
      <Icon className="w-3 h-3" />
      <span className="capitalize">{signal}</span>
      {score !== undefined && <span className="opacity-60">({score})</span>}
    </span>
  );
}
