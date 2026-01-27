import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Pricing Plans - Free, Pro & Premium | Excel Crypto Templates',
  description: 'CryptoReportKit pricing: Free tier with 3 downloads/month, Pro at $19/mo with unlimited templates, Premium at $79/mo with scheduled exports. BYOK architecture - bring your own API key.',
  keywords: [
    'cryptoreportkit pricing',
    'crypto excel template pricing',
    'byok crypto templates',
    'cryptocurrency spreadsheet subscription',
    'excel crypto data pricing',
    'crypto analytics pricing',
    'free crypto templates',
    'pro crypto templates'
  ],
  openGraph: {
    title: 'Pricing Plans | CryptoReportKit',
    description: 'Choose your plan: Free tier with 3 downloads/month, Pro at $19/mo, Premium at $79/mo. BYOK architecture - use your own API keys.',
    url: `${siteUrl}/pricing`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit Pricing Plans',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pricing Plans | CryptoReportKit',
    description: 'Free tier, Pro $19/mo, Premium $79/mo. BYOK architecture for Excel crypto templates.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/pricing`,
  },
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
