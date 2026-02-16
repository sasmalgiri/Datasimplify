'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';

type SignalLevel = 'Strong Buy' | 'Buy' | 'Hold' | 'Sell' | 'Strong Sell';

function getSignal(score: number): { level: SignalLevel; color: string; bgColor: string } {
  if (score >= 80) return { level: 'Strong Buy', color: '#22c55e', bgColor: '#22c55e20' };
  if (score >= 60) return { level: 'Buy', color: '#84cc16', bgColor: '#84cc1620' };
  if (score >= 40) return { level: 'Hold', color: '#eab308', bgColor: '#eab30820' };
  if (score >= 20) return { level: 'Sell', color: '#f97316', bgColor: '#f9731620' };
  return { level: 'Strong Sell', color: '#ef4444', bgColor: '#ef444420' };
}

function getSubSignalColor(score: number): string {
  if (score >= 65) return '#22c55e';
  if (score >= 40) return '#eab308';
  return '#ef4444';
}

export function SmartSignalWidget() {
  const { data } = useLiveDashboardStore();

  const { score, signal, confidence, subSignals, insight } = useMemo(() => {
    const markets = data.markets;
    const global = data.global;
    const fg = data.fearGreed;
    if (!markets || !global) return { score: null, signal: null, confidence: null, subSignals: null, insight: null };

    // 1. Trend (40%) — % of coins above their 7d MA (from sparkline)
    let aboveMaCount = 0;
    let totalWithSparkline = 0;
    const top50 = markets.slice(0, 50);
    for (const coin of top50) {
      if (coin.sparkline_in_7d?.price && coin.sparkline_in_7d.price.length > 10) {
        totalWithSparkline++;
        const prices = coin.sparkline_in_7d.price;
        const ma = prices.reduce((s, p) => s + p, 0) / prices.length;
        const current = prices[prices.length - 1];
        if (current > ma) aboveMaCount++;
      }
    }
    const trendPct = totalWithSparkline > 0 ? (aboveMaCount / totalWithSparkline) * 100 : 50;
    const trendScore = Math.min(100, trendPct * 1.25); // 80% above MA = score 100

    // 2. Sentiment (30%) — F&G contrarian: extreme fear = buy, extreme greed = sell
    const fgValue = fg?.[0] ? parseInt(fg[0].value, 10) : 50;
    // Contrarian: F&G 0 (extreme fear) = 100 (strong buy), F&G 100 (extreme greed) = 0 (strong sell)
    // But middle ground (40-60) = neutral hold (50)
    let sentimentScore: number;
    if (fgValue <= 25) sentimentScore = 90 + (25 - fgValue); // 90-115 → capped at 100
    else if (fgValue <= 40) sentimentScore = 60 + (40 - fgValue) * 2; // 60-90
    else if (fgValue <= 60) sentimentScore = 45 + (60 - fgValue) * 0.75; // 45-60
    else if (fgValue <= 75) sentimentScore = 45 - (fgValue - 60); // 30-45
    else sentimentScore = 30 - (fgValue - 75) * 1.2; // 0-30
    sentimentScore = Math.min(100, Math.max(0, sentimentScore));

    // 3. Risk (30%) — leverage ratio inverted (low leverage = safe to buy)
    let riskScore = 60; // Default neutral
    if (data.derivatives) {
      const totalOI = data.derivatives.reduce((s, d) => s + (d.open_interest || 0), 0);
      const spotVol = markets.reduce((s, m) => s + (m.total_volume || 0), 0);
      const oiRatio = spotVol > 0 ? totalOI / spotVol : 0;
      // Low OI = safe (high buy score), high OI = risky (low buy score)
      riskScore = oiRatio < 0.3 ? 90 : oiRatio < 0.6 ? 70 : oiRatio < 1.0 ? 50 : oiRatio < 1.5 ? 25 : 10;
    }

    // Composite
    const composite = Math.round(trendScore * 0.4 + sentimentScore * 0.3 + riskScore * 0.3);
    const clamped = Math.min(100, Math.max(0, composite));
    const sig = getSignal(clamped);

    // Confidence: how much sub-signals agree (low variance = high confidence)
    const mean = (trendScore + sentimentScore + riskScore) / 3;
    const variance = ((trendScore - mean) ** 2 + (sentimentScore - mean) ** 2 + (riskScore - mean) ** 2) / 3;
    const maxVariance = 2500; // Theoretical max when one is 100 and others are 0
    const conf = Math.round(Math.max(40, 100 - (variance / maxVariance) * 60));

    const subs = [
      { name: 'Trend', score: Math.round(trendScore), detail: `${aboveMaCount}/${totalWithSparkline} above MA` },
      { name: 'Sentiment', score: Math.round(sentimentScore), detail: `F&G ${fgValue}` },
      { name: 'Risk', score: Math.round(riskScore), detail: data.derivatives ? 'Leverage checked' : 'No deriv data' },
    ];

    const trendLabel = trendScore >= 65 ? 'bullish' : trendScore < 35 ? 'bearish' : 'neutral';
    const sentLabel = sentimentScore >= 65 ? 'favorable' : sentimentScore < 35 ? 'cautious' : 'moderate';
    const insightText = `${sig.level} (${conf}% confidence) — ${trendLabel} trend, ${sentLabel} sentiment, ${riskScore >= 60 ? 'low' : 'elevated'} leverage risk.`;

    return { score: clamped, signal: sig, confidence: conf, subSignals: subs, insight: insightText };
  }, [data.markets, data.global, data.fearGreed, data.derivatives]);

  if (!data.markets || !data.global) {
    return (
      <div className="flex items-center justify-center h-48 animate-pulse">
        <div className="h-24 w-24 rounded-full bg-gray-800/50" />
      </div>
    );
  }

  if (score === null || !signal) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Insufficient data</div>;
  }

  return (
    <div>
      {/* Signal Circle */}
      <div className="flex flex-col items-center py-3">
        <div
          className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-700"
          style={{ borderColor: signal.color, backgroundColor: signal.bgColor }}
        >
          <span className="text-lg font-black text-white leading-tight text-center px-1">{signal.level.toUpperCase()}</span>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-gray-400">Confidence:</span>
          <div className="w-20 bg-gray-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="h-1.5 rounded-full transition-all duration-700"
              style={{ width: `${confidence}%`, backgroundColor: signal.color }}
            />
          </div>
          <span className="text-xs font-mono text-white">{confidence}%</span>
        </div>
      </div>

      {/* Sub-signals */}
      <div className="mt-3 space-y-2">
        {subSignals?.map((sub) => (
          <div key={sub.name} className="flex items-center gap-2 text-xs">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: getSubSignalColor(sub.score) }}
            />
            <span className="text-gray-400 w-20">{sub.name}</span>
            <div className="flex-1 bg-gray-800 rounded-full h-1.5 overflow-hidden">
              <div
                className="h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${sub.score}%`, backgroundColor: getSubSignalColor(sub.score) }}
              />
            </div>
            <span className="text-gray-500 text-[10px] w-28 text-right truncate">{sub.detail}</span>
          </div>
        ))}
      </div>

      {insight && <p className="text-[10px] text-gray-400 mt-3 text-center italic">{insight}</p>}
    </div>
  );
}
