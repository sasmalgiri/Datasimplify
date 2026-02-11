'use client';

import { useState } from 'react';
import { useWizard } from '../WizardContext';
import { WizardNav } from '../shared/WizardNav';
import { Key, Eye, EyeOff, CheckCircle, ExternalLink, AlertCircle, Loader2, Shield } from 'lucide-react';

export function ApiKeyStep() {
  const { state, dispatch } = useWizard();
  const [showKey, setShowKey] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleValidate = async () => {
    const key = state.apiKey.trim();
    if (!key || key.length < 10) {
      setError('Please enter a valid CoinGecko API key');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/templates/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key }),
      });

      const data = await response.json();

      if (data.valid) {
        dispatch({ type: 'SET_API_KEY_VALIDATED', validated: true });
        dispatch({ type: 'SET_API_KEY_TYPE', keyType: data.keyType });
      } else {
        setError(data.error || 'Invalid API key. Please check and try again.');
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyChange = (value: string) => {
    dispatch({ type: 'SET_API_KEY', apiKey: value });
    setError(null);
  };

  return (
    <div className="flex flex-col min-h-0">
      <div className="flex-1 px-4 sm:px-6 py-6 sm:py-8 overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 mb-4">
              <Key className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Enter Your CoinGecko API Key
            </h2>
            <p className="text-gray-400 text-sm">
              Your key is used to fetch live data and embedded in your Excel file for Power Query refresh.
            </p>
          </div>

          {/* Get API Key Info */}
          <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg mb-6">
            <p className="text-sm text-blue-200 mb-2">
              Don&apos;t have an API key? Get one free from CoinGecko (no credit card required).
            </p>
            <a
              href="https://www.coingecko.com/en/api/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 font-medium"
            >
              Get Free CoinGecko API Key
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          {/* API Key Input */}
          <div className="mb-4">
            <label htmlFor="wizard-api-key" className="block text-sm font-medium text-gray-300 mb-2">
              CoinGecko API Key
            </label>
            <div className="relative">
              <input
                id="wizard-api-key"
                type={showKey ? 'text' : 'password'}
                value={state.apiKey}
                onChange={(e) => handleKeyChange(e.target.value)}
                placeholder="CG-xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 pr-12 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono text-sm"
                onKeyDown={(e) => e.key === 'Enter' && !state.apiKeyValidated && handleValidate()}
                disabled={isValidating}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                aria-label={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Validate Button or Success State */}
          {state.apiKeyValidated ? (
            <div className="p-4 bg-emerald-900/20 border border-emerald-500/30 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                <div>
                  <p className="text-white font-medium">
                    Valid {state.apiKeyType === 'pro' ? 'Pro' : 'Demo'} API Key
                  </p>
                  <p className="text-sm text-emerald-400">
                    {state.apiKeyType === 'pro'
                      ? 'Pro key detected — higher rate limits and priority access'
                      : 'Demo key — 10,000 calls/month free'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleValidate}
              disabled={isValidating || state.apiKey.trim().length < 10}
              className="w-full py-3 mb-6 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-700 disabled:text-gray-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
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
          )}

          {/* Error */}
          {error && (
            <div className="mb-6 flex items-start gap-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}

          {/* Privacy Notice */}
          <div className="flex items-start gap-2 p-3 bg-gray-800/50 rounded-lg border border-gray-700">
            <Shield className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-400">
              Your API key is used only for this download and embedded in your Excel file for Power Query refresh. It is never stored on our servers.
            </p>
          </div>
        </div>
      </div>

      <WizardNav />
    </div>
  );
}
