'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Shield,
  BookOpen,
  ExternalLink,
  Calculator,
} from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { CRYPTO_MYTHS, type CryptoMyth } from '@/lib/myths';

const CATEGORY_LABELS: Record<CryptoMyth['category'], string> = {
  price: 'Price Myths',
  risk: 'Risk Myths',
  defi: 'DeFi Myths',
  influence: 'Influencer Myths',
  fundamentals: 'Fundamentals Myths',
  security: 'Security Myths',
  trading: 'Trading Myths',
};

const DANGER_LABELS: Record<1 | 2 | 3, { label: string; color: string }> = {
  1: { label: 'Moderate', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
  2: { label: 'High', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
  3: { label: 'Critical', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
};

function MythCard({ myth }: { myth: CryptoMyth }) {
  const [expanded, setExpanded] = useState(false);
  const danger = DANGER_LABELS[myth.dangerLevel];

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl overflow-hidden hover:border-gray-600/50 transition-colors">
      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{myth.icon}</span>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-gray-500 font-mono">#{myth.number}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full border ${danger.color}`}>
                  {danger.label} Risk
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white">{myth.title}</h3>
            </div>
          </div>
          <span className="text-xs text-gray-500 bg-gray-700/50 px-2 py-1 rounded whitespace-nowrap">
            {CATEGORY_LABELS[myth.category]}
          </span>
        </div>

        {/* What They Say - Red */}
        <div className="bg-red-500/[0.07] border border-red-500/20 rounded-lg p-4 mb-3">
          <p className="text-xs font-medium text-red-400 mb-1.5 uppercase tracking-wider">
            What they say
          </p>
          <p className="text-gray-300 text-sm leading-relaxed italic">{myth.whatTheySay}</p>
        </div>

        {/* The Reality - Green */}
        <div className="bg-emerald-500/[0.07] border border-emerald-500/20 rounded-lg p-4">
          <p className="text-xs font-medium text-emerald-400 mb-1.5 uppercase tracking-wider">
            The reality
          </p>
          <p className="text-gray-300 text-sm leading-relaxed">{myth.theReality}</p>
        </div>
      </div>

      {/* Expandable Section */}
      <div className="border-t border-gray-700/50">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between px-5 py-3 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <span>{expanded ? 'Hide details' : 'Why it matters + real example'}</span>
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {expanded && (
          <div className="px-5 pb-5 space-y-4">
            {/* Why It Matters */}
            <div>
              <p className="text-xs font-medium text-amber-400 mb-1.5 uppercase tracking-wider">
                Why it matters
              </p>
              <p className="text-gray-400 text-sm leading-relaxed">{myth.whyItMatters}</p>
            </div>

            {/* Real Example */}
            {myth.realExample && (
              <div className="bg-gray-900/50 border border-gray-700/30 rounded-lg p-4">
                <p className="text-xs font-medium text-blue-400 mb-1.5 uppercase tracking-wider">
                  Real example
                </p>
                <p className="text-gray-400 text-sm leading-relaxed">{myth.realExample}</p>
              </div>
            )}

            {/* Related Links */}
            <div className="flex flex-wrap gap-2 pt-1">
              {myth.relatedGlossaryTerms.map((term) => (
                <Link
                  key={term}
                  href={`/glossary#${term}`}
                  className="text-xs px-2.5 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full hover:bg-emerald-500/20 transition-colors"
                >
                  {term.replace(/-/g, ' ')}
                </Link>
              ))}
              {myth.relatedBlogSlugs.map((slug) => (
                <Link
                  key={slug}
                  href={`/blog/${slug}`}
                  className="text-xs px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" />
                  blog
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MarketCapCalculator() {
  const [supply, setSupply] = useState('');
  const [targetPrice, setTargetPrice] = useState('');

  const supplyNum = parseFloat(supply.replace(/,/g, ''));
  const priceNum = parseFloat(targetPrice.replace(/,/g, ''));
  const marketCap = !isNaN(supplyNum) && !isNaN(priceNum) ? supplyNum * priceNum : null;

  function formatLarge(n: number): string {
    if (n >= 1e15) return `$${(n / 1e15).toFixed(2)} quadrillion`;
    if (n >= 1e12) return `$${(n / 1e12).toFixed(2)} trillion`;
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)} billion`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)} million`;
    return `$${n.toLocaleString()}`;
  }

  const globalGdp = 105e12;
  const btcMarketCap = 1.2e12;
  const totalCryptoMarketCap = 2.5e12;

  return (
    <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 mt-10 mb-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
          <Calculator className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-white">Market Cap Reality Calculator</h3>
          <p className="text-sm text-gray-500">Do the math yourself — type any coin&apos;s supply and your dream price</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Circulating Supply (tokens)</label>
          <input
            type="text"
            value={supply}
            onChange={(e) => setSupply(e.target.value)}
            placeholder="e.g. 589000000000000"
            className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
        <div>
          <label className="text-xs text-gray-400 mb-1.5 block">Target Price ($)</label>
          <input
            type="text"
            value={targetPrice}
            onChange={(e) => setTargetPrice(e.target.value)}
            placeholder="e.g. 1"
            className="w-full px-3 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/50"
          />
        </div>
      </div>

      {marketCap !== null && marketCap > 0 && (
        <div className="space-y-3">
          <div className="bg-gray-900/60 border border-gray-700/30 rounded-lg p-4">
            <p className="text-xs text-gray-500 mb-1">Required Market Cap</p>
            <p className="text-2xl font-bold text-white">{formatLarge(marketCap)}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-900/40 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">vs Bitcoin</p>
              <p className={`text-sm font-semibold ${marketCap > btcMarketCap ? 'text-red-400' : 'text-emerald-400'}`}>
                {(marketCap / btcMarketCap).toFixed(1)}x
              </p>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">vs Total Crypto</p>
              <p className={`text-sm font-semibold ${marketCap > totalCryptoMarketCap ? 'text-red-400' : 'text-emerald-400'}`}>
                {(marketCap / totalCryptoMarketCap).toFixed(1)}x
              </p>
            </div>
            <div className="bg-gray-900/40 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">vs World GDP</p>
              <p className={`text-sm font-semibold ${marketCap > globalGdp ? 'text-red-400' : 'text-amber-400'}`}>
                {(marketCap / globalGdp).toFixed(1)}x
              </p>
            </div>
          </div>

          {marketCap > totalCryptoMarketCap && (
            <p className="text-red-400 text-sm bg-red-500/[0.07] border border-red-500/20 rounded-lg p-3">
              This would require a market cap larger than the entire cryptocurrency market combined. Mathematically extremely unlikely.
            </p>
          )}
          {marketCap > globalGdp && (
            <p className="text-red-400 text-sm bg-red-500/[0.07] border border-red-500/20 rounded-lg p-3">
              This would require a market cap larger than the entire world&apos;s GDP ($105 trillion). This is mathematically impossible.
            </p>
          )}
        </div>
      )}

      <p className="text-xs text-gray-600 mt-4">
        Try Shiba Inu: supply 589,000,000,000,000 at $1 target. Or Dogecoin: supply 140,000,000,000 at $60,000 target.
      </p>
    </div>
  );
}

export default function MythsPage() {
  const [filter, setFilter] = useState<CryptoMyth['category'] | 'all'>('all');

  const filtered =
    filter === 'all' ? CRYPTO_MYTHS : CRYPTO_MYTHS.filter((m) => m.category === filter);

  const categories = Object.keys(CATEGORY_LABELS) as CryptoMyth['category'][];

  return (
    <div className="min-h-screen bg-gray-950">
      <FreeNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <Breadcrumb />

        {/* Hero */}
        <div className="text-center mt-8 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 text-sm mb-5">
            <AlertTriangle className="w-4 h-4" />
            Education, not financial advice
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            15 Crypto Myths That Cost Beginners Money
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            YouTube influencers, Telegram groups, and Twitter threads spread these myths daily.
            Here&apos;s the math and data they leave out.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
              filter === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700/50'
            }`}
          >
            All ({CRYPTO_MYTHS.length})
          </button>
          {categories.map((cat) => {
            const count = CRYPTO_MYTHS.filter((m) => m.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setFilter(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-sm transition-colors ${
                  filter === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white border border-gray-700/50'
                }`}
              >
                {CATEGORY_LABELS[cat]} ({count})
              </button>
            );
          })}
        </div>

        {/* Myth Cards */}
        <div className="space-y-5">
          {filtered.map((myth) => (
            <MythCard key={myth.id} myth={myth} />
          ))}
        </div>

        {/* Market Cap Calculator */}
        <MarketCapCalculator />

        {/* Bottom CTA */}
        <div className="mt-10 grid sm:grid-cols-2 gap-5">
          <Link
            href="/learn/path"
            className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 hover:border-emerald-500/30 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-emerald-400 transition-colors">
                Start the Learning Path
              </h3>
            </div>
            <p className="text-gray-400 text-sm">
              6 levels from absolute beginner to research pro. 40 topics with links to our tools.
              Track your progress.
            </p>
          </Link>
          <Link
            href="/glossary"
            className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-6 hover:border-emerald-500/30 transition-colors group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white group-hover:text-blue-400 transition-colors">
                Crypto Glossary
              </h3>
            </div>
            <p className="text-gray-400 text-sm">
              100+ terms explained in plain English. Search by category or difficulty level.
            </p>
          </Link>
        </div>
      </main>
    </div>
  );
}
