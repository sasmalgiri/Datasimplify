'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore, type DefiFeeItem } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, TABLE_DENSITY_MAP, getThemeColors } from '@/lib/live-dashboard/theme';

function formatFees(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function formatChange(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return '\u2014';
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

function changeColor(n: number | null | undefined): string {
  if (n == null || isNaN(n)) return 'text-gray-500';
  return n >= 0 ? 'text-emerald-400' : 'text-red-400';
}

export function ProtocolFeesWidget() {
  const { data, siteTheme, customization } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);
  const density = TABLE_DENSITY_MAP[customization.tableDensity];
  const themeColors = getThemeColors(customization.colorTheme);
  const fees = data.defiFeeOverview;

  const { rows, insight } = useMemo(() => {
    if (!fees || !Array.isArray(fees)) return { rows: null, insight: null };

    const sorted = [...fees]
      .sort((a, b) => b.total24h - a.total24h)
      .slice(0, 20);

    if (sorted.length === 0) return { rows: null, insight: null };

    const total24h = sorted.reduce((s, f) => s + f.total24h, 0);
    const topEarner = sorted[0];
    const insightText = `Top earner: ${topEarner.name} with ${formatFees(topEarner.total24h)}/day \u2014 Total 24h: ${formatFees(total24h)} across ${sorted.length} protocols`;

    return { rows: sorted, insight: insightText };
  }, [fees]);

  // Skeleton loading state
  if (!fees) {
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
        No protocol fees data available
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className={`w-full ${density.text}`}>
          <thead>
            <tr className={`${st.textDim} text-xs uppercase border-b ${st.subtleBorder}`}>
              <th className={`text-left ${density.py} ${density.px}`}>#</th>
              <th className={`text-left ${density.py} ${density.px}`}>Protocol</th>
              <th className={`text-right ${density.py} ${density.px}`}>24h Fees</th>
              <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>7d Fees</th>
              <th className={`text-right ${density.py} ${density.px} hidden lg:table-cell`}>30d Fees</th>
              <th className={`text-right ${density.py} ${density.px}`}>1d Change</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((fee: DefiFeeItem, idx: number) => (
              <tr
                key={`${fee.slug}-${idx}`}
                className={`border-b ${st.divider} hover:${st.subtleBg} transition-colors`}
              >
                <td className={`${density.py} ${density.px} ${st.textDim} tabular-nums`}>
                  {idx + 1}
                </td>
                <td className={`${density.py} ${density.px}`}>
                  <div className="flex items-center gap-2">
                    {fee.logo && (
                      <img
                        src={fee.logo}
                        alt={fee.name}
                        width={20}
                        height={20}
                        className="rounded-full"
                        loading="lazy"
                      />
                    )}
                    <div className="min-w-0">
                      <span className={`${st.textPrimary} font-medium truncate block`}>
                        {fee.name}
                      </span>
                      {fee.category && (
                        <span className={`${st.textDim} text-[10px] capitalize`}>
                          {fee.category}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className={`${density.py} ${density.px} text-right ${st.textPrimary} font-medium tabular-nums`}>
                  {formatFees(fee.total24h)}
                </td>
                <td className={`${density.py} ${density.px} text-right ${st.textPrimary} tabular-nums hidden md:table-cell`}>
                  {formatFees(fee.total7d)}
                </td>
                <td className={`${density.py} ${density.px} text-right ${st.textPrimary} tabular-nums hidden lg:table-cell`}>
                  {formatFees(fee.total30d)}
                </td>
                <td className={`${density.py} ${density.px} text-right`}>
                  <span className={`font-medium tabular-nums ${changeColor(fee.change_1d)}`}>
                    {formatChange(fee.change_1d)}
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
