/**
 * POST /api/razorpay/create-subscription
 *
 * Creates a Razorpay recurring subscription for the signed-in user and returns
 * the subscription id + key id for the client checkout popup. Pro access is NOT
 * granted here — it's granted by the webhook once payment is authorized/charged.
 */
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isRazorpayConfigured, getRazorpayKeyId, PLAN_IDS, createSubscription } from '@/lib/razorpay';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

export async function POST(request: NextRequest) {
  if (!isRazorpayConfigured()) {
    return NextResponse.json({ error: 'Payments are not configured yet.' }, { status: 503 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || !user.email) {
    return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
  }

  let body: { period?: 'monthly' | 'yearly' };
  try {
    body = await request.json();
  } catch {
    body = {};
  }
  const period: 'monthly' | 'yearly' = body.period === 'yearly' ? 'yearly' : 'monthly';

  const planId = PLAN_IDS[period];
  if (!planId) {
    return NextResponse.json(
      { error: `No Razorpay plan configured for ${period} billing.` },
      { status: 503 }
    );
  }

  // total_count = number of billing cycles before the subscription completes.
  // Set high so it effectively runs until cancelled.
  const totalCount = period === 'yearly' ? 12 : 120;

  try {
    const sub = await createSubscription({
      planId,
      totalCount,
      notes: { user_id: user.id, email: user.email, period },
    });

    // Best-effort: record the subscription id so the webhook can map back even
    // if notes are ever missing. Ignore failures (e.g. column not migrated yet).
    const service = getServiceClient();
    if (service) {
      await service
        .from('user_profiles')
        .update({ razorpay_subscription_id: sub.id, updated_at: new Date().toISOString() })
        .eq('id', user.id);
    }

    return NextResponse.json({ subscriptionId: sub.id, keyId: getRazorpayKeyId() });
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Failed to start subscription';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
