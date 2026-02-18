'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore, type DefiYield } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, TABLE_DENSITY_MAP, getThemeColors } from '@/lib/live-dashboard/theme';

function formatTVL(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatApy(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '\u2014';
  return `${n.toFixed(2)}%`;
}

function apyColor(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return 'text-gray-500';
  if (n >= 20) return 'text-emerald-400';
  if (n >= 10) return 'text-emerald-400/80';
  if (n >= 5) return 'text-yellow-400';
  return '';
}

export function DefiYieldTableWidget() {
  const { data, siteTheme, customization } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);
  const density = TABLE_DENSITY_MAP[customization.tableDensity];
  const themeColors = getThemeColors(customization.colorTheme);
  const yields = data.defiYields;

  const { rows, insight } = useMemo(() => {
    if (!yields || !Array.isArray(yields)) return { rows: null, insight: null };

    const sorted = [...yields]
      .sort((a, b) => b.tvlUsd - a.tvlUsd)
      .slice(0, 30);

    if (sorted.length === 0) return { rows: null, insight: null };

    const totalTVL = sorted.reduce((s, y) => s + y.tvlUsd, 0);
    const avgApy = sorted.reduce((s, y) => s + (y.apy || 0), 0) / sorted.length;
    const stableCount = sorted.filter((y) => y.stablecoin).length;
    const topPool = sorted[0];

    const insightText = `Top 30 pools TVL: ${formatTVL(totalTVL)} \u00B7 Avg APY: ${avgApy.toFixed(2)}% \u00B7 ${stableCount} stablecoin pools \u00B7 Top: ${topPool.project} (${topPool.symbol})`;

    return { rows: sorted, insight: insightText };
  }, [yields]);

  // Skeleton loading state
  if (!yields) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-800/50 rounded" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[280px] ${st.textDim} text-sm`}>
        No DeFi yield data available
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className={`w-full ${density.text}`}>
          <thead>
            <tr className={`${st.textDim} text-xs uppercase border-b ${st.subtleBorder}`}>
              <th className={`text-left ${density.py} ${density.px}`}>Project</th>
              <th className={`text-left ${density.py} ${density.px} hidden md:table-cell`}>Chain</th>
              <th className={`text-left ${density.py} ${density.px}`}>Symbol</th>
              <th className={`text-right ${density.py} ${density.px}`}>TVL</th>
              <th className={`text-right ${density.py} ${density.px}`}>APY</th>
              <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>Base APY</th>
              <th className={`text-right ${density.py} ${density.px} hidden lg:table-cell`}>Reward APY</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((pool: DefiYield, idx: number) => (
              <tr
                key={`${pool.pool}-${idx}`}
                className={`border-b ${st.divider} hover:${st.subtleBg} transition-colors`}
              >
                <td className={`${density.py} ${density.px} ${st.textPrimary} font-medium`}>
                  <div className="flex items-center gap-1.5">
                    <span className="truncate max-w-[120px]">{pool.project}</span>
                  </div>
                </td>
                <td className={`${density.py} ${density.px} ${st.textMuted} hidden md:table-cell`}>
                  {pool.chain}
                </td>
                <td className={`${density.py} ${density.px}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`${st.textSecondary} truncate max-w-[100px]`}>
                      {pool.symbol}
                    </span>
                    {pool.stablecoin && (
                      <span
                        className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-semibold uppercase tracking-wider shrink-0"
                        style={{
                          backgroundColor: `${themeColors.primary}15`,
                          color: themeColors.primary,
                        }}
                      >
                        Stable
                      </span>
                    )}
                  </div>
                </td>
                <td className={`${density.py} ${density.px} text-right ${st.textPrimary} font-medium tabular-nums`}>
                  {formatTVL(pool.tvlUsd)}
                </td>
                <td className={`${density.py} ${density.px} text-right`}>
                  <span className={`font-medium tabular-nums ${apyColor(pool.apy) || st.textPrimary}`}>
                    {formatApy(pool.apy)}
                  </span>
                </td>
                <td className={`${density.py} ${density.px} text-right hidden md:table-cell`}>
                  <span className={`tabular-nums ${st.textMuted}`}>
                    {formatApy(pool.apyBase)}
                  </span>
                </td>
                <td className={`${density.py} ${density.px} text-right hidden lg:table-cell`}>
                  <span className={`tabular-nums ${apyColor(pool.apyReward) || st.textMuted}`}>
                    {formatApy(pool.apyReward)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {insight && (
        <p className={`text-[10px] ${st.textDim} mt-2 text-center italic`}>{insight}</p>
      )}
    </div>
  );
}
