# CRK Excel Add-in Setup Guide

This document explains how to set up and deploy the CryptoReportKit Excel Add-in with BYOK (Bring Your Own Key) architecture.

## Architecture Overview

```
User's Excel → CRK Server → User's Encrypted API Keys → Data Providers
              ↓
         AES-256-GCM
         (decrypt in memory only)
```

## Prerequisites

1. **Excel Desktop**: Excel 2016 or later (Windows or Mac)
2. **Supabase Account**: For user authentication and key storage
3. **Encryption Key**: AES-256 master key for encrypting API keys

## Production Setup

### 1. Generate Encryption Master Key

```bash
# Generate a 256-bit (32-byte) key
openssl rand -hex 32
```

### 2. Set Environment Variable

Add to your Vercel environment variables (or `.env` file):

```bash
ENCRYPTION_MASTER_KEY=<your_generated_key_here>
```

**CRITICAL**: Never commit this key to version control. Store it securely in your production environment.

### 3. Create Icon Assets

Open this URL in your browser to generate icons:
```
https://cryptoreportkit.com/addin/icon-generator.html
```

Download all 4 icons and save them to `public/addin/`:
- `icon-16.png` (16x16)
- `icon-32.png` (32x32)
- `icon-64.png` (64x64)
- `icon-80.png` (80x80)

Or use any image editor to create emerald-green square icons with "CRK" text.

### 4. Deploy to Production

```bash
npm run build
git add .
git commit -m "Add Excel add-in with BYOK support"
git push origin main
```

Vercel will automatically deploy. Verify these URLs work:
- `https://cryptoreportkit.com/addin/manifest.xml`
- `https://cryptoreportkit.com/addin/taskpane`
- `https://cryptoreportkit.com/addin/functions.js`
- `https://cryptoreportkit.com/addin/functions.json`

## Testing the Add-in

### Method 1: Sideload via Upload (Easiest)

1. Open Excel Desktop
2. Create a new blank workbook
3. Go to **Insert → Office Add-ins → My Add-ins**
4. Click **Manage My Add-ins** dropdown → **Upload My Add-in**
5. Browse and select the manifest file
6. Click **Upload**

### Method 2: Sideload via URL (Alternative)

1. Open Excel Desktop
2. Go to **Insert → Office Add-ins → My Add-ins**
3. Click **Manage My Add-ins** dropdown
4. Enter URL: `https://cryptoreportkit.com/addin/manifest.xml`

### Method 3: Shared Folder (For Development)

Follow Microsoft's guide: https://learn.microsoft.com/en-us/office/dev/add-ins/testing/create-a-network-shared-folder-catalog-for-task-pane-and-content-add-ins

## Using the Add-in

### 1. Open CRK Panel

After installation, you'll see a **CRK Panel** button in the Excel ribbon (Home tab). Click it to open the taskpane.

### 2. Sign In

Click **Sign In** in the taskpane. A secure dialog will open for authentication.

### 3. Connect API Keys (Optional)

In the taskpane, connect your data provider API keys:
- **CoinGecko**: Get free demo key at https://www.coingecko.com/en/api
- **CoinMarketCap**: Free plan at https://coinmarketcap.com/api
- **Binance**: For advanced users
- **Messari**: Enterprise data

**Security**: Keys are encrypted with AES-256-GCM before storage. They're only decrypted in memory on the server to make requests.

### 4. Use CRK Functions

Type these formulas in any cell:

```excel
=CRK.PRICE("bitcoin")              → Current price
=CRK.PRICE("ethereum", "eur")      → Price in EUR
=CRK.CHANGE24H("bitcoin")          → 24h change %
=CRK.MARKETCAP("solana")           → Market cap
=CRK.VOLUME("cardano")             → 24h volume
=CRK.OHLCV("bitcoin", 30)          → 30-day OHLCV (spills)
=CRK.INFO("bitcoin", "rank")       → Coin rank
=CRK.INFO("ethereum", "symbol")    → Coin symbol
```

### 5. Refresh Data

Click **Refresh All Data** in the CRK Panel to update all formulas with the latest data.

## API Endpoints

The add-in uses these authenticated endpoints:

| Endpoint | Purpose |
|----------|---------|
| `/api/v1/keys/:provider` | Manage encrypted API keys |
| `/api/v1/price` | Get coin prices |
| `/api/v1/ohlcv` | Get historical OHLCV data |
| `/api/v1/report/run` | Run pack recipes (pre-built workbooks) |
| `/api/v1/me/plan` | Check user entitlements |

## Architecture Details

### File Structure

```
public/addin/
├── manifest.xml          # Add-in manifest (Office configuration)
├── functions.js          # Custom function implementations
├── functions.json        # Function metadata
├── functions.html        # Function runtime page
├── taskpane.html         # Fallback taskpane HTML
└── icon-*.png            # Add-in icons (4 sizes)

src/app/addin/
├── taskpane/page.tsx     # Main taskpane UI (React)
└── setup/page.tsx        # Setup documentation

src/app/api/v1/
├── keys/[provider]/      # API key management
├── price/                # Price data proxy
├── ohlcv/                # OHLCV data proxy
└── report/run/           # Pack runner

src/lib/
└── encryption.ts         # AES-256-GCM encryption utilities
```

### Security Model

1. **User signs in** via Office Dialog API → Supabase auth
2. **API key encrypted** with AES-256-GCM → stored in `provider_keys` table
3. **CRK function called** → auth token sent to server
4. **Server decrypts key** in memory (never logged)
5. **Server proxies request** to data provider using user's key
6. **Data returned** to Excel → key destroyed from memory

### Database Schema

```sql
-- Provider API keys (encrypted)
CREATE TABLE provider_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL, -- 'coingecko', 'binance', 'coinmarketcap', 'messari'
  encrypted_key TEXT NOT NULL, -- AES-256-GCM encrypted
  key_hint TEXT NOT NULL, -- Last 4 characters for display
  is_valid BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);

-- Usage tracking
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'api_price', 'api_ohlcv', 'provider_key_connected', etc.
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Troubleshooting

### Functions show #NAME? error
- Functions take a few seconds to register after installation
- Try closing and reopening the workbook
- Make sure you're using Excel Desktop (not Online)

### Authentication fails
- Clear browser cookies and try again
- Make sure pop-ups are not blocked
- Check that Supabase auth is configured correctly

### Rate limits exceeded
- Connect your own API key in the taskpane
- Free CoinGecko accounts have higher limits than anonymous requests

### "Not logged in" error
- Open the CRK Panel and sign in
- Token may have expired - sign out and sign in again

## AppSource Submission (Optional)

To publish on Microsoft AppSource:

1. Create Partner Center account
2. Prepare store listings (screenshots, descriptions)
3. Submit manifest and assets for review
4. Microsoft reviews (typically 1-2 weeks)
5. Add-in becomes publicly available

**Note**: Sideloading works immediately without AppSource submission.

## Support

- Email: support@cryptoreportkit.com
- Setup Guide: https://cryptoreportkit.com/addin/setup
- Documentation: https://cryptoreportkit.com/docs (coming soon)

## License

All rights reserved. CryptoReportKit © 2026
