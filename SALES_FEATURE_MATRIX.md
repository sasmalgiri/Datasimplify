# CryptoReportKit — Sales Feature Matrix (Free vs Pro)

Updated: 2026-03-02

This matrix is **sales-aligned** and only includes capabilities that are **implemented in the current codebase and exposed in the UI** (Live Dashboards, Templates/Experiment Lab, Compare, Verify, Learn, Status). It intentionally excludes disabled/redirected features (see bottom).

> Note on current deployment mode: the site is presently operating in “free mode / beta-like mode” in places. The **feature split below is still valid** because the **Pro-gates and plan limits exist in code** (notably DataLab, API-call limits, download limits). You can tighten/relax limits later without changing the feature list.

| Area | Free | Pro |
|---|---|---|
| **Live Dashboards** | Launch curated dashboards | Launch curated dashboards |
| **Auto-generated dashboards** (`/live-dashboards/explore`) | Browse & open protocol/coin dashboards | Browse & open protocol/coin dashboards |
| **Dashboard tools** | AI Builder, Custom Builder, Community browsing, Taxonomy | AI Builder, Custom Builder, Community browsing, Taxonomy |
| **Shareable dashboards** | Share links for personal use | Share links for personal use |
| **Dashboard export** | Export dashboards (PDF/PNG) | Export dashboards (PDF/PNG) |
| **Templates / Experiment Lab** (`/templates`) | Browse templates, category tabs, search | Browse templates, category tabs, search |
| **Template experiments** (`/templates/[id]/experiment`) | Run the experiment flow and preview layouts | Run the experiment flow and preview layouts |
| **Template downloads (monthly limit)** | ✅ Yes — limited | ✅ Yes — higher limit |
| **Compare tool** (`/compare`) | Compare up to plan limit coins, head-to-head (2 coins), what-if market cap | Same, plus higher usage limits |
| **DataLab (research overlays)** (`/datalab`) | ❌ Not included | ✅ Included (explicit Pro gate in UI) |
| **Smart Contract Verification** (`/smart-contract-verifier`) | ✅ Included | ✅ Included |
| **Learn / Glossary / FAQ / Blog** | ✅ Included | ✅ Included |
| **Status page** (`/status`) | ✅ Included | ✅ Included |

## Plan limits (what you can confidently sell)

These are the plan-limit “levers” already present in the code (centralized in `src/lib/entitlements.ts`).

| Limit type | Free | Pro |
|---|---:|---:|
| Daily API calls (app-level) | 100/day | 10,000/day |
| Template downloads | 5 / month | 300 / month |
| Scheduled exports | 5 | 5 |
| Compare coins | Up to 10 | Up to 10 |
| AI queries (if enabled in your deployment) | 100/day | 100/day |

## What’s intentionally NOT sold right now (avoid promising)

These areas exist in code/docs but are **disabled by default** (feature flags) and/or **redirected to Coming Soon** in routing config. Keep them off the pricing table until you explicitly enable them and validate them end-to-end.

- Whale tracker (`/whales` redirect)
- Exchange rankings (`/exchanges` redirect)
- NFT pages (`/nft` redirect)
- Higher-risk data domains: DeFi / Social Sentiment / Macro (feature-flagged OFF by default)

## Best “Pro value proposition” (1 sentence)

Pro unlocks **DataLab** (interactive research overlays + experimentation) and significantly higher operational limits (API calls + downloads), while Free keeps the core dashboard + template discovery experience usable.
