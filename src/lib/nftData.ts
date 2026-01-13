// ============================================
// NFT MARKET DATA - CoinGecko API
// Collections, floor prices, volume, stats
// ============================================

import { isFeatureEnabled } from '@/lib/featureFlags';

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
  floorPrice: number | null;
  floorPriceUsd: number | null;
  volume24h: number | null;
  volumeChange24h: number | null;
  sales24h: number | null;
  owners: number | null;
  totalSupply: number | null;
  listedCount: number | null;
  listedPercent: number | null;
  averagePrice: number | null;
  marketCap: number | null;
  imageUrl?: string;
  dataSource?: 'live';
}

export interface NFTMarketStats {
  totalMarketCap: number | null;
  totalVolume24h: number | null;
  volumeChange24h: number | null;
  totalSales24h: number | null;
  averagePrice: number | null;
  topCollections: NFTCollection[];
  chainBreakdown: { chain: string; volume: number; percentage: number }[];
  timestamp: string;
  dataSource: 'live' | 'unavailable';
  errors?: string[];
}

export interface NFTCollectionDownload {
  name: string;
  chain: string;
  floorPrice: number | null;
  floorPriceUsd: number | null;
  volume24h: number | null;
  volumeChange24h: number | null;
  sales24h: number | null;
  owners: number | null;
  totalSupply: number | null;
  listedPercent: number | null;
  marketCap: number | null;
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
  if (!isFeatureEnabled('nft')) {
    return null;
  }

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
    const floorPriceUsd = typeof data.floor_price?.usd === 'number' && Number.isFinite(data.floor_price.usd) ? data.floor_price.usd : null;
    const volume24h = typeof data.volume_24h?.usd === 'number' && Number.isFinite(data.volume_24h.usd) ? data.volume_24h.usd : null;
    const marketCap = typeof data.market_cap?.usd === 'number' && Number.isFinite(data.market_cap.usd) ? data.market_cap.usd : null;
    const totalSupply = typeof data.total_supply === 'number' && Number.isFinite(data.total_supply) ? data.total_supply : null;
    const owners = typeof data.number_of_unique_addresses === 'number' && Number.isFinite(data.number_of_unique_addresses)
      ? data.number_of_unique_addresses
      : null;

    // Without these key fields, we can't provide meaningful market stats.
    if (floorPriceUsd === null || volume24h === null || marketCap === null) {
      return null;
    }

    const floorPriceNative = typeof data.floor_price?.native_currency === 'number' && Number.isFinite(data.floor_price.native_currency)
      ? data.floor_price.native_currency
      : null;
    const volumeChange24h = typeof data.floor_price_in_usd_24h_percentage_change === 'number' && Number.isFinite(data.floor_price_in_usd_24h_percentage_change)
      ? data.floor_price_in_usd_24h_percentage_change
      : null;

    return {
      name: data.name,
      slug: data.id,
      chain,
      floorPrice: floorPriceNative,
      floorPriceUsd,
      volume24h,
      volumeChange24h,
      sales24h: null,
      owners,
      totalSupply,
      listedCount: null,
      listedPercent: null,
      averagePrice: null,
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
  if (!isFeatureEnabled('nft')) {
    return [];
  }

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
        .sort((a, b) => (b.volume24h ?? -Infinity) - (a.volume24h ?? -Infinity))
        .slice(0, limit);
    }
  } catch (error) {
    console.error('Failed to fetch NFT collections from CoinGecko:', error);
  }

  return [];
}

/**
 * Fetch NFT market-wide stats
 */
export async function fetchNFTMarketStats(): Promise<NFTMarketStats> {
  if (!isFeatureEnabled('nft')) {
    const now = Date.now();
    const stats: NFTMarketStats = {
      totalMarketCap: null,
      totalVolume24h: null,
      volumeChange24h: null,
      totalSales24h: null,
      averagePrice: null,
      topCollections: [],
      chainBreakdown: [],
      timestamp: new Date(now).toISOString(),
      dataSource: 'unavailable',
      errors: ['NFT data is disabled.'],
    };
    nftCache = { data: stats, timestamp: now };
    return stats;
  }

  // Check cache
  const now = Date.now();
  if (nftCache.data && (now - nftCache.timestamp) < CACHE_TTL) {
    return nftCache.data;
  }

  const topCollections = await fetchTopNFTCollections(20);
  if (topCollections.length === 0) {
    const stats: NFTMarketStats = {
      totalMarketCap: null,
      totalVolume24h: null,
      volumeChange24h: null,
      totalSales24h: null,
      averagePrice: null,
      topCollections: [],
      chainBreakdown: [],
      timestamp: new Date().toISOString(),
      dataSource: 'unavailable',
      errors: ['NFT data unavailable from CoinGecko free API'],
    };
    nftCache = { data: stats, timestamp: now };
    return stats;
  }

  // Calculate aggregate stats
  const totalVolume24h = topCollections.reduce((sum, c) => sum + (c.volume24h ?? 0), 0);
  const totalMarketCap = topCollections.reduce((sum, c) => sum + (c.marketCap ?? 0), 0);

  // Calculate volume by chain
  const chainVolumes: Record<string, number> = {};
  for (const c of topCollections) {
    if (typeof c.volume24h === 'number') {
      chainVolumes[c.chain] = (chainVolumes[c.chain] || 0) + c.volume24h;
    }
  }

  const chainBreakdown = Object.entries(chainVolumes)
    .map(([chainName, volume]) => ({
      chain: chainName,
      volume,
      percentage: totalVolume24h > 0 ? (volume / totalVolume24h) * 100 : 0,
    }))
    .sort((a, b) => b.volume - a.volume);

  // Average volume change
  const changeValues = topCollections
    .map(c => c.volumeChange24h)
    .filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  const volumeChange24h = changeValues.length > 0 ? changeValues.reduce((a, b) => a + b, 0) / changeValues.length : null;

  const stats: NFTMarketStats = {
    totalMarketCap,
    totalVolume24h,
    volumeChange24h,
    totalSales24h: null,
    averagePrice: null,
    topCollections,
    chainBreakdown,
    timestamp: new Date().toISOString(),
    dataSource: 'live',
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
  const cached = collectionsCache.data || [];
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
    { metric: 'Total Market Cap (USD)', value: stats.totalMarketCap ?? 'unavailable' },
    { metric: 'Total Volume 24h (USD)', value: stats.totalVolume24h ?? 'unavailable', change24h: stats.volumeChange24h ?? undefined },
    { metric: 'Total Sales 24h', value: stats.totalSales24h ?? 'unavailable' },
    { metric: 'Average Sale Price (USD)', value: stats.averagePrice ?? 'unavailable' },
    { metric: 'Top Chain by Volume', value: stats.chainBreakdown[0]?.chain || 'unavailable' },
    { metric: 'Ethereum Volume %', value: stats.chainBreakdown.find(c => c.chain === 'Ethereum')?.percentage ?? 'unavailable' },
    { metric: 'Solana Volume %', value: stats.chainBreakdown.find(c => c.chain === 'Solana')?.percentage ?? 'unavailable' },
    { metric: 'Data Source', value: stats.dataSource === 'live' ? 'CoinGecko API' : 'unavailable' },
    { metric: 'Last Updated', value: stats.timestamp },
  ];
}

/**
 * Get NFT market interpretation
 */
export function getNFTMarketInterpretation(stats: NFTMarketStats): string {
  const parts: string[] = [];

  if (typeof stats.volumeChange24h === 'number' && stats.volumeChange24h > 20) {
    parts.push('NFT market is HOT - significant volume increase');
  } else if (typeof stats.volumeChange24h === 'number' && stats.volumeChange24h > 10) {
    parts.push('NFT market showing strength - volume up');
  } else if (typeof stats.volumeChange24h === 'number' && stats.volumeChange24h < -20) {
    parts.push('NFT market cooling - significant volume drop');
  } else if (typeof stats.volumeChange24h === 'number' && stats.volumeChange24h < -10) {
    parts.push('NFT market weakening - volume declining');
  }

  // Check dominant chain
  const topChain = stats.chainBreakdown[0];
  if (topChain && topChain.percentage > 60) {
    parts.push(`${topChain.chain} dominating with ${topChain.percentage.toFixed(0)}% of volume`);
  }

  if (stats.dataSource === 'unavailable') {
    parts.push('NFT market data unavailable from free API');
  }

  return parts.length > 0 ? parts.join('. ') : 'NFT market in neutral range';
}
