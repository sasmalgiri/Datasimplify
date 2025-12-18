'use client';

import { CryptoAIChat } from '@/components/features/CryptoAIChat';
import { FreeNavbar } from '@/components/FreeNavbar';
import Link from 'next/link';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">🤖 Crypto AI Assistant</h1>
        <p className="text-gray-400 mb-6">
          Ask anything about cryptocurrency and investing. No login required!
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Chat */}
          <div className="md:col-span-2">
            <CryptoAIChat showBeginnerTips={true} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <h3 className="font-bold mb-3">✅ What I Know:</h3>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>📊 Real-time crypto prices</li>
                <li>📰 Latest crypto news</li>
                <li>😱 Fear & Greed Index</li>
                <li>🔥 Trending coins</li>
                <li>💼 Portfolio advice</li>
                <li>🎓 Beginner education</li>
                <li>⚠️ Risk explanations</li>
                <li>🏦 DeFi & staking</li>
              </ul>
            </div>

            <div className="bg-red-900/30 rounded-xl border border-red-700 p-4">
              <h3 className="font-bold text-red-400 mb-3">🚫 Won&apos;t Answer:</h3>
              <ul className="text-sm text-red-300 space-y-2">
                <li>❌ Non-crypto questions</li>
                <li>❌ Specific buy/sell advice</li>
                <li>❌ Coding/programming</li>
                <li>❌ Essays or stories</li>
              </ul>
            </div>

            <div className="bg-blue-900/30 rounded-xl border border-blue-700 p-4">
              <h3 className="font-bold text-blue-400 mb-3">📚 Data Sources:</h3>
              <ul className="text-sm text-blue-300 space-y-1">
                <li>• CoinGecko API</li>
                <li>• Fear & Greed Index</li>
                <li>• Crypto News Feeds</li>
                <li>• On-Chain Analytics</li>
              </ul>
            </div>

            <div className="bg-yellow-900/30 rounded-xl border border-yellow-700 p-4">
              <p className="text-xs text-yellow-300">
                ⚠️ <strong>Disclaimer:</strong> Educational info only. 
                NOT financial advice. Always DYOR.
              </p>
            </div>

            {/* Sign up CTA */}
            <div className="bg-gradient-to-r from-emerald-500/20 to-blue-500/20 border border-emerald-500/30 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-300 mb-2">Want to save chat history?</p>
              <Link
                href="/signup"
                className="inline-block px-4 py-2 bg-emerald-500 rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
              >
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
