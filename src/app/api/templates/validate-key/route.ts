import { NextResponse } from 'next/server';
import { checkRateLimit, getClientIp, getRateLimitHeaders } from '@/lib/security/apiRateLimit';

export async function POST(request: Request) {
  const clientIp = getClientIp(request);

  // Rate limit: reuse 'general' limiter
  const rateLimit = checkRateLimit(clientIp, 'general');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { valid: false, error: 'Too many requests. Please try again later.' },
      { status: 429, headers: getRateLimitHeaders(rateLimit.remaining, rateLimit.resetIn) }
    );
  }

  try {
    const body = await request.json();
    const apiKey = typeof body.apiKey === 'string' ? body.apiKey.trim() : '';

    if (apiKey.length < 10) {
      return NextResponse.json({ valid: false, error: 'Invalid API key format.' });
    }

    // Try Pro API first
    try {
      const proResponse = await fetch('https://pro-api.coingecko.com/api/v3/ping', {
        headers: { 'x-cg-pro-api-key': apiKey },
        signal: AbortSignal.timeout(5000),
      });

      if (proResponse.ok) {
        return NextResponse.json({ valid: true, keyType: 'pro' });
      }
    } catch {
      // Pro endpoint failed, try demo
    }

    // Try Demo API
    try {
      const demoResponse = await fetch('https://api.coingecko.com/api/v3/ping', {
        headers: { 'x-cg-demo-api-key': apiKey },
        signal: AbortSignal.timeout(5000),
      });

      if (demoResponse.ok) {
        return NextResponse.json({ valid: true, keyType: 'demo' });
      }
    } catch {
      // Demo endpoint also failed
    }

    return NextResponse.json({
      valid: false,
      error: 'Invalid API key. Make sure you have a valid CoinGecko Demo or Pro key.',
    });
  } catch {
    return NextResponse.json(
      { valid: false, error: 'Validation failed. Please try again.' },
      { status: 500 }
    );
  }
}
