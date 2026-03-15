'use client';

import { CorrelationHeatmapDemo } from '@/components/features/CorrelationHeatmap';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { UniversalExport } from '@/components/UniversalExport';
import { EducationBanner } from '@/components/EducationBanner';

export default function CorrelationPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Correlation Analysis</h1>
            <p className="text-gray-400">
              See how different cryptocurrencies move in relation to each other.
            </p>
          </div>
          <UniversalExport name="Correlation-Analysis" compact />
        </div>

        <EducationBanner
          youtubeMyth="'Diversify by buying 10 different altcoins!' — YouTubers call this diversification."
          reality="If all your coins have 0.90+ correlation, they'll all crash together. Real diversification means holding assets that DON'T move in sync. Use this matrix to find truly uncorrelated assets."
          learnLink="/learn/path"
          learnLabel="Learn: Correlation & Diversification (Level 3)"
          storageKey="correlation"
        />

        <CorrelationHeatmapDemo showBeginnerTips={true} />
      </div>
    </div>
  );
}
