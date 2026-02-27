import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Compare Cryptocurrencies Side-by-Side — 26 Metrics',
  description:
    'Compare up to 10 coins with 26 metrics: price, market cap, volume, supply, RSI, volatility, Sharpe ratio, and more. Quick presets for Top 5, Layer 1s, DeFi, and Meme coins.',
  alternates: { canonical: `${siteUrl}/compare` },
  openGraph: {
    title: 'Compare Cryptocurrencies Side-by-Side — 26 Metrics | CryptoReportKit',
    description:
      'Compare up to 10 coins with 26 metrics including technical indicators. Quick presets for Top 5, Layer 1s, DeFi, and Meme coins.',
  },
};

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return children;
}
