# DataSimplify - Project Context

## What is this project?

DataSimplify is a **crypto data platform** that democratizes financial data access for non-technical users. Users can download real-time crypto data in Excel/CSV format without coding.

**Live URL:** https://datasimplify-nediidei9-sasmalgiris-projects.vercel.app

## Tech Stack

- **Frontend:** Next.js 14 + TypeScript + Tailwind CSS
- **Database:** Supabase (PostgreSQL + Auth)
- **Payments:** Paddle (not Stripe)
- **AI:** Groq API (llama-3.3-70b-versatile)
- **Data Sources:** CoinGecko API, Binance API, Alternative.me, DeFiLlama
- **Deployment:** Vercel

## Project Structure

```
src/
├── app/
│   ├── market/page.tsx      # Market overview with 100 coins
│   ├── compare/page.tsx     # Compare up to 10 coins side-by-side
│   ├── download/page.tsx    # Download center with toggleable fields
│   ├── chat/page.tsx        # AI chat interface
│   ├── glossary/page.tsx    # 60+ crypto terms explained
│   ├── learn/page.tsx       # Educational content
│   ├── pricing/page.tsx     # Subscription plans
│   ├── login/page.tsx       # Email/password login
│   ├── signup/page.tsx      # Account creation
│   └── api/
│       ├── crypto/          # CoinGecko proxy endpoints
│       ├── download/        # Excel/CSV generation
│       ├── ai/chat/         # Groq AI endpoint
│       └── paddle/          # Payment webhooks
├── components/
│   ├── FreeNavbar.tsx       # Navigation for free pages
│   ├── ui/BeginnerHelpers.tsx # Tooltips, tips, info buttons
│   └── features/            # Feature components (14 total)
└── lib/
    ├── supabase.ts          # Supabase client
    ├── auth.tsx             # Auth context
    ├── glossary.ts          # 60+ crypto term definitions
    ├── dataTypes.ts         # Data categories & supported coins
    └── aiProvider.ts        # Groq AI integration
```

## Current Status (December 2024)

### ✅ Completed
- Landing page with professional design
- Market page with 100 coins, sorting, search, CSV download
- Compare page with 16 pre-configured coins, best performer highlighting
- Download page with 8 data types, toggleable fields, live preview
- AI Chat with Groq integration (API key configured)
- Glossary with 60+ terms
- Learn page with beginner guides
- Pricing page (Free, Starter $19, Pro $49, Business $99)
- Supabase Auth (email/password only, no Google OAuth)
- Dark theme throughout
- Responsive design
- User Dashboard UI (stats, download history, quick actions, upgrade prompts)
- Paddle checkout API endpoint
- Paddle webhook handlers (all subscription events)

### 🔄 In Progress
- Paddle payment integration (needs API credentials in .env.local)
- User download tracking (works for logged-in users)

### ❌ Not Started
- Subscription management (cancel/change plan UI)
- Email notifications

## Key Design Decisions

1. **No login required for free features** - Users can access Market, Compare, Download, AI Chat, Glossary, Learn without creating an account

2. **Free tier limits:** 5 downloads/month

3. **Color scheme:** Dark theme with emerald (#10b981) as primary accent

4. **Navigation order:** Market, Compare, Download, AI Chat, Glossary, Learn, Pricing, Login

5. **Hover tooltips:** Emerald dotted underline indicates hoverable elements

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://gadspittitmuqmysiawu.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
GROQ_API_KEY=gsk_...
```

## Database Schema (Supabase)

Key tables:
- `user_profiles` - User subscription info, download counts
- `crypto_prices` - Cached price data
- `crypto_metadata` - Coin info
- `embeddings` - RAG vectors for AI

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| GET /api/crypto | List coins from CoinGecko |
| GET /api/crypto/global | Global market stats |
| GET /api/crypto/[id] | Single coin details |
| GET /api/download | Generate Excel/CSV/JSON |
| POST /api/ai/chat | AI chat with Groq |
| GET /api/sentiment | Fear & Greed index |

## Recent Changes

1. **Hover tooltips fixed** - z-index increased, emerald underline added
2. **Download page** - Toggleable fields with live preview
3. **Usage display** - Shows "5 downloads/month" instead of "Unlimited"
4. **Navigation** - Download link added to all pages
5. **Dashboard fixed** - Changed Stripe API calls to Paddle
6. **Dependencies cleaned** - Removed unused Stripe/Razorpay packages
7. **Types updated** - Changed stripe_* fields to paddle_* in types
8. **Groq API key** - Configured in .env.local

## Common Issues & Solutions

### "Invalid API key" error
- Check `.env.local` has correct Supabase keys
- Ensure no extra whitespace in env values
- Use `.trim()` when reading env vars

### Tooltips not showing
- Check z-index is 100+
- Ensure parent doesn't have `overflow: hidden`

### Download not working
- Check Binance API is accessible
- Verify CORS settings

## Business Model

| Tier | Price | Downloads | Features |
|------|-------|-----------|----------|
| Free | $0 | 5/month | Basic data, 3 templates |
| Starter | $19/mo | 50/month | All data, 10 templates |
| Pro | $49/mo | Unlimited | AI analysis, all templates |
| Business | $99/mo | Unlimited | API access, custom templates |

## Contact

This project is being built for DataSimplify startup. The goal is to be a "Bloomberg alternative" for retail crypto investors at 1/100th the cost.
