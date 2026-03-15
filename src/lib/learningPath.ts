export interface LearningTopic {
  id: string;
  title: string;
  description: string;
  minutes: number;
  link: string;
  linkLabel: string;
}

export interface LearningLevel {
  level: number;
  title: string;
  subtitle: string;
  color: string;
  icon: string;
  topics: LearningTopic[];
}

export const LEARNING_LEVELS: LearningLevel[] = [
  {
    level: 0,
    title: 'What is This?',
    subtitle: 'You just heard about crypto and have no idea where to start',
    color: 'emerald',
    icon: '🌱',
    topics: [
      {
        id: 'what-is-money',
        title: 'What is Money, Really?',
        description:
          'Before crypto, understand what money is — a shared belief system. Fiat, gold, and digital currency all solve the same problem differently.',
        minutes: 5,
        link: '/glossary#cryptocurrency',
        linkLabel: 'Read glossary: Cryptocurrency',
      },
      {
        id: 'what-is-crypto',
        title: 'What is Cryptocurrency?',
        description:
          'Digital money that works without banks. No single company controls it. Transactions are recorded on a public ledger anyone can verify.',
        minutes: 8,
        link: '/learn#what-is-crypto',
        linkLabel: 'Crypto Academy: What is Crypto',
      },
      {
        id: 'what-is-blockchain',
        title: 'What is a Blockchain?',
        description:
          'A chain of data blocks, each linked to the previous one. Once recorded, data cannot be changed. This is what makes crypto trustworthy without a middleman.',
        minutes: 8,
        link: '/glossary#blockchain',
        linkLabel: 'Read glossary: Blockchain',
      },
      {
        id: 'what-is-bitcoin',
        title: 'Bitcoin — The First Cryptocurrency',
        description:
          'Created in 2009 by Satoshi Nakamoto. Fixed supply of 21 million coins. The largest and most established cryptocurrency by far.',
        minutes: 8,
        link: '/glossary#bitcoin',
        linkLabel: 'Read glossary: Bitcoin',
      },
      {
        id: 'scam-awareness-101',
        title: 'Scam Awareness 101',
        description:
          'If someone promises guaranteed returns, it is a scam. Period. Learn the red flags: "100x guaranteed," "risk-free yield," "limited time." Nobody can predict prices.',
        minutes: 5,
        link: '/myths',
        linkLabel: 'Read: 10 Crypto Myths',
      },
    ],
  },
  {
    level: 1,
    title: 'I Get the Basics',
    subtitle: 'You know what crypto is — now learn how the market actually works',
    color: 'blue',
    icon: '📘',
    topics: [
      {
        id: 'wallets-explained',
        title: 'Wallets — Your Crypto Bank Account',
        description:
          'Hot wallets (apps) vs cold wallets (hardware). Your seed phrase is your master key — lose it and your funds are gone forever. Never share it.',
        minutes: 8,
        link: '/glossary#wallet',
        linkLabel: 'Read glossary: Wallet',
      },
      {
        id: 'exchanges-explained',
        title: 'Exchanges — Where You Buy & Sell',
        description:
          'Centralized exchanges (Coinbase, Binance) are like stock brokers. DEXs (Uniswap) let you trade directly. Each has trade-offs in ease vs control.',
        minutes: 7,
        link: '/learn#getting-started-crk',
        linkLabel: 'Getting Started Guide',
      },
      {
        id: 'market-cap-matters',
        title: 'Market Cap — The #1 Metric Beginners Ignore',
        description:
          'Price per coin means nothing without knowing the supply. Market cap = price × circulating supply. This is how you compare coins — never by unit price.',
        minutes: 10,
        link: '/glossary#market-cap',
        linkLabel: 'Read glossary: Market Cap',
      },
      {
        id: 'reading-basic-charts',
        title: 'Reading a Price Chart',
        description:
          'The x-axis is time, the y-axis is price. Green candles mean the price went up, red means down. Start with line charts before candlesticks.',
        minutes: 10,
        link: '/charts',
        linkLabel: 'Try: Interactive Charts',
      },
      {
        id: 'volume-explained',
        title: 'Volume — Is Anyone Actually Trading?',
        description:
          'High volume confirms a price move is real. Low volume on a big price spike? Likely manipulation. Always check volume alongside price.',
        minutes: 6,
        link: '/glossary#volume',
        linkLabel: 'Read glossary: Volume',
      },
      {
        id: 'fear-greed-intro',
        title: 'Fear & Greed Index',
        description:
          'A number from 0-100 measuring market emotion. Below 25 = extreme fear (people panic-selling). Above 75 = extreme greed (people FOMO-buying). Neither extreme is good for decisions.',
        minutes: 6,
        link: '/sentiment',
        linkLabel: 'Try: Sentiment Dashboard',
      },
      {
        id: 'your-first-purchase',
        title: 'Making Your First Purchase Safely',
        description:
          'Start with a small amount you can afford to lose completely. Use a major exchange. Enable 2FA. Buy Bitcoin or Ethereum first — not a random altcoin.',
        minutes: 8,
        link: '/learn#getting-started-crk',
        linkLabel: 'Getting Started Guide',
      },
    ],
  },
  {
    level: 2,
    title: 'I Can Read Charts',
    subtitle: 'Learn the technical tools that traders actually use',
    color: 'purple',
    icon: '📊',
    topics: [
      {
        id: 'candlestick-basics',
        title: 'Candlestick Charts Decoded',
        description:
          'Each candle shows open, high, low, close for a time period. The body shows open-to-close range. Wicks show the extremes. This is the standard in crypto.',
        minutes: 10,
        link: '/learn#reading-charts',
        linkLabel: 'Academy: Reading Charts',
      },
      {
        id: 'support-resistance',
        title: 'Support & Resistance Levels',
        description:
          'Support is a price floor where buyers step in. Resistance is a ceiling where sellers appear. These zones form because traders remember past prices.',
        minutes: 10,
        link: '/technical',
        linkLabel: 'Try: Technical Analysis',
      },
      {
        id: 'moving-averages',
        title: 'Moving Averages (SMA & EMA)',
        description:
          'SMA smooths price over N periods. EMA weighs recent prices more. The 50-day and 200-day are the most watched. When the 50 crosses above the 200 ("golden cross"), traders get bullish.',
        minutes: 10,
        link: '/technical',
        linkLabel: 'Try: Technical Analysis',
      },
      {
        id: 'volume-analysis',
        title: 'Volume Analysis in Practice',
        description:
          'Rising price + rising volume = strong trend. Rising price + falling volume = weak trend likely to reverse. Volume precedes price.',
        minutes: 8,
        link: '/charts',
        linkLabel: 'Try: Interactive Charts',
      },
      {
        id: 'rsi-explained',
        title: 'RSI — Relative Strength Index',
        description:
          'A 0-100 oscillator. Above 70 = overbought (may drop). Below 30 = oversold (may bounce). Not a buy/sell signal alone — combine with other indicators.',
        minutes: 8,
        link: '/glossary#rsi',
        linkLabel: 'Read glossary: RSI',
      },
      {
        id: 'macd-explained',
        title: 'MACD — Trend Momentum',
        description:
          'Shows the relationship between two moving averages. When MACD crosses above the signal line, momentum is bullish. Below = bearish. Histogram shows the strength.',
        minutes: 8,
        link: '/glossary#macd',
        linkLabel: 'Read glossary: MACD',
      },
      {
        id: 'bollinger-bands',
        title: 'Bollinger Bands — Volatility Envelopes',
        description:
          'A moving average with bands 2 standard deviations above and below. Price touching the upper band doesn\'t mean "sell" — it means volatility is high. Squeezes predict big moves.',
        minutes: 8,
        link: '/technical',
        linkLabel: 'Try: Technical Analysis',
      },
    ],
  },
  {
    level: 3,
    title: 'I Understand Risk',
    subtitle: 'The most important skill in crypto — managing what you can lose',
    color: 'amber',
    icon: '⚠️',
    topics: [
      {
        id: 'volatility-reality',
        title: 'Volatility — Crypto\'s Double-Edged Sword',
        description:
          'Bitcoin can move 10-20% in a day. Altcoins can move 50%+. This is normal in crypto. If this amount of movement would cause you financial stress, reduce your position size.',
        minutes: 7,
        link: '/glossary#volatility',
        linkLabel: 'Read glossary: Volatility',
      },
      {
        id: 'drawdown-explained',
        title: 'Drawdown — How Far Can It Fall?',
        description:
          'Maximum drawdown measures the biggest peak-to-trough decline. Bitcoin has historically had 80%+ drawdowns. If you can\'t stomach watching your portfolio drop 80%, you\'re overexposed.',
        minutes: 8,
        link: '/risk',
        linkLabel: 'Try: Risk Dashboard',
      },
      {
        id: 'sharpe-sortino',
        title: 'Sharpe & Sortino Ratios',
        description:
          'Sharpe ratio = return per unit of risk. Above 1.0 is decent, above 2.0 is excellent. Sortino only penalizes downside volatility. Use these to compare investments objectively.',
        minutes: 10,
        link: '/risk',
        linkLabel: 'Try: Risk Dashboard',
      },
      {
        id: 'position-sizing',
        title: 'Position Sizing — The 1-2% Rule',
        description:
          'Never risk more than 1-2% of your portfolio on a single trade. If your portfolio is $10,000, your max loss on any one trade should be $100-200. This keeps you alive through losing streaks.',
        minutes: 8,
        link: '/glossary#dyor',
        linkLabel: 'Read glossary: DYOR',
      },
      {
        id: 'dca-strategy',
        title: 'DCA — Dollar Cost Averaging',
        description:
          'Invest a fixed amount at regular intervals regardless of price. This removes the stress of timing the market and averages out your buy price over time.',
        minutes: 7,
        link: '/glossary#dca',
        linkLabel: 'Read glossary: DCA',
      },
      {
        id: 'diversification',
        title: 'Diversification — Don\'t Put All Eggs in One Basket',
        description:
          'Split across Bitcoin, Ethereum, and select altcoins. Include different sectors (DeFi, L1s, L2s). Consider keeping 50%+ in BTC/ETH as a beginner.',
        minutes: 8,
        link: '/blog/crypto-portfolio-diversification-strategy',
        linkLabel: 'Blog: Portfolio Diversification',
      },
      {
        id: 'correlation-basics',
        title: 'Correlation — Do Your Coins Move Together?',
        description:
          'If all your coins have 0.95 correlation, you\'re not diversified — they\'ll all crash together. Use the correlation matrix to find truly different assets.',
        minutes: 8,
        link: '/correlation',
        linkLabel: 'Try: Correlation Matrix',
      },
    ],
  },
  {
    level: 4,
    title: 'DeFi & Beyond',
    subtitle: 'Understand decentralized finance — the opportunity and the risk',
    color: 'cyan',
    icon: '🏦',
    topics: [
      {
        id: 'smart-contracts',
        title: 'Smart Contracts — Code is Law',
        description:
          'Programs that run on a blockchain automatically. They power DeFi, NFTs, and DAOs. But bugs in smart contracts have lost billions — "code is law" cuts both ways.',
        minutes: 8,
        link: '/glossary#smart-contract',
        linkLabel: 'Read glossary: Smart Contract',
      },
      {
        id: 'dex-basics',
        title: 'DEXs — Decentralized Exchanges',
        description:
          'Trade without a middleman using liquidity pools. No KYC, no custody risk. But: higher fees, slippage on large trades, and no customer support if you make a mistake.',
        minutes: 8,
        link: '/dex-pools',
        linkLabel: 'Try: DEX Pool Explorer',
      },
      {
        id: 'lending-borrowing',
        title: 'DeFi Lending & Borrowing',
        description:
          'Earn interest by lending your crypto, or borrow against it. Rates are set by supply/demand. Risk: liquidation if your collateral drops too far.',
        minutes: 10,
        link: '/defi',
        linkLabel: 'Try: DeFi Dashboard',
      },
      {
        id: 'yield-farming-reality',
        title: 'Yield Farming — Where Does the Yield Come From?',
        description:
          'If you can\'t answer "where does this yield come from?" in one sentence, you are the yield. Sustainable yields are 2-8% on stablecoins. Anything above 20% carries serious risk.',
        minutes: 10,
        link: '/blog/defi-yield-farming-guide-2026',
        linkLabel: 'Blog: DeFi Yield Farming Guide',
      },
      {
        id: 'impermanent-loss',
        title: 'Impermanent Loss — The Hidden DeFi Tax',
        description:
          'When you provide liquidity and the token prices diverge, you end up with less value than if you just held. The more volatile the pair, the worse the loss.',
        minutes: 10,
        link: '/glossary#impermanent-loss',
        linkLabel: 'Read glossary: Impermanent Loss',
      },
      {
        id: 'tvl-explained',
        title: 'TVL — Total Value Locked',
        description:
          'The total amount of crypto deposited in a DeFi protocol. Higher TVL generally means more trust. But TVL can be inflated by incentive programs — always check if the TVL is "real" or "rented."',
        minutes: 7,
        link: '/glossary#tvl',
        linkLabel: 'Read glossary: TVL',
      },
      {
        id: 'layer2-scaling',
        title: 'Layer 2 — Scaling Without Sacrificing Security',
        description:
          'L2s (Arbitrum, Optimism, Base) process transactions off the main chain but inherit its security. Lower fees, faster transactions. Most new DeFi activity happens here.',
        minutes: 8,
        link: '/glossary#layer-2',
        linkLabel: 'Read glossary: Layer 2',
      },
    ],
  },
  {
    level: 5,
    title: 'Research Pro',
    subtitle: 'Think like an analyst — find alpha through data, not hype',
    color: 'rose',
    icon: '🔬',
    topics: [
      {
        id: 'tokenomics-analysis',
        title: 'Tokenomics — Follow the Token Distribution',
        description:
          'Who holds the tokens? What\'s the vesting schedule? Are insiders unlocking soon? High insider allocation + upcoming unlocks = selling pressure. Check before you buy.',
        minutes: 12,
        link: '/screener',
        linkLabel: 'Try: Token Screener',
      },
      {
        id: 'fundamental-analysis',
        title: 'Fundamental Analysis for Crypto',
        description:
          'Revenue, active users, developer activity, TVL growth, token velocity. These are the metrics that matter — not hype, not influencer endorsements, not price predictions.',
        minutes: 12,
        link: '/compare',
        linkLabel: 'Try: Coin Compare Tool',
      },
      {
        id: 'onchain-analysis',
        title: 'On-Chain Analysis — The Blockchain Doesn\'t Lie',
        description:
          'Wallet activity, exchange flows, whale movements, MVRV ratio. On-chain data reveals what holders are actually doing, not what they say they\'re doing.',
        minutes: 12,
        link: '/learn#onchain-data',
        linkLabel: 'Academy: On-Chain Data',
      },
      {
        id: 'correlation-advanced',
        title: 'Advanced Correlation & Portfolio Construction',
        description:
          'Build a portfolio where assets aren\'t perfectly correlated. Use the correlation matrix to find assets that zig when others zag. This reduces overall portfolio volatility.',
        minutes: 10,
        link: '/correlation',
        linkLabel: 'Try: Correlation Matrix',
      },
      {
        id: 'crypto-tax-basics',
        title: 'Crypto Taxes — What You Owe',
        description:
          'Every trade is a taxable event in most countries. Track your cost basis (FIFO, LIFO, or average). Use proper tools — don\'t wait until tax season to figure this out.',
        minutes: 10,
        link: '/blog/crypto-tax-guide-2026-what-you-need-to-know',
        linkLabel: 'Blog: Crypto Tax Guide',
      },
      {
        id: 'backtesting-strategies',
        title: 'Backtesting — Test Before You Risk Real Money',
        description:
          'Run your strategy against historical data before committing capital. If it doesn\'t work in backtesting, it won\'t work live. Past performance doesn\'t guarantee future results, but it filters out the obviously bad ideas.',
        minutes: 10,
        link: '/backtest',
        linkLabel: 'Try: Backtesting Tool',
      },
      {
        id: 'building-a-thesis',
        title: 'Building an Investment Thesis',
        description:
          'Before buying anything, write down: Why am I buying this? What would make me sell? What\'s my time horizon? What\'s my position size? If you can\'t answer these, you\'re gambling, not investing.',
        minutes: 10,
        link: '/research',
        linkLabel: 'Try: Research Center',
      },
    ],
  },
];

const STORAGE_KEY = 'crk-learning-progress';

export function getProgress(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
}

export function toggleTopic(topicId: string): Record<string, boolean> {
  const progress = getProgress();
  if (progress[topicId]) {
    delete progress[topicId];
  } else {
    progress[topicId] = true;
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  return progress;
}

export function getLevelProgress(level: LearningLevel): {
  completed: number;
  total: number;
  percent: number;
} {
  const progress = getProgress();
  const total = level.topics.length;
  const completed = level.topics.filter((t) => progress[t.id]).length;
  return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}

export function markTopicComplete(topicId: string): void {
  const progress = getProgress();
  if (!progress[topicId]) {
    progress[topicId] = true;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }
}

/**
 * Map from page pathnames to learning path topic IDs.
 * When a user visits a tool page, auto-mark the related topic as complete.
 */
export const PAGE_TO_TOPICS: Record<string, string[]> = {
  '/market': ['market-cap-matters'],
  '/charts': ['reading-basic-charts', 'volume-analysis'],
  '/technical': ['rsi-explained', 'macd-explained', 'bollinger-bands', 'moving-averages'],
  '/sentiment': ['fear-greed-intro'],
  '/risk': ['volatility-reality', 'drawdown-explained', 'sharpe-sortino'],
  '/correlation': ['correlation-basics'],
  '/defi': ['smart-contracts', 'tvl-explained'],
  '/dex-pools': ['dex-basics'],
  '/screener': ['tokenomics-analysis'],
  '/compare': ['fundamental-analysis'],
  '/glossary': ['wallets-explained'],
  '/myths': ['scam-awareness-101'],
  '/learn/path': [],
};

export function getOverallProgress(): {
  completed: number;
  total: number;
  percent: number;
} {
  const progress = getProgress();
  const allTopics = LEARNING_LEVELS.flatMap((l) => l.topics);
  const total = allTopics.length;
  const completed = allTopics.filter((t) => progress[t.id]).length;
  return { completed, total, percent: total > 0 ? Math.round((completed / total) * 100) : 0 };
}
