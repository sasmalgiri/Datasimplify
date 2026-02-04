'use client';

import { useState } from 'react';
import { useWizard } from '../WizardContext';
import { WizardNav } from '../shared/WizardNav';
import { Download, CheckCircle, Monitor, Globe, Apple, ExternalLink } from 'lucide-react';

type Platform = 'windows' | 'mac' | 'web';

// Detect platform using lazy initialization
function detectPlatform(): Platform {
  if (typeof window === 'undefined') return 'windows';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('win')) return 'windows';
  return 'web';
}

export function AddinStep() {
  const { state, dispatch } = useWizard();
  const [platform, setPlatform] = useState<Platform>(detectPlatform);

  const handleConfirmInstalled = () => {
    dispatch({ type: 'SET_ADDIN_INSTALLED', installed: true });
  };

  const handleSkip = () => {
    dispatch({ type: 'SKIP_ADDIN' });
    dispatch({ type: 'NEXT_STEP' });
  };

  const platformTabs = [
    { id: 'windows' as Platform, label: 'Windows', icon: Monitor },
    { id: 'mac' as Platform, label: 'Mac', icon: Apple },
    { id: 'web' as Platform, label: 'Excel Online', icon: Globe },
  ];

  const instructions: Record<Platform, { steps: string[]; notes: string[] }> = {
    windows: {
      steps: [
        'Open Microsoft Excel',
        'Go to Insert tab → Get Add-ins (or Office Add-ins)',
        'Search for "CryptoReportKit" in the store',
        'Click Add to install the add-in',
        'Sign in with your CryptoReportKit account',
      ],
      notes: [
        'Works with Microsoft 365, Office 2021, and Office 2019',
        'The add-in will appear in the Home tab ribbon',
      ],
    },
    mac: {
      steps: [
        'Open Microsoft Excel for Mac',
        'Go to Insert menu → Get Add-ins',
        'Search for "CryptoReportKit" in the store',
        'Click Add to install',
        'Sign in with your CryptoReportKit account',
      ],
      notes: [
        'Requires Microsoft 365 or Office 2021 for Mac',
        'Some features may differ from Windows version',
      ],
    },
    web: {
      steps: [
        'Go to excel.office.com and open a workbook',
        'Click Insert tab → Office Add-ins',
        'Search for "CryptoReportKit"',
        'Click Add to install',
        'Sign in when prompted',
      ],
      notes: [
        'Works in any modern browser',
        'Requires a Microsoft account (free)',
        'Full functionality available in Excel Online',
      ],
    },
  };

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/20 mb-4">
              <Download className="w-6 h-6 text-blue-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Install the CRK Add-in
            </h2>
            <p className="text-gray-400 text-sm">
              The add-in powers the CRK formulas in your Excel templates.
            </p>
          </div>

          {state.addinInstalled ? (
            /* Success State */
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">Add-in Ready</p>
                  <p className="text-sm text-emerald-400">
                    You&apos;re all set to use CRK formulas in Excel
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Platform Tabs */}
              <div className="flex gap-2 mb-4">
                {platformTabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setPlatform(tab.id)}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors
                      ${platform === tab.id
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-gray-600'
                      }
                    `}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Instructions */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-white mb-3">Installation Steps:</h3>
                <ol className="space-y-3">
                  {instructions[platform].steps.map((step, index) => (
                    <li key={index} className="flex items-start gap-3 text-sm">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </span>
                      <span className="text-gray-300">{step}</span>
                    </li>
                  ))}
                </ol>

                {/* Notes */}
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-2">Notes:</p>
                  <ul className="space-y-1">
                    {instructions[platform].notes.map((note, index) => (
                      <li key={index} className="text-xs text-gray-400 flex items-start gap-2">
                        <span className="text-emerald-500 mt-0.5">•</span>
                        {note}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Quick Link */}
              <a
                href="/addin/setup"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm mb-4"
              >
                View detailed setup guide
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Confirmation Button */}
              <button
                type="button"
                onClick={handleConfirmInstalled}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                I&apos;ve Installed the Add-in
              </button>
            </>
          )}
        </div>
      </div>

      <WizardNav
        showSkip={!state.addinInstalled}
        skipLabel="Skip for now"
        onSkip={handleSkip}
      />
    </div>
  );
}
