/**
 * AI Data Snapshots API
 * Query prediction snapshots with filtering
 */

import { NextResponse } from 'next/server';
import { getPredictionHistory, getLatestSnapshot } from '@/lib/predictionDb';

export async function GET(request: Request) {
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
    const snapshots = await getPredictionHistory(coin, startDate, endDate);

    // Apply limit
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
