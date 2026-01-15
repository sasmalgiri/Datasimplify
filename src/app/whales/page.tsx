import { notFound } from 'next/navigation';
import { WhaleTracker } from '@/components/features/WhaleTracker';
import { WalletDistributionTreemap } from '@/components/features/WalletDistributionTreemap';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadButton } from '@/components/TemplateDownloadButton';
import { FEATURES } from '@/lib/featureFlags';

// Check feature flag at build/request time - return 404 if disabled
export default function WhalesPage() {
  // In paddle_safe mode, whales feature is disabled - return proper 404
  if (!FEATURES.whales) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Whale Watch</h1>
            <p className="text-gray-400">
              Track what the big crypto holders are doing with their money.
            </p>
          </div>
          <TemplateDownloadButton
            pageContext={{
              pageId: 'whales',
              selectedCoins: ['bitcoin', 'ethereum'],
              timeframe: '24h',
              currency: 'USD',
              customizations: {
                includeCharts: true,
              },
            }}
            variant="primary"
          />
        </div>

        {/* BTC Wallet Distribution Treemap */}
        <div className="mb-8">
          <WalletDistributionTreemap />
        </div>

        <WhaleTracker showBeginnerTips={true} />
      </div>
    </div>
  );
}
