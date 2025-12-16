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
          Symbol: d.symbol,
          Name: d.name,
          Category: d.category,
          Price: d.price,
          'Price Change 24h': d.priceChange24h,
          'Price Change % 24h': d.priceChangePercent24h,
          'Open 24h': d.open24h,
          'High 24h': d.high24h,
          'Low 24h': d.low24h,
          'Volume 24h': d.volume24h,
          'Quote Volume 24h': d.quoteVolume24h,
          'Trades Count 24h': d.tradesCount24h,
          'Market Cap': d.marketCap,
          'Circulating Supply': d.circulatingSupply,
          'Max Supply': d.maxSupply,
          'Bid Price': d.bidPrice,
          'Ask Price': d.askPrice,
          Spread: d.spread,
          'Spread %': d.spreadPercent,
          VWAP: d.vwap,
          'Updated At': d.updatedAt,
        }));
        filename = `market_overview_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'historical_prices':
        const histData = await fetchHistoricalPrices({ symbol, interval, limit });
        data = histData.map(d => ({
          Symbol: d.symbol,
          Interval: d.interval,
          'Open Time': d.openTime,
          Open: d.open,
          High: d.high,
          Low: d.low,
          Close: d.close,
          Volume: d.volume,
          'Close Time': d.closeTime,
          'Quote Volume': d.quoteVolume,
          'Trades Count': d.tradesCount,
          'Taker Buy Base Volume': d.takerBuyBaseVolume,
          'Taker Buy Quote Volume': d.takerBuyQuoteVolume,
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
              Level: i + 1,
              'Bid Price': bid?.price || '',
              'Bid Quantity': bid?.quantity || '',
              'Bid Total': bid?.total || '',
              'Ask Price': ask?.price || '',
              'Ask Quantity': ask?.quantity || '',
              'Ask Total': ask?.total || '',
            });
          }
          // Add summary row
          data.push({
            Level: 'TOTAL',
            'Bid Price': '',
            'Bid Quantity': '',
            'Bid Total': orderBook.totalBidVolume,
            'Ask Price': '',
            'Ask Quantity': '',
            'Ask Total': orderBook.totalAskVolume,
          });
          data.push({
            Level: 'SPREAD',
            'Bid Price': orderBook.spread.toFixed(8),
            'Bid Quantity': `${orderBook.spreadPercent.toFixed(4)}%`,
            'Bid Total': '',
            'Ask Price': 'Mid Price:',
            'Ask Quantity': orderBook.midPrice.toFixed(8),
            'Ask Total': '',
          });
        }
        filename = `${symbol}_order_book`;
        break;

      case 'recent_trades':
        const trades = await fetchRecentTrades({ symbol, limit });
        data = trades.map(t => ({
          Symbol: t.symbol,
          'Trade ID': t.tradeId,
          Price: t.price,
          Quantity: t.quantity,
          'Quote Quantity': t.quoteQuantity,
          Time: t.time,
          'Trade Type': t.tradeType,
          'Is Buyer Maker': t.isBuyerMaker,
        }));
        filename = `${symbol}_recent_trades`;
        break;

      case 'global_stats':
        const globalStats = await fetchGlobalStats();
        if (globalStats) {
          data = [{
            Metric: 'Total Market Cap',
            Value: globalStats.totalMarketCap,
          }, {
            Metric: 'Total 24h Volume',
            Value: globalStats.totalVolume24h,
          }, {
            Metric: 'BTC Dominance %',
            Value: globalStats.btcDominance,
          }, {
            Metric: 'ETH Dominance %',
            Value: globalStats.ethDominance,
          }, {
            Metric: 'Active Cryptocurrencies',
            Value: globalStats.activeCryptocurrencies,
          }, {
            Metric: 'Updated At',
            Value: globalStats.updatedAt,
          }];
        }
        filename = `global_stats_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'gainers_losers':
        const gainersLosers = await fetchGainersLosers({ type: gainerType, limit });
        data = gainersLosers.map(d => ({
          Type: d.type.toUpperCase(),
          Symbol: d.symbol,
          Name: d.name,
          Price: d.price,
          'Price Change % 24h': d.priceChangePercent24h,
          'Volume 24h': d.volume24h,
          'Market Cap': d.marketCap,
        }));
        filename = `${gainerType}_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'categories':
        const categoryStats = await fetchCategoryStats();
        data = categoryStats.map(c => ({
          Category: c.categoryName,
          'Coin Count': c.coinCount,
          'Total Market Cap': c.totalMarketCap,
          'Total Volume 24h': c.totalVolume24h,
          'Avg Price Change 24h %': c.avgPriceChange24h,
          'Top Performer': c.topPerformer,
          'Worst Performer': c.worstPerformer,
        }));
        filename = `category_analysis_${new Date().toISOString().split('T')[0]}`;
        break;

      case 'exchange_info':
        const exchangeInfo = await fetchExchangeInfo();
        data = exchangeInfo.map(e => ({
          Symbol: e.symbol,
          'Base Asset': e.baseAsset,
          'Quote Asset': e.quoteAsset,
          Status: e.status,
          'Min Price': e.minPrice,
          'Max Price': e.maxPrice,
          'Tick Size': e.tickSize,
          'Min Quantity': e.minQty,
          'Max Quantity': e.maxQty,
          'Step Size': e.stepSize,
          'Min Notional': e.minNotional,
        }));
        filename = 'exchange_trading_info';
        break;

      // ============================================
      // ON-CHAIN DATA (FREE - Glassnode alternative!)
      // ============================================
      
      case 'defi_protocols':
        const defiProtocols = await fetchTopDeFiProtocols(limit);
        data = defiProtocols.map((p, i) => ({
          Rank: i + 1,
          Name: p.name,
          Chain: p.chain,
          Category: p.category,
          Symbol: p.symbol,
          'TVL (USD)': p.tvl,
          'TVL Change 24h %': p.tvlChange24h,
          'TVL Change 7d %': p.tvlChange7d,
        }));
        filename = `defi_protocols_top${limit}`;
        break;

      case 'defi_yields':
        const yields = await fetchYieldData(limit);
        data = yields.pools.map((p, i) => ({
          Rank: i + 1,
          Protocol: p.protocol,
          Chain: p.chain,
          Pool: p.symbol,
          'TVL (USD)': p.tvl,
          'APY %': p.apy,
          'Base APY %': p.apyBase,
          'Reward APY %': p.apyReward,
        }));
        filename = `defi_yields_top${limit}`;
        break;

      case 'stablecoins':
        const stableData = await fetchStablecoinData();
        data = stableData.stablecoins.map((s, i) => ({
          Rank: i + 1,
          Name: s.name,
          Symbol: s.symbol,
          'Market Cap (USD)': s.marketCap,
          Chain: s.chain,
        }));
        // Add total row
        data.push({
          Rank: 'TOTAL',
          Name: '',
          Symbol: '',
          'Market Cap (USD)': stableData.totalMarketCap,
          Chain: '',
        });
        filename = 'stablecoin_market';
        break;

      case 'fear_greed':
        const fearGreed = await fetchFearGreedIndex();
        data = [{
          'Current Value': fearGreed.value,
          'Current Label': fearGreed.label,
          'Timestamp': fearGreed.timestamp,
          'Interpretation': fearGreed.value <= 25 ? 'Extreme Fear - Potential buying opportunity' :
                           fearGreed.value <= 45 ? 'Fear - Market is cautious' :
                           fearGreed.value <= 55 ? 'Neutral' :
                           fearGreed.value <= 75 ? 'Greed - Market is optimistic' :
                           'Extreme Greed - Potential selling opportunity',
        }];
        filename = 'fear_greed_index';
        break;

      case 'chain_tvl':
        const chainTvl = await fetchDeFiTVL();
        data = chainTvl.chains.map((c, i) => ({
          Rank: i + 1,
          Chain: c.name,
          'TVL (USD)': c.tvl,
          'Dominance %': ((c.tvl / chainTvl.totalTVL) * 100).toFixed(2),
        }));
        // Add total row
        data.push({
          Rank: 'TOTAL',
          Chain: 'All Chains',
          'TVL (USD)': chainTvl.totalTVL,
          'Dominance %': '100.00',
        });
        filename = 'chain_tvl_rankings';
        break;

      case 'bitcoin_onchain':
        const btcStats = await fetchBitcoinStats();
        data = [{
          Metric: 'Hash Rate (EH/s)',
          Value: (btcStats.hashRate / 1e18).toFixed(2),
        }, {
          Metric: 'Difficulty',
          Value: btcStats.difficulty.toExponential(2),
        }, {
          Metric: 'Block Height',
          Value: btcStats.blockHeight,
        }, {
          Metric: 'Avg Block Time (minutes)',
          Value: btcStats.avgBlockTime.toFixed(2),
        }, {
          Metric: 'Unconfirmed Transactions',
          Value: btcStats.unconfirmedTxs,
        }, {
          Metric: 'Mempool Size (bytes)',
          Value: btcStats.memPoolSize,
        }];
        filename = 'bitcoin_onchain_stats';
        break;

      case 'eth_gas':
        const gasData = await fetchEthGasPrices();
        data = [{
          'Speed': 'Slow',
          'Gas Price (Gwei)': gasData.slow.toFixed(2),
          'Estimated Time': '~5 minutes',
        }, {
          'Speed': 'Standard',
          'Gas Price (Gwei)': gasData.standard.toFixed(2),
          'Estimated Time': '~3 minutes',
        }, {
          'Speed': 'Fast',
          'Gas Price (Gwei)': gasData.fast.toFixed(2),
          'Estimated Time': '~1 minute',
        }, {
          'Speed': 'Base Fee',
          'Gas Price (Gwei)': gasData.baseFee.toFixed(2),
          'Estimated Time': 'Network base',
        }];
        filename = 'ethereum_gas_prices';
        break;

      // ============================================
      // SOCIAL SENTIMENT DATA
      // ============================================
      
      case 'sentiment_aggregated':
        const aggregatedSentiment = await aggregateAllSentiment();
        // Summary data
        data = [{
          'Overall Score': aggregatedSentiment.overallScore,
          'Overall Label': aggregatedSentiment.overallLabel,
          'Confidence': (aggregatedSentiment.confidence * 100).toFixed(1) + '%',
          'Total Posts Analyzed': aggregatedSentiment.totalPosts,
          'Trending Coins': aggregatedSentiment.trendingTopics.join(', '),
          'Timestamp': aggregatedSentiment.timestamp,
        }];
        // Add by source breakdown
        for (const source of aggregatedSentiment.bySource) {
          data.push({
            'Source': source.source,
            'Posts': source.postCount,
            'Avg Sentiment': (source.avgSentiment * 100).toFixed(1),
            'Bullish': source.bullishCount,
            'Bearish': source.bearishCount,
            'Neutral': source.neutralCount,
          });
        }
        filename = 'social_sentiment_aggregated';
        break;

      case 'sentiment_reddit':
        const redditPosts = await fetchRedditSentiment(
          ['cryptocurrency', 'bitcoin', 'ethtrader', 'CryptoMarkets', 'altcoin'],
          100
        );
        data = redditPosts.map((p, i) => ({
          Rank: i + 1,
          Title: p.title.slice(0, 100),
          Subreddit: p.platform,
          'Sentiment Score': (p.sentiment.score * 100).toFixed(1),
          'Sentiment Label': p.sentiment.label,
          Upvotes: p.engagement.likes,
          Comments: p.engagement.comments,
          'Coins Mentioned': p.coins.join(', '),
          Keywords: p.keywords.slice(0, 5).join(', '),
          URL: p.url,
          Timestamp: p.timestamp,
        }));
        filename = 'reddit_sentiment';
        break;

      case 'sentiment_news':
        const newsFilter = (searchParams.get('filter') || 'hot') as 'hot' | 'rising' | 'bullish' | 'bearish' | 'important';
        const newsPosts = await fetchCryptoPanicSentiment(newsFilter);
        data = newsPosts.map((p, i) => ({
          Rank: i + 1,
          Title: p.title,
          Source: p.platform,
          'Sentiment Score': (p.sentiment.score * 100).toFixed(1),
          'Sentiment Label': p.sentiment.label,
          'Positive Votes': p.engagement.likes,
          'Coins Mentioned': p.coins.join(', '),
          URL: p.url,
          Timestamp: p.timestamp,
        }));
        filename = `news_sentiment_${newsFilter}`;
        break;

      case 'sentiment_coin':
        const coinSymbol = searchParams.get('symbol') || 'BTC';
        const coinSentiment = await getCoinDeepSentiment(coinSymbol);
        data = [{
          'Coin': coinSentiment.coin,
          'Overall Sentiment': coinSentiment.overallSentiment,
          'Sentiment Label': coinSentiment.sentimentLabel,
          'Social Volume (24h)': coinSentiment.socialVolume,
          'Trending': coinSentiment.trending ? 'Yes' : 'No',
          'Top Keywords': coinSentiment.keywords.join(', '),
        }];
        // Add source breakdown
        for (const [source, stats] of Object.entries(coinSentiment.sources)) {
          data.push({
            'Source': source,
            'Posts': stats.count,
            'Sentiment': stats.sentiment,
          });
        }
        // Add recent posts
        data.push({ '---': '--- Recent Posts ---' });
        for (const post of coinSentiment.recentPosts.slice(0, 20)) {
          data.push({
            'Title': post.title.slice(0, 80),
            'Source': post.source,
            'Sentiment': (post.sentiment.score * 100).toFixed(1),
            'URL': post.url,
          });
        }
        filename = `${coinSymbol.toLowerCase()}_sentiment_deep_dive`;
        break;

      // ============================================
      // WHALE TRACKING DATA
      // ============================================

      case 'whale_transactions':
        const whaleDashboard = await getWhaleDashboard();
        data = whaleDashboard.recentWhaleTransactions.map((tx, i) => ({
          Rank: i + 1,
          Blockchain: tx.blockchain,
          'From': tx.from.slice(0, 20) + '...',
          'From Label': tx.fromLabel,
          'To': tx.to.slice(0, 20) + '...',
          'To Label': tx.toLabel,
          Amount: tx.amount.toFixed(4),
          Symbol: tx.symbol,
          'Amount USD': tx.amountUsd.toFixed(2),
          Type: tx.type,
          Timestamp: tx.timestamp,
          'Tx Hash': tx.hash,
        }));
        filename = 'whale_transactions';
        break;

      case 'exchange_flows':
        const flows = await estimateExchangeFlows();
        data = flows.map(f => ({
          Exchange: f.exchange,
          'Inflow (24h)': f.inflow24h.toFixed(4),
          'Outflow (24h)': f.outflow24h.toFixed(4),
          'Net Flow (24h)': f.netFlow24h.toFixed(4),
          'Inflow USD': f.inflowUsd24h.toFixed(2),
          'Outflow USD': f.outflowUsd24h.toFixed(2),
          'Net Flow USD': f.netFlowUsd24h.toFixed(2),
          'Signal': f.netFlowUsd24h > 0 ? '🔴 Sell Pressure' : '🟢 Accumulation',
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
