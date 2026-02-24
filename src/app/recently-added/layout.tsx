import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recently Added Cryptocurrencies — New Coin Listings',
  description:
    'Discover the newest cryptocurrencies added to the market. Browse recently listed coins with price, market cap, volume, and 24h performance data.',
  openGraph: {
    title: 'Recently Added Cryptocurrencies | CryptoReportKit',
    description:
      'Discover the newest cryptocurrencies added to the market with price, market cap, and performance data.',
  },
};

export default function RecentlyAddedLayout({ children }: { children: React.ReactNode }) {
  return children;
}
