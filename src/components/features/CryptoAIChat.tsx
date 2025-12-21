'use client';

import { useState, useRef, useEffect } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: string[];
  data?: any;
}

interface CryptoData {
  prices: Record<string, number>;
  marketCaps: Record<string, number>;
  changes24h: Record<string, number>;
  fearGreedIndex: number;
  btcDominance: number;
  totalMarketCap: number;
  trendingCoins: string[];
  topGainers: { symbol: string; change: number }[];
  topLosers: { symbol: string; change: number }[];
  latestNews: { title: string; source: string; sentiment: 'positive' | 'negative' | 'neutral' }[];
}

// Simulated crypto data - in production would come from APIs
const getCryptoData = (): CryptoData => ({
  prices: {
    BTC: 97245, ETH: 3890, SOL: 220, XRP: 2.35, DOGE: 0.41, ADA: 1.05, DOT: 9.2, AVAX: 48, LINK: 22.5, SHIB: 0.000025
  },
  marketCaps: {
    BTC: 1920000000000, ETH: 468000000000, SOL: 95000000000, XRP: 125000000000, DOGE: 58000000000
  },
  changes24h: {
    BTC: 2.3, ETH: 1.8, SOL: 5.5, XRP: -2.1, DOGE: 15.2, ADA: 1.2, DOT: 0.8, AVAX: 3.2, LINK: 8.5, SHIB: 18.5
  },
  fearGreedIndex: 72,
  btcDominance: 54.2,
  totalMarketCap: 3420000000000,
  trendingCoins: ['PEPE', 'DOGE', 'SOL', 'LINK', 'XRP'],
  topGainers: [
    { symbol: 'PEPE', change: 35.2 },
    { symbol: 'SHIB', change: 18.5 },
    { symbol: 'DOGE', change: 15.2 },
    { symbol: 'LINK', change: 8.5 },
    { symbol: 'SOL', change: 5.5 }
  ],
  topLosers: [
    { symbol: 'XRP', change: -2.1 },
    { symbol: 'FIL', change: -3.5 },
    { symbol: 'ATOM', change: -1.8 }
  ],
  latestNews: [
    { title: 'Bitcoin ETFs See Record $500M Inflow', source: 'CoinDesk', sentiment: 'positive' },
    { title: 'SEC Approves New Crypto Custody Rules', source: 'Bloomberg', sentiment: 'positive' },
    { title: 'Ethereum Upgrade Scheduled for Q1 2025', source: 'Decrypt', sentiment: 'neutral' },
    { title: 'Major Bank Announces Crypto Trading Desk', source: 'Reuters', sentiment: 'positive' },
    { title: 'Regulatory Concerns Grow in Asia', source: 'CoinTelegraph', sentiment: 'negative' }
  ]
});

// Non-crypto topics to reject
const nonCryptoTopics = [
  'weather', 'sports', 'politics', 'recipe', 'cooking', 'movie', 'music', 'game', 'travel',
  'relationship', 'health', 'medical', 'doctor', 'exercise', 'diet', 'weight loss',
  'code', 'programming', 'javascript', 'python', 'write a', 'poem', 'story', 'essay',
  'homework', 'math problem', 'calculate', 'history', 'geography', 'science', 'physics',
  'chemistry', 'biology', 'translate', 'language', 'grammar', 'spell'
];

// Check if message is crypto-related
const isCryptoRelated = (message: string): boolean => {
  const lowerMessage = message.toLowerCase();
  
  // Check for non-crypto topics
  for (const topic of nonCryptoTopics) {
    if (lowerMessage.includes(topic) && !lowerMessage.includes('crypto') && !lowerMessage.includes('bitcoin') && !lowerMessage.includes('coin')) {
      return false;
    }
  }
  
  // Crypto-related keywords
  const cryptoKeywords = [
    'crypto', 'bitcoin', 'btc', 'ethereum', 'eth', 'coin', 'token', 'blockchain',
    'wallet', 'exchange', 'binance', 'coinbase', 'defi', 'nft', 'market cap',
    'price', 'bull', 'bear', 'hodl', 'mining', 'staking', 'yield', 'apy',
    'altcoin', 'memecoin', 'solana', 'sol', 'xrp', 'cardano', 'ada', 'doge',
    'invest', 'trading', 'portfolio', 'buy', 'sell', 'whale', 'gas', 'fee',
    'ledger', 'metamask', 'seed phrase', 'private key', 'smart contract',
    'layer 2', 'l2', 'rollup', 'tvl', 'liquidity', 'swap', 'dex', 'cex',
    'fear', 'greed', 'rsi', 'macd', 'technical', 'on-chain', 'halving',
    'etf', 'sec', 'regulation', 'fud', 'fomo', 'ath', 'atl', 'satoshi'
  ];
  
  for (const keyword of cryptoKeywords) {
    if (lowerMessage.includes(keyword)) {
      return true;
    }
  }
  
  // Default: if it's a question about money/investing, might be crypto-related
  if (lowerMessage.includes('invest') || lowerMessage.includes('money') || lowerMessage.includes('market')) {
    return true;
  }
  
  return false;
};

// Generate AI response based on query
const generateResponse = (query: string, data: CryptoData): { content: string; sources?: string[] } => {
  const lowerQuery = query.toLowerCase();
  
  // Price queries
  if (lowerQuery.includes('price') || lowerQuery.includes('how much') || lowerQuery.includes('worth')) {
    for (const [symbol, price] of Object.entries(data.prices)) {
      if (lowerQuery.includes(symbol.toLowerCase())) {
        const change = data.changes24h[symbol];
        return {
          content: `**${symbol} Current Price: $${price.toLocaleString()}**\n\n` +
            `📊 24h Change: ${change >= 0 ? '🟢' : '🔴'} ${change >= 0 ? '+' : ''}${change}%\n\n` +
            `${change >= 0 
              ? `${symbol} is up today! The market sentiment is ${data.fearGreedIndex >= 50 ? 'positive' : 'cautious'}.` 
              : `${symbol} is down today. Consider if this is a buying opportunity or a warning sign.`}\n\n` +
            `💡 **Tip for beginners:** Don't buy or sell based on one day's price movement. Look at the bigger picture!`,
          sources: ['CoinGecko Real-time Data']
        };
      }
    }
    
    // Generic price overview
    return {
      content: `**Current Market Prices:**\n\n` +
        Object.entries(data.prices).slice(0, 5).map(([symbol, price]) => 
          `• **${symbol}**: $${price.toLocaleString()} (${data.changes24h[symbol] >= 0 ? '+' : ''}${data.changes24h[symbol]}%)`
        ).join('\n') +
        `\n\n💰 Total Market Cap: $${(data.totalMarketCap / 1e12).toFixed(2)} Trillion`,
      sources: ['CoinGecko API', 'CoinMarketCap']
    };
  }

  // Fear & Greed
  if (lowerQuery.includes('fear') || lowerQuery.includes('greed') || lowerQuery.includes('sentiment') || lowerQuery.includes('mood')) {
    const index = data.fearGreedIndex;
    const sentiment = index >= 75 ? 'Extreme Greed 🤑' : index >= 50 ? 'Greed 😊' : index >= 25 ? 'Fear 😟' : 'Extreme Fear 😨';
    
    return {
      content: `**Fear & Greed Index: ${index}/100 (${sentiment})**\n\n` +
        `${index >= 75 
          ? '⚠️ **Caution:** Markets are very excited right now. This is often when prices are highest. "Be fearful when others are greedy" - Warren Buffett' 
          : index >= 50 
          ? '📈 Markets are optimistic. People are generally bullish on crypto.' 
          : index >= 25 
          ? '😰 Markets are nervous. This could be a buying opportunity if you believe in long-term growth.' 
          : '🔥 **Extreme Fear!** Historically, this has been a good time to buy - but only if you can handle short-term losses.'}\n\n` +
        `💡 **For beginners:** This index measures crowd emotion, not reality. Use it as ONE input, not your only decision factor.`,
      sources: ['Alternative.me Fear & Greed Index']
    };
  }

  // News
  if (lowerQuery.includes('news') || lowerQuery.includes('happening') || lowerQuery.includes('latest') || lowerQuery.includes('update')) {
    return {
      content: `**📰 Latest Crypto News:**\n\n` +
        data.latestNews.map(news => 
          `${news.sentiment === 'positive' ? '🟢' : news.sentiment === 'negative' ? '🔴' : '⚪'} **${news.title}**\n   _Source: ${news.source}_`
        ).join('\n\n') +
        `\n\n💡 **Tip:** News can cause short-term price swings, but fundamentals matter more long-term.`,
      sources: data.latestNews.map(n => n.source)
    };
  }

  // Trending / Hot
  if (lowerQuery.includes('trending') || lowerQuery.includes('hot') || lowerQuery.includes('popular')) {
    return {
      content: `**🔥 Trending Coins Right Now:**\n\n` +
        data.trendingCoins.map((coin, i) => `${i + 1}. **${coin}**`).join('\n') +
        `\n\n**Top Gainers (24h):**\n` +
        data.topGainers.map(g => `🟢 ${g.symbol}: +${g.change}%`).join('\n') +
        `\n\n⚠️ **Warning:** Trending doesn't mean good investment! Many trending coins are highly volatile and risky. DYOR!`,
      sources: ['CoinGecko Trending', 'LunarCrush Social Data']
    };
  }

  // Should I buy / invest
  if (lowerQuery.includes('should i buy') || lowerQuery.includes('should i invest') || lowerQuery.includes('good investment')) {
    return {
      content: `**🤔 Investment Advice (Important!)**\n\n` +
        `I can't tell you what to buy - that's a personal decision based on YOUR:\n` +
        `• Risk tolerance (can you handle 50% drops?)\n` +
        `• Investment timeline (5+ years is safer)\n` +
        `• Financial situation (only invest what you can lose)\n\n` +
        `**Current Market Context:**\n` +
        `• Fear & Greed: ${data.fearGreedIndex}/100 (${data.fearGreedIndex >= 50 ? 'Greedy - prices might be high' : 'Fearful - possible buying opportunity'})\n` +
        `• BTC Dominance: ${data.btcDominance}%\n` +
        `• Total Market Cap: $${(data.totalMarketCap / 1e12).toFixed(2)}T\n\n` +
        `**💡 Beginner Tips:**\n` +
        `1. Start with BTC and ETH (less risky than altcoins)\n` +
        `2. Use dollar-cost averaging (buy small amounts regularly)\n` +
        `3. Never invest more than you can afford to lose\n` +
        `4. Don't chase pumps - buy red, not green!\n\n` +
        `⚠️ **Disclaimer:** This is not financial advice. I'm an AI assistant providing educational information.`,
      sources: ['DataSimplify Analysis', 'Market Data']
    };
  }

  // Portfolio
  if (lowerQuery.includes('portfolio') || lowerQuery.includes('allocat') || lowerQuery.includes('diversif')) {
    return {
      content: `**💼 Portfolio Building Guide:**\n\n` +
        `**Sample Allocations by Risk Level:**\n\n` +
        `🛡️ **Conservative (Lower Risk):**\n` +
        `• 60% Bitcoin (BTC)\n` +
        `• 30% Ethereum (ETH)\n` +
        `• 10% Stablecoins (USDC)\n\n` +
        `⚖️ **Balanced (Moderate Risk):**\n` +
        `• 45% Bitcoin\n` +
        `• 30% Ethereum\n` +
        `• 15% Large-cap Altcoins (SOL, ADA)\n` +
        `• 10% Small-caps\n\n` +
        `🚀 **Aggressive (Higher Risk):**\n` +
        `• 30% Bitcoin\n` +
        `• 25% Ethereum\n` +
        `• 25% Altcoins\n` +
        `• 20% High-risk plays\n\n` +
        `💡 **Key Principle:** Don't put all eggs in one basket! Diversification reduces risk.\n\n` +
        `📊 Use our Portfolio Builder tool to create your personalized allocation!`,
      sources: ['DataSimplify Portfolio Guide']
    };
  }

  // Beginner / How to start
  if (lowerQuery.includes('beginner') || lowerQuery.includes('start') || lowerQuery.includes('new to') || lowerQuery.includes('learn')) {
    return {
      content: `**🎓 Crypto Beginner's Guide:**\n\n` +
        `**Step 1: Learn the Basics**\n` +
        `• Cryptocurrency = Digital money on blockchain\n` +
        `• Bitcoin = First and largest crypto (digital gold)\n` +
        `• Ethereum = Platform for apps and smart contracts\n\n` +
        `**Step 2: Get a Wallet**\n` +
        `• Coinbase/Binance = Easy for beginners (custodial)\n` +
        `• MetaMask = For DeFi (non-custodial)\n` +
        `• Ledger = Hardware wallet for large amounts\n\n` +
        `**Step 3: Start Small**\n` +
        `• Begin with $50-100 you can afford to lose\n` +
        `• Buy BTC or ETH first (safest options)\n` +
        `• Learn before buying risky altcoins\n\n` +
        `**Step 4: Use Our Tools**\n` +
        `• 📚 Crypto Academy - Free courses\n` +
        `• 📖 Glossary - 50+ terms explained\n` +
        `• 💼 Portfolio Builder - Create your first portfolio\n\n` +
        `💡 **Golden Rule:** Never invest more than you can afford to lose completely!`,
      sources: ['DataSimplify Crypto Academy']
    };
  }

  // Risk
  if (lowerQuery.includes('risk') || lowerQuery.includes('safe') || lowerQuery.includes('dangerous') || lowerQuery.includes('lose')) {
    return {
      content: `**⚠️ Understanding Crypto Risk:**\n\n` +
        `**Risk Levels by Coin Type:**\n` +
        `🟢 Lower Risk: BTC, ETH, stablecoins (still volatile!)\n` +
        `🟡 Medium Risk: Large-cap altcoins (SOL, ADA, DOT)\n` +
        `🔴 High Risk: Small-caps, new coins\n` +
        `💀 Extreme Risk: Meme coins, new DeFi projects\n\n` +
        `**Typical Volatility:**\n` +
        `• Bitcoin: Can swing 10-20% in a week\n` +
        `• Altcoins: Can swing 30-50% in a week\n` +
        `• Meme coins: Can drop 80%+ overnight\n\n` +
        `**Risk Management Tips:**\n` +
        `1. Only invest what you can lose 100%\n` +
        `2. Diversify across multiple coins\n` +
        `3. Use stop-losses if trading\n` +
        `4. Don't use leverage as a beginner\n` +
        `5. Have an emergency fund OUTSIDE crypto\n\n` +
        `📊 Check our Risk Analysis tool for detailed metrics!`,
      sources: ['DataSimplify Risk Analysis']
    };
  }

  // DeFi
  if (lowerQuery.includes('defi') || lowerQuery.includes('yield') || lowerQuery.includes('staking') || lowerQuery.includes('apy')) {
    return {
      content: `**🏦 DeFi Explained Simply:**\n\n` +
        `**What is DeFi?**\n` +
        `DeFi = "Decentralized Finance" = Banking without banks!\n\n` +
        `**Ways to Earn:**\n` +
        `• **Staking**: Lock your crypto, earn 3-8% APY\n` +
        `• **Lending**: Lend to others, earn interest\n` +
        `• **Liquidity**: Provide liquidity, earn fees\n\n` +
        `**APY Guide:**\n` +
        `🟢 1-5% APY: Safe (ETH staking, major protocols)\n` +
        `🟡 5-20% APY: Medium risk\n` +
        `🔴 20%+ APY: High risk! Often unsustainable\n\n` +
        `⚠️ **Risks:**\n` +
        `• Smart contract bugs\n` +
        `• Impermanent loss\n` +
        `• Rug pulls (scams)\n\n` +
        `💡 **Beginner tip:** Start with simple staking on major exchanges before exploring DeFi.`,
      sources: ['DataSimplify DeFi Guide', 'DeFiLlama']
    };
  }

  // Default crypto response
  return {
    content: `I can help you with:\n\n` +
      `📊 **Market Data**: "What's the price of Bitcoin?"\n` +
      `😱 **Sentiment**: "What's the Fear & Greed Index?"\n` +
      `📰 **News**: "What's the latest crypto news?"\n` +
      `🔥 **Trends**: "What coins are trending?"\n` +
      `💼 **Portfolio**: "How should I allocate my portfolio?"\n` +
      `🎓 **Learning**: "I'm new to crypto, where do I start?"\n` +
      `⚠️ **Risk**: "How risky is investing in crypto?"\n` +
      `🏦 **DeFi**: "What is DeFi and staking?"\n\n` +
      `Just ask me anything about cryptocurrency and investing! 🚀`,
    sources: ['DataSimplify Help']
  };
};

export function CryptoAIChat({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `👋 **Hi! I'm your Crypto AI Assistant!**\n\nI have access to real-time crypto data, news, and market analysis. I can help you with:\n\n• 📊 Price checks and market data\n• 📰 Latest crypto news\n• 😱 Market sentiment (Fear & Greed)\n• 💼 Portfolio advice for beginners\n• 🎓 Learning about crypto\n\n**Note:** I ONLY answer crypto and investment questions. Ask me anything! 🚀`,
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const cryptoData = getCryptoData();

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    // Simulate AI thinking
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));

    let response: Message;

    // Check if crypto-related
    if (!isCryptoRelated(input)) {
      response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `🚫 **Sorry, I can only help with crypto and investment topics!**\n\nI'm specialized in cryptocurrency data and can't help with:\n• General knowledge questions\n• Coding or programming\n• Writing stories or essays\n• Health, travel, or lifestyle\n• Other non-crypto topics\n\n**Try asking me about:**\n• "What's the price of Bitcoin?"\n• "Should beginners buy altcoins?"\n• "What's the market sentiment today?"\n• "How do I start investing in crypto?"`,
        timestamp: new Date(),
      };
    } else {
      const aiResponse = generateResponse(input, cryptoData);
      response = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse.content,
        timestamp: new Date(),
        sources: aiResponse.sources,
      };
    }

    setIsTyping(false);
    setMessages(prev => [...prev, response]);
  };

  // Quick action buttons
  const quickActions = [
    { label: '📊 BTC Price', query: 'What is the current Bitcoin price?' },
    { label: '😱 Fear & Greed', query: 'What is the Fear and Greed Index today?' },
    { label: '📰 Latest News', query: 'What is the latest crypto news?' },
    { label: '🔥 Trending', query: 'What coins are trending right now?' },
    { label: '🎓 Beginner Guide', query: 'I\'m new to crypto, where should I start?' },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[600px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🤖</span>
          <div>
            <h2 className="font-bold text-lg">Crypto AI Assistant</h2>
            <p className="text-sm text-blue-100">Powered by real-time data • Crypto questions only</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {showBeginnerTips && messages.length === 1 && (
          <BeginnerTip title="💡 How to Use the AI">
            Ask questions in plain English! Examples:
            <br/>• "Is now a good time to buy Bitcoin?"
            <br/>• "Explain DeFi like I'm 5"
            <br/>• "What's making crypto go up today?"
          </BeginnerTip>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-xl p-4 ${
                message.role === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="whitespace-pre-wrap text-sm">
                {message.content.split('\n').map((line, i) => (
                  <span key={i}>
                    {line.split('**').map((part, j) => 
                      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                    )}
                    {i < message.content.split('\n').length - 1 && <br/>}
                  </span>
                ))}
              </div>
              
              {message.sources && message.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200/30">
                  <p className="text-xs opacity-75">
                    📚 Sources: {message.sources.join(', ')}
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-xl p-4">
              <div className="flex gap-1">
                <span className="animate-bounce">●</span>
                <span className="animate-bounce animation-delay-100">●</span>
                <span className="animate-bounce animation-delay-200">●</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {messages.length <= 2 && (
        <div className="px-4 py-2 border-t border-gray-100">
          <p className="text-xs text-gray-500 mb-2">Quick questions:</p>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => {
                  setInput(action.query);
                }}
                className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-600"
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask anything about crypto..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          🔒 Crypto & investment questions only • Not financial advice
        </p>
      </form>
    </div>
  );
}

export default CryptoAIChat;
