'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { ReportAssistant } from '@/components/download/ReportAssistant';
import type { RefreshFrequency } from '@/lib/templates/templateModes';
import type { RoutedTemplate } from '@/lib/templates/reportAssistant';
import { ProductDisclaimer } from '@/components/ProductDisclaimer';

export default function DownloadPage() {
  // Gate state - user must confirm requirements before seeing templates
  const [hasConfirmedRequirements, setHasConfirmedRequirements] = useState(false);

  // Mode toggle: 'wizard' (Report Builder) or 'manual' (direct controls)
  const [selectionMode, setSelectionMode] = useState<'wizard' | 'manual'>('wizard');

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [templates, setTemplates] = useState<Array<{id: string; name: string; description: string; icon: string}>>([]);

  // Configuration state for templates (with quota-aware defaults)
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTC', 'ETH', 'SOL', 'BNB', 'XRP']); // 5 coins default (Low-Quota Mode)
  const [selectedTimeframe, setSelectedTimeframe] = useState('1d'); // Daily only in Low-Quota Mode
  const [refreshFrequency, setRefreshFrequency] = useState<RefreshFrequency>('manual'); // Manual by default
  const [includeCharts, setIncludeCharts] = useState(true);

  // Load templates on mount
  useEffect(() => {
    const templateList = getTemplateList();
    setTemplates(templateList);
  }, []);

  // Check if user previously confirmed (persist for session)
  useEffect(() => {
    const confirmed = sessionStorage.getItem('crk_requirements_confirmed');
    if (confirmed === 'true') {
      setHasConfirmedRequirements(true);
    }
  }, []);

  // Handler for requirements confirmation
  const handleRequirementsConfirmed = () => {
    setHasConfirmedRequirements(true);
    sessionStorage.setItem('crk_requirements_confirmed', 'true');
  };

  // Handler for template selection (manual mode)
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setSelectedTemplateName(template.name);
      setShowTemplateModal(true);
    }
  };

  // Handler for Report Assistant template selection (wizard mode)
  const handleAssistantSelect = useCallback((templateId: string, config: RoutedTemplate['config']) => {
    const template = templates.find(t => t.id === templateId);

    // Apply config from Report Assistant
    setSelectedCoins(config.coins);
    setSelectedTimeframe(config.timeframe);
    setRefreshFrequency(config.refreshFrequency as RefreshFrequency);
    setIncludeCharts(config.includeCharts);

    if (template) {
      setSelectedTemplateId(templateId);
      setSelectedTemplateName(template.name);
      setShowTemplateModal(true);
    }
  }, [templates]);

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">CRK Excel Templates</h1>
          <p className="text-gray-400">
            Download Excel templates with CRK formulas. Templates use BYOK (Bring Your Own Key) -
            you provide your own API key (e.g., CoinGecko) and data is fetched using YOUR credentials.
          </p>
        </div>

        {/* Product Disclaimer */}
        <ProductDisclaimer variant="compact" className="mb-8 max-w-3xl mx-auto bg-gray-900 border-gray-800" />

        {/* Requirements Gate - Must confirm before accessing templates */}
        {!hasConfirmedRequirements ? (
          <RequirementsGate onConfirm={handleRequirementsConfirmed} className="max-w-2xl mx-auto" />
        ) : (
          <>
            {/* Mode Toggle */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-4 p-2 bg-gray-900 rounded-xl border border-gray-800 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setSelectionMode('wizard')}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    selectionMode === 'wizard'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  Report Assistant
                </button>
                <button
                  type="button"
                  onClick={() => setSelectionMode('manual')}
                  className={`flex-1 py-2.5 px-4 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
                    selectionMode === 'manual'
                      ? 'bg-emerald-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  Browse All
                </button>
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">
                {selectionMode === 'wizard'
                  ? 'Describe what you need in plain language'
                  : 'Configure and browse all templates directly'}
              </p>
            </div>

            {/* Wizard Mode: Report Assistant */}
            {selectionMode === 'wizard' ? (
              <div className="max-w-2xl mx-auto mb-8">
                <ReportAssistant onTemplateSelect={handleAssistantSelect} />
              </div>
            ) : (
              <>
                {/* Manual Mode: Direct Controls */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
                  {/* Left Column: Controls */}
                  <div className="lg:col-span-2">
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

                  {/* Right Column: Quota Estimator */}
                  <div className="lg:col-span-1">
                    <div className="sticky top-4 space-y-4">
                      <QuotaEstimator
                        assetCount={selectedCoins.length}
                        refreshFrequency={refreshFrequency}
                        timeframe={selectedTimeframe}
                        includeCharts={includeCharts}
                      />

                      {/* Quick Info Card */}
                      <div className="bg-gray-900 rounded-xl border border-gray-800 p-4">
                        <h4 className="font-medium text-white mb-3 flex items-center gap-2">
                          <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                          </svg>
                          What You Get
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-300">
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-400">✓</span>
                            <span>Templates with CRK formulas (BYOK)</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-400">✓</span>
                            <span>Pre-styled Excel charts</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-400">✓</span>
                            <span>START sheet with status checker</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <span className="text-emerald-400">✓</span>
                            <span>Quota-aware configuration</span>
                          </li>
                        </ul>
                        <div className="mt-3 pt-3 border-t border-gray-700">
                          <p className="text-xs text-gray-400">
                            <strong>Note:</strong> We provide template software, not data.
                            Data comes from your own API key (BYOK).
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Data Preview Section */}
                <div className="mb-8">
                  <DataPreview
                    selectedCoins={selectedCoins}
                    timeframe={selectedTimeframe}
                  />
                </div>

                {/* Templates Grid */}
                <div className="mb-8">
                  <h2 className="text-2xl font-bold text-white mb-4">Available Templates</h2>
                  <p className="text-gray-400 mb-6">
                    Select a template to download. Each template is pre-configured with your settings above.
                  </p>
                  <TemplateGrid templates={templates} onSelect={handleTemplateSelect} />
                </div>
              </>
            )}

            {/* How It Works - Updated messaging */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 p-6 mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">How Templates Work</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                    1
                  </div>
                  <h3 className="font-medium text-white mb-2">Download Template</h3>
                  <p className="text-gray-400 text-sm">Get the .xlsx file with your configuration</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                    2
                  </div>
                  <h3 className="font-medium text-white mb-2">Open in Excel Desktop</h3>
                  <p className="text-gray-400 text-sm">Excel Online is NOT supported</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                    3
                  </div>
                  <h3 className="font-medium text-white mb-2">Sign In to CRK Add-in</h3>
                  <p className="text-gray-400 text-sm">Install add-in + connect API key</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                    4
                  </div>
                  <h3 className="font-medium text-white mb-2">Click "Refresh Now"</h3>
                  <p className="text-gray-400 text-sm">Manual refresh conserves API quota</p>
                </div>
              </div>
            </div>

            {/* Refresh Instructions Card */}
            <div className="bg-emerald-900/20 rounded-xl border border-emerald-500/30 p-5 mb-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-emerald-400 mb-2">Refresh Data in Templates</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    Templates use <strong>manual refresh by default</strong> to conserve your API quota (BYOK).
                  </p>
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2 text-white">
                      <kbd className="px-2 py-1 bg-gray-700 rounded text-emerald-400 text-xs">Ctrl+Alt+F5</kbd>
                      <span className="text-gray-400">Windows</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <kbd className="px-2 py-1 bg-gray-700 rounded text-emerald-400 text-xs">Cmd+Alt+F5</kbd>
                      <span className="text-gray-400">Mac</span>
                    </div>
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-emerald-400">Or click "Refresh Now" button</span>
                      <span className="text-gray-400">in START_HERE sheet</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Disclaimer - Updated */}
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <p className="text-gray-500 text-xs text-center">
                <strong>Disclaimer:</strong> CryptoReportKit provides template software tools only. We are not a data vendor.
                Templates contain CRK formulas - data is fetched using your own API key (BYOK architecture).
                Data usage depends on your provider&apos;s plan and refresh settings.
                Free CoinGecko API users may hit monthly request limits.
                Nothing on this platform constitutes financial advice.
                <Link href="/disclaimer" className="text-emerald-400 hover:underline ml-1">
                  View full disclaimer
                </Link>
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
          customizations: {
            includeCharts,
            refreshFrequency,
          },
        }}
      />
    </div>
  );
}
