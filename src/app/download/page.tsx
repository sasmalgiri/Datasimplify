'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadModal } from '@/components/TemplateDownloadModal';
import { TemplateGrid } from '@/components/TemplateCard';
import { getTemplateList } from '@/lib/templates/templateConfig';
import { DataPreview } from '@/components/DataPreview';
import { RequirementsGate } from '@/components/download/RequirementsGate';
import { QuotaEstimator } from '@/components/download/QuotaEstimator';
import { TemplateControls } from '@/components/download/TemplateControls';
import type { RefreshFrequency } from '@/lib/templates/templateModes';
import { ProductDisclaimer } from '@/components/ProductDisclaimer';

export default function DownloadPage() {
  // Gate state - user must confirm requirements before seeing templates
  // Use lazy initialization to check sessionStorage on mount
  const [hasConfirmedRequirements, setHasConfirmedRequirements] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('crk_requirements_confirmed') === 'true';
    }
    return false;
  });

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  // Use lazy initialization for templates
  const [templates] = useState(() => getTemplateList());

  // Configuration state for templates (with quota-aware defaults)
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTC', 'ETH', 'SOL', 'BNB', 'XRP']); // 5 coins default (Low-Quota Mode)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d'); // Daily only in Low-Quota Mode
  const [refreshFrequency, setRefreshFrequency] = useState<RefreshFrequency>('manual'); // Manual by default
  const [includeCharts, setIncludeCharts] = useState(true);
  // Formula mode is always 'crk' - no other options

  // Handler for requirements confirmation
  const handleRequirementsConfirmed = () => {
    setHasConfirmedRequirements(true);
    sessionStorage.setItem('crk_requirements_confirmed', 'true');
  };

  // Handler for template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setSelectedTemplateName(template.name);
      setShowTemplateModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-6">
        {/* Compact Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white">CRK Excel Templates</h1>
          <p className="text-gray-400 text-sm">
            BYOK templates - data fetched using your own API key
          </p>
        </div>

        {/* Product Disclaimer - Compact */}
        <ProductDisclaimer variant="compact" className="mb-4 bg-gray-900 border-gray-800" />

        {/* Requirements Gate - Must confirm before accessing templates */}
        {!hasConfirmedRequirements ? (
          <RequirementsGate onConfirm={handleRequirementsConfirmed} className="max-w-2xl mx-auto" />
        ) : (
          <>
            {/* Data Preview First - Full Width */}
            <div className="mb-6">
              <DataPreview
                selectedCoins={selectedCoins}
                timeframe={selectedTimeframe}
              />
            </div>

            {/* Compact Controls Row */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
              {/* Controls - Takes 3 columns */}
              <div className="lg:col-span-3">
                <TemplateControls
                  selectedCoins={selectedCoins}
                  onCoinsChange={setSelectedCoins}
                  timeframe={selectedTimeframe}
                  onTimeframeChange={setSelectedTimeframe}
                  refreshFrequency={refreshFrequency}
                  onRefreshFrequencyChange={setRefreshFrequency}
                  includeCharts={includeCharts}
                  onIncludeChartsChange={setIncludeCharts}
                />
              </div>

              {/* Quota Estimator - Takes 1 column */}
              <div className="lg:col-span-1">
                <QuotaEstimator
                  assetCount={selectedCoins.length}
                  refreshFrequency={refreshFrequency}
                  timeframe={selectedTimeframe}
                  includeCharts={includeCharts}
                />
              </div>
            </div>

            {/* Primary Download CTA */}
            <div className="mb-6 p-4 bg-gradient-to-r from-emerald-900/30 to-emerald-800/20 rounded-xl border border-emerald-500/30">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Ready to Download?</h3>
                  <p className="text-sm text-gray-400">
                    Your customized template with {selectedCoins.length} coins, {selectedTimeframe} timeframe
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTemplateSelect('market_overview')}
                  className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-emerald-500/20"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download to Excel
                </button>
              </div>
            </div>

            {/* Templates Grid - Compact */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold text-white">Or Choose a Specific Template</h2>
                <span className="text-xs text-gray-500">Pre-configured with your settings</span>
              </div>
              <TemplateGrid templates={templates} onSelect={handleTemplateSelect} />
            </div>

            {/* How It Works - Compact Horizontal */}
            <div className="bg-gray-900 rounded-lg border border-gray-800 p-4 mb-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">1</div>
                  <div>
                    <p className="text-white text-sm font-medium">Download</p>
                    <p className="text-gray-500 text-xs">.xlsx file</p>
                  </div>
                </div>
                <div className="text-gray-600">→</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">2</div>
                  <div>
                    <p className="text-white text-sm font-medium">Open in Excel</p>
                    <p className="text-gray-500 text-xs">Desktop only</p>
                  </div>
                </div>
                <div className="text-gray-600">→</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">3</div>
                  <div>
                    <p className="text-white text-sm font-medium">Sign In</p>
                    <p className="text-gray-500 text-xs">CRK Add-in</p>
                  </div>
                </div>
                <div className="text-gray-600">→</div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">4</div>
                  <div>
                    <p className="text-white text-sm font-medium">Refresh</p>
                    <p className="text-gray-500 text-xs">Ctrl+Alt+F5</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Compact Disclaimer */}
            <div className="text-center">
              <p className="text-gray-500 text-xs">
                Templates use CRK formulas (BYOK). Data from your own API key.
                <Link href="/disclaimer" className="text-emerald-400 hover:underline ml-1">Disclaimer</Link>
              </p>
            </div>
          </>
        )}
      </main>

      {/* Template Download Modal */}
      <TemplateDownloadModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        templateType={selectedTemplateId}
        templateName={selectedTemplateName}
        userConfig={{
          coins: selectedCoins,
          timeframe: selectedTimeframe,
          currency: 'USD',
          formulaMode: 'crk', // CRK Add-in only
          customizations: {
            includeCharts,
            refreshFrequency,
          },
        }}
      />
    </div>
  );
}
