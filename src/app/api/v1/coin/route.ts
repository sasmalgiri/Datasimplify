/**
 * Coin Details Endpoint
 *
 * Fetches detailed coin data from CoinGecko
 * - ATH (All-Time High)
 * - ATL (All-Time Low)
 * - Circulating/Total/Max Supply
 * - Market Cap Rank
 * - Description, Links, etc.
 *
 * Supports both cookie-based auth (web) and Bearer token auth (Excel add-in)
 */

import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const coinId = searchParams.get('coin');

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
        console.error('[Coin API] Decryption error:', error);
      }
    }

    // Fetch from CoinGecko
    const baseUrl = apiKey && keyType === 'pro'
      ? 'https://pro-api.coingecko.com/api/v3'
      : 'https://api.coingecko.com/api/v3';

    const url = `${baseUrl}/coins/${coinId}?localization=false&tickers=false&community_data=false&developer_data=false`;

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
      event_type: 'api_coin_details',
      metadata: { coinId, hasProKey: !!apiKey },
    });

    // Return structured response
    return NextResponse.json({
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      rank: data.market_cap_rank,

      // Market data
      current_price: data.market_data?.current_price?.usd,
      market_cap: data.market_data?.market_cap?.usd,
      total_volume: data.market_data?.total_volume?.usd,

      // Price changes
      price_change_24h: data.market_data?.price_change_percentage_24h,
      price_change_7d: data.market_data?.price_change_percentage_7d,
      price_change_30d: data.market_data?.price_change_percentage_30d,
      price_change_1y: data.market_data?.price_change_percentage_1y,

      // ATH/ATL
      ath: data.market_data?.ath?.usd,
      ath_date: data.market_data?.ath_date?.usd,
      ath_change_percentage: data.market_data?.ath_change_percentage?.usd,
      atl: data.market_data?.atl?.usd,
      atl_date: data.market_data?.atl_date?.usd,
      atl_change_percentage: data.market_data?.atl_change_percentage?.usd,

      // Supply
      circulating_supply: data.market_data?.circulating_supply,
      total_supply: data.market_data?.total_supply,
      max_supply: data.market_data?.max_supply,

      // High/Low
      high_24h: data.market_data?.high_24h?.usd,
      low_24h: data.market_data?.low_24h?.usd,

      // Metadata
      description: data.description?.en?.slice(0, 500),
      homepage: data.links?.homepage?.[0],
      blockchain_site: data.links?.blockchain_site?.[0],
      genesis_date: data.genesis_date,
      last_updated: data.last_updated,
    });
  } catch (error) {
    console.error('[Coin API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
