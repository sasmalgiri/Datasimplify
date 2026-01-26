/**
 * CryptoSheets Supported Coins
 *
 * Comprehensive list of all cryptocurrencies supported by CryptoSheets add-in.
 * These coins can be used in template formulas.
 *
 * Note: CryptoSheets supports 5000+ coins. This list includes the most popular
 * and commonly used coins. The add-in dynamically supports any coin available
 * on supported exchanges.
 */

export interface CryptoSheetCoin {
  id: string; // CryptoSheets identifier (usually symbol)
  symbol: string; // Trading symbol
  name: string; // Full name
  category: 'layer1' | 'layer2' | 'defi' | 'exchange' | 'meme' | 'gaming' | 'ai' | 'storage' | 'payments' | 'privacy' | 'nft' | 'stablecoin' | 'other';
  rank?: number; // Approximate market cap rank
}

/**
 * Top 200+ coins supported by CryptoSheets
 * Organized by category for easy filtering
 */
export const CRYPTOSHEET_COINS: CryptoSheetCoin[] = [
  // ============================================
  // Layer 1 Blockchains (Top 50)
  // ============================================
  { id: 'BTC', symbol: 'BTC', name: 'Bitcoin', category: 'layer1', rank: 1 },
  { id: 'ETH', symbol: 'ETH', name: 'Ethereum', category: 'layer1', rank: 2 },
  { id: 'BNB', symbol: 'BNB', name: 'BNB', category: 'layer1', rank: 4 },
  { id: 'SOL', symbol: 'SOL', name: 'Solana', category: 'layer1', rank: 5 },
  { id: 'XRP', symbol: 'XRP', name: 'XRP', category: 'layer1', rank: 6 },
  { id: 'ADA', symbol: 'ADA', name: 'Cardano', category: 'layer1', rank: 7 },
  { id: 'AVAX', symbol: 'AVAX', name: 'Avalanche', category: 'layer1', rank: 9 },
  { id: 'DOT', symbol: 'DOT', name: 'Polkadot', category: 'layer1', rank: 12 },
  { id: 'TRX', symbol: 'TRX', name: 'TRON', category: 'layer1', rank: 10 },
  { id: 'LINK', symbol: 'LINK', name: 'Chainlink', category: 'layer1', rank: 14 },
  { id: 'TON', symbol: 'TON', name: 'Toncoin', category: 'layer1', rank: 8 },
  { id: 'MATIC', symbol: 'MATIC', name: 'Polygon', category: 'layer1', rank: 15 },
  { id: 'NEAR', symbol: 'NEAR', name: 'NEAR Protocol', category: 'layer1', rank: 20 },
  { id: 'ICP', symbol: 'ICP', name: 'Internet Computer', category: 'layer1', rank: 22 },
  { id: 'APT', symbol: 'APT', name: 'Aptos', category: 'layer1', rank: 27 },
  { id: 'SUI', symbol: 'SUI', name: 'Sui', category: 'layer1', rank: 18 },
  { id: 'ATOM', symbol: 'ATOM', name: 'Cosmos', category: 'layer1', rank: 25 },
  { id: 'FIL', symbol: 'FIL', name: 'Filecoin', category: 'layer1', rank: 30 },
  { id: 'HBAR', symbol: 'HBAR', name: 'Hedera', category: 'layer1', rank: 28 },
  { id: 'XLM', symbol: 'XLM', name: 'Stellar', category: 'layer1', rank: 26 },
  { id: 'ETC', symbol: 'ETC', name: 'Ethereum Classic', category: 'layer1', rank: 24 },
  { id: 'VET', symbol: 'VET', name: 'VeChain', category: 'layer1', rank: 40 },
  { id: 'ALGO', symbol: 'ALGO', name: 'Algorand', category: 'layer1', rank: 55 },
  { id: 'EGLD', symbol: 'EGLD', name: 'MultiversX', category: 'layer1', rank: 50 },
  { id: 'FTM', symbol: 'FTM', name: 'Fantom', category: 'layer1', rank: 60 },
  { id: 'FLOW', symbol: 'FLOW', name: 'Flow', category: 'layer1', rank: 70 },
  { id: 'XTZ', symbol: 'XTZ', name: 'Tezos', category: 'layer1', rank: 65 },
  { id: 'THETA', symbol: 'THETA', name: 'Theta Network', category: 'layer1', rank: 75 },
  { id: 'EOS', symbol: 'EOS', name: 'EOS', category: 'layer1', rank: 80 },
  { id: 'KAS', symbol: 'KAS', name: 'Kaspa', category: 'layer1', rank: 35 },
  { id: 'SEI', symbol: 'SEI', name: 'Sei', category: 'layer1', rank: 45 },
  { id: 'INJ', symbol: 'INJ', name: 'Injective', category: 'layer1', rank: 38 },
  { id: 'TIA', symbol: 'TIA', name: 'Celestia', category: 'layer1', rank: 42 },
  { id: 'ROSE', symbol: 'ROSE', name: 'Oasis Network', category: 'layer1', rank: 90 },
  { id: 'KAVA', symbol: 'KAVA', name: 'Kava', category: 'layer1', rank: 95 },
  { id: 'MINA', symbol: 'MINA', name: 'Mina Protocol', category: 'layer1', rank: 100 },
  { id: 'ONE', symbol: 'ONE', name: 'Harmony', category: 'layer1', rank: 120 },
  { id: 'CELO', symbol: 'CELO', name: 'Celo', category: 'layer1', rank: 110 },
  { id: 'ZIL', symbol: 'ZIL', name: 'Zilliqa', category: 'layer1', rank: 130 },
  { id: 'ICX', symbol: 'ICX', name: 'ICON', category: 'layer1', rank: 140 },

  // ============================================
  // Layer 2 & Scaling Solutions
  // ============================================
  { id: 'ARB', symbol: 'ARB', name: 'Arbitrum', category: 'layer2', rank: 32 },
  { id: 'OP', symbol: 'OP', name: 'Optimism', category: 'layer2', rank: 33 },
  { id: 'IMX', symbol: 'IMX', name: 'Immutable', category: 'layer2', rank: 48 },
  { id: 'STRK', symbol: 'STRK', name: 'Starknet', category: 'layer2', rank: 52 },
  { id: 'MANTA', symbol: 'MANTA', name: 'Manta Network', category: 'layer2', rank: 85 },
  { id: 'METIS', symbol: 'METIS', name: 'Metis', category: 'layer2', rank: 115 },
  { id: 'LRC', symbol: 'LRC', name: 'Loopring', category: 'layer2', rank: 125 },
  { id: 'ZKS', symbol: 'ZKS', name: 'ZKSync', category: 'layer2', rank: 88 },
  { id: 'BOBA', symbol: 'BOBA', name: 'Boba Network', category: 'layer2', rank: 200 },
  { id: 'SKL', symbol: 'SKL', name: 'SKALE', category: 'layer2', rank: 150 },

  // ============================================
  // DeFi Protocols
  // ============================================
  { id: 'UNI', symbol: 'UNI', name: 'Uniswap', category: 'defi', rank: 19 },
  { id: 'AAVE', symbol: 'AAVE', name: 'Aave', category: 'defi', rank: 36 },
  { id: 'MKR', symbol: 'MKR', name: 'Maker', category: 'defi', rank: 44 },
  { id: 'CRV', symbol: 'CRV', name: 'Curve DAO', category: 'defi', rank: 85 },
  { id: 'SNX', symbol: 'SNX', name: 'Synthetix', category: 'defi', rank: 90 },
  { id: 'COMP', symbol: 'COMP', name: 'Compound', category: 'defi', rank: 100 },
  { id: 'LDO', symbol: 'LDO', name: 'Lido DAO', category: 'defi', rank: 34 },
  { id: 'SUSHI', symbol: 'SUSHI', name: 'SushiSwap', category: 'defi', rank: 150 },
  { id: 'YFI', symbol: 'YFI', name: 'yearn.finance', category: 'defi', rank: 120 },
  { id: '1INCH', symbol: '1INCH', name: '1inch', category: 'defi', rank: 110 },
  { id: 'BAL', symbol: 'BAL', name: 'Balancer', category: 'defi', rank: 160 },
  { id: 'DYDX', symbol: 'DYDX', name: 'dYdX', category: 'defi', rank: 75 },
  { id: 'GMX', symbol: 'GMX', name: 'GMX', category: 'defi', rank: 82 },
  { id: 'RUNE', symbol: 'RUNE', name: 'THORChain', category: 'defi', rank: 58 },
  { id: 'CAKE', symbol: 'CAKE', name: 'PancakeSwap', category: 'defi', rank: 95 },
  { id: 'JUP', symbol: 'JUP', name: 'Jupiter', category: 'defi', rank: 55 },
  { id: 'PENDLE', symbol: 'PENDLE', name: 'Pendle', category: 'defi', rank: 68 },
  { id: 'RPL', symbol: 'RPL', name: 'Rocket Pool', category: 'defi', rank: 105 },
  { id: 'FXS', symbol: 'FXS', name: 'Frax Share', category: 'defi', rank: 130 },
  { id: 'CVX', symbol: 'CVX', name: 'Convex Finance', category: 'defi', rank: 145 },

  // ============================================
  // Exchange Tokens
  // ============================================
  { id: 'LEO', symbol: 'LEO', name: 'UNUS SED LEO', category: 'exchange', rank: 21 },
  { id: 'OKB', symbol: 'OKB', name: 'OKB', category: 'exchange', rank: 23 },
  { id: 'CRO', symbol: 'CRO', name: 'Cronos', category: 'exchange', rank: 52 },
  { id: 'KCS', symbol: 'KCS', name: 'KuCoin Token', category: 'exchange', rank: 78 },
  { id: 'HT', symbol: 'HT', name: 'Huobi Token', category: 'exchange', rank: 85 },
  { id: 'GT', symbol: 'GT', name: 'Gate Token', category: 'exchange', rank: 92 },
  { id: 'MX', symbol: 'MX', name: 'MX Token', category: 'exchange', rank: 150 },
  { id: 'WBT', symbol: 'WBT', name: 'WhiteBIT Token', category: 'exchange', rank: 160 },

  // ============================================
  // Meme Coins
  // ============================================
  { id: 'DOGE', symbol: 'DOGE', name: 'Dogecoin', category: 'meme', rank: 8 },
  { id: 'SHIB', symbol: 'SHIB', name: 'Shiba Inu', category: 'meme', rank: 13 },
  { id: 'PEPE', symbol: 'PEPE', name: 'Pepe', category: 'meme', rank: 25 },
  { id: 'WIF', symbol: 'WIF', name: 'dogwifhat', category: 'meme', rank: 30 },
  { id: 'BONK', symbol: 'BONK', name: 'Bonk', category: 'meme', rank: 45 },
  { id: 'FLOKI', symbol: 'FLOKI', name: 'FLOKI', category: 'meme', rank: 55 },
  { id: 'MEME', symbol: 'MEME', name: 'Memecoin', category: 'meme', rank: 100 },
  { id: 'BABYDOGE', symbol: 'BABYDOGE', name: 'Baby Doge', category: 'meme', rank: 120 },
  { id: 'ELON', symbol: 'ELON', name: 'Dogelon Mars', category: 'meme', rank: 180 },
  { id: 'TURBO', symbol: 'TURBO', name: 'Turbo', category: 'meme', rank: 130 },
  { id: 'BRETT', symbol: 'BRETT', name: 'Brett', category: 'meme', rank: 65 },
  { id: 'MOG', symbol: 'MOG', name: 'Mog Coin', category: 'meme', rank: 95 },
  { id: 'POPCAT', symbol: 'POPCAT', name: 'Popcat', category: 'meme', rank: 85 },

  // ============================================
  // Gaming & Metaverse
  // ============================================
  { id: 'AXS', symbol: 'AXS', name: 'Axie Infinity', category: 'gaming', rank: 70 },
  { id: 'SAND', symbol: 'SAND', name: 'The Sandbox', category: 'gaming', rank: 72 },
  { id: 'MANA', symbol: 'MANA', name: 'Decentraland', category: 'gaming', rank: 74 },
  { id: 'GALA', symbol: 'GALA', name: 'Gala', category: 'gaming', rank: 60 },
  { id: 'ENJ', symbol: 'ENJ', name: 'Enjin Coin', category: 'gaming', rank: 115 },
  { id: 'ILV', symbol: 'ILV', name: 'Illuvium', category: 'gaming', rank: 125 },
  { id: 'PIXEL', symbol: 'PIXEL', name: 'Pixels', category: 'gaming', rank: 90 },
  { id: 'BEAM', symbol: 'BEAM', name: 'Beam', category: 'gaming', rank: 88 },
  { id: 'PRIME', symbol: 'PRIME', name: 'Echelon Prime', category: 'gaming', rank: 105 },
  { id: 'GODS', symbol: 'GODS', name: 'Gods Unchained', category: 'gaming', rank: 200 },
  { id: 'YGG', symbol: 'YGG', name: 'Yield Guild Games', category: 'gaming', rank: 180 },
  { id: 'MAGIC', symbol: 'MAGIC', name: 'MAGIC', category: 'gaming', rank: 140 },
  { id: 'RON', symbol: 'RON', name: 'Ronin', category: 'gaming', rank: 56 },
  { id: 'SUPER', symbol: 'SUPER', name: 'SuperVerse', category: 'gaming', rank: 145 },

  // ============================================
  // AI & Data
  // ============================================
  { id: 'RENDER', symbol: 'RENDER', name: 'Render', category: 'ai', rank: 31 },
  { id: 'FET', symbol: 'FET', name: 'Fetch.ai', category: 'ai', rank: 29 },
  { id: 'AGIX', symbol: 'AGIX', name: 'SingularityNET', category: 'ai', rank: 62 },
  { id: 'TAO', symbol: 'TAO', name: 'Bittensor', category: 'ai', rank: 37 },
  { id: 'OCEAN', symbol: 'OCEAN', name: 'Ocean Protocol', category: 'ai', rank: 115 },
  { id: 'ARKM', symbol: 'ARKM', name: 'Arkham', category: 'ai', rank: 85 },
  { id: 'WLD', symbol: 'WLD', name: 'Worldcoin', category: 'ai', rank: 48 },
  { id: 'AKT', symbol: 'AKT', name: 'Akash Network', category: 'ai', rank: 68 },
  { id: 'RNDR', symbol: 'RNDR', name: 'Render Token', category: 'ai', rank: 31 },
  { id: 'GRT', symbol: 'GRT', name: 'The Graph', category: 'ai', rank: 46 },
  { id: 'AR', symbol: 'AR', name: 'Arweave', category: 'ai', rank: 54 },
  { id: 'AIOZ', symbol: 'AIOZ', name: 'AIOZ Network', category: 'ai', rank: 95 },
  { id: 'PHB', symbol: 'PHB', name: 'Phoenix', category: 'ai', rank: 160 },
  { id: 'NMR', symbol: 'NMR', name: 'Numeraire', category: 'ai', rank: 200 },

  // ============================================
  // Storage & Infrastructure
  // ============================================
  { id: 'FIL', symbol: 'FIL', name: 'Filecoin', category: 'storage', rank: 30 },
  { id: 'AR', symbol: 'AR', name: 'Arweave', category: 'storage', rank: 54 },
  { id: 'STORJ', symbol: 'STORJ', name: 'Storj', category: 'storage', rank: 140 },
  { id: 'SC', symbol: 'SC', name: 'Siacoin', category: 'storage', rank: 110 },
  { id: 'BTT', symbol: 'BTT', name: 'BitTorrent', category: 'storage', rank: 95 },
  { id: 'HNT', symbol: 'HNT', name: 'Helium', category: 'storage', rank: 85 },
  { id: 'IOTX', symbol: 'IOTX', name: 'IoTeX', category: 'storage', rank: 120 },
  { id: 'ANKR', symbol: 'ANKR', name: 'Ankr', category: 'storage', rank: 130 },

  // ============================================
  // Payments & Transfers
  // ============================================
  { id: 'LTC', symbol: 'LTC', name: 'Litecoin', category: 'payments', rank: 17 },
  { id: 'BCH', symbol: 'BCH', name: 'Bitcoin Cash', category: 'payments', rank: 16 },
  { id: 'XMR', symbol: 'XMR', name: 'Monero', category: 'privacy', rank: 28 },
  { id: 'DASH', symbol: 'DASH', name: 'Dash', category: 'payments', rank: 80 },
  { id: 'ZEC', symbol: 'ZEC', name: 'Zcash', category: 'privacy', rank: 90 },
  { id: 'BSV', symbol: 'BSV', name: 'Bitcoin SV', category: 'payments', rank: 60 },
  { id: 'NANO', symbol: 'NANO', name: 'Nano', category: 'payments', rank: 200 },
  { id: 'DGB', symbol: 'DGB', name: 'DigiByte', category: 'payments', rank: 180 },
  { id: 'DCR', symbol: 'DCR', name: 'Decred', category: 'payments', rank: 150 },
  { id: 'RVN', symbol: 'RVN', name: 'Ravencoin', category: 'payments', rank: 130 },

  // ============================================
  // NFT & Collectibles
  // ============================================
  { id: 'BLUR', symbol: 'BLUR', name: 'Blur', category: 'nft', rank: 75 },
  { id: 'APE', symbol: 'APE', name: 'ApeCoin', category: 'nft', rank: 85 },
  { id: 'LOOKS', symbol: 'LOOKS', name: 'LooksRare', category: 'nft', rank: 200 },
  { id: 'RARI', symbol: 'RARI', name: 'Rarible', category: 'nft', rank: 250 },
  { id: 'X2Y2', symbol: 'X2Y2', name: 'X2Y2', category: 'nft', rank: 300 },

  // ============================================
  // Stablecoins (for pairs/comparison)
  // ============================================
  { id: 'USDT', symbol: 'USDT', name: 'Tether', category: 'stablecoin', rank: 3 },
  { id: 'USDC', symbol: 'USDC', name: 'USD Coin', category: 'stablecoin', rank: 7 },
  { id: 'DAI', symbol: 'DAI', name: 'Dai', category: 'stablecoin', rank: 20 },
  { id: 'GUSD', symbol: 'GUSD', name: 'Gemini Dollar', category: 'stablecoin', rank: 25 },
  { id: 'TUSD', symbol: 'TUSD', name: 'TrueUSD', category: 'stablecoin', rank: 50 },
  { id: 'FRAX', symbol: 'FRAX', name: 'Frax', category: 'stablecoin', rank: 60 },
  { id: 'PYUSD', symbol: 'PYUSD', name: 'PayPal USD', category: 'stablecoin', rank: 70 },
  { id: 'FDUSD', symbol: 'FDUSD', name: 'First Digital USD', category: 'stablecoin', rank: 15 },

  // ============================================
  // Other Notable Projects
  // ============================================
  { id: 'QNT', symbol: 'QNT', name: 'Quant', category: 'other', rank: 40 },
  { id: 'XDC', symbol: 'XDC', name: 'XDC Network', category: 'other', rank: 55 },
  { id: 'ENS', symbol: 'ENS', name: 'Ethereum Name Service', category: 'other', rank: 105 },
  { id: 'CFX', symbol: 'CFX', name: 'Conflux', category: 'other', rank: 85 },
  { id: 'ONDO', symbol: 'ONDO', name: 'Ondo', category: 'other', rank: 65 },
  { id: 'STX', symbol: 'STX', name: 'Stacks', category: 'other', rank: 35 },
  { id: 'PYTH', symbol: 'PYTH', name: 'Pyth Network', category: 'other', rank: 50 },
  { id: 'JTO', symbol: 'JTO', name: 'Jito', category: 'other', rank: 70 },
  { id: 'W', symbol: 'W', name: 'Wormhole', category: 'other', rank: 75 },
  { id: 'ENA', symbol: 'ENA', name: 'Ethena', category: 'other', rank: 52 },
  { id: 'ZRO', symbol: 'ZRO', name: 'LayerZero', category: 'other', rank: 58 },
  { id: 'CORE', symbol: 'CORE', name: 'Core', category: 'other', rank: 62 },
  { id: 'MNT', symbol: 'MNT', name: 'Mantle', category: 'other', rank: 45 },
  { id: 'ORDI', symbol: 'ORDI', name: 'ORDI', category: 'other', rank: 72 },
  { id: 'SATS', symbol: 'SATS', name: '1000SATS', category: 'other', rank: 80 },
  { id: 'JASMY', symbol: 'JASMY', name: 'JasmyCoin', category: 'other', rank: 78 },
  { id: 'NEO', symbol: 'NEO', name: 'NEO', category: 'other', rank: 75 },
  { id: 'WAVES', symbol: 'WAVES', name: 'Waves', category: 'other', rank: 110 },
  { id: 'KDA', symbol: 'KDA', name: 'Kadena', category: 'other', rank: 100 },
  { id: 'QTUM', symbol: 'QTUM', name: 'Qtum', category: 'other', rank: 120 },
  { id: 'ZEN', symbol: 'ZEN', name: 'Horizen', category: 'other', rank: 130 },
  { id: 'LSK', symbol: 'LSK', name: 'Lisk', category: 'other', rank: 140 },
  { id: 'IOTA', symbol: 'IOTA', name: 'IOTA', category: 'other', rank: 90 },
  { id: 'TFUEL', symbol: 'TFUEL', name: 'Theta Fuel', category: 'other', rank: 150 },
  { id: 'GAS', symbol: 'GAS', name: 'Gas', category: 'other', rank: 160 },
  { id: 'GLM', symbol: 'GLM', name: 'Golem', category: 'other', rank: 170 },
  { id: 'CTSI', symbol: 'CTSI', name: 'Cartesi', category: 'other', rank: 175 },
  { id: 'RSR', symbol: 'RSR', name: 'Reserve Rights', category: 'other', rank: 95 },
  { id: 'BAND', symbol: 'BAND', name: 'Band Protocol', category: 'other', rank: 180 },
  { id: 'BAT', symbol: 'BAT', name: 'Basic Attention Token', category: 'other', rank: 120 },
  { id: 'CHZ', symbol: 'CHZ', name: 'Chiliz', category: 'other', rank: 85 },
  { id: 'DENT', symbol: 'DENT', name: 'Dent', category: 'other', rank: 220 },
  { id: 'HOT', symbol: 'HOT', name: 'Holo', category: 'other', rank: 150 },
  { id: 'CELR', symbol: 'CELR', name: 'Celer Network', category: 'other', rank: 190 },
  { id: 'CKB', symbol: 'CKB', name: 'Nervos Network', category: 'other', rank: 95 },
  { id: 'WOO', symbol: 'WOO', name: 'WOO', category: 'other', rank: 100 },
  { id: 'ACH', symbol: 'ACH', name: 'Alchemy Pay', category: 'other', rank: 135 },
  { id: 'API3', symbol: 'API3', name: 'API3', category: 'other', rank: 155 },
  { id: 'COTI', symbol: 'COTI', name: 'COTI', category: 'other', rank: 145 },
];

/**
 * Get all coins
 */
export function getAllCryptoSheetCoins(): CryptoSheetCoin[] {
  return CRYPTOSHEET_COINS;
}

/**
 * Get coins by category
 */
export function getCoinsByCategory(category: CryptoSheetCoin['category']): CryptoSheetCoin[] {
  return CRYPTOSHEET_COINS.filter(coin => coin.category === category);
}

/**
 * Get coins by rank range
 */
export function getCoinsByRankRange(minRank: number, maxRank: number): CryptoSheetCoin[] {
  return CRYPTOSHEET_COINS.filter(coin =>
    coin.rank !== undefined && coin.rank >= minRank && coin.rank <= maxRank
  );
}

/**
 * Get top N coins by rank
 */
export function getTopCoins(n: number): CryptoSheetCoin[] {
  return CRYPTOSHEET_COINS
    .filter(coin => coin.rank !== undefined)
    .sort((a, b) => (a.rank || 999) - (b.rank || 999))
    .slice(0, n);
}

/**
 * Search coins by name or symbol
 */
export function searchCoins(query: string): CryptoSheetCoin[] {
  const lowerQuery = query.toLowerCase();
  return CRYPTOSHEET_COINS.filter(coin =>
    coin.symbol.toLowerCase().includes(lowerQuery) ||
    coin.name.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get coin by symbol
 */
export function getCoinBySymbol(symbol: string): CryptoSheetCoin | undefined {
  return CRYPTOSHEET_COINS.find(coin =>
    coin.symbol.toUpperCase() === symbol.toUpperCase()
  );
}

/**
 * Check if a coin is supported
 */
export function isCoinSupported(symbol: string): boolean {
  return getCoinBySymbol(symbol) !== undefined;
}

/**
 * Get all categories
 */
export function getCategories(): CryptoSheetCoin['category'][] {
  return ['layer1', 'layer2', 'defi', 'exchange', 'meme', 'gaming', 'ai', 'storage', 'payments', 'privacy', 'nft', 'stablecoin', 'other'];
}

/**
 * Get category display names
 */
export const CATEGORY_NAMES: Record<CryptoSheetCoin['category'], string> = {
  layer1: 'Layer 1 Blockchains',
  layer2: 'Layer 2 & Scaling',
  defi: 'DeFi Protocols',
  exchange: 'Exchange Tokens',
  meme: 'Meme Coins',
  gaming: 'Gaming & Metaverse',
  ai: 'AI & Data',
  storage: 'Storage & Infrastructure',
  payments: 'Payments',
  privacy: 'Privacy Coins',
  nft: 'NFT & Collectibles',
  stablecoin: 'Stablecoins',
  other: 'Other',
};
