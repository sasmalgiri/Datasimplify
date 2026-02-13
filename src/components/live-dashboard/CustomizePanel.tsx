'use client';

import { useState } from 'react';
import { Settings, X, RotateCcw } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import type { DashboardCustomization } from '@/lib/live-dashboard/store';

const POPULAR_COINS = [
  { id: '', label: 'Default (from dashboard)' },
  { id: 'bitcoin', label: 'Bitcoin (BTC)' },
  { id: 'ethereum', label: 'Ethereum (ETH)' },
  { id: 'solana', label: 'Solana (SOL)' },
  { id: 'binancecoin', label: 'BNB' },
  { id: 'ripple', label: 'XRP' },
  { id: 'cardano', label: 'Cardano (ADA)' },
  { id: 'dogecoin', label: 'Dogecoin (DOGE)' },
  { id: 'avalanche-2', label: 'Avalanche (AVAX)' },
  { id: 'polkadot', label: 'Polkadot (DOT)' },
  { id: 'chainlink', label: 'Chainlink (LINK)' },
  { id: 'tron', label: 'Tron (TRX)' },
  { id: 'polygon-ecosystem-token', label: 'Polygon (POL)' },
  { id: 'litecoin', label: 'Litecoin (LTC)' },
  { id: 'uniswap', label: 'Uniswap (UNI)' },
  { id: 'near', label: 'NEAR Protocol' },
  { id: 'aptos', label: 'Aptos (APT)' },
  { id: 'sui', label: 'Sui (SUI)' },
  { id: 'arbitrum', label: 'Arbitrum (ARB)' },
  { id: 'optimism', label: 'Optimism (OP)' },
];

const TIMEFRAME_OPTIONS = [
  { days: 0, label: 'Default' },
  { days: 7, label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
  { days: 90, label: '90 days' },
  { days: 180, label: '180 days' },
  { days: 365, label: '1 year' },
];

interface CustomizePanelProps {
  onApply: () => void;
}

export function CustomizePanel({ onApply }: CustomizePanelProps) {
  const { customization, setCustomization, resetCustomization } = useLiveDashboardStore();
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState<DashboardCustomization>(customization);

  const handleOpen = () => {
    setLocal(customization);
    setOpen(true);
  };

  const handleApply = () => {
    setCustomization(local);
    setOpen(false);
    onApply();
  };

  const handleReset = () => {
    resetCustomization();
    setLocal({ coinId: '', coinIds: [], days: 0 });
    setOpen(false);
    onApply();
  };

  const toggleCoinId = (id: string) => {
    setLocal((prev) => {
      const next = prev.coinIds.includes(id)
        ? prev.coinIds.filter((c) => c !== id)
        : prev.coinIds.length < 5
          ? [...prev.coinIds, id]
          : prev.coinIds;
      return { ...prev, coinIds: next };
    });
  };

  const hasCustomization =
    customization.coinId !== '' || customization.coinIds.length > 0 || customization.days !== 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className={`p-2 rounded-xl transition border ${
          hasCustomization
            ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
            : 'bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white border-white/[0.06]'
        }`}
        title="Customize dashboard"
      >
        <Settings className="w-4 h-4" />
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="absolute right-0 top-full mt-2 z-50 w-[340px] bg-[#0f0f18] border border-white/[0.1] rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-emerald-400" />
                Customize Dashboard
              </h3>
              <button type="button" onClick={() => setOpen(false)} className="text-gray-500 hover:text-white transition">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-5 max-h-[400px] overflow-y-auto">
              {/* Primary Coin */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-2 font-medium">
                  Primary Coin (Charts)
                </label>
                <select
                  value={local.coinId}
                  onChange={(e) => setLocal({ ...local, coinId: e.target.value })}
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl px-3 py-2.5 text-sm text-white focus:border-emerald-400/40 focus:outline-none transition"
                >
                  {POPULAR_COINS.map((c) => (
                    <option key={c.id} value={c.id} className="bg-gray-900">
                      {c.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Timeframe */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-2 font-medium">
                  Timeframe
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {TIMEFRAME_OPTIONS.map((t) => (
                    <button
                      key={t.days}
                      type="button"
                      onClick={() => setLocal({ ...local, days: t.days })}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition ${
                        local.days === t.days
                          ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                          : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comparison Coins */}
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-gray-500 mb-2 font-medium">
                  Comparison Coins ({local.coinIds.length}/5)
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_COINS.filter((c) => c.id !== '').map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggleCoinId(c.id)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                        local.coinIds.includes(c.id)
                          ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                          : 'bg-white/[0.04] text-gray-500 border border-white/[0.06] hover:text-gray-300'
                      }`}
                    >
                      {c.label.split(' (')[0]}
                    </button>
                  ))}
                </div>
                {local.coinIds.length === 0 && (
                  <p className="text-[10px] text-gray-600 mt-1.5">Using dashboard defaults</p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 px-5 py-4 border-t border-white/[0.06]">
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.08] transition"
              >
                <RotateCcw className="w-3 h-3" />
                Reset
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="flex-1 px-4 py-2 rounded-lg text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white transition"
              >
                Apply & Refresh
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
