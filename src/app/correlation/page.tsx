'use client';

import { CorrelationHeatmapDemo } from '@/components/features/CorrelationHeatmap';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function CorrelationPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">Correlation Analysis</h1>
        <p className="text-gray-400 mb-8">
          See how different cryptocurrencies move in relation to each other.
        </p>

        <CorrelationHeatmapDemo showBeginnerTips={true} />
      </div>
    </div>
  );
}
