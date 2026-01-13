'use client';

import { RiskDashboardDemo } from '@/components/features/RiskDashboard';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadButton } from '@/components/TemplateDownloadButton';
import { isFeatureEnabled } from '@/lib/featureFlags';

export default function RiskPage() {
  const riskEnabled = isFeatureEnabled('risk');

  if (!riskEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <FreeNavbar />
        <Breadcrumb />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold mb-4">Risk Metrics</h1>
          <p className="text-gray-700 mb-4">
            This feature is currently disabled in this configuration.
          </p>
          <p className="text-gray-600 text-sm">
            DataSimplify provides research and comparison tools for education purposes.
            This page is not available in the current mode.
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
            <h1 className="text-3xl font-bold mb-2">Risk Analysis</h1>
            <p className="text-gray-400">
              Understand how risky different cryptocurrencies are before investing.
            </p>
          </div>
          <TemplateDownloadButton
            pageContext={{
              pageId: 'risk',
              selectedCoins: ['bitcoin', 'ethereum', 'solana', 'bnb', 'xrp'],
              timeframe: '30d',
              currency: 'USD',
              customizations: {
                includeCharts: true,
              },
            }}
            variant="primary"
          />
        </div>

        <RiskDashboardDemo showBeginnerTips={true} />
      </div>
    </div>
  );
}
