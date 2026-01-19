'use client';

import { usePathname } from 'next/navigation';
import { PageFeedback } from './PageFeedback';

// Pages where we don't want to show the feedback widget (exact match)
const EXCLUDED_EXACT = [
  '/',         // Homepage - don't block CTAs
  '/pricing',  // Don't interfere with pricing page
];

// Pages where we don't want to show (prefix match)
const EXCLUDED_PREFIXES = [
  '/login',
  '/signup',
  '/auth',
  '/api',
  '/admin',
  '/demo',
  '/checkout',
];

// Map paths to readable titles
function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': 'Homepage',
    '/market': 'Market Data',
    '/charts': 'Charts',
    '/charts/advanced': 'Advanced Charts',
    '/compare': 'Coin Comparison',
    '/correlation': 'Correlation Matrix',
    '/sentiment': 'Fear & Greed Index',
    '/technical': 'Technical Metrics',
    '/trending': 'Trending Coins',
    '/gainers-losers': 'Gainers & Losers',
    '/templates': 'Report Kits',
    '/download': 'Download Templates',
    '/pricing': 'Pricing',
    '/learn': 'Crypto Academy',
    '/glossary': 'Glossary',
    '/faq': 'FAQ',
    '/roadmap': 'Roadmap',
    '/research': 'Research Workspace',
    '/analyst-hub': 'Analyst Hub',
    '/defi': 'DeFi Analytics',
    '/portfolio': 'Portfolio',
    '/screener': 'Coin Screener',
    '/risk': 'Risk Metrics',
  };

  // Check exact match first
  if (titles[pathname]) {
    return titles[pathname];
  }

  // Check for dynamic routes
  if (pathname.startsWith('/coin/')) {
    const coinId = pathname.split('/')[2];
    return `Coin: ${coinId}`;
  }

  if (pathname.startsWith('/templates/')) {
    const kitSlug = pathname.split('/')[2];
    return `Report Kit: ${kitSlug.replace(/-/g, ' ')}`;
  }

  // Default: use path as title
  return pathname
    .split('/')
    .pop()
    ?.replace(/-/g, ' ')
    .replace(/\b\w/g, (l) => l.toUpperCase()) || 'Page';
}

export function FeedbackWrapper() {
  const pathname = usePathname();

  // Don't show on excluded paths (exact match)
  if (EXCLUDED_EXACT.includes(pathname)) {
    return null;
  }

  // Don't show on excluded paths (prefix match)
  if (EXCLUDED_PREFIXES.some((p) => pathname.startsWith(p))) {
    return null;
  }

  // Don't show on 404 or error pages
  if (pathname.includes('_not-found') || pathname.includes('error')) {
    return null;
  }

  return (
    <PageFeedback
      pagePath={pathname}
      pageTitle={getPageTitle(pathname)}
      variant="floating"
    />
  );
}
