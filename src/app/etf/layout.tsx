import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto ETF Tracker — Bitcoin & Ethereum ETF Flows',
  description:
    'Track Bitcoin and Ethereum ETF inflows, outflows, and AUM in real time. Monitor institutional crypto adoption through spot ETF data.',
  alternates: { canonical: `${siteUrl}/etf` },
  openGraph: {
    title: 'Crypto ETF Tracker — BTC & ETH ETF Flows | CryptoReportKit',
    description:
      'Track Bitcoin and Ethereum ETF inflows, outflows, and AUM in real time.',
  },
};

export default function EtfLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://cryptoreportkit.com' },
          { name: 'ETF Tracker', url: 'https://cryptoreportkit.com/etf' },
        ]}
      />
      {children}
    </>
  );
}
