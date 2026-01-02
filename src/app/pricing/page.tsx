'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import Script from 'next/script';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

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
  '5 downloads per month': 'Includes standard downloads (XLSX/CSV) and Live (IQY) links for Excel refresh.',
  '50 downloads per month': 'More monthly downloads for regular Excel/CSV workflows.',
  'Unlimited downloads': 'No monthly download limits.',
  'Standard downloads (XLSX/CSV)': 'Get a snapshot file you can open in Excel/Sheets or any tool that supports CSV.',
  'Live downloads (IQY for Excel refresh)': 'One-click IQY file that imports a refreshable table into Excel (no Power Query setup needed).',
  'Standard + Live downloads': 'Includes both snapshot files and refreshable Excel IQY downloads.',
  'Customizable exports (choose columns)': 'Pick the columns you want (server-side filtering) so your exports match your spreadsheet.',
  'Live chart exports to Excel (IQY)': 'Download a refreshable Excel link for charts so tables update when you refresh.',
  'Faster refresh via authenticated endpoints': 'When using authenticated requests (e.g., add-in / API), the backend can allow shorter refresh intervals than public refresh.',
  'Community support': 'Help via community resources and docs.',
  'Email support': 'Email support for account and billing questions.',
  'Priority support': 'Faster response times for paid tiers.',
  'Everything in Pro': 'All Pro features included.',
  'API access (authenticated)': 'Use authenticated endpoints for integrations and automation.',
  'Higher limits by request': 'If you need higher limits, we can discuss a tailored setup.',
  'Priority onboarding (email)': 'Help getting your first dashboard/export workflow set up.',
};

interface PricingInfo {
  available: boolean;
  country: string;
  blocked: boolean;
  blockedMessage: string | null;
}

declare global {
  interface Window {
    Paddle?: {
      Environment: {
        set: (env: 'sandbox' | 'production') => void;
      };
      Setup: (config: { vendor: string }) => void;
      Checkout: {
        open: (config: {
          items: Array<{ priceId: string; quantity: number }>;
          customer?: { email?: string };
          customData?: Record<string, string>;
          settings?: {
            displayMode?: 'overlay' | 'inline';
            theme?: 'light' | 'dark';
            successUrl?: string;
          };
        }) => void;
      };
    };
  }
}

export default function PricingPage() {
  const { user, profile } = useAuth();
  const [pricingInfo, setPricingInfo] = useState<PricingInfo | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);
  const [waitlistError, setWaitlistError] = useState('');

  useEffect(() => {
    fetchPricingInfo();
  }, []);

  const fetchPricingInfo = async () => {
    try {
      const res = await fetch('/api/paddle/checkout');
      const data = await res.json();
      setPricingInfo(data);
      if (data.blocked) {
        setShowWaitlist(true);
      }
    } catch (error) {
      console.error('Failed to fetch pricing:', error);
    }
  };

  const initPaddle = () => {
    const vendorId = process.env.NEXT_PUBLIC_PADDLE_VENDOR_ID;
    const sandbox = process.env.NEXT_PUBLIC_PADDLE_SANDBOX === 'true';
    
    if (vendorId && window.Paddle) {
      if (sandbox) {
        window.Paddle.Environment.set('sandbox');
      }
      window.Paddle.Setup({ vendor: vendorId });
    }
  };

  const handleSubscribe = async (tier: string) => {
    // Always redirect to signup first (users create account then pay)
    if (!user) {
      window.location.href = `/signup?plan=${tier}`;
      return;
    }

    if (pricingInfo?.blocked) {
      setShowWaitlist(true);
      return;
    }

    setSelectedTier(tier);
    setIsProcessing(true);

    try {
      const res = await fetch('/api/paddle/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      });

      const data = await res.json();

      if (data.blocked) {
        setShowWaitlist(true);
        return;
      }

      if (data.provider === 'paddle' && window.Paddle) {
        window.Paddle.Checkout.open({
          items: [{ priceId: data.priceId, quantity: 1 }],
          customer: { email: user.email || undefined },
          customData: { user_id: user.id },
          settings: {
            displayMode: 'overlay',
            theme: 'dark',
            successUrl: data.config.successUrl,
          },
        });
      }
    } catch (error) {
      console.error('Checkout error:', error);
    } finally {
      setIsProcessing(false);
      setSelectedTier(null);
    }
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
      features: [
        '5 downloads per month',
        'Standard downloads (XLSX/CSV)',
        'Live downloads (IQY for Excel refresh)',
        'Community support',
      ],
      cta: 'Get Started',
      popular: false,
    },
    {
      name: 'Starter',
      key: 'starter',
      price: 19,
      features: [
        '50 downloads per month',
        'Standard + Live downloads',
        'Customizable exports (choose columns)',
        'Email support',
      ],
      cta: 'Subscribe',
      popular: false,
    },
    {
      name: 'Pro',
      key: 'pro',
      price: 49,
      features: [
        'Unlimited downloads',
        'Standard + Live downloads',
        'Live chart exports to Excel (IQY)',
        'Faster refresh via authenticated endpoints',
        'Priority support',
      ],
      cta: 'Subscribe',
      popular: true,
    },
    {
      name: 'Business',
      key: 'business',
      price: 99,
      features: [
        'Everything in Pro',
        'API access (authenticated)',
        'Higher limits by request',
        'Priority onboarding (email)',
        'Priority support',
      ],
      cta: 'Subscribe',
      popular: false,
    },
  ];

  return (
    <>
      {/* Load Paddle.js */}
      <Script
        src="https://cdn.paddle.com/paddle/v2/paddle.js"
        onLoad={initPaddle}
      />

      <div className="min-h-screen bg-gray-50 text-gray-900">
        <FreeNavbar />
        <Breadcrumb />

        {/* India Waitlist Banner */}
        {pricingInfo?.blocked && (
          <div className="bg-gradient-to-r from-orange-500 to-orange-400 py-4">
            <div className="max-w-6xl mx-auto px-4 text-center text-white">
              <p className="text-lg font-medium">
                🇮🇳 Launching in India soon with UPI payments!
                <button
                  onClick={() => setShowWaitlist(true)}
                  className="underline ml-2 hover:no-underline"
                >
                  Join the waitlist
                </button>
              </p>
            </div>
          </div>
        )}

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
              <h1 className="text-4xl font-bold">Simple, Excel-First Pricing</h1>
              <HelpIcon text="Choose a plan based on how often you download and how much automation you need. You can cancel or change plans anytime. Refunds follow our refund policy." />
            </div>
            <p className="text-gray-600 text-lg mb-2">
              Start free, upgrade when you need more. Cancel anytime.
            </p>
            <p className="text-gray-500">
              All prices in USD • Paddle handles all taxes automatically
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {tiers.map((tier) => (
              <div
                key={tier.key}
                className={`bg-white rounded-lg border ${
                  tier.popular ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'
                } p-6 relative shadow-sm`}
              >
                {tier.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <h3 className="text-xl font-bold mb-2">{tier.name}</h3>

                <div className="mb-6">
                  <span className="text-4xl font-bold">${tier.price}</span>
                  {tier.price > 0 && <span className="text-gray-600">/month</span>}
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
                    onClick={() => handleSubscribe(tier.key)}
                    disabled={isProcessing || profile?.subscription_tier === tier.key || pricingInfo?.blocked}
                    className={`w-full py-3 rounded-lg font-medium transition ${
                      tier.popular
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-900'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing && selectedTier === tier.key
                      ? 'Processing...'
                      : profile?.subscription_tier === tier.key
                      ? 'Current Plan'
                      : pricingInfo?.blocked
                      ? 'Coming Soon'
                      : tier.cta}
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Payment Info */}
          <div className="mt-12 text-center">
            <p className="text-gray-600 mb-4">Secure payments powered by</p>
            <div className="flex items-center justify-center gap-8">
              <div className="text-gray-600">🏦 Paddle</div>
              <div className="text-gray-600">💳 Cards</div>
              <div className="text-gray-600">🅿️ PayPal</div>
              <div className="text-gray-600">🌍 190+ Countries</div>
            </div>
            <p className="text-gray-500 text-sm mt-4">
              Paddle is our merchant of record and handles all billing, taxes, and compliance.
            </p>
          </div>

          {/* FAQ */}
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold mb-2">Can I cancel anytime?</h3>
                <p className="text-gray-600">Yes! Cancel anytime. You&apos;ll keep access until the end of your billing period.</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600">Credit/debit cards and PayPal. All major currencies supported.</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold mb-2">Do you offer refunds?</h3>
                <p className="text-gray-600">Refunds are available according to our refund policy.</p>
              </div>
              <div className="bg-white rounded-lg p-6 border border-gray-200 shadow-sm">
                <h3 className="font-bold mb-2">Is tax included?</h3>
                <p className="text-gray-600">Paddle adds applicable taxes at checkout based on your location.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Waitlist Modal */}
        {showWaitlist && pricingInfo?.blocked && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg max-w-md w-full p-6 border border-gray-700">
              <div className="text-center">
                <div className="text-5xl mb-4">🇮🇳</div>
                <h3 className="text-2xl font-bold mb-2">Coming Soon to India!</h3>
                <p className="text-gray-400 mb-6">
                  We&apos;re launching with UPI, cards, and all your favorite payment methods.
                  Join the waitlist to get early access and a special discount!
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
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 rounded-lg font-medium transition"
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
