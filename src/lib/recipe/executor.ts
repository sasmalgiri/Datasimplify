/**
 * Recipe Execution Engine
 *
 * Converts RecipeV1 → Excel workbook with data, charts, and KPIs
 */

import type { RecipeV1, DatasetConfig } from './types';

/**
 * Dataset execution result
 */
export interface DatasetResult {
  datasetId: string;
  data: any[];
  columns: string[];
  rowCount: number;
  error?: string;
}

/**
 * Recipe execution context
 */
export interface ExecutionContext {
  userId: string;
  userKeys: Record<string, string>; // Provider keys (decrypted)
  plan: 'free' | 'pro' | 'premium';
}

/**
 * Recipe execution result
 */
export interface ExecutionResult {
  success: boolean;
  datasets: DatasetResult[];
  errors: string[];
  warnings: string[];
  metadata: {
    executedAt: string;
    executionTimeMs: number;
    datasetsExecuted: number;
    totalRows: number;
  };
}

/**
 * Execute a dataset and fetch data
 */
export async function executeDataset(
  dataset: DatasetConfig,
  context: ExecutionContext
): Promise<DatasetResult> {
  const startTime = Date.now();

  try {
    // Route to appropriate data fetcher based on provider and type
    let data: any[] = [];
    let columns: string[] = [];

    switch (dataset.provider) {
      case 'coingecko':
        if (dataset.type === 'price') {
          const result = await fetchCoinGeckoPrices(dataset, context);
          data = result.data;
          columns = result.columns;
        } else if (dataset.type === 'ohlcv') {
          const result = await fetchCoinGeckoOHLCV(dataset, context);
          data = result.data;
          columns = result.columns;
        }
        break;

      case 'binance':
        if (dataset.type === 'ohlcv') {
          const result = await fetchBinanceOHLCV(dataset, context);
          data = result.data;
          columns = result.columns;
        }
        break;

      case 'alternative':
        if (dataset.type === 'fear_greed') {
          const result = await fetchFearGreed(dataset, context);
          data = result.data;
          columns = result.columns;
        }
        break;

      case 'defillama':
        if (dataset.type === 'defi_tvl') {
          const result = await fetchDeFiLlamaTVL(dataset, context);
          data = result.data;
          columns = result.columns;
        }
        break;

      case 'local':
        if (dataset.type === 'ta') {
          const result = await computeTechnicalIndicators(dataset, context);
          data = result.data;
          columns = result.columns;
        }
        break;

      default:
        throw new Error(`Provider ${dataset.provider} not yet implemented`);
    }

    return {
      datasetId: dataset.id,
      data,
      columns,
      rowCount: data.length,
    };
  } catch (error) {
    return {
      datasetId: dataset.id,
      data: [],
      columns: [],
      rowCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute entire recipe
 */
export async function executeRecipe(
  recipe: RecipeV1,
  context: ExecutionContext
): Promise<ExecutionResult> {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  const datasetResults: DatasetResult[] = [];

  // Execute all datasets in parallel
  const results = await Promise.all(
    recipe.datasets.map((dataset) => executeDataset(dataset, context))
  );

  results.forEach((result) => {
    datasetResults.push(result);
    if (result.error) {
      errors.push(`Dataset ${result.datasetId}: ${result.error}`);
    }
  });

  const totalRows = datasetResults.reduce((sum, r) => sum + r.rowCount, 0);

  return {
    success: errors.length === 0,
    datasets: datasetResults,
    errors,
    warnings,
    metadata: {
      executedAt: new Date().toISOString(),
      executionTimeMs: Date.now() - startTime,
      datasetsExecuted: datasetResults.length,
      totalRows,
    },
  };
}

// ============================================
// DATA FETCHERS (Internal)
// ============================================

/**
 * Fetch prices from CoinGecko
 */
async function fetchCoinGeckoPrices(
  dataset: DatasetConfig,
  context: ExecutionContext
): Promise<{ data: any[]; columns: string[] }> {
  const symbols = (dataset.params.symbols || []) as string[];
  const currency = String(dataset.params.currency || 'usd');

  // Get API key if available
  const apiKey = context.userKeys['coingecko'];
  const baseUrl = apiKey
    ? 'https://pro-api.coingecko.com/api/v3'
    : 'https://api.coingecko.com/api/v3';

  const headers: HeadersInit = {};
  if (apiKey) {
    headers['x-cg-pro-api-key'] = apiKey;
  }

  // Fetch data
  const ids = symbols.join(',');
  const url = `${baseUrl}/simple/price?ids=${ids}&vs_currencies=${currency}&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    throw new Error(`CoinGecko API error: ${response.status}`);
  }

  const rawData = await response.json();

  // Transform to table format
  const data = Object.entries(rawData).map(([coinId, values]: [string, any]) => ({
    coin: coinId,
    price: values[currency],
    price_formatted: `$${values[currency].toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    change_24h: values[`${currency}_24h_change`] || 0,
    change_24h_formatted: `${(values[`${currency}_24h_change`] || 0).toFixed(2)}%`,
    market_cap: values[`${currency}_market_cap`] || 0,
    market_cap_formatted: `$${((values[`${currency}_market_cap`] || 0) / 1e9).toFixed(2)}B`,
    volume_24h: values[`${currency}_24h_vol`] || 0,
  }));

  const columns = [
    'coin',
    'price',
    'price_formatted',
    'change_24h',
    'change_24h_formatted',
    'market_cap',
    'market_cap_formatted',
    'volume_24h',
  ];

  return { data, columns };
}

/**
 * Fetch OHLCV from CoinGecko
 */
async function fetchCoinGeckoOHLCV(
  dataset: DatasetConfig,
  context: ExecutionContext
): Promise<{ data: any[]; columns: string[] }> {
  const symbols = (dataset.params.symbols || []) as string[];
  const symbol = symbols[0] || 'bitcoin';
  const days = Number(dataset.params.lookback || 30);

  const apiKey = context.userKeys['coingecko'];
  const baseUrl = apiKey
    ? 'https://pro-api.coingecko.com/api/v3'
    : 'https://api.coingecko.com/api/v3';

  const headers: HeadersInit = {};
  if (apiKey) {
    headers['x-cg-pro-api-key'] = apiKey;
  }

  const url = `${baseUrl}/coins/${symbol}/ohlc?vs_currency=usd&days=${days}`;
  const response = await fetch(url, { headers });

  if (!response.ok) {
    throw new Error(`CoinGecko OHLC error: ${response.status}`);
  }

  const rawData = await response.json();

  // Transform [timestamp, open, high, low, close] to objects
  const data = rawData.map((row: number[]) => ({
    timestamp: row[0],
    date: new Date(row[0]).toLocaleDateString(),
    open: row[1],
    high: row[2],
    low: row[3],
    close: row[4],
  }));

  const columns = ['timestamp', 'date', 'open', 'high', 'low', 'close'];

  return { data, columns };
}

/**
 * Fetch OHLCV from Binance
 */
async function fetchBinanceOHLCV(
  dataset: DatasetConfig,
  context: ExecutionContext
): Promise<{ data: any[]; columns: string[] }> {
  const symbols = (dataset.params.symbols || []) as string[];
  const symbol = symbols[0] || 'BTCUSDT';
  const interval = String(dataset.params.interval || '1d');
  const limit = Number(dataset.params.limit || 100);

  const url = `https://api.binance.com/api/v3/klines?symbol=${symbol.toUpperCase()}&interval=${interval}&limit=${limit}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Binance API error: ${response.status}`);
  }

  const rawData = await response.json();

  const data = rawData.map((row: any[]) => ({
    timestamp: row[0],
    date: new Date(row[0]).toLocaleDateString(),
    open: parseFloat(row[1]),
    high: parseFloat(row[2]),
    low: parseFloat(row[3]),
    close: parseFloat(row[4]),
    volume: parseFloat(row[5]),
  }));

  const columns = ['timestamp', 'date', 'open', 'high', 'low', 'close', 'volume'];

  return { data, columns };
}

/**
 * Fetch Fear & Greed Index
 */
async function fetchFearGreed(
  dataset: DatasetConfig,
  context: ExecutionContext
): Promise<{ data: any[]; columns: string[] }> {
  const limit = Number(dataset.params.limit || 30);

  const url = `https://api.alternative.me/fng/?limit=${limit}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Alternative.me API error: ${response.status}`);
  }

  const rawData = await response.json();

  const data = rawData.data.map((item: any) => ({
    timestamp: parseInt(item.timestamp) * 1000,
    date: new Date(parseInt(item.timestamp) * 1000).toLocaleDateString(),
    value: parseInt(item.value),
    classification: item.value_classification,
  }));

  const columns = ['timestamp', 'date', 'value', 'classification'];

  return { data, columns };
}

/**
 * Fetch DeFiLlama TVL data
 */
async function fetchDeFiLlamaTVL(
  dataset: DatasetConfig,
  context: ExecutionContext
): Promise<{ data: any[]; columns: string[] }> {
  const type = dataset.params.type || 'protocols';
  const limit = dataset.params.limit || 20;

  const url =
    type === 'chains'
      ? 'https://api.llama.fi/v2/chains'
      : 'https://api.llama.fi/protocols';

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`DeFiLlama API error: ${response.status}`);
  }

  const rawData = await response.json();

  let data: any[] = [];

  if (type === 'chains') {
    data = rawData
      .slice(0, limit)
      .map((item: any) => ({
        name: item.name,
        tvl: item.tvl,
        tvl_formatted: `$${(item.tvl / 1e9).toFixed(2)}B`,
      }));
  } else {
    data = rawData
      .slice(0, limit)
      .map((item: any) => ({
        name: item.name,
        symbol: item.symbol || '',
        tvl: item.tvl,
        tvl_formatted: `$${(item.tvl / 1e9).toFixed(2)}B`,
        category: item.category || '',
      }));
  }

  const columns =
    type === 'chains'
      ? ['name', 'tvl', 'tvl_formatted']
      : ['name', 'symbol', 'tvl', 'tvl_formatted', 'category'];

  return { data, columns };
}

/**
 * Compute technical indicators locally
 */
async function computeTechnicalIndicators(
  dataset: DatasetConfig,
  context: ExecutionContext
): Promise<{ data: any[]; columns: string[] }> {
  // Placeholder - in production, this would compute RSI, MACD, etc.
  // from OHLCV data using a TA library like tulind or technicalindicators

  throw new Error('Technical indicators computation not yet implemented');
}
