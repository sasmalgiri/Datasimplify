import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Fear & Greed Index — Market Sentiment Today',
  description:
    'Live Crypto Fear & Greed Index with historical chart. Understand whether the market is driven by fear or greed — and use it to time your entries and exits.',
  alternates: { canonical: `${siteUrl}/sentiment` },
  openGraph: {
    title: 'Crypto Fear & Greed Index | CryptoReportKit',
    description:
      'Live Crypto Fear & Greed Index with historical chart. Understand whether the market is driven by fear or greed.',
  },
};

export default function SentimentLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://cryptoreportkit.com' },
          { name: 'Sentiment', url: 'https://cryptoreportkit.com/sentiment' },
        ]}
      />
      {children}
    </>
  );
}
