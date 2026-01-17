# DataSimplify Deployment Guide

Complete guide for deploying to Vercel with Supabase authentication and Paddle payments.

---

## 1. Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Enter project details:
   - **Name**: `datasimplify-prod` (or your preferred name)
   - **Database Password**: Generate a strong password (save it!)
   - **Region**: Choose closest to your users
4. Wait for project to be created (~2 minutes)

### 1.2 Run Database Migrations

1. Go to **SQL Editor** in Supabase dashboard
2. Run migrations in this order:
   ```
   supabase-schema.sql           (main schema)
   supabase/migrations/20260102_download_tracking.sql
   supabase/migrations/20260117_feedback_and_requests.sql
   ```
3. Verify tables were created in **Table Editor**

### 1.3 Configure Authentication

1. Go to **Authentication** > **Providers**
2. Enable **Email** provider (enabled by default)
3. Configure settings:
   - **Enable email confirmations**: ON (recommended for production)
   - **Secure email change**: ON
4. Go to **URL Configuration**:
   - **Site URL**: `https://cryptoreportkit.com`
   - **Redirect URLs**: Add:
     ```
     https://cryptoreportkit.com/auth/callback
     https://cryptoreportkit.com/login
     ```

### 1.4 Get API Keys

1. Go to **Settings** > **API**
2. Copy these values:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIs...`
   - **service_role key**: `eyJhbGciOiJIUzI1NiIs...` (keep secret!)

---

## 2. Vercel Environment Variables

### 2.1 Required Variables

Go to your Vercel project > **Settings** > **Environment Variables**

Add these variables for **Production** environment:

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | From Supabase API settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Public key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGciOiJIUzI1NiIs...` | Secret key (server only!) |
| `ADMIN_API_KEY` | Generate random 32+ char string | For admin API access |

### 2.2 Paddle Variables (Add after Paddle approval)

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_PADDLE_ENVIRONMENT` | `production` | Use `sandbox` for testing |
| `NEXT_PUBLIC_PADDLE_CLIENT_TOKEN` | From Paddle dashboard | Client-side token |
| `PADDLE_API_KEY` | From Paddle dashboard | Server-side secret |
| `PADDLE_WEBHOOK_SECRET` | From Paddle webhooks | Webhook verification |
| `PADDLE_PRO_PRICE_ID` | `pri_xxxxx` | Pro plan price ID |
| `PADDLE_PREMIUM_PRICE_ID` | `pri_xxxxx` | Premium plan price ID |

### 2.3 Optional API Keys

| Variable | Value | Notes |
|----------|-------|-------|
| `COINGECKO_API_KEY` | From CoinGecko | Pro API (optional) |
| `CRYPTOPANIC_API_KEY` | From CryptoPanic | News API |
| `OPENAI_API_KEY` | From OpenAI | For AI features |

### 2.4 Feature Flags

| Variable | Value | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_PADDLE_SAFE` | `true` | Hides risky features |
| `NEXT_PUBLIC_ENABLE_DOWNLOADS` | `true` | Enable template downloads |

---

## 3. Vercel Deployment

### 3.1 Connect Repository

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `datasimplify` (if monorepo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### 3.2 Add Environment Variables

1. Before deploying, add all environment variables from Section 2
2. Make sure to select **Production** for sensitive variables

### 3.3 Deploy

1. Click "Deploy"
2. Wait for build to complete
3. Test the deployment URL

### 3.4 Configure Domain

1. Go to **Settings** > **Domains**
2. Add your domain: `cryptoreportkit.com`
3. Configure DNS:
   - Add CNAME record: `www` → `cname.vercel-dns.com`
   - Add A record: `@` → Vercel IP (shown in dashboard)

---

## 4. Post-Deployment Checklist

### 4.1 Verify Supabase Connection

```bash
# Test API endpoint
curl https://cryptoreportkit.com/api/feedback -X POST \
  -H "Content-Type: application/json" \
  -d '{"pagePath":"/test","pageTitle":"Test","helpful":true}'
```

Should return `{"success":true,"id":"..."}` and appear in Supabase.

### 4.2 Test Authentication

1. Go to `/signup` and create a test account
2. Check email confirmation arrives
3. Sign in at `/login`
4. Verify profile appears in Supabase `user_profiles` table

### 4.3 Test Downloads

1. Go to `/download`
2. Select a template
3. Verify download works
4. Check `download_events` table in Supabase

---

## 5. Paddle Submission Checklist

Before applying for Paddle approval, ensure:

### 5.1 Website Requirements

- [ ] Clear product description on homepage
- [ ] Pricing page with all plan details (`/pricing`)
- [ ] Terms of Service page (`/terms`)
- [ ] Privacy Policy page (`/privacy`)
- [ ] Refund Policy page (`/refund`)
- [ ] Contact information (`/contact` or footer email)
- [ ] Working navigation (no 404s)
- [ ] Professional design (no placeholder content)

### 5.2 Business Requirements

- [ ] Business registration documents ready
- [ ] Tax ID / VAT number (if applicable)
- [ ] Bank account for payouts
- [ ] Support email configured

### 5.3 Product Requirements

- [ ] Clear value proposition
- [ ] Demo or free tier available
- [ ] No misleading claims
- [ ] No financial advice disclaimers present
- [ ] Educational purpose clearly stated

### 5.4 Technical Requirements

- [ ] HTTPS enabled (automatic with Vercel)
- [ ] Website loads quickly (<3s)
- [ ] Mobile responsive
- [ ] No console errors

### 5.5 Paddle Application Steps

1. Go to [paddle.com](https://paddle.com) and sign up
2. Complete business verification
3. Add your website URL
4. Configure products:
   - **Pro Plan**: $29/month
   - **Premium Plan**: $79/month
5. Set up webhooks:
   - URL: `https://cryptoreportkit.com/api/paddle/webhook`
   - Events: `subscription.created`, `subscription.updated`, `subscription.canceled`
6. Submit for review
7. Wait for approval (typically 1-3 business days)

---

## 6. Monitoring Setup (Recommended)

### 6.1 Vercel Analytics

1. Go to Vercel dashboard > **Analytics**
2. Enable Web Analytics (free tier available)

### 6.2 Error Tracking (Optional)

Add Sentry for error tracking:

```bash
npm install @sentry/nextjs
npx @sentry/wizard@latest -i nextjs
```

Add to Vercel:
- `SENTRY_DSN`: Your Sentry DSN
- `SENTRY_AUTH_TOKEN`: For source maps

### 6.3 Uptime Monitoring (Optional)

Use free services like:
- [UptimeRobot](https://uptimerobot.com)
- [Better Uptime](https://betteruptime.com)

Monitor:
- `https://cryptoreportkit.com` (homepage)
- `https://cryptoreportkit.com/api/health` (API health)

---

## 7. Troubleshooting

### Build Fails

```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build
```

### Supabase Connection Issues

1. Check environment variables are set correctly
2. Verify Supabase project is not paused (free tier pauses after 1 week inactivity)
3. Check Supabase dashboard for any errors

### Authentication Not Working

1. Verify redirect URLs in Supabase match your domain
2. Check Site URL is correct
3. Clear browser cookies and try again

### Downloads Not Working

1. Check `NEXT_PUBLIC_ENABLE_DOWNLOADS` is `true`
2. Verify Supabase tables exist
3. Check browser console for errors

---

## Quick Reference

```
Production URL:     https://cryptoreportkit.com
Supabase Dashboard: https://supabase.com/dashboard/project/YOUR_PROJECT_ID
Vercel Dashboard:   https://vercel.com/YOUR_TEAM/datasimplify
Paddle Dashboard:   https://vendors.paddle.com
```
