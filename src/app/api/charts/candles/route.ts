/**
 * Candlestick Chart API
 * Returns OHLCV data for candlestick charts
 *
 * Uses Binance API as primary source, CoinGecko as fallback
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
): Array<{ timestamp: number; open: number; high: number; low: number; close: number; volume?: number }> {
  if (!prices || prices.length === 0) return [];

  const volumeByBucket = new Map<number, number>();
  if (Array.isArray(volumes)) {
    for (const [ts, vol] of volumes) {
      const key = Math.floor(ts / bucketMs) * bucketMs;
      volumeByBucket.set(key, vol);
    }
  }

  const buckets = new Map<number, { ts: number; open: number; high: number; low: number; close: number; lastVol?: number }>();

  for (const [ts, price] of prices) {
    const key = Math.floor(ts / bucketMs) * bucketMs;
    const lastVol = volumeByBucket.get(key);
    const existing = buckets.get(key);

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
  const blocked = enforceDisplayOnly(request, '/api/charts/candles');
  if (blocked) return blocked;

  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';
    // Limit to Analyst plan max (2 years = 730 days)
    const days = Math.min(parseInt(searchParams.get('days') || '30'), MAX_HISTORICAL_DAYS);
    const requestedInterval = searchParams.get('interval');
    const interval = (requestedInterval === '1h' || requestedInterval === '4h' || requestedInterval === '1d' || requestedInterval === '1w')
      ? requestedInterval
      : (days <= 1 ? '1h' : days <= 7 ? '4h' : '1d');

    const symbol = getCoinSymbol(coin);

    // If Binance doesn't support the coin, use CoinGecko fallback
    if (!symbol) {
      if (!isFeatureEnabled('coingecko')) {
        return NextResponse.json({
          candles: [],
          source: 'none',
          coin,
          days,
          interval,
          error: 'No candle data available from Binance (CoinGecko disabled).',
        }, { status: 502 });
      }

      // Serving CoinGecko data in charts is a form of redistribution.
      assertRedistributionAllowed('coingecko', { purpose: 'chart', route: '/api/charts/candles' });

      const bucketMs = interval === '1h'
        ? 60 * 60 * 1000
        : interval === '4h'
          ? 4 * 60 * 60 * 1000
          : interval === '1w'
            ? 7 * 24 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;
      const chart = await fetchCoinGeckoMarketChart(coin, days);
      const candles = chart ? bucketOHLCV(chart.prices, chart.total_volumes, bucketMs) : [];
      if (candles.length === 0) {
        return NextResponse.json({
          candles: [],
          source: 'none',
          coin,
          days,
          interval,
          error: 'No candle data available from Binance or CoinGecko.',
        }, { status: 502 });
      }
      return NextResponse.json({
        candles,
        source: 'coingecko',
        coin,
        days,
        interval,
      });
    }

    // Binance supports up to 1000 candles per request
    const limit = Math.min(
      interval === '1h'
        ? 24
        : interval === '4h'
          ? days * 6
          : interval === '1w'
            ? Math.ceil(days / 7)
            : days,
      1000
    );
    const klines = await getBinanceKlines(symbol, interval as '1h' | '4h' | '1d' | '1w', limit);

    if (!klines || klines.length === 0) {
      if (!isFeatureEnabled('coingecko')) {
        return NextResponse.json({
          candles: [],
          source: 'none',
          coin,
          days,
          interval,
          error: 'No candle data available from Binance (CoinGecko disabled).',
        }, { status: 502 });
      }

      assertRedistributionAllowed('coingecko', { purpose: 'chart', route: '/api/charts/candles' });

      const bucketMs = interval === '1h'
        ? 60 * 60 * 1000
        : interval === '4h'
          ? 4 * 60 * 60 * 1000
          : interval === '1w'
            ? 7 * 24 * 60 * 60 * 1000
            : 24 * 60 * 60 * 1000;
      const chart = await fetchCoinGeckoMarketChart(coin, days);
      const candles = chart ? bucketOHLCV(chart.prices, chart.total_volumes, bucketMs) : [];
      if (candles.length === 0) {
        return NextResponse.json({
          candles: [],
          source: 'none',
          coin,
          days,
          interval,
          error: 'No candle data available from Binance or CoinGecko.',
        }, { status: 502 });
      }
      return NextResponse.json({
        candles,
        source: 'coingecko',
        coin,
        days,
        interval,
      });
    }

    assertRedistributionAllowed('binance', { purpose: 'chart', route: '/api/charts/candles' });

    return NextResponse.json({
      candles: klines,
      source: 'binance',
      coin,
      days,
      interval,
    });
  } catch (error) {
    console.error('Candles API error:', error);

    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';
    const days = parseInt(searchParams.get('days') || '30');

    return NextResponse.json({
      candles: [],
      source: 'error',
      coin,
      days,
      error: error instanceof Error ? error.message : String(error),
    }, { status: 502 });
  }
}
