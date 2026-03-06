import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Community — Discussions & Insights',
  description:
    'Join the CryptoReportKit community. Discuss market trends, share strategies, and get insights from fellow crypto enthusiasts and analysts.',
  alternates: { canonical: `${siteUrl}/community` },
  openGraph: {
    title: 'Crypto Community | CryptoReportKit',
    description:
      'Join the CryptoReportKit community. Discuss market trends, share strategies, and get insights from fellow crypto enthusiasts.',
    url: `${siteUrl}/community`,
  },
};

export default function CommunityLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
