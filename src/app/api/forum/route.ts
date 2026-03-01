import { NextRequest, NextResponse } from 'next/server';
import { isFeatureEnabled } from '@/lib/featureFlags';
import {
  getForumThreads,
  getForumCategorySummaries,
  createForumThread,
} from '@/lib/supabaseData';
import { isSupabaseConfigured } from '@/lib/supabase';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { VALID_CATEGORY_IDS } from '@/lib/forumCategories';

export const dynamic = 'force-dynamic';

function supabaseRequiredResponse() {
  return NextResponse.json(
    { success: false, error: 'Community features require Supabase configuration.', code: 'SUPABASE_NOT_CONFIGURED' },
    { status: 503 }
  );
}

export async function GET(request: NextRequest) {
  if (!isFeatureEnabled('community')) {
    return NextResponse.json({ error: 'Feature disabled' }, { status: 404 });
  }
  if (!isSupabaseConfigured) return supabaseRequiredResponse();

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') || 'threads';

    switch (action) {
      case 'threads': {
        const category = searchParams.get('category') || undefined;
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = parseInt(searchParams.get('offset') || '0');
        const sortBy = (searchParams.get('sortBy') || 'latest') as 'latest' | 'popular' | 'most_replied';

        const threads = await getForumThreads({ category, limit, offset, sortBy });
        return NextResponse.json({ success: true, data: threads, count: threads.length, source: 'supabase' });
      }

      case 'category_summaries': {
        const summaries = await getForumCategorySummaries();
        return NextResponse.json({ success: true, data: summaries, source: 'supabase' });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Forum API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch forum data' }, { status: 500 });
  }
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
      case 'create_thread': {
        const { category, title, body: threadBody } = body;

        if (!category || !VALID_CATEGORY_IDS.includes(category)) {
          return NextResponse.json({ success: false, error: 'Invalid category' }, { status: 400 });
        }
        if (!title || title.length < 3 || title.length > 200) {
          return NextResponse.json({ success: false, error: 'Title must be 3-200 characters' }, { status: 400 });
        }
        if (!threadBody || threadBody.length < 10 || threadBody.length > 10000) {
          return NextResponse.json({ success: false, error: 'Body must be 10-10000 characters' }, { status: 400 });
        }

        const result = await createForumThread({
          userId: user.id,
          category,
          title,
          body: threadBody,
        });

        if (!result.success) {
          return NextResponse.json({ success: false, error: result.error || 'Failed to create thread' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data: { id: result.id }, source: 'supabase' });
      }

      default:
        return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Forum POST error:', error);
    return NextResponse.json({ success: false, error: 'Failed to process request' }, { status: 500 });
  }
}
