/**
 * Dynamic Coin Discovery
 *
 * Fetches all available coins from Binance and maps them to CoinGecko data.
 * This allows supporting ALL Binance USDT pairs (600+) instead of a hardcoded list.
 */

const BINANCE_BASE = 'https://api.binance.com/api/v3';
const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Cache for discovered coins
let discoveredCoins: DiscoveredCoin[] | null = null;
let coinMap: Map<string, DiscoveredCoin> | null = null;
let lastDiscoveryTime = 0;
const DISCOVERY_CACHE_TTL = 60 * 60 * 1000; // 1 hour

export interface DiscoveredCoin {
  symbol: string;           // BTC, ETH, etc.
  binanceSymbol: string;    // BTCUSDT
  name: string;             // Bitcoin
  geckoId: string | null;   // bitcoin (CoinGecko ID for lookups)
  image: string;            // CoinGecko image URL or fallback
  category: string;         // layer1, defi, meme, etc. (basic categorization)
}

interface BinanceSymbol {
  symbol: string;
  baseAsset: string;
  quoteAsset: string;
  status: string;
}

interface GeckoCoin {
  id: string;
  symbol: string;
  name: string;
}

// Known coin categories (for basic categorization)
const COIN_CATEGORIES: Record<string, string> = {
  // Layer 1
  BTC: 'layer1', ETH: 'layer1', SOL: 'layer1', ADA: 'layer1', AVAX: 'layer1',
  DOT: 'layer1', NEAR: 'layer1', ATOM: 'layer1', ICP: 'layer1', APT: 'layer1',
  SUI: 'layer1', ETC: 'layer1', FTM: 'layer1', ALGO: 'layer1', XTZ: 'layer1',
  EGLD: 'layer1', FLOW: 'layer1', EOS: 'layer1', TRX: 'layer1', XLM: 'layer1',
  HBAR: 'layer1', VET: 'layer1', KAVA: 'layer1',

  // Layer 2
  MATIC: 'layer2', ARB: 'layer2', OP: 'layer2', LRC: 'layer2', IMX: 'layer2',
  STRK: 'layer2', METIS: 'layer2', MANTA: 'layer2',

  // DeFi
  UNI: 'defi', LINK: 'defi', AAVE: 'defi', MKR: 'defi', CRV: 'defi',
  SNX: 'defi', COMP: 'defi', LDO: 'defi', INJ: 'defi', GRT: 'defi',
  YFI: 'defi', SUSHI: 'defi', BAL: 'defi', DYDX: 'defi', GMX: 'defi',
  PENDLE: 'defi', JUP: 'defi', RAY: 'defi',

  // Gaming/Metaverse
  SAND: 'gaming', MANA: 'gaming', AXS: 'gaming', APE: 'gaming', ENJ: 'gaming',
  CHZ: 'gaming', RNDR: 'gaming', GALA: 'gaming', ILV: 'gaming', SUPER: 'gaming',

  // Meme
  DOGE: 'meme', SHIB: 'meme', PEPE: 'meme', FLOKI: 'meme', BONK: 'meme',
  WIF: 'meme', MEME: 'meme', TURBO: 'meme',

  // AI
  FET: 'ai', OCEAN: 'ai', AGIX: 'ai', TAO: 'ai', ARKM: 'ai', WLD: 'ai',

  // Exchange tokens
  BNB: 'exchange', CRO: 'exchange', OKB: 'exchange', LEO: 'exchange',

  // Stablecoins
  USDT: 'stablecoin', USDC: 'stablecoin', DAI: 'stablecoin', TUSD: 'stablecoin',
  FDUSD: 'stablecoin', BUSD: 'stablecoin',

  // Privacy
  XMR: 'privacy', ZEC: 'privacy', DASH: 'privacy',

  // Storage
  FIL: 'storage', AR: 'storage', STORJ: 'storage',

  // Infrastructure
  QNT: 'infrastructure', THETA: 'infrastructure', STX: 'infrastructure',
};

/**
 * Fetch all USDT trading pairs from Binance
 */
async function fetchBinanceSymbols(): Promise<BinanceSymbol[]> {
  try {
    const response = await fetch(`${BINANCE_BASE}/exchangeInfo`, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });

    if (!response.ok) {
      console.error('Binance exchangeInfo failed:', response.status);
      return [];
    }

    const data = await response.json();

    // Filter for USDT pairs that are actively trading
    return (data.symbols || []).filter((s: BinanceSymbol) =>
      s.quoteAsset === 'USDT' &&
      s.status === 'TRADING' &&
      !s.baseAsset.endsWith('UP') && // Exclude leveraged tokens
      !s.baseAsset.endsWith('DOWN') &&
      !s.baseAsset.endsWith('BEAR') &&
      !s.baseAsset.endsWith('BULL')
    );
  } catch (error) {
    console.error('Error fetching Binance symbols:', error);
    return [];
  }
}

/**
 * Fetch coin list from CoinGecko (free API - just IDs and names)
 */
async function fetchGeckoList(): Promise<GeckoCoin[]> {
  try {
    const response = await fetch(`${COINGECKO_BASE}/coins/list`, {
      next: { revalidate: 86400 } // Cache for 24 hours (this list rarely changes)
    });

    if (!response.ok) {
      console.error('CoinGecko coins/list failed:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching CoinGecko list:', error);
    return [];
  }
}

/**
 * Known symbol to CoinGecko ID mappings for major coins
 * This ensures we get the correct main coin, not a bridged/wrapped version
 */
const KNOWN_GECKO_IDS: Record<string, string> = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum',
  'USDT': 'tether',
  'USDC': 'usd-coin',
  'BNB': 'binancecoin',
  'XRP': 'ripple',
  'SOL': 'solana',
  'ADA': 'cardano',
  'DOGE': 'dogecoin',
  'TRX': 'tron',
  'AVAX': 'avalanche-2',
  'LINK': 'chainlink',
  'DOT': 'polkadot',
  'MATIC': 'matic-network',
  'SHIB': 'shiba-inu',
  'TON': 'the-open-network',
  'UNI': 'uniswap',
  'ATOM': 'cosmos',
  'LTC': 'litecoin',
  'BCH': 'bitcoin-cash',
  'NEAR': 'near',
  'XLM': 'stellar',
  'APT': 'aptos',
  'PEPE': 'pepe',
  'ARB': 'arbitrum',
  'OP': 'optimism',
  'ICP': 'internet-computer',
  'FIL': 'filecoin',
  'ETC': 'ethereum-classic',
  'HBAR': 'hedera-hashgraph',
  'VET': 'vechain',
  'MKR': 'maker',
  'AAVE': 'aave',
  'GRT': 'the-graph',
  'INJ': 'injective-protocol',
  'FTM': 'fantom',
  'ALGO': 'algorand',
  'EGLD': 'elrond-erd-2',
  'SAND': 'the-sandbox',
  'MANA': 'decentraland',
  'AXS': 'axie-infinity',
  'APE': 'apecoin',
  'XTZ': 'tezos',
  'EOS': 'eos',
  'FLOW': 'flow',
  'CHZ': 'chiliz',
  'CRV': 'curve-dao-token',
  'SNX': 'havven',
  'LDO': 'lido-dao',
  'RNDR': 'render-token',
  'ENJ': 'enjincoin',
  'FET': 'fetch-ai',
  'GALA': 'gala',
  'LRC': 'loopring',
  'COMP': 'compound-governance-token',
  'YFI': 'yearn-finance',
  'BAL': 'balancer',
  'SUSHI': 'sushi',
  'ZEC': 'zcash',
  'XMR': 'monero',
  'DASH': 'dash',
  'NEO': 'neo',
  'WAVES': 'waves',
  'QTUM': 'qtum',
  'ZIL': 'zilliqa',
  'ONT': 'ontology',
  'ICX': 'icon',
  'LUNA': 'terra-luna-2',
  'LUNC': 'terra-luna',
  'KAVA': 'kava',
  'AR': 'arweave',
  'THETA': 'theta-token',
  'STORJ': 'storj',
  'QNT': 'quant-network',
  'STX': 'blockstack',
  'SUI': 'sui',
  'IMX': 'immutable-x',
  'FLOKI': 'floki',
  'BONK': 'bonk',
  'WIF': 'dogwifcoin',
  'TAO': 'bittensor',
  'WLD': 'worldcoin-wld',
  'ARKM': 'arkham',
  'OCEAN': 'ocean-protocol',
  'AGIX': 'singularitynet',
  'CRO': 'crypto-com-chain',
  'OKB': 'okb',
  'LEO': 'leo-token',
  'DAI': 'dai',
  'GMX': 'gmx',
  'DYDX': 'dydx',
  'JUP': 'jupiter-exchange-solana',
  'RAY': 'raydium',
  'PENDLE': 'pendle',
  'SUPER': 'superfarm',
  'ILV': 'illuvium',
  'MEME': 'memecoin',
  'TURBO': 'turbo',
  'STRK': 'starknet',
  'METIS': 'metis-token',
  'MANTA': 'manta-network',
  'FDUSD': 'first-digital-usd',
  'TUSD': 'true-usd',
  'BUSD': 'binance-usd',
};

/**
 * Map Binance symbol to CoinGecko coin
 */
function findGeckoCoin(symbol: string, geckoCoins: GeckoCoin[]): GeckoCoin | null {
  const upperSymbol = symbol.toUpperCase();

  // First check our known mappings (most reliable)
  if (KNOWN_GECKO_IDS[upperSymbol]) {
    const known = geckoCoins.find(c => c.id === KNOWN_GECKO_IDS[upperSymbol]);
    if (known) return known;
  }

  const lowerSymbol = symbol.toLowerCase();

  // Try to find by matching symbol AND checking it's a main coin (not bridged)
  // Bridged coins usually have names like "Bridged X (Network)" or "Wrapped X"
  const candidates = geckoCoins.filter(c => c.symbol.toLowerCase() === lowerSymbol);

  if (candidates.length === 1) {
    return candidates[0];
  }

  if (candidates.length > 1) {
    // Prefer coins whose name doesn't contain "Bridged", "Wrapped", or network names
    const mainCoin = candidates.find(c =>
      !c.name.toLowerCase().includes('bridged') &&
      !c.name.toLowerCase().includes('wrapped') &&
      !c.name.includes('(') // Usually bridged coins have "(Network)" suffix
    );
    if (mainCoin) return mainCoin;

    // Otherwise return the first one with shortest name (usually the main coin)
    return candidates.sort((a, b) => a.name.length - b.name.length)[0];
  }

  return null;
}

/**
 * Discover all available coins from Binance and map to CoinGecko
 */
export async function discoverCoins(): Promise<DiscoveredCoin[]> {
  // Return cached data if still valid
  if (discoveredCoins && Date.now() - lastDiscoveryTime < DISCOVERY_CACHE_TTL) {
    return discoveredCoins;
  }

  console.log('[CoinDiscovery] Fetching all available coins...');

  const [binanceSymbols, geckoCoins] = await Promise.all([
    fetchBinanceSymbols(),
    fetchGeckoList()
  ]);

  console.log(`[CoinDiscovery] Found ${binanceSymbols.length} Binance USDT pairs, ${geckoCoins.length} CoinGecko coins`);

  const coins: DiscoveredCoin[] = [];

  for (const bs of binanceSymbols) {
    const geckoCoin = findGeckoCoin(bs.baseAsset, geckoCoins);

    coins.push({
      symbol: bs.baseAsset,
      binanceSymbol: bs.symbol,
      name: geckoCoin?.name || bs.baseAsset,
      geckoId: geckoCoin?.id || null,
      image: geckoCoin?.id
        ? `https://assets.coingecko.com/coins/images/1/large/${geckoCoin.id}.png`
        : '/globe.svg',
      category: COIN_CATEGORIES[bs.baseAsset] || 'other',
    });
  }

  // Sort by common importance (BTC, ETH first, then alphabetically)
  const priorityOrder = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'AVAX', 'DOT', 'LINK'];
  coins.sort((a, b) => {
    const aIdx = priorityOrder.indexOf(a.symbol);
    const bIdx = priorityOrder.indexOf(b.symbol);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    return a.symbol.localeCompare(b.symbol);
  });

  // Cache the results
  discoveredCoins = coins;
  coinMap = new Map(coins.map(c => [c.symbol.toUpperCase(), c]));
  lastDiscoveryTime = Date.now();

  console.log(`[CoinDiscovery] Discovered ${coins.length} tradeable coins`);

  return coins;
}

/**
 * Get a specific coin by symbol
 */
export async function getDiscoveredCoin(symbol: string): Promise<DiscoveredCoin | null> {
  if (!coinMap) {
    await discoverCoins();
  }
  return coinMap?.get(symbol.toUpperCase()) || null;
}

/**
 * Check if a coin is supported
 */
export async function isCoinSupported(symbol: string): Promise<boolean> {
  const coin = await getDiscoveredCoin(symbol);
  return coin !== null;
}

/**
 * Get all discovered coins (for dropdowns, etc.)
 */
export async function getAllDiscoveredCoins(): Promise<DiscoveredCoin[]> {
  return await discoverCoins();
}

/**
 * Get coins by category
 */
export async function getCoinsByCategory(category: string): Promise<DiscoveredCoin[]> {
  const coins = await discoverCoins();
  if (category === 'all') return coins;
  return coins.filter(c => c.category === category);
}

/**
 * Get Binance symbol for a coin
 */
export async function getBinanceSymbol(symbol: string): Promise<string | null> {
  const coin = await getDiscoveredCoin(symbol);
  return coin?.binanceSymbol || null;
}

/**
 * Get CoinGecko ID for a coin
 */
export async function getGeckoId(symbol: string): Promise<string | null> {
  const coin = await getDiscoveredCoin(symbol);
  return coin?.geckoId || null;
}
