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
  {
    slug: 'market-overview',
    name: 'Market Overview',
    description: 'Complete crypto market snapshot with top coins, gainers, trending, and global stats.',
    icon: '📊',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'trending', 'fear_greed'],
    widgets: [
      {
        id: 'kpis',
        component: 'KPICards',
        title: 'Market Stats',
        gridColumn: '1 / -1',
        dataEndpoints: ['global'],
        mobileOrder: 1,
      },
      {
        id: 'top-coins',
        component: 'TopCoinsTable',
        title: 'Top Cryptocurrencies',
        gridColumn: '1 / -1',
        dataEndpoints: ['markets'],
        props: { limit: 20 },
        mobileOrder: 3,
      },
      {
        id: 'gainers',
        component: 'GainersLosersWidget',
        title: 'Top Movers (24h)',
        gridColumn: 'span 2',
        dataEndpoints: ['markets'],
        mobileOrder: 4,
      },
      {
        id: 'trending',
        component: 'TrendingWidget',
        title: 'Trending Now',
        gridColumn: 'span 2',
        dataEndpoints: ['trending'],
        mobileOrder: 5,
      },
      {
        id: 'fear-greed',
        component: 'FearGreedWidget',
        title: 'Fear & Greed Index',
        gridColumn: 'span 2',
        dataEndpoints: ['fear_greed'],
        mobileOrder: 2,
      },
      {
        id: 'dominance',
        component: 'DominanceWidget',
        title: 'Market Dominance',
        gridColumn: 'span 2',
        dataEndpoints: ['global'],
        mobileOrder: 6,
      },
    ],
  },
  {
    slug: 'bitcoin',
    name: 'Bitcoin Dashboard',
    description: 'In-depth Bitcoin analysis with price chart, technicals, and market sentiment.',
    icon: '₿',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'fear_greed', 'ohlc'],
    widgets: [
      {
        id: 'kpis',
        component: 'KPICards',
        title: 'Bitcoin Stats',
        gridColumn: '1 / -1',
        dataEndpoints: ['markets', 'global'],
        props: { mode: 'bitcoin' },
        mobileOrder: 1,
      },
      {
        id: 'price-chart',
        component: 'PriceChartWidget',
        title: 'BTC Price (30d)',
        gridColumn: 'span 2',
        dataEndpoints: ['ohlc'],
        props: { coinId: 'bitcoin', days: 30 },
        mobileOrder: 2,
      },
      {
        id: 'fear-greed',
        component: 'FearGreedWidget',
        title: 'Market Sentiment',
        gridColumn: 'span 2',
        dataEndpoints: ['fear_greed'],
        mobileOrder: 3,
      },
      {
        id: 'top-coins',
        component: 'TopCoinsTable',
        title: 'Market Context',
        gridColumn: '1 / -1',
        dataEndpoints: ['markets'],
        props: { limit: 10 },
        mobileOrder: 4,
      },
    ],
  },
  {
    slug: 'portfolio',
    name: 'Portfolio Overview',
    description: 'Track your portfolio with detailed coin data, price charts, and market context.',
    icon: '💼',
    tier: 'free',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'fear_greed'],
    widgets: [
      {
        id: 'kpis',
        component: 'KPICards',
        title: 'Market Summary',
        gridColumn: '1 / -1',
        dataEndpoints: ['global'],
        mobileOrder: 1,
      },
      {
        id: 'top-coins',
        component: 'TopCoinsTable',
        title: 'Top 50 Coins',
        gridColumn: '1 / -1',
        dataEndpoints: ['markets'],
        props: { limit: 50 },
        mobileOrder: 2,
      },
      {
        id: 'fear-greed',
        component: 'FearGreedWidget',
        title: 'Market Sentiment',
        gridColumn: 'span 2',
        dataEndpoints: ['fear_greed'],
        mobileOrder: 3,
      },
      {
        id: 'dominance',
        component: 'DominanceWidget',
        title: 'Market Dominance',
        gridColumn: 'span 2',
        dataEndpoints: ['global'],
        mobileOrder: 4,
      },
    ],
  },
  {
    slug: 'defi-tracker',
    name: 'DeFi Tracker',
    description: 'Track top DeFi protocols, TVL, and yields across chains.',
    icon: '🔗',
    tier: 'pro',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'categories'],
    widgets: [
      {
        id: 'kpis',
        component: 'KPICards',
        title: 'DeFi Stats',
        gridColumn: '1 / -1',
        dataEndpoints: ['global'],
        props: { mode: 'defi' },
        mobileOrder: 1,
      },
      {
        id: 'top-coins',
        component: 'TopCoinsTable',
        title: 'Top DeFi Tokens',
        gridColumn: '1 / -1',
        dataEndpoints: ['markets'],
        props: { limit: 20, category: 'defi' },
        mobileOrder: 2,
      },
      {
        id: 'dominance',
        component: 'DominanceWidget',
        title: 'DeFi vs Market',
        gridColumn: 'span 2',
        dataEndpoints: ['global'],
        mobileOrder: 3,
      },
      {
        id: 'fear-greed',
        component: 'FearGreedWidget',
        title: 'Market Sentiment',
        gridColumn: 'span 2',
        dataEndpoints: ['fear_greed'],
        mobileOrder: 4,
      },
    ],
  },
  {
    slug: 'trader',
    name: 'Trader Dashboard',
    description: 'Active trading view with price action, top movers, and market momentum.',
    icon: '📈',
    tier: 'pro',
    gridColumns: 4,
    requiredEndpoints: ['markets', 'global', 'trending', 'ohlc', 'fear_greed'],
    widgets: [
      {
        id: 'kpis',
        component: 'KPICards',
        title: 'Trading Stats',
        gridColumn: '1 / -1',
        dataEndpoints: ['global', 'markets'],
        props: { mode: 'trading' },
        mobileOrder: 1,
      },
      {
        id: 'price-chart',
        component: 'PriceChartWidget',
        title: 'BTC/USD (30d)',
        gridColumn: 'span 2',
        dataEndpoints: ['ohlc'],
        props: { coinId: 'bitcoin', days: 30 },
        mobileOrder: 2,
      },
      {
        id: 'gainers',
        component: 'GainersLosersWidget',
        title: 'Top Movers',
        gridColumn: 'span 2',
        dataEndpoints: ['markets'],
        mobileOrder: 3,
      },
      {
        id: 'trending',
        component: 'TrendingWidget',
        title: 'Trending Coins',
        gridColumn: 'span 2',
        dataEndpoints: ['trending'],
        mobileOrder: 4,
      },
      {
        id: 'fear-greed',
        component: 'FearGreedWidget',
        title: 'Sentiment',
        gridColumn: 'span 2',
        dataEndpoints: ['fear_greed'],
        mobileOrder: 5,
      },
    ],
  },
];

export function getDashboardBySlug(slug: string): LiveDashboardDefinition | undefined {
  return LIVE_DASHBOARDS.find((d) => d.slug === slug);
}
