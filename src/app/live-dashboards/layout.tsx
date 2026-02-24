import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '83+ Live Crypto Dashboards — Free & Pro Analytics',
  description:
    'Browse 83+ interactive crypto dashboards: market overview, whale radar, accumulation zones, DeFi yields, meme coin momentum, and more. 32 free dashboards, no signup required.',
  openGraph: {
    title: '83+ Live Crypto Dashboards — Free & Pro | CryptoReportKit',
    description:
      'Browse 83+ crypto dashboards: market overview, whale radar, accumulation zones, DeFi yields, and more. 32 free, no signup.',
  },
};

export default function LiveDashboardsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
