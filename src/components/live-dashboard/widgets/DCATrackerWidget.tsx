'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors, TABLE_DENSITY_MAP } from '@/lib/live-dashboard/theme';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';

/* ---------- types ---------- */

interface DCAEntry {
  id: string;
  date: string;
  coinId: string;
  coinName: string;
  amountSpent: number;
  priceAtPurchase: number;
}

/* ---------- localStorage helpers ---------- */

const STORAGE_KEY = 'crk-dca-entries';

function loadEntries(): DCAEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveEntries(entries: DCAEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Quota exceeded — silently ignore
  }
}

/* ---------- helpers ---------- */

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatUsd(n: number): string {
  if (Math.abs(n) >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (Math.abs(n) >= 1) return `$${n.toFixed(2)}`;
  if (n === 0) return '$0.00';
  return `$${n.toFixed(6)}`;
}

function formatPnl(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${formatUsd(n)}`;
}

/* ---------- component ---------- */

export function DCATrackerWidget() {
  const data = useLiveDashboardStore((s) => s.data);
  const { siteTheme, colorTheme, tableDensity } = useLiveDashboardStore((s) => ({
    siteTheme: s.siteTheme,
    colorTheme: s.customization.colorTheme,
    tableDensity: s.customization.tableDensity,
  }));

  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(colorTheme);
  const density = TABLE_DENSITY_MAP[tableDensity];

  // ---- Entries state ----
  const [entries, setEntries] = useState<DCAEntry[]>([]);
  const [showForm, setShowForm] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setEntries(loadEntries());
  }, []);

  // Persist on change
  const updateEntries = useCallback((next: DCAEntry[]) => {
    setEntries(next);
    saveEntries(next);
  }, []);

  // ---- Form state ----
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formCoin, setFormCoin] = useState('bitcoin');
  const [formAmount, setFormAmount] = useState('');
  const [formPrice, setFormPrice] = useState('');

  // ---- Handlers ----
  const handleAdd = () => {
    const amountSpent = parseFloat(formAmount);
    const priceAtPurchase = parseFloat(formPrice);
    if (!formDate || !formCoin || isNaN(amountSpent) || amountSpent <= 0 || isNaN(priceAtPurchase) || priceAtPurchase <= 0) return;

    const newEntry: DCAEntry = {
      id: generateId(),
      date: formDate,
      coinId: formCoin.toLowerCase().trim(),
      coinName: formCoin.trim(),
      amountSpent,
      priceAtPurchase,
    };

    // Try to get the proper coin name from market data
    const marketCoin = data.markets?.find((c) => c.id === newEntry.coinId);
    if (marketCoin) {
      newEntry.coinName = marketCoin.name;
    }

    const next = [...entries, newEntry].sort((a, b) => a.date.localeCompare(b.date));
    updateEntries(next);

    // Reset form
    setFormAmount('');
    setFormPrice('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    updateEntries(entries.filter((e) => e.id !== id));
  };

  // ---- Current prices from market data ----
  const currentPriceMap = useMemo(() => {
    const map: Record<string, number> = {};
    if (data.markets) {
      for (const coin of data.markets) {
        map[coin.id] = coin.current_price;
      }
    }
    return map;
  }, [data.markets]);

  // ---- Enriched rows ----
  const enrichedEntries = useMemo(() => {
    return entries.map((entry) => {
      const qty = entry.priceAtPurchase > 0 ? entry.amountSpent / entry.priceAtPurchase : 0;
      const currentPrice = currentPriceMap[entry.coinId] ?? null;
      const currentValue = currentPrice !== null ? qty * currentPrice : null;
      const pnl = currentValue !== null ? currentValue - entry.amountSpent : null;
      return { ...entry, qty, currentPrice, currentValue, pnl };
    });
  }, [entries, currentPriceMap]);

  // ---- Summary ----
  const summary = useMemo(() => {
    let totalInvested = 0;
    let totalCurrentValue = 0;
    let hasPrice = false;
    let totalQtyWeightedCost = 0;
    let totalQty = 0;

    for (const e of enrichedEntries) {
      totalInvested += e.amountSpent;
      totalQtyWeightedCost += e.priceAtPurchase * e.qty;
      totalQty += e.qty;
      if (e.currentValue !== null) {
        totalCurrentValue += e.currentValue;
        hasPrice = true;
      }
    }

    const avgBuyPrice = totalQty > 0 ? totalQtyWeightedCost / totalQty : 0;
    const totalPnl = hasPrice ? totalCurrentValue - totalInvested : null;

    return { totalInvested, totalCurrentValue: hasPrice ? totalCurrentValue : null, totalPnl, avgBuyPrice };
  }, [enrichedEntries]);

  // ---- Render ----
  const inputClasses = `${st.inputBg} rounded-lg px-3 py-2 text-xs outline-none focus:border-white/[0.2] transition-colors`;

  return (
    <div className="space-y-3">
      {/* ---- Summary Row ---- */}
      {entries.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className={`${st.subtleBg} rounded-xl p-3 text-center`}>
            <p className={`text-[10px] uppercase tracking-wider ${st.textDim} font-medium mb-1`}>
              Total Invested
            </p>
            <p className={`text-sm font-bold ${st.textPrimary} tabular-nums`}>
              {formatUsd(summary.totalInvested)}
            </p>
          </div>
          <div className={`${st.subtleBg} rounded-xl p-3 text-center`}>
            <p className={`text-[10px] uppercase tracking-wider ${st.textDim} font-medium mb-1`}>
              Current Value
            </p>
            <p className="text-sm font-bold tabular-nums" style={{ color: themeColors.primary }}>
              {summary.totalCurrentValue !== null ? formatUsd(summary.totalCurrentValue) : '---'}
            </p>
          </div>
          <div className={`${st.subtleBg} rounded-xl p-3 text-center`}>
            <p className={`text-[10px] uppercase tracking-wider ${st.textDim} font-medium mb-1`}>
              Total P&L
            </p>
            <p
              className="text-sm font-bold tabular-nums"
              style={{
                color: summary.totalPnl === null ? undefined : summary.totalPnl >= 0 ? '#34d399' : '#ef4444',
              }}
            >
              {summary.totalPnl !== null ? formatPnl(summary.totalPnl) : '---'}
            </p>
          </div>
          <div className={`${st.subtleBg} rounded-xl p-3 text-center`}>
            <p className={`text-[10px] uppercase tracking-wider ${st.textDim} font-medium mb-1`}>
              Avg Buy Price
            </p>
            <p className={`text-sm font-bold ${st.textPrimary} tabular-nums`}>
              {summary.avgBuyPrice > 0 ? formatUsd(summary.avgBuyPrice) : '---'}
            </p>
          </div>
        </div>
      )}

      {/* ---- Purchase History Table ---- */}
      {enrichedEntries.length > 0 && (
        <div className="overflow-x-auto">
          <table className={`w-full ${density.text}`}>
            <thead>
              <tr className={`${st.textDim} text-xs uppercase border-b ${st.subtleBorder}`}>
                <th className={`text-left ${density.py} ${density.px}`}>Date</th>
                <th className={`text-left ${density.py} ${density.px}`}>Coin</th>
                <th className={`text-right ${density.py} ${density.px}`}>Spent</th>
                <th className={`text-right ${density.py} ${density.px}`}>Price</th>
                <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>Qty</th>
                <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>Value</th>
                <th className={`text-right ${density.py} ${density.px}`}>P&L</th>
                <th className={`text-center ${density.py} px-2`} style={{ width: 36 }} />
              </tr>
            </thead>
            <tbody>
              {enrichedEntries.map((entry) => (
                <tr
                  key={entry.id}
                  className={`border-b ${st.divider} hover:${st.subtleBg} transition-colors`}
                >
                  <td className={`${density.py} ${density.px} ${st.textSecondary} tabular-nums`}>
                    {entry.date}
                  </td>
                  <td className={`${density.py} ${density.px} ${st.textPrimary} font-medium`}>
                    {entry.coinName}
                  </td>
                  <td className={`${density.py} ${density.px} text-right ${st.textSecondary} tabular-nums`}>
                    {formatUsd(entry.amountSpent)}
                  </td>
                  <td className={`${density.py} ${density.px} text-right ${st.textMuted} tabular-nums`}>
                    {formatUsd(entry.priceAtPurchase)}
                  </td>
                  <td className={`${density.py} ${density.px} text-right ${st.textMuted} tabular-nums hidden md:table-cell`}>
                    {entry.qty.toFixed(6)}
                  </td>
                  <td className={`${density.py} ${density.px} text-right tabular-nums hidden md:table-cell`} style={{ color: themeColors.primary }}>
                    {entry.currentValue !== null ? formatUsd(entry.currentValue) : '---'}
                  </td>
                  <td
                    className={`${density.py} ${density.px} text-right font-medium tabular-nums`}
                    style={{
                      color: entry.pnl === null ? undefined : entry.pnl >= 0 ? '#34d399' : '#ef4444',
                    }}
                  >
                    {entry.pnl !== null ? formatPnl(entry.pnl) : '---'}
                  </td>
                  <td className={`${density.py} px-2 text-center`}>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1 rounded-md hover:bg-red-400/10 transition-colors group"
                      aria-label={`Delete ${entry.coinName} purchase`}
                      title="Delete"
                    >
                      <Trash2 className={`w-3.5 h-3.5 ${st.textDim} group-hover:text-red-400 transition-colors`} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ---- Empty state ---- */}
      {entries.length === 0 && !showForm && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${themeColors.primary}10` }}
          >
            <Plus className="w-6 h-6" style={{ color: themeColors.primary }} />
          </div>
          <p className={`${st.textMuted} text-sm font-medium mb-1`}>No DCA purchases logged</p>
          <p className={`${st.textDim} text-xs max-w-[240px] mb-4`}>
            Track your recurring crypto buys to monitor performance and average cost over time.
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
            Log Purchase
          </button>
        </div>
      )}

      {/* ---- Add Purchase Form (collapsible) ---- */}
      {entries.length > 0 && !showForm && (
        <button
          onClick={() => setShowForm(true)}
          className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium ${st.textDim} hover:${st.textPrimary} ${st.subtleBg} hover:bg-white/[0.06] border ${st.subtleBorder} transition-all`}
        >
          <Plus className="w-3.5 h-3.5" />
          Log Purchase
          <ChevronDown className="w-3 h-3 ml-1" />
        </button>
      )}

      {showForm && (
        <div className={`rounded-lg border ${st.subtleBorder} ${st.subtleBg} p-3 space-y-3`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold ${st.textSecondary} uppercase tracking-wider`}>
              New Purchase
            </p>
            <button
              onClick={() => setShowForm(false)}
              className={`p-1 rounded-md hover:bg-white/[0.06] transition-colors ${st.textDim}`}
              aria-label="Close form"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Date */}
            <div>
              <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                Date
              </label>
              <input
                type="date"
                value={formDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setFormDate(e.target.value)}
                className={inputClasses + ' w-full'}
              />
            </div>

            {/* Coin */}
            <div>
              <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                Coin ID
              </label>
              <input
                type="text"
                value={formCoin}
                onChange={(e) => setFormCoin(e.target.value)}
                placeholder="bitcoin"
                className={inputClasses + ' w-full'}
              />
            </div>

            {/* Amount */}
            <div>
              <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                Amount Spent ($)
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={formAmount}
                onChange={(e) => setFormAmount(e.target.value)}
                placeholder="100"
                className={inputClasses + ' w-full tabular-nums'}
              />
            </div>

            {/* Price */}
            <div>
              <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                Price at Purchase ($)
              </label>
              <input
                type="number"
                min={0}
                step="any"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="45000"
                className={inputClasses + ' w-full tabular-nums'}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={!formDate || !formCoin || !formAmount || !formPrice}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: formDate && formCoin && formAmount && formPrice ? `${themeColors.primary}20` : undefined,
                color: formDate && formCoin && formAmount && formPrice ? themeColors.primary : undefined,
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Log Purchase
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setFormAmount('');
                setFormPrice('');
              }}
              className={`px-3 py-2 rounded-lg text-xs font-medium ${st.textDim} hover:${st.textPrimary} ${st.subtleBg} hover:bg-white/[0.06] transition-colors`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
