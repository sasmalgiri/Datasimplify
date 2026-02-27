import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'CryptoReportKit privacy policy — how we handle your data. BYOK architecture means your API keys never leave your browser. No tracking of financial data.',
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
  openGraph: {
    title: 'Privacy Policy | CryptoReportKit',
    description: 'CryptoReportKit privacy policy — BYOK architecture means your API keys never leave your browser.',
  },
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return children;
}
