# Unpopulated Fields / Unavailable Features Report

Date: 2026-01-03

This report lists **fields/features that are not populated with live data** (or are intentionally disabled) in the current codebase. Per the "no fake data" policy, these areas should show **"Unavailable"** / `null` or return truthful API errors (e.g., 501/503) rather than placeholders.

## Recently fixed since prior draft
- Smart contract verification is now backed by Sourcify (via `/api/smart-contract/verify`) with Supabase cache + explicit stale-cache fallback.
- `/tools/verify` is now a redirect to the real verifier at `/smart-contract-verifier` (to avoid the old simulated/solidity-code workflow).
- **Support/Resistance levels** now calculated from 24h high/low/close using pivot point formulas.
- **Calendar Heatmap** in Advanced Charts now shows real Bitcoin daily returns via internal API routes.
- **Market Gauges** in Advanced Charts now displays real Fear & Greed index + 24h volatility via internal API routes.
- **Whale Tracker** in Advanced Charts now shows real large BTC/ETH transactions via Blockchair + Etherscan.
- **Feature Flag System** added (`src/lib/featureFlags.ts`) - enables "free" vs "full" deployment modes
- **Fear & Greed** is served via internal `/api/sentiment` (no browser-side third-party fetch)
- **Price history** now uses Binance as primary source, CoinGecko only as fallback (when enabled)
- **Calendar Heatmap** data source corrected to Binance (primary) with CoinGecko fallback

## Corrections in this revision
- **Wallet Distribution Treemap** was previously hardcoded; it now shows **Unavailable** until a real data source is integrated.
- **On-Chain Metrics** removed hardcoded “key levels” and “estimates”; those now show **Unavailable**.

---

## 1) Pages (UI)

### Smart Contract Verification (Sourcify-backed)
- Page: [src/app/smart-contract-verifier/page.tsx](src/app/smart-contract-verifier/page.tsx)
- Legacy path (redirect): [src/app/tools/verify/page.tsx](src/app/tools/verify/page.tsx)
- Status: **Available** for "verified on Sourcify" checks (not a security audit)

### Advanced Charts (some chart types intentionally unavailable)
- Page: [src/app/charts/advanced/page.tsx](src/app/charts/advanced/page.tsx)
- **Now Available** (with real data):
  - Market Gauges (Fear & Greed from `/api/sentiment` + volatility from `/api/crypto/bitcoin`)
  - Calendar Heatmap (BTC daily returns from Binance via `/api/crypto/bitcoin/history`)
  - Whale Tracker (large transactions from Blockchair + Etherscan, requires `whales` flag)
- Still unavailable (no free data source):
  - Wallet Distribution (no free, reliable wallet bucket distribution source wired)
  - Sankey Flow (requires real flow data source)
  - Radar / Parallel (requires real multi-factor fundamentals)
  - 3D Globe (requires real 3D metric set)

### On-Chain Metrics (partial)
- Component: [src/components/features/OnChainMetrics.tsx](src/components/features/OnChainMetrics.tsx)
- Still unavailable / removed static fields:
  - HODL Waves, LTH supply, MVRV levels, exchange reserve “key levels” (no free verified sources wired)
  - UI now shows **Unavailable** instead of hardcoded numbers
  - Sankey Flow (requires real flow data source)
  - Radar / Parallel (requires real multi-factor fundamentals)
  - 3D Globe (requires real 3D metric set)

### Coin Detail → Prediction Factors (partially unavailable)
- Page: [src/app/coin/[id]/page.tsx](src/app/coin/[id]/page.tsx)
- **Now Available**:
  - Technical: `supportResistance` now calculated from 24h high/low/close using pivot points
- Still unavailable sub-fields:
  - Sentiment: `socialSentiment = 'Unavailable'`, `newsAnalysis = 'Unavailable'`, `twitterMentions.trend = 'Unavailable'`, `twitterMentions.change = null`
  - On-chain: `holdingDistribution = 'Unavailable'`, `activeAddresses.change = null` (trend only)
  - Macro: `btcCorrelation = null`, `marketCycle = 'Unavailable'`
  - Derivatives: `liquidations24h.predominant = 'Unavailable'`

### Compare Page (fields show Unavailable when not returned)
- Page: [src/app/compare/page.tsx](src/app/compare/page.tsx)
- Common “Unavailable” fields (depends on upstream data availability):
  - FDV, max supply, ATH/ATL change %, multi-timeframe change %
  - Prediction fields (risk level) when `/api/predict` returns none
  - Technicals (e.g. RSI) when `/api/technical` returns none

### Monitor Page (Fear & Greed label can be Unavailable)
- Page: [src/app/monitor/page.tsx](src/app/monitor/page.tsx)
- `fearGreedLabel` falls back to `'Unavailable'` when the upstream API doesn’t return a label.

### Demo Simplified Page
- Page: [src/app/demo/simplified/page.tsx](src/app/demo/simplified/page.tsx)
- Currently shows **Unavailable** (demo/static content removed).

### Price Alerts (UI only; delivery + live pricing unavailable)
- Page: [src/app/alerts/page.tsx](src/app/alerts/page.tsx)
- Component: [src/components/features/PriceAlerts.tsx](src/components/features/PriceAlerts.tsx)
- Status: UI works for creating local alerts, but:
  - Live price display may be **Unavailable** depending on enabled providers
  - Notification delivery is **Unavailable** (no email/push/telegram backend wired)

### DeFi (server-side proxy)
- Some DeFi datasets are routed through internal API endpoints (no browser-side third-party fetch).
- Route: [src/app/api/defi/llama/route.ts](src/app/api/defi/llama/route.ts)

---

## 2) API Routes (truthful unavailability)

### Smart Contract Verification API (Sourcify)
- Route: [src/app/api/smart-contract/verify/route.ts](src/app/api/smart-contract/verify/route.ts)
- Behavior:
  - Live check via Sourcify when available
  - Cache-first and explicit stale-cache fallback (only when labeled stale)
  - Truthful errors (e.g. `400` bad input, `502` upstream failure when no cache)

### ETF API (flows/AUM not provided)
- Route: [src/app/api/etf/route.ts](src/app/api/etf/route.ts)
- Returns: BTC price context only; ETF flows/AUM fields are `null` and `data_type: 'unavailable'`.

### Risk API (may return 503)
- Route: [src/app/api/risk/route.ts](src/app/api/risk/route.ts)
- Returns: `503` when it cannot compute risk metrics from free endpoints.

### Moderation API (may return 503)
- Route: [src/app/api/moderation/route.ts](src/app/api/moderation/route.ts)
- Returns: `503` when moderation is unavailable.

### Diagnostics + Sync endpoints (Supabase/config dependent)
- Route: [src/app/api/diagnostics/route.ts](src/app/api/diagnostics/route.ts) (can return `503` when Supabase not configured)
- Route: [src/app/api/sync/route.ts](src/app/api/sync/route.ts) (can return `503`)
- Route: [src/app/api/data/sync/route.ts](src/app/api/data/sync/route.ts) (can return `503`)

### Community endpoints (may return 503)
- Route: [src/app/api/community/route.ts](src/app/api/community/route.ts)
- Route: [src/app/api/community/interact/route.ts](src/app/api/community/interact/route.ts)

### Chat / AI endpoints (may return 503)
- Route: [src/app/api/chat/route.ts](src/app/api/chat/route.ts)
- Route: [src/app/api/chat/stream/route.ts](src/app/api/chat/stream/route.ts)
- Route: [src/app/api/chat/analytics/route.ts](src/app/api/chat/analytics/route.ts)
- Route: [src/app/api/chat/feedback/route.ts](src/app/api/chat/feedback/route.ts)
- Route: [src/app/api/ai/index/route.ts](src/app/api/ai/index/route.ts)
- Route: [src/app/api/ai/chat/route.ts](src/app/api/ai/chat/route.ts)
- Route group (Supabase/config dependent):
  - [src/app/api/ai-data/ingest/route.ts](src/app/api/ai-data/ingest/route.ts)
  - [src/app/api/ai-data/snapshots/route.ts](src/app/api/ai-data/snapshots/route.ts)
  - [src/app/api/ai-data/training/route.ts](src/app/api/ai-data/training/route.ts)
  - [src/app/api/ai-data/wallets/route.ts](src/app/api/ai-data/wallets/route.ts)

### User/download tracking endpoints (Supabase required; can return 503)
- Route: [src/app/api/user/register/route.ts](src/app/api/user/register/route.ts)
- Route: [src/app/api/user/track-download/route.ts](src/app/api/user/track-download/route.ts)

---

## 3) Feature Components / Data Domains

### Whale Tracker feature (partially unavailable)
- Component: [src/components/features/WhaleTracker.tsx](src/components/features/WhaleTracker.tsx)
- Unavailable sections:
  - Whale alerts
  - Bitcoin wallet distribution
  - Exchange flow metrics (requires real feed/labels)

### Fear & Greed (shows unavailable when official source fails)
- Component: [src/components/features/FearGreedIndex.tsx](src/components/features/FearGreedIndex.tsx)

### Risk Dashboard / Risk Score
- Component: [src/components/features/RiskDashboard.tsx](src/components/features/RiskDashboard.tsx) (shows “Risk analytics unavailable” on API failure)
- Component: [src/components/RiskScoreCard.tsx](src/components/RiskScoreCard.tsx) (renders “Unavailable for this asset from free sources.”)

### Technical analysis UI
- Component: [src/components/TechnicalAnalysisPanel.tsx](src/components/TechnicalAnalysisPanel.tsx)
- “Overall” becomes **Unavailable** when there are 0 indicators.

### NFTs (free API gaps)
- Library: [src/lib/nftData.ts](src/lib/nftData.ts)
- Can return `dataSource: 'unavailable'` and “NFT market data unavailable from CoinGecko free API”.

### Macro (missing signals surfaced as unavailable)
- Library: [src/lib/macroData.ts](src/lib/macroData.ts)
- Specific macro items can be unavailable (Fed Funds, 10Y Treasury, DXY, VIX, S&P 500, Nasdaq).

### Derivatives (free endpoint gaps)
- Library: [src/lib/derivativesData.ts](src/lib/derivativesData.ts)
- Liquidation data can be unavailable from free public endpoints.

### Data ingestion (RSS pipeline not implemented)
- Library: [src/lib/dataIngestion.ts](src/lib/dataIngestion.ts)
- RSS feed parsing/dedupe/storage is explicitly marked **not implemented**.

### Prediction DB backfill (not implemented)
- Library: [src/lib/predictionDb.ts](src/lib/predictionDb.ts)
- Historical price backfill for “actual results” is explicitly **not implemented**.

---

## 4) Supabase usage that affects availability

When Supabase is not configured (or service key is missing for admin operations), several endpoints/features return `503` or block actions.

- Client creation + config gating: [src/lib/supabase.ts](src/lib/supabase.ts)
- Supabase-backed caching helpers: [src/lib/supabaseData.ts](src/lib/supabaseData.ts)
- Download tracking blocks when tracking is unavailable: [src/components/DownloadButton.tsx](src/components/DownloadButton.tsx)

---

## 5) Feature Flag System

The app now supports deployment modes via environment variables. Set `NEXT_PUBLIC_APP_MODE=free` for a public beta with restricted features.

### Feature Flags (`src/lib/featureFlags.ts`)

| Flag | Default (free mode) | Description |
|------|---------------------|-------------|
| `NEXT_PUBLIC_FEATURE_COINGECKO` | OFF | CoinGecko API (personal use license) |
| `NEXT_PUBLIC_FEATURE_DEFI` | OFF | DeFiLlama-backed data domains |
| `NEXT_PUBLIC_FEATURE_WHALES` | OFF | Whale tracking (Blockchair/Etherscan) |
| `NEXT_PUBLIC_FEATURE_NFT` | OFF | NFT data domains |
| `NEXT_PUBLIC_FEATURE_PREDICTIONS` | OFF | AI predictions module |
| `NEXT_PUBLIC_FEATURE_PAYMENTS` | OFF | Paddle payment integration |
| `NEXT_PUBLIC_FEATURE_PRICING` | OFF | Pricing page visibility |
| `NEXT_PUBLIC_FEATURE_COMMUNITY` | OFF | Community features |
| `NEXT_PUBLIC_FEATURE_MACRO` | OFF | Macro data (Treasury, Yahoo Finance) |

### When a feature is OFF:
- API routes return **403** with explanation message
- UI components show **"Unavailable"** or hide the feature entirely
- Download categories are disabled in the Download Center
- Data sources are excluded from "Data Sources" labels in UI

### API Route Feature Gates:
- `/api/whales` → requires `whales` flag
- `/api/crypto/[id]/history` → uses Binance first, CoinGecko only if `coingecko` flag is ON
- `/api/predict` → requires `predictions` flag
- Coin detail page → conditionally fetches macro/whale data based on flags

---

## Notes / Interpretation

- Many "Unavailable" states are **correct behavior** under the no-fake-data rule. This report is not saying they are bugs; it's an inventory of what isn't populated yet.
- Some items are unavailable due to lack of a reliable free public data source (ETF flows/AUM, certain whale metrics, certain derivatives/liquidations, etc.).
- Features can be **intentionally disabled** via feature flags for licensing/compliance reasons in "free" deployment mode.
