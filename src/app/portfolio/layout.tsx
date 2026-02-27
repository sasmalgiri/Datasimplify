import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Portfolio Builder — Risk-Based Asset Allocation',
  description:
    'Build a risk-adjusted crypto portfolio with real-time prices. Choose your risk tolerance, allocate assets, see a live risk score, and export your plan as PDF.',
  alternates: { canonical: `${siteUrl}/portfolio` },
  openGraph: {
    title: 'Crypto Portfolio Builder | CryptoReportKit',
    description:
      'Build a risk-adjusted crypto portfolio with real-time prices. Risk tolerance quiz, asset allocation, and PDF export.',
  },
};

export default function PortfolioLayout({ children }: { children: React.ReactNode }) {
  return children;
}
