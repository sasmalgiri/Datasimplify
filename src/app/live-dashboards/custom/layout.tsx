import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Custom Dashboards | CryptoReportKit',
  description:
    'Create and manage custom crypto dashboards tailored to your analysis workflow.',
  robots: { index: false, follow: true },
};

export default function CustomDashboardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
