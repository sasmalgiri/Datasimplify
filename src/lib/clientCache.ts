/**
 * Client-side caching utility using localStorage
 * Reduces API pressure by caching coin data locally
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

// Cache TTL configurations (in milliseconds)
export const CACHE_TTL = {
  PRICE_DATA: 5 * 60 * 1000,           // 5 minutes for real-time prices
  COIN_DETAILS: 30 * 60 * 1000,         // 30 minutes for coin details
  PRICE_HISTORY: 60 * 60 * 1000,        // 1 hour for historical data
  MARKET_DATA: 10 * 60 * 1000,          // 10 minutes for market overview
  STATIC_DATA: 24 * 60 * 60 * 1000,     // 24 hours for static metadata
  LONG_TERM: 7 * 24 * 60 * 60 * 1000,   // 7 days for rarely changing data
} as const;

const CACHE_PREFIX = 'ds_cache_';
const CACHE_VERSION = 'v1';

/**
 * Get the full cache key with prefix and version
 */
function getCacheKey(key: string): string {
  return `${CACHE_PREFIX}${CACHE_VERSION}_${key}`;
}

/**
 * Check if localStorage is available
 */
function isLocalStorageAvailable(): boolean {
  try {
    const test = '__storage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get cached data from localStorage
 */
export function getClientCache<T>(key: string): T | null {
  if (!isLocalStorageAvailable()) return null;

  try {
    const fullKey = getCacheKey(key);
    const stored = localStorage.getItem(fullKey);

    if (!stored) return null;

    const entry: CacheEntry<T> = JSON.parse(stored);
    const now = Date.now();

    // Check if cache is still valid
    if (now - entry.timestamp < entry.ttl) {
      return entry.data;
    }

    // Cache expired, remove it
    localStorage.removeItem(fullKey);
    return null;
  } catch (error) {
    console.warn('Error reading from cache:', error);
    return null;
  }
}

/**
 * Set data in localStorage cache
 */
export function setClientCache<T>(key: string, data: T, ttl: number = CACHE_TTL.COIN_DETAILS): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const fullKey = getCacheKey(key);
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    localStorage.setItem(fullKey, JSON.stringify(entry));
  } catch (error) {
    // Handle quota exceeded error by clearing old cache entries
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      clearOldCacheEntries();
      try {
        const fullKey = getCacheKey(key);
        const entry: CacheEntry<T> = {
          data,
          timestamp: Date.now(),
          ttl,
        };
        localStorage.setItem(fullKey, JSON.stringify(entry));
      } catch {
        console.warn('Unable to cache data after cleanup');
      }
    } else {
      console.warn('Error writing to cache:', error);
    }
  }
}

/**
 * Remove a specific cache entry
 */
export function removeClientCache(key: string): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const fullKey = getCacheKey(key);
    localStorage.removeItem(fullKey);
  } catch (error) {
    console.warn('Error removing from cache:', error);
  }
}

/**
 * Clear all cache entries (or just expired ones)
 */
export function clearOldCacheEntries(): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const now = Date.now();
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        try {
          const stored = localStorage.getItem(key);
          if (stored) {
            const entry = JSON.parse(stored) as CacheEntry<unknown>;
            // Remove if expired
            if (now - entry.timestamp >= entry.ttl) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Remove invalid entries
          keysToRemove.push(key);
        }
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Error clearing cache:', error);
  }
}

/**
 * Clear all app cache entries
 */
export function clearAllCache(): void {
  if (!isLocalStorageAvailable()) return;

  try {
    const keysToRemove: string[] = [];

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.warn('Error clearing all cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { entries: number; size: string; oldestEntry: Date | null } {
  if (!isLocalStorageAvailable()) {
    return { entries: 0, size: '0 KB', oldestEntry: null };
  }

  let entries = 0;
  let totalSize = 0;
  let oldestTimestamp: number | null = null;

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(CACHE_PREFIX)) {
      entries++;
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += value.length * 2; // Approximate bytes (UTF-16)
        try {
          const entry = JSON.parse(value) as CacheEntry<unknown>;
          if (oldestTimestamp === null || entry.timestamp < oldestTimestamp) {
            oldestTimestamp = entry.timestamp;
          }
        } catch {
          // Ignore parsing errors
        }
      }
    }
  }

  const sizeKB = (totalSize / 1024).toFixed(2);

  return {
    entries,
    size: `${sizeKB} KB`,
    oldestEntry: oldestTimestamp ? new Date(oldestTimestamp) : null,
  };
}

/**
 * Fetch with cache wrapper
 * Tries cache first, falls back to fetch, then caches the result
 */
export async function fetchWithCache<T>(
  url: string,
  cacheKey: string,
  ttl: number = CACHE_TTL.COIN_DETAILS,
  options?: RequestInit
): Promise<{ data: T | null; fromCache: boolean; error?: string }> {
  // Try cache first
  const cached = getClientCache<T>(cacheKey);
  if (cached !== null) {
    return { data: cached, fromCache: true };
  }

  // Fetch from API
  try {
    const response = await fetch(url, options);

    if (!response.ok) {
      return { data: null, fromCache: false, error: `HTTP ${response.status}` };
    }

    const data = await response.json();

    // Cache the successful response
    if (data && !data.error) {
      setClientCache(cacheKey, data, ttl);
    }

    return { data, fromCache: false };
  } catch (error) {
    return {
      data: null,
      fromCache: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Auto-cleanup on module load
if (typeof window !== 'undefined') {
  // Clear expired entries on page load
  setTimeout(() => clearOldCacheEntries(), 1000);
}
