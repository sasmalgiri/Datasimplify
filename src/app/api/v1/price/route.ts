/**
 * Price Data Proxy API
 *
 * Proxies price requests to data providers using the user's own API keys (BYOK)
 * Falls back to free tier if no key is configured
 *
 * GET /api/v1/price?coin=bitcoin&currency=usd
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';
import {
  checkEntitlement,
  createEntitlementErrorResponse,
} from '@/lib/entitlements';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get('coin');
  const currency = searchParams.get('currency') || 'usd';
  const includeChange = searchParams.get('include_change') !== 'false';
  const includeMarketCap = searchParams.get('include_market_cap') !== 'false';

  // Validate parameters
  if (!coinId) {
    return NextResponse.json(
      { error: 'coin parameter is required' },
      { status: 400 }
    );
  }

  // Sanitize coin ID (prevent injection)
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

  // Check entitlement
  const entitlementCheck = await checkEntitlement(supabase, user.id);
  if (!entitlementCheck.allowed) {
    return NextResponse.json(
      createEntitlementErrorResponse(entitlementCheck),
      { status: entitlementCheck.status || 403 }
    );
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
      // Mark key as invalid
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

  const params = new URLSearchParams({
    ids: sanitizedCoinId,
    vs_currencies: currency,
  });

  if (includeChange) {
    params.append('include_24hr_change', 'true');
  }
  if (includeMarketCap) {
    params.append('include_market_cap', 'true');
  }

  const url = `${baseUrl}/simple/price?${params.toString()}`;

  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  if (apiKey) {
    headers['x-cg-pro-api-key'] = apiKey;
  }

  try {
    const response = await fetch(url, {
      headers,
      next: { revalidate: 30 }, // Cache for 30 seconds
    });

    if (!response.ok) {
      // If Pro API fails with user's key, mark it as potentially invalid
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

      // Rate limit or other provider error
      if (response.status === 429) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded. Connect your own API key for higher limits.',
            code: 'RATE_LIMITED',
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { error: 'Provider error', status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Log usage event (async, fire-and-forget)
    void (async () => {
      try {
        await supabase.from('usage_events').insert({
          user_id: user.id,
          event_type: 'api_price',
          metadata: {
            coinId: sanitizedCoinId,
            currency,
            usingProKey: usingProApi,
          },
        });
      } catch (err) {
        console.error('Failed to log usage:', err);
      }
    })();

    // Return data with metadata
    return NextResponse.json({
      data,
      meta: {
        provider: 'coingecko',
        usingProKey: usingProApi,
        cached: false,
      },
    });
  } catch (err) {
    console.error('Price fetch error:', err);
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    );
  }
}
