/**
 * Report Kits Configuration
 *
 * 6 Curated Excel Template Packs for CryptoReportKit
 *
 * All templates use BYOK (Bring Your Own Key) architecture.
 * Data is fetched via the CRK Excel add-in using user's own API key.
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
  tier: 'free' | 'pro' | 'premium';
  templates: string[];
  presets: ReportKitPresets;
  features: string[];
  useCases: string[];
  faqs: ReportKitFAQ[];
  relatedKits: string[];
}

/**
 * 6 Curated Report Kits
 *
 * 1. Portfolio Starter Kit - Watchlist, Allocation Pie, Basic P&L
 * 2. Technical Analysis Pack - OHLCV, RSI/MACD charts, Bollinger
 * 3. Compare & Compete - Multi-coin table, "What If Market Cap" calculator
 * 4. Macro Dashboard - Fear & Greed timeline, BTC dominance, Global cap
 * 5. DeFi Snapshot - Top 10 TVL protocols, Pool APY tracker
 * 6. On-Chain Essentials - Whale wallet tracker, Exchange flows
 */
export const REPORT_KITS: ReportKit[] = [
  // 1. Portfolio Starter Kit
  {
    id: 'portfolio-starter',
    slug: 'portfolio-starter',
    name: 'Portfolio Starter Kit',
    tagline: 'Watchlist, Allocation Pie, and Basic P&L tracking',
    description:
      'Everything you need to track your crypto portfolio. Create a watchlist of your holdings, visualize your allocation with a pie chart, and track basic profit/loss calculations.',
    icon: '💼',
    tier: 'free',
    templates: ['watchlist', 'portfolio_tracker', 'allocation_pie'],
    presets: { coins: 20, timeframe: '1d', refresh: 'manual' },
    features: [
      'Customizable coin watchlist',
      'Allocation percentage breakdown',
      'Basic P&L calculations',
      'Cost basis tracking',
      'Pie chart visualization',
      'Manual refresh for quota control',
    ],
    useCases: [
      'Track your personal holdings',
      'Monitor portfolio allocation',
      'Calculate profit/loss on positions',
      'Review portfolio performance',
    ],
    faqs: [
      {
        question: 'How do I add my holdings?',
        answer:
          'Enter your holdings in the configuration sheet. The formulas will automatically fetch current prices via the CRK add-in and calculate your allocation and P&L.',
      },
      {
        question: 'What API key do I need?',
        answer:
          'You need a CoinGecko API key (free tier available). Connect it in the CRK add-in to enable data refresh.',
      },
    ],
    relatedKits: ['technical-analysis', 'compare-compete'],
  },

  // 2. Technical Analysis Pack
  {
    id: 'technical-analysis',
    slug: 'technical-analysis',
    name: 'Technical Analysis Pack',
    tagline: 'OHLCV data, RSI, MACD, and Bollinger Bands',
    description:
      'Educational technical analysis templates with popular indicators. Includes OHLCV data, RSI (Relative Strength Index), MACD signals, and Bollinger Bands - all for learning purposes.',
    icon: '📈',
    tier: 'pro',
    templates: ['ohlcv_data', 'technical_indicators', 'bollinger_bands'],
    presets: { coins: 10, timeframe: '1d', refresh: 'manual' },
    features: [
      'OHLCV (Open, High, Low, Close, Volume)',
      'RSI with overbought/oversold levels',
      'MACD with signal line crossovers',
      'Bollinger Bands (upper/middle/lower)',
      'Moving averages (20/50/200 day)',
      'Candlestick chart data',
    ],
    useCases: [
      'Learn technical analysis concepts',
      'Study historical price patterns',
      'Educational demonstrations',
      'Research and analysis projects',
    ],
    faqs: [
      {
        question: 'Are these trading signals?',
        answer:
          'No. These are educational technical indicators showing mathematical calculations based on historical price data. They are not trading advice.',
      },
      {
        question: 'What timeframe should I use?',
        answer:
          'Daily (1d) is the default and most commonly used. The CRK add-in supports 1h, 4h, 1d, and 1w timeframes depending on your CoinGecko plan.',
      },
    ],
    relatedKits: ['portfolio-starter', 'macro-dashboard'],
  },

  // 3. Compare & Compete
  {
    id: 'compare-compete',
    slug: 'compare-compete',
    name: 'Compare & Compete',
    tagline: 'Multi-coin comparison with "What If Market Cap" calculator',
    description:
      'Compare multiple cryptocurrencies side-by-side and explore hypothetical scenarios. See what a coin\'s price would be if it had another coin\'s market cap - a popular educational exercise.',
    icon: '⚖️',
    tier: 'free',
    templates: ['compare', 'market_cap_calculator'],
    presets: { coins: 5, timeframe: '1d', refresh: 'manual' },
    features: [
      'Side-by-side coin comparison (2-5 coins)',
      '"What If Market Cap" calculator',
      'Price, market cap, and volume metrics',
      'Circulating supply comparison',
      '24h/7d/30d performance comparison',
      'Ranking and dominance data',
    ],
    useCases: [
      'Compare potential investments',
      'Explore "what if" market cap scenarios',
      'Research similar projects',
      'Educational market analysis',
    ],
    faqs: [
      {
        question: 'How does the "What If Market Cap" calculator work?',
        answer:
          'It calculates what Coin A\'s price would be if it had Coin B\'s market cap. Formula: (Coin B Market Cap / Coin A Circulating Supply) = Hypothetical Price. This is educational, not a prediction.',
      },
      {
        question: 'Can I compare more than 5 coins?',
        answer:
          'The template is optimized for 2-5 coins for readability. You can modify the Excel file to add more columns if needed.',
      },
    ],
    relatedKits: ['portfolio-starter', 'macro-dashboard'],
  },

  // 4. Macro Dashboard
  {
    id: 'macro-dashboard',
    slug: 'macro-dashboard',
    name: 'Macro Dashboard',
    tagline: 'Fear & Greed timeline, BTC dominance, and Global market cap',
    description:
      'Track the overall health of the crypto market. Monitor the Fear & Greed Index over time, watch Bitcoin dominance trends, and see total market capitalization changes.',
    icon: '🌍',
    tier: 'free',
    templates: ['fear_greed', 'btc_dominance', 'global_market'],
    presets: { coins: 0, timeframe: '30d', refresh: 'manual' },
    features: [
      'Fear & Greed Index (current + history)',
      'BTC dominance percentage',
      'Total crypto market cap',
      'Market cap change over time',
      'Altcoin season indicators',
      '30-day trend visualization',
    ],
    useCases: [
      'Gauge overall market sentiment',
      'Track Bitcoin dominance cycles',
      'Monitor total market growth',
      'Educational market analysis',
    ],
    faqs: [
      {
        question: 'Where does Fear & Greed data come from?',
        answer:
          'Fear & Greed Index is from Alternative.me. Market cap and dominance data is from CoinGecko. Both sources are attributed in the template.',
      },
      {
        question: 'What does BTC dominance mean?',
        answer:
          'BTC dominance is Bitcoin\'s market cap as a percentage of total crypto market cap. High dominance means Bitcoin is outperforming altcoins; low dominance suggests an "altcoin season".',
      },
    ],
    relatedKits: ['compare-compete', 'technical-analysis'],
  },

  // 5. DeFi Snapshot
  {
    id: 'defi-snapshot',
    slug: 'defi-snapshot',
    name: 'DeFi Snapshot',
    tagline: 'Top 10 TVL protocols and Pool APY tracker',
    description:
      'Track the decentralized finance ecosystem. See top protocols by Total Value Locked (TVL) and monitor liquidity pool APYs across major DeFi platforms.',
    icon: '🏦',
    tier: 'pro',
    templates: ['defi_tvl', 'pool_tracker'],
    presets: { coins: 10, timeframe: '1d', refresh: 'manual' },
    features: [
      'Top 10 DeFi protocols by TVL',
      'TVL change tracking (24h/7d/30d)',
      'Pool APY monitoring',
      'Protocol dominance breakdown',
      'Chain-by-chain TVL comparison',
      'Yield farming opportunities list',
    ],
    useCases: [
      'Monitor DeFi ecosystem growth',
      'Track yield farming opportunities',
      'Research DeFi protocols',
      'Educational DeFi analysis',
    ],
    faqs: [
      {
        question: 'Where does TVL data come from?',
        answer:
          'TVL data is sourced from CoinGecko\'s DeFi endpoints, which aggregate data from multiple on-chain sources. Data is attributed to CoinGecko.',
      },
      {
        question: 'Are the APYs guaranteed?',
        answer:
          'No. DeFi APYs are variable and can change frequently. This is educational data, not financial advice. Always verify on the protocol\'s official site.',
      },
    ],
    relatedKits: ['onchain-essentials', 'macro-dashboard'],
  },

  // 6. On-Chain Essentials
  {
    id: 'onchain-essentials',
    slug: 'onchain-essentials',
    name: 'On-Chain Essentials',
    tagline: 'Whale wallet tracker and Exchange flow indicators',
    description:
      'Monitor on-chain activity for educational insights. Track large wallet movements and see when funds flow into or out of exchanges - useful for understanding market dynamics.',
    icon: '🔗',
    tier: 'premium',
    templates: ['whale_tracker', 'exchange_flows'],
    presets: { coins: 5, timeframe: '1d', refresh: 'manual' },
    features: [
      'Large transaction monitoring',
      'Exchange inflow/outflow indicators',
      'Whale wallet activity alerts',
      'Network activity metrics',
      'Active address counts',
      'Transaction volume tracking',
    ],
    useCases: [
      'Monitor large holder activity',
      'Track exchange deposit/withdrawal trends',
      'Research on-chain metrics',
      'Educational blockchain analysis',
    ],
    faqs: [
      {
        question: 'What counts as a "whale" transaction?',
        answer:
          'Typically transactions of $1M+ USD equivalent. The exact threshold depends on the coin and data availability from CoinGecko.',
      },
      {
        question: 'Is this real-time data?',
        answer:
          'Data is refreshed when you trigger the CRK add-in. CoinGecko free tier provides data with some delay; Pro tier offers more frequent updates.',
      },
    ],
    relatedKits: ['defi-snapshot', 'technical-analysis'],
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
