'use client';

import { TechnicalAnalysis } from '@/components/features/TechnicalAnalysis';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { DisplayOnlyBadge } from '@/components/DisplayOnlyBadge';

export default function TechnicalPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Technical Analysis</h1>
            <p className="text-gray-400">
              See what technical indicators are saying about the market.
            </p>
          </div>
        </div>

        {/* Display Only Badge */}
        <DisplayOnlyBadge pageId="technical" variant="card" className="mb-6" />

        <TechnicalAnalysis coin="BTC" showBeginnerTips={true} />
      </div>
    </div>
  );
}
