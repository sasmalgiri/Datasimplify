'use client';

import { OnChainMetrics } from '@/components/features/OnChainMetrics';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { TemplateDownloadButton } from '@/components/TemplateDownloadButton';

export default function OnChainPage() {
  const onchainEnabled = isFeatureEnabled('defi') || isFeatureEnabled('publicRpc');

  if (!onchainEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <FreeNavbar />
        <Breadcrumb />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold mb-2">On-Chain Analytics</h1>
          <p className="text-gray-700">This feature is currently disabled.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">On-Chain Analytics</h1>
            <p className="text-gray-400">
              Analyze blockchain data directly - holder behavior, miner activity, and more.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <TemplateDownloadButton
              pageContext={{
                pageId: 'onchain',
                selectedCoins: ['bitcoin', 'ethereum'],
                customizations: {
                  includeCharts: true,
                  metrics: ['hashrate', 'difficulty', 'active_addresses', 'gas_prices'],
                },
              }}
              variant="outline"
            />
          </div>
        </div>

        <OnChainMetrics showBeginnerTips={true} />
      </div>
    </div>
  );
}
