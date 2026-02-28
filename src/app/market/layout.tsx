import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Live Crypto Market Data - Prices, Charts & Rankings',
  description: 'Real-time cryptocurrency market data. Track Bitcoin, Ethereum & 600+ altcoin prices, market caps, 24h volume, and rankings. Powered by CoinGecko API.',
  keywords: [
    'crypto market',
    'cryptocurrency prices',
    'bitcoin price',
    'ethereum price',
    'crypto market cap',
    'altcoin prices',
    'live crypto prices',
    'cryptocurrency rankings',
    'crypto market data',
    'real time crypto'
  ],
  openGraph: {
    title: 'Live Crypto Market Data | CryptoReportKit',
    description: 'Real-time prices for 600+ cryptocurrencies. Market cap, volume, rankings. Powered by CoinGecko.',
    url: `${siteUrl}/market`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit Market Data',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Live Crypto Market Data | CryptoReportKit',
    description: 'Real-time prices for 600+ cryptocurrencies. Market cap, volume & rankings.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/market`,
  },
};

export default function MarketLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://cryptoreportkit.com' },
          { name: 'Market', url: 'https://cryptoreportkit.com/market' },
        ]}
      />
      {children}
    </>
  );
}
