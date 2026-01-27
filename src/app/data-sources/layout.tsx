import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Data Sources & Attribution | CryptoReportKit',
  description: 'Learn where CryptoReportKit gets its cryptocurrency data. We use CoinGecko API via BYOK (Bring Your Own Key) architecture. Full attribution and compliance information.',
  keywords: [
    'crypto data sources',
    'coingecko api',
    'cryptocurrency data provider',
    'byok data',
    'crypto api attribution',
    'market data sources'
  ],
  openGraph: {
    title: 'Data Sources & Attribution | CryptoReportKit',
    description: 'Where CryptoReportKit gets its data: CoinGecko API via BYOK architecture.',
    url: `${siteUrl}/data-sources`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit Data Sources',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Data Sources | CryptoReportKit',
    description: 'CoinGecko API via BYOK. Full data attribution.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/data-sources`,
  },
};

export default function DataSourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
