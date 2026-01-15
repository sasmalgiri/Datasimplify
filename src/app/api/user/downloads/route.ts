import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: Fetch user's download history
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: downloads, error } = await supabase
      .from('download_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ downloads });

  } catch (error) {
    console.error('Fetch downloads error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch downloads' },
      { status: 500 }
    );
  }
}

// POST: Record a new download
export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { category, format, filters, row_count } = await request.json();

    // Get user profile to check limits
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('downloads_this_month, downloads_limit, subscription_tier')
      .eq('id', user.id)
      .single();

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Check download limit (unless premium - unlimited downloads)
    if (profile.subscription_tier !== 'premium') {
      if (profile.downloads_this_month >= profile.downloads_limit) {
        return NextResponse.json({
          error: 'Download limit reached',
          limit: profile.downloads_limit,
          used: profile.downloads_this_month,
          upgrade: true,
        }, { status: 403 });
      }
    }

    // Record download
    const { error: insertError } = await supabase
      .from('download_history')
      .insert({
        user_id: user.id,
        category,
        format,
        filters,
        row_count,
      });

    if (insertError) throw insertError;

    // Increment download count
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        downloads_this_month: profile.downloads_this_month + 1,
      })
      .eq('id', user.id);

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      remaining: profile.downloads_limit - profile.downloads_this_month - 1,
    });

  } catch (error) {
    console.error('Record download error:', error);
    return NextResponse.json(
      { error: 'Failed to record download' },
      { status: 500 }
    );
  }
}
