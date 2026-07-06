import crypto from 'crypto';

/**
 * Server-side Razorpay helpers (recurring subscriptions).
 *
 * Everything is env-driven and inert until these are set (in Vercel):
 *   RAZORPAY_KEY_ID          — API key id (rzp_test_… / rzp_live_…)
 *   RAZORPAY_KEY_SECRET      — API key secret
 *   RAZORPAY_WEBHOOK_SECRET  — the secret you set on the webhook in the dashboard
 *   RAZORPAY_PLAN_ID_MONTHLY — Razorpay Plan id for the monthly Pro plan
 *   RAZORPAY_PLAN_ID_YEARLY  — Razorpay Plan id for the yearly Pro plan
 * And, for the client checkout popup:
 *   NEXT_PUBLIC_RAZORPAY_KEY_ID — same key id, exposed to the browser
 */
const KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || '';
const WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET || '';

export const PLAN_IDS: Record<'monthly' | 'yearly', string> = {
  monthly: process.env.RAZORPAY_PLAN_ID_MONTHLY || '',
  yearly: process.env.RAZORPAY_PLAN_ID_YEARLY || '',
};

export function isRazorpayConfigured(): boolean {
  return Boolean(KEY_ID && KEY_SECRET);
}

export function getRazorpayKeyId(): string {
  return KEY_ID;
}

interface CreateSubscriptionResult {
  id: string;
  status: string;
  short_url?: string;
  error?: { description?: string };
}

export async function createSubscription(input: {
  planId: string;
  totalCount: number;
  notes?: Record<string, string>;
}): Promise<CreateSubscriptionResult> {
  const auth = Buffer.from(`${KEY_ID}:${KEY_SECRET}`).toString('base64');
  const res = await fetch('https://api.razorpay.com/v1/subscriptions', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      plan_id: input.planId,
      total_count: input.totalCount,
      customer_notify: 1,
      notes: input.notes || {},
    }),
  });
  const data = (await res.json()) as CreateSubscriptionResult;
  if (!res.ok) {
    throw new Error(data?.error?.description || 'Failed to create Razorpay subscription');
  }
  return data;
}

/** Constant-time verification of the X-Razorpay-Signature webhook header. */
export function verifyWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!WEBHOOK_SECRET || !signature) return false;
  const expected = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawBody).digest('hex');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
