/**
 * In-memory response cache for server-key (shared) CoinGecko requests.
 * Prevents redundant API calls when multiple visitors view the same dashboard.
 * Only used when no user BYOK key is provided.
 */

const MAX_ENTRIES = 500;

interface CacheEntry {
  data: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

/** TTL per endpoint type (milliseconds) */
const ENDPOINT_TTL: Record<string, number> = {
  markets: 60_000,
  global: 60_000,
  trending: 60_000,
  fear_greed: 60_000,
  ohlc: 300_000,
  ohlc_multi: 300_000,
  categories: 300_000,
  exchanges: 300_000,
  coin_history: 300_000,
  coin_detail: 3_600_000,
  defi_global: 300_000,
  derivatives: 300_000,
  derivatives_exchanges: 300_000,
};

const DEFAULT_TTL = 300_000; // 5 min fallback

export function buildCacheKey(endpoint: string, params?: Record<string, unknown>): string {
  const sorted = params
    ? Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${Array.isArray(v) ? v.join(',') : String(v)}`)
        .join('&')
    : '';
  return `${endpoint}:${sorted}`;
}

export function getCached(key: string): unknown | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCache(key: string, data: unknown, endpoint: string): void {
  const ttl = ENDPOINT_TTL[endpoint] ?? DEFAULT_TTL;
  cache.set(key, { data, expiresAt: Date.now() + ttl });

  // Evict expired entries if cache is too large
  if (cache.size > MAX_ENTRIES) {
    const now = Date.now();
    for (const [k, v] of cache) {
      if (now > v.expiresAt) cache.delete(k);
    }
    // If still too large, delete oldest entries
    if (cache.size > MAX_ENTRIES) {
      const excess = cache.size - MAX_ENTRIES;
      const keys = cache.keys();
      for (let i = 0; i < excess; i++) {
        const next = keys.next();
        if (!next.done) cache.delete(next.value);
      }
    }
  }
}
