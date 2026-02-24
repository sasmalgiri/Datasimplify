import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trending Cryptocurrencies — Most Searched Coins Today',
  description:
    'See which cryptocurrencies are trending right now. Live rankings of the most searched coins, top gainers, and top losers — powered by CoinGecko data.',
  openGraph: {
    title: 'Trending Cryptocurrencies Today | CryptoReportKit',
    description:
      'See which cryptocurrencies are trending right now. Live rankings of the most searched coins, top gainers, and top losers.',
  },
};

export default function TrendingLayout({ children }: { children: React.ReactNode }) {
  return children;
}
