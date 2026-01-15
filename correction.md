# correction.md — Legal + Paddle-safe corrections (DataSimplify)

_Not legal advice. This is an engineering/compliance hardening checklist based on what’s in the repo. You should still run a real legal review before launch._

## Implementation check (Jan 15, 2026)

Based on the current workspace state, you **did implement several key fixes** (pricing/checkout alignment, display-only enforcement, and safer templates positioning). This doc is updated to mark what’s ✅ done vs what’s still ⚠️ pending.

**Legend**
- ✅ Done: Verified in code
- ⚠️ Pending: Still found in code / mismatch remains

## 0) Previously high-risk issues (now addressed)

### A) Tier naming is now consistent (Free / Pro / Premium) ✅ Done

✅ Verified in code:
- Subscription tier unions/types use `free | pro | premium` (no `starter`/`business` tier keys found in active tier logic).
- Pricing/dashboard surfaces align with Pro ($29) / Premium ($79).

**Why this matters**
- Paddle reviewers frequently flag inconsistent plan naming; this is now clean.

### B) CoinGecko display-only posture is now implemented ✅ Done

✅ Verified:
- In `paddle_safe`, CoinGecko is enabled (if not in free mode) and **forced to display-only** in [src/lib/featureFlags.ts](src/lib/featureFlags.ts).
- Many CoinGecko-backed API routes call `enforceDisplayOnly()` (examples include `/api/crypto/*`, `/api/charts/*`, `/api/technical`, `/api/sentiment`) and use the helper in [src/lib/apiSecurity.ts](src/lib/apiSecurity.ts).

**Acceptance check**
- In production, calling CoinGecko proxy routes externally (curl/Postman) returns 403 with `X-Data-License: display-only`.

### C) “Embedded Charts” removed across API + UI + generator ✅ Done

✅ Verified:
- Template download UI offers only: `addin`, `native_charts`, `formulas_only` in [src/components/TemplateDownloadModal.tsx](src/components/TemplateDownloadModal.tsx).
- Templates download API only supports those content types in [src/app/api/templates/download/route.ts](src/app/api/templates/download/route.ts).
- Generator no longer implements an “embedded/full” path (only comments remain) in [src/lib/templates/generator.ts](src/lib/templates/generator.ts).

### D) “Data downloads / IQY / raw exports” surfaces removed or disabled ✅ Done

✅ Verified fixes:
- JSON-LD no longer markets “market data downloads” in [src/components/JsonLd.tsx](src/components/JsonLd.tsx).
- Charts downloads are image-only (no `json`/`xlsx` exports) in [src/app/charts/page.tsx](src/app/charts/page.tsx) and [src/app/charts/advanced/page.tsx](src/app/charts/advanced/page.tsx).
- Coin page no longer offers CSV/XLSX data export UI (replaced with templates CTA) in [src/app/coin/[id]/page.tsx](src/app/coin/[id]/page.tsx).
- Compare page no longer includes CSV/JSON export code paths (removed client-side blob download) in [src/app/compare/page.tsx](src/app/compare/page.tsx).
- The generic download component defaults to “Get Excel Template” unless explicitly enabled via `NEXT_PUBLIC_ENABLE_DATA_EXPORTS=true` in [src/components/DownloadButton.tsx](src/components/DownloadButton.tsx).
- The legacy “live data template” helper no longer instructs users to connect to `/api/download` (template-only instructions) in [src/lib/excelTemplate.ts](src/lib/excelTemplate.ts).

✅ Remaining downloads that are OK (not market-data redistribution):
- Template file downloads via [src/app/api/templates/download/route.ts](src/app/api/templates/download/route.ts) are expected (this product ships `.xlsx` templates).
- User privacy export (GDPR/CCPA data portability) downloads a JSON file of the user’s own account data via [src/app/api/user/export/route.ts](src/app/api/user/export/route.ts) (triggered from [src/app/dashboard/page.tsx](src/app/dashboard/page.tsx)).

**Acceptance check**
- In your Paddle-safe production env, keep `NEXT_PUBLIC_ENABLE_DATA_EXPORTS` unset/false.
- Codebase search for `IQY|market data downloads` should only hit the intentional “downloads not available” copy in `/api/download`.
- Codebase search for client-side `.csv/.json` market exports should come up empty; the only `.json` download should be the user privacy export endpoint.

## 1) Must-change items to be Paddle-safe (submission blocking)

### 1.1 Remove/disable anything that can look like trading signals or advice
You already have feature flags for this in [src/lib/featureFlags.ts](src/lib/featureFlags.ts). The requirement is to ensure these are not discoverable in Paddle-safe mode:

- `predictions = false`
- `alerts = false`
- `whales = false`
- `risk = false`
- `chat = false`
- `community = false`

**Corrections**
1) Ensure these pages either return **404** or redirect in Paddle-safe mode (not just “disabled UI”):
   - [src/app/whales/page.tsx](src/app/whales/page.tsx)
   - [src/app/risk/page.tsx](src/app/risk/page.tsx)
   - [src/app/alerts/page.tsx](src/app/alerts/page.tsx)
   - Any `/community`, `/predictions`, `/chat` routes if present

2) Ensure the corresponding API routes hard-block when disabled:
   - `/api/whales` ([src/app/api/whales/route.ts](src/app/api/whales/route.ts))
   - `/api/risk` ([src/app/api/risk/route.ts](src/app/api/risk/route.ts))
   - `/api/community` ([src/app/api/community/route.ts](src/app/api/community/route.ts))

**Acceptance check**
- In `NEXT_PUBLIC_APP_MODE=paddle_safe`, direct navigation to those pages yields a 404/redirect and no “signals-like” wording appears anywhere.

### 1.2 Remove language that implies you sell data feeds
Even if the feature is off, copy can get crawled.

**Corrections**
- Rewrite tier features in [src/lib/payments.ts](src/lib/payments.ts) so nothing implies “data downloads”, “live feeds”, “IQY”, or “faster refresh via authenticated endpoints”.
- Ensure all public pages consistently say:
  - “Templates contain formulas only.”
  - “Data is fetched via the user’s CryptoSheets account in Excel Desktop.”

**Acceptance check**
- Searching the codebase for `IQY|live downloads|market data downloads` should return **zero marketing/SEO claims**.
- (Optional) Keeping “data downloads are not available” messaging in the disabled download endpoint is OK.

### 1.3 Align refunds across the product (Paddle hates inconsistency)
- Terms and Refund pages currently promise **30 days** (see [src/app/terms/page.tsx](src/app/terms/page.tsx) and [src/app/refund/page.tsx](src/app/refund/page.tsx)).
- Your due-diligence report mentions **14-day**.

**Corrections**
- Pick one policy and apply it across:
  - Website copy
  - Checkout expectations
  - Due-diligence / internal docs

**Recommendation (practical)**
- Keep the website promise at **30 days** if you truly intend to honor it, and update the due-diligence report to match.

## 2) Must-change items to be “data licensing safe” (CoinGecko display-only posture)

### 2.1 Decide the CoinGecko stance (then make code + docs match)
There are only two consistent options:

**Option A (recommended for your stated business model):**
- CoinGecko enabled for **website display-only** in Paddle-safe mode.
- Downloads remain **formula-only templates** via CryptoSheets.

**Option B (ultra conservative):**
- CoinGecko disabled in Paddle-safe and you rely only on sources you believe are redistributable/low-risk.

**Status**
- ✅ Option A is effectively implemented (CoinGecko display-only in `paddle_safe`).

**Keep verifying**
- CoinGecko-backed routes should continue to use `enforceDisplayOnly()` from [src/lib/apiSecurity.ts](src/lib/apiSecurity.ts).

### 2.2 Keep “no data downloads” truly enforced
You already have a strong stance here:
- `/api/download` is hard-disabled with HTTP 410 in [src/app/api/download/route.ts](src/app/api/download/route.ts).

**Corrections**
- Ensure any other export endpoints do not return raw third-party market data (search for CSV/export endpoints and verify).

## 3) Fix template positioning so it’s unambiguous (Paddle + licensing clarity)

### 3.1 Remove “Embedded Charts” naming
Even if you embed chart definitions (not data), the wording is a risk.

**Status**
- ✅ API no longer offers “Embedded Charts”.
- ✅ UI + generator no longer include “Embedded Charts” / `full` (see [src/components/TemplateDownloadModal.tsx](src/components/TemplateDownloadModal.tsx) and [src/lib/templates/generator.ts](src/lib/templates/generator.ts)).

### 3.2 Keep the public template story consistent
Your docs say you support 3 types:
- Interactive (CryptoSheets)
- Native charts
- Formula-only

**Corrections**
- Ensure the template list returned by the API and the UI mention only these 3 categories.

## 4) Fix Paddle tier mapping end-to-end (required)

### 4.1 Unify tier keys and amounts
✅ Core payment flow is now aligned to:
- UI: Free/Pro/Premium in [src/app/pricing/page.tsx](src/app/pricing/page.tsx)
- Checkout: pro/premium in [src/app/api/paddle/checkout/route.ts](src/app/api/paddle/checkout/route.ts)
- Config: pro/premium in [src/lib/payments.ts](src/lib/payments.ts)

✅ Verified: no active tier logic uses `starter`/`business`.

**Acceptance check**
- Clicking “Go Premium” calls checkout successfully.
- Webhook events map the Paddle price ID to `subscription_tier=premium`.

## 5) Content + legal text sync (easy wins that reduce review friction)

### 5.1 Update “Last updated” dates

✅ Verified: Terms/Privacy/Refund “Last updated” dates are aligned to **January 2026**.

**Corrections**
- Keep dates aligned to the current release month, and ensure they match your actual launch entity and contact details.

### 5.2 Ensure “no advice” is present on all analytics-heavy pages
Terms are strong, but Paddle reviewers often look for contextual disclaimers.

**Corrections**
- Add a consistent footer disclaimer (or shared component) to:
  - market dashboards
  - technical indicators
  - any sentiment/on-chain pages

## 6) Recommended `.env` for Paddle-safe launch

```env
NEXT_PUBLIC_APP_MODE=paddle_safe

# Keep risky modules OFF
NEXT_PUBLIC_FEATURE_PREDICTIONS=false
NEXT_PUBLIC_FEATURE_ALERTS=false
NEXT_PUBLIC_FEATURE_WHALES=false
NEXT_PUBLIC_FEATURE_RISK=false
NEXT_PUBLIC_FEATURE_CHAT=false
NEXT_PUBLIC_FEATURE_COMMUNITY=false
NEXT_PUBLIC_FEATURE_DEFI=false
NEXT_PUBLIC_FEATURE_SOCIAL_SENTIMENT=false
NEXT_PUBLIC_FEATURE_MACRO=false

# If you choose CoinGecko display-only in paddle_safe
NEXT_PUBLIC_FEATURE_COINGECKO=true
NEXT_PUBLIC_COINGECKO_DISPLAY_ONLY=true

# Payments/pricing ON
NEXT_PUBLIC_FEATURE_PAYMENTS=true
NEXT_PUBLIC_FEATURE_PRICING=true

# Keep raw data exports OFF for display-only posture
NEXT_PUBLIC_ENABLE_DATA_EXPORTS=false
```

## 7) Paddle-safe “review checklist” (what to verify before submission)

1) Pricing consistency
- Pricing page, checkout API, and Paddle dashboard products match (names + amounts).

2) No signals/advice features accessible
- `/whales`, `/risk`, `/alerts`, `/community`, `/predictions`, `/chat` are not accessible in paddle_safe.

3) No “data feed” marketing
- No mention of IQY, “live downloads”, “market data downloads”, “signals”, “buy/sell”, “best coin”, etc.

4) Data licensing guardrails
- CoinGecko routes are internal-only (403 externally) and clearly labeled display-only.
- No endpoints provide raw third-party market data exports.

5) Template clarity
- Templates are described as formulas-only; no static snapshots.
- CryptoSheets dependency is clearly stated on pricing + template download flow.

---

## If you want, I can finish the remaining fixes
Top remaining items are: ensuring disabled feature routes hard-404/redirect in `paddle_safe` (whales/risk/alerts/chat/community), and doing a final copy/SEO sweep to confirm no “data feed / downloads / signals” marketing language.
