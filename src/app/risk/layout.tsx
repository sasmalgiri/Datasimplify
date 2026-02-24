import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crypto Risk Analysis — Volatility, Drawdown & Risk Score',
  description:
    'Assess crypto investment risk with volatility metrics, max drawdown data, Sharpe ratios, and risk scores. Compare risk profiles across coins before you invest.',
  openGraph: {
    title: 'Crypto Risk Analysis | CryptoReportKit',
    description:
      'Assess crypto investment risk with volatility, drawdown, Sharpe ratios, and risk scores.',
  },
};

export default function RiskLayout({ children }: { children: React.ReactNode }) {
  return children;
}
