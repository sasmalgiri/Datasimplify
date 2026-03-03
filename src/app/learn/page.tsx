'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  GraduationCap,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  Coins,
  BarChart3,
  CandlestickChart,
  Boxes,
  ShieldCheck,
  MessageSquareText,
  Activity,
  Wrench,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Section data                                                       */
/* ------------------------------------------------------------------ */

interface LearnSection {
  id: string;
  icon: React.ReactNode;
  title: string;
  paragraphs: string[];
  takeaway: string;
  links?: { label: string; href: string }[];
}

const SECTIONS: LearnSection[] = [
  {
    id: 'what-is-crypto',
    icon: <Coins className="w-5 h-5 text-emerald-400" />,
    title: 'What is Cryptocurrency?',
    paragraphs: [
      'A cryptocurrency is a digital asset secured by cryptography and recorded on a blockchain — a distributed ledger maintained by thousands of computers worldwide. Because no single entity controls the network, cryptocurrencies are often described as "decentralized."',
      'Bitcoin, launched in 2009 by the pseudonymous Satoshi Nakamoto, was the first cryptocurrency. It introduced the idea that value can be transferred peer-to-peer without banks. Ethereum followed in 2015, adding programmable "smart contracts" that power an entire ecosystem of applications.',
      'Today there are thousands of cryptocurrencies, each with a different purpose — from store-of-value coins like Bitcoin to utility tokens that power decentralized applications. Understanding the fundamentals before investing is essential.',
    ],
    takeaway:
      'Cryptocurrency is digital money secured by cryptography on a decentralized blockchain. Bitcoin pioneered the space, and Ethereum expanded it with smart contracts.',
    links: [
      { label: 'Browse the Glossary', href: '/glossary' },
      { label: 'View Market Data', href: '/market' },
    ],
  },
  {
    id: 'market-data',
    icon: <BarChart3 className="w-5 h-5 text-blue-400" />,
    title: 'Understanding Market Data',
    paragraphs: [
      'Market capitalization (market cap) is the total value of a cryptocurrency\'s circulating supply — calculated as price times circulating coins. It is the most common way to rank and compare cryptocurrencies. A higher market cap generally indicates a more established project.',
      'Trading volume measures how much of a coin has been traded in a given period (usually 24 hours). High volume means strong interest and usually tighter spreads, while unusually low volume can signal declining interest. Circulating supply tells you how many coins are currently available, while total and max supply indicate potential future inflation.',
      'Other important metrics include the Fear & Greed Index — a composite sentiment score from 0 (extreme fear) to 100 (extreme greed) — and dominance, which shows Bitcoin\'s share of the total crypto market cap. Monitoring these numbers helps you gauge overall market health.',
    ],
    takeaway:
      'Market cap, volume, and supply are the three pillars of crypto market data. Combine them with sentiment indicators like Fear & Greed to get a full picture.',
    links: [
      { label: 'Live Market Overview', href: '/market' },
      { label: 'Sentiment Dashboard', href: '/sentiment' },
    ],
  },
  {
    id: 'reading-charts',
    icon: <CandlestickChart className="w-5 h-5 text-amber-400" />,
    title: 'Reading Charts',
    paragraphs: [
      'Candlestick charts are the standard way to visualize price action. Each candle represents a time period and shows four prices: open, high, low, and close. A green (or hollow) candle means the price closed higher than it opened; a red (or filled) candle means it closed lower.',
      'Support and resistance are price levels where buying or selling pressure tends to concentrate. Support is a "floor" where falling prices often bounce; resistance is a "ceiling" where rising prices stall. Identifying these levels helps traders set entry and exit points.',
      'Moving averages smooth out price noise over a set number of periods. The 50-day and 200-day simple moving averages (SMA) are widely watched. When the 50-day crosses above the 200-day, traders call it a "golden cross" (bullish); the opposite is a "death cross" (bearish).',
    ],
    takeaway:
      'Learn to read candlesticks, identify support and resistance zones, and use moving averages to filter noise. These three skills form the foundation of technical analysis.',
    links: [
      { label: 'Interactive Charts', href: '/charts' },
      { label: 'Technical Analysis', href: '/technical' },
    ],
  },
  {
    id: 'defi-explained',
    icon: <Boxes className="w-5 h-5 text-purple-400" />,
    title: 'DeFi Explained',
    paragraphs: [
      'Decentralized Finance (DeFi) recreates traditional financial services — lending, borrowing, trading — using smart contracts on blockchains like Ethereum and Solana. Instead of a bank acting as intermediary, code enforces the rules automatically.',
      'A decentralized exchange (DEX) like Uniswap lets you swap tokens directly from your wallet. Liquidity pools are the engine behind DEXs: users deposit token pairs into a pool and earn trading fees in return. This is called "providing liquidity."',
      'Yield farming takes this further by stacking rewards — you might provide liquidity, receive LP tokens, then stake those tokens in another protocol for additional rewards. While the returns can be attractive, DeFi carries smart-contract risk, impermanent loss, and the ever-present possibility of exploits. Always research protocols thoroughly before committing funds.',
    ],
    takeaway:
      'DeFi replaces banks with smart contracts. DEXs, liquidity pools, and yield farming offer new opportunities but come with unique risks like impermanent loss and smart-contract bugs.',
    links: [
      { label: 'DeFi Dashboard', href: '/defi' },
      { label: 'DEX Pool Explorer', href: '/dex-pools' },
    ],
  },
  {
    id: 'security',
    icon: <ShieldCheck className="w-5 h-5 text-red-400" />,
    title: 'Security Best Practices',
    paragraphs: [
      'Your crypto is only as safe as your wallet security. Hot wallets (browser extensions like MetaMask) are convenient but always connected to the internet. Cold wallets (hardware devices like Ledger or Trezor) keep your private keys offline and are recommended for storing significant amounts.',
      'Enable two-factor authentication (2FA) on every exchange and service. Use an authenticator app rather than SMS, which is vulnerable to SIM-swap attacks. Never share your seed phrase with anyone — legitimate services will never ask for it. Write it down on paper and store it in a secure location.',
      'Common scams include phishing sites that mimic real exchanges, fake airdrops that ask you to connect your wallet, and social-media impersonators promising free crypto. Always double-check URLs, bookmark official sites, and remember: if it sounds too good to be true, it almost certainly is.',
    ],
    takeaway:
      'Use a hardware wallet for long-term storage, enable app-based 2FA everywhere, and never share your seed phrase. Vigilance is your best defense against scams.',
    links: [
      { label: 'Risk Analysis Tools', href: '/risk' },
    ],
  },
  {
    id: 'trading-terms',
    icon: <MessageSquareText className="w-5 h-5 text-teal-400" />,
    title: 'Trading Terminology',
    paragraphs: [
      'Crypto has its own language. A "bull market" is a prolonged period of rising prices; a "bear market" is the opposite. "HODL" (a famous misspelling of "hold") means keeping your coins long-term regardless of short-term volatility. "FUD" stands for Fear, Uncertainty, and Doubt — negative sentiment that can drive panic selling.',
      '"FOMO" (Fear Of Missing Out) describes the urge to buy when prices are already surging. "ATH" is All-Time High — the highest price a coin has ever reached. "Whale" refers to an individual or entity holding a very large amount of a cryptocurrency, whose trades can move the market.',
      'Understanding order types matters too. A "market order" buys or sells immediately at the current price. A "limit order" only executes at a price you specify. "Slippage" is the difference between your expected price and the actual fill price, common in fast-moving or low-liquidity markets.',
    ],
    takeaway:
      'Master the lingo: HODL, FUD, FOMO, ATH, whale, bull and bear markets, and the difference between market and limit orders. The glossary has 100+ more terms.',
    links: [
      { label: 'Full Crypto Glossary', href: '/glossary' },
      { label: 'Whale Tracker', href: '/whales' },
    ],
  },
  {
    id: 'onchain-data',
    icon: <Activity className="w-5 h-5 text-orange-400" />,
    title: 'Understanding On-Chain Data',
    paragraphs: [
      'On-chain data is information recorded directly on the blockchain — every transaction, address balance, and smart-contract interaction is publicly verifiable. Analysts use this data to gauge network health and predict market trends.',
      'Key metrics include active addresses (how many unique wallets transacted recently), hash rate (the computational power securing a proof-of-work network like Bitcoin), and transaction volume (the total value moved on-chain). Rising active addresses and hash rate generally signal a healthy, growing network.',
      'More advanced on-chain indicators include exchange inflows and outflows (coins moving to/from exchanges — large inflows can signal selling pressure), the MVRV ratio (market value vs. realized value, useful for spotting overvaluation), and the NVT ratio (network value to transaction volume, sometimes called "crypto\'s P/E ratio").',
    ],
    takeaway:
      'On-chain data gives you a transparent look at what is actually happening on a blockchain. Active addresses, hash rate, and exchange flows are among the most actionable metrics.',
    links: [
      { label: 'On-Chain Analytics', href: '/charts' },
      { label: 'Correlation Matrix', href: '/correlation' },
    ],
  },
  {
    id: 'getting-started-crk',
    icon: <Wrench className="w-5 h-5 text-emerald-400" />,
    title: 'Getting Started with CryptoReportKit',
    paragraphs: [
      'CryptoReportKit (CRK) brings professional-grade crypto data directly into your workflow. The web dashboard gives you real-time market data, interactive charts, portfolio tracking, DeFi analytics, and on-chain metrics — all in one place.',
      'Use the Market page to browse thousands of coins, the Charts page for detailed technical analysis, and the Screener to filter coins by custom criteria. The Portfolio Builder lets you track your holdings and performance over time, while the Alerts system notifies you when prices hit your targets.',
      'For power users, CRK also offers an Excel Add-in with 85+ custom functions — pull live prices, historical data, wallet balances, and even AI-powered analysis directly into your spreadsheets. The Google Sheets add-on provides similar functionality for Workspace users.',
    ],
    takeaway:
      'CRK combines market data, charts, portfolio tracking, alerts, and on-chain analytics in one platform. Explore the dashboard or install the Excel/Sheets add-in to supercharge your research.',
    links: [
      { label: 'Market Overview', href: '/market' },
      { label: 'Interactive Charts', href: '/charts' },
      { label: 'Screener', href: '/screener' },
      { label: 'Portfolio Builder', href: '/portfolio' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Expandable section component                                       */
/* ------------------------------------------------------------------ */

function SectionCard({
  section,
  isOpen,
  onToggle,
}: {
  section: LearnSection;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden transition-colors hover:border-gray-600/60">
      {/* Header — always visible, acts as toggle */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer group"
      >
        <div className="flex items-center gap-3">
          {section.icon}
          <h3 className="text-lg font-semibold text-white group-hover:text-emerald-300 transition-colors">
            {section.title}
          </h3>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-400 shrink-0" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
        )}
      </button>

      {/* Collapsible body */}
      {isOpen && (
        <div className="px-5 pb-5 space-y-4 border-t border-gray-700/40 pt-4">
          {section.paragraphs.map((p, i) => (
            <p key={i} className="text-gray-300 text-sm leading-relaxed">
              {p}
            </p>
          ))}

          {/* Key Takeaway box */}
          <div className="flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mt-2">
            <Lightbulb className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                Key Takeaway
              </span>
              <p className="text-sm text-gray-200 mt-1">{section.takeaway}</p>
            </div>
          </div>

          {/* Related links */}
          {section.links && section.links.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full bg-gray-700/50 text-emerald-400 hover:bg-emerald-600/20 hover:text-emerald-300 transition-colors border border-gray-600/40"
                >
                  {link.label}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */

export default function LearnPage() {
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const allOpen = openSections.size === SECTIONS.length;

  const toggleAll = () => {
    if (allOpen) {
      setOpenSections(new Set());
    } else {
      setOpenSections(new Set(SECTIONS.map((s) => s.id)));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-gray-800 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <GraduationCap className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Crypto Academy
          </h1>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Free, beginner-friendly lessons covering everything from blockchain
            basics to on-chain analytics. Click any topic below to start
            learning.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        {/* Controls */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            Learning Topics
            <span className="text-sm font-normal text-gray-500">
              ({SECTIONS.length})
            </span>
          </h2>
          <button
            type="button"
            onClick={toggleAll}
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            {allOpen ? 'Collapse All' : 'Expand All'}
          </button>
        </div>

        {/* Sections */}
        <div className="space-y-3 mb-12">
          {SECTIONS.map((section) => (
            <SectionCard
              key={section.id}
              section={section}
              isOpen={openSections.has(section.id)}
              onToggle={() => toggle(section.id)}
            />
          ))}
        </div>

        {/* Glossary CTA */}
        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold mb-2">
                Want more? Check the Glossary
              </h2>
              <p className="text-gray-400 text-sm">
                100+ crypto terms explained in simple English — from HODL to
                DeFi.
              </p>
            </div>
            <Link
              href="/glossary"
              className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition shrink-0"
            >
              Open Glossary
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
