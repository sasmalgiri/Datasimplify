# CryptoReportKit Data Sources Matrix
## Legal & Rights Reference Table

**Last Updated:** January 23, 2026
**Status:** 🔴 MANDATORY - No feature can ship without entry in this table

---

## Operating Rule

**EVERY dataset must have a row in this table BEFORE implementation.**

If a feature isn't listed here, it cannot be shipped to production.

---

## Matrix

| Dataset | Provider | Mode | Caching | Attribution Required | Allowed Outputs | Plan Gate | Implementation Status |
|---------|----------|------|---------|---------------------|-----------------|-----------|----------------------|
| **PRICE DATA** |
| Spot Prices (current) | Binance | Public | 60s | No | Web display | Free | ✅ Complete |
| Spot Prices (current) | CoinGecko | BYOK | 60s | No | All | Free | ✅ Complete |
| Spot Prices (streaming) | Binance WebSocket | BYOK | None | No | All | Pro | 🔴 TODO |
| **HISTORICAL DATA** |
| OHLCV 1h+ | Binance | Public | 60s | No | Web display | Free | ✅ Complete |
| OHLCV 1h+ | Binance | BYOK | 60s | No | All | Free | ✅ Complete |
| OHLCV 1h+ | CoinGecko | BYOK | 60s | No | All | Free | ✅ Complete |
| OHLCV 15m, 30m | Binance | BYOK | 30s | No | All | Pro | 🔴 TODO |
| OHLCV 5m | Binance | BYOK | 30s | No | All | Pro | 🔴 TODO |
| OHLCV 1m | Binance | BYOK | 10s | No | All | Premium | 🔴 TODO |
| OHLCV <5 years | CoinGecko | BYOK | 300s | No | All | Pro | 🔴 TODO |
| **MARKET METRICS** |
| Market cap | Binance | Public | 60s | No | Web display | Free | ✅ Complete |
| Market cap | CoinGecko | BYOK | 60s | No | All | Free | ✅ Complete |
| 24h volume | Binance | Public | 60s | No | Web display | Free | ✅ Complete |
| Global market stats | CoinGecko | Public | 300s | No | Web display | Free | ✅ Complete |
| Coin categories | CoinGecko | Public | 1800s | No | Web display | Free | ✅ Complete |
| **TECHNICAL INDICATORS** |
| RSI, MACD, Bollinger | Computed locally | Local | None | No | All | Free | ✅ Complete |
| SMA/EMA | Computed locally | Local | None | No | All | Free | ✅ Complete |
| Stochastic, CCI, ADX | Computed locally | Local | None | No | All | Free | ✅ Complete |
| Ichimoku, Williams %R | Computed locally | Local | None | No | All | Free | ✅ Complete |
| **ON-CHAIN METRICS** |
| Fear & Greed Index | Alternative.me | Public | 300s | Yes ("Source: Alternative.me") | Web display only | Free | ✅ Complete |
| Fear & Greed History | Alternative.me | Public | 3600s | Yes ("Source: Alternative.me") | Web display only | Free | ✅ Complete |
| Bitcoin network stats | Blockchain.info | Public | 300s | No | Web display | Free | ✅ Complete |
| Ethereum gas prices | Public RPC | Public | 300s | No | All | Free | ✅ Complete |
| Whale transactions (ETH) | Etherscan | BYOK | 300s | No | All | Pro | ✅ Complete |
| Whale transactions (BTC) | Blockchair | BYOK | 300s | No | All | Pro | ✅ Complete |
| Token holder analysis | Nansen | BYOK | 300s | No | All | Premium | 🔴 TODO |
| Smart money tracking | Nansen | BYOK | 300s | No | All | Premium | 🔴 TODO |
| **DEFI DATA** |
| Protocol TVL | DeFiLlama | Public | 300s | Yes ("Source: DeFiLlama") | Web display only | Free | ✅ Complete |
| Chain TVL | DeFiLlama | Public | 300s | Yes ("Source: DeFiLlama") | Web display only | Free | ✅ Complete |
| Stablecoins | DeFiLlama | Public | 300s | Yes ("Source: DeFiLlama") | Web display only | Free | ✅ Complete |
| Yield farming | DeFiLlama | Public | 300s | Yes ("Source: DeFiLlama") | Web display only | Free | ✅ Complete |
| DEX pools | CoinGecko | Public | 300s | No | Web display | Free | ✅ Complete |
| **DERIVATIVES** |
| Funding rates | Binance | Public | 300s | No | Web display | Free | ✅ Complete |
| Funding rates | Binance | BYOK | 60s | No | All | Pro | 🔴 TODO |
| Open interest | Binance | Public | 300s | No | Web display | Free | ✅ Complete |
| Liquidations | Binance | Public | 300s | No | Web display | Free | ✅ Complete |
| Options data | Deribit | BYOK | 300s | No | All | Premium | 🔴 TODO |
| **SENTIMENT** |
| Reddit sentiment | Reddit API | BYOK | 1800s | No | All | Pro | ✅ Complete |
| News headlines | CryptoPanic | Public | 900s | Yes ("Source: CryptoPanic") | Web display only | Free | ✅ Complete |
| RSS feeds | Multiple | Public | 1800s | Yes (per source) | Web display only | Free | ✅ Complete |
| GitHub activity | GitHub API | Public | 3600s | No | Web display | Free | ✅ Complete |
| 4chan /biz/ | Scraping | - | - | - | - | - | ❌ FORBIDDEN |
| Twitter/X sentiment | Twitter API | BYOK | 900s | Yes | All | Premium | 🔴 TODO |
| **NFT DATA** |
| Collection floor prices | CoinGecko | Public | 300s | No | Web display | Free | ✅ Complete |
| Collection volumes | CoinGecko | Public | 300s | No | Web display | Free | ✅ Complete |
| NFT sales | OpenSea | BYOK | 300s | No | All | Pro | 🔴 TODO |
| Wallet NFT holdings | Alchemy | BYOK | 300s | No | All | Pro | 🔴 TODO |
| **EXCHANGE DATA** |
| Exchange rankings | CoinGecko | Public | 300s | No | Web display | Free | ✅ Complete |
| Exchange volume | CoinGecko | Public | 300s | No | Web display | Free | ✅ Complete |
| Exchange orderbook | Binance | BYOK | 10s | No | All | Premium | 🔴 TODO |
| **MACRO INDICATORS** |
| Fed Funds Rate | FRED | Public | 86400s | Yes ("Source: FRED") | Web display only | Free | ✅ Complete |
| 10Y Treasury | FRED | Public | 86400s | Yes ("Source: FRED") | Web display only | Free | ✅ Complete |
| DXY (Dollar Index) | Yahoo Finance | Public | 3600s | Yes ("Source: Yahoo Finance") | Web display only | Free | ✅ Complete |
| VIX | Yahoo Finance | Public | 3600s | Yes ("Source: Yahoo Finance") | Web display only | Free | ✅ Complete |
| S&P 500 | Yahoo Finance | Public | 3600s | Yes ("Source: Yahoo Finance") | Web display only | Free | ✅ Complete |
| Nasdaq | Yahoo Finance | Public | 3600s | Yes ("Source: Yahoo Finance") | Web display only | Free | ✅ Complete |
| **RISK METRICS** |
| Volatility | Computed locally | Local | None | No | All | Free | ✅ Complete |
| Sharpe Ratio | Computed locally | Local | None | No | All | Free | ✅ Complete |
| Sortino Ratio | Computed locally | Local | None | No | All | Free | ✅ Complete |
| VaR (95%, 99%) | Computed locally | Local | None | No | All | Free | ✅ Complete |
| Max Drawdown | Computed locally | Local | None | No | All | Free | ✅ Complete |
| Beta vs BTC | Computed locally | Local | None | No | All | Free | ✅ Complete |
| Correlation matrix | Computed locally | Local | None | No | All | Free | ✅ Complete |

---

## Mode Definitions

### Public
- **Definition:** Free access from provider's public API (no key required)
- **Constraints:**
  - Display-only on website
  - Cannot be exported to Excel/CSV unless explicitly allowed
  - Must follow provider's rate limits
  - May require attribution
- **Use Cases:** Demo data, charts on public pages

### BYOK (Bring Your Own Key)
- **Definition:** User provides their own API key for the provider
- **Constraints:**
  - User owns the key and accepts provider's terms
  - We proxy requests using user's key
  - Key encrypted with AES-256-GCM at rest
  - Decrypted only in memory for request
- **Use Cases:** Excel exports, scheduled reports, custom alerts

### Computed Locally
- **Definition:** Calculated from raw data using our algorithms
- **Constraints:**
  - No licensing issues (we own the computation)
  - Requires source data to be legally obtained
- **Use Cases:** Technical indicators, risk metrics

### CryptoSheets Fallback
- **Definition:** Third-party add-in required (separate install)
- **Constraints:**
  - User must install CryptoSheets
  - We don't control or support it
  - Must be clearly labeled as "third-party"
- **Use Cases:** Niche datasets we can't provide via BYOK

---

## Attribution Requirements

### Providers Requiring Attribution:

| Provider | Attribution Text | Where Required |
|----------|------------------|----------------|
| Alternative.me | "Fear & Greed Index data powered by Alternative.me" | Any page displaying F&G Index |
| DeFiLlama | "DeFi data powered by DeFiLlama" | Any page displaying TVL/DeFi data |
| CryptoPanic | "News powered by CryptoPanic" | Any page displaying news |
| FRED | "Economic data powered by Federal Reserve Economic Data (FRED)" | Macro pages |
| Yahoo Finance | "Market data powered by Yahoo Finance" | Macro pages |
| CoinTelegraph | "News from CoinTelegraph" | RSS feed pages |
| CoinDesk | "News from CoinDesk" | RSS feed pages |
| Decrypt | "News from Decrypt" | RSS feed pages |
| CryptoSlate | "News from CryptoSlate" | RSS feed pages |

### Implementation:
```tsx
// Every page displaying attributed data must include:
<div className="text-xs text-gray-500 mt-4">
  Data powered by [Provider Name]
</div>
```

---

## Allowed Outputs Matrix

### Web Display
- Public facing pages
- Cached data (5-60 minutes)
- Read-only
- Attribution required where specified

### Excel Export
- Downloaded Excel files
- Refreshable with BYOK keys
- Attribution in footer (optional)

### Scheduled Reports
- Email delivery
- CSV/Excel attachments
- Requires BYOK for live data

### Alerts
- Email/webhook notifications
- Triggered by live data
- Requires BYOK

### API Access
- Direct API calls for users
- Rate limited per plan
- Requires authentication

---

## Plan Gates

### Free Tier
- Public data (cached)
- BYOK with basic providers (CoinGecko, Binance)
- 5 template downloads/month
- Basic Excel functions
- Web display access

### Pro Tier ($19/mo)
- All Free features
- BYOK with premium providers (Etherscan, Reddit)
- 50 template downloads/month
- Scheduled exports (daily)
- Price alerts
- 5m/15m intervals

### Premium Tier ($79/mo)
- All Pro features
- BYOK with enterprise providers (Nansen, Deribit)
- Unlimited downloads
- Scheduled exports (hourly)
- Advanced alerts (indicators, funding)
- 1m intervals
- Priority support
- API access
- White-label option

---

## Adding New Datasets (Checklist)

Before implementing any new dataset:

- [ ] 1. Determine provider and licensing model
- [ ] 2. Verify we can legally redistribute (or require BYOK)
- [ ] 3. Add row to this matrix
- [ ] 4. Determine caching strategy
- [ ] 5. Check if attribution required
- [ ] 6. Define allowed outputs
- [ ] 7. Set plan gate
- [ ] 8. Implement connector
- [ ] 9. Add tests
- [ ] 10. Update documentation

---

## Forbidden Data Sources

**NEVER implement these without explicit legal approval:**

### ❌ Scraped Data
- 4chan /biz/ (no API)
- Discord servers (TOS violation)
- Telegram groups (TOS violation)
- Private Twitter accounts

### ❌ Redistributed Licensed Data
- Bloomberg Terminal data
- Refinitiv/Reuters data
- Paid research reports
- Licensed indicator systems (e.g., proprietary TA indicators)

### ❌ Personal Data
- Individual wallet holdings (without consent)
- User transaction history (without consent)
- Personal trading patterns

### ❌ Advice/Signals
- "Buy/sell signals"
- "Recommended trades"
- "Guaranteed returns"
- "Financial advice"

---

## Review Process

**Monthly Review:** Check all public API sources still allow usage
**Quarterly Review:** Audit attribution compliance across site
**Annual Review:** Re-verify licensing terms for all providers

**Owner:** Product/Legal team
**Last Review:** January 23, 2026
**Next Review:** February 23, 2026

---

## Contact for Approvals

**New Dataset Requests:**
- Email: product@cryptoreportkit.com
- Include: Provider, mode, use case, plan gate

**Legal Questions:**
- Email: legal@cryptoreportkit.com
- CC: support@cryptoreportkit.com

---

## Version History

| Date | Change | Author |
|------|--------|--------|
| Jan 23, 2026 | Initial matrix created | Product Team |

---

**🔒 LOCKED:** This matrix is mandatory. No exceptions.
