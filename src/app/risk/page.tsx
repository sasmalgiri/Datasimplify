import { notFound } from 'next/navigation';
import { RiskDashboardDemo } from '@/components/features/RiskDashboard';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadButton } from '@/components/TemplateDownloadButton';
import { FEATURES } from '@/lib/featureFlags';

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
