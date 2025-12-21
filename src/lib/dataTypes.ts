// ============================================
// ALL DATA TYPES AVAILABLE FROM FREE APIs
// ============================================

// What competitors charge for vs what we get FREE:
// CoinGecko Pro: $129/mo - We get most data FREE
// Glassnode: $799/mo - On-chain data (not available free)
// Messari: $29.99/mo - We get similar data FREE
// CryptoCompare: $79/mo - We get similar data FREE

// ============================================
// DATA CATEGORIES
// ============================================

export type DataCategory =
  | 'market_overview'      // Current prices, market cap, volume
  | 'historical_prices'    // OHLCV candlestick data
  | 'order_book'          // Bid/Ask depth
  | 'recent_trades'       // Latest trades
  | 'exchange_info'       // Trading pairs, rules
  | 'global_stats'        // Total market cap, dominance
  | 'trending'            // Trending coins
  | 'gainers_losers'      // Top movers
  | 'categories'          // DeFi, Gaming, L1, L2, etc.
  | 'exchanges'           // Exchange volumes
  // On-chain data (FREE - Glassnode alternative!)
  | 'defi_protocols'      // DeFi TVL rankings
  | 'defi_yields'         // Best yield farming APYs
  | 'stablecoins'         // Stablecoin market caps
  | 'fear_greed'          // Fear & Greed Index
  | 'chain_tvl'           // Chain TVL rankings
  | 'bitcoin_onchain'     // BTC network stats
  | 'eth_gas'             // ETH gas prices
  // Social Sentiment (FREE - LunarCrush alternative!)
  | 'sentiment_aggregated' // All sources combined
  | 'sentiment_reddit'     // Reddit sentiment
  | 'sentiment_news'       // News sentiment
  | 'sentiment_coin'       // Specific coin sentiment
  // Whale Tracking (FREE - Glassnode alternative!)
  | 'whale_transactions'   // Large transactions
  | 'exchange_flows'       // Exchange inflow/outflow
  // Derivatives Data (NEW - Trader favorites!)
  | 'funding_rates'        // Perpetual futures funding rates
  | 'liquidations'         // Long/short liquidations
  | 'open_interest'        // Futures open interest
  | 'long_short_ratio'     // Trader positioning
  // Technical Analysis (NEW)
  | 'technical_indicators' // RSI, MACD, MA, Bollinger
  | 'correlation_matrix'   // Price correlations
  | 'support_resistance'   // Key price levels
  // Token Economics (NEW)
  | 'token_unlocks'        // Upcoming vesting unlocks
  | 'staking_rewards'      // Staking APY comparison
  // NFT Market (NEW)
  | 'nft_collections'      // Top NFT collections
  | 'nft_stats'            // Market-wide NFT stats

export interface DataCategoryInfo {
  id: DataCategory;
  name: string;
  description: string;
  source: 'binance' | 'coingecko' | 'calculated';
  updateFrequency: string;
  fields: string[];
  filters: FilterOption[];
  isPremium: boolean;
}

export interface FilterOption {
  id: string;
  name: string;
  type: 'select' | 'multiselect' | 'range' | 'date' | 'number';
  options?: { value: string; label: string }[];
  default?: string | number;
}

// ============================================
// ALL AVAILABLE DATA CATEGORIES
// ============================================

export const DATA_CATEGORIES: DataCategoryInfo[] = [
  {
    id: 'market_overview',
    name: 'Market Overview',
    description: 'Current prices, market cap, 24h volume, price changes for all coins',
    source: 'binance',
    updateFrequency: 'Real-time (10 sec)',
    fields: [
      'symbol', 'name', 'price', 'price_change_24h', 'price_change_percent_24h',
      'high_24h', 'low_24h', 'volume_24h', 'market_cap', 'circulating_supply',
      'bid_price', 'ask_price', 'spread', 'vwap', 'trades_count_24h'
    ],
    filters: [
      {
        id: 'coins',
        name: 'Select Coins',
        type: 'multiselect',
        options: [] // Populated dynamically
      },
      {
        id: 'category',
        name: 'Category',
        type: 'select',
        options: [
          { value: 'all', label: 'All Categories' },
          { value: 'layer1', label: 'Layer 1' },
          { value: 'layer2', label: 'Layer 2' },
          { value: 'defi', label: 'DeFi' },
          { value: 'gaming', label: 'Gaming' },
          { value: 'meme', label: 'Meme' },
          { value: 'exchange', label: 'Exchange Tokens' },
        ]
      },
      {
        id: 'minMarketCap',
        name: 'Min Market Cap',
        type: 'select',
        options: [
          { value: '0', label: 'Any' },
          { value: '1000000000', label: '$1B+' },
          { value: '100000000', label: '$100M+' },
          { value: '10000000', label: '$10M+' },
        ]
      },
      {
        id: 'sortBy',
        name: 'Sort By',
        type: 'select',
        options: [
          { value: 'market_cap', label: 'Market Cap' },
          { value: 'volume', label: '24h Volume' },
          { value: 'price_change', label: 'Price Change %' },
          { value: 'price', label: 'Price' },
        ]
      }
    ],
    isPremium: false
  },
  {
    id: 'historical_prices',
    name: 'Historical Prices (OHLCV)',
    description: 'Open, High, Low, Close, Volume candlestick data for charting and analysis',
    source: 'binance',
    updateFrequency: 'Based on interval',
    fields: [
      'symbol', 'timestamp', 'open', 'high', 'low', 'close', 'volume',
      'quote_volume', 'trades_count', 'taker_buy_volume', 'taker_sell_volume'
    ],
    filters: [
      {
        id: 'symbol',
        name: 'Select Coin',
        type: 'select',
        options: [] // Populated dynamically
      },
      {
        id: 'interval',
        name: 'Time Interval',
        type: 'select',
        options: [
          { value: '1m', label: '1 Minute' },
          { value: '5m', label: '5 Minutes' },
          { value: '15m', label: '15 Minutes' },
          { value: '30m', label: '30 Minutes' },
          { value: '1h', label: '1 Hour' },
          { value: '4h', label: '4 Hours' },
          { value: '1d', label: '1 Day' },
          { value: '1w', label: '1 Week' },
          { value: '1M', label: '1 Month' },
        ],
        default: '1d'
      },
      {
        id: 'limit',
        name: 'Number of Candles',
        type: 'select',
        options: [
          { value: '100', label: '100 candles' },
          { value: '200', label: '200 candles' },
          { value: '500', label: '500 candles' },
          { value: '1000', label: '1000 candles (max)' },
        ],
        default: '500'
      }
    ],
    isPremium: false
  },
  {
    id: 'order_book',
    name: 'Order Book Depth',
    description: 'Current bid and ask orders showing market liquidity',
    source: 'binance',
    updateFrequency: 'Real-time',
    fields: [
      'symbol', 'bid_price', 'bid_quantity', 'ask_price', 'ask_quantity',
      'spread', 'spread_percent', 'total_bid_volume', 'total_ask_volume'
    ],
    filters: [
      {
        id: 'symbol',
        name: 'Select Coin',
        type: 'select',
        options: []
      },
      {
        id: 'depth',
        name: 'Order Book Depth',
        type: 'select',
        options: [
          { value: '5', label: 'Top 5 orders' },
          { value: '10', label: 'Top 10 orders' },
          { value: '20', label: 'Top 20 orders' },
          { value: '50', label: 'Top 50 orders' },
          { value: '100', label: 'Top 100 orders' },
        ],
        default: '20'
      }
    ],
    isPremium: false
  },
  {
    id: 'recent_trades',
    name: 'Recent Trades',
    description: 'Latest executed trades with price, quantity, and direction',
    source: 'binance',
    updateFrequency: 'Real-time',
    fields: [
      'symbol', 'trade_id', 'price', 'quantity', 'quote_quantity',
      'timestamp', 'is_buyer_maker', 'trade_type'
    ],
    filters: [
      {
        id: 'symbol',
        name: 'Select Coin',
        type: 'select',
        options: []
      },
      {
        id: 'limit',
        name: 'Number of Trades',
        type: 'select',
        options: [
          { value: '50', label: '50 trades' },
          { value: '100', label: '100 trades' },
          { value: '500', label: '500 trades' },
          { value: '1000', label: '1000 trades (max)' },
        ],
        default: '100'
      }
    ],
    isPremium: false
  },
  {
    id: 'global_stats',
    name: 'Global Market Stats',
    description: 'Total crypto market cap, volume, BTC/ETH dominance',
    source: 'binance',
    updateFrequency: 'Every minute',
    fields: [
      'total_market_cap', 'total_volume_24h', 'btc_dominance', 'eth_dominance',
      'market_cap_change_24h', 'active_cryptocurrencies', 'active_markets'
    ],
    filters: [],
    isPremium: false
  },
  {
    id: 'gainers_losers',
    name: 'Top Gainers & Losers',
    description: 'Coins with biggest price changes in 24h',
    source: 'calculated',
    updateFrequency: 'Every minute',
    fields: [
      'symbol', 'name', 'price', 'price_change_percent_24h', 'volume_24h',
      'market_cap', 'rank_type'
    ],
    filters: [
      {
        id: 'type',
        name: 'Show',
        type: 'select',
        options: [
          { value: 'both', label: 'Both Gainers & Losers' },
          { value: 'gainers', label: 'Top Gainers Only' },
          { value: 'losers', label: 'Top Losers Only' },
        ],
        default: 'both'
      },
      {
        id: 'limit',
        name: 'Number of Coins',
        type: 'select',
        options: [
          { value: '10', label: 'Top 10' },
          { value: '20', label: 'Top 20' },
          { value: '50', label: 'Top 50' },
        ],
        default: '20'
      }
    ],
    isPremium: false
  },
  {
    id: 'categories',
    name: 'Category Analysis',
    description: 'Performance breakdown by sector (DeFi, Gaming, L1, etc.)',
    source: 'calculated',
    updateFrequency: 'Every hour',
    fields: [
      'category', 'coin_count', 'total_market_cap', 'avg_price_change_24h',
      'total_volume_24h', 'top_performers'
    ],
    filters: [
      {
        id: 'categories',
        name: 'Select Categories',
        type: 'multiselect',
        options: [
          { value: 'layer1', label: 'Layer 1' },
          { value: 'layer2', label: 'Layer 2' },
          { value: 'defi', label: 'DeFi' },
          { value: 'gaming', label: 'Gaming/Metaverse' },
          { value: 'meme', label: 'Meme Coins' },
          { value: 'exchange', label: 'Exchange Tokens' },
          { value: 'oracle', label: 'Oracles' },
          { value: 'storage', label: 'Storage' },
          { value: 'privacy', label: 'Privacy' },
        ]
      }
    ],
    isPremium: false
  },
  {
    id: 'exchange_info',
    name: 'Exchange Trading Info',
    description: 'Trading pairs, rules, and filters from Binance',
    source: 'binance',
    updateFrequency: 'Daily',
    fields: [
      'symbol', 'base_asset', 'quote_asset', 'status', 'min_price',
      'max_price', 'tick_size', 'min_qty', 'max_qty', 'step_size', 'min_notional'
    ],
    filters: [],
    isPremium: false
  },
  {
    id: 'exchanges',
    name: 'Exchange Volumes',
    description: 'Trading volume comparison across exchanges (coming soon)',
    source: 'coingecko',
    updateFrequency: 'Every hour',
    fields: [
      'exchange_name', 'volume_24h', 'trust_score', 'year_established',
      'country', 'trading_pairs_count'
    ],
    filters: [],
    isPremium: true // Requires CoinGecko API key
  },
  // ============================================
  // NEW: ON-CHAIN DATA (FREE - What Glassnode charges $799/mo for!)
  // ============================================
  {
    id: 'defi_protocols',
    name: 'DeFi Protocols (TVL)',
    description: 'Total Value Locked in DeFi protocols - Aave, Uniswap, Lido, etc.',
    source: 'calculated',
    updateFrequency: 'Every 10 minutes',
    fields: [
      'name', 'chain', 'tvl', 'tvl_change_24h', 'tvl_change_7d', 'category', 'symbol'
    ],
    filters: [
      {
        id: 'limit',
        name: 'Number of Protocols',
        type: 'select',
        options: [
          { value: '25', label: 'Top 25' },
          { value: '50', label: 'Top 50' },
          { value: '100', label: 'Top 100' },
        ],
        default: '50'
      }
    ],
    isPremium: false
  },
  {
    id: 'defi_yields',
    name: 'DeFi Yields (APY)',
    description: 'Best yield farming opportunities across all chains',
    source: 'calculated',
    updateFrequency: 'Every 10 minutes',
    fields: [
      'protocol', 'chain', 'symbol', 'tvl', 'apy', 'apy_base', 'apy_reward'
    ],
    filters: [
      {
        id: 'limit',
        name: 'Number of Pools',
        type: 'select',
        options: [
          { value: '25', label: 'Top 25' },
          { value: '50', label: 'Top 50' },
          { value: '100', label: 'Top 100' },
        ],
        default: '50'
      }
    ],
    isPremium: false
  },
  {
    id: 'stablecoins',
    name: 'Stablecoin Market',
    description: 'Market cap and distribution of stablecoins (USDT, USDC, DAI, etc.)',
    source: 'calculated',
    updateFrequency: 'Every hour',
    fields: [
      'name', 'symbol', 'market_cap', 'chain', 'peg_deviation'
    ],
    filters: [],
    isPremium: false
  },
  {
    id: 'fear_greed',
    name: 'Fear & Greed Index',
    description: 'Crypto market sentiment indicator (0-100)',
    source: 'calculated',
    updateFrequency: 'Daily',
    fields: [
      'value', 'label', 'timestamp', 'previous_value', 'previous_label'
    ],
    filters: [],
    isPremium: false
  },
  {
    id: 'chain_tvl',
    name: 'Chain TVL Rankings',
    description: 'Total Value Locked by blockchain (Ethereum, BSC, Arbitrum, etc.)',
    source: 'calculated',
    updateFrequency: 'Every 10 minutes',
    fields: [
      'chain', 'tvl', 'tvl_change_24h', 'protocols_count', 'dominance'
    ],
    filters: [],
    isPremium: false
  },
  {
    id: 'bitcoin_onchain',
    name: 'Bitcoin On-Chain',
    description: 'Bitcoin network stats - hash rate, difficulty, blocks',
    source: 'calculated',
    updateFrequency: 'Every block (~10 min)',
    fields: [
      'hash_rate', 'difficulty', 'block_height', 'avg_block_time', 
      'unconfirmed_txs', 'mempool_size'
    ],
    filters: [],
    isPremium: false
  },
  {
    id: 'eth_gas',
    name: 'Ethereum Gas Prices',
    description: 'Current ETH gas prices and network congestion',
    source: 'calculated',
    updateFrequency: 'Every block (~12 sec)',
    fields: [
      'slow_gwei', 'standard_gwei', 'fast_gwei', 'base_fee', 'block_number'
    ],
    filters: [],
    isPremium: false
  },
  // ============================================
  // SOCIAL SENTIMENT DATA (FREE - LunarCrush alternative!)
  // ============================================
  {
    id: 'sentiment_aggregated',
    name: 'Social Sentiment (All Sources)',
    description: 'Aggregated sentiment from Reddit, News, 4chan, RSS feeds',
    source: 'calculated',
    updateFrequency: 'Every 15 minutes',
    fields: [
      'overall_score', 'overall_label', 'total_posts', 'by_source', 'by_coin',
      'top_bullish', 'top_bearish', 'trending_topics'
    ],
    filters: [],
    isPremium: false
  },
  {
    id: 'sentiment_reddit',
    name: 'Reddit Sentiment',
    description: 'Sentiment from crypto subreddits (r/cryptocurrency, r/bitcoin, etc.)',
    source: 'calculated',
    updateFrequency: 'Every 10 minutes',
    fields: [
      'title', 'sentiment_score', 'sentiment_label', 'subreddit', 'upvotes',
      'comments', 'coins_mentioned', 'url'
    ],
    filters: [],
    isPremium: false
  },
  {
    id: 'sentiment_news',
    name: 'News Sentiment',
    description: 'Sentiment from crypto news (CryptoPanic aggregator)',
    source: 'calculated',
    updateFrequency: 'Every 10 minutes',
    fields: [
      'title', 'sentiment_score', 'sentiment_label', 'source', 'votes',
      'coins_mentioned', 'url'
    ],
    filters: [
      {
        id: 'filter',
        name: 'News Filter',
        type: 'select',
        options: [
          { value: 'hot', label: 'Hot' },
          { value: 'rising', label: 'Rising' },
          { value: 'bullish', label: 'Bullish' },
          { value: 'bearish', label: 'Bearish' },
          { value: 'important', label: 'Important' },
        ],
        default: 'hot'
      }
    ],
    isPremium: false
  },
  {
    id: 'sentiment_coin',
    name: 'Coin Sentiment Deep Dive',
    description: 'Detailed sentiment analysis for a specific coin',
    source: 'calculated',
    updateFrequency: 'On demand',
    fields: [
      'coin', 'overall_sentiment', 'sentiment_label', 'social_volume',
      'sources_breakdown', 'recent_posts', 'trending', 'keywords'
    ],
    filters: [
      {
        id: 'symbol',
        name: 'Coin',
        type: 'select',
        options: [
          { value: 'BTC', label: 'Bitcoin' },
          { value: 'ETH', label: 'Ethereum' },
          { value: 'SOL', label: 'Solana' },
          { value: 'XRP', label: 'XRP' },
          { value: 'DOGE', label: 'Dogecoin' },
          { value: 'ADA', label: 'Cardano' },
          { value: 'AVAX', label: 'Avalanche' },
          { value: 'LINK', label: 'Chainlink' },
          { value: 'MATIC', label: 'Polygon' },
          { value: 'DOT', label: 'Polkadot' },
        ],
        default: 'BTC'
      }
    ],
    isPremium: false
  },
  // ============================================
  // WHALE TRACKING DATA
  // ============================================
  {
    id: 'whale_transactions',
    name: 'Whale Transactions',
    description: 'Large cryptocurrency transactions (>$1M)',
    source: 'calculated',
    updateFrequency: 'Every 5 minutes',
    fields: [
      'hash', 'blockchain', 'from', 'to', 'amount', 'amount_usd',
      'type', 'timestamp'
    ],
    filters: [
      {
        id: 'blockchain',
        name: 'Blockchain',
        type: 'select',
        options: [
          { value: 'all', label: 'All Chains' },
          { value: 'ethereum', label: 'Ethereum' },
          { value: 'bitcoin', label: 'Bitcoin' },
        ],
        default: 'all'
      }
    ],
    isPremium: false
  },
  {
    id: 'exchange_flows',
    name: 'Exchange Flows',
    description: 'Inflow/outflow to exchanges (buy/sell pressure)',
    source: 'calculated',
    updateFrequency: 'Every 10 minutes',
    fields: [
      'exchange', 'inflow_24h', 'outflow_24h', 'net_flow_24h',
      'inflow_usd', 'outflow_usd', 'net_flow_usd'
    ],
    filters: [],
    isPremium: false
  },
  // ============================================
  // DERIVATIVES DATA (NEW - Most requested by traders!)
  // ============================================
  {
    id: 'funding_rates',
    name: 'Funding Rates',
    description: 'Perpetual futures funding rates - shows market sentiment and cost of holding positions',
    source: 'binance',
    updateFrequency: 'Every 8 hours (funding interval)',
    fields: [
      'symbol', 'funding_rate', 'funding_rate_annualized', 'next_funding_time',
      'mark_price', 'index_price', 'open_interest', 'volume_24h'
    ],
    filters: [
      {
        id: 'coins',
        name: 'Select Coins',
        type: 'multiselect',
        options: []
      }
    ],
    isPremium: false
  },
  {
    id: 'liquidations',
    name: 'Liquidations',
    description: 'Long and short liquidation data - shows forced position closures',
    source: 'calculated',
    updateFrequency: 'Every 5 minutes',
    fields: [
      'symbol', 'long_liquidations', 'short_liquidations', 'total_liquidations_usd',
      'long_liquidations_usd', 'short_liquidations_usd', 'is_estimated'
    ],
    filters: [],
    isPremium: false
  },
  {
    id: 'open_interest',
    name: 'Open Interest',
    description: 'Total value of outstanding futures contracts by coin',
    source: 'binance',
    updateFrequency: 'Real-time',
    fields: [
      'symbol', 'open_interest', 'open_interest_usd', 'oi_change_24h', 'price', 'volume_24h'
    ],
    filters: [
      {
        id: 'coins',
        name: 'Select Coins',
        type: 'multiselect',
        options: []
      }
    ],
    isPremium: false
  },
  {
    id: 'long_short_ratio',
    name: 'Long/Short Ratio',
    description: 'Trader positioning - percentage of longs vs shorts',
    source: 'binance',
    updateFrequency: 'Every hour',
    fields: [
      'symbol', 'long_ratio', 'short_ratio', 'long_short_ratio',
      'top_trader_long_ratio', 'top_trader_short_ratio', 'timestamp'
    ],
    filters: [],
    isPremium: false
  },
  // ============================================
  // TECHNICAL ANALYSIS (NEW)
  // ============================================
  {
    id: 'technical_indicators',
    name: 'Technical Indicators',
    description: 'RSI, MACD, Moving Averages, Bollinger Bands and trading signals',
    source: 'calculated',
    updateFrequency: 'Based on interval',
    fields: [
      'symbol', 'price', 'rsi', 'rsi_signal', 'macd', 'macd_signal', 'macd_histogram',
      'sma_20', 'sma_50', 'sma_200', 'ema_12', 'ema_26',
      'bollinger_upper', 'bollinger_lower', 'bollinger_width',
      'atr', 'stoch_k', 'stoch_d', 'overall_signal'
    ],
    filters: [
      {
        id: 'coins',
        name: 'Select Coins',
        type: 'multiselect',
        options: []
      }
    ],
    isPremium: false
  },
  {
    id: 'correlation_matrix',
    name: 'Correlation Matrix',
    description: 'Price correlation between cryptocurrencies over time',
    source: 'calculated',
    updateFrequency: 'Daily',
    fields: [
      'symbol_1', 'symbol_2', 'correlation', 'relationship', 'period'
    ],
    filters: [
      {
        id: 'coins',
        name: 'Select Coins',
        type: 'multiselect',
        options: []
      }
    ],
    isPremium: false
  },
  {
    id: 'support_resistance',
    name: 'Support & Resistance Levels',
    description: 'Key price levels identified from historical data',
    source: 'calculated',
    updateFrequency: 'Daily',
    fields: [
      'symbol', 'price_level', 'type', 'strength', 'touches', 'last_tested'
    ],
    filters: [
      {
        id: 'coins',
        name: 'Select Coins',
        type: 'multiselect',
        options: []
      }
    ],
    isPremium: false
  },
  // ============================================
  // TOKEN ECONOMICS (NEW)
  // ============================================
  {
    id: 'token_unlocks',
    name: 'Token Unlocks',
    description: 'Upcoming token vesting and unlock events - supply dilution risk',
    source: 'calculated',
    updateFrequency: 'Daily',
    fields: [
      'name', 'symbol', 'unlock_date', 'days_until', 'unlock_amount',
      'unlock_value_usd', 'percent_of_total', 'percent_of_circulating',
      'unlock_type', 'risk_level'
    ],
    filters: [],
    isPremium: false
  },
  {
    id: 'staking_rewards',
    name: 'Staking Rewards',
    description: 'Staking APY comparison across Proof-of-Stake networks',
    source: 'calculated',
    updateFrequency: 'Daily',
    fields: [
      'name', 'symbol', 'staking_apy', 'inflation_rate', 'total_staked',
      'staked_percent', 'lockup_period', 'min_stake'
    ],
    filters: [],
    isPremium: false
  },
  // ============================================
  // NFT MARKET DATA (NEW)
  // ============================================
  {
    id: 'nft_collections',
    name: 'NFT Collections',
    description: 'Top NFT collections by volume, floor price, and market cap',
    source: 'calculated',
    updateFrequency: 'Every 5 minutes',
    fields: [
      'name', 'chain', 'floor_price', 'floor_price_usd', 'volume_24h',
      'volume_change_24h', 'sales_24h', 'owners', 'total_supply',
      'listed_percent', 'market_cap'
    ],
    filters: [
      {
        id: 'chain',
        name: 'Blockchain',
        type: 'select',
        options: [
          { value: 'all', label: 'All Chains' },
          { value: 'ethereum', label: 'Ethereum' },
          { value: 'solana', label: 'Solana' },
          { value: 'bitcoin', label: 'Bitcoin (Ordinals)' },
          { value: 'polygon', label: 'Polygon' },
        ]
      }
    ],
    isPremium: false
  },
  {
    id: 'nft_stats',
    name: 'NFT Market Stats',
    description: 'Aggregate NFT market statistics across all chains',
    source: 'calculated',
    updateFrequency: 'Every 5 minutes',
    fields: [
      'metric', 'value', 'change_24h'
    ],
    filters: [],
    isPremium: false
  }
];

// ============================================
// COIN LIST WITH CATEGORIES
// ============================================

export interface CoinInfo {
  symbol: string;
  binanceSymbol: string;
  name: string;
  image: string;
  category: string;
  circulatingSupply: number;
  maxSupply: number | null;
}

export const SUPPORTED_COINS: CoinInfo[] = [
  // Layer 1
  { symbol: 'BTC', binanceSymbol: 'BTCUSDT', name: 'Bitcoin', image: 'https://assets.coingecko.com/coins/images/1/large/bitcoin.png', category: 'layer1', circulatingSupply: 19800000, maxSupply: 21000000 },
  { symbol: 'ETH', binanceSymbol: 'ETHUSDT', name: 'Ethereum', image: 'https://assets.coingecko.com/coins/images/279/large/ethereum.png', category: 'layer1', circulatingSupply: 120400000, maxSupply: null },
  { symbol: 'SOL', binanceSymbol: 'SOLUSDT', name: 'Solana', image: 'https://assets.coingecko.com/coins/images/4128/large/solana.png', category: 'layer1', circulatingSupply: 477000000, maxSupply: null },
  { symbol: 'ADA', binanceSymbol: 'ADAUSDT', name: 'Cardano', image: 'https://assets.coingecko.com/coins/images/975/large/cardano.png', category: 'layer1', circulatingSupply: 35000000000, maxSupply: 45000000000 },
  { symbol: 'AVAX', binanceSymbol: 'AVAXUSDT', name: 'Avalanche', image: 'https://assets.coingecko.com/coins/images/12559/large/Avalanche_Circle_RedWhite_Trans.png', category: 'layer1', circulatingSupply: 410000000, maxSupply: 720000000 },
  { symbol: 'DOT', binanceSymbol: 'DOTUSDT', name: 'Polkadot', image: 'https://assets.coingecko.com/coins/images/12171/large/polkadot.png', category: 'layer1', circulatingSupply: 1500000000, maxSupply: null },
  { symbol: 'NEAR', binanceSymbol: 'NEARUSDT', name: 'NEAR Protocol', image: 'https://assets.coingecko.com/coins/images/10365/large/near.jpg', category: 'layer1', circulatingSupply: 1200000000, maxSupply: 1000000000 },
  { symbol: 'ATOM', binanceSymbol: 'ATOMUSDT', name: 'Cosmos', image: 'https://assets.coingecko.com/coins/images/1481/large/cosmos_hub.png', category: 'layer1', circulatingSupply: 390000000, maxSupply: null },
  { symbol: 'ICP', binanceSymbol: 'ICPUSDT', name: 'Internet Computer', image: 'https://assets.coingecko.com/coins/images/14495/large/Internet_Computer_logo.png', category: 'layer1', circulatingSupply: 470000000, maxSupply: null },
  { symbol: 'APT', binanceSymbol: 'APTUSDT', name: 'Aptos', image: 'https://assets.coingecko.com/coins/images/26455/large/aptos_round.png', category: 'layer1', circulatingSupply: 500000000, maxSupply: null },
  { symbol: 'SUI', binanceSymbol: 'SUIUSDT', name: 'Sui', image: 'https://assets.coingecko.com/coins/images/26375/large/sui_asset.jpeg', category: 'layer1', circulatingSupply: 2800000000, maxSupply: 10000000000 },
  { symbol: 'ETC', binanceSymbol: 'ETCUSDT', name: 'Ethereum Classic', image: 'https://assets.coingecko.com/coins/images/453/large/ethereum-classic-logo.png', category: 'layer1', circulatingSupply: 148000000, maxSupply: 210700000 },
  { symbol: 'FTM', binanceSymbol: 'FTMUSDT', name: 'Fantom', image: 'https://assets.coingecko.com/coins/images/4001/large/Fantom_round.png', category: 'layer1', circulatingSupply: 2800000000, maxSupply: 3175000000 },
  { symbol: 'ALGO', binanceSymbol: 'ALGOUSDT', name: 'Algorand', image: 'https://assets.coingecko.com/coins/images/4380/large/download.png', category: 'layer1', circulatingSupply: 8400000000, maxSupply: 10000000000 },
  { symbol: 'XTZ', binanceSymbol: 'XTZUSDT', name: 'Tezos', image: 'https://assets.coingecko.com/coins/images/976/large/Tezos-logo.png', category: 'layer1', circulatingSupply: 1000000000, maxSupply: null },
  { symbol: 'EGLD', binanceSymbol: 'EGLDUSDT', name: 'MultiversX', image: 'https://assets.coingecko.com/coins/images/12335/large/egld-token-logo.png', category: 'layer1', circulatingSupply: 27000000, maxSupply: 31415926 },
  { symbol: 'FLOW', binanceSymbol: 'FLOWUSDT', name: 'Flow', image: 'https://assets.coingecko.com/coins/images/13446/large/5f6294c0c7a8cda55cb1c936_Flow_Wordmark.png', category: 'layer1', circulatingSupply: 1550000000, maxSupply: null },
  { symbol: 'EOS', binanceSymbol: 'EOSUSDT', name: 'EOS', image: 'https://assets.coingecko.com/coins/images/738/large/eos-eos-logo.png', category: 'layer1', circulatingSupply: 1150000000, maxSupply: null },
  
  // Layer 2
  { symbol: 'MATIC', binanceSymbol: 'MATICUSDT', name: 'Polygon', image: 'https://assets.coingecko.com/coins/images/4713/large/polygon.png', category: 'layer2', circulatingSupply: 10000000000, maxSupply: 10000000000 },
  { symbol: 'ARB', binanceSymbol: 'ARBUSDT', name: 'Arbitrum', image: 'https://assets.coingecko.com/coins/images/16547/large/photo_2023-03-29_21.47.00.jpeg', category: 'layer2', circulatingSupply: 4000000000, maxSupply: 10000000000 },
  { symbol: 'OP', binanceSymbol: 'OPUSDT', name: 'Optimism', image: 'https://assets.coingecko.com/coins/images/25244/large/Optimism.png', category: 'layer2', circulatingSupply: 1200000000, maxSupply: null },
  { symbol: 'LRC', binanceSymbol: 'LRCUSDT', name: 'Loopring', image: 'https://assets.coingecko.com/coins/images/913/large/LRC.png', category: 'layer2', circulatingSupply: 1374000000, maxSupply: 1374000000 },
  
  // DeFi
  { symbol: 'UNI', binanceSymbol: 'UNIUSDT', name: 'Uniswap', image: 'https://assets.coingecko.com/coins/images/12504/large/uni.jpg', category: 'defi', circulatingSupply: 600000000, maxSupply: 1000000000 },
  { symbol: 'LINK', binanceSymbol: 'LINKUSDT', name: 'Chainlink', image: 'https://assets.coingecko.com/coins/images/877/large/chainlink-new-logo.png', category: 'defi', circulatingSupply: 630000000, maxSupply: 1000000000 },
  { symbol: 'AAVE', binanceSymbol: 'AAVEUSDT', name: 'Aave', image: 'https://assets.coingecko.com/coins/images/12645/large/AAVE.png', category: 'defi', circulatingSupply: 15000000, maxSupply: 16000000 },
  { symbol: 'MKR', binanceSymbol: 'MKRUSDT', name: 'Maker', image: 'https://assets.coingecko.com/coins/images/1364/large/Mark_Maker.png', category: 'defi', circulatingSupply: 900000, maxSupply: 1005577 },
  { symbol: 'CRV', binanceSymbol: 'CRVUSDT', name: 'Curve', image: 'https://assets.coingecko.com/coins/images/12124/large/Curve.png', category: 'defi', circulatingSupply: 1350000000, maxSupply: 3030000000 },
  { symbol: 'SNX', binanceSymbol: 'SNXUSDT', name: 'Synthetix', image: 'https://assets.coingecko.com/coins/images/3406/large/SNX.png', category: 'defi', circulatingSupply: 340000000, maxSupply: null },
  { symbol: 'COMP', binanceSymbol: 'COMPUSDT', name: 'Compound', image: 'https://assets.coingecko.com/coins/images/10775/large/COMP.png', category: 'defi', circulatingSupply: 10000000, maxSupply: 10000000 },
  { symbol: 'LDO', binanceSymbol: 'LDOUSDT', name: 'Lido DAO', image: 'https://assets.coingecko.com/coins/images/13573/large/Lido_DAO.png', category: 'defi', circulatingSupply: 890000000, maxSupply: 1000000000 },
  { symbol: 'INJ', binanceSymbol: 'INJUSDT', name: 'Injective', image: 'https://assets.coingecko.com/coins/images/12882/large/Secondary_Symbol.png', category: 'defi', circulatingSupply: 97000000, maxSupply: 100000000 },
  { symbol: 'GRT', binanceSymbol: 'GRTUSDT', name: 'The Graph', image: 'https://assets.coingecko.com/coins/images/13397/large/Graph_Token.png', category: 'defi', circulatingSupply: 9500000000, maxSupply: null },
  
  // Gaming / Metaverse
  { symbol: 'SAND', binanceSymbol: 'SANDUSDT', name: 'The Sandbox', image: 'https://assets.coingecko.com/coins/images/12129/large/sandbox_logo.jpg', category: 'gaming', circulatingSupply: 2300000000, maxSupply: 3000000000 },
  { symbol: 'MANA', binanceSymbol: 'MANAUSDT', name: 'Decentraland', image: 'https://assets.coingecko.com/coins/images/878/large/decentraland-mana.png', category: 'gaming', circulatingSupply: 1900000000, maxSupply: null },
  { symbol: 'AXS', binanceSymbol: 'AXSUSDT', name: 'Axie Infinity', image: 'https://assets.coingecko.com/coins/images/13029/large/axie_infinity_logo.png', category: 'gaming', circulatingSupply: 150000000, maxSupply: 270000000 },
  { symbol: 'APE', binanceSymbol: 'APEUSDT', name: 'ApeCoin', image: 'https://assets.coingecko.com/coins/images/24383/large/apecoin.jpg', category: 'gaming', circulatingSupply: 600000000, maxSupply: 1000000000 },
  { symbol: 'ENJ', binanceSymbol: 'ENJUSDT', name: 'Enjin Coin', image: 'https://assets.coingecko.com/coins/images/1102/large/enjin-coin-logo.png', category: 'gaming', circulatingSupply: 1000000000, maxSupply: 1000000000 },
  { symbol: 'CHZ', binanceSymbol: 'CHZUSDT', name: 'Chiliz', image: 'https://assets.coingecko.com/coins/images/8834/large/CHZ_Token_updated.png', category: 'gaming', circulatingSupply: 8900000000, maxSupply: 8888888888 },
  { symbol: 'RNDR', binanceSymbol: 'RNDRUSDT', name: 'Render', image: 'https://assets.coingecko.com/coins/images/11636/large/rndr.png', category: 'gaming', circulatingSupply: 520000000, maxSupply: null },
  
  // Meme
  { symbol: 'DOGE', binanceSymbol: 'DOGEUSDT', name: 'Dogecoin', image: 'https://assets.coingecko.com/coins/images/5/large/dogecoin.png', category: 'meme', circulatingSupply: 147000000000, maxSupply: null },
  { symbol: 'SHIB', binanceSymbol: 'SHIBUSDT', name: 'Shiba Inu', image: 'https://assets.coingecko.com/coins/images/11939/large/shiba.png', category: 'meme', circulatingSupply: 589000000000000, maxSupply: null },
  
  // Exchange Tokens
  { symbol: 'BNB', binanceSymbol: 'BNBUSDT', name: 'BNB', image: 'https://assets.coingecko.com/coins/images/825/large/bnb-icon2_2x.png', category: 'exchange', circulatingSupply: 145000000, maxSupply: 200000000 },
  
  // Payments
  { symbol: 'XRP', binanceSymbol: 'XRPUSDT', name: 'XRP', image: 'https://assets.coingecko.com/coins/images/44/large/xrp-symbol-white-128.png', category: 'payments', circulatingSupply: 57000000000, maxSupply: 100000000000 },
  { symbol: 'XLM', binanceSymbol: 'XLMUSDT', name: 'Stellar', image: 'https://assets.coingecko.com/coins/images/100/large/Stellar_symbol_black_RGB.png', category: 'payments', circulatingSupply: 30000000000, maxSupply: 50000000000 },
  { symbol: 'LTC', binanceSymbol: 'LTCUSDT', name: 'Litecoin', image: 'https://assets.coingecko.com/coins/images/2/large/litecoin.png', category: 'payments', circulatingSupply: 75000000, maxSupply: 84000000 },
  { symbol: 'TRX', binanceSymbol: 'TRXUSDT', name: 'TRON', image: 'https://assets.coingecko.com/coins/images/1094/large/tron-logo.png', category: 'payments', circulatingSupply: 86000000000, maxSupply: null },
  
  // Storage
  { symbol: 'FIL', binanceSymbol: 'FILUSDT', name: 'Filecoin', image: 'https://assets.coingecko.com/coins/images/12817/large/filecoin.png', category: 'storage', circulatingSupply: 600000000, maxSupply: null },
  
  // Privacy
  { symbol: 'ZEC', binanceSymbol: 'ZECUSDT', name: 'Zcash', image: 'https://assets.coingecko.com/coins/images/486/large/circle-zcash-color.png', category: 'privacy', circulatingSupply: 16500000, maxSupply: 21000000 },
  
  // Other
  { symbol: 'BAT', binanceSymbol: 'BATUSDT', name: 'Basic Attention Token', image: 'https://assets.coingecko.com/coins/images/677/large/basic-attention-token.png', category: 'other', circulatingSupply: 1500000000, maxSupply: 1500000000 },
  { symbol: 'ONE', binanceSymbol: 'ONEUSDT', name: 'Harmony', image: 'https://assets.coingecko.com/coins/images/4344/large/Y88JAze.png', category: 'other', circulatingSupply: 14000000000, maxSupply: null },
];

// Helper to get coins by category
export function getCoinsByCategory(category: string): CoinInfo[] {
  if (category === 'all') return SUPPORTED_COINS;
  return SUPPORTED_COINS.filter(c => c.category === category);
}

// Get all Binance symbols
export function getAllBinanceSymbols(): string[] {
  return SUPPORTED_COINS.map(c => c.binanceSymbol);
}

// ============================================
// FIELD DISPLAY NAME MAPPING
// Maps internal snake_case field names to user-friendly display names
// ============================================

export const FIELD_DISPLAY_NAMES: Record<string, string> = {
  // Market Overview
  'symbol': 'Symbol',
  'name': 'Name',
  'price': 'Price',
  'price_change_24h': 'Price Change (24h)',
  'price_change_percent_24h': 'Change % (24h)',
  'high_24h': 'High (24h)',
  'low_24h': 'Low (24h)',
  'volume_24h': 'Volume (24h)',
  'market_cap': 'Market Cap',
  'circulating_supply': 'Circulating Supply',
  'bid_price': 'Bid Price',
  'ask_price': 'Ask Price',
  'spread': 'Spread',
  'vwap': 'VWAP',
  'trades_count_24h': 'Trades (24h)',

  // Historical Prices
  'timestamp': 'Timestamp',
  'open': 'Open',
  'high': 'High',
  'low': 'Low',
  'close': 'Close',
  'volume': 'Volume',
  'quote_volume': 'Quote Volume',
  'trades_count': 'Trades Count',
  'taker_buy_volume': 'Taker Buy Volume',
  'taker_sell_volume': 'Taker Sell Volume',

  // Order Book
  'bid_quantity': 'Bid Quantity',
  'ask_quantity': 'Ask Quantity',
  'spread_percent': 'Spread %',
  'total_bid_volume': 'Total Bid Volume',
  'total_ask_volume': 'Total Ask Volume',

  // Recent Trades
  'trade_id': 'Trade ID',
  'quantity': 'Quantity',
  'quote_quantity': 'Quote Quantity',
  'trade_type': 'Trade Type',
  'is_buyer_maker': 'Is Buyer Maker',

  // Global Stats
  'total_market_cap': 'Total Market Cap',
  'total_volume_24h': 'Total Volume (24h)',
  'btc_dominance': 'BTC Dominance %',
  'eth_dominance': 'ETH Dominance %',
  'market_cap_change_24h': 'Market Cap Change (24h)',
  'active_cryptocurrencies': 'Active Cryptocurrencies',
  'active_markets': 'Active Markets',

  // Gainers/Losers
  'rank_type': 'Rank Type',

  // Categories
  'category': 'Category',
  'coin_count': 'Coin Count',
  'avg_price_change_24h': 'Avg Change % (24h)',
  'top_performers': 'Top Performers',

  // Exchange Info
  'base_asset': 'Base Asset',
  'quote_asset': 'Quote Asset',
  'status': 'Status',
  'min_price': 'Min Price',
  'max_price': 'Max Price',
  'tick_size': 'Tick Size',
  'min_qty': 'Min Quantity',
  'max_qty': 'Max Quantity',
  'step_size': 'Step Size',
  'min_notional': 'Min Notional',

  // DeFi
  'chain': 'Chain',
  'tvl': 'TVL (USD)',
  'tvl_change_24h': 'TVL Change (24h)',
  'tvl_change_7d': 'TVL Change (7d)',
  'apy': 'APY %',
  'apy_base': 'Base APY %',
  'apy_reward': 'Reward APY %',
  'protocol': 'Protocol',
  'peg_deviation': 'Peg Deviation',
  'protocols_count': 'Protocols Count',
  'dominance': 'Dominance %',

  // Fear & Greed
  'value': 'Value',
  'label': 'Label',
  'previous_value': 'Previous Value',
  'previous_label': 'Previous Label',

  // Bitcoin On-Chain
  'hash_rate': 'Hash Rate (EH/s)',
  'difficulty': 'Difficulty',
  'block_height': 'Block Height',
  'avg_block_time': 'Avg Block Time (min)',
  'unconfirmed_txs': 'Unconfirmed TXs',
  'mempool_size': 'Mempool Size',

  // ETH Gas
  'slow_gwei': 'Slow (Gwei)',
  'standard_gwei': 'Standard (Gwei)',
  'fast_gwei': 'Fast (Gwei)',
  'base_fee': 'Base Fee (Gwei)',
  'block_number': 'Block Number',

  // Sentiment
  'overall_score': 'Overall Score',
  'overall_label': 'Overall Label',
  'total_posts': 'Total Posts',
  'by_source': 'By Source',
  'by_coin': 'By Coin',
  'top_bullish': 'Top Bullish',
  'top_bearish': 'Top Bearish',
  'trending_topics': 'Trending Topics',
  'title': 'Title',
  'sentiment_score': 'Sentiment Score',
  'sentiment_label': 'Sentiment Label',
  'subreddit': 'Subreddit',
  'upvotes': 'Upvotes',
  'comments': 'Comments',
  'coins_mentioned': 'Coins Mentioned',
  'url': 'URL',
  'source': 'Source',
  'votes': 'Votes',
  'coin': 'Coin',
  'overall_sentiment': 'Overall Sentiment',
  'social_volume': 'Social Volume',
  'sources_breakdown': 'Sources Breakdown',
  'recent_posts': 'Recent Posts',
  'trending': 'Trending',
  'keywords': 'Keywords',

  // Whale Tracking
  'hash': 'Transaction Hash',
  'blockchain': 'Blockchain',
  'from': 'From',
  'to': 'To',
  'amount': 'Amount',
  'amount_usd': 'Amount (USD)',
  'type': 'Type',

  // Exchange Flows
  'exchange': 'Exchange',
  'inflow_24h': 'Inflow (24h)',
  'outflow_24h': 'Outflow (24h)',
  'net_flow_24h': 'Net Flow (24h)',
  'inflow_usd': 'Inflow (USD)',
  'outflow_usd': 'Outflow (USD)',
  'net_flow_usd': 'Net Flow (USD)',

  // Derivatives - Funding Rates
  'funding_rate': 'Funding Rate %',
  'funding_rate_annualized': 'Annualized Rate %',
  'next_funding_time': 'Next Funding',
  'mark_price': 'Mark Price',
  'index_price': 'Index Price',

  // Derivatives - Liquidations
  'long_liquidations': 'Long Liquidations',
  'short_liquidations': 'Short Liquidations',
  'total_liquidations_usd': 'Total Liquidations (USD)',
  'long_liquidations_usd': 'Long Liquidations (USD)',
  'short_liquidations_usd': 'Short Liquidations (USD)',
  'is_estimated': 'Is Estimated',

  // Derivatives - Open Interest
  'open_interest': 'Open Interest',
  'open_interest_usd': 'Open Interest (USD)',
  'oi_change_24h': 'OI Change (24h)',

  // Derivatives - Long/Short Ratio
  'long_ratio': 'Long Ratio %',
  'short_ratio': 'Short Ratio %',
  'long_short_ratio': 'Long/Short Ratio',
  'top_trader_long_ratio': 'Top Traders Long %',
  'top_trader_short_ratio': 'Top Traders Short %',

  // Technical Indicators
  'rsi': 'RSI',
  'rsi_signal': 'RSI Signal',
  'macd': 'MACD',
  'macd_signal': 'MACD Signal',
  'macd_histogram': 'MACD Histogram',
  'sma_20': 'SMA 20',
  'sma_50': 'SMA 50',
  'sma_200': 'SMA 200',
  'ema_12': 'EMA 12',
  'ema_26': 'EMA 26',
  'bollinger_upper': 'Bollinger Upper',
  'bollinger_lower': 'Bollinger Lower',
  'bollinger_width': 'Bollinger Width %',
  'atr': 'ATR',
  'stoch_k': 'Stochastic %K',
  'stoch_d': 'Stochastic %D',
  'overall_signal': 'Overall Signal',

  // Correlation Matrix
  'symbol_1': 'Coin 1',
  'symbol_2': 'Coin 2',
  'correlation': 'Correlation',
  'relationship': 'Relationship',
  'period': 'Period',

  // Support & Resistance
  'price_level': 'Price Level',
  'strength': 'Strength',
  'touches': 'Touches',
  'last_tested': 'Last Tested',

  // Token Unlocks
  'unlock_date': 'Unlock Date',
  'days_until': 'Days Until',
  'unlock_amount': 'Unlock Amount',
  'unlock_value_usd': 'Unlock Value (USD)',
  'percent_of_total': '% of Total Supply',
  'percent_of_circulating': '% of Circulating',
  'unlock_type': 'Unlock Type',
  'risk_level': 'Risk Level',

  // Staking Rewards
  'staking_apy': 'Staking APY %',
  'inflation_rate': 'Inflation Rate %',
  'total_staked': 'Total Staked',
  'staked_percent': 'Staked %',
  'lockup_period': 'Lockup Period',
  'min_stake': 'Min Stake',

  // NFT Collections
  'floor_price': 'Floor Price',
  'floor_price_usd': 'Floor Price (USD)',
  'volume_change_24h': 'Volume Change (24h)',
  'sales_24h': 'Sales (24h)',
  'owners': 'Owners',
  'total_supply': 'Total Supply',
  'listed_percent': 'Listed %',

  // NFT Stats
  'metric': 'Metric',
  'change_24h': 'Change (24h)',
};

// Get display name for a field
export function getFieldDisplayName(field: string): string {
  return FIELD_DISPLAY_NAMES[field] || field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
