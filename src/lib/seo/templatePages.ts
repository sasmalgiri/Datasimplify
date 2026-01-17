/**
 * SEO Template Landing Page Configuration
 *
 * Individual landing pages for each Excel template to target
 * specific long-tail keywords like "crypto portfolio tracker excel"
 */

export interface TemplateLandingPage {
  slug: string;
  title: string;
  h1: string;
  description: string;
  keywords: string[];
  category: string;
  tier: 'free' | 'pro' | 'premium';
  features: string[];
  whoIsItFor: string[];
  customization: string[];
  relatedTemplates: string[];
  faq: { question: string; answer: string }[];
}

export const TEMPLATE_LANDING_PAGES: TemplateLandingPage[] = [
  {
    slug: 'crypto-portfolio-tracker',
    title: 'Crypto Portfolio Tracker Excel Template (Live Updates)',
    h1: 'Crypto Portfolio Tracker Excel Template',
    description:
      'Track your crypto portfolio in Excel with live price updates. Download our free portfolio tracker template with CryptoSheets formulas for real-time P&L tracking.',
    keywords: [
      'crypto portfolio tracker excel',
      'cryptocurrency portfolio spreadsheet',
      'bitcoin portfolio tracker',
      'crypto excel template',
    ],
    category: 'Portfolio',
    tier: 'free',
    features: [
      'Real-time portfolio value tracking',
      'Profit/Loss calculations per coin',
      'Portfolio allocation breakdown',
      'Cost basis tracking',
      '24h and 7d performance metrics',
      'Auto-refresh with CryptoSheets',
    ],
    whoIsItFor: [
      'Crypto investors tracking multiple coins',
      'Traders wanting Excel-based P&L tracking',
      'Analysts building custom portfolio reports',
    ],
    customization: [
      'Add your own coins (any supported by CryptoSheets)',
      'Set your cost basis and purchase dates',
      'Choose your base currency (USD, EUR, etc.)',
      'Add custom columns for notes',
    ],
    relatedTemplates: [
      'crypto-screener',
      'risk-dashboard',
      'correlation-matrix',
      'watchlist',
    ],
    faq: [
      {
        question: 'How do I update prices in the portfolio tracker?',
        answer:
          'Open the file in Excel with CryptoSheets installed, then press Ctrl+Alt+F5 or click Data > Refresh All. Prices update automatically via CryptoSheets formulas.',
      },
      {
        question: 'Can I track any cryptocurrency?',
        answer:
          'Yes! You can track any coin supported by CryptoSheets (thousands of coins). Simply add the coin symbol to the template.',
      },
    ],
  },
  {
    slug: 'crypto-screener',
    title: 'Crypto Screener Excel Template - Market Data Dashboard',
    h1: 'Crypto Screener Excel Template',
    description:
      'Screen and filter cryptocurrencies in Excel with live market data. Download our screener template with customizable filters, market cap rankings, and price alerts.',
    keywords: [
      'crypto screener excel',
      'cryptocurrency screener spreadsheet',
      'crypto market data excel',
      'bitcoin screener template',
    ],
    category: 'Market',
    tier: 'free',
    features: [
      'Top 100+ coins by market cap',
      'Price, volume, and market cap data',
      '24h and 7d price change tracking',
      'Customizable filters and sorting',
      'Built-in charts for visualization',
      'Auto-refresh market data',
    ],
    whoIsItFor: [
      'Traders screening for opportunities',
      'Analysts comparing crypto assets',
      'Investors researching market conditions',
    ],
    customization: [
      'Filter by market cap range',
      'Sort by any metric (price, volume, change)',
      'Add/remove coins from watchlist',
      'Customize chart visualizations',
    ],
    relatedTemplates: [
      'market-overview',
      'gainers-losers',
      'crypto-comparison',
      'watchlist',
    ],
    faq: [
      {
        question: 'How often does the screener data update?',
        answer:
          'Data updates whenever you refresh the workbook. CryptoSheets fetches live data from multiple exchanges and aggregators.',
      },
      {
        question: 'Can I add custom metrics to the screener?',
        answer:
          'Yes! You can add any CryptoSheets formula to create custom columns with technical indicators, on-chain data, or other metrics.',
      },
    ],
  },
  {
    slug: 'fear-greed-dashboard',
    title: 'Fear & Greed Index Excel Dashboard - Crypto Sentiment Tracker',
    h1: 'Fear & Greed Index Excel Dashboard',
    description:
      'Track crypto market sentiment with our Fear & Greed Index Excel template. Visualize historical sentiment data and identify market extremes.',
    keywords: [
      'fear greed index excel',
      'crypto sentiment tracker',
      'bitcoin fear greed spreadsheet',
      'market sentiment excel',
    ],
    category: 'Sentiment',
    tier: 'free',
    features: [
      'Current Fear & Greed Index value',
      'Historical sentiment chart',
      '30-day sentiment trend analysis',
      'Market extreme alerts',
      'Sentiment classification breakdown',
      'Correlation with price movements',
    ],
    whoIsItFor: [
      'Traders using sentiment as a contrarian indicator',
      'Investors timing market entries/exits',
      'Analysts studying market psychology',
    ],
    customization: [
      'Set custom alert thresholds',
      'Choose historical timeframe',
      'Add price overlay charts',
      'Customize sentiment zones',
    ],
    relatedTemplates: [
      'crypto-screener',
      'technical-analysis',
      'market-overview',
      'risk-dashboard',
    ],
    faq: [
      {
        question: 'What is the Fear & Greed Index?',
        answer:
          'The Fear & Greed Index measures market sentiment on a scale of 0-100. Values below 25 indicate "Extreme Fear" (potential buying opportunity), while values above 75 indicate "Extreme Greed" (potential selling signal).',
      },
      {
        question: 'How is the index calculated?',
        answer:
          'The index aggregates multiple factors including volatility, market momentum, social media sentiment, surveys, Bitcoin dominance, and Google Trends data.',
      },
    ],
  },
  {
    slug: 'technical-analysis',
    title: 'Crypto Technical Analysis Excel Template - Indicators Dashboard',
    h1: 'Technical Analysis Excel Template',
    description:
      'Analyze cryptocurrencies with technical indicators in Excel. RSI, MACD, Moving Averages, and more in a refreshable spreadsheet template.',
    keywords: [
      'crypto technical analysis excel',
      'bitcoin indicators spreadsheet',
      'rsi macd excel template',
      'crypto chart analysis excel',
    ],
    category: 'Technical',
    tier: 'pro',
    features: [
      'RSI (Relative Strength Index)',
      'MACD with signal line',
      '50/200 day Moving Averages',
      'Bollinger Bands',
      'Volume analysis',
      'Support/resistance levels',
      'Golden/Death cross detection',
    ],
    whoIsItFor: [
      'Technical traders analyzing charts',
      'Swing traders identifying entry/exit points',
      'Analysts building trading models',
    ],
    customization: [
      'Choose any cryptocurrency',
      'Adjust indicator parameters (RSI period, MA lengths)',
      'Select timeframe (daily, weekly)',
      'Add custom indicators',
    ],
    relatedTemplates: [
      'crypto-screener',
      'correlation-matrix',
      'risk-dashboard',
      'backtest-results',
    ],
    faq: [
      {
        question: 'Which technical indicators are included?',
        answer:
          'The template includes RSI, MACD, Moving Averages (SMA/EMA), Bollinger Bands, Volume indicators, and support/resistance calculations. You can add more using CryptoSheets formulas.',
      },
      {
        question: 'Can I backtest strategies with this template?',
        answer:
          'The template provides the indicator data. For backtesting, check our Backtest Results template which includes historical signal analysis.',
      },
    ],
  },
  {
    slug: 'defi-tvl-tracker',
    title: 'DeFi TVL Tracker Excel Template - Protocol Analytics',
    h1: 'DeFi TVL Tracker Excel Template',
    description:
      'Track DeFi protocol TVL (Total Value Locked) in Excel. Monitor top DeFi protocols, compare yields, and analyze the DeFi ecosystem.',
    keywords: [
      'defi tvl excel',
      'total value locked spreadsheet',
      'defi analytics excel',
      'protocol tvl tracker',
    ],
    category: 'DeFi',
    tier: 'pro',
    features: [
      'Top 50 DeFi protocols by TVL',
      'Chain breakdown (Ethereum, BSC, Solana, etc.)',
      'TVL trend analysis',
      'Protocol comparison charts',
      'Yield farming opportunities',
      'Risk metrics per protocol',
    ],
    whoIsItFor: [
      'DeFi investors analyzing protocols',
      'Yield farmers comparing opportunities',
      'Analysts researching the DeFi ecosystem',
    ],
    customization: [
      'Filter by blockchain',
      'Sort by TVL, yield, or risk',
      'Add specific protocols',
      'Track yield changes over time',
    ],
    relatedTemplates: [
      'staking-rewards',
      'crypto-screener',
      'risk-dashboard',
      'market-overview',
    ],
    faq: [
      {
        question: 'What is TVL (Total Value Locked)?',
        answer:
          'TVL represents the total value of crypto assets deposited in a DeFi protocol. It is a key metric for measuring protocol adoption and security.',
      },
      {
        question: 'How often does DeFi data update?',
        answer:
          'DeFi data updates on each refresh. CryptoSheets pulls data from DeFiLlama and other aggregators for accurate TVL tracking.',
      },
    ],
  },
  {
    slug: 'funding-rates',
    title: 'Crypto Funding Rates Excel Template - Perpetual Futures Tracker',
    h1: 'Funding Rates Excel Template',
    description:
      'Track cryptocurrency perpetual futures funding rates in Excel. Monitor funding across exchanges and identify trading opportunities.',
    keywords: [
      'crypto funding rates excel',
      'perpetual futures funding spreadsheet',
      'bitcoin funding rate tracker',
      'derivatives excel template',
    ],
    category: 'Derivatives',
    tier: 'pro',
    features: [
      'Real-time funding rates by exchange',
      'Funding rate history charts',
      'Exchange comparison (Binance, Bybit, OKX)',
      'Funding arbitrage opportunities',
      'Open interest correlation',
      'Funding payment calculations',
    ],
    whoIsItFor: [
      'Perpetual futures traders',
      'Funding rate arbitrage traders',
      'Risk managers monitoring derivatives',
    ],
    customization: [
      'Select exchanges to track',
      'Choose trading pairs',
      'Set funding rate alerts',
      'Calculate funding payments',
    ],
    relatedTemplates: [
      'liquidations-tracker',
      'crypto-screener',
      'technical-analysis',
      'risk-dashboard',
    ],
    faq: [
      {
        question: 'What are funding rates?',
        answer:
          'Funding rates are periodic payments between long and short traders in perpetual futures markets. Positive rates mean longs pay shorts; negative rates mean shorts pay longs.',
      },
      {
        question: 'How can I use funding rates for trading?',
        answer:
          'Extremely high funding rates can indicate overleveraged positions and potential reversals. Some traders use funding rate arbitrage between spot and perpetual markets.',
      },
    ],
  },
  {
    slug: 'correlation-matrix',
    title: 'Crypto Correlation Matrix Excel Template - Diversification Tool',
    h1: 'Crypto Correlation Matrix Excel Template',
    description:
      'Analyze cryptocurrency correlations in Excel. Build a diversified portfolio by understanding how different coins move together.',
    keywords: [
      'crypto correlation matrix excel',
      'cryptocurrency diversification spreadsheet',
      'portfolio correlation template',
      'crypto asset correlation',
    ],
    category: 'Portfolio',
    tier: 'pro',
    features: [
      'Correlation matrix for 20+ coins',
      'Heatmap visualization',
      'Rolling correlation analysis',
      'Bitcoin correlation tracking',
      'Diversification score',
      'Historical correlation trends',
    ],
    whoIsItFor: [
      'Portfolio managers optimizing allocation',
      'Investors seeking diversification',
      'Risk analysts measuring portfolio correlation',
    ],
    customization: [
      'Select coins for analysis',
      'Choose correlation timeframe',
      'Add custom assets',
      'Adjust heatmap colors',
    ],
    relatedTemplates: [
      'crypto-portfolio-tracker',
      'risk-dashboard',
      'crypto-screener',
      'technical-analysis',
    ],
    faq: [
      {
        question: 'Why is correlation important for crypto portfolios?',
        answer:
          'Highly correlated assets move together, reducing diversification benefits. A good portfolio includes assets with low or negative correlations to reduce overall risk.',
      },
      {
        question: 'How is correlation calculated?',
        answer:
          'Correlation is calculated using the Pearson correlation coefficient on historical price returns. Values range from -1 (perfect negative correlation) to +1 (perfect positive correlation).',
      },
    ],
  },
  {
    slug: 'token-unlocks',
    title: 'Token Unlocks Calendar Excel Template - Vesting Schedule Tracker',
    h1: 'Token Unlocks Calendar Excel Template',
    description:
      'Track upcoming token unlocks and vesting schedules in Excel. Monitor supply inflation and anticipate price impacts from token releases.',
    keywords: [
      'token unlocks excel',
      'crypto vesting schedule spreadsheet',
      'token release calendar',
      'crypto supply tracker',
    ],
    category: 'Token Economics',
    tier: 'pro',
    features: [
      'Upcoming unlock calendar',
      'Unlock size and % of supply',
      'Historical unlock impact analysis',
      'Top coins by unlock value',
      'Vesting schedule visualization',
      'Price impact correlation',
    ],
    whoIsItFor: [
      'Traders anticipating supply events',
      'Investors analyzing tokenomics',
      'Analysts researching token distributions',
    ],
    customization: [
      'Filter by timeframe',
      'Sort by unlock size',
      'Add tokens to watchlist',
      'Set unlock alerts',
    ],
    relatedTemplates: [
      'crypto-screener',
      'market-overview',
      'staking-rewards',
      'risk-dashboard',
    ],
    faq: [
      {
        question: 'Why do token unlocks matter?',
        answer:
          'Token unlocks increase circulating supply, which can create selling pressure if recipients sell their tokens. Large unlocks often precede price volatility.',
      },
      {
        question: 'How do I interpret unlock data?',
        answer:
          'Look at the unlock size relative to daily volume and circulating supply. Large unlocks (>5% of supply) with low liquidity are more likely to impact price.',
      },
    ],
  },
  {
    slug: 'whale-tracker',
    title: 'Crypto Whale Tracker Excel Template - Large Transaction Monitor',
    h1: 'Whale Tracker Excel Template',
    description:
      'Track large cryptocurrency transactions (whale movements) in Excel. Monitor exchange inflows, outflows, and identify potential market-moving activity.',
    keywords: [
      'crypto whale tracker excel',
      'bitcoin whale alerts spreadsheet',
      'large transaction tracker',
      'whale watching excel',
    ],
    category: 'On-Chain',
    tier: 'premium',
    features: [
      'Large transaction alerts',
      'Exchange inflow/outflow tracking',
      'Whale wallet monitoring',
      'Accumulation/distribution signals',
      'Historical whale activity',
      'Price correlation analysis',
    ],
    whoIsItFor: [
      'Traders following whale activity',
      'On-chain analysts studying fund flows',
      'Investors tracking smart money',
    ],
    customization: [
      'Set transaction size thresholds',
      'Filter by asset',
      'Track specific wallets',
      'Customize alert conditions',
    ],
    relatedTemplates: [
      'crypto-screener',
      'bitcoin-analytics',
      'risk-dashboard',
      'technical-analysis',
    ],
    faq: [
      {
        question: 'What qualifies as a whale transaction?',
        answer:
          'Typically transactions over $1 million USD are considered whale-sized. The threshold varies by asset - for Bitcoin, $10M+ is significant; for altcoins, $100K+ may be notable.',
      },
      {
        question: 'Are whale movements predictive?',
        answer:
          'Large exchange inflows can precede selling pressure, while outflows may indicate accumulation. However, whale activity is just one factor among many.',
      },
    ],
  },
  {
    slug: 'etf-tracker',
    title: 'Bitcoin ETF Tracker Excel Template - Fund Flow Dashboard',
    h1: 'Bitcoin ETF Tracker Excel Template',
    description:
      'Track Bitcoin ETF flows and holdings in Excel. Monitor GBTC, IBIT, FBTC and other spot Bitcoin ETFs with daily flow data.',
    keywords: [
      'bitcoin etf tracker excel',
      'btc etf flows spreadsheet',
      'spot bitcoin etf tracker',
      'crypto etf excel template',
    ],
    category: 'Market',
    tier: 'pro',
    features: [
      'Daily ETF flow tracking',
      'AUM by fund (IBIT, FBTC, GBTC, etc.)',
      'Cumulative flow charts',
      'Net flow analysis',
      'Price correlation',
      'Market share breakdown',
    ],
    whoIsItFor: [
      'Investors tracking institutional adoption',
      'Traders monitoring ETF flows',
      'Analysts studying market structure',
    ],
    customization: [
      'Select ETFs to track',
      'Choose date range',
      'Add price overlay',
      'Calculate flow momentum',
    ],
    relatedTemplates: [
      'crypto-screener',
      'bitcoin-analytics',
      'market-overview',
      'whale-tracker',
    ],
    faq: [
      {
        question: 'Why track Bitcoin ETF flows?',
        answer:
          'ETF flows represent institutional demand for Bitcoin. Strong inflows suggest institutional accumulation, while outflows may indicate profit-taking or reduced demand.',
      },
      {
        question: 'Which ETFs are included?',
        answer:
          'The template tracks major spot Bitcoin ETFs including BlackRock IBIT, Fidelity FBTC, Grayscale GBTC, ARK ARKB, and others approved by the SEC.',
      },
    ],
  },
  {
    slug: 'bitcoin-analytics',
    title: 'Bitcoin Analytics Excel Template - On-Chain Metrics Dashboard',
    h1: 'Bitcoin On-Chain Analytics Excel Template',
    description:
      'Analyze Bitcoin with on-chain metrics in Excel. Track MVRV, SOPR, Hash Rate, Active Addresses, and other fundamental indicators.',
    keywords: [
      'bitcoin analytics excel',
      'btc on-chain metrics spreadsheet',
      'bitcoin mvrv excel',
      'crypto on-chain template',
    ],
    category: 'On-Chain',
    tier: 'pro',
    features: [
      'MVRV Ratio tracking',
      'SOPR (Spent Output Profit Ratio)',
      'Hash Rate and Mining metrics',
      'Active Address trends',
      'Supply distribution analysis',
      'Historical cycle comparisons',
    ],
    whoIsItFor: [
      'Long-term Bitcoin investors',
      'On-chain analysts',
      'Researchers studying Bitcoin cycles',
    ],
    customization: [
      'Select metrics to display',
      'Choose historical timeframe',
      'Add moving averages',
      'Compare across cycles',
    ],
    relatedTemplates: [
      'whale-tracker',
      'crypto-screener',
      'technical-analysis',
      'fear-greed-dashboard',
    ],
    faq: [
      {
        question: 'What is MVRV Ratio?',
        answer:
          'MVRV (Market Value to Realized Value) compares Bitcoin market cap to the realized value of all coins. Values above 3.5 historically indicate overvaluation; below 1 indicates undervaluation.',
      },
      {
        question: 'Why use on-chain metrics?',
        answer:
          'On-chain metrics provide fundamental insights into network health, holder behavior, and valuation that complement technical analysis for better decision-making.',
      },
    ],
  },
  {
    slug: 'crypto-comparison',
    title: 'Crypto Comparison Excel Template - Side-by-Side Analysis',
    h1: 'Cryptocurrency Comparison Excel Template',
    description:
      'Compare cryptocurrencies side-by-side in Excel. Analyze metrics, performance, and fundamentals across multiple coins.',
    keywords: [
      'crypto comparison excel',
      'cryptocurrency compare spreadsheet',
      'bitcoin vs ethereum excel',
      'altcoin comparison template',
    ],
    category: 'Market',
    tier: 'free',
    features: [
      'Side-by-side coin comparison',
      'Price performance analysis',
      'Market cap and volume comparison',
      'Relative strength charts',
      'Fundamental metrics comparison',
      'Custom coin selection',
    ],
    whoIsItFor: [
      'Investors comparing investment options',
      'Traders analyzing relative strength',
      'Analysts benchmarking coins',
    ],
    customization: [
      'Select any coins to compare',
      'Choose comparison metrics',
      'Set analysis timeframe',
      'Add custom calculations',
    ],
    relatedTemplates: [
      'crypto-screener',
      'correlation-matrix',
      'crypto-portfolio-tracker',
      'technical-analysis',
    ],
    faq: [
      {
        question: 'How many coins can I compare?',
        answer:
          'The template supports comparing up to 10 coins simultaneously. You can easily swap coins by changing the symbols in the configuration.',
      },
      {
        question: 'What metrics are compared?',
        answer:
          'Price, market cap, 24h volume, price changes (24h, 7d, 30d), circulating supply, and custom metrics you can add.',
      },
    ],
  },
  {
    slug: 'watchlist',
    title: 'Crypto Watchlist Excel Template - Price Alert Tracker',
    h1: 'Crypto Watchlist Excel Template',
    description:
      'Create a custom cryptocurrency watchlist in Excel. Track your favorite coins with live prices, alerts, and custom notes.',
    keywords: [
      'crypto watchlist excel',
      'cryptocurrency price tracker spreadsheet',
      'bitcoin watchlist template',
      'coin tracker excel',
    ],
    category: 'Portfolio',
    tier: 'free',
    features: [
      'Custom coin watchlist',
      'Live price tracking',
      'Price alert thresholds',
      'Notes and tags per coin',
      '24h/7d performance',
      'Quick-add new coins',
    ],
    whoIsItFor: [
      'Casual investors tracking favorites',
      'Traders monitoring opportunities',
      'Anyone building a crypto watchlist',
    ],
    customization: [
      'Add any supported coin',
      'Set price alerts',
      'Add personal notes',
      'Organize with tags',
    ],
    relatedTemplates: [
      'crypto-portfolio-tracker',
      'crypto-screener',
      'market-overview',
      'crypto-comparison',
    ],
    faq: [
      {
        question: 'How do I add a coin to my watchlist?',
        answer:
          'Simply add a new row and enter the coin symbol (e.g., BTC, ETH). The CryptoSheets formulas will automatically fetch the data.',
      },
      {
        question: 'Do price alerts work automatically?',
        answer:
          'The template calculates whether price is above/below your threshold. For push notifications, you would need to combine with external alerting tools.',
      },
    ],
  },
  {
    slug: 'risk-dashboard',
    title: 'Crypto Risk Dashboard Excel Template - Portfolio Risk Analysis',
    h1: 'Crypto Risk Dashboard Excel Template',
    description:
      'Analyze cryptocurrency portfolio risk in Excel. Track volatility, drawdowns, Sharpe ratio, and risk metrics for informed investing.',
    keywords: [
      'crypto risk dashboard excel',
      'portfolio risk analysis spreadsheet',
      'cryptocurrency volatility tracker',
      'crypto sharpe ratio template',
    ],
    category: 'Portfolio',
    tier: 'pro',
    features: [
      'Portfolio volatility tracking',
      'Maximum drawdown analysis',
      'Sharpe and Sortino ratios',
      'Value at Risk (VaR) calculation',
      'Risk-adjusted returns',
      'Correlation risk metrics',
    ],
    whoIsItFor: [
      'Professional portfolio managers',
      'Risk-conscious investors',
      'Traders managing position sizing',
    ],
    customization: [
      'Set risk parameters',
      'Choose calculation periods',
      'Add benchmark comparisons',
      'Customize risk thresholds',
    ],
    relatedTemplates: [
      'crypto-portfolio-tracker',
      'correlation-matrix',
      'technical-analysis',
      'market-overview',
    ],
    faq: [
      {
        question: 'What is the Sharpe Ratio?',
        answer:
          'The Sharpe Ratio measures risk-adjusted returns by comparing portfolio return minus risk-free rate to portfolio volatility. Higher values indicate better risk-adjusted performance.',
      },
      {
        question: 'How is Value at Risk calculated?',
        answer:
          'VaR estimates the potential loss at a given confidence level (e.g., 95% VaR shows the maximum expected loss 95% of the time). The template uses historical simulation.',
      },
    ],
  },
  {
    slug: 'market-overview',
    title: 'Crypto Market Overview Excel Template - Daily Market Report',
    h1: 'Crypto Market Overview Excel Template',
    description:
      'Get a daily crypto market overview in Excel. Track total market cap, Bitcoin dominance, top gainers/losers, and market trends.',
    keywords: [
      'crypto market overview excel',
      'cryptocurrency market report spreadsheet',
      'daily crypto market template',
      'market cap tracker excel',
    ],
    category: 'Market',
    tier: 'free',
    features: [
      'Total market cap tracking',
      'Bitcoin dominance chart',
      'Top 10 coins by market cap',
      'Daily gainers and losers',
      'Volume analysis',
      'Market trend indicators',
    ],
    whoIsItFor: [
      'Anyone wanting a daily market snapshot',
      'Traders starting their day with market data',
      'Analysts reporting on market conditions',
    ],
    customization: [
      'Choose market metrics',
      'Set date range',
      'Add custom watchlist',
      'Customize charts',
    ],
    relatedTemplates: [
      'crypto-screener',
      'gainers-losers',
      'fear-greed-dashboard',
      'watchlist',
    ],
    faq: [
      {
        question: 'How often should I refresh the market overview?',
        answer:
          'For daily analysis, refresh once in the morning. For active trading, you can refresh more frequently as needed.',
      },
      {
        question: 'What does Bitcoin dominance indicate?',
        answer:
          'Bitcoin dominance shows BTC market cap as a percentage of total crypto market cap. Rising dominance often indicates risk-off sentiment; falling dominance suggests altcoin season.',
      },
    ],
  },
  {
    slug: 'gainers-losers',
    title: 'Crypto Gainers & Losers Excel Template - Daily Movers Tracker',
    h1: 'Crypto Gainers & Losers Excel Template',
    description:
      'Track top gaining and losing cryptocurrencies in Excel. Identify momentum plays with daily, weekly, and monthly performance rankings.',
    keywords: [
      'crypto gainers losers excel',
      'top movers cryptocurrency spreadsheet',
      'daily crypto gainers template',
      'bitcoin altcoin movers excel',
    ],
    category: 'Market',
    tier: 'free',
    features: [
      'Top 20 daily gainers',
      'Top 20 daily losers',
      '7-day and 30-day movers',
      'Volume surge detection',
      'Performance charts',
      'Momentum indicators',
    ],
    whoIsItFor: [
      'Momentum traders',
      'Swing traders identifying opportunities',
      'Analysts tracking market movements',
    ],
    customization: [
      'Filter by market cap range',
      'Set minimum volume threshold',
      'Choose timeframe',
      'Add to watchlist',
    ],
    relatedTemplates: [
      'crypto-screener',
      'market-overview',
      'technical-analysis',
      'watchlist',
    ],
    faq: [
      {
        question: 'How do I filter out low-cap coins?',
        answer:
          'You can add a filter to show only coins above a certain market cap threshold (e.g., >$100M) to avoid low-liquidity coins.',
      },
      {
        question: 'Are pump-and-dump coins excluded?',
        answer:
          'The template shows raw data. We recommend filtering by volume and market cap to avoid suspicious low-liquidity pumps.',
      },
    ],
  },
  {
    slug: 'staking-rewards',
    title: 'Crypto Staking Rewards Excel Template - Yield Calculator',
    h1: 'Staking Rewards Excel Template',
    description:
      'Calculate cryptocurrency staking rewards in Excel. Track APY, projected earnings, and compare staking opportunities across protocols.',
    keywords: [
      'crypto staking rewards excel',
      'staking yield calculator spreadsheet',
      'cryptocurrency apr tracker',
      'staking rewards template',
    ],
    category: 'Token Economics',
    tier: 'pro',
    features: [
      'Staking APY by coin',
      'Projected earnings calculator',
      'Protocol comparison',
      'Compound interest modeling',
      'Lock-up period tracking',
      'Risk-adjusted yield analysis',
    ],
    whoIsItFor: [
      'Stakers optimizing yields',
      'DeFi investors comparing protocols',
      'Long-term holders earning passive income',
    ],
    customization: [
      'Enter your staked amounts',
      'Compare multiple protocols',
      'Model compound scenarios',
      'Track actual vs projected rewards',
    ],
    relatedTemplates: [
      'defi-tvl-tracker',
      'crypto-portfolio-tracker',
      'risk-dashboard',
      'token-unlocks',
    ],
    faq: [
      {
        question: 'How accurate are staking APY numbers?',
        answer:
          'APY figures are fetched from live protocol data via CryptoSheets. Actual yields may vary based on network conditions and validator performance.',
      },
      {
        question: 'Does the template account for unstaking periods?',
        answer:
          'Yes, you can input lock-up and unstaking periods to calculate effective yield and opportunity cost.',
      },
    ],
  },
  {
    slug: 'liquidations-tracker',
    title: 'Crypto Liquidations Tracker Excel Template - Leverage Monitor',
    h1: 'Liquidations Tracker Excel Template',
    description:
      'Track cryptocurrency liquidations in Excel. Monitor leveraged positions, liquidation levels, and potential cascade events.',
    keywords: [
      'crypto liquidations excel',
      'leverage liquidation tracker spreadsheet',
      'bitcoin liquidations template',
      'derivatives liquidation monitor',
    ],
    category: 'Derivatives',
    tier: 'premium',
    features: [
      'Real-time liquidation data',
      'Long vs short liquidations',
      'Exchange breakdown',
      'Liquidation heatmap by price level',
      'Historical liquidation charts',
      'Cascade risk indicators',
    ],
    whoIsItFor: [
      'Derivatives traders managing risk',
      'Traders watching for liquidation cascades',
      'Analysts studying leverage in markets',
    ],
    customization: [
      'Select exchanges',
      'Choose trading pairs',
      'Set liquidation alerts',
      'Customize time periods',
    ],
    relatedTemplates: [
      'funding-rates',
      'crypto-screener',
      'technical-analysis',
      'risk-dashboard',
    ],
    faq: [
      {
        question: 'Why do liquidations matter?',
        answer:
          'Large liquidations can cause cascading price movements as forced selling or buying accelerates trends. Liquidation clusters at certain price levels are potential reversal points.',
      },
      {
        question: 'What causes liquidation cascades?',
        answer:
          'When price approaches levels with concentrated leverage, initial liquidations can push price further, triggering more liquidations in a cascade effect.',
      },
    ],
  },
];

// Get template by slug
export function getTemplateBySlug(slug: string): TemplateLandingPage | undefined {
  return TEMPLATE_LANDING_PAGES.find((t) => t.slug === slug);
}

// Get all template slugs for static generation
export function getAllTemplateSlugs(): string[] {
  return TEMPLATE_LANDING_PAGES.map((t) => t.slug);
}

// Get related templates
export function getRelatedTemplates(slug: string): TemplateLandingPage[] {
  const template = getTemplateBySlug(slug);
  if (!template) return [];

  return template.relatedTemplates
    .map((relatedSlug) => getTemplateBySlug(relatedSlug))
    .filter((t): t is TemplateLandingPage => t !== undefined);
}
