// Shared coin-name helpers used by the coin page + its metadata layout so the
// server-rendered <h1>/description and the <title> stay consistent.

// Display names for the highest-traffic coins (also the ones in the sitemap).
export const COIN_NAMES: Record<string, string> = {
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

/** Human-friendly name for a coin id — e.g. "bitcoin" -> "Bitcoin (BTC)". */
export function formatCoinName(id: string): string {
  return (
    COIN_NAMES[id] ||
    id
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ')
  );
}

/** Short name without the ticker — e.g. "Bitcoin (BTC)" -> "Bitcoin". */
export function shortCoinName(id: string): string {
  return formatCoinName(id).split(' (')[0];
}
