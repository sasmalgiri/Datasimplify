import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'DEX Pools & Liquidity — Top Trading Pairs',
  description:
    'Browse top DEX liquidity pools across Uniswap, PancakeSwap, Curve, and more. See TVL, volume, fees, and APY for the most active trading pairs.',
  openGraph: {
    title: 'DEX Pools & Liquidity | CryptoReportKit',
    description:
      'Browse top DEX liquidity pools across Uniswap, PancakeSwap, Curve, and more.',
  },
};

export default function DexPoolsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
