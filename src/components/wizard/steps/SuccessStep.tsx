'use client';

import { useWizard } from '../WizardContext';
import { CheckCircle, Puzzle, FileSpreadsheet, Zap, ExternalLink, AlertTriangle, PartyPopper } from 'lucide-react';

interface SuccessStepProps {
  onClose: () => void;
}

export function SuccessStep({ onClose }: SuccessStepProps) {
  const { state } = useWizard();

  // Different content based on whether add-in was installed in the wizard
  const addinReady = state.addinInstalled;

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto">
        <div className="max-w-lg mx-auto text-center">
          {/* Success Icon */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/20">
              {addinReady ? (
                <PartyPopper className="w-10 h-10 text-emerald-400" />
              ) : (
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              )}
            </div>
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-white mb-2">
            {addinReady ? 'All Set!' : 'Your Template is Ready!'}
          </h2>
          <p className="text-gray-400 mb-3">
            <span className="text-emerald-400 font-medium">{state.templateName}</span> has been downloaded.
          </p>

          {/* What the Excel Contains */}
          <div className="p-3 bg-gray-800/70 rounded-lg mb-6 text-left">
            <p className="text-xs text-gray-400 mb-2">
              <strong className="text-gray-300">What&apos;s in the file:</strong>
            </p>
            <ul className="text-xs text-gray-400 space-y-1">
              <li>• Excel formulas like <code className="bg-gray-700 px-1 rounded">=CRK.PRICE(&quot;bitcoin&quot;)</code></li>
              <li>• Pre-configured layout, formatting, and dashboard</li>
              <li>• Data loads automatically when you open with the CRK add-in</li>
            </ul>
            <div className="mt-3 pt-3 border-t border-gray-700">
              <p className="text-xs text-emerald-400 font-medium mb-1">📊 Want Native Excel Charts?</p>
              <p className="text-xs text-gray-500">
                Open the CRK panel in Excel → Click &quot;Auto-Create Dashboard Charts&quot; to generate pie, bar, and line charts from your data.
              </p>
            </div>
          </div>

          {addinReady ? (
            /* Add-in Already Installed - Simple Success */
            <>
              {/* Success Message */}
              <div className="flex items-start gap-3 p-4 mb-6 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-left">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-emerald-200 font-medium">Ready to Use!</p>
                  <p className="text-xs text-emerald-200/70 mt-1">
                    You&apos;ve installed the CRK Add-in. Open the Excel file and your data will load automatically.
                  </p>
                </div>
              </div>

              {/* Simple Next Steps */}
              <div className="text-left mb-8">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4 text-center">
                  Just two steps
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg border bg-gray-800/50 border-gray-700">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 bg-emerald-500/20">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-emerald-400">Step 1</span>
                      <h4 className="font-medium text-white">Open in Excel</h4>
                      <p className="text-sm text-gray-400">Double-click the downloaded file</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg border bg-gray-800/50 border-gray-700">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 bg-emerald-500/20">
                      <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-emerald-400">Step 2</span>
                      <h4 className="font-medium text-white">See Your Data</h4>
                      <p className="text-sm text-gray-400">CRK formulas will show live crypto data</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Add-in Skipped - Show Warning */
            <>
              {/* Warning Notice */}
              <div className="flex items-start gap-3 p-4 mb-6 bg-amber-500/10 border border-amber-500/30 rounded-lg text-left">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-amber-200 font-medium">Add-in Required</p>
                  <p className="text-xs text-amber-200/70 mt-1">
                    You skipped the add-in installation. Without it, you&apos;ll see #NAME? errors instead of data.
                  </p>
                </div>
              </div>

              {/* Next Steps with Add-in */}
              <div className="text-left mb-8">
                <h3 className="text-sm font-medium text-gray-400 uppercase tracking-wide mb-4 text-center">
                  Complete these steps to see your data
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 p-4 rounded-lg border bg-emerald-500/10 border-emerald-500/50">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 bg-emerald-500/30">
                      <Puzzle className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-emerald-400">Step 1</span>
                        <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                          Required
                        </span>
                      </div>
                      <h4 className="font-medium text-white">Install CRK Add-in</h4>
                      <p className="text-sm text-gray-400">Required to enable CRK formulas in Excel</p>
                      <a
                        href="/coming-soon?feature=excel_addin"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-sm text-emerald-400 hover:text-emerald-300"
                      >
                        View Installation Guide
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg border bg-gray-800/50 border-gray-700">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 bg-emerald-500/20">
                      <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-emerald-400">Step 2</span>
                      <h4 className="font-medium text-white">Open Template in Excel</h4>
                      <p className="text-sm text-gray-400">Double-click the downloaded file</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4 p-4 rounded-lg border bg-gray-800/50 border-gray-700">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg flex-shrink-0 bg-emerald-500/20">
                      <Zap className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <span className="text-xs font-medium text-emerald-400">Step 3</span>
                      <h4 className="font-medium text-white">Data Loads Automatically</h4>
                      <p className="text-sm text-gray-400">CRK formulas will populate with live data</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Primary Action - Install Add-in */}
              <a
                href="/coming-soon?feature=excel_addin"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors mb-4"
              >
                <Puzzle className="w-5 h-5" />
                Install CRK Add-in Now
                <ExternalLink className="w-4 h-4" />
              </a>
            </>
          )}

          {/* Helpful Links */}
          <div className="space-y-3">
            <a
              href="/addin/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm"
            >
              View Formula Documentation
              <ExternalLink className="w-4 h-4" />
            </a>

            {!state.isApiKeyValid && (
              <a
                href="/byok"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors text-sm border border-blue-500/30"
              >
                Get Your API Key for Higher Rate Limits
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
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
