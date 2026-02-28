import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: '83+ Live Crypto Dashboards — Free & Pro Analytics',
  description:
    'Browse 83+ interactive crypto dashboards: market overview, whale radar, accumulation zones, DeFi yields, meme coin momentum, and more. 32 free dashboards, no signup required.',
  alternates: { canonical: `${siteUrl}/live-dashboards` },
  openGraph: {
    title: '83+ Live Crypto Dashboards — Free & Pro | CryptoReportKit',
    description:
      'Browse 83+ crypto dashboards: market overview, whale radar, accumulation zones, DeFi yields, and more. 32 free, no signup.',
  },
};

export default function LiveDashboardsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://cryptoreportkit.com' },
          { name: 'Live Dashboards', url: 'https://cryptoreportkit.com/live-dashboards' },
        ]}
      />
      {children}
    </>
  );
}
