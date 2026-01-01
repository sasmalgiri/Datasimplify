'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';

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
  proofCertificate?: {
    certificateId: string;
    contractHash: string;
    provenProperties: string[];
  };
}

const EXAMPLE_CODE = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SimpleToken {
    mapping(address => uint256) public balances;
    uint256 public totalSupply;

    event Transfer(address indexed from, address indexed to, uint256 amount);

    function mint(uint256 amount) public {
        balances[msg.sender] += amount;
        totalSupply += amount;
    }

    function transfer(address to, uint256 amount) public {
        require(balances[msg.sender] >= amount, "Insufficient balance");
        require(to != address(0), "Invalid recipient");

        balances[msg.sender] -= amount;
        balances[to] += amount;

        emit Transfer(msg.sender, to, amount);
    }

    function balanceOf(address account) public view returns (uint256) {
        return balances[account];
    }
}`;

export default function SmartContractVerifierPage() {
  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationResponse | null>(null);

  const loadExample = () => {
    setCode(EXAMPLE_CODE);
    setResult(null);
  };

  const clearCode = () => {
    setCode('');
    setResult(null);
  };

  const verify = async () => {
    if (!code.trim()) {
      alert('Please enter some Solidity code');
      return;
    }

    setIsVerifying(true);
    setResult(null);

    try {
      const res = await fetch('/api/smart-contract/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code })
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

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'border-emerald-500 bg-emerald-500/20 text-emerald-400';
    if (score >= 50) return 'border-yellow-500 bg-yellow-500/20 text-yellow-400';
    return 'border-red-500 bg-red-500/20 text-red-400';
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
              Z3 Powered
            </span>
          </div>

          <h2 className="text-4xl font-bold text-white mb-4">
            Formal Verification for <span className="text-emerald-400">Smart Contracts</span>
          </h2>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-8">
            Mathematical proofs, not just pattern matching. Our Z3-powered engine proves your contract is secure for ALL possible inputs.
          </p>

          <div className="flex justify-center gap-12">
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 font-mono">Z3</div>
              <div className="text-xs text-gray-500">SMT Solver</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 font-mono">&lt;30s</div>
              <div className="text-xs text-gray-500">Verification Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400 font-mono">100%</div>
              <div className="text-xs text-gray-500">Mathematical Proof</div>
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
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Solidity Code</span>
              <div className="flex gap-2">
                <button
                  onClick={loadExample}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition"
                >
                  Load Example
                </button>
                <button
                  onClick={clearCode}
                  className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition"
                >
                  Clear
                </button>
              </div>
            </div>

            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="// Paste your Solidity code here...

pragma solidity ^0.8.0;

contract MyContract {
    // Your code
}"
              className="w-full h-96 p-4 bg-transparent text-gray-100 font-mono text-sm resize-none focus:outline-none"
              spellCheck={false}
            />

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
                    Verify Contract
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Results Panel */}
          <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Verification Results</span>
              {result?.success && result.summary && (
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                  result.summary.vulnerable > 0
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-emerald-500/20 text-emerald-400'
                }`}>
                  {result.summary.vulnerable > 0 ? 'Issues Found' : 'Verified Safe'}
                </span>
              )}
            </div>

            <div className="p-4 min-h-96">
              {isVerifying ? (
                <div className="h-full flex flex-col items-center justify-center">
                  <div className="w-12 h-12 border-3 border-gray-700 border-t-emerald-500 rounded-full animate-spin mb-4" />
                  <p className="text-gray-400">Running Z3 formal verification...</p>
                </div>
              ) : result ? (
                result.success ? (
                  <div className="space-y-4">
                    {/* Security Score */}
                    {result.securityScore !== undefined && (
                      <div className={`flex items-center gap-4 p-4 rounded-lg border ${getScoreClass(result.securityScore)}`}>
                        <div className="w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl font-bold font-mono">
                          {result.securityScore}%
                        </div>
                        <div>
                          <h3 className="font-semibold text-white">{result.overallStatus}</h3>
                          <p className="text-sm text-gray-400">
                            {result.summary?.verified} of {result.summary?.totalChecks} properties verified
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Summary Cards */}
                    {result.summary && (
                      <div className="grid grid-cols-4 gap-2">
                        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold font-mono text-white">{result.summary.totalChecks}</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold font-mono text-emerald-400">{result.summary.verified}</div>
                          <div className="text-xs text-gray-500">Verified</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold font-mono text-red-400">{result.summary.vulnerable}</div>
                          <div className="text-xs text-gray-500">Issues</div>
                        </div>
                        <div className="bg-gray-700/50 rounded-lg p-3 text-center">
                          <div className="text-xl font-bold font-mono text-yellow-400">{result.summary.errors}</div>
                          <div className="text-xs text-gray-500">Errors</div>
                        </div>
                      </div>
                    )}

                    {/* Check Results */}
                    {result.results && result.results.length > 0 && (
                      <div className="space-y-2">
                        {result.results.map((check, idx) => (
                          <div key={idx} className="bg-gray-700/30 rounded-lg p-3 flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                              check.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                              check.status === 'vulnerable' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {check.status === 'verified' ? '✓' : check.status === 'vulnerable' ? '✗' : '!'}
                            </div>
                            <div className="flex-1">
                              <div className="font-medium text-white text-sm">{check.description}</div>
                              <div className="text-xs text-gray-500">
                                Function: {check.function}() | Type: {check.type}
                              </div>
                              {check.details && (
                                <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-gray-400 font-mono">
                                  {check.details}
                                </div>
                              )}
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              check.status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                              check.status === 'vulnerable' ? 'bg-red-500/20 text-red-400' :
                              'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {check.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Proof Certificate */}
                    {result.proofCertificate && (
                      <div className="bg-emerald-950/30 border border-emerald-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xl">🏆</span>
                          <h4 className="font-semibold text-emerald-400">Formal Verification Certificate</h4>
                        </div>
                        <div className="text-xs text-gray-400 font-mono mb-2">
                          Certificate ID: {result.proofCertificate.certificateId}
                        </div>
                        <div className="text-xs text-gray-400 font-mono mb-3">
                          Contract Hash: {result.proofCertificate.contractHash}
                        </div>
                        <div className="text-sm text-gray-300">
                          <strong>Proven Properties:</strong>
                          <ul className="mt-1 space-y-1">
                            {result.proofCertificate.provenProperties.map((prop, idx) => (
                              <li key={idx} className="flex items-center gap-2">
                                <span className="text-emerald-400">✓</span>
                                {prop}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}

                    {/* Verification Time */}
                    {result.verificationTime && (
                      <div className="text-right text-xs text-gray-500 font-mono">
                        Verification completed in {result.verificationTime}ms
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center">
                    <div className="text-4xl mb-4">⚠️</div>
                    <p className="text-gray-400">{result.error || 'Unknown error'}</p>
                  </div>
                )
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="text-4xl mb-4 opacity-50">🔐</div>
                  <p className="text-gray-500">
                    Paste your Solidity code and click<br />
                    <strong className="text-gray-400">Verify Contract</strong> to get started
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>
            SafeContract uses the{' '}
            <a href="https://github.com/Z3Prover/z3" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">
              Z3 SMT Solver
            </a>{' '}
            for formal verification.
          </p>
          <p>Mathematical proofs guarantee properties hold for ALL possible inputs.</p>
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
