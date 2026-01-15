# correction.md — Remaining go-live compliance actions (DataSimplify)

_Not legal advice. This file intentionally contains ONLY what still needs to be done before production._

## Status (Jan 15, 2026)

✅ No further code/content changes were found that block a Paddle-safe launch under the **“templates-only + display-only market data”** posture.

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
