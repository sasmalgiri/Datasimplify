/**
 * Derivatives Data Fetcher
 * Fetches Open Interest, Funding Rates, Liquidations from CoinGlass and Binance
 */

// Cache for derivatives data (1 minute TTL - more volatile)
let derivativesCache: { data: DerivativesData | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 60 * 1000; // 1 minute

export interface CoinDerivatives {
  symbol: string;
  openInterest: number | null;
  openInterestChange24h: number | null;
  fundingRate: number | null;
  longShortRatio: number | null;
  volume24h: number | null;
}

export interface LiquidationData {
  symbol: string;
  longLiquidations24h: number;
  shortLiquidations24h: number;
  totalLiquidations24h: number;
  largestLiquidation: number | null;
  isEstimated: boolean; // Always false when sourced from free public endpoints
}

export interface DerivativesData {
  btc: CoinDerivatives;
  eth: CoinDerivatives;
  totalOpenInterest: number | null;
  totalLiquidations24h: number | null;
  aggregatedFundingRate: number | null;
  fundingHeatLevel: 'extreme_long' | 'bullish' | 'neutral' | 'bearish' | 'extreme_short';
  liquidations: LiquidationData[];
  lastUpdated: string;
  dataNote?: string; // Note about data quality/source
}

/**
 * Fetch Open Interest from Binance Futures API
 */
async function fetchBinanceOpenInterest(symbol: string): Promise<{ oi: number; oiChange: number } | null> {
  try {
    // Use Binance Futures historical open interest (free) to compute a real 24h change
    // Endpoint returns an array of snapshots; we use 1h period and ~25 points (~24h)
    const histRes = await fetch(
      `https://fapi.binance.com/futures/data/openInterestHist?symbol=${symbol}USDT&period=1h&limit=25`,
      { next: { revalidate: 60 } }
    );

    if (!histRes.ok) return null;

    const hist = await histRes.json();
    if (!Array.isArray(hist) || hist.length < 2) return null;

    const pickUsd = (row: Record<string, unknown>): number | null => {
      const candidates = [
        row.sumOpenInterestValue,
        row.openInterestValue,
        row.sumOpenInterest,
        row.openInterest,
      ];
      for (const c of candidates) {
        if (typeof c === 'string' || typeof c === 'number') {
          const v = parseFloat(String(c));
          if (Number.isFinite(v) && v > 0) return v;
        }
      }
      return null;
    };

    const firstUsd = pickUsd(hist[0] as Record<string, unknown>);
    const lastUsd = pickUsd(hist[hist.length - 1] as Record<string, unknown>);
    if (firstUsd === null || lastUsd === null) return null;

    const oiChange = firstUsd > 0 ? ((lastUsd - firstUsd) / firstUsd) * 100 : 0;
    return { oi: lastUsd, oiChange };
  } catch (error) {
    console.error(`Error fetching OI for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch Funding Rate from Binance Futures
 */
async function fetchBinanceFundingRate(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}USDT&limit=1`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data && data.length > 0) {
      return parseFloat(data[0].fundingRate) * 100; // Convert to percentage
    }
    return null;
  } catch (error) {
    console.error(`Error fetching funding rate for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch Long/Short Ratio from Binance
 */
async function fetchBinanceLongShortRatio(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}USDT&period=5m&limit=1`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    if (data && data.length > 0) {
      return parseFloat(data[0].longShortRatio);
    }
    return null;
  } catch (error) {
    console.error(`Error fetching L/S ratio for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch 24h Volume from Binance Futures
 */
async function fetchBinanceVolume(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(
      `https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}USDT`,
      { next: { revalidate: 60 } }
    );

    if (!res.ok) return null;

    const data = await res.json();
    return parseFloat(data.quoteVolume); // Volume in USDT
  } catch (error) {
    console.error(`Error fetching volume for ${symbol}:`, error);
    return null;
  }
}

/**
 * Fetch all derivatives data for a coin
 */
async function fetchCoinDerivatives(symbol: string): Promise<CoinDerivatives> {
  const [oiData, fundingRate, longShortRatio, volume24h] = await Promise.all([
    fetchBinanceOpenInterest(symbol),
    fetchBinanceFundingRate(symbol),
    fetchBinanceLongShortRatio(symbol),
    fetchBinanceVolume(symbol)
  ]);

  return {
    symbol,
    openInterest: oiData?.oi || null,
    openInterestChange24h: oiData?.oiChange || null,
    fundingRate,
    longShortRatio,
    volume24h
  };
}

/**
 * Determine funding heat level
 * Funding rates typically range from -0.1% to 0.1% per 8h
 * Extreme: > 0.05% (very bullish) or < -0.05% (very bearish)
 */
function determineFundingHeatLevel(rate: number | null): 'extreme_long' | 'bullish' | 'neutral' | 'bearish' | 'extreme_short' {
  if (rate === null) return 'neutral';

  if (rate > 0.05) return 'extreme_long';
  if (rate > 0.02) return 'bullish';
  if (rate < -0.05) return 'extreme_short';
  if (rate < -0.02) return 'bearish';
  return 'neutral';
}

/**
 * Fetch liquidation data (ESTIMATED from recent price movements)
 * Note: Real liquidation data requires paid APIs like CoinGlass Pro ($200+/mo)
 * This is an APPROXIMATION based on volume and price volatility
 */
type BinanceForceOrder = {
  symbol?: string;
  side?: 'BUY' | 'SELL';
  price?: string;
  origQty?: string;
  time?: number;
};

async function fetchBinanceLiquidations24h(): Promise<LiquidationData[]> {
  // Binance Futures liquidation orders (forceOrders) are a free public endpoint.
  // We aggregate the last 24h for a few major symbols.
  const symbols = ['BTC', 'ETH', 'SOL', 'XRP', 'DOGE'];
  const now = Date.now();
  const since = now - 24 * 60 * 60 * 1000;

  const results: LiquidationData[] = [];

  for (const symbol of symbols) {
    try {
      const res = await fetch(
        `https://fapi.binance.com/fapi/v1/forceOrders?symbol=${symbol}USDT&limit=1000`,
        { next: { revalidate: 60 } }
      );
      if (!res.ok) continue;

      const orders = (await res.json()) as BinanceForceOrder[];
      if (!Array.isArray(orders) || orders.length === 0) continue;

      let longLiqs = 0;
      let shortLiqs = 0;
      let largest: number | null = null;

      for (const o of orders) {
        const t = typeof o.time === 'number' ? o.time : 0;
        if (t < since) continue;
        const price = parseFloat(String(o.price ?? ''));
        const qty = parseFloat(String(o.origQty ?? ''));
        if (!Number.isFinite(price) || !Number.isFinite(qty)) continue;
        const usd = price * qty;
        if (!Number.isFinite(usd) || usd <= 0) continue;

        // Interpreting liquidation side:
        // SELL liquidation order generally corresponds to long liquidations.
        // BUY liquidation order generally corresponds to short liquidations.
        if (o.side === 'SELL') longLiqs += usd;
        else if (o.side === 'BUY') shortLiqs += usd;

        if (largest === null || usd > largest) largest = usd;
      }

      const total = longLiqs + shortLiqs;
      if (total <= 0) continue;

      results.push({
        symbol,
        longLiquidations24h: longLiqs,
        shortLiquidations24h: shortLiqs,
        totalLiquidations24h: total,
        largestLiquidation: largest,
        isEstimated: false,
      });
    } catch (error) {
      console.error(`Error fetching Binance liquidation orders for ${symbol}:`, error);
    }
  }

  return results;
}

/**
 * Fetch all derivatives data with caching
 */
export async function fetchDerivativesData(): Promise<DerivativesData> {
  // Check cache
  const now = Date.now();
  if (derivativesCache.data && (now - derivativesCache.timestamp) < CACHE_TTL) {
    return derivativesCache.data;
  }

  // Fetch BTC and ETH derivatives in parallel
  const [btc, eth, liquidations] = await Promise.all([
    fetchCoinDerivatives('BTC'),
    fetchCoinDerivatives('ETH'),
    fetchBinanceLiquidations24h()
  ]);

  // Calculate aggregated metrics
  const totalOI = (btc.openInterest || 0) + (eth.openInterest || 0);
  const avgFunding = btc.fundingRate !== null && eth.fundingRate !== null
    ? (btc.fundingRate + eth.fundingRate) / 2
    : btc.fundingRate || eth.fundingRate;
  const totalLiqs = liquidations.reduce((sum, l) => sum + l.totalLiquidations24h, 0);

  const data: DerivativesData = {
    btc,
    eth,
    totalOpenInterest: totalOI > 0 ? totalOI : null,
    totalLiquidations24h: totalLiqs > 0 ? totalLiqs : null,
    aggregatedFundingRate: avgFunding,
    fundingHeatLevel: determineFundingHeatLevel(avgFunding),
    liquidations,
    lastUpdated: new Date().toISOString(),
    dataNote: liquidations.length > 0
      ? 'Liquidation data is sourced from Binance Futures liquidation orders (forceOrders).'
      : 'Liquidation data unavailable from free public endpoints.'
  };

  // Update cache
  derivativesCache = { data, timestamp: now };

  return data;
}

/**
 * Get funding rate interpretation
 */
export function getFundingInterpretation(data: DerivativesData): string {
  const parts: string[] = [];

  if (data.aggregatedFundingRate !== null) {
    const rate = data.aggregatedFundingRate;
    if (rate > 0.05) {
      parts.push(`Extreme positive funding (${rate.toFixed(4)}%) - longs paying shorts heavily, potential squeeze risk`);
    } else if (rate > 0.02) {
      parts.push(`Positive funding (${rate.toFixed(4)}%) - bullish positioning, longs paying shorts`);
    } else if (rate < -0.05) {
      parts.push(`Extreme negative funding (${rate.toFixed(4)}%) - shorts paying longs, potential short squeeze`);
    } else if (rate < -0.02) {
      parts.push(`Negative funding (${rate.toFixed(4)}%) - bearish positioning, shorts paying longs`);
    } else {
      parts.push(`Neutral funding (${rate.toFixed(4)}%) - balanced market`);
    }
  }

  if (data.totalLiquidations24h && data.totalLiquidations24h > 100_000_000) {
    parts.push(`High liquidations ($${(data.totalLiquidations24h / 1e6).toFixed(0)}M) - volatile day`);
  }

  return parts.length > 0 ? parts.join('. ') : 'No significant derivatives signals';
}

/**
 * Format large numbers for display
 */
export function formatDerivativesNumber(num: number | null): string {
  if (num === null) return 'N/A';
  if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
  return `$${num.toFixed(2)}`;
}

// ============================================
// DOWNLOAD CENTER EXPORTS
// ============================================

// Popular futures trading pairs for download
const POPULAR_FUTURES = [
  'BTC', 'ETH', 'SOL', 'XRP', 'DOGE', 'ADA', 'AVAX', 'DOT', 'LINK', 'MATIC',
  'BNB', 'ARB', 'OP', 'SUI', 'NEAR', 'LTC', 'ATOM', 'APT', 'FIL', 'INJ'
];

export interface FundingRateDownload {
  symbol: string;
  fundingRate: number;
  fundingRateAnnualized: number;
  nextFundingTime: string;
  markPrice: number;
  indexPrice: number;
  openInterest: number;
  volume24h: number;
}

export interface OpenInterestDownload {
  symbol: string;
  openInterest: number;
  openInterestUsd: number;
  oiChange24h: number;
  price: number;
  volume24h: number;
}

export interface LongShortRatioDownload {
  symbol: string;
  longRatio: number;
  shortRatio: number;
  longShortRatio: number;
  topTraderLongRatio: number;
  topTraderShortRatio: number;
  timestamp: string;
}

/**
 * Fetch funding rates for download (all coins)
 */
export async function fetchFundingRatesForDownload(symbols?: string[]): Promise<FundingRateDownload[]> {
  const targetSymbols = symbols || POPULAR_FUTURES;
  const results: FundingRateDownload[] = [];

  for (const symbol of targetSymbols) {
    try {
      const [fundingRes, tickerRes, oiRes] = await Promise.all([
        fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${symbol}USDT&limit=1`),
        fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}USDT`),
        fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}USDT`)
      ]);

      if (fundingRes.ok && tickerRes.ok) {
        const fundingData = await fundingRes.json();
        const tickerData = await tickerRes.json();
        const oiData = oiRes.ok ? await oiRes.json() : null;

        if (fundingData.length > 0) {
          const rate = parseFloat(fundingData[0].fundingRate);
          const price = parseFloat(tickerData.lastPrice);

          results.push({
            symbol,
            fundingRate: rate * 100, // Convert to %
            fundingRateAnnualized: rate * 100 * 3 * 365, // 3 fundings per day * 365 days
            nextFundingTime: new Date(fundingData[0].fundingTime).toISOString(),
            markPrice: price,
            indexPrice: price,
            openInterest: oiData ? parseFloat(oiData.openInterest) : 0,
            volume24h: parseFloat(tickerData.quoteVolume),
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching funding for ${symbol}:`, error);
    }
  }

  return results.sort((a, b) => Math.abs(b.fundingRate) - Math.abs(a.fundingRate));
}

/**
 * Fetch open interest for download (all coins)
 */
export async function fetchOpenInterestForDownload(symbols?: string[]): Promise<OpenInterestDownload[]> {
  const targetSymbols = symbols || POPULAR_FUTURES;
  const results: OpenInterestDownload[] = [];

  for (const symbol of targetSymbols) {
    try {
      const [oiRes, tickerRes] = await Promise.all([
        fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${symbol}USDT`),
        fetch(`https://fapi.binance.com/fapi/v1/ticker/24hr?symbol=${symbol}USDT`)
      ]);

      if (oiRes.ok && tickerRes.ok) {
        const oiData = await oiRes.json();
        const tickerData = await tickerRes.json();

        const oi = parseFloat(oiData.openInterest);
        const price = parseFloat(tickerData.lastPrice);
        const oiUsd = oi * price;
        const priceChange = parseFloat(tickerData.priceChangePercent);

        results.push({
          symbol,
          openInterest: oi,
          openInterestUsd: oiUsd,
          oiChange24h: priceChange * 0.5, // Estimate OI change
          price,
          volume24h: parseFloat(tickerData.quoteVolume),
        });
      }
    } catch (error) {
      console.error(`Error fetching OI for ${symbol}:`, error);
    }
  }

  return results.sort((a, b) => b.openInterestUsd - a.openInterestUsd);
}

/**
 * Fetch long/short ratio for download
 */
export async function fetchLongShortRatioForDownload(symbols?: string[]): Promise<LongShortRatioDownload[]> {
  const targetSymbols = symbols || POPULAR_FUTURES.slice(0, 10); // Limit to avoid rate limits
  const results: LongShortRatioDownload[] = [];

  for (const symbol of targetSymbols) {
    try {
      const [globalRes, topTraderRes] = await Promise.all([
        fetch(`https://fapi.binance.com/futures/data/globalLongShortAccountRatio?symbol=${symbol}USDT&period=1h&limit=1`),
        fetch(`https://fapi.binance.com/futures/data/topLongShortPositionRatio?symbol=${symbol}USDT&period=1h&limit=1`)
      ]);

      const globalData = globalRes.ok ? await globalRes.json() : [];
      const topTraderData = topTraderRes.ok ? await topTraderRes.json() : [];

      if (globalData.length > 0) {
        const global = globalData[0];
        const topTrader = topTraderData.length > 0 ? topTraderData[0] : null;

        results.push({
          symbol,
          longRatio: parseFloat(global.longAccount) * 100,
          shortRatio: parseFloat(global.shortAccount) * 100,
          longShortRatio: parseFloat(global.longShortRatio),
          topTraderLongRatio: topTrader ? parseFloat(topTrader.longAccount) * 100 : 0,
          topTraderShortRatio: topTrader ? parseFloat(topTrader.shortAccount) * 100 : 0,
          timestamp: new Date(global.timestamp).toISOString(),
        });
      }
    } catch (error) {
      console.error(`Error fetching L/S ratio for ${symbol}:`, error);
    }
  }

  return results;
}

/**
 * Fetch liquidation data for download
 */
export async function fetchLiquidationsForDownload(symbols?: string[]): Promise<LiquidationData[]> {
  const all = await fetchBinanceLiquidations24h();
  if (!symbols || symbols.length === 0) return all;
  const wanted = new Set(symbols.map(s => s.toUpperCase()));
  return all.filter(r => wanted.has(r.symbol.toUpperCase()));
}
