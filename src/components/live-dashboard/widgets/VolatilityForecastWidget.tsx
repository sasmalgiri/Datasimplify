'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';

function getZone(score: number): { label: string; color: string; icon: string } {
  if (score <= 33) return { label: 'Calm', color: '#22c55e', icon: '☀️' };
  if (score <= 66) return { label: 'Building', color: '#eab308', icon: '⛅' };
  return { label: 'Storm', color: '#ef4444', icon: '⛈️' };
}

export function VolatilityForecastWidget() {
  const { data } = useLiveDashboardStore();

  const { score, zone, triggers, insight } = useMemo(() => {
    const markets = data.markets;
    const fg = data.fearGreed;
    if (!markets || markets.length < 10) return { score: null, zone: null, triggers: null, insight: null };

    // 1. Price Compression (30%) — Bollinger Band width proxy from sparkline
    const compressionScores: number[] = [];
    const top20 = markets.slice(0, 20);
    for (const coin of top20) {
      if (coin.sparkline_in_7d?.price && coin.sparkline_in_7d.price.length > 20) {
        const prices = coin.sparkline_in_7d.price;
        const mean = prices.reduce((s, p) => s + p, 0) / prices.length;
        const variance = prices.reduce((s, p) => s + (p - mean) ** 2, 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        const bbWidth = mean > 0 ? (stdDev / mean) * 100 : 5; // As percentage
        compressionScores.push(bbWidth);
      }
    }
    const avgBBWidth = compressionScores.length > 0
      ? compressionScores.reduce((s, v) => s + v, 0) / compressionScores.length
      : 5;
    // Low BB width = compressed = HIGH volatility forecast (inverted)
    // Typical range: 1-10%. Below 2% = very compressed, above 8% = already volatile
    const compressionScore = avgBBWidth < 1.5 ? 95 : avgBBWidth < 3 ? 75 : avgBBWidth < 5 ? 50 : avgBBWidth < 8 ? 30 : 15;

    // 2. Leverage Build (25%) — OI/volume ratio
    let leverageScore = 40; // Default moderate
    if (data.derivatives) {
      const totalOI = data.derivatives.reduce((s, d) => s + (d.open_interest || 0), 0);
      const spotVol = markets.reduce((s, m) => s + (m.total_volume || 0), 0);
      const ratio = spotVol > 0 ? totalOI / spotVol : 0;
      leverageScore = Math.min(100, (ratio / 1.5) * 100);
    }

    // 3. Sentiment Extreme (25%) — |F&G - 50| → extremes predict vol
    const fgValue = fg?.[0] ? parseInt(fg[0].value, 10) : 50;
    const sentimentExtreme = (Math.abs(fgValue - 50) / 50) * 100;

    // 4. Range Tightening (20%) — avg (high-low)/price for top 20
    const ranges = top20
      .filter((m) => m.high_24h && m.low_24h && m.current_price > 0)
      .map((m) => ((m.high_24h! - m.low_24h!) / m.current_price) * 100);
    const avgRange = ranges.length > 0 ? ranges.reduce((s, v) => s + v, 0) / ranges.length : 5;
    // Low range = tight = pending expansion (inverted)
    const rangeScore = avgRange < 2 ? 90 : avgRange < 4 ? 65 : avgRange < 7 ? 40 : avgRange < 10 ? 25 : 15;

    // Composite
    const composite = Math.round(
      compressionScore * 0.30 +
      leverageScore * 0.25 +
      sentimentExtreme * 0.25 +
      rangeScore * 0.20
    );
    const clamped = Math.min(100, Math.max(0, composite));
    const z = getZone(clamped);

    const triggerList = [
      { name: 'Price Compression', score: Math.round(compressionScore), detail: `BB width ${avgBBWidth.toFixed(1)}%` },
      { name: 'Leverage Build', score: Math.round(leverageScore), detail: data.derivatives ? 'OI checked' : 'No data' },
      { name: 'Sentiment Extreme', score: Math.round(sentimentExtreme), detail: `F&G ${fgValue}` },
      { name: 'Range Tightening', score: Math.round(rangeScore), detail: `Avg ${avgRange.toFixed(1)}% range` },
    ].sort((a, b) => b.score - a.score);

    const topTrigger = triggerList[0];
    const insightText = `Volatility ${z.label.toUpperCase()} (${clamped}/100) — ${topTrigger.name} is primary driver at ${topTrigger.score}. ${z.label === 'Storm' ? 'Watch for breakout.' : z.label === 'Building' ? 'Prepare for increased movement.' : 'Markets are stable.'}`;

    return { score: clamped, zone: z, triggers: triggerList, insight: insightText };
  }, [data.markets, data.fearGreed, data.derivatives]);

  if (!data.markets) {
    return (
      <div className="flex items-center justify-center h-48 animate-pulse">
        <div className="h-32 w-32 rounded-full bg-gray-800/50" />
      </div>
    );
  }

  if (score === null || !zone) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Insufficient data</div>;
  }

  // SVG gauge
  const radius = 55;
  const circumference = Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div>
      {/* Gauge */}
      <div className="flex flex-col items-center py-2">
        <svg width="150" height="90" viewBox="0 0 150 90">
          {/* Background arc */}
          <defs>
            <linearGradient id="volGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#22c55e" />
              <stop offset="50%" stopColor="#eab308" />
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
            stroke={zone.color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="text-2xl font-bold text-white -mt-3">{score}</div>
        <div className="text-sm font-semibold mt-1" style={{ color: zone.color }}>
          {zone.icon} {zone.label}
        </div>
      </div>

      {/* Zone labels */}
      <div className="flex justify-between text-[8px] text-gray-600 px-2 mt-1">
        <span>Calm</span>
        <span>Building</span>
        <span>Storm</span>
      </div>

      {/* Triggers */}
      {triggers && (
        <div className="mt-3 space-y-1.5">
          {triggers.map((t) => (
            <div key={t.name} className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{t.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-gray-500 text-[10px]">{t.detail}</span>
                <div className="w-12 bg-gray-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${t.score}%`,
                      backgroundColor: t.score > 66 ? '#ef4444' : t.score > 33 ? '#eab308' : '#22c55e',
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
