/**
 * Report Kits Configuration
 *
 * 8 Curated Excel Template Packs for CryptoReportKit
 *
 * All templates use BYOK (Bring Your Own Key) architecture.
 * Data is prefetched at download time. Live data available via web dashboards.
 *
 * Data Source: CoinGecko (https://www.coingecko.com/)
 */

export interface ReportKitPresets {
  coins: number;
  timeframe: '1h' | '4h' | '1d' | '1w' | '30d';
  refresh: 'manual' | 'on_open' | 'hourly' | 'daily';
}

export interface ReportKitFAQ {
  question: string;
  answer: string;
}

export interface ReportKit {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string;
  tier: 'free' | 'pro';
  templates: string[];
  presets: ReportKitPresets;
  features: string[];
  useCases: string[];
  faqs: ReportKitFAQ[];
  relatedKits: string[];
  functions: string[]; // CRK functions used
}

/**
 * 8 Curated Report Kits (Final Scope)
 */
export const REPORT_KITS: ReportKit[] = [
  // Pack 1 — Portfolio Starter Kit (Free)
  {
    id: 'portfolio-starter',
    slug: 'portfolio-starter',
    name: 'Portfolio Starter Kit',
    tagline: 'Track holdings, allocation & performance',
    description: 'Convert users into BYOK setup. Everything you need to track your crypto portfolio with live prices.',
    icon: '💼',
    tier: 'free',
    templates: ['holdings', 'prices', 'allocation', 'performance', 'settings'],
    presets: { coins: 20, timeframe: '1d', refresh: 'manual' },
    features: [
      'Holdings tracker with cost basis',
      'Live price updates via BYOK',
      'Allocation pie chart',
      'Performance over time chart',
      'Top winners/losers view',
    ],
    useCases: [
      'Track personal crypto holdings',
      'Monitor portfolio allocation',
      'Calculate profit/loss',
    ],
    faqs: [
      { question: 'What API key do I need?', answer: 'A CoinGecko API key (free tier available). Use it on our web dashboards for live data.' },
    ],
    relatedKits: ['market-overview', 'screener-watchlist'],
    functions: ['PRICE', 'CHANGE24H', 'MARKETCAP', 'VOLUME', 'OHLCV'],
  },

  // Pack 2 — Market Overview Dashboard (Pro)
  {
    id: 'market-overview',
    slug: 'market-overview',
    name: 'Market Overview Dashboard',
    tagline: 'Bloomberg-lite single page market view',
    description: 'A comprehensive market dashboard showing global stats, dominance, heatmap, movers, and sentiment.',
    icon: '🌍',
    tier: 'pro',
    templates: ['global', 'dominance', 'heatmap', 'movers', 'sentiment'],
    presets: { coins: 50, timeframe: '1d', refresh: 'manual' },
    features: [
      'Total market cap trend',
      'BTC/ETH dominance charts',
      'Top 50 heatmap table',
      'Gainers & losers',
      'Fear & Greed Index',
    ],
    useCases: [
      'Morning market check',
      'Quick sentiment gauge',
      'Track market trends',
    ],
    faqs: [
      { question: 'How often should I refresh?', answer: 'Data is prefetched at download time. For live data, use our web dashboards.' },
    ],
    relatedKits: ['portfolio-starter', 'trader-charts'],
    functions: ['GLOBAL', 'BTCDOM', 'ETHDOM', 'TOP', 'GAINERS', 'LOSERS', 'FEARGREED'],
  },

  // Pack 3 — Trader Chart Pack (Pro)
  {
    id: 'trader-charts',
    slug: 'trader-charts',
    name: 'Trader Chart Pack',
    tagline: 'Technical charts people screenshot',
    description: 'Candlestick charts with volume, RSI, MACD, and moving average overlays for technical analysis.',
    icon: '📈',
    tier: 'pro',
    templates: ['candles', 'indicators', 'signals', 'watchlist'],
    presets: { coins: 10, timeframe: '1d', refresh: 'manual' },
    features: [
      'Candlestick + volume charts',
      'RSI with overbought/oversold',
      'MACD with signal crossovers',
      'SMA/EMA overlays (20/50)',
      '24h high/low markers',
    ],
    useCases: [
      'Technical analysis study',
      'Chart screenshots for reports',
      'Educational demonstrations',
    ],
    faqs: [
      { question: 'Are these trading signals?', answer: 'No. Educational indicators only, not financial advice.' },
    ],
    relatedKits: ['market-overview', 'coin-research'],
    functions: ['OHLCV', 'SMA', 'EMA', 'RSI', 'MACD', 'HIGH24H', 'LOW24H'],
  },

  // Pack 4 — Screener + Watchlist Builder (Pro)
  {
    id: 'screener-watchlist',
    slug: 'screener-watchlist',
    name: 'Screener + Watchlist Builder',
    tagline: 'Find coins fast without complexity',
    description: 'Screen coins by category, filter by metrics, and build custom watchlists with quick alerts.',
    icon: '🔍',
    tier: 'pro',
    templates: ['screener', 'filters', 'results', 'watchlist', 'alerts'],
    presets: { coins: 100, timeframe: '1d', refresh: 'manual' },
    features: [
      'Category-based filtering',
      'Top coins by market cap',
      'Gainers/losers screener',
      'Custom watchlist builder',
      'Simple alert conditions',
    ],
    useCases: [
      'Discover new coins',
      'Filter by performance',
      'Build research watchlists',
    ],
    faqs: [
      { question: 'How many coins can I screen?', answer: 'Up to 250 coins per query with pagination support.' },
    ],
    relatedKits: ['portfolio-starter', 'coin-research'],
    functions: ['TOP', 'CATEGORY', 'CATEGORIES', 'SEARCH', 'BATCH', 'GAINERS', 'LOSERS'],
  },

  // Pack 5 — Coin Research One-Pager (Pro)
  {
    id: 'coin-research',
    slug: 'coin-research',
    name: 'Coin Research One-Pager',
    tagline: 'Per-coin summary report',
    description: 'Deep-dive into any coin with snapshot, fundamentals, history, and "What-if Market Cap" analysis.',
    icon: '📋',
    tier: 'pro',
    templates: ['snapshot', 'fundamentals', 'history', 'comparison'],
    presets: { coins: 1, timeframe: '30d', refresh: 'manual' },
    features: [
      'Coin snapshot overview',
      'ATH/ATL with dates',
      'Supply metrics (circulating/total/max)',
      'Historical price lookup',
      '"What-if Market Cap" block',
    ],
    useCases: [
      'Research before buying',
      'Create coin reports',
      'Compare market cap scenarios',
    ],
    faqs: [
      { question: 'What is "What-if Market Cap"?', answer: 'Shows what price would be if the coin had another coin\'s market cap. Educational only.' },
    ],
    relatedKits: ['trader-charts', 'screener-watchlist'],
    functions: ['INFO', 'ATH', 'ATL', 'SUPPLY', 'RANK', 'PRICEHISTORY', 'OHLCV', 'MARKETCAP'],
  },

  // Pack 6 — Risk + Correlation Lab (Pro)
  {
    id: 'risk-correlation',
    slug: 'risk-correlation',
    name: 'Risk + Correlation Lab',
    tagline: 'High perceived value analytics',
    description: 'Correlation matrix, rolling correlation, volatility, drawdown, and risk scores - all computed in Excel from OHLCV data.',
    icon: '⚗️',
    tier: 'pro',
    templates: ['correlation_matrix', 'rolling_corr', 'volatility', 'drawdown', 'risk_score'],
    presets: { coins: 10, timeframe: '30d', refresh: 'manual' },
    features: [
      'Correlation matrix (up to 10 coins)',
      'Rolling correlation charts',
      'Volatility calculations',
      'Max drawdown tracking',
      'Sharpe/Sortino ratios',
    ],
    useCases: [
      'Portfolio risk assessment',
      'Diversification analysis',
      'Academic research',
    ],
    faqs: [
      { question: 'How are metrics calculated?', answer: 'All derived from OHLCV data using standard Excel formulas. No external dependencies.' },
    ],
    relatedKits: ['portfolio-starter', 'trader-charts'],
    functions: ['OHLCV'],
  },

  // Pack 7 — DeFi TVL Dashboard (Pro)
  {
    id: 'defi-tvl',
    slug: 'defi-tvl',
    name: 'DeFi TVL Dashboard',
    tagline: 'Track DeFi protocol rankings',
    description: 'Monitor Total Value Locked across DeFi protocols with trend charts and protocol watchlist.',
    icon: '🏦',
    tier: 'pro',
    templates: ['protocols_list', 'tvl_trend', 'top_chains', 'watchlist'],
    presets: { coins: 50, timeframe: '1d', refresh: 'manual' },
    features: [
      'Top 50 protocols by TVL',
      'TVL change tracking (1d/7d)',
      'Protocol category breakdown',
      'Custom protocol watchlist',
    ],
    useCases: [
      'DeFi ecosystem research',
      'Protocol comparison',
      'TVL trend analysis',
    ],
    faqs: [
      { question: 'Where does TVL data come from?', answer: 'DeFi Llama API via our proxy. Free, no API key needed for this data.' },
    ],
    relatedKits: ['market-overview', 'stablecoin-monitor'],
    functions: ['DEFI', 'TVL'],
  },

  // Pack 8 — Stablecoin Monitor (Pro)
  {
    id: 'stablecoin-monitor',
    slug: 'stablecoin-monitor',
    name: 'Stablecoin Monitor',
    tagline: 'Track stablecoin market caps',
    description: 'Monitor stablecoin circulation, dominance, and peg stability with simple alert conditions.',
    icon: '💵',
    tier: 'pro',
    templates: ['stablecoin_table', 'dominance_view', 'changes', 'alerts'],
    presets: { coins: 20, timeframe: '1d', refresh: 'manual' },
    features: [
      'Top stablecoins by market cap',
      'Circulation changes',
      'Stablecoin dominance %',
      'Peg monitoring',
    ],
    useCases: [
      'Track stablecoin flows',
      'Monitor market liquidity',
      'Peg stability research',
    ],
    faqs: [
      { question: 'What stablecoins are tracked?', answer: 'All major stablecoins via DeFi Llama - USDT, USDC, DAI, BUSD, and more.' },
    ],
    relatedKits: ['market-overview', 'defi-tvl'],
    functions: ['STABLECOINS', 'GLOBAL'],
  },
];

// Get a single Report Kit by slug
export function getReportKitBySlug(slug: string): ReportKit | undefined {
  return REPORT_KITS.find((kit) => kit.slug === slug);
}

// Get Report Kits by tier
export function getReportKitsByTier(tier: ReportKit['tier']): ReportKit[] {
  return REPORT_KITS.filter((kit) => kit.tier === tier);
}

// Get free Report Kits
export function getFreeReportKits(): ReportKit[] {
  return getReportKitsByTier('free');
}

// Get all Report Kit slugs (for static generation)
export function getAllReportKitSlugs(): string[] {
  return REPORT_KITS.map((kit) => kit.slug);
}

// Get related Report Kits
export function getRelatedKits(kitId: string): ReportKit[] {
  const kit = REPORT_KITS.find((k) => k.id === kitId);
  if (!kit) return [];
  return REPORT_KITS.filter((k) => kit.relatedKits.includes(k.id));
}
