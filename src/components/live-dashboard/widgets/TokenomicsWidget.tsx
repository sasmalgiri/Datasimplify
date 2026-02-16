'use client';

import { useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';
import Image from 'next/image';

interface TokenomicsWidgetProps {
  limit?: number;
}

function formatCompact(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
}

export function TokenomicsWidget({ limit = 15 }: TokenomicsWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);

  const { rows, insight } = useMemo(() => {
    const markets = data.markets;
    if (!markets) return { rows: null, insight: null };

    const analyzed = markets
      .filter((m) => m.circulating_supply && m.circulating_supply > 0)
      .slice(0, limit)
      .map((m) => {
        const circulating = m.circulating_supply || 0;
        const max = m.max_supply || 0;
        const mcap = m.market_cap || 0;
        const fdv = max > 0 ? (mcap / circulating) * max : mcap;
        const supplyRatio = max > 0 ? (circulating / max) * 100 : 100;
        const fdvMcapRatio = mcap > 0 ? fdv / mcap : 1;

        let flag = '';
        if (supplyRatio < 30) flag = 'Low Float';
        else if (supplyRatio >= 90) flag = 'Fully Diluted';
        else if (fdvMcapRatio > 3) flag = 'High FDV';

        return {
          id: m.id,
          name: m.name,
          symbol: m.symbol.toUpperCase(),
          image: m.image,
          circulating,
          max,
          mcap,
          fdv,
          supplyRatio,
          fdvMcapRatio,
          flag,
        };
      });

    const lowFloat = analyzed.filter((a) => a.flag === 'Low Float').length;
    const fullyDiluted = analyzed.filter((a) => a.flag === 'Fully Diluted').length;
    const highFdv = analyzed.filter((a) => a.flag === 'High FDV').length;
    const avgSupplyRatio = analyzed.length > 0
      ? analyzed.reduce((s, a) => s + a.supplyRatio, 0) / analyzed.length
      : 0;

    const insightText = `Avg supply released: ${avgSupplyRatio.toFixed(0)}% · ${lowFloat} low float · ${highFdv} high FDV · ${fullyDiluted} fully diluted`;

    return { rows: analyzed, insight: insightText };
  }, [data.markets, limit]);

  if (!data.markets) {
    return (
      <div className="animate-pulse space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-10 bg-gray-800/50 rounded" />
        ))}
      </div>
    );
  }

  if (!rows || rows.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No supply data available</div>;
  }

  return (
    <div>
      <div className="space-y-2">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center gap-3 text-xs">
            {/* Coin info */}
            <div className="flex items-center gap-1.5 w-24 shrink-0">
              {row.image && <Image src={row.image} alt={row.name} width={16} height={16} className="rounded-full" />}
              <span className="font-medium text-white truncate">{row.symbol}</span>
            </div>

            {/* Supply bar */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-800 rounded-full h-3 relative overflow-hidden">
                  <div
                    className="h-3 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, row.supplyRatio)}%`,
                      backgroundColor: row.supplyRatio < 30 ? '#f97316' : row.supplyRatio >= 90 ? '#22c55e' : themeColors.primary,
                    }}
                  />
                  <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-white/80">
                    {row.supplyRatio.toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* FDV ratio */}
            <div className="w-16 text-right shrink-0">
              <span className={`font-mono ${row.fdvMcapRatio > 3 ? 'text-red-400' : row.fdvMcapRatio > 1.5 ? 'text-yellow-400' : 'text-gray-400'}`}>
                {row.fdvMcapRatio.toFixed(1)}x
              </span>
            </div>

            {/* Flag */}
            <div className="w-20 text-right shrink-0">
              {row.flag === 'Low Float' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium">Low Float</span>
              )}
              {row.flag === 'Fully Diluted' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">Full Supply</span>
              )}
              {row.flag === 'High FDV' && (
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-medium">High FDV</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-3 text-[9px] text-gray-500">
        <span>Bar = % supply released</span>
        <span>Nx = FDV / MCap ratio</span>
      </div>

      {insight && <p className="text-[10px] text-gray-400 mt-1 text-center italic">{insight}</p>}
    </div>
  );
}
