'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors, TABLE_DENSITY_MAP } from '@/lib/live-dashboard/theme';

function formatBTC(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(2)}M BTC`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K BTC`;
  return `${n.toFixed(0)} BTC`;
}

export function OpenInterestWidget() {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const density = TABLE_DENSITY_MAP[customization.tableDensity];

  const { rows, totalOI, insight } = useMemo(() => {
    const exchanges = data.derivativesExchanges;
    if (!exchanges || exchanges.length === 0) return { rows: null, totalOI: 0, insight: null };

    const sorted = [...exchanges]
      .filter((e) => e.open_interest_btc > 0)
      .sort((a, b) => b.open_interest_btc - a.open_interest_btc);

    const total = sorted.reduce((s, e) => s + e.open_interest_btc, 0);
    const totalPerps = sorted.reduce((s, e) => s + (e.number_of_perpetual_pairs || 0), 0);
    const totalFutures = sorted.reduce((s, e) => s + (e.number_of_futures_pairs || 0), 0);

    const insightText = `Total OI: ${formatBTC(total)} across ${sorted.length} exchanges · ${totalPerps} perp pairs · ${totalFutures} futures pairs`;

    return { rows: sorted, totalOI: total, insight: insightText };
  }, [data.derivativesExchanges]);

  if (!data.derivativesExchanges) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-800/50 rounded" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No open interest data available</div>;
  }

  const maxOI = rows[0]?.open_interest_btc || 1;

  return (
    <div>
      {/* Visual bar ranking */}
      <div className="space-y-2 mb-3">
        {rows.slice(0, 8).map((ex, i) => {
          const pct = (ex.open_interest_btc / maxOI) * 100;
          return (
            <div key={ex.id || ex.name} className="flex items-center gap-2 text-xs">
              <span className="text-gray-500 w-4 text-right">{i + 1}</span>
              <span className="text-white font-medium w-28 truncate">{ex.name}</span>
              <div className="flex-1 bg-gray-800 rounded h-4 relative overflow-hidden">
                <div
                  className="h-4 rounded transition-all duration-500 flex items-center"
                  style={{ width: `${pct}%`, backgroundColor: themeColors.primary + '40' }}
                >
                  <div
                    className="h-4 rounded"
                    style={{ width: `${Math.min(100, pct)}%`, backgroundColor: themeColors.primary }}
                  />
                </div>
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-gray-300 font-mono">
                  {formatBTC(ex.open_interest_btc)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary table for details */}
      {rows.length > 8 && (
        <div className="overflow-x-auto mt-2">
          <table className={`w-full ${density.text}`}>
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b border-gray-700">
                <th className={`text-left ${density.py} ${density.px}`}>Exchange</th>
                <th className={`text-right ${density.py} ${density.px}`}>OI (BTC)</th>
                <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>Perps</th>
                <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>Futures</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(8).map((ex) => (
                <tr key={ex.id || ex.name} className="border-b border-gray-800 hover:bg-white/[0.02]">
                  <td className={`${density.py} ${density.px} text-white`}>{ex.name}</td>
                  <td className={`${density.py} ${density.px} text-right text-gray-300 font-mono`}>
                    {ex.open_interest_btc.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </td>
                  <td className={`${density.py} ${density.px} text-right text-gray-400 hidden md:table-cell`}>
                    {ex.number_of_perpetual_pairs || 0}
                  </td>
                  <td className={`${density.py} ${density.px} text-right text-gray-400 hidden md:table-cell`}>
                    {ex.number_of_futures_pairs || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {insight && <p className="text-[10px] text-gray-400 mt-2 text-center italic">{insight}</p>}
    </div>
  );
}
