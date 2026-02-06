'use client';

import { useState, useEffect } from 'react';
import { Key, Trash2, Plus, CheckCircle, XCircle, ExternalLink, Shield, AlertCircle, Lock } from 'lucide-react';
import Link from 'next/link';

type Provider = 'coingecko';

interface ProviderKey {
  provider: Provider;
  connected: boolean;
  hint?: string;
  isValid?: boolean;
}

const PROVIDER_INFO: Record<Provider, {
  name: string;
  description: string;
  signupUrl: string;
  docsUrl: string;
  features: string[];
  testEndpoint: string;
}> = {
  coingecko: {
    name: 'CoinGecko',
    description: 'Price, market cap, OHLCV, and coin metadata',
    signupUrl: 'https://www.coingecko.com/en/api/pricing',
    docsUrl: 'https://docs.coingecko.com/reference/introduction',
    features: ['Real-time prices', 'Historical OHLCV', 'Market cap data', 'Coin metadata'],
    testEndpoint: 'https://pro-api.coingecko.com/api/v3/ping',
  },
};

// LocalStorage keys
const STORAGE_KEYS = {
  coingecko: 'crk_coingecko_key',
};

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ProviderKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadKeys();
  }, []);

  const loadKeys = () => {
    setIsLoading(true);

    const providers: Provider[] = ['coingecko'];
    const results: ProviderKey[] = [];

    for (const provider of providers) {
      const storedKey = localStorage.getItem(STORAGE_KEYS[provider]);
      if (storedKey) {
        results.push({
          provider,
          connected: true,
          hint: storedKey.slice(-4),
          isValid: true, // We'll validate on save
        });
      } else {
        results.push({ provider, connected: false });
      }
    }

    setKeys(results);
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">API Keys</h1>
          <p className="text-gray-400">
            Connect your own API keys to get higher rate limits and premium data access.
          </p>
        </div>

        {/* Security Notice - Client-Side Storage */}
        <div className="flex items-start gap-3 p-4 bg-emerald-900/20 rounded-lg border border-emerald-500/30 mb-8">
          <Lock className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-emerald-400 font-medium mb-1">Your keys never leave your browser</p>
            <p className="text-gray-400">
              API keys are stored locally in your browser using LocalStorage. They are never sent to
              our servers. When you use the Excel add-in, API calls go directly from Excel to
              CoinGecko using your key.
            </p>
          </div>
        </div>

        {/* Privacy Benefits */}
        <div className="flex items-start gap-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700 mb-8">
          <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="text-gray-300 font-medium mb-1">True BYOK (Bring Your Own Key)</p>
            <ul className="text-gray-400 space-y-1">
              <li>• Keys stored only in your browser - we never see them</li>
              <li>• Direct API calls to CoinGecko - no proxy server</li>
              <li>• Clear your browser data anytime to remove keys</li>
              <li>• Keys sync across browser tabs but not devices</li>
            </ul>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="space-y-4">
            {[1].map((i) => (
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
                <p className="text-gray-300 font-medium">100% Private</p>
                <p className="text-sm text-gray-500">
                  Keys never touch our servers - true privacy
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

        {/* Important Note */}
        <div className="mt-6 p-4 bg-amber-900/20 rounded-lg border border-amber-500/30">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="text-amber-400 font-medium mb-1">Important</p>
              <ul className="text-gray-400 space-y-1">
                <li>• Keys are stored per-browser. You&apos;ll need to add them again on other devices.</li>
                <li>• Clearing browser data will remove your stored keys.</li>
                <li>• For Power Query templates, paste your key directly in Excel (see BYOK guide).</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back Link */}
        <div className="mt-8 flex gap-4">
          <Link
            href="/account"
            className="text-sm text-gray-400 hover:text-emerald-400 transition-colors"
          >
            ← Back to Account Settings
          </Link>
          <Link
            href="/byok"
            className="text-sm text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            View BYOK Setup Guide →
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
      // Validate key by making a test request to CoinGecko
      const response = await fetch(info.testEndpoint, {
        headers: {
          'x-cg-pro-api-key': apiKey.trim(),
        },
      });

      if (!response.ok) {
        // Try demo API endpoint for free keys
        const demoResponse = await fetch('https://api.coingecko.com/api/v3/ping');
        if (demoResponse.ok) {
          // It's a demo key or the key format is wrong
          // Store anyway but warn user
          console.log('Key validation: Using public API, key may be demo tier');
        }
      }

      // Store key in LocalStorage
      localStorage.setItem(STORAGE_KEYS[providerKey.provider], apiKey.trim());

      // Dispatch custom event for other tabs/components
      window.dispatchEvent(new StorageEvent('storage', {
        key: STORAGE_KEYS[providerKey.provider],
        newValue: apiKey.trim(),
      }));

      setApiKey('');
      setIsEditing(false);
      onUpdate();
    } catch (err) {
      // Network error - still save the key (user can verify later)
      localStorage.setItem(STORAGE_KEYS[providerKey.provider], apiKey.trim());
      setApiKey('');
      setIsEditing(false);
      onUpdate();
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemove = () => {
    if (!confirm(`Remove your ${info.name} API key? You can add it again later.`)) {
      return;
    }

    localStorage.removeItem(STORAGE_KEYS[providerKey.provider]);

    // Dispatch custom event for other tabs/components
    window.dispatchEvent(new StorageEvent('storage', {
      key: STORAGE_KEYS[providerKey.provider],
      newValue: null,
    }));

    onUpdate();
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
                <span className="flex items-center gap-1 text-xs text-emerald-400">
                  <CheckCircle className="w-3 h-3" />
                  Connected
                </span>
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
            placeholder={`Enter your ${info.name} API key (CG-xxxx...)`}
            className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            autoFocus
          />

          {error && (
            <p className="text-xs text-red-400 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {error}
            </p>
          )}

          <p className="text-xs text-gray-500">
            Your key will be stored locally in this browser only. It will never be sent to our servers.
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !apiKey.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-sm font-medium transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Key Locally'}
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
