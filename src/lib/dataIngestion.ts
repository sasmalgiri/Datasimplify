// ============================================
// COMPREHENSIVE DATA INGESTION SERVICE
// ============================================
// Fetches ALL crypto data from multiple sources
// Stores in database for AI training & predictions
// Runs continuously to build massive dataset

import { supabaseAdmin, isSupabaseConfigured } from './supabase';
import { 
  storeChunks, 
  indexMarketData, 
  indexSentimentPosts,
  indexWhaleTransactions,
  generateDailySummary,
  DataChunk 
} from './ragService';
import { analyzeSentimentAI } from './ollamaAI';

// ============================================
// DATA SOURCE CONFIGURATIONS
// ============================================

const DATA_SOURCES = {
  // Price & Market Data
  coingecko: {
    baseUrl: 'https://api.coingecko.com/api/v3',
    rateLimit: 10, // calls per minute (free tier)
    priority: 1,
  },
  coinmarketcap: {
    baseUrl: 'https://pro-api.coinmarketcap.com/v1',
    rateLimit: 30,
    priority: 2,
  },
  
  // Sentiment & Social
  alternativeMe: {
    baseUrl: 'https://api.alternative.me',
    rateLimit: 100,
    priority: 1,
  },
  lunarcrush: {
    baseUrl: 'https://lunarcrush.com/api3',
    rateLimit: 10,
    priority: 2,
  },
  
  // News
  cryptoPanic: {
    baseUrl: 'https://cryptopanic.com/api/v1',
    rateLimit: 5,
    priority: 1,
  },
  
  // DeFi
  defiLlama: {
    baseUrl: 'https://api.llama.fi',
    rateLimit: 100,
    priority: 1,
  },
  
  // On-Chain (free alternatives)
  blockchainInfo: {
    baseUrl: 'https://blockchain.info',
    rateLimit: 30,
    priority: 2,
  },
};

// ============================================
// TYPES
// ============================================

export interface MarketData {
  symbol: string;
  name: string;
  price: number;
  priceChange1h: number;
  priceChange24h: number;
  priceChange7d: number;
  priceChange30d: number;
  marketCap: number;
  volume24h: number;
  circulatingSupply: number;
  totalSupply: number;
  maxSupply: number | null;
  ath: number;
  athDate: string;
  atl: number;
  atlDate: string;
  rank: number;
  lastUpdated: string;
}

export interface NewsItem {
  id: string;
  title: string;
  content: string;
  source: string;
  url: string;
  publishedAt: string;
  coins: string[];
  sentiment: 'positive' | 'negative' | 'neutral';
  importance: 'high' | 'medium' | 'low';
}

export interface SocialData {
  coin: string;
  twitterFollowers: number;
  twitterChange24h: number;
  redditSubscribers: number;
  redditActiveUsers: number;
  telegramMembers: number;
  socialScore: number;
  socialVolume24h: number;
  sentimentScore: number;
  galaxyScore: number;
}

export interface WhaleTransaction {
  hash: string;
  blockchain: string;
  from: string;
  to: string;
  amount: number;
  amountUsd: number;
  timestamp: string;
  type: 'exchange_inflow' | 'exchange_outflow' | 'whale_transfer' | 'unknown';
}

export interface DeFiProtocol {
  name: string;
  chain: string;
  tvl: number;
  tvlChange24h: number;
  tvlChange7d: number;
  category: string;
  chains: string[];
  mcapTvl: number | null;
}

export interface FearGreedData {
  value: number;
  classification: string;
  timestamp: string;
  timeUntilUpdate: number;
}

export interface OnChainMetrics {
  coin: string;
  activeAddresses24h: number | null;
  transactionCount24h: number | null;
  avgTransactionValue: number | null;
  hashRate?: number | null;
  difficulty?: number | null;
  blockHeight: number | null;
  mempoolSize?: number | null;
}

// ============================================
// DATA FETCHERS
// ============================================

// Fetch with rate limiting and retry
async function fetchWithRetry(
  url: string, 
  options: RequestInit = {},
  retries = 3
): Promise<any> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Accept': 'application/json',
          ...options.headers,
        },
      });
      
      if (response.status === 429) {
        // Rate limited - wait and retry
        const waitTime = Math.pow(2, i) * 1000;
        console.log(`Rate limited, waiting ${waitTime}ms...`);
        await new Promise(r => setTimeout(r, waitTime));
        continue;
      }
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// ============================================
// COINGECKO DATA FETCHERS
// ============================================

export async function fetchMarketData(
  page = 1, 
  perPage = 250
): Promise<MarketData[]> {
  const url = `${DATA_SOURCES.coingecko.baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=false&price_change_percentage=1h,24h,7d,30d`;
  
  const data = await fetchWithRetry(url);
  
  return data.map((coin: any) => ({
    symbol: coin.symbol.toUpperCase(),
    name: coin.name,
    price: coin.current_price,
    priceChange1h: coin.price_change_percentage_1h_in_currency || 0,
    priceChange24h: coin.price_change_percentage_24h || 0,
    priceChange7d: coin.price_change_percentage_7d_in_currency || 0,
    priceChange30d: coin.price_change_percentage_30d_in_currency || 0,
    marketCap: coin.market_cap,
    volume24h: coin.total_volume,
    circulatingSupply: coin.circulating_supply,
    totalSupply: coin.total_supply,
    maxSupply: coin.max_supply,
    ath: coin.ath,
    athDate: coin.ath_date,
    atl: coin.atl,
    atlDate: coin.atl_date,
    rank: coin.market_cap_rank,
    lastUpdated: coin.last_updated,
  }));
}

export async function fetchHistoricalData(
  coinId: string,
  days: number = 365
): Promise<{ prices: [number, number][]; volumes: [number, number][] }> {
  const url = `${DATA_SOURCES.coingecko.baseUrl}/coins/${coinId}/market_chart?vs_currency=usd&days=${days}`;
  const data = await fetchWithRetry(url);
  
  return {
    prices: data.prices,
    volumes: data.total_volumes,
  };
}

export async function fetchCoinDetails(coinId: string): Promise<any> {
  const url = `${DATA_SOURCES.coingecko.baseUrl}/coins/${coinId}?localization=false&tickers=false&community_data=true&developer_data=true`;
  return await fetchWithRetry(url);
}

export async function fetchTrendingCoins(): Promise<any[]> {
  const url = `${DATA_SOURCES.coingecko.baseUrl}/search/trending`;
  const data = await fetchWithRetry(url);
  return data.coins.map((c: any) => c.item);
}

export async function fetchGlobalData(): Promise<any> {
  const url = `${DATA_SOURCES.coingecko.baseUrl}/global`;
  const data = await fetchWithRetry(url);
  return data.data;
}

// ============================================
// FEAR & GREED INDEX
// ============================================

export async function fetchFearGreedIndex(): Promise<FearGreedData> {
  const url = `${DATA_SOURCES.alternativeMe.baseUrl}/fng/?limit=1`;
  const data = await fetchWithRetry(url);
  
  return {
    value: parseInt(data.data[0].value),
    classification: data.data[0].value_classification,
    timestamp: new Date(parseInt(data.data[0].timestamp) * 1000).toISOString(),
    timeUntilUpdate: parseInt(data.data[0].time_until_update),
  };
}

export async function fetchFearGreedHistory(days: number = 365): Promise<FearGreedData[]> {
  const url = `${DATA_SOURCES.alternativeMe.baseUrl}/fng/?limit=${days}`;
  const data = await fetchWithRetry(url);
  
  return data.data.map((d: any) => ({
    value: parseInt(d.value),
    classification: d.value_classification,
    timestamp: new Date(parseInt(d.timestamp) * 1000).toISOString(),
    timeUntilUpdate: 0,
  }));
}

// ============================================
// DEFI DATA
// ============================================

export async function fetchDeFiProtocols(): Promise<DeFiProtocol[]> {
  const url = `${DATA_SOURCES.defiLlama.baseUrl}/protocols`;
  const data = await fetchWithRetry(url);
  
  return data.slice(0, 200).map((p: any) => ({
    name: p.name,
    chain: p.chain,
    tvl: p.tvl,
    tvlChange24h: p.change_1d || 0,
    tvlChange7d: p.change_7d || 0,
    category: p.category,
    chains: p.chains || [],
    mcapTvl: p.mcapTvl,
  }));
}

export async function fetchChainTVL(): Promise<{ name: string; tvl: number }[]> {
  const url = `${DATA_SOURCES.defiLlama.baseUrl}/chains`;
  const data = await fetchWithRetry(url);
  
  return data.map((c: any) => ({
    name: c.name,
    tvl: c.tvl,
  }));
}

export async function fetchYields(): Promise<any[]> {
  const url = `${DATA_SOURCES.defiLlama.baseUrl}/pools`;
  const data = await fetchWithRetry(url);
  
  // Return top 100 by TVL
  return data.data
    .sort((a: any, b: any) => b.tvlUsd - a.tvlUsd)
    .slice(0, 100);
}

// ============================================
// NEWS FETCHER (Free Sources)
// ============================================

export async function fetchCryptoNews(): Promise<NewsItem[]> {
  // Using RSS feeds (free sources). If parsing/indexing isn't implemented,
  // return an empty array (truthful) rather than synthetic news.
  
  const sources = [
    'https://cointelegraph.com/rss',
    'https://decrypt.co/feed',
    'https://www.coindesk.com/arc/outboundfeeds/rss/',
  ];
  
  // Not implemented yet: RSS feed parsing + dedupe + storage
  const news: NewsItem[] = [];
  
  // TODO: Implement RSS feed parsing
  
  return news;
}

// ============================================
// ON-CHAIN DATA (Free Sources)
// ============================================

export async function fetchBitcoinOnChain(): Promise<OnChainMetrics> {
  const [stats, blockHeight] = await Promise.all([
    fetchWithRetry('https://blockchain.info/stats?format=json'),
    fetchWithRetry('https://blockchain.info/latestblock'),
  ]);
  
  const nTx = typeof stats?.n_tx === 'number' ? stats.n_tx : null;
  const totalBtcSent = typeof stats?.total_btc_sent === 'number' ? stats.total_btc_sent : null;
  const avgTransactionValue =
    nTx && totalBtcSent ? totalBtcSent / nTx / 100000000 : null;

  return {
    coin: 'BTC',
    activeAddresses24h: null, // Not available in free API
    transactionCount24h: nTx,
    avgTransactionValue,
    hashRate: typeof stats?.hash_rate === 'number' ? stats.hash_rate : null,
    difficulty: typeof stats?.difficulty === 'number' ? stats.difficulty : null,
    blockHeight: typeof blockHeight?.height === 'number' ? blockHeight.height : null,
    mempoolSize: typeof stats?.mempool_size === 'number' ? stats.mempool_size : null,
  };
}

// ============================================
// DATA STORAGE & INDEXING
// ============================================

export async function storeMarketData(data: MarketData[]): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    console.log('Supabase not configured, skipping storage');
    return;
  }

  // Store in market_data table
  const records = data.map(coin => ({
    symbol: coin.symbol,
    name: coin.name,
    price: coin.price,
    price_change_1h: coin.priceChange1h,
    price_change_24h: coin.priceChange24h,
    price_change_7d: coin.priceChange7d,
    price_change_30d: coin.priceChange30d,
    market_cap: coin.marketCap,
    volume_24h: coin.volume24h,
    circulating_supply: coin.circulatingSupply,
    total_supply: coin.totalSupply,
    max_supply: coin.maxSupply,
    ath: coin.ath,
    ath_date: coin.athDate,
    atl: coin.atl,
    atl_date: coin.atlDate,
    rank: coin.rank,
    fetched_at: new Date().toISOString(),
  }));

  const { error } = await supabaseAdmin
    .from('market_data')
    .upsert(records, { onConflict: 'symbol' });

  if (error) {
    console.error('Failed to store market data:', error);
  }

  // Also index for RAG
  await indexMarketData(data.slice(0, 100).map(d => ({
    symbol: d.symbol,
    name: d.name,
    price: d.price,
    priceChange24h: d.priceChange24h,
    volume24h: d.volume24h,
    marketCap: d.marketCap,
  })));
}

export async function storeFearGreedData(data: FearGreedData): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) return;

  const { error } = await supabaseAdmin
    .from('fear_greed_history')
    .upsert({
      value: data.value,
      classification: data.classification,
      timestamp: data.timestamp,
    }, { onConflict: 'timestamp' });

  if (error) {
    console.error('Failed to store fear & greed data:', error);
  }

  // Index for RAG
  const chunk: DataChunk = {
    content: `Fear & Greed Index is at ${data.value} (${data.classification}). ${
      data.value < 25 ? 'Market is in extreme fear - historically a good buying opportunity.' :
      data.value < 45 ? 'Market is fearful - caution advised but opportunities may exist.' :
      data.value < 55 ? 'Market sentiment is neutral.' :
      data.value < 75 ? 'Market is greedy - be careful with new positions.' :
      'Market is in extreme greed - consider taking profits.'
    }`,
    contentType: 'sentiment_indicator',
    categoryPath: 'sentiment/fear-greed',
    source: 'alternative.me',
    dataDate: new Date(data.timestamp),
  };

  await storeChunks([chunk]);
}

export async function storeDeFiData(protocols: DeFiProtocol[]): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) return;

  const records = protocols.map(p => ({
    name: p.name,
    chain: p.chain,
    tvl: p.tvl,
    tvl_change_24h: p.tvlChange24h,
    tvl_change_7d: p.tvlChange7d,
    category: p.category,
    chains: p.chains,
    mcap_tvl: p.mcapTvl,
    fetched_at: new Date().toISOString(),
  }));

  const { error } = await supabaseAdmin
    .from('defi_protocols')
    .upsert(records, { onConflict: 'name' });

  if (error) {
    console.error('Failed to store DeFi data:', error);
  }

  // Index top protocols for RAG
  const chunks: DataChunk[] = protocols.slice(0, 50).map(p => ({
    content: `${p.name} has $${(p.tvl / 1e9).toFixed(2)}B TVL on ${p.chain}. Category: ${p.category}. 24h change: ${p.tvlChange24h > 0 ? '+' : ''}${p.tvlChange24h.toFixed(2)}%.`,
    contentType: 'defi_protocol',
    categoryPath: `defi/${p.category.toLowerCase().replace(/\s/g, '-')}`,
    source: 'defillama',
    dataDate: new Date(),
  }));

  await storeChunks(chunks);
}

export async function storeGlobalData(data: any): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) return;

  const record = {
    total_market_cap: data.total_market_cap.usd,
    total_volume_24h: data.total_volume.usd,
    btc_dominance: data.market_cap_percentage.btc,
    eth_dominance: data.market_cap_percentage.eth,
    active_cryptocurrencies: data.active_cryptocurrencies,
    markets: data.markets,
    market_cap_change_24h: data.market_cap_change_percentage_24h_usd,
    fetched_at: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin
    .from('global_metrics')
    .insert(record);

  if (error) {
    console.error('Failed to store global data:', error);
  }

  // Index for RAG
  const chunk: DataChunk = {
    content: `Global crypto market cap is $${(data.total_market_cap.usd / 1e12).toFixed(2)} trillion with $${(data.total_volume.usd / 1e9).toFixed(1)}B in 24h volume. BTC dominance is ${data.market_cap_percentage.btc.toFixed(1)}%, ETH dominance is ${data.market_cap_percentage.eth.toFixed(1)}%. Market cap changed ${data.market_cap_change_percentage_24h_usd > 0 ? '+' : ''}${data.market_cap_change_percentage_24h_usd.toFixed(2)}% in 24h.`,
    contentType: 'market_overview',
    categoryPath: 'market/global',
    source: 'coingecko',
    dataDate: new Date(),
  };

  await storeChunks([chunk]);
}

export async function storeTrendingCoins(coins: any[]): Promise<void> {
  if (!isSupabaseConfigured || !supabaseAdmin) return;

  const coinNames = coins.map(c => c.name).join(', ');
  
  const chunk: DataChunk = {
    content: `Trending cryptocurrencies right now: ${coinNames}. These coins are seeing increased search interest and social activity.`,
    contentType: 'trending',
    categoryPath: 'market/trending',
    source: 'coingecko',
    dataDate: new Date(),
  };

  await storeChunks([chunk]);
}

// ============================================
// COMPREHENSIVE DATA SYNC
// ============================================

export interface SyncResult {
  source: string;
  success: boolean;
  recordsProcessed: number;
  error?: string;
  duration: number;
}

export async function syncAllData(): Promise<SyncResult[]> {
  const results: SyncResult[] = [];
  
  console.log('🚀 Starting comprehensive data sync...');
  
  // 1. Market Data (Top 500 coins)
  for (let page = 1; page <= 2; page++) {
    const start = Date.now();
    try {
      const marketData = await fetchMarketData(page, 250);
      await storeMarketData(marketData);
      results.push({
        source: `coingecko-market-page-${page}`,
        success: true,
        recordsProcessed: marketData.length,
        duration: Date.now() - start,
      });
      console.log(`✅ Market data page ${page}: ${marketData.length} coins`);
    } catch (error) {
      results.push({
        source: `coingecko-market-page-${page}`,
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start,
      });
      console.error(`❌ Market data page ${page} failed:`, error);
    }
    await new Promise(r => setTimeout(r, 2000)); // Rate limit
  }

  // 2. Fear & Greed Index
  {
    const start = Date.now();
    try {
      const fearGreed = await fetchFearGreedIndex();
      await storeFearGreedData(fearGreed);
      results.push({
        source: 'fear-greed-index',
        success: true,
        recordsProcessed: 1,
        duration: Date.now() - start,
      });
      console.log(`✅ Fear & Greed Index: ${fearGreed.value} (${fearGreed.classification})`);
    } catch (error) {
      results.push({
        source: 'fear-greed-index',
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start,
      });
      console.error('❌ Fear & Greed failed:', error);
    }
  }

  // 3. Global Market Data
  {
    const start = Date.now();
    try {
      const globalData = await fetchGlobalData();
      await storeGlobalData(globalData);
      results.push({
        source: 'global-metrics',
        success: true,
        recordsProcessed: 1,
        duration: Date.now() - start,
      });
      console.log('✅ Global metrics stored');
    } catch (error) {
      results.push({
        source: 'global-metrics',
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start,
      });
      console.error('❌ Global metrics failed:', error);
    }
    await new Promise(r => setTimeout(r, 1000));
  }

  // 4. DeFi Protocols
  {
    const start = Date.now();
    try {
      const protocols = await fetchDeFiProtocols();
      await storeDeFiData(protocols);
      results.push({
        source: 'defi-protocols',
        success: true,
        recordsProcessed: protocols.length,
        duration: Date.now() - start,
      });
      console.log(`✅ DeFi protocols: ${protocols.length}`);
    } catch (error) {
      results.push({
        source: 'defi-protocols',
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start,
      });
      console.error('❌ DeFi protocols failed:', error);
    }
  }

  // 5. Trending Coins
  {
    const start = Date.now();
    try {
      const trending = await fetchTrendingCoins();
      await storeTrendingCoins(trending);
      results.push({
        source: 'trending-coins',
        success: true,
        recordsProcessed: trending.length,
        duration: Date.now() - start,
      });
      console.log(`✅ Trending coins: ${trending.length}`);
    } catch (error) {
      results.push({
        source: 'trending-coins',
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start,
      });
      console.error('❌ Trending coins failed:', error);
    }
  }

  // 6. Bitcoin On-Chain (if available)
  {
    const start = Date.now();
    try {
      const btcOnChain = await fetchBitcoinOnChain();

      const blockHeightText = btcOnChain.blockHeight ?? 'Unavailable';
      const hashRateEh =
        typeof btcOnChain.hashRate === 'number'
          ? `${(btcOnChain.hashRate / 1e18).toFixed(2)} EH/s`
          : 'Unavailable';
      const txCountText =
        typeof btcOnChain.transactionCount24h === 'number'
          ? btcOnChain.transactionCount24h.toLocaleString()
          : 'Unavailable';

      const chunk: DataChunk = {
        content: `Bitcoin on-chain metrics: Block height ${blockHeightText}, hash rate ${hashRateEh}, ${txCountText} transactions (24h).`,
        contentType: 'onchain_metrics',
        categoryPath: 'onchain/bitcoin',
        coinSymbol: 'BTC',
        source: 'blockchain.info',
        dataDate: new Date(),
      };
      await storeChunks([chunk]);
      
      results.push({
        source: 'bitcoin-onchain',
        success: true,
        recordsProcessed: 1,
        duration: Date.now() - start,
      });
      console.log('✅ Bitcoin on-chain metrics stored');
    } catch (error) {
      results.push({
        source: 'bitcoin-onchain',
        success: false,
        recordsProcessed: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - start,
      });
      console.error('❌ Bitcoin on-chain failed:', error);
    }
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const totalRecords = results.reduce((sum, r) => sum + r.recordsProcessed, 0);
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`\n📊 Sync Complete: ${successful}/${results.length} sources, ${totalRecords} records, ${(totalDuration / 1000).toFixed(1)}s`);
  
  return results;
}

// ============================================
// HISTORICAL DATA BACKFILL
// ============================================

export async function backfillHistoricalData(): Promise<void> {
  console.log('📚 Starting historical data backfill...');
  
  // Backfill Fear & Greed history
  try {
    const history = await fetchFearGreedHistory(365);
    for (const data of history) {
      await storeFearGreedData(data);
    }
    console.log(`✅ Backfilled ${history.length} days of Fear & Greed history`);
  } catch (error) {
    console.error('❌ Fear & Greed history backfill failed:', error);
  }
  
  // Backfill top coin historical prices
  const topCoins = ['bitcoin', 'ethereum', 'solana', 'cardano', 'ripple'];
  
  for (const coinId of topCoins) {
    try {
      const historical = await fetchHistoricalData(coinId, 365);
      
      // Store as time series
      const chunks: DataChunk[] = [];
      
      // Sample every 7 days for RAG (too much data otherwise)
      for (let i = 0; i < historical.prices.length; i += 7) {
        const [timestamp, price] = historical.prices[i];
        const date = new Date(timestamp);
        
        chunks.push({
          content: `${coinId.toUpperCase()} price on ${date.toISOString().split('T')[0]}: $${price.toLocaleString()}`,
          contentType: 'historical_price',
          categoryPath: `market/history/${coinId}`,
          coinSymbol: coinId.toUpperCase().slice(0, 3),
          source: 'coingecko',
          dataDate: date,
        });
      }
      
      await storeChunks(chunks);
      console.log(`✅ Backfilled ${coinId}: ${chunks.length} data points`);
      
      await new Promise(r => setTimeout(r, 2000)); // Rate limit
    } catch (error) {
      console.error(`❌ ${coinId} backfill failed:`, error);
    }
  }
}

// ============================================
// SCHEDULED SYNC INTERVALS
// ============================================

export const SYNC_SCHEDULES = {
  // Real-time (every 5 minutes)
  realtime: {
    interval: 5 * 60 * 1000,
    tasks: ['market-data-top-100', 'fear-greed'],
  },
  
  // Frequent (every 15 minutes)
  frequent: {
    interval: 15 * 60 * 1000,
    tasks: ['global-metrics', 'trending'],
  },
  
  // Hourly
  hourly: {
    interval: 60 * 60 * 1000,
    tasks: ['defi-protocols', 'chain-tvl', 'yields'],
  },
  
  // Daily
  daily: {
    interval: 24 * 60 * 60 * 1000,
    tasks: ['historical-backfill', 'daily-summaries'],
  },
};

// ============================================
// EXPORT SYNC RUNNER
// ============================================

let syncInterval: NodeJS.Timeout | null = null;

export function startContinuousSync(intervalMinutes: number = 5): void {
  if (syncInterval) {
    console.log('Sync already running');
    return;
  }
  
  console.log(`🔄 Starting continuous sync every ${intervalMinutes} minutes`);
  
  // Run immediately
  syncAllData();
  
  // Then on interval
  syncInterval = setInterval(() => {
    syncAllData();
  }, intervalMinutes * 60 * 1000);
}

export function stopContinuousSync(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log('⏹️ Continuous sync stopped');
  }
}

export default {
  syncAllData,
  backfillHistoricalData,
  startContinuousSync,
  stopContinuousSync,
  fetchMarketData,
  fetchFearGreedIndex,
  fetchDeFiProtocols,
  fetchGlobalData,
  fetchTrendingCoins,
};
