import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top Gainers & Losers — Crypto Movers Today',
  description:
    'Track the biggest crypto movers in real time. Top gainers and losers by 24h, 7d, and 30d performance across 500+ coins with market cap and volume data.',
  openGraph: {
    title: 'Top Crypto Gainers & Losers Today | CryptoReportKit',
    description:
      'Track the biggest crypto movers in real time. Top gainers and losers by 24h, 7d, and 30d performance.',
  },
};

export default function GainersLosersLayout({ children }: { children: React.ReactNode }) {
  return children;
}
