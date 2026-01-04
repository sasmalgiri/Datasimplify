'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { isFeatureEnabled } from '@/lib/featureFlags';

// Progress bar component using refs
function ProgressSegment({ percentage, colorClass }: { percentage: number; colorClass: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.width = `${percentage}%`;
    }
  }, [percentage]);
  return <div ref={ref} className={`${colorClass} transition-all duration-500`} />;
}

// Community Stats Interface
interface CommunityStats {
  total_predictions: number;
  active_predictors: number;
  bullish_percent: number;
  bearish_percent: number;
  neutral_percent: number;
  avg_accuracy: number;
}

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

// Community Preview Component
function CommunityPreview() {
  const [stats, setStats] = useState<CommunityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/community?action=stats');
        const result = await response.json();
        if (result.success && result.data) {
          setStats(result.data);
        } else {
          setStats(null);
          setLoadError(result?.error || 'Community stats unavailable');
        }
      } catch (error) {
        console.error('Error fetching community stats:', error);
        setStats(null);
        setLoadError('Community stats unavailable');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const bullish = typeof stats?.bullish_percent === 'number' ? stats.bullish_percent : null;
  const neutral = typeof stats?.neutral_percent === 'number' ? stats.neutral_percent : null;
  const bearish = typeof stats?.bearish_percent === 'number' ? stats.bearish_percent : null;

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-sm">👥</span>
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Community</h3>
            <p className="text-gray-400 text-xs">Live sentiment</p>
          </div>
        </div>
        <Link href="/community" className="text-emerald-400 text-xs hover:text-emerald-300 transition">
          View All →
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700">
          <p className="text-gray-400 text-xs">Predictions</p>
          <p className="text-lg font-bold text-white">{loading ? '...' : (typeof stats?.total_predictions === 'number' ? stats.total_predictions : 'Unavailable')}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700">
          <p className="text-gray-400 text-xs">Accuracy</p>
          <p className="text-lg font-bold text-emerald-400">{loading ? '...' : (typeof stats?.avg_accuracy === 'number' ? `${stats.avg_accuracy}%` : 'Unavailable')}</p>
        </div>
      </div>

      {/* Sentiment Bar */}
      <div className="mb-3">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-700">
          <ProgressSegment percentage={bullish ?? 0} colorClass="bg-emerald-500" />
          <ProgressSegment percentage={neutral ?? 0} colorClass="bg-yellow-500" />
          <ProgressSegment percentage={bearish ?? 0} colorClass="bg-red-500" />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-emerald-400">{bullish === null ? 'Unavailable' : `${bullish}% Bull`}</span>
          <span className="text-yellow-400">{neutral === null ? 'Unavailable' : `${neutral}% Neutral`}</span>
          <span className="text-red-400">{bearish === null ? 'Unavailable' : `${bearish}% Bear`}</span>
        </div>
        {!loading && loadError && (
          <p className="text-gray-500 text-[10px] mt-1">{loadError}</p>
        )}
      </div>

      {/* CTA */}
      <Link
        href="/community"
        className="block w-full py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold text-center transition text-sm"
      >
        + Submit Prediction
      </Link>
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
                DOWNLOAD CRYPTO DATA TO EXCEL & CSV
              </span>
              {' '}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                (XLSX, CSV, JSON) — REFRESHABLE VIA POWER QUERY
              </span>
            </h1>

            <p className="text-sm md:text-base text-gray-400 mb-3 max-w-2xl mx-auto">
              Pick the fields you need and export market, on-chain, sentiment, derivatives, and chart-ready datasets.
              <span className="text-white font-semibold"> Your Excel stays up to date with Power Query refresh.</span>
            </p>

            <div className="flex flex-row gap-3 justify-center mb-3">
              <Link
                href="/download"
                className="px-5 py-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg font-semibold text-sm hover:opacity-90 transition shadow-lg shadow-blue-500/25"
              >
                Download Excel/CSV →
              </Link>
              <Link
                href="/charts"
                className="px-5 py-2 bg-white/10 border border-white/20 rounded-lg font-semibold text-sm hover:bg-white/20 transition"
              >
                Export Charts to Excel
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-gray-400 text-xs">
              <div className="flex items-center gap-1">
                <span className="text-green-400">✓</span>
                <span>Custom columns</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-green-400">✓</span>
                <span>XLSX / CSV / JSON</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-blue-400">✓</span>
                <span>Refreshable in Excel</span>
              </div>
            </div>
          </div>

          {/* Two Cards Side by Side */}
          <div className="grid md:grid-cols-2 gap-4">
            {isFeatureEnabled('smartContractVerifier') && <SafeContractPreview />}
            {isFeatureEnabled('community') && <CommunityPreview />}
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
              The <span className="text-red-400">expensive data</span> problem
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Professional crypto data is locked behind enterprise paywalls. Until now.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
              <div className="text-red-400 text-sm font-medium mb-3">❌ THE OLD WAY</div>
              <h3 className="text-xl font-bold mb-4">Enterprise Platforms</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span>Financial Terminals: <strong className="text-red-400">$24,000/year</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span>Whale Analytics: <strong className="text-red-400">$1,299/month</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400">✗</span>
                  <span>On-Chain Data: <strong className="text-red-400">$799/month</strong></span>
                </li>
              </ul>
              <div className="mt-6 text-center">
                <div className="text-3xl font-bold text-red-400">$800-$2,000</div>
                <div className="text-gray-500 text-sm">per month</div>
              </div>
            </div>

            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 relative">
              <div className="absolute top-3 right-3 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-full">SAVE</div>
              <div className="text-green-400 text-sm font-medium mb-3">✓ THE DATASIMPLIFY WAY</div>
              <h3 className="text-xl font-bold mb-4">All-In-One Platform</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>On-chain dashboards (availability varies)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Whale tracking (availability varies)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>AI assistant + Smart Contract Verifier</span>
                </li>
              </ul>
              <div className="mt-6 text-center">
                <div className="text-3xl font-bold text-green-400">$19-$49</div>
                <div className="text-gray-500 text-sm">per month</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-16 px-4 bg-gray-800/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              15+ Professional Tools, <span className="text-blue-400">One Platform</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            {[
              { icon: '🤖', title: 'AI Assistant', desc: 'Ask anything about crypto.' },
              { icon: '🗺️', title: 'Market Map', desc: 'Visualize the market.' },
              { icon: '😱', title: 'Fear & Greed', desc: 'Track market sentiment.' },
              { icon: '🐋', title: 'Whale Tracker', desc: 'See big players.' },
              { icon: '📊', title: 'Technical Analysis', desc: '12+ indicators.' },
              { icon: '⛓️', title: 'On-Chain Metrics', desc: 'On-chain indicators (availability varies).' },
              { icon: '💰', title: 'DeFi Dashboard', desc: 'DeFi analytics (availability varies).' },
              { icon: '🔍', title: 'Token Screener', desc: 'Filter tokens by metrics.' },
              { icon: '📈', title: 'ETF Tracker', desc: 'ETF context (flows may be unavailable).' },
              { icon: '⚡', title: 'Price Alerts', desc: 'Alert setup (delivery may be unavailable).' },
              { icon: '📚', title: 'Crypto Academy', desc: '20 lessons.' },
              { icon: '🔐', title: 'Contract Verifier', desc: 'Smart contract security.' },
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
          </div>

          <div className="grid md:grid-cols-4 gap-4 max-w-5xl mx-auto">
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
              <div className="text-sm text-gray-400 mb-1">Free</div>
              <div className="text-3xl font-bold mb-3">$0</div>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li>✓ 5 downloads/month</li>
                <li>✓ Basic data</li>
                <li>✓ Crypto Academy</li>
              </ul>
              <Link href="/signup" className="block text-center py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-sm">
                Get Started
              </Link>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
              <div className="text-sm text-gray-400 mb-1">Starter</div>
              <div className="text-3xl font-bold mb-3">$19<span className="text-sm text-gray-400">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li>✓ 50 downloads</li>
                <li>✓ Technical indicators</li>
                <li>✓ Token screener</li>
              </ul>
              <Link href="/signup?plan=starter" className="block text-center py-2 bg-gray-700 rounded-lg hover:bg-gray-600 text-sm">
                Start Trial
              </Link>
            </div>

            <div className="bg-gradient-to-b from-blue-500/20 to-purple-500/20 border-2 border-blue-500 rounded-2xl p-5 relative">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-xs font-bold px-2 py-0.5 rounded-full">
                POPULAR
              </div>
              <div className="text-sm text-blue-400 mb-1">Pro</div>
              <div className="text-3xl font-bold mb-3">$49<span className="text-sm text-gray-400">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li>✓ Unlimited downloads</li>
                <li>✓ AI Assistant</li>
                <li>✓ Whale tracking</li>
              </ul>
              <Link href="/signup?plan=pro" className="block text-center py-2 bg-blue-500 rounded-lg hover:bg-blue-600 font-semibold text-sm">
                Start Trial
              </Link>
            </div>

            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-5">
              <div className="text-sm text-gray-400 mb-1">Business</div>
              <div className="text-3xl font-bold mb-3">$99<span className="text-sm text-gray-400">/mo</span></div>
              <ul className="space-y-2 text-sm text-gray-300 mb-4">
                <li>✓ Everything in Pro</li>
                <li>✓ Price alerts</li>
                <li>✓ API access</li>
              </ul>
              <Link href="/signup?plan=business" className="block text-center py-2 border border-gray-600 rounded-lg hover:bg-gray-700 text-sm">
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
            Ready to Invest Smarter?
          </h2>
          <p className="text-lg text-gray-400 mb-6">
            Stop overpaying for data.
          </p>
          <Link
            href="/signup"
            className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold shadow-lg"
          >
            Start Free Trial - No Credit Card Required
          </Link>
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
          <div className="flex gap-4 text-gray-400 text-sm">
            <Link href="/privacy" className="hover:text-white">Privacy</Link>
            <Link href="/terms" className="hover:text-white">Terms</Link>
            <Link href="/support" className="hover:text-white">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
