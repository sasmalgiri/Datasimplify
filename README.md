# DataSimplify - Professional Crypto Analytics Platform

> **Democratizing Financial Data for Everyone**
> All-in-one crypto analytics with CryptoSheets Excel integration at $19-49/mo (vs competitors at $100-1,299/mo)

---

## Why DataSimplify?

| Feature | DataSimplify | CoinGecko Pro | Glassnode | TradingView |
|---------|--------------|---------------|-----------|-------------|
| Price | **$19-49/mo** | $129/mo | $799/mo | $599/mo |
| Excel Templates | **Yes (CryptoSheets)** | No | No | No |
| Historical Data | **2 years** | 2 years | Limited | Limited |
| On-Chain Metrics | **Yes** | Basic | Yes | No |
| AI Assistant | **Yes** | No | No | No |
| Whale Tracking | **Yes** | No | Yes | No |
| DeFi Analytics | **Yes** | Limited | No | No |

---

## Key Features

### CryptoSheets - Excel Template Generator
Download professional Excel templates that pull live crypto data:
- **Interactive Templates** - Power Query formulas that refresh automatically
- **Native Chart Templates** - Pre-built Excel charts with live data feeds
- **Embedded Data Templates** - Static snapshots for offline analysis
- **Formula-Only Templates** - Build your own dashboards with our formulas

**4 content types available:**
1. Interactive (Power Query + Auto-refresh)
2. Native Charts (Excel charts with live data)
3. Embedded (Static data snapshot)
4. Formulas Only (DIY building blocks)

### Real-Time Market Data
- **200+ cryptocurrencies** tracked in real-time
- **Binance** as primary source (fast, reliable, redistributable)
- **CoinGecko Analyst** integration (500K API calls/month)
- **2 years historical data** (daily, hourly, 5-minute intervals)

### 92 Pages Built

| Category | Pages |
|----------|-------|
| Market Data | Market, Screener, Gainers/Losers, Trending, Recently Added |
| Charts | Advanced Charts, Candlesticks, Price History |
| Analytics | Technical Analysis, Correlation, Risk Dashboard |
| On-Chain | Whale Tracker, On-Chain Metrics, DEX Pools |
| Sentiment | Fear & Greed, Social Sentiment, Community |
| DeFi | DeFi Dashboard, Global Market, Categories |
| Tools | Portfolio, Backtest, Alerts, Compare, Predictions |
| Learn | Academy, Glossary, Research, FAQ |
| Downloads | CryptoSheets Templates, Data Export |

### 24+ Protected API Endpoints

All external data APIs are protected against scraping:
- `/api/crypto/*` - Market data (Binance primary, CoinGecko fallback)
- `/api/charts/*` - OHLCV candlestick data
- `/api/sentiment/*` - Fear & Greed Index
- `/api/defi/*` - DeFi protocol data (DefiLlama)
- `/api/whales/*` - Whale transaction tracking
- `/api/technical/*` - Technical indicators
- `/api/onchain/*` - On-chain metrics

---

## Data Sources & Compliance

### Primary: Binance (Redistributable)
- Real-time prices, 24h volume, market cap
- OHLCV candlestick data (1h, 4h, 1d, 1w intervals)
- Up to 1000 candles per request (~2.7 years daily data)
- **No API key required** for public endpoints

### Secondary: CoinGecko Analyst ($103.2/mo)
- 500,000 API calls/month
- 70+ endpoints (vs 30+ in free tier)
- Top gainers/losers, trending coins
- Recently listed coins
- NFT floor prices
- Historical global market cap
- GeckoTerminal DEX data

**Analyst Plan Limits:**
| Data Type | Max History |
|-----------|-------------|
| Daily OHLCV | 2 years (730 days) |
| Hourly OHLCV | 2 years |
| 5-minute data | 1 day |

### Other Sources
| Source | Data | License |
|--------|------|---------|
| DefiLlama | DeFi TVL, protocols | Free, open |
| Alternative.me | Fear & Greed Index | Free |
| Etherscan/Blockchair | Whale transactions | Free tier |
| Sourcify | Smart contract verification | Free |

---

## API Security

All data routes enforce **display-only** access:

```typescript
// External scraping is blocked
const blocked = enforceDisplayOnly(request, '/api/crypto');
if (blocked) return blocked;
```

**Protection includes:**
- `Sec-Fetch-Site` header validation (browser-controlled, cannot be spoofed)
- Origin/Referer hostname verification
- Production domain allowlist
- Vercel preview URL support

**Redistribution Policy:**
- CoinGecko data: Display only (no downloads without license)
- Binance data: Redistributable for charts and displays
- Downloads use Binance-derived data only

---

## Quick Start

```bash
# 1. Clone and install
git clone <repo-url>
cd datasimplify
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your API keys

# 3. Start development server
npm run dev

# 4. Open http://localhost:3000
```

---

## Environment Configuration

### Minimal Setup (Free APIs)
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Feature flags - enable what you need
NEXT_PUBLIC_FEATURE_COINGECKO=true
NEXT_PUBLIC_FEATURE_DEFI=true
NEXT_PUBLIC_FEATURE_WHALES=true
```

### Full Setup (All Features)
```env
# Site URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# CoinGecko Analyst API (recommended)
COINGECKO_API_KEY=your-api-key

# Supabase (for auth & caching)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI (choose one)
GROQ_API_KEY=your-groq-key
# or
OPENAI_API_KEY=your-openai-key

# Feature flags
NEXT_PUBLIC_FEATURE_COINGECKO=true
NEXT_PUBLIC_FEATURE_DEFI=true
NEXT_PUBLIC_FEATURE_WHALES=true
NEXT_PUBLIC_FEATURE_SOCIAL_SENTIMENT=true
NEXT_PUBLIC_FEATURE_NFT=true

# Redistribution policy (production)
REDISTRIBUTION_MODE=strict
REDISTRIBUTABLE_SOURCES=binance,alternativeme,defillama
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (Turbopack) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + Custom |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Payments | Paddle (MoR) |
| AI | Groq / OpenAI / Ollama |
| Charts | Recharts, Lightweight Charts |

---

## Project Structure

```
datasimplify/
├── src/
│   ├── app/                    # Next.js App Router (92 pages)
│   │   ├── api/               # 24+ API routes
│   │   │   ├── crypto/        # Market data endpoints
│   │   │   ├── charts/        # Candlestick/history data
│   │   │   ├── defi/          # DeFi protocol data
│   │   │   ├── sentiment/     # Fear & Greed
│   │   │   ├── whales/        # Whale tracking
│   │   │   ├── technical/     # Technical indicators
│   │   │   └── templates/     # CryptoSheets downloads
│   │   └── [pages]/           # All page routes
│   │
│   ├── components/
│   │   ├── features/          # Feature components
│   │   ├── download/          # CryptoSheets components
│   │   └── ui/                # UI components
│   │
│   └── lib/
│       ├── binance.ts         # Binance API client
│       ├── coingecko/         # CoinGecko client + budget
│       ├── apiSecurity.ts     # Display-only enforcement
│       ├── redistributionPolicy.ts  # Data licensing
│       └── featureFlags.ts    # Feature toggles
│
├── supabase/                  # Database schemas
└── public/                    # Static assets
```

---

## Analytics Features

### Market Analytics
| Feature | Description |
|---------|-------------|
| Treemap | Visual market cap visualization |
| Screener | Filter by price, volume, change |
| Gainers/Losers | Top movers (24h, 7d, 30d) |
| Trending | CoinGecko trending coins |
| Global Market | Total market cap, BTC dominance |

### Technical Analysis
- 12 indicators (RSI, MACD, Bollinger, SMA, EMA, etc.)
- Multiple timeframes (1h, 4h, 1d, 1w)
- Bullish/Bearish/Neutral state indicators
- Educational interpretations (not trading advice)

### On-Chain Metrics
- Whale transaction tracking (ETH, BTC)
- Exchange inflow/outflow estimates
- Fear & Greed Index with 365-day history
- DEX pool analytics (GeckoTerminal)

### DeFi Dashboard
- Protocol TVL rankings
- Stablecoin market data
- Chain-by-chain breakdown
- Yield opportunities

### Risk Analysis
- Portfolio VaR calculation
- Sharpe/Sortino ratios
- Correlation heatmap
- Max drawdown analysis

---

## Pricing Tiers

| Tier | Price | Key Features |
|------|-------|--------------|
| **Free** | $0 | 5 downloads/mo, Basic market data |
| **Starter** | $19/mo | 50 downloads, CryptoSheets, Screener |
| **Pro** | $49/mo | Unlimited, Technical, Whales, AI |
| **Business** | $99/mo | API access, Alerts, Priority support |

---

## Budget Management

CoinGecko Analyst plan budget allocation:

| Category | Calls/Day | Description |
|----------|-----------|-------------|
| Prices | 1,440 | Top 200 coins, every 60s |
| OHLCV | 200 | Daily candlestick data |
| Metadata | 5,000 | Coin details, hourly |
| Historical | 500 | Backfill requests |
| Buffer | 2,000 | Errors/retries |
| **Total** | **9,140** | ~274k/month (55% of 500k budget) |

---

## Troubleshooting

### "API returns 403 Forbidden"
External scraping is blocked. Data is display-only for authenticated internal requests.

### "CoinGecko data unavailable"
- Check `NEXT_PUBLIC_FEATURE_COINGECKO=true`
- Verify `COINGECKO_API_KEY` is set
- Binance is used as fallback for most endpoints

### "Rate limit exceeded"
- Check `/api/diagnostics` for budget status
- Reduce polling frequency
- Use Supabase caching

### Build fails
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

---

## License

MIT License - Free for personal and commercial use

**Data Attribution Requirements:**
- CoinGecko: "Data provided by CoinGecko" with hyperlink
- DefiLlama: Attribution recommended
- Alternative.me: Attribution recommended

---

## Support

- Docs: See `/learn` and `/faq` pages
- Issues: GitHub Issues
- Email: support@datasimplify.com

---

**Built for traders who want professional tools without professional prices.**
