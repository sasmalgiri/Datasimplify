'use client';

import { useState } from 'react';
import { Key, Eye, EyeOff, X, Shield, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ApiKeyModal({ isOpen, onClose, onSuccess }: ApiKeyModalProps) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setApiKey } = useLiveDashboardStore();

  if (!isOpen) return null;

  const handleValidate = async () => {
    if (!key || key.length < 8) {
      setError('Please enter a valid CoinGecko API key');
      return;
    }

    setValidating(true);
    setError(null);

    try {
      // Validate by making a simple ping-like request through our proxy
      const res = await fetch('/api/live-dashboard/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: key, endpoints: ['global'], params: {} }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to validate API key');
      }

      const data = await res.json();
      if (data.globalError) {
        throw new Error(data.globalError);
      }

      // Key is valid
      const keyType = key.startsWith('CG-') && key.length > 30 ? 'pro' : 'demo';
      setApiKey(key, keyType as 'pro' | 'demo');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid API key');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/10">
            <Key className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Connect Your API Key</h2>
            <p className="text-sm text-gray-400">Enter your CoinGecko API key to load live data</p>
          </div>
        </div>

        {/* Input */}
        <div className="relative mb-4">
          <input
            type={showKey ? 'text' : 'password'}
            value={key}
            onChange={(e) => { setKey(e.target.value); setError(null); }}
            placeholder="Paste your CoinGecko API key..."
            className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-3 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-emerald-500 pr-10"
            onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-400 text-sm mb-4">{error}</p>
        )}

        {/* Validate button */}
        <button
          onClick={handleValidate}
          disabled={validating || !key}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
        >
          {validating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Connect & Load Data
            </>
          )}
        </button>

        {/* Privacy notice */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <Shield className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
          <span>
            Your key stays in your browser session only. It is used to fetch data from CoinGecko and is never stored on our servers.
          </span>
        </div>

        {/* Get a key link */}
        <div className="mt-3 text-center">
          <a
            href="https://www.coingecko.com/en/api/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="text-emerald-400 hover:text-emerald-300 text-sm inline-flex items-center gap-1"
          >
            Don&apos;t have a key? Get one free
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
