/**
 * Coin Search Endpoint
 *
 * Search for coins by name or symbol
 * Returns coin IDs that can be used with other functions
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('query') || searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'query parameter required' }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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
        console.error('[Search API] Decryption error:', error);
      }
    }

    // Fetch from CoinGecko
    const baseUrl = apiKey && keyType === 'pro'
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';

    const url = `${baseUrl}/search?query=${encodeURIComponent(query)}`;

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
      event_type: 'api_search',
      metadata: { query, hasProKey: !!apiKey },
    });

    // Return simplified coin list
    const coins = data.coins?.slice(0, 20).map((coin: any) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      rank: coin.market_cap_rank,
      thumb: coin.thumb,
    })) || [];

    return NextResponse.json({ coins });
  } catch (error) {
    console.error('[Search API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
