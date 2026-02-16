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
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

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

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatPrice(n: number): string {
  if (n < 0.01) return `$${n.toFixed(6)}`;
  if (n < 1) return `$${n.toFixed(4)}`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/* ---------- component ---------- */

export function PortfolioInputWidget() {
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

  /* ---- form state ---- */
  const [showForm, setShowForm] = useState(false);
  const [coinName, setCoinName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [buyPrice, setBuyPrice] = useState('');
  const [buyDate, setBuyDate] = useState('');

  /* ---- markets lookup ---- */
  const markets = data.markets ?? [];

  const getCurrentPrice = (coinId: string): number | null => {
    const coin = markets.find(
      (c) => c.id === coinId || c.name.toLowerCase() === coinId.toLowerCase(),
    );
    return coin?.current_price ?? null;
  };

  /* ---- add holding ---- */
  const handleAdd = () => {
    const q = parseFloat(quantity);
    const bp = parseFloat(buyPrice);
    if (!coinName.trim() || isNaN(q) || q <= 0 || isNaN(bp) || bp <= 0) return;

    // Try to match to a market coin for the coinId
    const match = markets.find(
      (c) =>
        c.name.toLowerCase() === coinName.trim().toLowerCase() ||
        c.symbol.toLowerCase() === coinName.trim().toLowerCase() ||
        c.id.toLowerCase() === coinName.trim().toLowerCase(),
    );

    const newHolding: PortfolioHolding = {
      id: generateId(),
      coinId: match?.id ?? coinName.trim().toLowerCase().replace(/\s+/g, '-'),
      coinName: match?.name ?? coinName.trim(),
      quantity: q,
      buyPrice: bp,
      buyDate: buyDate || new Date().toISOString().split('T')[0],
    };

    setHoldings((prev) => [...prev, newHolding]);
    setCoinName('');
    setQuantity('');
    setBuyPrice('');
    setBuyDate('');
    setShowForm(false);
  };

  /* ---- delete holding ---- */
  const handleDelete = (id: string) => {
    setHoldings((prev) => prev.filter((h) => h.id !== id));
  };

  /* ---- computed summary ---- */
  const summary = useMemo(() => {
    let totalCost = 0;
    let totalValue = 0;

    const rows = holdings.map((h) => {
      const currentPrice = getCurrentPrice(h.coinId);
      const cost = h.quantity * h.buyPrice;
      const value = currentPrice != null ? h.quantity * currentPrice : null;
      const pnl = value != null ? value - cost : null;
      const pnlPct = cost > 0 && pnl != null ? (pnl / cost) * 100 : null;

      totalCost += cost;
      if (value != null) totalValue += value;

      return { ...h, currentPrice, cost, value, pnl, pnlPct };
    });

    const totalPnl = totalValue - totalCost;
    const totalPnlPct = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    return { rows, totalCost, totalValue, totalPnl, totalPnlPct };
  }, [holdings, markets]);

  /* ---- empty state ---- */
  if (holdings.length === 0 && !showForm) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${themeColors.primary}15` }}
        >
          <Plus className="w-6 h-6" style={{ color: themeColors.primary }} />
        </div>
        <p className={`${st.textSecondary} text-sm font-medium mb-1`}>No holdings yet</p>
        <p className={`${st.textDim} text-xs max-w-[240px] mb-4`}>
          Add your crypto holdings to track P&amp;L in real-time.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: `${themeColors.primary}20`,
            color: themeColors.primary,
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Holding
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ---- Collapsible Add Form ---- */}
      <button
        onClick={() => setShowForm(!showForm)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${st.textMuted} ${st.subtleBg} border ${st.subtleBorder}`}
      >
        <span className="flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" />
          Add Holding
        </span>
        {showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </button>

      {showForm && (
        <div className={`rounded-lg border ${st.subtleBorder} ${st.subtleBg} p-3 space-y-3`}>
          <div className="grid grid-cols-2 gap-2">
            {/* Coin Name */}
            <div className="col-span-2 sm:col-span-1">
              <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                Coin Name
              </label>
              <input
                type="text"
                value={coinName}
                onChange={(e) => setCoinName(e.target.value)}
                placeholder="e.g. Bitcoin"
                className={`w-full ${st.inputBg} rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors`}
              />
            </div>

            {/* Quantity */}
            <div className="col-span-2 sm:col-span-1">
              <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                Quantity
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 0.5"
                className={`w-full ${st.inputBg} rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors tabular-nums`}
              />
            </div>

            {/* Buy Price */}
            <div>
              <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                Buy Price ($)
              </label>
              <input
                type="number"
                step="any"
                min="0"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="e.g. 45000"
                className={`w-full ${st.inputBg} rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors tabular-nums`}
              />
            </div>

            {/* Buy Date */}
            <div>
              <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                Buy Date
              </label>
              <input
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                className={`w-full ${st.inputBg} rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors`}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!coinName.trim() || !quantity || !buyPrice}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor:
                  coinName.trim() && quantity && buyPrice
                    ? `${themeColors.primary}20`
                    : undefined,
                color:
                  coinName.trim() && quantity && buyPrice ? themeColors.primary : undefined,
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add Holding
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setCoinName('');
                setQuantity('');
                setBuyPrice('');
                setBuyDate('');
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium ${st.textMuted} ${st.subtleBg} transition-colors`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ---- Holdings Table ---- */}
      {holdings.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`${st.textDim} text-[10px] uppercase border-b ${st.divider}`}>
                <th className="text-left py-2 px-2">Coin</th>
                <th className="text-right py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Buy Price</th>
                <th className="text-right py-2 px-2 hidden sm:table-cell">Buy Date</th>
                <th className="text-right py-2 px-2">Current</th>
                <th className="text-right py-2 px-2 hidden md:table-cell">Value</th>
                <th className="text-right py-2 px-2">P&amp;L</th>
                <th className="text-right py-2 px-2 hidden sm:table-cell">P&amp;L%</th>
                <th className="text-center py-2 px-1" style={{ width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {summary.rows.map((row) => (
                <tr
                  key={row.id}
                  className={`border-b ${st.divider} hover:${st.subtleBg} transition-colors`}
                >
                  <td className={`py-2 px-2 ${st.textPrimary} font-medium truncate max-w-[100px]`}>
                    {row.coinName}
                  </td>
                  <td className={`py-2 px-2 text-right ${st.textSecondary} tabular-nums`}>
                    {row.quantity}
                  </td>
                  <td className={`py-2 px-2 text-right ${st.textSecondary} tabular-nums`}>
                    {formatPrice(row.buyPrice)}
                  </td>
                  <td className={`py-2 px-2 text-right ${st.textDim} hidden sm:table-cell`}>
                    {row.buyDate}
                  </td>
                  <td className={`py-2 px-2 text-right ${st.textPrimary} font-medium tabular-nums`}>
                    {row.currentPrice != null ? formatPrice(row.currentPrice) : '—'}
                  </td>
                  <td className={`py-2 px-2 text-right ${st.textSecondary} tabular-nums hidden md:table-cell`}>
                    {row.value != null ? formatCompact(row.value, vsCurrency) : '—'}
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums">
                    <span className={row.pnl != null ? percentColor(row.pnl) : st.textDim}>
                      {row.pnl != null
                        ? `${row.pnl >= 0 ? '+' : ''}${formatCompact(Math.abs(row.pnl), vsCurrency)}`
                        : '—'}
                    </span>
                  </td>
                  <td className="py-2 px-2 text-right tabular-nums hidden sm:table-cell">
                    <span className={row.pnlPct != null ? percentColor(row.pnlPct) : st.textDim}>
                      {formatPercent(row.pnlPct)}
                    </span>
                  </td>
                  <td className="py-2 px-1 text-center">
                    <button
                      onClick={() => handleDelete(row.id)}
                      className="p-1 rounded-md hover:bg-red-400/10 transition-colors group"
                      aria-label={`Delete ${row.coinName}`}
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 transition-colors" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* ---- Summary Row ---- */}
            <tfoot>
              <tr className={`border-t-2 ${st.divider} font-semibold`}>
                <td className={`py-2.5 px-2 ${st.textPrimary}`} colSpan={4}>
                  Total
                </td>
                <td className={`py-2.5 px-2 text-right ${st.textSecondary} tabular-nums hidden sm:table-cell`} />
                <td className={`py-2.5 px-2 text-right ${st.textSecondary} tabular-nums hidden md:table-cell`}>
                  {formatCompact(summary.totalValue, vsCurrency)}
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums">
                  <span className={percentColor(summary.totalPnl)}>
                    {summary.totalPnl >= 0 ? '+' : ''}
                    {formatCompact(Math.abs(summary.totalPnl), vsCurrency)}
                  </span>
                </td>
                <td className="py-2.5 px-2 text-right tabular-nums hidden sm:table-cell">
                  <span className={percentColor(summary.totalPnlPct)}>
                    {formatPercent(summary.totalPnlPct)}
                  </span>
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
