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

// Main static pages
const STATIC_PAGES = [
  '',
  '/market',
  '/templates',
  '/pricing',
  '/compare',
  '/screener',
  '/sentiment',
  '/technical',
  '/correlation',
  '/etf',
  '/defi',
  '/portfolio',
  '/charts',
  '/charts/advanced',
  '/trending',
  '/gainers-losers',
  '/categories',
  '/global-market',
  '/glossary',
  '/learn',
  '/faq',
  '/contact',
  '/disclaimer',
  '/privacy',
  '/terms',
  '/refund',
  '/template-requirements',
  '/tools',
  '/tools/verify',
  '/smart-contract-verifier',
  '/roadmap',
];

// Top cryptocurrencies for coin pages
const TOP_COINS = [
  'bitcoin',
  'ethereum',
  'tether',
  'solana',
  'ripple',
  'dogecoin',
  'cardano',
  'avalanche-2',
  'polkadot',
  'chainlink',
  'polygon-matic',
  'litecoin',
  'uniswap',
  'stellar',
  'tron',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = STATIC_PAGES.map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: path === '' ? 'daily' : 'weekly',
    priority: path === '' ? 1.0 : path.includes('template') || path === '/pricing' ? 0.9 : 0.7,
  }));

  // Individual template landing pages (high priority for SEO)
  const templatePages: MetadataRoute.Sitemap = TEMPLATE_SLUGS.map((slug) => ({
    url: `${BASE_URL}/excel-templates/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: 0.9,
  }));

  // Coin detail pages
  const coinPages: MetadataRoute.Sitemap = TOP_COINS.map((coinId) => ({
    url: `${BASE_URL}/coin/${coinId}`,
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.6,
  }));

  return [...staticPages, ...templatePages, ...coinPages];
}
