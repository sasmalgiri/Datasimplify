import { NextResponse } from 'next/server';
import { fetchAllUnlocks, fetchCoinUnlocks, getUpcomingMajorUnlocks } from '@/lib/tokenUnlocks';
import { isFeatureEnabled } from '@/lib/featureFlags';

export const dynamic = 'force-dynamic';
export const revalidate = 600; // 10 minutes

export async function GET(request: Request) {
  if (!isFeatureEnabled('defi')) {
    return NextResponse.json(
      {
        success: false,
        error: 'Token unlocks are disabled.',
        reason: 'DeFi domain is not enabled for this deployment.',
      },
      { status: 403 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const coin = searchParams.get('coin');
    const upcoming = searchParams.get('upcoming');
    const days = parseInt(searchParams.get('days') || '7');

    if (coin) {
      // Fetch unlocks for specific coin
      const data = await fetchCoinUnlocks(coin);

      if (!data) {
        return NextResponse.json({
          success: true,
          data: null,
          message: `No unlock data found for ${coin}`
        });
      }

      return NextResponse.json({
        success: true,
        data
      });
    }

    if (upcoming === 'true') {
      // Fetch upcoming major unlocks
      const data = await getUpcomingMajorUnlocks(days);

      return NextResponse.json({
        success: true,
        data,
        count: data.length
      });
    }

    // Fetch all unlocks
    const data = await fetchAllUnlocks();

    return NextResponse.json({
      success: true,
      data,
      count: data.length
    });
  } catch (error) {
    console.error('Unlocks API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch unlock data',
        data: null
      },
      { status: 500 }
    );
  }
}
