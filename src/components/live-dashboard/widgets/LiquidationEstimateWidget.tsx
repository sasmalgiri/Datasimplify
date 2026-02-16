'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';

function formatCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function getRiskLevel(ratio: number): { label: string; color: string; score: number } {
  if (ratio < 0.3) return { label: 'Low Risk', color: '#22c55e', score: 20 };
  if (ratio < 0.6) return { label: 'Moderate', color: '#eab308', score: 45 };
  if (ratio < 1.0) return { label: 'Elevated', color: '#f97316', score: 65 };
  if (ratio < 1.5) return { label: 'High Risk', color: '#ef4444', score: 80 };
  return { label: 'Extreme', color: '#dc2626', score: 95 };
}

export function LiquidationEstimateWidget() {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { riskLevel, topContracts, totalOI, totalVol, insight } = useMemo(() => {
    const derivs = data.derivatives;
    const markets = data.markets;
    if (!derivs || !markets) return { riskLevel: null, topContracts: null, totalOI: 0, totalVol: 0, insight: null };

    // Aggregate OI across derivatives
    const oiTotal = derivs.reduce((s, d) => s + (d.open_interest || 0), 0);

    // Get total spot volume from markets
    const spotVol = markets.reduce((s, m) => s + (m.total_volume || 0), 0);

    // OI to Volume ratio — higher means more leveraged
    const ratio = spotVol > 0 ? oiTotal / spotVol : 0;
    const risk = getRiskLevel(ratio);

    // Top contracts by OI
    const top = [...derivs]
      .filter((d) => d.open_interest > 0)
      .sort((a, b) => b.open_interest - a.open_interest)
      .slice(0, 8)
      .map((d) => ({
        market: d.market,
        symbol: d.symbol,
        oi: d.open_interest,
        volume: d.volume_24h,
        leverage: d.volume_24h > 0 ? d.open_interest / d.volume_24h : 0,
      }));

    const insightText = `OI/Volume Ratio: ${ratio.toFixed(2)} · ${risk.label} · Total OI: ${formatCompact(oiTotal)} vs Spot Vol: ${formatCompact(spotVol)}`;

    return { riskLevel: risk, topContracts: top, totalOI: oiTotal, totalVol: spotVol, insight: insightText };
  }, [data.derivatives, data.markets]);

  if (!data.derivatives || !data.markets) {
    return (
      <div className="flex items-center justify-center h-48 animate-pulse">
        <div className="h-32 w-32 rounded-full bg-gray-800/50" />
      </div>
    );
  }

  if (!riskLevel) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No data available</div>;
  }

  // SVG semi-circle gauge
  const radius = 55;
  const circumference = Math.PI * radius;
  const offset = circumference - (riskLevel.score / 100) * circumference;

  return (
    <div>
      {/* Gauge */}
      <div className="flex flex-col items-center py-2">
        <svg width="150" height="90" viewBox="0 0 150 90">
          {/* Background arc */}
          <path
            d="M 10 85 A 55 55 0 0 1 140 85"
            fill="none"
            stroke="#374151"
            strokeWidth={10}
            strokeLinecap="round"
          />
          {/* Value arc */}
          <path
            d="M 10 85 A 55 55 0 0 1 140 85"
            fill="none"
            stroke={riskLevel.color}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${circumference}`}
            strokeDashoffset={offset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="text-2xl font-bold text-white -mt-3">{riskLevel.score}</div>
        <div className="text-sm font-semibold mt-1" style={{ color: riskLevel.color }}>{riskLevel.label}</div>
        <div className="text-[10px] text-gray-500 mt-1">Market Leverage Indicator</div>
      </div>

      {/* Top contracts */}
      {topContracts && topContracts.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {topContracts.slice(0, 5).map((c, i) => (
            <div key={`${c.market}-${c.symbol}-${i}`} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-gray-500 w-4">{i + 1}</span>
                <span className="text-white font-medium">{c.symbol}</span>
                <span className="text-gray-500">{c.market}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-gray-400">{formatCompact(c.oi)}</span>
                <div className="w-12 bg-gray-800 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, c.leverage * 100)}%`,
                      backgroundColor: c.leverage > 1 ? '#ef4444' : c.leverage > 0.5 ? '#f97316' : themeColors.primary,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {insight && <p className="text-[10px] text-gray-400 mt-3 text-center italic">{insight}</p>}
    </div>
  );
}
