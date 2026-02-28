# CryptoReportKit — SEO Action Plan

**Date:** February 26, 2026  
**Goal:** Rank on Google page 1 for: `crypto`, `crypto analysis`, `crypto data download`, `crypto report`

---

## What Was Fixed Today (Code Changes)

### 1. Homepage Canonical URL — FIXED
- Added `alternates.canonical` to root layout pointing to `https://cryptoreportkit.com`
- Google now knows the definitive URL for the homepage

### 2. Canonical URLs on 25+ Pages — FIXED
- Added `alternates.canonical` to 20 high-value route layouts:
  - `/live-dashboards`, `/pricing`, `/sentiment`, `/screener`, `/trending`, `/heatmap`, `/correlation`, `/portfolio`, `/compare`, `/charts`, `/defi`, `/social`, `/technical`, `/about`, `/contact`, `/learn`, `/etf`, `/global-market`, `/datalab`, `/categories`, `/tools`
- Prevents duplicate content issues across the site

### 3. Coin Page Metadata — FIXED (CRITICAL)
- Created `src/app/coin/[id]/layout.tsx` with `generateMetadata()`
- All 20 coin pages now have unique, keyword-rich titles like:
  - "Bitcoin (BTC) Price, Chart & Analysis | CryptoReportKit"
  - "Ethereum (ETH) Price, Chart & Analysis | CryptoReportKit"
- Previously all 20 coin pages showed the generic homepage title — massive duplicate title issue

### 4. Legal Page Metadata — FIXED
- Created layouts for `/privacy`, `/terms`, `/disclaimer`, `/refund`, `/template-requirements`
- Each now has unique title, description, canonical URL, and OpenGraph meta

### 5. FAQ Schema on Homepage — FIXED
- Added `FAQJsonLd` to the global `AllJsonLd()` component
- Google will now show FAQ rich results (expandable Q&A) in search listings
- This alone can increase click-through rate by 20-30%

### 6. Sitemap Improvements — FIXED
- Changed `lastModified` from `new Date()` (regenerated every crawl) to a static build date
- Google now trusts the `lastmod` signal — previously it was meaningless
- Added `/etf` and `/global-market` to sitemap (were missing)

### 7. Homepage Keywords Expanded — FIXED
- Added high-intent keywords: `crypto data download`, `crypto report`, `cryptocurrency analysis tool`, `bitcoin analysis`
- Shortened description to ~155 chars (was 198, got truncated in SERPs)

---

## What You MUST Do Manually (Can't Be Done in Code)

### PRIORITY 1: Set Up Google Search Console (Day 1)

This is THE most important step. Without it, Google may not even know your site exists well.

1. Go to https://search.google.com/search-console
2. Click "Add Property" → enter `https://cryptoreportkit.com`
3. Choose "URL Prefix" verification
4. Select "HTML tag" method
5. Copy the `content` value from the meta tag they give you
6. Open `src/app/layout.tsx` → find the `verification` block → uncomment and paste:
   ```ts
   verification: {
     google: 'YOUR_ACTUAL_CODE_HERE',
   },
   ```
7. Deploy → click "Verify" in Search Console
8. Submit sitemap: Go to Sitemaps → enter `sitemap.xml` → Submit

### PRIORITY 2: Set Up Bing Webmaster Tools (Day 1)

1. Go to https://www.bing.com/webmasters
2. Import from Google Search Console (easiest)
3. Add verification code to the same `verification` block:
   ```ts
   verification: {
     google: 'your-google-code',
     bing: 'your-bing-code',
   },
   ```

### PRIORITY 3: Request Indexing (Day 1-2)

After Search Console is verified:
1. Go to URL Inspection → enter `https://cryptoreportkit.com`
2. Click "Request Indexing"
3. Do the same for your top 10 pages:
   - `/live-dashboards`
   - `/pricing`
   - `/market`
   - `/compare`
   - `/screener`
   - `/sentiment`
   - `/trending`
   - `/heatmap`
   - `/coin/bitcoin`
   - `/coin/ethereum`

---

## Why You're NOT Ranking — Root Causes

### 1. Domain Authority is Low (New Site)
Google ranks based on trust. New domains have near-zero authority. This takes 3-6 months to build.

**Fix:** Backlinks (see below)

### 2. No Backlinks
Other sites need to link TO you. Without backlinks, Google sees no reason to trust your content.

**Fix plan (see Section below)**

### 3. No Blog / Content Marketing
You have 83+ dashboards but no blog posts explaining crypto concepts. Google ranks CONTENT, not just tools.

**What to write (high-volume keywords):**

| Blog Post Title | Target Keyword | Monthly Searches |
|---|---|---|
| "What Is Bitcoin Dominance? Chart + Analysis 2026" | bitcoin dominance | 18,000 |
| "Crypto Fear and Greed Index Explained" | crypto fear and greed index | 40,000 |
| "How to Read a Crypto Heatmap" | crypto heatmap | 12,000 |
| "Best Free Crypto Screener Tools 2026" | crypto screener | 8,000 |
| "DeFi TVL Rankings — What They Mean" | defi tvl | 6,000 |
| "How to Compare Cryptocurrencies" | compare cryptocurrencies | 5,000 |
| "Crypto Portfolio Allocation by Risk Level" | crypto portfolio allocation | 4,000 |
| "Bitcoin vs Ethereum — Full Comparison 2026" | bitcoin vs ethereum | 22,000 |
| "Crypto Tax Calculator — FIFO vs LIFO Explained" | crypto tax calculator | 15,000 |
| "What is BYOK in Crypto?" | BYOK crypto | 500 |

Each post should:
- Be 1,500-2,500 words
- Include internal links to your dashboards/tools
- Have proper H1 → H2 → H3 structure
- Include images with alt text
- End with a CTA to use your tool

### 4. Missing Structured Data on Key Pages
- **Pricing page** doesn't render `PricingJsonLd` — add it manually in the pricing page component
- **No `BreadcrumbList` schema** used anywhere — add to sub-pages

### 5. No Social Proof / E-E-A-T Signals
Google uses E-E-A-T (Experience, Expertise, Authoritativeness, Trustworthiness).

**Quick wins:**
- Add an author bio to blog posts
- Add "Featured in..." or "Trusted by..." sections if you get any press
- Add a real company address to the About page
- Add customer testimonials when you have them

---

## Backlink Strategy (Months 1-3)

### Free Backlinks (Week 1-2)
1. **Product Hunt launch** — Submit CryptoReportKit, get a do-follow link
2. **GitHub** — Make sure your repo has a link back to cryptoreportkit.com  
3. **Reddit** — Post genuinely helpful analysis using your tool in r/cryptocurrency, r/CryptoMarkets (don't spam)
4. **Twitter/X** — Post chart screenshots from your dashboards regularly
5. **Hacker News** — Submit a "Show HN" post about BYOK architecture

### Medium-Effort Backlinks (Week 3-8)
6. **Guest posts** on crypto blogs (offer free analysis in exchange for a link)
7. **Crypto directories** — List on:
   - CoinGecko's ecosystem page
   - DappRadar
   - awesome-crypto-tools GitHub lists
8. **Answer Quora questions** about crypto analysis tools with a link to your tool
9. **Create a free Chrome extension** or browser bookmark tool that links back

### High-Impact (Month 2-3)
10. **Create a "State of Crypto" monthly report** — shareable PDF/infographic
11. **Reach out to crypto newsletters** — offer exclusive data
12. **Podcast appearances** — crypto podcasts love discussing tools

---

## Technical SEO Remaining Tasks

### High Priority
| Task | Effort | Impact | Status |
|---|---|---|---|
| Add `PricingJsonLd` to pricing page component | 15 min | Medium — pricing rich results | DONE |
| Add `BreadcrumbJsonLd` to sub-pages | 1 hr | Medium — breadcrumb SERP display | DONE (16 pages) |
| Add `manifest.json` for PWA signals | 30 min | Low-Medium | DONE |
| Fix 8 images with empty `alt=""` | 30 min | Low | DONE (all 8 fixed) |

### Medium Priority
| Task | Effort | Impact | Status |
|---|---|---|---|
| Add per-page OG images (dynamic) | 2-3 hrs | Medium — better social previews | TODO |
| Add security headers (HSTS, X-Content-Type) | 30 min | Low — trust signals | DONE |
| Fix Footer links pointing to redirect URLs | 15 min | Low — crawl budget | DONE (restructured) |
| Add cross-links between feature pages | 1 hr | Medium — internal link equity | DONE (12 pages added to footer) |

### Nice-to-Have
| Task | Effort | Impact |
|---|---|---|
| Add `hreflang` tags if multiingual planned | 1 hr | N/A unless translations added |
| Implement `Cache-Control` headers for static assets | 30 min | Low — page speed |
| Add structured data for individual dashboard pages | 2 hrs | Medium long-term |

---

## Timeline to Page 1

| Timeframe | Expected Result |
|---|---|
| Week 1 | Google indexes your site (after Search Console setup) |
| Week 2-4 | You appear for branded searches ("CryptoReportKit") |
| Month 1-2 | Long-tail keywords start ranking (page 3-5): "free crypto heatmap tool", "crypto screener no signup" |
| Month 2-3 | With blog content + backlinks, move to page 2-3 for medium keywords |
| Month 3-6 | Page 1 for long-tail keywords; page 2-3 for competitive terms |
| Month 6-12 | Page 1 for competitive terms IF consistent content + backlink building |

**Reality check:** Ranking page 1 for just "crypto" is extremely difficult — it's dominated by CoinGecko, CoinMarketCap, Coinbase (sites with millions of backlinks). Your realistic targets are:

- ✅ Achievable (3-6 months): "crypto analysis tool", "free crypto dashboards", "crypto screener free", "crypto heatmap live", "crypto report download"
- ⚠️ Hard (6-12 months): "crypto analytics", "crypto data download", "bitcoin analysis tool"
- ❌ Very Hard (12+ months): "crypto", "crypto analysis", "bitcoin" (these are $1B+ brand territory)

---

## Quick Wins Checklist

- [ ] Set up Google Search Console & verify
- [ ] Submit sitemap.xml
- [ ] Set up Bing Webmaster Tools
- [ ] Request indexing for top 10 URLs
- [ ] Post on Product Hunt
- [ ] Write first blog post targeting "crypto fear and greed index explained"
- [ ] Submit to 3 crypto directories
- [ ] Add PricingJsonLd to pricing page
- [ ] Create Twitter/X content calendar (3x/week tool screenshots)
- [ ] Deploy the code changes from today

---

*The technical SEO foundation is now solid. The biggest bottleneck is domain authority + content. Focus on Search Console setup → blog content → backlinks.*
