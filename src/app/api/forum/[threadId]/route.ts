import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  getForumThread,
  getForumReplies,
  createForumReply,
  incrementThreadViewCount,
} from '@/lib/supabaseData';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getAuthUser } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

function supabaseRequiredResponse() {
  return NextResponse.json(
    { success: false, error: 'Community features require Supabase configuration.', code: 'SUPABASE_NOT_CONFIGURED' },
    { status: 503 }
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  if (!isFeatureEnabled('community')) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 404 });
  }
  if (!isSupabaseConfigured) return supabaseRequiredResponse();

  try {
    const { threadId } = await params;
    const { searchParams } = new URL(request.url);
    const repliesLimit = parseInt(searchParams.get('repliesLimit') || '50');
    const repliesOffset = parseInt(searchParams.get('repliesOffset') || '0');

    const thread = await getForumThread(threadId);
    if (!thread) {
      return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
    }

    const replies = await getForumReplies(threadId, { limit: repliesLimit, offset: repliesOffset });

    // Fire-and-forget view count increment
    incrementThreadViewCount(threadId);

    return NextResponse.json({
      success: true,
      data: { thread, replies },
      source: 'supabase',
    });
  } catch (error) {
    console.error('Forum thread GET error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch thread' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  if (!isFeatureEnabled('community')) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 404 });
  }
  if (!isSupabaseConfigured) return supabaseRequiredResponse();

  try {
    const { user, error: authError } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: authError || 'Unauthorized' }, { status: 401 });
    }

    const { threadId } = await params;
    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'reply': {
        // Check thread exists and is not locked
        const thread = await getForumThread(threadId);
        if (!thread) {
          return NextResponse.json({ success: false, error: 'Thread not found' }, { status: 404 });
        }
        if (thread.is_locked) {
          return NextResponse.json({ success: false, error: 'Thread is locked' }, { status: 403 });
        }

        const replyBody = body.body;
        if (!replyBody || replyBody.length < 1 || replyBody.length > 5000) {
          return NextResponse.json({ success: false, error: 'Reply must be 1-5000 characters' }, { status: 400 });
        }

        const result = await createForumReply({
          threadId,
          userId: user.id,
          body: replyBody,
        });

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error || 'Failed to create reply' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: { id: result.id }, source: 'supabase' });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Forum thread POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
