# Data Source Matrix (Nodes vs Free APIs vs Paid)

Date: 2026-01-03

This document answers:
- “If we run nodes (even for ‘top 200’), what data is still not covered by free APIs?”
- “What is realistically covered by self-host + caching to Supabase?”

It is written for the **no-fake-data** policy: if a dataset is not truly available, the UI must show `null` / “Unavailable” (or truthful upstream errors) and never a real-looking placeholder.

## Important clarification: “Top 200 nodes” is not how it works
Most “top 200 coins” are **tokens** on a smaller set of chains (Ethereum, Solana, BSC, etc.).
- You do **not** run a node per token.
- You run a node per **chain**, then index token contracts/transfers on that chain.

## Legend
- **Self-host (Nodes + Indexer)**: You run your own node(s) and build an indexer that writes aggregates to Supabase.
- **Free API (Commercial-safe?)**: A free/public API might exist, but commercial redistribution and caching rights must be verified.
- **Paid**: Typically required for “institutional-grade”, normalized, multi-venue datasets.

---

## What your codebase currently uses (reference)
- Market/price: [src/lib/binance.ts](src/lib/binance.ts), [src/lib/dataApi.ts](src/lib/dataApi.ts), [src/lib/syncService.ts](src/lib/syncService.ts)
- Market fallback: CoinGecko in several places (e.g. [src/lib/predictionTechnical.ts](src/lib/predictionTechnical.ts), [src/lib/syncService.ts](src/lib/syncService.ts))
- “Commercial alternative” market data: CoinLore (see [src/lib/coinlore.ts](src/lib/coinlore.ts), [src/lib/syncService.ts](src/lib/syncService.ts))
- On-chain + DeFi: [src/lib/onChainData.ts](src/lib/onChainData.ts), [src/lib/tokenUnlocks.ts](src/lib/tokenUnlocks.ts), [src/app/api/defi/llama/route.ts](src/app/api/defi/llama/route.ts)
- Whales/explorer APIs: [src/lib/whaleTracking.ts](src/lib/whaleTracking.ts)
- Derivatives: Binance Futures endpoints in [src/lib/derivativesData.ts](src/lib/derivativesData.ts)
- News/sentiment: CryptoPanic + Reddit + RSS in [src/lib/socialSentiment.ts](src/lib/socialSentiment.ts)
- Macro: [src/lib/macroData.ts](src/lib/macroData.ts)

---

## Matrix

| Data domain / feature | Self-host (nodes + indexer) covers it? | Free APIs typically cover it? | Commercial risk flags (based on available evidence) | If you want full/clean coverage (paid) |
|---|---:|---:|---|---|
| **Spot prices / OHLCV (1m–1d candles)** | ❌ Nodes do not contain prices | ✅ Yes, via exchange APIs (e.g., Binance) | Exchanges have ToS; caching/redistribution limits vary | Market data vendors; or paid exchange plans |
| **Multi-exchange aggregated OHLCV** | ❌ | ⚠️ Some free, but inconsistent | Often restricted for redistribution | CryptoCompare / CoinAPI / institutional feeds |
| **Market cap / circulating supply** | ⚠️ Total supply sometimes on-chain; “circulating” is mostly off-chain logic | ✅ Some free providers compute it | “Circulating supply” definitions differ; licensing varies | Paid market-data providers |
| **Technical indicators (RSI/MACD, etc.)** | ✅ if you have OHLCV stored | ✅ if you can fetch OHLCV | Dependent on price source license | Not usually needed paid if OHLCV is safe |
| **BTC chain metrics (blocks, fees, mempool-ish, tx counts)** | ✅ Yes (Bitcoin node) | ✅ Some public endpoints exist | Public API ToS may restrict republishing | Not usually required if self-hosting |
| **ETH/EVM chain metrics (gas, blocks, txs)** | ✅ Yes (EVM node) | ✅ via RPC or explorer APIs | RPC providers have ToS; explorer APIs often restrict reuse | Paid RPC (Infura/Alchemy/etc.) if you don’t self-host |
| **Whale transactions (large tx detection)** | ✅ Yes (for chains you index) | ✅ via explorers (Etherscan/Blockchair style) | **High risk** if ToS forbids reuse/caching | Paid labeled/curated whale feeds |
| **Exchange wallet balances / ‘exchange reserves’** | ⚠️ Only if you have accurate labels/clusters | ⚠️ Some free, but labels are the hard part | Labels are often proprietary; misleading without them | Glassnode/CryptoQuant/Santiment-style datasets |
| **Wallet labeling (Binance/Coinbase/ETF custodian addresses)** | ❌ Not from nodes alone | ⚠️ Some community lists exist | Quality + legality varies; can be incomplete | Paid entity-label datasets |
| **Wallet distribution buckets (treemap)** | ⚠️ Possible only with full holder indexing per asset | ❌ Usually not free/reliable | Hard to do correctly across chains/tokens | Paid analytics providers |
| **DeFi TVL by chain/protocol** | ⚠️ Possible, but heavy (many protocols) | ✅ Aggregators exist | Terms may restrict commercial republishing | Paid DeFi data / permission from provider |
| **DeFi yields / pools / staking APY** | ⚠️ Possible, heavy | ✅ Aggregators exist | Same as above; also methodology disputes | Paid or build your own index |
| **Token unlock schedules** | ❌ Not from nodes alone (often off-chain schedules) | ✅ Aggregators exist | Licensing and accuracy vary | Paid tokenomics datasets |
| **Derivatives: funding, OI, liquidations (single exchange)** | ❌ Nodes don’t have it | ✅ Yes via exchange futures APIs (Binance futures) | Exchange ToS applies | Paid if you need higher limits/SLAs |
| **Derivatives: aggregated OI/funding across exchanges** | ❌ | ⚠️ Free is incomplete | Normalization and history is the challenge | Paid derivatives aggregators |
| **Options: IV surface / skew** | ❌ | ⚠️ Rarely free and complete | Usually paid; especially for history | Paid options data vendors |
| **ETF flows / AUM / holdings** | ❌ | ⚠️ Sometimes partial/free | Often not a clean free API for redistribution | Paid ETF datasets / vendors |
| **News headlines** | ❌ | ✅ RSS + some news APIs | **Publisher rights** can block redistribution | Paid news licensing (or link-only) |
| **News sentiment scoring** | ❌ | ✅ CryptoPanic-style feeds exist | Must verify ToS for commercial use | Paid sentiment vendors |
| **Social sentiment (Twitter/Reddit at scale)** | ❌ | ⚠️ Reddit limited; Twitter/X typically paid | API restrictions and rehosting limits | Paid social sentiment providers |
| **NFT market data** | ❌ | ⚠️ Free is spotty | Often limited endpoints/terms | NFT data vendors |
| **Macro indicators (rates, DXY, VIX, etc.)** | ❌ | ✅ Many public/free sources exist | Some endpoints are unofficial/scrape-like | Paid macro feeds if needed |

---

## High-risk licensing findings from online checks (actionable)

### Etherscan (explorer API / site)
The public terms page contains strong restrictions around:
- automated extraction/scraping,
- reproduction/republishing content extracted from APIs/CSV,
- and explicit restrictions around AI/ML/dataset creation without permission.

This is important because your architecture caches data into Supabase and surfaces it in a paid app.
- Your code uses Etherscan in [src/lib/whaleTracking.ts](src/lib/whaleTracking.ts).

### DefiLlama
The public terms page states the site/content/data license is for **personal, non-commercial** use and prohibits republishing/scraping for commercial purposes.
- Your code uses DefiLlama endpoints in [src/lib/onChainData.ts](src/lib/onChainData.ts) and [src/lib/tokenUnlocks.ts](src/lib/tokenUnlocks.ts).
- Some DeFiLlama calls are proxied via internal routes (e.g. [src/app/api/defi/llama/route.ts](src/app/api/defi/llama/route.ts)), but this does **not** change the underlying licensing risk.

**Implication:** “Free API exists” ≠ “commercial-safe for a subscription dashboard.”

### CoinGecko / Binance / Blockchair
- CoinGecko pages returned HTTP 403 via this tooling (could not verify terms here).
- Binance pages were blocked by bot protection in this tooling.
- Blockchair API docs could not be extracted here.

So for these, treat commercial use as **unverified** until you manually review their current terms.

---

## What running your own nodes *actually* replaces
If you self-host nodes (and run an indexer), you can eliminate dependence on explorer APIs for:
- raw blocks/txs
- address balances (where the chain model supports it)
- large transaction detection (“whales”) for chains you index
- chain-level metrics (fees, block times, counts)

It does **not** replace:
- prices/OHLCV
- derivatives/options
- ETF flows
- entity labels (exchange wallets)
- curated “circulating supply” definitions
- licensed news content/sentiment at scale

---

## Practical recommendation for your project (90 days to 1 year history)
If you want maximum “free” + commercial safety:
1) Use **exchange APIs** for OHLCV (and cache in Supabase). This powers most charts + indicators.
2) Self-host **only the chains you need** (often BTC + one EVM) and compute your own on-chain metrics.
3) Treat explorer/aggregator APIs as “optional convenience”, only after terms are verified for **commercial redistribution + caching**.
4) For the domains that almost always end up paid (labels, aggregated derivatives/options, ETF flows), plan for a paid vendor if those are core features.
