'use client';

import { useState } from 'react';
import { Key, Eye, EyeOff, X, Shield, ExternalLink, Loader2, CheckCircle, ChevronDown, Wallet, HelpCircle } from 'lucide-react';
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

  // Onboarding guide
  const [showGuide, setShowGuide] = useState(false);
  // Alchemy section
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [alchemyKeyInput, setAlchemyKeyInput] = useState('');
  const [walletInput, setWalletInput] = useState('');
  const [chainInput, setChainInput] = useState('eth-mainnet');

  const { setApiKey, setAlchemyKey, setWalletAddress, setAlchemyChain, alchemyKey, walletAddress, alchemyChain } = useLiveDashboardStore();

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

      // Save Alchemy key + wallet + chain if provided
      if (alchemyKeyInput.trim()) {
        setAlchemyKey(alchemyKeyInput.trim());
      }
      if (walletInput.trim() && /^0x[a-fA-F0-9]{40}$/.test(walletInput.trim())) {
        setWalletAddress(walletInput.trim());
      }
      if (chainInput) {
        setAlchemyChain(chainInput);
      }

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
      <div className="relative bg-gray-800 border border-gray-700 rounded-2xl max-w-md w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
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
            <h2 className="text-lg font-bold text-white">Connect Your API Keys</h2>
            <p className="text-sm text-gray-400">Enter your CoinGecko API key to load live data</p>
          </div>
        </div>

        {/* CoinGecko Input */}
        <label className="block text-xs font-medium text-gray-400 mb-1.5">CoinGecko API Key</label>
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

        {/* Advanced: Alchemy Section */}
        <div className="mt-5 border-t border-gray-700 pt-4">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition w-full"
          >
            <Wallet className="w-4 h-4 text-blue-400" />
            <span className="font-medium">On-Chain Wallet Data</span>
            {alchemyKey && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">Connected</span>}
            <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-gray-500">
                Connect an Alchemy API key to view on-chain wallet balances and transfer history on wallet dashboards.
              </p>

              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Alchemy API Key <span className="text-gray-600">(optional)</span></label>
                <input
                  type="text"
                  value={alchemyKeyInput}
                  onChange={(e) => setAlchemyKeyInput(e.target.value)}
                  placeholder="Paste your Alchemy API key..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              {alchemyKeyInput && (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Wallet Address</label>
                    <input
                      type="text"
                      value={walletInput}
                      onChange={(e) => setWalletInput(e.target.value)}
                      placeholder="0x..."
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    {walletInput && !/^0x[a-fA-F0-9]{40}$/.test(walletInput) && (
                      <p className="text-yellow-500 text-[10px] mt-1">Enter a valid EVM address (0x + 40 hex chars)</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-400 mb-1">Chain</label>
                    <select
                      value={chainInput}
                      onChange={(e) => setChainInput(e.target.value)}
                      title="Select blockchain network"
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                    >
                      <option value="eth-mainnet">Ethereum</option>
                      <option value="polygon-mainnet">Polygon</option>
                      <option value="arb-mainnet">Arbitrum</option>
                      <option value="base-mainnet">Base</option>
                      <option value="opt-mainnet">Optimism</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex items-center gap-2">
                <a
                  href="https://dashboard.alchemy.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-xs inline-flex items-center gap-1"
                >
                  Get free Alchemy key (300M calls/month)
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {alchemyKeyInput && (
                <p className="text-[10px] text-gray-500">
                  By connecting, you agree to{' '}
                  <a href="https://www.alchemy.com/terms-conditions" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
                    Alchemy&apos;s Terms
                  </a>.
                </p>
              )}
            </div>
          )}
        </div>

        {/* Privacy & terms notice */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <Shield className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
          <span>
            Your keys stay in your browser&apos;s local storage. They are never stored on our servers.
            By connecting, you agree to{' '}
            <a href="https://www.coingecko.com/en/api_terms" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
              CoinGecko&apos;s API Terms
            </a>.
          </span>
        </div>

        {/* Get a key — guided onboarding */}
        <div className="mt-4 border-t border-gray-700 pt-4">
          <button
            type="button"
            onClick={() => setShowGuide(!showGuide)}
            className="flex items-center gap-2 text-sm text-emerald-400 hover:text-emerald-300 transition w-full"
          >
            <HelpCircle className="w-4 h-4" />
            <span className="font-medium">Don&apos;t have a key? Get one free</span>
            <ChevronDown className={`w-3.5 h-3.5 ml-auto transition-transform ${showGuide ? 'rotate-180' : ''}`} />
          </button>

          {showGuide && (
            <div className="mt-3 space-y-3">
              <p className="text-xs text-gray-400">
                CoinGecko offers a free Demo API key — no credit card required. Follow these steps:
              </p>

              <ol className="space-y-2.5 text-xs text-gray-300">
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">1</span>
                  <span>
                    Go to{' '}
                    <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                      CoinGecko API Pricing <ExternalLink className="w-2.5 h-2.5" />
                    </a>{' '}
                    and click <strong className="text-white">Get Started</strong> under the Demo (Free) plan.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">2</span>
                  <span>
                    Create an account with your email address, or sign in with Google.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">3</span>
                  <span>
                    Once logged in, go to the{' '}
                    <a href="https://www.coingecko.com/en/developers/dashboard" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline inline-flex items-center gap-0.5">
                      Developer Dashboard <ExternalLink className="w-2.5 h-2.5" />
                    </a>{' '}
                    and copy your API key.
                  </span>
                </li>
                <li className="flex gap-2">
                  <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">4</span>
                  <span>
                    Paste the key above and click <strong className="text-white">Connect & Load Data</strong>.
                  </span>
                </li>
              </ol>

              <div className="bg-gray-900/60 border border-gray-700 rounded-lg p-2.5 text-[11px] text-gray-400">
                <p className="font-medium text-gray-300 mb-1">Demo plan includes:</p>
                <ul className="space-y-0.5">
                  <li>30 calls/min &middot; 10,000 calls/month</li>
                  <li>Prices, OHLC, volume, market data & more</li>
                  <li>No credit card required</li>
                </ul>
              </div>

              <a
                href="https://support.coingecko.com/hc/en-us/articles/21880397454233"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-300 text-[11px] inline-flex items-center gap-1"
              >
                Read CoinGecko&apos;s official guide
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
