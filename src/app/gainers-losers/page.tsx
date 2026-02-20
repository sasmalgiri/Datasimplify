'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { GainersLosers } from '@/components/GainersLosers';
import { DisplayOnlyBadge } from '@/components/DisplayOnlyBadge';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function GainersLosersPage() {
  const [activeView, setActiveView] = useState<'split' | 'gainers' | 'losers'>('split');

  return (
    <div className="min-h-screen bg-gray-950">
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-8 h-8 text-emerald-500" />
            <TrendingDown className="w-8 h-8 text-red-500" />
            <h1 className="text-3xl font-bold text-white">Market Movers</h1>
          </div>
          <p className="text-gray-400">
            Track the top performing and worst performing cryptocurrencies in the last 24 hours.
            Analyze market momentum and identify potential opportunities.
          </p>
        </div>

        {/* Display Only Badge */}
        <DisplayOnlyBadge pageId="gainers_losers" variant="card" className="mb-6" />

        {/* View Toggle */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setActiveView('split')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeView === 'split'
                ? 'bg-gray-700 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Split View
          </button>
          <button
            onClick={() => setActiveView('gainers')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeView === 'gainers'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Gainers Only
          </button>
          <button
            onClick={() => setActiveView('losers')}
            className={`px-4 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
              activeView === 'losers'
                ? 'bg-red-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <TrendingDown className="w-4 h-4" />
            Losers Only
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-emerald-500/20 rounded-xl">
                <TrendingUp className="w-8 h-8 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Top Gainers</h3>
                <p className="text-sm text-emerald-400">Biggest 24h increases</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Coins with the highest percentage price increase in the last 24 hours.
              Consider momentum and volume when evaluating opportunities.
            </p>
          </div>

          <div className="bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/30 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-red-500/20 rounded-xl">
                <TrendingDown className="w-8 h-8 text-red-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Top Losers</h3>
                <p className="text-sm text-red-400">Biggest 24h decreases</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm">
              Coins with the highest percentage price decrease in the last 24 hours.
              May indicate selling pressure or potential bounce opportunities.
            </p>
          </div>
        </div>

        {/* Main Content */}
        {activeView === 'split' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <GainersLosers type="gainers" limit={15} showTitle={true} />
            <GainersLosers type="losers" limit={15} showTitle={true} />
          </div>
        ) : (
          <div className="mb-8">
            <GainersLosers type={activeView} limit={25} showTitle={true} />
          </div>
        )}

        {/* Tips Section */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">How to Use This Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-3">
              <h3 className="font-medium text-emerald-400 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                For Gainers
              </h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Check volume to confirm momentum</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Look for news or catalysts driving the move</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 mt-1">•</span>
                  <span>Be cautious of pump & dump schemes</span>
                </li>
              </ul>
            </div>
            <div className="space-y-3">
              <h3 className="font-medium text-red-400 flex items-center gap-2">
                <TrendingDown className="w-4 h-4" />
                For Losers
              </h3>
              <ul className="text-sm text-gray-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Understand the reason for the drop</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Check support levels before buying dips</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-1">•</span>
                  <span>Avoid catching falling knives without analysis</span>
                </li>
              </ul>
            </div>
          </div>
        </div>


        {/* Attribution */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Data provided by{' '}
            <a
              href="https://www.coingecko.com/en/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              CoinGecko
            </a>
            . Updated every 5 minutes. Not financial advice.
          </p>
        </div>
      </main>
    </div>
  );
}
