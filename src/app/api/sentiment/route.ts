import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getFearGreedFromCache, saveFearGreedToCache } from '@/lib/supabaseData';

// Alternative.me Fear & Greed Index API (FREE)
const FEAR_GREED_API = 'https://api.alternative.me/fng/';

export async function GET() {
  try {
    // 1. Try cache first
    if (isSupabaseConfigured) {
      const cached = await getFearGreedFromCache();
      if (cached) {
        return NextResponse.json({
          value: cached.value,
          classification: cached.classification,
          timestamp: cached.recorded_at,
          source: 'cache',
        });
      }
    }

    // 2. Fetch from API
    const response = await fetch(FEAR_GREED_API, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 },
    });

    if (!response.ok) {
      console.error('Fear & Greed API error:', response.status);
      return NextResponse.json({ value: null, classification: 'Unknown' }, { status: response.status });
    }

    const result = await response.json();
    const data = result.data?.[0];

    if (!data) {
      return NextResponse.json({ value: 50, classification: 'Neutral' });
    }

    const fearGreedData = {
      value: parseInt(data.value),
      classification: data.value_classification,
    };

    // 3. Save to cache
    if (isSupabaseConfigured) {
      await saveFearGreedToCache(fearGreedData);
    }

    return NextResponse.json({
      value: fearGreedData.value,
      classification: fearGreedData.classification,
      timestamp: data.timestamp,
      time_until_update: data.time_until_update,
      source: 'alternative.me',
    });

  } catch (error) {
    console.error('Sentiment API error:', error);
    return NextResponse.json({ value: 50, classification: 'Neutral', error: 'Failed to fetch' });
  }
}
