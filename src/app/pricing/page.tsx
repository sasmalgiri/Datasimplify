'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { isFeatureEnabled } from '@/lib/featureFlags';

interface GeoInfo {
  country: string;
  currency: string;
  symbol: string;
  rate: number;
}


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
  '5 dashboard widgets': 'Access KPI Cards, Price Chart, Top Coins, Fear & Greed, and Trending widgets.',
  '2-coin compare': 'Compare any two cryptocurrencies side by side with key metrics.',
  '5 downloads per month': 'Download up to 5 template packs each month.',
  '30-day price history': 'View price charts and history for the last 30 days.',
  'Basic chart types': 'Line charts and simple bar charts. No multi-axis overlays or advanced layouts.',
  'Learn + Glossary': 'Full access to educational content, crypto glossary, and FAQ.',
  'Contract verification': 'Verify smart contracts via Sourcify — free for everyone.',

  // Pro tier
  '300 downloads per month': 'Download up to 300 template packs each month.',
  'All 90+ dashboard widgets': 'Every widget: health scores, smart signals, risk radar, alpha finder, volatility forecast, executive briefs, sector rotation, money flow, candlesticks, heatmaps, technical screener, funding rates, and 70+ more.',
  '10-coin compare + head-to-head': 'Compare up to 10 coins with 26 columns, technical indicators, visual charts, and head-to-head ratios.',
  'Full price history (all timeframes)': 'Unlimited historical data — hourly, daily, weekly, monthly, and yearly.',
  'Advanced charts & filters': 'Multi-axis charts, overlays, indicator stacks, sector/category filters, custom metrics.',
  'Technical indicators': 'RSI, Sharpe ratio, volatility, momentum, max drawdown — computed from real candle data.',
  'All template packs': 'Every template: Screener, Technical Analysis, Correlation, Risk, DeFi, and more.',
  'Market, screener & analysis pages': 'Access to market overview, screener, heatmap, correlation, portfolio, sentiment, and analyst hub.',
  'AI Ask (Groq)': 'Ask questions about crypto in natural language. Powered by Groq llama-3.3-70b.',
  'Alerts (email notifications)': 'Set price alerts with email notifications. Up to 10 active alerts.',
  'Priority email support': 'Email support with 24-48 hour response time.',
};

export default function PricingPage() {
  const pricingEnabled = isFeatureEnabled('pricing');
  const { user, profile } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [geo, setGeo] = useState<GeoInfo | null>(null);

  useEffect(() => {
    fetch('/api/geo')
      .then((r) => r.json())
      .then((data: GeoInfo) => {
        if (data.currency && data.currency !== 'USD') setGeo(data);
      })
      .catch(() => {});
  }, []);

  if (!pricingEnabled) {
    return (
      <div className="min-h-screen bg-gray-900 text-white">
        <FreeNavbar />
        <Breadcrumb />
        <div className="max-w-3xl mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold mb-4">Pricing</h1>
          <p className="text-gray-300 mb-4">
            CryptoReportKit is currently running in free mode. All features are available without payment.
          </p>
          <p className="text-gray-400 text-sm mb-6">
            We provide Excel templates with prefetched crypto data and 83+ live interactive dashboards.
            All powered by BYOK (Bring Your Own Key) — your CoinGecko API key, your data.
          </p>
          <div className="mt-6 flex gap-4">
            <Link href="/downloads" className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 font-medium">
              Get Templates →
            </Link>
            <Link href="/template-requirements" className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 font-medium">
              Setup Guide
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleSubscribe = (tier: string, period: 'monthly' | 'yearly') => {
    // Redirect to signup first if not logged in
    if (!user) {
      window.location.assign(`/signup?plan=${tier}-${period}`);
      return;
    }

    const productPaths: Record<string, string> = {
      'pro-monthly': 'pro-monthly',
      'pro-yearly': 'pro-yearly',
    };

    const productPath = productPaths[`${tier}-${period}`];
    if (productPath) {
      // Replace with your FastSpring store URL
      window.location.assign(`https://cryptoreportkit.onfastspring.com/${productPath}`);
    }
  };

  const formatLocal = (usd: number): string => {
    if (!geo || usd === 0) return '';
    const converted = Math.round(usd * geo.rate);
    return `${geo.symbol}${converted.toLocaleString()}`;
  };

  const tiers = [
    {
      name: 'Free',
      key: 'free',
      monthlyPrice: 0,
      yearlyPrice: 0,
      description: 'Get started with essential crypto tools',
      features: [
        '5 dashboard widgets',
        '2-coin compare',
        '5 downloads per month',
        '30-day price history',
        'Basic chart types',
        'Learn + Glossary',
        'Contract verification',
      ],
      popular: false,
    },
    {
      name: 'Pro',
      key: 'pro',
      monthlyPrice: 19,
      yearlyPrice: 190,
      description: 'Full analytics suite for serious crypto research',
      features: [
        '300 downloads per month',
        'All 90+ dashboard widgets',
        '10-coin compare + head-to-head',
        'Full price history (all timeframes)',
        'Advanced charts & filters',
        'Technical indicators',
        'All template packs',
        'Market, screener & analysis pages',
        'AI Ask (Groq)',
        'Alerts (email notifications)',
        'Priority email support',
      ],
      popular: true,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-gray-400 text-lg mb-2">
            Free forever with essentials. Upgrade for full analytics power.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-400">
            <span>🔑</span>
            <span>
              <strong>BYOK:</strong> You use your own API key. Your key stays in your browser — we never see or store it.
            </span>
          </div>
        </div>

        {/* Billing Toggle */}
        <div className="flex justify-center mb-10">
          <div className="bg-gray-800 p-1 rounded-lg inline-flex items-center">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition ${
                billingPeriod === 'monthly'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition flex items-center gap-2 ${
                billingPeriod === 'yearly'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Yearly
              <span className="text-xs px-2 py-0.5 bg-emerald-500 text-white rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {tiers.map((tier) => {
            const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
            const perMonth = billingPeriod === 'yearly' ? Math.round(tier.yearlyPrice / 12) : tier.monthlyPrice;

            return (
              <div
                key={tier.key}
                className={`bg-gray-800 rounded-2xl border-2 ${
                  tier.popular ? 'border-emerald-500' : 'border-gray-700'
                } p-8 relative`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <h3 className="text-2xl font-bold mb-1">{tier.name}</h3>
                <p className="text-gray-400 text-sm mb-6">{tier.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-5xl font-bold">${price}</span>
                    {price > 0 && (
                      <span className="text-gray-400">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                    )}
                    {price === 0 && (
                      <span className="text-gray-400">forever</span>
                    )}
                  </div>
                  {geo && price > 0 && (
                    <p className="text-gray-400 text-sm mt-1">
                      ≈ {formatLocal(price)}/{billingPeriod === 'monthly' ? 'mo' : 'yr'}
                    </p>
                  )}
                  {billingPeriod === 'yearly' && price > 0 && (
                    <p className="text-emerald-400 text-sm mt-1">
                      ${perMonth}/mo billed annually
                      {geo && <span className="text-gray-500"> ({formatLocal(perMonth)}/mo)</span>}
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span className="text-gray-300 flex items-center">
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
                    className="block w-full py-3 rounded-lg font-medium transition bg-gray-700 hover:bg-gray-600 text-white text-center"
                  >
                    {user ? 'Current Plan' : 'Get Started Free'}
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleSubscribe(tier.key, billingPeriod)}
                    disabled={profile?.subscription_tier === tier.key}
                    className="w-full py-3 rounded-lg font-medium transition bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {profile?.subscription_tier === tier.key ? 'Current Plan' : `Get ${tier.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {/* Renewal Notice */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Renews automatically. Cancel anytime.
        </p>

        {/* 30-Day Guarantee */}
        <div className="max-w-xl mx-auto mt-10">
          <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 flex items-center gap-4">
            <div className="flex-shrink-0 w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-white text-lg">30-Day Money-Back Guarantee</h3>
              <p className="text-gray-400 text-sm">
                Not satisfied? Get a full refund within 30 days, no questions asked.{' '}
                <Link href="/refund" className="text-emerald-400 hover:text-emerald-300 underline">
                  Refund policy →
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16">
          <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="font-bold mb-2 text-white">What is BYOK?</h3>
              <p className="text-gray-400 text-sm">BYOK (Bring Your Own Key) means you provide your own CoinGecko API key. Your key stays local in your browser for live dashboards. If you save a key in the app, it&apos;s stored encrypted. Get a key at <a href="https://www.coingecko.com/en/api/pricing?ref=cryptoreportkit" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">coingecko.com</a>.</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="font-bold mb-2 text-white">Can I cancel anytime?</h3>
              <p className="text-gray-400 text-sm">Yes! Cancel anytime from your account. You&apos;ll keep access until the end of your billing period. No hidden fees.</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="font-bold mb-2 text-white">What&apos;s included in templates?</h3>
              <p className="text-gray-400 text-sm">Templates come with prefetched market data, professional styling, charts, and navigation. For interactive data, use our web dashboards with your BYOK key.</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="font-bold mb-2 text-white">How do web dashboards work?</h3>
              <p className="text-gray-400 text-sm">Enter your free CoinGecko API key to unlock 83+ interactive dashboards with charts, market data, and export capabilities — all in your browser.</p>
            </div>
          </div>
        </div>

        {/* Need Higher API Limits? - Affiliate Revenue */}
        <div className="mt-16">
          <div className="max-w-3xl mx-auto bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 rounded-xl p-6">
            <h3 className="font-bold text-lg mb-2 text-center">🔑 Need Higher API Limits?</h3>
            <p className="text-gray-400 text-sm text-center mb-4">
              Free CoinGecko API has rate limits. Upgrade to Pro for 500+ calls/minute.
            </p>
            <div className="flex justify-center gap-4">
              <a
                href="https://www.coingecko.com/en/api/pricing?ref=cryptoreportkit"
                target="_blank"
                rel="noopener noreferrer"
                className="px-6 py-2.5 bg-yellow-500 hover:bg-yellow-600 text-black font-medium rounded-lg transition"
              >
                Get CoinGecko Pro →
              </a>
            </div>
            <p className="text-gray-500 text-xs text-center mt-3">
              Affiliate link - helps support CryptoReportKit at no extra cost to you
            </p>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-12 p-4 bg-gray-800/30 rounded-lg border border-gray-700">
          <p className="text-gray-500 text-xs text-center">
            <strong>Disclaimer:</strong> CryptoReportKit sells template software, not data.
            Templates contain formulas - data is fetched via your own API key (BYOK).
            We do not provide financial advice or trading recommendations.
          </p>
        </div>

        {/* Footer Links */}
        <div className="mt-8 pt-8 border-t border-gray-800 flex flex-wrap justify-center gap-4 text-sm text-gray-500">
          <Link href="/privacy" className="hover:text-white">Privacy Policy</Link>
          <Link href="/terms" className="hover:text-white">Terms of Service</Link>
          <Link href="/refund" className="hover:text-white">Refund Policy</Link>
          <Link href="/contact" className="hover:text-white">Contact</Link>
        </div>
      </div>
    </div>
  );
}
