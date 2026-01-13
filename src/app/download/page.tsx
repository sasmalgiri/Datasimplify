'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SUPPORTED_COINS } from '@/lib/dataTypes';
import { TemplateDownloadModal } from '@/components/TemplateDownloadModal';
import { TemplateGrid } from '@/components/TemplateCard';
import { getTemplateList } from '@/lib/templates/templateConfig';

export default function DownloadPage() {
  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [templates, setTemplates] = useState<Array<{id: string; name: string; description: string; icon: string}>>([]);

  // Configuration state for templates
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTC', 'ETH', 'SOL']);
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h');

  // Load templates on mount
  useEffect(() => {
    const templateList = getTemplateList();
    setTemplates(templateList);
  }, []);

  // Handler for template selection
  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setSelectedTemplateName(template.name);
      setShowTemplateModal(true);
    }
  };

  // Toggle coin selection
  const toggleCoin = (symbol: string) => {
    setSelectedCoins(prev =>
      prev.includes(symbol)
        ? prev.filter(s => s !== symbol)
        : [...prev, symbol]
    );
  };

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Navigation */}
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Excel Templates</h1>
          <p className="text-gray-400">
            Download Excel templates with CryptoSheets formulas for live data visualization.
            Templates contain formulas only - data is fetched via the CryptoSheets add-in.
          </p>
        </div>

        {/* Important Notice */}
        <div className="mb-8 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="font-semibold text-yellow-400 mb-1">CryptoSheets Add-in Required</h3>
              <p className="text-gray-300 text-sm">
                These templates require the{' '}
                <a
                  href="https://www.cryptosheets.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  CryptoSheets Excel add-in
                </a>{' '}
                to function. Templates contain formulas only - no market data is embedded.
                Data is fetched by CryptoSheets when you open the file in Excel.
              </p>
              <Link
                href="/template-requirements"
                className="inline-block mt-2 text-sm text-yellow-400 hover:text-yellow-300"
              >
                View full requirements →
              </Link>
            </div>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="mb-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coin Selection */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Select Coins for Templates</h2>
            <p className="text-gray-400 text-sm mb-4">
              Choose which coins to include in your templates. These will be used when generating any template.
            </p>
            <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
              {SUPPORTED_COINS.slice(0, 20).map(coin => (
                <button
                  key={coin.symbol}
                  type="button"
                  onClick={() => toggleCoin(coin.symbol)}
                  className={`px-3 py-1.5 text-sm rounded-lg border transition ${
                    selectedCoins.includes(coin.symbol)
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {selectedCoins.includes(coin.symbol) && <span className="mr-1">✓</span>}
                  {coin.symbol}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3">
              {selectedCoins.length} coin{selectedCoins.length !== 1 ? 's' : ''} selected
            </p>
          </div>

          {/* Timeframe Selection */}
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Default Timeframe</h2>
            <p className="text-gray-400 text-sm mb-4">
              Choose the default timeframe for historical data in templates.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {['24h', '7d', '30d', '90d', '1y', 'all'].map(tf => (
                <button
                  key={tf}
                  type="button"
                  onClick={() => setSelectedTimeframe(tf)}
                  className={`py-2 px-4 rounded-lg border transition ${
                    selectedTimeframe === tf
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  {tf}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Available Templates</h2>
          <p className="text-gray-400 mb-6">
            Select a template to download. Each template is pre-configured with CryptoSheets formulas.
          </p>
          <TemplateGrid templates={templates} onSelect={handleTemplateSelect} />
        </div>

        {/* How It Works */}
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
              <h3 className="font-medium text-white mb-2">Open in Excel</h3>
              <p className="text-gray-400 text-sm">Open the file in Microsoft Excel Desktop</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                3
              </div>
              <h3 className="font-medium text-white mb-2">Sign In to CryptoSheets</h3>
              <p className="text-gray-400 text-sm">CryptoSheets add-in fetches the data</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                4
              </div>
              <h3 className="font-medium text-white mb-2">Refresh Anytime</h3>
              <p className="text-gray-400 text-sm">Click Refresh All to update data</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <div className="text-3xl mb-3">🔄</div>
            <h3 className="font-semibold text-white mb-2">Live Data</h3>
            <p className="text-gray-400 text-sm">
              Formulas fetch current data when you refresh - always up to date
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-white mb-2">Pre-built Charts</h3>
            <p className="text-gray-400 text-sm">
              Visualizations included - just open and view your data
            </p>
          </div>
          <div className="bg-gray-900/50 rounded-xl border border-gray-800 p-6">
            <div className="text-3xl mb-3">⚙️</div>
            <h3 className="font-semibold text-white mb-2">Your Configuration</h3>
            <p className="text-gray-400 text-sm">
              Templates match your coin selection and preferences
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-4">
          <p className="text-gray-500 text-xs text-center">
            <strong>Disclaimer:</strong> DataSimplify provides software analytics tools only. Templates contain formulas,
            not market data. Data is fetched via the CryptoSheets add-in on your machine. We are not a data vendor.
            Nothing on this platform constitutes financial advice.
            <Link href="/disclaimer" className="text-emerald-400 hover:underline ml-1">
              View full disclaimer
            </Link>
          </p>
        </div>
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
            includeCharts: true,
          },
        }}
      />
    </div>
  );
}
