'use client';

import { useWizard } from '../WizardContext';
import { FileSpreadsheet, RefreshCw, ExternalLink, PartyPopper, BookOpen, Key } from 'lucide-react';
import { BYOK_HEADING, BYOK_PRIVACY_FULL } from '@/lib/constants/byokMessages';

interface SuccessStepProps {
  onClose: () => void;
}

export function SuccessStep({ onClose }: SuccessStepProps) {
  const { state } = useWizard();

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20">
              <PartyPopper className="w-10 h-10 text-emerald-400" />
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">
            Your Template is Ready!
          </h2>
          <p className="text-gray-400 mb-6">
            <span className="text-emerald-400 font-medium">{state.templateName}</span> has been downloaded.
          </p>

          {/* Next Steps */}
          <div className="text-left mb-8">
            <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4 text-center">
              Just Two Steps
            </h3>
            <div className="space-y-4">
              {/* Step 1: Open in Excel Desktop */}
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-gray-800/50 border-gray-700">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 bg-emerald-500/20">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-emerald-400">Step 1</span>
                  <h4 className="font-medium text-white">Open in Excel Desktop</h4>
                  <p className="text-sm text-gray-400">
                    Double-click the downloaded file. Data is already populated with live market data.
                  </p>
                </div>
              </div>

              {/* Step 2: Refresh Anytime */}
              <div className="flex items-start gap-4 p-4 rounded-lg border bg-gray-800/50 border-gray-700">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 bg-emerald-500/20">
                  <RefreshCw className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <span className="text-xs font-medium text-emerald-400">Step 2</span>
                  <h4 className="font-medium text-white">Refresh Anytime</h4>
                  <p className="text-sm text-gray-400">
                    Your API key is embedded in the Settings sheet. Go to Data tab and click Refresh All for latest data.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* BYOK Info Box */}
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-6 text-left">
            <div className="flex items-start gap-3">
              <Key className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-blue-200 font-medium mb-1">{BYOK_HEADING}</p>
                <p className="text-xs text-blue-200/70">
                  {BYOK_PRIVACY_FULL}
                  {' '}This gives you full control and privacy over your data access.
                </p>
              </div>
            </div>
          </div>

          {/* Helpful Links */}
          <div className="space-y-3">
            <a
              href="/byok"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              View Complete Setup Guide
              <ExternalLink className="w-4 h-4" />
            </a>

            <a
              href="/template-requirements"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
            >
              Template Requirements
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>

          {/* Close Button */}
          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full py-3 bg-gray-700 hover:bg-gray-600 text-gray-300 font-medium rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
