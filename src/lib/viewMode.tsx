'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ViewMode = 'simple' | 'pro';

interface ViewModeContextType {
  mode: ViewMode;
  setMode: (mode: ViewMode) => void;
  isSimple: boolean;
  isPro: boolean;
  toggleMode: () => void;
}

const ViewModeContext = createContext<ViewModeContextType | undefined>(undefined);

const STORAGE_KEY = 'crk_view_mode';

export function ViewModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ViewMode>('simple');
  const [mounted, setMounted] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'pro' || stored === 'simple') {
      setModeState(stored);
    }
  }, []);

  const setMode = (newMode: ViewMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  };

  const toggleMode = () => {
    const newMode = mode === 'simple' ? 'pro' : 'simple';
    setMode(newMode);
  };

  // Prevent hydration mismatch by not rendering mode-dependent content until mounted
  const value: ViewModeContextType = {
    mode: mounted ? mode : 'simple',
    setMode,
    isSimple: mounted ? mode === 'simple' : true,
    isPro: mounted ? mode === 'pro' : false,
    toggleMode,
  };

  return (
    <ViewModeContext.Provider value={value}>
      {children}
    </ViewModeContext.Provider>
  );
}

export function useViewMode() {
  const context = useContext(ViewModeContext);
  if (context === undefined) {
    throw new Error('useViewMode must be used within a ViewModeProvider');
  }
  return context;
}

// Plain labels for jargon (used in Simple mode)
export const SIMPLE_LABELS: Record<string, string> = {
  'OHLCV': 'Price History',
  'SMA': 'Moving Average',
  'EMA': 'Trend Average',
  'RSI': 'Momentum Score',
  'MACD': 'Trend Signal',
  'ATH': 'All-Time High',
  'ATL': 'All-Time Low',
  'BYOK': 'Your API Key',
  'TVL': 'Total Value Locked',
  'Market Cap': 'Total Value',
  'Circulating Supply': 'Coins in Market',
  'Volume': 'Trading Activity',
  'Fear & Greed': 'Market Mood',
  'Dominance': 'Market Share',
};

export function getSimpleLabel(term: string, useSimple: boolean): string {
  if (!useSimple) return term;
  return SIMPLE_LABELS[term] || term;
}
