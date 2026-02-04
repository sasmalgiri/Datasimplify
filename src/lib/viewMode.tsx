'use client';

import { createContext, useContext, useState, useCallback, useSyncExternalStore, ReactNode } from 'react';

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

// Custom hook to sync with localStorage using useSyncExternalStore
function useLocalStorageMode(): ViewMode {
  const subscribe = useCallback((callback: () => void) => {
    window.addEventListener('storage', callback);
    return () => window.removeEventListener('storage', callback);
  }, []);

  const getSnapshot = useCallback((): ViewMode => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'pro' || stored === 'simple') {
      return stored;
    }
    return 'simple';
  }, []);

  const getServerSnapshot = useCallback((): ViewMode => 'simple', []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export function ViewModeProvider({ children }: { children: ReactNode }) {
  // Use useSyncExternalStore for hydration-safe localStorage access
  const storedMode = useLocalStorageMode();
  const [mode, setModeState] = useState<ViewMode>(storedMode);

  const setMode = useCallback((newMode: ViewMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
    // Dispatch storage event for other tabs
    window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY, newValue: newMode }));
  }, []);

  const toggleMode = useCallback(() => {
    const newMode = mode === 'simple' ? 'pro' : 'simple';
    setMode(newMode);
  }, [mode, setMode]);

  const value: ViewModeContextType = {
    mode,
    setMode,
    isSimple: mode === 'simple',
    isPro: mode === 'pro',
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
