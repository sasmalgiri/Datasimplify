/**
 * Holder Data Endpoint
 *
 * Fetches on-chain token holder data from GeckoTerminal API
 * Includes holder count, distribution percentages, and security scores
 *
 * Supports both cookie-based auth (web) and Bearer token auth (API clients)
 */

import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';

// GeckoTerminal network IDs mapping
const NETWORK_MAP: Record<string, string> = {
  'eth': 'eth',
  'ethereum': 'eth',
  'bsc': 'bsc',
  'binance': 'bsc',
  'polygon': 'polygon_pos',
  'matic': 'polygon_pos',
  'solana': 'solana',
  'sol': 'solana',
  'arbitrum': 'arbitrum',
  'arb': 'arbitrum',
  'base': 'base',
  'avalanche': 'avax',
  'avax': 'avax',
  'optimism': 'optimism',
  'op': 'optimism',
  'fantom': 'ftm',
  'ftm': 'ftm',
  'sui': 'sui',
  'ton': 'ton',
  'ronin': 'ronin',
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const network = searchParams.get('network')?.toLowerCase();
  const address = searchParams.get('address');

  if (!network) {
    return NextResponse.json({ error: 'network parameter required' }, { status: 400 });
  }

  if (!address) {
    return NextResponse.json({ error: 'address parameter required' }, { status: 400 });
  }

  // Map network alias to GeckoTerminal network ID
  const geckoNetwork = NETWORK_MAP[network] || network;

  try {
    // Support both cookie auth (web) and Bearer token (API clients)
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
        console.error('[Holders API] Decryption error:', error);
        // Continue without key (use free tier)
      }
    }

    // GeckoTerminal API - Token Info endpoint (FREE - no API key needed)
    // This endpoint provides holder count and distribution data
    const geckoTerminalUrl = `https://api.geckoterminal.com/api/v2/networks/${geckoNetwork}/tokens/${address}/info`;

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    // Note: GeckoTerminal is free, but we can add CoinGecko key for higher limits if needed
    if (apiKey && keyType === 'pro') {
      // CoinGecko pro key might work for GeckoTerminal pro features
      headers['x-cg-pro-api-key'] = apiKey;
    }

    const response = await fetch(geckoTerminalUrl, { headers });

    if (!response.ok) {
      // If network/address not found
      if (response.status === 404) {
        return NextResponse.json(
          { error: 'Token not found on this network', network: geckoNetwork, address },
          { status: 404 }
        );
      }

      return NextResponse.json(
        { error: 'GeckoTerminal API error', status: response.status },
        { status: 502 }
      );
    }

    const rawData = await response.json();
    const tokenData = rawData.data?.attributes;

    if (!tokenData) {
      return NextResponse.json(
        { error: 'Invalid token data received' },
        { status: 502 }
      );
    }

    // Parse holder distribution from GeckoTerminal response
    // GeckoTerminal provides: gt_score, holder_count, and distribution percentages
    const result = {
      name: tokenData.name || null,
      symbol: tokenData.symbol || null,
      address: address,
      network: geckoNetwork,
      holders: tokenData.holders ?? tokenData.holder_count ?? null,
      distribution: {
        top_10_percentage: tokenData.top_10_holder_percentage ?? null,
        top_25_percentage: tokenData.top_25_holder_percentage ?? null,
        top_50_percentage: tokenData.top_50_holder_percentage ?? null,
        rest_percentage: tokenData.top_50_holder_percentage
          ? (100 - tokenData.top_50_holder_percentage)
          : null,
      },
      scores: {
        total_score: tokenData.gt_score ?? null,
        pool_score: tokenData.gt_pool_score ?? null,
        transaction_score: tokenData.gt_tx_score ?? null,
        holders_score: tokenData.gt_holders_score ?? null,
      },
      // Additional token info
      description: tokenData.description ?? null,
      image_url: tokenData.image_url ?? null,
      websites: tokenData.websites ?? [],
      coingecko_coin_id: tokenData.coingecko_coin_id ?? null,
    };

    // Log usage event
    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: 'api_holders',
      metadata: { network: geckoNetwork, address, hasProKey: !!apiKey },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Holders API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
