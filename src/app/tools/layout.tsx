import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crypto Tools — Screener, Tax, DCA, Alerts & More',
  description:
    'All-in-one crypto toolkit: smart screener, tax report builder, DCA simulator, portfolio tracker, price alerts, multi-exchange balance, and heatmap — free and Pro tools in one place.',
  openGraph: {
    title: 'Crypto Tools — Screener, Tax, DCA, Alerts & More | CryptoReportKit',
    description:
      'All-in-one crypto toolkit: smart screener, tax report builder, DCA simulator, portfolio tracker, price alerts, and more.',
  },
};

export default function ToolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
