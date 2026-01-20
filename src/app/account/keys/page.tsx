'use client';

import { useState, useEffect } from 'react';
import { Key, Trash2, Plus, CheckCircle, XCircle, ExternalLink, Shield, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';

type Provider = 'coingecko' | 'binance' | 'coinmarketcap';

interface ProviderKey {
  provider: Provider;
  connected: boolean;
  hint?: string;
  isValid?: boolean;
  connectedAt?: string;
}

const PROVIDER_INFO: Record<Provider, {
  name: string;
  description: string;
  signupUrl: string;
  docsUrl: string;
  features: string[];
}> = {
  coingecko: {
    name: 'CoinGecko',
    description: 'Price, market cap, OHLCV, and coin metadata',
    signupUrl: 'https://www.coingecko.com/en/api/pricing',
    docsUrl: 'https://docs.coingecko.com/reference/introduction',
    features: ['Real-time prices', 'Historical OHLCV', 'Market cap data', 'Coin metadata'],
  },
  binance: {
    name: 'Binance',
    description: 'Real-time trading data and order book',
    signupUrl: 'https://www.binance.com/en/my/settings/api-management',
    docsUrl: 'https://binance-docs.github.io/apidocs/',
    features: ['Trading pairs', 'Order book depth', 'Recent trades', 'Kline data'],
  },
  coinmarketcap: {
    name: 'CoinMarketCap',
    description: 'Alternative market data source',
    signupUrl: 'https://coinmarketcap.com/api/',
    docsUrl: 'https://coinmarketcap.com/api/documentation/v1/',
    features: ['Market rankings', 'Price quotes', 'Exchange data', 'Global metrics'],
  },
};

export default function ApiKeysPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [keys, setKeys] = useState<ProviderKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadKeys();
    } else if (!authLoading) {
      setIsLoading(false);
    }
  }, [user, authLoading]);

  const loadKeys = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const providers: Provider[] = ['coingecko', 'binance', 'coinmarketcap'];
      const results: ProviderKey[] = [];

      for (const provider of providers) {
        const res = await fetch(`/api/v1/keys/${provider}`);
        if (res.ok) {
          const data = await res.json();
          results.push({ provider, ...data });
        } else {
          results.push({ provider, connected: false });
        }
      }

      setKeys(results);
    } catch (err) {
      setError('Failed to load API keys. Please try again.');
      console.error('Error loading keys:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Not logged in
  if (!authLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <Key className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-gray-400 mb-6">
            Sign in to manage your API keys and connect your data providers.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-gray-400">
            Connect your own API keys to get higher rate limits and premium data access.
            Your keys are encrypted and never shared.
          </p>
        </div>

        {/* Security Notice */}
        <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700 mb-8">
          <Shield className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-gray-300 font-medium mb-1">Your keys are secure</p>
            <p className="text-gray-400">
              All API keys are encrypted using AES-256-GCM before storage. We never store
              your keys in plain text and they are only decrypted when making requests on
              your behalf.
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 mb-6">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-4 bg-gray-800 rounded-lg border border-gray-700 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-700 rounded w-24 mb-2" />
                    <div className="h-3 bg-gray-700 rounded w-48" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Provider Cards */
          <div className="space-y-4">
            {keys.map((key) => (
              <ProviderKeyCard
                key={key.provider}
                providerKey={key}
                info={PROVIDER_INFO[key.provider]}
                onUpdate={loadKeys}
              />
            ))}
          </div>
        )}

        {/* Benefits Section */}
        <div className="mt-12 p-6 bg-gray-800/30 rounded-lg border border-gray-700">
          <h3 className="text-lg font-medium text-white mb-4">Why connect API keys?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-gray-300 font-medium">Higher Rate Limits</p>
                <p className="text-sm text-gray-500">
                  Make more requests without hitting limits
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-gray-300 font-medium">Premium Data</p>
                <p className="text-sm text-gray-500">
                  Access endpoints only available with paid keys
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-gray-300 font-medium">Data Privacy</p>
                <p className="text-sm text-gray-500">
                  Your requests go directly through your keys
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-gray-300 font-medium">No Extra Charge</p>
                <p className="text-sm text-gray-500">
                  CryptoReportKit doesn&apos;t charge for BYOK usage
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8">
          <Link
            href="/account"
            className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
          >
            ← Back to Account Settings
          </Link>
        </div>
      </div>
    </div>
  );
}

function ProviderKeyCard({
  providerKey,
  info,
  onUpdate,
}: {
  providerKey: ProviderKey;
  info: typeof PROVIDER_INFO[Provider];
  onUpdate: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!apiKey.trim()) return;

    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/keys/${providerKey.provider}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey: apiKey.trim() }),
      });

      if (res.ok) {
        setApiKey('');
        setIsEditing(false);
        onUpdate();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save key');
      }
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm(`Remove your ${info.name} API key? You can add it again later.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/v1/keys/${providerKey.provider}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        onUpdate();
      }
    } catch (err) {
      console.error('Error removing key:', err);
    }
  };

  return (
    <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gray-700 rounded-lg">
            <Key className="w-5 h-5 text-gray-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-medium text-white">{info.name}</h3>
              {providerKey.connected && (
                providerKey.isValid !== false ? (
                  <span className="flex items-center gap-1 text-xs text-emerald-400">
                    <CheckCircle className="w-3 h-3" />
                    Connected
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-red-400">
                    <XCircle className="w-3 h-3" />
                    Invalid
                  </span>
                )
              )}
            </div>
            <p className="text-sm text-gray-400">{info.description}</p>
          </div>
        </div>

        {providerKey.connected && providerKey.hint && (
          <span className="text-sm text-gray-500 font-mono">
            ••••{providerKey.hint}
          </span>
        )}
      </div>

      {/* Features */}
      <div className="flex flex-wrap gap-2 mb-4">
        {info.features.map((feature) => (
          <span
            key={feature}
            className="text-xs px-2 py-1 bg-gray-700/50 text-gray-400 rounded"
          >
            {feature}
          </span>
        ))}
      </div>

      {/* Edit Form */}
      {isEditing ? (
        <div className="space-y-3">
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Enter your ${info.name} API key`}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            autoFocus
          />

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !apiKey.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {isSaving ? 'Validating...' : 'Save Key'}
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setApiKey('');
                setError(null);
              }}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        /* Action Buttons */
        <div className="flex items-center gap-2">
          {providerKey.connected ? (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm transition-colors"
              >
                Update Key
              </button>
              <button
                onClick={handleRemove}
                className="p-1.5 text-gray-400 hover:text-red-400 transition-colors"
                title="Remove key"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Connect
              </button>
              <a
                href={info.signupUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
              >
                Get API key
                <ExternalLink className="w-3 h-3" />
              </a>
            </>
          )}

          <a
            href={info.docsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-xs text-gray-500 hover:text-gray-400 transition-colors"
          >
            Docs
          </a>
        </div>
      )}
    </div>
  );
}
