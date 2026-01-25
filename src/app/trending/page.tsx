'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TrendingCoins } from '@/components/TrendingCoins';
import { GainersLosers } from '@/components/GainersLosers';
import { DisplayOnlyBadge } from '@/components/DisplayOnlyBadge';
import { Flame, TrendingUp, TrendingDown, BarChart3 } from 'lucide-react';

export default function TrendingPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Flame className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold text-white">Trending Cryptocurrencies</h1>
          </div>
          <p className="text-gray-400">
            Discover the hottest cryptocurrencies right now based on search activity and market interest.
            Data powered by CoinGecko Analyst API.
          </p>
        </div>

        {/* Display Only Badge */}
        <DisplayOnlyBadge pageId="trending" variant="card" className="mb-6" />

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Link
            href="#trending"
            className="bg-gradient-to-br from-orange-600/20 to-orange-900/20 border border-orange-500/30 rounded-xl p-4 hover:border-orange-500/50 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Flame className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-orange-400 transition">
                  Trending Now
                </h3>
                <p className="text-sm text-gray-400">Most searched coins</p>
              </div>
            </div>
          </Link>

          <Link
            href="#gainers"
            className="bg-gradient-to-br from-emerald-600/20 to-emerald-900/20 border border-emerald-500/30 rounded-xl p-4 hover:border-emerald-500/50 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-emerald-400 transition">
                  Top Gainers
                </h3>
                <p className="text-sm text-gray-400">Biggest price increases</p>
              </div>
            </div>
          </Link>

          <Link
            href="#losers"
            className="bg-gradient-to-br from-red-600/20 to-red-900/20 border border-red-500/30 rounded-xl p-4 hover:border-red-500/50 transition group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <TrendingDown className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="font-semibold text-white group-hover:text-red-400 transition">
                  Top Losers
                </h3>
                <p className="text-sm text-gray-400">Biggest price decreases</p>
              </div>
            </div>
          </Link>
        </div>

        {/* Trending Section */}
        <section id="trending" className="mb-8">
          <TrendingCoins limit={15} showTitle={true} />
        </section>

        {/* Gainers & Losers Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <section id="gainers">
            <GainersLosers type="gainers" limit={10} showTitle={true} />
          </section>
          <section id="losers">
            <GainersLosers type="losers" limit={10} showTitle={true} />
          </section>
        </div>

        {/* Export Options */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-6 h-6 text-emerald-500" />
            <h2 className="text-xl font-semibold text-white">Export to Excel</h2>
          </div>
          <p className="text-gray-400 mb-4">
            Download trending coins and market movers data as Excel templates with live CRK formulas (BYOK).
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/download"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition"
            >
              Download Templates
            </Link>
            <Link
              href="/templates"
              className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition"
            >
              View All Templates
            </Link>
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
            . Updated every 5 minutes.
          </p>
        </div>
      </main>
    </div>
  );
}
