import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Recently Added Cryptocurrencies — New Coin Listings',
  description:
    'Discover the newest cryptocurrencies added to the market. Browse recently listed coins with price, market cap, volume, and 24h performance data.',
  alternates: { canonical: `${siteUrl}/recently-added` },
  openGraph: {
    title: 'Recently Added Cryptocurrencies | CryptoReportKit',
    description:
      'Discover the newest cryptocurrencies added to the market with price, market cap, and performance data.',
    url: `${siteUrl}/recently-added`,
  },
};

export default function RecentlyAddedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
