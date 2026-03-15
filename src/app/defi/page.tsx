'use client';

import { DeFiTracker } from '@/components/features/DeFiTracker';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { UniversalExport } from '@/components/UniversalExport';
import { EducationBanner } from '@/components/EducationBanner';
import { WhatsNext } from '@/components/WhatsNext';

export default function DeFiPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">DeFi Dashboard</h1>
            <p className="text-gray-400">
              Track decentralized finance protocols, TVL, and yield opportunities.
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

        <DeFiTracker showBeginnerTips={true} />

        <WhatsNext contextLabel="Understand DeFi risks before chasing yield" />
      </div>
    </div>
  );
}
