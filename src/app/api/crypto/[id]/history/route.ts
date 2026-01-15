/**
 * Coin Price History API Route
 *
 * Returns historical price data from Binance (primary) or CoinGecko (fallback)
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 *
 * ANALYST PLAN LIMITS:
 * - Daily historical data: 2 years max (730 days)
 * - Hourly historical data: 2 years max
 * - 5-minute data: 1 day max
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBinanceKlines, getCoinSymbol } from '@/lib/binance';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { getPriceHistory } from '@/lib/coingecko';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

// Analyst plan limit: 2 years of daily historical data
const MAX_HISTORICAL_DAYS = 730;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/crypto/[id]/history');
  if (blocked) return blocked;

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  // Limit to Analyst plan max (2 years = 730 days)
  const days = Math.min(parseInt(searchParams.get('days') || '30'), MAX_HISTORICAL_DAYS);

  try {
    const symbol = getCoinSymbol(id);
    if (symbol) {
      const limit = Math.min(days, 1000);
      const klines = await getBinanceKlines(symbol, '1d', limit);
      if (klines && klines.length > 0) {
        assertRedistributionAllowed('binance', { purpose: 'chart', route: '/api/crypto/[id]/history' });
        return NextResponse.json({
          coinId: id,
          days,
          prices: klines.map(k => ({ timestamp: k.timestamp, price: k.close })),
          source: 'binance',
        });
      }
    }

    if (!isFeatureEnabled('coingecko')) {
      return NextResponse.json(
        { error: 'Failed to fetch price history (CoinGecko disabled)', prices: [], source: 'none' },
        { status: 502 }
      );
    }

    assertRedistributionAllowed('coingecko', { purpose: 'chart', route: '/api/crypto/[id]/history' });

    const prices = await getPriceHistory(id, days);
    
    return NextResponse.json({
      coinId: id,
      days,
      prices,
      source: 'coingecko',
    });
  } catch (error) {
    console.error('Price history API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch price history', prices: [], source: 'error' },
      { status: 500 }
    );
  }
}
