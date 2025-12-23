'use client';

import { TokenScreener } from '@/components/features/TokenScreener';

export default function ScreenerPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">🔍 Token Screener</h1>
        <p className="text-gray-600 mb-8">
          Filter and find cryptocurrencies that match your criteria.
        </p>

        <TokenScreener showBeginnerTips={true} />
      </div>
    </div>
  );
}
