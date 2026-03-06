import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Dashboard Taxonomy — Browse by Category',
  description:
    'Browse all crypto dashboards organized by category. Find the right dashboard for market analysis, DeFi tracking, whale watching, and more.',
  alternates: { canonical: `${siteUrl}/live-dashboards/taxonomy` },
  openGraph: {
    title: 'Dashboard Taxonomy | CryptoReportKit',
    description: 'Browse all crypto dashboards organized by category.',
    url: `${siteUrl}/live-dashboards/taxonomy`,
  },
};

export default function TaxonomyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
