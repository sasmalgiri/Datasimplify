'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { isFeatureEnabled } from '@/lib/featureFlags';

// One-time Power Query template tiers
const POWER_QUERY_TIERS = [
  {
    name: 'Free',
    key: 'free',
    price: 0,
    description: 'Get started with basics',
    features: [
      'Top 10 coins only',
      'Basic price table',
      'Manual refresh',
      'Community support',
    ],
    downloadUrl: '/excel-templates/free/PowerQuery_Free.pq',
    popular: false,
  },
  {
    name: 'Pro',
    key: 'pro',
    price: 29,
    description: 'Most popular choice',
    features: [
      'Top 100 cryptocurrencies',
      'Auto-refresh every 5 min',
      'Portfolio tracker',
      'Historical charts',
      'DCA calculator',
      'BYOK with Pro API support',
      'Email support',
      'Lifetime updates',
    ],
    checkoutUrl: 'https://cryptoreportkit.onfastspring.com/power-query-pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    key: 'enterprise',
    price: 99,
    description: 'For professionals',
    features: [
      'All 10,000+ cryptocurrencies',
      'Multi-portfolio support',
      'Risk analytics (Sharpe, Sortino)',
      'Correlation matrix',
      '5 years historical data',
      'Custom modifications',
      'Priority support',
    ],
    checkoutUrl: 'https://cryptoreportkit.onfastspring.com/power-query-enterprise',
    popular: false,
  },
];

// Excel Add-in subscription tiers
const ADDIN_TIERS = [
  {
    name: 'Free',
    key: 'free',
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: 'Try CRK formulas in Excel',
    features: [
      '100 API calls / day',
      '10 basic functions (PRICE, OHLCV, etc.)',
      'Up to 10 coins per request',
      '7 days OHLCV history',
      'Community support',
    ],
    popular: false,
  },
  {
    name: 'Pro',
    key: 'pro',
    monthlyPrice: 49,
    yearlyPrice: 490,
    description: 'For serious crypto analysts',
    features: [
      '5,000 API calls / day',
      'All 70+ functions',
      'Up to 100 coins per request',
      '1 year OHLCV history',
      'Technical indicators (RSI, SMA, BB)',
      'Screener & Discovery functions',
      'Email support',
    ],
    checkoutMonthly: 'https://cryptoreportkit.onfastspring.com/crk-addin-pro-monthly',
    checkoutYearly: 'https://cryptoreportkit.onfastspring.com/crk-addin-pro-yearly',
    popular: true,
  },
  {
    name: 'Premium',
    key: 'premium',
    monthlyPrice: 199,
    yearlyPrice: 1990,
    description: 'For teams & power users',
    features: [
      '50,000 API calls / day',
      'All 70+ functions',
      'Up to 500 coins per request',
      '2 years OHLCV history',
      'All technical indicators',
      'Scheduled exports',
      'API access',
      'Priority support',
    ],
    checkoutMonthly: 'https://cryptoreportkit.onfastspring.com/crk-addin-premium-monthly',
    checkoutYearly: 'https://cryptoreportkit.onfastspring.com/crk-addin-premium-yearly',
    popular: false,
  },
];

// Add-in feature comparison rows
const ADDIN_COMPARISON = [
  { feature: 'Daily API Calls', free: '100', pro: '5,000', premium: '50,000' },
  { feature: 'Available Functions', free: '10 basic', pro: 'All 70+', premium: 'All 70+' },
  { feature: 'Coins per Request', free: '10', pro: '100', premium: '500' },
  { feature: 'OHLCV History', free: '7 days', pro: '1 year', premium: '2 years' },
  { feature: 'Technical Indicators', free: '—', pro: 'All', premium: 'All' },
  { feature: 'Screener & Discovery', free: '—', pro: 'Yes', premium: 'Yes' },
  { feature: 'Scheduled Exports', free: '—', pro: '—', premium: '25' },
  { feature: 'Support', free: 'Community', pro: 'Email', premium: 'Priority' },
];

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
  // Starter tier
  '10 downloads per month': 'Download up to 10 template packs with CRK formulas each month.',
  'Basic templates': 'Access to essential template packs: Market Overview, Watchlist, Portfolio Starter.',
  'Up to 25 coins per template': 'Templates configured for smaller portfolios. Works great with free CoinGecko API.',
  'Daily timeframes': 'Daily price data and analysis in your templates.',
  'Community support': 'Help via documentation and community resources.',

  // Pro tier
  'Unlimited downloads': 'No monthly limits on template pack downloads.',
  'All template packs': 'Access to every template: Screener, Technical Analysis, Correlation, Risk, DeFi, and more.',
  'Up to 100 coins per template': 'Templates supporting larger watchlists. May require CoinGecko Pro API for best performance.',
  'All timeframe options': 'Hourly, 4-hour, daily, and weekly timeframes in templates.',
  'Scheduled exports': 'Set up automatic report generation and email delivery.',
  'Email support': 'Email support with 24-48 hour response time.',
  'Early access to new packs': 'Get new template packs before they\'re released publicly.',
};

export default function PricingPage() {
  const pricingEnabled = isFeatureEnabled('pricing');
  const { user, profile } = useAuth();
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [pricingType, setPricingType] = useState<'addin' | 'onetime' | 'subscription'>('addin');

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
            We provide Power Query templates for crypto data in Excel.
            Templates use BYOK - your API key stays in Excel, no add-in required.
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

    // TODO: Integrate FastSpring checkout
    // For now, redirect to FastSpring hosted checkout
    const productPaths: Record<string, string> = {
      'starter-monthly': 'starter-monthly',
      'starter-yearly': 'starter-yearly',
      'pro-monthly': 'pro-monthly',
      'pro-yearly': 'pro-yearly',
    };

    const productPath = productPaths[`${tier}-${period}`];
    if (productPath) {
      // Replace with your FastSpring store URL
      window.location.assign(`https://cryptoreportkit.onfastspring.com/${productPath}`);
    }
  };

  const tiers = [
    {
      name: 'Starter',
      key: 'starter',
      monthlyPrice: 5,
      yearlyPrice: 50,
      description: 'Perfect for getting started',
      features: [
        '10 downloads per month',
        'Basic templates',
        'Up to 25 coins per template',
        'Daily timeframes',
        'Community support',
      ],
      popular: false,
    },
    {
      name: 'Pro',
      key: 'pro',
      monthlyPrice: 12,
      yearlyPrice: 120,
      description: 'For serious crypto analysts',
      features: [
        'Unlimited downloads',
        'All template packs',
        'Up to 100 coins per template',
        'All timeframe options',
        'Scheduled exports',
        'Email support',
        'Early access to new packs',
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
            Excel templates with live crypto data. Choose your preferred option.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-sm text-emerald-400">
            <span>🔑</span>
            <span>
              <strong>BYOK:</strong> You use your own API key. Power Query keeps it in Excel; if you store keys in CRK, they’re encrypted.
            </span>
          </div>
        </div>

        {/* Pricing Type Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-gray-800 p-1 rounded-lg inline-flex items-center">
            <button
              onClick={() => setPricingType('addin')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition ${
                pricingType === 'addin'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Excel Add-in
            </button>
            <button
              onClick={() => setPricingType('onetime')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition ${
                pricingType === 'onetime'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Power Query
            </button>
            <button
              onClick={() => setPricingType('subscription')}
              className={`px-5 py-2 rounded-md text-sm font-medium transition ${
                pricingType === 'subscription'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Subscription
            </button>
          </div>
        </div>

        {/* Excel Add-in Pricing */}
        {pricingType === 'addin' && (
          <>
            <div className="text-center mb-6">
              <h2 className="text-2xl font-semibold mb-2">CRK Excel Add-in</h2>
              <p className="text-gray-400">
                70+ custom functions for live crypto data directly in Excel.
              </p>
            </div>

            {/* Billing Toggle */}
            <div className="flex justify-center mb-8">
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto mb-12">
              {ADDIN_TIERS.map((tier) => {
                const price = billingPeriod === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice;
                const perMonth = billingPeriod === 'yearly' && tier.yearlyPrice > 0
                  ? Math.round(tier.yearlyPrice / 12)
                  : tier.monthlyPrice;
                const checkoutUrl = billingPeriod === 'monthly'
                  ? (tier as any).checkoutMonthly
                  : (tier as any).checkoutYearly;

                return (
                  <div
                    key={tier.key}
                    className={`bg-gray-800 rounded-2xl border-2 ${
                      tier.popular ? 'border-emerald-500' : 'border-gray-700'
                    } p-6 relative`}
                  >
                    {tier.popular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                          MOST POPULAR
                        </span>
                      </div>
                    )}

                    <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                    <p className="text-gray-400 text-sm mb-4">{tier.description}</p>

                    <div className="mb-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">
                          {price === 0 ? 'Free' : `$${price}`}
                        </span>
                        {price > 0 && (
                          <span className="text-gray-400">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                        )}
                      </div>
                      {billingPeriod === 'yearly' && price > 0 && (
                        <p className="text-emerald-400 text-sm mt-1">
                          ${perMonth}/mo billed annually
                        </p>
                      )}
                    </div>

                    <ul className="space-y-2 mb-6 text-sm">
                      {tier.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          <span className="text-gray-300">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {price === 0 ? (
                      <Link
                        href="/addin/taskpane"
                        className="block w-full py-2.5 rounded-lg font-medium text-center bg-gray-700 hover:bg-gray-600 text-white transition"
                      >
                        Get Started Free
                      </Link>
                    ) : (
                      <a
                        href={checkoutUrl || '#'}
                        className={`block w-full py-2.5 rounded-lg font-medium text-center transition ${
                          tier.popular
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-gray-700 hover:bg-gray-600 text-white'
                        }`}
                      >
                        Get {tier.name}
                      </a>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Feature Comparison Table */}
            <div className="max-w-4xl mx-auto mb-12">
              <h3 className="text-lg font-bold text-center mb-6">Feature Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Feature</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Free</th>
                      <th className="text-center py-3 px-4 text-emerald-400 font-medium">Pro</th>
                      <th className="text-center py-3 px-4 text-purple-400 font-medium">Premium</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ADDIN_COMPARISON.map((row, i) => (
                      <tr key={i} className="border-b border-gray-800">
                        <td className="py-3 px-4 text-gray-300">{row.feature}</td>
                        <td className="py-3 px-4 text-center text-gray-400">{row.free}</td>
                        <td className="py-3 px-4 text-center text-gray-300">{row.pro}</td>
                        <td className="py-3 px-4 text-center text-gray-300">{row.premium}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Add-in Benefits */}
            <div className="max-w-3xl mx-auto mb-12">
              <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/30 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4 text-center">Why CRK Excel Add-in?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 text-lg">⚡</span>
                    <div>
                      <strong className="text-white">70+ Custom Functions</strong>
                      <p className="text-gray-400">PRICE, OHLCV, RSI, SMA, MACD, FEARGREED and more</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 text-lg">🔑</span>
                    <div>
                      <strong className="text-white">BYOK Architecture</strong>
                      <p className="text-gray-400">Your CoinGecko key, stored locally in Excel</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 text-lg">📊</span>
                    <div>
                      <strong className="text-white">Real-Time Data</strong>
                      <p className="text-gray-400">Live prices, technicals, and market data in cells</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-emerald-400 text-lg">📈</span>
                    <div>
                      <strong className="text-white">Usage Dashboard</strong>
                      <p className="text-gray-400">Track your API usage and rate limits in real time</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* One-Time Power Query Templates */}
        {pricingType === 'onetime' && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-2xl font-semibold mb-2">Power Query Templates</h2>
              <p className="text-gray-400">
                Download once, use forever. Works in Excel Desktop with Power Query.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Already purchased? <Link href="/downloads" className="text-emerald-400 underline hover:text-emerald-300">Go to Downloads</Link>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              {POWER_QUERY_TIERS.map((tier) => (
                <div
                  key={tier.key}
                  className={`bg-gray-800 rounded-2xl border-2 ${
                    tier.popular ? 'border-emerald-500' : 'border-gray-700'
                  } p-6 relative`}
                >
                  {tier.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                        BEST VALUE
                      </span>
                    </div>
                  )}

                  <h3 className="text-xl font-bold mb-1">{tier.name}</h3>
                  <p className="text-gray-400 text-sm mb-4">{tier.description}</p>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-bold">
                        {tier.price === 0 ? 'Free' : `$${tier.price}`}
                      </span>
                      {tier.price > 0 && <span className="text-gray-400">one-time</span>}
                    </div>
                  </div>

                  <ul className="space-y-2 mb-6 text-sm">
                    {tier.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">✓</span>
                        <span className="text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {tier.price === 0 ? (
                    <a
                      href={tier.downloadUrl}
                      download
                      className="block w-full py-2.5 rounded-lg font-medium text-center bg-gray-700 hover:bg-gray-600 text-white transition"
                    >
                      Download Free
                    </a>
                  ) : (
                    <a
                      href={tier.checkoutUrl}
                      className={`block w-full py-2.5 rounded-lg font-medium text-center transition ${
                        tier.popular
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                          : 'bg-gray-700 hover:bg-gray-600 text-white'
                      }`}
                    >
                      Buy {tier.name}
                    </a>
                  )}
                </div>
              ))}
            </div>

            {/* Power Query Benefits */}
            <div className="max-w-3xl mx-auto mb-12">
              <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/30 rounded-xl p-6">
                <h3 className="font-bold text-lg mb-4 text-center">Why Power Query Templates?</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-lg">🔌</span>
                    <div>
                      <strong className="text-white">No Add-in Required</strong>
                      <p className="text-gray-400">Works directly in Excel Desktop with built-in Power Query</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-lg">🔑</span>
                    <div>
                      <strong className="text-white">True BYOK</strong>
                      <p className="text-gray-400">Your API key, your data, no middleman</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-lg">⚡</span>
                    <div>
                      <strong className="text-white">Auto-Refresh</strong>
                      <p className="text-gray-400">Set up scheduled refresh every 5+ minutes</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-blue-400 text-lg">♾️</span>
                    <div>
                      <strong className="text-white">Lifetime License</strong>
                      <p className="text-gray-400">Pay once, use forever, free updates</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Subscription Pricing */}
        {pricingType === 'subscription' && (
          <>
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
                    <span className="text-gray-400">/{billingPeriod === 'monthly' ? 'mo' : 'yr'}</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <p className="text-emerald-400 text-sm mt-1">
                      ${perMonth}/mo billed annually
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

                <button
                  type="button"
                  onClick={() => handleSubscribe(tier.key, billingPeriod)}
                  disabled={profile?.subscription_tier === tier.key}
                  className={`w-full py-3 rounded-lg font-medium transition ${
                    tier.popular
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {profile?.subscription_tier === tier.key ? 'Current Plan' : `Get ${tier.name}`}
                </button>
              </div>
            );
          })}
        </div>
          </>
        )}

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
              <p className="text-gray-400 text-sm">BYOK (Bring Your Own Key) means you provide your own CoinGecko API key. In Power Query, your key stays in Excel. In the CRK app (if you choose to save a key), it’s stored encrypted. Get a key at <a href="https://www.coingecko.com/en/api/pricing?ref=cryptoreportkit" target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">coingecko.com</a>.</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="font-bold mb-2 text-white">Can I cancel anytime?</h3>
              <p className="text-gray-400 text-sm">Yes! Cancel anytime from your account. You&apos;ll keep access until the end of your billing period. No hidden fees.</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="font-bold mb-2 text-white">What&apos;s included in templates?</h3>
              <p className="text-gray-400 text-sm">Templates contain Power Query code that fetches live data using your API key. No data is stored - it&apos;s fetched fresh on each refresh.</p>
            </div>
            <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
              <h3 className="font-bold mb-2 text-white">Do I need an add-in?</h3>
              <p className="text-gray-400 text-sm">No! Power Query is built into Excel. Just paste your API key and refresh - no add-in installation required.</p>
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
