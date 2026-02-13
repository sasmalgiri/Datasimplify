'use client';

import { useState } from 'react';
import { X, FileSpreadsheet, ChevronRight, Check, ExternalLink } from 'lucide-react';
import { PageContext, getTemplatesForPage, mergeWithDefaults, PAGE_META } from '@/lib/templates/pageMapping';
import { TEMPLATES, TemplateType } from '@/lib/templates/templateConfig';
import { TemplateDownloadModal } from './TemplateDownloadModal';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  pageContext: PageContext;
}

/**
 * TemplateSelectionModal
 *
 * Shows available templates for the current page with preview and customization options.
 * Allows users to select a template and proceed to download configuration.
 */
export function TemplateSelectionModal({
  isOpen,
  onClose,
  pageContext,
}: TemplateSelectionModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  if (!isOpen) return null;

  const availableTemplates = getTemplatesForPage(pageContext.pageId);
  const mergedContext = mergeWithDefaults(pageContext);
  const pageMeta = PAGE_META[pageContext.pageId];

  const handleTemplateSelect = (templateType: TemplateType) => {
    setSelectedTemplate(templateType);
    setShowDownloadModal(true);
  };

  const handleDownloadClose = () => {
    setShowDownloadModal(false);
    setSelectedTemplate(null);
  };

  const handleFullClose = () => {
    setShowDownloadModal(false);
    setSelectedTemplate(null);
    onClose();
  };

  // If download modal is open, show that instead
  if (showDownloadModal && selectedTemplate) {
    const template = TEMPLATES[selectedTemplate];
    return (
      <TemplateDownloadModal
        isOpen={true}
        onClose={handleDownloadClose}
        templateType={selectedTemplate}
        templateName={template?.name || selectedTemplate}
        userConfig={{
          coins: mergedContext.selectedCoins || [],
          timeframe: mergedContext.timeframe || '24h',
          currency: mergedContext.currency || 'USD',
          customizations: {
            includeCharts: true,
            ...(mergedContext.customizations || {}),
            // Pass page-specific context
            comparedCoins: mergedContext.comparedCoins,
            selectedIndicators: mergedContext.selectedIndicators,
            correlationCoins: mergedContext.correlationCoins,
            period: mergedContext.period,
            holdings: mergedContext.holdings,
          },
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <FileSpreadsheet className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">
                Excel Templates
              </h2>
              <p className="text-sm text-gray-400">
                {pageMeta?.title || 'Available'} • {availableTemplates.length} templates
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Template Info Banner */}
        <div className="mx-4 mt-4 p-3 bg-emerald-900/20 border border-emerald-600/30 rounded-lg">
          <div className="flex items-start gap-2">
            <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-emerald-400 font-medium">Templates include prefetched data (BYOK)</p>
              <p className="text-emerald-500/80 mt-0.5">
                Templates ship with prefetched crypto data. For live interactive dashboards, use our website.
              </p>
            </div>
          </div>
        </div>

        {/* Template Grid */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid gap-3">
            {availableTemplates.map((templateType) => {
              const template = TEMPLATES[templateType];
              if (!template) return null;

              return (
                <button
                  key={templateType}
                  type="button"
                  onClick={() => handleTemplateSelect(templateType)}
                  className="group w-full p-4 bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-purple-500/50 rounded-xl text-left transition-all"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className="p-3 bg-gray-700/50 group-hover:bg-purple-600/20 rounded-lg text-2xl transition-colors">
                      {template.icon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-white group-hover:text-purple-400 transition-colors">
                          {template.name}
                        </h3>
                        <span className="px-2 py-0.5 bg-purple-600/20 text-purple-400 text-xs font-medium rounded">
                          BYOK
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mt-1 line-clamp-2">
                        {template.description}
                      </p>

                      {/* Sheet Preview */}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {template.sheets.slice(0, 4).map((sheet) => (
                          <span
                            key={sheet.name}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-700/50 text-gray-400 text-xs rounded"
                          >
                            <FileSpreadsheet className="w-3 h-3" />
                            {sheet.name}
                          </span>
                        ))}
                        {template.sheets.length > 4 && (
                          <span className="px-2 py-0.5 bg-gray-700/50 text-gray-500 text-xs rounded">
                            +{template.sheets.length - 4} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Arrow */}
                    <div className="flex-shrink-0 text-gray-500 group-hover:text-purple-400 transition-colors">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                No data stored
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                Formulas only
              </span>
              <span className="flex items-center gap-1">
                <Check className="w-3 h-3 text-green-500" />
                Live refresh
              </span>
            </div>
            <a
              href="/template-requirements"
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition"
            >
              Setup Guide
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Quick template picker for inline use (smaller footprint)
 */
export function TemplateQuickPicker({
  pageContext,
  onSelect,
}: {
  pageContext: PageContext;
  onSelect: (templateType: TemplateType) => void;
}) {
  const availableTemplates = getTemplatesForPage(pageContext.pageId);

  if (availableTemplates.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {availableTemplates.slice(0, 3).map((templateType) => {
        const template = TEMPLATES[templateType];
        if (!template) return null;

        return (
          <button
            key={templateType}
            type="button"
            onClick={() => onSelect(templateType)}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-700/50 hover:bg-purple-600/20 border border-gray-600 hover:border-purple-500/50 rounded-lg text-sm transition-all"
          >
            <span>{template.icon}</span>
            <span className="text-gray-300">{template.name}</span>
          </button>
        );
      })}
      {availableTemplates.length > 3 && (
        <span className="inline-flex items-center px-3 py-1.5 text-gray-500 text-sm">
          +{availableTemplates.length - 3} more
        </span>
      )}
    </div>
  );
}
