'use client';

import Link from 'next/link';
import { Info, FileSpreadsheet, Shield, Key } from 'lucide-react';

interface ProductDisclaimerProps {
  variant?: 'default' | 'compact' | 'banner';
  showRefundLink?: boolean;
  className?: string;
}

export function ProductDisclaimer({
  variant = 'default',
  showRefundLink = true,
  className = ''
}: ProductDisclaimerProps) {
  if (variant === 'banner') {
    return (
      <div className={`bg-blue-50 border-b border-blue-100 ${className}`}>
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-blue-800">
            <span className="flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" />
              <strong>Templates + Workflow</strong>
            </span>
            <span className="text-blue-400">•</span>
            <span className="flex items-center gap-1.5">
              <Key className="w-4 h-4" />
              BYOK (Your API Key)
            </span>
            <span className="text-blue-400">•</span>
            <span className="flex items-center gap-1.5">
              <Shield className="w-4 h-4" />
              30-day refund
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-start gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm ${className}`}>
        <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
        <p className="text-gray-600">
          <strong className="text-gray-800">Templates + BYOK:</strong> We sell Excel template software.
          Data is fetched using your own API key (e.g., CoinGecko free tier available).
          {showRefundLink && (
            <> <Link href="/refund" className="text-blue-600 hover:underline">30-day refund policy</Link></>
          )}
        </p>
      </div>
    );
  }

  // Default variant - full explanation
  return (
    <div className={`bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 ${className}`}>
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Info className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900 mb-2">What You&apos;re Getting</h3>

          <div className="grid sm:grid-cols-3 gap-4 mb-4">
            <div className="flex items-start gap-2">
              <FileSpreadsheet className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800 text-sm">Templates + Workflow</p>
                <p className="text-xs text-gray-600">Excel files with CRK formulas</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Key className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800 text-sm">BYOK Architecture</p>
                <p className="text-xs text-gray-600">Data via your own API key</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium text-gray-800 text-sm">Risk-Free</p>
                <p className="text-xs text-gray-600">30-day money-back guarantee</p>
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-3">
            We provide Excel templates with CRK formulas. The templates fetch data using <strong>your own</strong> API
            key (BYOK = Bring Your Own Key) - we don&apos;t store or redistribute market data. CoinGecko free tier available.
          </p>

          <div className="flex flex-wrap gap-3 text-sm">
            <a
              href="https://www.coingecko.com/en/api"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800"
            >
              Get CoinGecko API Key
            </a>
            {showRefundLink && (
              <>
                <span className="text-gray-300">|</span>
                <Link href="/refund" className="text-blue-600 hover:text-blue-800">
                  Refund Policy
                </Link>
              </>
            )}
            <span className="text-gray-300">|</span>
            <Link href="/template-requirements" className="text-blue-600 hover:text-blue-800">
              Setup Guide
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// Minimal inline version for modals/footers
export function ProductDisclaimerInline({ className = '' }: { className?: string }) {
  return (
    <p className={`text-xs text-gray-500 ${className}`}>
      Templates use CRK formulas. Data fetched via your own API key (BYOK).{' '}
      <Link href="/refund" className="underline hover:text-gray-700">
        30-day refund
      </Link>
    </p>
  );
}
