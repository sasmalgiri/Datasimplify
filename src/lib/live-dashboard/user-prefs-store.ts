'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface PriceAlert {
  id: string;
  coinId: string;
  coinName: string;
  condition: 'above' | 'below';
  threshold: number;
  enabled: boolean;
  triggered: boolean;
  createdAt: number;
}

interface UserPrefsStore {
  // Watchlist
  watchlist: string[];
  toggleWatchlist: (coinId: string) => void;
  isInWatchlist: (coinId: string) => boolean;

  // Price Alerts
  priceAlerts: PriceAlert[];
  addPriceAlert: (alert: Omit<PriceAlert, 'id' | 'triggered' | 'createdAt'>) => void;
  removePriceAlert: (id: string) => void;
  togglePriceAlert: (id: string) => void;
  markAlertTriggered: (id: string) => void;
  resetAlertTriggered: (id: string) => void;

  // Recently Viewed Coins
  recentCoins: string[];
  addRecentCoin: (coinId: string) => void;
}

export const useUserPrefsStore = create<UserPrefsStore>()(
  persist(
    (set, get) => ({
      // Watchlist
      watchlist: [],
      toggleWatchlist: (coinId) =>
        set((state) => ({
          watchlist: state.watchlist.includes(coinId)
            ? state.watchlist.filter((id) => id !== coinId)
            : [...state.watchlist, coinId],
        })),
      isInWatchlist: (coinId) => get().watchlist.includes(coinId),

      // Price Alerts
      priceAlerts: [],
      addPriceAlert: (alert) =>
        set((state) => ({
          priceAlerts: [
            ...state.priceAlerts,
            { ...alert, id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, triggered: false, createdAt: Date.now() },
          ],
        })),
      removePriceAlert: (id) =>
        set((state) => ({ priceAlerts: state.priceAlerts.filter((a) => a.id !== id) })),
      togglePriceAlert: (id) =>
        set((state) => ({
          priceAlerts: state.priceAlerts.map((a) =>
            a.id === id ? { ...a, enabled: !a.enabled } : a,
          ),
        })),
      markAlertTriggered: (id) =>
        set((state) => ({
          priceAlerts: state.priceAlerts.map((a) =>
            a.id === id ? { ...a, triggered: true, enabled: false } : a,
          ),
        })),
      resetAlertTriggered: (id) =>
        set((state) => ({
          priceAlerts: state.priceAlerts.map((a) =>
            a.id === id ? { ...a, triggered: false, enabled: true } : a,
          ),
        })),

      // Recently Viewed Coins
      recentCoins: [],
      addRecentCoin: (coinId) =>
        set((state) => ({
          recentCoins: [coinId, ...state.recentCoins.filter((id) => id !== coinId)].slice(0, 10),
        })),
    }),
    {
      name: 'crk-user-prefs',
      storage: createJSONStorage(() =>
        typeof window !== 'undefined'
          ? localStorage
          : { getItem: () => null, setItem: () => {}, removeItem: () => {} },
      ),
    },
  ),
);
