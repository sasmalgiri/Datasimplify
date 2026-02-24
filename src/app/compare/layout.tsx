import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Compare Cryptocurrencies Side-by-Side | CryptoReportKit',
  description:
    'Compare any two cryptocurrencies with 26 data columns — price, market cap, volume, supply, performance, and more. Real-time data with BYOK.',
  openGraph: {
    title: 'Compare Cryptocurrencies Side-by-Side | CryptoReportKit',
    description:
      'Compare any two cryptocurrencies with 26 data columns — price, market cap, volume, supply, and more.',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
