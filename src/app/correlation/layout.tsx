import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Correlation Heatmap — Portfolio Diversification Tool',
  description:
    'Visualize price correlations between cryptocurrencies. Find uncorrelated assets to diversify your portfolio and reduce risk with historical correlation analysis.',
  alternates: { canonical: `${siteUrl}/correlation` },
  openGraph: {
    title: 'Crypto Correlation Heatmap | CryptoReportKit',
    description:
      'Visualize price correlations between cryptocurrencies. Find uncorrelated assets to diversify your portfolio.',
  },
};

export default function CorrelationLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://cryptoreportkit.com' },
          { name: 'Correlation', url: 'https://cryptoreportkit.com/correlation' },
        ]}
      />
      {children}
    </>
  );
}
