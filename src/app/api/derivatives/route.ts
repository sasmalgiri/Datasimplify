import { NextResponse } from 'next/server';
import { fetchDerivativesData, getFundingInterpretation } from '@/lib/derivativesData';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getDerivativesFromCache, saveDerivativesToCache } from '@/lib/supabaseData';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // 1 minute

export async function GET() {
  try {
    // 1. Try cache first for BTC (main coin)
    if (isSupabaseConfigured) {
      const cached = await getDerivativesFromCache('BTCUSDT');
      if (cached) {
        // Build response from cache
        const cachedData = {
          btc: {
            symbol: 'BTC',
            openInterest: cached.open_interest,
            openInterestChange24h: cached.open_interest_change_24h,
            fundingRate: cached.funding_rate,
            longShortRatio: cached.long_short_ratio,
            volume24h: cached.volume_24h
          },
          eth: {
            symbol: 'ETH',
            openInterest: null,
            openInterestChange24h: null,
            fundingRate: null,
            longShortRatio: null,
            volume24h: null
          },
          totalOpenInterest: cached.open_interest,
          totalLiquidations24h: cached.liquidations_24h,
          aggregatedFundingRate: cached.funding_rate,
          fundingHeatLevel: (cached.funding_rate > 0.05 ? 'extreme_long' :
                           cached.funding_rate > 0.02 ? 'bullish' :
                           cached.funding_rate < -0.05 ? 'extreme_short' :
                           cached.funding_rate < -0.02 ? 'bearish' : 'neutral') as 'extreme_long' | 'bullish' | 'neutral' | 'bearish' | 'extreme_short',
          liquidations: [],
          lastUpdated: cached.updated_at,
          source: 'cache'
        };
        const interpretation = getFundingInterpretation(cachedData);
        return NextResponse.json({
          success: true,
          data: { ...cachedData, interpretation }
        });
      }
    }

    // 2. Fetch from external API
    const data = await fetchDerivativesData();
    const interpretation = getFundingInterpretation(data);

    // 3. Save to cache
    if (isSupabaseConfigured && data.btc) {
      await saveDerivativesToCache({
        symbol: 'BTCUSDT',
        openInterest: data.btc.openInterest || 0,
        openInterestChange24h: data.btc.openInterestChange24h || 0,
        fundingRate: data.btc.fundingRate || 0,
        longShortRatio: data.btc.longShortRatio || 0,
        volume24h: data.btc.volume24h || 0,
        liquidations24h: data.totalLiquidations24h || 0
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        ...data,
        interpretation,
        source: 'api'
      }
    });
  } catch (error) {
    console.error('Derivatives API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch derivatives data',
        data: null
      },
      { status: 500 }
    );
  }
}
