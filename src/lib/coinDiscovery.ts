/**
 * Dynamic Coin Discovery - CoinGecko Primary
 *
 * Fetches all available coins from CoinGecko's markets endpoint.
 * This provides comprehensive market data including prices, market cap, and volume.
 */

const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

// Static fallback data for when CoinGecko API is unavailable
// Prices are approximate and serve as placeholders until live data loads
const STATIC_FALLBACK_COINS: DiscoveredCoin[] = [
  { symbol: 'BTC', geckoId: 'bitcoin', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', category: 'layer1', currentPrice: 95000, marketCap: 1900000000000, marketCapRank: 1, priceChangePercent24h: 0, volume24h: 50000000000, circulatingSupply: 19800000, totalSupply: 21000000, maxSupply: 21000000, ath: 108000, athDate: '2024-12-17', atl: 67.81, atlDate: '2013-07-06' },
  { symbol: 'ETH', geckoId: 'ethereum', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', category: 'layer1', currentPrice: 3400, marketCap: 400000000000, marketCapRank: 2, priceChangePercent24h: 0, volume24h: 20000000000, circulatingSupply: 120000000, totalSupply: null, maxSupply: null, ath: 4878, athDate: '2021-11-10', atl: 0.43, atlDate: '2015-10-20' },
  { symbol: 'BNB', geckoId: 'binancecoin', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', category: 'exchange', currentPrice: 600, marketCap: 90000000000, marketCapRank: 4, priceChangePercent24h: 0, volume24h: 2000000000, circulatingSupply: 150000000, totalSupply: 150000000, maxSupply: 200000000, ath: 788, athDate: '2024-12-04', atl: 0.03, atlDate: '2017-10-19' },
  { symbol: 'SOL', geckoId: 'solana', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', category: 'layer1', currentPrice: 200, marketCap: 100000000000, marketCapRank: 5, priceChangePercent24h: 0, volume24h: 5000000000, circulatingSupply: 500000000, totalSupply: null, maxSupply: null, ath: 263, athDate: '2024-11-23', atl: 0.50, atlDate: '2020-05-11' },
  { symbol: 'XRP', geckoId: 'ripple', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', category: 'layer1', currentPrice: 2.5, marketCap: 140000000000, marketCapRank: 3, priceChangePercent24h: 0, volume24h: 10000000000, circulatingSupply: 55000000000, totalSupply: 100000000000, maxSupply: 100000000000, ath: 3.40, athDate: '2018-01-07', atl: 0.002, atlDate: '2014-05-22' },
  { symbol: 'ADA', geckoId: 'cardano', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', category: 'layer1', currentPrice: 1.0, marketCap: 35000000000, marketCapRank: 9, priceChangePercent24h: 0, volume24h: 1500000000, circulatingSupply: 35000000000, totalSupply: 45000000000, maxSupply: 45000000000, ath: 3.10, athDate: '2021-09-02', atl: 0.01, atlDate: '2020-03-13' },
  { symbol: 'DOGE', geckoId: 'dogecoin', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', category: 'meme', currentPrice: 0.35, marketCap: 50000000000, marketCapRank: 7, priceChangePercent24h: 0, volume24h: 3000000000, circulatingSupply: 140000000000, totalSupply: null, maxSupply: null, ath: 0.73, athDate: '2021-05-08', atl: 0.00008, atlDate: '2015-05-06' },
  { symbol: 'DOT', geckoId: 'polkadot', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', category: 'layer1', currentPrice: 7.5, marketCap: 11000000000, marketCapRank: 12, priceChangePercent24h: 0, volume24h: 500000000, circulatingSupply: 1500000000, totalSupply: null, maxSupply: null, ath: 55, athDate: '2021-11-04', atl: 2.69, atlDate: '2020-08-20' },
  { symbol: 'AVAX', geckoId: 'avalanche-2', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', category: 'layer1', currentPrice: 40, marketCap: 16000000000, marketCapRank: 11, priceChangePercent24h: 0, volume24h: 800000000, circulatingSupply: 400000000, totalSupply: 715000000, maxSupply: 720000000, ath: 146, athDate: '2021-11-21', atl: 2.79, atlDate: '2020-12-31' },
  { symbol: 'LINK', geckoId: 'chainlink', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', category: 'defi', currentPrice: 22, marketCap: 14000000000, marketCapRank: 13, priceChangePercent24h: 0, volume24h: 1000000000, circulatingSupply: 630000000, totalSupply: 1000000000, maxSupply: 1000000000, ath: 52, athDate: '2021-05-10', atl: 0.15, atlDate: '2017-09-23' },
];

// Cache for discovered coins
let discoveredCoins: DiscoveredCoin[] | null = null;
let coinMap: Map<string, DiscoveredCoin> | null = null;
let lastDiscoveryTime = 0;
const DISCOVERY_CACHE_TTL = 10 * 60 * 1000; // 10 minutes (CoinGecko rate limit friendly)

export interface DiscoveredCoin {
  symbol: string;           // BTC, ETH, etc.
  geckoId: string;          // bitcoin (CoinGecko ID for lookups)
  name: string;             // Bitcoin
  image: string;            // CoinGecko image URL
  category: string;         // layer1, defi, meme, etc.
  currentPrice: number;     // Current USD price
  marketCap: number;        // Market cap in USD
  marketCapRank: number | null;
  priceChangePercent24h: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number | null;
  maxSupply: number | null;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
}

interface GeckoMarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number | null;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
}

// Known coin categories (for basic categorization)
const COIN_CATEGORIES: Record<string, string> = {
  // Layer 1
  btc: 'layer1', eth: 'layer1', sol: 'layer1', ada: 'layer1', avax: 'layer1',
  dot: 'layer1', near: 'layer1', atom: 'layer1', icp: 'layer1', apt: 'layer1',
  sui: 'layer1', etc: 'layer1', ftm: 'layer1', algo: 'layer1', xtz: 'layer1',
  egld: 'layer1', flow: 'layer1', eos: 'layer1', trx: 'layer1', xlm: 'layer1',
  hbar: 'layer1', vet: 'layer1', kava: 'layer1', ton: 'layer1', xrp: 'layer1',

  // Layer 2
  matic: 'layer2', arb: 'layer2', op: 'layer2', lrc: 'layer2', imx: 'layer2',
  strk: 'layer2', metis: 'layer2', manta: 'layer2', pol: 'layer2',

  // DeFi
  uni: 'defi', link: 'defi', aave: 'defi', mkr: 'defi', crv: 'defi',
  snx: 'defi', comp: 'defi', ldo: 'defi', inj: 'defi', grt: 'defi',
  yfi: 'defi', sushi: 'defi', bal: 'defi', dydx: 'defi', gmx: 'defi',
  pendle: 'defi', jup: 'defi', ray: 'defi', rune: 'defi',

  // Gaming/Metaverse
  sand: 'gaming', mana: 'gaming', axs: 'gaming', ape: 'gaming', enj: 'gaming',
  chz: 'gaming', rndr: 'gaming', gala: 'gaming', ilv: 'gaming', super: 'gaming',

  // Meme
  doge: 'meme', shib: 'meme', pepe: 'meme', floki: 'meme', bonk: 'meme',
  wif: 'meme', meme: 'meme', turbo: 'meme',

  // AI
  fet: 'ai', ocean: 'ai', agix: 'ai', tao: 'ai', arkm: 'ai', wld: 'ai',

  // Exchange tokens
  bnb: 'exchange', cro: 'exchange', okb: 'exchange', leo: 'exchange',

  // Stablecoins (usually excluded from tracking)
  usdt: 'stablecoin', usdc: 'stablecoin', dai: 'stablecoin', tusd: 'stablecoin',
  fdusd: 'stablecoin', busd: 'stablecoin',

  // Privacy
  xmr: 'privacy', zec: 'privacy', dash: 'privacy',

  // Storage
  fil: 'storage', ar: 'storage', storj: 'storage',

  // Infrastructure
  qnt: 'infrastructure', theta: 'infrastructure', stx: 'infrastructure',
};

/**
 * Fetch coins from CoinGecko markets endpoint
 * This is the primary data source for all coin information
 */
async function fetchGeckoMarkets(page: number = 1, perPage: number = 250): Promise<GeckoMarketCoin[]> {
  try {
    const url = `${COINGECKO_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=24h`;

    const response = await fetch(url, {
      headers: { 'Accept': 'application/json' },
      next: { revalidate: 300 } // Cache for 5 minutes
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.warn('[CoinDiscovery] CoinGecko rate limit hit, using cached data');
        return [];
      }
      console.error('[CoinDiscovery] CoinGecko markets failed:', response.status);
      return [];
    }

    return await response.json();
  } catch (error) {
    console.error('[CoinDiscovery] Error fetching CoinGecko markets:', error);
    return [];
  }
}

/**
 * Map CoinGecko market data to our DiscoveredCoin format
 */
function mapGeckoCoin(coin: GeckoMarketCoin): DiscoveredCoin {
  return {
    symbol: coin.symbol.toUpperCase(),
    geckoId: coin.id,
    name: coin.name,
    image: coin.image || '/globe.svg',
    category: COIN_CATEGORIES[coin.symbol.toLowerCase()] || 'other',
    currentPrice: coin.current_price || 0,
    marketCap: coin.market_cap || 0,
    marketCapRank: coin.market_cap_rank,
    priceChangePercent24h: coin.price_change_percentage_24h || 0,
    volume24h: coin.total_volume || 0,
    circulatingSupply: coin.circulating_supply || 0,
    totalSupply: coin.total_supply,
    maxSupply: coin.max_supply,
    ath: coin.ath || 0,
    athDate: coin.ath_date || '',
    atl: coin.atl || 0,
    atlDate: coin.atl_date || '',
  };
}

/**
 * Discover all available coins from CoinGecko
 * Fetches top coins by market cap (up to 500)
 */
export async function discoverCoins(): Promise<DiscoveredCoin[]> {
  // Return cached data if still valid
  if (discoveredCoins && Date.now() - lastDiscoveryTime < DISCOVERY_CACHE_TTL) {
    return discoveredCoins;
  }

  console.log('[CoinDiscovery] Fetching coins from CoinGecko...');

  // Fetch first two pages (500 coins total) to cover major coins
  const [page1, page2] = await Promise.all([
    fetchGeckoMarkets(1, 250),
    fetchGeckoMarkets(2, 250)
  ]);

  const allCoins = [...page1, ...page2];

  if (allCoins.length === 0) {
    if (discoveredCoins) {
      console.warn('[CoinDiscovery] No new data, returning cached coins');
      return discoveredCoins;
    }
    // Return static fallback data for essential coins when API fails
    console.warn('[CoinDiscovery] API failed, using static fallback');
    return STATIC_FALLBACK_COINS;
  }

  console.log(`[CoinDiscovery] Found ${allCoins.length} coins from CoinGecko`);

  // Filter out stablecoins from the main list (but keep them discoverable)
  const coins = allCoins
    .map(mapGeckoCoin)
    .filter(c => c.marketCap > 0); // Only include coins with market cap

  // Cache the results
  discoveredCoins = coins;
  coinMap = new Map(coins.map(c => [c.symbol.toUpperCase(), c]));
  lastDiscoveryTime = Date.now();

  console.log(`[CoinDiscovery] Processed ${coins.length} tradeable coins`);

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
 * Get a specific coin by CoinGecko ID
 */
export async function getDiscoveredCoinById(geckoId: string): Promise<DiscoveredCoin | null> {
  const coins = await discoverCoins();
  return coins.find(c => c.geckoId === geckoId) || null;
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
 * Get CoinGecko ID for a coin symbol
 */
export async function getGeckoId(symbol: string): Promise<string | null> {
  const coin = await getDiscoveredCoin(symbol);
  return coin?.geckoId || null;
}

/**
 * Search coins by name or symbol
 */
export async function searchCoins(query: string): Promise<DiscoveredCoin[]> {
  const coins = await discoverCoins();
  const lowerQuery = query.toLowerCase();

  return coins.filter(c =>
    c.symbol.toLowerCase().includes(lowerQuery) ||
    c.name.toLowerCase().includes(lowerQuery) ||
    c.geckoId.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Get top coins by market cap
 */
export async function getTopCoins(limit: number = 100): Promise<DiscoveredCoin[]> {
  const coins = await discoverCoins();
  return coins.slice(0, limit);
}

/**
 * Get top gainers (highest 24h change)
 */
export async function getTopGainers(limit: number = 20): Promise<DiscoveredCoin[]> {
  const coins = await discoverCoins();
  return [...coins]
    .filter(c => c.priceChangePercent24h > 0)
    .sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h)
    .slice(0, limit);
}

/**
 * Get top losers (lowest 24h change)
 */
export async function getTopLosers(limit: number = 20): Promise<DiscoveredCoin[]> {
  const coins = await discoverCoins();
  return [...coins]
    .filter(c => c.priceChangePercent24h < 0)
    .sort((a, b) => a.priceChangePercent24h - b.priceChangePercent24h)
    .slice(0, limit);
}

/**
 * Refresh coin data (force refetch)
 */
export async function refreshCoinData(): Promise<DiscoveredCoin[]> {
  lastDiscoveryTime = 0; // Invalidate cache
  return discoverCoins();
}
