import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'About CryptoReportKit - Crypto Excel Templates & BYOK',
  description: 'CryptoReportKit provides Excel templates with CRK formulas for live cryptocurrency data. BYOK architecture means you use your own API keys. Educational tool for crypto analysis.',
  keywords: [
    'about cryptoreportkit',
    'crypto report kit',
    'excel crypto templates company',
    'byok crypto service',
    'cryptocurrency analysis tool'
  ],
  openGraph: {
    title: 'About CryptoReportKit',
    description: 'Excel templates with CRK formulas for live crypto data. BYOK architecture for privacy.',
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
