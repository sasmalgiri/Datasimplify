'use client';

import { useState } from 'react';
import { useWizard } from '../WizardContext';
import { WizardNav } from '../shared/WizardNav';
import { Download, CheckCircle, Monitor, Globe, Apple, ExternalLink, AlertTriangle, Loader2, Wifi, WifiOff } from 'lucide-react';

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
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  const handleConfirmInstalled = () => {
    dispatch({ type: 'SET_ADDIN_INSTALLED', installed: true });
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionError(null);
    setConnectionSuccess(false);

    try {
      // Test the API endpoint that the add-in uses
      const response = await fetch('/api/v1/price?coin=bitcoin&currency=usd', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.bitcoin?.usd) {
          setConnectionSuccess(true);
          dispatch({ type: 'SET_ADDIN_CONNECTION_TESTED', tested: true });
        } else {
          setConnectionError('API responded but data format is unexpected. Please try again.');
        }
      } else if (response.status === 401) {
        setConnectionError('Authentication required. Please make sure you are signed in.');
      } else {
        setConnectionError(`API error (${response.status}). Please try again.`);
      }
    } catch (err) {
      setConnectionError('Failed to connect to the API. Please check your internet connection.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  const platformTabs = [
    { id: 'windows' as Platform, label: 'Windows', icon: Monitor },
    { id: 'mac' as Platform, label: 'Mac', icon: Apple },
    { id: 'web' as Platform, label: 'Excel Online', icon: Globe },
  ];

  const instructions: Record<Platform, { steps: string[]; notes: string[] }> = {
    windows: {
      steps: [
        'Download the CRK manifest file (button below)',
        'Open Microsoft Excel on your computer',
        'Go to Insert tab → Office Add-ins → My Add-ins',
        'Click "Manage My Add-ins" dropdown → "Upload My Add-in"',
        'Select the downloaded manifest.xml file',
        'Click Upload - the CRK add-in will appear in your ribbon',
      ],
      notes: [
        'Works with Microsoft 365, Office 2021, and Office 2019',
        'The add-in persists across Excel sessions once installed',
      ],
    },
    mac: {
      steps: [
        'Download the CRK manifest file (button below)',
        'Open Microsoft Excel for Mac',
        'Go to Insert menu → Office Add-ins → My Add-ins',
        'Click "Upload My Add-in" and select the manifest file',
        'The CRK add-in will appear in your ribbon',
      ],
      notes: [
        'Requires Microsoft 365 or Office 2021 for Mac',
        'Some features may differ from Windows version',
      ],
    },
    web: {
      steps: [
        'Download the CRK manifest file (button below)',
        'Go to excel.office.com and open a workbook',
        'Click Insert tab → Office Add-ins → My Add-ins',
        'Click "Upload My Add-in" tab',
        'Select the manifest file and upload',
      ],
      notes: [
        'Works in any modern browser (Chrome, Edge, Firefox, Safari)',
        'Requires a Microsoft account (free or paid)',
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
              Install the CRK Excel Add-in
            </h2>
            <p className="text-gray-400 text-sm">
              The add-in enables live crypto data formulas like =CRK.PRICE(&quot;bitcoin&quot;)
            </p>
          </div>

          {/* Important Notice - Must open Excel */}
          <div className="p-4 bg-amber-900/30 border border-amber-500/40 rounded-lg mb-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-medium text-sm mb-1">
                  Excel Installation Required
                </p>
                <p className="text-amber-400/80 text-xs">
                  You must <strong>open Microsoft Excel separately</strong> to install the add-in.
                  This wizard will guide you through the process, but the installation happens in Excel, not in your browser.
                </p>
              </div>
            </div>
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
              <div className="bg-gray-800/50 rounded-lg p-4 mb-4">
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

              {/* Download Manifest Button */}
              <a
                href="/addin/manifest.xml"
                download="crk-addin-manifest.xml"
                className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors text-sm mb-3"
              >
                <Download className="w-4 h-4" />
                Download CRK Manifest File
              </a>

              {/* Quick Link to detailed guide */}
              <a
                href="/addin/setup"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm mb-4"
              >
                View detailed setup guide with screenshots
                <ExternalLink className="w-4 h-4" />
              </a>

              {/* Test Connection Section */}
              <div className="bg-gray-800/30 border border-gray-700 rounded-lg p-4 mb-4">
                <h3 className="text-sm font-medium text-white mb-2 flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-blue-400" />
                  Test API Connection
                </h3>
                <p className="text-xs text-gray-400 mb-3">
                  After installing the add-in, test the connection to verify everything is working.
                </p>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="w-full py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 text-white font-medium rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
                >
                  {isTestingConnection ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Testing Connection...
                    </>
                  ) : connectionSuccess ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-emerald-400" />
                      Connection Successful!
                    </>
                  ) : (
                    <>
                      <Wifi className="w-4 h-4" />
                      Test Connection
                    </>
                  )}
                </button>

                {connectionError && (
                  <div className="mt-3 flex items-start gap-2 p-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <WifiOff className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400">{connectionError}</p>
                  </div>
                )}

                {connectionSuccess && (
                  <div className="mt-3 flex items-start gap-2 p-2 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-400">
                      API is working! Bitcoin price fetched successfully. The add-in will work correctly.
                    </p>
                  </div>
                )}
              </div>

              {/* Confirmation Button */}
              <button
                type="button"
                onClick={handleConfirmInstalled}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                I&apos;ve Installed the Add-in in Excel
              </button>

              {/* No skip option - must complete this step */}
              <p className="text-xs text-gray-500 text-center mt-3">
                The add-in is required for CRK formulas to work in your Excel templates.
              </p>
            </>
          )}
        </div>
      </div>

      <WizardNav />
    </div>
  );
}
