// ============================================
// RAG RESPONSE CACHING
// In-memory cache with TTL for cost savings
// ============================================

import { RAGResponse } from './ragWithData';

interface CacheEntry {
  response: RAGResponse;
  timestamp: number;
  hits: number;
}

interface CacheStats {
  hits: number;
  misses: number;
  entries: number;
  savedTokens: number;
}

// Cache configuration
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 100; // Max entries
const SIMILARITY_THRESHOLD = 0.85; // For fuzzy matching

// In-memory cache
const responseCache = new Map<string, CacheEntry>();
const cacheStats: CacheStats = {
  hits: 0,
  misses: 0,
  entries: 0,
  savedTokens: 0,
};

/**
 * Normalize query for cache key generation
 */
function normalizeQuery(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[?!.,]+$/, ''); // Remove trailing punctuation
}

/**
 * Generate cache key from query and options
 */
function generateCacheKey(query: string, userLevel?: string, coinSymbol?: string): string {
  const normalized = normalizeQuery(query);
  return `${normalized}|${userLevel || 'intermediate'}|${coinSymbol || ''}`;
}

/**
 * Simple string similarity using Jaccard index
 */
function calculateSimilarity(str1: string, str2: string): number {
  const set1 = new Set(str1.toLowerCase().split(/\s+/));
  const set2 = new Set(str2.toLowerCase().split(/\s+/));

  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);

  return intersection.size / union.size;
}

/**
 * Find similar cached query (fuzzy matching)
 */
function findSimilarCached(query: string, userLevel?: string): CacheEntry | null {
  const normalized = normalizeQuery(query);
  const now = Date.now();

  for (const [key, entry] of responseCache.entries()) {
    // Check TTL
    if (now - entry.timestamp > CACHE_TTL_MS) {
      responseCache.delete(key);
      continue;
    }

    // Extract query part from key
    const [cachedQuery, cachedLevel] = key.split('|');

    // Must match user level
    if (cachedLevel !== (userLevel || 'intermediate')) continue;

    // Check similarity
    const similarity = calculateSimilarity(normalized, cachedQuery);
    if (similarity >= SIMILARITY_THRESHOLD) {
      return entry;
    }
  }

  return null;
}

/**
 * Get cached response if available
 */
export function getCachedResponse(
  query: string,
  userLevel?: string,
  coinSymbol?: string
): RAGResponse | null {
  const key = generateCacheKey(query, userLevel, coinSymbol);
  const entry = responseCache.get(key);

  if (entry) {
    // Check TTL
    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      responseCache.delete(key);
      cacheStats.entries = responseCache.size;
    } else {
      // Cache hit!
      entry.hits++;
      cacheStats.hits++;
      cacheStats.savedTokens += entry.response.tokensUsed || 0;
      return entry.response;
    }
  }

  // Try fuzzy matching
  const similar = findSimilarCached(query, userLevel);
  if (similar) {
    similar.hits++;
    cacheStats.hits++;
    cacheStats.savedTokens += similar.response.tokensUsed || 0;
    return similar.response;
  }

  cacheStats.misses++;
  return null;
}

/**
 * Cache a response
 */
export function cacheResponse(
  query: string,
  response: RAGResponse,
  userLevel?: string,
  coinSymbol?: string
): void {
  // Don't cache low confidence responses
  if (response.confidence === 'low') return;

  // Enforce max size (LRU-like: remove oldest)
  if (responseCache.size >= MAX_CACHE_SIZE) {
    const oldestKey = responseCache.keys().next().value;
    if (oldestKey) responseCache.delete(oldestKey);
  }

  const key = generateCacheKey(query, userLevel, coinSymbol);
  responseCache.set(key, {
    response,
    timestamp: Date.now(),
    hits: 0,
  });

  cacheStats.entries = responseCache.size;
}

/**
 * Get cache statistics
 */
export function getCacheStats(): CacheStats & { hitRate: string } {
  const total = cacheStats.hits + cacheStats.misses;
  const hitRate = total > 0 ? ((cacheStats.hits / total) * 100).toFixed(1) : '0.0';

  return {
    ...cacheStats,
    hitRate: `${hitRate}%`,
  };
}

/**
 * Clear expired entries
 */
export function cleanupCache(): number {
  const now = Date.now();
  let removed = 0;

  for (const [key, entry] of responseCache.entries()) {
    if (now - entry.timestamp > CACHE_TTL_MS) {
      responseCache.delete(key);
      removed++;
    }
  }

  cacheStats.entries = responseCache.size;
  return removed;
}

/**
 * Clear entire cache
 */
export function clearCache(): void {
  responseCache.clear();
  cacheStats.entries = 0;
}
