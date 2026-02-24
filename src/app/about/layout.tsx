import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About CryptoReportKit — Free Crypto Analytics for Everyone',
  description:
    'CryptoReportKit offers 83+ live dashboards, AI-powered signals, tax tools, a DCA simulator, screener, and portfolio builder — all starting free. Your API keys never leave your browser.',
  openGraph: {
    title: 'About CryptoReportKit — Free Crypto Analytics for Everyone',
    description:
      '83+ live dashboards, AI-powered signals, tax tools, DCA simulator, and more — all starting free.',
  },
};

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return children;
}
