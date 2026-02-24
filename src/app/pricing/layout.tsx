import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Free & Pro Plans | CryptoReportKit',
  description:
    'Start free with 32+ dashboards, DCA simulator, and crypto glossary. Upgrade to Pro for all 83+ dashboards, custom builder, tax tools, and more.',
  openGraph: {
    title: 'Pricing — Free & Pro Plans | CryptoReportKit',
    description:
      'Start free with 32+ dashboards. Upgrade to Pro for all 83+ dashboards, custom builder, and tax tools.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
