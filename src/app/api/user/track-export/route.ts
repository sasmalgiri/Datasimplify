import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { incrementDownloadCount } from '@/lib/entitlements';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const format = body.format || 'unknown';
    const source = body.source || 'live-dashboard';

    // Increment unified download count
    await incrementDownloadCount(supabase, user.id);

    // Log export event (best-effort)
    try {
      await supabase.from('download_events').insert({
        user_id: user.id,
        user_email: user.email,
        category: source,
        format,
      });
    } catch {
      // Non-critical
    }

    // Return updated count
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('downloads_this_month, downloads_limit')
      .eq('id', user.id)
      .single();

    return NextResponse.json({
      success: true,
      downloadsUsed: profile?.downloads_this_month || 0,
      downloadsLimit: profile?.downloads_limit || 30,
    });
  } catch (error) {
    console.error('[track-export] error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
