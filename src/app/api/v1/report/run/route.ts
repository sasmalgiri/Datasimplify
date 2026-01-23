/**
 * Report Run API - Pack Approach
 *
 * Executes a report recipe and returns data for Excel pack consumption.
 * This enables the "report-first" approach where pre-built Excel workbooks
 * contain a hidden __CRK__ sheet with recipe JSON, and this endpoint
 * returns the data needed to populate tables/charts.
 *
 * POST /api/v1/report/run
 *
 * Request body:
 * {
 *   recipe_id?: string,        // OR
 *   recipe?: RecipeConfig,     // Inline recipe
 * }
 *
 * Response:
 * {
 *   tables: {
 *     prices: [...],
 *     ohlcv: [...],
 *     movers: [...],
 *     ...
 *   },
 *   meta: {
 *     generated_at: string,
 *     provider: string,
 *     using_pro_key: boolean,
 *   }
 * }
 */

import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { decryptApiKey } from '@/lib/encryption';
import {
  checkEntitlement,
  createEntitlementErrorResponse,
  applyPlanLimits,
} from '@/lib/entitlements';

// Recipe configuration types
interface RecipeConfig {
  coins: string[];
  metrics?: ('price' | 'ohlcv' | 'movers' | 'market_cap' | 'volume' | 'change_24h')[];
  currency?: string;
  ohlcv_days?: number;
  movers_count?: number;
  include_global?: boolean;
}

interface PriceData {
  coin: string;
  price: number;
  price_formatted: string;
  change_24h: number;
  change_24h_formatted: string;
  market_cap: number;
  market_cap_formatted: string;
  volume_24h: number;
  rank?: number;
}

interface OHLCVData {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
}

interface MoverData {
  coin: string;
  price: number;
  change_24h: number;
  direction: 'up' | 'down';
}

interface GlobalData {
  total_market_cap: number;
  total_volume_24h: number;
  btc_dominance: number;
  eth_dominance: number;
  active_cryptocurrencies: number;
}

interface ReportResponse {
  tables: {
    prices?: PriceData[];
    ohlcv?: Record<string, OHLCVData[]>;
    movers_up?: MoverData[];
    movers_down?: MoverData[];
    global?: GlobalData;
  };
  meta: {
    generated_at: string;
    provider: string;
    using_pro_key: boolean;
    coins_requested: number;
    coins_returned: number;
    recipe_id?: string;
    plan?: string;
    was_limited?: boolean;
  };
  errors?: Array<{
    type: 'price' | 'ohlcv' | 'global' | 'validation';
    coin?: string;
    message: string;
    code: string;
  }>;
  warnings?: string[];
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Authenticate user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 }
    );
  }

  // Parse request body
  let body: { recipe_id?: string; recipe?: RecipeConfig };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const { recipe_id, recipe: inlineRecipe } = body;

  // Get recipe from database or use inline
  let recipe: RecipeConfig;

  if (recipe_id) {
    const { data: recipeData, error } = await supabase
      .from('report_recipes')
      .select('recipe_json')
      .eq('id', recipe_id)
      .eq('user_id', user.id)
      .single();

    if (error || !recipeData) {
      return NextResponse.json(
        { error: 'Recipe not found', code: 'RECIPE_NOT_FOUND' },
        { status: 404 }
      );
    }

    recipe = recipeData.recipe_json as RecipeConfig;
  } else if (inlineRecipe) {
    recipe = inlineRecipe;
  } else {
    return NextResponse.json(
      { error: 'Either recipe_id or recipe is required', code: 'MISSING_RECIPE' },
      { status: 400 }
    );
  }

  // Validate recipe
  if (!recipe.coins || !Array.isArray(recipe.coins) || recipe.coins.length === 0) {
    return NextResponse.json(
      { error: 'Recipe must include at least one coin', code: 'INVALID_RECIPE' },
      { status: 400 }
    );
  }

  // Check entitlement with coins limit
  const entitlementCheck = await checkEntitlement(supabase, user.id, {
    coinsRequested: recipe.coins.length,
    ohlcvDaysRequested: recipe.ohlcv_days,
  });
  if (!entitlementCheck.allowed) {
    return NextResponse.json(
      createEntitlementErrorResponse(entitlementCheck),
      { status: entitlementCheck.status || 403 }
    );
  }

  const entitlement = entitlementCheck.entitlement!;

  // Apply plan limits to recipe
  const { coins: limitedCoins, ohlcvDays: limitedOhlcvDays, wasLimited } = applyPlanLimits(
    entitlement,
    {
      coins: recipe.coins,
      ohlcvDays: recipe.ohlcv_days,
    }
  );

  // Sanitize coins
  const sanitizedCoins = limitedCoins
    .map((coin) =>
      coin
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '')
        .slice(0, 100)
    )
    .filter(Boolean);

  if (sanitizedCoins.length === 0) {
    return NextResponse.json(
      { error: 'No valid coins in recipe', code: 'NO_VALID_COINS' },
      { status: 400 }
    );
  }

  // Get user's CoinGecko key if available
  const { data: keyData } = await supabase
    .from('provider_keys')
    .select('encrypted_key, is_valid')
    .eq('user_id', user.id)
    .eq('provider', 'coingecko')
    .single();

  let apiKey: string | null = null;
  let usingProApi = false;

  if (keyData?.encrypted_key && keyData.is_valid) {
    try {
      apiKey = decryptApiKey(keyData.encrypted_key);
      usingProApi = true;
    } catch (err) {
      console.error('Failed to decrypt API key:', err);
      await supabase
        .from('provider_keys')
        .update({ is_valid: false })
        .eq('user_id', user.id)
        .eq('provider', 'coingecko');
    }
  }

  // Build API base URL
  const baseUrl = usingProApi
    ? 'https://pro-api.coingecko.com/api/v3'
    : 'https://api.coingecko.com/api/v3';

  const headers: HeadersInit = {
    Accept: 'application/json',
  };

  if (apiKey) {
    headers['x-cg-pro-api-key'] = apiKey;
  }

  const currency = recipe.currency?.toLowerCase() || 'usd';
  const metrics = recipe.metrics || ['price', 'change_24h', 'market_cap'];

  // Initialize response with error tracking
  const errors: Array<{
    type: 'price' | 'ohlcv' | 'global' | 'validation';
    coin?: string;
    message: string;
    code: string;
  }> = [];
  const warnings: string[] = [];

  const response: ReportResponse = {
    tables: {},
    meta: {
      generated_at: new Date().toISOString(),
      provider: 'coingecko',
      using_pro_key: usingProApi,
      coins_requested: recipe.coins.length,
      coins_returned: 0,
      recipe_id,
      plan: entitlement.tier,
      was_limited: wasLimited,
    },
    errors: [],
    warnings: [],
  };

  if (wasLimited) {
    warnings.push(
      `Your plan limits were applied. Requested ${recipe.coins.length} coins, returning ${sanitizedCoins.length}.`
    );
  }

  try {
    // Fetch prices for all coins
    if (metrics.some((m) => ['price', 'change_24h', 'market_cap', 'volume'].includes(m))) {
      try {
        const priceData = await fetchPrices(
          baseUrl,
          headers,
          sanitizedCoins,
          currency
        );
        response.tables.prices = priceData;
        response.meta.coins_returned = priceData.length;

        if (priceData.length < sanitizedCoins.length) {
          const missingCount = sanitizedCoins.length - priceData.length;
          warnings.push(
            `${missingCount} coin(s) could not be fetched. They may have been delisted or renamed.`
          );
        }

        // Generate movers if requested
        if (metrics.includes('movers') || recipe.movers_count) {
          const count = recipe.movers_count || 5;
          const sorted = [...priceData].sort(
            (a, b) => b.change_24h - a.change_24h
          );
          response.tables.movers_up = sorted.slice(0, count).map((d) => ({
            coin: d.coin,
            price: d.price,
            change_24h: d.change_24h,
            direction: 'up' as const,
          }));
          response.tables.movers_down = sorted
            .slice(-count)
            .reverse()
            .map((d) => ({
              coin: d.coin,
              price: d.price,
              change_24h: d.change_24h,
              direction: 'down' as const,
            }));
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push({
          type: 'price',
          message: `Failed to fetch price data: ${errorMessage}`,
          code: errorMessage.includes('429') ? 'RATE_LIMITED' : 'PRICE_FETCH_FAILED',
        });
        console.error('Price fetch error:', err);
      }
    }

    // Fetch OHLCV data if requested
    if (metrics.includes('ohlcv')) {
      const days = limitedOhlcvDays;
      // Only fetch OHLCV for first 5 coins to avoid rate limits
      const ohlcvCoins = sanitizedCoins.slice(0, 5);
      const ohlcvData: Record<string, OHLCVData[]> = {};
      let ohlcvSuccessCount = 0;

      for (const coin of ohlcvCoins) {
        try {
          const data = await fetchOHLCV(baseUrl, headers, coin, days);
          ohlcvData[coin] = data;
          ohlcvSuccessCount++;
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          errors.push({
            type: 'ohlcv',
            coin,
            message: `Failed to fetch OHLCV for ${coin}: ${errorMessage}`,
            code: errorMessage.includes('429') ? 'RATE_LIMITED' : 'OHLCV_FETCH_FAILED',
          });
          console.error(`OHLCV fetch error for ${coin}:`, err);
          // Continue with other coins
        }
      }

      response.tables.ohlcv = ohlcvData;

      if (ohlcvSuccessCount === 0 && ohlcvCoins.length > 0) {
        warnings.push('All OHLCV data fetches failed. Check your API key or plan limits.');
      } else if (ohlcvSuccessCount < ohlcvCoins.length) {
        warnings.push(
          `OHLCV data retrieved for ${ohlcvSuccessCount}/${ohlcvCoins.length} coins.`
        );
      }
    }

    // Fetch global data if requested
    if (recipe.include_global) {
      try {
        const globalData = await fetchGlobal(baseUrl, headers);
        response.tables.global = globalData;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        errors.push({
          type: 'global',
          message: `Failed to fetch global market data: ${errorMessage}`,
          code: errorMessage.includes('429') ? 'RATE_LIMITED' : 'GLOBAL_FETCH_FAILED',
        });
        console.error('Global data fetch error:', err);
      }
    }

    // Add errors and warnings to response
    response.errors = errors.length > 0 ? errors : undefined;
    response.warnings = warnings.length > 0 ? warnings : undefined;

    // Log usage event (including errors for debugging)
    void (async () => {
      try {
        await supabase.from('usage_events').insert({
          user_id: user.id,
          event_type: 'report_run',
          metadata: {
            coins_count: sanitizedCoins.length,
            metrics,
            usingProKey: usingProApi,
            recipe_id,
            errors_count: errors.length,
            warnings_count: warnings.length,
            success: errors.length === 0,
          },
        });
      } catch (err) {
        console.error('Failed to log usage:', err);
      }
    })();

    // Return partial success if we got some data
    const hasAnyData =
      (response.tables.prices && response.tables.prices.length > 0) ||
      (response.tables.ohlcv && Object.keys(response.tables.ohlcv).length > 0) ||
      response.tables.global;

    if (!hasAnyData && errors.length > 0) {
      // Complete failure - all data fetches failed
      return NextResponse.json(
        {
          error: 'All data fetches failed',
          code: 'COMPLETE_FAILURE',
          details: errors,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(response);
  } catch (err) {
    console.error('Report run error:', err);

    // Log critical error
    void (async () => {
      try {
        await supabase.from('usage_events').insert({
          user_id: user.id,
          event_type: 'report_run_error',
          metadata: {
            error: err instanceof Error ? err.message : 'Unknown error',
            stack: err instanceof Error ? err.stack : undefined,
            recipe_id,
            coins_count: sanitizedCoins.length,
          },
        });
      } catch (logErr) {
        console.error('Failed to log error:', logErr);
      }
    })();

    if (err instanceof Error) {
      // Rate limit error
      if (err.message.includes('429')) {
        return NextResponse.json(
          {
            error: 'Rate limit exceeded. Connect your own API key for higher limits.',
            code: 'RATE_LIMITED',
            suggestion: usingProApi
              ? 'Your API key may have exceeded its quota. Check your CoinGecko dashboard.'
              : 'Free tier has strict rate limits. Connect a Pro API key for higher limits.',
          },
          { status: 429 }
        );
      }

      // Timeout error
      if (err.message.includes('timeout') || err.message.includes('ETIMEDOUT')) {
        return NextResponse.json(
          {
            error: 'Request timeout. The API provider took too long to respond.',
            code: 'TIMEOUT',
            suggestion: 'Try again with fewer coins or a shorter time range.',
          },
          { status: 504 }
        );
      }

      // Network error
      if (err.message.includes('ENOTFOUND') || err.message.includes('ECONNREFUSED')) {
        return NextResponse.json(
          {
            error: 'Network error. Could not connect to the data provider.',
            code: 'NETWORK_ERROR',
            suggestion: 'Check your internet connection and try again.',
          },
          { status: 503 }
        );
      }
    }

    // Generic error with details
    return NextResponse.json(
      {
        error: 'Failed to generate report',
        code: 'GENERATION_FAILED',
        details: err instanceof Error ? err.message : 'Unknown error',
        suggestion: 'Please try again. If the problem persists, contact support.',
      },
      { status: 500 }
    );
  }
}

/**
 * Retry a fetch operation with exponential backoff
 * Retries on transient errors (5xx, network errors, timeouts)
 */
async function retryFetch<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err instanceof Error ? err : new Error('Unknown error');

      // Don't retry on client errors (4xx) except 429
      if (lastError.message.includes('400') || lastError.message.includes('401') || lastError.message.includes('403') || lastError.message.includes('404')) {
        throw lastError;
      }

      // Only retry on transient errors (5xx, 429, network)
      const isTransient =
        lastError.message.includes('5') ||
        lastError.message.includes('429') ||
        lastError.message.includes('timeout') ||
        lastError.message.includes('ETIMEDOUT') ||
        lastError.message.includes('ENOTFOUND') ||
        lastError.message.includes('ECONNREFUSED');

      if (!isTransient || attempt === maxRetries - 1) {
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = baseDelay * Math.pow(2, attempt) + Math.random() * 1000;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * Fetch prices for multiple coins (with retry logic)
 */
async function fetchPrices(
  baseUrl: string,
  headers: HeadersInit,
  coins: string[],
  currency: string
): Promise<PriceData[]> {
  // CoinGecko allows up to 250 coins per request
  const batches = [];
  for (let i = 0; i < coins.length; i += 250) {
    batches.push(coins.slice(i, i + 250));
  }

  const results: PriceData[] = [];

  for (const batch of batches) {
    const url = `${baseUrl}/simple/price?ids=${batch.join(',')}&vs_currencies=${currency}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;

    try {
      const data = await retryFetch(async () => {
        const response = await fetch(url, { headers });

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error('429 Rate limited');
          }
          throw new Error(`${response.status} HTTP error`);
        }

        return await response.json();
      });

      for (const coinId of batch) {
        const coinData = data[coinId];
        if (coinData) {
          const price = coinData[currency] || 0;
          const change = coinData[`${currency}_24h_change`] || 0;
          const marketCap = coinData[`${currency}_market_cap`] || 0;
          const volume = coinData[`${currency}_24h_vol`] || 0;

          results.push({
            coin: coinId,
            price,
            price_formatted: formatCurrency(price, currency),
            change_24h: change,
            change_24h_formatted: formatPercent(change),
            market_cap: marketCap,
            market_cap_formatted: formatLargeNumber(marketCap),
            volume_24h: volume,
          });
        }
      }
    } catch (err) {
      console.error(`Batch price fetch error:`, err);
      // Continue with next batch
    }
  }

  return results;
}

/**
 * Fetch OHLCV data for a single coin (with retry logic)
 */
async function fetchOHLCV(
  baseUrl: string,
  headers: HeadersInit,
  coin: string,
  days: number
): Promise<OHLCVData[]> {
  const url = `${baseUrl}/coins/${coin}/ohlc?vs_currency=usd&days=${days}`;

  return await retryFetch(async () => {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`OHLCV fetch failed: ${response.status}`);
    }

    const data = await response.json();

    // CoinGecko returns [[timestamp, open, high, low, close], ...]
    return data.map((row: [number, number, number, number, number]) => ({
      timestamp: row[0],
      date: new Date(row[0]).toISOString().split('T')[0],
      open: row[1],
      high: row[2],
      low: row[3],
      close: row[4],
    }));
  });
}

/**
 * Fetch global market data (with retry logic)
 */
async function fetchGlobal(
  baseUrl: string,
  headers: HeadersInit
): Promise<GlobalData> {
  const url = `${baseUrl}/global`;

  return await retryFetch(async () => {
    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Global fetch failed: ${response.status}`);
    }

    const data = await response.json();
    const globalData = data.data;

    return {
      total_market_cap: globalData.total_market_cap?.usd || 0,
      total_volume_24h: globalData.total_volume?.usd || 0,
      btc_dominance: globalData.market_cap_percentage?.btc || 0,
      eth_dominance: globalData.market_cap_percentage?.eth || 0,
      active_cryptocurrencies: globalData.active_cryptocurrencies || 0,
    };
  });
}

/**
 * Format currency value
 */
function formatCurrency(value: number, currency: string): string {
  const symbol = currency.toUpperCase() === 'USD' ? '$' : currency.toUpperCase();

  if (value >= 1) {
    return `${symbol}${value.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  // For small values, show more decimals
  return `${symbol}${value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  })}`;
}

/**
 * Format percentage
 */
function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

/**
 * Format large numbers (market cap, volume)
 */
function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}
