import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
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
import { DataCategory } from '@/lib/dataTypes';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  
  // Get parameters
  const category = searchParams.get('category') as DataCategory || 'market_overview';
  const format = searchParams.get('format') as 'xlsx' | 'csv' | 'json' || 'xlsx';
  const preview = searchParams.get('preview') === 'true';
  
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

    // Fetch data based on category
    switch (category) {
      case 'market_overview':
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
            market_cap_change_24h: 0,
            active_cryptocurrencies: globalStats.activeCryptocurrencies,
            active_markets: 0,
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
      // ON-CHAIN DATA (FREE - Glassnode alternative!)
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
          peg_deviation: 0,
        }));
        filename = 'stablecoin_market';
        break;

      case 'fear_greed':
        const fearGreed = await fetchFearGreedIndex();
        data = [{
          value: fearGreed.value,
          label: fearGreed.label,
          timestamp: fearGreed.timestamp,
          previous_value: fearGreed.value,
          previous_label: fearGreed.label,
        }];
        filename = 'fear_greed_index';
        break;

      case 'chain_tvl':
        const chainTvl = await fetchDeFiTVL();
        data = chainTvl.chains.map((c) => ({
          chain: c.name,
          tvl: c.tvl,
          tvl_change_24h: 0,
          protocols_count: 0,
          dominance: ((c.tvl / chainTvl.totalTVL) * 100),
        }));
        filename = 'chain_tvl_rankings';
        break;

      case 'bitcoin_onchain':
        const btcStats = await fetchBitcoinStats();
        data = [{
          hash_rate: (btcStats.hashRate / 1e18),
          difficulty: btcStats.difficulty,
          block_height: btcStats.blockHeight,
          avg_block_time: btcStats.avgBlockTime,
          unconfirmed_txs: btcStats.unconfirmedTxs,
          mempool_size: btcStats.memPoolSize,
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
          block_number: 0,
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
          by_coin: '',
          top_bullish: '',
          top_bearish: '',
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

      default:
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
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
      return NextResponse.json({
        data,
        metadata: {
          category,
          total: data.length,
          generatedAt: new Date().toISOString(),
          source: 'Binance API',
        },
      });
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
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${filename}.csv"`,
        },
      });
    }

    // Default: XLSX
    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    return new NextResponse(xlsxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}.xlsx"`,
      },
    });

  } catch (error) {
    console.error('Download API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate download' },
      { status: 500 }
    );
  }
}
