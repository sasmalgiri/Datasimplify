import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { voteForumItem, pinForumThread } from '@/lib/supabaseData';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getAuthUser } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function supabaseRequiredResponse() {
  return NextResponse.json(
    { success: false, error: 'Community features require Supabase configuration.', code: 'SUPABASE_NOT_CONFIGURED' },
    { status: 503 }
  );
}

export async function POST(request: NextRequest) {
  if (!isFeatureEnabled('community')) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 404 });
  }
  if (!isSupabaseConfigured) return supabaseRequiredResponse();

  try {
    const { user, error: authError } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ success: false, error: authError || 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'vote': {
        const { threadId, replyId, voteType } = body;

        if (!voteType || !['like', 'dislike'].includes(voteType)) {
          return NextResponse.json({ success: false, error: 'Invalid voteType' }, { status: 400 });
        }
        if (!threadId && !replyId) {
          return NextResponse.json({ success: false, error: 'threadId or replyId required' }, { status: 400 });
        }

        const result = await voteForumItem({
          userId: user.id,
          threadId,
          replyId,
          voteType,
        });

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error }, { status: 500 });
        }

        return NextResponse.json({ success: true, source: 'supabase' });
      }

      case 'pin': {
        const userEmail = (user.email || '').toLowerCase();
        if (!ADMIN_EMAILS.includes(userEmail)) {
          return NextResponse.json({ success: false, error: 'Admin access required' }, { status: 403 });
        }

        const { threadId, pin } = body;
        if (!threadId || typeof pin !== 'boolean') {
          return NextResponse.json({ success: false, error: 'threadId and pin (boolean) required' }, { status: 400 });
        }

        const success = await pinForumThread(threadId, pin);
        if (!success) {
          return NextResponse.json({ success: false, error: 'Failed to pin thread' }, { status: 500 });
        }

        return NextResponse.json({ success: true, source: 'supabase' });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Forum interact error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
