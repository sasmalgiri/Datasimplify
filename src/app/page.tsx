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
    <div className="bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <span className="text-xl">👥</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Community Predictions</h3>
            <p className="text-gray-400 text-sm">Live market sentiment</p>
          </div>
        </div>
        <Link
          href="/community"
          className="text-emerald-400 text-sm hover:text-emerald-300 transition"
        >
          View All →
        </Link>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-xs mb-1">Total Predictions</p>
          <p className="text-2xl font-bold text-white">
            {loading ? '...' : stats.total_predictions.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-xs mb-1">Active Predictors</p>
          <p className="text-2xl font-bold text-white">
            {loading ? '...' : stats.active_predictors.toLocaleString()}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-xs mb-1">Community Accuracy</p>
          <p className="text-2xl font-bold text-emerald-400">
            {loading ? '...' : `${stats.avg_accuracy}%`}
          </p>
        </div>
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <p className="text-gray-400 text-xs mb-1">Bullish Sentiment</p>
          <p className="text-2xl font-bold text-emerald-400">
            {loading ? '...' : `${stats.bullish_percent}%`}
          </p>
        </div>
      </div>

      {/* Sentiment Bar */}
      <div className="mb-4">
        <p className="text-gray-400 text-sm mb-2">Community Sentiment</p>
        <div className="flex h-3 rounded-full overflow-hidden bg-gray-700">
          <ProgressSegment percentage={stats.bullish_percent} colorClass="bg-emerald-500" />
          <ProgressSegment percentage={stats.neutral_percent} colorClass="bg-yellow-500" />
          <ProgressSegment percentage={stats.bearish_percent} colorClass="bg-red-500" />
        </div>
        <div className="flex justify-between text-xs mt-2">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-gray-400">Bullish</span>
            <span className="text-emerald-400 font-bold">{stats.bullish_percent}%</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span className="text-gray-400">Neutral</span>
            <span className="text-yellow-400 font-bold">{stats.neutral_percent}%</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="text-gray-400">Bearish</span>
            <span className="text-red-400 font-bold">{stats.bearish_percent}%</span>
          </span>
        </div>
      </div>

      {/* CTA */}
      <Link
        href="/community"
        className="block w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-semibold text-center transition mt-4"
      >
        + Submit Your Prediction
      </Link>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      {/* Navigation */}
      <FreeNavbar />

      {/* Hero Section - Split Layout */}
      <section className="pt-8 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Trust Badge - Centered */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-400 text-sm">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              Trusted by 500+ crypto investors
            </div>
          </div>

          {/* Split Layout */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Left: Hero Content */}
            <div className="text-center lg:text-left">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
                <span className="bg-gradient-to-r from-white via-blue-100 to-white bg-clip-text text-transparent">
                  PROFESSIONAL CRYPTO DATA
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  WITHOUT THE $1,000/mo PRICE TAG
                </span>
              </h1>

              <p className="text-lg md:text-xl text-gray-400 mb-8">
                Why pay $800-$1,299/month for Glassnode or Nansen when you can get
                <span className="text-white font-semibold"> 90% of the features for just $19/month?</span>
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-8">
                <Link
                  href="/signup"
                  className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold text-lg hover:opacity-90 transition shadow-lg shadow-blue-500/25"
                >
                  Start Free Trial →
                </Link>
                <Link
                  href="/chat"
                  className="px-8 py-4 bg-white/10 border border-white/20 rounded-xl font-semibold text-lg hover:bg-white/20 transition"
                >
                  Try AI Demo
                </Link>
              </div>

              <div className="flex flex-wrap justify-center lg:justify-start gap-6 text-gray-400 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-400">★★★★★</span>
                  <span>4.9/5 Rating</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">✓</span>
                  <span>No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">🔒</span>
                  <span>Bank-Level Security</span>
                </div>
              </div>
            </div>

            {/* Right: Community Predictions Preview */}
            <div className="lg:pl-4">
              <CommunityPreview />
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
                  <span>Bloomberg Terminal: <strong className="text-red-400">$24,000/year</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Nansen Pro: <strong className="text-red-400">$1,299/month</strong></span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">✗</span>
                  <span>Glassnode Advanced: <strong className="text-red-400">$799/month</strong></span>
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
                  <span>On-chain analytics (like Glassnode)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-green-400 mt-1">✓</span>
                  <span>Whale tracking (like Nansen)</span>
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
