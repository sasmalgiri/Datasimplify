import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Live Crypto Dashboards | CryptoReportKit',
  description: 'Interactive crypto dashboards powered by your CoinGecko API key. Real-time market data, charts, and analysis. BYOK — your key, your data.',
};

export default function LiveDashboardsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
