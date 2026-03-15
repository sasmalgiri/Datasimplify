export interface CryptoMyth {
  id: string;
  number: number;
  title: string;
  whatTheySay: string;
  theReality: string;
  whyItMatters: string;
  realExample: string;
  dangerLevel: 1 | 2 | 3;
  relatedGlossaryTerms: string[];
  relatedBlogSlugs: string[];
  icon: string;
  category: 'price' | 'risk' | 'defi' | 'influence' | 'fundamentals' | 'security' | 'trading';
}

export const CRYPTO_MYTHS: CryptoMyth[] = [
  {
    id: 'cheap-coin-fallacy',
    number: 1,
    title: 'The Cheap Coin Fallacy',
    whatTheySay:
      '"This coin is only $0.001 — if it hits just $1, I\'m a millionaire! It\'s so cheap compared to Bitcoin!"',
    theReality:
      'A coin\'s unit price tells you nothing about its value or growth potential. What matters is market cap (price × circulating supply). A $0.001 coin with 100 billion tokens already has a $100 million market cap. For it to reach $1, it would need a $100 billion market cap — that\'s larger than 99.9% of all cryptocurrencies ever created.',
    whyItMatters:
      'This is called "unit bias" — our brains prefer owning 1 million of something over 0.01 of something, even when the latter is worth more. YouTube influencers exploit this by promoting low-price tokens to audiences who confuse cheap price with cheap valuation. The math simply doesn\'t work for most of these tokens.',
    realExample:
      'Shiba Inu has ~589 trillion tokens in circulation. At $0.00001, its market cap is already ~$5.9 billion. For SHIB to reach $1, its market cap would need to be $589 trillion — roughly 5× the entire global GDP. Mathematically impossible.',
    dangerLevel: 3,
    relatedGlossaryTerms: ['market-cap', 'circulating-supply', 'fully-diluted-valuation'],
    relatedBlogSlugs: ['cheap-coin-fallacy-market-cap-math'],
    icon: '💰',
    category: 'price',
  },
  {
    id: 'market-cap-confusion',
    number: 2,
    title: 'Market Cap Confusion',
    whatTheySay:
      '"XRP is only $0.50 — imagine when it reaches Ethereum\'s price of $3,000! That\'s a 6,000× return!"',
    theReality:
      'Comparing unit prices between different coins is meaningless. XRP at $0.50 with 53 billion tokens has a ~$26.5 billion market cap. Ethereum at $3,000 with 120 million tokens has a ~$360 billion market cap. For XRP to reach $3,000 per token, its market cap would be $159 trillion. The correct comparison is always market cap to market cap, never price to price.',
    whyItMatters:
      'YouTubers frequently compare coin prices without mentioning supply, creating a false impression that lower-priced coins have more "room to grow." This leads beginners to overweight low-price, high-supply tokens in their portfolios while ignoring the actual valuation math.',
    realExample:
      'If Dogecoin (140 billion supply) reached Bitcoin\'s price of $60,000, its market cap would be $8.4 quadrillion — more than all wealth on Earth combined. Market cap, not unit price, determines how much "room" a coin has to grow.',
    dangerLevel: 3,
    relatedGlossaryTerms: ['market-cap', 'circulating-supply', 'total-supply'],
    relatedBlogSlugs: ['market-cap-explained-why-shiba-cant-reach-one-dollar'],
    icon: '📊',
    category: 'price',
  },
  {
    id: 'guaranteed-returns',
    number: 3,
    title: 'Guaranteed Returns',
    whatTheySay:
      '"Crypto always goes up long term. Just buy and hold — you can\'t lose if you wait long enough!"',
    theReality:
      'Survivorship bias distorts this narrative. You only hear about Bitcoin going from $1 to $60,000 — not the thousands of coins that went to zero. CoinGecko has listed 13,000+ tokens; the majority are now dead or illiquid. Even Bitcoin has had 80%+ drawdowns lasting years. "Long term" is doing a lot of heavy lifting when individual coins can — and do — go to zero permanently.',
    whyItMatters:
      'The "crypto always recovers" narrative is based almost entirely on Bitcoin\'s track record, which gets applied to all coins. This gives beginners a false sense of safety, leading them to hold dying projects far too long and ignore basic risk management like position sizing and stop-losses.',
    realExample:
      'Luna/Terra went from $119 to $0.00001 in 72 hours in May 2022, wiping out ~$40 billion. Holders who "bought the dip" at $50 lost 99.99%. FTT (FTX token) went from $25 to $1 permanently. "Just hold" doesn\'t work when the fundamentals collapse.',
    dangerLevel: 3,
    relatedGlossaryTerms: ['volatility', 'drawdown', 'risk-management'],
    relatedBlogSlugs: ['buy-the-dip-strategy-dangers'],
    icon: '📈',
    category: 'risk',
  },
  {
    id: 'defi-yield-fantasy',
    number: 4,
    title: 'DeFi Yield Fantasy',
    whatTheySay:
      '"Get 1,000% APY on this DeFi protocol — it\'s like a savings account but way better! Passive income!"',
    theReality:
      'Sustainable DeFi yields on stablecoins are typically 2-8%. Anything above 15-20% carries significant risk. High APYs usually come from: (1) token emissions that dilute your position, (2) liquidity provision with impermanent loss risk, (3) unsustainable ponzi-like mechanics, or (4) smart contract risk that could drain all deposited funds. If you can\'t explain where the yield comes from in one sentence, you are the yield.',
    whyItMatters:
      'Finance-to-crypto YouTubers presented DeFi yields as "better than savings accounts" without explaining the risks. Anchor Protocol offered ~20% on UST, attracted $17 billion, then collapsed entirely — wiping out life savings. High yields always mean high risk.',
    realExample:
      'Anchor Protocol promised 19.5% APY on UST stablecoin. YouTubers called it "the best savings account in crypto." In May 2022, UST depegged and Luna collapsed. $17 billion in deposits evaporated. People who moved their retirement savings into Anchor lost everything.',
    dangerLevel: 3,
    relatedGlossaryTerms: ['defi', 'impermanent-loss', 'smart-contract', 'apy'],
    relatedBlogSlugs: ['defi-yield-farming-risks-beginners'],
    icon: '🌾',
    category: 'defi',
  },
  {
    id: 'buy-the-dip-danger',
    number: 5,
    title: 'Buy-the-Dip Danger',
    whatTheySay:
      '"The price dropped 50% — this is a gift! Buy the dip! Discounted crypto!"',
    theReality:
      '"Buy the dip" only works if the underlying asset is fundamentally sound and the drop is market-wide, not asset-specific. A 50% drop can easily become a 95% drop if the project has fundamental problems. You must distinguish between: (a) a healthy correction in a bull market, (b) a bear market decline with further downside, and (c) a structural collapse where recovery is impossible.',
    whyItMatters:
      '"Buy the dip" has become a meme that removes critical thinking. YouTubers use it as a default response to any price drop, encouraging beginners to throw money at declining assets without analyzing why the price is falling. This turns portfolio management into gambling.',
    realExample:
      'People who "bought the dip" on Luna at $50 (down from $119) watched it fall to $0.00001. Those who bought FTT at $15 (down from $25) saw it drop to $1. Meanwhile, those who bought Bitcoin at $30,000 in the 2022 bear market (down from $69,000) eventually saw it recover. The difference? Fundamental analysis, not blind dip-buying.',
    dangerLevel: 2,
    relatedGlossaryTerms: ['drawdown', 'bear-market', 'dca'],
    relatedBlogSlugs: ['buy-the-dip-strategy-dangers'],
    icon: '📉',
    category: 'risk',
  },
  {
    id: 'influencer-pump-schemes',
    number: 6,
    title: 'Influencer Pump Schemes',
    whatTheySay:
      '"This YouTuber I trust recommended this coin — they wouldn\'t risk their reputation on a bad project!"',
    theReality:
      'Many crypto influencers are paid to promote tokens without adequate disclosure. The typical scheme: influencer receives tokens or payment → promotes to audience → audience buys, price rises → influencer sells into the demand → price crashes. On-chain blockchain data frequently shows influencer wallets selling within hours of promotion. The FTC has been slow to enforce disclosure rules in crypto.',
    whyItMatters:
      'Beginners treat YouTubers as trusted financial advisors. The "not financial advice" disclaimer is used as a legal shield while functionally giving financial advice. Every recommendation should be assumed to have a financial incentive behind it until proven otherwise.',
    realExample:
      'Multiple documented cases include the SaveTheKids token (FaZe Clan members), hundreds of Solana meme coins, and numerous "gem" picks where the promoter\'s wallet was caught selling within hours. BitBoy Crypto was sued by investors and eventually removed from his own brand over paid promotions.',
    dangerLevel: 3,
    relatedGlossaryTerms: ['rug-pull', 'pump-and-dump', 'dyor'],
    relatedBlogSlugs: ['crypto-influencer-pump-schemes-protect-yourself'],
    icon: '🎭',
    category: 'influence',
  },
  {
    id: 'past-performance-prophecy',
    number: 7,
    title: 'Past Performance Prophecy',
    whatTheySay:
      '"Bitcoin went from $1 to $60,000 — this new altcoin could do the same! Early Bitcoin investors became millionaires!"',
    theReality:
      'Bitcoin\'s rise happened in unique circumstances: first mover advantage, network effect, 15 years of survival, institutional adoption, and a fixed 21 million supply cap. New altcoins operate in a saturated market with 13,000+ competitors. Over 90% of altcoins launched in any given year underperform Bitcoin over a 3-year period. Most go to zero.',
    whyItMatters:
      'Cherry-picked examples (Solana from $1 to $250, Matic from $0.01 to $2.90) ignore the thousands of failures. For every 100x winner, there are hundreds of coins that lost 99%+. YouTubers show the winners, never the graveyard.',
    realExample:
      'Of the top 100 coins by market cap in 2017, fewer than 20 are still in the top 100 today. The rest fell 90-100% and never recovered. Meanwhile, YouTube only features the survivors — creating a massive survivorship bias that makes 100x gains seem common when they\'re extremely rare.',
    dangerLevel: 2,
    relatedGlossaryTerms: ['altcoin', 'market-cap', 'volatility'],
    relatedBlogSlugs: ['cheap-coin-fallacy-market-cap-math'],
    icon: '🔮',
    category: 'fundamentals',
  },
  {
    id: 'diamond-hands-delusion',
    number: 8,
    title: 'Diamond Hands Delusion',
    whatTheySay:
      '"Never sell! Diamond hands! If you sell, you\'re weak — real investors HODL forever!"',
    theReality:
      'Blindly holding through every decline is not a strategy — it\'s the absence of a strategy. Professional investors take profits at predetermined targets, rebalance portfolios, and cut losses on positions where the thesis has changed. "HODL" culture discourages the critical thinking that separates investing from hoping.',
    whyItMatters:
      'The "diamond hands" meme creates social pressure against selling — even when selling is the rational decision. Beginners who could have preserved capital by selling at a 20% loss end up holding to a 95% loss because their community shamed them for considering an exit.',
    realExample:
      'Celsius Network token holders who "diamond handed" from $7 to $0.15 lost 98%. Those who sold at $5 (accepting a 30% loss) preserved most of their capital. Taking a small loss is not weakness — it\'s risk management. The best investors have exit plans before they enter a position.',
    dangerLevel: 2,
    relatedGlossaryTerms: ['risk-management', 'stop-loss', 'portfolio-rebalancing'],
    relatedBlogSlugs: [],
    icon: '💎',
    category: 'risk',
  },
  {
    id: 'whitepaper-legitimacy',
    number: 9,
    title: 'Whitepaper = Legitimacy',
    whatTheySay:
      '"The project has a 50-page whitepaper, a professional website, and a doxxed team — it must be legit!"',
    theReality:
      'Anyone can write a whitepaper, hire a web designer, and put fake LinkedIn profiles together. A whitepaper is a marketing document, not a guarantee of legitimacy. What actually matters: is there working code (check GitHub)? Are there real users? Is there on-chain activity? Has the smart contract been audited by a reputable firm? Do the tokenomics make mathematical sense?',
    whyItMatters:
      'YouTubers often "research" a project by reading its whitepaper and website — which are marketing materials created by the project itself. This creates a circular logic: "the project says it\'s good, therefore it\'s good." Real due diligence requires checking independent sources.',
    realExample:
      'OneCoin had a professional website, a "whitepaper," global events, and celebrity endorsements. It was a $4 billion Ponzi scheme with no actual blockchain. Bitconnect had a whitepaper promising guaranteed daily returns of 1% — it collapsed and its founders were charged with fraud.',
    dangerLevel: 2,
    relatedGlossaryTerms: ['dyor', 'smart-contract', 'audit'],
    relatedBlogSlugs: [],
    icon: '📄',
    category: 'fundamentals',
  },
  {
    id: 'low-supply-moon',
    number: 10,
    title: 'Low Supply = Guaranteed Moon',
    whatTheySay:
      '"Only 1 million tokens total supply — it\'s ultra scarce, so the price has to go up!"',
    theReality:
      'Scarcity alone does not create value. There must be demand. You could create a token with a supply of 1, but if nobody wants it, it\'s worth zero. Additionally, many "low supply" tokens have hidden inflation: team tokens that vest over time, ecosystem incentives, staking rewards, or governance votes that can increase supply. Always check the difference between circulating supply, total supply, and max supply.',
    whyItMatters:
      'Confusing scarcity with value is one of the most common beginner mistakes. Bitcoin\'s 21 million cap works because of massive demand built over 15 years. A random new token with 1 million supply and no users has nothing in common with Bitcoin except a number.',
    realExample:
      'Thousands of tokens launch with "deflationary" tokenomics and low supply. Most still go to zero because there\'s no genuine demand for the token. Meanwhile, Ethereum has an unlimited supply but is worth $360+ billion because of massive real-world usage. Supply means nothing without demand.',
    dangerLevel: 1,
    relatedGlossaryTerms: ['circulating-supply', 'total-supply', 'tokenomics'],
    relatedBlogSlugs: ['market-cap-explained-why-shiba-cant-reach-one-dollar'],
    icon: '🔥',
    category: 'fundamentals',
  },
  {
    id: 'leverage-trading-trap',
    number: 11,
    title: 'The Leverage Trading Trap',
    whatTheySay:
      '"Use 10x or 100x leverage — turn $100 into $10,000! Just look at this screenshot of my trade!"',
    theReality:
      'Leverage amplifies losses equally. At 10x leverage, a 10% price drop wipes out your entire position — you get liquidated and lose 100% instantly. At 100x, a 1% move against you means total loss. Crypto is already volatile enough; 20% swings are normal. Approximately 75-90% of retail leverage traders lose money. The exchanges profit from your liquidation — they are incentivized for you to use high leverage.',
    whyItMatters:
      'YouTubers show winning leveraged trades (never the losing ones) and link their affiliate codes for derivatives exchanges. Beginners open 20x-50x positions on volatile altcoins and get liquidated within hours. This is the single fastest way beginners lose their entire investment — not a slow bleed, but instant account wipeout.',
    realExample:
      'During the May 2022 crash, over $2 billion in leveraged positions were liquidated in 24 hours. In the March 2024 Bitcoin flash crash, $1.6 billion was liquidated in 12 hours. Many of these were retail traders using high leverage on volatile positions. The exchanges made money on every single liquidation.',
    dangerLevel: 3,
    relatedGlossaryTerms: ['liquidation', 'volatility', 'risk-management'],
    relatedBlogSlugs: [],
    icon: '⚡',
    category: 'trading',
  },
  {
    id: 'tax-ignorance',
    number: 12,
    title: 'The Tax Surprise',
    whatTheySay:
      '"You only owe taxes when you cash out to dollars. Trading between coins isn\'t taxable — it\'s just crypto to crypto!"',
    theReality:
      'In the US, UK, EU, Australia, India, and most jurisdictions, every crypto-to-crypto swap is a taxable event. Selling BTC for ETH? Taxable. Claiming DeFi rewards? Taxable. Selling an NFT? Taxable. You owe tax on the gain at the moment of each trade, even if you never converted back to fiat. If you traded actively in a bull market and the market then crashed, you can owe taxes on gains you no longer have.',
    whyItMatters:
      'Beginners trade freely all year without tracking cost basis, then face a shock tax bill they can\'t pay. Some owe taxes on "gains" that they subsequently lost in a crash. The IRS and other tax agencies are aggressively targeting crypto — Coinbase, Kraken, and other exchanges report to the IRS. Ignorance is not a defense.',
    realExample:
      'In the 2017-2018 cycle, many traders owed massive tax bills on 2017 gains but their portfolios had crashed 80%+ by April 2018 when taxes were due. They owed taxes on gains they no longer had. Some faced five-figure tax bills with depleted portfolios. Use CryptoReportKit\'s tax tools to track every trade from day one.',
    dangerLevel: 3,
    relatedGlossaryTerms: ['dyor'],
    relatedBlogSlugs: ['crypto-tax-guide-2026-what-you-need-to-know'],
    icon: '🧾',
    category: 'risk',
  },
  {
    id: 'altseason-timing',
    number: 13,
    title: 'The "Altseason Is Coming" Clock',
    whatTheySay:
      '"Bitcoin dominance is dropping — altseason confirmed! Rotate out of BTC into altcoins NOW for 100x gains!"',
    theReality:
      'Altseason is identified retrospectively — you only know it happened after the fact. Bitcoin dominance is a deeply flawed metric (distorted by stablecoin growth, wrapped tokens, and dead coins). Even during supposed altseasons, most altcoins still underperform Bitcoin. The ones that outperform change every cycle — you can\'t predict which alts will run. Rotating out of Bitcoin into speculative alts is how beginners miss the actual bull run.',
    whyItMatters:
      'YouTubers run "altseason" content cyclically because it generates views and affiliate revenue. They present it as a predictable, binary event you can time. In reality, beginners who sell Bitcoin to chase altcoin "altseason" often end up with a bag of coins that lose 90%+ while Bitcoin recovers to new highs.',
    realExample:
      'In 2021, many YouTubers declared "altseason" in February. People sold Bitcoin at $40,000 to buy altcoins. Bitcoin went on to reach $69,000 by November (a 72% gain they missed). Meanwhile, many of the altcoins they rotated into peaked in May 2021 and lost 80-95% by year end. The "altseason" rotation cost them on both sides.',
    dangerLevel: 2,
    relatedGlossaryTerms: ['altcoin', 'btc-dominance', 'bear-market'],
    relatedBlogSlugs: ['altseason-index-explained-how-traders-use-it'],
    icon: '🔄',
    category: 'trading',
  },
  {
    id: 'exchange-safety-illusion',
    number: 14,
    title: 'The "My Exchange Is Safe" Illusion',
    whatTheySay:
      '"Just keep your crypto on Coinbase/Binance — it\'s like a bank account. These are huge companies, they won\'t fail!"',
    theReality:
      'Crypto held on exchanges is NOT insured like bank deposits. There is no FDIC/FSCS protection for crypto. Exchanges can freeze withdrawals unilaterally, get hacked, mismanage funds, or collapse entirely. "Not your keys, not your coins" is not a slogan — it\'s a survival rule. Even "proof of reserves" can be manipulated and doesn\'t prove solvency.',
    whyItMatters:
      'After FTX, Mt. Gox, Celsius, BlockFi, Voyager, and countless exchange failures, beginners still keep 100% of their holdings on a single exchange. When an exchange fails, you don\'t lose 20% — you lose everything. Moving to self-custody (hardware wallet) is the only way to truly own your crypto.',
    realExample:
      'FTX was the 2nd largest exchange in the world, valued at $32 billion, endorsed by celebrities and politicians. In November 2022, it collapsed in 72 hours. Customer funds ($8+ billion) were missing — used by the company for trading and personal expenses. Users who kept all their crypto on FTX lost everything. Those who had already moved to hardware wallets kept their funds.',
    dangerLevel: 3,
    relatedGlossaryTerms: ['wallet', 'seed-phrase', 'dyor'],
    relatedBlogSlugs: [],
    icon: '🏦',
    category: 'security',
  },
  {
    id: 'ta-theater',
    number: 15,
    title: 'Technical Analysis Theater',
    whatTheySay:
      '"This head-and-shoulders pattern on the 15-minute chart means Bitcoin will hit $100K by next Tuesday. My analysis is never wrong!"',
    theReality:
      'Most crypto TA on YouTube is applied incorrectly to a market dominated by whale manipulation, regulatory news, and black swan events. Drawing lines on a 15-minute altcoin chart is essentially reading tea leaves. Studies consistently show retail TA traders underperform simple buy-and-hold strategies. TA can identify trends and momentum, but it cannot predict the future — especially in a market this volatile and manipulation-prone.',
    whyItMatters:
      'Technical analysis videos are the most-watched category in crypto YouTube because they fill endless runtime with charts, lines, and confident price targets. They give beginners a dangerous illusion of predictability and control, leading to overtrading (more fees, more tax events) and false confidence in positions. Nobody has a 90% win rate — if they did, they\'d be managing billions, not selling YouTube courses.',
    realExample:
      'In November 2022, dozens of TA YouTubers had bullish Bitcoin charts showing support at $20,000. FTX collapsed and Bitcoin dropped to $15,500 in days — invalidating every chart. In April 2024, most TA channels were bullish at $70,000. Bitcoin dropped to $56,000 within weeks on ETF outflow news. External events override chart patterns every time.',
    dangerLevel: 2,
    relatedGlossaryTerms: ['rsi', 'macd', 'volatility'],
    relatedBlogSlugs: [],
    icon: '📐',
    category: 'trading',
  },
];

export function getMythById(id: string): CryptoMyth | undefined {
  return CRYPTO_MYTHS.find((m) => m.id === id);
}

export function getMythsByCategory(category: CryptoMyth['category']): CryptoMyth[] {
  return CRYPTO_MYTHS.filter((m) => m.category === category);
}

export function getMythsByDangerLevel(level: 1 | 2 | 3): CryptoMyth[] {
  return CRYPTO_MYTHS.filter((m) => m.dangerLevel === level);
}
