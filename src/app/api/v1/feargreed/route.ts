/**
 * Fear & Greed Index Endpoint
 *
 * Fetches the Crypto Fear & Greed Index from Alternative.me
 * Returns current value (0-100) and classification
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = searchParams.get('limit') || '1';

  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch from Alternative.me (free, no API key needed)
    const url = `https://api.alternative.me/fng/?limit=${limit}`;
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
      event_type: 'api_feargreed',
      metadata: { limit },
    });

    // Return simplified response
    if (data.data && data.data.length > 0) {
      const current = data.data[0];
      return NextResponse.json({
        value: parseInt(current.value),
        classification: current.value_classification,
        timestamp: current.timestamp,
        history: data.data,
      });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('[Fear&Greed API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
