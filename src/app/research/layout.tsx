import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crypto Research — Deep Dive Into Any Coin',
  description:
    'Research any cryptocurrency with in-depth metrics: supply data, developer activity, social metrics, on-chain stats, and fundamental analysis all in one place.',
  openGraph: {
    title: 'Crypto Research — Fundamental Analysis | CryptoReportKit',
    description:
      'Research any cryptocurrency with in-depth metrics: supply, developer activity, social metrics, and fundamental analysis.',
  },
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
