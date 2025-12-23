'use client';

import { TechnicalAnalysis } from '@/components/features/TechnicalAnalysis';

export default function TechnicalPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">📊 Technical Analysis</h1>
        <p className="text-gray-600 mb-8">
          See what technical indicators are saying about the market.
        </p>

        <TechnicalAnalysis coin="BTC" showBeginnerTips={true} />
      </div>
    </div>
  );
}
