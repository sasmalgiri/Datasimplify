/**
 * Exchange Balance Endpoint
 *
 * GET /api/v1/exchange/:exchange/balance?asset=BTC
 *
 * Fetches balance from connected exchange using stored API keys.
 * Exchange keys never leave the server - they are decrypted, used, and discarded.
 *
 * Supported: binance, coinbase
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';
import { getUserEntitlement } from '@/lib/entitlements';
import { decryptApiKey } from '@/lib/encryption';
import crypto from 'crypto';

const SUPPORTED_EXCHANGES = ['binance', 'coinbase'] as const;

interface BalanceEntry {
  asset: string;
  free: number;
  locked: number;
  total: number;
}

async function fetchBinanceBalance(apiKey: string, apiSecret: string, asset?: string): Promise<BalanceEntry[]> {
  const timestamp = Date.now();
  const queryString = `timestamp=${timestamp}`;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(queryString)
    .digest('hex');

  const res = await fetch(
    `https://api.binance.com/api/v3/account?${queryString}&signature=${signature}`,
    {
      headers: { 'X-MBX-APIKEY': apiKey },
      signal: AbortSignal.timeout(10000),
    }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.msg || `Binance API error: ${res.status}`);
  }

  const data = await res.json();
  const balances: BalanceEntry[] = (data.balances || [])
    .filter((b: { asset: string; free: string; locked: string }) => {
      const total = parseFloat(b.free) + parseFloat(b.locked);
      return total > 0;
    })
    .map((b: { asset: string; free: string; locked: string }) => ({
      asset: b.asset,
      free: parseFloat(b.free),
      locked: parseFloat(b.locked),
      total: parseFloat(b.free) + parseFloat(b.locked),
    }));

  if (asset) {
    return balances.filter(b => b.asset.toUpperCase() === asset.toUpperCase());
  }

  return balances;
}

async function fetchCoinbaseBalance(apiKey: string, apiSecret: string, asset?: string): Promise<BalanceEntry[]> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const method = 'GET';
  const path = '/v2/accounts';
  const message = timestamp + method + path;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex');

  const res = await fetch(`https://api.coinbase.com${path}?limit=100`, {
    headers: {
      'CB-ACCESS-KEY': apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-VERSION': '2024-01-01',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.errors?.[0]?.message || `Coinbase API error: ${res.status}`);
  }

  const data = await res.json();
  const balances: BalanceEntry[] = (data.data || [])
    .filter((a: { balance: { amount: string } }) => parseFloat(a.balance.amount) > 0)
    .map((a: { currency: { code: string }; balance: { amount: string } }) => ({
      asset: a.currency.code,
      free: parseFloat(a.balance.amount),
      locked: 0,
      total: parseFloat(a.balance.amount),
    }));

  if (asset) {
    return balances.filter(b => b.asset.toUpperCase() === asset.toUpperCase());
  }

  return balances;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ exchange: string }> }
) {
  try {
    const { exchange } = await params;

    if (!SUPPORTED_EXCHANGES.includes(exchange as typeof SUPPORTED_EXCHANGES[number])) {
      return NextResponse.json({
        error: `Unsupported exchange. Supported: ${SUPPORTED_EXCHANGES.join(', ')}`,
      }, { status: 400 });
    }

    const { user, error: authError } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    // Pro+ required
    const entitlement = await getUserEntitlement(supabase, user.id);
    if (!entitlement || entitlement.tier === 'free') {
      return NextResponse.json({
        error: 'Exchange balance requires Pro plan.',
        code: 'SUBSCRIPTION_REQUIRED',
      }, { status: 402 });
    }

    // Get stored exchange key
    const { data: keyData, error: keyError } = await supabase
      .from('provider_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', exchange)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json({
        error: `No ${exchange} API key found. Save one via the taskpane or POST /api/v1/keys/${exchange}`,
      }, { status: 404 });
    }

    // Decrypt key
    const decrypted = decryptApiKey(keyData.encrypted_key);
    let parsed: { key: string; secret: string };
    try {
      parsed = JSON.parse(decrypted);
    } catch {
      return NextResponse.json({ error: 'Stored key is malformed. Please reconnect.' }, { status: 500 });
    }

    const asset = request.nextUrl.searchParams.get('asset') || undefined;
    let balances: BalanceEntry[];

    if (exchange === 'binance') {
      balances = await fetchBinanceBalance(parsed.key, parsed.secret, asset);
    } else if (exchange === 'coinbase') {
      balances = await fetchCoinbaseBalance(parsed.key, parsed.secret, asset);
    } else {
      return NextResponse.json({ error: 'Unsupported exchange' }, { status: 400 });
    }

    return NextResponse.json({
      exchange,
      asset: asset || 'all',
      balances,
      count: balances.length,
    });
  } catch (err) {
    console.error('[Exchange Balance] Error:', err);
    const message = err instanceof Error ? err.message : 'Exchange API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
