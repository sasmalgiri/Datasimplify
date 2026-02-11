/**
 * dataContract.ts — Single source of truth for PQ table names and column schemas.
 *
 * Maps every PQ query name to its Excel Table displayName and ordered columns.
 * Used by dashboardCharts.ts to generate structured table references
 * (`TableName[ColumnName]`) that auto-update when PQ refreshes.
 *
 * Table names are derived from query names via: queryName.replace(/[^a-zA-Z0-9_]/g, '_')
 * Since all query names are already CRK_* format, tableName === queryName.
 */

// ============================================
// Types
// ============================================

export interface TableContract {
  tableName: string;    // Excel Table displayName, e.g., "CRK_Market"
  columns: string[];    // Ordered column names matching PQ output
}

// ============================================
// Registry — mirrors PQ_COLUMNS from powerQueryTemplates.ts
// ============================================

export const TABLE_REGISTRY: Record<string, TableContract> = {
  // Core market data
  CRK_Market: {
    tableName: 'CRK_Market',
    columns: ['Rank', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h', 'Change7d', 'Change30d', 'ATH', 'ATHChange', 'LastUpdated'],
  },
  CRK_Market_Analytics: {
    tableName: 'CRK_Market',
    columns: ['Rank', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h', 'Change7d', 'Change30d', 'ATH', 'ATHChange', 'LastUpdated', 'MktShare', 'VolMcapRatio', 'PerfScore'],
  },

  // Global stats
  CRK_Global: {
    tableName: 'CRK_Global',
    columns: ['Metric', 'Value'],
  },

  // Fear & Greed
  CRK_FearGreed: {
    tableName: 'CRK_FearGreed',
    columns: ['Value', 'Classification', 'Timestamp', 'Date'],
  },

  // OHLC
  CRK_BTC_OHLC: {
    tableName: 'CRK_BTC_OHLC',
    columns: ['Timestamp', 'Open', 'High', 'Low', 'Close', 'Date'],
  },
  CRK_ETH_OHLC: {
    tableName: 'CRK_ETH_OHLC',
    columns: ['Timestamp', 'Open', 'High', 'Low', 'Close', 'Date'],
  },
  CRK_SOL_OHLC: {
    tableName: 'CRK_SOL_OHLC',
    columns: ['Timestamp', 'Open', 'High', 'Low', 'Close', 'Date'],
  },

  // Technical with indicators
  CRK_BTC_Technical: {
    tableName: 'CRK_BTC_Technical',
    columns: ['Timestamp', 'Open', 'High', 'Low', 'Close', 'Date', 'SMA20', 'SMA50', 'EMA12', 'EMA26', 'RSI14', 'MACD', 'Signal', 'MACD_Hist', 'BB_Upper', 'BB_Lower', 'DailyReturn', 'Coin'],
  },
  CRK_ETH_Technical: {
    tableName: 'CRK_ETH_Technical',
    columns: ['Timestamp', 'Open', 'High', 'Low', 'Close', 'Date', 'SMA20', 'SMA50', 'EMA12', 'EMA26', 'RSI14', 'MACD', 'Signal', 'MACD_Hist', 'BB_Upper', 'BB_Lower', 'DailyReturn', 'Coin'],
  },

  // Coin details
  CRK_Bitcoin: {
    tableName: 'CRK_Bitcoin',
    columns: ['Metric', 'Value'],
  },
  CRK_Ethereum: {
    tableName: 'CRK_Ethereum',
    columns: ['Metric', 'Value'],
  },

  // Trending
  CRK_Trending: {
    tableName: 'CRK_Trending',
    columns: ['ID', 'Name', 'Symbol', 'MarketCapRank', 'Score'],
  },

  // Watchlist
  CRK_Watchlist: {
    tableName: 'CRK_Watchlist',
    columns: ['ID', 'Name', 'Symbol', 'Rank', 'Price', 'MarketCap', 'Volume24h', 'Change24h', 'Change7d', 'Change30d'],
  },

  // Gainers / Losers
  CRK_Gainers: {
    tableName: 'CRK_Gainers',
    columns: ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'Change24h', 'Volume24h', 'MarketCap'],
  },
  CRK_Losers: {
    tableName: 'CRK_Losers',
    columns: ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'Change24h', 'Volume24h', 'MarketCap'],
  },
  CRK_TopMovers: {
    tableName: 'CRK_TopMovers',
    columns: ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'Change24h', 'Volume24h', 'MarketCap'],
  },

  // Exchanges
  CRK_Exchanges: {
    tableName: 'CRK_Exchanges',
    columns: ['Rank', 'Name', 'TrustScore', 'Volume24hBTC', 'Year', 'Country'],
  },

  // DeFi
  CRK_DeFi: {
    tableName: 'CRK_DeFi',
    columns: ['Rank', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h'],
  },

  // Derivatives
  CRK_Derivatives: {
    tableName: 'CRK_Derivatives',
    columns: ['Market', 'Symbol', 'Price', 'PriceChange24h', 'FundingRate', 'OpenInterest', 'Volume24h'],
  },

  // Stablecoins
  CRK_Stablecoins: {
    tableName: 'CRK_Stablecoins',
    columns: ['Rank', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'CirculatingSupply', 'PegDeviation'],
  },

  // NFTs
  CRK_NFTs: {
    tableName: 'CRK_NFTs',
    columns: ['ID', 'Name', 'Symbol', 'ContractAddress', 'Platform'],
  },

  // Categories
  CRK_Categories: {
    tableName: 'CRK_Categories',
    columns: ['ID', 'Name', 'MarketCap', 'MarketCapChange24h', 'Volume24h', 'Rank'],
  },

  // Category tokens (categoriesWithId)
  CRK_MemeCoins: {
    tableName: 'CRK_MemeCoins',
    columns: ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h'],
  },
  CRK_AI_Tokens: {
    tableName: 'CRK_AI_Tokens',
    columns: ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h'],
  },
  CRK_Gaming_Tokens: {
    tableName: 'CRK_Gaming_Tokens',
    columns: ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h'],
  },
  CRK_L2_Coins: {
    tableName: 'CRK_L2_Coins',
    columns: ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h'],
  },
  CRK_RWA_Tokens: {
    tableName: 'CRK_RWA_Tokens',
    columns: ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h'],
  },
  CRK_MetaverseTokens: {
    tableName: 'CRK_MetaverseTokens',
    columns: ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h'],
  },
  CRK_PrivacyCoins: {
    tableName: 'CRK_PrivacyCoins',
    columns: ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h'],
  },
  CRK_StakingCoins: {
    tableName: 'CRK_StakingCoins',
    columns: ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h'],
  },
  CRK_PoW_Coins: {
    tableName: 'CRK_PoW_Coins',
    columns: ['Rank', 'ID', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h'],
  },

  // Companies
  CRK_Companies: {
    tableName: 'CRK_Companies',
    columns: ['Name', 'Symbol', 'Country', 'TotalHoldings', 'TotalEntryValueUSD', 'TotalCurrentValueUSD', 'PercentOfTotalSupply', 'Rank'],
  },
  CRK_BTC_Companies: {
    tableName: 'CRK_BTC_Companies',
    columns: ['Name', 'Symbol', 'Country', 'TotalHoldings', 'TotalEntryValueUSD', 'TotalCurrentValueUSD', 'PercentOfTotalSupply', 'Rank'],
  },
  CRK_ETH_Companies: {
    tableName: 'CRK_ETH_Companies',
    columns: ['Name', 'Symbol', 'Country', 'TotalHoldings', 'TotalEntryValueUSD', 'TotalCurrentValueUSD', 'PercentOfTotalSupply', 'Rank'],
  },

  // Layer 1 comparison
  CRK_L1_Coins: {
    tableName: 'CRK_L1_Coins',
    columns: ['ID', 'Name', 'Symbol', 'Rank', 'Price', 'MarketCap', 'Volume24h', 'Change24h', 'Change7d', 'Change30d'],
  },

  // Altcoin season
  CRK_AltSeason: {
    tableName: 'CRK_AltSeason',
    columns: ['Rank', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h', 'Change7d', 'Change30d', 'ATH', 'ATHChange', 'LastUpdated'],
  },

  // Wallet
  CRK_Wallet: {
    tableName: 'CRK_Wallet',
    columns: ['Chain', 'Address', 'Balance'],
  },

  // Whale tracker
  CRK_WhaleCoins: {
    tableName: 'CRK_WhaleCoins',
    columns: ['Rank', 'Name', 'Symbol', 'Price', 'MarketCap', 'Volume24h', 'Change24h', 'Change7d', 'Change30d', 'ATH', 'ATHChange', 'LastUpdated'],
  },

  // Batch
  CRK_TopCoins: {
    tableName: 'CRK_TopCoins',
    columns: ['ID', 'Price', 'MarketCap', 'Volume24h', 'Change24h'],
  },

  // On-chain
  CRK_Bitcoin_OnChain: {
    tableName: 'CRK_Bitcoin_OnChain',
    columns: ['Metric', 'Value'],
  },
  CRK_Ethereum_OnChain: {
    tableName: 'CRK_Ethereum_OnChain',
    columns: ['Metric', 'Value'],
  },

  // Dev activity
  CRK_DevCoins: {
    tableName: 'CRK_DevCoins',
    columns: ['ID', 'Name', 'Symbol', 'Rank', 'Price', 'MarketCap', 'Volume24h', 'Change24h', 'Change7d', 'Change30d'],
  },

  // Token unlocks
  CRK_UnlockCoins: {
    tableName: 'CRK_UnlockCoins',
    columns: ['ID', 'Name', 'Symbol', 'Rank', 'Price', 'MarketCap', 'Volume24h', 'Change24h', 'Change7d', 'Change30d'],
  },
};

// ============================================
// Helpers
// ============================================

/**
 * Generates an Excel structured reference string: `TableName[ColumnName]`
 * These auto-expand when the PQ table grows/shrinks on refresh.
 */
export function structuredRef(tableName: string, column: string): string {
  return `${tableName}[${column}]`;
}
