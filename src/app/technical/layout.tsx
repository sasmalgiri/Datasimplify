import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Technical Analysis — RSI, Volatility, Sharpe Ratio & More',
  description:
    'Technical indicators for 500+ cryptocurrencies: RSI, 30-day volatility, momentum, Sharpe ratio, and max drawdown. Data-driven signals for smarter decisions.',
  alternates: { canonical: `${siteUrl}/technical` },
  openGraph: {
    title: 'Crypto Technical Analysis | CryptoReportKit',
    description:
      'Technical indicators for 500+ cryptocurrencies: RSI, volatility, momentum, Sharpe ratio, and max drawdown.',
  },
};

export default function TechnicalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
