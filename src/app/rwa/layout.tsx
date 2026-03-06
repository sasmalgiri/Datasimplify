import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Real World Assets (RWA) — Tokenized Asset Tracker',
  description:
    'Track real-world asset (RWA) tokens: tokenized treasuries, real estate, commodities, and private credit. See TVL, yields, and market data for the RWA sector.',
  alternates: { canonical: `${siteUrl}/rwa` },
  openGraph: {
    title: 'Real World Assets (RWA) Tracker | CryptoReportKit',
    description:
      'Track tokenized real-world assets: treasuries, real estate, commodities, and private credit.',
    url: `${siteUrl}/rwa`,
  },
};

export default function RwaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
