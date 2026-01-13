'use client';

import { useState } from 'react';

interface TemplateDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateType: string;
  templateName: string;
  userConfig: {
    coins: string[];
    timeframe: string;
    currency: string;
    customizations: Record<string, unknown>;
  };
}

/**
 * Template Download Modal
 *
 * Gates template downloads with clear requirements and warnings.
 * Ensures users understand they need CryptoSheets add-in.
 */
export function TemplateDownloadModal({
  isOpen,
  onClose,
  templateType,
  templateName,
  userConfig,
}: TemplateDownloadModalProps) {
  const [understood, setUnderstood] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [format, setFormat] = useState<'xlsx' | 'xlsm'>('xlsx');
  const [error, setError] = useState<string | null>(null);

  const handleDownload = async () => {
    if (!understood) {
      setError('Please confirm you understand the requirements');
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const response = await fetch('/api/templates/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType,
          ...userConfig,
          format,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Download failed');
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `datasimplify_${templateType}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Close modal on success
      onClose();
    } catch (err) {
      console.error('[TemplateDownload] Error:', err);
      setError(err instanceof Error ? err.message : 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Spreadsheet Template Requirements
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Template: <span className="font-semibold text-gray-900 dark:text-white">{templateName}</span>
        </div>

        {/* Requirements Box */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-yellow-800 dark:text-yellow-400 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            Requirements
          </h3>
          <ul className="text-sm text-yellow-700 dark:text-yellow-300 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">✓</span>
              <span>Microsoft Excel Desktop (Windows/Mac) - Excel Online NOT supported</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">✓</span>
              <span>CryptoSheets Add-in with <strong>active CryptoSheets account</strong> (sign in within Excel)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-yellow-600 dark:text-yellow-400 mt-0.5">✓</span>
              <span>Internet connection (data pulls live from CryptoSheets)</span>
            </li>
          </ul>
        </div>

        {/* How It Works */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-2">
            How This Template Works
          </h3>
          <ol className="text-sm text-blue-700 dark:text-blue-300 space-y-2">
            <li className="flex gap-2">
              <span className="font-semibold min-w-[20px]">1.</span>
              <span>
                Download contains <strong>formulas only</strong> (no data included)
              </span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-[20px]">2.</span>
              <span>Open in Excel → formulas connect to CryptoSheets add-in</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-[20px]">3.</span>
              <span>CryptoSheets pulls data directly from its own sources</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-[20px]">4.</span>
              <span>Your configured data/charts appear automatically</span>
            </li>
            <li className="flex gap-2">
              <span className="font-semibold min-w-[20px]">5.</span>
              <span>Click &quot;Refresh All&quot; in Excel to update data anytime</span>
            </li>
          </ol>
        </div>

        {/* Configuration Summary */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Your Configuration:
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Coins:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {userConfig.coins.length > 0
                  ? `${userConfig.coins.slice(0, 5).join(', ')}${
                      userConfig.coins.length > 5 ? ` +${userConfig.coins.length - 5} more` : ''
                    }`
                  : 'None selected'}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Timeframe:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {userConfig.timeframe}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Currency:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {userConfig.currency}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Charts:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {userConfig.customizations.includeCharts ? 'Included' : 'Not included'}
              </div>
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Choose Format:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat('xlsx')}
              className={`p-3 border-2 rounded-lg transition-colors ${
                format === 'xlsx'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white">.xlsx (Recommended)</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                No macros, works everywhere
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormat('xlsm')}
              className={`p-3 border-2 rounded-lg transition-colors ${
                format === 'xlsm'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white">.xlsm</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Auto-refresh on open (requires macros)
              </div>
            </button>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <label className="flex items-start gap-3 mb-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => {
              setUnderstood(e.target.checked);
              setError(null);
            }}
            className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
            I understand this template <strong>requires an active CryptoSheets account</strong> (sign in within Excel)
            and will not work without it. This template contains formulas only - no market data is included.
            Data is fetched via the CryptoSheets add-in on my machine.
          </span>
        </label>

        {/* Requirements Link */}
        <div className="mb-4 text-center">
          <a
            href="/template-requirements"
            target="_blank"
            className="text-sm text-blue-500 hover:text-blue-600 underline"
          >
            View full template requirements →
          </a>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <a
            href="https://www.cryptosheets.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors inline-flex items-center gap-2 font-medium"
          >
            Install CryptoSheets Add-in
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!understood || downloading}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {downloading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </span>
            ) : (
              `Download Template (.${format})`
            )}
          </button>
        </div>

        {/* CryptoSheets Attribution */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
          Data powered by{' '}
          <a
            href="https://www.cryptosheets.com/"
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            CryptoSheets
          </a>
          {' • '}
          Template by{' '}
          <span className="text-gray-600 dark:text-gray-300">DataSimplify</span>
        </div>
      </div>
    </div>
  );
}
