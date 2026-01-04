/**
 * Chart History API
 * Returns price history data for charts
 * Uses Binance API (FREE, Commercial OK) as primary source
 * Falls back to CoinGecko (FREE) if needed
 */

import { NextResponse } from 'next/server';
import { getBinanceKlines, getCoinSymbol } from '@/lib/binance';
import { isFeatureEnabled } from '@/lib/featureFlags';

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin') || 'bitcoin';
    const days = parseInt(searchParams.get('days') || '30');

    // Try Binance first (commercial-friendly, supports up to 1000 daily candles = ~2.7 years)
    const binanceSymbol = getCoinSymbol(coin);

    if (binanceSymbol) {
      // Binance supports up to 1000 candles per request
      const limit = Math.min(days, 1000);
      const klines = await getBinanceKlines(binanceSymbol, '1d', limit);

      if (klines && klines.length > 0) {
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
