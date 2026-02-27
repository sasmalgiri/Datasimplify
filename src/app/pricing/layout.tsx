import type { Metadata } from 'next';

import { IS_BETA_MODE } from '@/lib/betaMode';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

const title = IS_BETA_MODE ? 'Pricing — Free Beta' : 'Pricing — Free Forever + Pro from $19/mo';
const description = IS_BETA_MODE
  ? 'The current beta is free — no credit card required. All dashboards and tools are available during the beta.'
  : 'Free: 32+ dashboards, DCA simulator, heatmap, screener, and glossary. Pro ($19/mo): all 83+ dashboards, AI signals, tax reports, custom builder, price alerts, multi-exchange portfolio, and 300 downloads/mo.';

export const metadata: Metadata = {
  title,
  description,
  keywords: ['crypto analytics pricing', 'crypto dashboard cost', 'free crypto tools', 'crypto pro plan', 'CryptoReportKit pricing', 'bitcoin analytics price'],
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
  openGraph: {
    title: `${title} | CryptoReportKit`,
    description,
    url: `${siteUrl}/pricing`,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${title} | CryptoReportKit`,
    description,
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
