import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crypto Charts — Interactive Price & Volume Charts',
  description:
    'Interactive cryptocurrency charts with candlestick, line, and area views. Overlay technical indicators, compare multiple coins, and analyze price action.',
  openGraph: {
    title: 'Crypto Charts — Price & Volume | CryptoReportKit',
    description:
      'Interactive cryptocurrency charts with candlestick, line, and area views. Overlay technical indicators and analyze price action.',
  },
};

export default function ChartsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
