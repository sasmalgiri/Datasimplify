'use client';

import { useState, useEffect } from 'react';
import { X, Zap, Check, Coins, Crown } from 'lucide-react';
import { useCreditStore, CREDIT_PACKAGES, CREDIT_COSTS, formatCreditCost, type CreditAction } from '@/lib/live-dashboard/credits';
import { IS_BETA_MODE } from '@/lib/betaMode';

/* ------------------------------------------------------------------ */
/*  CreditBalancePill                                                  */
/*  Compact toolbar pill: shows current credit balance, opens modal    */
/* ------------------------------------------------------------------ */

export function CreditBalancePill() {
  if (IS_BETA_MODE) return null;
  const balance = useCreditStore((s) => s.balance);
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Hydration guard: avoid SSR/client mismatch with persisted Zustand store
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return null;

  const isEmpty = balance <= 0;

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-medium transition border ${
          isEmpty
            ? 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
        }`}
        title="Dashboard Credits"
      >
        <Zap className="w-3 h-3" />
        {balance}
      </button>

      {modalOpen && <BuyCreditsModal isOpen onClose={() => setModalOpen(false)} />}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  BuyCreditsModal                                                    */
/*  Full-screen overlay modal for purchasing credit packages           */
/* ------------------------------------------------------------------ */

interface BuyCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BuyCreditsModal({ isOpen, onClose }: BuyCreditsModalProps) {
  const balance = useCreditStore((s) => s.balance);
  const addCredits = useCreditStore((s) => s.addCredits);
  const [purchasedPkg, setPurchasedPkg] = useState<string | null>(null);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onClose]);

  // Auto-close after successful purchase
  useEffect(() => {
    if (!purchasedPkg) return;
    const timer = setTimeout(() => {
      setPurchasedPkg(null);
      onClose();
    }, 1500);
    return () => clearTimeout(timer);
  }, [purchasedPkg, onClose]);

  if (!isOpen) return null;

  const handleBuy = (pkg: typeof CREDIT_PACKAGES[number]) => {
    addCredits(pkg.credits, 'purchase', `Purchased ${pkg.name} package`);
    setPurchasedPkg(pkg.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal content */}
      <div className="relative w-full max-w-[520px] max-h-[90vh] overflow-y-auto bg-[#0a0a0f] border border-white/[0.1] rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06] sticky top-0 bg-[#0a0a0f] z-10">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Coins className="w-5 h-5 text-amber-400" />
            Get Credits
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-white transition p-1 rounded-lg hover:bg-white/[0.06]"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Current balance — hero */}
          <div className="text-center py-3">
            <div className={`text-4xl font-bold ${balance > 0 ? 'text-amber-400' : 'text-red-400'}`}>
              {balance}
            </div>
            <div className="text-sm text-gray-500 mt-1">credits remaining</div>
            {balance > 0 && (
              <div className="text-[11px] text-amber-500/60 mt-2">
                You started with 25 free credits!
              </div>
            )}
          </div>

          {/* Success banner */}
          {purchasedPkg && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 text-sm font-medium animate-pulse">
              <Check className="w-4 h-4" />
              Credits added successfully!
            </div>
          )}

          {/* Credit packages grid */}
          <div className="grid grid-cols-2 gap-3">
            {CREDIT_PACKAGES.map((pkg) => {
              const isPopular = pkg.popular;
              const justBought = purchasedPkg === pkg.id;

              return (
                <div
                  key={pkg.id}
                  className={`relative rounded-xl border p-4 transition ${
                    isPopular
                      ? 'bg-amber-500/[0.06] border-amber-500/30 ring-1 ring-amber-500/20'
                      : 'bg-gray-900/60 border-white/[0.08] hover:border-white/[0.15]'
                  }`}
                >
                  {/* Popular badge */}
                  {isPopular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-amber-500 text-[9px] font-bold text-black tracking-wide uppercase whitespace-nowrap">
                      Most Popular
                    </div>
                  )}

                  {/* Savings badge */}
                  {pkg.savings && (
                    <div className="absolute -top-2 right-2 px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-[9px] font-medium text-emerald-400">
                      {pkg.savings}
                    </div>
                  )}

                  <div className="text-xs text-gray-400 font-medium mb-1">{pkg.name}</div>
                  <div className="text-2xl font-bold text-white">{pkg.credits}</div>
                  <div className="text-[10px] text-gray-600 mb-1">credits</div>

                  <div className="flex items-baseline gap-1 mb-1">
                    <span className="text-sm font-semibold text-white">${pkg.price}</span>
                    {pkg.perCredit && (
                      <span className="text-[10px] text-gray-500">({pkg.perCredit}/ea)</span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleBuy(pkg)}
                    disabled={!!purchasedPkg}
                    className={`w-full mt-3 px-3 py-2 rounded-lg text-xs font-semibold transition ${
                      justBought
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isPopular
                          ? 'bg-amber-500 hover:bg-amber-400 text-black'
                          : 'bg-white/[0.06] hover:bg-white/[0.1] text-white border border-white/[0.1]'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {justBought ? (
                      <span className="flex items-center justify-center gap-1">
                        <Check className="w-3 h-3" /> Added!
                      </span>
                    ) : (
                      'Buy'
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {/* What credits buy */}
          <div>
            <div className="text-xs font-medium text-gray-400 mb-3">What credits buy</div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(CREDIT_COSTS).map(([action, cost]) => (
                <div
                  key={action}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-gray-900/60 border border-white/[0.06]"
                >
                  <span className="text-[11px] text-gray-400">
                    {formatCreditCost(action as CreditAction)}
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-medium text-amber-400">
                    <Zap className="w-3 h-3" />
                    {cost}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center text-[11px] text-gray-600 pt-2 border-t border-white/[0.06]">
            Credits never expire. One-time purchase, no subscription.
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CreditCostBadge                                                    */
/*  Small inline badge showing the credit cost of an action            */
/* ------------------------------------------------------------------ */

interface CreditCostBadgeProps {
  action: CreditAction;
  className?: string;
}

export function CreditCostBadge({ action, className = '' }: CreditCostBadgeProps) {
  const cost = CREDIT_COSTS[action];

  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium ${className}`}
      title={`${formatCreditCost(action)}: ${cost} credits`}
    >
      <Zap className="w-2.5 h-2.5" />
      {cost}
    </span>
  );
}
