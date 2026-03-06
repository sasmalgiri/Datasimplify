import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Research — Deep Dive Into Any Coin',
  description:
    'Research any cryptocurrency with in-depth metrics: supply data, developer activity, social metrics, on-chain stats, and fundamental analysis all in one place.',
  alternates: { canonical: `${siteUrl}/research` },
  openGraph: {
    title: 'Crypto Research — Fundamental Analysis | CryptoReportKit',
    description:
      'Research any cryptocurrency with in-depth metrics: supply, developer activity, social metrics, and fundamental analysis.',
    url: `${siteUrl}/research`,
  },
};

export default function ResearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
