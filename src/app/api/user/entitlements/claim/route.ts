import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/supabase/api-auth';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const { user, error } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: error || 'Not authenticated' }, { status: 401 });
    }

    const { data: profile, error: profErr } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('id', user.id)
      .single();

    if (profErr || !profile?.email) {
      return NextResponse.json({ error: 'Profile email not found' }, { status: 400 });
    }

    const purchaserEmail = String(profile.email).toLowerCase();

    const { data: pending, error: pendErr } = await supabaseAdmin
      .from('pending_entitlements')
      .select('*')
      .eq('purchaser_email', purchaserEmail)
      .eq('status', 'pending');

    if (pendErr) {
      return NextResponse.json({ error: pendErr.message }, { status: 500 });
    }

    if (!pending || pending.length === 0) {
      return NextResponse.json({ claimed: 0 });
    }

    // Grant entitlements
    const grants = pending.map((p) => ({
      user_id: user.id,
      product_key: p.product_key,
      status: 'active',
      source: p.provider,
      external_order_id: p.external_order_id,
      external_customer_email: p.purchaser_email,
    }));

    const { error: grantErr } = await supabaseAdmin
      .from('product_entitlements')
      .upsert(grants, { onConflict: 'user_id,product_key' });

    if (grantErr) {
      return NextResponse.json({ error: grantErr.message }, { status: 500 });
    }

    // Mark pending as claimed
    const pendingIds = pending.map((p) => p.id);
    await supabaseAdmin
      .from('pending_entitlements')
      .update({
        status: 'claimed',
        claimed_at: new Date().toISOString(),
        claimed_by_user_id: user.id,
      })
      .in('id', pendingIds);

    return NextResponse.json({ claimed: pending.length });
  } catch (err) {
    console.error('[user/entitlements/claim] error', err);
    return NextResponse.json({ error: 'Claim failed' }, { status: 500 });
  }
}
