/**
 * Dashboard Credits — Dune-style pay-per-action pricing
 *
 * No subscription required. Buy credits, use them for exports, AI, and premium features.
 * Credits never expire.
 */

export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    credits: 100,
    price: 4.99,
    perCredit: 0.05,
    popular: false,
    savings: null,
    description: 'Perfect for trying out premium features',
    fastspringProductId: 'crk-credits-100',  // For FastSpring integration
  },
  {
    id: 'builder',
    name: 'Builder',
    credits: 500,
    price: 19.99,
    perCredit: 0.04,
    popular: true,
    savings: '20%',
    description: 'Most popular — great for regular use',
    fastspringProductId: 'crk-credits-500',
  },
  {
    id: 'power',
    name: 'Power',
    credits: 1500,
    price: 49.99,
    perCredit: 0.033,
    popular: false,
    savings: '33%',
    description: 'Best value for power users',
    fastspringProductId: 'crk-credits-1500',
  },
  {
    id: 'whale',
    name: 'Whale',
    credits: 5000,
    price: 129.99,
    perCredit: 0.026,
    popular: false,
    savings: '48%',
    description: 'Maximum savings for heavy usage',
    fastspringProductId: 'crk-credits-5000',
  },
] as const;

export type CreditPackageId = typeof CREDIT_PACKAGES[number]['id'];

export const CREDIT_COSTS = {
  // Exports
  export_png: { cost: 2, label: 'PNG Export', category: 'export' },
  export_pdf: { cost: 3, label: 'PDF Export', category: 'export' },
  export_excel: { cost: 5, label: 'Excel Export', category: 'export' },
  export_csv: { cost: 3, label: 'CSV Export', category: 'export' },

  // AI Features
  ai_chat_query: { cost: 1, label: 'AI Chat Query', category: 'ai' },
  ai_dashboard_build: { cost: 3, label: 'AI Dashboard Build', category: 'ai' },

  // Premium additions
  hd_export: { cost: 2, label: 'HD Resolution (2x)', category: 'premium' },
  no_watermark: { cost: 1, label: 'Remove Watermark', category: 'premium' },
  bulk_export: { cost: 10, label: 'Bulk Export (all formats)', category: 'premium' },
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

/** Free features that don't cost credits */
export const FREE_FEATURES = [
  'View any dashboard (curated, protocol, coin, community)',
  'Auto-refresh & real-time data',
  'Widget customization & themes',
  'Browser-based alerts',
  'Embed widgets on your site',
  'Share dashboard links',
  'Community dashboard publishing',
  '25 free credits on signup',
] as const;

/** What credits unlock */
export const CREDIT_FEATURES = [
  'Export dashboards as PNG, PDF, Excel, CSV',
  'AI-powered chat on any dashboard',
  'AI dashboard builder (describe → generate)',
  'HD resolution exports (2x)',
  'Watermark-free exports',
  'Bulk export (all formats at once)',
] as const;

export const WELCOME_CREDITS = 25;
