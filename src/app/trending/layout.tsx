import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/components/JsonLd';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Trending Cryptocurrencies — Most Searched Coins Today',
  description:
    'See which cryptocurrencies are trending right now. Live rankings of the most searched coins, top gainers, and top losers — powered by CoinGecko data.',
  alternates: { canonical: `${siteUrl}/trending` },
  openGraph: {
    title: 'Trending Cryptocurrencies Today | CryptoReportKit',
    description:
      'See which cryptocurrencies are trending right now. Live rankings of the most searched coins, top gainers, and top losers.',
  },
};

export default function TrendingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: 'https://cryptoreportkit.com' },
          { name: 'Trending', url: 'https://cryptoreportkit.com/trending' },
        ]}
      />
      {children}
    </>
  );
}
