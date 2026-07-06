/**
 * POST /api/razorpay/webhook
 *
 * Razorpay calls this on subscription lifecycle events. We verify the signature,
 * then grant or revoke Pro for the mapped user. This is the source of truth for
 * entitlement — never grant Pro from the client callback.
 *
 * Set the same secret here (RAZORPAY_WEBHOOK_SECRET) and in the Razorpay
 * dashboard webhook config. Subscribe to at least:
 *   subscription.activated, subscription.charged, subscription.authenticated,
 *   subscription.halted, subscription.cancelled, subscription.completed
 */
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { verifyWebhookSignature } from '@/lib/razorpay';

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createServiceClient(url, key);
}

const ACTIVATE = new Set([
  'subscription.activated',
  'subscription.charged',
  'subscription.authenticated',
  'subscription.resumed',
]);
const DEACTIVATE = new Set([
  'subscription.halted',
  'subscription.cancelled',
  'subscription.completed',
  'subscription.expired',
]);

interface SubscriptionEntity {
  id?: string;
  current_end?: number; // unix seconds
  notes?: Record<string, string> | null;
}
interface WebhookEvent {
  event?: string;
  payload?: { subscription?: { entity?: SubscriptionEntity } };
}

export async function POST(request: NextRequest) {
  const raw = await request.text();
  const signature = request.headers.get('x-razorpay-signature');

  if (!verifyWebhookSignature(raw, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  let event: WebhookEvent;
  try {
    event = JSON.parse(raw) as WebhookEvent;
  } catch {
    return NextResponse.json({ error: 'Bad JSON' }, { status: 400 });
  }

  const type = event.event || '';
  const subscription = event.payload?.subscription?.entity;
  if (!subscription) {
    // Not a subscription event we care about — acknowledge so Razorpay stops retrying.
    return NextResponse.json({ received: true });
  }

  const service = getServiceClient();
  if (!service) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
  }

  const subId = subscription.id;
  const noteUserId = subscription.notes?.user_id;
  const currentEnd = subscription.current_end;

  // Map the event to a user: prefer notes.user_id, fall back to the stored id.
  let targetId = noteUserId;
  if (!targetId && subId) {
    const { data } = await service
      .from('user_profiles')
      .select('id')
      .eq('razorpay_subscription_id', subId)
      .maybeSingle();
    targetId = (data?.id as string | undefined) ?? undefined;
  }
  if (!targetId) {
    return NextResponse.json({ received: true });
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
    razorpay_subscription_id: subId,
  };

  if (ACTIVATE.has(type)) {
    updates.subscription_tier = 'pro';
    updates.subscription_status = 'active';
    updates.downloads_limit = 300;
    if (currentEnd) {
      updates.subscription_expires_at = new Date(currentEnd * 1000).toISOString();
    }
  } else if (DEACTIVATE.has(type)) {
    updates.subscription_tier = 'free';
    updates.subscription_status = type === 'subscription.cancelled' ? 'cancelled' : 'past_due';
    updates.downloads_limit = 30;
  } else {
    // An event we don't act on (e.g. subscription.pending) — acknowledge.
    return NextResponse.json({ received: true });
  }

  const { error } = await service.from('user_profiles').update(updates).eq('id', targetId);
  if (error) {
    console.error('Razorpay webhook update error:', error.message);
    return NextResponse.json({ error: 'update failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
