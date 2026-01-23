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
                <h3 className="font-semibold text-gray-900 mb-2">Contact Us</h3>
                <p className="text-sm text-gray-600">
                  Email support@cryptoreportkit.com with your request
                </p>
              </div>
              <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
                <div className="text-2xl mb-3">2️⃣</div>
                <h3 className="font-semibold text-gray-900 mb-2">Request Refund</h3>
                <p className="text-sm text-gray-600">
                  Provide your email and purchase details
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
                    <span><strong>Easy process:</strong> Contact us via email to request a refund</span>
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
                  In compliance with UK Consumer Rights and EU Consumer Rights Directive, you have an additional
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
              Data is fetched via the CRK Excel add-in using your own API keys when you open the file in Microsoft Excel.
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
                  <strong>CRK Add-in + API Key required:</strong> Templates require the CryptoReportKit Excel add-in
                  and your own data provider API key (e.g., CoinGecko) to fetch live data. Ensure you meet the{' '}
                  <Link href="/template-requirements" className="text-emerald-600 underline">requirements</Link>
                  {' '}before purchasing.
                </span>
              </li>
            </ul>
            <p className="text-sm text-gray-600">
              <strong>Note:</strong> CryptoReportKit provides software tools (templates with formulas), not market data.
              See our <Link href="/disclaimer" className="text-emerald-600 underline">Disclaimer</Link> for details.
            </p>
          </section>

          {/* How to Request */}
          <section className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
            <p className="mb-4">
              To request a refund, simply contact us:
            </p>
            <ol className="list-decimal list-inside space-y-3 mb-6">
              <li>
                <strong>Email us</strong> at support@cryptoreportkit.com with subject &quot;Refund Request&quot;
              </li>
              <li>
                <strong>Include your details</strong> - email address used for purchase and purchase date
              </li>
              <li>
                <strong>We&apos;ll confirm</strong> your refund request within 24-48 hours
              </li>
              <li>
                <strong>Receive your refund</strong> - processed to your original payment method
              </li>
            </ol>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600">
                <strong>Need help?</strong> If you have any issues with your refund request, email us at
                support@cryptoreportkit.com and we&apos;ll assist you promptly.
              </p>
            </div>
          </section>

          {/* Processing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Processing</h2>
            <p className="mb-4">
              Once approved, refunds typically appear in your account within:
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
                  Under UK Consumer Rights regulations, you have <strong>14-day cooling-off rights</strong> plus additional
                  protections for subscription renewals. Our 30-day policy exceeds these requirements.
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
              We encourage you to request refunds directly from us rather than filing chargebacks with your
              bank. Our 30-day refund process is quick and hassle-free.
            </p>
            <p className="text-gray-600">
              <strong>Note:</strong> Fraudulent chargebacks may result in account termination and may
              affect your ability to use our services in the future.
            </p>
          </section>

          {/* Payment Note */}
          <section className="bg-amber-50 p-6 rounded-lg border border-amber-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-3">Payment Processing</h2>
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Paid plans and payment processing are coming soon. Once payment processing
              is available, refund requests can be made within 30 days of purchase by contacting us at
              support@cryptoreportkit.com.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Help?</h2>
            <p className="mb-4">
              If you have any questions or issues with refunds, contact us:
            </p>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm inline-block">
              <p className="text-emerald-600 font-semibold">CryptoReportKit Support</p>
              <p>Email: <a href="mailto:support@cryptoreportkit.com" className="text-emerald-600 hover:text-emerald-700">support@cryptoreportkit.com</a></p>
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
                <p className="text-blue-700 font-bold text-2xl">Easy</p>
                <p className="text-gray-600">Email request</p>
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
