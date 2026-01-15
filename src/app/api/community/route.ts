import { NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  getCommunityPredictions,
  createCommunityPrediction,
  getCommunityStats,
  getLeaderboard,
  getActiveContests,
  getTrendingCoinsByCommunity,
} from '@/lib/supabaseData';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function supabaseRequiredResponse() {
  return NextResponse.json(
    {
      success: false,
      error: 'Community features require Supabase configuration.',
      code: 'SUPABASE_NOT_CONFIGURED',
    },
    { status: 503 }
  );
}

// GET - Fetch community predictions, stats, leaderboard, etc.
export async function GET(request: Request) {
  if (!isFeatureEnabled('community')) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 404 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'predictions';

    if (!isSupabaseConfigured) {
      return supabaseRequiredResponse();
    }

    switch (action) {
      case 'predictions': {
        const coinId = searchParams.get('coinId') || undefined;
        const prediction = searchParams.get('prediction') as 'BULLISH' | 'BEARISH' | 'NEUTRAL' | undefined;
        const userId = searchParams.get('userId') || undefined;
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');

        const predictions = await getCommunityPredictions({
          coinId,
          prediction,
          userId,
          limit,
          offset
        });

        return NextResponse.json({
          success: true,
          data: predictions,
          count: predictions.length,
          source: 'supabase'
        });
      }

      case 'stats': {
        const stats = await getCommunityStats();
        return NextResponse.json({
          success: true,
          data: stats,
          source: 'supabase'
        });
      }

      case 'leaderboard': {
        const limit = parseInt(searchParams.get('limit') || '50');
        const sortBy = searchParams.get('sortBy') as 'points' | 'accuracy' | 'predictions' || 'points';

        const leaderboard = await getLeaderboard({ limit, sortBy });
        return NextResponse.json({
          success: true,
          data: leaderboard,
          source: 'supabase'
        });
      }

      case 'contests': {
        const contests = await getActiveContests();
        return NextResponse.json({
          success: true,
          data: contests,
          source: 'supabase'
        });
      }

      case 'trending': {
        const limit = parseInt(searchParams.get('limit') || '10');
        const trending = await getTrendingCoinsByCommunity(limit);
        return NextResponse.json({
          success: true,
          data: trending,
          source: 'supabase'
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Community API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch community data'
    }, { status: 500 });
  }
}

// POST - Create new prediction
export async function POST(request: Request) {
  // Community feature is disabled in paddle_safe mode
  if (!isFeatureEnabled('community')) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (!isSupabaseConfigured) {
      return supabaseRequiredResponse();
    }

    switch (action) {
      case 'create_prediction': {
        const { userId, coinId, coinSymbol, coinName, prediction, targetPrice, currentPrice, timeframe, confidence, reasoning } = body;

        if (!userId || !coinId || !coinSymbol || !prediction || !timeframe || confidence === undefined) {
          return NextResponse.json({
            success: false,
            error: 'Missing required fields: userId, coinId, coinSymbol, prediction, timeframe, confidence'
          }, { status: 400 });
        }

        const result = await createCommunityPrediction({
          userId,
          coinId,
          coinSymbol,
          coinName: coinName || coinSymbol,
          prediction,
          targetPrice,
          currentPrice,
          timeframe,
          confidence,
          reasoning
        });

        if (!result.success) {
          return NextResponse.json({
            success: false,
            error: result.error || 'Failed to create prediction'
          }, { status: 500 });
        }

        return NextResponse.json({
          success: true,
          data: { id: result.id },
          source: 'supabase'
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: create_prediction'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Community POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
}
