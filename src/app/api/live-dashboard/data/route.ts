import { NextRequest, NextResponse } from 'next/server';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const COINGECKO_PRO_API = 'https://pro-api.coingecko.com/api/v3';
const FEAR_GREED_API = 'https://api.alternative.me/fng/?limit=1&format=json';

// Simple in-memory rate limiter per IP
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

function getClientIp(req: NextRequest): string {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || req.headers.get('x-real-ip')
    || '127.0.0.1';
}

function detectKeyType(apiKey: string): 'pro' | 'demo' {
  return apiKey.startsWith('CG-') && apiKey.length > 30 ? 'pro' : 'demo';
}

async function fetchCoinGecko(
  endpoint: string,
  apiKey: string,
  keyType: 'pro' | 'demo',
  params?: Record<string, string>,
): Promise<any> {
  const baseUrl = keyType === 'pro' ? COINGECKO_PRO_API : COINGECKO_API;
  const url = new URL(`${baseUrl}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const headerKey = keyType === 'pro' ? 'x-cg-pro-api-key' : 'x-cg-demo-api-key';

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const res = await fetch(url.toString(), {
      headers: {
        [headerKey]: apiKey,
        Accept: 'application/json',
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      if (res.status === 429) throw new Error('CoinGecko rate limit exceeded. Wait a moment and try again.');
      if (res.status === 401 || res.status === 403) throw new Error('Invalid API key. Please check your CoinGecko API key.');
      throw new Error(`CoinGecko API error: ${res.status}`);
    }

    return await res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('CoinGecko request timed out');
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment.' },
      { status: 429 },
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { apiKey, endpoints, params } = body;

  if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 8) {
    return NextResponse.json({ error: 'Valid API key required' }, { status: 400 });
  }

  if (!endpoints || !Array.isArray(endpoints) || endpoints.length === 0) {
    return NextResponse.json({ error: 'At least one endpoint required' }, { status: 400 });
  }

  const keyType = detectKeyType(apiKey);
  const result: Record<string, any> = {};

  // Sanitize coin IDs to prevent path traversal
  const safeCoinId = (id: unknown): string | null => {
    if (typeof id !== 'string' || id.length === 0 || id.length > 100) return null;
    return /^[a-z0-9_-]+$/i.test(id) ? id.toLowerCase() : null;
  };

  // Fetch each endpoint in parallel
  const fetchers: Promise<void>[] = [];

  for (const ep of endpoints) {
    switch (ep) {
      case 'markets':
        fetchers.push(
          fetchCoinGecko('/coins/markets', apiKey, keyType, {
            vs_currency: params?.vsCurrency || 'usd',
            order: params?.sortOrder || 'market_cap_desc',
            per_page: String(params?.perPage || 100),
            page: '1',
            sparkline: 'true',
            price_change_percentage: '24h,7d',
          })
            .then((data) => { result.markets = data; })
            .catch((err) => { result.marketsError = err.message; }),
        );
        break;

      case 'global':
        fetchers.push(
          fetchCoinGecko('/global', apiKey, keyType)
            .then((data) => { result.global = data?.data || data; })
            .catch((err) => { result.globalError = err.message; }),
        );
        break;

      case 'trending':
        fetchers.push(
          fetchCoinGecko('/search/trending', apiKey, keyType)
            .then((data) => { result.trending = data?.coins || data; })
            .catch((err) => { result.trendingError = err.message; }),
        );
        break;

      case 'fear_greed':
        fetchers.push(
          fetch(FEAR_GREED_API, { signal: AbortSignal.timeout(10000) })
            .then((r) => r.json())
            .then((data) => { result.fearGreed = data?.data || []; })
            .catch((err) => { result.fearGreedError = err.message; }),
        );
        break;

      case 'categories':
        fetchers.push(
          fetchCoinGecko('/coins/categories', apiKey, keyType, {
            order: 'market_cap_desc',
          })
            .then((data) => { result.categories = data; })
            .catch((err) => { result.categoriesError = err.message; }),
        );
        break;

      case 'ohlc': {
        const coinId = safeCoinId(params?.coinId);
        if (coinId) {
          fetchers.push(
            fetchCoinGecko(`/coins/${coinId}/ohlc`, apiKey, keyType, {
              vs_currency: params?.vsCurrency || 'usd',
              days: String(params?.days || 30),
            })
              .then((data) => {
                result.ohlc = { ...(result.ohlc || {}), [coinId]: data };
              })
              .catch((err) => { result.ohlcError = err.message; }),
          );
        }
        break;
      }

      case 'ohlc_multi':
        if (params?.coinIds && Array.isArray(params.coinIds)) {
          const validIds = params.coinIds.map(safeCoinId).filter(Boolean).slice(0, 5) as string[];
          for (const cid of validIds) {
            fetchers.push(
              fetchCoinGecko(`/coins/${cid}/ohlc`, apiKey, keyType, {
                vs_currency: params?.vsCurrency || 'usd',
                days: String(params?.days || 30),
              })
                .then((data) => {
                  result.ohlc = { ...(result.ohlc || {}), [cid]: data };
                })
                .catch((err) => {
                  if (!result.ohlcMultiErrors) result.ohlcMultiErrors = {};
                  result.ohlcMultiErrors[cid] = err.message;
                }),
            );
          }
        }
        break;

      case 'exchanges':
        fetchers.push(
          fetchCoinGecko('/exchanges', apiKey, keyType, {
            per_page: '20',
            page: '1',
          })
            .then((data) => { result.exchanges = data; })
            .catch((err) => { result.exchangesError = err.message; }),
        );
        break;

      case 'coin_history': {
        const histCoinId = safeCoinId(params?.historyCoinId);
        if (histCoinId) {
          fetchers.push(
            fetchCoinGecko(`/coins/${histCoinId}/market_chart`, apiKey, keyType, {
              vs_currency: params?.vsCurrency || 'usd',
              days: String(params?.historyDays || 90),
            })
              .then((data) => { result.coinHistory = data; })
              .catch((err) => { result.coinHistoryError = err.message; }),
          );
        }
        break;
      }

      case 'coin_detail': {
        const detailId = safeCoinId(params?.detailCoinId);
        if (detailId) {
          fetchers.push(
            fetchCoinGecko(`/coins/${detailId}`, apiKey, keyType, {
              localization: 'false',
              tickers: 'false',
              community_data: 'true',
              developer_data: 'true',
              sparkline: 'false',
            })
              .then((data) => {
                result.coinDetail = { ...(result.coinDetail || {}), [detailId]: data };
              })
              .catch((err) => { result.coinDetailError = err.message; }),
          );
        }
        break;
      }

      case 'defi_global':
        fetchers.push(
          fetchCoinGecko('/global/decentralized_finance_defi', apiKey, keyType)
            .then((data) => { result.defiGlobal = data?.data || data; })
            .catch((err) => { result.defiGlobalError = err.message; }),
        );
        break;

      case 'derivatives':
        fetchers.push(
          fetchCoinGecko('/derivatives', apiKey, keyType)
            .then((data) => { result.derivatives = Array.isArray(data) ? data.slice(0, 50) : data; })
            .catch((err) => { result.derivativesError = err.message; }),
        );
        break;

      case 'derivatives_exchanges':
        fetchers.push(
          fetchCoinGecko('/derivatives/exchanges', apiKey, keyType, {
            order: 'open_interest_btc_desc',
            per_page: '20',
          })
            .then((data) => { result.derivativesExchanges = data; })
            .catch((err) => { result.derivativesExchangesError = err.message; }),
        );
        break;
    }
  }

  await Promise.allSettled(fetchers);

  // Separate errors from data and include both in response
  const errors: string[] = [];
  for (const [k, v] of Object.entries(result)) {
    if (k.endsWith('Error') && typeof v === 'string') {
      errors.push(v);
    }
  }

  const hasData = Object.keys(result).some((k) => !k.endsWith('Error') && !k.endsWith('Errors'));
  if (!hasData) {
    return NextResponse.json(
      { error: errors[0] || 'Failed to fetch data from CoinGecko' },
      { status: 502 },
    );
  }

  if (errors.length > 0) {
    result._partialErrors = errors;
  }

  return NextResponse.json(result);
}
