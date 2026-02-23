import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Dashboard | CryptoReportKit',
  description:
    'Your personalized crypto dashboard. Access dashboards, tools, and templates curated for your workflow.',
};

export default function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
