/**
 * OHLCV Data Proxy API
 *
 * Proxies OHLCV (Open, High, Low, Close, Volume) requests to data providers
 * using the user's own API keys (BYOK)
 *
 * GET /api/v1/ohlcv?coin=bitcoin&days=30
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';
import {
  checkEntitlement,
  createEntitlementErrorResponse,
} from '@/lib/entitlements';

// Valid days values for CoinGecko OHLC endpoint
const VALID_DAYS = [1, 7, 14, 30, 90, 180, 365, 'max'] as const;
type ValidDays = (typeof VALID_DAYS)[number];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get('coin');
  const daysParam = searchParams.get('days') || '30';

  // Validate coin parameter
  if (!coinId) {
    return NextResponse.json(
      { error: 'coin parameter is required' },
      { status: 400 }
    );
  }

  // Sanitize coin ID
  const sanitizedCoinId = coinId
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 100);

  if (!sanitizedCoinId) {
    return NextResponse.json({ error: 'Invalid coin ID' }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Parse days for entitlement check
  let requestedDays = 30;
  if (daysParam !== 'max') {
    const parsed = parseInt(daysParam, 10);
    if (!isNaN(parsed) && parsed > 0) {
      requestedDays = parsed;
    }
  } else {
    requestedDays = 730; // Treat "max" as 2 years for limit check
  }

  // Check entitlement with OHLCV days limit
  const entitlementCheck = await checkEntitlement(supabase, user.id, {
    ohlcvDaysRequested: requestedDays,
  });
  if (!entitlementCheck.allowed) {
    return NextResponse.json(
      createEntitlementErrorResponse(entitlementCheck),
      { status: entitlementCheck.status || 403 }
    );
  }

  // Validate and constrain days parameter to plan limits
  let days: ValidDays;
  const maxAllowedDays = entitlementCheck.entitlement?.maxOhlcvDays || 30;

  if (daysParam === 'max') {
    // Constrain 'max' to user's plan limit
    days = VALID_DAYS.find(
      (d) => typeof d === 'number' && d >= maxAllowedDays
    ) as ValidDays;
    if (!days || days === 'max') {
      days = Math.min(365, maxAllowedDays) as ValidDays;
    }
  } else {
    const daysNum = parseInt(daysParam, 10);
    if (isNaN(daysNum) || daysNum < 1) {
      return NextResponse.json(
        { error: 'days must be a positive number or "max"' },
        { status: 400 }
      );
    }
    // Constrain to plan limit, then find closest valid CoinGecko value
    const constrainedDays = Math.min(daysNum, maxAllowedDays);
    days = VALID_DAYS.find(
      (d) => typeof d === 'number' && constrainedDays <= d
    ) as ValidDays;
    if (!days) {
      days = Math.min(365, maxAllowedDays) as ValidDays;
    }
  }

  // Get user's CoinGecko key if available
  const { data: keyData } = await supabase
    .from('provider_keys')
    .select('encrypted_key, is_valid')
    .eq('user_id', user.id)
    .eq('provider', 'coingecko')
    .single();

  let apiKey: string | null = null;
  let usingProApi = false;

  if (keyData?.encrypted_key && keyData.is_valid) {
    try {
      apiKey = decryptApiKey(keyData.encrypted_key);
      usingProApi = true;
    } catch (err) {
      console.error('Failed to decrypt API key:', err);
      await supabase
        .from('provider_keys')
        .update({ is_valid: false })
        .eq('user_id', user.id)
        .eq('provider', 'coingecko');
    }
  }

  // Build CoinGecko URL
  const baseUrl = usingProApi
    ? 'https://pro-api.coingecko.com/api/v3'
    : 'https://api.coingecko.com/api/v3';

  const url = `${baseUrl}/coins/${sanitizedCoinId}/ohlc?vs_currency=usd&days=${days}`;

  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  if (apiKey) {
    headers['x-cg-pro-api-key'] = apiKey;
  }

  try {
    const response = await fetch(url, {
      headers,
      next: { revalidate: 300 }, // Cache for 5 minutes (OHLCV data changes less frequently)
    });

    if (!response.ok) {
      if (usingProApi && response.status === 401) {
        await supabase
          .from('provider_keys')
          .update({ is_valid: false })
          .eq('user_id', user.id)
          .eq('provider', 'coingecko');

        return NextResponse.json(
          {
            error: 'Your CoinGecko API key appears to be invalid',
            code: 'INVALID_API_KEY',
          },
          { status: 401 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          {
            error:
              'Rate limit exceeded. Connect your own API key for higher limits.',
            code: 'RATE_LIMITED',
          },
          { status: 429 }
        );
      }

      if (response.status === 404) {
        return NextResponse.json(
          { error: `Coin "${sanitizedCoinId}" not found`, code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'Provider error', status: response.status },
        { status: 502 }
      );
    }

    const rawData = await response.json();

    // Transform data for easier consumption
    // CoinGecko returns: [[timestamp, open, high, low, close], ...]
    const transformedData = rawData.map(
      (row: [number, number, number, number, number]) => ({
        timestamp: row[0],
        date: new Date(row[0]).toISOString(),
        open: row[1],
        high: row[2],
        low: row[3],
        close: row[4],
      })
    );

    // Log usage event (async, fire-and-forget)
    void (async () => {
      try {
        await supabase.from('usage_events').insert({
          user_id: user.id,
          event_type: 'api_ohlcv',
          metadata: {
            coinId: sanitizedCoinId,
            days,
            dataPoints: transformedData.length,
            usingProKey: usingProApi,
          },
        });
      } catch (err) {
        console.error('Failed to log usage:', err);
      }
    })();

    return NextResponse.json({
      data: transformedData,
      raw: rawData, // Include raw format for Excel functions
      meta: {
        coin: sanitizedCoinId,
        days,
        dataPoints: transformedData.length,
        provider: 'coingecko',
        usingProKey: usingProApi,
      },
    });
  } catch (err) {
    console.error('OHLCV fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch OHLCV data' },
      { status: 500 }
    );
  }
}
