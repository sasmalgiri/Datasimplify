'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from 'recharts';

function getRiskLevel(score: number): { label: string; color: string } {
  if (score <= 30) return { label: 'Low Risk', color: '#22c55e' };
  if (score <= 50) return { label: 'Medium Risk', color: '#eab308' };
  if (score <= 70) return { label: 'High Risk', color: '#f97316' };
  return { label: 'Extreme Risk', color: '#ef4444' };
}

function pearsonCorrelation(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  if (n < 5) return 0;
  const sliceA = a.slice(-n);
  const sliceB = b.slice(-n);
  const meanA = sliceA.reduce((s, v) => s + v, 0) / n;
  const meanB = sliceB.reduce((s, v) => s + v, 0) / n;
  let num = 0, denA = 0, denB = 0;
  for (let i = 0; i < n; i++) {
    const da = sliceA[i] - meanA;
    const db = sliceB[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  return den > 0 ? num / den : 0;
}

export function RiskRadarWidget() {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { radarData, overallRisk, riskInfo, warnings, insight } = useMemo(() => {
    const markets = data.markets;
    const global = data.global;
    const fg = data.fearGreed;
    if (!markets || !global) return { radarData: null, overallRisk: null, riskInfo: null, warnings: null, insight: null };

    // 1. Leverage Risk (0-100)
    let leverageRisk = 30; // Default neutral
    if (data.derivatives) {
      const totalOI = data.derivatives.reduce((s, d) => s + (d.open_interest || 0), 0);
      const spotVol = markets.reduce((s, m) => s + (m.total_volume || 0), 0);
      const ratio = spotVol > 0 ? totalOI / spotVol : 0;
      leverageRisk = Math.min(100, (ratio / 1.5) * 100);
    }

    // 2. Volatility Risk — avg (high - low) / price across top 20
    const top20 = markets.slice(0, 20);
    const volPcts = top20
      .filter((m) => m.high_24h && m.low_24h && m.current_price > 0)
      .map((m) => ((m.high_24h! - m.low_24h!) / m.current_price) * 100);
    const avgVol = volPcts.length > 0 ? volPcts.reduce((s, v) => s + v, 0) / volPcts.length : 5;
    const volatilityRisk = Math.min(100, (avgVol / 15) * 100); // 15% range = 100 risk

    // 3. Concentration Risk — top 2 coins % of total mcap
    const totalMcap = global.total_market_cap?.usd || 1;
    const btcMcap = markets.find((m) => m.id === 'bitcoin')?.market_cap || 0;
    const ethMcap = markets.find((m) => m.id === 'ethereum')?.market_cap || 0;
    const top2Pct = ((btcMcap + ethMcap) / totalMcap) * 100;
    const concentrationRisk = Math.min(100, (top2Pct / 80) * 100); // 80%+ = 100 risk

    // 4. Sentiment Risk — extremes are risky
    const fgValue = fg?.[0] ? parseInt(fg[0].value, 10) : 50;
    const sentimentRisk = (Math.abs(fgValue - 50) / 50) * 100;

    // 5. Correlation Risk — avg pairwise correlation of top 8 coins
    const top8 = markets.slice(0, 8).filter((m) => m.sparkline_in_7d?.price && m.sparkline_in_7d.price.length > 20);
    let totalCorr = 0;
    let corrPairs = 0;
    for (let i = 0; i < top8.length; i++) {
      for (let j = i + 1; j < top8.length; j++) {
        const corr = pearsonCorrelation(top8[i].sparkline_in_7d!.price, top8[j].sparkline_in_7d!.price);
        totalCorr += Math.abs(corr);
        corrPairs++;
      }
    }
    const avgCorr = corrPairs > 0 ? totalCorr / corrPairs : 0.5;
    const correlationRisk = Math.min(100, avgCorr * 100); // 1.0 correlation = 100 risk

    // Composite
    const overall = Math.round(
      leverageRisk * 0.25 +
      volatilityRisk * 0.25 +
      concentrationRisk * 0.15 +
      sentimentRisk * 0.20 +
      correlationRisk * 0.15
    );
    const clamped = Math.min(100, Math.max(0, overall));
    const rInfo = getRiskLevel(clamped);

    const chartData = [
      { axis: 'Leverage', value: Math.round(leverageRisk) },
      { axis: 'Volatility', value: Math.round(volatilityRisk) },
      { axis: 'Concentration', value: Math.round(concentrationRisk) },
      { axis: 'Sentiment', value: Math.round(sentimentRisk) },
      { axis: 'Correlation', value: Math.round(correlationRisk) },
    ];

    // Generate warnings for high-risk areas
    const warns: string[] = [];
    if (leverageRisk > 60) warns.push(`Leverage elevated (OI ratio high)`);
    if (volatilityRisk > 60) warns.push(`High volatility (avg ${avgVol.toFixed(1)}% range)`);
    if (sentimentRisk > 60) warns.push(`Extreme sentiment (F&G ${fgValue})`);
    if (correlationRisk > 70) warns.push(`High correlation (avg ${(avgCorr).toFixed(2)})`);
    if (concentrationRisk > 70) warns.push(`Concentrated market (top 2 = ${top2Pct.toFixed(0)}%)`);

    const insightText = `Overall Risk: ${clamped}/100 (${rInfo.label}) — ${warns.length > 0 ? warns[0] : 'No major warnings'}`;

    return { radarData: chartData, overallRisk: clamped, riskInfo: rInfo, warnings: warns, insight: insightText };
  }, [data.markets, data.global, data.fearGreed, data.derivatives]);

  if (!data.markets || !data.global) {
    return (
      <div className="flex items-center justify-center h-48 animate-pulse">
        <div className="h-36 w-36 rounded-full bg-gray-800/50" />
      </div>
    );
  }

  if (!radarData || !riskInfo) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Insufficient data</div>;
  }

  return (
    <div>
      {/* Risk level badge */}
      <div className="flex items-center justify-center gap-2 mb-2">
        <span
          className="px-3 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: riskInfo.color + '20', color: riskInfo.color }}
        >
          {riskInfo.label}: {overallRisk}/100
        </span>
      </div>

      {/* Radar chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="#374151" />
            <PolarAngleAxis dataKey="axis" tick={{ fill: '#9ca3af', fontSize: 10 }} />
            <Radar
              name="Risk"
              dataKey="value"
              stroke={riskInfo.color}
              fill={riskInfo.color}
              fillOpacity={0.2}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      {/* Warnings */}
      {warnings && warnings.length > 0 && (
        <div className="mt-2 space-y-1">
          {warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0" />
              <span className="text-gray-400">{w}</span>
            </div>
          ))}
        </div>
      )}

      {insight && <p className="text-[10px] text-gray-400 mt-2 text-center italic">{insight}</p>}
    </div>
  );
}
