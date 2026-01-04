'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';

interface VerificationResponse {
  success: boolean;
  error?: string;
  code?: string;
  details?: string;
  chainId?: number;
  address?: string;
  verified?: boolean;
  status?: 'verified' | 'not_verified';
  matchType?: string;
  contractName?: string;
  source?: 'sourcify' | 'cache';
  stale?: boolean;
  staleReason?: string;
}

export default function SmartContractVerifierPage() {
  const [chainId, setChainId] = useState('1');
  const [address, setAddress] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);

  const clear = () => {
    setChainId('1');
    setAddress('');
    setResult(null);
  };

  const verify = async () => {
    if (!address.trim()) {
      alert('Please enter a contract address');
      return;
    }

    setIsVerifying(true);
    setResult(null);

    try {
      const res = await fetch('/api/smart-contract/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId: Number(chainId),
          address: address.trim()
        })
      });

      const data = await res.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <FreeNavbar />

      {/* Hero Section */}
      <section className="py-12 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-gray-900 text-xl">
              SC
            </div>
            <h1 className="text-3xl font-bold text-white">
              Safe<span className="text-emerald-400">Contract</span>
            </h1>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold border border-emerald-500">
              Sourcify
            </span>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4">
            Smart Contract Verification via <span className="text-emerald-400">Sourcify</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Checks whether a deployed contract is verified on Sourcify for the provided chain and address.
          </p>

          <div className="flex justify-center gap-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 font-mono">N/A</div>
              <div className="text-xs text-gray-500">Engine</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 font-mono">EVM</div>
              <div className="text-xs text-gray-500">Network</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 font-mono">API</div>
              <div className="text-xs text-gray-500">Mode</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Code Input Panel */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contract</span>
              <div className="flex gap-2">
                <button
                  onClick={clear}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="p-4 space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">Chain ID</label>
                <input
                  value={chainId}
                  onChange={(e) => setChainId(e.target.value)}
                  placeholder="1"
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">Examples: 1 (Ethereum), 10 (Optimism), 56 (BSC), 137 (Polygon), 42161 (Arbitrum)</p>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-2">Contract Address</label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-100 focus:outline-none font-mono"
                />
                <p className="text-xs text-gray-500 mt-2">Address must be a 0x-prefixed 40-hex EVM address.</p>
              </div>
            </div>

            <div className="flex justify-end px-4 py-3 border-t border-gray-700">
              <button
                onClick={verify}
                disabled={isVerifying}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-600 text-white font-medium rounded-lg transition flex items-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <span>🔍</span>
                    Check Verification
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Verification Results</span>
            </div>

            <div className="p-4 min-h-96">
              {isVerifying ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-3 border-gray-700 border-t-emerald-500 rounded-full animate-spin mb-4" />
                  <p className="text-gray-400">Verification in progress...</p>
                </div>
              ) : result ? (
                result.success ? (
                  <div className="space-y-4">
                    <div className={`p-4 rounded-lg border ${
                      result.verified
                        ? 'border-emerald-500 bg-emerald-500/10'
                        : 'border-gray-700 bg-gray-700/20'
                    }`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-white">
                            {result.verified ? 'Verified on Sourcify' : 'Not verified on Sourcify'}
                          </h3>
                          <p className="text-sm text-gray-400 mt-1">
                            Chain ID: {result.chainId} | Source: {result.source}{result.stale ? ' (stale)' : ''}
                          </p>
                          {result.contractName && (
                            <p className="text-sm text-gray-300 mt-2">
                              Contract name: <span className="font-mono">{result.contractName}</span>
                            </p>
                          )}
                          {result.matchType && (
                            <p className="text-sm text-gray-300 mt-1">
                              Match: <span className="font-mono">{result.matchType}</span>
                            </p>
                          )}
                          {result.stale && result.staleReason && (
                            <p className="text-xs text-gray-500 mt-2">Stale fallback: {result.staleReason}</p>
                          )}
                        </div>
                        <div className={`px-3 py-1 rounded text-xs font-semibold ${
                          result.verified ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gray-500/20 text-gray-300'
                        }`}>
                          {result.status}
                        </div>
                      </div>
                      {result.address && (
                        <div className="mt-3 p-2 bg-gray-900/40 rounded text-xs text-gray-400 font-mono break-all">
                          {result.address}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-gray-400">{result.error || 'Unknown error'}</p>
                    {result.details && (
                      <p className="text-gray-500 text-xs mt-2 max-w-sm">{result.details}</p>
                    )}
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-4xl mb-4 opacity-50">🔐</div>
                  <p className="text-gray-500">
                    Enter a chain ID + contract address and click<br />
                    <strong className="text-gray-400">Check Verification</strong> to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            This checks Sourcify verification status (not a security audit).
          </p>
          <p>Results are returned exactly as available; missing data shows as not verified.</p>
        </div>

        {/* Back Link */}
        <div className="mt-8 text-center">
          <Link href="/tools" className="text-gray-400 hover:text-white text-sm">
            ← Back to Tools
          </Link>
        </div>
      </main>
    </div>
  );
}
