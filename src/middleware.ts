import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Vercel Edge Middleware
 *
 * Runs before every request at the edge for:
 * - IP blocking
 * - Bot detection
 * - Request validation
 * - Security headers
 *
 * This runs on Vercel's edge network (free with Pro).
 */

// Blocked IP addresses (add known bad actors here)
// In production, consider using Vercel KV or Supabase for dynamic blocklist
const BLOCKED_IPS = new Set<string>([
  // Add blocked IPs here
  // '1.2.3.4',
]);

// Blocked user agent patterns (known bots/scrapers)
const BLOCKED_UA_PATTERNS = [
  /python-requests/i,
  /scrapy/i,
  /wget/i,
  /curl\/[0-9]/i, // curl with version (normal curl requests)
  /libwww-perl/i,
  /java\/[0-9]/i,
  /httpclient/i,
  /okhttp/i,
  /go-http-client/i,
  /apache-httpclient/i,
  /node-fetch/i,
  /undici/i, // Node.js native fetch
];

// Suspicious patterns that might indicate attacks
const SUSPICIOUS_PATHS = [
  /\.php$/i,
  /\.asp$/i,
  /\.env$/i,
  /wp-admin/i,
  /wp-login/i,
  /xmlrpc\.php/i,
  /\.git\//i,
  /\.svn\//i,
  /phpmyadmin/i,
  /admin\.php/i,
  /shell\.php/i,
];

// Protected API routes that need extra validation
const PROTECTED_API_ROUTES = [
  '/api/user/register',
  '/api/templates/download',
];

function getClientIp(request: NextRequest): string {
  // Vercel-specific headers
  const vercelIp = request.headers.get('x-vercel-forwarded-for');
  if (vercelIp) return vercelIp.split(',')[0].trim();

  // Cloudflare
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) return cfIp;

  // Standard proxy
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();

  const realIp = request.headers.get('x-real-ip');
  if (realIp) return realIp;

  return 'unknown';
}

function isBlockedUserAgent(userAgent: string | null): boolean {
  if (!userAgent) return false;
  return BLOCKED_UA_PATTERNS.some(pattern => pattern.test(userAgent));
}

function isSuspiciousPath(pathname: string): boolean {
  return SUSPICIOUS_PATHS.some(pattern => pattern.test(pathname));
}

function addSecurityHeaders(response: NextResponse): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Remove server identification
  response.headers.delete('x-powered-by');

  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent');

  // 1. Check blocked IPs
  if (BLOCKED_IPS.has(clientIp)) {
    console.warn(`[Middleware] Blocked IP: ${clientIp}`);
    return new NextResponse('Access Denied', { status: 403 });
  }

  // 2. Block suspicious paths (common attack vectors)
  if (isSuspiciousPath(pathname)) {
    console.warn(`[Middleware] Suspicious path blocked: ${pathname} from ${clientIp}`);
    return new NextResponse('Not Found', { status: 404 });
  }

  // 3. Check for blocked user agents on API routes
  // Exception: Allow /api/v1/* and /api/cron/* for server-side access (BYOK APIs, cron jobs)
  const isInternalApi = pathname.startsWith('/api/v1/') || pathname.startsWith('/api/cron/');

  if (pathname.startsWith('/api/') && !isInternalApi) {
    if (isBlockedUserAgent(userAgent)) {
      console.warn(`[Middleware] Blocked UA on API: ${userAgent?.slice(0, 50)} from ${clientIp}`);
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Extra validation for protected routes
    if (PROTECTED_API_ROUTES.some(route => pathname.startsWith(route))) {
      // Require some standard headers for API calls
      const contentType = request.headers.get('content-type');
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');

      // For POST requests, require content-type
      if (request.method === 'POST' && !contentType?.includes('application/json')) {
        // Allow form data for specific endpoints
        if (!contentType?.includes('multipart/form-data') && !contentType?.includes('application/x-www-form-urlencoded')) {
          console.warn(`[Middleware] Invalid content-type on ${pathname}: ${contentType} from ${clientIp}`);
          return NextResponse.json(
            { error: 'Invalid request format' },
            { status: 400 }
          );
        }
      }

      // Log protected route access
      console.log(`[Middleware] Protected API access: ${pathname} from ${clientIp}`);
    }
  }

  // 4. Rate limit check for downloads (simple edge-based check)
  // Note: This is supplementary to the API-level rate limiting
  if (pathname === '/api/templates/download' && request.method === 'POST') {
    // Add custom header to track edge processing
    const response = NextResponse.next();
    response.headers.set('X-Edge-Processed', 'true');
    response.headers.set('X-Client-IP', clientIp);
    return addSecurityHeaders(response);
  }

  // 5. Add security headers to all responses
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
