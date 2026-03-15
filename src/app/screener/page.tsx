'use client';

import { TokenScreener } from '@/components/features/TokenScreener';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { UniversalExport } from '@/components/UniversalExport';
import { EducationBanner } from '@/components/EducationBanner';
import { WhatsNext } from '@/components/WhatsNext';
import { AutoJargon } from '@/components/ui/SimplifiedUI';
import { DataTrustStrip } from '@/components/DataFreshness';
import { GuidedTour, TOUR_SCREENER } from '@/components/GuidedTour';

export default function ScreenerPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <GuidedTour tourId="screener" pageTitle="Screener" steps={TOUR_SCREENER} nextPage={{ label: 'Try Risk Analysis', href: '/risk' }} />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Token Screener</h1>
            <p className="text-gray-400">
              <AutoJargon text="Filter and find cryptocurrencies by market cap, volume, price change, and more." />
            </p>
          </div>
          <UniversalExport name="Token-Screener" compact />
        </div>

        <EducationBanner
          youtubeMyth="'Sort by lowest price to find hidden gems!' — YouTubers promote unit price as if low price = cheap."
          reality="A coin at $0.001 with 100 billion supply has the same market cap as a coin at $100 with 1 million supply. Always filter by MARKET CAP, not price. Use the market cap column to compare coins honestly."
          mythId="cheap-coin-fallacy"
          learnLink="/myths"
          learnLabel="Read: Cheap Coin Fallacy"
          storageKey="screener"
        />

        <DataTrustStrip />

        <TokenScreener showBeginnerTips={true} />

        <WhatsNext contextLabel="Learn to evaluate coins beyond just price" />
      </div>
    </div>
  );
}
