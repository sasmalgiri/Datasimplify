export interface WidgetConfig {
  id: string;
  component: string;
  title: string;
  gridColumn: string;
  gridRow?: string;
  dataEndpoints: string[];
  props?: Record<string, any>;
  mobileOrder?: number;
}

export interface LiveDashboardDefinition {
  slug: string;
  name: string;
  description: string;
  icon: string;
  tier: 'free' | 'pro';
  gridColumns: number;
  widgets: WidgetConfig[];
  requiredEndpoints: string[];
}

export const LIVE_DASHBOARDS: LiveDashboardDefinition[] = [
  // ─── FREE DASHBOARDS (10) ──────────────────────────────────

  {
    slug: 'market-overview',
    name: 'Market Overview',
    description: 'Complete crypto market snapshot with top coins, gainers, trending, sector heatmap, and market cap treemap.',
    icon: '📊',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'trending', 'fear_greed', 'categories'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Market Stats', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'treemap', component: 'TreemapWidget', title: 'Market Cap Treemap', gridColumn: 'span 2', dataEndpoints: ['markets'], mobileOrder: 2 },
      { id: 'heatmap', component: 'HeatmapWidget', title: 'Sector Heatmap', gridColumn: 'span 2', dataEndpoints: ['categories'], mobileOrder: 3 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Top Cryptocurrencies', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 20 }, mobileOrder: 4 },
      { id: 'gainers', component: 'GainersLosersWidget', title: 'Top Movers (24h)', gridColumn: 'span 2', dataEndpoints: ['markets'], mobileOrder: 5 },
      { id: 'trending', component: 'TrendingWidget', title: 'Trending Now', gridColumn: 'span 2', dataEndpoints: ['trending'], mobileOrder: 6 },
      { id: 'fear-greed', component: 'FearGreedWidget', title: 'Fear & Greed Index', gridColumn: 'span 2', dataEndpoints: ['fear_greed'], mobileOrder: 7 },
      { id: 'dominance', component: 'DominanceWidget', title: 'Market Dominance', gridColumn: 'span 2', dataEndpoints: ['global'], mobileOrder: 8 },
    ],
  },

  {
    slug: 'bitcoin',
    name: 'Bitcoin Dashboard',
    description: 'In-depth Bitcoin analysis with candlestick chart, volume, technicals, and market sentiment.',
    icon: '₿',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'fear_greed', 'ohlc'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Bitcoin Stats', gridColumn: '1 / -1', dataEndpoints: ['markets', 'global'], props: { mode: 'bitcoin' }, mobileOrder: 1 },
      { id: 'candlestick', component: 'CandlestickChartWidget', title: 'BTC/USD Candlestick (30d)', gridColumn: 'span 2', dataEndpoints: ['ohlc'], props: { coinId: 'bitcoin', days: 30 }, mobileOrder: 2 },
      { id: 'volume', component: 'VolumeChartWidget', title: 'Volume by Coin', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 10 }, mobileOrder: 3 },
      { id: 'price-chart', component: 'PriceChartWidget', title: 'BTC Price (30d)', gridColumn: 'span 2', dataEndpoints: ['ohlc'], props: { coinId: 'bitcoin', days: 30 }, mobileOrder: 4 },
      { id: 'fear-greed', component: 'FearGreedWidget', title: 'Market Sentiment', gridColumn: 'span 2', dataEndpoints: ['fear_greed'], mobileOrder: 5 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Market Context', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 10 }, mobileOrder: 6 },
    ],
  },

  {
    slug: 'portfolio',
    name: 'Portfolio Overview',
    description: 'Track portfolio allocations with pie charts, coin comparison, and market dominance.',
    icon: '💼',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'fear_greed'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Market Summary', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'pie', component: 'PieChartWidget', title: 'Market Dominance', gridColumn: 'span 2', dataEndpoints: ['global'], props: { mode: 'dominance' }, mobileOrder: 2 },
      { id: 'compare', component: 'CoinCompareWidget', title: 'BTC vs ETH', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { coinIds: ['bitcoin', 'ethereum'] }, mobileOrder: 3 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Top 50 Coins', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 50 }, mobileOrder: 4 },
      { id: 'fear-greed', component: 'FearGreedWidget', title: 'Market Sentiment', gridColumn: 'span 2', dataEndpoints: ['fear_greed'], mobileOrder: 5 },
      { id: 'dominance', component: 'DominanceWidget', title: 'Market Share', gridColumn: 'span 2', dataEndpoints: ['global'], mobileOrder: 6 },
    ],
  },

  {
    slug: 'ethereum',
    name: 'Ethereum Dashboard',
    description: 'Deep dive into Ethereum with candlestick chart, volume analysis, and ecosystem context.',
    icon: '🔷',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'fear_greed', 'ohlc'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'ETH Stats', gridColumn: '1 / -1', dataEndpoints: ['markets', 'global'], props: { mode: 'bitcoin' }, mobileOrder: 1 },
      { id: 'candlestick', component: 'CandlestickChartWidget', title: 'ETH/USD Candlestick (30d)', gridColumn: 'span 2', dataEndpoints: ['ohlc'], props: { coinId: 'ethereum', days: 30 }, mobileOrder: 2 },
      { id: 'volume', component: 'VolumeChartWidget', title: 'Volume Rankings', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 10 }, mobileOrder: 3 },
      { id: 'fear-greed', component: 'FearGreedWidget', title: 'Market Sentiment', gridColumn: 'span 2', dataEndpoints: ['fear_greed'], mobileOrder: 4 },
      { id: 'compare', component: 'CoinCompareWidget', title: 'ETH vs BTC vs SOL', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { coinIds: ['ethereum', 'bitcoin', 'solana'] }, mobileOrder: 5 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Top Coins', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 15 }, mobileOrder: 6 },
    ],
  },

  {
    slug: 'altcoin-radar',
    name: 'Altcoin Radar',
    description: 'Discover trending altcoins, biggest movers, and market cap distribution across the ecosystem.',
    icon: '🎯',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'trending', 'categories'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Altcoin Stats', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'gainers', component: 'GainersLosersWidget', title: 'Biggest Movers', gridColumn: 'span 2', dataEndpoints: ['markets'], mobileOrder: 2 },
      { id: 'treemap', component: 'TreemapWidget', title: 'Market Cap Distribution', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 40 }, mobileOrder: 3 },
      { id: 'trending', component: 'TrendingWidget', title: 'Trending Coins', gridColumn: 'span 2', dataEndpoints: ['trending'], mobileOrder: 4 },
      { id: 'category-bar', component: 'CategoryBarWidget', title: 'Sector Performance', gridColumn: 'span 2', dataEndpoints: ['categories'], props: { limit: 12 }, mobileOrder: 5 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Altcoin Rankings', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 25 }, mobileOrder: 6 },
    ],
  },

  {
    slug: 'sector-analysis',
    name: 'Sector Analysis',
    description: 'Analyze crypto sectors with heatmaps, category performance bars, and market allocation.',
    icon: '🏗️',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'categories'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Market Overview', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'heatmap', component: 'HeatmapWidget', title: 'Sector Heatmap', gridColumn: '1 / -1', dataEndpoints: ['categories'], mobileOrder: 2 },
      { id: 'category-bar', component: 'CategoryBarWidget', title: 'Category 24h Change', gridColumn: 'span 2', dataEndpoints: ['categories'], props: { limit: 15 }, mobileOrder: 3 },
      { id: 'pie', component: 'PieChartWidget', title: 'Market Allocation', gridColumn: 'span 2', dataEndpoints: ['global'], props: { mode: 'dominance' }, mobileOrder: 4 },
      { id: 'treemap', component: 'TreemapWidget', title: 'Market Cap Treemap', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 50 }, mobileOrder: 5 },
    ],
  },

  {
    slug: 'executive-summary',
    name: 'Executive Summary',
    description: 'High-level market overview with large KPIs, dominance chart, sentiment, and key metrics.',
    icon: '📋',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'fear_greed'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Key Metrics', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'pie', component: 'PieChartWidget', title: 'Market Allocation', gridColumn: 'span 2', dataEndpoints: ['global'], props: { mode: 'dominance' }, mobileOrder: 2 },
      { id: 'fear-greed', component: 'FearGreedWidget', title: 'Market Sentiment', gridColumn: 'span 2', dataEndpoints: ['fear_greed'], mobileOrder: 3 },
      { id: 'dominance', component: 'DominanceWidget', title: 'Dominance Breakdown', gridColumn: 'span 2', dataEndpoints: ['global'], mobileOrder: 4 },
      { id: 'treemap', component: 'TreemapWidget', title: 'Top Assets', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 20 }, mobileOrder: 5 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Top 10 Overview', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 10 }, mobileOrder: 6 },
    ],
  },

  {
    slug: 'stablecoin-monitor',
    name: 'Stablecoin Monitor',
    description: 'Track stablecoin market caps, dominance, and volume with dedicated stablecoin analytics.',
    icon: '💵',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Stablecoin Stats', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'pie', component: 'PieChartWidget', title: 'Volume Distribution', gridColumn: 'span 2', dataEndpoints: ['global'], props: { mode: 'volume' }, mobileOrder: 2 },
      { id: 'dominance', component: 'DominanceWidget', title: 'Market Dominance', gridColumn: 'span 2', dataEndpoints: ['global'], mobileOrder: 3 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'All Coins by Market Cap', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 30 }, mobileOrder: 4 },
      { id: 'volume', component: 'VolumeChartWidget', title: 'Volume by Coin', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 12 }, mobileOrder: 5 },
    ],
  },

  {
    slug: 'layer1-compare',
    name: 'Layer 1 Comparison',
    description: 'Compare top Layer 1 blockchains with price overlay, radar metrics, and side-by-side stats.',
    icon: '🔗',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'L1 Overview', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'compare', component: 'CoinCompareWidget', title: 'L1 Comparison', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { coinIds: ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2'] }, mobileOrder: 2 },
      { id: 'radar', component: 'RadarChartWidget', title: 'Multi-Metric Radar', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { coinIds: ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2'] }, mobileOrder: 3 },
      { id: 'multi-line', component: 'MultiLineChartWidget', title: '7d Price Change (%)', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { coinIds: ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2'] }, mobileOrder: 4 },
    ],
  },

  {
    slug: 'marketcap-tracker',
    name: 'Market Cap Tracker',
    description: 'Visualize market cap distribution with treemap, timeline, dominance, and ranking changes.',
    icon: '📈',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'ohlc'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Market Cap Stats', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'treemap', component: 'TreemapWidget', title: 'Market Cap Treemap', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 50 }, mobileOrder: 2 },
      { id: 'mcap-timeline', component: 'MarketCapTimelineWidget', title: 'BTC Market Cap (30d)', gridColumn: 'span 2', dataEndpoints: ['ohlc'], props: { coinId: 'bitcoin', days: 30 }, mobileOrder: 3 },
      { id: 'dominance', component: 'DominanceWidget', title: 'Market Dominance', gridColumn: 'span 2', dataEndpoints: ['global'], mobileOrder: 4 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Rankings', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 20 }, mobileOrder: 5 },
    ],
  },

  // ─── PRO DASHBOARDS (10) ──────────────────────────────────

  {
    slug: 'defi-tracker',
    name: 'DeFi Tracker',
    description: 'Track top DeFi protocols with category heatmaps, sector performance, and market allocation.',
    icon: '🌐',
    tier: 'pro',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'categories'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'DeFi Stats', gridColumn: '1 / -1', dataEndpoints: ['global'], props: { mode: 'defi' }, mobileOrder: 1 },
      { id: 'heatmap', component: 'HeatmapWidget', title: 'DeFi Sector Heatmap', gridColumn: 'span 2', dataEndpoints: ['categories'], mobileOrder: 2 },
      { id: 'category-bar', component: 'CategoryBarWidget', title: 'Category Performance', gridColumn: 'span 2', dataEndpoints: ['categories'], props: { limit: 12 }, mobileOrder: 3 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Top DeFi Tokens', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 20 }, mobileOrder: 4 },
      { id: 'dominance', component: 'DominanceWidget', title: 'DeFi vs Market', gridColumn: 'span 2', dataEndpoints: ['global'], mobileOrder: 5 },
      { id: 'pie', component: 'PieChartWidget', title: 'Volume Share', gridColumn: 'span 2', dataEndpoints: ['global'], props: { mode: 'volume' }, mobileOrder: 6 },
    ],
  },

  {
    slug: 'trader',
    name: 'Trader Dashboard',
    description: 'Active trading view with candlestick charts, volume analysis, top movers, and momentum indicators.',
    icon: '⚡',
    tier: 'pro',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'trending', 'ohlc', 'fear_greed'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Trading Stats', gridColumn: '1 / -1', dataEndpoints: ['global', 'markets'], props: { mode: 'trading' }, mobileOrder: 1 },
      { id: 'candlestick', component: 'CandlestickChartWidget', title: 'BTC/USD Candlestick', gridColumn: 'span 2', dataEndpoints: ['ohlc'], props: { coinId: 'bitcoin', days: 30 }, mobileOrder: 2 },
      { id: 'volume', component: 'VolumeChartWidget', title: 'Volume Leaders', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 12 }, mobileOrder: 3 },
      { id: 'gainers', component: 'GainersLosersWidget', title: 'Top Movers', gridColumn: 'span 2', dataEndpoints: ['markets'], mobileOrder: 4 },
      { id: 'trending', component: 'TrendingWidget', title: 'Trending Coins', gridColumn: 'span 2', dataEndpoints: ['trending'], mobileOrder: 5 },
      { id: 'fear-greed', component: 'FearGreedWidget', title: 'Sentiment', gridColumn: 'span 2', dataEndpoints: ['fear_greed'], mobileOrder: 6 },
      { id: 'price-chart', component: 'PriceChartWidget', title: 'BTC Price Trend', gridColumn: 'span 2', dataEndpoints: ['ohlc'], props: { coinId: 'bitcoin', days: 30 }, mobileOrder: 7 },
    ],
  },

  {
    slug: 'risk-volatility',
    name: 'Risk & Volatility',
    description: 'Assess market risk with radar metrics, fear & greed, correlation matrix, and price comparisons.',
    icon: '🛡️',
    tier: 'pro',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'fear_greed'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Risk Metrics', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'radar', component: 'RadarChartWidget', title: 'Risk Radar (Top 5)', gridColumn: 'span 2', dataEndpoints: ['markets'], mobileOrder: 2 },
      { id: 'fear-greed', component: 'FearGreedWidget', title: 'Fear & Greed', gridColumn: 'span 2', dataEndpoints: ['fear_greed'], mobileOrder: 3 },
      { id: 'correlation', component: 'CorrelationWidget', title: 'Correlation Matrix', gridColumn: 'span 2', dataEndpoints: ['markets'], mobileOrder: 4 },
      { id: 'multi-line', component: 'MultiLineChartWidget', title: 'Price Comparison (7d)', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { coinIds: ['bitcoin', 'ethereum', 'solana'] }, mobileOrder: 5 },
      { id: 'gainers', component: 'GainersLosersWidget', title: 'Volatility Leaders', gridColumn: '1 / -1', dataEndpoints: ['markets'], mobileOrder: 6 },
    ],
  },

  {
    slug: 'technical-analysis',
    name: 'Technical Analysis',
    description: 'Advanced technical view with candlestick, volume, multi-coin overlay, and price action analysis.',
    icon: '📐',
    tier: 'pro',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'ohlc'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Technical Stats', gridColumn: '1 / -1', dataEndpoints: ['global', 'markets'], props: { mode: 'trading' }, mobileOrder: 1 },
      { id: 'candlestick', component: 'CandlestickChartWidget', title: 'BTC Candlestick (30d)', gridColumn: '1 / -1', dataEndpoints: ['ohlc'], props: { coinId: 'bitcoin', days: 30 }, mobileOrder: 2 },
      { id: 'volume', component: 'VolumeChartWidget', title: 'Volume Analysis', gridColumn: 'span 2', dataEndpoints: ['markets'], mobileOrder: 3 },
      { id: 'multi-line', component: 'MultiLineChartWidget', title: 'BTC vs ETH (7d %)', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { coinIds: ['bitcoin', 'ethereum'] }, mobileOrder: 4 },
      { id: 'price-chart', component: 'PriceChartWidget', title: 'BTC Price Trend', gridColumn: 'span 2', dataEndpoints: ['ohlc'], props: { coinId: 'bitcoin', days: 30 }, mobileOrder: 5 },
      { id: 'compare', component: 'CoinCompareWidget', title: 'Coin Stats', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { coinIds: ['bitcoin', 'ethereum', 'solana'] }, mobileOrder: 6 },
    ],
  },

  {
    slug: 'whale-watch',
    name: 'Whale Watch',
    description: 'Track large-cap volume patterns, exchange volumes, and whale-driven market movements.',
    icon: '🐋',
    tier: 'pro',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'exchanges'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Volume Stats', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'exchange-vol', component: 'ExchangeVolumeWidget', title: 'Exchange Volume', gridColumn: 'span 2', dataEndpoints: ['exchanges'], mobileOrder: 2 },
      { id: 'volume', component: 'VolumeChartWidget', title: 'Coin Volume Rankings', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 15 }, mobileOrder: 3 },
      { id: 'treemap', component: 'TreemapWidget', title: 'Volume Treemap', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 30 }, mobileOrder: 4 },
      { id: 'pie', component: 'PieChartWidget', title: 'Volume Distribution', gridColumn: 'span 2', dataEndpoints: ['global'], props: { mode: 'volume' }, mobileOrder: 5 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Highest Volume', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 20 }, mobileOrder: 6 },
    ],
  },

  {
    slug: 'correlation-matrix',
    name: 'Correlation Matrix',
    description: 'Visualize asset correlations with heatmap, price overlays, and side-by-side comparison tables.',
    icon: '🔀',
    tier: 'pro',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Market Context', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'correlation', component: 'CorrelationWidget', title: 'Correlation Matrix (Top 8)', gridColumn: 'span 2', dataEndpoints: ['markets'], mobileOrder: 2 },
      { id: 'multi-line', component: 'MultiLineChartWidget', title: 'Price Overlay (7d %)', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { coinIds: ['bitcoin', 'ethereum', 'solana', 'cardano'] }, mobileOrder: 3 },
      { id: 'compare', component: 'CoinCompareWidget', title: 'Side-by-Side Stats', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { coinIds: ['bitcoin', 'ethereum', 'solana', 'cardano'] }, mobileOrder: 4 },
      { id: 'radar', component: 'RadarChartWidget', title: 'Metric Comparison', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { coinIds: ['bitcoin', 'ethereum', 'solana', 'cardano'] }, mobileOrder: 5 },
    ],
  },

  {
    slug: 'exchange-tracker',
    name: 'Exchange Tracker',
    description: 'Compare crypto exchanges by volume, trust score, and market share.',
    icon: '🏛️',
    tier: 'pro',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'exchanges'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Exchange Stats', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'exchange-vol', component: 'ExchangeVolumeWidget', title: 'Exchange Volume (BTC)', gridColumn: 'span 2', dataEndpoints: ['exchanges'], mobileOrder: 2 },
      { id: 'pie', component: 'PieChartWidget', title: 'Market Share', gridColumn: 'span 2', dataEndpoints: ['global'], props: { mode: 'volume' }, mobileOrder: 3 },
      { id: 'volume', component: 'VolumeChartWidget', title: 'Coin Volume', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 12 }, mobileOrder: 4 },
      { id: 'dominance', component: 'DominanceWidget', title: 'Market Dominance', gridColumn: 'span 2', dataEndpoints: ['global'], mobileOrder: 5 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Top Coins by Volume', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 15 }, mobileOrder: 6 },
    ],
  },

  {
    slug: 'nft-gaming',
    name: 'NFT & Gaming',
    description: 'Track NFT and gaming token performance with category heatmaps and trending coins.',
    icon: '🎮',
    tier: 'pro',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'trending', 'categories'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'NFT & Gaming Stats', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'category-bar', component: 'CategoryBarWidget', title: 'Gaming/NFT Sectors', gridColumn: 'span 2', dataEndpoints: ['categories'], props: { limit: 12 }, mobileOrder: 2 },
      { id: 'trending', component: 'TrendingWidget', title: 'Trending Tokens', gridColumn: 'span 2', dataEndpoints: ['trending'], mobileOrder: 3 },
      { id: 'heatmap', component: 'HeatmapWidget', title: 'Sector Heatmap', gridColumn: '1 / -1', dataEndpoints: ['categories'], mobileOrder: 4 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Top Tokens', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 20 }, mobileOrder: 5 },
    ],
  },

  {
    slug: 'supply-analysis',
    name: 'Supply Analysis',
    description: 'Analyze token supply metrics — circulating vs max supply, distribution, and scarcity.',
    icon: '🔢',
    tier: 'pro',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Supply Stats', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'supply', component: 'SupplyWidget', title: 'Circulating vs Max Supply', gridColumn: 'span 2', dataEndpoints: ['markets'], props: { limit: 12 }, mobileOrder: 2 },
      { id: 'pie', component: 'PieChartWidget', title: 'Market Share', gridColumn: 'span 2', dataEndpoints: ['global'], props: { mode: 'dominance' }, mobileOrder: 3 },
      { id: 'top-coins', component: 'TopCoinsTable', title: 'Supply Rankings', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 20 }, mobileOrder: 4 },
      { id: 'treemap', component: 'TreemapWidget', title: 'Market Cap Treemap', gridColumn: '1 / -1', dataEndpoints: ['markets'], props: { limit: 30 }, mobileOrder: 5 },
    ],
  },

  {
    slug: 'social-sentiment',
    name: 'Social & Sentiment',
    description: 'Gauge market sentiment with Fear & Greed, trending coins, category momentum, and social signals.',
    icon: '💬',
    tier: 'pro',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'trending', 'fear_greed', 'categories'],
    widgets: [
      { id: 'kpis', component: 'KPICards', title: 'Sentiment Overview', gridColumn: '1 / -1', dataEndpoints: ['global'], mobileOrder: 1 },
      { id: 'fear-greed', component: 'FearGreedWidget', title: 'Fear & Greed Index', gridColumn: 'span 2', dataEndpoints: ['fear_greed'], mobileOrder: 2 },
      { id: 'trending', component: 'TrendingWidget', title: 'Trending Now', gridColumn: 'span 2', dataEndpoints: ['trending'], mobileOrder: 3 },
      { id: 'category-bar', component: 'CategoryBarWidget', title: 'Sector Momentum', gridColumn: 'span 2', dataEndpoints: ['categories'], props: { limit: 12 }, mobileOrder: 4 },
      { id: 'gainers', component: 'GainersLosersWidget', title: 'Biggest Movers', gridColumn: 'span 2', dataEndpoints: ['markets'], mobileOrder: 5 },
      { id: 'heatmap', component: 'HeatmapWidget', title: 'Sentiment Heatmap', gridColumn: '1 / -1', dataEndpoints: ['categories'], mobileOrder: 6 },
    ],
  },
];

export function getDashboardBySlug(slug: string): LiveDashboardDefinition | undefined {
  return LIVE_DASHBOARDS.find((d) => d.slug === slug);
}
