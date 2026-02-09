// ============================================
// CryptoReportKit - Monetization Architecture
// ============================================
// 
// This defines how the BYOK Power Query solution generates revenue
// while keeping users in control of their own API keys.
//

/*
┌─────────────────────────────────────────────────────────────────┐
│                    REVENUE MODEL                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. TEMPLATE SALES (One-time)                                   │
│     ├── Free Starter Template ───────────────── Lead generation │
│     ├── Pro Template ($29) ──────────────────── Main revenue    │
│     └── Enterprise Template ($99) ───────────── High-value      │
│                                                                  │
│  2. SUBSCRIPTION (Recurring)                                    │
│     ├── Updates + Support ($5/mo) ───────────── Steady income   │
│     └── Team License ($15/mo) ───────────────── B2B revenue     │
│                                                                  │
│  3. AFFILIATE COMMISSIONS (Recurring)                           │
│     ├── CoinGecko Pro signup ────────────────── 20-30%          │
│     ├── Glassnode signup ────────────────────── 20%             │
│     └── Other API providers ─────────────────── 15-25%          │
│                                                                  │
│  4. WEB DASHBOARD (SaaS - Recurring)                            │
│     ├── API Key Manager ─────────────────────── Value-add       │
│     ├── Usage Analytics ─────────────────────── Value-add       │
│     └── Alert System ────────────────────────── Value-add       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

PROJECTED REVENUE (Conservative):
─────────────────────────────────
Template Sales:     100 sales/mo × $29 avg  = $2,900/mo
Subscriptions:      200 users × $5/mo       = $1,000/mo
Affiliates:         50 signups/mo × $10 avg = $500/mo
Dashboard SaaS:     100 users × $9/mo       = $900/mo
─────────────────────────────────────────────────────────
TOTAL:                                        $5,300/mo

PROJECTED REVENUE (Growth):
─────────────────────────────────
Template Sales:     500 sales/mo × $35 avg  = $17,500/mo
Subscriptions:      1000 users × $7/mo      = $7,000/mo
Affiliates:         200 signups/mo × $15    = $3,000/mo
Dashboard SaaS:     500 users × $12/mo      = $6,000/mo
─────────────────────────────────────────────────────────
TOTAL:                                        $33,500/mo
*/

export const PRICING_TIERS = {
  templates: {
    free: {
      name: "Starter",
      price: 0,
      features: [
        "Top 10 cryptocurrencies",
        "Basic price table",
        "Manual refresh",
        "Community support"
      ],
      cta: "Download Free"
    },
    pro: {
      name: "Pro",
      price: 29,
      priceType: "one-time",
      features: [
        "Top 100 cryptocurrencies",
        "Auto-refresh (configurable)",
        "Portfolio tracker",
        "Interactive charts",
        "DCA calculator",
        "Email support",
        "Lifetime updates"
      ],
      cta: "Buy Pro Template",
      popular: true
    },
    enterprise: {
      name: "Enterprise",
      price: 99,
      priceType: "one-time",
      features: [
        "All 10,000+ cryptocurrencies",
        "Multi-portfolio support",
        "Risk analytics (Sharpe, Sortino)",
        "Correlation matrix",
        "Custom dashboards",
        "Historical data (5 years)",
        "Priority support",
        "Custom modifications"
      ],
      cta: "Buy Enterprise"
    }
  },
  
  subscriptions: {
    updates: {
      name: "Pro Updates",
      price: 5,
      interval: "month",
      features: [
        "All template updates",
        "New feature releases",
        "Email support",
        "Member Discord access"
      ]
    },
    team: {
      name: "Team License",
      price: 15,
      interval: "month",
      features: [
        "Up to 10 users",
        "Shared templates",
        "Priority support",
        "Custom onboarding"
      ]
    }
  },

  dashboard: {
    free: {
      name: "Dashboard Free",
      price: 0,
      features: [
        "Store 1 API key",
        "Basic usage stats"
      ]
    },
    pro: {
      name: "Dashboard Pro",
      price: 9,
      interval: "month",
      features: [
        "Unlimited API keys",
        "Usage analytics",
        "Price alerts (email)",
        "Portfolio sync",
        "API health monitoring"
      ]
    }
  }
};

export const AFFILIATE_LINKS = {
  coingecko: {
    name: "CoinGecko Pro",
    url: "https://www.coingecko.com/api/pricing?ref=cryptoreportkit",
    commission: "20-30% recurring",
    description: "Higher rate limits, more endpoints"
  },
  glassnode: {
    name: "Glassnode",
    url: "https://glassnode.com/?ref=cryptoreportkit",
    commission: "20% recurring",
    description: "On-chain analytics"
  },
  messari: {
    name: "Messari Pro",
    url: "https://messari.io/?ref=cryptoreportkit",
    commission: "20% first year",
    description: "Research & data"
  }
};

// Template download tracking (for analytics)
export const TEMPLATE_DOWNLOADS = {
  free: "/api/downloads/free-template",
  pro: "/api/downloads/pro-template",
  enterprise: "/api/downloads/enterprise-template"
};

// ============================================
// CRK EXCEL ADD-IN - STANDALONE PRICING
// ============================================

export const ADDIN_PRICING_TIERS = {
  free: {
    name: 'Free',
    price: 0,
    interval: null,
    dailyApiCalls: 100,
    maxCoinsPerRequest: 10,
    maxOhlcvDays: 7,
    functionsAccess: 'basic',
    features: [
      '100 API calls/day',
      '10 basic functions',
      '10 coins per request',
      '7 days OHLCV history',
      'Community support',
    ],
    cta: 'Get Started Free',
    coingeckoRateNote: 'CoinGecko free tier: 30 calls/min',
  },
  pro: {
    name: 'Pro',
    price: 49,
    yearlyPrice: 490,
    interval: 'month',
    dailyApiCalls: 5000,
    maxCoinsPerRequest: 100,
    maxOhlcvDays: 365,
    functionsAccess: 'all',
    features: [
      '5,000 API calls/day',
      'All 70+ functions',
      '100 coins per request',
      '1 year OHLCV history',
      'Technical indicators (RSI, MACD, BB)',
      'Batch & compare functions',
      'Email support',
      'Priority data refresh',
    ],
    cta: 'Start Pro Trial',
    popular: true,
    fastspringProductId: 'crk-addin-pro-monthly',
    fastspringYearlyProductId: 'crk-addin-pro-yearly',
  },
  premium: {
    name: 'Premium',
    price: 199,
    yearlyPrice: 1990,
    interval: 'month',
    dailyApiCalls: 50000,
    maxCoinsPerRequest: 500,
    maxOhlcvDays: 730,
    functionsAccess: 'all',
    features: [
      '50,000 API calls/day',
      'All 70+ functions',
      '500 coins per request',
      '2 years OHLCV history',
      'DEX pools & GeckoTerminal data',
      'DCA & ROI calculators',
      'Dedicated support',
      'Custom function requests',
    ],
    cta: 'Get Premium',
    fastspringProductId: 'crk-addin-premium-monthly',
    fastspringYearlyProductId: 'crk-addin-premium-yearly',
  },
};

/** Functions available on the free tier (all others require Pro+) */
export const FUNCTION_TIERS = {
  free: [
    'PRICE', 'CHANGE24H', 'MARKETCAP', 'VOLUME', 'OHLCV',
    'INFO', 'RANK', 'GLOBAL', 'FEARGREED', 'SEARCH',
  ],
  pro: 'all' as const,
  premium: 'all' as const,
};
