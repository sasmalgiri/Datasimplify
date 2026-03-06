import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Explore Dashboards — Discover Crypto Analytics',
  description:
    'Explore and discover crypto dashboards tailored to your needs. Search by category, data source, or use case.',
  alternates: { canonical: `${siteUrl}/live-dashboards/explore` },
  openGraph: {
    title: 'Explore Dashboards | CryptoReportKit',
    description: 'Explore and discover crypto dashboards tailored to your needs.',
    url: `${siteUrl}/live-dashboards/explore`,
  },
};

export default function ExploreLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
