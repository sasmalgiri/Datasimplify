'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';

// Verification types
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

export default function LandingPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<VerificationResponse | null>(null);

  const loadExample = async () => {
    try {
      const res = await fetch('/api/smart-contract/example');
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
      const res = await fetch('/api/smart-contract/verify', {
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
      {/* Navigation */}
      <FreeNavbar />

      {/* SafeContract Hero Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center text-gray-900 font-bold text-xl">
                SC
              </div>
              <h1 className="text-3xl md:text-4xl font-bold">
                Safe<span className="text-green-400">Contract</span>
              </h1>
              <span className="px-3 py-1 bg-green-500/20 border border-green-500 rounded-full text-green-400 text-sm font-semibold">
                Z3 Powered
              </span>
            </div>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              Formal Verification for Smart Contracts. Detect vulnerabilities before deployment.
            </p>
            {/* Stats */}
            <div className="flex justify-center gap-8 mt-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 font-mono">Z3</div>
                <div className="text-gray-500 text-xs">SMT Solver</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 font-mono">&lt;30s</div>
                <div className="text-gray-500 text-xs">Verification</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 font-mono">100%</div>
                <div className="text-gray-500 text-xs">Math Proof</div>
              </div>
            </div>
          </div>

          {/* Main Grid - Code + Results */}
          <div className="grid lg:grid-cols-2 gap-4">
            {/* Code Input Panel */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Solidity Code</span>
                <div className="flex gap-2">
                  <button type="button" onClick={loadExample} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition">
                    Load Example
                  </button>
                  <button type="button" onClick={clearCode} className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-xs text-gray-300 transition">
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
                className="w-full h-64 p-4 bg-transparent text-gray-200 font-mono text-sm resize-none outline-none"
              />
              <div className="flex justify-end px-4 py-2 border-t border-gray-700">
                <button
                  type="button"
                  onClick={verify}
                  disabled={loading}
                  className="px-5 py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-lg transition flex items-center gap-2"
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
              <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
                <span className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Results</span>
                {results?.success && results.summary && (
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${results.summary.vulnerable > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {results.summary.vulnerable > 0 ? 'Issues Found' : 'Verified Safe'}
                  </span>
                )}
              </div>
              <div className="p-4 h-64 overflow-y-auto">
                {loading ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="w-10 h-10 border-3 border-gray-700 border-t-green-500 rounded-full animate-spin" />
                    <p className="mt-3 text-gray-400 text-sm">Running verification...</p>
                  </div>
                ) : results ? (
                  results.success ? (
                    <div className="space-y-3">
                      {/* Security Score */}
                      {results.securityScore !== undefined && (
                        <div className="flex items-center gap-3 p-3 bg-gray-900/50 rounded-lg">
                          <div className={`w-14 h-14 rounded-full border-2 flex items-center justify-center text-lg font-bold font-mono ${getScoreClass(results.securityScore)}`}>
                            {results.securityScore}%
                          </div>
                          <div>
                            <h3 className="font-bold text-sm">{results.overallStatus}</h3>
                            <p className="text-gray-400 text-xs">
                              {results.summary?.verified}/{results.summary?.totalChecks} verified
                            </p>
                          </div>
                        </div>
                      )}
                      {/* Check Results */}
                      {results.results && results.results.slice(0, 4).map((check, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-gray-900/50 rounded-lg">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${getStatusClass(check.status)}`}>
                            {getStatusIcon(check.status)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-medium truncate">{check.description}</div>
                            <div className="text-xs text-gray-500">{check.function}()</div>
                          </div>
                          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${getStatusClass(check.status)}`}>
                            {check.status}
                          </span>
                        </div>
                      ))}
                      {results.results && results.results.length > 4 && (
                        <Link href="/tools/verify" className="block text-center text-green-400 text-sm hover:underline">
                          View all {results.results.length} checks →
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="text-3xl mb-2">⚠️</div>
                      <p className="text-red-400 text-sm">{results.error}</p>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500 text-center">
                    <div className="text-3xl mb-2 opacity-50">🔐</div>
                    <p className="text-sm">Paste code and click <strong className="text-gray-300">Verify Contract</strong></p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-gray-800 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold text-blue-400 mb-2">$50M+</div>
              <div className="text-gray-400">Data Analyzed Daily</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-purple-400 mb-2">10,000+</div>
              <div className="text-gray-400">Tokens Tracked</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-green-400 mb-2">95%</div>
              <div className="text-gray-400">Cost Savings</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold text-yellow-400 mb-2">24/7</div>
              <div className="text-gray-400">Real-Time Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              The <span className="text-red-400">$32,000/year</span> Problem
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Professional crypto data is locked behind enterprise paywalls. Until now.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
              <div className="text-red-400 text-sm font-medium mb-4">❌ THE OLD WAY</div>
              <h3 className="text-2xl font-bold mb-6">Enterprise Platforms</h3>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Financial Terminals: <strong className="text-red-400">$24,000/year</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Whale Analytics Pro: <strong className="text-red-400">$1,299/month</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>On-Chain Data Advanced: <strong className="text-red-400">$799/month</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Complex interfaces requiring training</span>
                </li>
              </ul>
              <div className="mt-8 text-center">
                <div className="text-4xl font-bold text-red-400">$800-$2,000</div>
                <div className="text-gray-500">per month</div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-8 relative">
              <div className="absolute top-4 right-4 bg-green-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                SAVE 95%
              </div>
              <div className="text-green-400 text-sm font-medium mb-4">✓ THE DATASIMPLIFY WAY</div>
              <h3 className="text-2xl font-bold mb-6">All-In-One Platform</h3>
              <ul className="space-y-4 text-gray-300">
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Professional on-chain analytics</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Real-time whale tracking</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>AI assistant that explains everything</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Beginner-friendly with tutorials</span>
                </li>
              </ul>
              <div className="mt-8 text-center">
                <div className="text-4xl font-bold text-green-400">$19-$49</div>
                <div className="text-gray-500">per month</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              15+ Professional Tools, <span className="text-blue-400">One Platform</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🤖', title: 'AI Assistant', desc: 'Ask anything about crypto in plain English.' },
              { icon: '🗺️', title: 'Market Map', desc: 'Visualize the entire crypto market.' },
              { icon: '😱', title: 'Fear & Greed', desc: 'Know when to buy and sell.' },
              { icon: '🐋', title: 'Whale Tracker', desc: 'See what big players are doing.' },
              { icon: '📊', title: 'Technical Analysis', desc: '12 indicators with explanations.' },
              { icon: '⛓️', title: 'On-Chain Metrics', desc: 'MVRV, SOPR, HODL Waves.' },
              { icon: '💰', title: 'DeFi Dashboard', desc: 'Track TVL and yields.' },
              { icon: '🔍', title: 'Token Screener', desc: 'Filter 10,000+ tokens.' },
              { icon: '📈', title: 'ETF Tracker', desc: 'Bitcoin ETF flows.' },
              { icon: '⚡', title: 'Price Alerts', desc: 'Get notified instantly.' },
              { icon: '📚', title: 'Crypto Academy', desc: '4 courses, 20 lessons.' },
              { icon: '🧪', title: 'Backtester', desc: 'Test your strategies.' },
              { icon: '🔐', title: 'Contract Verifier', desc: 'Smart contract security analysis.' },
            ].map((f, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 hover:border-blue-500/50 transition">
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold mb-2">{f.title}</h3>
                <p className="text-gray-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Simple <span className="text-blue-400">Pricing</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="text-sm text-gray-400 mb-2">Free</div>
              <div className="text-4xl font-bold mb-4">$0</div>
              <ul className="space-y-3 text-sm text-gray-300 mb-6">
                <li>✓ 5 downloads/month</li>
                <li>✓ Basic data</li>
                <li>✓ Crypto Academy</li>
              </ul>
              <Link href="/signup" className="block text-center py-3 border border-gray-600 rounded-lg hover:bg-gray-700">
                Get Started
              </Link>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="text-sm text-gray-400 mb-2">Starter</div>
              <div className="text-4xl font-bold mb-4">$19<span className="text-lg text-gray-400">/mo</span></div>
              <ul className="space-y-3 text-sm text-gray-300 mb-6">
                <li>✓ 50 downloads</li>
                <li>✓ Technical indicators</li>
                <li>✓ Token screener</li>
              </ul>
              <Link href="/signup?plan=starter" className="block text-center py-3 bg-gray-700 rounded-lg hover:bg-gray-600">
                Start Trial
              </Link>
            </div>

            <div className="bg-gradient-to-b from-blue-500/20 to-purple-500/20 border-2 border-blue-500 rounded-2xl p-6 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
              <div className="text-sm text-blue-400 mb-2">Pro</div>
              <div className="text-4xl font-bold mb-4">$49<span className="text-lg text-gray-400">/mo</span></div>
              <ul className="space-y-3 text-sm text-gray-300 mb-6">
                <li>✓ Unlimited downloads</li>
                <li>✓ AI Assistant</li>
                <li>✓ Whale tracking</li>
                <li>✓ On-chain metrics</li>
              </ul>
              <Link href="/signup?plan=pro" className="block text-center py-3 bg-blue-500 rounded-lg hover:bg-blue-600 font-semibold">
                Start Trial
              </Link>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
              <div className="text-sm text-gray-400 mb-2">Business</div>
              <div className="text-4xl font-bold mb-4">$99<span className="text-lg text-gray-400">/mo</span></div>
              <ul className="space-y-3 text-sm text-gray-300 mb-6">
                <li>✓ Everything in Pro</li>
                <li>✓ Price alerts</li>
                <li>✓ API access</li>
              </ul>
              <Link href="/signup?plan=business" className="block text-center py-3 border border-gray-600 rounded-lg hover:bg-gray-700">
                Start Trial
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-5xl font-bold mb-6">
            Ready to Invest Smarter?
          </h2>
          <p className="text-xl text-gray-400 mb-8">
            Join 500+ investors who stopped overpaying for data.
          </p>
          <Link
            href="/signup"
            className="inline-block px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold text-lg shadow-lg"
          >
            Start Free Trial - No Credit Card Required
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-12 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="font-bold">DataSimplify</span>
          </div>
          <div className="text-gray-400 text-sm">
            © 2024 DataSimplify. All rights reserved.
          </div>
          <div className="flex gap-4 text-gray-400">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/support" className="hover:text-white">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
