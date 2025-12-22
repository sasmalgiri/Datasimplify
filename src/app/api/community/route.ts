import { NextResponse } from 'next/server';
import {
  getCommunityPredictions,
  createCommunityPrediction,
  getCommunityStats,
  getLeaderboard,
  getActiveContests,
  getTrendingCoinsByCommunity,
  type CommunityPrediction,
  type UserPredictionStats,
} from '@/lib/supabaseData';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Fetch community predictions, stats, leaderboard, etc.
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'predictions';

    if (!isSupabaseConfigured) {
      // Return mock data for demo when Supabase not configured
      return NextResponse.json({
        success: true,
        data: getMockData(action, searchParams),
        source: 'mock'
      });
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
  try {
    const body = await request.json();
    const { action } = body;

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        data: { id: 'mock-' + Date.now() },
        message: 'Prediction created (mock mode)',
        source: 'mock'
      });
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

// Mock data generator for demo mode
function getMockData(action: string, searchParams: URLSearchParams) {
  switch (action) {
    case 'predictions':
      return generateMockPredictions(parseInt(searchParams.get('limit') || '20'));
    case 'stats':
      return generateMockStats();
    case 'leaderboard':
      return generateMockLeaderboard(parseInt(searchParams.get('limit') || '50'));
    case 'contests':
      return generateMockContests();
    case 'trending':
      return generateMockTrending();
    default:
      return null;
  }
}

function generateMockPredictions(limit: number): CommunityPrediction[] {
  const coins = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin' },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum' },
    { id: 'solana', symbol: 'SOL', name: 'Solana' },
    { id: 'cardano', symbol: 'ADA', name: 'Cardano' },
    { id: 'polkadot', symbol: 'DOT', name: 'Polkadot' },
    { id: 'avalanche-2', symbol: 'AVAX', name: 'Avalanche' },
    { id: 'chainlink', symbol: 'LINK', name: 'Chainlink' },
    { id: 'polygon', symbol: 'MATIC', name: 'Polygon' },
  ];

  const users = [
    { id: '1', display_name: 'CryptoWhale', avatar_emoji: '🐋', accuracy: 78, points: 2450, rank: 1 },
    { id: '2', display_name: 'BitcoinMaxi', avatar_emoji: '₿', accuracy: 75, points: 2100, rank: 2 },
    { id: '3', display_name: 'DeFiDegen', avatar_emoji: '🦄', accuracy: 72, points: 1890, rank: 3 },
    { id: '4', display_name: 'AltSeason', avatar_emoji: '🚀', accuracy: 70, points: 1650, rank: 5 },
    { id: '5', display_name: 'ChartMaster', avatar_emoji: '📊', accuracy: 68, points: 1420, rank: 8 },
  ];

  const predictions: ('BULLISH' | 'BEARISH' | 'NEUTRAL')[] = ['BULLISH', 'BEARISH', 'NEUTRAL'];
  const timeframes: ('24h' | '7d' | '30d')[] = ['24h', '7d', '30d'];
  const outcomes: ('pending' | 'correct' | 'incorrect')[] = ['pending', 'correct', 'incorrect'];

  const reasonings = [
    'Strong support level holding, expecting bounce',
    'Breaking out of accumulation zone with increasing volume',
    'RSI oversold, due for a reversal',
    'Whale accumulation detected on-chain',
    'Technical indicators showing bullish divergence',
    'Market sentiment turning positive',
    'Key resistance broken, expecting continuation',
    'Forming higher lows on the daily chart',
  ];

  return Array.from({ length: limit }, (_, i) => {
    const coin = coins[Math.floor(Math.random() * coins.length)];
    const user = users[Math.floor(Math.random() * users.length)];
    const prediction = predictions[Math.floor(Math.random() * predictions.length)];
    const timeframe = timeframes[Math.floor(Math.random() * timeframes.length)];
    const outcome = Math.random() > 0.3 ? 'pending' : outcomes[Math.floor(Math.random() * outcomes.length)];

    const hoursAgo = Math.floor(Math.random() * 72);
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    return {
      id: `pred-${i + 1}`,
      user_id: user.id,
      coin_id: coin.id,
      coin_symbol: coin.symbol,
      coin_name: coin.name,
      prediction,
      target_price: prediction === 'BULLISH' ? Math.random() * 10000 + 50000 : Math.random() * 5000 + 40000,
      current_price: 50000 + Math.random() * 5000,
      timeframe,
      confidence: Math.floor(Math.random() * 40) + 60,
      reasoning: reasonings[Math.floor(Math.random() * reasonings.length)],
      outcome,
      likes: Math.floor(Math.random() * 50),
      dislikes: Math.floor(Math.random() * 10),
      comments_count: Math.floor(Math.random() * 20),
      expires_at: new Date(createdAt.getTime() + (timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720) * 60 * 60 * 1000).toISOString(),
      created_at: createdAt.toISOString(),
      user: {
        id: user.id,
        user_id: user.id,
        display_name: user.display_name,
        avatar_emoji: user.avatar_emoji,
        total_predictions: Math.floor(Math.random() * 100) + 20,
        correct_predictions: Math.floor(Math.random() * 50) + 10,
        accuracy: user.accuracy,
        current_streak: Math.floor(Math.random() * 10),
        best_streak: Math.floor(Math.random() * 15) + 5,
        points: user.points,
        rank: user.rank,
        badges: ['early_adopter', 'streak_master'],
        followers: Math.floor(Math.random() * 500),
        following: Math.floor(Math.random() * 100),
        is_verified: Math.random() > 0.7,
        created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      }
    };
  });
}

function generateMockStats() {
  return {
    total_predictions: 15847,
    active_predictors: 1243,
    bullish_percent: 58,
    bearish_percent: 28,
    neutral_percent: 14,
    avg_accuracy: 62.5
  };
}

function generateMockLeaderboard(limit: number): UserPredictionStats[] {
  const names = [
    'CryptoWhale', 'BitcoinMaxi', 'DeFiDegen', 'AltSeason', 'ChartMaster',
    'HODLer4Life', 'TradingBot', 'MoonShot', 'DiamondHands', 'WhaleWatcher',
    'CryptoSage', 'BlockchainBro', 'TokenTrader', 'SatoshiFan', 'EthEnthusiast'
  ];
  const emojis = ['🐋', '₿', '🦄', '🚀', '📊', '💎', '🤖', '🌙', '💪', '👀', '🧙', '🔗', '💰', '⚡', '🔷'];

  return Array.from({ length: Math.min(limit, names.length) }, (_, i) => ({
    id: `user-${i + 1}`,
    user_id: `user-${i + 1}`,
    display_name: names[i],
    avatar_emoji: emojis[i],
    total_predictions: Math.floor(Math.random() * 200) + 50,
    correct_predictions: Math.floor(Math.random() * 100) + 30,
    accuracy: Math.round((85 - i * 2 + Math.random() * 5) * 10) / 10,
    current_streak: Math.floor(Math.random() * 15),
    best_streak: Math.floor(Math.random() * 20) + 5,
    points: Math.floor(3000 - i * 150 + Math.random() * 100),
    rank: i + 1,
    badges: i < 3 ? ['top_predictor', 'streak_master', 'early_adopter'] : ['early_adopter'],
    followers: Math.floor(Math.random() * 1000) + 100,
    following: Math.floor(Math.random() * 200),
    is_verified: i < 5,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
  }));
}

function generateMockContests() {
  const now = new Date();
  return [
    {
      id: 'contest-1',
      title: 'Weekly Prediction Challenge',
      description: 'Make the most accurate predictions this week to win!',
      contest_type: 'weekly',
      prize: '500 USDT',
      prize_amount: 500,
      min_predictions: 5,
      starts_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      ends_at: new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      participants_count: 234
    },
    {
      id: 'contest-2',
      title: 'Bitcoin Price Prediction Contest',
      description: 'Predict BTC price movement for December',
      contest_type: 'monthly',
      prize: '2000 USDT',
      prize_amount: 2000,
      min_predictions: 10,
      starts_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      ends_at: new Date(now.getTime() + 9 * 24 * 60 * 60 * 1000).toISOString(),
      status: 'active',
      participants_count: 567
    }
  ];
}

function generateMockTrending() {
  return [
    { coin_id: 'bitcoin', coin_symbol: 'BTC', coin_name: 'Bitcoin', predictions_count: 145, bullish_percent: 72 },
    { coin_id: 'ethereum', coin_symbol: 'ETH', coin_name: 'Ethereum', predictions_count: 98, bullish_percent: 65 },
    { coin_id: 'solana', coin_symbol: 'SOL', coin_name: 'Solana', predictions_count: 67, bullish_percent: 78 },
    { coin_id: 'cardano', coin_symbol: 'ADA', coin_name: 'Cardano', predictions_count: 45, bullish_percent: 55 },
    { coin_id: 'avalanche-2', coin_symbol: 'AVAX', coin_name: 'Avalanche', predictions_count: 38, bullish_percent: 68 },
  ];
}
