'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';

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
interface VerificationResponse {
  success: boolean;
  error?: string;
  summary?: { totalChecks: number; verified: number; vulnerable: number; errors: number; };
  securityScore?: number;
  overallStatus?: string;
  results?: { status: string; description: string; function: string; }[];
}

// Compact SafeContract Component
function SafeContractPreview() {
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

  const verify = async () => {
    if (!code.trim()) return;
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
      setResults({ success: false, error: 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  const getScoreClass = (score: number) => {
    if (score >= 80) return 'border-green-500 bg-green-500/20 text-green-400';
    if (score >= 50) return 'border-yellow-500 bg-yellow-500/20 text-yellow-400';
    return 'border-red-500 bg-red-500/20 text-red-400';
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
        <Link href="/tools/verify" className="text-green-400 text-xs hover:text-green-300 transition">
          Full Page →
        </Link>
      </div>

      {/* Code Input */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-gray-500 text-xs">Solidity Code</span>
          <button type="button" onClick={loadExample} className="text-green-400 text-xs hover:underline">
            Load Example
          </button>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="// Paste Solidity code..."
          className="w-full h-20 p-2 bg-gray-900/50 border border-gray-700 rounded-lg text-gray-200 font-mono text-xs resize-none outline-none focus:border-green-500/50"
        />
      </div>

      {/* Verify Button */}
      <button
        type="button"
        onClick={verify}
        disabled={loading || !code.trim()}
        className="w-full py-2 bg-green-500 hover:bg-green-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-gray-900 font-semibold rounded-lg transition text-sm flex items-center justify-center gap-2 mb-3"
      >
        {loading ? (
          <>
            <span className="w-3 h-3 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
            Verifying...
          </>
        ) : (
          <>🔍 Verify Contract</>
        )}
      </button>

      {/* Results */}
      <div className="bg-gray-900/50 rounded-lg p-3 min-h-[60px]">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-xs">Running verification...</p>
          </div>
        ) : results ? (
          results.success ? (
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center text-sm font-bold font-mono ${getScoreClass(results.securityScore || 0)}`}>
                {results.securityScore}%
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-semibold">{results.overallStatus}</p>
                <p className="text-gray-400 text-xs">{results.summary?.verified}/{results.summary?.totalChecks} checks passed</p>
              </div>
            </div>
          ) : (
            <p className="text-red-400 text-xs text-center">{results.error}</p>
          )
        ) : (
          <div className="text-center text-gray-500 text-xs">
            <span className="text-lg">🔐</span>
            <p>Paste code & verify</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Community Preview Component
function CommunityPreview() {
  const [stats, setStats] = useState<CommunityStats>({
    total_predictions: 0,
    active_predictors: 0,
    bullish_percent: 33,
    bearish_percent: 33,
    neutral_percent: 34,
    avg_accuracy: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/community?action=stats');
        const result = await response.json();
        if (result.success && result.data) {
          setStats(result.data);
        }
      } catch (error) {
        console.error('Error fetching community stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

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
          <p className="text-lg font-bold text-white">{loading ? '...' : stats.total_predictions}</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-2 border border-gray-700">
          <p className="text-gray-400 text-xs">Accuracy</p>
          <p className="text-lg font-bold text-emerald-400">{loading ? '...' : `${stats.avg_accuracy}%`}</p>
        </div>
      </div>

      {/* Sentiment Bar */}
      <div className="mb-3">
        <div className="flex h-2 rounded-full overflow-hidden bg-gray-700">
          <ProgressSegment percentage={stats.bullish_percent} colorClass="bg-emerald-500" />
          <ProgressSegment percentage={stats.neutral_percent} colorClass="bg-yellow-500" />
          <ProgressSegment percentage={stats.bearish_percent} colorClass="bg-red-500" />
        </div>
        <div className="flex justify-between text-xs mt-1">
          <span className="text-emerald-400">{stats.bullish_percent}% Bull</span>
          <span className="text-yellow-400">{stats.neutral_percent}% Neutral</span>
          <span className="text-red-400">{stats.bearish_percent}% Bear</span>
        </div>
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
      <section className="pt-8 pb-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Hero Text - Centered at top */}
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
              <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                PROFESSIONAL CRYPTO DATA
              </span>
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                WITHOUT THE $1,000/mo PRICE TAG
              </span>
            </h1>

            <p className="text-base md:text-lg text-gray-400 mb-6 max-w-2xl mx-auto">
              Why pay $800-$1,299/month for enterprise platforms when you can get
              <span className="text-white font-semibold"> 90% of the features for just $19/month?</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
              <Link
                href="/signup"
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold hover:opacity-90 transition shadow-lg shadow-blue-500/25"
              >
                Start Free Trial →
              </Link>
              <Link
                href="/chat"
                className="px-6 py-3 bg-white/10 border border-white/20 rounded-xl font-semibold hover:bg-white/20 transition"
              >
                Try AI Demo
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-gray-400 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400">★★★★★</span>
                <span>4.9/5</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">✓</span>
                <span>No Credit Card</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-blue-400">🔒</span>
                <span>Secure</span>
              </div>
            </div>
          </div>

          {/* Two Cards Side by Side */}
          <div className="grid md:grid-cols-2 gap-4">
            <SafeContractPreview />
            <CommunityPreview />
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-gray-800 bg-gray-800/30">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-1">$50M+</div>
              <div className="text-gray-400 text-sm">Data Analyzed Daily</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-purple-400 mb-1">10,000+</div>
              <div className="text-gray-400 text-sm">Tokens Tracked</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-1">95%</div>
              <div className="text-gray-400 text-sm">Cost Savings</div>
            </div>
            <div>
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1">24/7</div>
              <div className="text-gray-400 text-sm">Real-Time Updates</div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-4xl font-bold mb-3">
              The <span className="text-red-400">$32,000/year</span> Problem
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
              <div className="absolute top-3 right-3 bg-green-500 text-black text-xs font-bold px-2 py-1 rounded-full">
                SAVE 95%
              </div>
              <div className="text-green-400 text-sm font-medium mb-3">✓ THE DATASIMPLIFY WAY</div>
              <h3 className="text-xl font-bold mb-4">All-In-One Platform</h3>
              <ul className="space-y-3 text-gray-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Professional on-chain analytics</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-400">✓</span>
                  <span>Real-time whale tracking</span>
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
              { icon: '😱', title: 'Fear & Greed', desc: 'Know when to buy/sell.' },
              { icon: '🐋', title: 'Whale Tracker', desc: 'See big players.' },
              { icon: '📊', title: 'Technical Analysis', desc: '12+ indicators.' },
              { icon: '⛓️', title: 'On-Chain Metrics', desc: 'MVRV, SOPR, HODL.' },
              { icon: '💰', title: 'DeFi Dashboard', desc: 'Track TVL & yields.' },
              { icon: '🔍', title: 'Token Screener', desc: 'Filter 10,000+ tokens.' },
              { icon: '📈', title: 'ETF Tracker', desc: 'Bitcoin ETF flows.' },
              { icon: '⚡', title: 'Price Alerts', desc: 'Instant notifications.' },
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

      {/* CTA */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-600/20 to-purple-600/20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-bold mb-4">
            Ready to Invest Smarter?
          </h2>
          <p className="text-lg text-gray-400 mb-6">
            Join 500+ investors who stopped overpaying for data.
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
