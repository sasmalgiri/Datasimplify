'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import {
  getSiteThemeClasses,
  getThemeColors,
  formatCompact,
  formatPercent,
  percentColor,
} from '@/lib/live-dashboard/theme';

/* ---------- data model ---------- */

interface PortfolioHolding {
  id: string;
  coinId: string;
  coinName: string;
  quantity: number;
  buyPrice: number;
  buyDate: string;
}

/* ---------- helpers ---------- */

function formatPrice(n: number): string {
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

interface GroupedCoin {
  coinId: string;
  coinName: string;
  totalQty: number;
  totalCost: number;
  avgBuyPrice: number;
  currentPrice: number | null;
  currentValue: number | null;
  unrealizedPnl: number | null;
  pnlPct: number | null;
}

/* ---------- component ---------- */

export function PLSummaryWidget() {
  const { siteTheme, colorTheme, chartHeight, vsCurrency, data } = useLiveDashboardStore((s) => ({
    siteTheme: s.siteTheme,
    colorTheme: s.customization.colorTheme,
    chartHeight: s.customization.chartHeight,
    vsCurrency: s.customization.vsCurrency,
    data: s.data,
  }));
  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(colorTheme);

  /* ---- localStorage persistence ---- */
  const [holdings, setHoldings] = useState<PortfolioHolding[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('crk-portfolio-holdings') || '[]');
    } catch {
      return [];
    }
  });
  useEffect(() => {
    localStorage.setItem('crk-portfolio-holdings', JSON.stringify(holdings));
  }, [holdings]);

  /* ---- also listen for external changes (e.g. from PortfolioInputWidget) ---- */
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'crk-portfolio-holdings') {
        try {
          setHoldings(JSON.parse(e.newValue || '[]'));
        } catch {
          /* ignore */
        }
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const markets = data.markets ?? [];

  /* ---- group holdings by coin ---- */
  const { grouped, totalCost, totalValue, totalPnl, totalPnlPct } = useMemo(() => {
    const map = new Map<string, { coinName: string; totalQty: number; totalCost: number }>();

    for (const h of holdings) {
      const key = h.coinId;
      const existing = map.get(key);
      if (existing) {
        existing.totalQty += h.quantity;
        existing.totalCost += h.quantity * h.buyPrice;
      } else {
        map.set(key, {
          coinName: h.coinName,
          totalQty: h.quantity,
          totalCost: h.quantity * h.buyPrice,
        });
      }
    }

    let tCost = 0;
    let tValue = 0;

    const grouped: GroupedCoin[] = [];

    map.forEach((val, coinId) => {
      const coin = markets.find(
        (c) => c.id === coinId || c.name.toLowerCase() === coinId.toLowerCase(),
      );
      const currentPrice = coin?.current_price ?? null;
      const currentValue = currentPrice != null ? val.totalQty * currentPrice : null;
      const avgBuyPrice = val.totalQty > 0 ? val.totalCost / val.totalQty : 0;
      const unrealizedPnl = currentValue != null ? currentValue - val.totalCost : null;
      const pnlPct =
        val.totalCost > 0 && unrealizedPnl != null
          ? (unrealizedPnl / val.totalCost) * 100
          : null;

      tCost += val.totalCost;
      if (currentValue != null) tValue += currentValue;

      grouped.push({
        coinId,
        coinName: val.coinName,
        totalQty: val.totalQty,
        avgBuyPrice,
        currentPrice,
        totalCost: val.totalCost,
        currentValue,
        unrealizedPnl,
        pnlPct,
      });
    });

    const totalPnl = tValue - tCost;
    const totalPnlPct = tCost > 0 ? (totalPnl / tCost) * 100 : 0;

    return { grouped, totalCost: tCost, totalValue: tValue, totalPnl, totalPnlPct };
  }, [holdings, markets]);

  /* ---- empty state ---- */
  if (holdings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className={`${st.textMuted} text-sm font-medium mb-1`}>No holdings yet</p>
        <p className={`${st.textDim} text-xs max-w-[220px]`}>
          Add holdings in the Portfolio Input widget to see your P&amp;L summary here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className={`${st.textDim} text-[10px] uppercase border-b ${st.divider}`}>
            <th className="text-left py-2 px-2">Coin</th>
            <th className="text-right py-2 px-2">Total Qty</th>
            <th className="text-right py-2 px-2">Avg Buy</th>
            <th className="text-right py-2 px-2">Current</th>
            <th className="text-right py-2 px-2 hidden sm:table-cell">Cost Basis</th>
            <th className="text-right py-2 px-2 hidden sm:table-cell">Value</th>
            <th className="text-right py-2 px-2">Unreal. P&amp;L</th>
            <th className="text-right py-2 px-2">P&amp;L%</th>
          </tr>
        </thead>
        <tbody>
          {grouped.map((row) => (
            <tr
              key={row.coinId}
              className={`border-b ${st.divider} hover:${st.subtleBg} transition-colors`}
            >
              <td className={`py-2 px-2 ${st.textPrimary} font-medium truncate max-w-[100px]`}>
                {row.coinName}
              </td>
              <td className={`py-2 px-2 text-right ${st.textSecondary} tabular-nums`}>
                {row.totalQty}
              </td>
              <td className={`py-2 px-2 text-right ${st.textSecondary} tabular-nums`}>
                {formatPrice(row.avgBuyPrice)}
              </td>
              <td className={`py-2 px-2 text-right ${st.textPrimary} font-medium tabular-nums`}>
                {row.currentPrice != null ? formatPrice(row.currentPrice) : '—'}
              </td>
              <td className={`py-2 px-2 text-right ${st.textSecondary} tabular-nums hidden sm:table-cell`}>
                {formatCompact(row.totalCost, vsCurrency)}
              </td>
              <td className={`py-2 px-2 text-right ${st.textSecondary} tabular-nums hidden sm:table-cell`}>
                {row.currentValue != null
                  ? formatCompact(row.currentValue, vsCurrency)
                  : '—'}
              </td>
              <td className="py-2 px-2 text-right tabular-nums">
                <span
                  className={
                    row.unrealizedPnl != null ? percentColor(row.unrealizedPnl) : st.textDim
                  }
                >
                  {row.unrealizedPnl != null
                    ? `${row.unrealizedPnl >= 0 ? '+' : ''}${formatCompact(Math.abs(row.unrealizedPnl), vsCurrency)}`
                    : '—'}
                </span>
              </td>
              <td className="py-2 px-2 text-right tabular-nums">
                <span className={row.pnlPct != null ? percentColor(row.pnlPct) : st.textDim}>
                  {formatPercent(row.pnlPct)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>

        {/* ---- Total Row ---- */}
        <tfoot>
          <tr className={`border-t-2 ${st.divider} font-semibold`}>
            <td className={`py-2.5 px-2 ${st.textPrimary}`} colSpan={4}>
              Total
            </td>
            <td className={`py-2.5 px-2 text-right ${st.textSecondary} tabular-nums hidden sm:table-cell`}>
              {formatCompact(totalCost, vsCurrency)}
            </td>
            <td className={`py-2.5 px-2 text-right ${st.textSecondary} tabular-nums hidden sm:table-cell`}>
              {formatCompact(totalValue, vsCurrency)}
            </td>
            <td className="py-2.5 px-2 text-right tabular-nums">
              <span className={percentColor(totalPnl)}>
                {totalPnl >= 0 ? '+' : ''}
                {formatCompact(Math.abs(totalPnl), vsCurrency)}
              </span>
            </td>
            <td className="py-2.5 px-2 text-right tabular-nums">
              <span className={percentColor(totalPnlPct)}>
                {formatPercent(totalPnlPct)}
              </span>
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
