import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Learn Cryptocurrency - Beginner to Advanced Guides',
  description: 'Free cryptocurrency education academy. Learn blockchain basics, DeFi, trading fundamentals, technical analysis, and advanced crypto concepts. Beginner-friendly guides.',
  keywords: [
    'learn cryptocurrency',
    'crypto education',
    'blockchain basics',
    'how to invest in crypto',
    'cryptocurrency for beginners',
    'defi tutorial',
    'crypto trading guide',
    'bitcoin explained',
    'ethereum tutorial',
    'crypto academy'
  ],
  openGraph: {
    title: 'Learn Cryptocurrency | CryptoReportKit Academy',
    description: 'Free cryptocurrency education. Learn blockchain, DeFi, trading & technical analysis. Beginner to advanced guides.',
    url: `${siteUrl}/learn`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit Learning Academy',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Learn Cryptocurrency | CryptoReportKit Academy',
    description: 'Free crypto education. Blockchain basics to advanced DeFi & trading guides.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/learn`,
  },
};

export default function LearnLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
