# DataSimplify Due-Diligence Report

**Version:** 1.4
**Date:** January 2026
**Status:** Pre-Launch / Pending Compliance Review

---

## 1. Executive Summary

**DataSimplify** is a professional cryptocurrency analytics platform with Excel template generation via CryptoSheets integration, targeting retail traders and analysts who need affordable workflow tools for crypto analysis.

### Value Proposition
- **Price Point:** $0-79/mo (Free, Pro $29, Premium $79)
- **Unique Feature:** Excel templates with CryptoSheets formulas for live crypto data
- **Target Market:** Retail traders, financial analysts, crypto researchers
- **Competitive Moat:** Excel integration + Report Assistant

### Technical Summary
- **92 pages** built and functional
- **48 API routes** serving market, DeFi, on-chain, and sentiment data
- **Browser-origin gated + rate-limited endpoints** (good-faith controls, not hard anti-scraping)
- **3 content types** for Excel templates (Interactive, Native Charts, Formula-only)
- **Report Assistant** - Natural language template selection wizard
- **CryptoSheets Quota Safeguards** - Hard gate, quota estimator, Low-Quota/Pro modes

### Compliance Status
| Area | Status |
|------|--------|
| Data Licensing | Compliant (display-only vs redistributable separation) |
| API Security | Implemented (Sec-Fetch-Site validation) |
| Payment Processing | Paddle-ready (paddle_safe mode available) |
| Attribution | Automated (CoinGecko attribution in footers) |
| Financial Advice | Refused (Report Assistant blocks trading advice queries) |
| CryptoSheets Dependency | Clear (messaging updated across all pages) |

---

## 1.5 Problem Statement & Unique Solution

### The Problem

**Retail crypto traders and analysts face a tooling gap:**

1. **Enterprise tools are prohibitively expensive**
   - Professional on-chain analytics: $100-800+/month
   - Advanced charting platforms: $50-100+/month
   - API access for automation: $100+/month
   - Enterprise terminals: $2,000+/month (inaccessible to individuals)

2. **Free tools lack workflow integration**
   - Free tiers show data but can't export to Excel
   - Manual copy-paste workflows are error-prone and time-consuming
   - No way to build persistent, updatable reports

3. **Existing Excel solutions are broken**
   - Generic crypto Excel templates have static data that goes stale
   - No affordable way to get live data into Excel without expensive API subscriptions
   - CryptoSheets exists but users don't know how to build effective templates

### Our Unique Solution

**DataSimplify sells template software + workflows, not data.**

| What Competitors Do | What We Do Differently |
|---------------------|------------------------|
| Sell data access | Sell template software that uses YOUR data access |
| Require expensive API subscriptions | Work with free CryptoSheets accounts |
| Provide raw data exports | Provide analysis-ready reports with charts |
| Generic dashboards | Customizable templates you control |

### Why This Works

1. **We don't need a Data Redistribution License** - Templates contain formulas, not data. Data flows from user's CryptoSheets account.

2. **Lower price point is sustainable** - Our costs are fixed (hosting, CoinGecko for website display). User data usage scales with their CryptoSheets plan, not ours.

3. **Excel is universal** - 1.2 billion Excel users worldwide. No learning curve for the output format.

4. **CryptoSheets does the hard work** - They handle data sourcing, API reliability, Excel add-in updates. We add value through template design and workflows.

### Competitive Moat

| Moat | Description |
|------|-------------|
| **Excel Integration** | Professional crypto Excel templates with CryptoSheets formulas |
| **Price** | $0-79/mo for template software (data via user's CryptoSheets account) |
| **Report Assistant** | Natural language template selection (no technical knowledge needed) |
| **Quota Awareness** | Templates designed to work within CryptoSheets plan limits |

---

## 2. Feature Boundary Matrix

This matrix defines what each tier can access and what data sources power each feature.

### Tier Feature Access

| Feature | Free ($0) | Pro ($29) | Premium ($79) | Launch* |
|---------|:---------:|:---------:|:-------------:|:-------:|
| **Market Data (Website Display)** |
| Live prices (200+ coins) | 5 coins | Unlimited | Unlimited | Yes |
| Price history | 30 days | Full | Full | Yes |
| OHLCV candlesticks | 1D only | All intervals | All intervals | Yes |
| Trending coins | Read-only | Yes | Yes | Yes |
| Top gainers/losers | Read-only | Yes | Yes | Yes |
| **CryptoSheets Downloads** |
| Monthly downloads | 5 | 50 | Unlimited | Yes |
| Interactive templates | No | Yes | Yes | Yes |
| Native chart templates | No | Yes | Yes | Yes |
| Formula-only templates | Yes | Yes | Yes | Yes |
| **Analytics** |
| Technical indicators | 3 basic | 12 indicators | 12 indicators | Yes |
| Screener filters | Basic | Advanced | Advanced | Yes |
| Correlation heatmap | No | Full | Full | No** |
| Risk dashboard | No | Yes | Yes | No** |
| **On-Chain & DeFi** |
| Fear & Greed Index | Current only | History | History | Yes |
| Whale tracking | No | Full | Full | No** |
| DeFi protocols (TVL) | No | Full | Full | Yes |
| DEX pool analytics | No | Yes | Yes | Yes |
| **Additional Features** |
| Report Assistant | Yes | Yes | Yes | Yes |
| Price alerts | No | Yes | Yes | No** |
| Priority support | No | Email (24-48hr) | Priority (4hr) | Yes |

*Launch = Available in paddle_safe mode (initial launch)
**Disabled in paddle_safe mode; may enable after Paddle approval history established

### Data Source → Feature Mapping

| Feature | Source | License Status |
|---------|--------|:----------------:|
| Live prices | CoinGecko Analyst | Display-only |
| OHLCV candles | CoinGecko Analyst | Display-only |
| Trending coins | CoinGecko Analyst | Display-only |
| Top gainers/losers | CoinGecko Analyst | Display-only |
| Recently added | CoinGecko Analyst | Display-only |
| Fear & Greed | Alternative.me | Verify before redistribution |
| DeFi TVL | DefiLlama | Open data (verify terms) |
| Technical indicators | Computed | Our calculations |

**Important:** All CoinGecko data is display-only on our website. Templates use CryptoSheets formulas - data flows from user's CryptoSheets account, not from us.

### Template Data Model

| Template Type | Data Source | How It Works |
|---------------|-------------|--------------|
| Interactive | User's CryptoSheets account | Formulas fetch data when user opens template |
| Native Charts | User's CryptoSheets account | Charts built from formula data |
| Formula-Only | N/A | Empty formulas for user to customize |

**Note:** We do NOT redistribute CoinGecko data. Templates contain formulas that reference CryptoSheets functions. Data is fetched by CryptoSheets on the user's machine.

---

## 3. Data Sources & License Stance

### Primary Data Source: CoinGecko Analyst

| Source | License | Cost | Usage | Attribution Required |
|--------|---------|------|-------|---------------------|
| **CoinGecko Analyst** | Display-only | $103.2/mo | All market data for website display | Yes |

**Critical:** CoinGecko Analyst plan is display-only. We do NOT redistribute CoinGecko data. All downloadable templates use CryptoSheets formulas that fetch data via the user's own CryptoSheets account.

### Supplementary Data Sources (Website Display Only)

| Source | License | Usage | Notes |
|--------|---------|-------|-------|
| Alternative.me | Verify terms | Fear & Greed Index | Free API, verify redistribution rights |
| DefiLlama | Open data | DeFi TVL | Verify current terms before any redistribution |

### CoinGecko Analyst Plan Details
- **Plan:** Analyst ($103.2/mo billed annually, $129/mo monthly)
- **Monthly credits:** 500,000 API calls
- **Rate limit:** 500 calls/minute
- **Historical limits:** Per CoinGecko pricing page (verify current limits at coingecko.com/en/api/pricing)
- **Exclusive endpoints:**
  - Top gainers/losers
  - Recently listed coins
  - NFT floor prices
  - GeckoTerminal DEX data
  - Historical global market cap
- **License:** Display-only (no redistribution without Data Redistribution License)
- **Attribution:** Required - "Data provided by CoinGecko" with hyperlink
- **Terms:** https://www.coingecko.com/en/api/pricing

**Important:** Historical limits and features may change. Always verify current plan details at CoinGecko's pricing page before making claims.

### Budget Allocation (CoinGecko)

| Category | Calls/Day | Description |
|----------|-----------|-------------|
| Prices | 1,440 | Top 200 coins, every 60s |
| OHLCV | 200 | Candlestick data |
| Metadata | 5,000 | Coin details, hourly |
| Historical | 500 | Backfill requests |
| Buffer | 2,000 | Errors/retries |
| **Total** | **9,140** | 55% of daily budget |

**Remaining capacity:** ~7,500 calls/day (45%) for growth

### License Compliance Implementation

```
┌─────────────────────────────────────────────────────────────┐
│                    DATA FLOW MODEL                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  WEBSITE (Display Only):                                    │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ CoinGecko Analyst → Our Server → User's Browser     │   │
│  │ (Display-only, no redistribution)                   │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  TEMPLATES (CryptoSheets Formulas):                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ User downloads template (contains formulas only)    │   │
│  │       ↓                                             │   │
│  │ User opens in Excel Desktop                         │   │
│  │       ↓                                             │   │
│  │ CryptoSheets add-in fetches data                    │   │
│  │       ↓                                             │   │
│  │ Data flows: CryptoSheets → User's Excel             │   │
│  │ (We are NOT in this data path)                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  KEY POINT: We sell template SOFTWARE, not DATA.            │
│  Data redistribution is handled by CryptoSheets,            │
│  not by DataSimplify.                                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Excel Template System (CryptoSheets Integration)

### Overview
DataSimplify generates Excel templates with CryptoSheets formulas. **Important:** We sell template software and workflows, not data. Data is fetched via the user's CryptoSheets account when they open the template in Excel Desktop.

### Business Model Clarity
| What We Sell | What We Don't Sell |
|--------------|-------------------|
| Excel template software | Data feed subscriptions |
| Pre-configured formulas | API access to data |
| Report workflows | Data redistribution |
| Quota-aware configurations | CryptoSheets subscriptions |

### Content Types

| Type | Description | Data Source | Refresh |
|------|-------------|-------------|---------|
| **Interactive** | CryptoSheets formulas that refresh on demand | User's CryptoSheets account | Manual (recommended) |
| **Native Charts** | Pre-built Excel charts with formula data | User's CryptoSheets account | Manual |
| **Formula-Only** | DIY building blocks (formulas without data) | N/A | N/A |

**Note:** We do NOT include embedded/static data snapshots in templates. All data comes from CryptoSheets formulas that fetch data via the user's own CryptoSheets account.

### Template Categories (Report Types)

| Category | Templates | Use Case | Tier |
|----------|-----------|----------|------|
| **Market Overview** | Market dashboard, Trending | Daily market check | Free |
| **Watchlist** | Simple, Pro | Track specific coins | Free/Pro |
| **Screener** | Basic, Advanced | Find coins matching criteria | Pro |
| **Portfolio** | Tracker, Advanced Analytics | Holdings and P&L | Free/Pro |
| **Correlation** | Matrix | Diversification analysis | Pro |
| **Risk** | Dashboard | Volatility and worst-case | Pro |

### CryptoSheets Quota Safeguards (NEW)

**Problem:** Users on CryptoSheets Free tier were hitting their plan limits when using data-heavy templates.

**Solution:** Quota-aware template system with hard gates.

#### Requirements Gate
Before downloading any template, users must confirm:
- Excel Desktop installed (Excel Online NOT supported)
- CryptoSheets add-in installed
- CryptoSheets account (free or paid)

#### Two Template Modes

| Mode | Max Assets | Timeframes | Refresh | Recommended For |
|------|-----------|------------|---------|-----------------|
| **Low-Quota** (default) | 5-10 coins | Daily only | Manual | CryptoSheets Free users |
| **Pro Mode** | Up to 100 coins | All intervals | Manual or auto | CryptoSheets Pro users |

#### Quota Estimator
Real-time display showing:
- API calls per refresh
- Estimated daily calls
- Estimated monthly calls
- Recommended CryptoSheets plan
- Color-coded status (green = free OK, yellow = pro needed, red = premium)

**Note:** CryptoSheets limits are plan-defined and may change. Query cost may scale with rows (row-based counting). Estimator uses published limits and template's row footprint. Always verify current CryptoSheets plan limits.

#### START Sheet (in every template)
- Requirements checklist
- Status checker: `CRYPTOSHEETS("status")` formula
- Sample data check: `CRYPTOSHEETS("price","BTC","USD")`
- Refresh button area with keyboard shortcuts
- Troubleshooting section for common errors

### Report Assistant (NEW)

Natural language interface for template selection:

**Flow:**
1. User describes need: "I want a weekly report of BTC, ETH, SOL"
2. Assistant parses intent → selects template
3. Shows recommendation + config
4. One-click download
5. Setup steps
6. Success verification

**Key Features:**
- Simple language (no heavy terms like OHLCV, VaR, API)
- Quick reply buttons for common choices
- Deterministic template selection (rule-based, not AI)
- Refuses trading advice queries
- Troubleshooting for common errors

**Refused Queries:**
```
"what to buy" → Refused
"price prediction" → Refused
"stop loss" → Refused
"trading signals" → Refused
"best coin" → Refused
```

**Standard Refusal:**
> "I can't help with trading advice, price predictions, or buy/sell signals. I can help you build reports and dashboards to analyze data. What report would you like?"

### Template Generation Pipeline

```
┌─────────────────────────────────────────────────────────────┐
│                 TEMPLATE GENERATION FLOW                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User selects template                                   │
│       │                                                     │
│       ▼                                                     │
│  2. Check entitlements (tier, download count)               │
│       │                                                     │
│       ├── Not entitled ──▶ Show upgrade prompt              │
│       │                                                     │
│       ▼                                                     │
│  3. Generate template (NO DATA FETCHING):                   │
│       │                                                     │
│       ├── Interactive: Insert CryptoSheets formulas         │
│       ├── Native Charts: Build chart XML (formulas only)    │
│       └── Formula-Only: Template with empty formulas        │
│       │                                                     │
│       ▼                                                     │
│  4. Add metadata (START sheet checklist)                    │
│       │                                                     │
│       ▼                                                     │
│  5. Stream .xlsx file to user                               │
│       │                                                     │
│       ▼                                                     │
│  6. Track download (decrement monthly count)                │
│                                                             │
│  KEY: Templates contain FORMULAS only, not data.            │
│  Data is fetched by CryptoSheets when user opens file.      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Technical Implementation

**API Endpoints:**
- `POST /api/templates/download` - Generate and stream template (formulas only, no data)
- `POST /api/user/track-download` - Track download usage

**File Generation:**
- Library: `exceljs` (MIT license)
- Format: Office Open XML (.xlsx)
- Max file size: ~1MB (formulas only, no data)
- Generation time: <2 seconds

**CryptoSheets Formula Integration:**
```
// Example CryptoSheets formulas in templates
=CRYPTOSHEETS("price", "BTC", "USD")           // Live price
=CRYPTOSHEETS("history", "ETH", "1d", 30)      // 30 days of daily prices
=CRYPTOSHEETS("ohlcv", "SOL", "4h", 100)       // 100 4-hour candles
=CRYPTOSHEETS("status")                         // Connection status check
```

**Important:** Templates contain CryptoSheets formulas, NOT data. Data is fetched through the user's CryptoSheets account when they open the template in Excel Desktop.

### Compliance Notes
- **We do NOT redistribute any data** - Templates contain formulas only
- CoinGecko data is display-only on our website
- Templates use CryptoSheets formulas - data flows from CryptoSheets to user's Excel
- We are NOT in the data path between CryptoSheets and the user
- Attribution for CoinGecko added to website pages (not templates, since templates don't contain CoinGecko data)

---

## 5. Pricing & Entitlements

### Subscription Tiers (Updated)

| Tier | Monthly | Key Features |
|------|---------|--------------|
| **Free** | $0 | 5 templates/mo, Low-Quota Mode (5-10 assets), basic dashboards |
| **Pro** | $29 | 50 templates/mo, Pro Mode (100 assets), all template types, email support |
| **Premium** | $79 | Unlimited templates, priority generation, API access, priority support |

### Important Clarification
**We sell template software and workflows, not data.**
- Templates contain CryptoSheets formulas
- Data is fetched via user's CryptoSheets account
- Data usage depends on user's CryptoSheets plan and refresh settings
- Free CryptoSheets users may hit monthly request limits

### Feature Entitlements Detail

| Feature | Free | Pro ($29) | Premium ($79) |
|---------|------|-----------|---------------|
| Templates per month | 5 | 50 | Unlimited |
| Template modes | Low-Quota only | Low-Quota + Pro | All modes |
| Max assets in templates | 10 | 100 | 100 |
| Timeframe options | Daily only | All (1h, 4h, 1d, 1w) | All |
| Template types | Basic XLSX | All types | All types |
| Report Assistant | Yes | Yes | Yes |
| Website dashboards | Basic | Advanced | Advanced |
| Support | Community | Email (24-48hr) | Priority (4hr) |
| API access (authenticated)* | No | No | Yes |
| Custom integrations | No | No | Yes |
| White-label options | No | No | Yes |

*API access: Authenticated endpoints for template generation integrations and automation (software feature, not data redistribution)

### CryptoSheets Dependency Note
| DataSimplify Tier | Works With CryptoSheets |
|-------------------|------------------------|
| Free | CryptoSheets Free - with Low-Quota Mode defaults |
| Pro | CryptoSheets Free or Pro - Pro Mode templates may need CryptoSheets Pro |
| Premium | CryptoSheets Pro recommended for high-volume/frequent refresh usage |

*Note: CryptoSheets plan limits are set by CryptoSheets and may change. Our Low-Quota Mode defaults (5-10 assets, manual refresh, daily data) are designed to work within typical free tier limits.*

### Revenue Projections

| Scenario | Users | MRR | ARR |
|----------|-------|-----|-----|
| **Conservative** | 5,000 Free, 300 Pro, 50 Premium | $12,650 | $151,800 |
| **Moderate** | 10,000 Free, 800 Pro, 150 Premium | $35,050 | $420,600 |
| **Optimistic** | 20,000 Free, 2,000 Pro, 500 Premium | $97,500 | $1,170,000 |

*Note: Free tier users contribute to platform engagement and convert to paid over time (target: 10% conversion)*

### Cost Structure (Monthly)

| Expense | Amount | Notes |
|---------|--------|-------|
| CoinGecko Analyst | $103.2 | Annual commitment |
| Vercel Pro | $20 | Hosting + functions |
| Supabase Pro | $25 | Database + auth |
| Domain + SSL | $5 | Annual amortized |
| Paddle fees | 5% + $0.50 | Per transaction |
| **Total Fixed** | **~$153** | Before Paddle fees |

### Break-even Analysis
- Fixed costs: $153/mo
- Average revenue per user (blended): ~$30/mo
- Break-even: **6 paying users**

---

## 6. Payment Processor Compliance (Paddle)

### Paddle Requirements
Paddle acts as Merchant of Record (MoR), handling:
- Payment processing
- Tax collection & remittance
- Compliance with local regulations
- Refunds and chargebacks

### Compliance Status

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| No trading signals/advice | Compliant | `paddle_safe` mode disables predictions |
| No community-as-product | Compliant | Community feature disabled in paddle_safe |
| Digital goods only | Compliant | Software + template downloads |
| Clear pricing | Compliant | Public pricing page |
| Refund policy | Compliant | 30-day money-back guarantee (plus statutory cooling-off rights where applicable) |
| No prohibited content | Compliant | Educational disclaimers |

### Paddle-Safe Mode
When `APP_MODE=paddle_safe`:

```typescript
// Features DISABLED for Paddle approval:
predictions: false,    // Trading signals
community: false,      // Selling community access
alerts: false,         // Could be perceived as trading signals
chat: false,           // AI chat (re-enable after approval)
risk: false,           // Risk scoring = advice
whales: false,         // Whale tracking = signals
```

### Features ENABLED in Paddle-Safe Mode (Launch Features)
- CryptoSheets template downloads (software tool)
- Market data display (website only)
- Technical indicators (educational)
- DeFi dashboard
- Price history
- Smart contract verifier
- Pricing/payments
- Report Assistant (template selection only)

### Post-Paddle Approval Roadmap

Features currently disabled for Paddle approval that may be enabled after establishing account history:

| Feature | Reason for Delay | Enable After |
|---------|------------------|--------------|
| Price alerts | Could be perceived as trading signals | 3+ months |
| Risk scoring | Could be perceived as financial advice | 3+ months |
| Whale tracking | Could be perceived as trading signals | 3+ months |
| AI chat | Need to ensure refusal patterns are robust | 6+ months |
| Predictions | May never enable (liability risk) | TBD |
| Community | Selling community access is risky for MoR | TBD |

**Strategy:** Launch with safe features, build Paddle account history, then gradually enable advanced features with robust disclaimers.

### Disclaimers Required
All analytics pages include:
> "For informational and educational purposes only. Not financial advice. Always do your own research."

### Webhook Integration
- `POST /api/paddle/webhook` - Subscription lifecycle events
- `POST /api/paddle/checkout` - Generate checkout sessions
- Signature verification implemented
- Event types handled: `subscription.created`, `subscription.updated`, `subscription.cancelled`

---

## 7. Architecture & Security

### Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 16 (Turbopack) |
| Language | TypeScript | 5.x (strict mode) |
| Styling | Tailwind CSS | 3.x |
| Components | shadcn/ui + custom | Latest |
| Database | Supabase (PostgreSQL) | Latest |
| Auth | Supabase Auth | Latest |
| Payments | Paddle | v2 API |
| Charts | Recharts, Lightweight Charts | Latest |
| AI | Groq / OpenAI / Ollama | Configurable |

### Project Structure

```
datasimplify/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── api/                  # 48 API routes
│   │   │   ├── crypto/           # Market data (9 routes)
│   │   │   ├── charts/           # OHLCV data (2 routes)
│   │   │   ├── defi/             # DeFi data (1 route)
│   │   │   ├── sentiment/        # Sentiment (2 routes)
│   │   │   ├── whales/           # Whale tracking (1 route)
│   │   │   ├── technical/        # Indicators (1 route)
│   │   │   ├── templates/        # CryptoSheets (1 route)
│   │   │   ├── paddle/           # Payments (2 routes)
│   │   │   └── user/             # User management (5 routes)
│   │   └── [92 page routes]
│   │
│   ├── components/
│   │   ├── features/             # Feature components
│   │   ├── download/             # CryptoSheets components (NEW)
│   │   │   ├── RequirementsGate.tsx    # Hard gate before download
│   │   │   ├── QuotaEstimator.tsx      # Real-time quota display
│   │   │   ├── TemplateControls.tsx    # Asset/timeframe controls
│   │   │   ├── ReportAssistant.tsx     # Natural language wizard
│   │   │   └── ReportBuilder.tsx       # Step-by-step wizard
│   │   └── ui/                   # UI components (shadcn)
│   │
│   └── lib/
│       ├── coingecko/            # CoinGecko client (primary data source)
│       │   ├── client.ts         # API methods
│       │   ├── cache.ts          # Response caching
│       │   └── budget.ts         # Call budget tracking
│       ├── templates/            # Template system
│       │   ├── templateModes.ts        # Low-Quota/Pro mode configs
│       │   ├── reportBuilderCatalog.ts # Template metadata catalog
│       │   ├── reportBuilder.ts        # Rule-based selection
│       │   ├── reportAssistant.ts      # NL intent parser
│       │   └── generator.ts            # Excel generation (formulas only)
│       ├── apiSecurity.ts        # Browser-origin gating
│       └── featureFlags.ts       # Feature toggles
│
├── supabase/                     # Database schemas
└── public/                       # Static assets
```

### API Security Implementation

#### Sec-Fetch-Site Validation
The `enforceDisplayOnly()` function uses browser-controlled headers to detect cross-origin requests:

**Limitations:** This protection prevents casual browser-based scraping (JavaScript fetch from other sites) but does NOT prevent determined scrapers using curl, Postman, or custom scripts. The goal is compliance with data licensing terms by demonstrating good-faith enforcement, not perfect security.

```typescript
// From apiSecurity.ts
function isInternalRequest(request: NextRequest): boolean {
  const secFetchSite = request.headers.get('sec-fetch-site');

  // Browser-controlled header - most reliable
  if (secFetchSite === 'same-origin' || secFetchSite === 'same-site') {
    return true;
  }

  // Block obvious cross-site requests
  if (secFetchSite === 'cross-site') {
    return false;
  }

  // Fallback: validate Origin/Referer
  return getValidatedOriginHostname(request) !== null;
}
```

#### Protected Routes (24+)
All external data API routes include:
```typescript
export async function GET(request: NextRequest) {
  const blocked = enforceDisplayOnly(request, '/api/crypto/trending');
  if (blocked) return blocked;
  // ... handler logic
}
```

#### Routes Protected by Secret Key
- `/api/sync` - Data synchronization (SYNC_SECRET_KEY)
- `/api/diagnostics` - System diagnostics (SYNC_SECRET_KEY)
- `/api/cleanup` - Cache cleanup (SYNC_SECRET_KEY)

### Database Schema (Supabase)

| Table | Purpose | Rows (Est.) |
|-------|---------|-------------|
| `market_data` | Cached price data | 200+ |
| `fear_greed_history` | Sentiment history | 365 |
| `whale_transactions` | Whale activity | 1,000+ |
| `defi_protocols` | DeFi TVL data | 100+ |
| `user_downloads` | Download tracking | Per user |
| `subscriptions` | Paddle subscriptions | Per user |

### Caching Strategy

| Data Type | TTL | Storage |
|-----------|-----|---------|
| Live prices | 60s | Memory + Supabase |
| OHLCV data | 5min | Supabase |
| Trending | 5min | Memory |
| Fear & Greed | 1hr | Supabase |
| DeFi TVL | 5min | Memory |
| Contract verify | 24hr | Supabase |

---

## 8. Load & Cost Model

### API Call Budget

| Source | Calls/Month | Cost | Notes |
|--------|-------------|------|-------|
| CoinGecko Analyst | 500,000 | $103.2 | Primary data source for website display |

**Note:** This is our only paid data source. All template data comes from user's CryptoSheets account.

### Infrastructure Scaling

| Users | Vercel Plan | Supabase Plan | Estimated Cost |
|-------|-------------|---------------|----------------|
| 0-100 | Pro ($20) | Free | $123/mo |
| 100-1,000 | Pro ($20) | Pro ($25) | $148/mo |
| 1,000-10,000 | Enterprise | Pro ($25) | $300-500/mo |
| 10,000+ | Enterprise | Team ($599) | $1,000+/mo |

### Performance Targets

| Metric | Target | Current |
|--------|--------|---------|
| Page load (TTFB) | <500ms | ~300ms |
| API response | <200ms | ~150ms |
| Template generation | <3s | ~2s |
| Uptime | 99.9% | N/A (pre-launch) |

### Cost Per User (Blended)

| Scenario | Fixed Costs | Variable | Users | Cost/User |
|----------|-------------|----------|-------|-----------|
| Early stage | $153 | $0.05 | 100 | $1.58 |
| Growth | $153 | $0.03 | 1,000 | $0.18 |
| Scale | $500 | $0.02 | 10,000 | $0.07 |

---

## 9. Launch Plan & KPIs

### Pre-Launch Checklist

| Task | Status | Notes |
|------|--------|-------|
| Core features complete | Done | 92 pages, 48 API routes |
| CryptoSheets working | Done | 4 content types |
| API security | Done | 24+ protected routes |
| Paddle integration | Ready | paddle_safe mode available |
| CoinGecko budget | Configured | 55% allocated, 45% buffer |
| Feature flags | Configured | Multi-mode support |
| Error handling | Done | Graceful fallbacks |
| Attribution | Done | Auto-added to all pages |
| **CryptoSheets Quota Safeguards** | Done | Hard gate, Low-Quota/Pro modes |
| **Report Assistant** | Done | Natural language template selection |
| **Pricing clarity** | Done | "Templates + workflows, not data" |
| **Financial advice refusal** | Done | Blocks trading advice queries |
| **Requirements gate** | Done | Excel Desktop + CryptoSheets check |
| **Quota estimator** | Done | Real-time API usage display |
| **START sheet** | Done | Status checker + troubleshooting |

### Launch Phases

**Phase 1: Soft Launch (Week 1-2)**
- Enable for beta testers
- Monitor API budget usage
- Collect feedback on CryptoSheets
- Fix critical bugs

**Phase 2: Public Launch (Week 3-4)**
- Enable Paddle payments
- Launch marketing (Product Hunt, Twitter, Reddit)
- Track conversion rates
- Monitor support tickets

**Phase 3: Growth (Month 2+)**
- Enable disabled features (based on Paddle approval)
- Add more template types
- Implement user-requested features
- Explore partnerships

### Key Performance Indicators

| KPI | Target (Month 1) | Target (Month 6) |
|-----|------------------|------------------|
| Registered users | 500 | 5,000 |
| Paying subscribers | 50 | 500 |
| MRR | $1,500 | $15,000 |
| Churn rate | <10% | <5% |
| Template downloads | 500 | 10,000 |
| API budget usage | <60% | <80% |
| Support tickets/day | <10 | <20 |
| Uptime | 99.5% | 99.9% |

### Success Metrics

| Metric | Definition | Target |
|--------|------------|--------|
| Activation | User downloads first template | 50% of signups |
| Retention | Active after 30 days | 40% |
| Conversion | Free to paid | 10% |
| NPS | Net Promoter Score | >50 |

---

## 10. Appendix

### A. API Route Inventory

| Route | Method | Source | Protected |
|-------|--------|--------|:---------:|
| `/api/crypto` | GET | CoinGecko | Yes |
| `/api/crypto/trending` | GET | CoinGecko | Yes |
| `/api/crypto/gainers-losers` | GET | CoinGecko | Yes |
| `/api/crypto/categories` | GET | CoinGecko | Yes |
| `/api/crypto/global` | GET | CoinGecko | Yes |
| `/api/crypto/global-history` | GET | CoinGecko | Yes |
| `/api/crypto/recently-added` | GET | CoinGecko | Yes |
| `/api/crypto/exchanges` | GET | CoinGecko | Yes |
| `/api/crypto/nfts` | GET | CoinGecko | Yes |
| `/api/crypto/dex-pools` | GET | CoinGecko | Yes |
| `/api/crypto/search` | GET | CoinGecko | Yes |
| `/api/crypto/[id]` | GET | CoinGecko | Yes |
| `/api/crypto/[id]/details` | GET | CoinGecko | Yes |
| `/api/crypto/[id]/history` | GET | CoinGecko | Yes |
| `/api/charts/candles` | GET | CoinGecko | Yes |
| `/api/charts/history` | GET | CoinGecko | Yes |
| `/api/sentiment` | GET | Alternative.me | Yes |
| `/api/defi/llama` | GET | DefiLlama | Yes |
| `/api/technical` | GET | Computed | Yes |
| `/api/templates/download` | POST | N/A (formulas only) | Yes |
| `/api/portfolio/presets` | GET | Computed | Yes |

**Note:** All CoinGecko routes are display-only. Template download generates formulas, not data.

### B. Feature Flags Reference

```typescript
// From featureFlags.ts
export const FEATURES = {
  // Data providers
  coingecko: boolean,           // CoinGecko API (display-only)
  coingeckoDisplayOnly: true,   // Always true for compliance

  // Product modules
  predictions: boolean,         // Trading predictions (paddle_safe: off)
  community: boolean,           // Community features (paddle_safe: off)
  smartContractVerifier: true,  // Always on (safe)
  alerts: boolean,              // Price alerts (paddle_safe: off)
  chat: boolean,                // AI chat (paddle_safe: off)
  risk: boolean,                // Risk analysis (paddle_safe: off)

  // Data domains
  socialSentiment: boolean,     // Social data
  macro: boolean,               // Macro indicators
  defi: boolean,                // DeFi data
  whales: boolean,              // Whale tracking
  nft: boolean,                 // NFT data

  // Monetization
  payments: boolean,            // Payment system
  pricing: boolean,             // Pricing pages
};
```

### C. Environment Variables

```env
# Required
NEXT_PUBLIC_APP_URL=https://datasimplify.com
NEXT_PUBLIC_APP_MODE=paddle_safe  # or 'full' or 'free'

# CoinGecko (optional but recommended)
COINGECKO_API_KEY=your-analyst-key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Paddle
PADDLE_API_KEY=xxx
PADDLE_WEBHOOK_SECRET=xxx

# AI (choose one)
GROQ_API_KEY=xxx
# or OPENAI_API_KEY=xxx

# Feature flags
NEXT_PUBLIC_FEATURE_COINGECKO=true
NEXT_PUBLIC_FEATURE_DEFI=true
NEXT_PUBLIC_FEATURE_WHALES=true

# Data Policy
DATA_MODE=display_only
# Note: We do not redistribute data. Templates contain formulas only.
```

### D. Product Positioning

**What We Offer:**
| Feature | Description |
|---------|-------------|
| Excel Templates | CryptoSheets formula-based templates |
| Report Assistant | Natural language template selection |
| Website Dashboards | Display-only market data visualization |
| Quota Management | Templates optimized for CryptoSheets plan limits |
| Price Point | $0-79/mo for template software |

**What We Don't Offer:**
- Raw data API access
- Data redistribution rights
- Trading signals or financial advice
- Embedded/static data in templates

**Target User:** Someone who wants professional Excel templates for crypto analysis but doesn't want to build formulas from scratch.

### E. Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| CoinGecko ToS violation | Low | High | Display-only enforcement |
| API rate limit hit | Medium | Medium | Budget tracking, fallbacks |
| Paddle rejection | Low | High | paddle_safe mode |
| User data breach | Low | Critical | Supabase RLS, no PII in logs |
| Competitor undercutting | Medium | Medium | Unique Excel feature |
| Data source deprecation | Low | High | Multiple fallback sources |
| CryptoSheets quota complaints | Low | Medium | Quota safeguards + clear messaging |
| Trading advice liability | Low | High | Report Assistant refusals |

### F. Report Assistant Configuration

#### Refused Query Patterns
```typescript
const REFUSED_PATTERNS = [
  /what\s*(to|should\s*i)\s*(buy|sell)/i,
  /should\s*i\s*(buy|sell|invest|hold)/i,
  /(buy|sell)\s*signal/i,
  /price\s*(prediction|target|forecast)/i,
  /(entry|exit)\s*point/i,
  /stop\s*loss/i,
  /take\s*profit/i,
  /will\s*(it|price)\s*(go|rise|fall|drop|moon)/i,
  /best\s*coin\s*to\s*(buy|invest)/i,
];
```

#### Simple Language Translations
| Heavy Term | User-Friendly |
|------------|---------------|
| OHLCV | candles (open-high-low-close) |
| timeframe | time range |
| correlation | how coins move together |
| VaR | worst-case loss estimate |
| volatility | price swings |
| drawdown | biggest drop from peak |
| liquidity | how easy to buy/sell |
| API | data connection |
| quota | data limit |
| refresh | update |

#### Template Catalog Metadata
```typescript
interface TemplateCatalogEntry {
  template_id: string;
  name: string;
  report_type: 'market' | 'watchlist' | 'screener' | 'portfolio' | 'correlation' | 'risk';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  quota_cost_estimate: 'low' | 'medium' | 'high';
  calls_per_refresh: number;
  free_safe: boolean;
  inputs: { min_coins: number; max_coins: number; supported_timeframes: string[] };
}
```

### G. Quota Safeguard Defaults

| Setting | Default Value | Reason |
|---------|---------------|--------|
| Refresh mode | Manual | Conserves CryptoSheets quota |
| Asset count | 5 coins | Fits within free tier |
| Timeframe | Daily | Lowest API usage |
| Charts | Enabled | User value |
| Auto-refresh | Disabled | Prevents quota exhaustion |

### H. Data Licensing Stance

**Our Position: We do NOT redistribute data.**

#### CoinGecko Analyst (Primary Source)
- **Source:** [CoinGecko API Terms](https://www.coingecko.com/en/api/pricing)
- **License:** Display-only (requires Data Redistribution License for redistribution)
- **Our usage:** Website display only
- **Templates:** Do NOT contain CoinGecko data - templates have CryptoSheets formulas that fetch data via user's account

#### Why This Works
1. Templates contain formulas, not data
2. When user opens template, CryptoSheets fetches data from their account
3. Data flows: CryptoSheets → User's Excel (we are not in this path)
4. We sell template software, not data access

#### Compliance Requirements
- Attribution on website: "Data provided by CoinGecko" with hyperlink
- No CoinGecko data in downloadable files
- No screenshot/export of CoinGecko data
- No API passthrough for external access

**Important:** License terms may change. Verify current terms at coingecko.com/en/api/pricing before making any claims.

---

## Document Control

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | Jan 2026 | DataSimplify Team | Initial release |
| 1.1 | Jan 2026 | DataSimplify Team | Added: CryptoSheets Quota Safeguards, Report Assistant, updated pricing model |
| 1.2 | Jan 2026 | DataSimplify Team | Fixed: pricing consistency, claims accuracy, added problem/solution section |
| 1.3 | Jan 2026 | DataSimplify Team | Synced: Feature entitlements with pricing page |
| 1.4 | Jan 2026 | DataSimplify Team | Critical fixes: removed unverified claims, CoinGecko-only data source, no data redistribution |

---

### Changelog v1.4

**Critical Compliance Fixes:**
- Removed all unverified redistribution claims
- Single data source: CoinGecko Analyst (display-only)
- Templates contain formulas only, NO data
- Removed "Embedded" content type (was claiming redistribution rights)
- Changed status from "Investment Ready" to "Pending Compliance Review"

**Removed References:**
- No competitor names or pricing comparisons
- No external data sources in templates
- No redistribution claims without verified licenses

**Clarified Data Model:**
- Website: CoinGecko data for display only
- Templates: CryptoSheets formulas (data fetched by user's CryptoSheets account)
- We are NOT in the data path between CryptoSheets and user

**Updated Sections:**
- Section 3: Single data source (CoinGecko Analyst)
- Section 4: Removed Embedded content type
- Appendix D: Product positioning (no competitor analysis)
- Appendix H: Data licensing stance (no redistribution claims)

---

### Changelog v1.3

**Sync with Pricing Page:**
- Updated Feature Entitlements Detail to match live pricing page
- Changed "Bulk template generation" to "API access (authenticated)" with clarification
- Added "White-label options" to Premium tier
- Added "Custom integrations" to Premium tier
- Clarified API access is for template generation automation, not data redistribution

---

### Changelog v1.2

**Consistency Fixes:**
- Unified pricing tiers across all sections: Free ($0), Pro ($29), Premium ($79)
- Removed old Starter/Business tier references
- Updated revenue projections with new tier structure
- Updated competitor analysis with correct pricing

**Claims Accuracy:**
- Replaced Power Query example with CryptoSheets formula examples (templates use CryptoSheets, not direct API calls)
- Downgraded Sec-Fetch-Site security claims (acknowledges limitations against curl/scripts)
- Refined "CoinGecko data is NEVER included" to more accurate wording
- Softened CryptoSheets quota number claims (plan limits may change)
- Removed "API access" from Premium tier features (conflicts with "we don't sell data" posture)

**New Sections:**
- **Section 1.5: Problem Statement & Unique Solution** - Clear articulation of market gap and why our approach works
- **Post-Paddle Approval Roadmap** - Features to enable after establishing Paddle account history
- **Appendix H: License Evidence** - Citations for redistributable claims (Binance, Alternative.me, DefiLlama)

**Terminology:**
- Renamed "AI Assistant" to "Report Assistant" throughout (it's rule-based, not AI)

---

### Changelog v1.1

**New Features:**
- **Report Assistant** - Natural language template selection wizard
- **Requirements Gate** - Hard gate requiring Excel Desktop + CryptoSheets confirmation
- **Quota Estimator** - Real-time API usage display with plan recommendations
- **Low-Quota/Pro Modes** - Two template configurations for different CryptoSheets tiers
- **START Sheet Updates** - Status checker, sample data check, troubleshooting section

**Pricing Updates:**
- Simplified to 3 tiers: Free ($0), Pro ($29), Premium ($79)
- Clear messaging: "We sell templates + workflows, not data"
- CryptoSheets dependency documented on all relevant pages

**Compliance Updates:**
- Report Assistant refuses trading advice queries
- Pricing page includes CryptoSheets dependency FAQ
- Disclaimer updated on download and pricing pages

**Files Added:**
- `src/lib/templates/templateModes.ts`
- `src/lib/templates/reportBuilderCatalog.ts`
- `src/lib/templates/reportBuilder.ts`
- `src/lib/templates/reportAssistant.ts`
- `src/components/download/RequirementsGate.tsx`
- `src/components/download/QuotaEstimator.tsx`
- `src/components/download/TemplateControls.tsx`
- `src/components/download/ReportAssistant.tsx`
- `src/components/download/ReportBuilder.tsx`

---

**End of Due-Diligence Report**
