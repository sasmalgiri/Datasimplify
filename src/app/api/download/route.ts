import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';
import {
  fetchMarketOverview,
  fetchHistoricalPrices,
  fetchOrderBook,
  fetchRecentTrades,
  fetchGlobalStats,
  fetchGainersLosers,
  fetchCategoryStats,
  fetchExchangeInfo,
} from '@/lib/dataApi';
import {
  fetchTopDeFiProtocols,
  fetchYieldData,
  fetchStablecoinData,
  fetchFearGreedIndex,
  fetchDeFiTVL,
  fetchBitcoinStats,
  fetchEthGasPrices,
} from '@/lib/onChainData';
import {
  aggregateAllSentiment,
  getCoinDeepSentiment,
  fetchRedditSentiment,
  fetchCryptoPanicSentiment,
} from '@/lib/comprehensiveSentiment';
import {
  getWhaleDashboard,
  estimateExchangeFlows,
} from '@/lib/whaleTracking';
import {
  fetchFundingRatesForDownload,
  fetchOpenInterestForDownload,
  fetchLongShortRatioForDownload,
  fetchLiquidationsForDownload,
} from '@/lib/derivativesData';
import {
  fetchTechnicalIndicatorsForDownload,
  fetchCorrelationMatrixForDownload,
  fetchSupportResistanceForDownload,
} from '@/lib/technicalIndicators';
import {
  fetchTokenUnlocksForDownload,
  fetchStakingRewardsForDownload,
} from '@/lib/tokenUnlocks';
import {
  fetchNFTCollectionsForDownload,
  fetchNFTStatsForDownload,
} from '@/lib/nftData';
import { DataCategory } from '@/lib/dataTypes';
// Supabase cache imports - Use cached data first, fallback to direct API
import { isSupabaseConfigured, supabaseAdmin } from '@/lib/supabase';
import { getMarketDataFromCache } from '@/lib/supabaseData';
import { validationError, internalError, validateEnum } from '@/lib/apiErrors';
import { enforceMinInterval } from '@/lib/serverRateLimit';
import { logDownloadEvent } from '@/lib/downloadTracking';
import { isDownloadCategoryEnabled } from '@/lib/featureFlags';

// Valid export formats
const VALID_FORMATS = ['xlsx', 'csv', 'json', 'iqy'] as const;

function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

async function resolveTierFromBearerToken(req: Request): Promise<'free' | 'starter' | 'pro' | 'business'> {
  const authHeader = req.headers.get('authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = match?.[1];
  if (!token) return 'free';

  if (!isSupabaseConfigured || !supabaseAdmin) return 'free';

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim();
  const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();
  if (!supabaseUrl || !supabaseAnonKey) return 'free';

  try {
    const authClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const { data: userData, error: userError } = await authClient.auth.getUser(token);
    if (userError || !userData?.user?.id) return 'free';

    const userId = userData.user.id;
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('subscription_tier')
      .eq('id', userId)
      .single();

    const tier = (profile?.subscription_tier || 'free') as 'free' | 'starter' | 'pro' | 'business';
    return tier;
  } catch {
    return 'free';
  }
}

// Valid data categories
const VALID_CATEGORIES = [
  'market_overview', 'historical_prices', 'order_book', 'recent_trades',
  'global_stats', 'gainers_losers', 'categories', 'exchange_info',
  'defi_protocols', 'defi_yields', 'stablecoins', 'fear_greed', 'chain_tvl',
  'bitcoin_onchain', 'eth_gas', 'sentiment_aggregated', 'sentiment_reddit',
  'sentiment_news', 'sentiment_coin', 'whale_transactions', 'exchange_flows',
  'funding_rates', 'open_interest', 'long_short_ratio', 'liquidations',
  'technical_indicators', 'correlation_matrix', 'support_resistance',
  'token_unlocks', 'staking_rewards', 'nft_collections', 'nft_stats'
] as const;

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const { searchParams } = requestUrl;

  // Get parameters
  const category = searchParams.get('category') || 'market_overview';
  const format = searchParams.get('format') || 'xlsx';
  const preview = searchParams.get('preview') === 'true';
  const excelMode = searchParams.get('excel') === 'true';

  // Optional: restrict output columns
  const fields = searchParams
    .get('fields')
    ?.split(',')
    .map(f => f.trim())
    .filter(Boolean);

  // IQY: one-click Excel Web Query. It points to this same endpoint as CSV in "excel mode".
  if (format === 'iqy') {
    const csvUrl = new URL(requestUrl.toString());
    csvUrl.searchParams.set('format', 'csv');
    csvUrl.searchParams.delete('preview');
    csvUrl.searchParams.set('excel', 'true');

    const iqy = `WEB\n1\n${csvUrl.toString()}\n`;

    const filename = `datasimplify_${category}.iqy`;
    logDownloadEvent({
      request,
      category,
      format: 'iqy',
      fileName: filename,
      filters: Object.fromEntries(searchParams.entries()),
    }).catch(() => {});
    return new NextResponse(iqy, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        // This file is static (just a pointer URL), so caching is safe.
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
      },
    });
  }

  // Validate format parameter
  const formatError = validateEnum(format, VALID_FORMATS, 'Format');
  if (formatError) {
    return validationError(formatError);
  }

  // Best-effort abuse protection for snapshot downloads.
  // (Excel refresh has a separate, category-parameterized min-interval limiter.)
  if (!excelMode) {
    const ip = getClientIp(request);
    const limitResult = enforceMinInterval({ key: `download:${ip}:${category}:${format}`, minIntervalMs: 1000 });
    if (!limitResult.ok) {
      return NextResponse.json(
        { error: 'Too many requests. Please wait and try again.' },
        { status: 429, headers: { 'Retry-After': String(limitResult.retryAfterSeconds) } }
      );
    }
  }

  // Validate category parameter
  const categoryError = validateEnum(category, VALID_CATEGORIES, 'Category');
  if (categoryError) {
    return validationError(categoryError);
  }

  // Feature-flag enforcement (fail closed): if a category is disabled, refuse it.
  if (!isDownloadCategoryEnabled(category)) {
    return NextResponse.json(
      {
        error: 'This data category is currently disabled.',
        category,
        disabled: true,
      },
      { status: 503 }
    );
  }

  // Category-specific parameters
  const symbols = searchParams.get('symbols')?.split(',').filter(Boolean);
  const coinCategory = searchParams.get('coinCategory');
  const sortBy = searchParams.get('sortBy') as 'market_cap' | 'volume' | 'price_change' | 'price' || 'market_cap';
  const minMarketCap = parseInt(searchParams.get('minMarketCap') || '0');
  const symbol = searchParams.get('symbol') || 'BTC';
  const interval = searchParams.get('interval') as '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w' | '1M' || '1d';
  const limit = parseInt(searchParams.get('limit') || '500');
  const depth = parseInt(searchParams.get('depth') || '20') as 5 | 10 | 20 | 50 | 100 | 500 | 1000;
  const gainerType = searchParams.get('type') as 'both' | 'gainers' | 'losers' || 'both';

  try {
    let data: Record<string, unknown>[] = [];
    let filename = `datasimplify_${category}`;

    const applyFieldSelection = (rows: Record<string, unknown>[]) => {
      if (!fields || fields.length === 0) return rows;
      return rows.map(row => {
        const filtered: Record<string, unknown> = {};
        for (const field of fields) {
          if (Object.prototype.hasOwnProperty.call(row, field)) {
            filtered[field] = row[field];
          }
        }
        return filtered;
      });
    };

    // Fetch data based on category
    switch (category) {
      case 'market_overview':
        // Try Supabase cache first, fallback to direct API
        try {
          if (isSupabaseConfigured) {
            const cachedData = await getMarketDataFromCache({
              symbols,
              category: coinCategory || undefined,
              sortBy: sortBy as 'market_cap' | 'price_change' | 'volume',
              limit: 100,
            });
            if (cachedData && cachedData.length > 0) {
              // Use cached data from Supabase
              data = cachedData.map(d => ({
                symbol: d.symbol,
                name: d.name || d.symbol,
                price: d.price,
                price_change_24h: d.price_change_24h,
                price_change_percent_24h: d.price_change_percent_24h,
                high_24h: d.high_24h,
                low_24h: d.low_24h,
                volume_24h: d.volume_24h,
                market_cap: d.market_cap,
                circulating_supply: d.circulating_supply,
                bid_price: d.bid_price,
                ask_price: d.ask_price,
                spread: d.spread,
                vwap: null,
                trades_count_24h: null,
              }));
              filename = `market_overview_${new Date().toISOString().split('T')[0]}`;
              break;
            }
          }
        } catch (cacheError) {
          console.log('Cache miss, falling back to direct API:', cacheError);
        }

        // Fallback to direct API
        const marketData = await fetchMarketOverview({
          symbols,
          category: coinCategory || undefined,
          minMarketCap,
          sortBy,
        });
        data = marketData.map(d => ({
          symbol: d.symbol,
          name: d.name,
          price: d.price,
          price_change_24h: d.priceChange24h,
          price_change_percent_24h: d.priceChangePercent24h,
          high_24h: d.high24h,
          low_24h: d.low24h,
          volume_24h: d.volume24h,
          market_cap: d.marketCap,
          circulating_supply: d.circulatingSupply,
          bid_price: d.bidPrice,
          ask_price: d.askPrice,
          spread: d.spread,
          vwap: d.vwap,
          trades_count_24h: d.tradesCount24h,
        }));
        filename = `market_overview_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'historical_prices':
        const histData = await fetchHistoricalPrices({ symbol, interval, limit });
        data = histData.map(d => ({
          symbol: d.symbol,
          timestamp: d.openTime,
          open: d.open,
          high: d.high,
          low: d.low,
          close: d.close,
          volume: d.volume,
          quote_volume: d.quoteVolume,
          trades_count: d.tradesCount,
          taker_buy_volume: d.takerBuyBaseVolume,
          taker_sell_volume: d.takerBuyQuoteVolume,
        }));
        filename = `${symbol}_${interval}_ohlcv`;
        break;

      case 'order_book':
        const orderBook = await fetchOrderBook({ symbol, limit: depth });
        if (orderBook) {
          // Create combined bids and asks
          const maxLen = Math.max(orderBook.bids.length, orderBook.asks.length);
          for (let i = 0; i < maxLen; i++) {
            const bid = orderBook.bids[i];
            const ask = orderBook.asks[i];
            data.push({
              symbol: symbol,
              bid_price: bid?.price || '',
              bid_quantity: bid?.quantity || '',
              ask_price: ask?.price || '',
              ask_quantity: ask?.quantity || '',
              spread: i === 0 ? orderBook.spread : '',
              spread_percent: i === 0 ? orderBook.spreadPercent : '',
              total_bid_volume: i === 0 ? orderBook.totalBidVolume : '',
              total_ask_volume: i === 0 ? orderBook.totalAskVolume : '',
            });
          }
        }
        filename = `${symbol}_order_book`;
        break;

      case 'recent_trades':
        const trades = await fetchRecentTrades({ symbol, limit });
        data = trades.map(t => ({
          symbol: t.symbol,
          trade_id: t.tradeId,
          price: t.price,
          quantity: t.quantity,
          quote_quantity: t.quoteQuantity,
          timestamp: t.time,
          trade_type: t.tradeType,
          is_buyer_maker: t.isBuyerMaker,
        }));
        filename = `${symbol}_recent_trades`;
        break;

      case 'global_stats':
        const globalStats = await fetchGlobalStats();
        if (globalStats) {
          data = [{
            total_market_cap: globalStats.totalMarketCap,
            total_volume_24h: globalStats.totalVolume24h,
            btc_dominance: globalStats.btcDominance,
            eth_dominance: globalStats.ethDominance,
            market_cap_change_24h: null,
            active_cryptocurrencies: globalStats.activeCryptocurrencies,
            active_markets: null,
          }];
        }
        filename = `global_stats_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'gainers_losers':
        const gainersLosers = await fetchGainersLosers({ type: gainerType, limit });
        data = gainersLosers.map(d => ({
          symbol: d.symbol,
          name: d.name,
          price: d.price,
          price_change_percent_24h: d.priceChangePercent24h,
          volume_24h: d.volume24h,
          market_cap: d.marketCap,
          rank_type: d.type.toUpperCase(),
        }));
        filename = `${gainerType}_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'categories':
        const categoryStats = await fetchCategoryStats();
        data = categoryStats.map(c => ({
          category: c.categoryName,
          coin_count: c.coinCount,
          total_market_cap: c.totalMarketCap,
          total_volume_24h: c.totalVolume24h,
          avg_price_change_24h: c.avgPriceChange24h,
          top_performers: c.topPerformer,
        }));
        filename = `category_analysis_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'exchange_info':
        const exchangeInfo = await fetchExchangeInfo();
        data = exchangeInfo.map(e => ({
          symbol: e.symbol,
          base_asset: e.baseAsset,
          quote_asset: e.quoteAsset,
          status: e.status,
          min_price: e.minPrice,
          max_price: e.maxPrice,
          tick_size: e.tickSize,
          min_qty: e.minQty,
          max_qty: e.maxQty,
          step_size: e.stepSize,
          min_notional: e.minNotional,
        }));
        filename = 'exchange_trading_info';
        break;

      // ============================================
      // ON-CHAIN DATA (Professional-grade)
      // ============================================
      
      case 'defi_protocols':
        const defiProtocols = await fetchTopDeFiProtocols(limit);
        data = defiProtocols.map((p) => ({
          name: p.name,
          chain: p.chain,
          tvl: p.tvl,
          tvl_change_24h: p.tvlChange24h,
          tvl_change_7d: p.tvlChange7d,
          category: p.category,
          symbol: p.symbol,
        }));
        filename = `defi_protocols_top${limit}`;
        break;

      case 'defi_yields':
        const yields = await fetchYieldData(limit);
        data = yields.pools.map((p) => ({
          protocol: p.protocol,
          chain: p.chain,
          symbol: p.symbol,
          tvl: p.tvl,
          apy: p.apy,
          apy_base: p.apyBase,
          apy_reward: p.apyReward,
        }));
        filename = `defi_yields_top${limit}`;
        break;

      case 'stablecoins':
        const stableData = await fetchStablecoinData();
        data = stableData.stablecoins.map((s) => ({
          name: s.name,
          symbol: s.symbol,
          market_cap: s.marketCap,
          chain: s.chain,
          peg_deviation: null,
        }));
        filename = 'stablecoin_market';
        break;

      case 'fear_greed':
        const fearGreed = await fetchFearGreedIndex();
        data = [{
          value: fearGreed.value,
          label: fearGreed.label,
          timestamp: fearGreed.timestamp,
          previous_value: null,
          previous_label: null,
          error: fearGreed.error,
        }];
        filename = 'fear_greed_index';
        break;

      case 'chain_tvl':
        const chainTvl = await fetchDeFiTVL();
        data = chainTvl.chains.map((c) => ({
          chain: c.name,
          tvl: c.tvl,
          tvl_change_24h: null,
          protocols_count: null,
          dominance: ((c.tvl / chainTvl.totalTVL) * 100),
        }));
        filename = 'chain_tvl_rankings';
        break;

      case 'bitcoin_onchain':
        const btcStats = await fetchBitcoinStats();
        data = [{
          hash_rate: typeof btcStats.hashRate === 'number' ? (btcStats.hashRate / 1e18) : null,
          difficulty: btcStats.difficulty,
          block_height: btcStats.blockHeight,
          avg_block_time: btcStats.avgBlockTime,
          unconfirmed_txs: btcStats.unconfirmedTxs,
          mempool_size: btcStats.memPoolSize,
          error: btcStats.error || null,
        }];
        filename = 'bitcoin_onchain_stats';
        break;

      case 'eth_gas':
        const gasData = await fetchEthGasPrices();
        data = [{
          slow_gwei: gasData.slow,
          standard_gwei: gasData.standard,
          fast_gwei: gasData.fast,
          base_fee: gasData.baseFee,
          block_number: null,
          error: gasData.error || null,
        }];
        filename = 'ethereum_gas_prices';
        break;

      // ============================================
      // SOCIAL SENTIMENT DATA
      // ============================================
      
      case 'sentiment_aggregated':
        const aggregatedSentiment = await aggregateAllSentiment();
        data = [{
          overall_score: aggregatedSentiment.overallScore,
          overall_label: aggregatedSentiment.overallLabel,
          total_posts: aggregatedSentiment.totalPosts,
          by_source: JSON.stringify(aggregatedSentiment.bySource),
          by_coin: null,
          top_bullish: null,
          top_bearish: null,
          trending_topics: aggregatedSentiment.trendingTopics.join(', '),
        }];
        filename = 'social_sentiment_aggregated';
        break;

      case 'sentiment_reddit':
        const redditPosts = await fetchRedditSentiment(
          ['cryptocurrency', 'bitcoin', 'ethtrader', 'CryptoMarkets', 'altcoin'],
          100
        );
        data = redditPosts.map((p) => ({
          title: p.title.slice(0, 100),
          sentiment_score: (p.sentiment.score * 100),
          sentiment_label: p.sentiment.label,
          subreddit: p.platform,
          upvotes: p.engagement.likes,
          comments: p.engagement.comments,
          coins_mentioned: p.coins.join(', '),
          url: p.url,
        }));
        filename = 'reddit_sentiment';
        break;

      case 'sentiment_news':
        const newsFilter = (searchParams.get('filter') || 'hot') as 'hot' | 'rising' | 'bullish' | 'bearish' | 'important';
        const newsPosts = await fetchCryptoPanicSentiment(newsFilter);
        data = newsPosts.map((p) => ({
          title: p.title,
          sentiment_score: (p.sentiment.score * 100),
          sentiment_label: p.sentiment.label,
          source: p.platform,
          votes: p.engagement.likes,
          coins_mentioned: p.coins.join(', '),
          url: p.url,
        }));
        filename = `news_sentiment_${newsFilter}`;
        break;

      case 'sentiment_coin':
        const coinSymbol = searchParams.get('symbol') || 'BTC';
        const coinSentiment = await getCoinDeepSentiment(coinSymbol);
        data = [{
          coin: coinSentiment.coin,
          overall_sentiment: coinSentiment.overallSentiment,
          sentiment_label: coinSentiment.sentimentLabel,
          social_volume: coinSentiment.socialVolume,
          sources_breakdown: JSON.stringify(coinSentiment.sources),
          recent_posts: coinSentiment.recentPosts.length,
          trending: coinSentiment.trending ? 'Yes' : 'No',
          keywords: coinSentiment.keywords.join(', '),
        }];
        filename = `${coinSymbol.toLowerCase()}_sentiment_deep_dive`;
        break;

      // ============================================
      // WHALE TRACKING DATA
      // ============================================

      case 'whale_transactions':
        const whaleDashboard = await getWhaleDashboard();
        data = whaleDashboard.recentWhaleTransactions.map((tx) => ({
          hash: tx.hash,
          blockchain: tx.blockchain,
          from: tx.from,
          to: tx.to,
          amount: tx.amount,
          amount_usd: tx.amountUsd,
          type: tx.type,
          timestamp: tx.timestamp,
        }));
        filename = 'whale_transactions';
        break;

      case 'exchange_flows':
        const flows = await estimateExchangeFlows();
        data = flows.map(f => ({
          exchange: f.exchange,
          inflow_24h: f.inflow24h,
          outflow_24h: f.outflow24h,
          net_flow_24h: f.netFlow24h,
          inflow_usd: f.inflowUsd24h,
          outflow_usd: f.outflowUsd24h,
          net_flow_usd: f.netFlowUsd24h,
        }));
        filename = 'exchange_flows';
        break;

      // ============================================
      // DERIVATIVES DATA (NEW)
      // ============================================

      case 'funding_rates':
        const fundingData = await fetchFundingRatesForDownload(symbols);
        data = fundingData.map(f => ({
          symbol: f.symbol,
          funding_rate: f.fundingRate,
          funding_rate_annualized: f.fundingRateAnnualized,
          next_funding_time: f.nextFundingTime,
          mark_price: f.markPrice,
          index_price: f.indexPrice,
          open_interest: f.openInterest,
          volume_24h: f.volume24h,
        }));
        filename = 'funding_rates';
        break;

      case 'open_interest':
        const oiData = await fetchOpenInterestForDownload(symbols);
        data = oiData.map(o => ({
          symbol: o.symbol,
          open_interest: o.openInterest,
          open_interest_usd: o.openInterestUsd,
          oi_change_24h: o.oiChange24h,
          price: o.price,
          volume_24h: o.volume24h,
        }));
        filename = 'open_interest';
        break;

      case 'long_short_ratio':
        const lsData = await fetchLongShortRatioForDownload(symbols);
        data = lsData.map(l => ({
          symbol: l.symbol,
          long_ratio: l.longRatio,
          short_ratio: l.shortRatio,
          long_short_ratio: l.longShortRatio,
          top_trader_long_ratio: l.topTraderLongRatio,
          top_trader_short_ratio: l.topTraderShortRatio,
          timestamp: l.timestamp,
        }));
        filename = 'long_short_ratio';
        break;

      case 'liquidations':
        const liqData = await fetchLiquidationsForDownload(symbols);
        data = liqData.map(l => ({
          symbol: l.symbol,
          long_liquidations: l.longLiquidations24h,
          short_liquidations: l.shortLiquidations24h,
          total_liquidations: l.totalLiquidations24h,
          largest_liquidation: l.largestLiquidation,
          is_estimated: l.isEstimated,
        }));
        filename = 'liquidations';
        break;

      // ============================================
      // TECHNICAL ANALYSIS (NEW)
      // ============================================

      case 'technical_indicators':
        const techData = await fetchTechnicalIndicatorsForDownload(symbols);
        data = techData.map(t => ({
          symbol: t.symbol,
          price: t.price,
          rsi: t.rsi,
          rsi_signal: t.rsiSignal,
          macd: t.macd,
          macd_signal: t.macdSignal,
          macd_histogram: t.macdHistogram,
          sma_20: t.sma20,
          sma_50: t.sma50,
          sma_200: t.sma200,
          ema_12: t.ema12,
          ema_26: t.ema26,
          bollinger_upper: t.bollingerUpper,
          bollinger_lower: t.bollingerLower,
          bollinger_width: t.bollingerWidth,
          atr: t.atr,
          stoch_k: t.stochK,
          stoch_d: t.stochD,
          overall_signal: t.overallSignal,
        }));
        filename = 'technical_indicators';
        break;

      case 'correlation_matrix':
        const corrData = await fetchCorrelationMatrixForDownload(symbols);
        data = corrData.map(c => ({
          symbol_1: c.symbol1,
          symbol_2: c.symbol2,
          correlation: c.correlation,
          relationship: c.relationship,
        }));
        filename = 'correlation_matrix';
        break;

      case 'support_resistance':
        const srData = await fetchSupportResistanceForDownload(symbols);
        data = srData.map(s => ({
          symbol: s.symbol,
          price_level: s.price,
          type: s.type,
          strength: s.strength,
          touches: s.touches,
          last_tested: s.lastTested,
        }));
        filename = 'support_resistance';
        break;

      // ============================================
      // TOKEN ECONOMICS (NEW)
      // ============================================

      case 'token_unlocks':
        const unlockData = await fetchTokenUnlocksForDownload(limit);
        data = unlockData.map(u => ({
          name: u.name,
          symbol: u.symbol,
          unlock_date: u.unlockDate,
          days_until: u.daysUntil,
          unlock_amount: u.unlockAmount,
          unlock_value_usd: u.unlockValueUsd,
          percent_of_total: u.percentOfTotal,
          percent_of_circulating: u.percentOfCirculating,
          unlock_type: u.unlockType,
          risk_level: u.riskLevel,
        }));
        filename = 'token_unlocks';
        break;

      case 'staking_rewards':
        const stakingData = await fetchStakingRewardsForDownload();
        data = stakingData.map(s => ({
          name: s.name,
          symbol: s.symbol,
          staking_apy: s.stakingApy,
          inflation_rate: s.inflationRate,
          total_staked: s.totalStaked,
          staked_percent: s.stakedPercent,
          lockup_period: s.lockupPeriod,
          min_stake: s.minStake,
        }));
        filename = 'staking_rewards';
        break;

      // ============================================
      // NFT MARKET (NEW)
      // ============================================

      case 'nft_collections':
        const chain = searchParams.get('chain') || undefined;
        const nftData = await fetchNFTCollectionsForDownload(limit, chain);
        data = nftData.map(n => ({
          name: n.name,
          chain: n.chain,
          floor_price: n.floorPrice,
          floor_price_usd: n.floorPriceUsd,
          volume_24h: n.volume24h,
          volume_change_24h: n.volumeChange24h,
          sales_24h: n.sales24h,
          owners: n.owners,
          total_supply: n.totalSupply,
          listed_percent: n.listedPercent,
          market_cap: n.marketCap,
        }));
        filename = 'nft_collections';
        break;

      case 'nft_stats':
        const nftStats = await fetchNFTStatsForDownload();
        data = nftStats.map(s => ({
          metric: s.metric,
          value: s.value,
          change_24h: s.change24h || '',
        }));
        filename = 'nft_market_stats';
        break;

      default:
        // This case should not be reached due to validation above
        return validationError(`Invalid category. Use one of: ${VALID_CATEGORIES.slice(0, 5).join(', ')}... (see API docs for full list)`);
    }

    // Apply optional field selection after the dataset is built
    data = applyFieldSelection(data);

    // Excel mode: enforce safe-by-default minimum refresh interval.
    // Free: 60s, Pro/Business: 10s. (Output data is not personalized.)
    let excelTier: 'free' | 'starter' | 'pro' | 'business' = 'free';
    let minIntervalMs = 60_000;
    if (excelMode) {
      excelTier = await resolveTierFromBearerToken(request);
      minIntervalMs = excelTier === 'pro' || excelTier === 'business' ? 10_000 : 60_000;

      const ip = getClientIp(request);
      const limiterKey = `download_excel:${excelTier}:${ip}:${category}:${(fields || []).join(',')}:${(symbols || []).join(',')}:${symbol}:${interval}:${limit}`;
      const limitResult = enforceMinInterval({ key: limiterKey, minIntervalMs });
      if (!limitResult.ok) {
        return NextResponse.json(
          {
            error: 'Too many refresh requests. Please wait and try again.',
            retryAfterSeconds: limitResult.retryAfterSeconds,
            tier: excelTier,
            minRefreshSeconds: Math.ceil(minIntervalMs / 1000),
          },
          {
            status: 429,
            headers: {
              'Retry-After': String(limitResult.retryAfterSeconds),
              'X-Min-Refresh-Seconds': String(Math.ceil(minIntervalMs / 1000)),
              // Allow caching of this JSON error briefly to avoid thundering herds.
              'Cache-Control': 'public, s-maxage=5, stale-while-revalidate=30',
            },
          }
        );
      }
    }

    // Return preview (JSON only, limited rows)
    if (preview) {
      return NextResponse.json({
        data: data.slice(0, 10),
        total: data.length,
        category,
      });
    }

    // Return JSON
    if (format === 'json') {
      logDownloadEvent({
        request,
        category,
        format: 'json',
        fileName: `${filename}.json`,
        rowCount: data.length,
        filters: Object.fromEntries(searchParams.entries()),
      }).catch(() => {});
      return NextResponse.json({
        data,
        metadata: {
          category,
          total: data.length,
          generatedAt: new Date().toISOString(),
          source: 'Binance API',
          ...(fields && fields.length > 0 ? { fields } : {}),
          ...(excelMode ? { excel: true, tier: excelTier, minRefreshSeconds: Math.ceil(minIntervalMs / 1000) } : {}),
        },
      }, excelMode ? {
        headers: {
          // CDN-friendly caching for Excel refresh workflows
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
          'X-Min-Refresh-Seconds': String(Math.ceil(minIntervalMs / 1000)),
        }
      } : undefined);
    }

    // Create workbook
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);

    // Auto-size columns
    const colWidths = Object.keys(data[0] || {}).map(key => ({
      wch: Math.max(key.length, 15)
    }));
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, 'Data');

    // Add metadata sheet
    const metaData = [
      { Field: 'Category', Value: category },
      { Field: 'Total Rows', Value: data.length },
      { Field: 'Generated At', Value: new Date().toISOString() },
      { Field: 'Source', Value: 'Binance API (FREE)' },
      { Field: 'Powered By', Value: 'DataSimplify' },
    ];
    const metaWs = XLSX.utils.json_to_sheet(metaData);
    XLSX.utils.book_append_sheet(wb, metaWs, 'Metadata');

    // Generate file
    if (format === 'csv') {
      const csv = XLSX.utils.sheet_to_csv(ws);
      logDownloadEvent({
        request,
        category,
        format: 'csv',
        fileName: `${filename}.csv`,
        rowCount: data.length,
        filters: Object.fromEntries(searchParams.entries()),
      }).catch(() => {});
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
          ...(excelMode ? {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=300',
            'X-Min-Refresh-Seconds': String(Math.ceil(minIntervalMs / 1000)),
          } : {}),
        },
      });
    }

    // Default: XLSX
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    logDownloadEvent({
      request,
      category,
      format: 'xlsx',
      fileName: `${filename}.xlsx`,
      rowCount: data.length,
      filters: Object.fromEntries(searchParams.entries()),
    }).catch(() => {});
    return new NextResponse(xlsxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Download API error:', error);
    return internalError(`Unable to generate ${format.toUpperCase()} export for ${category}. Please try again or choose a different category.`);
  }
}
