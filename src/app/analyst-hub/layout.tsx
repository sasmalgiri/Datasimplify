import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Analyst Hub — Pro Research Dashboard',
  description:
    'Professional crypto research workspace: CryptoHealthScore, SmartSignals, RiskRadar, and AlphaFinder — 8 AI-powered intelligence widgets for data-driven decisions.',
  alternates: { canonical: `${siteUrl}/analyst-hub` },
  openGraph: {
    title: 'Analyst Hub — Pro Research Dashboard | CryptoReportKit',
    description:
      'Professional crypto research workspace with 8 AI-powered intelligence widgets for data-driven decisions.',
    url: `${siteUrl}/analyst-hub`,
  },
};

export default function AnalystHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
