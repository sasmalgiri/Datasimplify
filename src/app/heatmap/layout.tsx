import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Heatmap — Visualize Market Movements',
  description:
    'Interactive crypto heatmap showing 500+ coins by market cap and 24h performance. Spot sector trends, find outperformers, and drill into any category — updated in real time.',
  alternates: { canonical: `${siteUrl}/heatmap` },
  openGraph: {
    title: 'Crypto Heatmap — Visualize Market Movements | CryptoReportKit',
    description:
      'Interactive crypto heatmap showing 500+ coins by market cap and 24h performance. Spot trends, find outperformers.',
  },
};

export default function HeatmapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://cryptoreportkit.com' },
          { name: 'Heatmap', url: 'https://cryptoreportkit.com/heatmap' },
        ]}
      />
      {children}
    </>
  );
}
