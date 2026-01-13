# 🚀 DataSimplify - Quick Start

## Your Supabase is already configured! ✅

## Run in 3 Steps:

### Step 1: Install dependencies
```bash
npm install
```

### Step 2: Start the app
```bash
npm run dev
```

### Step 3: Open browser
```
http://localhost:3000
```

---

## That's it! 🎉

The app will run with:
- ✅ Your Supabase database (already connected)
- ✅ Market data (Binance by default)
- ⚙️ Optional providers/domains are feature-flagged (CoinGecko/DeFi/Whales/NFT/Social Sentiment)
- ⚙️ Macro/Public RPC are feature-flagged (OFF by default)
- ⚠️ AI features need Ollama (optional)

---

## Free-only sources mode (recommended if you want ONLY free sources)

Set this in your environment:

```env
NEXT_PUBLIC_APP_MODE=free
```

In `free` mode the app:
- Forces strict source gating on (fail-closed)
- Allows only built-in free sources (e.g. Binance, Alternative.me, DeFiLlama, blockchain.info, public RPC)
- Hard-disables non-free / higher-risk provider modules regardless of other env flags

---

## Production: Automated Data Retention Cleanup

This repo includes a retention cleanup endpoint and a cron schedule.

### Vercel Cron (no extra cost, but limits vary by plan)

- The cron config is in `vercel.json` and calls `GET /api/cleanup/run` daily.
- Based on Vercel docs (last updated June 2025):
	- Cron Jobs are available on all plans.
	- Hobby: limited cron jobs and only daily invocations; timing is best-effort within the hour.
	- Pro/Enterprise: more jobs and unlimited invocations.

To allow Vercel Cron to run cleanup without custom headers, set:

- `CLEANUP_ALLOW_VERCEL_CRON=true`

This authorizes requests by checking the Vercel cron User-Agent. If you want stricter security, use the Supabase scheduler method below.

### Supabase Scheduler (alternative to Vercel Cron)

If you want a scheduler that can send headers, you can use Supabase Postgres scheduling:

- Enable `pg_cron` and `pg_net` extensions in Supabase
- Schedule an HTTP call to your production endpoint and include `x-cleanup-secret`

Example idea (run from Supabase SQL editor) is documented by Supabase in their “Scheduling Edge Functions” guide using `cron.schedule(...)` + `net.http_post(...)`.

### Manual run (recommended for testing)

- `POST /api/cleanup` with header `x-cleanup-secret: <CLEANUP_SECRET>`
- `GET /api/cleanup` with header `x-cleanup-secret: <CLEANUP_SECRET>` (stats)

Environment variables:

- `CLEANUP_SECRET` (required for manual/Supabase scheduler)
- `CLEANUP_ALLOW_VERCEL_CRON` (optional; set to `true` only if using Vercel Cron)

---

## Vercel-safe env (recommended)

Set these in **Vercel → Project → Settings → Environment Variables**:

```env
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN

# Supabase (recommended)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Cleanup job auth
CLEANUP_SECRET=CHANGE_ME_TO_A_RANDOM_32+_CHAR_STRING
CLEANUP_ALLOW_VERCEL_CRON=true

# Optional: protect /api/sync and AI-data endpoints
SYNC_SECRET_KEY=CHANGE_ME_TO_A_RANDOM_32+_CHAR_STRING

# Commercial-safe defaults (riskier domains OFF)
NEXT_PUBLIC_APP_MODE=full
NEXT_PUBLIC_FEATURE_COINGECKO=false
NEXT_PUBLIC_FEATURE_SOCIAL_SENTIMENT=false
NEXT_PUBLIC_FEATURE_DEFI=false
NEXT_PUBLIC_FEATURE_WHALES=false
NEXT_PUBLIC_FEATURE_NFT=false
NEXT_PUBLIC_FEATURE_MACRO=false
NEXT_PUBLIC_FEATURE_MACRO_YAHOO=false
NEXT_PUBLIC_FEATURE_PUBLIC_RPC=false
NEXT_PUBLIC_FEATURE_PREDICTIONS=false
```

---

## Optional: Enable AI Features

Install Ollama for AI chat:
```bash
# Download from https://ollama.com
# Then run:
ollama pull llama3.2
```

---

## Pages You Can Visit:

| Page | URL |
|------|-----|
| Dashboard | http://localhost:3000 |
| Compare Coins | http://localhost:3000/compare |
| Download Center | http://localhost:3000/download |
| AI Chat | http://localhost:3000/chat |
| Fear & Greed | http://localhost:3000/sentiment |
| DeFi Data | http://localhost:3000/defi |
| Learn Crypto | http://localhost:3000/learn |
| Glossary | http://localhost:3000/glossary |

---

## Need Help?

If you see errors:
1. Make sure you ran `npm install`
2. Make sure `.env.local` exists (it should!)
3. Check that Supabase schema was created

Your Supabase URL: https://gadspittitmuqmysiawu.supabase.co
