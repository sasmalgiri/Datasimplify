# CryptoReportKit Product Roadmap
## Vision: "One-Stop Crypto Analytics Download Platform"

**Last Updated:** January 23, 2026
**Status:** Foundation → Production SaaS

---

## Core Philosophy

**Primary Model:** CRK + BYOK (Bring Your Own Key)
**Fallback Only:** CryptoSheets (for niche datasets not available via BYOK)
**Value Prop:** "Bloomberg for Crypto at 1/100th the price with Excel integration"

---

## Phase 0: Operating Rules (LOCKED)

### 0.1 Source & Rights Matrix ✅ MANDATORY
**Status:** 🔴 TODO
**Blocker:** Cannot add features without this

**Deliverable:** `/admin/sources` page + `SOURCES_MATRIX.md`

| Dataset | Provider | Mode | Caching | Attribution | Outputs | Plan Gate |
|---------|----------|------|---------|-------------|---------|-----------|
| Spot Prices | Binance/CoinGecko | BYOK/Public | 60s | No | All | Free |
| OHLCV 1h+ | Binance/CoinGecko | BYOK | 60s | No | All | Free |
| OHLCV <1h | Binance | BYOK | 30s | No | All | Pro |
| Technical Indicators | Computed | Local | None | No | All | Free |
| Fear & Greed | Alternative.me | Public | 5min | Yes | Display only | Free |
| DeFi TVL | DeFiLlama | Public | 5min | Yes | Display only | Free |
| Funding Rates | Binance | BYOK | 5min | No | All | Pro |
| Whale Tracking | Etherscan/Blockchair | BYOK | 5min | No | All | Pro |
| News Headlines | CryptoPanic | Public | 15min | Yes | Display only | Free |
| Reddit Sentiment | Reddit API | BYOK | 30min | No | All | Pro |

**Rules:**
- Every new dataset MUST have a row before implementation
- "Public" mode = read-only display, no exports without attribution
- "BYOK" mode = full access with user's key
- "CryptoSheets Fallback" = label clearly as third-party

### 0.2 Public Pages Policy ✅ LOCKED
**Decision:** Public pages show demo/cached data. Live data requires BYOK login.

**Implementation:**
- `/market`, `/charts`, `/sentiment` → Show cached data (5-15min old)
- Banner: "Live data available with free account + API keys"
- No "scraping" or unauthorized redistribution

---

## Phase 1: Product UX Completion

### 1.1 Download Center v2
**Status:** 🟡 IN PROGRESS (exists as `/templates`, needs enhancement)
**Priority:** 🔴 HIGH
**Timeline:** Week 1-2

**Current State:**
- ✅ Template catalog exists at `/templates`
- ✅ 6 report kits defined
- ⚠️ No filters
- ⚠️ No mode labels (BYOK vs CryptoSheets)
- ⚠️ No preview functionality

**Deliverables:**
1. **Enhanced `/templates` page:**
   - Filters: Category, Refresh Engine, Difficulty
   - Each card shows:
     - What's inside (KPIs, charts, tables)
     - Required providers/keys
     - Refresh interval
     - Mode badge: "CRK BYOK" or "CryptoSheets"
   - "Preview" and "Download Pack" buttons

2. **Preview Modal:**
   - Shows sample data from recipe
   - Lists required API keys
   - Shows refresh cadence
   - Links to setup guide

**Acceptance Tests:**
- [ ] Every template has a preview
- [ ] Every template declares mode + required keys
- [ ] No broken "coming soon" downloads
- [ ] Filters work correctly

### 1.2 Report Builder
**Status:** 🔴 TODO
**Priority:** 🔴 HIGH
**Timeline:** Week 3-4

**Current State:**
- ✅ Basic `/builder` page exists
- ⚠️ No live preview
- ⚠️ No recipe saving
- ⚠️ No Excel pack generation from UI

**Deliverables:**
1. **Create `/builder` interactive UI:**
   ```
   Step 1: Choose Template (6 packs)
   Step 2: Configure (assets, timeframe, providers)
   Step 3: Preview (live API call)
   Step 4: Save Recipe (to workspace)
   Step 5: Download Pack (Excel generation)
   ```

2. **Builder Features:**
   - Asset selection (up to 50 coins)
   - Timeframe picker (1d, 7d, 30d, 90d)
   - Interval picker (1h, 4h, 1d, 1w)
   - Provider selection (Binance, CoinGecko, etc.)
   - Live preview using `/api/v1/report/run`
   - Save to workspace
   - Download Excel pack

**Acceptance Tests:**
- [ ] Preview output matches downloaded workbook after refresh
- [ ] Saved recipe regenerates same pack
- [ ] Recipe validation shows errors before download

---

## Phase 2: Canonical Recipe System

### 2.1 Recipe Schema v1
**Status:** 🔴 TODO
**Priority:** 🔴 CRITICAL (blocks everything)
**Timeline:** Week 1

**Deliverable:** `src/lib/recipes/schema.ts`

```typescript
interface RecipeV1 {
  id: string;
  name: string;
  category: 'market' | 'ta' | 'risk' | 'defi' | 'onchain' | 'derivatives' | 'sentiment' | 'macro' | 'portfolio';
  version: string; // "1.0.0"

  datasets: DatasetConfig[];
  charts: ChartConfig[];
  kpis: KPIConfig[];

  refreshPolicy: {
    minInterval: number; // seconds
    planLimits: {
      free: number;  // refreshes per day
      pro: number;
      premium: number;
    };
  };

  metadata: {
    author: string;
    created: string;
    updated: string;
    description: string;
    difficulty: 'beginner' | 'analyst' | 'pro';
    tags: string[];
  };
}

interface DatasetConfig {
  id: string;
  type: 'price' | 'ohlcv' | 'ta' | 'defi_tvl' | 'funding' | 'news' | 'sentiment' | 'risk';
  provider: 'coingecko' | 'binance' | 'defillama' | 'alternative' | 'etherscan' | 'reddit';
  params: {
    symbols?: string[];
    interval?: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
    lookback?: number;
    currency?: string;
    indicators?: string[];
  };
  tableName: string; // Excel table name
  mode: 'byok' | 'public' | 'computed';
}

interface ChartConfig {
  id: string;
  type: 'candlestick' | 'line' | 'bar' | 'area' | 'heatmap' | 'pie';
  sourceTable: string;
  columns: {
    x: string;
    y: string | string[];
    series?: string;
  };
  title: string;
}

interface KPIConfig {
  id: string;
  name: string;
  formula: string; // Excel formula or computed
  format: 'number' | 'currency' | 'percent';
  cell: string; // Excel cell reference
}
```

**Database Schema:**
```sql
CREATE TABLE recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  recipe_json JSONB NOT NULL, -- RecipeV1
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_recipes_user ON recipes(user_id);
CREATE INDEX idx_recipes_category ON recipes(category);
```

**Acceptance Tests:**
- [ ] Recipe validates against schema
- [ ] Recipe stores/retrieves from database
- [ ] Recipe embeds in Excel __CRK__ sheet
- [ ] Recipe produces deterministic table schema

### 2.2 Execution Engine
**Status:** 🟡 IN PROGRESS
**Priority:** 🔴 CRITICAL
**Timeline:** Week 2

**Current State:**
- ✅ `/api/v1/report/run` exists
- ⚠️ Limited dataset support
- ⚠️ No recipe validation
- ⚠️ No plan limit enforcement

**Enhancements Needed:**
1. **Recipe Validation:**
   - Check dataset modes against user plan
   - Verify required API keys are connected
   - Validate parameters (symbols, intervals)
   - Return actionable errors

2. **Dataset Fetching:**
   - Route through connector layer
   - Handle BYOK key decryption
   - Apply rate limiting per user
   - Cache where appropriate
   - Handle partial failures gracefully

3. **Data Normalization:**
   - Convert all sources to standard table format
   - Apply schema validation
   - Compute derived metrics
   - Format for Excel consumption

4. **Response Format:**
   ```typescript
   interface ReportRunResponse {
     success: boolean;
     tables: Record<string, TableData>;
     charts: ChartData[];
     kpis: Record<string, any>;
     meta: {
       generated: string;
       cached: boolean;
       errors: DatasetError[];
     };
   }
   ```

**Acceptance Tests:**
- [ ] Same recipe produces deterministic output
- [ ] Recipe validation blocks forbidden modes
- [ ] Partial dataset failures don't break entire report
- [ ] Plan limits enforced correctly

---

## Phase 3: Excel Pack System

### 3.1 Workbook Standard ("Pack Spec")
**Status:** 🟡 PARTIAL
**Priority:** 🔴 HIGH
**Timeline:** Week 3

**Current State:**
- ✅ Pack generation exists in `src/lib/templates/generator.ts`
- ⚠️ Inconsistent structure across packs
- ⚠️ Missing __CRK__ sheet in some
- ⚠️ No standard table naming

**Pack Spec Requirements:**

**Visible Sheets:**
1. **Overview** - KPIs, summary charts, last refresh timestamp
2. **Data** - Raw data tables
3. **Charts** - Visualizations
4. **[Category]** - Optional category-specific sheets

**Hidden Sheet: __CRK__**
- Cell B1: Recipe JSON
- Cell B2: Last refresh timestamp
- Cell B3: Last refresh status
- Cell B4: Provider mapping
- Cell B5: Error log

**Excel Tables:**
- Naming: `tbl_[category]_[type]` (e.g., `tbl_market_prices`, `tbl_ta_rsi`)
- Headers: First row
- Structured references enabled

**UI Elements:**
- "Refresh Pack" button → calls add-in refresh
- "View Status" button → shows __CRK__ sheet
- "Help" button → opens /addin/setup

**Template:**
```typescript
// src/lib/excel/pack-template.ts
export interface PackTemplate {
  sheets: SheetDefinition[];
  tables: TableDefinition[];
  charts: ChartDefinition[];
  kpis: KPIDefinition[];
  buttons: ButtonDefinition[];
}
```

**Acceptance Tests:**
- [ ] All packs follow standard structure
- [ ] __CRK__ sheet present and valid
- [ ] Table names consistent
- [ ] Refresh button works
- [ ] Help links work

### 3.2 Refresh Pipeline
**Status:** 🟡 PARTIAL
**Priority:** 🔴 HIGH
**Timeline:** Week 3-4

**Current State:**
- ✅ Add-in refresh exists for pack mode
- ⚠️ No partial failure handling
- ⚠️ Limited error messages
- ⚠️ No retry logic

**Enhancements:**

**Add-in Refresh Flow:**
```
1. Read __CRK__ recipe from B1
2. Validate recipe schema
3. Check user auth + plan
4. Call /api/v1/report/run
5. Handle response:
   - Success: Write tables
   - Partial: Write successful tables, log errors
   - Failure: Show error dialog
6. Update timestamps in __CRK__
7. Refresh charts
8. Show completion toast
```

**Error Handling:**
```typescript
interface RefreshError {
  dataset: string;
  provider: string;
  error: 'invalid_key' | 'rate_limited' | 'provider_down' | 'network_error';
  message: string;
  recoverable: boolean;
}
```

**UI States:**
- Loading: Show progress bar
- Success: Green checkmark + timestamp
- Partial: Yellow warning + error list
- Failure: Red X + actionable message

**Acceptance Tests:**
- [ ] Large packs refresh without timeout
- [ ] Partial failures don't block other datasets
- [ ] Error messages are actionable
- [ ] Retry logic works for transient failures
- [ ] Rate limits show clear guidance

### 3.3 Formula Mode (Secondary)
**Status:** ✅ COMPLETE
**Priority:** 🟢 MAINTAIN

**Current State:**
- ✅ 6 CRK functions implemented
- ✅ Functions work independently

**Strategy:**
- Keep existing functions
- Label as "Advanced Mode" in UI
- Pack Mode is default/recommended
- No new formula development (focus on packs)

---

## Phase 4: Add-in Productization

### 4.1 Onboarding Flow
**Status:** 🟡 PARTIAL
**Priority:** 🔴 HIGH
**Timeline:** Week 4

**Current Onboarding:**
1. Install add-in
2. Click CRK Panel
3. Sign in
4. Connect keys (optional)
5. Use functions or open pack

**Enhanced Onboarding:**

**First Launch Wizard:**
```
Step 1: Welcome
- "Welcome to CRK Excel Add-in"
- "Get live crypto data with your own API keys"
- [Continue]

Step 2: Sign In
- "Sign in or create free account"
- [Sign In Button]
- "Don't have an account? Sign up"

Step 3: Connect Keys (Optional)
- "Connect your API keys for live data"
- Provider cards: CoinGecko, Binance, CMC
- [Skip] or [Connect Key]

Step 4: Test Connection
- If key connected: "Testing your CoinGecko key..."
- Success: ✅ "Connected successfully"
- [Continue]

Step 5: Get Started
- "You're ready!"
- [Download Your First Pack]
- [View Function Reference]
- [Close]
```

**Implementation:**
```typescript
// src/app/addin/taskpane/page.tsx
const [onboardingStep, setOnboardingStep] = useState<number>(0);
const [onboardingComplete, setOnboardingComplete] = useState(false);

useEffect(() => {
  // Check if user has completed onboarding
  const completed = localStorage.getItem('crk_onboarding_complete');
  setOnboardingComplete(completed === 'true');
}, []);
```

**Acceptance Tests:**
- [ ] First-time users see wizard
- [ ] Wizard can be skipped
- [ ] Wizard doesn't show again after completion
- [ ] Key validation works in wizard
- [ ] Links to download packs work

### 4.2 Key Management UX
**Status:** 🟡 PARTIAL
**Priority:** 🟡 MEDIUM
**Timeline:** Week 5

**Current State:**
- ✅ Key add/remove works
- ⚠️ No key testing
- ⚠️ No usage stats
- ⚠️ No security tips

**Enhancements:**

**Provider Key Card:**
```
┌─────────────────────────────────────┐
│ 🔑 CoinGecko API Key                │
│                                     │
│ Status: ✅ Connected                │
│ Key: ****a1b2                       │
│ Added: Jan 15, 2026                 │
│                                     │
│ Usage Today: 234 / 10,000 calls    │
│ Rate Limit: OK                      │
│                                     │
│ [Test Key] [Remove]                 │
└─────────────────────────────────────┘
```

**Features:**
1. **Test Key Button:**
   - Makes test API call
   - Shows success/error
   - Displays rate limit info

2. **Usage Stats:**
   - Calls today
   - Remaining quota
   - Next reset time

3. **Security Info:**
   - "Your keys are encrypted with AES-256-GCM"
   - "Keys are decrypted only in memory"
   - "Never logged or stored in plaintext"
   - [Learn More]

**Acceptance Tests:**
- [ ] Test key shows accurate results
- [ ] Usage stats update after refresh
- [ ] Security explanation is clear
- [ ] Remove key requires confirmation

### 4.3 Telemetry & Audit
**Status:** 🔴 TODO
**Priority:** 🔴 HIGH (for debugging)
**Timeline:** Week 5

**Events to Log:**
```typescript
interface TelemetryEvent {
  event_type:
    | 'addin_installed'
    | 'addin_opened'
    | 'pack_refreshed'
    | 'pack_refresh_failed'
    | 'key_connected'
    | 'key_removed'
    | 'function_called'
    | 'error_occurred';

  user_id: string;
  session_id: string;
  timestamp: string;

  metadata: {
    pack_id?: string;
    function_name?: string;
    provider?: string;
    error_code?: string;
    error_message?: string;
    duration_ms?: number;
  };
}
```

**Implementation:**
```typescript
// src/lib/telemetry.ts
export async function trackEvent(event: TelemetryEvent) {
  await supabase.from('telemetry_events').insert(event);
}
```

**Dashboard: `/admin/telemetry`**
- Refresh success rate
- Most common errors
- Provider failure rates
- Popular packs
- Key connection rate

**Acceptance Tests:**
- [ ] All critical events logged
- [ ] No PII in logs (hashed user IDs only)
- [ ] Admin dashboard shows real-time stats
- [ ] Error rates trigger alerts

---

## Phase 5: Data Connectors

### 5.1 Connector Interface
**Status:** 🔴 TODO
**Priority:** 🔴 CRITICAL
**Timeline:** Week 6

**Unified Connector Interface:**
```typescript
// src/lib/connectors/interface.ts
export interface DataConnector {
  provider: string;

  // Fetch data with user's key
  fetch(
    datasetType: string,
    params: Record<string, any>,
    userKeyRef?: string
  ): Promise<ConnectorResponse>;

  // Validate API key
  validateKey(apiKey: string): Promise<ValidationResult>;

  // Get rate limit info
  getRateLimits(userKeyRef?: string): Promise<RateLimitInfo>;

  // Get attribution requirements
  getAttribution(): AttributionInfo;
}

export interface ConnectorResponse {
  success: boolean;
  data: any[];
  schema: ColumnDefinition[];
  meta: {
    provider: string;
    cached: boolean;
    timestamp: string;
    rateLimitRemaining?: number;
  };
  errors?: ConnectorError[];
}
```

**Implementation:**
```typescript
// src/lib/connectors/coingecko.ts
export class CoinGeckoConnector implements DataConnector {
  async fetch(type, params, userKeyRef) {
    // 1. Get user's key if provided
    const apiKey = userKeyRef ? await this.decryptKey(userKeyRef) : null;

    // 2. Build request
    const url = this.buildUrl(type, params);
    const headers = this.buildHeaders(apiKey);

    // 3. Check rate limit
    await this.checkRateLimit(userKeyRef);

    // 4. Make request with retry
    const response = await this.fetchWithRetry(url, headers);

    // 5. Normalize schema
    const normalized = this.normalize(type, response);

    // 6. Return with metadata
    return {
      success: true,
      data: normalized.data,
      schema: normalized.schema,
      meta: {
        provider: 'coingecko',
        cached: false,
        timestamp: new Date().toISOString(),
      }
    };
  }
}
```

**Acceptance Tests:**
- [ ] All connectors implement interface
- [ ] Rate limiting enforced per user
- [ ] Retry logic handles transient failures
- [ ] Schema normalization consistent
- [ ] Attribution metadata included

### 5.2 Coverage Tiers
**Status:** 🟡 PARTIAL
**Priority:** 🟡 MEDIUM

**Tier A (Easy, High Demand)** ✅ COMPLETE
- Prices, market cap, volume
- OHLCV (1h+)
- TA indicators (computed)
- DeFi TVL
- Risk metrics

**Tier B (BYOK Required)** 🟡 PARTIAL
- ✅ Funding rates (Binance)
- ✅ Open interest (Binance)
- ⚠️ Exchange flows (needs key)
- ⚠️ Whale tracking (needs Etherscan key)
- ⚠️ Reddit sentiment (needs Reddit API key)

**Tier C (Fallback or Coming Soon)** 🔴 TODO
- 4chan sentiment → "Coming soon"
- Smart money tracking → Requires Nansen/paid provider
- Wallet profitability → Requires Nansen

**Rule:** Anything Tier C becomes:
1. BYOK with specific provider, or
2. CryptoSheets fallback (labeled), or
3. "Coming soon" with download disabled

---

## Phase 6: "Popular Charts" Coverage

### 6.1 Must-Have Charts
**Status:** 🟡 PARTIAL
**Priority:** 🟡 MEDIUM

**Implemented:** ✅
- Candlestick (OHLCV)
- Volume bars
- Moving averages overlays
- RSI/MACD panels
- Correlation heatmap
- Market cap pie
- TVL trend lines

**Missing:** ⚠️
- Funding/OI time series
- Sentiment timeline
- Bollinger Bands overlay

**Action:** Add missing chart types to `/charts` page

### 6.2 Optional Features
**Status:** 🔴 TODO
**Priority:** 🟢 LOW

- Drawing tools (trendline, horizontal line)
- Saved chart layouts
- Multiple timeframes on one screen

**Decision:** Defer to Phase 7 (post-launch enhancement)

---

## Phase 7: Scheduled Exports

### 7.1 Export Types
**Status:** 🟡 PARTIAL
**Priority:** 🟡 MEDIUM
**Timeline:** Week 7-8

**Current State:**
- ✅ Cron job exists (`/api/cron/export`)
- ✅ Schedule storage in DB
- ⚠️ No user UI for managing schedules
- ⚠️ No email delivery
- ⚠️ No download history

**Deliverables:**

**1. Schedule Manager: `/account/schedules`**
```
My Scheduled Reports
┌────────────────────────────────────────┐
│ Daily Market Overview                  │
│ Runs: Every day at 9:00 AM EST        │
│ Format: Excel (.xlsx)                  │
│ Delivery: Email + Storage              │
│ Last Run: Today at 9:03 AM (Success)  │
│                                        │
│ [View History] [Edit] [Pause] [Delete]│
└────────────────────────────────────────┘
```

**2. Export Formats:**
- ✅ Excel (.xlsx)
- 🔴 CSV (.csv)
- 🔴 PDF Summary

**3. Delivery Methods:**
- 🔴 Email (with attachment link)
- ✅ Supabase Storage (download link)
- 🔴 Webhook (JSON payload)

**4. Email Template:**
```
Subject: Your Daily Market Overview is Ready

Hi {user_name},

Your scheduled report "Daily Market Overview" has been generated.

📊 Download Report: [Download Link]
📅 Generated: Jan 23, 2026 at 9:03 AM EST
📈 Data Period: Last 24 hours
🔑 Providers Used: CoinGecko, Binance

[View All Scheduled Reports]

---
CryptoReportKit | Change Preferences | Unsubscribe
```

**Acceptance Tests:**
- [ ] Schedule creates and runs on time
- [ ] Email delivered with download link
- [ ] Download links expire after 30 days
- [ ] Failed runs show error + retry option
- [ ] Schedule can be paused/deleted

### 7.2 Export History
**Status:** 🔴 TODO
**Priority:** 🟡 MEDIUM

**Page: `/account/exports`**

Features:
- List of all exports (scheduled + manual)
- Download links (30-day expiry)
- Status (success/failed)
- Error logs for failures
- Re-run failed exports

---

## Phase 8: Alerts

### 8.1 Alert Types
**Status:** 🔴 TODO
**Priority:** 🟡 MEDIUM
**Timeline:** Week 9-10

**Supported Alerts:**
1. **Price Alerts:**
   - Price crosses level (above/below)
   - Price % change (24h)

2. **Indicator Alerts:**
   - RSI crosses threshold
   - MACD crossover
   - Bollinger Band breakout

3. **Market Alerts:**
   - Volatility spike
   - Volume surge
   - New highs/lows

4. **DeFi Alerts:**
   - TVL change % (protocol/chain)
   - Stablecoin depeg

5. **Funding Alerts:**
   - Funding rate extreme
   - OI spike

**Page: `/account/alerts`**

```
Create Alert
┌────────────────────────────────────────┐
│ Alert Type: [Price Alert ▼]           │
│                                        │
│ Coin: [Bitcoin (BTC)     ▼]           │
│                                        │
│ Condition: [Crosses above ▼]          │
│                                        │
│ Value: [$100,000        ]              │
│                                        │
│ Delivery: [✓] Email  [ ] Webhook      │
│                                        │
│ [Create Alert]                         │
└────────────────────────────────────────┘

Active Alerts (3)
┌────────────────────────────────────────┐
│ BTC > $100,000                         │
│ Created: Jan 15, 2026                  │
│ Status: Active                         │
│ [Edit] [Pause] [Delete]                │
└────────────────────────────────────────┘
```

**Alert Execution:**
```typescript
// src/lib/alerts/checker.ts
export async function checkAlerts() {
  const alerts = await getActiveAlerts();

  for (const alert of alerts) {
    const triggered = await evaluateAlert(alert);

    if (triggered) {
      await deliverAlert(alert);
      await updateAlertStatus(alert.id, 'triggered');
    }
  }
}
```

**Delivery:**
```typescript
interface AlertDelivery {
  email?: {
    to: string;
    subject: string;
    template: 'price_alert' | 'indicator_alert';
    data: any;
  };
  webhook?: {
    url: string;
    payload: any;
  };
}
```

**Email Template:**
```
Subject: 🚨 Alert: BTC crossed $100,000

Your alert "BTC > $100,000" has been triggered.

Current Price: $100,234.56
Change (24h): +5.2%
Time: Jan 23, 2026 at 10:15 AM EST

[View on CryptoReportKit] | [Manage Alerts]
```

**Acceptance Tests:**
- [ ] Alerts evaluate correctly
- [ ] Email delivery works
- [ ] Webhook delivery works
- [ ] Alerts don't fire multiple times (cooldown)
- [ ] Alert history tracked

---

## Phase 9: Workspaces

### 9.1 Workspace Features
**Status:** 🔴 TODO
**Priority:** 🟡 MEDIUM
**Timeline:** Week 11

**Page: `/workspace`**

**Features:**
1. **Saved Recipes:**
   - List of custom pack recipes
   - Edit/clone/delete
   - Download as pack

2. **Watchlists:**
   - Create custom coin lists
   - Track specific assets
   - Use in builder

3. **Saved Screeners:**
   - Save filter combinations
   - One-click re-run
   - Export results

4. **Pack Versions:**
   - Track pack updates
   - Download v1, v2, v3
   - Migration guides

**Implementation:**
```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'recipe' | 'watchlist' | 'screener'
  config JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**UI:**
```
My Workspace
├── Recipes (5)
│   ├── Custom BTC Analysis Pack
│   ├── DeFi Dashboard
│   └── Risk Monitoring
│
├── Watchlists (3)
│   ├── Top 10 Holdings
│   ├── DeFi Protocols
│   └── Layer 2s
│
└── Saved Screeners (2)
    ├── High Volume Breakouts
    └── Low Volatility Coins
```

---

## Phase 10: CryptoSheets Fallback Mode

### 10.1 Integration Strategy
**Status:** 🔴 TODO
**Priority:** 🟢 LOW

**Policy:**
- CryptoSheets is **OPTIONAL**, not required
- Only for niche datasets we can't provide via BYOK
- Clear labeling: "Refresh engine: CryptoSheets (third-party)"
- User must install CryptoSheets separately

**Implementation:**
```typescript
// Template metadata
interface TemplateMetadata {
  refresh_engines: ('crk_byok' | 'cryptosheets')[];
  recommended_engine: 'crk_byok' | 'cryptosheets';
}
```

**UI Badge:**
```
┌──────────────────────────────┐
│ Portfolio Tracker Pack       │
│                              │
│ Refresh: CRK BYOK ✓         │
│ Also supports: CryptoSheets  │
└──────────────────────────────┘
```

**Download Page:**
```
Choose Refresh Engine:

○ CRK BYOK (Recommended)
  Uses your own API keys
  Free with account

○ CryptoSheets
  Third-party add-in required
  Install separately
```

---

## Phase 11: Payment Provider Readiness

### 11.1 Pre-Paddle Setup
**Status:** 🟡 PARTIAL
**Priority:** 🟡 MEDIUM

**Already Done:** ✅
- Plan gating enforced
- Usage metering
- Entitlements check

**Still Needed:** ⚠️
- Admin plan assignment UI
- Webhook endpoint stubs
- Invoice/billing history page

**Implementation:**

**1. Admin Panel: `/admin/users`**
```
User: user@example.com

Current Plan: Free
├── Manual Override: [Pro ▼]
└── Expires: [Never ▼]

[Update Plan]
```

**2. Webhook Stubs:**
```typescript
// src/app/api/paddle/webhook/route.ts
export async function POST(request: Request) {
  const signature = request.headers.get('paddle-signature');
  const body = await request.json();

  // Verify signature
  if (!verifySignature(signature, body)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  // Handle events
  switch (body.event_type) {
    case 'subscription.created':
      await handleSubscriptionCreated(body.data);
      break;
    case 'subscription.updated':
      await handleSubscriptionUpdated(body.data);
      break;
    case 'subscription.canceled':
      await handleSubscriptionCanceled(body.data);
      break;
  }

  return NextResponse.json({ success: true });
}
```

**3. Billing Page: `/account/billing`**
```
Current Plan: Pro
├── Price: $19/month
├── Renewal: Feb 15, 2026
└── Status: Active

[Manage Subscription] [View Invoices]

Recent Invoices
┌────────────────────────────────────┐
│ Jan 15, 2026 - $19.00 (Paid)     │
│ [Download PDF] [View Receipt]     │
└────────────────────────────────────┘
```

### 11.2 Paddle Integration
**Status:** 🔴 TODO (waiting for approval)
**Priority:** 🔴 HIGH (when approved)

**Integration Steps:**
1. Get Paddle approval
2. Add Paddle SDK
3. Create checkout flow
4. Verify webhook signatures
5. Link invoice/portal URLs
6. Test subscription lifecycle

---

## Phase 12: Launch Readiness

### 12.1 Content Audit
**Status:** 🟡 PARTIAL
**Priority:** 🔴 HIGH

**Pages to Review:**
- [ ] `/about` - Accurate company info ✅
- [ ] `/contact` - Support email consistent ✅
- [ ] `/terms` - No Paddle mentions ✅
- [ ] `/privacy` - Data practices accurate ✅
- [ ] `/refund` - Policy clear ✅
- [ ] `/pricing` - Plans accurate
- [ ] `/faq` - Answers complete
- [ ] `/addin/setup` - Install guide clear ✅

### 12.2 Operational Readiness
**Status:** 🟡 PARTIAL

**Monitoring:**
- [ ] Status page (`/status`) ✅
- [ ] Error tracking (Sentry)
- [ ] Uptime monitoring
- [ ] Log aggregation

**Support:**
- [ ] Email autoresponder
- [ ] Ticket system
- [ ] Knowledge base
- [ ] Video tutorials

### 12.3 Demo Materials
**Status:** 🔴 TODO

**Needed:**
1. **Demo Video (3-5 minutes):**
   - Browse templates
   - Preview pack
   - Download
   - Open in Excel
   - Refresh data
   - See live updates

2. **Screenshots:**
   - Template catalog
   - Report builder
   - Excel pack (before/after refresh)
   - CRK Panel
   - Key management

3. **Documentation:**
   - Installation guide ✅
   - First pack guide
   - Troubleshooting
   - API key setup guides

---

## Success Metrics

### KPIs to Track:
1. **Adoption:**
   - Add-in installs
   - Pack downloads
   - Active users (7-day, 30-day)

2. **Engagement:**
   - Packs refreshed per user per week
   - API keys connected rate
   - Scheduled exports created

3. **Retention:**
   - Week 1 retention
   - Month 1 retention
   - Churn rate

4. **Revenue:**
   - Free → Pro conversion rate
   - Pro → Premium upgrade rate
   - MRR growth

5. **Support:**
   - Ticket volume
   - First response time
   - Resolution rate

---

## Timeline Summary

**Weeks 1-2:** Foundation (Recipe schema, connector interface, sources matrix)
**Weeks 3-4:** Download UX (Enhanced catalog, builder, previews)
**Weeks 5-6:** Excel Polish (Pack standard, refresh pipeline, onboarding)
**Weeks 7-8:** Automation (Scheduled exports, email delivery)
**Weeks 9-10:** Engagement (Alerts, workspaces)
**Weeks 11-12:** Launch Prep (Content audit, demos, monitoring)

**Target Launch:** Q1 2026 End (12 weeks from start)

---

## Current Status (Week 0)

### ✅ Complete:
- Core data APIs (64 endpoints)
- Excel add-in (6 functions)
- Manifest + taskpane
- BYOK encryption
- Basic pack generation
- Template catalog

### 🟡 In Progress:
- Recipe system
- Report builder
- Enhanced catalog
- Pack standard

### 🔴 To Do:
- Sources matrix
- Connector layer
- Onboarding wizard
- Scheduled exports UI
- Alerts system
- Workspaces
- Launch polish

**Next Action:** Create SOURCES_MATRIX.md and start Phase 0
