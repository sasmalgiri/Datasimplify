import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';

export const dynamic = 'force-dynamic';

const VALID_REASONS = [
  'spam',
  'scam',
  'harassment',
  'hate',
  'copyright',
  'privacy',
  'misinformation',
  'other',
] as const;

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

    const supabase = await getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
    }

    const body = await request.json();
    const { threadId, replyId, reason, details } = body;

    if (!threadId && !replyId) {
      return NextResponse.json({ success: false, error: 'threadId or replyId is required' }, { status: 400 });
    }
    if (threadId && replyId) {
      return NextResponse.json({ success: false, error: 'Report exactly one target' }, { status: 400 });
    }
    if (!VALID_REASONS.includes(reason)) {
      return NextResponse.json({ success: false, error: 'Invalid reason' }, { status: 400 });
    }
    if (details && String(details).length > 2000) {
      return NextResponse.json({ success: false, error: 'Details too long' }, { status: 400 });
    }

    const payload = {
      reporter_user_id: user.id,
      thread_id: threadId ?? null,
      reply_id: replyId ?? null,
      reason,
      details: details?.trim() || null,
      status: 'open',
    };

    const { error } = await supabase.from('forum_reports').insert(payload);
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ success: false, error: 'You already reported this content' }, { status: 409 });
      }
      throw error;
    }

    return NextResponse.json({ success: true, message: 'Report submitted for moderator review.' });
  } catch (error) {
    console.error('Forum report error:', error);
    return NextResponse.json({ success: false, error: 'Failed to submit report' }, { status: 500 });
  }
}