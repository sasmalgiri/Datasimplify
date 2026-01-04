# 🚀 DataSimplify - Complete Crypto Data Platform

> Democratizing Financial Data for Everyone
> All-in-one crypto analytics at $19-49/mo (vs competitors at $100-1,299/mo)

---

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [What's Included](#whats-included)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [Running the App](#running-the-app)
6. [Features](#features)
7. [Tech Stack](#tech-stack)
8. [Project Structure](#project-structure)

---

## ⚡ Quick Start

```bash
# 1. Extract the package
tar -xzvf datasimplify-complete.tar.gz
cd datasimplify

# 2. Install dependencies
npm install

# 3. Copy environment file
cp .env.example .env.local

# 4. Start development server
npm run dev

# 5. Open http://localhost:3000
```

---

## 📦 What's Included

### Core Platform
- ✅ Next.js 14 + TypeScript
- ✅ Supabase Auth (email/password, social login)
- ✅ Paddle Payment Integration
- ✅ User Dashboard with Download Tracking
- ✅ RAG AI System (Ollama-based, FREE)

### Feature Components (15 Total)
| Component | Description |
|-----------|-------------|
| `CryptoAIChat` | Crypto-only AI assistant |
| `CryptoAIChatReal` | AI chat connected to RAG |
| `Treemap` | Visual market cap map |
| `FearGreedIndex` | Sentiment gauge |
| `CorrelationHeatmap` | Asset correlation matrix |
| `RiskDashboard` | Portfolio risk analytics |
| `WhaleTracker` | Whale activity + wallet distribution |
| `ETFTracker` | Bitcoin ETF flows |
| `StrategyBacktester` | Test trading strategies |
| `SocialSentiment` | Twitter/Reddit analysis |
| `DeFiTracker` | TVL + DeFi yields |
| `TokenScreener` | Filter tokens by criteria |
| `TechnicalAnalysis` | RSI, MACD, etc. |
| `OnChainMetrics` | MVRV, SOPR, etc. |
| `PriceAlerts` | Custom price alerts |

### Pages (17 Total)
```
/               → Home/Dashboard
/chat           → AI Assistant
/learn          → Crypto Academy (4 courses)
/glossary       → 50+ terms explained
/portfolio      → Portfolio Builder
/tools          → All tools hub
/backtest       → Strategy tester
/etf            → ETF tracker
/risk           → Risk analysis
/sentiment      → Fear & Greed
/whales         → Whale tracker
/correlation    → Correlation matrix
/social         → Social sentiment
/defi           → DeFi dashboard
/screener       → Token screener
/technical      → Technical analysis
/onchain        → On-chain metrics
/alerts         → Price alerts
/download       → Data downloads
/pricing        → Pricing page
/dashboard      → User dashboard
```

---

## 🔧 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Ollama (for AI features, optional)
- Supabase account (for database, optional)

### Step 1: Extract & Install

```bash
# Extract package
tar -xzvf datasimplify-complete.tar.gz
cd datasimplify

# Install dependencies
npm install
```

### Step 2: Environment Setup

```bash
# Copy example env file
cp .env.example .env.local
```

Edit `.env.local` with your values (see Configuration section below).

### Step 3: Start Development Server

```bash
npm run dev
# Open http://localhost:3000
```

---

## ⚙️ Configuration

### Minimal Setup (Works Immediately)
Just run `npm run dev` - the app fetches real data from free public APIs where available. If a source is rate-limited/unavailable, affected UI fields will show “Unavailable” (no mock values).

### Full Setup (All Features)

Edit `.env.local`:

```env
# ============================================
# REQUIRED FOR BASIC FUNCTIONALITY
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000

# ============================================
# SUPABASE (Required for Auth & Database)
# Get these from: https://supabase.com/dashboard
# ============================================
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# ============================================
# PADDLE PAYMENTS (Required for Subscriptions)
# ============================================
# Frontend
NEXT_PUBLIC_PADDLE_VENDOR_ID=12345
NEXT_PUBLIC_PADDLE_SANDBOX=true

# Server
PADDLE_SANDBOX=true
PADDLE_WEBHOOK_SECRET=pdl_ntfset_xxxxxxxx

# Paddle Price IDs (from Paddle dashboard)
PADDLE_STARTER_PRICE_ID=pri_xxxxx
PADDLE_PRO_PRICE_ID=pri_xxxxx
PADDLE_BUSINESS_PRICE_ID=pri_xxxxx

# ============================================
# OLLAMA AI (Required for AI Chat)
# Install: curl -fsSL https://ollama.com/install.sh | sh
# ============================================
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_EMBEDDING_MODEL=nomic-embed-text
OLLAMA_CHAT_MODEL=llama3.2

# ============================================
# CRYPTO APIS (Optional - has free tiers)
# ============================================
COINGECKO_API_KEY=your-api-key
COINMARKETCAP_API_KEY=your-api-key

# ============================================
# FEATURE FLAGS (Commercial-safe defaults)
# ============================================
# App mode defaults to "full" if unset.
NEXT_PUBLIC_APP_MODE=full

# Data providers / domains (OFF unless you explicitly enable)
NEXT_PUBLIC_FEATURE_COINGECKO=false
NEXT_PUBLIC_FEATURE_DEFI=false
NEXT_PUBLIC_FEATURE_WHALES=false
NEXT_PUBLIC_FEATURE_NFT=false
NEXT_PUBLIC_FEATURE_SOCIAL_SENTIMENT=false

# Macro & on-chain risk surfaces (OFF by default)
NEXT_PUBLIC_FEATURE_MACRO=false
NEXT_PUBLIC_FEATURE_MACRO_YAHOO=false
NEXT_PUBLIC_FEATURE_PUBLIC_RPC=false

# Optional: if you want to explicitly disable predictions UI in "full" mode
NEXT_PUBLIC_FEATURE_PREDICTIONS=false
```

---

## ▲ Vercel-safe production env (recommended defaults)

These defaults are designed to be “fail-closed” on Vercel: anything with higher ToS/licensing/redistribution risk stays OFF unless you explicitly enable it.

Paste these into **Vercel → Project → Settings → Environment Variables** (Production):

```env
# Site
NEXT_PUBLIC_APP_URL=https://YOUR_DOMAIN

# Supabase (recommended for auth + caching)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY

# Background jobs / protected endpoints
CLEANUP_SECRET=CHANGE_ME_TO_A_RANDOM_32+_CHAR_STRING
CLEANUP_ALLOW_VERCEL_CRON=true

# Optional: protect /api/sync and AI-data ingestion endpoints
SYNC_SECRET_KEY=CHANGE_ME_TO_A_RANDOM_32+_CHAR_STRING

# Feature flags (commercial-safe defaults)
NEXT_PUBLIC_APP_MODE=full

# Risky providers/domains OFF by default
NEXT_PUBLIC_FEATURE_COINGECKO=false
NEXT_PUBLIC_FEATURE_SOCIAL_SENTIMENT=false
NEXT_PUBLIC_FEATURE_DEFI=false
NEXT_PUBLIC_FEATURE_WHALES=false
NEXT_PUBLIC_FEATURE_NFT=false

# Macro & public RPC OFF by default
NEXT_PUBLIC_FEATURE_MACRO=false
NEXT_PUBLIC_FEATURE_MACRO_YAHOO=false
NEXT_PUBLIC_FEATURE_PUBLIC_RPC=false

# Keep predictions OFF unless macro is enabled
NEXT_PUBLIC_FEATURE_PREDICTIONS=false

# Monetization (set true only if you configure Paddle)
NEXT_PUBLIC_FEATURE_PRICING=false
NEXT_PUBLIC_FEATURE_PAYMENTS=false

# AI (recommended on Vercel: Groq or OpenAI; leave Ollama unset)
# GROQ_API_KEY=YOUR_GROQ_KEY
# GROQ_MODEL=llama-3.3-70b-versatile
# OPENAI_API_KEY=YOUR_OPENAI_KEY
# OPENAI_MODEL=gpt-4o-mini
ENABLE_AI_SUMMARIES=false
ENABLE_SENTIMENT_SIGNALS=false
ENABLE_SMART_MONEY=false
ENABLE_USER_ADAPTATION=false
```

---

## 🗄️ Database Setup (Supabase)

### Option 1: Quick Setup
1. Create project at [supabase.com](https://supabase.com)
2. Go to SQL Editor
3. Run the contents of `supabase/complete-schema.sql`

### Option 2: Using Supabase CLI
```bash
# Install CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref your-project-ref

# Push schema
supabase db push
```

### Key Tables Created:
- `profiles` - User profiles
- `subscriptions` - Paddle subscriptions
- `downloads` - Download tracking
- `document_chunks` - RAG vector storage
- `data_categories` - Data organization

---

## 🤖 AI Setup (Ollama)

### Install Ollama
```bash
# Linux/Mac
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download
```

### Pull Required Models
```bash
# Embedding model (for RAG)
ollama pull nomic-embed-text

# Chat model
ollama pull llama3.2
```

### Start Ollama Server
```bash
ollama serve
# Runs on http://localhost:11434
```

### Verify It's Working
```bash
curl http://localhost:11434/api/tags
# Should return list of models
```

---

## 🚀 Running the App

### Development
```bash
# Terminal 1 (if using AI)
ollama serve

# Terminal 2
npm run dev
```

### Production
```bash
npm run build
npm start
```

### Docker (Coming Soon)
```bash
docker-compose up
```

---

## 🎯 Features Overview

### Beginner-Friendly Design
- 🔰 Three user levels: Beginner, Intermediate, Pro
- 💡 Tooltips and explanations everywhere
- 🚦 Traffic light system (🟢 Good, 🟡 Watch, 🔴 Risk)
- 📚 Crypto Academy with 4 courses, 20 lessons
- 📖 Glossary with 50+ terms explained simply

### AI Assistant Features
- 🤖 **Crypto-only** - Refuses non-crypto questions
- 📊 Real-time market data access
- 📰 Latest crypto news analysis
- 🐋 Whale activity tracking
- 🏦 DeFi metrics and yields
- ⚠️ Built-in investment disclaimers

### Analytics Tools
| Tool | Description |
|------|-------------|
| Market Map | Treemap visualization of market caps |
| Fear & Greed | Market sentiment gauge with history |
| Correlation | Asset correlation heatmap |
| Risk Analysis | VaR, Sharpe Ratio, Sortino, Max Drawdown |
| Whale Tracker | Large transactions, wallet distribution |
| ETF Flows | Bitcoin ETF inflows/outflows |
| Technical | 12 indicators (RSI, MACD, Bollinger, etc.) |
| On-Chain | 16 metrics (MVRV, SOPR, HODL Waves, etc.) |
| DeFi TVL | Protocol rankings, yields, chains |
| Screener | Filter tokens by multiple criteria |
| Backtester | Test 5 preset strategies |
| Alerts | 6 alert types, multi-notification |

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui + Custom |
| Database | Supabase (PostgreSQL) |
| Vector DB | pgvector extension |
| Auth | Supabase Auth |
| Payments | Paddle (MoR) |
| AI/LLM | Ollama (local) |
| Embeddings | nomic-embed-text |
| Chat Model | llama3.2 |

---

## 📁 Project Structure

```
datasimplify/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── ai/            # AI/RAG endpoints
│   │   │   ├── auth/          # Auth endpoints
│   │   │   ├── crypto/        # Crypto data
│   │   │   └── webhooks/      # Paddle webhooks
│   │   ├── [pages]/           # All page routes
│   │   └── layout.tsx         # Root layout
│   │
│   ├── components/
│   │   ├── features/          # 15 feature components
│   │   ├── ui/                # UI helpers
│   │   └── NavbarNew.tsx      # Navigation
│   │
│   ├── lib/                   # Utilities
│   │   ├── supabase.ts        # Database client
│   │   ├── ollamaAI.ts        # AI integration
│   │   ├── ragService.ts      # RAG system
│   │   └── paddle.ts          # Payment utils
│   │
│   └── types/                 # TypeScript types
│
├── supabase/                  # Database schemas
├── public/                    # Static assets
├── scripts/                   # Setup scripts
├── .env.example               # Env template
├── package.json               # Dependencies
└── README.md                  # This file
```

---

## 💰 Pricing Tiers

| Tier | Price | Key Features |
|------|-------|--------------|
| **Free** | $0 | 5 downloads/mo, Learning Center, Basic data |
| **Starter** | $19/mo | 50 downloads, ETF, Technical, Screener |
| **Pro** | $49/mo | Unlimited, Risk, Whales, Social, AI |
| **Business** | $99/mo | Alerts, API, Portfolio, Priority support |
| **Enterprise** | $249/mo | White-label, Custom, Dedicated support |

---

## 🐛 Troubleshooting

### "Ollama not running"
```bash
# Start Ollama
ollama serve

# Check if running
curl http://localhost:11434/api/tags
```

### "Supabase not configured"
- Check your `.env.local` has correct Supabase URLs
- Verify project is not paused in Supabase dashboard

### "Module not found"
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Port 3000 in use
```bash
# Use different port
npm run dev -- -p 3001
```

---

## 📞 Support

- 📖 Docs: See this README
- 🐛 Issues: GitHub Issues
- 📧 Email: support@datasimplify.com

---

## 📜 License

MIT License - Free for personal and commercial use

---

**Built with ❤️ for crypto beginners who want professional tools!**

🚀 **Happy Trading!**
