import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { user } = await getAuthUser(request);

    // Pull all releases (latest only), then filter based on entitlements
    const { data: releases, error: releaseError } = await supabaseAdmin
      .from('template_releases')
      .select('slug,title,description,required_product_key,version,is_latest,published_at,file_name,content_type')
      .eq('is_latest', true)
      .order('published_at', { ascending: false });

    if (releaseError) {
      return NextResponse.json({ error: releaseError.message }, { status: 500 });
    }

    // Free releases (required_product_key is null) are visible to everyone
    const freeReleases = (releases || []).filter((r) => !r.required_product_key);

    if (!user) {
      return NextResponse.json({ releases: freeReleases, requiresLoginForPaid: true });
    }

    const { data: entitlements, error: entError } = await supabaseAdmin
      .from('product_entitlements')
      .select('product_key,status')
      .eq('user_id', user.id)
      .eq('status', 'active');

    if (entError) {
      return NextResponse.json({ error: entError.message }, { status: 500 });
    }

    const keys = new Set((entitlements || []).map((e) => e.product_key));

    const paidReleases = (releases || []).filter((r) => {
      if (!r.required_product_key) return false;
      return keys.has(r.required_product_key);
    });

    return NextResponse.json({
      releases: [...freeReleases, ...paidReleases],
      entitlements: Array.from(keys),
    });
  } catch (err) {
    console.error('[downloads/releases] error', err);
    return NextResponse.json({ error: 'Failed to load releases' }, { status: 500 });
  }
}
