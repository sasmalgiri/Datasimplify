'use client';

import { useState } from 'react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

// Help Icon with tooltip for explanations
function HelpIcon({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center ml-2"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="cursor-help w-5 h-5 rounded-full bg-purple-700 text-purple-200 text-xs flex items-center justify-center hover:bg-purple-500 hover:text-white transition-colors font-bold">
        ?
      </span>
      {isVisible && (
        <span className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 text-sm text-white bg-gray-900 rounded-lg shadow-2xl border border-purple-500/50 min-w-[250px] max-w-[350px] text-left whitespace-normal">
          {text}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></span>
        </span>
      )}
    </span>
  );
}

interface GlossaryTerm {
  term: string;
  simple: string;
  detailed: string;
  example?: string;
  category: string;
  related?: string[];
}

export default function GlossaryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedTerm, setExpandedTerm] = useState<string | null>(null);

  const glossaryTerms: GlossaryTerm[] = [
    // Basic Terms
    {
      term: 'Cryptocurrency',
      simple: 'Digital money that exists only on computers',
      detailed: 'Cryptocurrency is a type of digital currency that uses cryptography (secret codes) for security. Unlike regular money, it\'s not controlled by any government or bank. Bitcoin was the first cryptocurrency, created in 2009.',
      example: 'Bitcoin, Ethereum, and Solana are all cryptocurrencies.',
      category: 'basics',
      related: ['Bitcoin', 'Blockchain', 'Wallet']
    },
    {
      term: 'Bitcoin (BTC)',
      simple: 'The first and most famous cryptocurrency - like digital gold',
      detailed: 'Bitcoin was created in 2009 by an anonymous person called Satoshi Nakamoto. It\'s designed to be scarce (only 21 million will ever exist) and decentralized (no one controls it). Many people use it to store value, like digital gold.',
      example: 'If you bought $100 of Bitcoin in 2013, it would be worth over $1 million today.',
      category: 'coins',
      related: ['Cryptocurrency', 'Satoshi', 'Blockchain']
    },
    {
      term: 'Ethereum (ETH)',
      simple: 'A cryptocurrency that lets you run programs on its network',
      detailed: 'Ethereum is like a world computer that anyone can use. It runs "smart contracts" - programs that execute automatically. Most NFTs and DeFi apps run on Ethereum. ETH is the currency used to pay for these operations.',
      example: 'When you buy an NFT, you usually pay in ETH.',
      category: 'coins',
      related: ['Smart Contract', 'Gas', 'DeFi']
    },
    {
      term: 'Blockchain',
      simple: 'A shared record book that everyone can see but no one can cheat',
      detailed: 'A blockchain is a digital ledger (record book) that stores all transactions. It\'s distributed across thousands of computers worldwide. Once data is added, it can\'t be changed, making it very secure and transparent.',
      example: 'When you send Bitcoin, the transaction is recorded on the blockchain forever.',
      category: 'basics',
      related: ['Decentralized', 'Transaction', 'Block']
    },
    {
      term: 'Wallet',
      simple: 'Where you store your cryptocurrency (like a digital bank account)',
      detailed: 'A crypto wallet stores your "private keys" which prove you own your crypto. There are "hot wallets" (connected to internet, convenient but less secure) and "cold wallets" (offline, more secure for large amounts).',
      example: 'MetaMask is a popular hot wallet. Ledger makes popular cold wallets.',
      category: 'basics',
      related: ['Private Key', 'Public Key', 'Seed Phrase']
    },
    {
      term: 'Private Key',
      simple: 'Your secret password that controls your crypto - NEVER share it!',
      detailed: 'A private key is a secret code (long string of numbers and letters) that proves you own your crypto. Anyone who has it can take your money. That\'s why you should never share it with anyone, ever.',
      example: 'A private key looks like: 5Kb8kLf9zgWQnogidDA76MzPL6TsZZY36hWXMssSzNydYXYB9KF',
      category: 'security',
      related: ['Wallet', 'Seed Phrase', 'Public Key']
    },
    {
      term: 'Seed Phrase',
      simple: '12-24 words that can recover your wallet - keep it secret and safe!',
      detailed: 'A seed phrase (or recovery phrase) is a list of 12-24 random words that can restore your entire wallet. Write it on paper and store it safely. Never type it on a website or share it with anyone.',
      example: '"apple banana cherry date elephant..." - these random words ARE your wallet backup.',
      category: 'security',
      related: ['Private Key', 'Wallet']
    },
    
    // Market Terms
    {
      term: 'Market Cap',
      simple: 'Total value of all coins in existence - measures how big a crypto is',
      detailed: 'Market Cap = Current Price × Number of Coins. It shows the total value of a cryptocurrency. Higher market cap usually means more established and less risky (but also less potential for explosive growth).',
      example: 'Bitcoin\'s market cap is about $1.9 trillion. A small altcoin might have $10 million.',
      category: 'market',
      related: ['Volume', 'Price', 'Circulating Supply']
    },
    {
      term: 'Volume',
      simple: 'How much of a coin is being bought and sold',
      detailed: 'Trading volume shows the total value of trades in a period (usually 24 hours). High volume means lots of activity and liquidity. Low volume can make prices more volatile.',
      example: 'Bitcoin might have $50 billion daily volume, while a small coin has $100,000.',
      category: 'market',
      related: ['Market Cap', 'Liquidity']
    },
    {
      term: 'Bull Market',
      simple: 'When prices are going up and people are optimistic 📈',
      detailed: 'A bull market is when prices rise for an extended period. People are confident and buying. The term comes from how a bull attacks - by thrusting its horns upward.',
      example: '2020-2021 was a bull market where Bitcoin went from $10K to $69K.',
      category: 'market',
      related: ['Bear Market', 'ATH', 'FOMO']
    },
    {
      term: 'Bear Market',
      simple: 'When prices are falling and people are pessimistic 📉',
      detailed: 'A bear market is when prices decline for an extended period. People are fearful and selling. The term comes from how a bear attacks - by swiping its paws downward.',
      example: '2022 was a bear market where Bitcoin fell from $69K to $16K.',
      category: 'market',
      related: ['Bull Market', 'Crash', 'Capitulation']
    },
    {
      term: 'ATH (All-Time High)',
      simple: 'The highest price a coin has ever reached',
      detailed: 'ATH is the peak price in a crypto\'s history. It is commonly referenced as a historical benchmark and psychological level.',
      example: 'Bitcoin\'s ATH was about $99,800 in December 2024.',
      category: 'market',
      related: ['ATL', 'Bull Market', 'Breakout']
    },
    {
      term: 'ATL (All-Time Low)',
      simple: 'The lowest price a coin has ever reached',
      detailed: 'ATL is the lowest price in a crypto\'s history. It\'s a historical reference point and does not imply future performance.',
      example: 'Many altcoins from 2017 are still 99% below their ATH.',
      category: 'market'
    },
    
    // Trading Terms
    {
      term: 'HODL',
      simple: 'Hold on for dear life - not selling no matter what',
      detailed: 'HODL started as a typo of "HOLD" in a 2013 Bitcoin forum post. It became a meme and a long-term holding mindset in crypto culture.',
      example: 'Some long-term holders keep their positions through multiple market cycles.',
      category: 'trading',
      related: ['Diamond Hands', 'Paper Hands']
    },
    {
      term: 'FOMO',
      simple: 'Fear Of Missing Out - buying because everyone else is buying',
      detailed: 'FOMO is the anxiety that you\'re missing out. It can lead to impulsive decisions, especially during volatile markets.',
      example: 'FOMO made many people buy Dogecoin at its peak, then lose 80%.',
      category: 'trading',
      related: ['FUD', 'DYOR']
    },
    {
      term: 'FUD',
      simple: 'Fear, Uncertainty, and Doubt - negative news that scares people',
      detailed: 'FUD refers to negative information (sometimes false) that causes fear and selling. It can be legitimate concerns or manipulation to drive prices down.',
      example: '"China bans Bitcoin" has been FUD headline many times over the years.',
      category: 'trading',
      related: ['FOMO', 'Paper Hands']
    },
    {
      term: 'DYOR',
      simple: 'Do Your Own Research - don\'t trust random advice',
      detailed: 'DYOR means you should verify information yourself instead of blindly following tips. Cross-check sources, understand risks, and read primary documentation where possible.',
      example: 'Someone on social media says "this is guaranteed" — DYOR and verify sources before acting.',
      category: 'trading',
      related: ['NFA']
    },
    {
      term: 'Whale',
      simple: 'Someone who owns a LOT of cryptocurrency',
      detailed: 'Whales are individuals or entities holding large amounts of crypto. Their trades can move markets. Watching whale activity can give hints about market direction.',
      example: 'A Bitcoin whale might own 1,000+ BTC (worth ~$100 million).',
      category: 'trading',
      related: ['Smart Money', 'Pump and Dump']
    },
    {
      term: 'Diamond Hands 💎🙌',
      simple: 'Someone who holds their crypto no matter how much it drops',
      detailed: 'Diamond hands is crypto slang for holding through high volatility instead of reacting emotionally.',
      example: 'Someone might describe themselves as having “diamond hands” during a major drawdown.',
      category: 'trading',
      related: ['Paper Hands', 'HODL']
    },
    {
      term: 'Paper Hands 📄🙌',
      simple: 'Someone who sells at the first sign of trouble',
      detailed: 'Paper hands is crypto slang for exiting a position quickly during volatility due to fear or uncertainty.',
      example: 'Someone might be called “paper hands” for selling during a sudden price drop.',
      category: 'trading',
      related: ['Diamond Hands', 'FUD']
    },
    
    // DeFi Terms
    {
      term: 'DeFi',
      simple: 'Decentralized Finance - banking without banks',
      detailed: 'DeFi recreates financial services (lending, borrowing, trading) using blockchain instead of banks. It\'s available to anyone with internet, 24/7, without paperwork.',
      example: 'Aave lets you earn interest on crypto without a bank account.',
      category: 'defi',
      related: ['Smart Contract', 'Yield', 'TVL']
    },
    {
      term: 'TVL',
      simple: 'Total Value Locked - how much money is in a DeFi project',
      detailed: 'TVL measures the total value of crypto deposited in a DeFi protocol. Higher TVL generally indicates more trust and usage.',
      example: 'Lido has about $35 billion in TVL, making it the largest DeFi protocol.',
      category: 'defi',
      related: ['DeFi', 'Liquidity']
    },
    {
      term: 'Yield',
      simple: 'Interest you earn by lending or staking your crypto',
      detailed: 'Yield is the return you get for providing liquidity or staking. It\'s usually expressed as APY (Annual Percentage Yield). Higher yield often means higher risk.',
      example: 'You might earn 5% APY by staking ETH, or 20% on a risky DeFi protocol.',
      category: 'defi',
      related: ['Staking', 'APY', 'DeFi']
    },
    {
      term: 'Staking',
      simple: 'Locking up your crypto to help secure the network and earn rewards',
      detailed: 'Staking means locking your crypto to help validate transactions on proof-of-stake blockchains. In return, you earn rewards (like interest). It\'s less energy-intensive than mining.',
      example: 'Staking ETH earns about 4% per year.',
      category: 'defi',
      related: ['Yield', 'Proof of Stake', 'Validator']
    },
    {
      term: 'Gas',
      simple: 'The fee you pay to make transactions on Ethereum',
      detailed: 'Gas is the cost of computing power on Ethereum. Every transaction requires gas, paid in ETH. When the network is busy, gas prices go up significantly.',
      example: 'A simple transfer might cost $1 in gas, but minting an NFT might cost $50.',
      category: 'defi',
      related: ['Ethereum', 'Transaction', 'Gwei']
    },
    {
      term: 'Smart Contract',
      simple: 'A program that runs automatically when conditions are met',
      detailed: 'Smart contracts are self-executing programs on the blockchain. They automatically do things when certain conditions are met, without needing a middleman.',
      example: 'A smart contract might automatically release payment when goods are delivered.',
      category: 'defi',
      related: ['Ethereum', 'DeFi', 'Dapp']
    },

    // Other Terms
    {
      term: 'Altcoin',
      simple: 'Any cryptocurrency that isn\'t Bitcoin',
      detailed: 'Altcoin = "Alternative coin." It refers to any cryptocurrency other than Bitcoin. There are thousands of altcoins with various purposes and risk levels.',
      example: 'Ethereum, Solana, and Dogecoin are all altcoins.',
      category: 'coins',
      related: ['Bitcoin', 'Shitcoin', 'Token']
    },
    {
      term: 'NFT',
      simple: 'A unique digital item you can own (like digital art or collectibles)',
      detailed: 'NFT = Non-Fungible Token. It\'s a unique digital certificate of ownership on the blockchain. NFTs can represent art, music, game items, or any unique digital asset.',
      example: 'Bored Ape Yacht Club NFTs have sold for millions of dollars.',
      category: 'other',
      related: ['Ethereum', 'Smart Contract', 'Mint']
    },
    {
      term: 'Airdrop',
      simple: 'Free crypto given out to promote a project',
      detailed: 'Airdrops are free tokens distributed to wallets, usually to promote a new project or reward early users. Some airdrops have been worth thousands of dollars.',
      example: 'People who used Uniswap early got a $1,200 airdrop.',
      category: 'other',
      related: ['Token', 'Wallet']
    },
    {
      term: 'Rug Pull',
      simple: 'A scam where developers steal investors\' money and disappear',
      detailed: 'A rug pull happens when project creators build hype, collect money, then abandon the project with investors\' funds. Common in new, unaudited projects.',
      example: 'Many 2021 meme coins were rug pulls where creators made millions.',
      category: 'security',
      related: ['Scam', 'DYOR']
    },
    {
      term: 'To The Moon 🚀',
      simple: 'Expecting a cryptocurrency\'s price to increase dramatically',
      detailed: 'When people say a coin is "going to the moon," they believe its price will rise significantly. Often used optimistically (or sarcastically).',
      example: '"Bitcoin to the moon! 🚀" - common crypto Twitter phrase.',
      category: 'trading',
      related: ['Bull Market', 'FOMO']
    },
  ];

  const categories = [
    { id: 'all', label: 'All Terms', emoji: '📚' },
    { id: 'basics', label: 'Basics', emoji: '🔰' },
    { id: 'coins', label: 'Coins', emoji: '🪙' },
    { id: 'market', label: 'Market', emoji: '📊' },
    { id: 'trading', label: 'Trading', emoji: '📈' },
    { id: 'defi', label: 'DeFi', emoji: '🏦' },
    { id: 'security', label: 'Security', emoji: '🔒' },
    { id: 'other', label: 'Other', emoji: '💡' },
  ];

  // Filter terms
  const filteredTerms = glossaryTerms.filter(term => {
    const matchesSearch = term.term.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         term.simple.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || term.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-4">
            <h1 className="text-4xl font-bold">📖 Crypto Glossary</h1>
            <HelpIcon text="This glossary explains crypto terms in simple language. Click any term to see a detailed explanation with examples." />
          </div>
          <p className="text-xl text-purple-100 mb-2">
            {glossaryTerms.length}+ terms explained in simple English
          </p>
          <p className="text-purple-200 mb-6">No login required • 100% Free</p>

          {/* Search */}
          <div className="relative max-w-md">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a term..."
              className="w-full px-4 py-3 pl-12 rounded-lg text-gray-900 placeholder-gray-500"
            />
            <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
              🔍
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Beginner Tip */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-700 text-sm flex items-start gap-2">
            <span>💡</span>
            <span>
              <strong>How to use:</strong> Search for any crypto term or click a category below to filter.
              Click on any term to expand it and see a detailed explanation with real examples.
              Related terms at the bottom let you explore connected concepts!
            </span>
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {cat.emoji} {cat.label}
            </button>
          ))}
        </div>

        {/* Results Count */}
        <p className="text-gray-500 mb-4">
          Showing {filteredTerms.length} term{filteredTerms.length !== 1 ? 's' : ''}
        </p>

        {/* Terms List */}
        <div className="space-y-3">
          {filteredTerms.map((term) => (
            <div
              key={term.term}
              className="bg-white rounded-lg border border-gray-200 overflow-hidden"
            >
              <button
                onClick={() => setExpandedTerm(expandedTerm === term.term ? null : term.term)}
                className="w-full p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">{term.term}</h3>
                    <p className="text-gray-600 mt-1">{term.simple}</p>
                  </div>
                  <span className={`text-2xl transition-transform ${expandedTerm === term.term ? 'rotate-180' : ''}`}>
                    ▼
                  </span>
                </div>
              </button>
              
              {expandedTerm === term.term && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4 space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-1">📝 Detailed Explanation</h4>
                      <p className="text-gray-600">{term.detailed}</p>
                    </div>
                    
                    {term.example && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-1">💡 Example</h4>
                        <p className="text-blue-700">{term.example}</p>
                      </div>
                    )}
                    
                    {term.related && term.related.length > 0 && (
                      <div>
                        <h4 className="font-semibold text-gray-700 mb-2">🔗 Related Terms</h4>
                        <div className="flex flex-wrap gap-2">
                          {term.related.map((related) => (
                            <button
                              key={related}
                              onClick={() => {
                                setSearchQuery(related);
                                setExpandedTerm(related);
                              }}
                              className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-gray-200"
                            >
                              {related}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredTerms.length === 0 && (
          <div className="text-center py-12">
            <span className="text-6xl">🤔</span>
            <h3 className="text-xl font-bold mt-4">No terms found</h3>
            <p className="text-gray-500 mt-2">
              Try a different search or category
            </p>
          </div>
        )}

        {/* Bottom CTA */}
        <div className="mt-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">🎓 Ready to Learn More?</h2>
          <p className="text-green-100 mb-6">
            Now that you know the terms, dive into our full Crypto Academy course!
          </p>
          <a
            href="/learn"
            className="inline-block bg-white text-green-600 px-8 py-3 rounded-lg font-bold hover:bg-green-50 transition-colors"
          >
            Start Learning →
          </a>
        </div>
      </div>
    </div>
  );
}
