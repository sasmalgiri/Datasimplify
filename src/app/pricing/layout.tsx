import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing — Free Forever + Pro from $9/mo',
  description:
    'Free: 32+ dashboards, DCA simulator, heatmap, screener, and glossary. Pro ($9/mo): all 83+ dashboards, AI signals, tax reports, custom builder, price alerts, multi-exchange portfolio, and 300 downloads/mo.',
  openGraph: {
    title: 'Pricing — Free Forever + Pro from $9/mo | CryptoReportKit',
    description:
      'Free: 32+ dashboards and tools. Pro ($9/mo): 83+ dashboards, AI signals, tax reports, price alerts, and more.',
  },
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
