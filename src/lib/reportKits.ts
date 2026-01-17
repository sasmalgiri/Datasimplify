/**
 * Report Kits Configuration
 *
 * Report Kits are curated bundles of templates designed for specific use cases.
 * They provide a simpler entry point for users who want a complete solution
 * rather than browsing individual templates.
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
  tier: 'free' | 'pro' | 'premium';
  templates: string[];
  presets: ReportKitPresets;
  features: string[];
  useCases: string[];
  faqs: ReportKitFAQ[];
  relatedKits: string[];
}

export const REPORT_KITS: ReportKit[] = [
  {
    id: 'daily-market-overview',
    slug: 'daily-market-overview',
    name: 'Daily Market Overview',
    tagline: 'Top 50 coins, dominance, and market movers in one report',
    description:
      'Get a complete daily snapshot of the crypto market. Track top coins by market cap, see who\'s moving up or down, and monitor overall market health - all in a single refreshable Excel report.',
    icon: '📊',
    tier: 'free',
    templates: ['market-overview', 'gainers-losers'],
    presets: { coins: 50, timeframe: '1d', refresh: 'manual' },
    features: [
      'Top 50 coins by market cap',
      'Price and 24h change tracking',
      'Market cap and volume data',
      'Top gainers and losers',
      'BTC dominance indicator',
      'Manual refresh for quota control',
    ],
    useCases: [
      'Morning market check before trading',
      'Weekly portfolio review meetings',
      'Research and analysis reports',
      'Educational demonstrations',
    ],
    faqs: [
      {
        question: 'How often should I refresh this report?',
        answer:
          'For daily overview, refreshing once in the morning is usually sufficient. Each refresh uses API calls from your CryptoSheets account.',
      },
      {
        question: 'Can I add more than 50 coins?',
        answer:
          'Yes! You can customize the coin count after download. Note that more coins = more API calls per refresh.',
      },
    ],
    relatedKits: ['watchlist-report', 'movers-tracking'],
  },
  {
    id: 'watchlist-report',
    slug: 'watchlist-report',
    name: 'Watchlist Report',
    tagline: 'Track 5-50 coins of your choice with live data',
    description:
      'Build a personalized watchlist of the coins you care about most. Perfect for tracking your holdings, researching potential investments, or monitoring specific market segments.',
    icon: '👁️',
    tier: 'free',
    templates: ['personal-watchlist'],
    presets: { coins: 25, timeframe: '1d', refresh: 'manual' },
    features: [
      'Customizable coin selection',
      'Real-time price updates',
      '24h/7d/30d price changes',
      'Market cap tracking',
      'Volume monitoring',
      'Add/remove coins easily',
    ],
    useCases: [
      'Track your portfolio holdings',
      'Monitor coins you\'re researching',
      'Watch specific market segments',
      'Client portfolio monitoring',
    ],
    faqs: [
      {
        question: 'How do I add or remove coins from the watchlist?',
        answer:
          'Simply edit the coin symbols in the configuration sheet. The formulas will automatically update to fetch data for your new selection.',
      },
      {
        question: 'Is this suitable for CryptoSheets free tier?',
        answer:
          'Yes! The default setup uses 25 coins with manual refresh, which works well within the free tier\'s 100 calls/day limit.',
      },
    ],
    relatedKits: ['daily-market-overview', 'portfolio-snapshot'],
  },
  {
    id: 'portfolio-snapshot',
    slug: 'portfolio-snapshot',
    name: 'Portfolio Snapshot',
    tagline: 'Allocation, P/L tracking, and risk notes',
    description:
      'Get a complete view of your crypto portfolio. Track holdings, calculate profit/loss, see allocation percentages, and add your own notes for each position.',
    icon: '💼',
    tier: 'pro',
    templates: ['portfolio-tracker', 'risk-dashboard'],
    presets: { coins: 20, timeframe: '1d', refresh: 'manual' },
    features: [
      'Holdings and quantities tracking',
      'Live P/L calculations',
      'Allocation % breakdown',
      'Cost basis tracking',
      'Notes field per position',
      'Risk indicators',
    ],
    useCases: [
      'Personal portfolio management',
      'Client portfolio reporting',
      'Investment tracking',
      'Tax preparation support',
    ],
    faqs: [
      {
        question: 'Can I import my holdings automatically?',
        answer:
          'The template provides a simple entry sheet where you input your holdings. Manual entry ensures accuracy and gives you full control over your data.',
      },
      {
        question: 'Does this calculate taxes?',
        answer:
          'This template shows P/L but is not tax software. Use the data to inform your tax preparation but consult a tax professional for compliance.',
      },
    ],
    relatedKits: ['watchlist-report', 'correlation-diversification'],
  },
  {
    id: 'technical-dashboard',
    slug: 'technical-dashboard',
    name: 'Technical Dashboard',
    tagline: 'RSI, MACD, Bollinger Bands analysis',
    description:
      'Analyze coins with popular technical indicators. See RSI levels, MACD signals, and Bollinger Band positions - educational tools for understanding market momentum.',
    icon: '📈',
    tier: 'pro',
    templates: ['technical-indicators'],
    presets: { coins: 10, timeframe: '1d', refresh: 'manual' },
    features: [
      'RSI (Relative Strength Index)',
      'MACD with signal line',
      'Bollinger Bands (upper/lower)',
      'Moving averages (20/50/200)',
      'Volume analysis',
      'Customizable timeframes',
    ],
    useCases: [
      'Technical analysis research',
      'Educational demonstrations',
      'Identifying momentum patterns',
      'Supporting research decisions',
    ],
    faqs: [
      {
        question: 'Are these trading signals?',
        answer:
          'No. These are educational technical indicators. They show mathematical calculations based on historical data and should not be used as trading advice.',
      },
      {
        question: 'What timeframe works best?',
        answer:
          'Daily (1d) timeframe is the default and most commonly used. You can also use 4h for shorter-term or 1w for longer-term analysis.',
      },
    ],
    relatedKits: ['daily-market-overview', 'correlation-diversification'],
  },
  {
    id: 'correlation-diversification',
    slug: 'correlation-diversification',
    name: 'Correlation & Diversification',
    tagline: 'See how your assets move together',
    description:
      'Understand the relationships between different cryptocurrencies. A correlation matrix shows which coins tend to move together and which provide diversification benefits.',
    icon: '🔗',
    tier: 'pro',
    templates: ['correlation-matrix', 'coin-comparison'],
    presets: { coins: 10, timeframe: '30d', refresh: 'manual' },
    features: [
      'Correlation matrix visualization',
      'Side-by-side coin comparison',
      '30-day price correlation',
      'Diversification insights',
      'Volatility comparison',
      'Performance ranking',
    ],
    useCases: [
      'Portfolio diversification analysis',
      'Research new positions',
      'Understand market relationships',
      'Risk assessment',
    ],
    faqs: [
      {
        question: 'What does correlation mean?',
        answer:
          'Correlation measures how two assets move together. +1 means they move identically, -1 means opposite directions, 0 means no relationship.',
      },
      {
        question: 'Why is diversification important?',
        answer:
          'Holding assets with lower correlation can reduce overall portfolio volatility. This is an educational tool for understanding relationships, not investment advice.',
      },
    ],
    relatedKits: ['portfolio-snapshot', 'technical-dashboard'],
  },
  {
    id: 'movers-tracking',
    slug: 'movers-tracking',
    name: 'Movers & Tracking',
    tagline: 'Gainers, losers, and watchlist updates',
    description:
      'Stay on top of market movements. See which coins are making the biggest moves up or down, and track them over time to identify patterns and opportunities.',
    icon: '🚀',
    tier: 'free',
    templates: ['gainers-losers', 'alerts-summary'],
    presets: { coins: 50, timeframe: '1d', refresh: 'on_open' },
    features: [
      'Top 50 gainers (24h)',
      'Top 50 losers (24h)',
      'Price change percentages',
      'Volume surge detection',
      'Auto-refresh on file open',
      'Historical tracking notes',
    ],
    useCases: [
      'Daily market scanning',
      'Identify momentum opportunities',
      'Research trending coins',
      'Educational market watching',
    ],
    faqs: [
      {
        question: 'Why does this refresh on file open?',
        answer:
          'Auto-refresh ensures you see the latest movers when you open the file. You can change this to manual in settings if you prefer.',
      },
      {
        question: 'Should I invest in the top gainers?',
        answer:
          'This is an educational tracking tool, not investment advice. Big gains can mean big volatility - always do your own research.',
      },
    ],
    relatedKits: ['daily-market-overview', 'watchlist-report'],
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
