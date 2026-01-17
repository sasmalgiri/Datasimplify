# DataSimplify - Page Data Report

> **Generated:** January 2026
> **Platform:** DataSimplify Crypto Analytics
> **Data Sources:** Binance, CoinGecko, Alternative.me, DeFiLlama, BlockchainInfo

---

## Table of Contents

1. [Homepage](#1-homepage)
2. [Market Page](#2-market-page)
3. [Charts Page](#3-charts-page)
4. [Trending Page](#4-trending-page)
5. [Gainers & Losers Page](#5-gainers--losers-page)
6. [Exchanges Page](#6-exchanges-page)
7. [NFT Collections Page](#7-nft-collections-page)
8. [Recently Added Page](#8-recently-added-page)
9. [Sentiment Page](#9-sentiment-page)
10. [Whale Watch Page](#10-whale-watch-page)
11. [On-Chain Analytics Page](#11-on-chain-analytics-page)
12. [Compare Page](#12-compare-page)
13. [Correlation Page](#13-correlation-page)
14. [Research Workspace](#14-research-workspace)
15. [Dashboard Page](#15-dashboard-page)
16. [Templates Page](#16-templates-page)
17. [Coin Detail Page](#17-coin-detail-page)

---

## 1. Homepage

**URL:** `/`

### Data Displayed
| Section | Data | Source |
|---------|------|--------|
| Stats Section | 15+ Excel Templates | Static |
| Stats Section | 600+ Tokens Tracked | Dynamic (Binance Discovery) |
| Stats Section | Free to Get Started | Static |
| Stats Section | Live Data via CryptoSheets | Static |
| SafeContract Preview | Smart Contract Verification Status | Sourcify API |
| Template Finder | Template search & recommendations | Internal |
| Quick Actions | Navigation links | Static |

### Features
- Hero section with CTA buttons
- Template Finder for quick template search
- SafeContract verification tool preview
- Quick navigation cards
- Pricing section (if enabled)

---

## 2. Market Page

**URL:** `/market`

### Data Displayed
| Metric | Description | Source |
|--------|-------------|--------|
| Total Market Cap | Sum of all crypto market caps | Binance/CoinGecko |
| 24h Volume | Total trading volume | Binance/CoinGecko |
| Fear & Greed Index | Market sentiment (0-100) | Alternative.me |
| BTC Dominance | Bitcoin's market share % | Binance/CoinGecko |
| Active Cryptocurrencies | Number of tracked coins | Binance/CoinGecko |
| Trending Coins | Top 5 most searched coins | CoinGecko/Binance |
| Top Gainers | Top 5 price increases | CoinGecko/Binance |
| Top Losers | Top 5 price decreases | CoinGecko/Binance |

### Coin Table (500 coins with pagination)
| Column | Description |
|--------|-------------|
| # | Market cap rank |
| Coin | Name, symbol, logo |
| Price | Current USD price |
| 24h % | Price change percentage |
| Market Cap | Total market value |
| Volume (24h) | Trading activity |

### Features
- Search/filter coins
- Sort by market cap, price change, volume
- Refresh button
- Excel template download
- Educational tooltips

---

## 3. Charts Page

**URL:** `/charts`

### Chart Types Available (19 total)

#### Historical Charts
| Chart | Data Displayed | Source |
|-------|----------------|--------|
| Price History | OHLC with moving averages | Binance |
| Candlestick | Traditional OHLC candles | Binance |
| Volume Analysis | Volume bars with price overlay | Binance |

#### Technical Analysis
| Chart | Data Displayed | Source |
|-------|----------------|--------|
| Volatility Index | Price volatility over time | Calculated |
| Momentum Indicators | RSI, MACD metrics | Calculated |
| Fibonacci Retracement | Support/resistance levels | Calculated |
| Volume Profile | Volume at price levels | Calculated |

#### Comparison Charts
| Chart | Data Displayed | Source |
|-------|----------------|--------|
| Correlation Matrix | Asset correlation heatmap | Calculated |
| Racing Bar Chart | Animated market cap ranking | Binance |
| Market Dominance | Market share pie chart | Binance |
| BTC Dominance History | Bitcoin dominance over time | Binance |

#### Derivatives Charts
| Chart | Data Displayed | Source |
|-------|----------------|--------|
| Funding Rate History | Futures funding rates | Binance |
| Open Interest | OI with price overlay | Binance |
| Liquidation Heatmap | Predicted liquidation levels | Binance |

#### On-Chain Charts
| Chart | Data Displayed | Source |
|-------|----------------|--------|
| Whale Flow | Exchange in/out flows | BlockchainInfo |
| Wallet Distribution | BTC holder treemap | BlockchainInfo |
| Active Addresses | Daily active addresses | BlockchainInfo |
| Fear & Greed History | Historical sentiment | Alternative.me |
| Social Volume | Social mentions over time | Calculated |

### Features
- Coin selector (600+ dynamically discovered coins)
- Timeframe selection (1D, 1W, 1M, 3M, 1Y, ALL)
- Chart export as image
- Excel template download

---

## 4. Trending Page

**URL:** `/trending`

### Data Displayed
| Section | Data | Source |
|---------|------|--------|
| Trending Now | Top 15 most searched coins | CoinGecko/Binance |
| Top Gainers | 10 biggest 24h increases | CoinGecko/Binance |
| Top Losers | 10 biggest 24h decreases | CoinGecko/Binance |

### Per Coin Data
| Field | Description |
|-------|-------------|
| Rank | Trending position |
| Name/Symbol | Coin identifier |
| Image | Coin logo |
| Price | Current price |
| 24h Change % | Price movement |
| Market Cap | Total value |

### Features
- Quick navigation cards
- Export to Excel option
- Attribution to CoinGecko

---

## 5. Gainers & Losers Page

**URL:** `/gainers-losers`

### Data Displayed
| Section | Data | Count |
|---------|------|-------|
| Top Gainers | Coins with biggest 24h gains | Up to 25 |
| Top Losers | Coins with biggest 24h losses | Up to 25 |

### Per Coin Data
| Field | Description |
|-------|-------------|
| Name/Symbol | Coin identifier |
| Image | Coin logo |
| Price | Current USD price |
| 24h Change % | Percentage movement |
| Volume | 24h trading volume |
| Market Cap | Total market value |

### Features
- Split view / Gainers only / Losers only toggle
- Tips section for using the data
- Excel export option

---

## 6. Exchanges Page

**URL:** `/exchanges`

### Data Displayed
| Metric | Description | Source |
|--------|-------------|--------|
| Total Exchanges | Number of exchanges listed | CoinGecko |
| Top Volume (24h) | Highest 24h volume in BTC | CoinGecko |
| High Trust Score | Exchanges with score >= 8 | CoinGecko |
| Countries | Number of unique countries | CoinGecko |

### Exchange Table (50 exchanges)
| Column | Description |
|--------|-------------|
| # | Rank |
| Exchange | Name and logo |
| Trust Score | Rating out of 10 |
| Volume (24h) | Trading volume in BTC |
| Country | Headquarters location |
| Year | Year established |
| Visit | External link |

### Features
- Search by exchange name or country
- Trust score color coding
- External links to exchanges

---

## 7. NFT Collections Page

**URL:** `/nft`

### Data Displayed
| Metric | Description | Source |
|--------|-------------|--------|
| Collections | Total NFT collections listed | CoinGecko |
| Floor Up (24h) | Collections with rising floor | CoinGecko |
| Floor Down (24h) | Collections with falling floor | CoinGecko |
| With Volume | Collections with 24h volume | CoinGecko |

### Per Collection Data
| Field | Description |
|-------|-------------|
| Name/Symbol | Collection identifier |
| Image | Collection thumbnail |
| Floor Price | Lowest listing price (USD + native) |
| Floor Change 24h | Floor price movement |
| Market Cap | Total collection value |
| Volume (24h) | Trading activity |
| Owners | Unique wallet holders |
| Total Supply | Number of NFTs |

### Features
- Search by collection name/symbol
- Grid card layout
- Floor price in native currency

---

## 8. Recently Added Page

**URL:** `/recently-added`

### Data Displayed
| Metric | Description | Source |
|--------|-------------|--------|
| New Coins Listed | Total recently added | CoinGecko |
| Gainers (24h) | New coins gaining | CoinGecko |
| Losers (24h) | New coins losing | CoinGecko |
| With Market Cap | Coins with MCap rank | CoinGecko |

### Per Coin Data (30 coins)
| Field | Description |
|-------|-------------|
| Name/Symbol | Coin identifier |
| Image | Coin logo |
| Price | Current price |
| 24h Change % | Price movement |
| Market Cap | Total value |
| Listed Date | When coin was added |

### Features
- Search functionality
- Link to detailed coin page
- Grid card layout

---

## 9. Sentiment Page

**URL:** `/sentiment`

### Data Displayed
| Metric | Description | Source |
|--------|-------------|--------|
| Fear & Greed Value | Current index (0-100) | Alternative.me |
| Classification | Extreme Fear/Fear/Neutral/Greed/Extreme Greed | Alternative.me |
| Historical Chart | 30-day sentiment history | Alternative.me |

### Educational Content
| Section | Description |
|---------|-------------|
| Understanding Sentiment | Explanation of each level |
| Extreme Fear (0-25) | What it means |
| Fear (25-50) | What it means |
| Neutral (50) | What it means |
| Greed (50-75) | What it means |
| Extreme Greed (75-100) | What it means |
| Historical Examples | COVID crash, ATH examples |

### Features
- Live sentiment gauge
- 30-day history chart
- Beginner tips
- Excel template download

---

## 10. Whale Watch Page

**URL:** `/whales`

### Data Displayed
| Section | Data | Source |
|---------|------|--------|
| BTC Wallet Distribution | Treemap of holder categories | BlockchainInfo |
| Whale Transactions | Large transfer alerts | Internal |

### Wallet Distribution Categories
| Category | Description | Icon |
|----------|-------------|------|
| Shrimp | < 1 BTC | 🦐 |
| Crab | 1-10 BTC | 🦀 |
| Fish | 10-100 BTC | 🐟 |
| Dolphin | 100-1K BTC | 🐬 |
| Shark | 1K-10K BTC | 🦈 |
| Whale | 10K-100K BTC | 🐋 |
| Mega Whale | > 100K BTC | 🐳 |

### Features
- Interactive treemap visualization
- Whale transaction tracker
- Beginner tips
- Excel template download

---

## 11. On-Chain Analytics Page

**URL:** `/onchain`

### Data Displayed (when enabled)
| Metric | Description | Source |
|--------|-------------|--------|
| Network Hashrate | Mining power | BlockchainInfo |
| Mining Difficulty | Network difficulty | BlockchainInfo |
| Active Addresses | Daily active wallets | BlockchainInfo |
| Transaction Count | Daily transactions | BlockchainInfo |
| Gas Prices | Ethereum gas (if ETH) | Public RPC |

### Features
- Real-time network metrics
- Historical charts
- Beginner tips
- Excel template download

---

## 12. Compare Page

**URL:** `/compare`

### Data Displayed (Side-by-side comparison)

#### Market Data
| Metric | Description |
|--------|-------------|
| Price | Current USD price |
| 24h Change | Price change |
| 7d Change | Weekly change |
| 30d Change | Monthly change |
| 1Y Change | Yearly change |
| Market Cap | Total value |
| Fully Diluted Val. | FDV |
| 24h Volume | Trading activity |
| Vol/MCap Ratio | Volume to market cap |
| Circulating Supply | Coins in circulation |
| Max Supply | Maximum supply |
| Supply Ratio | Circ/Max percentage |

#### Price Levels
| Metric | Description |
|--------|-------------|
| ATH | All-time high |
| From ATH | Distance from ATH |
| ATL | All-time low |
| From ATL | Distance from ATL |
| 24h High | Day's high |
| 24h Low | Day's low |
| 24h Range % | Intraday volatility |

#### Technical Indicators
| Metric | Description |
|--------|-------------|
| RSI (14) | Relative Strength Index |
| Volatility (30d) | 30-day price volatility |
| Momentum (30d) | 30-day price momentum |
| Market Dominance | Share of total market |

### Features
- 600+ dynamically discovered coins
- Category filters (Layer 1, DeFi, Meme, etc.)
- Column customization
- Sort options
- Excel template download

---

## 13. Correlation Page

**URL:** `/correlation`

### Data Displayed
| Metric | Description | Source |
|--------|-------------|--------|
| Correlation Matrix | Heatmap of price correlations | Calculated |
| Correlation Values | -1 to +1 scale | Calculated |
| Color Coding | Red (negative) to Green (positive) | Visual |

### Default Coins
- Bitcoin (BTC)
- Ethereum (ETH)
- Solana (SOL)
- BNB
- XRP

### Features
- 30-day correlation period
- Beginner tips explaining correlation
- Excel template download

---

## 14. Research Workspace

**URL:** `/research`

### Navigation Hub
| Section | Tools |
|---------|-------|
| Core Research Tools | Excel Downloads, Charts, Comparisons |
| Analytics & Metrics | Market, On-Chain, Technical |
| Quick Actions | Trending, Top Movers, Correlation, Fear & Greed |

### No direct data - navigation page only

---

## 15. Dashboard Page

**URL:** `/dashboard` (requires login)

### User Data Displayed
| Metric | Description |
|--------|-------------|
| Current Plan | Free/Pro/Premium |
| Price | Subscription cost |
| Downloads This Month | Usage count |
| Downloads Limit | Based on plan |
| Remaining Downloads | Available downloads |
| Member Since | Account creation date |
| Email | User email |
| Recent Downloads | Last 10 downloads |

### Features
- Upgrade options
- Quick action links
- Privacy & Data settings
- Export data (GDPR compliant)
- Delete account option

---

## 16. Templates Page

**URL:** `/templates`

### Template Categories
| Category | Templates Available |
|----------|---------------------|
| Market Overview | Price data, market cap rankings |
| Technical Analysis | RSI, MACD, Bollinger Bands |
| On-Chain Analytics | Wallet distribution, whale flow |
| DeFi Analytics | TVL, yields, protocols |
| Comparison | Side-by-side metrics |
| Sentiment | Fear & Greed history |

### Per Template Data
- Template name & description
- Preview image
- Supported coins
- Download format (XLSX)
- CryptoSheets formula integration

---

## 17. Coin Detail Page

**URL:** `/coin/[id]`

### Data Displayed
| Section | Metrics |
|---------|---------|
| Header | Name, symbol, logo, rank |
| Price Info | Current price, 24h change, 24h high/low |
| Market Stats | Market cap, FDV, volume, circulating supply |
| Price History | Interactive chart |
| ATH/ATL | All-time high and low with dates |
| Links | Website, explorer, social links |

---

## Data Sources Summary

| Source | Data Provided | API Type |
|--------|---------------|----------|
| **Binance** | Price, volume, candles, market data | Free (no key) |
| **CoinGecko** | Trending, exchanges, NFTs, detailed data | Free + Pro |
| **Alternative.me** | Fear & Greed Index | Free |
| **BlockchainInfo** | BTC on-chain metrics | Free |
| **DeFiLlama** | DeFi TVL and protocol data | Free |
| **Sourcify** | Smart contract verification | Free |

---

## API Fallback Strategy

| Primary Source | Fallback | Endpoints |
|----------------|----------|-----------|
| CoinGecko | Binance | Trending, Gainers/Losers |
| Supabase Cache | Direct API | All market data |
| In-Memory Cache | Fresh Fetch | All endpoints |

---

## Update Frequencies

| Data Type | Update Interval |
|-----------|-----------------|
| Price Data | 60 seconds |
| Market Overview | 5 minutes |
| Trending | 5 minutes |
| Fear & Greed | 1 hour |
| On-Chain | 10 minutes |
| Exchange Data | 15 minutes |

---

*This report documents all user-visible data across the DataSimplify platform.*
