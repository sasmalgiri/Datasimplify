# CryptoReportKit - Excel Integration Options

Since the Office Add-in requires HTTPS hosting, here are **3 alternative methods** that work immediately:

---

## 🔵 Option 1: Power Query (Desktop Excel)

**Best for:** Windows/Mac Excel desktop, no coding required

### Quick Start:
1. Open Excel Desktop
2. Go to **Data → Get Data → From Web**
3. Enter this URL:
   ```
   https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_24hr_change=true
   ```
4. Click **OK** → Power Query opens
5. Click **Into Table** → **Close & Load**

### For More Data (Top 100 Coins):
1. **Data → Get Data → From Web**
2. URL: `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1`
3. Transform in Power Query as needed

### Auto-Refresh:
- Right-click the table → **Refresh** (manual)
- Or: **Data → Queries & Connections → Properties → Refresh every X minutes**

### Files:
- `PowerQuery_CryptoData.pq` - Copy/paste into Advanced Editor

---

## 🟢 Option 2: Office Scripts (Excel Online)

**Best for:** Excel Online, automation with Power Automate

### Quick Start:
1. Go to [office.com/excel](https://office.com/excel)
2. Open a workbook
3. Click **Automate → New Script**
4. Paste the code from `OfficeScript_CryptoData.ts`
5. Click **Run**

### Features:
- ✅ Fetches live prices
- ✅ Auto-formats data
- ✅ Creates tables with headers
- ✅ Can be scheduled via Power Automate

### Auto-Refresh with Power Automate:
1. Save your Office Script
2. Go to **Automate → Automate a Task**
3. Create a Power Automate flow
4. Trigger: Recurrence (every hour, day, etc.)
5. Action: Run Office Script

---

## 🟡 Option 3: Direct VBA (Desktop Excel)

**Best for:** Excel desktop with macros enabled

### Quick Start:
1. Press **Alt + F11** to open VBA Editor
2. Insert → Module
3. Paste the code from `VBA_CryptoData.bas`
4. Run the macro

---

## 📊 Comparison Table

| Feature | Power Query | Office Scripts | VBA |
|---------|------------|----------------|-----|
| Works in Desktop Excel | ✅ | ❌ | ✅ |
| Works in Excel Online | ❌ | ✅ | ❌ |
| No coding required | ✅ | ❌ | ❌ |
| Auto-refresh | ✅ | ✅ (with Power Automate) | ✅ |
| BYOK Support | ✅ | ✅ | ✅ |
| Easy to set up | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |

---

## 🔑 BYOK (Bring Your Own Key) Support

All methods support using your own CoinGecko API key:

### Power Query with API Key:
```
let
    ApiKey = "YOUR_KEY_HERE",
    Source = Json.Document(Web.Contents(
        "https://pro-api.coingecko.com/api/v3/coins/markets",
        [
            Headers = [#"x-cg-pro-api-key" = ApiKey],
            Query = [vs_currency = "usd", per_page = "250"]
        ]
    ))
in
    Source
```

### Office Scripts with API Key:
Store your key in a cell (e.g., Settings!B1) and reference it in the script.

---

## 📁 Files Included

- `PowerQuery_CryptoData.pq` - Power Query M code
- `OfficeScript_CryptoData.ts` - Office Scripts TypeScript
- `VBA_CryptoData.bas` - VBA macro code

> Note: Paid templates (e.g., Pro packs) are delivered through the in-app Downloads portal and are not hosted as public files.

---

## 🚀 Recommended Approach

| Your Situation | Best Option |
|---------------|-------------|
| Desktop Excel user | **Power Query** |
| Excel Online user | **Office Scripts** |
| Need automation | **Office Scripts + Power Automate** |
| Corporate/restricted environment | **Power Query** |
