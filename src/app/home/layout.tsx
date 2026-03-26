import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Your Dashboard | CryptoReportKit',
  description:
    'Your personalized crypto dashboard. Access dashboards, tools, and templates curated for your workflow.',
  robots: { index: false, follow: false },
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
