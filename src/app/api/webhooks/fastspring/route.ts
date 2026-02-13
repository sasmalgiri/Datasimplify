import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

type Purchase = {
  email: string;
  externalOrderId: string | null;
  eventType: string | null;
  productRef: string | null;
  productKey: string | null;
};

function unauthorized(message = 'Unauthorized') {
  return NextResponse.json({ error: message }, { status: 401 });
}

function getBasicAuth(request: NextRequest): { username: string; password: string } | null {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Basic ')) return null;
  try {
    const decoded = Buffer.from(header.slice('Basic '.length), 'base64').toString('utf8');
    const idx = decoded.indexOf(':');
    if (idx === -1) return null;
    return { username: decoded.slice(0, idx), password: decoded.slice(idx + 1) };
  } catch {
    return null;
  }
}

function assertWebhookAuthorized(request: NextRequest): NextResponse | null {
  const secret = process.env.FASTSPRING_WEBHOOK_SECRET;
  const expectedUser = process.env.FASTSPRING_WEBHOOK_USERNAME;
  const expectedPass = process.env.FASTSPRING_WEBHOOK_PASSWORD;

  if (expectedUser && expectedPass) {
    const basic = getBasicAuth(request);
    if (!basic || basic.username !== expectedUser || basic.password !== expectedPass) {
      return unauthorized('Invalid webhook credentials');
    }
    return null;
  }

  if (secret) {
    const provided = request.headers.get('x-webhook-secret') || request.headers.get('x-crk-webhook-secret');
    if (!provided || provided !== secret) {
      return unauthorized('Invalid webhook secret');
    }
    return null;
  }

  // No auth configured: always refuse (require proper credentials)
  return unauthorized('Webhook auth not configured. Set FASTSPRING_WEBHOOK_SECRET or FASTSPRING_WEBHOOK_USERNAME/PASSWORD.');
}

function pickString(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  return null;
}

function deepGet(obj: any, path: Array<string | number>): unknown {
  let cur = obj;
  for (const k of path) {
    if (!cur || typeof cur !== 'object') return null;
    cur = cur[k as any];
  }
  return cur;
}

function extractEmail(payload: any): string | null {
  const candidates: unknown[] = [
    deepGet(payload, ['customer', 'email']),
    deepGet(payload, ['account', 'email']),
    deepGet(payload, ['recipient', 'email']),
    deepGet(payload, ['contact', 'email']),
    deepGet(payload, ['order', 'customer', 'email']),
    payload?.email,
  ];
  for (const c of candidates) {
    const s = pickString(c);
    if (s) return s.toLowerCase();
  }
  return null;
}

function extractOrderId(payload: any): string | null {
  const candidates: unknown[] = [
    deepGet(payload, ['order', 'id']),
    deepGet(payload, ['order', 'reference']),
    deepGet(payload, ['orderReference']),
    payload?.id,
  ];
  for (const c of candidates) {
    const s = pickString(c);
    if (s) return s;
  }
  return null;
}

function extractProductRef(payload: any): string | null {
  const candidates: unknown[] = [
    payload?.product,
    payload?.productId,
    deepGet(payload, ['item', 'product']),
    deepGet(payload, ['item', 'productId']),
    deepGet(payload, ['items', 0, 'product']),
    deepGet(payload, ['items', 0, 'productId']),
    deepGet(payload, ['items', 0, 'reference']),
  ];
  for (const c of candidates) {
    const s = pickString(c);
    if (s) return s;
  }
  return null;
}

function mapProductToKey(productRef: string | null, payload: any): string | null {
  const explicit = pickString(payload?.product_key) || pickString(payload?.productKey);
  if (explicit) return explicit;

  if (!productRef) return null;

  const PRODUCT_MAP: Record<string, string> = {
    'power-query-pro': 'power_query_pro',
    'power-query-enterprise': 'power_query_enterprise',
    // CRK Add-in subscriptions
    'crk-addin-pro-monthly': 'crk_addin_pro',
    'crk-addin-pro-yearly': 'crk_addin_pro',
    'crk-addin-premium-monthly': 'crk_addin_premium',
    'crk-addin-premium-yearly': 'crk_addin_premium',
  };

  const normalized = productRef.toLowerCase();

  // FastSpring can send full paths/refs; match by substring.
  for (const [needle, key] of Object.entries(PRODUCT_MAP)) {
    if (normalized.includes(needle)) return key;
  }

  return null;
}

function normalizeToPurchases(payload: any): Purchase[] {
  // FastSpring webhooks often provide `events: []`. If present, normalize per-event.
  if (Array.isArray(payload?.events)) {
    return payload.events
      .map((evt: any) => {
        const eventType = pickString(evt?.type) || pickString(evt?.eventType) || null;
        const data = evt?.data ?? evt;

        const email = extractEmail(data);
        const externalOrderId = extractOrderId(data);
        const productRef = extractProductRef(data);
        const productKey = mapProductToKey(productRef, data);

        if (!email) return null;

        return {
          email,
          externalOrderId,
          eventType,
          productRef,
          productKey,
        } as Purchase;
      })
      .filter(Boolean) as Purchase[];
  }

  const email = extractEmail(payload);
  if (!email) return [];

  const externalOrderId = extractOrderId(payload);
  const productRef = extractProductRef(payload);
  const productKey = mapProductToKey(productRef, payload);
  const eventType = pickString(payload?.type) || pickString(payload?.eventType) || null;

  return [{ email, externalOrderId, eventType, productRef, productKey }];
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 });
    }

    const authError = assertWebhookAuthorized(request);
    if (authError) return authError;

    const payload = await request.json();
    const purchases = normalizeToPurchases(payload);

    // Always log the webhook
    await supabaseAdmin.from('purchase_events').insert({
      provider: 'fastspring',
      event_type: pickString(payload?.type) || pickString(payload?.eventType),
      external_order_id: null,
      external_customer_email: extractEmail(payload),
      product_key: pickString(payload?.product_key) || pickString(payload?.productKey) || null,
      raw_payload: payload,
    });

    if (purchases.length === 0) {
      return NextResponse.json({ ok: true, processed: 0, message: 'No purchaser email found' });
    }

    const inserts: any[] = [];

    for (const p of purchases) {
      if (!p.productKey) {
        // Without a product key we can't grant anything; still logged as purchase_events above.
        continue;
      }

      // Deduplicate (best-effort) by orderId+email+product
      if (p.externalOrderId) {
        const { data: existing } = await supabaseAdmin
          .from('pending_entitlements')
          .select('id')
          .eq('purchaser_email', p.email)
          .eq('product_key', p.productKey)
          .eq('external_order_id', p.externalOrderId)
          .limit(1);

        if (existing && existing.length > 0) continue;
      }

      inserts.push({
        purchaser_email: p.email,
        product_key: p.productKey,
        external_order_id: p.externalOrderId,
        provider: 'fastspring',
        status: 'pending',
      });
    }

    if (inserts.length > 0) {
      const { error } = await supabaseAdmin.from('pending_entitlements').insert(inserts);
      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
    }

    // Handle CRK add-in subscription lifecycle (activate/cancel)
    for (const p of purchases) {
      if (!p.productKey?.startsWith('crk_addin_')) continue;

      const tier = p.productKey === 'crk_addin_premium' ? 'premium' : 'pro';
      const eventType = (p.eventType || '').toLowerCase();

      // Find user by email
      const { data: userRecord } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('email', p.email)
        .limit(1)
        .single();

      if (!userRecord) continue;

      if (eventType.includes('activated') || eventType.includes('renewed') || eventType.includes('completed')) {
        await supabaseAdmin
          .from('profiles')
          .update({ plan: tier })
          .eq('id', userRecord.id);
      } else if (eventType.includes('deactivated') || eventType.includes('cancelled')) {
        await supabaseAdmin
          .from('profiles')
          .update({ plan: 'free' })
          .eq('id', userRecord.id);
      }
    }

    return NextResponse.json({ ok: true, processed: inserts.length });
  } catch (err) {
    console.error('[webhooks/fastspring] error', err);
    return NextResponse.json({ error: 'Webhook failed' }, { status: 500 });
  }
}
