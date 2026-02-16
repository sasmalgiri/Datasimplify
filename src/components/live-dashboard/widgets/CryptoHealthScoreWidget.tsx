'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';

type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

function getGrade(score: number): { grade: Grade; color: string; label: string } {
  if (score >= 80) return { grade: 'A', color: '#22c55e', label: 'Excellent' };
  if (score >= 60) return { grade: 'B', color: '#84cc16', label: 'Good' };
  if (score >= 40) return { grade: 'C', color: '#eab308', label: 'Fair' };
  if (score >= 20) return { grade: 'D', color: '#f97316', label: 'Poor' };
  return { grade: 'F', color: '#ef4444', label: 'Critical' };
}

export function CryptoHealthScoreWidget() {
  const { data } = useLiveDashboardStore();

  const { score, gradeInfo, subScores, insight } = useMemo(() => {
    const markets = data.markets;
    const global = data.global;
    const fg = data.fearGreed;
    if (!markets || !global) return { score: null, gradeInfo: null, subScores: null, insight: null };

    // 1. Breadth (25%) — % of top 50 coins positive 24h
    const top50 = markets.slice(0, 50);
    const greenCount = top50.filter((m) => (m.price_change_percentage_24h || 0) > 0).length;
    const breadthPct = (greenCount / Math.max(1, top50.length)) * 100;
    const breadthScore = Math.min(100, breadthPct * 1.25); // Scale: 80% green = 100 score

    // 2. Volume (20%) — total volume / total market cap ratio
    const totalVol = global.total_volume?.usd || 0;
    const totalMcap = global.total_market_cap?.usd || 1;
    const volRatio = totalVol / totalMcap;
    // Healthy range: 0.03-0.08. Below 0.02 = very low, above 0.10 = overheated
    const volScore = volRatio < 0.02 ? 20 : volRatio < 0.03 ? 40 : volRatio < 0.05 ? 80 : volRatio < 0.08 ? 100 : volRatio < 0.12 ? 70 : 40;

    // 3. Sentiment (20%) — F&G centered health (25-75 = healthy, extremes = unhealthy)
    const fgValue = fg?.[0] ? parseInt(fg[0].value, 10) : 50;
    const fgDistance = Math.abs(fgValue - 50);
    const sentimentScore = Math.max(0, 100 - fgDistance * 2.5); // 50 = 100, 0 or 100 = 0, ±20 = 50

    // 4. Leverage (20%) — OI/volume ratio (lower = healthier)
    let leverageScore = 70; // Default if no derivatives data
    if (data.derivatives) {
      const totalOI = data.derivatives.reduce((s, d) => s + (d.open_interest || 0), 0);
      const spotVol = markets.reduce((s, m) => s + (m.total_volume || 0), 0);
      const oiRatio = spotVol > 0 ? totalOI / spotVol : 0;
      leverageScore = oiRatio < 0.3 ? 100 : oiRatio < 0.6 ? 80 : oiRatio < 1.0 ? 55 : oiRatio < 1.5 ? 30 : 10;
    }

    // 5. Sector Balance (15%) — lower std deviation of category returns = more balanced
    let sectorScore = 60; // Default
    if (data.categories && data.categories.length > 3) {
      const changes = data.categories
        .map((c: any) => c.market_cap_change_24h ?? 0)
        .filter((v: number) => v !== 0);
      if (changes.length > 3) {
        const mean = changes.reduce((s: number, v: number) => s + v, 0) / changes.length;
        const variance = changes.reduce((s: number, v: number) => s + (v - mean) ** 2, 0) / changes.length;
        const stdDev = Math.sqrt(variance);
        // Low std dev = balanced, high std dev = unbalanced
        sectorScore = stdDev < 2 ? 100 : stdDev < 5 ? 80 : stdDev < 10 ? 60 : stdDev < 20 ? 35 : 15;
      }
    }

    // Composite
    const composite = Math.round(
      breadthScore * 0.25 +
      volScore * 0.20 +
      sentimentScore * 0.20 +
      leverageScore * 0.20 +
      sectorScore * 0.15
    );
    const clamped = Math.min(100, Math.max(0, composite));
    const grade = getGrade(clamped);

    const subs = [
      { name: 'Breadth', score: Math.round(breadthScore), detail: `${greenCount}/${top50.length} coins green` },
      { name: 'Volume', score: Math.round(volScore), detail: `${(volRatio * 100).toFixed(1)}% vol/mcap` },
      { name: 'Sentiment', score: Math.round(sentimentScore), detail: `F&G ${fgValue}` },
      { name: 'Leverage', score: Math.round(leverageScore), detail: data.derivatives ? 'Derivatives active' : 'No deriv data' },
      { name: 'Sector Balance', score: Math.round(sectorScore), detail: `${data.categories?.length || 0} sectors` },
    ];

    const topSub = subs.reduce((a, b) => a.score > b.score ? a : b);
    const weakSub = subs.reduce((a, b) => a.score < b.score ? a : b);
    const insightText = `Market Health: ${grade.grade} (${clamped}/100) — ${topSub.name} strongest at ${topSub.score}, ${weakSub.name} weakest at ${weakSub.score}.`;

    return { score: clamped, gradeInfo: grade, subScores: subs, insight: insightText };
  }, [data.markets, data.global, data.fearGreed, data.derivatives, data.categories]);

  if (!data.markets || !data.global) {
    return (
      <div className="flex items-center justify-center h-48 animate-pulse">
        <div className="h-28 w-28 rounded-full bg-gray-800/50" />
      </div>
    );
  }

  if (score === null || !gradeInfo) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">Insufficient data</div>;
  }

  return (
    <div>
      {/* Grade Circle */}
      <div className="flex flex-col items-center py-3">
        <div
          className="w-24 h-24 rounded-full flex flex-col items-center justify-center border-4 transition-all duration-700"
          style={{ borderColor: gradeInfo.color }}
        >
          <span className="text-4xl font-black text-white leading-none">{gradeInfo.grade}</span>
          <span className="text-xs font-medium text-gray-400">{score}/100</span>
        </div>
        <div className="text-sm font-semibold mt-2" style={{ color: gradeInfo.color }}>{gradeInfo.label}</div>
      </div>

      {/* Sub-scores */}
      <div className="mt-3 space-y-2">
        {subScores?.map((sub) => {
          const subGrade = getGrade(sub.score);
          return (
            <div key={sub.name} className="flex items-center gap-2 text-xs">
              <span className="text-gray-400 w-24">{sub.name}</span>
              <div className="flex-1 bg-gray-800 rounded-full h-2 overflow-hidden">
                <div
                  className="h-2 rounded-full transition-all duration-700"
                  style={{ width: `${sub.score}%`, backgroundColor: subGrade.color }}
                />
              </div>
              <span className="text-white font-mono w-8 text-right">{sub.score}</span>
            </div>
          );
        })}
      </div>

      {insight && <p className="text-[10px] text-gray-400 mt-3 text-center italic">{insight}</p>}
    </div>
  );
}
