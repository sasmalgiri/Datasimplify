import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

const ADMIN_EMAILS = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/* ------------------------------------------------------------------ */
/*  Seed personas — fake community members                             */
/* ------------------------------------------------------------------ */

interface SeedUser {
  display_name: string;
  avatar_emoji: string;
  is_verified: boolean;
}

const SEED_USERS: SeedUser[] = [
  { display_name: 'CryptoReportKit', avatar_emoji: '🚀', is_verified: true },
  { display_name: 'BitcoinMaxi', avatar_emoji: '₿', is_verified: false },
  { display_name: 'DeFi_Sarah', avatar_emoji: '👩‍💻', is_verified: false },
  { display_name: 'ChartWizard', avatar_emoji: '📊', is_verified: false },
  { display_name: 'OnChainAlpha', avatar_emoji: '🔗', is_verified: true },
  { display_name: 'CryptoNewbie23', avatar_emoji: '🌱', is_verified: false },
  { display_name: 'WhaleWatcher', avatar_emoji: '🐋', is_verified: false },
  { display_name: 'YieldFarmer_Pro', avatar_emoji: '🌾', is_verified: false },
  { display_name: 'SecurityFirst', avatar_emoji: '🛡️', is_verified: true },
  { display_name: 'MacroTrader', avatar_emoji: '🌍', is_verified: false },
];

/* ------------------------------------------------------------------ */
/*  Seed threads — real-world inspired content                         */
/* ------------------------------------------------------------------ */

interface SeedThread {
  category: string;
  title: string;
  body: string;
  is_pinned?: boolean;
  userIndex: number; // index into SEED_USERS
  replies: { body: string; userIndex: number }[];
  daysAgo: number; // for staggered dates
}

const SEED_THREADS: SeedThread[] = [
  // ──────────────── MARKET ANALYSIS ────────────────
  {
    category: 'market-analysis',
    title: 'Bitcoin Weekly Analysis — Key Support at $62K, Resistance at $68K',
    body: `Here's my weekly BTC analysis for the first week of March 2026.

After the sharp correction from $100K to $63K in late February, Bitcoin has been consolidating in a tight range between $62,000 and $68,000. Here's what I'm watching:

**Support Levels:**
- $62,000 — strong horizontal support, coincides with the 200-day SMA
- $58,500 — previous accumulation zone from October 2025
- $55,000 — psychological level + 0.618 Fibonacci retracement

**Resistance Levels:**
- $68,000 — local high from the dead cat bounce
- $72,500 — volume gap fill zone
- $78,000 — key breakdown level that needs to be reclaimed

**Volume Analysis:**
Volume has been declining during this consolidation, which usually precedes a big move. The CME gap at $65,200 was filled last week.

**My bias:** Cautiously bullish IF we hold $62K and break above $68K with volume. A break below $60K would shift my bias to bearish with a target of $55K.

What levels are you watching? Drop your analysis below.`,
    is_pinned: true,
    userIndex: 0,
    daysAgo: 0,
    replies: [
      { body: 'Great analysis. I agree that $62K is the line in the sand. The 200-day SMA confluence makes it extra strong. My RSI is showing bullish divergence on the 4H too.', userIndex: 3 },
      { body: 'I\'m watching the $60K level more closely. There\'s a massive options expiry next Friday at that strike. If market makers need to defend it, we could see a bounce.', userIndex: 9 },
      { body: 'On-chain data is interesting here — long-term holders are NOT selling. Exchange balances hit a 5-year low last week. Supply shock incoming?', userIndex: 4 },
    ],
  },
  {
    category: 'market-analysis',
    title: 'ETH/BTC Ratio at 0.028 — Is This the Bottom?',
    body: `The ETH/BTC ratio has dropped to 0.028, the lowest since early 2021. Let's analyze whether this is a generational buying opportunity or a sign of deeper problems.

**Bear Case:**
- Ethereum's revenue has dropped 90% since the Dencun upgrade (blobs made L2 transactions too cheap)
- Solana is eating ETH's market share in DeFi and NFTs
- ETH supply has turned inflationary again — "ultrasound money" narrative is dead

**Bull Case:**
- ETH/BTC ratio RSI is at 15 — deeply oversold territory
- Institutional adoption through spot ETH ETFs continues
- Ethereum still has the largest developer ecosystem by far
- L2 ecosystem (Base, Arbitrum, Optimism) is thriving even if L1 revenue drops

**Historical Context:**
Every time ETH/BTC hit extreme oversold levels (2019, 2022), it was followed by a massive ETH outperformance. The 2019 bottom at 0.016 preceded a 30x move.

I've started DCA'ing into ETH at these levels. Small positions, scaling in. What's your take?`,
    userIndex: 1,
    daysAgo: 1,
    replies: [
      { body: 'I\'ve been rotating some BTC into ETH at these levels. The risk/reward is too good. Even if ETH doesn\'t flip BTC, a reversion to 0.05 would be a 80% gain in BTC terms.', userIndex: 9 },
      { body: 'Hard disagree. ETH is losing the narrative war. SOL has better UX, faster transactions, and cheaper fees. I think ETH/BTC goes to 0.02 before any bounce.', userIndex: 6 },
    ],
  },
  {
    category: 'market-analysis',
    title: 'Fear & Greed Index at 19 — Extreme Fear. Time to Buy?',
    body: `The Crypto Fear & Greed Index hit 19 today — deep in "Extreme Fear" territory. Historically, readings below 20 have been some of the best buying opportunities.

Previous Extreme Fear readings and what happened next:
- March 2020 (COVID crash): Index hit 8 → BTC went from $5K to $64K
- June 2022 (Terra/Luna + 3AC): Index hit 6 → Bottom was in at $15.5K
- November 2022 (FTX collapse): Index hit 11 → Led to 2023-2024 bull run

The famous Warren Buffett quote applies: "Be greedy when others are fearful."

You can track the Fear & Greed Index live on CryptoReportKit's Sentiment Dashboard — it updates every 4 hours with historical overlays.

Are you buying this dip or waiting for lower? Let me know your strategy.`,
    userIndex: 0,
    daysAgo: 0,
    replies: [
      { body: 'Buying the fear. I\'ve been DCA\'ing $200/week into BTC since it dropped below $70K. My average buy is around $66K. Not trying to time the bottom perfectly.', userIndex: 1 },
      { body: 'I\'m waiting. The macro environment is different this time — tariffs, rate hike fears, tech selloff. I want to see capitulation volume before I deploy capital.', userIndex: 9 },
      { body: 'As a newbie, this is terrifying lol. But I\'ve been reading about DCA and I think that\'s the smart approach rather than going all in.', userIndex: 5 },
    ],
  },

  // ──────────────── TRADING STRATEGIES ────────────────
  {
    category: 'trading-strategies',
    title: 'How I Use CryptoReportKit DataLab Confluence Strategy',
    body: `I've been using the Confluence Strategy in DataLab for the past 3 months and wanted to share my setup and results.

**My Configuration:**
- Mode: Simple
- Strategy: Confluence Zones
- Indicators: SMA 50/200 crossover + RSI 14 + Volume confirmation
- Timeframe: Daily chart

**How It Works:**
The confluence strategy looks for zones where multiple indicators agree. A "buy zone" forms when:
1. Price is above the 200-day SMA (uptrend)
2. RSI drops below 35 (oversold)
3. Volume spikes above the 20-day average (capitulation)

When all 3 conditions align, that's your entry. I place my stop-loss 3% below the confluence zone.

**Results (Dec 2025 - Feb 2026):**
- 7 trades taken
- 5 winners, 2 losers
- Average win: +8.2%
- Average loss: -3.1%
- Win rate: 71%
- Net profit: +34.8%

The key is patience. Sometimes you wait 2-3 weeks for a setup. But when the confluence lines up, the probability is heavily in your favor.

Try it out: DataLab → Simple Mode → Confluence Zones. Let me know if you have questions!`,
    is_pinned: true,
    userIndex: 0,
    daysAgo: 2,
    replies: [
      { body: 'This is exactly how I trade too. The confluence approach removes so much emotional noise. I also add Bollinger Bands as a 4th confirmation.', userIndex: 3 },
      { body: 'Do you use this for altcoins too or just BTC? I tried it on SOL and the signals seem less reliable.', userIndex: 5 },
      { body: 'For altcoins, I switch to the Momentum Divergence strategy. It catches the altcoin pumps better. Confluence works best on large-cap coins with clean price action.', userIndex: 0 },
    ],
  },
  {
    category: 'trading-strategies',
    title: 'RSI Divergence Strategy — My Favorite Setup for Reversals',
    body: `RSI divergence is probably the most underrated reversal signal in crypto. Here's my complete playbook.

**What is RSI Divergence?**
When price makes a new low/high but RSI doesn't confirm it. This shows momentum is weakening and a reversal may be coming.

**Bullish Divergence (buy signal):**
- Price makes a lower low
- RSI makes a higher low
- Best on 4H or daily timeframe

**Bearish Divergence (sell signal):**
- Price makes a higher high
- RSI makes a lower high

**My Rules:**
1. Only trade divergences in the direction of the higher timeframe trend
2. Wait for RSI to cross back above/below 50 for confirmation
3. Enter on the first candle close after confirmation
4. Stop-loss below the most recent swing low (for longs)
5. Take profit at 2:1 risk-reward minimum

**Recent Example:**
BTC on Feb 20-25 formed a beautiful bullish divergence on the daily. Price made a lower low at $63K while RSI bottomed higher. The bounce to $67K was a clean 6% move.

You can spot these automatically using DataLab's Intermediate mode — the Momentum Divergence preset highlights them for you.`,
    userIndex: 3,
    daysAgo: 1,
    replies: [
      { body: 'RSI divergence + volume divergence is chef\'s kiss. If volume is also declining on the new low, the reversal signal is much stronger.', userIndex: 4 },
      { body: 'How do you handle false divergences? I feel like crypto gives so many fake outs especially on lower timeframes.', userIndex: 5 },
    ],
  },
  {
    category: 'trading-strategies',
    title: 'My Backtesting Results: Mean Reversion on BTC (2023-2026)',
    body: `Just ran a 3-year backtest using DataLab's Advanced mode on BTC mean reversion. Here are the results.

**Strategy:**
- Buy when BTC drops more than 2 standard deviations below the 20-day Bollinger Band
- Sell when price returns to the middle band (20-day SMA)
- Stop-loss at 3 standard deviations

**Backtest Parameters:**
- Period: Jan 2023 — Feb 2026
- Starting capital: $10,000
- Position size: 100% per trade
- Commission: 0.1%

**Results:**
- Total trades: 23
- Winners: 17 (73.9% win rate)
- Average win: +5.4%
- Average loss: -4.8%
- Max drawdown: -12.3%
- Total return: +89.2% ($10,000 → $18,920)
- Sharpe ratio: 1.82

**Key Insight:**
Mean reversion works incredibly well on BTC during bull markets but gets destroyed during macro crashes (the Feb 2026 crash caused the max drawdown). Adding a 200-day SMA filter (only take longs above it) would have avoided the worst trades.

The backtester in DataLab Advanced mode is seriously powerful. Highly recommend testing your strategies before risking real money.`,
    userIndex: 6,
    daysAgo: 3,
    replies: [
      { body: 'Great backtest. That 200-day SMA filter tip is gold. I wonder what the results look like if you add a fear & greed index filter too — only buy when F&G is below 30.', userIndex: 9 },
      { body: 'Did you account for slippage? 100% position sizing with a stop at 3 sigma could have slippage issues during volatile moves.', userIndex: 3 },
    ],
  },

  // ──────────────── DEFI & YIELD ────────────────
  {
    category: 'defi-yield',
    title: 'Best Stablecoin Yield Strategies in March 2026',
    body: `With the market in fear mode, parking capital in stablecoins with yield is a smart move. Here's what I'm earning right now:

**Tier 1 — Low Risk (3-6% APY):**
- Aave V3 (USDC on Ethereum): 4.8% APY
- Compound V3 (USDC): 4.2% APY
- MakerDAO DSR (DAI): 5.0% APY
- These are battle-tested protocols with billions in TVL

**Tier 2 — Medium Risk (6-12% APY):**
- Ethena sUSDe: 8.5% APY (basis trade backed)
- Morpho Blue (USDC vaults): 7.2% APY
- Pendle fixed-rate USDC: 6.8% APY (locked 3 months)

**Tier 3 — Higher Risk (12%+ APY):**
- Hyperliquid USDC vault: 15-20% APY (market making)
- Curve/Convex stablecoin pools: 10-15% APY (with CRV rewards)
- Newer L2 lending protocols: 12-18% APY (lower TVL, less battle-tested)

**My Allocation:**
- 60% in Tier 1 (capital preservation)
- 30% in Tier 2 (moderate yield boost)
- 10% in Tier 3 (degen yield)

Always check smart contract risk. Even "safe" protocols can get exploited. Never put more than 25% of your stables in any single protocol.

What's your stablecoin strategy?`,
    is_pinned: true,
    userIndex: 7,
    daysAgo: 0,
    replies: [
      { body: 'I stick to Tier 1 only. After the UST/Luna collapse, I don\'t chase yield anymore. 5% on USDC is fine when the stock market barely beats that.', userIndex: 1 },
      { body: 'Ethena has been solid. The basis trade backing makes sense in theory and it\'s held up well through this crash. But I only allocate 10% there.', userIndex: 4 },
      { body: 'Don\'t forget about Pendle! You can lock in a fixed rate and know exactly what you\'ll earn. Great for risk-averse capital.', userIndex: 7 },
    ],
  },
  {
    category: 'defi-yield',
    title: 'Liquid Staking Comparison: stETH vs rETH vs cbETH',
    body: `If you're holding ETH long-term, you should be earning staking yield. Here's my comparison of the top liquid staking tokens.

**Lido stETH:**
- Market share: ~30% of staked ETH
- APY: 3.2%
- Peg stability: Excellent (0.1% discount typical)
- DeFi integrations: Best — accepted everywhere
- Concern: Centralization (too much market share?)

**Rocket Pool rETH:**
- Market share: ~3% of staked ETH
- APY: 3.0%
- Peg stability: Good (trades at slight premium)
- DeFi integrations: Growing but less than stETH
- Advantage: Most decentralized — permissionless node operators

**Coinbase cbETH:**
- Market share: ~8% of staked ETH
- APY: 2.8% (Coinbase takes larger fee)
- Peg stability: Good
- DeFi integrations: Moderate
- Advantage: Institutional trust, Coinbase brand

**My Pick:** stETH for DeFi utility (you can use it as collateral on Aave), rETH for ideological alignment with decentralization.

Don't sleep on staking yield. Even at 3%, it compounds nicely over years. And you maintain full ETH exposure.`,
    userIndex: 7,
    daysAgo: 2,
    replies: [
      { body: 'rETH gang. I don\'t care that the yield is slightly lower — supporting decentralization is worth it. Lido having 30% of staked ETH is a systemic risk.', userIndex: 1 },
    ],
  },

  // ──────────────── SECURITY & SCAMS ────────────────
  {
    category: 'security-scams',
    title: 'How to Verify Smart Contracts Before Investing — Complete Guide',
    body: `Before aping into any DeFi protocol or token, ALWAYS verify the smart contract. Here's my step-by-step checklist:

**Step 1: Check if the contract is verified on Etherscan**
- Go to the contract address on Etherscan
- Look for the green checkmark next to "Contract"
- If it's NOT verified — RED FLAG. Never interact with unverified contracts.

**Step 2: Check the audit reports**
- Look for audits from reputable firms: Trail of Bits, OpenZeppelin, Certora, Spearbit
- Multiple audits are better than one
- Check when the audit was done — if the code changed since, the audit may not cover new code

**Step 3: Check the permissions**
- Does the contract have an "owner" who can change critical parameters?
- Can the owner mint unlimited tokens? Pause transfers? Change fees?
- Use CryptoReportKit's Smart Contract Verifier tool to check automatically

**Step 4: Check the token distribution**
- Is the team holding 50%+ of supply? That's a rug risk.
- Is liquidity locked? For how long?
- Are there large holders who could dump?

**Step 5: Check social signals**
- Is the team doxxed (known identities)?
- How old is the project's Twitter/Discord?
- Is there organic community activity or just bots?

**Red Flags:**
❌ Anonymous team with no track record
❌ No audit
❌ Unverified contract
❌ "100x guaranteed" marketing
❌ Liquidity not locked
❌ Team can mint tokens

Stay safe out there. One extra minute of research can save you thousands.`,
    is_pinned: true,
    userIndex: 8,
    daysAgo: 1,
    replies: [
      { body: 'Adding to this: always test with a small transaction first. Send $10 before sending $10,000. And use a separate wallet for DeFi — not your main holdings wallet.', userIndex: 4 },
      { body: 'The CryptoReportKit Smart Contract Verifier is really helpful for step 3. It automatically checks ownership, permissions, and common vulnerability patterns.', userIndex: 0 },
      { body: 'I got rugged on a "audited" project last year. The audit was from a no-name firm. Always check if the auditor is reputable, not just that an audit exists.', userIndex: 5 },
    ],
  },
  {
    category: 'security-scams',
    title: '⚠️ Warning: Fake CoinGecko Airdrop Emails Going Around',
    body: `PSA: There are phishing emails circulating that look like they're from CoinGecko, claiming you're eligible for a token airdrop.

**What the scam looks like:**
- Email from "airdrop@coingecko.com" (spoofed address)
- Claims you qualify for a "CoinGecko Token" airdrop
- Links to a fake website that asks you to connect your wallet
- Once connected, it requests token approval that drains your wallet

**How to protect yourself:**
1. CoinGecko does NOT have a token and is NOT doing airdrops
2. Never click links in emails — go directly to coingecko.com
3. If you connected your wallet to a suspicious site, revoke approvals immediately at revoke.cash
4. Report the phishing email to your email provider

**If you've been affected:**
- Immediately revoke all token approvals at revoke.cash
- Transfer remaining funds to a new wallet
- Report to the platform where you saw the scam

Please share this to protect others. These scams get more sophisticated every month.`,
    userIndex: 8,
    daysAgo: 0,
    replies: [
      { body: 'Thanks for the warning. I almost clicked it. The email looked so legitimate with CoinGecko branding and everything.', userIndex: 5 },
      { body: 'Pro tip: bookmark all your DeFi sites and ONLY access them via bookmarks. Never through search results or email links.', userIndex: 4 },
    ],
  },

  // ──────────────── EDUCATION ────────────────
  {
    category: 'education',
    title: 'Complete Beginner\'s Guide to Reading Crypto Charts',
    body: `Welcome! If you're new to crypto and charts look like gibberish, this guide is for you.

**Candlestick Basics:**
Each candle shows 4 prices for a time period:
- Open: where the price started
- Close: where it ended
- High: highest point
- Low: lowest point

Green/white candle = price went UP (close > open)
Red/black candle = price went DOWN (close < open)

**Key Concepts:**

**1. Support & Resistance**
- Support = a price level where buying pressure is strong (price bounces up)
- Resistance = a price level where selling pressure is strong (price bounces down)
- The more times a level is tested, the stronger it is

**2. Trend Lines**
- Connect two or more lows for an uptrend line
- Connect two or more highs for a downtrend line
- Price tends to respect these lines until they break

**3. Moving Averages**
- SMA 50 = average price of last 50 candles (short-term trend)
- SMA 200 = average price of last 200 candles (long-term trend)
- When SMA 50 crosses above SMA 200 = "Golden Cross" (bullish)
- When SMA 50 crosses below SMA 200 = "Death Cross" (bearish)

**4. Volume**
- Volume shows how many coins were traded
- Rising price + rising volume = strong move
- Rising price + falling volume = weak move (potential reversal)

**Practice:**
Go to CryptoReportKit DataLab, pick "Simple Mode" → "Price Trends" strategy. It will overlay these indicators automatically so you can start recognizing patterns.

Ask any questions below!`,
    is_pinned: true,
    userIndex: 0,
    daysAgo: 3,
    replies: [
      { body: 'This is so helpful! I\'ve been watching crypto YouTube but they never explain the basics this clearly. What timeframe should a beginner use?', userIndex: 5 },
      { body: 'For beginners, I recommend the daily chart. Lower timeframes (1H, 15min) have too much noise. Start with daily, get comfortable, then zoom in later.', userIndex: 3 },
      { body: 'Don\'t forget to learn about RSI too! It tells you when something is "overbought" or "oversold". Very useful for beginners to know when NOT to buy.', userIndex: 9 },
    ],
  },
  {
    category: 'education',
    title: 'What Is Dollar-Cost Averaging (DCA) and Why It Works',
    body: `DCA is the simplest and most effective investment strategy, especially for beginners who don't want to time the market.

**How DCA Works:**
Instead of buying $1,200 of BTC all at once, you buy $100 every week for 12 weeks. This spreads your entry price across different market conditions.

**Why It Works:**
- Removes emotion from investing (no "should I buy now or wait?")
- Automatically buys more when prices are low, less when high
- Historical data shows DCA beats lump-sum buying in most volatile markets
- You can start with any amount — even $10/week

**Real Example:**
If you DCA'd $100/week into BTC for all of 2025:
- Total invested: $5,200
- Your average buy price: ~$74,000
- BTC price at year end: ~$93,000
- Your return: +25.7%

Even through the crashes and rallies, DCA smoothed everything out.

**How to DCA with CryptoReportKit:**
Use the Portfolio tracker to log your recurring purchases and monitor your average cost basis. The COST_BASIS function calculates it automatically.

**When to STOP DCA'ing:**
Honestly? Many people DCA forever into BTC. But if you want to take profits, a common approach is to stop DCA'ing when the Fear & Greed Index goes above 80 (Extreme Greed) and resume when it drops below 30.

Questions welcome!`,
    userIndex: 0,
    daysAgo: 4,
    replies: [
      { body: 'I started DCA\'ing $50/week into BTC and $25/week into ETH since January. Down a bit right now but I know this strategy works long-term. Diamond hands!', userIndex: 5 },
      { body: 'The F&G index filter for when to pause/resume DCA is smart. I\'d add: also consider DCA\'ing harder (2x your normal amount) when F&G drops below 15.', userIndex: 9 },
    ],
  },

  // ──────────────── GENERAL ────────────────
  {
    category: 'general',
    title: 'Introduce Yourself — New Members Welcome! 👋',
    body: `Welcome to the CryptoReportKit Community Forum!

Whether you're a seasoned trader, a DeFi degen, or just starting your crypto journey — you belong here.

**Drop a reply and tell us:**
1. Where you're from (country/region is fine, no need for specifics)
2. How long you've been in crypto
3. What coins/tokens are you most interested in?
4. What brought you to CryptoReportKit?

I'll go first:
- CryptoReportKit team, building tools to make crypto data accessible to everyone
- Been in crypto since 2017
- Mostly BTC and ETH, but fascinated by the entire ecosystem
- Building this platform because crypto data should be free and transparent

Looking forward to meeting everyone! 🙌`,
    is_pinned: true,
    userIndex: 0,
    daysAgo: 5,
    replies: [
      { body: 'Hey everyone! I\'m from India, been in crypto since 2021. Mostly into BTC and SOL. Found CryptoReportKit through a Google search for "free crypto dashboard" — been hooked since!', userIndex: 5 },
      { body: 'Trader from the UK. 4 years in crypto. I use CRK mainly for the DataLab confluence strategy and the Excel add-in for portfolio tracking. Great tools!', userIndex: 3 },
      { body: 'DeFi researcher here. Love the DeFi dashboards on CRK. The protocol comparison data is really well organized. Happy to contribute analysis to the community.', userIndex: 7 },
      { body: 'Security researcher and smart contract auditor. Glad to see a security section here. Will be posting educational content about staying safe in DeFi.', userIndex: 8 },
    ],
  },
  {
    category: 'general',
    title: 'Which Crypto Projects Are You Most Bullish On for 2026-2027?',
    body: `With the market in correction mode, it's a good time to zoom out and think about which projects will thrive in the next bull cycle.

**My picks (not financial advice!):**

1. **Bitcoin** — The king isn't going anywhere. Institutional adoption through ETFs is a permanent structural change. Every 4-year cycle, BTC makes a new high.

2. **Solana** — Love it or hate it, SOL has the best UX and developer momentum right now. DePIN, DeFi, and meme coins are all thriving on Solana.

3. **Chainlink (LINK)** — The oracle problem isn't going away. Every DeFi protocol needs price feeds, and LINK dominates. Plus, CCIP (cross-chain) is huge.

4. **Real-World Asset (RWA) tokens** — This is the next trillion-dollar narrative. Tokenizing bonds, real estate, and commodities. Watch ONDO, MKR, and AAVE.

5. **AI x Crypto** — Still early but the intersection of AI and blockchain is fascinating. Decentralized compute, AI agents with wallets, etc.

What are YOUR picks? Reply with your top 3 and why!`,
    userIndex: 1,
    daysAgo: 1,
    replies: [
      { body: 'BTC, ETH, and LINK for me. Boring but effective. I don\'t need 100x, I need 3-5x with high conviction.', userIndex: 9 },
      { body: 'SOL and SUI are my main bets for L1s. For DeFi, I like AAVE and Pendle. And for a small moonshot allocation: RENDER for the AI compute narrative.', userIndex: 7 },
      { body: 'BTC only. Everything else is noise. Come back in 10 years and tell me your altcoin portfolio beat BTC.', userIndex: 1 },
    ],
  },
  {
    category: 'general',
    title: 'US Crypto Regulation Update — March 2026',
    body: `Quick summary of where we stand on US crypto regulation:

**Positive Developments:**
- Stablecoin bill (GENIUS Act) is progressing through the Senate
- SEC has approved several more spot crypto ETFs (SOL ETF approved in January)
- The SEC's new crypto task force is engaging with industry
- Most enforcement actions are focused on clear fraud, not on DeFi/DEXs

**Concerns:**
- New tariff uncertainty is creating macro headwinds for all risk assets
- IRS crypto reporting requirements (1099-DA) start for 2026 tax year
- Some states are trying to impose their own crypto regulations
- Stablecoin reserves requirements could restrict yield strategies

**Impact on Traders:**
- More regulated on/off ramps = easier to cash out
- Tax reporting is getting stricter = keep better records
- Institutional money continues flowing in through ETFs
- DeFi is still mostly unregulated (for now)

I use CryptoReportKit's TAX_SUMMARY function in the Excel add-in to track my cost basis. Highly recommend setting it up before tax season hits.

Thoughts on the regulatory landscape?`,
    userIndex: 9,
    daysAgo: 0,
    replies: [
      { body: 'The stablecoin bill is bullish. Clear regulation = institutional adoption = more money flowing in. Short-term pain (compliance), long-term gain.', userIndex: 4 },
      { body: 'Keep an eye on the EU\'s MiCA regulation too. It\'s already live and could become a template for other countries.', userIndex: 8 },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Seed handler                                                       */
/* ------------------------------------------------------------------ */

export async function POST(request: NextRequest) {
  if (!supabaseAdmin) {
    return NextResponse.json({ error: 'supabaseAdmin not configured' }, { status: 503 });
  }

  // Verify admin access
  const authHeader = request.headers.get('authorization');
  const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // Simple admin check — accept either the service key or check admin email
  if (authHeader !== `Bearer ${adminKey}`) {
    // Fallback: check if a secret query param matches
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    if (secret !== adminKey?.slice(0, 20)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    // Step 1: Get the admin user ID from auth.users
    const adminEmail = ADMIN_EMAILS[0];
    if (!adminEmail) {
      return NextResponse.json({ error: 'No admin email configured' }, { status: 500 });
    }

    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
    if (authError) {
      return NextResponse.json({ error: `Auth error: ${authError.message}` }, { status: 500 });
    }

    const adminUser = authUsers.users.find(
      (u) => u.email?.toLowerCase() === adminEmail
    );
    if (!adminUser) {
      return NextResponse.json({ error: `Admin user ${adminEmail} not found` }, { status: 500 });
    }

    const adminUserId = adminUser.id;

    // Step 2: Create user_prediction_stats entries for all seed personas
    // All threads are created under the admin user_id but with different display_names
    // We'll create them all under the admin ID for simplicity
    await (supabaseAdmin.from('user_prediction_stats') as any).upsert(
      {
        user_id: adminUserId,
        display_name: 'CryptoReportKit',
        avatar_emoji: '🚀',
        is_verified: true,
      },
      { onConflict: 'user_id' }
    );

    // Step 3: Check if already seeded
    const { count } = await (supabaseAdmin.from('forum_threads') as any)
      .select('id', { count: 'exact', head: true });

    if (count && count > 0) {
      return NextResponse.json({
        success: false,
        error: `Forum already has ${count} threads. Delete existing threads first or skip seeding.`,
      }, { status: 409 });
    }

    // Step 4: Insert threads
    const results: { threadId: string; title: string; replies: number }[] = [];

    for (const seed of SEED_THREADS) {
      const createdAt = new Date(Date.now() - seed.daysAgo * 24 * 60 * 60 * 1000);
      const lastActivity = seed.replies.length > 0
        ? new Date(createdAt.getTime() + (seed.replies.length * 2 * 60 * 60 * 1000))
        : createdAt;

      const { data: thread, error: threadError } = await (supabaseAdmin.from('forum_threads') as any)
        .insert({
          user_id: adminUserId,
          category: seed.category,
          title: seed.title,
          body: seed.body,
          is_pinned: seed.is_pinned || false,
          view_count: Math.floor(Math.random() * 3000) + 200,
          likes: Math.floor(Math.random() * 30) + 5,
          created_at: createdAt.toISOString(),
          last_activity_at: lastActivity.toISOString(),
          updated_at: createdAt.toISOString(),
        })
        .select('id')
        .single();

      if (threadError) {
        console.error(`Error creating thread "${seed.title}":`, threadError);
        continue;
      }

      // Insert replies
      let repliesInserted = 0;
      for (let i = 0; i < seed.replies.length; i++) {
        const reply = seed.replies[i];
        const replyDate = new Date(createdAt.getTime() + ((i + 1) * 2 * 60 * 60 * 1000));

        const { error: replyError } = await (supabaseAdmin.from('forum_replies') as any)
          .insert({
            thread_id: thread.id,
            user_id: adminUserId,
            body: reply.body,
            likes: Math.floor(Math.random() * 15),
            created_at: replyDate.toISOString(),
            updated_at: replyDate.toISOString(),
          });

        if (!replyError) repliesInserted++;
      }

      results.push({
        threadId: thread.id,
        title: seed.title,
        replies: repliesInserted,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Seeded ${results.length} threads with replies`,
      data: results,
    });
  } catch (error) {
    console.error('Forum seed error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
