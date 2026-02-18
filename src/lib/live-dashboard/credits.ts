'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { useEffect } from 'react';

// ---------------------------------------------------------------------------
// Credit costs — Dune-style pay-per-action, no subscription required
// ---------------------------------------------------------------------------
export const CREDIT_COSTS = {
  // Dashboard access
  pro_dashboard_view: 0,      // All dashboards are free to view

  // Exports
  export_png: 2,
  export_pdf: 3,
  export_excel: 5,
  export_csv: 3,

  // AI features
  ai_chat_query: 1,
  ai_dashboard_build: 3,

  // Premium features
  bulk_export: 10,
  hd_export: 2,               // Extra for 2x resolution
  no_watermark: 1,             // Extra per export to remove watermark
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

// ---------------------------------------------------------------------------
// Credit packages — one-time purchase, no subscription
// ---------------------------------------------------------------------------
export const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter', credits: 100, price: 4.99, perCredit: '$0.05', popular: false, savings: null },
  { id: 'builder', name: 'Builder', credits: 500, price: 19.99, perCredit: '$0.04', popular: true, savings: '20% off' },
  { id: 'power', name: 'Power', credits: 1500, price: 49.99, perCredit: '$0.033', popular: false, savings: '33% off' },
  { id: 'whale', name: 'Whale', credits: 5000, price: 129.99, perCredit: '$0.026', popular: false, savings: '48% off' },
] as const;

export type CreditPackageId = typeof CREDIT_PACKAGES[number]['id'];

// ---------------------------------------------------------------------------
// Transaction type
// ---------------------------------------------------------------------------
export interface CreditTransaction {
  id: string;
  amount: number;         // positive = credit, negative = debit
  action: CreditAction | 'purchase' | 'bonus' | 'refund';
  description: string;
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Credit store
// ---------------------------------------------------------------------------
interface CreditStore {
  balance: number;
  transactions: CreditTransaction[];
  totalPurchased: number;
  totalUsed: number;

  // For authenticated users — sync with server
  userId: string | null;
  setUserId: (id: string | null) => void;

  // Actions
  addCredits: (amount: number, action: 'purchase' | 'bonus' | 'refund', description: string) => void;
  useCredits: (action: CreditAction, description?: string) => boolean;  // returns false if insufficient
  canAfford: (action: CreditAction) => boolean;
  getCost: (action: CreditAction) => number;

  // Sync
  syncFromServer: (balance: number, transactions: CreditTransaction[]) => void;
  resetCredits: () => void;
}

export const useCreditStore = create<CreditStore>()(
  persist(
    (set, get) => ({
      balance: 0,
      transactions: [],
      totalPurchased: 0,
      totalUsed: 0,
      userId: null,

      setUserId: (id) => set({ userId: id }),

      addCredits: (amount, action, description) => {
        const transaction: CreditTransaction = {
          id: crypto.randomUUID(),
          amount,
          action,
          description,
          timestamp: Date.now(),
        };
        set((state) => ({
          balance: state.balance + amount,
          totalPurchased: state.totalPurchased + amount,
          transactions: [transaction, ...state.transactions],
        }));
      },

      useCredits: (action, description) => {
        const cost = CREDIT_COSTS[action];
        const { balance } = get();

        // Free actions always succeed
        if (cost === 0) return true;

        // Insufficient balance
        if (balance < cost) return false;

        const transaction: CreditTransaction = {
          id: crypto.randomUUID(),
          amount: -cost,
          action,
          description: description || `Used ${cost} credit${cost !== 1 ? 's' : ''} for ${action}`,
          timestamp: Date.now(),
        };

        set((state) => ({
          balance: state.balance - cost,
          totalUsed: state.totalUsed + cost,
          transactions: [transaction, ...state.transactions],
        }));

        return true;
      },

      canAfford: (action) => {
        const cost = CREDIT_COSTS[action];
        if (cost === 0) return true;
        return get().balance >= cost;
      },

      getCost: (action) => CREDIT_COSTS[action],

      syncFromServer: (balance, transactions) => {
        const totalPurchased = transactions
          .filter((t) => t.amount > 0)
          .reduce((sum, t) => sum + t.amount, 0);
        const totalUsed = transactions
          .filter((t) => t.amount < 0)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);

        set({ balance, transactions, totalPurchased, totalUsed });
      },

      resetCredits: () =>
        set({
          balance: 0,
          transactions: [],
          totalPurchased: 0,
          totalUsed: 0,
          userId: null,
        }),
    }),
    {
      name: 'crk-dashboard-credits',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            },
      ),
    },
  ),
);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Human-readable cost string for a credit action */
export function formatCreditCost(action: CreditAction): string {
  const cost = CREDIT_COSTS[action];
  if (cost === 0) return 'Free';
  return `${cost} credit${cost !== 1 ? 's' : ''}`;
}

// ---------------------------------------------------------------------------
// Initialization hook — gives new users 25 free credits on first visit
// ---------------------------------------------------------------------------
const INIT_FLAG = 'crk-credits-initialized';

export function useInitCredits() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem(INIT_FLAG)) return;

    // Use getState() to avoid subscribing to the store and prevent re-render loops
    useCreditStore.getState().addCredits(25, 'bonus', 'Welcome bonus — 25 free credits');
    localStorage.setItem(INIT_FLAG, '1');
  }, []);
}
