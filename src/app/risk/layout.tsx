import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Risk Analysis — Volatility, Drawdown & Risk Score',
  description:
    'Assess crypto investment risk with volatility metrics, max drawdown data, Sharpe ratios, and risk scores. Compare risk profiles across coins before you invest.',
  alternates: { canonical: `${siteUrl}/risk` },
  openGraph: {
    title: 'Crypto Risk Analysis | CryptoReportKit',
    description:
      'Assess crypto investment risk with volatility, drawdown, Sharpe ratios, and risk scores.',
    url: `${siteUrl}/risk`,
  },
};

export default function RiskLayout({ children }: { children: React.ReactNode }) {
  return children;
}
