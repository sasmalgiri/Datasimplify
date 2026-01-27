import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'BYOK - Bring Your Own Key Architecture Explained',
  description: 'Learn about BYOK (Bring Your Own Key) architecture. Use your own CoinGecko API key with CryptoReportKit templates. Secure, private, and you control your data.',
  keywords: [
    'byok crypto',
    'bring your own key',
    'coingecko api key',
    'crypto api key setup',
    'byok architecture',
    'private crypto data',
    'secure api key',
    'excel api integration'
  ],
  openGraph: {
    title: 'BYOK - Bring Your Own Key | CryptoReportKit',
    description: 'Use your own API key with CryptoReportKit. Secure BYOK architecture explained.',
    url: `${siteUrl}/byok`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit BYOK Architecture',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BYOK - Bring Your Own Key | CryptoReportKit',
    description: 'Secure BYOK architecture. Use your own CoinGecko API key.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/byok`,
  },
};

export default function ByokLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
