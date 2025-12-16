// Utility functions for formatting and calculations

export function formatCurrency(
  value: number,
  options?: {
    compact?: boolean;
    decimals?: number;
    currency?: string;
  }
): string {
  const { compact = true, decimals, currency = 'USD' } = options || {};
  
  if (value === null || value === undefined || isNaN(value)) return '-';
  
  if (compact) {
    if (Math.abs(value) >= 1e12) return `$${(value / 1e12).toFixed(decimals ?? 2)}T`;
    if (Math.abs(value) >= 1e9) return `$${(value / 1e9).toFixed(decimals ?? 2)}B`;
    if (Math.abs(value) >= 1e6) return `$${(value / 1e6).toFixed(decimals ?? 2)}M`;
    if (Math.abs(value) >= 1e3) return `$${(value / 1e3).toFixed(decimals ?? 2)}K`;
  }
  
  const d = decimals ?? (Math.abs(value) >= 1 ? 2 : 6);
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(value);
}

export function formatPercent(value: number, showSign: boolean = true): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  
  const sign = showSign && value > 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatNumber(value: number, compact: boolean = true): string {
  if (value === null || value === undefined || isNaN(value)) return '-';
  
  if (compact) {
    if (Math.abs(value) >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
    if (Math.abs(value) >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
    if (Math.abs(value) >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
    if (Math.abs(value) >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  }
  
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);
  
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  
  return formatDate(d);
}

// Color helpers
export function getPriceChangeColor(value: number): string {
  if (value > 0) return 'text-green-500';
  if (value < 0) return 'text-red-500';
  return 'text-gray-500';
}

export function getPriceChangeBg(value: number): string {
  if (value > 0) return 'bg-green-500/10';
  if (value < 0) return 'bg-red-500/10';
  return 'bg-gray-500/10';
}

// Sorting helpers
export function sortCoins<T extends Record<string, unknown>>(
  coins: T[],
  key: keyof T,
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...coins].sort((a, b) => {
    const aVal = a[key] as number;
    const bVal = b[key] as number;
    
    if (aVal === null || aVal === undefined) return 1;
    if (bVal === null || bVal === undefined) return -1;
    
    return order === 'desc' ? bVal - aVal : aVal - bVal;
  });
}

// Debounce helper
export function debounce<T extends string>(
  fn: (arg: T) => void,
  delay: number
): (arg: T) => void {
  let timeoutId: NodeJS.Timeout;
  
  return (arg: T) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(arg), delay);
  };
}

// Local storage helpers
export function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    console.error('Failed to save to localStorage');
  }
}

// Calculation helpers
export function calculateMarketCap(price: number, supply: number): number {
  return price * supply;
}

export function calculateChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / oldValue) * 100;
}
