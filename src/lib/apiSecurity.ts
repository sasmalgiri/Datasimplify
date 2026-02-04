/**
 * API Security Utilities
 *
 * Protects CoinGecko-backed API routes from external redistribution.
 * Per CoinGecko ToS, data is for display only - proxying to third parties
 * without a Data Redistribution License is not permitted.
 *
 * SECURITY: This module uses browser-controlled headers (Sec-Fetch-Site)
 * and validated Origin/Referer headers to detect internal vs external requests.
 * Headers that can be trivially spoofed (Accept, x-nextjs-data) are NOT trusted.
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Allowed hostnames for internal API access.
 * These are validated against Origin and Referer headers.
 */
const ALLOWED_HOSTNAMES = new Set([
  // Development
  'localhost',
  '127.0.0.1',

  // Production domains - UPDATE THESE FOR YOUR DEPLOYMENT
  'cryptoreportkit.com',
  'www.cryptoreportkit.com',

  // Vercel preview deployments (if using Vercel)
  // Add your specific preview hostnames or use pattern matching below
]);

/**
 * Pattern matchers for dynamic hostnames (e.g., Vercel previews)
 */
const ALLOWED_HOSTNAME_PATTERNS = [
  // Vercel preview deployments: *.vercel.app
  /^[a-z0-9-]+\.vercel\.app$/i,
  // Add other patterns as needed for your infrastructure
];

/**
 * Check if a hostname is in the allowed list or matches allowed patterns.
 */
function isAllowedHostname(hostname: string): boolean {
  if (ALLOWED_HOSTNAMES.has(hostname)) {
    return true;
  }

  // Check dynamic patterns
  for (const pattern of ALLOWED_HOSTNAME_PATTERNS) {
    if (pattern.test(hostname)) {
      return true;
    }
  }

  return false;
}

/**
 * Extract and validate origin from Origin or Referer headers.
 * Returns the hostname if valid and allowed, null otherwise.
 */
function getValidatedOriginHostname(
  request: NextRequest | Request
): string | null {
  const headers = request.headers;

  // Try Origin header first (preferred, set by browsers for CORS requests)
  const origin = headers.get('origin');
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (isAllowedHostname(originUrl.hostname)) {
        return originUrl.hostname;
      }
    } catch {
      // Invalid Origin URL
    }
  }

  // Fall back to Referer header
  const referer = headers.get('referer');
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      if (isAllowedHostname(refererUrl.hostname)) {
        return refererUrl.hostname;
      }

      // Also check if Referer matches the request's own origin
      const requestUrl = new URL(request.url);
      if (refererUrl.hostname === requestUrl.hostname) {
        return refererUrl.hostname;
      }
    } catch {
      // Invalid Referer URL
    }
  }

  return null;
}

/**
 * Check if a request appears to be from an internal browser navigation
 * rather than an external API call.
 *
 * SECURITY NOTES:
 * - Sec-Fetch-Site is browser-controlled and cannot be spoofed by JavaScript
 * - Origin/Referer headers can be omitted but are validated when present
 * - We do NOT trust: Accept headers, x-nextjs-data, or other easily spoofed headers
 */
function isInternalRequest(request: NextRequest | Request): boolean {
  const headers = request.headers;

  // BEST SIGNAL: Sec-Fetch-Site header (browser-controlled, cannot be spoofed by JS)
  // This is the most reliable indicator when present
  const secFetchSite = headers.get('sec-fetch-site');
  if (secFetchSite === 'same-origin' || secFetchSite === 'same-site') {
    return true;
  }

  // If Sec-Fetch-Site indicates cross-site, block immediately
  if (secFetchSite === 'cross-site') {
    return false;
  }

  // FALLBACK: Validate Origin or Referer against allowed hostnames
  // Required when Sec-Fetch-Site is not present (older browsers, some fetch configs)
  const validatedHostname = getValidatedOriginHostname(request);
  if (validatedHostname) {
    return true;
  }

  // No trusted signals available - treat as external
  // This blocks curl/wget/programmatic access without proper headers
  return false;
}

/**
 * Response for blocked redistribution attempts
 */
function blockedResponse(route: string): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'External API access not permitted',
      message:
        'This endpoint serves display-only data from CoinGecko. ' +
        'Direct API access for redistribution requires a CoinGecko Data Redistribution License. ' +
        'For Excel integration, use the CRK Add-in with your own API keys (BYOK).',
      route,
      attribution: 'Data provided by CoinGecko',
    },
    {
      status: 403,
      headers: {
        'X-Data-License': 'display-only',
        'X-Attribution': 'Data provided by CoinGecko',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}

/**
 * Enforce display-only access for CoinGecko-backed API routes.
 *
 * This middleware checks if the request originates from the application itself
 * (internal browser request) vs external API access (potential redistribution).
 *
 * @param request - The incoming request
 * @param routePath - The route path for logging
 * @returns null if allowed, NextResponse if blocked
 *
 * @example
 * export async function GET(request: NextRequest) {
 *   const blocked = enforceDisplayOnly(request, '/api/crypto/trending');
 *   if (blocked) return blocked;
 *   // ... rest of handler
 * }
 */
export function enforceDisplayOnly(
  request: NextRequest | Request,
  routePath: string
): NextResponse | null {
  // In development, be more permissive but still block obvious cross-site
  if (process.env.NODE_ENV === 'development') {
    const secFetchSite = request.headers.get('sec-fetch-site');
    if (secFetchSite === 'cross-site') {
      console.warn(`[API Security] Blocked cross-site request to ${routePath}`);
      return blockedResponse(routePath);
    }
    // Allow most requests in dev for easier testing
    return null;
  }

  // In production, enforce strict internal-only access
  if (!isInternalRequest(request)) {
    console.warn(`[API Security] Blocked external API access to ${routePath}`);
    return blockedResponse(routePath);
  }

  return null;
}

/**
 * Add display-only headers to a response.
 * Use this for all CoinGecko-backed responses to indicate data licensing terms.
 */
export function addDisplayOnlyHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Data-License', 'display-only');
  response.headers.set('X-Attribution', 'Data provided by CoinGecko');
  response.headers.set('Cache-Control', 'private, no-store, max-age=0');
  return response;
}
