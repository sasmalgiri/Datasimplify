'use client';

import { useState } from 'react';
import { useWizard } from '../WizardContext';
import { WizardNav } from '../shared/WizardNav';
import { Key, ExternalLink, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function ApiKeyStep() {
  const { state, dispatch } = useWizard();
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState('');

  const handleValidateKey = async () => {
    if (!inputKey || inputKey.length < 10) {
      setError('Please enter a valid API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/v1/keys/coingecko', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: inputKey }),
      });

      if (response.ok) {
        dispatch({ type: 'SET_API_KEY', key: inputKey, valid: true });
      } else {
        const data = await response.json();
        setError(data.error || 'Invalid API key. Please check and try again.');
      }
    } catch (err) {
      setError('Failed to validate key. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSkip = () => {
    dispatch({ type: 'SKIP_API_KEY' });
    dispatch({ type: 'NEXT_STEP' });
  };

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 mb-4">
              <Key className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Get Your CoinGecko API Key
            </h2>
            <p className="text-gray-400 text-sm">
              A free API key gives you higher rate limits and better data access.
            </p>
          </div>

          {state.isApiKeyValid ? (
            /* Success State */
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">API Key Connected</p>
                  <p className="text-sm text-emerald-400">
                    Your CoinGecko API key is validated and ready to use
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Instructions */}
              <div className="bg-gray-800/50 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-white mb-3">How to get a free API key:</h3>
                <ol className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
                    <div>
                      <p className="text-gray-300">Go to CoinGecko API page</p>
                      <a
                        href="https://www.coingecko.com/en/api/pricing"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs mt-1"
                      >
                        Open CoinGecko API <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
                    <p className="text-gray-300">Sign up for the free &quot;Demo&quot; plan (no credit card)</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">3</span>
                    <p className="text-gray-300">Copy your API key from the dashboard</p>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">4</span>
                    <p className="text-gray-300">Paste it below and click Validate</p>
                  </li>
                </ol>
              </div>

              {/* API Key Input */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="api-key" className="block text-sm font-medium text-gray-300 mb-2">
                    Your CoinGecko API Key
                  </label>
                  <input
                    id="api-key"
                    type="password"
                    value={inputKey}
                    onChange={(e) => setInputKey(e.target.value)}
                    placeholder="CG-xxxxxxxxxxxxxxxxxxxxxxxx"
                    className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 font-mono text-sm"
                  />
                </div>

                {error && (
                  <div className="flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleValidateKey}
                  disabled={isValidating || !inputKey}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {isValidating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Validating...
                    </>
                  ) : (
                    'Validate Key'
                  )}
                </button>
              </div>

              {/* Security Note */}
              <div className="mt-4 p-3 bg-gray-800/50 rounded-lg">
                <p className="text-xs text-gray-500">
                  Your API key is encrypted with AES-256 and stored securely. We only use it to fetch data on your behalf.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <WizardNav
        showSkip={!state.isApiKeyValid}
        skipLabel="Skip for now"
        onSkip={handleSkip}
      />
    </div>
  );
}
