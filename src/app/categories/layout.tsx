import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'Crypto Categories — DeFi, Layer 1, Layer 2, Meme & More',
  description:
    'Browse crypto by category: DeFi, Layer 1, Layer 2, Gaming, Meme coins, AI tokens, and more. See top performers, market cap, and volume for each sector.',
  alternates: { canonical: `${siteUrl}/categories` },
  openGraph: {
    title: 'Crypto Categories — DeFi, Layer 1, Meme & More | CryptoReportKit',
    description:
      'Browse crypto by category: DeFi, Layer 1, Layer 2, Gaming, Meme coins, AI tokens, and more.',
  },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
