'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { isFeatureEnabled, isPaddleSafe } from '@/lib/featureFlags';

// Verification types
interface SourcifyVerificationResponse {
  success: boolean;
  error?: string;
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

// Compact SafeContract Component
function SafeContractPreview() {
  const [chainId, setChainId] = useState('1');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SourcifyVerificationResponse | null>(null);

  const verify = async () => {
    if (!address.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/smart-contract/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chainId: Number(chainId),
          address: address.trim(),
        })
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, error: 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-900/30 to-emerald-800/20 backdrop-blur-sm rounded-2xl border border-green-500/30 p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center text-gray-900 font-bold text-sm">
            SC
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">SafeContract</h3>
            <p className="text-gray-400 text-xs">Smart Contract Verifier</p>
          </div>
        </div>
        <Link href="/smart-contract-verifier" className="text-green-400 text-xs hover:text-green-300 transition">
          Full Page →
        </Link>
      </div>

      {/* Inputs */}
      <div className="mb-3">
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-1">
            <span className="text-gray-500 text-xs">Chain ID</span>
            <input
              value={chainId}
              onChange={(e) => setChainId(e.target.value)}
              placeholder="1"
              className="w-full mt-1 px-2 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 text-xs outline-none focus:border-green-500/50"
            />
          </div>
          <div className="col-span-2">
            <span className="text-gray-500 text-xs">Contract Address</span>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="0x..."
              className="w-full mt-1 px-2 py-1.5 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 font-mono text-xs outline-none focus:border-green-500/50"
            />
          </div>
        </div>
      </div>

      {/* Verify Button */}
      <button
        type="button"
        onClick={verify}
        disabled={loading || !address.trim()}
        className="w-full py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-lg transition text-sm flex items-center justify-center gap-2 mb-3"
      >
        {loading ? (
          <>
            <span className="w-3 h-3 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
            Checking...
          </>
        ) : (
          <>🔍 Check Sourcify</>
        )}
      </button>

      {/* Results */}
      <div className="bg-gray-900/50 rounded-lg p-3 min-h-[60px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-xs">Checking Sourcify...</p>
          </div>
        ) : result ? (
          result.success ? (
            <div className="space-y-1">
              <p className={`text-sm font-semibold ${result.verified ? 'text-green-400' : 'text-gray-200'}`}>
                {result.verified ? 'Verified on Sourcify' : 'Not verified on Sourcify'}
              </p>
              <p className="text-gray-400 text-xs">
                Source: {result.source}{result.stale ? ' (stale)' : ''}
              </p>
              {result.contractName && (
                <p className="text-gray-300 text-xs font-mono truncate">{result.contractName}</p>
              )}
            </div>
          ) : (
            <p className="text-red-400 text-xs text-center">{result.error}</p>
          )
        ) : (
          <div className="text-center text-gray-500 text-xs">
            <span className="text-lg">🔐</span>
            <p>Enter address & check</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navigation */}
      <FreeNavbar />

      {/* Hero Section */}
      <section className="pt-4 pb-4 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Text - Centered at top */}
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                CRYPTO ANALYTICS & EXCEL TEMPLATES
              </span>
              {' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                FOR EDUCATIONAL VISUALIZATION
              </span>
            </h1>

            <p className="text-sm md:text-base text-gray-400 mb-3 max-w-2xl mx-auto">
              Excel downloads powered by CryptoSheets for live data visualization.
              <span className="text-white font-semibold"> Educational analytics tools for crypto enthusiasts.</span>
            </p>

            <div className="flex flex-row gap-3 justify-center mb-3">
              <Link
                href="/templates"
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-blue-500/25"
              >
                Download Excel →
              </Link>
              <Link
                href="/charts"
                className="px-5 py-2 bg-white/10 border border-white/20 rounded-lg font-semibold text-sm hover:bg-white/20 transition"
              >
                View Charts
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-gray-400 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-green-400">✓</span>
                <span>CryptoSheets formulas</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400">✓</span>
                <span>Educational visualization</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-400">✓</span>
                <span>No embedded data</span>
              </div>
            </div>
          </div>

          {/* Highlight */}
          <div className="grid md:grid-cols-2 gap-4">
            {isFeatureEnabled('smartContractVerifier') && <SafeContractPreview />}
            <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 h-full">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-bold text-white">Research Workspace</h3>
                  <p className="text-gray-400 text-xs">Charts, comparisons, and downloads</p>
                </div>
                <Link href="/research" className="text-blue-400 text-xs hover:text-blue-300 transition">
                  Open →
                </Link>
              </div>
              <p className="text-gray-300 text-sm">
                Education-first analytics and visualization. No predictions, signals, or trade calls.
              </p>
              <div className="mt-4 flex gap-2">
                <Link href="/templates" className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm hover:bg-white/20 transition">
                  Download
                </Link>
                <Link href="/charts" className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm hover:bg-white/20 transition">
                  Charts
                </Link>
                <Link href="/compare" className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-sm hover:bg-white/20 transition">
                  Compare
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-gray-800 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">Unavailable</div>
              <div className="text-gray-400 text-sm">Data Analyzed Daily</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-1">Unavailable</div>
              <div className="text-gray-400 text-sm">Tokens Tracked</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-1">—</div>
              <div className="text-gray-400 text-sm">Affordable Pricing</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1">—</div>
              <div className="text-gray-400 text-sm">Live Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              The <span className="text-red-400">paywalled data</span> problem
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Many crypto datasets are packaged behind expensive subscriptions.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
              <div className="text-red-400 text-sm font-medium mb-3">❌ THE OLD WAY</div>
              <h3 className="text-xl font-bold mb-4">Enterprise Platforms</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span>High-cost subscriptions and locked exports</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span>Limited portability into Excel workflows</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 relative">
              <div className="absolute top-3 right-3 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-full">SAVE</div>
              <div className="text-green-400 text-sm font-medium mb-3">✓ THE DATASIMPLIFY WAY</div>
              <h3 className="text-xl font-bold mb-4">All-In-One Platform</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Market + on-chain analytics (availability varies)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Research workspace (charts, comparisons, templates)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Smart Contract verification tool</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              Built for <span className="text-blue-400">analytics + research</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: '📋', title: 'Excel Downloads', desc: 'Powered by CryptoSheets for live data.' },
              { icon: '📊', title: 'Charts', desc: 'Explore charts and visual analytics.' },
              { icon: '⚖️', title: 'Comparisons', desc: 'Side-by-side metrics with explanations.' },
              { icon: '📈', title: 'Market Analytics', desc: 'Rankings, movers, and market stats.' },
              { icon: '⛓️', title: 'On-Chain Analytics', desc: 'Network activity metrics (availability varies).' },
              { icon: '😱', title: 'Fear & Greed', desc: 'Sentiment context with history.' },
              { icon: '🔐', title: 'Contract Verification', desc: 'Check verified status on Sourcify.' },
              { icon: '📚', title: 'Academy + Glossary', desc: 'Educational explanations of metrics.' },
            ].map((f, i) => (
              <div key={i} className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-blue-500/50 transition">
                <div className="text-3xl mb-2">{f.icon}</div>
                <h3 className="text-lg font-bold mb-1">{f.title}</h3>
                <p className="text-gray-400 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      {isFeatureEnabled('pricing') ? (
      <section id="pricing" className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              Simple <span className="text-blue-400">Pricing</span>
            </h2>
            <p className="text-gray-400 text-sm">
              Analytics tools for research and education. Not investment advice.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
              <div className="text-sm text-gray-400 mb-1">Free</div>
              <div className="text-3xl font-bold mb-3">$0</div>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li>✓ Basic templates</li>
                <li>✓ Charts & comparisons</li>
                <li>✓ Crypto Academy</li>
              </ul>
              <Link href="/signup" className="block text-center py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-sm">
                Get Started
              </Link>
            </div>

            <div className="bg-gradient-to-b from-blue-500/20 to-purple-500/20 border-2 border-blue-500 rounded-2xl p-5 relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-xs font-bold px-2 py-0.5 rounded-full">
                POPULAR
              </div>
              <div className="text-sm text-blue-400 mb-1">Pro</div>
              <div className="text-3xl font-bold mb-3">$29<span className="text-sm text-gray-400">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li>✓ 100 template downloads/mo</li>
                <li>✓ All template categories</li>
                <li>✓ Custom column selection</li>
                <li>✓ Email support</li>
              </ul>
              <Link href="/signup?plan=pro" className="block text-center py-2 bg-blue-500 rounded-lg hover:bg-blue-600 font-semibold text-sm">
                Start Trial
              </Link>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
              <div className="text-sm text-gray-400 mb-1">Premium</div>
              <div className="text-3xl font-bold mb-3">$79<span className="text-sm text-gray-400">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li>✓ Unlimited downloads</li>
                <li>✓ All Pro features</li>
                <li>✓ White-label templates</li>
                <li>✓ Priority support</li>
              </ul>
              <Link href="/signup?plan=premium" className="block text-center py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-sm">
                Start Trial
              </Link>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            Ready to Research Smarter?
          </h2>
          <p className="text-lg text-gray-400 mb-6">
            Start with downloads, charts, and comparisons.
          </p>
          <Link
            href="/research"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold shadow-lg"
          >
            Open Research Workspace
          </Link>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-6 px-4 bg-gray-900/50 border-t border-gray-800">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-gray-500 text-xs">
            <strong>Disclaimer:</strong> DataSimplify is a research and comparison tool for education purposes only.
            We do not provide financial advice, trading signals, or investment recommendations.
            Cryptocurrency investments are risky. Always do your own research (DYOR).
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">📊</span>
            <span className="font-bold">DataSimplify</span>
          </div>
          <div className="text-gray-400 text-sm">
            © 2024 DataSimplify. All rights reserved.
          </div>
          <div className="flex flex-wrap justify-center gap-4 text-gray-400 text-sm">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/refund" className="hover:text-white">Refund Policy</Link>
            <Link href="/contact" className="hover:text-white">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
