/**
 * Stablecoins Endpoint
 *
 * Get stablecoin market cap and circulation data from DeFi Llama
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // DeFi Llama stablecoins endpoint (free)
    const url = 'https://stablecoins.llama.fi/stablecoins?includePrices=true';
    const response = await fetch(url);

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
      event_type: 'api_stablecoins',
      metadata: { limit },
    });

    // Sort by market cap
    const sorted = data.peggedAssets
      .sort((a: any, b: any) => (b.circulating?.peggedUSD || 0) - (a.circulating?.peggedUSD || 0))
      .slice(0, limit);

    const stablecoins = sorted.map((s: any, i: number) => ({
      rank: i + 1,
      id: s.id,
      name: s.name,
      symbol: s.symbol,
      peg_type: s.pegType,
      peg_mechanism: s.pegMechanism,
      circulating: s.circulating?.peggedUSD,
      price: s.price,
      chains: s.chains?.slice(0, 5),
    }));

    return NextResponse.json({ stablecoins });
  } catch (error) {
    console.error('[Stablecoins API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
