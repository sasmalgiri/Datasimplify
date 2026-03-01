export interface ForumCategory {
  id: string;
  title: string;
  description: string;
  iconName: string;
  color: string;
}

export const FORUM_CATEGORIES: ForumCategory[] = [
  {
    id: 'market-analysis',
    title: 'Market Analysis & Predictions',
    description: 'Share technical analysis, price predictions, and market outlook for Bitcoin, Ethereum, and altcoins.',
    iconName: 'TrendingUp',
    color: 'emerald',
  },
  {
    id: 'trading-strategies',
    title: 'Trading Strategies & Tools',
    description: 'Discuss confluence strategies, backtesting setups, indicator combinations, and CryptoReportKit DataLab tips.',
    iconName: 'BarChart3',
    color: 'blue',
  },
  {
    id: 'defi-yield',
    title: 'DeFi, Yield & Staking',
    description: 'Explore DeFi protocols, yield farming opportunities, staking strategies, and liquidity pool analysis.',
    iconName: 'Lightbulb',
    color: 'purple',
  },
  {
    id: 'security-scams',
    title: 'Security & Scam Alerts',
    description: 'Report scams, discuss wallet security, smart contract audits, and protect yourself from crypto fraud.',
    iconName: 'Shield',
    color: 'red',
  },
  {
    id: 'education',
    title: 'Education & Beginners',
    description: 'Ask questions, learn crypto fundamentals, understand blockchain technology, and get started with trading.',
    iconName: 'BookOpen',
    color: 'amber',
  },
  {
    id: 'general',
    title: 'General Discussion',
    description: 'Off-topic crypto chat, news reactions, project discussions, memes, and community introductions.',
    iconName: 'MessageCircle',
    color: 'gray',
  },
];

export const VALID_CATEGORY_IDS = FORUM_CATEGORIES.map((c) => c.id);

export function getCategoryById(id: string): ForumCategory | undefined {
  return FORUM_CATEGORIES.find((c) => c.id === id);
}
