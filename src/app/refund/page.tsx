'use client';

import Link from 'next/link';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: January 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          {/* Money-Back Guarantee Hero */}
          <section className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl">
            <div className="text-center">
              <span className="text-5xl mb-4 block">💰</span>
              <h2 className="text-3xl font-bold text-emerald-700 mb-4">30-Day Money-Back Guarantee</h2>
              <p className="text-lg text-gray-700">
                We offer a <strong>full refund within 30 days</strong> of your initial subscription purchase,
                no questions asked.
              </p>
            </div>
          </section>

          {/* How It Works */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-2xl mb-3">1️⃣</div>
                <h3 className="font-semibold text-gray-900 mb-2">Find Your Receipt</h3>
                <p className="text-sm text-gray-600">
                  Check your email for the payment receipt from Paddle
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-2xl mb-3">2️⃣</div>
                <h3 className="font-semibold text-gray-900 mb-2">Request Refund</h3>
                <p className="text-sm text-gray-600">
                  Click &quot;Manage Subscription&quot; in the receipt email
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-2xl mb-3">3️⃣</div>
                <h3 className="font-semibold text-gray-900 mb-2">Get Your Money Back</h3>
                <p className="text-sm text-gray-600">
                  Refund processed within 5-10 business days
                </p>
              </div>
            </div>
          </section>

          {/* Subscription Refunds */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Subscription Refunds</h2>
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-2">Monthly & Annual Plans</h3>
                <ul className="space-y-2">
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span><strong>30-day window:</strong> Full refund available, no questions asked</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span><strong>Self-service:</strong> Request directly through Paddle - no need to email us</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="text-emerald-500 mt-1">✓</span>
                    <span><strong>After 30 days:</strong> Cancel anytime to stop future billing (no refund for current period)</span>
                  </li>
                </ul>
              </div>

              <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2">Free Trial Conversions</h3>
                <p className="text-gray-600">
                  If you were charged after a free trial ended, you have <strong>30 days</strong> from the first
                  charge to request a full refund if you forgot to cancel.
                </p>
              </div>

              <div className="bg-purple-50 p-5 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-2">Annual Renewals (UK/EU Customers)</h3>
                <p className="text-gray-600">
                  In compliance with UK DMCC Act 2024 and EU Consumer Rights Directive, you have an additional
                  <strong> 14-day cooling-off period</strong> when your annual subscription renews for another
                  12+ month term.
                </p>
              </div>
            </div>
          </section>

          {/* Excel Templates */}
          <section className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Excel Templates</h2>
            <p className="mb-4">
              Our Excel templates contain <strong>formulas only</strong> - they do not include embedded market data.
              Data is fetched via the CryptoSheets add-in when you open the file in Microsoft Excel.
            </p>
            <ul className="space-y-3 mb-4">
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">ℹ️</span>
                <span>
                  <strong>Template purchases:</strong> Follow the same 30-day refund policy as subscriptions
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-600 mt-1">ℹ️</span>
                <span>
                  <strong>CryptoSheets required:</strong> Templates require the CryptoSheets add-in (a third-party
                  product) to fetch live data. Ensure you meet the{' '}
                  <Link href="/template-requirements" className="text-emerald-600 underline">requirements</Link>
                  {' '}before purchasing.
                </span>
              </li>
            </ul>
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> DataSimplify provides software tools (templates with formulas), not market data.
              See our <Link href="/disclaimer" className="text-emerald-600 underline">Disclaimer</Link> for details.
            </p>
          </section>

          {/* How to Request */}
          <section className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
            <p className="mb-4">
              You can request a refund directly through Paddle (our payment provider):
            </p>
            <ol className="list-decimal list-inside space-y-3 mb-6">
              <li>
                <strong>Find your receipt email</strong> from Paddle (search for &quot;DataSimplify receipt&quot;)
              </li>
              <li>
                <strong>Click &quot;Manage Subscription&quot;</strong> or &quot;Manage this Subscription&quot; link
              </li>
              <li>
                <strong>Select &quot;Request Refund&quot;</strong> or &quot;Cancel Subscription&quot;
              </li>
              <li>
                <strong>Confirm your request</strong> - Paddle will process it automatically
              </li>
            </ol>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Can&apos;t find your receipt?</strong> Search for emails from &quot;paddle.com&quot; or
                visit{' '}
                <a
                  href="https://paddle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  paddle.com
                </a>
                {' '}to use their customer lookup feature.
              </p>
            </div>
          </section>

          {/* Processing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Processing</h2>
            <p className="mb-4">
              Refunds are processed through <strong>Paddle</strong> (our Merchant of Record) and typically
              appear in your account within:
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Credit/Debit Cards: 5-10 business days</li>
              <li>PayPal: 3-5 business days</li>
              <li>Other methods: Up to 14 business days</li>
            </ul>
          </section>

          {/* Regional Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Your Regional Rights</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-blue-700 mb-2">🇪🇺 European Union</h3>
                <p className="text-sm text-gray-600">
                  Under the EU Consumer Rights Directive, you have a <strong>14-day cooling-off period</strong> for
                  online purchases. Our 30-day guarantee exceeds this requirement.
                </p>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-blue-700 mb-2">🇬🇧 United Kingdom</h3>
                <p className="text-sm text-gray-600">
                  Under the UK DMCC Act 2024, you have <strong>14-day cooling-off rights</strong> plus additional
                  protections for subscription renewals. Our policy exceeds these requirements.
                </p>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-blue-700 mb-2">🇺🇸 United States</h3>
                <p className="text-sm text-gray-600">
                  While US federal law doesn&apos;t mandate cooling-off periods for digital services, our 30-day
                  guarantee provides you with comprehensive protection.
                </p>
              </div>
              <div className="bg-white p-5 rounded-lg border border-gray-200">
                <h3 className="font-semibold text-blue-700 mb-2">🌍 Other Regions</h3>
                <p className="text-sm text-gray-600">
                  Where local law provides greater protection than our policy, your statutory rights will apply.
                  Our 30-day guarantee is a minimum standard.
                </p>
              </div>
            </div>
          </section>

          {/* Chargebacks */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Chargebacks</h2>
            <p className="mb-4">
              We encourage you to request refunds through Paddle rather than filing chargebacks with your
              bank. Our 30-day refund process is quick and hassle-free.
            </p>
            <p className="text-gray-600">
              <strong>Note:</strong> Fraudulent chargebacks may result in account termination and may
              affect your ability to use our services in the future.
            </p>
          </section>

          {/* Paddle Note */}
          <section className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">About Paddle</h2>
            <p className="text-sm text-gray-600">
              <strong>Paddle</strong> is our Merchant of Record and handles all payment processing, billing,
              and refunds on our behalf. By subscribing to DataSimplify, you also agree to{' '}
              <a
                href="https://www.paddle.com/legal/terms"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 underline"
              >
                Paddle&apos;s Terms of Service
              </a>
              .
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Help?</h2>
            <p className="mb-4">
              While most refunds can be handled directly through Paddle, if you have any questions or
              issues, contact us:
            </p>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm inline-block">
              <p className="text-emerald-600 font-semibold">DataSimplify Support</p>
              <p>Email: <a href="mailto:sasmalgiri@gmail.com" className="text-emerald-600 hover:text-emerald-700">sasmalgiri@gmail.com</a></p>
            </div>
          </section>

          {/* Summary Box */}
          <section className="bg-white border-2 border-emerald-200 p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Refund Policy Summary</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-emerald-700 font-bold text-2xl">30 Days</p>
                <p className="text-gray-600">Money-back guarantee</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-700 font-bold text-2xl">Self-Service</p>
                <p className="text-gray-600">Via Paddle receipt</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-purple-700 font-bold text-2xl">5-10 Days</p>
                <p className="text-gray-600">Processing time</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-700 font-bold text-2xl">EU/UK</p>
                <p className="text-gray-600">Compliant</p>
              </div>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex flex-wrap gap-4">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700">&larr; Back to Home</Link>
          <span className="text-gray-400">|</span>
          <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">Terms of Service</Link>
          <span className="text-gray-400">|</span>
          <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
