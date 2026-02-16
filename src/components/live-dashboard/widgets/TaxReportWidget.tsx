'use client';

import { useState, useEffect, useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { useUserPrefsStore } from '@/lib/live-dashboard/user-prefs-store';
import { getSiteThemeClasses, getThemeColors, formatCompact } from '@/lib/live-dashboard/theme';
import {
  type TaxTrade,
  type CostBasisMethod,
  calculateTaxSummary,
  generateForm8949CSV,
  downloadCSV,
} from '@/lib/live-dashboard/tax-calculator';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  Lock,
  FileSpreadsheet,
  Receipt,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

/* ---------- helpers ---------- */

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function formatUSD(n: number): string {
  const sign = n < 0 ? '-' : '';
  const abs = Math.abs(n);
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  return `${sign}$${abs.toFixed(2)}`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/* ---------- component ---------- */

export function TaxReportWidget() {
  const { customization, siteTheme, keyType } = useLiveDashboardStore((s) => ({
    customization: s.customization,
    siteTheme: s.siteTheme,
    keyType: s.keyType,
  }));
  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(customization.colorTheme);

  const isPro = keyType === 'pro';

  // ─── Trade State (localStorage-persisted) ───
  const [trades, setTrades] = useState<TaxTrade[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      return JSON.parse(localStorage.getItem('crk-tax-trades') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('crk-tax-trades', JSON.stringify(trades));
  }, [trades]);

  // ─── UI State ───
  const [showForm, setShowForm] = useState(false);
  const [costBasisMethod, setCostBasisMethod] = useState<CostBasisMethod>('fifo');

  // ─── Form State ───
  const [formCoin, setFormCoin] = useState('');
  const [formType, setFormType] = useState<'buy' | 'sell'>('buy');
  const [formDate, setFormDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [formQuantity, setFormQuantity] = useState('');
  const [formPrice, setFormPrice] = useState('');

  // ─── Tax Summary (memoized) ───
  const summary = useMemo(() => {
    if (trades.length === 0) return null;
    return calculateTaxSummary(trades, costBasisMethod);
  }, [trades, costBasisMethod]);

  // ─── Handlers ───
  const handleAddTrade = () => {
    const qty = parseFloat(formQuantity);
    const price = parseFloat(formPrice);
    if (!formCoin.trim() || isNaN(qty) || qty <= 0 || isNaN(price) || price <= 0) return;

    const coinId = formCoin.trim().toLowerCase().replace(/\s+/g, '-');
    const trade: TaxTrade = {
      id: generateId(),
      coinId,
      coinName: formCoin.trim(),
      type: formType,
      date: formDate,
      quantity: qty,
      pricePerUnit: price,
      totalValue: qty * price,
    };

    setTrades((prev) => [...prev, trade]);

    // Reset form
    setFormCoin('');
    setFormQuantity('');
    setFormPrice('');
    setFormType('buy');
    setFormDate(new Date().toISOString().split('T')[0]);
    setShowForm(false);
  };

  const handleDeleteTrade = (id: string) => {
    setTrades((prev) => prev.filter((t) => t.id !== id));
  };

  const handleExport = () => {
    if (!summary) return;
    const csv = generateForm8949CSV(summary);
    const filename = `form-8949-${costBasisMethod}-${new Date().toISOString().split('T')[0]}.csv`;
    downloadCSV(csv, filename);
  };

  // Sort trades by date descending for display
  const sortedTrades = useMemo(
    () => [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [trades],
  );

  const hasSells = trades.some((t) => t.type === 'sell');

  return (
    <div className="space-y-4">
      {/* ═══ Add Trade Form (Collapsible) ═══ */}
      <div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${st.buttonSecondary}`}
        >
          <span className="flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" />
            Add Trade
          </span>
          {showForm ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>

        {showForm && (
          <div className={`mt-2 rounded-lg border p-3 space-y-3 ${st.subtleBorder} ${st.subtleBg}`}>
            {/* Coin Input */}
            <div>
              <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                Coin Name
              </label>
              <input
                type="text"
                value={formCoin}
                onChange={(e) => setFormCoin(e.target.value)}
                placeholder="e.g. Bitcoin, Ethereum..."
                className={`w-full rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-400/40 transition-colors ${st.inputBg}`}
              />
            </div>

            {/* Buy / Sell Toggle */}
            <div>
              <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                Type
              </label>
              <div className={`flex rounded-lg overflow-hidden border ${st.subtleBorder}`}>
                <button
                  onClick={() => setFormType('buy')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                    formType === 'buy'
                      ? 'bg-emerald-400/15 text-emerald-400'
                      : `bg-transparent ${st.textMuted} hover:${st.textSecondary}`
                  }`}
                >
                  <TrendingUp className="w-3 h-3" />
                  Buy
                </button>
                <button
                  onClick={() => setFormType('sell')}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                    formType === 'sell'
                      ? 'bg-red-400/15 text-red-400'
                      : `bg-transparent ${st.textMuted} hover:${st.textSecondary}`
                  }`}
                >
                  <TrendingDown className="w-3 h-3" />
                  Sell
                </button>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                Date
              </label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className={`w-full rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-400/40 transition-colors ${st.inputBg}`}
              />
            </div>

            {/* Quantity & Price side by side */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                  Quantity
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formQuantity}
                  onChange={(e) => setFormQuantity(e.target.value)}
                  placeholder="0.5"
                  className={`w-full rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-400/40 transition-colors tabular-nums ${st.inputBg}`}
                />
              </div>
              <div>
                <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                  Price per Unit (USD)
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={formPrice}
                  onChange={(e) => setFormPrice(e.target.value)}
                  placeholder="50000"
                  className={`w-full rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-emerald-400/40 transition-colors tabular-nums ${st.inputBg}`}
                />
              </div>
            </div>

            {/* Preview total */}
            {formQuantity && formPrice && (
              <div className={`text-[10px] ${st.textDim}`}>
                Total: {formatUSD(parseFloat(formQuantity || '0') * parseFloat(formPrice || '0'))}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleAddTrade}
                disabled={!formCoin.trim() || !formQuantity || !formPrice}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${st.buttonPrimary}`}
              >
                <Plus className="w-3.5 h-3.5" />
                Add Trade
              </button>
              <button
                onClick={() => setShowForm(false)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-colors ${st.buttonSecondary}`}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ═══ Trades Table ═══ */}
      {sortedTrades.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={`${st.textDim} text-[10px] uppercase tracking-wider border-b ${st.subtleBorder}`}>
                <th className="text-left py-2 px-2">Date</th>
                <th className="text-left py-2 px-2">Type</th>
                <th className="text-left py-2 px-2">Coin</th>
                <th className="text-right py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Price</th>
                <th className="text-right py-2 px-2">Total</th>
                <th className="text-center py-2 px-1" style={{ width: 32 }} />
              </tr>
            </thead>
            <tbody>
              {sortedTrades.map((trade) => (
                <tr
                  key={trade.id}
                  className={`border-b ${st.divider} hover:bg-white/[0.02] transition-colors`}
                >
                  <td className={`py-2 px-2 ${st.textSecondary} tabular-nums`}>
                    {formatDate(trade.date)}
                  </td>
                  <td className="py-2 px-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        trade.type === 'buy'
                          ? 'bg-emerald-400/10 text-emerald-400'
                          : 'bg-red-400/10 text-red-400'
                      }`}
                    >
                      {trade.type}
                    </span>
                  </td>
                  <td className={`py-2 px-2 font-medium ${st.textPrimary}`}>
                    {trade.coinName}
                  </td>
                  <td className={`py-2 px-2 text-right tabular-nums ${st.textSecondary}`}>
                    {trade.quantity.toLocaleString(undefined, { maximumFractionDigits: 8 })}
                  </td>
                  <td className={`py-2 px-2 text-right tabular-nums ${st.textSecondary}`}>
                    {formatUSD(trade.pricePerUnit)}
                  </td>
                  <td className={`py-2 px-2 text-right tabular-nums font-medium ${st.textPrimary}`}>
                    {formatUSD(trade.totalValue)}
                  </td>
                  <td className="py-2 px-1 text-center">
                    <button
                      onClick={() => handleDeleteTrade(trade.id)}
                      className="p-1 rounded-md hover:bg-red-400/10 transition-colors group"
                      aria-label={`Delete ${trade.coinName} ${trade.type} trade`}
                      title="Delete trade"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 transition-colors" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className={`text-[10px] ${st.textFaint} mt-1.5 px-2`}>
            {trades.length} trade{trades.length !== 1 ? 's' : ''} total
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
          >
            <Receipt className="w-6 h-6 text-gray-500" />
          </div>
          <p className={`text-sm font-medium mb-1 ${st.textMuted}`}>No trades yet</p>
          <p className={`text-xs max-w-[240px] ${st.textDim}`}>
            Add your buy and sell trades to calculate capital gains and generate tax reports.
          </p>
        </div>
      )}

      {/* ═══ Tax Summary Section ═══ */}
      {trades.length > 0 && (
        <div className="space-y-3">
          {/* Divider */}
          <div className={`border-t ${st.divider}`} />

          {/* Cost Basis Method Selector */}
          <div>
            <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-2 block`}>
              Cost Basis Method
            </label>
            <div className="flex gap-1.5">
              {(['fifo', 'lifo', 'avg'] as CostBasisMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setCostBasisMethod(m)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    costBasisMethod === m ? st.chipActive : st.chipInactive
                  }`}
                >
                  {m.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Summary Cards */}
          {summary && hasSells ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <SummaryCard
                label="Total Proceeds"
                value={formatUSD(summary.totalProceeds)}
                st={st}
              />
              <SummaryCard
                label="Total Cost Basis"
                value={formatUSD(summary.totalCostBasis)}
                st={st}
              />
              <SummaryCard
                label="Net Gain / Loss"
                value={formatUSD(summary.totalGain)}
                valueColor={summary.totalGain >= 0 ? 'text-emerald-400' : 'text-red-400'}
                st={st}
              />
              <SummaryCard
                label="Short-term Gains"
                value={formatUSD(summary.shortTermGain)}
                valueColor={summary.shortTermGain >= 0 ? 'text-emerald-400' : 'text-red-400'}
                st={st}
              />
              <SummaryCard
                label="Long-term Gains"
                value={formatUSD(summary.longTermGain)}
                valueColor={summary.longTermGain >= 0 ? 'text-emerald-400' : 'text-red-400'}
                st={st}
              />
              <SummaryCard
                label="Dispositions"
                value={String(summary.realizedGains.length)}
                st={st}
              />
            </div>
          ) : (
            <div className={`text-xs ${st.textDim} text-center py-4`}>
              {!hasSells
                ? 'Add sell trades to see your tax summary.'
                : 'No realized gains to show.'}
            </div>
          )}

          {/* ═══ Export Button ═══ */}
          <div className="relative">
            <button
              onClick={isPro ? handleExport : undefined}
              disabled={!summary || !hasSells}
              className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                isPro
                  ? st.buttonPrimary
                  : `${st.buttonSecondary} cursor-not-allowed opacity-70`
              }`}
            >
              {isPro ? (
                <>
                  <FileSpreadsheet className="w-4 h-4" />
                  Export Form 8949 CSV
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5" />
                  Export Form 8949 CSV
                  <span className="ml-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-amber-400/15 text-amber-400 border border-amber-400/20">
                    Pro
                  </span>
                </>
              )}
            </button>
            {!isPro && (
              <p className={`text-[10px] ${st.textFaint} text-center mt-1.5`}>
                Upgrade to a Pro API key to export tax reports.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- Summary Card sub-component ---------- */

function SummaryCard({
  label,
  value,
  valueColor,
  st,
}: {
  label: string;
  value: string;
  valueColor?: string;
  st: ReturnType<typeof getSiteThemeClasses>;
}) {
  return (
    <div className={`rounded-lg p-3 ${st.subtleBg} border ${st.subtleBorder}`}>
      <p className={`text-[10px] uppercase tracking-wider mb-1 ${st.textDim}`}>{label}</p>
      <p className={`text-sm font-bold tabular-nums ${valueColor ?? st.textPrimary}`}>{value}</p>
    </div>
  );
}
