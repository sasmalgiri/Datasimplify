import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Pricing — Free & Pro Plans | CryptoReportKit',
  description: 'CryptoReportKit pricing: Free tier with 5 widgets, 2-coin compare, and 3 downloads/month. Pro at $9/mo with 47 widgets, 300 downloads, advanced charts, and full analytics. BYOK architecture.',
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
    title: 'Pricing — Free & Pro | CryptoReportKit',
    description: 'Free tier with 5 widgets and basic tools. Pro at $9/mo with 47 widgets, 300 downloads, advanced charts, and AI analytics. BYOK architecture.',
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
    title: 'Pricing — Free & Pro | CryptoReportKit',
    description: 'Free tier with essentials. Pro $9/mo with 47 widgets, 300 downloads, and full analytics. BYOK architecture.',
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
