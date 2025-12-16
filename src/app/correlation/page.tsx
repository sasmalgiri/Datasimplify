'use client';

import { CorrelationHeatmapDemo } from '@/components/features/CorrelationHeatmap';

export default function CorrelationPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">🔗 Correlation Analysis</h1>
        <p className="text-gray-600 mb-8">
          See how different cryptocurrencies move in relation to each other.
        </p>
        
        <CorrelationHeatmapDemo showBeginnerTips={true} />
      </div>
    </div>
  );
}
