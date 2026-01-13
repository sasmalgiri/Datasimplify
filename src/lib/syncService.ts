// ============================================
// DATA SYNC SERVICE
// Fetches from external APIs → Saves to Supabase
// ============================================
// Run this on a schedule (cron job) to keep data fresh
// Users then query Supabase instead of external APIs
//
// NOTE ON LICENSING:
// Some upstream data sources may restrict commercial use, caching, or redistribution.
// This module respects feature flags to avoid accidentally syncing higher-risk domains.
// ============================================

import { supabaseAdmin, isSupabaseConfigured } from './supabase';
import { fetchMarketOverview } from './dataApi';
import {
  fetchTopDeFiProtocols,
  fetchYieldData,
  fetchStablecoinData,
  fetchDeFiTVL,
  fetchFearGreedIndex,
  fetchBitcoinStats,
  fetchEthGasPrices
} from './onChainData';
import { aggregateAllSentiment } from './comprehensiveSentiment';
import { getWhaleDashboard } from './whaleTracking';
import { SUPPORTED_COINS } from './dataTypes';
// Provider API imports (terms vary by provider)
import { fetchAllCoinLoreCoins, transformCoinLoreToInternal, COINLORE_ATTRIBUTION } from './coinlore';
import { fetchFinnhubSentimentPosts, isFinnhubConfigured, FINNHUB_ATTRIBUTION } from './finnhub';
import { isFeatureEnabled } from './featureFlags';

// Check if Supabase is configured
function checkSupabaseAdmin() {
  if (!isSupabaseConfigured || !supabaseAdmin) {
    throw new Error('Supabase not configured. Set environment variables first.');
  }
  return supabaseAdmin;
}

// ============================================
// SYNC STATUS TRACKING
// ============================================

async function logSyncStart(dataType: string): Promise<string> {
  const { data } = await checkSupabaseAdmin()
    .from('sync_log')
    .insert({
      data_type: dataType,
      status: 'running',
      started_at: new Date().toISOString()
    })
    .select('id')
    .single();
  
  return data?.id || '';
}

async function logSyncComplete(logId: string, recordsSynced: number, error?: string) {
  await checkSupabaseAdmin()
    .from('sync_log')
    .update({
      status: error ? 'failed' : 'success',
      records_synced: recordsSynced,
      error_message: error,
      completed_at: new Date().toISOString()
    })
    .eq('id', logId);
}

// ============================================
// DAILY SUMMARY GENERATION (AI-Powered)
// ============================================

async function saveDailySummary(
  category: string,
  summary: string,
  keyPoints: string[],
  sentimentScore: number,
  sentimentLabel: string,
  metrics?: Record<string, number>
): Promise<void> {
  const today = new Date().toISOString().split('T')[0];

  try {
    await checkSupabaseAdmin()
      .from('daily_summaries')
      .upsert({
        summary_date: today,
        category,
        summary,
        key_points: keyPoints,
        sentiment_score: sentimentScore,
        sentiment_label: sentimentLabel,
        metrics: metrics || {},
        created_at: new Date().toISOString(),
      }, { onConflict: 'summary_date,category' });

    console.log(`📝 Saved ${category} daily summary`);
  } catch (error) {
    console.error(`Failed to save ${category} summary:`, error);
  }
}

async function shouldGenerateDailySummary(category: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];

  try {
    const { data } = await checkSupabaseAdmin()
      .from('daily_summaries')
      .select('id')
      .eq('summary_date', today)
      .eq('category', category)
      .single();

    return !data; // Generate if no summary exists for today
  } catch {
    return true; // Generate on error (likely no row found)
  }
}

// ============================================
// 0. SYNC COINGECKO MARKET DATA (Every 5 minutes)
// For Compare page and other CoinGecko-dependent features
// ============================================

export async function syncCoinGeckoData(): Promise<{ success: boolean; count: number; error?: string }> {
  const logId = await logSyncStart('coingecko_market');

  try {
    console.log('🪙 Syncing CoinGecko market data...');

    // Fetch multiple pages to get more coins (250 per page, 4 pages = 1000 coins)
    const PAGES_TO_FETCH = 4; // Adjust: 1=250, 2=500, 3=750, 4=1000 coins
    const allCoins: Array<{
      id: string;
      symbol: string;
      name: string;
      current_price: number;
      market_cap: number;
      market_cap_rank: number;
      price_change_24h: number;
      price_change_percentage_24h: number;
      price_change_percentage_7d_in_currency?: number;
      price_change_percentage_30d_in_currency?: number;
      price_change_percentage_1y_in_currency?: number;
      total_volume: number;
      circulating_supply: number;
      total_supply: number;
      max_supply: number | null;
      ath: number;
      atl: number;
      image: string;
    }> = [];

    for (let page = 1; page <= PAGES_TO_FETCH; page++) {
      console.log(`📄 Fetching page ${page}/${PAGES_TO_FETCH}...`);

      const response = await fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=${page}&sparkline=false&price_change_percentage=24h,7d,30d,1y`,
        {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 300 },
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          console.log(`⚠️ Rate limited on page ${page}, continuing with ${allCoins.length} coins...`);
          break; // Use what we have so far
        }
        throw new Error(`CoinGecko API error: ${response.status}`);
      }

      const pageCoins = await response.json();

      if (!Array.isArray(pageCoins) || pageCoins.length === 0) {
        console.log(`📄 Page ${page} returned no coins, stopping pagination`);
        break;
      }

      allCoins.push(...pageCoins);

      // Rate limit protection: wait 2 seconds between requests
      if (page < PAGES_TO_FETCH) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    if (allCoins.length === 0) {
      throw new Error('No CoinGecko data received');
    }

    const coins = allCoins;

    // Transform to our cache format - store CoinGecko ID!
    const timestamp = new Date().toISOString();
    const records = coins.map((coin: {
      id: string;
      symbol: string;
      name: string;
      current_price: number;
      market_cap: number;
      market_cap_rank: number;
      price_change_24h: number;
      price_change_percentage_24h: number;
      price_change_percentage_7d_in_currency?: number;
      price_change_percentage_30d_in_currency?: number;
      price_change_percentage_1y_in_currency?: number;
      total_volume: number;
      circulating_supply: number;
      total_supply: number;
      max_supply: number | null;
      ath: number;
      atl: number;
      image: string;
    }) => ({
      symbol: coin.symbol.toUpperCase(),
      coingecko_id: coin.id, // Critical: store CoinGecko ID for cache matching
      name: coin.name,
      price: coin.current_price,
      market_cap: coin.market_cap,
      rank: coin.market_cap_rank,
      price_change_24h: coin.price_change_percentage_24h || 0,
      price_change_7d: coin.price_change_percentage_7d_in_currency || 0,
      price_change_30d: coin.price_change_percentage_30d_in_currency || 0,
      price_change_1y: coin.price_change_percentage_1y_in_currency || 0,
      volume_24h: coin.total_volume || 0,
      circulating_supply: coin.circulating_supply || 0,
      total_supply: coin.total_supply || null,
      max_supply: coin.max_supply || null,
      ath: coin.ath || null,
      atl: coin.atl || null,
      image_url: coin.image,
      updated_at: timestamp,
      fetched_at: timestamp
    }));

    // Upsert to Supabase
    const { error } = await checkSupabaseAdmin()
      .from('market_data')
      .upsert(records, { onConflict: 'symbol' });

    if (error) throw error;

    console.log(`✅ Synced ${records.length} coins from CoinGecko`);
    await logSyncComplete(logId, records.length);

    return { success: true, count: records.length };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ CoinGecko sync failed:', errorMsg);
    await logSyncComplete(logId, 0, errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

// ============================================
// 0b. SYNC COINLORE MARKET DATA (Commercial Alternative)
// FREE API - No API key (terms apply; verify commercial usage rights)
// ============================================

export async function syncCoinLoreData(): Promise<{ success: boolean; count: number; error?: string }> {
  const logId = await logSyncStart('coinlore_market');

  try {
    console.log(`🪙 Syncing CoinLore market data... (${COINLORE_ATTRIBUTION.license})`);

    // Fetch coins from CoinLore (up to 500 for free tier)
    const coins = await fetchAllCoinLoreCoins(500);

    if (coins.length === 0) {
      throw new Error('No CoinLore data received');
    }

    // Transform to our cache format
    const timestamp = new Date().toISOString();
    const records = coins.map(coin => {
      const transformed = transformCoinLoreToInternal(coin);
      return {
        symbol: transformed.symbol,
        coinlore_id: transformed.coinlore_id,
        name: transformed.name,
        price: transformed.price,
        market_cap: transformed.market_cap,
        rank: transformed.rank,
        price_change_24h: transformed.price_change_24h,
        price_change_7d: transformed.price_change_7d,
        volume_24h: transformed.volume_24h,
        circulating_supply: transformed.circulating_supply,
        total_supply: transformed.total_supply,
        max_supply: transformed.max_supply,
        image_url: `https://www.coinlore.com/img/${coin.nameid}.png`,
        data_source: 'coinlore', // Track data source for attribution
        updated_at: timestamp,
        fetched_at: timestamp
      };
    });

    // Upsert to Supabase
    const { error } = await checkSupabaseAdmin()
      .from('market_data')
      .upsert(records, { onConflict: 'symbol' });

    if (error) throw error;

    console.log(`✅ Synced ${records.length} coins from CoinLore (Commercial API)`);
    await logSyncComplete(logId, records.length);

    return { success: true, count: records.length };

  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ CoinLore sync failed:', errorMsg);
    await logSyncComplete(logId, 0, errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

// ============================================
// 1. SYNC MARKET DATA (Every 1 minute)
// ============================================

export async function syncMarketData(): Promise<{ success: boolean; count: number; error?: string }> {
  const logId = await logSyncStart('market_data');
  
  try {
    console.log('📊 Syncing market data...');
    
    // Fetch from Binance API
    const marketData = await fetchMarketOverview();
    
    if (!marketData || marketData.length === 0) {
      throw new Error('No market data received');
    }
    
    // Transform to Supabase format
    const records = marketData.map(coin => ({
      symbol: coin.symbol,
      name: coin.name,
      price: coin.price,
      price_change_24h: coin.priceChange24h,
      price_change_percent_24h: coin.priceChangePercent24h,
      high_24h: coin.high24h,
      low_24h: coin.low24h,
      volume_24h: coin.volume24h,
      quote_volume_24h: coin.quoteVolume24h,
      market_cap: coin.marketCap,
      circulating_supply: coin.circulatingSupply,
      max_supply: coin.maxSupply,
      bid_price: coin.bidPrice,
      ask_price: coin.askPrice,
      spread: coin.spread,
      category: coin.category,
      image_url: SUPPORTED_COINS.find(c => c.symbol === coin.symbol)?.image,
      updated_at: new Date().toISOString()
    }));
    
    // Upsert to Supabase (insert or update)
    const { error } = await checkSupabaseAdmin()
      .from('market_data')
      .upsert(records, { onConflict: 'symbol' });
    
    if (error) throw error;
    
    console.log(`✅ Synced ${records.length} coins`);

    await logSyncComplete(logId, records.length);

    return { success: true, count: records.length };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Market data sync failed:', errorMsg);
    await logSyncComplete(logId, 0, errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

// ============================================
// 2. SYNC DEFI DATA (Every 10 minutes)
// ============================================

export async function syncDefiData(): Promise<{ success: boolean; count: number; error?: string }> {
  const logId = await logSyncStart('defi_data');
  
  try {
    console.log('🏦 Syncing DeFi data...');
    
    // Fetch DeFi protocols
    const protocols = await fetchTopDeFiProtocols(100);
    
    const protocolRecords = protocols.map(p => ({
      name: p.name,
      symbol: p.symbol,
      chain: p.chain,
      category: p.category,
      tvl: p.tvl,
      tvl_change_24h: p.tvlChange24h,
      tvl_change_7d: p.tvlChange7d,
      updated_at: new Date().toISOString()
    }));
    
    const { error: protocolError } = await checkSupabaseAdmin()
      .from('defi_protocols')
      .upsert(protocolRecords, { onConflict: 'name' });
    
    if (protocolError) throw protocolError;
    
    // Fetch yields
    const yields = await fetchYieldData(100);
    
    const yieldRecords = yields.pools.map(y => ({
      protocol: y.protocol,
      chain: y.chain,
      pool_symbol: y.symbol,
      tvl: y.tvl,
      apy: y.apy,
      apy_base: y.apyBase,
      apy_reward: y.apyReward,
      updated_at: new Date().toISOString()
    }));
    
    const { error: yieldError } = await checkSupabaseAdmin()
      .from('defi_yields')
      .upsert(yieldRecords, { onConflict: 'protocol,chain,pool_symbol' });
    
    if (yieldError) throw yieldError;
    
    // Fetch chain TVL
    const chainTvl = await fetchDeFiTVL();
    
    const chainRecords = chainTvl.chains.map(c => ({
      chain: c.name,
      tvl: c.tvl,
      dominance: (c.tvl / chainTvl.totalTVL) * 100,
      updated_at: new Date().toISOString()
    }));
    
    const { error: chainError } = await checkSupabaseAdmin()
      .from('chain_tvl')
      .upsert(chainRecords, { onConflict: 'chain' });
    
    if (chainError) throw chainError;
    
    // Fetch stablecoins
    const stableData = await fetchStablecoinData();
    
    const stableRecords = stableData.stablecoins.map(s => ({
      name: s.name,
      symbol: s.symbol,
      chain: s.chain,
      market_cap: s.marketCap,
      updated_at: new Date().toISOString()
    }));
    
    const { error: stableError } = await checkSupabaseAdmin()
      .from('stablecoins')
      .upsert(stableRecords, { onConflict: 'symbol' });
    
    if (stableError) throw stableError;
    
    const totalCount = protocolRecords.length + yieldRecords.length + chainRecords.length + stableRecords.length;
    console.log(`✅ Synced ${totalCount} DeFi records`);
    await logSyncComplete(logId, totalCount);
    
    return { success: true, count: totalCount };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ DeFi sync failed:', errorMsg);
    await logSyncComplete(logId, 0, errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

// ============================================
// 3. SYNC SENTIMENT DATA (Every 15 minutes)
// Uses Finnhub + other sources; ensure terms/rights are acceptable before enabling.
// ============================================

export async function syncSentimentData(): Promise<{ success: boolean; count: number; error?: string }> {
  const logId = await logSyncStart('sentiment');

  try {
    console.log('💬 Syncing sentiment data...');
    console.log(`📊 Data sources: ${FINNHUB_ATTRIBUTION.name}, CryptoPanic, RSS Feeds (terms vary by source)`);

    // Fetch aggregated sentiment from multiple sources.
    // aggregateAllSentiment uses: CryptoPanic, RSS, 4chan (terms vary; enable only if acceptable)
    // We add Finnhub for additional coverage when configured.
    const sentiment = await aggregateAllSentiment();

    // If Finnhub is configured, also fetch from there
    let finnhubPosts: Awaited<ReturnType<typeof fetchFinnhubSentimentPosts>> = [];
    if (isFinnhubConfigured()) {
      console.log(`📰 Fetching Finnhub sentiment... (${FINNHUB_ATTRIBUTION.license})`);
      finnhubPosts = await fetchFinnhubSentimentPosts();
      console.log(`✅ Got ${finnhubPosts.length} posts from Finnhub`);
    }
    
    // Save market sentiment
    const { error: marketError } = await checkSupabaseAdmin()
      .from('market_sentiment')
      .insert({
        overall_score: sentiment.overallScore,
        overall_label: sentiment.overallLabel,
        fear_greed_index: 50, // Will be updated separately
        fear_greed_label: 'Neutral',
        total_posts_analyzed: sentiment.totalPosts,
        confidence: sentiment.confidence,
        by_source: sentiment.bySource,
        trending_topics: sentiment.trendingTopics,
        recorded_at: new Date().toISOString()
      });
    
    if (marketError) throw marketError;
    
    // Save per-coin sentiment
    const coinRecords = Object.entries(sentiment.byCoin).map(([symbol, data]) => ({
      symbol,
      sentiment_score: data.sentiment,
      sentiment_label: data.sentiment > 20 ? 'bullish' : data.sentiment < -20 ? 'bearish' : 'neutral',
      social_volume: data.volume,
      is_trending: data.trending,
      updated_at: new Date().toISOString()
    }));
    
    const { error: coinError } = await checkSupabaseAdmin()
      .from('coin_sentiment')
      .upsert(coinRecords, { onConflict: 'symbol' });
    
    if (coinError) throw coinError;
    
    // Save individual posts (for historical analysis)
    // Combine posts from configured sources
    const allPosts = [
      ...sentiment.topBullish,
      ...sentiment.topBearish,
      ...finnhubPosts,
    ].slice(0, 100); // Limit to top 100
    
    const postRecords = allPosts.map(post => ({
      external_id: post.id,
      source: post.source,
      platform: post.platform,
      title: post.title,
      content: post.content?.slice(0, 500),
      url: post.url,
      author: post.author,
      sentiment_score: post.sentiment.score,
      sentiment_label: post.sentiment.label,
      confidence: post.sentiment.confidence,
      likes: post.engagement.likes,
      comments: post.engagement.comments,
      coins_mentioned: post.coins,
      keywords: post.keywords,
      posted_at: post.timestamp
    }));
    
    const { error: postError } = await checkSupabaseAdmin()
      .from('sentiment_posts')
      .upsert(postRecords, { onConflict: 'source,external_id' });
    
    if (postError) throw postError;
    
    // Fetch and save Fear & Greed
    const fearGreed = await fetchFearGreedIndex();

    if (fearGreed.value == null) {
      console.log('ℹ️ Fear & Greed unavailable; skipping history upsert');
      const totalCount = 1 + coinRecords.length + postRecords.length;
      console.log(`✅ Synced ${totalCount} sentiment records`);
      await logSyncComplete(logId, totalCount);
      return { success: true, count: totalCount };
    }
    
    const { error: fgError } = await checkSupabaseAdmin()
      .from('fear_greed_history')
      .upsert({
        value: fearGreed.value,
        label: fearGreed.label,
        recorded_at: new Date().toISOString().split('T')[0]
      }, { onConflict: 'recorded_at' });
    
    if (fgError) throw fgError;
    
    const totalCount = 1 + coinRecords.length + postRecords.length + 1;
    console.log(`✅ Synced ${totalCount} sentiment records`);
    await logSyncComplete(logId, totalCount);
    
    return { success: true, count: totalCount };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Sentiment sync failed:', errorMsg);
    await logSyncComplete(logId, 0, errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

// ============================================
// 4. SYNC WHALE DATA (Every 5 minutes)
// ============================================

export async function syncWhaleData(): Promise<{ success: boolean; count: number; error?: string }> {
  const logId = await logSyncStart('whales');
  
  try {
    console.log('🐋 Syncing whale data...');
    
    const whaleDashboard = await getWhaleDashboard();
    
    // Save whale transactions
    const txRecords = whaleDashboard.recentWhaleTransactions.map(tx => ({
      tx_hash: tx.hash,
      blockchain: tx.blockchain,
      from_address: tx.from,
      from_label: tx.fromLabel,
      to_address: tx.to,
      to_label: tx.toLabel,
      amount: tx.amount,
      amount_usd: tx.amountUsd,
      symbol: tx.symbol,
      tx_type: tx.type,
      tx_time: tx.timestamp
    }));
    
    const { error: txError } = await checkSupabaseAdmin()
      .from('whale_transactions')
      .upsert(txRecords, { onConflict: 'tx_hash' });
    
    if (txError) throw txError;
    
    // Save exchange balances
    const balanceRecords = whaleDashboard.exchangeBalances.map(b => ({
      exchange: b.label,
      wallet_address: b.address,
      balance: b.balance,
      balance_usd: b.balanceUsd,
      symbol: 'ETH',
      recorded_at: new Date().toISOString()
    }));
    
    // Insert (not upsert) to build history
    const { error: balanceError } = await checkSupabaseAdmin()
      .from('exchange_balances')
      .insert(balanceRecords);
    
    if (balanceError) throw balanceError;
    
    // Save exchange flows
    const flowRecords = whaleDashboard.exchangeFlows.map(f => ({
      exchange: f.exchange,
      inflow_24h: f.inflow24h,
      outflow_24h: f.outflow24h,
      net_flow_24h: f.netFlow24h,
      inflow_usd_24h: f.inflowUsd24h,
      outflow_usd_24h: f.outflowUsd24h,
      net_flow_usd_24h: f.netFlowUsd24h,
      updated_at: new Date().toISOString()
    }));
    
    const { error: flowError } = await checkSupabaseAdmin()
      .from('exchange_flows')
      .upsert(flowRecords, { onConflict: 'exchange' });
    
    if (flowError) throw flowError;
    
    const totalCount = txRecords.length + balanceRecords.length + flowRecords.length;
    console.log(`✅ Synced ${totalCount} whale records`);
    await logSyncComplete(logId, totalCount);
    
    return { success: true, count: totalCount };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Whale sync failed:', errorMsg);
    await logSyncComplete(logId, 0, errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

// ============================================
// 5. SYNC ON-CHAIN METRICS (Every 10 minutes)
// ============================================

export async function syncOnChainMetrics(): Promise<{ success: boolean; count: number; error?: string }> {
  const logId = await logSyncStart('onchain');
  
  try {
    console.log('⛓️ Syncing on-chain metrics...');
    
    // Bitcoin stats
    const btcStats = await fetchBitcoinStats();
    
    const { error: btcError } = await checkSupabaseAdmin()
      .from('bitcoin_stats')
      .insert({
        hash_rate: btcStats.hashRate,
        difficulty: btcStats.difficulty,
        block_height: btcStats.blockHeight,
        avg_block_time: btcStats.avgBlockTime,
        unconfirmed_txs: btcStats.unconfirmedTxs,
        mempool_size: btcStats.memPoolSize,
        recorded_at: new Date().toISOString()
      });
    
    if (btcError) throw btcError;
    
    // ETH gas prices
    const gasData = await fetchEthGasPrices();
    
    const { error: gasError } = await checkSupabaseAdmin()
      .from('eth_gas_prices')
      .insert({
        slow_gwei: gasData.slow,
        standard_gwei: gasData.standard,
        fast_gwei: gasData.fast,
        base_fee_gwei: gasData.baseFee,
        recorded_at: new Date().toISOString()
      });
    
    if (gasError) throw gasError;
    
    console.log('✅ Synced on-chain metrics');
    await logSyncComplete(logId, 2);
    
    return { success: true, count: 2 };
    
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ On-chain sync failed:', errorMsg);
    await logSyncComplete(logId, 0, errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

// ============================================
// MASTER SYNC FUNCTION
// ============================================

export async function syncAllData(): Promise<{
  success: boolean;
  results: Record<string, { success: boolean; count: number; error?: string }>;
}> {
  console.log('🔄 Starting full data sync...');
  console.log('⏰', new Date().toISOString());

  const results: Record<string, { success: boolean; count: number; error?: string }> = {
    // Lower-risk core syncs
    coinLore: await syncCoinLoreData(),
    marketData: await syncMarketData(),
    onchain: await syncOnChainMetrics(),
  };

  // Optional domains (explicitly enabled)
  if (isFeatureEnabled('coingecko')) {
    results.coingecko = await syncCoinGeckoData();
  }
  if (isFeatureEnabled('defi')) {
    results.defiData = await syncDefiData();
  }
  if (isFeatureEnabled('socialSentiment')) {
    results.sentiment = await syncSentimentData();
  }
  if (isFeatureEnabled('whales')) {
    results.whales = await syncWhaleData();
  }
  
  const allSuccess = Object.values(results).every(r => r.success);
  
  console.log('');
  console.log('📊 Sync Summary:');
  console.log('================');
  for (const [key, result] of Object.entries(results)) {
    console.log(`${result.success ? '✅' : '❌'} ${key}: ${result.count} records`);
  }
  console.log('');
  
  return { success: allSuccess, results };
}

// ============================================
// SCHEDULED SYNC INTERVALS
// ============================================

export const SYNC_INTERVALS = {
  coinlore: 5 * 60 * 1000,       // 5 minutes (CoinLore - check terms)
  coingecko: 5 * 60 * 1000,      // 5 minutes (CoinGecko - check terms)
  market_data: 60 * 1000,        // 1 minute (Binance - check terms)
  defi_data: 10 * 60 * 1000,     // 10 minutes (DeFi providers - check terms)
  sentiment: 15 * 60 * 1000,     // 15 minutes (Sentiment sources - check terms)
  whales: 5 * 60 * 1000,         // 5 minutes (Explorer providers - check terms)
  onchain: 10 * 60 * 1000,       // 10 minutes (On-chain public endpoints - check terms)
};

// Start all sync jobs (for local development)
// Uses a mix of providers; ensure terms/rights are acceptable
export function startSyncJobs() {
  console.log('🚀 Starting sync jobs...');

  // Initial sync
  syncAllData();

  // Schedule recurring syncs
  setInterval(syncCoinLoreData, SYNC_INTERVALS.coinlore);
  setInterval(syncMarketData, SYNC_INTERVALS.market_data);
  setInterval(syncOnChainMetrics, SYNC_INTERVALS.onchain);

  if (isFeatureEnabled('coingecko')) {
    setInterval(syncCoinGeckoData, SYNC_INTERVALS.coingecko);
  }
  if (isFeatureEnabled('defi')) {
    setInterval(syncDefiData, SYNC_INTERVALS.defi_data);
  }
  if (isFeatureEnabled('socialSentiment')) {
    setInterval(syncSentimentData, SYNC_INTERVALS.sentiment);
  }
  if (isFeatureEnabled('whales')) {
    setInterval(syncWhaleData, SYNC_INTERVALS.whales);
  }

  console.log('✅ Sync jobs scheduled (feature-flag aware)');
}

// ============================================
// DATA SOURCE ATTRIBUTIONS (Required for commercial use)
// ============================================

export const DATA_ATTRIBUTIONS = {
  coinlore: COINLORE_ATTRIBUTION,
  finnhub: FINNHUB_ATTRIBUTION,
  defillama: {
    name: 'DefiLlama',
    url: 'https://defillama.com',
    license: 'Public data (terms apply)',
    note: 'DeFi TVL and protocol data',
  },
  binance: {
    name: 'Binance',
    url: 'https://binance.com',
    license: 'Public API (terms apply)',
    note: 'Real-time trading data',
  },
  etherscan: {
    name: 'Etherscan',
    url: 'https://etherscan.io',
    license: 'API access (terms apply)',
    note: 'Ethereum blockchain data and whale tracking',
  },
  blockchair: {
    name: 'Blockchair',
    url: 'https://blockchair.com',
    license: 'API access (terms apply)',
    note: 'Bitcoin blockchain data',
  },
  alternativeme: {
    name: 'Alternative.me',
    url: 'https://alternative.me',
    license: 'API (terms apply; verify commercial usage rights)',
    note: 'Fear & Greed Index',
  },
};
