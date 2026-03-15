import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: '15 Crypto Myths That Cost Beginners Money | CryptoReportKit',
  description:
    'Debunking the most dangerous cryptocurrency myths spread by YouTube influencers. Market cap math, cheap coin fallacy, guaranteed returns, DeFi yield traps — learn the reality with data.',
  keywords: [
    'crypto myths',
    'cryptocurrency misconceptions',
    'cheap coin fallacy',
    'market cap explained',
    'crypto scams',
    'bitcoin myths',
    'defi risks',
    'crypto influencer scams',
    'buy the dip danger',
    'crypto beginner mistakes',
  ],
  openGraph: {
    title: '15 Crypto Myths That Cost Beginners Money | CryptoReportKit',
    description:
      'YouTube won\'t tell you this. We debunk the 10 most dangerous crypto myths with math, data, and real examples.',
    url: `${siteUrl}/myths`,
    type: 'website',
    images: [
      {
        url: `${siteUrl}/og-image.png`,
        width: 1200,
        height: 630,
        alt: 'CryptoReportKit - Crypto Myths Debunked',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '15 Crypto Myths That Cost Beginners Money',
    description:
      'Market cap math, cheap coin fallacy, DeFi yield traps. The reality behind crypto\'s biggest misconceptions.',
    images: [`${siteUrl}/og-image.png`],
  },
  alternates: {
    canonical: `${siteUrl}/myths`,
  },
};

export default function MythsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
