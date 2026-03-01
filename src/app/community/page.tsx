'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageCircle, TrendingUp, Shield, Lightbulb, BarChart3, BookOpen, Users, ExternalLink, ChevronRight } from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

/* ------------------------------------------------------------------ */
/*  Forum topic definitions                                           */
/* ------------------------------------------------------------------ */

interface ForumTopic {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  threads: ForumThread[];
  color: string;
}

interface ForumThread {
  title: string;
  author: string;
  replies: number;
  views: number;
  lastActivity: string;
  pinned?: boolean;
}

const FORUM_TOPICS: ForumTopic[] = [
  {
    id: 'market-analysis',
    title: 'Market Analysis & Predictions',
    description: 'Share technical analysis, price predictions, and market outlook for Bitcoin, Ethereum, and altcoins.',
    icon: <TrendingUp className="w-5 h-5" />,
    color: 'emerald',
    threads: [
      { title: 'Bitcoin Weekly Analysis — Key Support & Resistance Levels', author: 'CryptoReportKit', replies: 24, views: 1820, lastActivity: '2h ago', pinned: true },
      { title: 'ETH/BTC Ratio Hitting Multi-Year Low — What It Means', author: 'ChartMaster', replies: 18, views: 945, lastActivity: '5h ago' },
      { title: 'Altcoin Season Index: Are We Close?', author: 'AltHunter', replies: 31, views: 2100, lastActivity: '1d ago' },
      { title: 'Fear & Greed Index at 22 — Historical Buy Signal?', author: 'SentimentTrader', replies: 12, views: 680, lastActivity: '3h ago' },
    ],
  },
  {
    id: 'trading-strategies',
    title: 'Trading Strategies & Tools',
    description: 'Discuss confluence strategies, backtesting setups, indicator combinations, and CryptoReportKit DataLab tips.',
    icon: <BarChart3 className="w-5 h-5" />,
    color: 'blue',
    threads: [
      { title: 'How I Use Confluence Zones to Time My Entries', author: 'CryptoReportKit', replies: 42, views: 3200, lastActivity: '4h ago', pinned: true },
      { title: 'Best RSI + MACD Combo Settings for Crypto', author: 'TechTrader', replies: 27, views: 1560, lastActivity: '8h ago' },
      { title: 'DataLab Backtest Results: Mean Reversion on BTC', author: 'QuantCrypto', replies: 15, views: 890, lastActivity: '1d ago' },
      { title: 'Volume Profile Strategies — Share Your Setups', author: 'VolumeKing', replies: 9, views: 430, lastActivity: '2d ago' },
    ],
  },
  {
    id: 'defi-yield',
    title: 'DeFi, Yield & Staking',
    description: 'Explore DeFi protocols, yield farming opportunities, staking strategies, and liquidity pool analysis.',
    icon: <Lightbulb className="w-5 h-5" />,
    color: 'purple',
    threads: [
      { title: 'Top Stablecoin Yield Strategies in 2026', author: 'YieldFarmer', replies: 36, views: 2800, lastActivity: '6h ago', pinned: true },
      { title: 'Aave vs Compound vs Morpho — Which Lending Protocol?', author: 'DeFiDev', replies: 22, views: 1340, lastActivity: '12h ago' },
      { title: 'Liquid Staking Tokens (LST) Comparison', author: 'StakeNode', replies: 14, views: 760, lastActivity: '1d ago' },
      { title: 'Real-World Asset (RWA) Token Yields — Worth It?', author: 'RWAInvestor', replies: 8, views: 520, lastActivity: '3d ago' },
    ],
  },
  {
    id: 'security-scams',
    title: 'Security & Scam Alerts',
    description: 'Report scams, discuss wallet security, smart contract audits, and protect yourself from crypto fraud.',
    icon: <Shield className="w-5 h-5" />,
    color: 'red',
    threads: [
      { title: 'How to Verify Smart Contracts Before Investing', author: 'CryptoReportKit', replies: 19, views: 2400, lastActivity: '1d ago', pinned: true },
      { title: 'Warning: Fake Airdrop Links on Twitter/X', author: 'SecurityWatch', replies: 45, views: 4200, lastActivity: '3h ago' },
      { title: 'Hardware Wallet Comparison: Ledger vs Trezor 2026', author: 'ColdStorage', replies: 28, views: 1890, lastActivity: '2d ago' },
      { title: 'Common Phishing Tactics and How to Avoid Them', author: 'CryptoSafe', replies: 11, views: 930, lastActivity: '4d ago' },
    ],
  },
  {
    id: 'education',
    title: 'Education & Beginners',
    description: 'Ask questions, learn crypto fundamentals, understand blockchain technology, and get started with trading.',
    icon: <BookOpen className="w-5 h-5" />,
    color: 'amber',
    threads: [
      { title: 'Complete Beginner\'s Guide to Reading Crypto Charts', author: 'CryptoReportKit', replies: 56, views: 5600, lastActivity: '2h ago', pinned: true },
      { title: 'What Is Dollar-Cost Averaging (DCA)?', author: 'NewTrader', replies: 13, views: 1120, lastActivity: '1d ago' },
      { title: 'How to Read On-Chain Data for Beginners', author: 'OnChainGuru', replies: 21, views: 1560, lastActivity: '2d ago' },
      { title: 'Understanding Market Cap vs Fully Diluted Valuation', author: 'CryptoStudent', replies: 7, views: 480, lastActivity: '5d ago' },
    ],
  },
  {
    id: 'general',
    title: 'General Discussion',
    description: 'Off-topic crypto chat, news reactions, project discussions, memes, and community introductions.',
    icon: <MessageCircle className="w-5 h-5" />,
    color: 'gray',
    threads: [
      { title: 'Introduce Yourself — New Members Welcome!', author: 'CryptoReportKit', replies: 89, views: 7200, lastActivity: '1h ago', pinned: true },
      { title: 'Which Crypto Projects Are You Most Bullish On?', author: 'LongTermHodler', replies: 64, views: 3400, lastActivity: '4h ago' },
      { title: 'Regulation Updates: What\'s Happening in the US & EU', author: 'PolicyWatch', replies: 33, views: 2100, lastActivity: '8h ago' },
      { title: 'Best Crypto Podcasts and YouTube Channels', author: 'CryptoMedia', replies: 17, views: 980, lastActivity: '3d ago' },
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Color helpers                                                      */
/* ------------------------------------------------------------------ */

const colorMap: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  emerald: { bg: 'bg-emerald-400/10', text: 'text-emerald-400', border: 'border-emerald-400/30', badge: 'bg-emerald-400/20 text-emerald-300' },
  blue:    { bg: 'bg-blue-400/10',    text: 'text-blue-400',    border: 'border-blue-400/30',    badge: 'bg-blue-400/20 text-blue-300'    },
  purple:  { bg: 'bg-purple-400/10',  text: 'text-purple-400',  border: 'border-purple-400/30',  badge: 'bg-purple-400/20 text-purple-300'  },
  red:     { bg: 'bg-red-400/10',     text: 'text-red-400',     border: 'border-red-400/30',     badge: 'bg-red-400/20 text-red-300'     },
  amber:   { bg: 'bg-amber-400/10',   text: 'text-amber-400',   border: 'border-amber-400/30',   badge: 'bg-amber-400/20 text-amber-300'   },
  gray:    { bg: 'bg-gray-400/10',    text: 'text-gray-400',    border: 'border-gray-400/30',    badge: 'bg-gray-400/20 text-gray-300'    },
};

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function CommunityPage() {
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />

      {/* Hero */}
      <div className="bg-gradient-to-r from-emerald-600/20 to-teal-600/20 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-12">
          <Breadcrumb customTitle="Community" />
          <div className="flex items-center gap-3 mt-4 mb-3">
            <Users className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl md:text-4xl font-bold">Community Forum</h1>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl">
            Join the CryptoReportKit community. Discuss market analysis, trading strategies, DeFi, security, and more with fellow crypto enthusiasts.
          </p>
          <div className="flex items-center gap-6 mt-6 text-sm text-gray-400">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-emerald-400" /> 2,400+ members</span>
            <span className="flex items-center gap-1.5"><MessageCircle className="w-4 h-4 text-emerald-400" /> 6 forums</span>
            <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4 text-emerald-400" /> Active daily</span>
          </div>
        </div>
      </div>

      {/* Forum Topics */}
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* Quick Links */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {FORUM_TOPICS.map((topic) => {
            const c = colorMap[topic.color];
            return (
              <button
                key={topic.id}
                onClick={() => {
                  setExpandedTopic(expandedTopic === topic.id ? null : topic.id);
                  document.getElementById(topic.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`${c.bg} ${c.border} border rounded-lg p-3 text-center hover:brightness-125 transition-all`}
              >
                <div className={`${c.text} flex justify-center mb-1.5`}>{topic.icon}</div>
                <span className="text-xs font-medium text-gray-300">{topic.title.split(' &')[0].split(',')[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Topic Cards */}
        <div className="space-y-4">
          {FORUM_TOPICS.map((topic) => {
            const c = colorMap[topic.color];
            const isExpanded = expandedTopic === topic.id;
            const totalThreads = topic.threads.length;
            const totalReplies = topic.threads.reduce((sum, t) => sum + t.replies, 0);

            return (
              <div key={topic.id} id={topic.id} className="scroll-mt-20">
                {/* Topic Header */}
                <button
                  onClick={() => setExpandedTopic(isExpanded ? null : topic.id)}
                  className={`w-full bg-gray-800/60 border ${isExpanded ? c.border : 'border-gray-700/50'} rounded-xl p-5 hover:border-gray-600 transition-all text-left`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`${c.bg} ${c.text} p-2.5 rounded-lg`}>
                        {topic.icon}
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">{topic.title}</h2>
                        <p className="text-sm text-gray-400 mt-0.5">{topic.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="hidden md:flex items-center gap-4">
                        <span>{totalThreads} threads</span>
                        <span>{totalReplies} replies</span>
                      </div>
                      <ChevronRight className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </div>
                  </div>
                </button>

                {/* Thread List */}
                {isExpanded && (
                  <div className="mt-1 bg-gray-800/30 border border-gray-700/30 rounded-xl overflow-hidden">
                    {topic.threads.map((thread, idx) => (
                      <div
                        key={idx}
                        className={`flex items-center justify-between px-5 py-3.5 hover:bg-gray-700/30 transition-colors ${
                          idx < topic.threads.length - 1 ? 'border-b border-gray-700/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {thread.pinned && (
                            <span className={`${c.badge} text-[10px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0`}>
                              Pinned
                            </span>
                          )}
                          <span className={`text-sm ${thread.pinned ? 'font-semibold text-white' : 'text-gray-300'} truncate`}>
                            {thread.title}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0 ml-4">
                          <span className="hidden sm:inline">by {thread.author}</span>
                          <span className="hidden md:inline">{thread.replies} replies</span>
                          <span className="hidden lg:inline">{thread.views.toLocaleString()} views</span>
                          <span className="text-gray-600">{thread.lastActivity}</span>
                        </div>
                      </div>
                    ))}

                    {/* View All Button */}
                    <div className="px-5 py-3 border-t border-gray-700/30 bg-gray-800/20">
                      <span className={`text-xs ${c.text} font-medium flex items-center gap-1 cursor-pointer hover:underline`}>
                        View all threads in {topic.title} <ExternalLink className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Community Guidelines + CTA */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          {/* Guidelines */}
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Community Guidelines</h3>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">1.</span>
                <span>Be respectful — no personal attacks or harassment</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">2.</span>
                <span>No financial advice — share analysis, not guarantees</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">3.</span>
                <span>No spam or self-promotion without context</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">4.</span>
                <span>Report scams and suspicious links immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 mt-0.5">5.</span>
                <span>Use the correct forum for your topic</span>
              </li>
            </ul>
          </div>

          {/* CTA */}
          <div className="bg-gray-900 border border-emerald-400/20 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Join the Conversation</h3>
              <p className="text-sm text-gray-400 mb-6">
                Sign up for free to post threads, reply to discussions, and connect with the crypto community.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 rounded-lg text-sm font-semibold transition text-white"
              >
                Get Started Free
              </Link>
              <Link
                href="/blog"
                className="px-5 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition text-gray-300"
              >
                Read Our Blog
              </Link>
            </div>
          </div>
        </div>

        {/* Popular Topics Cloud */}
        <div className="mt-10 bg-gray-800/30 border border-gray-700/30 rounded-xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Trending Topics</h3>
          <div className="flex flex-wrap gap-2">
            {[
              'Bitcoin Price Analysis', 'Ethereum Merge', 'DeFi Yields', 'Crypto Tax 2026',
              'Fear & Greed Index', 'Altcoin Season', 'Smart Contract Security', 'RWA Tokenization',
              'AI Crypto Tokens', 'Stablecoin Regulation', 'Layer 2 Scaling', 'Portfolio Strategy',
              'Crypto Staking', 'NFT Market', 'Bitcoin ETF', 'Meme Coins', 'On-Chain Analytics',
              'Whale Tracking', 'Liquidation Heatmap', 'Confluence Trading',
            ].map((tag) => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-gray-700/50 border border-gray-600/30 rounded-full text-xs text-gray-300 hover:border-emerald-400/40 hover:text-emerald-300 cursor-pointer transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
