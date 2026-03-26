'use client';

import { DeFiTracker } from '@/components/features/DeFiTracker';
import { FreeNavbar } from '@/components/FreeNavbar';
import { AuthGate } from '@/components/AuthGate';
import { Breadcrumb } from '@/components/Breadcrumb';
import { UniversalExport } from '@/components/UniversalExport';
import { EducationBanner } from '@/components/EducationBanner';
import { WhatsNext } from '@/components/WhatsNext';
import { AutoJargon } from '@/components/ui/SimplifiedUI';
import { DataTrustStrip } from '@/components/DataFreshness';
import { GuidedTour, TOUR_DEFI } from '@/components/GuidedTour';

export default function DeFiPage() {
  return (
    <AuthGate redirectPath="/defi" featureName="DeFi Dashboard">
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <GuidedTour tourId="defi" pageTitle="DeFi" steps={TOUR_DEFI} nextPage={{ label: 'Learn: DeFi & Beyond', href: '/learn/path' }} />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">DeFi Dashboard</h1>
            <p className="text-gray-400">
              <AutoJargon text="Track decentralized finance protocols, TVL, yield farming, and liquidity pool opportunities." />
            </p>
          </div>
          <UniversalExport name="DeFi-Dashboard" compact />
        </div>

        <EducationBanner
          youtubeMyth="'1,000% APY — it's like a savings account but way better! Passive income!' — YouTubers promoted Anchor Protocol's 19.5% APY as 'the best savings account in crypto.'"
          reality="Sustainable DeFi yields on stablecoins are 2-8%. Anything above 15-20% carries significant risk. If you can't explain where the yield comes from in one sentence, you are the yield. Anchor collapsed and wiped out $17 billion."
          mythId="defi-yield-fantasy"
          learnLink="/learn/path"
          learnLabel="Learn: DeFi & Beyond (Level 4)"
          storageKey="defi"
        />

        <DataTrustStrip source="DeFiLlama" />

        <DeFiTracker showBeginnerTips={true} />

        <WhatsNext contextLabel="Understand DeFi risks before chasing yield" />
      </div>
    </div>
    </AuthGate>
  );
}
