import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Crypto Categories — DeFi, Layer 1, Layer 2, Meme & More',
  description:
    'Browse crypto by category: DeFi, Layer 1, Layer 2, Gaming, Meme coins, AI tokens, and more. See top performers, market cap, and volume for each sector.',
  openGraph: {
    title: 'Crypto Categories — DeFi, Layer 1, Meme & More | CryptoReportKit',
    description:
      'Browse crypto by category: DeFi, Layer 1, Layer 2, Gaming, Meme coins, AI tokens, and more.',
  },
};

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
