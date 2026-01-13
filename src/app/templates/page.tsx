'use client';

import { useState, useEffect } from 'react';
import { FileSpreadsheet, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadModal } from '@/components/TemplateDownloadModal';
import { TemplateGrid } from '@/components/TemplateCard';
import { getTemplateList } from '@/lib/templates/templateConfig';

export default function TemplatesPage() {
  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [templates, setTemplates] = useState<Array<{id: string; name: string; description: string; icon: string}>>([]);

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

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Excel <span className="text-emerald-400">Templates</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Download Excel templates with CryptoSheets formulas for live data visualization.
          </p>
        </div>

        {/* Important Notice */}
        <div className="mb-8 bg-yellow-900/20 border border-yellow-500/30 rounded-xl p-4 max-w-3xl mx-auto">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-400 mb-1">CryptoSheets Add-in Required</h3>
              <p className="text-gray-300 text-sm">
                These templates contain <strong>formulas only</strong> - no market data is embedded.
                Data is fetched via the{' '}
                <a
                  href="https://www.cryptosheets.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400 hover:underline"
                >
                  CryptoSheets Excel add-in
                </a>{' '}
                when you open the file in Microsoft Excel Desktop.
                You must have an <strong>active CryptoSheets account</strong> (sign in within Excel).
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

        {/* Templates Grid */}
        <div className="mb-12">
          <TemplateGrid templates={templates} onSelect={handleTemplateSelect} />
        </div>

        {/* How It Works */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            How Templates Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                1
              </div>
              <h3 className="font-medium text-white mb-1">Download</h3>
              <p className="text-gray-400 text-xs">Get the .xlsx template file</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                2
              </div>
              <h3 className="font-medium text-white mb-1">Open in Excel</h3>
              <p className="text-gray-400 text-xs">Microsoft Excel Desktop required</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                3
              </div>
              <h3 className="font-medium text-white mb-1">Sign In</h3>
              <p className="text-gray-400 text-xs">CryptoSheets add-in fetches data</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                4
              </div>
              <h3 className="font-medium text-white mb-1">Refresh</h3>
              <p className="text-gray-400 text-xs">Click Refresh All for latest data</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Need Help Getting Started?</h2>
          <p className="text-gray-400 mb-6">
            Check out our setup guide to get your templates working in Excel.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/template-requirements"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Setup Guide
            </Link>
            <a
              href="https://www.cryptosheets.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Get CryptoSheets →
            </a>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            <strong>Disclaimer:</strong> Templates contain formulas only - no market data is embedded.
            DataSimplify is software tooling, not a data vendor.
            <Link href="/disclaimer" className="text-emerald-400 hover:underline ml-1">
              View full disclaimer
            </Link>
          </p>
        </div>
      </div>

      {/* Template Download Modal */}
      <TemplateDownloadModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        templateType={selectedTemplateId}
        templateName={selectedTemplateName}
        userConfig={{
          coins: ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'],
          timeframe: '24h',
          currency: 'USD',
          customizations: {
            includeCharts: true,
          },
        }}
      />
    </div>
  );
}
