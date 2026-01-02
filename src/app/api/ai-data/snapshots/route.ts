/**
 * AI Data Snapshots API
 * Query prediction snapshots with filtering
 */

import { NextResponse } from 'next/server';
import { getPredictionHistory, getLatestSnapshot } from '@/lib/predictionDb';

// Protect snapshots endpoint (internal prediction history)
const SYNC_SECRET_KEY = (process.env.SYNC_SECRET_KEY || '').trim();
const DEV_FALLBACK_SECRET = 'dev-secret-change-in-production';

function getExpectedSecret(): string | null {
  if (SYNC_SECRET_KEY) return SYNC_SECRET_KEY;
  if (process.env.NODE_ENV !== 'production') return DEV_FALLBACK_SECRET;
  return null;
}

function getProvidedSecret(request: Request): string | null {
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');
  const authHeader = request.headers.get('Authorization');
  const headerSecret = authHeader?.replace(/^Bearer\s+/i, '') || null;
  return headerSecret || querySecret;
}

export async function GET(request: Request) {
  const expected = getExpectedSecret();
  if (!expected) {
    return NextResponse.json(
      { error: 'Snapshots API not configured. Set SYNC_SECRET_KEY.' },
      { status: 503 }
    );
  }

  const provided = getProvidedSecret(request);
  if (!provided || provided !== expected) {
    return NextResponse.json(
      { error: 'Unauthorized. Provide valid secret key via ?secret= or Authorization header.' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const latest = searchParams.get('latest') === 'true';
    const limit = parseInt(searchParams.get('limit') || '100');

    // If requesting latest only
    if (latest) {
      const snapshot = await getLatestSnapshot(coin);
      if (!snapshot) {
        return NextResponse.json(
          { error: `No snapshot found for ${coin}` },
          { status: 404 }
        );
      }
      return NextResponse.json(snapshot);
    }

    // Parse dates
    const startDate = from ? new Date(from) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Default 7 days
    const endDate = to ? new Date(to) : new Date();

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Get history
    const snapshots = await getPredictionHistory(coin, { startDate, endDate, limit });

    // Apply limit (already applied by the function, but ensure consistency)
    const limitedSnapshots = snapshots.slice(0, limit);

    return NextResponse.json({
      coin,
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      count: limitedSnapshots.length,
      totalAvailable: snapshots.length,
      snapshots: limitedSnapshots,
    });
  } catch (error) {
    console.error('Snapshots API error:', error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
