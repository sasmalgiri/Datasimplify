import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crypto Fear & Greed Index — Market Sentiment Today',
  description:
    'Live Crypto Fear & Greed Index with historical chart. Understand whether the market is driven by fear or greed — and use it to time your entries and exits.',
  openGraph: {
    title: 'Crypto Fear & Greed Index | CryptoReportKit',
    description:
      'Live Crypto Fear & Greed Index with historical chart. Understand whether the market is driven by fear or greed.',
  },
};

export default function SentimentLayout({ children }: { children: React.ReactNode }) {
  return children;
}
