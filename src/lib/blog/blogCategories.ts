export interface BlogCategory {
  id: string;
  title: string;
  description: string;
  coverEmoji: string;
  ctaHref: string;
  ctaLabel: string;
}

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    id: 'market-analysis',
    title: 'Market Analysis',
    description: 'Technical analysis, price action breakdowns, and market outlook.',
    coverEmoji: '📊',
    ctaHref: '/live-dashboards',
    ctaLabel: 'Explore Live Dashboards',
  },
  {
    id: 'defi-yield',
    title: 'DeFi & Yield',
    description: 'DeFi protocol analysis, yield strategies, and liquidity insights.',
    coverEmoji: '🌾',
    ctaHref: '/defi',
    ctaLabel: 'Track DeFi Yields',
  },
  {
    id: 'education',
    title: 'Education & Guides',
    description: 'Beginner-friendly guides, how-tos, and crypto fundamentals.',
    coverEmoji: '📚',
    ctaHref: '/learn',
    ctaLabel: 'Start Learning',
  },
  {
    id: 'news-regulation',
    title: 'News & Regulation',
    description: 'Regulatory developments, industry news analysis, and compliance updates.',
    coverEmoji: '📰',
    ctaHref: '/blog',
    ctaLabel: 'Read More Articles',
  },
];

export function getBlogCategory(id: string): BlogCategory | undefined {
  return BLOG_CATEGORIES.find((c) => c.id === id);
}
