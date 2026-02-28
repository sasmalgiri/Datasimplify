import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'DeFi Analytics — TVL, Yield, Protocol Rankings',
  description:
    'Explore DeFi protocols ranked by total value locked (TVL), yield opportunities, and market activity. Auto-generated dashboards for 4,000+ protocols.',
  alternates: { canonical: `${siteUrl}/defi` },
  openGraph: {
    title: 'DeFi Analytics — TVL, Yield & Rankings | CryptoReportKit',
    description:
      'Explore DeFi protocols ranked by TVL, yield opportunities, and market activity.',
  },
};

export default function DefiLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://cryptoreportkit.com' },
          { name: 'DeFi', url: 'https://cryptoreportkit.com/defi' },
        ]}
      />
      {children}
    </>
  );
}
