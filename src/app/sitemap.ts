import type { MetadataRoute } from 'next';
import { LIVE_DASHBOARDS } from '@/lib/live-dashboard/definitions';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const mainPages: MetadataRoute.Sitemap = [
    { url: BASE_URL, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${BASE_URL}/live-dashboards`, lastModified: now, changeFrequency: 'daily', priority: 0.95 },
    { url: `${BASE_URL}/pricing`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/compare`, lastModified: now, changeFrequency: 'daily', priority: 0.85 },
    { url: `${BASE_URL}/datalab`, lastModified: now, changeFrequency: 'daily', priority: 0.85 },
  ];

  // Dynamic dashboard pages — generated from definitions
  const dashboardPages: MetadataRoute.Sitemap = LIVE_DASHBOARDS.map((d) => ({
    url: `${BASE_URL}/live-dashboards/${d.slug}`,
    lastModified: now,
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
    lastModified: now,
    changeFrequency: 'daily' as const,
    priority: 0.65,
  }));

  const featurePages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/market`, lastModified: now, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${BASE_URL}/charts`, lastModified: now, changeFrequency: 'daily', priority: 0.75 },
    { url: `${BASE_URL}/screener`, lastModified: now, changeFrequency: 'daily', priority: 0.75 },
    { url: `${BASE_URL}/sentiment`, lastModified: now, changeFrequency: 'daily', priority: 0.75 },
    { url: `${BASE_URL}/correlation`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/heatmap`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/technical`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/portfolio`, lastModified: now, changeFrequency: 'daily', priority: 0.7 },
    { url: `${BASE_URL}/etf`, lastModified: now, changeFrequency: 'daily', priority: 0.65 },
    { url: `${BASE_URL}/smart-contract-verifier`, lastModified: now, changeFrequency: 'weekly', priority: 0.65 },
    { url: `${BASE_URL}/global-market`, lastModified: now, changeFrequency: 'daily', priority: 0.65 },
    { url: `${BASE_URL}/trending`, lastModified: now, changeFrequency: 'daily', priority: 0.65 },
    { url: `${BASE_URL}/gainers-losers`, lastModified: now, changeFrequency: 'daily', priority: 0.65 },
    { url: `${BASE_URL}/recently-added`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/categories`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/defi`, lastModified: now, changeFrequency: 'daily', priority: 0.6 },
    { url: `${BASE_URL}/dex-pools`, lastModified: now, changeFrequency: 'daily', priority: 0.55 },
    { url: `${BASE_URL}/rwa`, lastModified: now, changeFrequency: 'daily', priority: 0.55 },
    { url: `${BASE_URL}/risk`, lastModified: now, changeFrequency: 'daily', priority: 0.55 },
    { url: `${BASE_URL}/social`, lastModified: now, changeFrequency: 'daily', priority: 0.55 },
    { url: `${BASE_URL}/tools`, lastModified: now, changeFrequency: 'weekly', priority: 0.5 },
  ];

  const infoPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/learn`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE_URL}/glossary`, lastModified: now, changeFrequency: 'monthly', priority: 0.65 },
    { url: `${BASE_URL}/faq`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/byok`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE_URL}/template-requirements`, lastModified: now, changeFrequency: 'monthly', priority: 0.55 },
    { url: `${BASE_URL}/roadmap`, lastModified: now, changeFrequency: 'weekly', priority: 0.55 },
    { url: `${BASE_URL}/data-sources`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/status`, lastModified: now, changeFrequency: 'daily', priority: 0.4 },
  ];

  const legalPages: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE_URL}/privacy`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/terms`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/disclaimer`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
    { url: `${BASE_URL}/refund`, lastModified: now, changeFrequency: 'monthly', priority: 0.3 },
  ];

  return [...mainPages, ...dashboardPages, ...coinPages, ...featurePages, ...infoPages, ...legalPages];
}
