import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'CryptoReportKit terms of service — rules governing use of 83+ live crypto dashboards, data tools, and BYOK analytics platform.',
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
  openGraph: {
    title: 'Terms of Service | CryptoReportKit',
    description: 'CryptoReportKit terms of service for crypto dashboards and analytics tools.',
  },
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
