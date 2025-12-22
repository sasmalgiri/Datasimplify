import { NextResponse } from 'next/server';
import {
  votePrediction,
  addPredictionComment,
  getPredictionComments,
  toggleFollowUser,
  isFollowing,
  getUserPredictionStats,
  updateUserPredictionProfile,
} from '@/lib/supabaseData';
import { isSupabaseConfigured } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

// GET - Get comments or check follow status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        data: getMockInteractionData(action, searchParams),
        source: 'mock'
      });
    }

    switch (action) {
      case 'comments': {
        const predictionId = searchParams.get('predictionId');
        if (!predictionId) {
          return NextResponse.json({
            success: false,
            error: 'Missing predictionId'
          }, { status: 400 });
        }

        const comments = await getPredictionComments(predictionId);
        return NextResponse.json({
          success: true,
          data: comments,
          source: 'supabase'
        });
      }

      case 'is_following': {
        const followerId = searchParams.get('followerId');
        const followingId = searchParams.get('followingId');

        if (!followerId || !followingId) {
          return NextResponse.json({
            success: false,
            error: 'Missing followerId or followingId'
          }, { status: 400 });
        }

        const following = await isFollowing(followerId, followingId);
        return NextResponse.json({
          success: true,
          data: { isFollowing: following },
          source: 'supabase'
        });
      }

      case 'user_stats': {
        const userId = searchParams.get('userId');
        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'Missing userId'
          }, { status: 400 });
        }

        const stats = await getUserPredictionStats(userId);
        return NextResponse.json({
          success: true,
          data: stats,
          source: 'supabase'
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: comments, is_following, user_stats'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Community interact GET error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch data'
    }, { status: 500 });
  }
}

// POST - Vote, comment, follow
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    if (!isSupabaseConfigured) {
      return NextResponse.json({
        success: true,
        data: { message: `${action} processed (mock mode)` },
        source: 'mock'
      });
    }

    switch (action) {
      case 'vote': {
        const { predictionId, userId, voteType } = body;

        if (!predictionId || !userId || !voteType) {
          return NextResponse.json({
            success: false,
            error: 'Missing required fields: predictionId, userId, voteType'
          }, { status: 400 });
        }

        if (!['like', 'dislike'].includes(voteType)) {
          return NextResponse.json({
            success: false,
            error: 'voteType must be "like" or "dislike"'
          }, { status: 400 });
        }

        const result = await votePrediction(predictionId, userId, voteType);
        return NextResponse.json({
          success: result.success,
          error: result.error,
          source: 'supabase'
        });
      }

      case 'comment': {
        const { predictionId, userId, content } = body;

        if (!predictionId || !userId || !content) {
          return NextResponse.json({
            success: false,
            error: 'Missing required fields: predictionId, userId, content'
          }, { status: 400 });
        }

        if (content.length > 1000) {
          return NextResponse.json({
            success: false,
            error: 'Comment too long (max 1000 characters)'
          }, { status: 400 });
        }

        const result = await addPredictionComment(predictionId, userId, content);
        return NextResponse.json({
          success: result.success,
          data: result.id ? { id: result.id } : undefined,
          error: result.error,
          source: 'supabase'
        });
      }

      case 'follow': {
        const { followerId, followingId } = body;

        if (!followerId || !followingId) {
          return NextResponse.json({
            success: false,
            error: 'Missing required fields: followerId, followingId'
          }, { status: 400 });
        }

        if (followerId === followingId) {
          return NextResponse.json({
            success: false,
            error: 'Cannot follow yourself'
          }, { status: 400 });
        }

        const result = await toggleFollowUser(followerId, followingId);
        return NextResponse.json({
          success: result.success,
          data: { isFollowing: result.isFollowing },
          source: 'supabase'
        });
      }

      case 'update_profile': {
        const { userId, displayName, avatarEmoji } = body;

        if (!userId) {
          return NextResponse.json({
            success: false,
            error: 'Missing userId'
          }, { status: 400 });
        }

        const success = await updateUserPredictionProfile(userId, { displayName, avatarEmoji });
        return NextResponse.json({
          success,
          source: 'supabase'
        });
      }

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: vote, comment, follow, update_profile'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Community interact POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process request'
    }, { status: 500 });
  }
}

function getMockInteractionData(action: string | null, searchParams: URLSearchParams) {
  switch (action) {
    case 'comments':
      return [
        {
          id: 'comment-1',
          prediction_id: searchParams.get('predictionId'),
          user_id: 'user-1',
          content: 'Great analysis! I agree with this prediction.',
          likes: 12,
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'user-1',
            user_id: 'user-1',
            display_name: 'CryptoFan',
            avatar_emoji: '🚀',
            accuracy: 65,
            rank: 15
          }
        },
        {
          id: 'comment-2',
          prediction_id: searchParams.get('predictionId'),
          user_id: 'user-2',
          content: 'Interesting take. The on-chain data supports this.',
          likes: 8,
          created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          user: {
            id: 'user-2',
            user_id: 'user-2',
            display_name: 'OnChainPro',
            avatar_emoji: '🔗',
            accuracy: 72,
            rank: 8
          }
        }
      ];

    case 'is_following':
      return { isFollowing: Math.random() > 0.5 };

    case 'user_stats':
      return {
        id: 'user-mock',
        user_id: searchParams.get('userId'),
        display_name: 'MockUser',
        avatar_emoji: '🎯',
        total_predictions: 45,
        correct_predictions: 28,
        accuracy: 62.2,
        current_streak: 3,
        best_streak: 8,
        points: 1250,
        rank: 42,
        badges: ['early_adopter'],
        followers: 156,
        following: 89,
        is_verified: false,
        created_at: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString()
      };

    default:
      return null;
  }
}
