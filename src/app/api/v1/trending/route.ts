/**
 * Trending Coins Endpoint
 *
 * Fetches trending coins from CoinGecko
 * Returns top trending coins by search popularity
 *
 * Supports both cookie-based auth (web) and Bearer token auth (Excel add-in)
 */

import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';

export async function GET(request: NextRequest) {
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

    // Get user's CoinGecko API key
    let apiKey: string | null = null;
    let keyType: string = 'demo';
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
        console.error('[Trending API] Decryption error:', error);
      }
    }

    // Fetch from CoinGecko
    const baseUrl = apiKey && keyType === 'pro'
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';

    const url = `${baseUrl}/search/trending`;

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
      return NextResponse.json(
        { error: 'Provider error', status: response.status },
        { status: 502 }
      );
    }

    const data = await response.json();

    // Log usage event
    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: 'api_trending',
      metadata: { hasProKey: !!apiKey },
    });

    // Simplify response - return just the coins
    const coins = data.coins?.map((item: { item: { id: string; name: string; symbol: string; market_cap_rank: number; price_btc: number; score: number } }) => ({
      id: item.item.id,
      name: item.item.name,
      symbol: item.item.symbol,
      rank: item.item.market_cap_rank,
      price_btc: item.item.price_btc,
      score: item.item.score,
    })) || [];

    return NextResponse.json({ coins });
  } catch (error) {
    console.error('[Trending API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
