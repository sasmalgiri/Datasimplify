'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { isFeatureEnabled } from '@/lib/featureFlags';
import { PricingJsonLd } from '@/components/JsonLd';

// Help Icon with tooltip for explanations
function HelpIcon({ text }: { text: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <span
      className="relative inline-flex items-center ml-2"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      <span className="cursor-help w-5 h-5 rounded-full bg-gray-700 text-emerald-400 text-xs flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-colors font-bold">
        ?
      </span>
      {isVisible && (
        <span className="absolute z-[9999] bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-4 py-3 text-sm text-white bg-gray-900 rounded-lg shadow-2xl border border-emerald-500/50 min-w-[250px] max-w-[350px] text-left whitespace-normal">
          {text}
          <span className="absolute top-full left-1/2 transform -translate-x-1/2 border-8 border-transparent border-t-gray-900"></span>
        </span>
      )}
    </span>
  );
}

// Feature explanations for tooltips
const FEATURE_EXPLANATIONS: Record<string, string> = {
  // Free tier
  '5 downloads per month': 'Download up to 5 template packs with CRK formulas each month. Templates use your own API keys (BYOK).',
  'Basic market dashboards': 'Access to market overview, trending coins, and gainers/losers displays on our website.',
  'Community support': 'Help via community resources and documentation.',
  'Basic templates (XLSX)': 'Excel templates with CRK formulas. Data is fetched via your own API key (BYOK).',
  'Up to 10 coins per template': 'Templates configured for smaller portfolios. Good for free CoinGecko API tier.',

  // Pro tier
  '100 downloads per month': 'Download up to 100 template packs per month for regular workflows.',
  'All template types': 'Access to all template categories: screener, compare, risk, watchlist, and more.',
  'Advanced analytics dashboards': 'Full access to on-chain, sentiment, technical, and correlation analysis on our website.',
  'Up to 100 coins per template': 'Templates supporting larger watchlists. May require CoinGecko Pro API.',
  'All timeframe options': 'Use hourly, 4-hour, daily, and weekly timeframes in templates.',
  'Email support': 'Email support with 24-48 hour response time for account and billing questions.',
  'Scheduled exports': 'Set up automatic report generation and email delivery.',

  // Premium tier
  'Unlimited downloads': 'No monthly limits on template pack downloads.',
  'Everything in Pro': 'All Pro tier features included.',
  'Priority generation': 'Faster template generation with dedicated processing.',
  'Up to 500 coins per template': 'Large templates for comprehensive market coverage.',
  'Advanced Excel functions + connectors': 'Use authenticated API endpoints for integrations and automation.',
  'Priority support (4hr response)': 'Priority support with 4-hour response time during business hours.',
  'Custom integrations': 'Work with our team to build custom template integrations for your workflow.',
};

// Payment integration coming soon

export default function PricingPage() {
  const pricingEnabled = isFeatureEnabled('pricing');
  const { user, profile } = useAuth();
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  if (!pricingEnabled) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-900">
        <FreeNavbar />
        <Breadcrumb />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold mb-4">Pricing</h1>
          <p className="text-gray-700 mb-4">
            CryptoReportKit is currently running in free mode. All features are available without payment.
          </p>
          <p className="text-gray-600 text-sm mb-6">
            We provide software analytics tools and Excel templates for educational data visualization.
            Templates contain formulas only - data is fetched via the CRK add-in using your own API keys (BYOK).
          </p>
          <div className="mt-6 flex gap-4">
            <Link href="/builder" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
              Customize Templates →
            </Link>
            <Link href="/template-requirements" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium">
              Setup Requirements
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubscribe = (tier: string) => {
    // Always redirect to signup first (users create account then pay)
    if (!user) {
      window.location.href = `/signup?plan=${tier}`;
      return;
    }

    // Show waitlist for paid plans (payment integration coming soon)
    setShowWaitlist(true);
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError('');

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!waitlistEmail.trim()) {
      setWaitlistError('Please enter your email address');
      return;
    }
    if (!emailRegex.test(waitlistEmail)) {
      setWaitlistError('Please enter a valid email address');
      return;
    }

    // TODO: Save to database or email service
    console.log('Waitlist signup:', waitlistEmail);
    setWaitlistSubmitted(true);
  };

  const tiers = [
    {
      name: 'Free',
      key: 'free',
      price: 0,
      description: 'Try our templates',
      features: [
        '5 downloads per month',
        'Basic templates (XLSX)',
        'Up to 10 coins per template',
        'Basic market dashboards',
        'Community support',
      ],
      cta: 'Get Started Free',
      popular: false,
      note: 'BYOK: Uses your own CoinGecko API key',
    },
    {
      name: 'Pro',
      key: 'pro',
      price: 29,
      description: 'For regular workflows',
      features: [
        '100 downloads per month',
        'All template types',
        'Up to 100 coins per template',
        'All timeframe options',
        'Advanced analytics dashboards',
        'Scheduled exports',
        'Email support',
      ],
      cta: 'Join Waitlist',
      popular: true,
      note: 'May require CoinGecko Pro API for large templates',
    },
    {
      name: 'Premium',
      key: 'premium',
      price: 79,
      description: 'For power users & businesses',
      features: [
        'Everything in Pro',
        'Unlimited downloads',
        'Up to 500 coins per template',
        'Priority generation',
        'Advanced Excel functions + connectors',
        'Priority support (4hr response)',
        'Custom integrations',
      ],
      cta: 'Join Waitlist',
      popular: false,
      note: 'Best for high-volume template usage',
    },
  ];

  return (
    <>
      <PricingJsonLd />

      <div className="min-h-screen bg-gray-50 text-gray-900">
        <FreeNavbar />
        <Breadcrumb />

        {/* Paid Plans Coming Soon Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 py-4">
          <div className="max-w-6xl mx-auto px-4 text-center text-white">
            <p className="text-lg font-medium">
              Pro and Premium plans launching soon! Free tier is fully available now.
              <button
                onClick={() => setShowWaitlist(true)}
                className="underline ml-2 hover:no-underline"
              >
                Get notified when we launch
              </button>
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Beginner Tip */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <p className="text-blue-700 text-sm flex items-start gap-2">
              <span>💡</span>
              <span>
                <strong>Not sure which plan?</strong> Start with Free to try our features.
                Hover over any feature to see what it includes. You can upgrade anytime!
              </span>
            </p>
          </div>

          {/* Title */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-4">
              <h1 className="text-4xl font-bold">Templates & Workflows</h1>
              <HelpIcon text="We sell Excel template software and workflows, not data. Templates contain CRK formulas. Data is fetched via your own API key (BYOK). Cancel anytime." />
            </div>
            <p className="text-gray-600 text-lg mb-2">
              Professional Excel templates with live data. Start free, upgrade anytime.
            </p>
            <p className="text-gray-500">
              All prices in USD
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-700">
              <span>🔑</span>
              <span>
                <strong>BYOK:</strong> Templates use your own API key (e.g., CoinGecko free or Pro). Your keys are encrypted and never shared.
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Data is fetched using your own provider API key(s). We do not provide, sell, or redistribute provider API keys or credentials.
            </p>
          </div>

          {/* 30-Day Money-Back Guarantee Badge */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-4">
              <div className="flex-shrink-0 w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-800 text-lg">30-Day Money-Back Guarantee</h3>
                <p className="text-emerald-700 text-sm">
                  When paid plans launch, we&apos;ll offer a full refund within 30 days, no questions asked.{' '}
                  <Link href="/refund" className="underline hover:text-emerald-900 font-medium">
                    Learn more about our refund policy →
                  </Link>
                </p>
              </div>
            </div>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.key}
                className={`bg-white rounded-xl border-2 ${
                  tier.popular ? 'border-emerald-500 ring-2 ring-emerald-500 scale-105' : 'border-gray-200'
                } p-6 relative shadow-lg`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      BEST VALUE
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
                <p className="text-gray-500 text-sm mb-4">{tier.description}</p>

                <div className="mb-6">
                  <span className="text-5xl font-bold">${tier.price}</span>
                  {tier.price > 0 && <span className="text-gray-600">/month</span>}
                  {tier.price === 0 && <span className="text-gray-600 ml-2">forever</span>}
                </div>

                <ul className="space-y-3 mb-6">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-green-600 mt-1">✓</span>
                      <span className="text-gray-700 flex items-center">
                        {feature}
                        {FEATURE_EXPLANATIONS[feature] && (
                          <HelpIcon text={FEATURE_EXPLANATIONS[feature]} />
                        )}
                      </span>
                    </li>
                  ))}
                </ul>

                {tier.key === 'free' ? (
                  <Link
                    href="/signup"
                    className="block w-full py-3 text-center bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition"
                  >
                    {tier.cta}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubscribe(tier.key)}
                    disabled={profile?.subscription_tier === tier.key}
                    className={`w-full py-3 rounded-lg font-medium transition ${
                      tier.popular
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {profile?.subscription_tier === tier.key ? 'Current Plan' : tier.cta}
                  </button>
                )}

                {/* Tier note about BYOK */}
                {'note' in tier && tier.note && (
                  <p className="mt-3 text-xs text-gray-500 text-center">{tier.note}</p>
                )}
              </div>
            ))}
          </div>

          {/* Payment Info */}
          <div className="mt-12 text-center">
            <div className="inline-block px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <p className="text-amber-800 font-medium">⚠️ Payments are not enabled yet</p>
            </div>
            <p className="text-gray-600 mb-4">Secure payments coming soon</p>
            <div className="flex items-center justify-center gap-8">
              <div className="text-gray-600">💳 Cards</div>
              <div className="text-gray-600">🅿️ PayPal</div>
              <div className="text-gray-600">🌍 190+ Countries</div>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              We&apos;re finalizing our payment integration. Join the waitlist to be notified when paid plans launch.
            </p>
          </div>

          {/* FAQ */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold mb-2">What is BYOK (Bring Your Own Key)?</h3>
                <p className="text-gray-600">You provide your own data provider API key (e.g., CoinGecko). Templates fetch data using your key. Your keys are encrypted and only decrypted when making requests on your behalf.</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold mb-2">What do I get with my plan?</h3>
                <p className="text-gray-600">You get access to our template software and workflows. Data comes via your own API key. We sell templates and tools, not data.</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold mb-2">Do I need a CoinGecko API key?</h3>
                <p className="text-gray-600">Yes. Get a free CoinGecko API key (Demo plan) directly from <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">CoinGecko</a>. For larger templates, you may need CoinGecko Pro. Connect your key in Account → API Keys.</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">Yes! Cancel anytime. You&apos;ll keep access until the end of your billing period.</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold mb-2">What about API rate limits?</h3>
                <p className="text-gray-600">Rate limits depend on your CoinGecko plan (Demo, Analyst, Pro). See <a href="https://www.coingecko.com/en/api/pricing" target="_blank" rel="noopener noreferrer" className="text-emerald-600 underline">CoinGecko pricing</a> for current limits. Our templates are optimized for efficient API usage.</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold mb-2">When will paid plans launch?</h3>
                <p className="text-gray-600">We&apos;re finalizing our payment integration. Join the waitlist to be notified. Free tier is fully available now!</p>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="mt-12 p-4 bg-gray-100 rounded-lg border border-gray-200">
            <p className="text-gray-500 text-xs text-center">
              <strong>Disclaimer:</strong> CryptoReportKit sells template software and workflows, not data.
              Templates contain CRK formulas - data is fetched via your own API key (BYOK architecture).
              We do not provide financial advice, trading signals, or investment recommendations. Not a data vendor or broker.
            </p>
          </div>

          {/* Footer Links */}
          <div className="mt-8 pt-8 border-t border-gray-200 flex flex-wrap justify-center gap-4 text-sm text-gray-600">
            <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
            <Link href="/refund" className="hover:text-gray-900">Refund Policy</Link>
            <Link href="/contact" className="hover:text-gray-900">Contact</Link>
          </div>
        </div>

        {/* Waitlist Modal */}
        {showWaitlist && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
              <div className="text-center">
                <div className="text-5xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold mb-2 text-white">Paid Plans Coming Soon!</h3>
                <p className="text-gray-400 mb-6">
                  We&apos;re finalizing our payment integration. Join the waitlist to get early access
                  and a special discount when we launch!
                </p>

                {waitlistSubmitted ? (
                  <div className="text-green-400 py-4">
                    <div className="text-4xl mb-2">✓</div>
                    <p>You&apos;re on the list! We&apos;ll notify you when we launch.</p>
                  </div>
                ) : (
                  <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                    <div>
                      <input
                        type="email"
                        value={waitlistEmail}
                        onChange={(e) => {
                          setWaitlistEmail(e.target.value);
                          setWaitlistError('');
                        }}
                        placeholder="your@email.com"
                        className={`w-full px-4 py-3 bg-gray-700 border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 ${
                          waitlistError ? 'border-red-500' : 'border-gray-600'
                        }`}
                      />
                      {waitlistError && (
                        <p className="text-red-400 text-sm mt-1">{waitlistError}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-medium transition text-white"
                    >
                      Join Waitlist
                    </button>
                  </form>
                )}

                <button
                  onClick={() => setShowWaitlist(false)}
                  className="mt-4 text-gray-400 hover:text-white"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
