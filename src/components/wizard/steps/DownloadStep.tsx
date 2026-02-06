'use client';

import { useState, useMemo } from 'react';
import { useWizard } from '../WizardContext';
import { FileSpreadsheet, Download, Check, Loader2, AlertCircle } from 'lucide-react';

// Map coin IDs to symbols for the API
const COIN_ID_TO_SYMBOL: Record<string, string> = {
  bitcoin: 'BTC',
  ethereum: 'ETH',
  binancecoin: 'BNB',
  solana: 'SOL',
  ripple: 'XRP',
  cardano: 'ADA',
  dogecoin: 'DOGE',
  polkadot: 'DOT',
  'avalanche-2': 'AVAX',
  chainlink: 'LINK',
  tron: 'TRX',
  uniswap: 'UNI',
  aave: 'AAVE',
  maker: 'MKR',
  'compound-governance-token': 'COMP',
};

export function DownloadStep() {
  const { state, dispatch } = useWizard();
  const [error, setError] = useState<string | null>(null);

  // Convert coin IDs to symbols for the API
  const coinSymbols = useMemo(() => {
    return state.selectedCoins.map(id => COIN_ID_TO_SYMBOL[id] || id.toUpperCase());
  }, [state.selectedCoins]);

  const handleDownload = async () => {
    dispatch({ type: 'SET_DOWNLOADING', downloading: true });
    setError(null);

    try {
      const response = await fetch('/api/templates/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType: state.templateId,
          coins: coinSymbols, // Use converted symbols like BTC, ETH
          timeframe: '30d',
          currency: 'usd',
          contentType: state.contentType,
          format: state.downloadFormat,
          email: state.email,
          customizations: {
            metrics: state.selectedMetrics,
            layout: state.dashboardLayout,
            // Include charts/dashboard when layout is 'charts' or 'detailed'
            includeCharts: state.dashboardLayout === 'charts' || state.dashboardLayout === 'detailed',
          },
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

      const contentLabel =
        state.contentType === 'formulas_only' ? '_formulas' :
        state.contentType === 'addin' ? '_interactive' :
        state.contentType === 'native_charts' ? '_native' : '';

      a.download = `cryptoreportkit_${state.templateId}${contentLabel}.${state.downloadFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      dispatch({ type: 'SET_DOWNLOAD_COMPLETE', complete: true });
      dispatch({ type: 'NEXT_STEP' });
    } catch (err) {
      console.error('[DownloadStep] Error:', err);
      setError(err instanceof Error ? err.message : 'Download failed. Please try again.');
    } finally {
      dispatch({ type: 'SET_DOWNLOADING', downloading: false });
    }
  };

  const contentTypes = [
    { id: 'native_charts' as const, name: 'With Charts', description: 'Includes pre-built Excel charts that update with your data', badge: 'Recommended' },
    { id: 'formulas_only' as const, name: 'Data Only', description: 'Just Power Query data tables, no charts (smallest file)', badge: null },
  ];

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/20 mb-4">
              <FileSpreadsheet className="w-6 h-6 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Ready to Download
            </h2>
            <p className="text-gray-400 text-sm">
              Review your configuration and download your template
            </p>
          </div>

          {/* Configuration Summary */}
          <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-white mb-3">Your Configuration</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Template:</span>
                <span className="text-white font-medium">{state.templateName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Coins:</span>
                <span className="text-white">{state.selectedCoins.length} selected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Metrics:</span>
                <span className="text-white">{state.selectedMetrics.length} selected</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Layout:</span>
                <span className="text-white capitalize">{state.dashboardLayout}</span>
              </div>
            </div>
            <p className="mt-3 pt-3 border-t border-gray-700 text-xs text-gray-500">
              Your CoinGecko API key stays in your Excel file. See the Success page for setup instructions.
            </p>
          </div>

          {/* Content Type Selection */}
          <div className="mb-6">
            <h3 className="font-medium text-white mb-3">Chart Type</h3>
            <div className="space-y-2">
              {contentTypes.map(type => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => dispatch({ type: 'SET_CONTENT_TYPE', contentType: type.id })}
                  className={`
                    w-full flex items-start gap-3 p-3 rounded-lg text-left transition-all
                    ${state.contentType === type.id
                      ? 'bg-emerald-500/20 border border-emerald-500/50'
                      : 'bg-gray-800 border border-gray-700 hover:border-gray-600'
                    }
                  `}
                >
                  <div className={`w-5 h-5 rounded-full flex-shrink-0 mt-0.5 flex items-center justify-center ${state.contentType === type.id ? 'bg-emerald-500' : 'bg-gray-700'}`}>
                    {state.contentType === type.id && <Check className="w-3 h-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${state.contentType === type.id ? 'text-emerald-400' : 'text-gray-300'}`}>
                        {type.name}
                      </span>
                      {type.badge && (
                        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-500 text-white rounded">
                          {type.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Format Selection */}
          <div className="mb-6">
            <h3 className="font-medium text-white mb-3">File Format</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_DOWNLOAD_FORMAT', format: 'xlsx' })}
                className={`p-3 rounded-lg text-center transition-all ${
                  state.downloadFormat === 'xlsx'
                    ? 'bg-emerald-500/20 border-2 border-emerald-500'
                    : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
                }`}
              >
                <p className={`font-medium ${state.downloadFormat === 'xlsx' ? 'text-emerald-400' : 'text-gray-300'}`}>
                  .xlsx
                </p>
                <p className="text-xs text-gray-500">Recommended</p>
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: 'SET_DOWNLOAD_FORMAT', format: 'xlsm' })}
                className={`p-3 rounded-lg text-center transition-all ${
                  state.downloadFormat === 'xlsm'
                    ? 'bg-emerald-500/20 border-2 border-emerald-500'
                    : 'bg-gray-800 border-2 border-gray-700 hover:border-gray-600'
                }`}
              >
                <p className={`font-medium ${state.downloadFormat === 'xlsm' ? 'text-emerald-400' : 'text-gray-300'}`}>
                  .xlsm
                </p>
                <p className="text-xs text-gray-500">With macros</p>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={state.isDownloading}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {state.isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Template...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download Template
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
