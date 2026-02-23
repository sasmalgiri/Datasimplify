'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Clock, ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

// Feature descriptions for coming soon pages
const FEATURE_INFO: Record<string, { title: string; description: string; icon: string }> = {
  exchanges: {
    title: 'Exchange Rankings',
    description: 'Compare cryptocurrency exchanges by trust score, trading volume, and supported pairs. Get detailed insights into exchange reliability and liquidity.',
    icon: '🏦',
  },
  nft: {
    title: 'NFT Collections',
    description: 'Track top NFT collections by floor price, market cap, and trading volume. Analyze trends in the NFT market with our educational tools.',
    icon: '🖼️',
  },
  dashboard: {
    title: 'Custom Dashboard',
    description: 'Build personalized dashboards with your favorite metrics, watchlists, and analytics. Save your configurations for quick access.',
    icon: '📊',
  },
  onchain: {
    title: 'On-Chain Analytics',
    description: 'Analyze blockchain data including holder behavior, transaction patterns, miner activity, and network health metrics.',
    icon: '⛓️',
  },
  whales: {
    title: 'Whale Tracker',
    description: 'Monitor large wallet movements and whale activity across multiple blockchains. Educational insights into market-moving transactions.',
    icon: '🐋',
  },
  default: {
    title: 'New Feature',
    description: 'We\'re working on something exciting! This feature is currently in development and will be available soon.',
    icon: '✨',
  },
};

function ComingSoonContent() {
  const searchParams = useSearchParams();
  const feature = searchParams.get('feature') || 'default';
  const info = FEATURE_INFO[feature] || FEATURE_INFO.default;
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-800">
      <FreeNavbar />

      <div className="max-w-3xl mx-auto px-4 py-16">
        {/* Back button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>

        {/* Main content */}
        <div className="text-center">
          {/* Icon */}
          <div className="text-6xl mb-6">{info.icon}</div>

          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm mb-6">
            <Clock className="w-4 h-4" />
            Coming Soon
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold text-white mb-4">
            {info.title}
          </h1>

          {/* Description */}
          <p className="text-xl text-gray-400 mb-8 max-w-xl mx-auto">
            {info.description}
          </p>

          {/* Follow us for updates */}
          <div className="max-w-md mx-auto mb-12">
            <p className="text-gray-500 text-sm mb-4">
              Follow us for launch updates:
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="https://x.com/sasmalgiri"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
              >
                Follow on X
              </a>
              <a
                href="https://github.com/sasmalgiri/Datasimplify"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-sm text-gray-300 transition-colors"
              >
                Star on GitHub
              </a>
            </div>
          </div>

          {/* Available features */}
          <div className="border-t border-gray-800 pt-8">
            <h2 className="text-lg font-semibold text-white mb-4">
              Available Now
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link
                href="/market"
                className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <div className="text-2xl mb-2">📈</div>
                <div className="text-white group-hover:text-blue-400 transition-colors">Market Data</div>
              </Link>
              <Link
                href="/downloads"
                className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <div className="text-2xl mb-2">📊</div>
                <div className="text-white group-hover:text-blue-400 transition-colors">Excel Templates</div>
              </Link>
              <Link
                href="/compare"
                className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <div className="text-2xl mb-2">⚖️</div>
                <div className="text-white group-hover:text-blue-400 transition-colors">Compare Coins</div>
              </Link>
              <Link
                href="/learn"
                className="p-4 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors group"
              >
                <div className="text-2xl mb-2">📚</div>
                <div className="text-white group-hover:text-blue-400 transition-colors">Learn Crypto</div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ComingSoonPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <ComingSoonContent />
    </Suspense>
  );
}
