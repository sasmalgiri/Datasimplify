'use client';

import { Info, CheckCircle } from 'lucide-react';
import type { FormulaMode } from '@/lib/templates/generator';

interface FormulaModePickerProps {
  mode: FormulaMode;
  onChange: (mode: FormulaMode) => void;
  className?: string;
}

/**
 * FormulaModePicker - Choose between CryptoSheets and CRK formula formats
 *
 * Used on the download page to let users select which Excel add-in they want
 * their templates generated for.
 */
export function FormulaModePicker({ mode, onChange, className = '' }: FormulaModePickerProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <label className="block text-sm font-medium text-gray-300">
        Excel Add-in
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* CRK Add-in Option (Recommended) */}
        <button
          type="button"
          onClick={() => onChange('crk')}
          className={`relative p-4 rounded-lg border-2 text-left transition-all ${
            mode === 'crk'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
          }`}
        >
          {mode === 'crk' && (
            <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-emerald-500" />
          )}

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl" role="img" aria-label="chart">
              📊
            </span>
            <span className="font-medium text-white">CRK Add-in</span>
            <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded font-medium">
              Recommended
            </span>
          </div>

          <p className="text-xs text-gray-400 mb-3">
            Our native Excel add-in with BYOK (Bring Your Own Key) support.
          </p>

          <ul className="text-xs text-gray-500 space-y-1">
            <li className="flex items-center gap-1">
              <span className="text-emerald-500">✓</span> No third-party dependency
            </li>
            <li className="flex items-center gap-1">
              <span className="text-emerald-500">✓</span> Connect your own API keys
            </li>
            <li className="flex items-center gap-1">
              <span className="text-emerald-500">✓</span> Higher rate limits with Pro keys
            </li>
          </ul>
        </button>

        {/* CryptoSheets Option */}
        <button
          type="button"
          onClick={() => onChange('cryptosheets')}
          className={`relative p-4 rounded-lg border-2 text-left transition-all ${
            mode === 'cryptosheets'
              ? 'border-emerald-500 bg-emerald-500/10'
              : 'border-gray-700 hover:border-gray-600 bg-gray-800/50'
          }`}
        >
          {mode === 'cryptosheets' && (
            <CheckCircle className="absolute top-3 right-3 w-5 h-5 text-emerald-500" />
          )}

          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl" role="img" aria-label="link">
              🔗
            </span>
            <span className="font-medium text-white">CryptoSheets</span>
          </div>

          <p className="text-xs text-gray-400 mb-3">
            Third-party add-in with its own subscription.
          </p>

          <ul className="text-xs text-gray-500 space-y-1">
            <li className="flex items-center gap-1">
              <span className="text-gray-600">•</span> Separate subscription required
            </li>
            <li className="flex items-center gap-1">
              <span className="text-gray-600">•</span> Well-established add-in
            </li>
            <li className="flex items-center gap-1">
              <span className="text-gray-600">•</span> Works with existing templates
            </li>
          </ul>
        </button>
      </div>

      {/* Info box based on selection */}
      {mode === 'crk' && (
        <div className="flex items-start gap-2 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400 border border-gray-700">
          <Info className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="mb-1">
              <strong className="text-gray-300">First time?</strong> Install the CRK add-in from the{' '}
              <a
                href="/addin/setup"
                className="text-emerald-400 hover:text-emerald-300 underline"
                target="_blank"
                rel="noopener"
              >
                setup guide
              </a>
              .
            </p>
            <p>
              Bring your own API keys (CoinGecko, Binance) for higher rate limits.
              Your keys are encrypted and never shared.
            </p>
          </div>
        </div>
      )}

      {mode === 'cryptosheets' && (
        <div className="flex items-start gap-2 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-400 border border-gray-700">
          <Info className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="mb-1">
              <strong className="text-gray-300">Note:</strong> CryptoSheets requires a separate subscription.
            </p>
            <p>
              Get CryptoSheets at{' '}
              <a
                href="https://cryptosheets.com"
                className="text-blue-400 hover:text-blue-300 underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                cryptosheets.com
              </a>
              . Works with both Excel desktop and Excel Online.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormulaModePicker;
