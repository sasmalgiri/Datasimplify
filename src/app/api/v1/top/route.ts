/**
 * Top Coins Endpoint
 *
 * Get top N coins by market cap
 * Returns coin list with price, market cap, and 24h change
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 250);
  const page = parseInt(searchParams.get('page') || '1');
  const currency = searchParams.get('currency') || 'usd';

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
        console.error('[Top API] Decryption error:', error);
      }
    }

    // Fetch from CoinGecko
    const baseUrl = apiKey && keyType === 'pro'
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';

    const url = `${baseUrl}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=${page}&sparkline=false&price_change_percentage=24h,7d`;

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
      event_type: 'api_top',
      metadata: { limit, page, currency, hasProKey: !!apiKey },
    });

    // Return coin data
    const coins = data.map((coin: any) => ({
      rank: coin.market_cap_rank,
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol?.toUpperCase(),
      price: coin.current_price,
      market_cap: coin.market_cap,
      volume_24h: coin.total_volume,
      change_24h: coin.price_change_percentage_24h,
      change_7d: coin.price_change_percentage_7d_in_currency,
      high_24h: coin.high_24h,
      low_24h: coin.low_24h,
      ath: coin.ath,
      circulating_supply: coin.circulating_supply,
    }));

    return NextResponse.json({ coins, page, limit, currency });
  } catch (error) {
    console.error('[Top API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
