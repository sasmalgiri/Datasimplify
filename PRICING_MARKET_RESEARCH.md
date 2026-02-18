# Pricing Market Research + “Will it sell?” (CryptoReportKit / DataSimplify)

## 1) What you’re selling (as implemented today)
Your public pricing page currently presents a **2-tier subscription**:
- **Free**: “3 downloads/month”, 5 widgets, 2-coin compare, 30-day history
- **Pro**: **$19/mo** or **$190/yr** (shown as “Save 17%”), “300 downloads/month”, 47 widgets, 10-coin compare, “full price history (all timeframes)”, exports without watermark, etc.

Important implementation note (impacts trust + conversion): the repo has multiple conflicting “sources of truth” for limits/copy (Free download limit and Pro history limit differ across UI vs enforcement). Resolve those before spending effort on pricing tests.

## 2) Key benchmarks (pricing anchors)
These are not perfect 1:1 competitors, but they define how buyers anchor value in crypto analytics + Excel workflows.

### A) Excel / Sheets crypto add-in: CryptoSheets
- **Free**
- **Premium**: **$49/month**
- **Professional**: **$199/month**
- **Team**: **$1,499/quarter**

How it anchors you: buyers will compare you to “an Excel plugin that just works” (often perceived as an all-in-one workflow tool).

### B) Charting / analysis platform: TradingView
TradingView uses a familiar SaaS ladder (Free → paid tiers) and explicitly markets an annual discount (their page also uses “save up to 17%”). It also gates by **history depth**, alerts, and simultaneous connections—i.e., *limits are a common and accepted monetization mechanism*.

How it anchors you: users expect paid tiers to unlock **more history, more exports, more alerts, more automation**.

### C) On-chain analytics: Glassnode
- **Standard**: **$0/month**
- **Advanced**: **$49/month** (billed yearly)
- **Professional**: **$999/month** (billed yearly)

How it anchors you: serious data tooling can be expensive; $19/mo is “cheap” in this context, but only if you clearly communicate *what work you save*.

### D) Research + datasets: Messari
- **Basic**: **$0/year** (limited)
- **All Access / Enterprise**: **$4,000–$5,000/year**

How it anchors you: the high end exists, but it’s a different buyer (funds, institutions). Don’t use this as justification for $19/mo—use it to understand that “pro” buyers pay when the product is clearly indispensable.

### E) Data provider with credit model: CoinGecko API
CoinGecko’s paid tiers start around **$29/mo** and scale up quickly. This is critical for BYOK: your users may need to pay **both** you **and** a data provider.

How it anchors you: if a user needs CoinGecko Basic ($29/mo) + your Pro ($19/mo), their mental total is **~$48/mo**. That’s suddenly very close to CryptoSheets Premium ($49/mo).

## 3) A correction: BYOK can be $0 (Demo key)
Your product can run with a **CoinGecko Demo key** (free). This is not hypothetical: the codebase explicitly supports demo keys via the `x-cg-demo-api-key` header and even guides users to get a free Demo API key.

What this changes:
- The “BYOK tax” is **not** automatically $29/mo for every user.
- For many users, total cost can be **$0 (Free plan + Demo key)** or **$19/mo (Pro plan + Demo key)**.
- The paid CoinGecko plan becomes relevant mainly for **power usage** (higher rate limits / deeper granularity / higher call volume).

Where Demo vs Pro matters in practice:
- Some data modes require CoinGecko Pro (example: sub-hourly OHLCV like 5m/15m/30m/1h is explicitly gated behind Pro in the app’s OHLCV proxy).
- For typical “dashboard + templates + daily candles + market data” usage, a Demo key is often sufficient.

## 4) What this implies for your $19/mo Pro plan
### The “BYOK tax” (your biggest pricing risk)
Because you’re BYOK, some users will evaluate you as:
- “I’m paying for **templates + dashboards**, not for data.”
- “I still need to buy an API plan if I hit limits.”

With Demo keys being free, this risk becomes more specific:
- It’s a risk for **high-frequency / intraday / heavy usage** users.
- It’s much less of a risk for **casual and mid-intensity** users.

So your pricing must be justified by **workflow savings**:
- faster research in Excel,
- reliable repeatable reports,
- clean exports (PDF/Excel/CSV),
- dashboards/widgets that save time vs DIY.

### $19/mo can work, but you must clearly sell the workflow
At $19/mo, you are positioned as a “lightweight pro tool.” That can sell if:
- the Pro tier clearly removes friction (exports, watermark removal, more history, more downloads, alerts), and
- the Free tier is useful but obviously limited.

Right now, inconsistent limits/copy across the repo is a conversion killer: crypto users are skeptical; any mismatch feels like bait-and-switch.

## 5) Functionality comparison (what you win/lose against)

This is the practical comparison a buyer will make.

| Buyer question | You (CRK/DataSimplify) | CryptoSheets | TradingView | Glassnode | DIY CoinGecko API |
|---|---|---|---|---|---|
| Excel-ready templates with dashboards | Strong (template packs + prefetched data + web dashboards) | Strong (add-in-centric) | Weak | Weak | Weak |
| Works with $0 “Demo key” | Yes (BYOK Demo supported) | Depends (they may bundle / proxy data) | Yes (their own data/feeds model) | Yes (their own data) | Yes (direct) |
| Best for “repeatable Excel reporting” | Strong | Strong | Medium | Low | Low |
| Best for traders doing intraday charting | Medium | Low | Strong | Medium | Medium |
| On-chain depth (entity-adjusted, pro-grade) | Low–Medium (not the core) | Low | Low | Strong | Low |
| Exports (PDF/Excel/CSV) and watermark removal | Strong (plan-gated) | Medium | Medium | Strong on higher tiers | DIY (you build it) |
| Cost anchor | $0 or $19/mo (+ optional provider upgrades) | $49/mo+ | varies by tier | $49/mo+ / $999/mo | $0 to $29/mo+ |

Interpretation:
- You’re most competitive against **CryptoSheets** when you emphasize “web dashboards + template packs + exports + research workflow,” especially at **$19/mo**.
- You’re not trying to beat **TradingView** at pure charting, nor **Glassnode** at deep on-chain.
- Your most dangerous competitor is **DIY** (spreadsheets + CoinGecko Demo key), so your paid value must be “time saved + polish + exports + repeatability.”

## 6) Final “Will it sell?” result (with Demo key = $0)
**Yes — more likely than the earlier $48/mo framing suggests.** Because users can use a free CoinGecko Demo key, many can experience the product at $0 and later upgrade to $19/mo without also buying a data plan.

Where it sells best:
- Excel-first users who want a **ready-made research workflow** (templates + dashboards + exports).
- Users who are satisfied with **daily candles / standard market data** (Demo key is enough).

Where it will not sell (or will churn):
- Users expecting **TradingView-level charting**.
- Users demanding **sub-hourly OHLCV** or heavy intraday workflows without paying for a Pro data key.

Non-negotiable before marketing spend:
- Align pricing copy with enforcement (downloads/month and “full history” claims). Any mismatch will cut conversions.

## 7) Recommended actions (highest ROI first)
### A) Fix trust/consistency (must-do)
- Choose a single Free download limit (3 vs 5 vs 30 appear in different places) and make UI + API enforcement match.
- Make “full history” match what you actually provide (either increase the cap, or change copy to “up to X years”).
- Ensure README / older monetization configs don’t contradict the live pricing page.

### B) Improve pricing fit (if you want better conversion)
- Consider a slightly stronger annual incentive than ~17% if you want annual prepay adoption (many SaaS products use ~20–25%).
- Keep $19/mo if your core value is “workflow + exports + dashboards” (not data). If you ever bundle data, you may need to re-price.

### C) Positioning language (what to emphasize)
- Lead with “hours saved per report” and “repeatable Excel models” rather than “data access.”
- Be explicit: “BYOK keeps costs low and respects privacy; Pro pays for the tooling.”

## 8) Suggested next step
If you want, I can convert this into a **detailed internal pricing plan** (tiers, limits, rationale, and exact copy) and then we can update the repo so UI + enforcement + docs match exactly.
