// ============================================
// CRYPTO GLOSSARY DATABASE
// ============================================
// Every crypto term explained in plain English
// Used for hover tooltips throughout the app

export interface GlossaryTerm {
  term: string;
  simple: string;           // One sentence for tooltip
  detailed: string;         // Full explanation
  example?: string;         // Real world example
  related?: string[];       // Related terms
  category: 'basics' | 'trading' | 'defi' | 'technical' | 'onchain' | 'risk' | 'sentiment';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  emoji?: string;
}

export const GLOSSARY: Record<string, GlossaryTerm> = {
  // ============================================
  // BASICS - Things Everyone Should Know
  // ============================================
  
  'bitcoin': {
    term: 'Bitcoin',
    simple: 'The first and largest cryptocurrency, like "digital gold"',
    detailed: 'Bitcoin (BTC) was created in 2009 by someone called Satoshi Nakamoto. It\'s a digital currency that works without banks or governments. Think of it like digital gold - there will only ever be 21 million bitcoins, making it scarce and valuable.',
    example: 'If you bought $100 of Bitcoin in 2015, it would be worth over $10,000 today.',
    related: ['cryptocurrency', 'blockchain', 'satoshi'],
    category: 'basics',
    difficulty: 'beginner',
    emoji: '₿',
  },
  
  'ethereum': {
    term: 'Ethereum',
    simple: 'A cryptocurrency that also runs apps and smart contracts',
    detailed: 'Ethereum (ETH) is the second-largest cryptocurrency. Unlike Bitcoin which is mainly for payments, Ethereum is like a global computer where developers can build apps. These apps power DeFi, NFTs, and more.',
    example: 'Most NFTs and DeFi apps run on Ethereum.',
    related: ['smart-contract', 'defi', 'gas'],
    category: 'basics',
    difficulty: 'beginner',
    emoji: 'Ξ',
  },
  
  'cryptocurrency': {
    term: 'Cryptocurrency',
    simple: 'Digital money that works without banks',
    detailed: 'Cryptocurrency is digital money secured by complex math (cryptography). Unlike regular money, no government or bank controls it. You can send it anywhere in the world, anytime, without asking permission.',
    example: 'You can send Bitcoin from USA to Japan in 10 minutes, 24/7, even on holidays.',
    related: ['bitcoin', 'blockchain', 'wallet'],
    category: 'basics',
    difficulty: 'beginner',
    emoji: '🪙',
  },
  
  'blockchain': {
    term: 'Blockchain',
    simple: 'A public record book that nobody can cheat',
    detailed: 'A blockchain is like a giant spreadsheet that\'s copied across thousands of computers worldwide. Every transaction is recorded and can\'t be changed. It\'s transparent - anyone can see it - but secure because no single person controls it.',
    example: 'When you send Bitcoin, thousands of computers verify and record the transaction.',
    related: ['cryptocurrency', 'decentralized'],
    category: 'basics',
    difficulty: 'beginner',
    emoji: '⛓️',
  },
  
  'wallet': {
    term: 'Wallet',
    simple: 'Where you store your crypto (like a digital bank account)',
    detailed: 'A crypto wallet stores your private keys - the passwords that prove you own your crypto. It doesn\'t actually "hold" coins; it holds the keys to access them on the blockchain. There are hot wallets (online, convenient) and cold wallets (offline, safer).',
    example: 'MetaMask is a popular hot wallet. Ledger is a popular cold wallet.',
    related: ['private-key', 'seed-phrase'],
    category: 'basics',
    difficulty: 'beginner',
    emoji: '👛',
  },
  
  'altcoin': {
    term: 'Altcoin',
    simple: 'Any cryptocurrency that\'s not Bitcoin',
    detailed: 'Altcoin means "alternative coin" - any crypto besides Bitcoin. This includes Ethereum, Solana, Cardano, and thousands of others. Some solve real problems, others are just speculation or scams.',
    example: 'Ethereum, Solana, and Dogecoin are all altcoins.',
    related: ['bitcoin', 'cryptocurrency'],
    category: 'basics',
    difficulty: 'beginner',
    emoji: '🪙',
  },
  
  'market-cap': {
    term: 'Market Cap',
    simple: 'Total value of all coins - shows how "big" a crypto is',
    detailed: 'Market cap = price × total supply. It tells you the total value of a cryptocurrency. A higher market cap usually means more established and less volatile. Bitcoin has the highest market cap.',
    example: 'If a coin costs $10 and there are 1 million coins, the market cap is $10 million.',
    related: ['circulating-supply', 'fully-diluted'],
    category: 'basics',
    difficulty: 'beginner',
    emoji: '📊',
  },
  
  'volume': {
    term: 'Volume',
    simple: 'How much was traded in 24 hours - shows activity level',
    detailed: '24-hour volume shows the total value of trades in the last day. High volume means lots of buying/selling activity. Low volume can mean less interest or harder to buy/sell without moving the price.',
    example: 'Bitcoin often has $20+ billion in daily volume.',
    related: ['liquidity', 'market-cap'],
    category: 'basics',
    difficulty: 'beginner',
    emoji: '📈',
  },

  // ============================================
  // TRADING TERMS
  // ============================================
  
  'bull-market': {
    term: 'Bull Market',
    simple: 'Prices going up - time when most people make money',
    detailed: 'A bull market is when prices trend upward over time. People are optimistic and buying. Called "bull" because bulls attack by thrusting horns UP. In crypto, bull markets can see 10x-100x gains.',
    example: 'The 2020-2021 bull market took Bitcoin from $10K to $69K.',
    related: ['bear-market', 'ath'],
    category: 'trading',
    difficulty: 'beginner',
    emoji: '🐂',
  },
  
  'bear-market': {
    term: 'Bear Market',
    simple: 'Prices going down - time to be careful or buy cheap',
    detailed: 'A bear market is when prices trend downward. People are fearful and selling. Called "bear" because bears attack by swiping DOWN. Bear markets can last months or years. Many experienced investors buy during bear markets.',
    example: 'The 2022 bear market dropped Bitcoin from $69K to $16K.',
    related: ['bull-market', 'dip'],
    category: 'trading',
    difficulty: 'beginner',
    emoji: '🐻',
  },
  
  'ath': {
    term: 'ATH (All-Time High)',
    simple: 'The highest price ever reached',
    detailed: 'ATH is the record high price. When a coin reaches ATH, there are no "bagholders" - everyone who ever bought is in profit. Breaking ATH often leads to more gains as there\'s no selling pressure from people wanting to "break even."',
    example: 'Bitcoin\'s ATH was ~$69,000 in November 2021.',
    related: ['atl', 'bull-market'],
    category: 'trading',
    difficulty: 'beginner',
    emoji: '🏔️',
  },
  
  'atl': {
    term: 'ATL (All-Time Low)',
    simple: 'The lowest price ever reached',
    detailed: 'ATL is the record low price. Coins rarely go back to their ATL after establishing themselves. If a coin is near its ATL, it could be a buying opportunity or a sign the project is dying.',
    related: ['ath', 'bear-market'],
    category: 'trading',
    difficulty: 'beginner',
    emoji: '📉',
  },
  
  'dip': {
    term: 'Dip',
    simple: 'A temporary price drop - often a buying opportunity',
    detailed: 'A dip is a short-term price decline during an overall uptrend. "Buy the dip" is a strategy of buying when prices temporarily fall. The challenge is knowing if it\'s a dip or the start of a bigger crash.',
    example: 'Bitcoin dropped 20% in a day but recovered within a week.',
    related: ['bear-market', 'correction'],
    category: 'trading',
    difficulty: 'beginner',
    emoji: '📉',
  },
  
  'fomo': {
    term: 'FOMO',
    simple: 'Fear Of Missing Out - the urge to buy when prices are rising',
    detailed: 'FOMO happens when you see prices rising and feel compelled to buy before you "miss out." This emotional buying often leads to buying at tops. Professional traders say "when everyone is greedy, be fearful."',
    example: 'Buying a coin because it went up 50% and you\'re scared it\'ll go higher without you.',
    related: ['fud', 'fear-greed-index'],
    category: 'trading',
    difficulty: 'beginner',
    emoji: '😰',
  },
  
  'fud': {
    term: 'FUD',
    simple: 'Fear, Uncertainty, Doubt - negative news that scares people into selling',
    detailed: 'FUD is negative information (real or fake) that causes panic selling. Sometimes it\'s legitimate concerns, sometimes it\'s manipulation. Experienced investors learn to distinguish real problems from temporary FUD.',
    example: 'A country announces a crypto ban. Price drops 30%. Later it\'s revealed it only affects one exchange.',
    related: ['fomo', 'whale'],
    category: 'trading',
    difficulty: 'beginner',
    emoji: '😱',
  },
  
  'hodl': {
    term: 'HODL',
    simple: 'Hold On for Dear Life - don\'t sell during crashes',
    detailed: 'HODL came from a typo of "hold" in 2013. It means keeping your crypto through price drops instead of panic selling. HODLers believe in long-term gains and don\'t try to time the market.',
    example: 'Someone who bought Bitcoin at $100 and HODL\'d through the 2014 crash is now very wealthy.',
    related: ['diamond-hands', 'dca'],
    category: 'trading',
    difficulty: 'beginner',
    emoji: '💎',
  },
  
  'dca': {
    term: 'DCA (Dollar Cost Averaging)',
    simple: 'Buy a fixed amount regularly, regardless of price',
    detailed: 'DCA means investing the same amount on a regular schedule (weekly, monthly). This reduces the impact of volatility - you buy more when prices are low, less when high. It\'s a beginner-friendly strategy that removes emotion.',
    example: 'Buying $100 of Bitcoin every Monday, whether the price is $30K or $60K.',
    related: ['hodl', 'volatility'],
    category: 'trading',
    difficulty: 'beginner',
    emoji: '📅',
  },

  // ============================================
  // SENTIMENT & INDICATORS
  // ============================================
  
  'fear-greed-index': {
    term: 'Fear & Greed Index',
    simple: 'Shows if people are scared (good time to buy) or greedy (be careful)',
    detailed: 'This index measures market sentiment from 0 (Extreme Fear) to 100 (Extreme Greed). It\'s based on volatility, volume, social media, surveys, and more. Warren Buffett says "be greedy when others are fearful, and fearful when others are greedy."',
    example: 'When the index hit 10 (Extreme Fear) in 2022, Bitcoin was near its bottom.',
    related: ['fomo', 'fud', 'sentiment'],
    category: 'sentiment',
    difficulty: 'beginner',
    emoji: '😱',
  },
  
  'rsi': {
    term: 'RSI (Relative Strength Index)',
    simple: 'Shows if a coin is overbought (due for drop) or oversold (due for rise)',
    detailed: 'RSI ranges from 0-100. Above 70 = overbought (might drop soon). Below 30 = oversold (might rise soon). It\'s not perfect but helps identify potential reversal points. Used with other indicators for better results.',
    example: 'Bitcoin RSI hit 90 at the 2021 top, then dropped.',
    related: ['macd', 'technical-analysis'],
    category: 'technical',
    difficulty: 'intermediate',
    emoji: '📊',
  },
  
  'macd': {
    term: 'MACD',
    simple: 'Shows momentum - is the trend getting stronger or weaker?',
    detailed: 'MACD (Moving Average Convergence Divergence) shows the relationship between two moving averages. When MACD crosses above the signal line = bullish. When it crosses below = bearish. Great for spotting trend changes.',
    example: 'A MACD bullish crossover often signals the start of an uptrend.',
    related: ['rsi', 'moving-average'],
    category: 'technical',
    difficulty: 'intermediate',
    emoji: '📈',
  },

  // ============================================
  // ON-CHAIN METRICS
  // ============================================
  
  'mvrv': {
    term: 'MVRV (Market Value to Realized Value)',
    simple: 'Shows if Bitcoin is overvalued or undervalued based on what people paid',
    detailed: 'MVRV compares the current market cap to the "realized cap" (what everyone actually paid for their coins). MVRV > 3 = overvalued/top. MVRV < 1 = undervalued/bottom. It\'s one of the most reliable on-chain indicators.',
    example: 'MVRV hit 0.8 at the 2022 bottom - historically a great buying zone.',
    related: ['nupl', 'on-chain'],
    category: 'onchain',
    difficulty: 'advanced',
    emoji: '⛓️',
  },
  
  'whale': {
    term: 'Whale',
    simple: 'Someone who owns a LOT of crypto - their trades move markets',
    detailed: 'A whale is an individual or entity holding large amounts of crypto (typically 1000+ BTC). When whales buy or sell, it can significantly move prices. Tracking whale activity can give insights into what big players are doing.',
    example: 'A whale moved $500 million of Bitcoin to an exchange, causing the price to drop 5%.',
    related: ['whale-alert', 'exchange-flow'],
    category: 'onchain',
    difficulty: 'intermediate',
    emoji: '🐋',
  },
  
  'exchange-flow': {
    term: 'Exchange Inflow/Outflow',
    simple: 'Coins moving to exchanges (might sell) or off exchanges (will hold)',
    detailed: 'When crypto moves TO exchanges, people might be preparing to sell (bearish). When it moves OFF exchanges to wallets, people are holding long-term (bullish). Large exchange inflows often precede price drops.',
    example: 'Before the 2022 crash, exchange inflows hit record highs.',
    related: ['whale', 'selling-pressure'],
    category: 'onchain',
    difficulty: 'intermediate',
    emoji: '🔄',
  },

  // ============================================
  // DEFI TERMS
  // ============================================
  
  'defi': {
    term: 'DeFi (Decentralized Finance)',
    simple: 'Banking services without banks - earn, borrow, trade directly',
    detailed: 'DeFi recreates traditional financial services (lending, borrowing, trading) using smart contracts on blockchain. No banks, no paperwork, no permission needed. Anyone with internet can access financial services.',
    example: 'You can earn 5% APY on your stablecoins through DeFi lending protocols.',
    related: ['smart-contract', 'yield-farming', 'tvl'],
    category: 'defi',
    difficulty: 'intermediate',
    emoji: '🏦',
  },
  
  'tvl': {
    term: 'TVL (Total Value Locked)',
    simple: 'How much money is deposited in a DeFi protocol - shows trust level',
    detailed: 'TVL measures all the crypto deposited in a DeFi protocol. Higher TVL = more trust and usage. It\'s like measuring how much money a bank holds in deposits. TVL across all DeFi is now hundreds of billions.',
    example: 'Aave has $10B+ TVL, making it one of the most trusted lending protocols.',
    related: ['defi', 'yield-farming'],
    category: 'defi',
    difficulty: 'intermediate',
    emoji: '🔒',
  },
  
  'apy': {
    term: 'APY (Annual Percentage Yield)',
    simple: 'How much you\'d earn in a year if rates stay the same',
    detailed: 'APY shows your potential annual return including compound interest. In crypto, APYs can range from 1% to 1000%+. Higher APY = higher risk. Extremely high APYs are usually unsustainable or scams.',
    example: 'A 10% APY on stablecoins is considered good. A 500% APY is extremely risky.',
    related: ['yield-farming', 'staking'],
    category: 'defi',
    difficulty: 'beginner',
    emoji: '💰',
  },
  
  'staking': {
    term: 'Staking',
    simple: 'Lock your crypto to help the network and earn rewards',
    detailed: 'Staking is like earning interest. You lock your crypto to help validate transactions on the network. In return, you earn rewards (usually 3-15% APY). It\'s a way to earn passive income on crypto you plan to hold anyway.',
    example: 'Staking ETH earns about 4-5% APY while helping secure Ethereum.',
    related: ['apy', 'proof-of-stake'],
    category: 'defi',
    difficulty: 'beginner',
    emoji: '🔐',
  },
  
  'gas': {
    term: 'Gas Fees',
    simple: 'The fee you pay to make transactions - like a processing fee',
    detailed: 'Gas is the fee paid to process transactions on blockchains like Ethereum. Fees vary based on network congestion. High fees during busy times, low fees when quiet. Layer 2 solutions and other chains have much lower fees.',
    example: 'An Ethereum swap might cost $5 in gas when quiet, or $100+ during high demand.',
    related: ['ethereum', 'layer-2'],
    category: 'defi',
    difficulty: 'beginner',
    emoji: '⛽',
  },
  
  'impermanent-loss': {
    term: 'Impermanent Loss',
    simple: 'When providing liquidity earns less than just holding the coins',
    detailed: 'When you provide liquidity to a DEX, if prices change significantly, you may end up with less value than if you just held the coins. It\'s "impermanent" because it reverses if prices return to original levels.',
    example: 'You deposit $1000 ETH + $1000 USDC. ETH doubles. You\'d have more if you just held ETH.',
    related: ['liquidity-pool', 'amm'],
    category: 'defi',
    difficulty: 'advanced',
    emoji: '📉',
  },

  // ============================================
  // RISK TERMS
  // ============================================
  
  'volatility': {
    term: 'Volatility',
    simple: 'How much price moves up and down - crypto is very volatile',
    detailed: 'Volatility measures price swings. High volatility = big price movements (both up and down). Crypto is much more volatile than stocks. Bitcoin can move 10% in a day, which is rare for stocks.',
    example: 'Bitcoin has dropped 30% in a week multiple times, but also risen 50% in weeks.',
    related: ['risk', 'dca'],
    category: 'risk',
    difficulty: 'beginner',
    emoji: '📊',
  },
  
  'liquidation': {
    term: 'Liquidation',
    simple: 'When your leveraged position is forcibly closed because you lost too much',
    detailed: 'If you borrow money to trade (leverage) and the price moves against you past a certain point, the exchange automatically sells your position to prevent further losses. You can lose your entire investment.',
    example: '10x leverage means a 10% price drop = 100% loss. You get liquidated.',
    related: ['leverage', 'margin'],
    category: 'risk',
    difficulty: 'intermediate',
    emoji: '💀',
  },
  
  'rug-pull': {
    term: 'Rug Pull',
    simple: 'A scam where creators take all the money and disappear',
    detailed: 'A rug pull is when project creators suddenly withdraw all funds and abandon the project. Common in new tokens with unknown teams. Always research projects thoroughly and be wary of guaranteed returns.',
    example: 'The Squid Game token went from $2,800 to $0 in minutes as creators drained the liquidity.',
    related: ['scam', 'dyor'],
    category: 'risk',
    difficulty: 'beginner',
    emoji: '🚨',
  },
  
  'dyor': {
    term: 'DYOR (Do Your Own Research)',
    simple: 'Never trust, always verify - research before investing',
    detailed: 'DYOR means you should research any crypto investment yourself. Don\'t blindly follow influencers or friends. Check the team, technology, tokenomics, community, and use case. If you can\'t explain why you\'re buying, don\'t buy.',
    example: 'Before buying, research: Who made this? What problem does it solve? Is the token needed?',
    related: ['rug-pull', 'scam'],
    category: 'risk',
    difficulty: 'beginner',
    emoji: '🔍',
  },
  
  'nfa': {
    term: 'NFA (Not Financial Advice)',
    simple: 'I\'m sharing my opinion, not telling you what to do with your money',
    detailed: 'NFA is a disclaimer meaning the speaker isn\'t a financial advisor and you shouldn\'t treat their opinion as professional advice. Everyone\'s financial situation is different. Always make your own decisions.',
    related: ['dyor'],
    category: 'risk',
    difficulty: 'beginner',
    emoji: '⚠️',
  },

  // ============================================
  // MORE TECHNICAL TERMS
  // ============================================
  
  'smart-contract': {
    term: 'Smart Contract',
    simple: 'A program that automatically executes agreements on blockchain',
    detailed: 'Smart contracts are programs stored on a blockchain that run automatically when conditions are met. No middleman needed. They power DeFi, NFTs, and more. "If X happens, then do Y" - enforced by code.',
    example: 'A smart contract can automatically send you money if a flight is delayed.',
    related: ['ethereum', 'defi'],
    category: 'technical',
    difficulty: 'intermediate',
    emoji: '📜',
  },
  
  'layer-2': {
    term: 'Layer 2',
    simple: 'A faster, cheaper network built on top of a main blockchain',
    detailed: 'Layer 2s process transactions off the main chain (Layer 1) to increase speed and reduce fees. They inherit the security of the main chain. Examples: Lightning Network for Bitcoin, Arbitrum/Optimism for Ethereum.',
    example: 'Sending ETH on Arbitrum costs cents vs dollars on Ethereum mainnet.',
    related: ['gas', 'ethereum', 'scalability'],
    category: 'technical',
    difficulty: 'intermediate',
    emoji: '🚀',
  },
  
  'seed-phrase': {
    term: 'Seed Phrase',
    simple: '12-24 words that can recover your entire wallet - NEVER share them',
    detailed: 'A seed phrase (recovery phrase) is a list of words that stores all your wallet info. Anyone with these words can access all your crypto. Never store digitally, never share, write on paper and keep safe.',
    example: 'Lost your phone? Enter your seed phrase in a new wallet app to recover everything.',
    related: ['wallet', 'private-key'],
    category: 'basics',
    difficulty: 'beginner',
    emoji: '🔑',
  },
  
  'btc-dominance': {
    term: 'BTC Dominance',
    simple: 'What percentage of total crypto market is Bitcoin',
    detailed: 'BTC Dominance shows Bitcoin\'s market cap as a percentage of the total crypto market. High dominance (>50%) suggests money staying in Bitcoin. Low dominance suggests money flowing to altcoins (altcoin season).',
    example: 'BTC Dominance dropping from 60% to 40% often signals an altcoin rally.',
    related: ['altcoin', 'market-cap'],
    category: 'trading',
    difficulty: 'intermediate',
    emoji: '📊',
  },
  
  'halving': {
    term: 'Halving',
    simple: 'When Bitcoin mining rewards are cut in half - makes BTC more scarce',
    detailed: 'Every 4 years (210,000 blocks), the reward for mining Bitcoin is halved. This reduces new supply, increasing scarcity. Halvings have historically preceded bull markets. The next halving is in 2024.',
    example: 'After the 2020 halving, Bitcoin went from $9K to $69K.',
    related: ['bitcoin', 'mining', 'supply'],
    category: 'basics',
    difficulty: 'intermediate',
    emoji: '⛏️',
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================

// Get all terms
export function getAllTerms(): GlossaryTerm[] {
  return Object.values(GLOSSARY);
}

// Get term by key
export function getTerm(key: string): GlossaryTerm | undefined {
  return GLOSSARY[key.toLowerCase().replace(/\s+/g, '-')];
}

// Search terms
export function searchTerms(query: string): GlossaryTerm[] {
  const q = query.toLowerCase();
  return getAllTerms().filter(term => 
    term.term.toLowerCase().includes(q) ||
    term.simple.toLowerCase().includes(q) ||
    term.detailed.toLowerCase().includes(q)
  );
}

// Get terms by category
export function getTermsByCategory(category: GlossaryTerm['category']): GlossaryTerm[] {
  return getAllTerms().filter(term => term.category === category);
}

// Get terms by difficulty
export function getTermsByDifficulty(difficulty: GlossaryTerm['difficulty']): GlossaryTerm[] {
  return getAllTerms().filter(term => term.difficulty === difficulty);
}

// Get beginner-friendly terms
export function getBeginnerTerms(): GlossaryTerm[] {
  return getTermsByDifficulty('beginner');
}

// Find jargon in text and return matches
export function findJargonInText(text: string): { term: string; key: string; position: number }[] {
  const found: { term: string; key: string; position: number }[] = [];
  const lowerText = text.toLowerCase();
  
  for (const [key, termData] of Object.entries(GLOSSARY)) {
    const termLower = termData.term.toLowerCase();
    let position = lowerText.indexOf(termLower);
    
    while (position !== -1) {
      found.push({ term: termData.term, key, position });
      position = lowerText.indexOf(termLower, position + 1);
    }
  }
  
  return found.sort((a, b) => a.position - b.position);
}

// Export categories for filtering
export const GLOSSARY_CATEGORIES = [
  { key: 'basics', label: '📚 Basics', description: 'Start here if you\'re new' },
  { key: 'trading', label: '📈 Trading', description: 'Buying and selling terms' },
  { key: 'defi', label: '🏦 DeFi', description: 'Decentralized finance' },
  { key: 'technical', label: '📊 Technical', description: 'Charts and indicators' },
  { key: 'onchain', label: '⛓️ On-Chain', description: 'Blockchain data analysis' },
  { key: 'sentiment', label: '😱 Sentiment', description: 'Market emotions' },
  { key: 'risk', label: '⚠️ Risk', description: 'Safety and scam awareness' },
];

export default GLOSSARY;
