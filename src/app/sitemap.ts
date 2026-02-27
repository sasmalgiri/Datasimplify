import type { MetadataRoute } from 'next';
import { LIVE_DASHBOARDS } from '@/lib/live-dashboard/definitions';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

// Use a fixed build date so lastModified doesn't change on every crawl.
// Update this date when you deploy meaningful content changes.
const LAST_UPDATED = '2026-02-26T00:00:00.000Z';

export default function sitemap(): MetadataRoute.Sitemap {

  const mainPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/live-dashboards`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.95 },
    { url: `${BASE_URL}/pricing`, lastModified: LAST_UPDATED, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/compare`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE_URL}/datalab`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE_URL}/etf`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.8 },
    { url: `${BASE_URL}/global-market`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.8 },
  ];

  // Dynamic dashboard pages — generated from definitions
  const dashboardPages: MetadataRoute.Sitemap = LIVE_DASHBOARDS.map((d) => ({
    url: `${BASE_URL}/live-dashboards/${d.slug}`,
    lastModified: LAST_UPDATED,
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  // Top coin pages — static list of highest-traffic coins
  const topCoins = [
    'bitcoin', 'ethereum', 'solana', 'ripple', 'cardano', 'dogecoin',
    'polkadot', 'avalanche-2', 'chainlink', 'litecoin', 'stellar',
    'uniswap', 'cosmos', 'near', 'internet-computer', 'polygon-ecosystem-token',
    'tron', 'shiba-inu', 'sui', 'aptos',
  ];
  const coinPages: MetadataRoute.Sitemap = topCoins.map((id) => ({
    url: `${BASE_URL}/coin/${id}`,
    lastModified: LAST_UPDATED,
    changeFrequency: 'daily' as const,
    priority: 0.65,
  }));

  const featurePages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/market`, lastModified: LAST_UPDATED, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE_URL}/charts`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.75 },
    { url: `${BASE_URL}/screener`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.75 },
    { url: `${BASE_URL}/sentiment`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.75 },
    { url: `${BASE_URL}/correlation`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/heatmap`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/technical`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/portfolio`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/smart-contract-verifier`, lastModified: LAST_UPDATED, changeFrequency: 'weekly', priority: 0.65 },
    { url: `${BASE_URL}/trending`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.65 },
    { url: `${BASE_URL}/gainers-losers`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.65 },
    { url: `${BASE_URL}/recently-added`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/categories`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/defi`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/dex-pools`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.55 },
    { url: `${BASE_URL}/rwa`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.55 },
    { url: `${BASE_URL}/risk`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.55 },
    { url: `${BASE_URL}/social`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.55 },
    { url: `${BASE_URL}/tools`, lastModified: LAST_UPDATED, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/analyst-hub`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.65 },
    { url: `${BASE_URL}/research`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/templates`, lastModified: LAST_UPDATED, changeFrequency: 'weekly', priority: 0.6 },
    { url: `${BASE_URL}/command-center`, lastModified: LAST_UPDATED, changeFrequency: 'weekly', priority: 0.55 },
  ];

  const infoPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/learn`, lastModified: LAST_UPDATED, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/glossary`, lastModified: LAST_UPDATED, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE_URL}/faq`, lastModified: LAST_UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/byok`, lastModified: LAST_UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/template-requirements`, lastModified: LAST_UPDATED, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${BASE_URL}/roadmap`, lastModified: LAST_UPDATED, changeFrequency: 'weekly', priority: 0.55 },
    { url: `${BASE_URL}/data-sources`, lastModified: LAST_UPDATED, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/status`, lastModified: LAST_UPDATED, changeFrequency: 'daily', priority: 0.4 },
  ];

  const legalPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/about`, lastModified: LAST_UPDATED, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE_URL}/contact`, lastModified: LAST_UPDATED, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: LAST_UPDATED, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: LAST_UPDATED, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/disclaimer`, lastModified: LAST_UPDATED, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/refund`, lastModified: LAST_UPDATED, changeFrequency: 'monthly', priority: 0.3 },
  ];

  return [...mainPages, ...dashboardPages, ...coinPages, ...featurePages, ...infoPages, ...legalPages];
}
