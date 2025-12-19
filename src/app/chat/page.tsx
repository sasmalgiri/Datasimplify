'use client';

import { useState } from 'react';
import { CryptoAIChat } from '@/components/features/CryptoAIChat';
import { FreeNavbar } from '@/components/FreeNavbar';
import Link from 'next/link';

// Help Icon with tooltip for explanations
function HelpIcon({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center ml-2"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="cursor-help w-5 h-5 rounded-full bg-gray-700 text-emerald-400 text-xs flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors font-bold">
        ?
      </span>
      {isVisible && (
        <span className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 text-sm text-white bg-gray-900 rounded-lg shadow-2xl border border-emerald-500/50 min-w-[250px] max-w-[350px] text-left whitespace-normal">
          {text}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></span>
        </span>
      )}
    </span>
  );
}

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Beginner Tip */}
        <div className="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-6">
          <p className="text-blue-300 text-sm flex items-start gap-2">
            <span>💡</span>
            <span>
              <strong>How to use:</strong> Type your crypto question below and press Enter or click Send.
              Try asking about prices, market trends, or beginner concepts. The AI uses real-time data!
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <h1 className="text-3xl font-bold">🤖 Crypto AI Assistant</h1>
          <HelpIcon text="Our AI assistant is trained on cryptocurrency knowledge and has access to real-time market data. Ask about prices, trends, concepts, or investment strategies." />
        </div>
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
              <h3 className="font-bold mb-3 flex items-center">
                ✅ What I Know:
                <HelpIcon text="These are topics the AI can help you with. Try asking questions about any of these!" />
              </h3>
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
              <h3 className="font-bold text-red-400 mb-3 flex items-center">
                🚫 Won&apos;t Answer:
                <HelpIcon text="The AI is focused on crypto education and won't help with off-topic requests or give specific financial advice." />
              </h3>
              <ul className="text-sm text-red-300 space-y-2">
                <li>❌ Non-crypto questions</li>
                <li>❌ Specific buy/sell advice</li>
                <li>❌ Coding/programming</li>
                <li>❌ Essays or stories</li>
              </ul>
            </div>

            <div className="bg-blue-900/30 rounded-xl border border-blue-700 p-4">
              <h3 className="font-bold text-blue-400 mb-3 flex items-center">
                📚 Data Sources:
                <HelpIcon text="The AI pulls real-time data from these trusted sources to give you accurate, up-to-date information." />
              </h3>
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
