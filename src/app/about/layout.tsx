import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About CryptoReportKit — Crypto Analytics Platform',
  description:
    'CryptoReportKit provides 83+ interactive crypto dashboards with real-time market data. BYOK architecture — your API key stays in your browser.',
  openGraph: {
    title: 'About CryptoReportKit — Crypto Analytics Platform',
    description:
      'Professional crypto analytics with 83+ dashboards. BYOK architecture — your API key stays in your browser.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
