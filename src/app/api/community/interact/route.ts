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
import { moderateContent } from '@/lib/moderation';

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

// GET - Get comments or check follow status
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (!isSupabaseConfigured) {
      return supabaseRequiredResponse();
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
      return supabaseRequiredResponse();
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

        const moderation = await moderateContent(String(content));
        if (moderation.blocked) {
          return NextResponse.json({
            success: false,
            error: moderation.reason || 'Comment violates community guidelines'
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
