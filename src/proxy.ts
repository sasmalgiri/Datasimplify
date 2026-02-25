import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Vercel Edge Proxy
 *
 * Runs before every request at the edge for:
 * - Authentication wall (login required for protected pages)
 * - IP blocking
 * - Bot detection
 * - Request validation
 * - Security headers
 *
 * This runs on Vercel's edge network (free with Pro).
 */

/**
 * Public routes that don't require authentication.
 * Everything else redirects to /login?redirect=<path>
 */
const PUBLIC_ROUTES = new Set([
  // Core pages
  '/',
  '/about',
  '/byok',
  '/coming-soon',
  '/contact',
  '/data-sources',
  '/disclaimer',
  '/faq',
  '/forgot-password',
  '/login',
  '/reset-password',
  '/pricing',
  '/privacy',
  '/refund',
  '/roadmap',
  '/signup',
  '/status',
  '/template-requirements',
  '/terms',
  // Public content pages
  '/market',
  '/trending',
  '/screener',
  '/compare',
  '/download',
  '/downloads',
  '/charts',
  '/glossary',
  '/learn',
  '/research',
  '/sentiment',
  '/heatmap',
  '/defi',
  '/categories',
  '/gainers-losers',
  '/dex-pools',
  '/recently-added',
  '/templates',
  '/tools',
  '/social',
  '/technical',
  '/etf',
  '/correlation',
  '/risk',
  '/rwa',
  '/smart-contract-verifier',
  '/wizard',
  '/builder',
  '/analyst-hub',
  '/datalab',
  '/portfolio',
  '/command-center',

  // Ensure base listing route is public (prefix below only covers /live-dashboards/*)
  '/live-dashboards',
]);

const PUBLIC_PREFIXES = [
  '/api/',
  '/auth/',
  '/_next/',
  '/favicon',
  '/sitemap',
  '/robots',
  '/manifest',
  '/icons/',
  '/images/',
  '/assets/',
  // Dynamic public routes
  '/coin/',
  '/templates/',
  '/excel-templates/',
  '/live-dashboards/',
  '/embed/',
  '/charts/',
  '/tools/',
  '/demo/',
];

function isPublicRoute(pathname: string): boolean {
  if (PUBLIC_ROUTES.has(pathname)) return true;
  for (const prefix of PUBLIC_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  if (/\.(ico|png|jpg|jpeg|gif|svg|webp|css|js|woff2?|ttf|eot|map|xml|txt)$/.test(pathname)) {
    return true;
  }
  return false;
}

// Blocked IP addresses (add known bad actors here)
// In production, consider using Vercel KV or Supabase for dynamic blocklist
const BLOCKED_IPS = new Set<string>([
  // Add blocked IPs here
  // '1.2.3.4',
]);

// ── In-memory rate limiter (per edge instance) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

// Cleanup stale entries every 60s to prevent memory leaks
if (typeof globalThis !== 'undefined') {
  const cleanup = () => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap) {
      if (now > value.resetAt) rateLimitMap.delete(key);
    }
  };
  setInterval(cleanup, 60_000);
}

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

function addSecurityHeaders(response: NextResponse, pathname: string): NextResponse {
  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Block iframe loading for all pages except embed routes
  if (pathname.startsWith('/embed/')) {
    response.headers.delete('X-Frame-Options');
    response.headers.set('Content-Security-Policy', 'frame-ancestors *');
  } else {
    response.headers.set('X-Frame-Options', 'DENY');
  }

  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');

  // Remove server identification
  response.headers.delete('x-powered-by');

  return response;
}

export async function proxy(request: NextRequest) {
  const rawPathname = request.nextUrl.pathname;
  const pathname = rawPathname === '/' ? '/' : rawPathname.replace(/\/+$/, '');
  const clientIp = getClientIp(request);
  const userAgent = request.headers.get('user-agent');

  // 1. Check blocked IPs
  if (BLOCKED_IPS.has(clientIp)) {
    console.warn(`[Middleware] Blocked IP: ${clientIp}`);
    return new NextResponse('Access Denied', { status: 403 });
  }

  // 2. Rate limiting for API routes
  if (pathname.startsWith('/api/')) {
    const isAuthSensitive = pathname.startsWith('/api/v1/keys') ||
                            pathname.startsWith('/api/webhooks') ||
                            pathname.startsWith('/api/user/register');
    const limit = isAuthSensitive ? 20 : 60; // per minute
    const bucket = `${clientIp}:${pathname.split('/').slice(0, 4).join('/')}`;

    if (!checkRateLimit(bucket, limit, 60_000)) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }
  }

  // 3. Supabase session refresh — runs on ALL routes so cookies stay valid
  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Authentication wall — require login for non-public pages
    if (!isPublicRoute(pathname) && !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  } else if (!isPublicRoute(pathname)) {
    // No Supabase configured — block protected routes
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Block suspicious paths (common attack vectors)
  if (isSuspiciousPath(pathname)) {
    console.warn(`[Middleware] Suspicious path blocked: ${pathname} from ${clientIp}`);
    return new NextResponse('Not Found', { status: 404 });
  }

  // 5. Check for blocked user agents on API routes
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

  // 6. Rate limit check for downloads (simple edge-based check)
  // Note: This is supplementary to the API-level rate limiting
  if (pathname === '/api/templates/download' && request.method === 'POST') {
    supabaseResponse.headers.set('X-Edge-Processed', 'true');
    supabaseResponse.headers.set('X-Client-IP', clientIp);
    return addSecurityHeaders(supabaseResponse, pathname);
  }

  // 7. Add security headers to all responses (use supabaseResponse to preserve refreshed cookies)
  return addSecurityHeaders(supabaseResponse, pathname);
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
