/**
 * Data Source Classification System
 *
 * This module defines all data sources and their licensing characteristics.
 * Critical for compliance: display-only sources CANNOT be included in downloads.
 */

export type DataSourceLicense = 'redistributable' | 'display-only';

export interface DataSource {
  id: string;
  name: string;
  license: DataSourceLicense;
  attribution?: string; // Required for display-only sources
  attributionUrl?: string;
  refreshInterval: number; // Seconds
  description: string;
}

/**
 * All registered data sources with their licensing characteristics.
 *
 * REDISTRIBUTABLE: Can be included in downloads (CSV/XLSX/JSON)
 * DISPLAY-ONLY: UI display only, NO downloads allowed
 */
export const DATA_SOURCES: Record<string, DataSource> = {
  // === REDISTRIBUTABLE SOURCES ===
  // These can be included in user downloads

  coinlore: {
    id: 'coinlore',
    name: 'CoinLore',
    license: 'redistributable',
    refreshInterval: 300,
    description: 'Market data aggregation (commercial-friendly)',
  },

  alternativeme: {
    id: 'alternativeme',
    name: 'Alternative.me',
    license: 'redistributable',
    refreshInterval: 3600,
    description: 'Fear & Greed Index',
  },

  defillama: {
    id: 'defillama',
    name: 'DeFi Llama',
    license: 'redistributable',
    attribution: 'Data by DeFi Llama',
    attributionUrl: 'https://defillama.com',
    refreshInterval: 300,
    description: 'DeFi TVL, yields, DEX volumes (open source, free API)',
  },

  blockchaininfo: {
    id: 'blockchaininfo',
    name: 'Blockchain.info',
    license: 'redistributable',
    refreshInterval: 600,
    description: 'Bitcoin blockchain statistics',
  },

  publicrpc: {
    id: 'publicrpc',
    name: 'Public RPC',
    license: 'redistributable',
    refreshInterval: 60,
    description: 'Public blockchain RPC endpoints',
  },

  computed: {
    id: 'computed',
    name: 'CryptoReportKit Computed',
    license: 'redistributable',
    refreshInterval: 0,
    description: 'Our own computed/derived metrics',
  },

  // === DISPLAY-ONLY SOURCES ===
  // These can ONLY be shown in UI, NOT in downloads

  coingecko: {
    id: 'coingecko',
    name: 'CoinGecko',
    license: 'display-only',
    attribution: 'Data provided by CoinGecko',
    attributionUrl: 'https://www.coingecko.com/en/api',
    refreshInterval: 60,
    description: 'Comprehensive crypto data (commercial license with attribution)',
  },

  etherscan: {
    id: 'etherscan',
    name: 'Etherscan',
    license: 'display-only',
    attribution: 'Powered by Etherscan.io APIs',
    attributionUrl: 'https://etherscan.io',
    refreshInterval: 15,
    description: 'Ethereum blockchain data (BYOK, attribution required)',
  },

  bscscan: {
    id: 'bscscan',
    name: 'BscScan',
    license: 'display-only',
    attribution: 'Powered by BscScan.com APIs',
    attributionUrl: 'https://bscscan.com',
    refreshInterval: 15,
    description: 'BNB Chain blockchain data (BYOK, attribution required)',
  },

  polygonscan: {
    id: 'polygonscan',
    name: 'PolygonScan',
    license: 'display-only',
    attribution: 'Powered by PolygonScan.com APIs',
    attributionUrl: 'https://polygonscan.com',
    refreshInterval: 15,
    description: 'Polygon blockchain data (BYOK, attribution required)',
  },
};

/**
 * Get a data source by ID
 */
export function getDataSource(sourceId: string): DataSource | undefined {
  return DATA_SOURCES[sourceId];
}

/**
 * Check if a source is redistributable (can be included in downloads)
 */
export function isRedistributable(sourceId: string): boolean {
  const source = DATA_SOURCES[sourceId];
  return source?.license === 'redistributable';
}

/**
 * Check if a source is display-only (UI only, no downloads)
 */
export function isDisplayOnly(sourceId: string): boolean {
  const source = DATA_SOURCES[sourceId];
  return source?.license === 'display-only';
}

/**
 * Get all redistributable source IDs
 */
export function getRedistributableSources(): string[] {
  return Object.values(DATA_SOURCES)
    .filter((s) => s.license === 'redistributable')
    .map((s) => s.id);
}

/**
 * Get all display-only source IDs
 */
export function getDisplayOnlySources(): string[] {
  return Object.values(DATA_SOURCES)
    .filter((s) => s.license === 'display-only')
    .map((s) => s.id);
}

/**
 * Get attribution text for a source (required for display-only sources)
 */
export function getAttribution(sourceId: string): string | undefined {
  return DATA_SOURCES[sourceId]?.attribution;
}

/**
 * Get attribution URL for a source
 */
export function getAttributionUrl(sourceId: string): string | undefined {
  return DATA_SOURCES[sourceId]?.attributionUrl;
}

/**
 * Filter data items to only include redistributable sources
 * Use this before generating downloads
 */
export function filterRedistributableData<T extends { sourceId?: string }>(
  items: T[]
): T[] {
  return items.filter((item) => {
    if (!item.sourceId) return true; // Default to allowed if no source tagged
    return isRedistributable(item.sourceId);
  });
}

/**
 * Tag data with source information
 */
export interface SourceTaggedData {
  sourceId: string;
  sourceName: string;
  isRedistributable: boolean;
  attribution?: string;
  attributionUrl?: string;
  fetchedAt: number;
}

export function tagDataWithSource(
  sourceId: string,
  fetchedAt: number = Date.now()
): SourceTaggedData {
  const source = DATA_SOURCES[sourceId];
  if (!source) {
    throw new Error(`Unknown data source: ${sourceId}`);
  }

  return {
    sourceId: source.id,
    sourceName: source.name,
    isRedistributable: source.license === 'redistributable',
    attribution: source.attribution,
    attributionUrl: source.attributionUrl,
    fetchedAt,
  };
}
