# DataSimplify - Project Context

## What is this project?

DataSimplify (public brand: **CryptoReportKit**) is a **crypto data platform** that democratizes financial data access. It provides real-time market dashboards, analytics tools, live dashboards with 90+ widgets, an Experiment Lab with 27 templates, and CryptoSheets Excel integration.

**Live URL:** https://cryptoreportkit.com

## Tech Stack

- **Frontend:** Next.js 16 + React 19 + TypeScript + Tailwind CSS
- **Database:** Supabase (PostgreSQL + Auth)
- **Payments:** FastSpring (checkout), Paddle (planned migration)
- **AI:** Groq API (llama-3.3-70b-versatile)
- **Data Sources:** CoinGecko API, Binance API, Alternative.me, DeFiLlama, Etherscan, Blockchair
- **Deployment:** Vercel

## Project Structure

```
src/
├── app/                         # 80 pages (Next.js App Router)
│   ├── market/page.tsx          # Market overview (500+ coins)
│   ├── compare/page.tsx         # Compare up to 10 coins side-by-side
│   ├── screener/page.tsx        # Token screener with filters
│   ├── heatmap/page.tsx         # Market cap treemap
│   ├── charts/page.tsx          # Charts + advanced charts
│   ├── technical/page.tsx       # Technical analysis (RSI, MACD, etc.)
│   ├── correlation/page.tsx     # Correlation matrix
│   ├── risk/page.tsx            # Risk dashboard (VaR, Sharpe, etc.)
│   ├── sentiment/page.tsx       # Fear & Greed + social sentiment
│   ├── defi/page.tsx            # DeFi TVL + protocols
│   ├── community/page.tsx       # Forum (Supabase-backed)
│   ├── live-dashboards/         # Live dashboards (90+ widgets)
│   ├── datalab/page.tsx         # DataLab (custom data exploration)
│   ├── templates/page.tsx       # Experiment Lab (27 templates)
│   ├── pricing/page.tsx         # Free + Pro ($19/mo)
│   └── api/                     # 112 API routes
│       ├── crypto/              # Market data endpoints
│       ├── charts/              # OHLCV candlestick data
│       ├── defi/                # DeFi protocol data
│       ├── sentiment/           # Fear & Greed
│       ├── whales/              # Whale tracking
│       ├── technical/           # Technical indicators
│       ├── forum/               # Community forum CRUD
│       ├── live-dashboard/      # Dashboard data
│       ├── v1/                  # Excel add-in API (48 routes)
│       └── templates/           # CryptoSheets downloads
├── components/                  # 211 components
│   ├── features/                # 16 feature components
│   ├── live-dashboard/widgets/  # 88 dashboard widgets
│   ├── experiment/layouts/      # 5 experiment layout types
│   ├── forum/                   # Forum UI components
│   └── ui/                      # UI helpers
└── lib/
    ├── supabase.ts              # Supabase client
    ├── auth.tsx                 # Auth context
    ├── featureFlags.ts          # Feature toggles
    ├── apiSecurity.ts           # Display-only enforcement
    ├── redistributionPolicy.ts  # Data licensing
    ├── coingecko/               # CoinGecko client + budget
    └── live-dashboard/          # Dashboard store + data layer
```

## Current Status (March 2026)

### Completed
- 80 pages, 112 API routes, 211 components
- Live Dashboards with 90+ customizable widgets
- Experiment Lab with 27 differentiated templates across 9 categories
- Community Forum (Supabase-backed with threads, replies, votes)
- DataLab (custom data exploration + export)
- Market, Screener, Heatmap, Gainers/Losers, Trending
- Technical Analysis (RSI, MACD, Bollinger, SMA/EMA, ATR)
- Correlation matrix, Risk dashboard (VaR, Sharpe, Sortino)
- DeFi, On-Chain, Sentiment, Whale tracking
- AI Ask (Groq), Price Alerts with email
- CryptoSheets Excel templates (3 content types)
- Excel Add-in with 85+ custom functions (BYOK)
- Dark theme with emerald accent throughout
- Supabase Auth (email/password)
- FastSpring checkout + webhook handlers
- Feature flag system (free vs full modes)
- Display-only data enforcement + redistribution policy

## Key Design Decisions

1. **No login required for free features** - Public pages show cached data
2. **Free tier:** 5 downloads/month, 5 widgets, 2-coin compare
3. **Color scheme:** Dark theme with emerald (#10b981) as primary accent
4. **BYOK model:** Users provide their own API keys for live data
5. **Display-only enforcement:** CoinGecko data cannot be exported/scraped

## Environment Variables

```env
# Never commit real secrets. Use .env.local (ignored by git) for real values.
# See .env.example for the full list.

NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

GROQ_API_KEY=your-groq-api-key
COINGECKO_API_KEY=your-coingecko-api-key
```

## Database Schema (Supabase)

Key tables:
- `user_profiles` - User subscription info, download counts
- `user_prediction_stats` - Community prediction stats + display names
- `forum_threads` / `forum_replies` / `forum_thread_votes` - Forum system
- `market_data` / `klines` - Cached market data
- `coin_sentiment` / `sentiment_posts` - Sentiment data
- `whale_transactions` - Whale tracking
- `defi_protocols` - DeFi protocol cache

## Pricing

| Tier | Price | Key Features |
|------|-------|--------------|
| Free | $0 | 5 widgets, 2-coin compare, 5 downloads/mo, 30-day history |
| Pro | $19/mo ($190/yr) | 90+ widgets, 10-coin compare, 300 downloads/mo, full history, AI, alerts |

## Contact

This project is built for DataSimplify (brand: CryptoReportKit). The goal is to be a "Bloomberg alternative" for retail crypto investors at 1/100th the cost.
