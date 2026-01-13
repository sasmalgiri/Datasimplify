'use client';

import { ETFTracker } from '@/components/features/ETFTracker';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadButton } from '@/components/TemplateDownloadButton';

export default function ETFPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Bitcoin ETF Tracker</h1>
            <p className="text-gray-400">
              Track institutional money flowing into Bitcoin through ETFs.
            </p>
          </div>
          <TemplateDownloadButton
            pageContext={{
              pageId: 'etf',
              selectedCoins: ['bitcoin'],
              timeframe: '30d',
              currency: 'USD',
              customizations: {
                includeCharts: true,
              },
            }}
            variant="primary"
          />
        </div>

        <ETFTracker showBeginnerTips={true} />
      </div>
    </div>
  );
}
