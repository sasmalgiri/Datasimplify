import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

/* ────────────────────────────────────────────────────────────────────────────
 * POST /api/live-dashboard/exchange-balance
 *
 * BYOK proxy for multi-exchange balance queries.
 * Accepts: { exchange, apiKey, apiSecret, passphrase? }
 * Returns: { balances: { asset, free, locked }[] }
 *
 * Supported exchanges: binance, coinbase, kraken, kucoin, bybit, okx
 * ──────────────────────────────────────────────────────────────────────────── */

const SUPPORTED_EXCHANGES = [
  'binance',
  'coinbase',
  'kraken',
  'kucoin',
  'bybit',
  'okx',
] as const;

type SupportedExchange = (typeof SUPPORTED_EXCHANGES)[number];

interface NormalizedBalance {
  asset: string;
  free: number;
  locked: number;
}

interface RequestBody {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
}

// ─── Rate limiter ────────────────────────────────────────────────────────────

const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 20) return false;
  entry.count++;
  return true;
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    '127.0.0.1'
  );
}

// ─── Binance ─────────────────────────────────────────────────────────────────

async function fetchBinanceBalances(
  apiKey: string,
  apiSecret: string,
): Promise<NormalizedBalance[]> {
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
      signal: AbortSignal.timeout(15000),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.msg || `Binance API error: ${res.status}`);
  }

  const data = await res.json();
  return (data.balances || [])
    .map((b: { asset: string; free: string; locked: string }) => ({
      asset: b.asset,
      free: parseFloat(b.free),
      locked: parseFloat(b.locked),
    }))
    .filter((b: NormalizedBalance) => b.free > 0 || b.locked > 0);
}

// ─── Coinbase ────────────────────────────────────────────────────────────────

async function fetchCoinbaseBalances(
  apiKey: string,
  apiSecret: string,
): Promise<NormalizedBalance[]> {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const method = 'GET';
  const path = '/v2/accounts';
  const message = timestamp + method + path;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(message)
    .digest('hex');

  const res = await fetch(`https://api.coinbase.com${path}?limit=300`, {
    headers: {
      'CB-ACCESS-KEY': apiKey,
      'CB-ACCESS-SIGN': signature,
      'CB-ACCESS-TIMESTAMP': timestamp,
      'CB-VERSION': '2023-12-01',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(
      err.errors?.[0]?.message || `Coinbase API error: ${res.status}`,
    );
  }

  const data = await res.json();
  return (data.data || [])
    .filter(
      (a: { balance: { amount: string } }) => parseFloat(a.balance.amount) > 0,
    )
    .map((a: { currency: { code: string }; balance: { amount: string } }) => ({
      asset: a.currency.code,
      free: parseFloat(a.balance.amount),
      locked: 0,
    }));
}

// ─── Kraken ──────────────────────────────────────────────────────────────────

async function fetchKrakenBalances(
  apiKey: string,
  apiSecret: string,
): Promise<NormalizedBalance[]> {
  const path = '/0/private/Balance';
  const nonce = Date.now() * 1000;
  const postData = `nonce=${nonce}`;

  // Kraken signature: HMAC-SHA512 of (path + SHA256(nonce + postData)), keyed with base64-decoded secret
  const sha256Hash = crypto
    .createHash('sha256')
    .update(nonce + postData)
    .digest();

  const secretBuffer = Buffer.from(apiSecret, 'base64');
  const hmac = crypto
    .createHmac('sha512', secretBuffer)
    .update(Buffer.concat([Buffer.from(path), sha256Hash]))
    .digest('base64');

  const res = await fetch(`https://api.kraken.com${path}`, {
    method: 'POST',
    headers: {
      'API-Key': apiKey,
      'API-Sign': hmac,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: postData,
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`Kraken API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.error && data.error.length > 0) {
    throw new Error(data.error.join(', '));
  }

  const result = data.result || {};
  return Object.entries(result)
    .map(([asset, balance]) => ({
      asset: asset.replace(/^(Z|X)/, ''), // Kraken prefixes fiat with Z, crypto with X
      free: parseFloat(balance as string),
      locked: 0,
    }))
    .filter((b) => b.free > 0);
}

// ─── KuCoin ──────────────────────────────────────────────────────────────────

async function fetchKuCoinBalances(
  apiKey: string,
  apiSecret: string,
  passphrase: string,
): Promise<NormalizedBalance[]> {
  const timestamp = Date.now().toString();
  const method = 'GET';
  const endpoint = '/api/v1/accounts';
  const stringToSign = timestamp + method + endpoint;

  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(stringToSign)
    .digest('base64');

  const passphraseHmac = crypto
    .createHmac('sha256', apiSecret)
    .update(passphrase)
    .digest('base64');

  const res = await fetch(`https://api.kucoin.com${endpoint}`, {
    headers: {
      'KC-API-KEY': apiKey,
      'KC-API-SIGN': signature,
      'KC-API-TIMESTAMP': timestamp,
      'KC-API-PASSPHRASE': passphraseHmac,
      'KC-API-KEY-VERSION': '2',
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.msg || `KuCoin API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.code !== '200000') {
    throw new Error(data.msg || `KuCoin error: ${data.code}`);
  }

  // KuCoin returns separate accounts per type (trade, main, margin)
  // Aggregate by currency
  const aggregated: Record<string, { free: number; locked: number }> = {};

  for (const account of data.data || []) {
    const currency = account.currency as string;
    const available = parseFloat(account.available || '0');
    const holds = parseFloat(account.holds || '0');

    if (!aggregated[currency]) {
      aggregated[currency] = { free: 0, locked: 0 };
    }
    aggregated[currency].free += available;
    aggregated[currency].locked += holds;
  }

  return Object.entries(aggregated)
    .map(([asset, bal]) => ({
      asset,
      free: bal.free,
      locked: bal.locked,
    }))
    .filter((b) => b.free > 0 || b.locked > 0);
}

// ─── Bybit ───────────────────────────────────────────────────────────────────

async function fetchBybitBalances(
  apiKey: string,
  apiSecret: string,
): Promise<NormalizedBalance[]> {
  const timestamp = Date.now().toString();
  const recvWindow = '5000';
  const queryString = 'accountType=UNIFIED';

  // Bybit V5 signature: HMAC-SHA256 of (timestamp + apiKey + recvWindow + queryString)
  const preSign = timestamp + apiKey + recvWindow + queryString;
  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(preSign)
    .digest('hex');

  const res = await fetch(
    `https://api.bybit.com/v5/account/wallet-balance?${queryString}`,
    {
      headers: {
        'X-BAPI-API-KEY': apiKey,
        'X-BAPI-SIGN': signature,
        'X-BAPI-TIMESTAMP': timestamp,
        'X-BAPI-RECV-WINDOW': recvWindow,
      },
      signal: AbortSignal.timeout(15000),
    },
  );

  if (!res.ok) {
    throw new Error(`Bybit API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.retCode !== 0) {
    throw new Error(data.retMsg || `Bybit error: ${data.retCode}`);
  }

  const balances: NormalizedBalance[] = [];
  const accounts = data.result?.list || [];

  for (const account of accounts) {
    for (const coin of account.coin || []) {
      const free = parseFloat(coin.availableToWithdraw || '0');
      const locked = parseFloat(coin.locked || '0');
      if (free > 0 || locked > 0) {
        balances.push({
          asset: coin.coin,
          free,
          locked,
        });
      }
    }
  }

  return balances;
}

// ─── OKX ─────────────────────────────────────────────────────────────────────

async function fetchOkxBalances(
  apiKey: string,
  apiSecret: string,
  passphrase: string,
): Promise<NormalizedBalance[]> {
  const timestamp = new Date().toISOString();
  const method = 'GET';
  const requestPath = '/api/v5/account/balance';
  const preSign = timestamp + method + requestPath;

  const signature = crypto
    .createHmac('sha256', apiSecret)
    .update(preSign)
    .digest('base64');

  const res = await fetch(`https://www.okx.com${requestPath}`, {
    headers: {
      'OK-ACCESS-KEY': apiKey,
      'OK-ACCESS-SIGN': signature,
      'OK-ACCESS-TIMESTAMP': timestamp,
      'OK-ACCESS-PASSPHRASE': passphrase,
      'Content-Type': 'application/json',
    },
    signal: AbortSignal.timeout(15000),
  });

  if (!res.ok) {
    throw new Error(`OKX API error: ${res.status}`);
  }

  const data = await res.json();
  if (data.code !== '0') {
    throw new Error(data.msg || `OKX error: ${data.code}`);
  }

  const balances: NormalizedBalance[] = [];
  const accounts = data.data || [];

  for (const account of accounts) {
    for (const detail of account.details || []) {
      const free = parseFloat(detail.availBal || '0');
      const locked = parseFloat(detail.frozenBal || '0');
      if (free > 0 || locked > 0) {
        balances.push({
          asset: detail.ccy,
          free,
          locked,
        });
      }
    }
  }

  return balances;
}

// ─── Main handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Rate limit
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment.' },
      { status: 429 },
    );
  }

  // Parse body
  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { exchange, apiKey, apiSecret, passphrase } = body;

  // Validate exchange
  if (
    !exchange ||
    !SUPPORTED_EXCHANGES.includes(exchange as SupportedExchange)
  ) {
    return NextResponse.json(
      {
        error: `Unsupported exchange "${exchange}". Supported: ${SUPPORTED_EXCHANGES.join(', ')}`,
      },
      { status: 400 },
    );
  }

  // Validate credentials
  if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length < 4) {
    return NextResponse.json(
      { error: 'A valid API key is required.' },
      { status: 400 },
    );
  }
  if (
    !apiSecret ||
    typeof apiSecret !== 'string' ||
    apiSecret.trim().length < 4
  ) {
    return NextResponse.json(
      { error: 'A valid API secret is required.' },
      { status: 400 },
    );
  }

  // Passphrase required for KuCoin & OKX
  if (
    (exchange === 'kucoin' || exchange === 'okx') &&
    (!passphrase || typeof passphrase !== 'string' || passphrase.trim().length === 0)
  ) {
    return NextResponse.json(
      { error: `Passphrase is required for ${exchange}.` },
      { status: 400 },
    );
  }

  // Fetch balances
  try {
    let balances: NormalizedBalance[];

    switch (exchange as SupportedExchange) {
      case 'binance':
        balances = await fetchBinanceBalances(apiKey.trim(), apiSecret.trim());
        break;
      case 'coinbase':
        balances = await fetchCoinbaseBalances(apiKey.trim(), apiSecret.trim());
        break;
      case 'kraken':
        balances = await fetchKrakenBalances(apiKey.trim(), apiSecret.trim());
        break;
      case 'kucoin':
        balances = await fetchKuCoinBalances(
          apiKey.trim(),
          apiSecret.trim(),
          passphrase!.trim(),
        );
        break;
      case 'bybit':
        balances = await fetchBybitBalances(apiKey.trim(), apiSecret.trim());
        break;
      case 'okx':
        balances = await fetchOkxBalances(
          apiKey.trim(),
          apiSecret.trim(),
          passphrase!.trim(),
        );
        break;
      default:
        return NextResponse.json(
          { error: 'Unsupported exchange' },
          { status: 400 },
        );
    }

    return NextResponse.json({
      exchange,
      balances,
      count: balances.length,
      fetchedAt: Date.now(),
    });
  } catch (err) {
    console.error(`[Exchange Balance] ${exchange} error:`, err);
    const message =
      err instanceof Error ? err.message : 'Exchange API error';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
