import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Screener — Filter by Price, Volume, Market Cap & More',
  description:
    'Screen 500+ cryptocurrencies with multi-condition filters: market cap, 24h volume, price change, rank, and more. Save presets and find your next trade.',
  alternates: { canonical: `${siteUrl}/screener` },
  openGraph: {
    title: 'Crypto Screener — Filter & Discover Coins | CryptoReportKit',
    description:
      'Screen 500+ cryptocurrencies with multi-condition filters: market cap, volume, price change, rank, and more.',
  },
};

export default function ScreenerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
