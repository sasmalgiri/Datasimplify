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
- ✅ Free crypto data APIs (CoinGecko, DeFiLlama)
- ⚠️ AI features need Ollama (optional)

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

If Supabase isn't connecting, confirm your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`.
