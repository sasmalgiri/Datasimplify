import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Disclaimer',
  description: 'CryptoReportKit disclaimer — our crypto dashboards and analytics are for informational purposes only. Not financial advice.',
  alternates: {
    canonical: `${siteUrl}/disclaimer`,
  },
  openGraph: {
    title: 'Disclaimer | CryptoReportKit',
    description: 'CryptoReportKit disclaimer — analytics for informational purposes only. Not financial advice.',
  },
};

export default function DisclaimerLayout({ children }: { children: React.ReactNode }) {
  return children;
}
