import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crypto Correlation Heatmap — Portfolio Diversification Tool',
  description:
    'Visualize price correlations between cryptocurrencies. Find uncorrelated assets to diversify your portfolio and reduce risk with historical correlation analysis.',
  openGraph: {
    title: 'Crypto Correlation Heatmap | CryptoReportKit',
    description:
      'Visualize price correlations between cryptocurrencies. Find uncorrelated assets to diversify your portfolio.',
  },
};

export default function CorrelationLayout({ children }: { children: React.ReactNode }) {
  return children;
}
