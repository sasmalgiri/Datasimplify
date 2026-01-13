'use client';

import { CorrelationHeatmapDemo } from '@/components/features/CorrelationHeatmap';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadButton } from '@/components/TemplateDownloadButton';

export default function CorrelationPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">Correlation Analysis</h1>
            <p className="text-gray-400">
              See how different cryptocurrencies move in relation to each other.
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <TemplateDownloadButton
              pageContext={{
                pageId: 'correlation',
                correlationCoins: ['bitcoin', 'ethereum', 'solana', 'bnb', 'xrp'],
                period: '30d',
                customizations: {
                  includeCharts: true,
                },
              }}
              variant="outline"
            />
          </div>
        </div>

        <CorrelationHeatmapDemo showBeginnerTips={true} />
      </div>
    </div>
  );
}
