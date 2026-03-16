/**
 * Exchange Transaction History Endpoint
 *
 * GET /api/v1/exchange/:exchange/transactions?symbol=BTC&limit=100&startTime=...
 *
 * Fetches trade/transaction history from connected exchange.
 * Supported: binance, coinbase, kraken
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, getSupabaseClient } from '@/lib/supabase/api-auth';
import { getUserEntitlement } from '@/lib/entitlements';
import { decryptApiKey } from '@/lib/encryption';
import crypto from 'crypto';

interface Transaction {
  id: string;
  date: string;
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  total: number;
  fee: number;
  feeCurrency: string;
}

/* ── Binance ── */

async function fetchBinanceTransactions(
  apiKey: string,
  apiSecret: string,
  symbol?: string,
  limit = 100,
  startTime?: number,
): Promise<Transaction[]> {
  // If no symbol, get all trades from account snapshot
  const symbols = symbol
    ? [symbol.toUpperCase()]
    : ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'SOLUSDT', 'XRPUSDT', 'ADAUSDT', 'DOTUSDT', 'AVAXUSDT'];

  const allTrades: Transaction[] = [];

  for (const sym of symbols) {
    const params: Record<string, string> = {
      symbol: sym,
      limit: String(Math.min(limit, 1000)),
      timestamp: String(Date.now()),
    };
    if (startTime) params.startTime = String(startTime);

    const qs = new URLSearchParams(params).toString();
    const signature = crypto.createHmac('sha256', apiSecret).update(qs).digest('hex');

    const res = await fetch(
      `https://api.binance.com/api/v3/myTrades?${qs}&signature=${signature}`,
      {
        headers: { 'X-MBX-APIKEY': apiKey },
        signal: AbortSignal.timeout(10000),
      },
    );

    if (!res.ok) continue; // Skip pairs with no trades

    const trades = await res.json();
    for (const t of trades) {
      const qty = parseFloat(t.qty);
      const price = parseFloat(t.price);
      allTrades.push({
        id: String(t.id),
        date: new Date(t.time).toISOString(),
        pair: t.symbol,
        side: t.isBuyer ? 'buy' : 'sell',
        price,
        quantity: qty,
        total: qty * price,
        fee: parseFloat(t.commission),
        feeCurrency: t.commissionAsset,
      });
    }
  }

  return allTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/* ── Coinbase ── */

async function fetchCoinbaseTransactions(
  apiKey: string,
  apiSecret: string,
  limit = 100,
): Promise<Transaction[]> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const method = 'GET';
  const path = '/v2/accounts';
  const message = timestamp + method + path;
  const signature = crypto.createHmac('sha256', apiSecret).update(message).digest('hex');

  // First get accounts
  const accountsRes = await fetch(`https://api.coinbase.com${path}?limit=100`, {
    headers: {
      'CB-ACCESS-KEY': apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-VERSION': '2024-01-01',
    },
    signal: AbortSignal.timeout(10000),
  });

  if (!accountsRes.ok) {
    const err = await accountsRes.json().catch(() => ({}));
    throw new Error(err.errors?.[0]?.message || `Coinbase API error: ${accountsRes.status}`);
  }

  const accountsData = await accountsRes.json();
  const accounts = (accountsData.data || []).filter(
    (a: { balance: { amount: string } }) => parseFloat(a.balance.amount) > 0,
  );

  const allTxs: Transaction[] = [];

  // Fetch transactions for each account
  for (const account of accounts.slice(0, 10)) {
    const txPath = `/v2/accounts/${account.id}/transactions`;
    const txTimestamp = Math.floor(Date.now() / 1000).toString();
    const txMessage = txTimestamp + 'GET' + txPath;
    const txSignature = crypto.createHmac('sha256', apiSecret).update(txMessage).digest('hex');

    const txRes = await fetch(`https://api.coinbase.com${txPath}?limit=${limit}`, {
      headers: {
        'CB-ACCESS-KEY': apiKey,
        'CB-ACCESS-SIGN': txSignature,
        'CB-ACCESS-TIMESTAMP': txTimestamp,
        'CB-VERSION': '2024-01-01',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!txRes.ok) continue;
    const txData = await txRes.json();

    for (const tx of txData.data || []) {
      if (!['buy', 'sell', 'trade'].includes(tx.type)) continue;

      const amount = Math.abs(parseFloat(tx.amount?.amount || '0'));
      const nativeAmount = Math.abs(parseFloat(tx.native_amount?.amount || '0'));
      const price = amount > 0 ? nativeAmount / amount : 0;

      allTxs.push({
        id: tx.id,
        date: tx.created_at || tx.updated_at || new Date().toISOString(),
        pair: `${tx.amount?.currency || 'UNKNOWN'}/${tx.native_amount?.currency || 'USD'}`,
        side: tx.type === 'sell' ? 'sell' : 'buy',
        price,
        quantity: amount,
        total: nativeAmount,
        fee: 0,
        feeCurrency: tx.native_amount?.currency || 'USD',
      });
    }
  }

  return allTxs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/* ── Kraken ── */

async function fetchKrakenTransactions(
  apiKey: string,
  apiSecret: string,
): Promise<Transaction[]> {
  const nonce = Date.now() * 1000;
  const path = '/0/private/TradesHistory';
  const body = `nonce=${nonce}`;

  const sha256 = crypto.createHash('sha256').update(nonce + body).digest();
  const hmac = crypto.createHmac('sha512', Buffer.from(apiSecret, 'base64'));
  hmac.update(path);
  hmac.update(sha256);
  const signature = hmac.digest('base64');

  const res = await fetch(`https://api.kraken.com${path}`, {
    method: 'POST',
    headers: {
      'API-Key': apiKey,
      'API-Sign': signature,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) throw new Error(`Kraken API error: ${res.status}`);
  const data = await res.json();

  if (data.error?.length > 0) throw new Error(data.error[0]);

  const trades = data.result?.trades || {};
  const txs: Transaction[] = [];

  for (const [id, t] of Object.entries(trades) as [string, Record<string, string>][]) {
    const price = parseFloat(t.price);
    const vol = parseFloat(t.vol);
    txs.push({
      id,
      date: new Date(parseFloat(t.time) * 1000).toISOString(),
      pair: t.pair,
      side: t.type as 'buy' | 'sell',
      price,
      quantity: vol,
      total: parseFloat(t.cost),
      fee: parseFloat(t.fee),
      feeCurrency: 'USD',
    });
  }

  return txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/* ── Route Handler ── */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ exchange: string }> },
) {
  try {
    const { exchange } = await params;
    const supported = ['binance', 'coinbase', 'kraken'];

    if (!supported.includes(exchange)) {
      return NextResponse.json(
        { error: `Unsupported exchange. Supported: ${supported.join(', ')}` },
        { status: 400 },
      );
    }

    const { user, error: authError } = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: authError || 'Unauthorized' }, { status: 401 });
    }

    const supabase = await getSupabaseClient(request);
    if (!supabase) {
      return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }

    const entitlement = await getUserEntitlement(supabase, user.id);
    if (!entitlement || entitlement.tier === 'free') {
      return NextResponse.json(
        { error: 'Transaction import requires Pro plan.', code: 'SUBSCRIPTION_REQUIRED' },
        { status: 402 },
      );
    }

    const { data: keyData, error: keyError } = await (supabase as any)
      .from('provider_keys')
      .select('encrypted_key')
      .eq('user_id', user.id)
      .eq('provider', exchange)
      .single();

    if (keyError || !keyData) {
      return NextResponse.json(
        { error: `No ${exchange} API key found. Save one via Settings.` },
        { status: 404 },
      );
    }

    const decrypted = decryptApiKey(keyData.encrypted_key);
    let parsed: { key: string; secret: string };
    try {
      parsed = JSON.parse(decrypted);
    } catch {
      return NextResponse.json({ error: 'Stored key is malformed.' }, { status: 500 });
    }

    const symbol = request.nextUrl.searchParams.get('symbol') || undefined;
    const limit = parseInt(request.nextUrl.searchParams.get('limit') || '100');
    const startTime = request.nextUrl.searchParams.get('startTime');

    let transactions: Transaction[];

    if (exchange === 'binance') {
      transactions = await fetchBinanceTransactions(
        parsed.key,
        parsed.secret,
        symbol,
        limit,
        startTime ? parseInt(startTime) : undefined,
      );
    } else if (exchange === 'coinbase') {
      transactions = await fetchCoinbaseTransactions(parsed.key, parsed.secret, limit);
    } else {
      transactions = await fetchKrakenTransactions(parsed.key, parsed.secret);
    }

    return NextResponse.json({
      exchange,
      transactions,
      count: transactions.length,
    });
  } catch (err) {
    console.error('[Exchange Transactions] Error:', err);
    const message = err instanceof Error ? err.message : 'Exchange API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
