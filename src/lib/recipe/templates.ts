/**
 * Pre-built Recipe Templates
 *
 * Standard recipes for common use cases
 */

import type { RecipeV1 } from './types';
import { generateRefreshPolicy } from './validation';

/**
 * Market Overview Recipe
 * Shows prices, 24h changes, market caps for top coins
 */
export function createMarketOverviewRecipe(coins: string[]): RecipeV1 {
  const datasets = [
    {
      id: 'prices',
      type: 'price' as const,
      provider: 'coingecko' as const,
      mode: 'byok' as const,
      params: {
        symbols: coins,
        currency: 'usd',
      },
      tableName: 'tbl_market_prices',
      sheetName: 'Market Data',
    },
    {
      id: 'movers',
      type: 'price' as const,
      provider: 'coingecko' as const,
      mode: 'public' as const,
      params: {
        limit: 10,
        sortBy: 'change_24h',
      },
      tableName: 'tbl_top_movers',
      sheetName: 'Market Data',
    },
  ];

  return {
    id: `market_overview_${Date.now()}`,
    name: 'Market Overview',
    description: 'Live prices, 24h changes, and market caps',
    category: 'market',
    version: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    datasets,

    charts: [
      {
        id: 'chart_prices',
        type: 'bar',
        title: 'Prices by Market Cap',
        datasetId: 'prices',
        sheetName: 'Charts',
        position: { col: 2, row: 2 },
        size: { width: 600, height: 400 },
        options: {
          xField: 'symbol',
          yField: 'price',
          colors: ['#10b981'],
          showLegend: false,
        },
      },
      {
        id: 'chart_changes',
        type: 'bar',
        title: '24h Price Changes',
        datasetId: 'prices',
        sheetName: 'Charts',
        position: { col: 12, row: 2 },
        size: { width: 600, height: 400 },
        options: {
          xField: 'symbol',
          yField: 'change_24h',
          colors: ['#10b981', '#ef4444'],
          showLegend: false,
        },
      },
    ],

    kpis: [
      {
        id: 'kpi_total_mcap',
        label: 'Total Market Cap',
        formula: '=SUM(tbl_market_prices[market_cap])',
        format: '$#,##0',
        cell: { sheet: 'Dashboard', col: 2, row: 2 },
        style: { fontSize: 24, bold: true, color: '#10b981' },
      },
      {
        id: 'kpi_avg_change',
        label: 'Avg 24h Change',
        formula: '=AVERAGE(tbl_market_prices[change_24h])',
        format: '0.00%',
        cell: { sheet: 'Dashboard', col: 2, row: 4 },
        style: { fontSize: 24, bold: true },
      },
    ],

    refreshPolicy: generateRefreshPolicy(datasets),

    metadata: {
      difficulty: 'beginner',
      tags: ['market', 'prices', 'overview'],
      isPublic: true,
    },
  };
}

/**
 * Technical Analysis Recipe
 * OHLCV + indicators for a single coin
 */
export function createTechnicalAnalysisRecipe(coin: string, days: number = 90): RecipeV1 {
  const datasets = [
    {
      id: 'ohlcv',
      type: 'ohlcv' as const,
      provider: 'coingecko' as const,
      mode: 'byok' as const,
      params: {
        symbols: [coin],
        interval: '1d',
        lookback: days,
      },
      tableName: 'tbl_ohlcv',
      sheetName: 'Price History',
    },
    {
      id: 'indicators',
      type: 'ta' as const,
      provider: 'local' as const,
      mode: 'computed' as const,
      params: {
        symbol: coin,
        indicators: ['rsi', 'macd', 'sma_20', 'sma_50'],
      },
      tableName: 'tbl_indicators',
      sheetName: 'Indicators',
    },
  ];

  return {
    id: `ta_${coin}_${Date.now()}`,
    name: `${coin.toUpperCase()} Technical Analysis`,
    description: `OHLCV data and technical indicators for ${coin}`,
    category: 'ta',
    version: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    datasets,

    charts: [
      {
        id: 'chart_candlestick',
        type: 'candlestick',
        title: `${coin.toUpperCase()} Price Chart`,
        datasetId: 'ohlcv',
        sheetName: 'Charts',
        position: { col: 2, row: 2 },
        size: { width: 800, height: 500 },
        options: {
          xField: 'date',
          yField: ['open', 'high', 'low', 'close'],
          showGrid: true,
        },
      },
      {
        id: 'chart_volume',
        type: 'bar',
        title: 'Volume',
        datasetId: 'ohlcv',
        sheetName: 'Charts',
        position: { col: 2, row: 32 },
        size: { width: 800, height: 200 },
        options: {
          xField: 'date',
          yField: 'volume',
          colors: ['#6b7280'],
        },
      },
      {
        id: 'chart_rsi',
        type: 'line',
        title: 'RSI (14)',
        datasetId: 'indicators',
        sheetName: 'Charts',
        position: { col: 14, row: 2 },
        size: { width: 400, height: 300 },
        options: {
          xField: 'date',
          yField: 'rsi',
          colors: ['#8b5cf6'],
        },
      },
    ],

    kpis: [
      {
        id: 'kpi_current_price',
        label: 'Current Price',
        formula: '=INDEX(tbl_ohlcv[close], ROWS(tbl_ohlcv))',
        format: '$#,##0.00',
        cell: { sheet: 'Dashboard', col: 2, row: 2 },
        style: { fontSize: 32, bold: true, color: '#10b981' },
      },
      {
        id: 'kpi_rsi',
        label: 'RSI (14)',
        formula: '=INDEX(tbl_indicators[rsi], ROWS(tbl_indicators))',
        format: '0.00',
        cell: { sheet: 'Dashboard', col: 2, row: 5 },
        style: { fontSize: 24, bold: true },
      },
    ],

    refreshPolicy: generateRefreshPolicy(datasets),

    metadata: {
      difficulty: 'intermediate',
      tags: ['technical-analysis', 'indicators', coin],
      isPublic: true,
    },
  };
}

/**
 * DeFi Dashboard Recipe
 * TVL, yields, protocols
 */
export function createDeFiDashboardRecipe(): RecipeV1 {
  const datasets = [
    {
      id: 'protocol_tvl',
      type: 'defi_tvl' as const,
      provider: 'defillama' as const,
      mode: 'public' as const,
      params: {
        limit: 20,
      },
      tableName: 'tbl_protocol_tvl',
      sheetName: 'DeFi Data',
    },
    {
      id: 'chain_tvl',
      type: 'defi_tvl' as const,
      provider: 'defillama' as const,
      mode: 'public' as const,
      params: {
        type: 'chains',
        limit: 15,
      },
      tableName: 'tbl_chain_tvl',
      sheetName: 'DeFi Data',
    },
  ];

  return {
    id: `defi_dashboard_${Date.now()}`,
    name: 'DeFi Dashboard',
    description: 'Protocol TVL, chain metrics, and DeFi trends',
    category: 'defi',
    version: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    datasets,

    charts: [
      {
        id: 'chart_protocol_tvl',
        type: 'bar',
        title: 'Top Protocols by TVL',
        datasetId: 'protocol_tvl',
        sheetName: 'Charts',
        position: { col: 2, row: 2 },
        size: { width: 700, height: 500 },
        options: {
          xField: 'name',
          yField: 'tvl',
          colors: ['#10b981'],
        },
      },
      {
        id: 'chart_chain_tvl',
        type: 'pie',
        title: 'TVL by Chain',
        datasetId: 'chain_tvl',
        sheetName: 'Charts',
        position: { col: 12, row: 2 },
        size: { width: 500, height: 500 },
        options: {
          xField: 'name',
          yField: 'tvl',
          showLegend: true,
        },
      },
    ],

    kpis: [
      {
        id: 'kpi_total_tvl',
        label: 'Total TVL',
        formula: '=SUM(tbl_protocol_tvl[tvl])',
        format: '$#,##0,,,"B"',
        cell: { sheet: 'Dashboard', col: 2, row: 2 },
        style: { fontSize: 32, bold: true, color: '#10b981' },
      },
    ],

    refreshPolicy: generateRefreshPolicy(datasets),

    metadata: {
      difficulty: 'beginner',
      tags: ['defi', 'tvl', 'protocols'],
      isPublic: true,
    },
  };
}

/**
 * Sentiment Analysis Recipe
 * Fear & Greed, news, social metrics
 */
export function createSentimentRecipe(): RecipeV1 {
  const datasets = [
    {
      id: 'fear_greed',
      type: 'fear_greed' as const,
      provider: 'alternative' as const,
      mode: 'public' as const,
      params: {
        limit: 30,
      },
      tableName: 'tbl_fear_greed',
      sheetName: 'Sentiment',
    },
    {
      id: 'reddit_sentiment',
      type: 'sentiment' as const,
      provider: 'reddit' as const,
      mode: 'byok' as const,
      params: {
        subreddits: ['cryptocurrency', 'bitcoin', 'ethereum'],
        lookback: 7,
      },
      tableName: 'tbl_reddit',
      sheetName: 'Social',
    },
  ];

  return {
    id: `sentiment_${Date.now()}`,
    name: 'Sentiment Dashboard',
    description: 'Fear & Greed Index, social sentiment, and market mood',
    category: 'sentiment',
    version: '1.0',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    datasets,

    charts: [
      {
        id: 'chart_fear_greed',
        type: 'line',
        title: 'Fear & Greed Index (30 days)',
        datasetId: 'fear_greed',
        sheetName: 'Charts',
        position: { col: 2, row: 2 },
        size: { width: 800, height: 400 },
        options: {
          xField: 'date',
          yField: 'value',
          colors: ['#ef4444', '#f59e0b', '#10b981'],
          showGrid: true,
        },
      },
    ],

    kpis: [
      {
        id: 'kpi_current_fng',
        label: 'Current Fear & Greed',
        formula: '=INDEX(tbl_fear_greed[value], 1)',
        format: '0',
        cell: { sheet: 'Dashboard', col: 2, row: 2 },
        style: { fontSize: 48, bold: true, color: '#10b981' },
      },
      {
        id: 'kpi_fng_class',
        label: 'Classification',
        formula: '=INDEX(tbl_fear_greed[classification], 1)',
        format: '@',
        cell: { sheet: 'Dashboard', col: 2, row: 4 },
        style: { fontSize: 20, bold: false },
      },
    ],

    refreshPolicy: generateRefreshPolicy(datasets),

    metadata: {
      difficulty: 'beginner',
      tags: ['sentiment', 'fear-greed', 'social'],
      isPublic: true,
    },
  };
}

/**
 * Get all available recipe templates
 */
export const RECIPE_TEMPLATES = [
  {
    id: 'market_overview',
    name: 'Market Overview',
    description: 'Top coins with prices, changes, and market caps',
    category: 'market',
    icon: '📊',
    builder: createMarketOverviewRecipe,
  },
  {
    id: 'technical_analysis',
    name: 'Technical Analysis',
    description: 'OHLCV data and technical indicators',
    category: 'ta',
    icon: '📈',
    builder: createTechnicalAnalysisRecipe,
  },
  {
    id: 'defi_dashboard',
    name: 'DeFi Dashboard',
    description: 'Protocol TVL and DeFi metrics',
    category: 'defi',
    icon: '🏦',
    builder: createDeFiDashboardRecipe,
  },
  {
    id: 'sentiment',
    name: 'Sentiment Analysis',
    description: 'Fear & Greed Index and social sentiment',
    category: 'sentiment',
    icon: '😨',
    builder: createSentimentRecipe,
  },
] as const;
