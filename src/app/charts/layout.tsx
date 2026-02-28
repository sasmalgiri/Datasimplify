import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Charts — Interactive Price & Volume Charts',
  description:
    'Interactive cryptocurrency charts with candlestick, line, and area views. Overlay technical indicators, compare multiple coins, and analyze price action.',
  alternates: { canonical: `${siteUrl}/charts` },
  openGraph: {
    title: 'Crypto Charts — Price & Volume | CryptoReportKit',
    description:
      'Interactive cryptocurrency charts with candlestick, line, and area views. Overlay technical indicators and analyze price action.',
  },
};

export default function ChartsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://cryptoreportkit.com' },
          { name: 'Charts', url: 'https://cryptoreportkit.com/charts' },
        ]}
      />
      {children}
    </>
  );
}
