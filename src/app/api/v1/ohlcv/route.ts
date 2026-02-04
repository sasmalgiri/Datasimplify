/**
 * OHLCV Data Proxy Endpoint
 *
 * Fetches OHLC (Open, High, Low, Close, Volume) data from CoinGecko
 * using user's BYOK API key
 *
 * Supports both cookie-based auth (web) and Bearer token auth (Excel add-in)
 */

import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get('coin');
  const days = searchParams.get('days') || '30';

  if (!coinId) {
    return NextResponse.json({ error: 'coin parameter required' }, { status: 400 });
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

    // Fetch from CoinGecko - use correct endpoint based on key type
    const baseUrl = apiKey && keyType === 'pro'
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';

    const url = baseUrl + '/coins/' + coinId + '/ohlc?vs_currency=usd&days=' + days;

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

    const data = await response.json();

    // Log usage event
    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: 'api_ohlcv',
      metadata: { coinId, days, hasProKey: !!apiKey },
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('[OHLCV API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
