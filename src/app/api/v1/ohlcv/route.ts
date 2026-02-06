/**
 * OHLCV Data Proxy Endpoint
 *
 * Fetches OHLC (Open, High, Low, Close, Volume) data from CoinGecko
 * using user's BYOK API key
 *
 * Supports both cookie-based auth (web) and Bearer token auth (Excel add-in)
 *
 * Sub-hourly intervals (5m, 15m, 30m, 1h) require CoinGecko Pro API key
 * Free tier only supports daily candles
 */

import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';

// Valid intervals and their requirements
const INTERVAL_CONFIG: Record<string, { minutes: number; requiresPro: boolean; maxDays: number }> = {
  '5m': { minutes: 5, requiresPro: true, maxDays: 1 },
  '15m': { minutes: 15, requiresPro: true, maxDays: 7 },
  '30m': { minutes: 30, requiresPro: true, maxDays: 14 },
  '1h': { minutes: 60, requiresPro: true, maxDays: 30 },
  '4h': { minutes: 240, requiresPro: true, maxDays: 90 },
  '1d': { minutes: 1440, requiresPro: false, maxDays: 365 },
  'daily': { minutes: 1440, requiresPro: false, maxDays: 365 },
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get('coin');
  const days = searchParams.get('days') || '30';
  const interval = searchParams.get('interval') || '1d';

  if (!coinId) {
    return NextResponse.json({ error: 'coin parameter required' }, { status: 400 });
  }

  // Validate interval
  const intervalConfig = INTERVAL_CONFIG[interval.toLowerCase()];
  if (!intervalConfig) {
    return NextResponse.json({
      error: 'Invalid interval',
      validIntervals: Object.keys(INTERVAL_CONFIG),
      message: 'Sub-hourly intervals (5m, 15m, 30m, 1h) require CoinGecko Pro API key'
    }, { status: 400 });
  }

  // Validate days doesn't exceed max for interval
  const daysNum = parseInt(days);
  if (daysNum > intervalConfig.maxDays) {
    return NextResponse.json({
      error: `Maximum ${intervalConfig.maxDays} days allowed for ${interval} interval`,
      requestedDays: daysNum,
      maxDays: intervalConfig.maxDays
    }, { status: 400 });
  }

  try {
    // Support both cookie auth (web) and Bearer token (Excel add-in)
    const { user, error: authError } = await getAuthUser(request);

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Try to get user's CoinGecko API key
    let apiKey: string | null = null;
    let keyType: string | null = null;
    const { data: keyData } = await supabase
      .from('provider_keys')
      .select('encrypted_key, key_type, is_valid')
      .eq('user_id', user.id)
      .eq('provider', 'coingecko')
      .eq('is_valid', true)
      .single();

    if (keyData?.encrypted_key) {
      try {
        apiKey = decryptApiKey(keyData.encrypted_key);
        keyType = keyData.key_type || 'demo';
      } catch (error) {
        console.error('[OHLCV API] Decryption error:', error);
      }
    }

    // Check if pro key is required but not available
    const hasPro = apiKey && keyType === 'pro';
    if (intervalConfig.requiresPro && !hasPro) {
      return NextResponse.json({
        error: 'Sub-hourly OHLCV data requires CoinGecko Pro API key',
        interval: interval,
        requiresPro: true,
        message: 'Get a CoinGecko Pro API key to access 5m, 15m, 30m, 1h intervals',
        upgradeUrl: '/byok',
        availableWithFreeKey: ['1d', 'daily']
      }, { status: 403 });
    }

    // Build the API URL
    const baseUrl = hasPro
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';

    // For sub-hourly, use market_chart endpoint with precision parameter
    // CoinGecko OHLC endpoint auto-adjusts granularity based on days range
    // For precise control with Pro, we can use market_chart
    let url: string;
    let useOhlcEndpoint = true;

    if (intervalConfig.requiresPro && hasPro) {
      // Use market_chart for sub-hourly with precision
      // CoinGecko returns prices at intervals based on the days parameter:
      // 1 day = 5-minute intervals
      // 2-90 days = hourly intervals
      // 91+ days = daily intervals
      //
      // For 5m granularity, request 1 day
      // For 15m/30m, we'll need to aggregate from 5m data
      // For 1h, request up to 90 days

      if (interval === '5m') {
        // 5-minute data - only available for 1 day range
        url = `${baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=1&precision=full`;
        useOhlcEndpoint = false;
      } else if (interval === '15m' || interval === '30m') {
        // For 15m/30m, use 5m data and aggregate
        const effectiveDays = Math.min(daysNum, interval === '15m' ? 7 : 14);
        url = `${baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${effectiveDays}&precision=full`;
        useOhlcEndpoint = false;
      } else if (interval === '1h' || interval === '4h') {
        // Hourly data - available up to 90 days
        url = `${baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${Math.min(daysNum, 90)}&precision=full`;
        useOhlcEndpoint = false;
      } else {
        // Daily - use OHLC endpoint
        url = `${baseUrl}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
      }
    } else {
      // Standard daily OHLC
      url = `${baseUrl}/coins/${coinId}/ohlc?vs_currency=usd&days=${days}`;
    }

    const headers: Record<string, string> = {};
    if (apiKey) {
      if (keyType === 'pro') {
        headers['x-cg-pro-api-key'] = apiKey;
      } else {
        headers['x-cg-demo-api-key'] = apiKey;
      }
    }

    const response = await fetch(url, { headers });

    if (!response.ok) {
      // If Pro key fails with 401/403, mark as invalid
      if (apiKey && (response.status === 401 || response.status === 403)) {
        await supabase
          .from('provider_keys')
          .update({ is_valid: false })
          .eq('user_id', user.id)
          .eq('provider', 'coingecko');
      }

      return NextResponse.json(
        { error: 'Provider error', status: response.status },
        { status: 502 }
      );
    }

    const rawData = await response.json();

    // Transform data based on endpoint type
    let data;
    if (useOhlcEndpoint) {
      // OHLC endpoint returns [[timestamp, open, high, low, close], ...]
      data = rawData;
    } else {
      // market_chart endpoint returns { prices: [[ts, price], ...], ... }
      // Convert to OHLC format by sampling or aggregating
      const prices = rawData.prices || [];
      const volumes = rawData.total_volumes || [];

      if (interval === '5m') {
        // 5-minute prices - convert to OHLC candlesticks
        data = convertPricesToOHLC(prices, volumes, 5);
      } else if (interval === '15m') {
        data = convertPricesToOHLC(prices, volumes, 15);
      } else if (interval === '30m') {
        data = convertPricesToOHLC(prices, volumes, 30);
      } else if (interval === '1h') {
        data = convertPricesToOHLC(prices, volumes, 60);
      } else if (interval === '4h') {
        data = convertPricesToOHLC(prices, volumes, 240);
      } else {
        // Daily - convert to OHLC
        data = convertPricesToOHLC(prices, volumes, 1440);
      }
    }

    // Log usage event
    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: 'api_ohlcv',
      metadata: { coinId, days, interval, hasProKey: !!apiKey, keyType },
    });

    return NextResponse.json({
      data,
      interval,
      days: daysNum,
      coin: coinId,
      meta: {
        source: 'coingecko',
        isPro: hasPro,
        candles: data.length,
      }
    });
  } catch (error) {
    console.error('[OHLCV API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Convert price data points to OHLC candlesticks
 * @param prices Array of [timestamp, price] pairs
 * @param volumes Array of [timestamp, volume] pairs
 * @param intervalMinutes Candle interval in minutes
 * @returns Array of [timestamp, open, high, low, close, volume]
 */
function convertPricesToOHLC(
  prices: [number, number][],
  volumes: [number, number][],
  intervalMinutes: number
): number[][] {
  if (!prices || prices.length === 0) return [];

  const intervalMs = intervalMinutes * 60 * 1000;
  const candles: number[][] = [];

  let currentCandleStart = Math.floor(prices[0][0] / intervalMs) * intervalMs;
  let open = prices[0][1];
  let high = prices[0][1];
  let low = prices[0][1];
  let close = prices[0][1];

  // Create volume lookup for faster access
  const volumeMap = new Map<number, number>();
  volumes.forEach(([ts, vol]) => {
    const bucketTs = Math.floor(ts / intervalMs) * intervalMs;
    volumeMap.set(bucketTs, (volumeMap.get(bucketTs) || 0) + vol);
  });

  for (let i = 0; i < prices.length; i++) {
    const [timestamp, price] = prices[i];
    const candleStart = Math.floor(timestamp / intervalMs) * intervalMs;

    if (candleStart !== currentCandleStart) {
      // Save current candle
      candles.push([
        currentCandleStart,
        open,
        high,
        low,
        close,
        volumeMap.get(currentCandleStart) || 0
      ]);

      // Start new candle
      currentCandleStart = candleStart;
      open = price;
      high = price;
      low = price;
      close = price;
    } else {
      // Update current candle
      high = Math.max(high, price);
      low = Math.min(low, price);
      close = price;
    }
  }

  // Don't forget the last candle
  if (prices.length > 0) {
    candles.push([
      currentCandleStart,
      open,
      high,
      low,
      close,
      volumeMap.get(currentCandleStart) || 0
    ]);
  }

  return candles;
}
