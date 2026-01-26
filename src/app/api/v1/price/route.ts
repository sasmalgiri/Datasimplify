/**
 * Price Data Proxy Endpoint
 *
 * Fetches current price data from CoinGecko using user's BYOK API key
 * Falls back to free tier if no key provided
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get('coin');
  const currency = searchParams.get('currency') || 'usd';

  if (!coinId) {
    return NextResponse.json({ error: 'coin parameter required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try to get user's CoinGecko API key
    let apiKey: string | null = null;
    let keyType: string = 'demo';
    const { data: keyData } = await supabase
      .from('provider_keys')
      .select('encrypted_key, is_valid, key_type')
      .eq('user_id', user.id)
      .eq('provider', 'coingecko')
      .eq('is_valid', true)
      .single();

    if (keyData?.encrypted_key) {
      try {
        apiKey = decryptApiKey(keyData.encrypted_key);
        keyType = keyData.key_type || 'demo';
      } catch (error) {
        console.error('[Price API] Decryption error:', error);
        // Continue without key (use free tier)
      }
    }

    // Fetch from CoinGecko - use correct endpoint based on key type
    const baseUrl = apiKey && keyType === 'pro'
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';

    const url = baseUrl + '/simple/price?ids=' + coinId + '&vs_currencies=' + currency +
                '&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true';

    const headers: Record<string, string> = {};
    if (apiKey) {
      // Use correct header based on key type
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

    const data = await response.json();

    // Log usage event
    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: 'api_price',
      metadata: { coinId, currency, hasProKey: !!apiKey },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Price API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
