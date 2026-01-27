/**
 * Categories Endpoint
 *
 * Get coin categories or coins in a specific category
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');

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
        console.error('[Categories API] Decryption error:', error);
      }
    }

    // Fetch from CoinGecko
    const baseUrl = apiKey && keyType === 'pro'
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';

    const headers: Record<string, string> = {};
    if (apiKey) {
      if (keyType === 'pro') {
        headers['x-cg-pro-api-key'] = apiKey;
      } else {
        headers['x-cg-demo-api-key'] = apiKey;
      }
    }

    if (category) {
      // Get coins in specific category
      const url = `${baseUrl}/coins/markets?vs_currency=usd&category=${encodeURIComponent(category)}&order=market_cap_desc&per_page=100&page=1`;
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
        event_type: 'api_category_coins',
        metadata: { category, hasProKey: !!apiKey },
      });

      const coins = data.map((coin: any) => ({
        rank: coin.market_cap_rank,
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol?.toUpperCase(),
        price: coin.current_price,
        market_cap: coin.market_cap,
        change_24h: coin.price_change_percentage_24h,
      }));

      return NextResponse.json({ category, coins });
    } else {
      // Get list of categories
      const url = `${baseUrl}/coins/categories`;
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
        event_type: 'api_categories_list',
        metadata: { hasProKey: !!apiKey },
      });

      const categories = data.map((cat: any) => ({
        id: cat.id,
        name: cat.name,
        market_cap: cat.market_cap,
        market_cap_change_24h: cat.market_cap_change_24h,
        volume_24h: cat.volume_24h,
        top_coins: cat.top_3_coins,
      }));

      return NextResponse.json({ categories });
    }
  } catch (error) {
    console.error('[Categories API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
