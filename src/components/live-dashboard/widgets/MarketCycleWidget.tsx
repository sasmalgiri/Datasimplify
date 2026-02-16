'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';

type CyclePhase = 'Accumulation' | 'Early Bull' | 'Mid Bull' | 'Late Bull' | 'Distribution' | 'Bear';

function getCyclePhase(score: number): { phase: CyclePhase; color: string } {
  if (score <= 15) return { phase: 'Accumulation', color: '#22c55e' };
  if (score <= 35) return { phase: 'Early Bull', color: '#84cc16' };
  if (score <= 55) return { phase: 'Mid Bull', color: '#eab308' };
  if (score <= 70) return { phase: 'Late Bull', color: '#f97316' };
  if (score <= 85) return { phase: 'Distribution', color: '#ef4444' };
  return { phase: 'Bear', color: '#dc2626' };
}

export function MarketCycleWidget() {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { score, phase, indicators, insight } = useMemo(() => {
    const markets = data.markets;
    const global = data.global;
    const fg = data.fearGreed;
    if (!markets || !global) return { score: null, phase: null, indicators: null, insight: null };

    const btc = markets.find((m) => m.id === 'bitcoin');
    if (!btc) return { score: null, phase: null, indicators: null, insight: null };

    // Indicator 1: Distance from ATH (0-100, 0 = at ATH, 100 = far below)
    const athDist = btc.ath_change_percentage ? Math.abs(btc.ath_change_percentage) : 50;
    const athScore = Math.min(100, athDist); // Further from ATH = higher score (more bearish)

    // Indicator 2: BTC Dominance (higher dom = more bearish/risk-off)
    const btcDom = global.market_cap_percentage?.btc || 50;
    const domScore = btcDom; // Higher dominance = less risk appetite

    // Indicator 3: Fear & Greed (inverted: fear=bearish, greed=bullish euphoria)
    const fgValue = fg?.[0] ? parseInt(fg[0].value, 10) : 50;
    const fgScore = fgValue; // Higher F&G = more euphoria = closer to top

    // Indicator 4: Market momentum (% of top 50 coins positive 24h)
    const top50 = markets.slice(0, 50);
    const positiveCount = top50.filter((m) => (m.price_change_percentage_24h || 0) > 0).length;
    const momentumPct = (positiveCount / Math.max(1, top50.length)) * 100;
    // Transform: high momentum + high F&G = potential top
    const momentumScore = momentumPct;

    // Indicator 5: Price vs 7d sparkline MA (BTC)
    let maDeviation = 50;
    if (btc.sparkline_in_7d?.price && btc.sparkline_in_7d.price.length > 0) {
      const prices = btc.sparkline_in_7d.price;
      const ma = prices.reduce((s, p) => s + p, 0) / prices.length;
      const currentPrice = prices[prices.length - 1];
      const deviation = ((currentPrice - ma) / ma) * 100;
      // Positive deviation = above MA = bullish but maybe overextended
      maDeviation = 50 + Math.min(50, Math.max(-50, deviation * 5));
    }

    // Composite cycle score: higher = closer to market top / more risk
    // Weight: ATH distance (inverted: close to ATH = high score), F&G, momentum, dominance (inverted)
    const compositeScore = (
      (100 - athScore) * 0.25 +  // Close to ATH = high score
      fgScore * 0.25 +            // High greed = high score
      momentumScore * 0.2 +       // High momentum = high score
      (100 - domScore) * 0.15 +   // Low BTC dom = high score (alt euphoria)
      maDeviation * 0.15           // Above MA = high score
    );

    const clampedScore = Math.round(Math.min(100, Math.max(0, compositeScore)));
    const cyclePhase = getCyclePhase(clampedScore);

    const indicatorList = [
      { name: 'ATH Distance', value: `${athDist.toFixed(1)}%`, score: athScore },
      { name: 'Fear & Greed', value: `${fgValue}`, score: fgScore },
      { name: 'BTC Dominance', value: `${btcDom.toFixed(1)}%`, score: domScore },
      { name: 'Market Momentum', value: `${momentumPct.toFixed(0)}% green`, score: momentumPct },
    ];

    const insightText = `Cycle Score: ${clampedScore}/100 · Phase: ${cyclePhase.phase} · ${positiveCount}/50 coins green · F&G: ${fgValue}`;

    return { score: clampedScore, phase: cyclePhase, indicators: indicatorList, insight: insightText };
  }, [data.markets, data.global, data.fearGreed]);

  if (!data.markets || !data.global) {
    return (
      <div className="flex items-center justify-center h-48 animate-pulse">
        <div className="h-32 w-32 rounded-full bg-gray-800/50" />
      </div>
    );
  }

  if (score === null || !phase) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Insufficient data for cycle analysis</div>;
  }

  // SVG semi-circle gauge
  const radius = 55;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div>
      {/* Gauge */}
      <div className="flex flex-col items-center py-2">
        <svg width="150" height="90" viewBox="0 0 150 90">
          {/* Gradient background arc */}
          <defs>
            <linearGradient id="cycleGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="33%" stopColor="#eab308" />
              <stop offset="66%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#ef4444" />
            </linearGradient>
          </defs>
          <path
            d="M 10 85 A 55 55 0 0 1 140 85"
            fill="none"
            stroke="#374151"
            strokeWidth={10}
            strokeLinecap="round"
          />
          <path
            d="M 10 85 A 55 55 0 0 1 140 85"
            fill="none"
            stroke={phase.color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="text-2xl font-bold text-white -mt-3">{score}</div>
        <div className="text-sm font-semibold mt-1" style={{ color: phase.color }}>{phase.phase}</div>
      </div>

      {/* Cycle phase labels */}
      <div className="flex justify-between text-[8px] text-gray-600 px-2 mt-1">
        <span>Accumulation</span>
        <span>Mid Bull</span>
        <span>Distribution</span>
      </div>

      {/* Indicators */}
      {indicators && (
        <div className="mt-3 space-y-1.5">
          {indicators.map((ind) => (
            <div key={ind.name} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{ind.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{ind.value}</span>
                <div className="w-12 bg-gray-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, ind.score)}%`,
                      backgroundColor: ind.score > 70 ? '#ef4444' : ind.score > 40 ? '#eab308' : '#22c55e',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {insight && <p className="text-[10px] text-gray-400 mt-2 text-center italic">{insight}</p>}
    </div>
  );
}
