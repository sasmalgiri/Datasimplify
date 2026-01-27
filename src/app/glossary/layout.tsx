import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Glossary - 100+ Cryptocurrency Terms Explained',
  description: 'Comprehensive cryptocurrency glossary with 100+ terms explained. From HODL to DeFi, blockchain to smart contracts. Beginner-friendly definitions with examples.',
  keywords: [
    'crypto glossary',
    'cryptocurrency terms',
    'bitcoin glossary',
    'blockchain terminology',
    'what is hodl',
    'defi terms explained',
    'crypto slang',
    'cryptocurrency dictionary',
    'blockchain terms',
    'web3 glossary'
  ],
  openGraph: {
    title: 'Crypto Glossary - 100+ Terms Explained | CryptoReportKit',
    description: 'Comprehensive cryptocurrency glossary. From HODL to DeFi, all crypto terms explained with examples.',
    url: `${siteUrl}/glossary`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit Glossary',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Crypto Glossary - 100+ Terms | CryptoReportKit',
    description: '100+ cryptocurrency terms explained. HODL, DeFi, blockchain & more.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/glossary`,
  },
};

export default function GlossaryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
