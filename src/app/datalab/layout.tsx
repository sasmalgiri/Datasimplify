import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'DataLab | CryptoReportKit',
  description: 'Interactive chart overlays, data manipulation, and research experiments for crypto analysis.',
  alternates: { canonical: `${siteUrl}/datalab` },
};

export default function DataLabLayout({ children }: { children: React.ReactNode }) {
  return children;
}
