/**
 * API Rate Limiter for User-Facing Endpoints
 *
 * Protects against abuse by limiting requests per IP address.
 * Uses in-memory store (resets on server restart/redeploy).
 * For production at scale, consider Redis-based solution.
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;      // Time window in milliseconds
  maxRequests: number;   // Max requests per window
}

// Rate limit configurations for different endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  // Registration: 5 attempts per 15 minutes per IP
  register: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 5,
  },
  // Download: 10 requests per 15 minutes per IP (separate from email limit)
  download: {
    windowMs: 15 * 60 * 1000,
    maxRequests: 10,
  },
  // General API: 60 requests per minute per IP
  general: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  },
};

// In-memory store (cleared on server restart)
const rateLimitStore: Map<string, RateLimitEntry> = new Map();

// Cleanup old entries every 5 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredEntries(): void {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Check if request should be rate limited
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  ip: string,
  endpoint: string = 'general'
): { allowed: boolean; remaining: number; resetIn: number } {
  cleanupExpiredEntries();

  const config = RATE_LIMITS[endpoint] || RATE_LIMITS.general;
  const key = `${endpoint}:${ip}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // If no entry or window expired, create new entry
  if (!entry || now > entry.resetTime) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
    };
    rateLimitStore.set(key, entry);
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetIn: config.windowMs,
    };
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: entry.resetTime - now,
    };
  }

  // Increment count
  entry.count++;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetIn: entry.resetTime - now,
  };
}

/**
 * Get client IP from request headers
 * Handles Vercel, Cloudflare, and standard proxies
 */
export function getClientIp(request: Request): string {
  const headers = new Headers(request.headers);

  // Vercel
  const vercelIp = headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0].trim();

  // Cloudflare
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // Standard proxy header
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  // Real IP header
  const realIp = headers.get('x-real-ip');
  if (realIp) return realIp;

  // Fallback
  return 'unknown';
}

/**
 * Create rate limit headers for response
 */
export function getRateLimitHeaders(
  remaining: number,
  resetIn: number
): Record<string, string> {
  return {
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetIn / 1000)),
  };
}
