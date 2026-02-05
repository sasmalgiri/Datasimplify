import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { user, error } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: error || 'Not authenticated' }, { status: 401 });
    }

    const { data: entitlements, error: entErr } = await supabaseAdmin
      .from('product_entitlements')
      .select('product_key,status,granted_at,expires_at,source,external_order_id')
      .eq('user_id', user.id)
      .order('granted_at', { ascending: false });

    if (entErr) {
      return NextResponse.json({ error: entErr.message }, { status: 500 });
    }

    return NextResponse.json({ entitlements: entitlements || [] });
  } catch (err) {
    console.error('[user/entitlements] error', err);
    return NextResponse.json({ error: 'Failed to load entitlements' }, { status: 500 });
  }
}
