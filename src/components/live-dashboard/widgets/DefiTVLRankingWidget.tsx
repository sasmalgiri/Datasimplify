'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore, type DefiProtocol } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, TABLE_DENSITY_MAP } from '@/lib/live-dashboard/theme';

function formatTVL(n: number): string {
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

export function DefiTVLRankingWidget() {
  const { data, siteTheme, customization } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);
  const density = TABLE_DENSITY_MAP[customization.tableDensity];
  const protocols = data.defiProtocols;

  const { rows, insight } = useMemo(() => {
    if (!protocols || !Array.isArray(protocols)) return { rows: null, insight: null };

    const sorted = [...protocols]
      .sort((a, b) => b.tvl - a.tvl)
      .slice(0, 20);

    if (sorted.length === 0) return { rows: null, insight: null };

    const totalTVL = sorted.reduce((s, p) => s + p.tvl, 0);
    const greenCount = sorted.filter((p) => (p.change_1d ?? 0) >= 0).length;
    const topProtocol = sorted[0];
    const topShare = totalTVL > 0 ? ((topProtocol.tvl / totalTVL) * 100).toFixed(1) : '0';

    const insightText = `Top 20 TVL: ${formatTVL(totalTVL)} \u00B7 ${greenCount}/${sorted.length} protocols positive (1d) \u00B7 #1 ${topProtocol.name} (${topShare}% share)`;

    return { rows: sorted, insight: insightText };
  }, [protocols]);

  // Skeleton loading state
  if (!protocols) {
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
        No DeFi protocol data available
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
              <th className={`text-right ${density.py} ${density.px}`}>TVL</th>
              <th className={`text-right ${density.py} ${density.px}`}>1d %</th>
              <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>7d %</th>
              <th className={`text-left ${density.py} ${density.px} hidden lg:table-cell`}>Category</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((protocol: DefiProtocol, idx: number) => (
              <tr
                key={`${protocol.slug}-${idx}`}
                className={`border-b ${st.divider} hover:${st.subtleBg} transition-colors`}
              >
                <td className={`${density.py} ${density.px} ${st.textDim} tabular-nums`}>
                  {idx + 1}
                </td>
                <td className={`${density.py} ${density.px}`}>
                  <div className="flex items-center gap-2">
                    {protocol.logo && (
                      <img
                        src={protocol.logo}
                        alt={protocol.name}
                        width={20}
                        height={20}
                        className="rounded-full"
                        loading="lazy"
                      />
                    )}
                    <div className="min-w-0">
                      <span className={`${st.textPrimary} font-medium truncate block`}>
                        {protocol.name}
                      </span>
                      {protocol.symbol && (
                        <span className={`${st.textDim} text-[10px] uppercase`}>
                          {protocol.symbol}
                        </span>
                      )}
                    </div>
                  </div>
                </td>
                <td className={`${density.py} ${density.px} text-right ${st.textPrimary} font-medium tabular-nums`}>
                  {formatTVL(protocol.tvl)}
                </td>
                <td className={`${density.py} ${density.px} text-right`}>
                  <span className={`font-medium tabular-nums ${changeColor(protocol.change_1d)}`}>
                    {formatChange(protocol.change_1d)}
                  </span>
                </td>
                <td className={`${density.py} ${density.px} text-right hidden md:table-cell`}>
                  <span className={`font-medium tabular-nums ${changeColor(protocol.change_7d)}`}>
                    {formatChange(protocol.change_7d)}
                  </span>
                </td>
                <td className={`${density.py} ${density.px} text-left hidden lg:table-cell`}>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-medium ${st.subtleBg} ${st.textMuted} capitalize`}>
                    {protocol.category || '\u2014'}
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
