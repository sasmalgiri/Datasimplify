'use client';

import { useState } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import HomepageTemplateFinder from '@/components/HomepageTemplateFinder';
import QuickActionsCard from '@/components/QuickActionsCard';
import StickySignupButton from '@/components/StickySignupButton';
import { isFeatureEnabled } from '@/lib/featureFlags';

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

      {/* Sticky Sign Up Button - appears on scroll */}
      <StickySignupButton />

      {/* Hero Section */}
      <section className="pt-4 pb-4 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Text - Centered at top */}
          <div className="text-center mb-4">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                Refreshable Crypto Reports in Excel
              </span>
              {' '}
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                (Templates + Report Wizard)
              </span>
            </h1>

            <p className="text-sm md:text-base text-gray-400 mb-3 max-w-2xl mx-auto">
              Download Excel templates with CRK formulas. Customize coins & timeframes, connect your API key (BYOK), refresh.
              <span className="text-white font-semibold"> Live crypto data at your fingertips.</span>
            </p>

            <div className="flex flex-row gap-3 justify-center mb-3">
              <Link
                href="/templates"
                className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-emerald-500/25"
              >
                Download Excel Templates
              </Link>
              <Link
                href="/compare"
                className="px-5 py-2 bg-white/10 border border-white/20 rounded-lg font-semibold text-sm hover:bg-white/20 transition"
              >
                Compare Coins
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-gray-400 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-green-400">✓</span>
                <span>CRK formulas + BYOK</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400">✓</span>
                <span>Customizable templates</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-400">✓</span>
                <span>Free to start</span>
              </div>
            </div>
          </div>

          {/* Main Feature Cards - Template Finder + Quick Actions */}
          <div className="grid md:grid-cols-2 gap-4">
            {/* Template Finder - Smart search for finding the right template */}
            <HomepageTemplateFinder />

            {/* Quick Actions - Fast navigation + optional SafeContract */}
            <div className="flex flex-col gap-4">
              {isFeatureEnabled('smartContractVerifier') && <SafeContractPreview />}
              <QuickActionsCard className={isFeatureEnabled('smartContractVerifier') ? 'h-auto' : ''} />
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-6 border-y border-gray-800 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl md:text-3xl font-bold text-emerald-400">8</div>
              <div className="text-gray-400 text-xs">Report Kits</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-purple-400">36</div>
              <div className="text-gray-400 text-xs">CRK Functions</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-green-400">✓</div>
              <div className="text-gray-400 text-xs">Contract Verify</div>
            </div>
            <div>
              <div className="text-2xl md:text-3xl font-bold text-yellow-400">BYOK</div>
              <div className="text-gray-400 text-xs">Your API Keys</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold mb-2">
              The <span className="text-red-400">paywalled data</span> problem
            </h2>
            <p className="text-sm text-gray-400">Many crypto datasets are behind expensive subscriptions.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 max-w-4xl mx-auto">
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
              <div className="text-red-400 text-xs font-medium mb-2">❌ THE OLD WAY</div>
              <ul className="space-y-1 text-gray-300 text-xs">
                <li className="flex items-start gap-1">
                  <span className="text-red-400">✗</span>
                  <span>High-cost subscriptions, locked exports</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-red-400">✗</span>
                  <span>Limited Excel portability</span>
                </li>
              </ul>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-4 relative">
              <div className="absolute top-2 right-2 bg-green-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">BYOK</div>
              <div className="text-green-400 text-xs font-medium mb-2">✓ THE CRK WAY</div>
              <ul className="space-y-1 text-gray-300 text-xs">
                <li className="flex items-start gap-1">
                  <span className="text-green-400">✓</span>
                  <span>Excel templates with BYOK formulas</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-green-400">✓</span>
                  <span>Coin comparison + What If calculator</span>
                </li>
                <li className="flex items-start gap-1">
                  <span className="text-green-400">✓</span>
                  <span>Smart Contract verification</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-8 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-xl md:text-2xl font-bold mb-1">
              Four <span className="text-emerald-400">Focused Tools</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { icon: '📋', title: 'Excel Templates', desc: '8 report kits with CRK formulas + BYOK', href: '/templates' },
              { icon: '⚖️', title: 'Coin Compare', desc: 'Side-by-side + What If calculator', href: '/compare' },
              { icon: '🔐', title: 'Contract Verify', desc: 'Sourcify + Z3 formal checks', href: '/smart-contract-verifier' },
              { icon: '📚', title: 'Learn', desc: 'Academy guides + glossary', href: '/learn' },
            ].map((f, i) => (
              <a key={i} href={f.href} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-emerald-500/50 transition group">
                <div className="text-xl mb-1">{f.icon}</div>
                <h3 className="text-sm font-bold mb-1 group-hover:text-emerald-400 transition">{f.title}</h3>
                <p className="text-gray-400 text-xs">{f.desc}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      {isFeatureEnabled('pricing') ? (
      <section id="pricing" className="py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-4">
            <h2 className="text-xl md:text-2xl font-bold mb-1">
              Simple <span className="text-blue-400">Pricing</span>
            </h2>
          </div>

          <div className="grid grid-cols-3 gap-3 max-w-3xl mx-auto">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="text-xs text-gray-400">Free</div>
              <div className="text-2xl font-bold mb-2">$0</div>
              <ul className="space-y-1 text-xs text-gray-300 mb-3">
                <li>✓ Basic templates</li>
                <li>✓ Compare + Learn</li>
              </ul>
              <Link href="/signup" className="block text-center py-1.5 border border-gray-600 rounded-lg hover:bg-gray-700 text-xs">
                Get Started
              </Link>
            </div>

            <div className="bg-gradient-to-b from-blue-500/20 to-purple-500/20 border-2 border-blue-500 rounded-xl p-4 relative">
              <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 bg-blue-500 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                SOON
              </div>
              <div className="text-xs text-blue-400">Pro</div>
              <div className="text-2xl font-bold mb-2">$29<span className="text-xs text-gray-400">/mo</span></div>
              <ul className="space-y-1 text-xs text-gray-300 mb-3">
                <li>✓ 100 downloads/mo</li>
                <li>✓ All categories</li>
              </ul>
              <span className="block text-center py-1.5 bg-gray-600 rounded-lg opacity-60 text-xs">Notify Me</span>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4">
              <div className="text-xs text-gray-400">Premium</div>
              <div className="text-2xl font-bold mb-2">$79<span className="text-xs text-gray-400">/mo</span></div>
              <ul className="space-y-1 text-xs text-gray-300 mb-3">
                <li>✓ Unlimited</li>
                <li>✓ White-label</li>
              </ul>
              <Link href="/signup?plan=premium" className="block text-center py-1.5 border border-gray-600 rounded-lg hover:bg-gray-700 text-xs">
                Notify Me
              </Link>
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {/* CTA */}
      <section className="py-6 px-4 bg-gradient-to-r from-emerald-600/20 to-blue-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-2">Ready to Build Better Reports?</h2>
          <p className="text-sm text-gray-400 mb-3">Download Excel templates with BYOK formulas.</p>
          <Link
            href="/templates"
            className="inline-block px-5 py-2 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-lg font-semibold text-sm shadow-lg"
          >
            Browse Report Kits
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-4 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-2 mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span className="font-bold text-sm">CryptoReportKit</span>
            </div>
            <div className="flex flex-wrap justify-center gap-3 text-gray-400 text-xs">
              <Link href="/privacy" className="hover:text-white">Privacy</Link>
              <Link href="/terms" className="hover:text-white">Terms</Link>
              <Link href="/refund" className="hover:text-white">Refund</Link>
              <Link href="/contact" className="hover:text-white">Contact</Link>
            </div>
          </div>
          <p className="text-gray-600 text-[10px] text-center">
            © 2026 CryptoReportKit. Research/education tool. Not financial advice. DYOR.
          </p>
        </div>
      </footer>
    </div>
  );
}
