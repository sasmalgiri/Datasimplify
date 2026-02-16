'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { TABLE_DENSITY_MAP } from '@/lib/live-dashboard/theme';

interface FundingRateWidgetProps {
  limit?: number;
}

function formatCompact(n: number): string {
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

export function FundingRateWidget({ limit = 20 }: FundingRateWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const density = TABLE_DENSITY_MAP[customization.tableDensity];

  const { rows, insight } = useMemo(() => {
    const derivs = data.derivatives;
    if (!derivs || derivs.length === 0) return { rows: null, insight: null };

    // Filter to perpetual contracts with non-zero funding
    const perps = derivs
      .filter((d) => d.contract_type === 'perpetual' && d.funding_rate !== 0)
      .sort((a, b) => Math.abs(b.funding_rate) - Math.abs(a.funding_rate))
      .slice(0, limit);

    const positive = perps.filter((p) => p.funding_rate > 0).length;
    const negative = perps.filter((p) => p.funding_rate < 0).length;

    const avgRate = perps.length > 0
      ? perps.reduce((s, p) => s + p.funding_rate, 0) / perps.length
      : 0;

    const sentiment = positive > negative
      ? 'Longs dominant — market is bullish-leaning'
      : negative > positive
        ? 'Shorts dominant — market is bearish-leaning'
        : 'Balanced funding — neutral sentiment';

    const insightText = `${positive} positive / ${negative} negative funding · Avg: ${(avgRate * 100).toFixed(4)}% · ${sentiment}`;

    return { rows: perps, insight: insightText };
  }, [data.derivatives, limit]);

  if (!data.derivatives) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-800/50 rounded" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
        No perpetual funding rate data available
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className={`w-full ${density.text}`}>
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b border-gray-700">
              <th className={`text-left ${density.py} ${density.px}`}>#</th>
              <th className={`text-left ${density.py} ${density.px}`}>Market</th>
              <th className={`text-left ${density.py} ${density.px}`}>Symbol</th>
              <th className={`text-right ${density.py} ${density.px}`}>Funding Rate</th>
              <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>Open Interest</th>
              <th className={`text-right ${density.py} ${density.px} hidden lg:table-cell`}>24h Volume</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => {
              const rate = row.funding_rate * 100;
              const isPositive = rate > 0;
              return (
                <tr key={`${row.market}-${row.symbol}-${idx}`} className="border-b border-gray-800 hover:bg-white/[0.02] transition">
                  <td className={`${density.py} ${density.px} text-gray-500`}>{idx + 1}</td>
                  <td className={`${density.py} ${density.px} font-medium text-white`}>{row.market}</td>
                  <td className={`${density.py} ${density.px} text-gray-300`}>{row.symbol}</td>
                  <td className={`${density.py} ${density.px} text-right font-mono font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
                    {isPositive ? '+' : ''}{rate.toFixed(4)}%
                  </td>
                  <td className={`${density.py} ${density.px} text-right text-gray-400 hidden md:table-cell`}>
                    {row.open_interest > 0 ? formatCompact(row.open_interest) : '—'}
                  </td>
                  <td className={`${density.py} ${density.px} text-right text-gray-400 hidden lg:table-cell`}>
                    {row.volume_24h > 0 ? formatCompact(row.volume_24h) : '—'}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {insight && <p className="text-[10px] text-gray-400 mt-2 text-center italic">{insight}</p>}
    </div>
  );
}
