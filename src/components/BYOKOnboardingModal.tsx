'use client';

import { useState } from 'react';
import { Key, Eye, EyeOff, X, Shield, ExternalLink, Loader2, CheckCircle } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

interface BYOKOnboardingModalProps {
  onClose: () => void;
  onSkip: () => void;
}

export function BYOKOnboardingModal({ onClose, onSkip }: BYOKOnboardingModalProps) {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setApiKey = useLiveDashboardStore((s) => s.setApiKey);

  const handleValidate = async () => {
    if (!key || key.length < 8) {
      setError('Please enter a valid CoinGecko API key');
      return;
    }

    setValidating(true);
    setError(null);

    try {
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
      if (data.globalError) throw new Error(data.globalError);

      const keyType = key.startsWith('CG-') && key.length > 30 ? 'pro' : 'demo';
      setApiKey(key, keyType as 'pro' | 'demo');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Invalid API key');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/[0.1] rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-xl bg-emerald-400/10">
              <Key className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">One-Time Setup</h2>
              <p className="text-xs text-gray-400">Enter your CoinGecko API key to unlock live data</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Key input */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1.5">CoinGecko API Key</label>
            <div className="relative">
              <input
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
                placeholder="CG-xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full bg-white/[0.04] border border-white/[0.1] text-white text-sm pl-3 pr-10 py-2.5 rounded-lg focus:outline-none focus:border-emerald-400/40 placeholder:text-gray-600"
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition p-1"
              >
                {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs mt-1.5">{error}</p>}
          </div>

          {/* Quick guide */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
            <p className="text-xs text-gray-400 font-medium mb-2">How to get your free key:</p>
            <ol className="text-[11px] text-gray-500 space-y-1.5 list-decimal list-inside">
              <li>
                Go to{' '}
                <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                  CoinGecko API <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </li>
              <li>Sign up for the free Demo plan (10,000 calls/month)</li>
              <li>Copy your API key from the Developer Dashboard</li>
              <li>Paste it above</li>
            </ol>
          </div>

          {/* Privacy notice */}
          <div className="flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-gray-500 leading-relaxed">
              Your key stays in your browser&apos;s local storage. We never store or see your API key on our servers.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[0.06] flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onSkip}
            className="text-xs text-gray-500 hover:text-gray-300 transition"
          >
            Skip for now
          </button>
          <button
            type="button"
            onClick={handleValidate}
            disabled={validating || key.length < 8}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-sm font-semibold rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {validating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Save &amp; Continue
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
