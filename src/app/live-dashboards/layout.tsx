import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '83+ Live Crypto Dashboards | CryptoReportKit',
  description:
    'Explore 83+ interactive crypto dashboards with real-time market data, coin comparison, DCA simulator, heatmaps, screeners, and more. Free to start with BYOK.',
  openGraph: {
    title: '83+ Live Crypto Dashboards | CryptoReportKit',
    description:
      'Explore 83+ interactive crypto dashboards with real-time market data, coin comparison, DCA simulator, heatmaps, screeners, and more.',
  },
};

export default function LiveDashboardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
