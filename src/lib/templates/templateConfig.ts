/**
 * Excel Template Configuration System
 *
 * Defines template types and their configurations for generating
 * Excel files with CryptoSheets formulas (no data redistribution).
 */

// ============================================
// TEMPLATE CATEGORIES
// ============================================

export type TemplateCategoryId =
  | 'market'
  | 'technical'
  | 'onchain'
  | 'defi'
  | 'sentiment'
  | 'derivatives'
  | 'portfolio'
  | 'nft'
  | 'tokens';

export interface TemplateCategory {
  id: TemplateCategoryId;
  name: string;
  icon: string;
  order: number;
  description: string;
}

export const TEMPLATE_CATEGORIES: Record<TemplateCategoryId, TemplateCategory> = {
  market: {
    id: 'market',
    name: 'Market Data',
    icon: '📊',
    order: 1,
    description: 'Market overview, screeners, and price data',
  },
  technical: {
    id: 'technical',
    name: 'Technical Analysis',
    icon: '📈',
    order: 2,
    description: 'Indicators, charts, and historical data',
  },
  onchain: {
    id: 'onchain',
    name: 'On-Chain',
    icon: '⛓️',
    order: 3,
    description: 'Blockchain network metrics and activity',
  },
  defi: {
    id: 'defi',
    name: 'DeFi',
    icon: '🏦',
    order: 4,
    description: 'DeFi protocols, TVL, and yields',
  },
  sentiment: {
    id: 'sentiment',
    name: 'Sentiment',
    icon: '😨',
    order: 5,
    description: 'Fear & Greed, social sentiment analysis',
  },
  derivatives: {
    id: 'derivatives',
    name: 'Derivatives',
    icon: '📉',
    order: 6,
    description: 'Futures, funding rates, and liquidations',
  },
  portfolio: {
    id: 'portfolio',
    name: 'Portfolio',
    icon: '💼',
    order: 7,
    description: 'Portfolio tracking and risk analysis',
  },
  nft: {
    id: 'nft',
    name: 'NFT',
    icon: '🖼️',
    order: 8,
    description: 'NFT collections and marketplace data',
  },
  tokens: {
    id: 'tokens',
    name: 'Token Economics',
    icon: '🔓',
    order: 9,
    description: 'Token unlocks, staking, and economics',
  },
};

/**
 * Get all categories sorted by order
 */
export function getSortedCategories(): TemplateCategory[] {
  return Object.values(TEMPLATE_CATEGORIES).sort((a, b) => a.order - b.order);
}

// ============================================
// TEMPLATE TYPES
// ============================================

export type TemplateType =
  | 'screener'
  | 'compare'
  | 'risk_dashboard'
  | 'watchlist'
  // Market Analytics
  | 'market_overview'
  | 'gainers_losers'
  // Historical & Charts
  | 'ohlcv_history'
  // Technical Analysis
  | 'technical_indicators'
  // On-Chain Analytics
  | 'onchain_btc'
  | 'eth_gas_tracker'
  // DeFi Analytics
  | 'defi_tvl'
  | 'defi_yields'
  // Sentiment Analysis
  | 'fear_greed'
  | 'social_sentiment'
  // Derivatives
  | 'funding_rates'
  | 'open_interest'
  | 'liquidations'
  // Token Economics
  | 'token_unlocks'
  | 'staking_rewards'
  // NFT Market
  | 'nft_collections'
  // Portfolio & Analysis
  | 'portfolio_tracker'
  | 'correlation_matrix'
  // NEW: Additional Templates for Full Coverage
  | 'etf_tracker'
  | 'whale_tracker'
  | 'backtest_results'
  | 'macro_indicators'
  | 'exchange_flows'
  | 'mining_stats'
  | 'alerts_summary';

export interface ColumnDefinition {
  header: string;
  width?: number;
  dataType?: 'string' | 'number' | 'currency' | 'percent' | 'date';
  format?: string; // Excel number format code
}

export interface ChartDefinition {
  type: 'line' | 'bar' | 'scatter' | 'area' | 'pie';
  title: string;
  dataRange: string; // e.g., "Data!A2:B100"
  xAxis?: string;
  yAxis?: string;
  position?: {
    col: number;
    row: number;
    width?: number;
    height?: number;
  };
}

export interface SheetDefinition {
  name: string;
  type: 'data' | 'chart' | 'setup' | 'instructions';
  columns?: ColumnDefinition[];
  charts?: ChartDefinition[];
  hidden?: boolean;
}

export interface FormulaTemplate {
  column: number; // 0-indexed column number
  formulaPattern: string; // Pattern with {COIN}, {TIMEFRAME}, {CURRENCY} placeholders
  description: string;
}

export interface VBAScript {
  name: string;
  triggerOn: 'open' | 'button' | 'manual';
  code: string;
}

export interface TemplateConfig {
  id: TemplateType;
  name: string;
  description: string;
  icon: string;
  category: TemplateCategoryId;
  requiredAddons: 'cryptosheets'[];
  supportedFormats: ('xlsx' | 'xlsm')[];

  // Matching hints for smart recommendations
  coinCountHint?: 'single' | 'few' | 'many' | 'any'; // single=1, few=2-5, many=5+
  specificCoins?: string[]; // e.g., ['BTC'] for onchain_btc

  // Schema definition
  sheets: SheetDefinition[];

  // CryptoSheets formula templates
  formulas: FormulaTemplate[];

  // VBA scripts (for .xlsm version)
  vbaScripts?: VBAScript[];

  // User-facing help text
  setupInstructions?: string[];
}

/**
 * Screener Template - Market overview with filters
 */
const SCREENER_TEMPLATE: TemplateConfig = {
  id: 'screener',
  name: 'Crypto Screener',
  description: 'Real-time market data with customizable filters and metrics',
  icon: '🔍',
  category: 'market',
  coinCountHint: 'many',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],

  sheets: [
    {
      name: 'START_HERE',
      type: 'setup',
    },
    {
      name: 'Data',
      type: 'data',
      columns: [
        { header: 'Coin', width: 15, dataType: 'string' },
        { header: 'Symbol', width: 10, dataType: 'string' },
        { header: 'Price', width: 15, dataType: 'currency', format: '$#,##0.00' },
        { header: 'Market Cap', width: 18, dataType: 'currency', format: '$#,##0' },
        { header: '24h Change %', width: 15, dataType: 'percent', format: '0.00%' },
        { header: '24h Volume', width: 18, dataType: 'currency', format: '$#,##0' },
        { header: '7d Change %', width: 15, dataType: 'percent', format: '0.00%' },
        { header: 'Circulating Supply', width: 20, dataType: 'number', format: '#,##0' },
      ],
    },
    {
      name: 'Charts',
      type: 'chart',
      charts: [
        {
          type: 'bar',
          title: 'Top 10 by Market Cap',
          dataRange: 'Data!A2:D11',
          xAxis: 'Coin',
          yAxis: 'Market Cap',
          position: { col: 1, row: 2, width: 600, height: 400 },
        },
        {
          type: 'line',
          title: '24h Price Changes',
          dataRange: 'Data!A2:E11',
          xAxis: 'Coin',
          yAxis: '24h Change %',
          position: { col: 1, row: 22, width: 600, height: 400 },
        },
      ],
    },
    {
      name: 'Instructions',
      type: 'instructions',
    },
  ],

  formulas: [
    {
      column: 0, // Coin name
      formulaPattern: '=CRYPTOSHEETS("name", "{COIN}")',
      description: 'Fetch coin name from CryptoSheets',
    },
    {
      column: 1, // Symbol
      formulaPattern: '=CRYPTOSHEETS("symbol", "{COIN}")',
      description: 'Fetch coin symbol',
    },
    {
      column: 2, // Price
      formulaPattern: '=CRYPTOSHEETS("price", "{COIN}", "{CURRENCY}")',
      description: 'Current price in selected currency',
    },
    {
      column: 3, // Market Cap
      formulaPattern: '=CRYPTOSHEETS("market_cap", "{COIN}", "{CURRENCY}")',
      description: 'Total market capitalization',
    },
    {
      column: 4, // 24h Change
      formulaPattern: '=CRYPTOSHEETS("price_change_24h", "{COIN}")',
      description: '24-hour price change percentage',
    },
    {
      column: 5, // 24h Volume
      formulaPattern: '=CRYPTOSHEETS("volume_24h", "{COIN}", "{CURRENCY}")',
      description: '24-hour trading volume',
    },
    {
      column: 6, // 7d Change
      formulaPattern: '=CRYPTOSHEETS("price_change_7d", "{COIN}")',
      description: '7-day price change percentage',
    },
    {
      column: 7, // Circulating Supply
      formulaPattern: '=CRYPTOSHEETS("circulating_supply", "{COIN}")',
      description: 'Current circulating supply',
    },
  ],

  vbaScripts: [
    {
      name: 'Auto_Open',
      triggerOn: 'open',
      code: `Sub Auto_Open()
    On Error Resume Next
    Application.CalculateFullRebuild
    ActiveWorkbook.RefreshAll
    MsgBox "CryptoReportKit Screener loaded! Data is refreshing from CryptoSheets...", vbInformation, "CryptoReportKit"
End Sub`,
    },
    {
      name: 'RefreshData',
      triggerOn: 'button',
      code: `Sub RefreshData()
    On Error Resume Next
    Application.CalculateFullRebuild
    ActiveWorkbook.RefreshAll
    MsgBox "Data refreshed successfully!", vbInformation, "CryptoReportKit"
End Sub`,
    },
  ],

  setupInstructions: [
    'Install CryptoSheets add-in from Excel → Insert → Get Add-ins',
    'Sign in to your CryptoSheets account (free or paid)',
    'Click Data → Refresh All to populate the template',
    'Charts will update automatically as data loads',
    'Use the Refresh button to update data anytime',
  ],
};

/**
 * Compare Template - Side-by-side coin comparison
 */
const COMPARE_TEMPLATE: TemplateConfig = {
  id: 'compare',
  name: 'Coin Comparison',
  description: 'Compare multiple cryptocurrencies side-by-side',
  icon: '⚖️',
  category: 'portfolio',
  coinCountHint: 'few',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],

  sheets: [
    {
      name: 'START_HERE',
      type: 'setup',
    },
    {
      name: 'Comparison',
      type: 'data',
      columns: [
        { header: 'Metric', width: 25, dataType: 'string' },
        { header: 'Coin 1', width: 18, dataType: 'string' },
        { header: 'Coin 2', width: 18, dataType: 'string' },
        { header: 'Coin 3', width: 18, dataType: 'string' },
        { header: 'Coin 4', width: 18, dataType: 'string' },
        { header: 'Coin 5', width: 18, dataType: 'string' },
      ],
    },
    {
      name: 'Historical',
      type: 'data',
      columns: [
        { header: 'Date', width: 15, dataType: 'date' },
        { header: 'Coin 1 Price', width: 15, dataType: 'currency' },
        { header: 'Coin 2 Price', width: 15, dataType: 'currency' },
        { header: 'Coin 3 Price', width: 15, dataType: 'currency' },
        { header: 'Coin 4 Price', width: 15, dataType: 'currency' },
        { header: 'Coin 5 Price', width: 15, dataType: 'currency' },
      ],
    },
    {
      name: 'Charts',
      type: 'chart',
      charts: [
        {
          type: 'line',
          title: 'Price Comparison (Normalized)',
          dataRange: 'Historical!A2:F100',
          xAxis: 'Date',
          yAxis: 'Price',
          position: { col: 1, row: 2, width: 800, height: 400 },
        },
        {
          type: 'bar',
          title: 'Market Cap Comparison',
          dataRange: 'Comparison!A3:F3',
          position: { col: 1, row: 22, width: 600, height: 350 },
        },
      ],
    },
    {
      name: 'Instructions',
      type: 'instructions',
    },
  ],

  formulas: [
    // Comparison sheet formulas (static metrics)
    {
      column: 1, // Coin 1 price
      formulaPattern: '=CRYPTOSHEETS("price", "{COIN1}", "{CURRENCY}")',
      description: 'Current price for first coin',
    },
    {
      column: 2, // Coin 2 price
      formulaPattern: '=CRYPTOSHEETS("price", "{COIN2}", "{CURRENCY}")',
      description: 'Current price for second coin',
    },
    // Historical sheet formulas
    {
      column: 1, // Coin 1 historical
      formulaPattern: '=CRYPTOSHEETS("historical_price", "{COIN1}", A2, "{CURRENCY}")',
      description: 'Historical price for Coin 1',
    },
    {
      column: 2, // Coin 2 historical
      formulaPattern: '=CRYPTOSHEETS("historical_price", "{COIN2}", A2, "{CURRENCY}")',
      description: 'Historical price for Coin 2',
    },
  ],

  vbaScripts: [
    {
      name: 'Auto_Open',
      triggerOn: 'open',
      code: `Sub Auto_Open()
    On Error Resume Next
    Application.CalculateFullRebuild
    ActiveWorkbook.RefreshAll
    MsgBox "CryptoReportKit Comparison loaded! Fetching data from CryptoSheets...", vbInformation, "CryptoReportKit"
End Sub`,
    },
  ],

  setupInstructions: [
    'Install CryptoSheets add-in from Excel → Insert → Get Add-ins',
    'Sign in to your CryptoSheets account',
    'Go to the "Comparison" sheet to see current metrics',
    'Go to the "Historical" sheet for price history',
    'Charts auto-update as data loads',
  ],
};

/**
 * Risk Dashboard Template - Volatility and risk metrics
 */
const RISK_DASHBOARD_TEMPLATE: TemplateConfig = {
  id: 'risk_dashboard',
  name: 'Risk Dashboard',
  description: 'Volatility, drawdown, and risk analysis metrics',
  icon: '⚠️',
  category: 'portfolio',
  coinCountHint: 'few',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],

  sheets: [
    {
      name: 'START_HERE',
      type: 'setup',
    },
    {
      name: 'Risk_Metrics',
      type: 'data',
      columns: [
        { header: 'Coin', width: 15, dataType: 'string' },
        { header: 'Price', width: 15, dataType: 'currency' },
        { header: '30d Volatility', width: 18, dataType: 'percent', format: '0.00%' },
        { header: 'Max Drawdown', width: 18, dataType: 'percent', format: '0.00%' },
        { header: 'Sharpe Ratio', width: 15, dataType: 'number', format: '0.00' },
        { header: 'Beta (vs BTC)', width: 15, dataType: 'number', format: '0.00' },
        { header: 'VaR (95%)', width: 18, dataType: 'currency', format: '$#,##0.00' },
      ],
    },
    {
      name: 'Charts',
      type: 'chart',
      charts: [
        {
          type: 'bar',
          title: 'Volatility Comparison',
          dataRange: 'Risk_Metrics!A2:C11',
          xAxis: 'Coin',
          yAxis: '30d Volatility',
          position: { col: 1, row: 2, width: 700, height: 400 },
        },
        {
          type: 'scatter',
          title: 'Risk-Return Profile',
          dataRange: 'Risk_Metrics!C2:E11',
          xAxis: 'Volatility',
          yAxis: 'Sharpe Ratio',
          position: { col: 1, row: 22, width: 600, height: 400 },
        },
      ],
    },
    {
      name: 'Instructions',
      type: 'instructions',
    },
  ],

  formulas: [
    {
      column: 0, // Coin
      formulaPattern: '=CRYPTOSHEETS("name", "{COIN}")',
      description: 'Coin name',
    },
    {
      column: 1, // Price
      formulaPattern: '=CRYPTOSHEETS("price", "{COIN}", "{CURRENCY}")',
      description: 'Current price',
    },
    {
      column: 2, // Volatility
      formulaPattern: '=CRYPTOSHEETS("volatility", "{COIN}", "30d")',
      description: '30-day historical volatility',
    },
    {
      column: 3, // Max Drawdown
      formulaPattern: '=CRYPTOSHEETS("max_drawdown", "{COIN}", "30d")',
      description: 'Maximum drawdown in last 30 days',
    },
    {
      column: 4, // Sharpe Ratio
      formulaPattern: '=CRYPTOSHEETS("sharpe_ratio", "{COIN}", "30d")',
      description: 'Risk-adjusted return metric',
    },
    {
      column: 5, // Beta
      formulaPattern: '=CRYPTOSHEETS("beta", "{COIN}", "BTC", "30d")',
      description: 'Beta coefficient vs Bitcoin',
    },
    {
      column: 6, // VaR
      formulaPattern: '=CRYPTOSHEETS("var", "{COIN}", "95", "30d")',
      description: 'Value at Risk (95% confidence)',
    },
  ],

  vbaScripts: [
    {
      name: 'Auto_Open',
      triggerOn: 'open',
      code: `Sub Auto_Open()
    On Error Resume Next
    Application.CalculateFullRebuild
    ActiveWorkbook.RefreshAll
    MsgBox "CryptoReportKit Risk Dashboard loaded! Calculating metrics...", vbInformation, "CryptoReportKit"
End Sub`,
    },
  ],

  setupInstructions: [
    'Install CryptoSheets add-in',
    'Sign in to CryptoSheets account',
    'Risk metrics calculate automatically from historical data',
    'Higher volatility = higher risk',
    'Sharpe Ratio >1 is generally considered good',
  ],
};

/**
 * Watchlist Template - Personal tracking list
 */
const WATCHLIST_TEMPLATE: TemplateConfig = {
  id: 'watchlist',
  name: 'Personal Watchlist',
  description: 'Track your favorite coins with alerts and daily summaries',
  icon: '⭐',
  category: 'market',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],

  sheets: [
    {
      name: 'START_HERE',
      type: 'setup',
    },
    {
      name: 'Watchlist',
      type: 'data',
      columns: [
        { header: 'Coin', width: 15, dataType: 'string' },
        { header: 'Price', width: 15, dataType: 'currency' },
        { header: '1h %', width: 12, dataType: 'percent', format: '0.00%' },
        { header: '24h %', width: 12, dataType: 'percent', format: '0.00%' },
        { header: '7d %', width: 12, dataType: 'percent', format: '0.00%' },
        { header: 'Volume 24h', width: 18, dataType: 'currency' },
        { header: 'Alert Target', width: 15, dataType: 'currency' },
        { header: 'Notes', width: 30, dataType: 'string' },
      ],
    },
    {
      name: 'Summary',
      type: 'data',
      columns: [
        { header: 'Metric', width: 25, dataType: 'string' },
        { header: 'Value', width: 20, dataType: 'string' },
      ],
    },
    {
      name: 'Instructions',
      type: 'instructions',
    },
  ],

  formulas: [
    {
      column: 0, // Coin
      formulaPattern: '=CRYPTOSHEETS("name", "{COIN}")',
      description: 'Coin name',
    },
    {
      column: 1, // Price
      formulaPattern: '=CRYPTOSHEETS("price", "{COIN}", "{CURRENCY}")',
      description: 'Current price',
    },
    {
      column: 2, // 1h change
      formulaPattern: '=CRYPTOSHEETS("price_change_1h", "{COIN}")',
      description: '1-hour change',
    },
    {
      column: 3, // 24h change
      formulaPattern: '=CRYPTOSHEETS("price_change_24h", "{COIN}")',
      description: '24-hour change',
    },
    {
      column: 4, // 7d change
      formulaPattern: '=CRYPTOSHEETS("price_change_7d", "{COIN}")',
      description: '7-day change',
    },
    {
      column: 5, // Volume
      formulaPattern: '=CRYPTOSHEETS("volume_24h", "{COIN}", "{CURRENCY}")',
      description: '24-hour volume',
    },
  ],

  vbaScripts: [
    {
      name: 'Auto_Open',
      triggerOn: 'open',
      code: `Sub Auto_Open()
    On Error Resume Next
    Application.CalculateFullRebuild
    ActiveWorkbook.RefreshAll
    MsgBox "CryptoReportKit Watchlist loaded! Your coins are updating...", vbInformation, "CryptoReportKit"
End Sub`,
    },
  ],

  setupInstructions: [
    'Install CryptoSheets add-in',
    'Sign in to your CryptoSheets account',
    'Your selected coins will populate automatically',
    'Edit the "Alert Target" column to set price alerts (manual)',
    'Add personal notes in the "Notes" column',
  ],
};

// ============================================
// NEW TEMPLATES - All powered by CryptoSheets
// ============================================

/**
 * Market Overview Template - Global market dashboard
 */
const MARKET_OVERVIEW_TEMPLATE: TemplateConfig = {
  id: 'market_overview',
  name: 'Market Overview',
  description: 'Global crypto market stats, BTC dominance, and top coins',
  icon: '🌐',
  category: 'market',
  coinCountHint: 'many',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Global_Stats',
      type: 'data',
      columns: [
        { header: 'Metric', width: 25, dataType: 'string' },
        { header: 'Value', width: 20, dataType: 'string' },
        { header: 'Change 24h', width: 15, dataType: 'percent' },
      ],
    },
    {
      name: 'Top_Coins',
      type: 'data',
      columns: [
        { header: 'Rank', width: 8, dataType: 'number' },
        { header: 'Coin', width: 15, dataType: 'string' },
        { header: 'Price', width: 15, dataType: 'currency' },
        { header: 'Market Cap', width: 18, dataType: 'currency' },
        { header: '24h %', width: 12, dataType: 'percent' },
        { header: 'Volume', width: 18, dataType: 'currency' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("total_market_cap")', description: 'Total market cap' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("btc_dominance")', description: 'BTC dominance' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("total_volume_24h")', description: '24h volume' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("price", "{COIN}", "{CURRENCY}")', description: 'Coin price' },
  ],
  setupInstructions: [
    'Install CryptoSheets add-in',
    'Global stats update automatically',
    'Top coins sorted by market cap',
  ],
};

/**
 * Gainers & Losers Template
 */
const GAINERS_LOSERS_TEMPLATE: TemplateConfig = {
  id: 'gainers_losers',
  name: 'Gainers & Losers',
  description: 'Top daily performers and biggest drops',
  icon: '📊',
  category: 'market',
  coinCountHint: 'many',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Gainers',
      type: 'data',
      columns: [
        { header: 'Rank', width: 8, dataType: 'number' },
        { header: 'Coin', width: 15, dataType: 'string' },
        { header: 'Price', width: 15, dataType: 'currency' },
        { header: '24h Change %', width: 15, dataType: 'percent' },
        { header: 'Volume', width: 18, dataType: 'currency' },
      ],
    },
    {
      name: 'Losers',
      type: 'data',
      columns: [
        { header: 'Rank', width: 8, dataType: 'number' },
        { header: 'Coin', width: 15, dataType: 'string' },
        { header: 'Price', width: 15, dataType: 'currency' },
        { header: '24h Change %', width: 15, dataType: 'percent' },
        { header: 'Volume', width: 18, dataType: 'currency' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("name", "{COIN}")', description: 'Coin name' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("price", "{COIN}", "{CURRENCY}")', description: 'Price' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("price_change_24h", "{COIN}")', description: '24h change' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("volume_24h", "{COIN}", "{CURRENCY}")', description: 'Volume' },
  ],
  setupInstructions: ['Shows top gainers and losers', 'Sorted by 24h change percentage'],
};

/**
 * OHLCV History Template - Candlestick data
 */
const OHLCV_HISTORY_TEMPLATE: TemplateConfig = {
  id: 'ohlcv_history',
  name: 'OHLCV Historical Data',
  description: 'Open, High, Low, Close, Volume candlestick data',
  icon: '📈',
  category: 'technical',
  coinCountHint: 'single',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'OHLCV_Data',
      type: 'data',
      columns: [
        { header: 'Date', width: 18, dataType: 'date' },
        { header: 'Open', width: 15, dataType: 'currency' },
        { header: 'High', width: 15, dataType: 'currency' },
        { header: 'Low', width: 15, dataType: 'currency' },
        { header: 'Close', width: 15, dataType: 'currency' },
        { header: 'Volume', width: 18, dataType: 'number' },
        { header: 'Change %', width: 12, dataType: 'percent' },
      ],
    },
    { name: 'Charts', type: 'chart', charts: [{ type: 'line', title: 'Price History', dataRange: 'OHLCV_Data!A2:E100', xAxis: 'Date', yAxis: 'Price', position: { col: 1, row: 2, width: 800, height: 400 } }] },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("historical", "{COIN}", "date", {ROW})', description: 'Date' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("historical", "{COIN}", "open", {ROW})', description: 'Open' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("historical", "{COIN}", "high", {ROW})', description: 'High' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("historical", "{COIN}", "low", {ROW})', description: 'Low' },
    { column: 4, formulaPattern: '=CRYPTOSHEETS("historical", "{COIN}", "close", {ROW})', description: 'Close' },
    { column: 5, formulaPattern: '=CRYPTOSHEETS("historical", "{COIN}", "volume", {ROW})', description: 'Volume' },
  ],
  setupInstructions: ['Select coin and timeframe', 'Historical data for technical analysis'],
};

/**
 * Technical Indicators Template
 */
const TECHNICAL_INDICATORS_TEMPLATE: TemplateConfig = {
  id: 'technical_indicators',
  name: 'Technical Indicators',
  description: 'RSI, MACD, Moving Averages, Bollinger Bands',
  icon: '📉',
  category: 'technical',
  coinCountHint: 'single',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Indicators',
      type: 'data',
      columns: [
        { header: 'Coin', width: 12, dataType: 'string' },
        { header: 'Price', width: 15, dataType: 'currency' },
        { header: 'RSI(14)', width: 12, dataType: 'number' },
        { header: 'MACD', width: 12, dataType: 'number' },
        { header: 'SMA(20)', width: 15, dataType: 'currency' },
        { header: 'SMA(50)', width: 15, dataType: 'currency' },
        { header: 'SMA(200)', width: 15, dataType: 'currency' },
        { header: 'BB Upper', width: 15, dataType: 'currency' },
        { header: 'BB Lower', width: 15, dataType: 'currency' },
        { header: 'Trend', width: 12, dataType: 'string' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("symbol", "{COIN}")', description: 'Symbol' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("price", "{COIN}", "{CURRENCY}")', description: 'Price' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("rsi", "{COIN}", 14)', description: 'RSI 14' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("macd", "{COIN}")', description: 'MACD' },
    { column: 4, formulaPattern: '=CRYPTOSHEETS("sma", "{COIN}", 20)', description: 'SMA 20' },
    { column: 5, formulaPattern: '=CRYPTOSHEETS("sma", "{COIN}", 50)', description: 'SMA 50' },
    { column: 6, formulaPattern: '=CRYPTOSHEETS("sma", "{COIN}", 200)', description: 'SMA 200' },
    { column: 7, formulaPattern: '=CRYPTOSHEETS("bb_upper", "{COIN}")', description: 'BB Upper' },
    { column: 8, formulaPattern: '=CRYPTOSHEETS("bb_lower", "{COIN}")', description: 'BB Lower' },
  ],
  setupInstructions: ['Educational indicator analysis', 'RSI: <30 oversold zone, >70 overbought zone', 'MACD: positive = bullish trend, negative = bearish trend', 'For learning purposes only, not trading advice'],
};

/**
 * Bitcoin On-Chain Template
 */
const ONCHAIN_BTC_TEMPLATE: TemplateConfig = {
  id: 'onchain_btc',
  name: 'Bitcoin On-Chain',
  description: 'BTC hashrate, difficulty, active addresses, mempool',
  icon: '⛓️',
  category: 'onchain',
  specificCoins: ['BTC'],
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Network_Stats',
      type: 'data',
      columns: [
        { header: 'Metric', width: 25, dataType: 'string' },
        { header: 'Value', width: 25, dataType: 'string' },
        { header: 'Change 24h', width: 15, dataType: 'percent' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("btc_hashrate")', description: 'Hashrate' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("btc_difficulty")', description: 'Difficulty' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("btc_active_addresses")', description: 'Active addresses' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("btc_mempool_size")', description: 'Mempool size' },
    { column: 4, formulaPattern: '=CRYPTOSHEETS("btc_block_height")', description: 'Block height' },
  ],
  setupInstructions: ['Bitcoin network health metrics', 'Updated every block (~10 min)'],
};

/**
 * ETH Gas Tracker Template
 */
const ETH_GAS_TRACKER_TEMPLATE: TemplateConfig = {
  id: 'eth_gas_tracker',
  name: 'ETH Gas Tracker',
  description: 'Current Ethereum gas prices and trends',
  icon: '⛽',
  category: 'onchain',
  specificCoins: ['ETH'],
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Gas_Prices',
      type: 'data',
      columns: [
        { header: 'Speed', width: 15, dataType: 'string' },
        { header: 'Gas (Gwei)', width: 15, dataType: 'number' },
        { header: 'USD Cost', width: 15, dataType: 'currency' },
        { header: 'Wait Time', width: 15, dataType: 'string' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("eth_gas_safe")', description: 'Safe gas' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("eth_gas_standard")', description: 'Standard gas' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("eth_gas_fast")', description: 'Fast gas' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("eth_gas_instant")', description: 'Instant gas' },
  ],
  setupInstructions: ['Real-time ETH gas prices', 'Plan transactions during low gas'],
};

/**
 * DeFi TVL Template
 */
const DEFI_TVL_TEMPLATE: TemplateConfig = {
  id: 'defi_tvl',
  name: 'DeFi TVL Tracker',
  description: 'Total Value Locked across DeFi protocols',
  icon: '🏦',
  category: 'defi',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Protocols',
      type: 'data',
      columns: [
        { header: 'Rank', width: 8, dataType: 'number' },
        { header: 'Protocol', width: 20, dataType: 'string' },
        { header: 'TVL', width: 18, dataType: 'currency' },
        { header: 'TVL Change 24h', width: 15, dataType: 'percent' },
        { header: 'Chain', width: 15, dataType: 'string' },
        { header: 'Category', width: 15, dataType: 'string' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("defi_protocol", "{PROTOCOL}", "name")', description: 'Protocol name' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("defi_protocol", "{PROTOCOL}", "tvl")', description: 'TVL' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("defi_protocol", "{PROTOCOL}", "tvl_change")', description: 'TVL change' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("defi_protocol", "{PROTOCOL}", "chain")', description: 'Chain' },
  ],
  setupInstructions: ['Top DeFi protocols by TVL', 'Tracks Aave, Uniswap, Lido, etc.'],
};

/**
 * DeFi Yields Template
 */
const DEFI_YIELDS_TEMPLATE: TemplateConfig = {
  id: 'defi_yields',
  name: 'DeFi Yields',
  description: 'Best yield farming APYs across protocols',
  icon: '💰',
  category: 'defi',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Yields',
      type: 'data',
      columns: [
        { header: 'Protocol', width: 18, dataType: 'string' },
        { header: 'Pool', width: 20, dataType: 'string' },
        { header: 'APY', width: 12, dataType: 'percent' },
        { header: 'TVL', width: 18, dataType: 'currency' },
        { header: 'Chain', width: 12, dataType: 'string' },
        { header: 'Risk', width: 10, dataType: 'string' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("yield", "{POOL}", "protocol")', description: 'Protocol' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("yield", "{POOL}", "apy")', description: 'APY' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("yield", "{POOL}", "tvl")', description: 'TVL' },
  ],
  setupInstructions: ['Yield farming opportunities', 'Higher APY = higher risk usually'],
};

/**
 * Fear & Greed Template
 */
const FEAR_GREED_TEMPLATE: TemplateConfig = {
  id: 'fear_greed',
  name: 'Fear & Greed Index',
  description: 'Market sentiment with historical trends',
  icon: '😱',
  category: 'sentiment',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Current',
      type: 'data',
      columns: [
        { header: 'Metric', width: 25, dataType: 'string' },
        { header: 'Value', width: 20, dataType: 'string' },
      ],
    },
    {
      name: 'History',
      type: 'data',
      columns: [
        { header: 'Date', width: 15, dataType: 'date' },
        { header: 'Value', width: 12, dataType: 'number' },
        { header: 'Classification', width: 18, dataType: 'string' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("fear_greed_value")', description: 'Current value' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("fear_greed_label")', description: 'Classification' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("fear_greed_history", {ROW})', description: 'Historical' },
  ],
  setupInstructions: ['0-24: Extreme Fear', '25-49: Fear', '50-74: Greed', '75-100: Extreme Greed'],
};

/**
 * Social Sentiment Template
 */
const SOCIAL_SENTIMENT_TEMPLATE: TemplateConfig = {
  id: 'social_sentiment',
  name: 'Social Sentiment',
  description: 'Twitter, Reddit, news sentiment analysis',
  icon: '📱',
  category: 'sentiment',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Sentiment',
      type: 'data',
      columns: [
        { header: 'Coin', width: 12, dataType: 'string' },
        { header: 'Twitter', width: 12, dataType: 'number' },
        { header: 'Reddit', width: 12, dataType: 'number' },
        { header: 'News', width: 12, dataType: 'number' },
        { header: 'Overall', width: 12, dataType: 'number' },
        { header: 'Trend', width: 12, dataType: 'string' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("symbol", "{COIN}")', description: 'Symbol' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("sentiment_twitter", "{COIN}")', description: 'Twitter' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("sentiment_reddit", "{COIN}")', description: 'Reddit' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("sentiment_news", "{COIN}")', description: 'News' },
  ],
  setupInstructions: ['Score: -100 to +100', 'Positive = bullish sentiment'],
};

/**
 * Funding Rates Template
 */
const FUNDING_RATES_TEMPLATE: TemplateConfig = {
  id: 'funding_rates',
  name: 'Funding Rates',
  description: 'Perpetual futures funding rates across exchanges',
  icon: '📋',
  category: 'derivatives',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Funding_Rates',
      type: 'data',
      columns: [
        { header: 'Coin', width: 12, dataType: 'string' },
        { header: 'Binance', width: 12, dataType: 'percent' },
        { header: 'OKX', width: 12, dataType: 'percent' },
        { header: 'Bybit', width: 12, dataType: 'percent' },
        { header: 'Average', width: 12, dataType: 'percent' },
        { header: 'Annualized', width: 15, dataType: 'percent' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("symbol", "{COIN}")', description: 'Symbol' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("funding_rate", "{COIN}", "binance")', description: 'Binance' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("funding_rate", "{COIN}", "okx")', description: 'OKX' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("funding_rate", "{COIN}", "bybit")', description: 'Bybit' },
  ],
  setupInstructions: ['Positive = longs pay shorts', 'Negative = shorts pay longs', 'High rates = potential reversal'],
};

/**
 * Open Interest Template
 */
const OPEN_INTEREST_TEMPLATE: TemplateConfig = {
  id: 'open_interest',
  name: 'Open Interest',
  description: 'Futures open interest and liquidations',
  icon: '📊',
  category: 'derivatives',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Open_Interest',
      type: 'data',
      columns: [
        { header: 'Coin', width: 12, dataType: 'string' },
        { header: 'Open Interest', width: 18, dataType: 'currency' },
        { header: 'OI Change 24h', width: 15, dataType: 'percent' },
        { header: 'Long/Short', width: 12, dataType: 'number' },
        { header: 'Liquidations 24h', width: 18, dataType: 'currency' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("symbol", "{COIN}")', description: 'Symbol' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("open_interest", "{COIN}")', description: 'OI' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("oi_change_24h", "{COIN}")', description: 'OI change' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("long_short_ratio", "{COIN}")', description: 'L/S ratio' },
    { column: 4, formulaPattern: '=CRYPTOSHEETS("liquidations_24h", "{COIN}")', description: 'Liquidations' },
  ],
  setupInstructions: ['Rising OI + rising price = strong trend', 'L/S ratio >1 = more longs'],
};

/**
 * Token Unlocks Template
 */
const TOKEN_UNLOCKS_TEMPLATE: TemplateConfig = {
  id: 'token_unlocks',
  name: 'Token Unlocks',
  description: 'Upcoming token vesting unlocks',
  icon: '🔓',
  category: 'tokens',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Upcoming',
      type: 'data',
      columns: [
        { header: 'Token', width: 15, dataType: 'string' },
        { header: 'Unlock Date', width: 15, dataType: 'date' },
        { header: 'Amount', width: 18, dataType: 'number' },
        { header: '% of Supply', width: 12, dataType: 'percent' },
        { header: 'Value USD', width: 18, dataType: 'currency' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("unlock", "{TOKEN}", "name")', description: 'Token' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("unlock", "{TOKEN}", "date")', description: 'Date' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("unlock", "{TOKEN}", "amount")', description: 'Amount' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("unlock", "{TOKEN}", "percent")', description: 'Percent' },
  ],
  setupInstructions: ['Large unlocks can cause selling pressure', 'Check before buying tokens'],
};

/**
 * Staking Rewards Template
 */
const STAKING_REWARDS_TEMPLATE: TemplateConfig = {
  id: 'staking_rewards',
  name: 'Staking Rewards',
  description: 'Staking APY comparison across coins',
  icon: '🥩',
  category: 'tokens',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Staking_APY',
      type: 'data',
      columns: [
        { header: 'Coin', width: 12, dataType: 'string' },
        { header: 'APY', width: 12, dataType: 'percent' },
        { header: 'Lock Period', width: 15, dataType: 'string' },
        { header: 'Min Stake', width: 15, dataType: 'number' },
        { header: 'Validators', width: 12, dataType: 'number' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("symbol", "{COIN}")', description: 'Symbol' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("staking_apy", "{COIN}")', description: 'APY' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("staking_lock", "{COIN}")', description: 'Lock period' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("staking_min", "{COIN}")', description: 'Min stake' },
  ],
  setupInstructions: ['Compare staking yields', 'Consider lock periods and risks'],
};

/**
 * NFT Collections Template
 */
const NFT_COLLECTIONS_TEMPLATE: TemplateConfig = {
  id: 'nft_collections',
  name: 'NFT Collections',
  description: 'Top NFT collections by volume and floor price',
  icon: '🖼️',
  category: 'nft',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Collections',
      type: 'data',
      columns: [
        { header: 'Rank', width: 8, dataType: 'number' },
        { header: 'Collection', width: 25, dataType: 'string' },
        { header: 'Floor Price', width: 15, dataType: 'currency' },
        { header: 'Volume 24h', width: 18, dataType: 'currency' },
        { header: 'Holders', width: 12, dataType: 'number' },
        { header: 'Listed %', width: 12, dataType: 'percent' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("nft", "{COLLECTION}", "name")', description: 'Name' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("nft", "{COLLECTION}", "floor")', description: 'Floor' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("nft", "{COLLECTION}", "volume")', description: 'Volume' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("nft", "{COLLECTION}", "holders")', description: 'Holders' },
  ],
  setupInstructions: ['Top NFT collections', 'Low listed % = strong holders'],
};

/**
 * Portfolio Tracker Template
 */
const PORTFOLIO_TRACKER_TEMPLATE: TemplateConfig = {
  id: 'portfolio_tracker',
  name: 'Portfolio Tracker',
  description: 'Track your holdings with P&L calculations',
  icon: '💼',
  category: 'portfolio',
  coinCountHint: 'few',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Holdings',
      type: 'data',
      columns: [
        { header: 'Coin', width: 12, dataType: 'string' },
        { header: 'Quantity', width: 15, dataType: 'number' },
        { header: 'Avg Buy Price', width: 15, dataType: 'currency' },
        { header: 'Current Price', width: 15, dataType: 'currency' },
        { header: 'Value', width: 18, dataType: 'currency' },
        { header: 'P&L', width: 18, dataType: 'currency' },
        { header: 'P&L %', width: 12, dataType: 'percent' },
      ],
    },
    { name: 'Summary', type: 'data', columns: [{ header: 'Metric', width: 20 }, { header: 'Value', width: 20 }] },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("symbol", "{COIN}")', description: 'Symbol' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("price", "{COIN}", "{CURRENCY}")', description: 'Current price' },
    // Value, P&L calculated in Excel: =D2*B2, =(D2-C2)*B2
  ],
  setupInstructions: ['Enter your quantities and buy prices', 'Current price updates automatically', 'P&L calculates in real-time'],
};

/**
 * Correlation Matrix Template
 */
const CORRELATION_MATRIX_TEMPLATE: TemplateConfig = {
  id: 'correlation_matrix',
  name: 'Correlation Matrix',
  description: 'Price correlation between cryptocurrencies',
  icon: '🔗',
  category: 'portfolio',
  coinCountHint: 'few',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Matrix',
      type: 'data',
      columns: [
        { header: 'Coin', width: 12, dataType: 'string' },
        { header: 'BTC', width: 10, dataType: 'number' },
        { header: 'ETH', width: 10, dataType: 'number' },
        { header: 'SOL', width: 10, dataType: 'number' },
        { header: 'BNB', width: 10, dataType: 'number' },
        { header: 'XRP', width: 10, dataType: 'number' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("correlation", "{COIN1}", "{COIN2}", "{PERIOD}")', description: 'Correlation coefficient' },
  ],
  setupInstructions: ['1.0 = perfect correlation', '0 = no correlation', '-1.0 = inverse correlation', 'Diversify with low correlations'],
};

// ============================================
// NEW TEMPLATES - Full Website Coverage
// ============================================

/**
 * ETF Tracker Template - Bitcoin/Crypto ETF flows
 */
const ETF_TRACKER_TEMPLATE: TemplateConfig = {
  id: 'etf_tracker',
  name: 'ETF Tracker',
  description: 'Bitcoin & Crypto ETF flows, holdings, and performance',
  icon: '📊',
  category: 'market',
  specificCoins: ['BTC', 'ETH'],
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'ETF_Holdings',
      type: 'data',
      columns: [
        { header: 'ETF Name', width: 25, dataType: 'string' },
        { header: 'Ticker', width: 10, dataType: 'string' },
        { header: 'AUM (USD)', width: 18, dataType: 'currency' },
        { header: 'BTC Holdings', width: 15, dataType: 'number' },
        { header: 'Daily Flow', width: 15, dataType: 'currency' },
        { header: 'Weekly Flow', width: 15, dataType: 'currency' },
        { header: 'Expense Ratio', width: 12, dataType: 'percent' },
      ],
    },
    {
      name: 'Flow_History',
      type: 'data',
      columns: [
        { header: 'Date', width: 12, dataType: 'date' },
        { header: 'Total Inflow', width: 18, dataType: 'currency' },
        { header: 'Total Outflow', width: 18, dataType: 'currency' },
        { header: 'Net Flow', width: 18, dataType: 'currency' },
      ],
    },
    { name: 'Charts', type: 'chart', charts: [{ type: 'bar', title: 'ETF Daily Flows', dataRange: 'Flow_History!A2:D30', position: { col: 1, row: 2, width: 800, height: 400 } }] },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("etf", "{ETF}", "name")', description: 'ETF name' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("etf", "{ETF}", "aum")', description: 'AUM' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("etf", "{ETF}", "btc_holdings")', description: 'BTC holdings' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("etf", "{ETF}", "daily_flow")', description: 'Daily flow' },
  ],
  setupInstructions: ['Tracks major Bitcoin ETFs', 'GBTC, IBIT, FBTC, ARKB, BITB', 'Institutional money flow indicator'],
};

/**
 * Whale Tracker Template - Large holder activity
 */
const WHALE_TRACKER_TEMPLATE: TemplateConfig = {
  id: 'whale_tracker',
  name: 'Whale Tracker',
  description: 'Large holder activity, wallet distribution, and movements',
  icon: '🐋',
  category: 'onchain',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Whale_Wallets',
      type: 'data',
      columns: [
        { header: 'Rank', width: 8, dataType: 'number' },
        { header: 'Address', width: 45, dataType: 'string' },
        { header: 'Balance', width: 18, dataType: 'number' },
        { header: 'Value (USD)', width: 18, dataType: 'currency' },
        { header: '24h Change', width: 15, dataType: 'number' },
        { header: 'Label', width: 20, dataType: 'string' },
      ],
    },
    {
      name: 'Whale_Transactions',
      type: 'data',
      columns: [
        { header: 'Time', width: 18, dataType: 'date' },
        { header: 'From', width: 25, dataType: 'string' },
        { header: 'To', width: 25, dataType: 'string' },
        { header: 'Amount', width: 18, dataType: 'number' },
        { header: 'Value (USD)', width: 18, dataType: 'currency' },
        { header: 'Type', width: 15, dataType: 'string' },
      ],
    },
    {
      name: 'Distribution',
      type: 'data',
      columns: [
        { header: 'Holder Size', width: 20, dataType: 'string' },
        { header: 'Wallets', width: 15, dataType: 'number' },
        { header: 'Total Balance', width: 18, dataType: 'number' },
        { header: '% of Supply', width: 15, dataType: 'percent' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("whale_wallet", "{COIN}", {ROW}, "address")', description: 'Address' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("whale_wallet", "{COIN}", {ROW}, "balance")', description: 'Balance' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("whale_wallet", "{COIN}", {ROW}, "value")', description: 'Value' },
  ],
  setupInstructions: ['Top 100 holders for selected coin', 'Exchange wallets labeled', 'Track accumulation/distribution'],
};

/**
 * Historical Analysis Template - Educational price study
 */
const BACKTEST_RESULTS_TEMPLATE: TemplateConfig = {
  id: 'backtest_results',
  name: 'Historical Analysis',
  description: 'Educational historical price study and performance metrics',
  icon: '📈',
  category: 'technical',
  coinCountHint: 'single',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Performance',
      type: 'data',
      columns: [
        { header: 'Metric', width: 25, dataType: 'string' },
        { header: 'Value', width: 18, dataType: 'string' },
      ],
    },
    {
      name: 'Price_History',
      type: 'data',
      columns: [
        { header: 'Date', width: 12, dataType: 'date' },
        { header: 'Price', width: 15, dataType: 'currency' },
        { header: 'Change %', width: 12, dataType: 'percent' },
        { header: 'Volume', width: 18, dataType: 'number' },
        { header: 'Moving Avg', width: 15, dataType: 'currency' },
      ],
    },
    {
      name: 'Monthly_Returns',
      type: 'data',
      columns: [
        { header: 'Month', width: 15, dataType: 'string' },
        { header: 'Return %', width: 12, dataType: 'percent' },
        { header: 'High', width: 15, dataType: 'currency' },
        { header: 'Low', width: 15, dataType: 'currency' },
      ],
    },
    { name: 'Charts', type: 'chart', charts: [{ type: 'line', title: 'Price History', dataRange: 'Price_History!A2:C100', position: { col: 1, row: 2, width: 800, height: 400 } }] },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("historical", "{COIN}", "close", {ROW})', description: 'Historical price' },
  ],
  setupInstructions: ['Educational historical analysis', 'Study past price movements', 'Not for predicting future performance'],
};

/**
 * Macro Indicators Template - Economic indicators
 */
const MACRO_INDICATORS_TEMPLATE: TemplateConfig = {
  id: 'macro_indicators',
  name: 'Macro Indicators',
  description: 'Economic indicators affecting crypto markets',
  icon: '🏛️',
  category: 'market',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Economic_Data',
      type: 'data',
      columns: [
        { header: 'Indicator', width: 30, dataType: 'string' },
        { header: 'Value', width: 15, dataType: 'string' },
        { header: 'Change', width: 15, dataType: 'string' },
        { header: 'Impact', width: 20, dataType: 'string' },
      ],
    },
    {
      name: 'Market_Indices',
      type: 'data',
      columns: [
        { header: 'Index', width: 20, dataType: 'string' },
        { header: 'Price', width: 15, dataType: 'number' },
        { header: '24h Change', width: 12, dataType: 'percent' },
        { header: 'YTD Change', width: 12, dataType: 'percent' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("macro", "fed_rate")', description: 'Fed Funds Rate' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("macro", "treasury_10y")', description: '10Y Treasury' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("macro", "dxy")', description: 'Dollar Index' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("macro", "vix")', description: 'VIX Index' },
    { column: 4, formulaPattern: '=CRYPTOSHEETS("macro", "sp500")', description: 'S&P 500' },
    { column: 5, formulaPattern: '=CRYPTOSHEETS("macro", "nasdaq")', description: 'Nasdaq' },
  ],
  setupInstructions: ['Key macro indicators', 'Fed policy impacts crypto', 'DXY inversely correlated with BTC'],
};

/**
 * Exchange Flows Template - Exchange deposits/withdrawals
 */
const EXCHANGE_FLOWS_TEMPLATE: TemplateConfig = {
  id: 'exchange_flows',
  name: 'Exchange Flows',
  description: 'Crypto exchange inflows and outflows',
  icon: '🔄',
  category: 'onchain',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Exchange_Balances',
      type: 'data',
      columns: [
        { header: 'Exchange', width: 20, dataType: 'string' },
        { header: 'BTC Balance', width: 18, dataType: 'number' },
        { header: 'ETH Balance', width: 18, dataType: 'number' },
        { header: '24h Change', width: 15, dataType: 'number' },
        { header: '7d Change', width: 15, dataType: 'number' },
      ],
    },
    {
      name: 'Net_Flows',
      type: 'data',
      columns: [
        { header: 'Date', width: 12, dataType: 'date' },
        { header: 'Coin', width: 10, dataType: 'string' },
        { header: 'Inflow', width: 18, dataType: 'number' },
        { header: 'Outflow', width: 18, dataType: 'number' },
        { header: 'Net Flow', width: 18, dataType: 'number' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("exchange_balance", "{EXCHANGE}", "{COIN}")', description: 'Exchange balance' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("exchange_flow", "{COIN}", "inflow")', description: 'Inflow' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("exchange_flow", "{COIN}", "outflow")', description: 'Outflow' },
  ],
  setupInstructions: ['Outflow = accumulation (bullish)', 'Inflow = selling pressure (bearish)', 'Major exchanges: Binance, Coinbase, Kraken'],
};

/**
 * Mining Stats Template - Crypto mining metrics
 */
const MINING_STATS_TEMPLATE: TemplateConfig = {
  id: 'mining_stats',
  name: 'Mining Statistics',
  description: 'Cryptocurrency mining metrics and profitability',
  icon: '⛏️',
  category: 'onchain',
  specificCoins: ['BTC'],
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Network_Stats',
      type: 'data',
      columns: [
        { header: 'Metric', width: 25, dataType: 'string' },
        { header: 'Bitcoin', width: 20, dataType: 'string' },
        { header: 'Ethereum', width: 20, dataType: 'string' },
        { header: 'Litecoin', width: 20, dataType: 'string' },
      ],
    },
    {
      name: 'Mining_Pools',
      type: 'data',
      columns: [
        { header: 'Pool', width: 20, dataType: 'string' },
        { header: 'Hashrate', width: 18, dataType: 'string' },
        { header: 'Share %', width: 12, dataType: 'percent' },
        { header: 'Blocks (24h)', width: 15, dataType: 'number' },
      ],
    },
    {
      name: 'Profitability',
      type: 'data',
      columns: [
        { header: 'Hardware', width: 25, dataType: 'string' },
        { header: 'Hashrate', width: 15, dataType: 'string' },
        { header: 'Power (W)', width: 12, dataType: 'number' },
        { header: 'Daily Rev', width: 15, dataType: 'currency' },
        { header: 'Daily Cost', width: 15, dataType: 'currency' },
        { header: 'Daily Profit', width: 15, dataType: 'currency' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("mining", "{COIN}", "hashrate")', description: 'Network hashrate' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("mining", "{COIN}", "difficulty")', description: 'Difficulty' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("mining", "{COIN}", "block_reward")', description: 'Block reward' },
  ],
  setupInstructions: ['Network health metrics', 'Mining pool distribution', 'Calculate profitability with your hardware'],
};

/**
 * Liquidations Template - Futures liquidation data
 */
const LIQUIDATIONS_TEMPLATE: TemplateConfig = {
  id: 'liquidations',
  name: 'Liquidations',
  description: 'Futures liquidation data across exchanges',
  icon: '💥',
  category: 'derivatives',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Liquidations_24h',
      type: 'data',
      columns: [
        { header: 'Coin', width: 12, dataType: 'string' },
        { header: 'Total Liq', width: 18, dataType: 'currency' },
        { header: 'Long Liq', width: 18, dataType: 'currency' },
        { header: 'Short Liq', width: 18, dataType: 'currency' },
        { header: 'Largest', width: 18, dataType: 'currency' },
      ],
    },
    {
      name: 'By_Exchange',
      type: 'data',
      columns: [
        { header: 'Exchange', width: 15, dataType: 'string' },
        { header: 'BTC Liq', width: 18, dataType: 'currency' },
        { header: 'ETH Liq', width: 18, dataType: 'currency' },
        { header: 'Total Liq', width: 18, dataType: 'currency' },
      ],
    },
    {
      name: 'Liq_History',
      type: 'data',
      columns: [
        { header: 'Time', width: 18, dataType: 'date' },
        { header: 'Coin', width: 10, dataType: 'string' },
        { header: 'Side', width: 10, dataType: 'string' },
        { header: 'Amount', width: 18, dataType: 'currency' },
        { header: 'Exchange', width: 15, dataType: 'string' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("symbol", "{COIN}")', description: 'Symbol' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("liquidations", "{COIN}", "total")', description: 'Total liquidations' },
    { column: 2, formulaPattern: '=CRYPTOSHEETS("liquidations", "{COIN}", "long")', description: 'Long liquidations' },
    { column: 3, formulaPattern: '=CRYPTOSHEETS("liquidations", "{COIN}", "short")', description: 'Short liquidations' },
  ],
  setupInstructions: ['High liquidations = volatility', 'Long liq > Short = bearish flush', 'Watch for cascade liquidations'],
};

/**
 * Alerts Summary Template - Price and market alerts
 */
const ALERTS_SUMMARY_TEMPLATE: TemplateConfig = {
  id: 'alerts_summary',
  name: 'Alerts Summary',
  description: 'Price alerts, risk alerts, and market notifications',
  icon: '🔔',
  category: 'market',
  coinCountHint: 'any',
  requiredAddons: ['cryptosheets'],
  supportedFormats: ['xlsx', 'xlsm'],
  sheets: [
    { name: 'START_HERE', type: 'setup' },
    {
      name: 'Active_Alerts',
      type: 'data',
      columns: [
        { header: 'Coin', width: 12, dataType: 'string' },
        { header: 'Alert Type', width: 18, dataType: 'string' },
        { header: 'Condition', width: 20, dataType: 'string' },
        { header: 'Target', width: 15, dataType: 'currency' },
        { header: 'Current', width: 15, dataType: 'currency' },
        { header: 'Status', width: 12, dataType: 'string' },
      ],
    },
    {
      name: 'Market_Alerts',
      type: 'data',
      columns: [
        { header: 'Time', width: 18, dataType: 'date' },
        { header: 'Type', width: 15, dataType: 'string' },
        { header: 'Message', width: 50, dataType: 'string' },
        { header: 'Severity', width: 12, dataType: 'string' },
      ],
    },
    { name: 'Instructions', type: 'instructions' },
  ],
  formulas: [
    { column: 0, formulaPattern: '=CRYPTOSHEETS("symbol", "{COIN}")', description: 'Symbol' },
    { column: 1, formulaPattern: '=CRYPTOSHEETS("price", "{COIN}", "{CURRENCY}")', description: 'Current price' },
  ],
  setupInstructions: ['Set price targets in Target column', 'Use conditional formatting for alerts', 'Formula checks if current > target'],
};

/**
 * Get all available templates
 */
export const TEMPLATES: Record<TemplateType, TemplateConfig> = {
  // Original templates
  screener: SCREENER_TEMPLATE,
  compare: COMPARE_TEMPLATE,
  risk_dashboard: RISK_DASHBOARD_TEMPLATE,
  watchlist: WATCHLIST_TEMPLATE,
  // Market Analytics
  market_overview: MARKET_OVERVIEW_TEMPLATE,
  gainers_losers: GAINERS_LOSERS_TEMPLATE,
  // Historical & Charts
  ohlcv_history: OHLCV_HISTORY_TEMPLATE,
  // Technical Analysis
  technical_indicators: TECHNICAL_INDICATORS_TEMPLATE,
  // On-Chain Analytics
  onchain_btc: ONCHAIN_BTC_TEMPLATE,
  eth_gas_tracker: ETH_GAS_TRACKER_TEMPLATE,
  // DeFi Analytics
  defi_tvl: DEFI_TVL_TEMPLATE,
  defi_yields: DEFI_YIELDS_TEMPLATE,
  // Sentiment Analysis
  fear_greed: FEAR_GREED_TEMPLATE,
  social_sentiment: SOCIAL_SENTIMENT_TEMPLATE,
  // Derivatives
  funding_rates: FUNDING_RATES_TEMPLATE,
  open_interest: OPEN_INTEREST_TEMPLATE,
  // Token Economics
  token_unlocks: TOKEN_UNLOCKS_TEMPLATE,
  staking_rewards: STAKING_REWARDS_TEMPLATE,
  // NFT Market
  nft_collections: NFT_COLLECTIONS_TEMPLATE,
  // Portfolio & Analysis
  portfolio_tracker: PORTFOLIO_TRACKER_TEMPLATE,
  correlation_matrix: CORRELATION_MATRIX_TEMPLATE,
  // NEW: Additional Templates for Full Coverage
  etf_tracker: ETF_TRACKER_TEMPLATE,
  whale_tracker: WHALE_TRACKER_TEMPLATE,
  backtest_results: BACKTEST_RESULTS_TEMPLATE,
  macro_indicators: MACRO_INDICATORS_TEMPLATE,
  exchange_flows: EXCHANGE_FLOWS_TEMPLATE,
  mining_stats: MINING_STATS_TEMPLATE,
  liquidations: LIQUIDATIONS_TEMPLATE,
  alerts_summary: ALERTS_SUMMARY_TEMPLATE,
};

/**
 * Get template configuration by ID
 */
export function getTemplateConfig(templateId: TemplateType): TemplateConfig {
  return TEMPLATES[templateId];
}

/**
 * Get all template IDs
 */
export function getTemplateIds(): TemplateType[] {
  return Object.keys(TEMPLATES) as TemplateType[];
}

/**
 * Get template display list (for UI)
 */
export function getTemplateList() {
  return getTemplateIds().map((id) => {
    const config = TEMPLATES[id];
    return {
      id,
      name: config.name,
      description: config.description,
      icon: config.icon,
      category: config.category,
      coinCountHint: config.coinCountHint,
      specificCoins: config.specificCoins,
    };
  });
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(categoryId: TemplateCategoryId) {
  return getTemplateList().filter((t) => t.category === categoryId);
}

/**
 * Get templates grouped by category (sorted by category order)
 */
export function getTemplatesGroupedByCategory() {
  const categories = getSortedCategories();
  const templates = getTemplateList();

  return categories
    .map((category) => ({
      category,
      templates: templates.filter((t) => t.category === category.id),
    }))
    .filter((group) => group.templates.length > 0);
}
