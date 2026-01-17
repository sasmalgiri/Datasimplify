'use client';

import { useState } from 'react';
import type { ContentType } from '@/lib/templates/generator';

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
 * Content type options for download
 */
type ContentOption = {
  id: ContentType;
  name: string;
  description: string;
  icon: string;
  badge?: string;
  badgeColor?: string;
};

const CONTENT_OPTIONS: ContentOption[] = [
  {
    id: 'addin',
    name: 'Interactive Charts',
    description: 'Animated ChartJS charts inside Excel via Office.js Add-in. Requires Microsoft 365.',
    icon: '✨',
    badge: 'Best Experience',
    badgeColor: 'bg-emerald-500',
  },
  {
    id: 'native_charts',
    name: 'Native Excel Charts',
    description: 'Create beautiful Excel charts manually. No add-in needed for charts! Works everywhere.',
    icon: '📊',
    badge: 'No Add-in',
    badgeColor: 'bg-blue-500',
  },
  {
    id: 'formulas_only',
    name: 'Formulas Only',
    description: 'Just CryptoSheets formulas, no charts. Smallest file size, fastest loading.',
    icon: '📝',
  },
];

/**
 * Template Download Modal
 *
 * Gates template downloads with clear requirements and warnings.
 * Offers 3 content types: Interactive Charts (Add-in), Native Excel Charts, Formulas Only
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
  const [contentType, setContentType] = useState<ContentType>('addin');
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
          contentType,
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

      // Include content type in filename
      const contentLabel = contentType === 'formulas_only' ? '_formulas' :
                          contentType === 'addin' ? '_interactive' :
                          contentType === 'native_charts' ? '_native' : '';
      a.download = `cryptoreportkit_${templateType}${contentLabel}.${format}`;
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

  const selectedOption = CONTENT_OPTIONS.find(opt => opt.id === contentType);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Download Template
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

        {/* Content Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Choose Content Type:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CONTENT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setContentType(option.id)}
                className={`relative p-4 border-2 rounded-lg transition-all text-left ${
                  contentType === option.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {option.badge && (
                  <span className={`absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold text-white rounded-full ${option.badgeColor}`}>
                    {option.badge}
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{option.icon}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{option.name}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {option.description}
                </p>
                {contentType === option.id && (
                  <div className="absolute top-2 left-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Type Specific Info */}
        {contentType === 'addin' && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
              <span>✨</span>
              Interactive Charts with Office.js Add-in
            </h3>
            <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Beautiful animated ChartJS charts inside Excel</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Requires <strong>Microsoft 365</strong> (Desktop, Web, or Mobile)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Also works with Office 2021/2019 (Desktop only)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Install CryptoReportKit Charts add-in after opening the file</span>
              </li>
            </ul>
          </div>
        )}

        {contentType === 'native_charts' && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
              <span>📊</span>
              Native Excel Charts - No Add-in Required
            </h3>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Works in <strong>all Excel versions</strong> - no Microsoft 365 needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Includes a &quot;Chart Guide&quot; sheet with step-by-step instructions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Pre-formatted data ranges optimized for Excel&apos;s chart wizard</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Dark theme color guide to match CryptoReportKit styling</span>
              </li>
            </ul>
          </div>
        )}

        {contentType === 'formulas_only' && (
          <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <span>📝</span>
              Formulas Only Mode
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Smallest file size - loads instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Only CryptoSheets formulas, no charts included</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Create your own charts manually if needed</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Best for advanced users or large datasets</span>
              </li>
            </ul>
          </div>
        )}

        {/* Requirements Box */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 dark:border-emerald-600 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Requirements
          </h3>
          <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
              <span>Microsoft Excel (Desktop, Online, or Mobile) - <strong>works everywhere!</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
              <span>CryptoSheets Add-in with <strong>active CryptoSheets account</strong></span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
              <span>Internet connection (live data from CryptoSheets)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
              <span>Charts included with formulas - auto-update when data refreshes</span>
            </li>
          </ul>
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
              <span className="text-gray-600 dark:text-gray-400">Content:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {selectedOption?.name}
              </div>
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            File Format:
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
            className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
            I understand this template <strong>requires an active CryptoSheets account</strong> to fetch live data.
            The template includes formulas and charts that auto-update when CryptoSheets refreshes.
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
            Install CryptoSheets
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
              `Download ${selectedOption?.name} (.${format})`
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
          <span className="text-gray-600 dark:text-gray-300">CryptoReportKit</span>
        </div>
      </div>
    </div>
  );
}
