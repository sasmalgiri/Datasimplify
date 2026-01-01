'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

interface VerificationResult {
  name: string;
  type: string;
  function: string;
  description: string;
  status: 'verified' | 'vulnerable' | 'error';
  result: string;
  details: string;
  proofGenerated: boolean;
}

interface ProofCertificate {
  certificateId: string;
  contractHash: string;
  issuedAt: string;
  verificationMethod: string;
  provenProperties: string[];
  statement: string;
  disclaimer: string;
}

interface VerificationResponse {
  success: boolean;
  error?: string;
  contractHash?: string;
  timestamp?: string;
  verificationTime?: number;
  summary?: {
    totalChecks: number;
    verified: number;
    vulnerable: number;
    errors: number;
  };
  securityScore?: number;
  overallStatus?: string;
  results?: VerificationResult[];
  proofCertificate?: ProofCertificate | null;
  message?: string;
}

export default function ContractVerifyPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VerificationResponse | null>(null);

  const loadExample = async () => {
    try {
      const res = await fetch('/api/verify');
      const data = await res.json();
      setCode(data.code);
    } catch (e) {
      console.error('Failed to load example:', e);
    }
  };

  const clearCode = () => {
    setCode('');
    setResults(null);
  };

  const verify = async () => {
    if (!code.trim()) {
      alert('Please enter some Solidity code');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const res = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
      });

      const data = await res.json();
      setResults(data);
    } catch (e) {
      setResults({
        success: false,
        error: e instanceof Error ? e.message : 'Verification failed'
      });
    } finally {
      setLoading(false);
    }
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'border-green-500 bg-green-500/20 text-green-400';
    if (score >= 50) return 'border-yellow-500 bg-yellow-500/20 text-yellow-400';
    return 'border-red-500 bg-red-500/20 text-red-400';
  };

  const getStatusIcon = (status: string) => {
    if (status === 'verified') return '✓';
    if (status === 'vulnerable') return '✗';
    return '!';
  };

  const getStatusClass = (status: string) => {
    if (status === 'verified') return 'bg-green-500/20 text-green-400';
    if (status === 'vulnerable') return 'bg-red-500/20 text-red-400';
    return 'bg-yellow-500/20 text-yellow-400';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-gray-900 font-bold text-xl">
              SC
            </div>
            <h1 className="text-4xl font-bold">
              Safe<span className="text-green-400">Contract</span>
            </h1>
            <span className="px-3 py-1 bg-green-500/20 border border-green-500 rounded-full text-green-400 text-sm font-semibold">
              Z3 Powered
            </span>
          </div>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Formal Verification for Smart Contracts. Mathematical proofs, not just pattern matching.
            Our Z3-powered engine proves your contract is secure for ALL possible inputs.
          </p>

          {/* Stats */}
          <div className="flex justify-center gap-12 mt-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 font-mono">Z3</div>
              <div className="text-gray-500 text-sm">SMT Solver</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 font-mono">&lt;30s</div>
              <div className="text-gray-500 text-sm">Verification Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 font-mono">100%</div>
              <div className="text-gray-500 text-sm">Mathematical Proof</div>
            </div>
          </div>
        </div>

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Code Input Panel */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Solidity Code</span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={loadExample}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-gray-300 transition"
                >
                  Load Example
                </button>
                <button
                  type="button"
                  onClick={clearCode}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-gray-300 transition"
                >
                  Clear
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={`// Paste your Solidity code here...

pragma solidity ^0.8.0;

contract MyContract {
    // Your code
}`}
              className="w-full h-96 p-4 bg-transparent text-gray-200 font-mono text-sm resize-none outline-none"
            />
            <div className="flex justify-end px-4 py-3 border-t border-gray-700">
              <button
                type="button"
                onClick={verify}
                disabled={loading}
                className="px-6 py-2.5 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-lg transition flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
                    Verifying...
                  </>
                ) : (
                  <>🔍 Verify Contract</>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Verification Results</span>
              {results?.success && results.summary && (
                <span className={`px-2 py-1 rounded text-xs font-semibold ${results.summary.vulnerable > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                  {results.summary.vulnerable > 0 ? 'Issues Found' : 'Verified Safe'}
                </span>
              )}
            </div>

            <div className="p-4 min-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-80">
                  <div className="w-12 h-12 border-3 border-gray-700 border-t-green-500 rounded-full animate-spin" />
                  <p className="mt-4 text-gray-400">Running Z3 formal verification...</p>
                </div>
              ) : results ? (
                results.success ? (
                  <div className="space-y-4">
                    {/* Security Score */}
                    {results.securityScore !== undefined && (
                      <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl">
                        <div className={`w-20 h-20 rounded-full border-2 flex items-center justify-center text-2xl font-bold font-mono ${getScoreClass(results.securityScore)}`}>
                          {results.securityScore}%
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{results.overallStatus}</h3>
                          <p className="text-gray-400 text-sm">
                            {results.summary?.verified} of {results.summary?.totalChecks} properties verified
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Summary Cards */}
                    {results.summary && (
                      <div className="grid grid-cols-4 gap-3">
                        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold font-mono">{results.summary.totalChecks}</div>
                          <div className="text-xs text-gray-500 uppercase">Total</div>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold font-mono text-green-400">{results.summary.verified}</div>
                          <div className="text-xs text-gray-500 uppercase">Verified</div>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold font-mono text-red-400">{results.summary.vulnerable}</div>
                          <div className="text-xs text-gray-500 uppercase">Issues</div>
                        </div>
                        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
                          <div className="text-2xl font-bold font-mono text-yellow-400">{results.summary.errors}</div>
                          <div className="text-xs text-gray-500 uppercase">Errors</div>
                        </div>
                      </div>
                    )}

                    {/* Check Results */}
                    {results.results && results.results.length > 0 && (
                      <div className="space-y-2">
                        {results.results.map((check, i) => (
                          <div key={i} className="flex items-start gap-3 p-3 bg-gray-900/50 rounded-lg">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${getStatusClass(check.status)}`}>
                              {getStatusIcon(check.status)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm">{check.description}</div>
                              <div className="text-xs text-gray-500">
                                Function: {check.function}() | Type: {check.type}
                              </div>
                              {check.details && (
                                <div className="mt-2 p-2 bg-gray-800 rounded text-xs font-mono text-gray-400">
                                  {check.details}
                                </div>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold uppercase ${getStatusClass(check.status)}`}>
                              {check.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Proof Certificate */}
                    {results.proofCertificate && (
                      <div className="p-4 bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-500/50 rounded-xl">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-2xl">🏆</span>
                          <h4 className="text-green-400 font-semibold">Formal Verification Certificate</h4>
                        </div>
                        <div className="text-sm text-gray-400 font-mono mb-2">
                          Certificate ID: {results.proofCertificate.certificateId}
                        </div>
                        <div className="text-sm text-gray-400 font-mono mb-3">
                          Contract Hash: {results.proofCertificate.contractHash}
                        </div>
                        <div className="text-sm text-gray-400">
                          <strong className="text-gray-300">Proven Properties:</strong>
                          <ul className="mt-2 space-y-1">
                            {results.proofCertificate.provenProperties.map((prop, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-green-400">✓</span>
                                {prop}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Verification Time */}
                    {results.verificationTime && (
                      <div className="text-right text-xs text-gray-500 font-mono">
                        Verification completed in {results.verificationTime}ms
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-80 text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-red-400">{results.error || 'Unknown error'}</p>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-80 text-gray-500 text-center">
                  <div className="text-4xl mb-4 opacity-50">🔐</div>
                  <p>Paste your Solidity code and click<br /><strong className="text-gray-300">Verify Contract</strong> to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>
            SafeContract uses the{' '}
            <a href="https://github.com/Z3Prover/z3" target="_blank" rel="noopener noreferrer" className="text-green-400 hover:underline">
              Z3 SMT Solver
            </a>{' '}
            for formal verification.
          </p>
          <p className="mt-1">Mathematical proofs guarantee properties hold for ALL possible inputs.</p>
          <p className="mt-4">
            <Link href="/tools" className="text-blue-400 hover:underline">
              ← Back to Tools
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
