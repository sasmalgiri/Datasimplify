'use client';

import { WhaleTracker } from '@/components/features/WhaleTracker';
import { WalletDistributionTreemap } from '@/components/features/WalletDistributionTreemap';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadButton } from '@/components/TemplateDownloadButton';
import { isFeatureEnabled } from '@/lib/featureFlags';

export default function WhalesPage() {
  const whalesEnabled = isFeatureEnabled('whales');

  if (!whalesEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <FreeNavbar />
        <Breadcrumb />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold mb-4">Whale Tracking</h1>
          <p className="text-gray-700 mb-4">
            This feature is currently disabled in this configuration.
          </p>
          <p className="text-gray-600 text-sm">
            DataSimplify provides research and comparison tools for education purposes.
            Whale tracking functionality is not available in the current mode.
          </p>
        </div>
      </div>
    );
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
