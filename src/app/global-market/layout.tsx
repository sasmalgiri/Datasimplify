import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Global Crypto Market Overview — Total Cap, Volume & Dominance',
  description:
    'Live global crypto market stats: total market cap, 24h volume, BTC dominance, active coins, and sector breakdown. Track the health of the entire crypto market.',
  alternates: { canonical: `${siteUrl}/global-market` },
  openGraph: {
    title: 'Global Crypto Market Overview | CryptoReportKit',
    description:
      'Live global crypto market stats: total market cap, 24h volume, BTC dominance, and sector breakdown.',
  },
};

export default function GlobalMarketLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://cryptoreportkit.com' },
          { name: 'Global Market', url: 'https://cryptoreportkit.com/global-market' },
        ]}
      />
      {children}
    </>
  );
}
