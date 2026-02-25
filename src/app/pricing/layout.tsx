import type { Metadata } from 'next';

import { IS_BETA_MODE } from '@/lib/betaMode';

const title = IS_BETA_MODE ? 'Pricing — Free Beta' : 'Pricing — Free Forever + Pro from $19/mo';
const description = IS_BETA_MODE
  ? 'The current beta is free — no credit card required. All dashboards and tools are available during the beta.'
  : 'Free: 32+ dashboards, DCA simulator, heatmap, screener, and glossary. Pro ($19/mo): all 83+ dashboards, AI signals, tax reports, custom builder, price alerts, multi-exchange portfolio, and 300 downloads/mo.';

export const metadata: Metadata = {
  title,
  description,
  openGraph: {
    title: `${title} | CryptoReportKit`,
    description,
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
