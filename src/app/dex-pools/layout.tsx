import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

export const metadata: Metadata = {
  title: 'DEX Pools & Liquidity — Top Trading Pairs',
  description:
    'Browse top DEX liquidity pools across Uniswap, PancakeSwap, Curve, and more. See TVL, volume, fees, and APY for the most active trading pairs.',
  alternates: { canonical: `${siteUrl}/dex-pools` },
  openGraph: {
    title: 'DEX Pools & Liquidity | CryptoReportKit',
    description:
      'Browse top DEX liquidity pools across Uniswap, PancakeSwap, Curve, and more.',
    url: `${siteUrl}/dex-pools`,
  },
};

export default function DexPoolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
