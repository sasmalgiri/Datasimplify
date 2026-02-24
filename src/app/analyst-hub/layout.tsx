import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analyst Hub — Pro Research Dashboard',
  description:
    'Professional crypto research workspace: CryptoHealthScore, SmartSignals, RiskRadar, and AlphaFinder — 8 AI-powered intelligence widgets for data-driven decisions.',
  openGraph: {
    title: 'Analyst Hub — Pro Research Dashboard | CryptoReportKit',
    description:
      'Professional crypto research workspace with 8 AI-powered intelligence widgets for data-driven decisions.',
  },
};

export default function AnalystHubLayout({ children }: { children: React.ReactNode }) {
  return children;
}
