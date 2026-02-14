import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'About CryptoReportKit - Excel Templates & Live Dashboards for Crypto',
  description: 'CryptoReportKit provides Excel templates with prefetched crypto data and live web dashboards. BYOK architecture.',
  keywords: [
    'about cryptoreportkit',
    'crypto report kit',
    'excel crypto templates',
    'byok crypto service',
    'cryptocurrency analysis tool'
  ],
  openGraph: {
    title: 'About CryptoReportKit',
    description: 'Excel templates with prefetched crypto data. Live dashboards with BYOK architecture.',
    url: `${siteUrl}/about`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'About CryptoReportKit',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'About CryptoReportKit',
    description: 'Excel templates for live crypto data with BYOK architecture.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/about`,
  },
};

export default function AboutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
