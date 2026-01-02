// ============================================
// NFT MARKET DATA - CoinGecko API
// Collections, floor prices, volume, stats
// ============================================

// Cache for NFT data (5 minute TTL)
let nftCache: { data: NFTMarketStats | null; timestamp: number } = { data: null, timestamp: 0 };
let collectionsCache: { data: NFTCollection[] | null; timestamp: number } = { data: null, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// ============================================
// TYPES
// ============================================

export interface NFTCollection {
  name: string;
  slug: string;
  chain: string;
  floorPrice: number;
  floorPriceUsd: number;
  volume24h: number;
  volumeChange24h: number;
  sales24h: number;
  owners: number;
  totalSupply: number;
  listedCount: number;
  listedPercent: number;
  averagePrice: number;
  marketCap: number;
  imageUrl?: string;
  dataSource?: 'live' | 'fallback';
}

export interface NFTMarketStats {
  totalMarketCap: number;
  totalVolume24h: number;
  volumeChange24h: number;
  totalSales24h: number;
  averagePrice: number;
  topCollections: NFTCollection[];
  chainBreakdown: { chain: string; volume: number; percentage: number }[];
  timestamp: string;
  dataSource: 'live' | 'fallback';
}

export interface NFTCollectionDownload {
  name: string;
  chain: string;
  floorPrice: number;
  floorPriceUsd: number;
  volume24h: number;
  volumeChange24h: number;
  sales24h: number;
  owners: number;
  totalSupply: number;
  listedPercent: number;
  marketCap: number;
}

// CoinGecko API response types
interface CoinGeckoNFTList {
  id: string;
  contract_address: string;
  name: string;
  asset_platform_id: string;
  symbol: string;
}

interface CoinGeckoNFTDetails {
  id: string;
  contract_address: string;
  name: string;
  asset_platform_id: string;
  symbol: string;
  image?: { small?: string };
  floor_price?: { native_currency?: number; usd?: number };
  market_cap?: { native_currency?: number; usd?: number };
  volume_24h?: { native_currency?: number; usd?: number };
  floor_price_in_usd_24h_percentage_change?: number;
  number_of_unique_addresses?: number;
  total_supply?: number;
}

// Chain mapping for CoinGecko asset_platform_id
const CHAIN_MAP: Record<string, string> = {
  'ethereum': 'Ethereum',
  'polygon-pos': 'Polygon',
  'solana': 'Solana',
  'arbitrum-one': 'Arbitrum',
  'optimistic-ethereum': 'Optimism',
  'base': 'Base',
  'avalanche': 'Avalanche',
  'binance-smart-chain': 'BNB Chain',
};

// ============================================
// FALLBACK DATA (used when API fails)
// ============================================

const FALLBACK_COLLECTIONS: NFTCollection[] = [
  {
    name: 'CryptoPunks',
    slug: 'cryptopunks',
    chain: 'Ethereum',
    floorPrice: 48.5,
    floorPriceUsd: 145000,
    volume24h: 850000,
    volumeChange24h: -5.2,
    sales24h: 8,
    owners: 3890,
    totalSupply: 10000,
    listedCount: 850,
    listedPercent: 8.5,
    averagePrice: 52.3,
    marketCap: 1450000000,
    dataSource: 'fallback',
  },
  {
    name: 'Bored Ape Yacht Club',
    slug: 'boredapeyachtclub',
    chain: 'Ethereum',
    floorPrice: 15.2,
    floorPriceUsd: 45600,
    volume24h: 1200000,
    volumeChange24h: 12.5,
    sales24h: 28,
    owners: 5621,
    totalSupply: 10000,
    listedCount: 680,
    listedPercent: 6.8,
    averagePrice: 18.5,
    marketCap: 456000000,
    dataSource: 'fallback',
  },
  {
    name: 'Pudgy Penguins',
    slug: 'pudgy-penguins',
    chain: 'Ethereum',
    floorPrice: 12.5,
    floorPriceUsd: 37500,
    volume24h: 890000,
    volumeChange24h: 25.6,
    sales24h: 45,
    owners: 4521,
    totalSupply: 8888,
    listedCount: 380,
    listedPercent: 4.3,
    averagePrice: 14.2,
    marketCap: 333300000,
    dataSource: 'fallback',
  },
  {
    name: 'Azuki',
    slug: 'azuki',
    chain: 'Ethereum',
    floorPrice: 5.8,
    floorPriceUsd: 17400,
    volume24h: 420000,
    volumeChange24h: -2.1,
    sales24h: 25,
    owners: 4892,
    totalSupply: 10000,
    listedCount: 520,
    listedPercent: 5.2,
    averagePrice: 6.2,
    marketCap: 174000000,
    dataSource: 'fallback',
  },
  {
    name: 'Mutant Ape Yacht Club',
    slug: 'mutant-ape-yacht-club',
    chain: 'Ethereum',
    floorPrice: 3.2,
    floorPriceUsd: 9600,
    volume24h: 580000,
    volumeChange24h: 8.3,
    sales24h: 65,
    owners: 12850,
    totalSupply: 20000,
    listedCount: 1200,
    listedPercent: 6.0,
    averagePrice: 3.8,
    marketCap: 192000000,
    dataSource: 'fallback',
  },
];

// Top NFT collection IDs on CoinGecko
const TOP_NFT_IDS = [
  'cryptopunks',
  'bored-ape-yacht-club',
  'pudgy-penguins',
  'azuki',
  'mutant-ape-yacht-club',
  'degods',
  'milady-maker',
  'doodles-official',
  'cool-cats-nft',
  'world-of-women-nft',
];

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch NFT collection details from CoinGecko
 */
async function fetchNFTFromCoinGecko(nftId: string): Promise<NFTCollection | null> {
  try {
    const response = await fetch(
      `https://api.coingecko.com/api/v3/nfts/${nftId}`,
      {
        headers: { 'Accept': 'application/json' },
        next: { revalidate: 300 }, // Cache for 5 minutes
      }
    );

    if (!response.ok) {
      console.log(`CoinGecko NFT API error for ${nftId}: ${response.status}`);
      return null;
    }

    const data: CoinGeckoNFTDetails = await response.json();

    const chain = CHAIN_MAP[data.asset_platform_id] || data.asset_platform_id || 'Unknown';
    const floorPriceUsd = data.floor_price?.usd || 0;
    const volume24h = data.volume_24h?.usd || 0;
    const marketCap = data.market_cap?.usd || 0;
    const totalSupply = data.total_supply || 0;
    const owners = data.number_of_unique_addresses || 0;

    return {
      name: data.name,
      slug: data.id,
      chain,
      floorPrice: data.floor_price?.native_currency || 0,
      floorPriceUsd,
      volume24h,
      volumeChange24h: data.floor_price_in_usd_24h_percentage_change || 0,
      sales24h: volume24h > 0 && floorPriceUsd > 0 ? Math.round(volume24h / floorPriceUsd) : 0,
      owners,
      totalSupply,
      listedCount: Math.round(totalSupply * 0.05), // Estimate 5% listed
      listedPercent: 5,
      averagePrice: floorPriceUsd * 1.1, // Estimate average slightly above floor
      marketCap,
      imageUrl: data.image?.small,
      dataSource: 'live',
    };
  } catch (error) {
    console.error(`Failed to fetch NFT ${nftId} from CoinGecko:`, error);
    return null;
  }
}

/**
 * Fetch top NFT collections from CoinGecko
 */
export async function fetchTopNFTCollections(
  limit: number = 20,
  chain?: string
): Promise<NFTCollection[]> {
  // Check cache first
  const now = Date.now();
  if (collectionsCache.data && (now - collectionsCache.timestamp) < CACHE_TTL) {
    let collections = collectionsCache.data;
    if (chain && chain !== 'all') {
      collections = collections.filter(c => c.chain.toLowerCase() === chain.toLowerCase());
    }
    return collections.slice(0, limit);
  }

  try {
    // Fetch details for top NFT collections (with delay to respect rate limits)
    const collections: NFTCollection[] = [];

    for (const nftId of TOP_NFT_IDS.slice(0, Math.min(limit, 10))) {
      const collection = await fetchNFTFromCoinGecko(nftId);
      if (collection) {
        collections.push(collection);
      }
      // Small delay to respect CoinGecko rate limits (10-50 req/min on free tier)
      await new Promise(resolve => setTimeout(resolve, 150));
    }

    if (collections.length > 0) {
      // Update cache
      collectionsCache = { data: collections, timestamp: now };

      // Filter by chain if specified
      let result = collections;
      if (chain && chain !== 'all') {
        result = result.filter(c => c.chain.toLowerCase() === chain.toLowerCase());
      }

      // Sort by volume
      return result
        .sort((a, b) => b.volume24h - a.volume24h)
        .slice(0, limit);
    }
  } catch (error) {
    console.error('Failed to fetch NFT collections from CoinGecko:', error);
  }

  // Fallback to static data if API fails
  console.log('Using fallback NFT data');
  let fallback = [...FALLBACK_COLLECTIONS];
  if (chain && chain !== 'all') {
    fallback = fallback.filter(c => c.chain.toLowerCase() === chain.toLowerCase());
  }
  return fallback.slice(0, limit);
}

/**
 * Fetch NFT market-wide stats
 */
export async function fetchNFTMarketStats(): Promise<NFTMarketStats> {
  // Check cache
  const now = Date.now();
  if (nftCache.data && (now - nftCache.timestamp) < CACHE_TTL) {
    return nftCache.data;
  }

  const topCollections = await fetchTopNFTCollections(20);
  const isLive = topCollections.some(c => c.dataSource === 'live');

  // Calculate aggregate stats
  const totalVolume24h = topCollections.reduce((sum, c) => sum + c.volume24h, 0);
  const totalMarketCap = topCollections.reduce((sum, c) => sum + c.marketCap, 0);
  const totalSales24h = topCollections.reduce((sum, c) => sum + c.sales24h, 0);
  const averagePrice = totalSales24h > 0 ? totalVolume24h / totalSales24h : 0;

  // Calculate volume by chain
  const chainVolumes: Record<string, number> = {};
  for (const c of topCollections) {
    chainVolumes[c.chain] = (chainVolumes[c.chain] || 0) + c.volume24h;
  }

  const chainBreakdown = Object.entries(chainVolumes)
    .map(([chainName, volume]) => ({
      chain: chainName,
      volume,
      percentage: totalVolume24h > 0 ? (volume / totalVolume24h) * 100 : 0,
    }))
    .sort((a, b) => b.volume - a.volume);

  // Average volume change
  const volumeChange24h = topCollections.length > 0
    ? topCollections.reduce((sum, c) => sum + c.volumeChange24h, 0) / topCollections.length
    : 0;

  const stats: NFTMarketStats = {
    totalMarketCap,
    totalVolume24h,
    volumeChange24h,
    totalSales24h,
    averagePrice,
    topCollections,
    chainBreakdown,
    timestamp: new Date().toISOString(),
    dataSource: isLive ? 'live' : 'fallback',
  };

  // Update cache
  nftCache = { data: stats, timestamp: now };

  return stats;
}

/**
 * Search NFT collections by name
 */
export function searchNFTCollections(query: string): NFTCollection[] {
  const normalizedQuery = query.toLowerCase();
  const cached = collectionsCache.data || FALLBACK_COLLECTIONS;
  return cached.filter(c =>
    c.name.toLowerCase().includes(normalizedQuery) ||
    c.slug.toLowerCase().includes(normalizedQuery)
  );
}

// ============================================
// DOWNLOAD CENTER EXPORTS
// ============================================

/**
 * Fetch NFT collections for download
 */
export async function fetchNFTCollectionsForDownload(
  limit: number = 50,
  chain?: string
): Promise<NFTCollectionDownload[]> {
  const collections = await fetchTopNFTCollections(limit, chain);

  return collections.map(c => ({
    name: c.name,
    chain: c.chain,
    floorPrice: c.floorPrice,
    floorPriceUsd: c.floorPriceUsd,
    volume24h: c.volume24h,
    volumeChange24h: c.volumeChange24h,
    sales24h: c.sales24h,
    owners: c.owners,
    totalSupply: c.totalSupply,
    listedPercent: c.listedPercent,
    marketCap: c.marketCap,
  }));
}

/**
 * Fetch NFT market stats for download
 */
export async function fetchNFTStatsForDownload(): Promise<{
  metric: string;
  value: number | string;
  change24h?: number;
}[]> {
  const stats = await fetchNFTMarketStats();

  return [
    { metric: 'Total Market Cap (USD)', value: stats.totalMarketCap },
    { metric: 'Total Volume 24h (USD)', value: stats.totalVolume24h, change24h: stats.volumeChange24h },
    { metric: 'Total Sales 24h', value: stats.totalSales24h },
    { metric: 'Average Sale Price (USD)', value: stats.averagePrice },
    { metric: 'Top Chain by Volume', value: stats.chainBreakdown[0]?.chain || 'N/A' },
    { metric: 'Ethereum Volume %', value: stats.chainBreakdown.find(c => c.chain === 'Ethereum')?.percentage || 0 },
    { metric: 'Solana Volume %', value: stats.chainBreakdown.find(c => c.chain === 'Solana')?.percentage || 0 },
    { metric: 'Data Source', value: stats.dataSource === 'live' ? 'CoinGecko API' : 'Cached Data' },
    { metric: 'Last Updated', value: stats.timestamp },
  ];
}

/**
 * Get NFT market interpretation
 */
export function getNFTMarketInterpretation(stats: NFTMarketStats): string {
  const parts: string[] = [];

  if (stats.volumeChange24h > 20) {
    parts.push('NFT market is HOT - significant volume increase');
  } else if (stats.volumeChange24h > 10) {
    parts.push('NFT market showing strength - volume up');
  } else if (stats.volumeChange24h < -20) {
    parts.push('NFT market cooling - significant volume drop');
  } else if (stats.volumeChange24h < -10) {
    parts.push('NFT market weakening - volume declining');
  }

  // Check dominant chain
  const topChain = stats.chainBreakdown[0];
  if (topChain && topChain.percentage > 60) {
    parts.push(`${topChain.chain} dominating with ${topChain.percentage.toFixed(0)}% of volume`);
  }

  if (stats.dataSource === 'fallback') {
    parts.push('Note: Using cached data (API temporarily unavailable)');
  }

  return parts.length > 0 ? parts.join('. ') : 'NFT market in neutral range';
}
