import { NextRequest, NextResponse } from 'next/server';
import { buildCacheKey, getCached, setCache } from './response-cache';

const COINGECKO_API = 'https://api.coingecko.com/api/v3';
const COINGECKO_PRO_API = 'https://pro-api.coingecko.com/api/v3';
const FEAR_GREED_API = 'https://api.alternative.me/fng/?format=json';

// DeFi Llama APIs (free, no key needed)
const DEFILLAMA_API = 'https://api.llama.fi';
const DEFILLAMA_YIELDS_API = 'https://yields.llama.fi';
const DEFILLAMA_STABLECOINS_API = 'https://stablecoins.llama.fi';

// Alchemy JSON-RPC — multi-chain support
const ALCHEMY_CHAINS: Record<string, { label: string; url: string; explorer: string }> = {
  'eth-mainnet':     { label: 'Ethereum',  url: 'https://eth-mainnet.g.alchemy.com/v2',     explorer: 'https://etherscan.io' },
  'polygon-mainnet': { label: 'Polygon',   url: 'https://polygon-mainnet.g.alchemy.com/v2', explorer: 'https://polygonscan.com' },
  'arb-mainnet':     { label: 'Arbitrum',  url: 'https://arb-mainnet.g.alchemy.com/v2',     explorer: 'https://arbiscan.io' },
  'base-mainnet':    { label: 'Base',      url: 'https://base-mainnet.g.alchemy.com/v2',    explorer: 'https://basescan.org' },
  'opt-mainnet':     { label: 'Optimism',  url: 'https://opt-mainnet.g.alchemy.com/v2',     explorer: 'https://optimistic.etherscan.io' },
};

// Endpoints that don't require a CoinGecko API key
const KEY_FREE_ENDPOINTS = new Set([
  'defillama_protocols',
  'defillama_chains',
  'defillama_yields',
  'defillama_stablecoins',
  'defillama_protocol_tvl',
  'defillama_dex_overview',
  'defillama_fees_overview',
  'defillama_tvl_history',
]);

// Tiered in-memory rate limiter per IP
// BYOK users: 30 req/min — Server (shared) key users: 10 req/min
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string, isServerKey: boolean): boolean {
  const limit = isServerKey ? 10 : 30;
  const now = Date.now();
  const entry = rateLimits.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimits.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= limit) return false;
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

/** Fetch from any URL with a 10s timeout */
async function fetchExternal(url: string): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(url, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`External API error: ${res.status}`);
    return await res.json();
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('External API request timed out');
    throw err;
  }
}

/** Fetch from Alchemy JSON-RPC */
async function fetchAlchemy(
  alchemyKey: string,
  method: string,
  params: any[],
  chain: string = 'eth-mainnet',
): Promise<any> {
  const chainConfig = ALCHEMY_CHAINS[chain] || ALCHEMY_CHAINS['eth-mainnet'];
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const res = await fetch(`${chainConfig.url}/${alchemyKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`Alchemy API error: ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error.message || 'Alchemy RPC error');
    return data.result;
  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') throw new Error('Alchemy request timed out');
    throw err;
  }
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { apiKey, alchemyKey, walletAddress, alchemyChain, endpoints, params } = body;

  if (!endpoints || !Array.isArray(endpoints) || endpoints.length === 0) {
    return NextResponse.json({ error: 'At least one endpoint required' }, { status: 400 });
  }

  // Determine which key to use: user BYOK → server fallback
  const needsCoinGeckoKey = endpoints.some((ep: string) => !KEY_FREE_ENDPOINTS.has(ep) && ep !== 'fear_greed' && !ep.startsWith('alchemy_'));
  const userProvidedKey = apiKey && typeof apiKey === 'string' && apiKey.length >= 8;
  const serverKey = process.env.COINGECKO_API_KEY;
  const usingServerKey = needsCoinGeckoKey && !userProvidedKey;

  if (usingServerKey && !serverKey) {
    return NextResponse.json({ error: 'Valid CoinGecko API key required' }, { status: 400 });
  }

  // Tiered rate limit: stricter for shared server key, relaxed for BYOK users
  if (!checkRateLimit(ip, usingServerKey)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment.' },
      { status: 429 },
    );
  }

  const effectiveKey = userProvidedKey ? apiKey : (serverKey || '');
  const effectiveKeyType = detectKeyType(effectiveKey);
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
      // ── CoinGecko endpoints ──
      case 'markets': {
        const marketParams = {
          vs_currency: params?.vsCurrency || 'usd',
          order: params?.sortOrder || 'market_cap_desc',
          per_page: String(params?.perPage || 100),
          page: '1',
          sparkline: 'true',
          price_change_percentage: '24h,7d',
        };
        const mKey = buildCacheKey('markets', marketParams);
        const mCached = usingServerKey ? getCached(mKey) : null;
        if (mCached) { result.markets = mCached; }
        else {
          fetchers.push(
            fetchCoinGecko('/coins/markets', effectiveKey, effectiveKeyType, marketParams)
              .then((data) => { result.markets = data; if (usingServerKey) setCache(mKey, data, 'markets'); })
              .catch((err) => { result.marketsError = err.message; }),
          );
        }
        break;
      }

      case 'global': {
        const gKey = buildCacheKey('global', {});
        const gCached = usingServerKey ? getCached(gKey) : null;
        if (gCached) { result.global = gCached; }
        else {
          fetchers.push(
            fetchCoinGecko('/global', effectiveKey, effectiveKeyType)
              .then((data) => { const d = data?.data || data; result.global = d; if (usingServerKey) setCache(gKey, d, 'global'); })
              .catch((err) => { result.globalError = err.message; }),
          );
        }
        break;
      }

      case 'trending': {
        const tKey = buildCacheKey('trending', {});
        const tCached = usingServerKey ? getCached(tKey) : null;
        if (tCached) { result.trending = tCached; }
        else {
          fetchers.push(
            fetchCoinGecko('/search/trending', effectiveKey, effectiveKeyType)
              .then((data) => { const d = data?.coins || data; result.trending = d; if (usingServerKey) setCache(tKey, d, 'trending'); })
              .catch((err) => { result.trendingError = err.message; }),
          );
        }
        break;
      }

      case 'fear_greed': {
        const fgLimit = Math.min(Math.max(Number(params?.fgLimit) || 1, 1), 365);
        fetchers.push(
          fetch(`${FEAR_GREED_API}&limit=${fgLimit}`, { signal: AbortSignal.timeout(10000) })
            .then((r) => r.json())
            .then((data) => { result.fearGreed = data?.data || []; })
            .catch((err) => { result.fearGreedError = err.message; }),
        );
        break;
      }

      case 'categories': {
        const catKey = buildCacheKey('categories', {});
        const catCached = usingServerKey ? getCached(catKey) : null;
        if (catCached) { result.categories = catCached; }
        else {
          fetchers.push(
            fetchCoinGecko('/coins/categories', effectiveKey, effectiveKeyType, { order: 'market_cap_desc' })
              .then((data) => { result.categories = data; if (usingServerKey) setCache(catKey, data, 'categories'); })
              .catch((err) => { result.categoriesError = err.message; }),
          );
        }
        break;
      }

      case 'ohlc': {
        const coinId = safeCoinId(params?.coinId);
        if (coinId) {
          const ohlcParams = { vs_currency: params?.vsCurrency || 'usd', days: String(params?.days || 30) };
          const oKey = buildCacheKey(`ohlc:${coinId}`, ohlcParams);
          const oCached = usingServerKey ? getCached(oKey) : null;
          if (oCached) { result.ohlc = { ...(result.ohlc || {}), [coinId]: oCached }; }
          else {
            fetchers.push(
              fetchCoinGecko(`/coins/${coinId}/ohlc`, effectiveKey, effectiveKeyType, ohlcParams)
                .then((data) => { result.ohlc = { ...(result.ohlc || {}), [coinId]: data }; if (usingServerKey) setCache(oKey, data, 'ohlc'); })
                .catch((err) => { result.ohlcError = err.message; }),
            );
          }
        }
        break;
      }

      case 'ohlc_multi':
        if (params?.coinIds && Array.isArray(params.coinIds)) {
          const validIds = params.coinIds.map(safeCoinId).filter(Boolean).slice(0, 5) as string[];
          for (const cid of validIds) {
            const omParams = { vs_currency: params?.vsCurrency || 'usd', days: String(params?.days || 30) };
            const omKey = buildCacheKey(`ohlc:${cid}`, omParams);
            const omCached = usingServerKey ? getCached(omKey) : null;
            if (omCached) { result.ohlc = { ...(result.ohlc || {}), [cid]: omCached }; }
            else {
              fetchers.push(
                fetchCoinGecko(`/coins/${cid}/ohlc`, effectiveKey, effectiveKeyType, omParams)
                  .then((data) => { result.ohlc = { ...(result.ohlc || {}), [cid]: data }; if (usingServerKey) setCache(omKey, data, 'ohlc'); })
                  .catch((err) => { if (!result.ohlcMultiErrors) result.ohlcMultiErrors = {}; result.ohlcMultiErrors[cid] = err.message; }),
              );
            }
          }
        }
        break;

      case 'exchanges': {
        const exKey = buildCacheKey('exchanges', {});
        const exCached = usingServerKey ? getCached(exKey) : null;
        if (exCached) { result.exchanges = exCached; }
        else {
          fetchers.push(
            fetchCoinGecko('/exchanges', effectiveKey, effectiveKeyType, { per_page: '20', page: '1' })
              .then((data) => { result.exchanges = data; if (usingServerKey) setCache(exKey, data, 'exchanges'); })
              .catch((err) => { result.exchangesError = err.message; }),
          );
        }
        break;
      }

      case 'coin_history': {
        const histCoinId = safeCoinId(params?.historyCoinId);
        if (histCoinId) {
          const chParams = { vs_currency: params?.vsCurrency || 'usd', days: String(params?.historyDays || 90) };
          const chKey = buildCacheKey(`coin_history:${histCoinId}`, chParams);
          const chCached = usingServerKey ? getCached(chKey) : null;
          if (chCached) { result.coinHistory = chCached; }
          else {
            fetchers.push(
              fetchCoinGecko(`/coins/${histCoinId}/market_chart`, effectiveKey, effectiveKeyType, chParams)
                .then((data) => { result.coinHistory = data; if (usingServerKey) setCache(chKey, data, 'coin_history'); })
                .catch((err) => { result.coinHistoryError = err.message; }),
            );
          }
        }
        break;
      }

      case 'coin_detail': {
        const detailId = safeCoinId(params?.detailCoinId);
        if (detailId) {
          const cdKey = buildCacheKey(`coin_detail:${detailId}`, {});
          const cdCached = usingServerKey ? getCached(cdKey) : null;
          if (cdCached) { result.coinDetail = { ...(result.coinDetail || {}), [detailId]: cdCached }; }
          else {
            fetchers.push(
              fetchCoinGecko(`/coins/${detailId}`, effectiveKey, effectiveKeyType, {
                localization: 'false', tickers: 'false', community_data: 'true', developer_data: 'true', sparkline: 'false',
              })
                .then((data) => { result.coinDetail = { ...(result.coinDetail || {}), [detailId]: data }; if (usingServerKey) setCache(cdKey, data, 'coin_detail'); })
                .catch((err) => { result.coinDetailError = err.message; }),
            );
          }
        }
        break;
      }

      case 'defi_global': {
        const dgKey = buildCacheKey('defi_global', {});
        const dgCached = usingServerKey ? getCached(dgKey) : null;
        if (dgCached) { result.defiGlobal = dgCached; }
        else {
          fetchers.push(
            fetchCoinGecko('/global/decentralized_finance_defi', effectiveKey, effectiveKeyType)
              .then((data) => { const d = data?.data || data; result.defiGlobal = d; if (usingServerKey) setCache(dgKey, d, 'defi_global'); })
              .catch((err) => { result.defiGlobalError = err.message; }),
          );
        }
        break;
      }

      case 'derivatives': {
        const drKey = buildCacheKey('derivatives', {});
        const drCached = usingServerKey ? getCached(drKey) : null;
        if (drCached) { result.derivatives = drCached; }
        else {
          fetchers.push(
            fetchCoinGecko('/derivatives', effectiveKey, effectiveKeyType)
              .then((data) => { const d = Array.isArray(data) ? data.slice(0, 50) : data; result.derivatives = d; if (usingServerKey) setCache(drKey, d, 'derivatives'); })
              .catch((err) => { result.derivativesError = err.message; }),
          );
        }
        break;
      }

      case 'derivatives_exchanges': {
        const deKey = buildCacheKey('derivatives_exchanges', {});
        const deCached = usingServerKey ? getCached(deKey) : null;
        if (deCached) { result.derivativesExchanges = deCached; }
        else {
          fetchers.push(
            fetchCoinGecko('/derivatives/exchanges', effectiveKey, effectiveKeyType, { order: 'open_interest_btc_desc', per_page: '20' })
              .then((data) => { result.derivativesExchanges = data; if (usingServerKey) setCache(deKey, data, 'derivatives_exchanges'); })
              .catch((err) => { result.derivativesExchangesError = err.message; }),
          );
        }
        break;
      }

      // ── DeFi Llama endpoints (no API key needed) ──
      case 'defillama_protocols':
        fetchers.push(
          fetchExternal(`${DEFILLAMA_API}/protocols`)
            .then((data) => {
              // Sort by TVL, return top 100
              const sorted = (Array.isArray(data) ? data : [])
                .filter((p: any) => p.tvl > 0)
                .sort((a: any, b: any) => (b.tvl || 0) - (a.tvl || 0))
                .slice(0, 100)
                .map((p: any, i: number) => ({
                  rank: i + 1,
                  name: p.name,
                  slug: p.slug,
                  symbol: p.symbol,
                  tvl: p.tvl,
                  change_1h: p.change_1h,
                  change_1d: p.change_1d,
                  change_7d: p.change_7d,
                  category: p.category,
                  chains: p.chains?.slice(0, 5),
                  logo: p.logo,
                  mcap: p.mcap,
                }));
              result.defiProtocols = sorted;
            })
            .catch((err) => { result.defiProtocolsError = err.message; }),
        );
        break;

      case 'defillama_chains':
        fetchers.push(
          fetchExternal(`${DEFILLAMA_API}/v2/chains`)
            .then((data) => {
              const chains = (Array.isArray(data) ? data : [])
                .filter((c: any) => c.tvl > 0)
                .sort((a: any, b: any) => (b.tvl || 0) - (a.tvl || 0))
                .slice(0, 30)
                .map((c: any, i: number) => ({
                  rank: i + 1,
                  name: c.name,
                  tvl: c.tvl,
                  tokenSymbol: c.tokenSymbol,
                  gecko_id: c.gecko_id,
                }));
              result.defiChains = chains;
            })
            .catch((err) => { result.defiChainsError = err.message; }),
        );
        break;

      case 'defillama_tvl_history': {
        // Historical total DeFi TVL (daily time series, free)
        const tvlChain = params?.tvlChain; // optional: 'Ethereum', 'Solana', etc.
        const tvlUrl = tvlChain
          ? `${DEFILLAMA_API}/v2/historicalChainTvl/${encodeURIComponent(tvlChain)}`
          : `${DEFILLAMA_API}/v2/historicalChainTvl`;
        fetchers.push(
          fetchExternal(tvlUrl)
            .then((data) => {
              // Returns array of { date: unix_seconds, tvl: number }
              result.defiTvlHistory = Array.isArray(data) ? data : [];
            })
            .catch((err) => { result.defiTvlHistoryError = err.message; }),
        );
        break;
      }

      case 'defillama_yields':
        fetchers.push(
          fetchExternal(`${DEFILLAMA_YIELDS_API}/pools`)
            .then((raw) => {
              const pools = (raw?.data || [])
                .filter((p: any) => p.tvlUsd > 100000 && p.apy > 0)
                .sort((a: any, b: any) => (b.tvlUsd || 0) - (a.tvlUsd || 0))
                .slice(0, 50)
                .map((p: any) => ({
                  pool: p.pool,
                  project: p.project,
                  chain: p.chain,
                  symbol: p.symbol,
                  tvlUsd: p.tvlUsd,
                  apy: p.apy,
                  apyBase: p.apyBase,
                  apyReward: p.apyReward,
                  stablecoin: p.stablecoin,
                }));
              result.defiYields = pools;
            })
            .catch((err) => { result.defiYieldsError = err.message; }),
        );
        break;

      case 'defillama_stablecoins':
        fetchers.push(
          fetchExternal(`${DEFILLAMA_STABLECOINS_API}/stablecoins?includePrices=true`)
            .then((raw) => {
              const stablecoins = (raw?.peggedAssets || [])
                .filter((s: any) => s.circulating?.peggedUSD > 0)
                .sort((a: any, b: any) => (b.circulating?.peggedUSD || 0) - (a.circulating?.peggedUSD || 0))
                .slice(0, 30)
                .map((s: any, i: number) => ({
                  rank: i + 1,
                  name: s.name,
                  symbol: s.symbol,
                  pegType: s.pegType,
                  circulating: s.circulating?.peggedUSD || 0,
                  chains: s.chains?.slice(0, 5),
                  price: s.price,
                  gecko_id: s.gecko_id,
                }));
              result.defiStablecoins = stablecoins;
            })
            .catch((err) => { result.defiStablecoinsError = err.message; }),
        );
        break;

      case 'defillama_protocol_tvl': {
        const protocolSlug = params?.protocolSlug || 'aave';
        fetchers.push(
          fetchExternal(`${DEFILLAMA_API}/protocol/${encodeURIComponent(protocolSlug)}`)
            .then((data) => {
              // Extract chain TVLs, historical TVL, and protocol info
              const chainTvls: Record<string, number> = {};
              if (data?.chainTvls) {
                for (const [chain, info] of Object.entries(data.chainTvls as Record<string, any>)) {
                  if (info?.tvl?.length > 0) {
                    chainTvls[chain] = info.tvl[info.tvl.length - 1]?.totalLiquidityUSD || 0;
                  }
                }
              }
              // Get last 90 days of TVL history
              const tvlHistory = (data?.tvl || [])
                .slice(-90)
                .map((p: any) => ({ date: p.date, tvl: p.totalLiquidityUSD }));

              result.defiProtocolDetail = {
                name: data?.name || protocolSlug,
                slug: data?.slug || protocolSlug,
                tvl: data?.tvl?.length > 0 ? data.tvl[data.tvl.length - 1]?.totalLiquidityUSD || 0 : 0,
                chainTvls,
                tvlHistory,
                chains: data?.chains || [],
                category: data?.category || '',
                url: data?.url || '',
                logo: data?.logo || '',
                description: data?.description || '',
                symbol: data?.symbol || '',
                mcap: data?.mcap || 0,
              };
            })
            .catch((err) => { result.defiProtocolDetailError = err.message; }),
        );
        break;
      }

      case 'defillama_dex_overview':
        fetchers.push(
          fetchExternal(`${DEFILLAMA_API}/overview/dexs`)
            .then((raw) => {
              const protocols = (raw?.protocols || [])
                .filter((p: any) => (p.total24h || 0) > 0)
                .sort((a: any, b: any) => (b.total24h || 0) - (a.total24h || 0))
                .slice(0, 30)
                .map((p: any, i: number) => ({
                  rank: i + 1,
                  name: p.name || p.displayName,
                  slug: p.slug || p.module,
                  totalVolume24h: p.total24h || 0,
                  totalVolume7d: p.total7d || 0,
                  change_1d: p.change_1d || 0,
                  change_7d: p.change_7d || 0,
                  chains: (p.chains || []).slice(0, 5),
                  logo: p.logo || '',
                }));
              result.defiDexOverview = protocols;
            })
            .catch((err) => { result.defiDexOverviewError = err.message; }),
        );
        break;

      case 'defillama_fees_overview':
        fetchers.push(
          fetchExternal(`${DEFILLAMA_API}/overview/fees`)
            .then((raw) => {
              const protocols = (raw?.protocols || [])
                .filter((p: any) => (p.total24h || 0) > 0)
                .sort((a: any, b: any) => (b.total24h || 0) - (a.total24h || 0))
                .slice(0, 30)
                .map((p: any, i: number) => ({
                  rank: i + 1,
                  name: p.name || p.displayName,
                  slug: p.slug || p.module,
                  total24h: p.total24h || 0,
                  total7d: p.total7d || 0,
                  total30d: p.total30d || 0,
                  change_1d: p.change_1d || 0,
                  chains: (p.chains || []).slice(0, 5),
                  logo: p.logo || '',
                  category: p.category || '',
                }));
              result.defiFeeOverview = protocols;
            })
            .catch((err) => { result.defiFeeOverviewError = err.message; }),
        );
        break;

      // ── Alchemy endpoints (BYOK) ──
      case 'alchemy_balances':
        if (alchemyKey && walletAddress) {
          const chain = alchemyChain || 'eth-mainnet';
          fetchers.push(
            fetchAlchemy(alchemyKey, 'alchemy_getTokenBalances', [walletAddress], chain)
              .then(async (data) => {
                // Also get native balance
                const ethBalance = await fetchAlchemy(alchemyKey, 'eth_getBalance', [walletAddress, 'latest'], chain);
                const ethBalanceNum = parseInt(ethBalance, 16) / 1e18;

                // Filter non-zero balances and format
                const tokens = (data?.tokenBalances || [])
                  .filter((t: any) => t.tokenBalance !== '0x0000000000000000000000000000000000000000000000000000000000000000')
                  .slice(0, 50)
                  .map((t: any) => ({
                    contractAddress: t.contractAddress,
                    balance: t.tokenBalance,
                  }));

                result.walletBalances = {
                  address: walletAddress,
                  ethBalance: ethBalanceNum,
                  tokens,
                };
              })
              .catch((err) => { result.walletBalancesError = err.message; }),
          );
        }
        break;

      case 'alchemy_transfers':
        if (alchemyKey && walletAddress) {
          const txChain = alchemyChain || 'eth-mainnet';
          fetchers.push(
            fetchAlchemy(alchemyKey, 'alchemy_getAssetTransfers', [{
              fromBlock: '0x0',
              toBlock: 'latest',
              toAddress: walletAddress,
              category: ['external', 'erc20'],
              maxCount: '0x14', // 20 transfers
              order: 'desc',
            }], txChain)
              .then(async (inbound) => {
                // Also get outbound transfers
                const outbound = await fetchAlchemy(alchemyKey, 'alchemy_getAssetTransfers', [{
                  fromBlock: '0x0',
                  toBlock: 'latest',
                  fromAddress: walletAddress,
                  category: ['external', 'erc20'],
                  maxCount: '0x14',
                  order: 'desc',
                }], txChain);

                const formatTransfer = (t: any, direction: 'in' | 'out') => ({
                  hash: t.hash,
                  from: t.from,
                  to: t.to,
                  value: t.value,
                  asset: t.asset,
                  category: t.category,
                  blockNum: t.blockNum,
                  direction,
                });

                const transfers = [
                  ...(inbound?.transfers || []).map((t: any) => formatTransfer(t, 'in')),
                  ...(outbound?.transfers || []).map((t: any) => formatTransfer(t, 'out')),
                ].sort((a, b) => parseInt(b.blockNum, 16) - parseInt(a.blockNum, 16)).slice(0, 30);

                result.walletTransfers = { address: walletAddress, transfers };
              })
              .catch((err) => { result.walletTransfersError = err.message; }),
          );
        }
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
      { error: errors[0] || 'Failed to fetch data' },
      { status: 502 },
    );
  }

  if (errors.length > 0) {
    result._partialErrors = errors;
  }

  if (usingServerKey) {
    result._usingSharedKey = true;
  }

  return NextResponse.json(result);
}
