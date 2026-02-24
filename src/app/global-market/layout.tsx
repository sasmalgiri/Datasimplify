import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Global Crypto Market Overview — Total Cap, Volume & Dominance',
  description:
    'Live global crypto market stats: total market cap, 24h volume, BTC dominance, active coins, and sector breakdown. Track the health of the entire crypto market.',
  openGraph: {
    title: 'Global Crypto Market Overview | CryptoReportKit',
    description:
      'Live global crypto market stats: total market cap, 24h volume, BTC dominance, and sector breakdown.',
  },
};

export default function GlobalMarketLayout({ children }: { children: React.ReactNode }) {
  return children;
}
