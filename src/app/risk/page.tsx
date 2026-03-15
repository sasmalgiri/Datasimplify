import { notFound } from 'next/navigation';
import { RiskDashboardDemo } from '@/components/features/RiskDashboard';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { FEATURES } from '@/lib/featureFlags';
import { UniversalExport } from '@/components/UniversalExport';
import { EducationBanner } from '@/components/EducationBanner';
import { WhatsNext } from '@/components/WhatsNext';

// Check feature flag at build/request time - return 404 if disabled
export default function RiskPage() {
  // Return 404 if risk feature is disabled
  if (!FEATURES.risk) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Risk Analysis</h1>
            <p className="text-gray-400">
              Understand how risky different cryptocurrencies are before investing.
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

        <RiskDashboardDemo showBeginnerTips={true} />

        <WhatsNext contextLabel="Learn how to manage risk before committing real money" />
      </div>
    </div>
  );
}
