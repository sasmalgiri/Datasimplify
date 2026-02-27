import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Refund Policy',
  description: 'CryptoReportKit refund policy — 30-day money-back guarantee on Pro plans. No questions asked.',
  alternates: {
    canonical: `${siteUrl}/refund`,
  },
  openGraph: {
    title: 'Refund Policy | CryptoReportKit',
    description: 'CryptoReportKit 30-day money-back guarantee on Pro plans.',
  },
};

export default function RefundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
