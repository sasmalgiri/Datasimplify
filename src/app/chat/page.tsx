'use client';

import { CryptoAIChat } from '@/components/features/CryptoAIChat';

export default function ChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">🤖 Crypto AI Assistant</h1>
        <p className="text-gray-600 mb-6">
          Ask anything about cryptocurrency and investing. Crypto questions only!
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Chat */}
          <div className="md:col-span-2">
            <CryptoAIChat showBeginnerTips={true} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="font-bold mb-3">✅ What I Know:</h3>
              <ul className="text-sm text-gray-600 space-y-2">
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

            <div className="bg-red-50 rounded-xl border border-red-200 p-4">
              <h3 className="font-bold text-red-800 mb-3">🚫 Won't Answer:</h3>
              <ul className="text-sm text-red-700 space-y-2">
                <li>❌ Non-crypto questions</li>
                <li>❌ Specific buy/sell advice</li>
                <li>❌ Coding/programming</li>
                <li>❌ Essays or stories</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-200 p-4">
              <h3 className="font-bold text-blue-800 mb-3">📚 Data Sources:</h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• CoinGecko API</li>
                <li>• Fear & Greed Index</li>
                <li>• Crypto News Feeds</li>
                <li>• On-Chain Analytics</li>
              </ul>
            </div>

            <div className="bg-yellow-50 rounded-xl border border-yellow-200 p-4">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Disclaimer:</strong> Educational info only. 
                NOT financial advice. Always DYOR.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
