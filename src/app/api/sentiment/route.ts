import { NextResponse } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getFearGreedFromCache, saveFearGreedToCache } from '@/lib/supabaseData';
import { externalApiError } from '@/lib/apiErrors';
import { assertRedistributionAllowed } from '@/lib/redistributionPolicy';

// Alternative.me Fear & Greed Index API (FREE)
const FEAR_GREED_API = 'https://api.alternative.me/fng/';

export async function GET() {
  try {
    assertRedistributionAllowed('alternativeme', { purpose: 'chart', route: '/api/sentiment' });

    // 1. Try cache first
    if (isSupabaseConfigured) {
      const cached = await getFearGreedFromCache();
      if (cached) {
        return NextResponse.json({
          success: true,
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

      // Return cached data if available, even if stale
      if (isSupabaseConfigured) {
        const staleCache = await getFearGreedFromCache();
        if (staleCache) {
          return NextResponse.json({
            success: true,
            value: staleCache.value,
            classification: staleCache.classification,
            timestamp: staleCache.recorded_at,
            source: 'stale-cache',
          });
        }
      }

      return externalApiError('Fear & Greed Index');
    }

    const result = await response.json();
    const data = result.data?.[0];

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: 'Fear & Greed API returned no data.',
          source: 'alternative.me',
        },
        { status: 502 }
      );
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
      success: true,
      value: fearGreedData.value,
      classification: fearGreedData.classification,
      timestamp: data.timestamp,
      time_until_update: data.time_until_update,
      source: 'alternative.me',
    });

  } catch (error) {
    console.error('Sentiment API error:', error);

    // Try to return cached data on error
    if (isSupabaseConfigured) {
      try {
        const staleCache = await getFearGreedFromCache();
        if (staleCache) {
          return NextResponse.json({
            success: true,
            value: staleCache.value,
            classification: staleCache.classification,
            timestamp: staleCache.recorded_at,
            source: 'stale-cache',
          });
        }
      } catch {
        // Ignore cache errors
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Unable to fetch Fear & Greed Index.',
      },
      { status: 502 }
    );
  }
}
