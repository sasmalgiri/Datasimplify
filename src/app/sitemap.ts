import { MetadataRoute } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

// Template slugs for individual landing pages
const TEMPLATE_SLUGS = [
  'crypto-portfolio-tracker',
  'crypto-screener',
  'bitcoin-analytics',
  'fear-greed-dashboard',
  'defi-tvl-tracker',
  'technical-analysis',
  'funding-rates',
  'correlation-matrix',
  'token-unlocks',
  'whale-tracker',
  'etf-tracker',
  'crypto-comparison',
  'watchlist',
  'risk-dashboard',
  'market-overview',
  'gainers-losers',
  'staking-rewards',
  'liquidations-tracker',
];

// Main static pages with priorities
const STATIC_PAGES = [
  // Core pages (highest priority)
  { path: '', priority: 1.0, changeFreq: 'daily' as const },
  { path: '/templates', priority: 0.95, changeFreq: 'weekly' as const },
  { path: '/compare', priority: 0.9, changeFreq: 'daily' as const },
  { path: '/pricing', priority: 0.9, changeFreq: 'weekly' as const },
  { path: '/smart-contract-verifier', priority: 0.85, changeFreq: 'weekly' as const },

  // Market data pages
  { path: '/market', priority: 0.85, changeFreq: 'daily' as const },
  { path: '/trending', priority: 0.8, changeFreq: 'daily' as const },
  { path: '/gainers-losers', priority: 0.8, changeFreq: 'daily' as const },
  { path: '/screener', priority: 0.8, changeFreq: 'daily' as const },
  { path: '/sentiment', priority: 0.75, changeFreq: 'daily' as const },
  { path: '/technical', priority: 0.75, changeFreq: 'daily' as const },
  { path: '/correlation', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/defi', priority: 0.7, changeFreq: 'daily' as const },
  { path: '/etf', priority: 0.7, changeFreq: 'daily' as const },
  { path: '/categories', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/global-market', priority: 0.7, changeFreq: 'daily' as const },
  { path: '/recently-added', priority: 0.65, changeFreq: 'daily' as const },

  // Tools & features
  { path: '/portfolio', priority: 0.75, changeFreq: 'weekly' as const },
  { path: '/charts', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/charts/advanced', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/tools', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/tools/verify', priority: 0.7, changeFreq: 'weekly' as const },
  { path: '/download', priority: 0.75, changeFreq: 'weekly' as const },

  // Educational content (important for SEO)
  { path: '/learn', priority: 0.8, changeFreq: 'weekly' as const },
  { path: '/glossary', priority: 0.8, changeFreq: 'weekly' as const },
  { path: '/faq', priority: 0.75, changeFreq: 'weekly' as const },
  { path: '/byok', priority: 0.75, changeFreq: 'monthly' as const },
  { path: '/template-requirements', priority: 0.7, changeFreq: 'monthly' as const },
  { path: '/data-sources', priority: 0.6, changeFreq: 'monthly' as const },

  // Company pages
  { path: '/about', priority: 0.6, changeFreq: 'monthly' as const },
  { path: '/contact', priority: 0.6, changeFreq: 'monthly' as const },
  { path: '/roadmap', priority: 0.5, changeFreq: 'monthly' as const },

  // Legal pages
  { path: '/privacy', priority: 0.5, changeFreq: 'yearly' as const },
  { path: '/terms', priority: 0.5, changeFreq: 'yearly' as const },
  { path: '/refund', priority: 0.5, changeFreq: 'yearly' as const },
  { path: '/disclaimer', priority: 0.5, changeFreq: 'yearly' as const },
];

// Report kit slugs
const REPORT_KIT_SLUGS = [
  'portfolio-starter',
  'market-overview',
  'trader-charts',
  'screener-watchlist',
  'coin-research',
  'risk-correlation',
  'defi-tvl',
  'stablecoin-monitor',
];

// Top 50 cryptocurrencies for coin pages (by market cap)
const TOP_COINS = [
  'bitcoin', 'ethereum', 'tether', 'xrp', 'solana',
  'bnb', 'dogecoin', 'usdc', 'cardano', 'tron',
  'avalanche-2', 'chainlink', 'shiba-inu', 'polkadot', 'bitcoin-cash',
  'uniswap', 'litecoin', 'near', 'stellar', 'polygon-matic',
  'internet-computer', 'dai', 'ethereum-classic', 'cosmos', 'render',
  'filecoin', 'hedera', 'aptos', 'arbitrum', 'okb',
  'vechain', 'immutable', 'optimism', 'the-graph', 'injective',
  'algorand', 'fantom', 'theta', 'eos', 'aave',
  'maker', 'flow', 'stacks', 'elrond', 'axie-infinity',
  'sandbox', 'mana', 'gala', 'kucoin', 'nexo',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Static pages with individual priorities
  const staticPages: MetadataRoute.Sitemap = STATIC_PAGES.map((page) => ({
    url: `${BASE_URL}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFreq,
    priority: page.priority,
  }));

  // Individual template landing pages (SEO-optimized product pages)
  const templatePages: MetadataRoute.Sitemap = TEMPLATE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/excel-templates/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // Report kit pages (template category pages)
  const reportKitPages: MetadataRoute.Sitemap = REPORT_KIT_SLUGS.map((slug) => ({
    url: `${BASE_URL}/templates/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.85,
  }));

  // Coin detail pages (top 50 by market cap)
  const coinPages: MetadataRoute.Sitemap = TOP_COINS.map((coinId) => ({
    url: `${BASE_URL}/coin/${coinId}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...templatePages, ...reportKitPages, ...coinPages];
}
