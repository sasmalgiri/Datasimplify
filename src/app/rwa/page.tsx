'use client';

import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { RWADashboard } from '@/components/features/RWADashboard';
import { Landmark, ExternalLink, TrendingUp, Shield, Globe2, Info } from 'lucide-react';
import Link from 'next/link';

export default function RWAPage() {
  return (
    <div className="min-h-screen bg-gray-950">
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Landmark className="w-8 h-8 text-indigo-500" />
              <h1 className="text-3xl font-bold text-white">Real World Asset Tokenization</h1>
            </div>
            <p className="text-gray-400">
              Track tokenized treasuries, private credit, commodities, and other real-world assets on-chain.
            </p>
          </div>
          <a
            href="https://rwa.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition text-sm font-medium"
          >
            Explore RWA.xyz
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>

        {/* Info Banner */}
        <div className="bg-indigo-900/20 border border-indigo-500/30 rounded-xl p-4 mb-8">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-indigo-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-indigo-300 text-sm">
                <strong>What is RWA Tokenization?</strong> Real World Asset (RWA) tokenization is the process of creating
                digital tokens on a blockchain that represent ownership of physical or traditional financial assets like
                treasuries, real estate, commodities, and private credit. This enables 24/7 trading, fractional ownership,
                and improved liquidity for traditionally illiquid assets.
              </p>
            </div>
          </div>
        </div>

        {/* Main Dashboard */}
        <RWADashboard className="mb-8" />

        {/* Why RWA Matters Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="font-semibold text-white">Rapid Growth</h3>
            </div>
            <p className="text-gray-400 text-sm">
              The tokenized RWA market has grown over 300% recently, with projections of $100B+ by end of 2026.
              Major institutions like BlackRock and Franklin Templeton are leading the charge.
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <h3 className="font-semibold text-white">Institutional Grade</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Tokenized treasuries and private credit offer regulated, compliant exposure to traditional
              financial assets with the benefits of blockchain technology - transparency and settlement efficiency.
            </p>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Globe2 className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="font-semibold text-white">Global Access</h3>
            </div>
            <p className="text-gray-400 text-sm">
              Tokenization enables 24/7 global access to assets that were previously limited to
              institutional investors or specific geographic regions. Fractional ownership lowers barriers to entry.
            </p>
          </div>
        </div>

        {/* Data Attribution */}
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
          <h3 className="text-lg font-semibold text-white mb-3">Data Attribution</h3>
          <p className="text-gray-400 text-sm mb-4">
            RWA tokenization data and insights are powered by{' '}
            <a
              href="https://rwa.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-400 hover:underline"
            >
              RWA.xyz
            </a>
            , the industry-standard data platform for tokenized real-world assets.
            RWA.xyz aggregates data across all major public blockchains and partners directly with asset issuers.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://rwa.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition text-sm"
            >
              Visit RWA.xyz
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="https://app.rwa.xyz/treasuries"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition text-sm"
            >
              Treasuries Dashboard
              <ExternalLink className="w-3 h-3" />
            </a>
            <a
              href="mailto:team@rwa.xyz"
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition text-sm"
            >
              API Access
            </a>
          </div>
        </div>

        {/* Excel Export CTA */}
        <div className="bg-gradient-to-r from-indigo-900/50 to-purple-900/50 rounded-xl border border-indigo-500/30 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-semibold text-white mb-2">Track RWA in Excel</h3>
              <p className="text-gray-300 text-sm">
                Export RWA market data to Excel with our BYOK templates. Track tokenized treasuries,
                private credit yields, and asset holder growth alongside your crypto portfolio.
              </p>
            </div>
            <Link
              href="/templates"
              className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition font-medium whitespace-nowrap"
            >
              Get Excel Templates
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
