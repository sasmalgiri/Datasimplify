/**
 * Gainers & Losers Endpoint
 *
 * Get top gainers and losers by 24h price change
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type') || 'gainers'; // gainers or losers
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

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
        console.error('[Gainers API] Decryption error:', error);
      }
    }

    const baseUrl = apiKey && keyType === 'pro'
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';

    // Fetch top 250 coins and sort by change
    const url = `${baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&price_change_percentage=24h`;

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
      event_type: 'api_gainers',
      metadata: { type, limit, hasProKey: !!apiKey },
    });

    // Sort by 24h change
    const sorted = data
      .filter((c: any) => c.price_change_percentage_24h !== null)
      .sort((a: any, b: any) => {
        if (type === 'losers') {
          return a.price_change_percentage_24h - b.price_change_percentage_24h;
        }
        return b.price_change_percentage_24h - a.price_change_percentage_24h;
      })
      .slice(0, limit);

    const coins = sorted.map((coin: any) => ({
      rank: coin.market_cap_rank,
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol?.toUpperCase(),
      price: coin.current_price,
      change_24h: coin.price_change_percentage_24h,
      market_cap: coin.market_cap,
      volume_24h: coin.total_volume,
    }));

    return NextResponse.json({ type, coins });
  } catch (error) {
    console.error('[Gainers API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
