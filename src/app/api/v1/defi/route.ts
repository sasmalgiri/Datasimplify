/**
 * DeFi TVL Endpoint
 *
 * Get DeFi protocol TVL data from DeFi Llama (free, no API key needed)
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const protocol = searchParams.get('protocol');
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (protocol) {
      // Get specific protocol
      const url = `https://api.llama.fi/protocol/${protocol}`;
      const response = await fetch(url);

      if (!response.ok) {
        return NextResponse.json(
          { error: 'Protocol not found', status: response.status },
          { status: 404 }
        );
      }

      const data = await response.json();

      // Log usage event
      await supabase.from('usage_events').insert({
        user_id: user.id,
        event_type: 'api_defi_protocol',
        metadata: { protocol },
      });

      return NextResponse.json({
        id: data.id,
        name: data.name,
        symbol: data.symbol,
        chain: data.chain,
        tvl: data.tvl,
        change_1h: data.change_1h,
        change_1d: data.change_1d,
        change_7d: data.change_7d,
        category: data.category,
        chains: data.chains,
        mcap: data.mcap,
      });
    } else {
      // Get all protocols
      const url = 'https://api.llama.fi/protocols';
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
        event_type: 'api_defi_list',
        metadata: { limit },
      });

      // Sort by TVL and limit
      const sorted = data
        .sort((a: any, b: any) => (b.tvl || 0) - (a.tvl || 0))
        .slice(0, limit);

      const protocols = sorted.map((p: any, i: number) => ({
        rank: i + 1,
        id: p.slug,
        name: p.name,
        symbol: p.symbol,
        tvl: p.tvl,
        change_1d: p.change_1d,
        change_7d: p.change_7d,
        category: p.category,
        chains: p.chains?.slice(0, 5),
        mcap: p.mcap,
      }));

      return NextResponse.json({ protocols });
    }
  } catch (error) {
    console.error('[DeFi API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
