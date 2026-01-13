# DataSimplify — Project Overview (as of 2026-01-07)

This document is a **repo-level map** of what exists in the current workspace: the stack, major folders, pages, API surface, data sources, and how the current **free-only mode** works.

---

## 1) What this repo is

- **Product**: Crypto research dashboard with charts, comparisons, and CryptoSheets template generation.
- **Framework**: Next.js **16** App Router + React **19** + TypeScript.
- **Data layer**:
  - Direct upstream fetches (market/onchain/etc)
  - Optional Supabase-backed caching + user tables
- **Templates**:
  - CryptoSheets formula templates via `/api/templates/download`
  - Templates contain formulas only (no embedded data)

---

## 2) High-level folder map

- `src/app/`
  - Next.js App Router pages (`*/page.tsx`)
  - API routes (`api/**/route.ts`)
  - Global layout/styles

- `src/components/`
  - UI building blocks (navbar, tables, charts, etc)
  - Feature components under `src/components/features/`

- `src/lib/`
  - Provider clients (Binance, CoinGecko, etc)
  - Business logic (templates, chart transforms, caching)
  - Policy + feature flag system

- `supabase/`
  - SQL schemas/migrations and related setup SQL

- `scripts/`
  - One-off scripts for backfills and data extraction

---

## 3) Runtime modes

### 3.1 `full` mode (default)

- `NEXT_PUBLIC_APP_MODE=full` (or unset)
- Feature flags control optional domains/providers (CoinGecko, whales, DeFi, macro, social sentiment, etc)
- Redistribution policy defaults depend on `NODE_ENV` + `REDISTRIBUTION_MODE`

### 3.2 `free` mode ("free-only sources")

Enable:

```env
NEXT_PUBLIC_APP_MODE=free
```

Effects:

- **Forces strict source gating ON** (server + client)
- **Hard-disables** these feature domains regardless of other env vars:
  - `coingecko`, `socialSentiment`, `macro`, `macroYahoo`, `publicRpc`, `defi`, `whales`, `nft`, `predictions`, `community`, `smartContractVerifier`
- Sets an internal, built-in **free-only allowlist** (and intersects with `REDISTRIBUTABLE_SOURCES` if provided):

  ```text
  binance, coinlore, alternativeme, defillama, blockchaininfo, publicrpc
  ```

Notes:

- This free-only mode is **cost-driven gating** (avoid paid/API-key sources). It does **not** automatically guarantee legal redistributability.

---

## 4) Feature flags & key environment variables

### 4.1 Feature flags (client)

Implemented in `src/lib/featureFlags.ts`.

Common flags:

- `NEXT_PUBLIC_APP_MODE` = `free` | `full`
- `NEXT_PUBLIC_FEATURE_COINGECKO`
- `NEXT_PUBLIC_FEATURE_SOCIAL_SENTIMENT`
- `NEXT_PUBLIC_FEATURE_DEFI`
- `NEXT_PUBLIC_FEATURE_WHALES`
- `NEXT_PUBLIC_FEATURE_NFT`
- `NEXT_PUBLIC_FEATURE_MACRO`
- `NEXT_PUBLIC_FEATURE_MACRO_YAHOO`
- `NEXT_PUBLIC_FEATURE_PUBLIC_RPC`
- `NEXT_PUBLIC_FEATURE_PREDICTIONS`
- `NEXT_PUBLIC_FEATURE_COMMUNITY`
- `NEXT_PUBLIC_FEATURE_SMART_CONTRACT_VERIFIER`
- `NEXT_PUBLIC_FEATURE_PAYMENTS`
- `NEXT_PUBLIC_FEATURE_PRICING`

### 4.2 Redistribution / allowlist policy

Server policy:

- `REDISTRIBUTION_MODE` = `strict|on|enabled|true|1` OR `off|disabled|false|0`
- `REDISTRIBUTABLE_SOURCES` = comma-separated allowlist of source keys

Client mirror:

- `NEXT_PUBLIC_REDISTRIBUTION_MODE`
- `NEXT_PUBLIC_REDISTRIBUTABLE_SOURCES`

Important behavior:

- In **production**, server policy defaults to **enabled** when `REDISTRIBUTION_MODE` is not explicitly set.
- In **free mode**, the policy is forced **enabled** and the allowlist is constrained to the free-only set.

### 4.3 Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

### 4.4 Protected maintenance endpoints

- Sync:
  - `SYNC_SECRET_KEY` (required in production)
- Cleanup:
  - `CLEANUP_SECRET`
  - `CLEANUP_ALLOW_VERCEL_CRON=true` (optional; authorizes Vercel cron user-agent)

### 4.5 Payments (Paddle)

- `PADDLE_*` and `NEXT_PUBLIC_PADDLE_*` settings

### 4.6 External integrations

- Template generation uses CryptoSheets formula patterns
- No AI/LLM keys required (AI features removed)

---

## 5) External data sources (by domain)

This is a **code-level view** of upstream providers referenced in `src/lib/*` and API routes.

### 5.1 Market / price data

- Binance REST (`https://api.binance.com/api/v3`)
  - Used heavily in `src/lib/dataApi.ts` (market overview, OHLCV, order book, trades)

- CoinLore
  - Used by sync service as “commercial-friendly alternative” (see `syncCoinLoreData` in `src/lib/syncService.ts`)

- CoinGecko (feature-flagged)
  - Used for images/metadata and some fallbacks

### 5.2 Sentiment

- Alternative.me Fear & Greed (`https://api.alternative.me/fng/`)
- Social/news aggregation (feature-flagged)
  - Reddit public endpoints
  - CryptoPanic (API key)
  - RSS feeds (various)

### 5.3 DeFi

- DeFiLlama (`https://api.llama.fi`, `https://yields.llama.fi/...`) (feature-flagged)

### 5.4 On-chain

- blockchain.info (Bitcoin charts/stats)
- Public RPC endpoints (Ethereum/Polygon/etc) (feature-flagged)
- Etherscan is referenced for gas API + whale tracking in code (has free tier; still terms apply)

### 5.5 Macro

- FRED + Yahoo Finance endpoints are referenced (feature-flagged)

### 5.6 Templates

- CryptoSheets formula templates (no embedded data)
- Templates connect to live data via CryptoSheets add-in

---

## 6) UI pages (App Router)

Representative pages (not exhaustive):

- `/` and `/(main)`
- `/dashboard`
- `/templates`
- `/charts` and `/charts/advanced`
- `/market`, `/compare`, `/coin/[id]`
- `/sentiment`, `/social`
- `/defi`, `/whales`, `/onchain`, `/risk`, `/etf`, `/technical`, `/correlation`
- `/research`
- `/pricing` (feature-flagged), `/login`, `/signup`
- `/tools`, `/smart-contract-verifier`, `/community`

Notes:

- Several pages already contain “feature disabled” fallbacks based on `isFeatureEnabled(...)`.
- Templates UI provides CryptoSheets formula-based Excel files (no data redistribution).

---

## 7) API routes (52 total)

Below is a grouped list of API endpoints present under `src/app/api/**/route.ts`.

### 7.1 Core data

- `/api/crypto`
- `/api/crypto/[id]`
- `/api/crypto/[id]/history`
- `/api/crypto/global`
- `/api/crypto/search`

### 7.2 Charts

- `/api/charts/candles`
- `/api/charts/history`

### 7.3 Templates

- `/api/templates/download` (CryptoSheets formula templates)

### 7.4 Cached/Supabase data

- `/api/cached` (reads cached tables from Supabase)
- `/api/sync` (populates Supabase cache; protected by secret)
- `/api/data/sync` (additional sync endpoint)

### 7.5 Domain APIs

- `/api/derivatives`
- `/api/technical`
- `/api/risk`
- `/api/predict`
- `/api/etf`
- `/api/macro`
- `/api/sentiment`
- `/api/sentiment-full`
- `/api/defi/llama`
- `/api/unlocks`
- `/api/onchain`
- `/api/onchain/fear-greed-history`
- `/api/whales`

### 7.6 Users, community

- `/api/user/register`
- `/api/user/delete`
- `/api/user/templates` (template generation tracking)
- `/api/user/export`
- `/api/community`
- `/api/community/interact`

### 7.7 Payments

- `/api/paddle/checkout`
- `/api/paddle/webhook`

### 7.8 Maintenance

- `/api/cleanup` (manual stats + POST cleanup; protected)
- `/api/cleanup/run` (cron cleanup endpoint; protected)
- `/api/diagnostics` (internal/ops endpoint)

---

## 8) Supabase schema & caching model (high level)

The Supabase client setup is in `src/lib/supabase.ts`.

Known table interfaces defined in code:

- `market_data`
- `klines`
- `coin_sentiment`
- `sentiment_posts`
- `whale_transactions`
- `defi_protocols`

Caching behavior:

- `/api/cached` reads from Supabase for many domains (dashboard, market, DeFi, sentiment, whales, on-chain, freshness)
- `/api/sync` populates caches and is guarded by `SYNC_SECRET_KEY` in production

---

## 9) Background jobs / retention

- Vercel cron configured in `vercel.json`:
  - Calls `GET /api/cleanup/run` daily
- Cleanup endpoints validate authorization via:
  - `CLEANUP_SECRET` header, and/or
  - optional Vercel cron user-agent allowlisting (`CLEANUP_ALLOW_VERCEL_CRON=true`)

---

## 10) Notes about the "free-only" goal

- The repo now supports **free-only mode** via `NEXT_PUBLIC_APP_MODE=free`.
- Free-only mode:
  - reduces cost exposure
  - reduces accidental exposure to paid/API-key sources
  - hides blocked downloads/categories client-side
  - and blocks non-allowlisted sources server-side

However:

- “Free” ≠ “OK to redistribute” in general. If your goal is specifically “only legally redistributable sources”, you should still keep `REDISTRIBUTION_MODE=strict` and set `REDISTRIBUTABLE_SOURCES` based on your verified rights.

---

## 11) Where to look next (common entry points)

- Flags and app mode: `src/lib/featureFlags.ts`
- Server allowlist policy: `src/lib/redistributionPolicy.ts`
- Client allowlist policy: `src/lib/redistributionPolicyClient.ts`
- Templates: `src/app/api/templates/download/route.ts`
- Supabase cache API: `src/app/api/cached/route.ts`
- Sync job orchestration: `src/lib/syncService.ts` and `src/app/api/sync/route.ts`
- Market data core: `src/lib/dataApi.ts`
- On-chain fetchers: `src/lib/onChainData.ts`
- Social sentiment aggregator: `src/lib/comprehensiveSentiment.ts`
- Template config: `src/lib/templates/templateConfig.ts`
