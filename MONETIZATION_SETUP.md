# Monetization Setup (Gated Downloads + Entitlements)

This project supports selling template files (e.g. Power Query packs) while keeping **paid assets off public URLs**.

## 1) Supabase Storage

1. Create a Supabase Storage bucket named `crk-downloads`.
2. Set the bucket to **private**.
3. Upload your release files to paths like:
   - `power-query/free/PowerQuery_Free.pq`
   - `power-query/pro/PowerQuery_Pro.pq`

## 2) Seed the releases catalog

Run the SQL in:
- [supabase/seed-template-releases.sql](supabase/seed-template-releases.sql)

This populates `template_releases` so the app can list and serve downloads.

## 3) Configure environment variables

Server-side (Vercel / production):
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

FastSpring webhook auth (choose one):
- Option A (shared secret header): set `FASTSPRING_WEBHOOK_SECRET` and send it as `x-webhook-secret`
- Option B (Basic Auth): set `FASTSPRING_WEBHOOK_USERNAME` and `FASTSPRING_WEBHOOK_PASSWORD`

## 4) FastSpring webhook

Endpoint:
- `POST /api/webhooks/fastspring`

Behavior:
- Logs raw payload to `purchase_events`
- Creates `pending_entitlements` for the purchaser email + product
- The user later clicks **Claim purchases** on `/downloads` to convert pending entitlements into `product_entitlements`

Product mapping:
- `power-query-pro` → `power_query_pro`
- `power-query-enterprise` → `power_query_enterprise`

If your FastSpring payload includes `product_key` / `productKey`, that value is used directly.

## 5) Customer portal

- `/downloads` lists free releases to everyone
- Logged-in users see paid releases if they have an active entitlement
- Downloads are served via `/api/downloads/{slug}` using a **time-limited signed URL**
