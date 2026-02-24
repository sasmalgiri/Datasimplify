import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Technical Analysis — RSI, Volatility, Sharpe Ratio & More',
  description:
    'Technical indicators for 500+ cryptocurrencies: RSI, 30-day volatility, momentum, Sharpe ratio, and max drawdown. Data-driven signals for smarter decisions.',
  openGraph: {
    title: 'Crypto Technical Analysis | CryptoReportKit',
    description:
      'Technical indicators for 500+ cryptocurrencies: RSI, volatility, momentum, Sharpe ratio, and max drawdown.',
  },
};

export default function TechnicalLayout({ children }: { children: React.ReactNode }) {
  return children;
}
