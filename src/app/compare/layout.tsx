import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Compare Cryptocurrencies Side-by-Side | What-If Calculator',
  description: 'Compare up to 10 cryptocurrencies side-by-side. Analyze price, market cap, 24h change, ATH, supply metrics & more. Free What-If Market Cap Calculator included.',
  keywords: [
    'compare cryptocurrencies',
    'crypto comparison tool',
    'bitcoin vs ethereum',
    'what if market cap calculator',
    'cryptocurrency comparison',
    'compare crypto prices',
    'side by side crypto analysis',
    'market cap comparison',
    'crypto metrics comparison',
    'altcoin comparison'
  ],
  openGraph: {
    title: 'Compare Cryptocurrencies Side-by-Side | CryptoReportKit',
    description: 'Compare up to 10 cryptocurrencies side-by-side. Analyze price, market cap, 24h change, ATH, supply metrics. Free What-If Market Cap Calculator.',
    url: `${siteUrl}/compare`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit - Compare Cryptocurrencies',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compare Cryptocurrencies Side-by-Side | CryptoReportKit',
    description: 'Compare up to 10 cryptocurrencies. Analyze price, market cap, ATH & more. Free What-If Calculator included.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/compare`,
  },
};

export default function CompareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
