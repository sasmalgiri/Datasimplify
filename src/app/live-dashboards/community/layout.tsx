import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Community Dashboards — User-Shared Analytics',
  description:
    'Browse community-shared crypto dashboards. See custom analytics created and shared by CryptoReportKit users.',
  alternates: { canonical: `${siteUrl}/live-dashboards/community` },
  openGraph: {
    title: 'Community Dashboards | CryptoReportKit',
    description: 'Browse community-shared crypto dashboards and custom analytics.',
    url: `${siteUrl}/live-dashboards/community`,
  },
};

export default function CommunityDashboardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
