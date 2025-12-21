// ============================================
// NFT MARKET DATA
// Collections, floor prices, volume, stats
// ============================================

// Cache for NFT data (5 minute TTL)
let nftCache: { data: NFTMarketStats | null; timestamp: number } = { data: null, timestamp: 0 };
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

// ============================================
// TOP NFT COLLECTIONS (Static data with realistic values)
// Would use OpenSea/Reservoir API in production
// ============================================

const TOP_NFT_COLLECTIONS: NFTCollection[] = [
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
  },
  {
    name: 'Mutant Ape Yacht Club',
    slug: 'mutantapeyachtclub',
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
  },
  {
    name: 'Pudgy Penguins',
    slug: 'pudgypenguins',
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
  },
  {
    name: 'Doodles',
    slug: 'doodles',
    chain: 'Ethereum',
    floorPrice: 2.1,
    floorPriceUsd: 6300,
    volume24h: 125000,
    volumeChange24h: -8.5,
    sales24h: 18,
    owners: 5890,
    totalSupply: 10000,
    listedCount: 890,
    listedPercent: 8.9,
    averagePrice: 2.4,
    marketCap: 63000000,
  },
  {
    name: 'DeGods',
    slug: 'degods',
    chain: 'Ethereum',
    floorPrice: 4.5,
    floorPriceUsd: 13500,
    volume24h: 210000,
    volumeChange24h: 5.2,
    sales24h: 22,
    owners: 6250,
    totalSupply: 10000,
    listedCount: 720,
    listedPercent: 7.2,
    averagePrice: 4.8,
    marketCap: 135000000,
  },
  {
    name: 'Milady Maker',
    slug: 'milady',
    chain: 'Ethereum',
    floorPrice: 3.8,
    floorPriceUsd: 11400,
    volume24h: 380000,
    volumeChange24h: 18.9,
    sales24h: 42,
    owners: 4120,
    totalSupply: 10000,
    listedCount: 650,
    listedPercent: 6.5,
    averagePrice: 4.1,
    marketCap: 114000000,
  },
  {
    name: 'Mad Lads',
    slug: 'madlads',
    chain: 'Solana',
    floorPrice: 85.0,
    floorPriceUsd: 8500,
    volume24h: 125000,
    volumeChange24h: 15.3,
    sales24h: 35,
    owners: 4520,
    totalSupply: 10000,
    listedCount: 420,
    listedPercent: 4.2,
    averagePrice: 92.0,
    marketCap: 85000000,
  },
  {
    name: 'Tensorians',
    slug: 'tensorians',
    chain: 'Solana',
    floorPrice: 22.5,
    floorPriceUsd: 2250,
    volume24h: 85000,
    volumeChange24h: 8.7,
    sales24h: 55,
    owners: 3890,
    totalSupply: 10000,
    listedCount: 580,
    listedPercent: 5.8,
    averagePrice: 24.0,
    marketCap: 22500000,
  },
  {
    name: 'Claynosaurz',
    slug: 'claynosaurz',
    chain: 'Solana',
    floorPrice: 35.0,
    floorPriceUsd: 3500,
    volume24h: 95000,
    volumeChange24h: -3.2,
    sales24h: 28,
    owners: 4250,
    totalSupply: 10000,
    listedCount: 380,
    listedPercent: 3.8,
    averagePrice: 38.0,
    marketCap: 35000000,
  },
  {
    name: 'Ordinal Maxi Biz',
    slug: 'omb',
    chain: 'Bitcoin',
    floorPrice: 0.025,
    floorPriceUsd: 2450,
    volume24h: 180000,
    volumeChange24h: 42.5,
    sales24h: 85,
    owners: 2150,
    totalSupply: 10000,
    listedCount: 920,
    listedPercent: 9.2,
    averagePrice: 0.028,
    marketCap: 24500000,
  },
  {
    name: 'NodeMonkes',
    slug: 'nodemonkes',
    chain: 'Bitcoin',
    floorPrice: 0.18,
    floorPriceUsd: 17640,
    volume24h: 520000,
    volumeChange24h: 28.3,
    sales24h: 32,
    owners: 3850,
    totalSupply: 10000,
    listedCount: 650,
    listedPercent: 6.5,
    averagePrice: 0.21,
    marketCap: 176400000,
  },
  {
    name: 'Bitcoin Puppets',
    slug: 'bitcoin-puppets',
    chain: 'Bitcoin',
    floorPrice: 0.085,
    floorPriceUsd: 8330,
    volume24h: 280000,
    volumeChange24h: 15.8,
    sales24h: 42,
    owners: 4120,
    totalSupply: 10001,
    listedCount: 780,
    listedPercent: 7.8,
    averagePrice: 0.092,
    marketCap: 83300000,
  },
  {
    name: 'y00ts',
    slug: 'y00ts',
    chain: 'Polygon',
    floorPrice: 850,
    floorPriceUsd: 850,
    volume24h: 45000,
    volumeChange24h: -5.8,
    sales24h: 28,
    owners: 5680,
    totalSupply: 15000,
    listedCount: 1250,
    listedPercent: 8.3,
    averagePrice: 920,
    marketCap: 12750000,
  },
];

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch top NFT collections
 */
export async function fetchTopNFTCollections(
  limit: number = 20,
  chain?: string
): Promise<NFTCollection[]> {
  // In production, this would call OpenSea/Reservoir API
  // For now, return static data with simulated updates

  let collections = [...TOP_NFT_COLLECTIONS];

  // Filter by chain if specified
  if (chain && chain !== 'all') {
    collections = collections.filter(c => c.chain.toLowerCase() === chain.toLowerCase());
  }

  // Add some randomization to simulate live data
  collections = collections.map(c => ({
    ...c,
    floorPrice: c.floorPrice * (0.98 + Math.random() * 0.04),
    floorPriceUsd: c.floorPriceUsd * (0.98 + Math.random() * 0.04),
    volume24h: c.volume24h * (0.9 + Math.random() * 0.2),
    volumeChange24h: c.volumeChange24h + (Math.random() - 0.5) * 5,
    sales24h: Math.floor(c.sales24h * (0.8 + Math.random() * 0.4)),
  }));

  // Sort by volume
  return collections
    .sort((a, b) => b.volume24h - a.volume24h)
    .slice(0, limit);
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

  // Calculate aggregate stats
  const totalVolume24h = topCollections.reduce((sum, c) => sum + c.volume24h, 0);
  const totalMarketCap = topCollections.reduce((sum, c) => sum + c.marketCap, 0);
  const totalSales24h = topCollections.reduce((sum, c) => sum + c.sales24h, 0);
  const averagePrice = totalVolume24h / totalSales24h;

  // Calculate volume by chain
  const chainVolumes: Record<string, number> = {};
  for (const c of topCollections) {
    chainVolumes[c.chain] = (chainVolumes[c.chain] || 0) + c.volume24h;
  }

  const chainBreakdown = Object.entries(chainVolumes)
    .map(([chain, volume]) => ({
      chain,
      volume,
      percentage: (volume / totalVolume24h) * 100,
    }))
    .sort((a, b) => b.volume - a.volume);

  // Average volume change
  const volumeChange24h = topCollections.reduce((sum, c) => sum + c.volumeChange24h, 0) / topCollections.length;

  const stats: NFTMarketStats = {
    totalMarketCap,
    totalVolume24h,
    volumeChange24h,
    totalSales24h,
    averagePrice,
    topCollections,
    chainBreakdown,
    timestamp: new Date().toISOString(),
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
  return TOP_NFT_COLLECTIONS.filter(c =>
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
    { metric: 'Bitcoin Volume %', value: stats.chainBreakdown.find(c => c.chain === 'Bitcoin')?.percentage || 0 },
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

  return parts.length > 0 ? parts.join('. ') : 'NFT market in neutral range';
}
