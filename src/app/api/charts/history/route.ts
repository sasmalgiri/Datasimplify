/**
 * Chart History API
 * Returns price history data for charts
 * Uses Binance API as primary source
 * Falls back to CoinGecko if enabled
 *
 * Data is for display only - not redistributable
 *
 * COMPLIANCE: This route is protected against external API access.
 *
 * ANALYST PLAN LIMITS:
 * - Daily historical data: 2 years max (730 days)
 * - Hourly historical data: 2 years max
 */

import { NextRequest, NextResponse } from 'next/server';
import { getBinanceKlines, getCoinSymbol } from '@/lib/binance';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';
import { enforceDisplayOnly } from '@/lib/apiSecurity';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Analyst plan limit: 2 years of historical data
const MAX_HISTORICAL_DAYS = 730;

type MarketChart = {
  prices: [number, number][];
  total_volumes?: [number, number][];
};

function bucketOHLCV(
  prices: [number, number][],
  volumes: [number, number][] | undefined,
  bucketMs: number
): Array<{ timestamp: number; price: number; open: number; high: number; low: number; close: number; volume?: number }> {
  if (!prices || prices.length === 0) return [];

  const buckets = new Map<number, { ts: number; open: number; high: number; low: number; close: number; lastVol?: number }>();

  const volumeByBucket = new Map<number, number>();
  if (Array.isArray(volumes)) {
    for (const [ts, vol] of volumes) {
      const key = Math.floor(ts / bucketMs) * bucketMs;
      volumeByBucket.set(key, vol);
    }
  }

  for (const [ts, price] of prices) {
    const key = Math.floor(ts / bucketMs) * bucketMs;
    const existing = buckets.get(key);
    const lastVol = volumeByBucket.get(key);

    if (!existing) {
      buckets.set(key, {
        ts: key,
        open: price,
        high: price,
        low: price,
        close: price,
        lastVol,
      });
    } else {
      existing.high = Math.max(existing.high, price);
      existing.low = Math.min(existing.low, price);
      existing.close = price;
      if (typeof lastVol === 'number') existing.lastVol = lastVol;
    }
  }

  return Array.from(buckets.values())
    .sort((a, b) => a.ts - b.ts)
    .map(b => ({
      timestamp: b.ts,
      price: b.close,
      open: b.open,
      high: b.high,
      low: b.low,
      close: b.close,
      volume: b.lastVol,
    }));
}

async function fetchCoinGeckoMarketChart(coinId: string, days: number): Promise<MarketChart | null> {
  const url = `${COINGECKO_BASE}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: 60 },
  });
  if (!response.ok) return null;
  const data = (await response.json()) as MarketChart;
  if (!data?.prices || !Array.isArray(data.prices)) return null;
  return data;
}

export async function GET(request: NextRequest) {
  // Enforce display-only access - block external API scraping
  const blocked = enforceDisplayOnly(request, '/api/charts/history');
  if (blocked) return blocked;

  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';
    // Limit to Analyst plan max (2 years = 730 days)
    const days = Math.min(parseInt(searchParams.get('days') || '30'), MAX_HISTORICAL_DAYS);

    // Try Binance first (supports up to 1000 daily candles = ~2.7 years)
    const binanceSymbol = getCoinSymbol(coin);

    if (binanceSymbol) {
      // Binance supports up to 1000 candles per request
      const limit = Math.min(days, 1000);
      const klines = await getBinanceKlines(binanceSymbol, '1d', limit);

      if (klines && klines.length > 0) {
        assertRedistributionAllowed('binance', { purpose: 'chart', route: '/api/charts/history' });
        const priceHistory = klines.map(k => ({
          timestamp: k.timestamp,
          price: k.close,
          open: k.open,
          high: k.high,
          low: k.low,
          close: k.close,
          volume: k.volume,
        }));

        return NextResponse.json({
          prices: priceHistory,
          source: 'binance',
          coin,
          days: priceHistory.length,
        });
      }
    }

    // Fallback to CoinGecko if Binance fails (only when enabled)
    if (isFeatureEnabled('coingecko')) {
      assertRedistributionAllowed('coingecko', { purpose: 'chart', route: '/api/charts/history' });
      const chart = await fetchCoinGeckoMarketChart(coin, days);
      const bucketMs = 24 * 60 * 60 * 1000;
      const priceHistory = chart ? bucketOHLCV(chart.prices, chart.total_volumes, bucketMs) : [];
      if (priceHistory.length > 0) {
        return NextResponse.json({
          prices: priceHistory,
          source: 'coingecko',
          coin,
          days: priceHistory.length,
        });
      }
    }

    return NextResponse.json({
      prices: [],
      source: 'none',
      coin,
      days,
      error: isFeatureEnabled('coingecko')
        ? 'No chart data available from Binance or CoinGecko.'
        : 'No chart data available from Binance (CoinGecko disabled).',
    }, { status: 502 });

  } catch (error) {
    console.error('Chart history API error:', error);

    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';
    const days = parseInt(searchParams.get('days') || '30');
    return NextResponse.json({
      prices: [],
      source: 'error',
      coin,
      days,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 502 });
  }
}
