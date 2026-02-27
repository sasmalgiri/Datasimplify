import type { Metadata } from 'next';

// Map of coin IDs to display names for SEO
const COIN_NAMES: Record<string, string> = {
  bitcoin: 'Bitcoin (BTC)',
  ethereum: 'Ethereum (ETH)',
  solana: 'Solana (SOL)',
  ripple: 'XRP (Ripple)',
  cardano: 'Cardano (ADA)',
  dogecoin: 'Dogecoin (DOGE)',
  polkadot: 'Polkadot (DOT)',
  'avalanche-2': 'Avalanche (AVAX)',
  chainlink: 'Chainlink (LINK)',
  litecoin: 'Litecoin (LTC)',
  stellar: 'Stellar (XLM)',
  uniswap: 'Uniswap (UNI)',
  cosmos: 'Cosmos (ATOM)',
  near: 'NEAR Protocol (NEAR)',
  'internet-computer': 'Internet Computer (ICP)',
  'polygon-ecosystem-token': 'Polygon (POL)',
  tron: 'TRON (TRX)',
  'shiba-inu': 'Shiba Inu (SHIB)',
  sui: 'Sui (SUI)',
  aptos: 'Aptos (APT)',
};

function formatCoinName(id: string): string {
  return COIN_NAMES[id] || id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const coinName = formatCoinName(id);
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://cryptoreportkit.com';

  const title = `${coinName} Price, Chart & Analysis`;
  const description = `Live ${coinName} price, interactive charts, technical analysis, on-chain metrics, developer activity, and community stats. Real-time data powered by BYOK.`;

  return {
    title,
    description,
    keywords: [
      `${coinName.split(' (')[0]} price`,
      `${coinName.split(' (')[0]} chart`,
      `${coinName.split(' (')[0]} analysis`,
      `${id} crypto`,
      'crypto analysis',
      'cryptocurrency data',
      'real-time crypto price',
    ],
    alternates: {
      canonical: `${siteUrl}/coin/${id}`,
    },
    openGraph: {
      title: `${title} | CryptoReportKit`,
      description,
      url: `${siteUrl}/coin/${id}`,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | CryptoReportKit`,
      description,
    },
  };
}

export default function CoinLayout({ children }: { children: React.ReactNode }) {
  return children;
}
