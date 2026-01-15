# correction.md — Remaining go-live compliance actions (DataSimplify)

_Not legal advice. This file intentionally contains ONLY what still needs to be done before production._

## Status (Jan 15, 2026)

✅ No further code/content changes were found that block a Paddle-safe launch under the **“templates-only + display-only market data”** posture.

## Global legal note (cannot be auto-verified)

If you are selling **globally**, you should NOT treat “Paddle-safe + display-only” as “legally safe everywhere”. Before launch, you still need real legal/tax review for the jurisdictions you will serve.

Minimum global go-live requirements (non-code):
- Confirm tax setup for digital services/subscriptions (VAT/GST/Sales Tax as applicable) and ensure invoices/receipts match your seller entity.
- Confirm consumer protection compliance: clear pricing, auto-renewal disclosures, cancellation flow, and refund policy that matches what you actually honor.
- Confirm privacy compliance for your target markets (at minimum: GDPR/UK GDPR, CCPA/CPRA, and India DPDP as applicable): data processing purpose, retention, user rights, and a contact/grievance channel.
- Confirm you are not providing regulated financial/investment advice in any target market (keep “no advice/no signals” posture and avoid recommendation language).
- Confirm third-party data licensing/attribution requirements (CoinGecko “display-only”, no redistribution, no raw exports).

## Fastest path to “global-ready” (US + EU + UK + India)

Before launch, schedule a short review with:
- A lawyer (privacy + consumer protection + terms)
- A CA/accountant (tax + invoicing)

Decisions you must provide them (so they can answer correctly):
- Seller entity country + legal name + address (India company/sole prop/etc.)
- What you sell: subscription vs one-time purchase vs both
- Where you sell: US + EU + UK + India (confirm any exclusions)
- Whether you store personal data (you do if using Supabase auth) and where it is processed/hosted

Ask your lawyer to confirm (deliverables):
- A “subscription compliance” check: auto-renew language, cancellation UX, refund language, required pre-purchase disclosures
- Privacy compliance across: GDPR/UK GDPR, CCPA/CPRA, India DPDP (and whether you need cookie consent banners)
- Whether you need a DPA and subprocessor list in your Privacy Policy (common if using Supabase + Vercel)

Ask your CA/accountant to confirm (deliverables):
- Whether you must charge VAT (EU/UK) and how you will handle it (processor-collected vs self-collected)
- Whether you must charge GST (India) and invoicing requirements
- US sales tax guidance for digital subscriptions/templates (state-by-state risk; whether to use a tax engine)
- Invoice/receipt fields you must show (seller entity, tax IDs, customer location, currency)

Artifacts to hand them (from this repo/site):
- Live pricing page
- Terms, Privacy, Refund, Disclaimer pages
- Checkout screenshots/flow (Razorpay/Paddle)

## Required production configuration (do not skip)

1) Force Paddle-safe mode
- Set `NEXT_PUBLIC_APP_MODE=paddle_safe`

2) Keep trading-adjacent modules OFF
- `NEXT_PUBLIC_FEATURE_PREDICTIONS=false`
- `NEXT_PUBLIC_FEATURE_ALERTS=false`
- `NEXT_PUBLIC_FEATURE_WHALES=false`
- `NEXT_PUBLIC_FEATURE_RISK=false`
- `NEXT_PUBLIC_FEATURE_CHAT=false`
- `NEXT_PUBLIC_FEATURE_COMMUNITY=false`

3) Keep raw exports OFF (display-only posture)
- Set `NEXT_PUBLIC_ENABLE_DATA_EXPORTS=false`

4) CoinGecko posture
- If CoinGecko is enabled, keep it display-only:
  - `NEXT_PUBLIC_FEATURE_COINGECKO=true`
  - `NEXT_PUBLIC_COINGECKO_DISPLAY_ONLY=true`

## Go-live verification (fast manual checks)

- In `paddle_safe`, these routes must not be accessible: `/whales`, `/risk`, `/alerts`, `/predictions`, `/community`
- `/api/download` must return 410 (disabled)
- CoinGecko-backed routes must be internal-only and return 403 externally with `X-Data-License: display-only`
- UI must not offer CSV/XLSX/JSON export of third-party market data (templates + GDPR/CCPA user export are OK)

## Vercel deployment (Production)

1) Set Production environment variables
- Vercel Dashboard → Project → Settings → Environment Variables
- Add the variables in this file (sections 1–4) to the **Production** environment
- Also add them to **Preview** if you want previews to behave exactly like production during review

2) Redeploy after env var changes
- Any change to environment variables requires a new deployment to take effect
- Vercel Dashboard → Deployments → Redeploy latest (or push a no-op commit)

3) Quick endpoint checks on the deployed URL
- `GET https://<your-domain>/api/download` → expect **410**
- `GET https://<your-domain>/whales` → expect **404** (or redirect away)
- `GET https://<your-domain>/risk` → expect **404**
- `GET https://<your-domain>/alerts` → expect **404**
- `GET https://<your-domain>/predictions` → expect **404**
- `GET https://<your-domain>/community` → expect **404** or redirect away

4) Smoke-check CoinGecko display-only enforcement
- Pick a CoinGecko-backed route your UI uses (example: `GET https://<your-domain>/api/crypto/trending`)
- Verify responses include display-only headers (ex: `X-Data-License: display-only`)
