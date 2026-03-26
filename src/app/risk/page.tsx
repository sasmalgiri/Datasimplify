'use client';

import { notFound } from 'next/navigation';
import { RiskDashboardDemo } from '@/components/features/RiskDashboard';
import { FreeNavbar } from '@/components/FreeNavbar';
import { AuthGate } from '@/components/AuthGate';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FEATURES } from '@/lib/featureFlags';
import { UniversalExport } from '@/components/UniversalExport';
import { EducationBanner } from '@/components/EducationBanner';
import { WhatsNext } from '@/components/WhatsNext';
import { AutoJargon } from '@/components/ui/SimplifiedUI';
import { DataTrustStrip } from '@/components/DataFreshness';
import { GuidedTour, TOUR_RISK } from '@/components/GuidedTour';

// Check feature flag at build/request time - return 404 if disabled
export default function RiskPage() {
  // Return 404 if risk feature is disabled
  if (!FEATURES.risk) {
    notFound();
  }

  return (
    <AuthGate redirectPath="/risk" featureName="Risk Analysis">
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <GuidedTour tourId="risk" pageTitle="Risk" steps={TOUR_RISK} nextPage={{ label: 'Try DeFi Dashboard', href: '/defi' }} />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Risk Analysis</h1>
            <p className="text-gray-400">
              <AutoJargon text="Understand volatility, drawdown, Sharpe ratio, and risk metrics before investing in any cryptocurrency." />
            </p>
          </div>
          <UniversalExport name="Risk-Analysis" compact />
        </div>

        <EducationBanner
          youtubeMyth="'Crypto always goes up long term — just hold and you can't lose!' — YouTubers treat all coins like Bitcoin."
          reality="Bitcoin has recovered from 80% drawdowns, but thousands of altcoins have gone to zero permanently. Risk management (position sizing, stop-losses, diversification) is what separates investing from gambling. Check these metrics BEFORE you buy."
          mythId="guaranteed-returns"
          learnLink="/learn/path"
          learnLabel="Learn: Risk Management (Level 3)"
          storageKey="risk"
        />

        <DataTrustStrip />

        <RiskDashboardDemo showBeginnerTips={true} />

        <WhatsNext contextLabel="Learn how to manage risk before committing real money" />
      </div>
    </div>
    </AuthGate>
  );
}
