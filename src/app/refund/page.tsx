'use client';

import Link from 'next/link';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: December 2024</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          {/* Money-Back Guarantee Hero */}
          <section className="bg-emerald-50 border border-emerald-200 p-8 rounded-xl">
            <div className="text-center">
              <span className="text-5xl mb-4 block">💰</span>
              <h2 className="text-3xl font-bold text-emerald-700 mb-4">7-Day Money-Back Guarantee</h2>
              <p className="text-lg text-gray-700">
                We offer a <strong>full refund within 7 days</strong> of your initial subscription purchase,
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
                  Click &quot;Manage Subscription&quot; or &quot;Request Refund&quot; in the receipt email
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

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Eligibility</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>Refunds are available within <strong>7 days</strong> from the date of your first payment</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>Request directly through Paddle - no need to email us</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>No questions asked during the 7-day window</span>
              </li>
            </ul>
          </section>

          {/* Request a Refund */}
          <section className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">How to Request a Refund</h2>
            <p className="mb-4">
              You can request a refund directly through Paddle (our payment provider) without contacting us:
            </p>
            <ol className="list-decimal list-inside space-y-3 mb-6">
              <li>
                <strong>Find your receipt email</strong> from Paddle (check your inbox for &quot;Your DataSimplify receipt&quot;)
              </li>
              <li>
                <strong>Click &quot;Manage Subscription&quot;</strong> or &quot;Manage this Subscription&quot; link in the email
              </li>
              <li>
                <strong>Select &quot;Request Refund&quot;</strong> or &quot;Cancel Subscription&quot; option
              </li>
              <li>
                <strong>Confirm your request</strong> - Paddle will process your refund automatically
              </li>
            </ol>
            <div className="bg-white p-4 rounded-lg border border-blue-100">
              <p className="text-sm text-gray-600">
                <strong>Can&apos;t find your receipt?</strong> Check your spam folder or search for emails from
                &quot;paddle.com&quot; or &quot;paddle.net&quot;. You can also visit{' '}
                <a
                  href="https://paddle.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700 underline"
                >
                  paddle.com
                </a>
                {' '}and use their customer lookup feature.
              </p>
            </div>
          </section>

          {/* Processing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Refund Processing</h2>
            <p className="mb-4">
              Refunds are processed through <strong>Paddle</strong> (our Merchant of Record) and typically
              appear in your account within <strong>5-10 business days</strong>, depending on your bank or
              payment provider.
            </p>
            <ul className="list-disc list-inside space-y-2 text-gray-600">
              <li>Credit/Debit Cards: 5-10 business days</li>
              <li>PayPal: 3-5 business days</li>
              <li>Other methods: Up to 14 business days</li>
            </ul>
          </section>

          {/* After 7 Days */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">After the 7-Day Window</h2>
            <p className="mb-4">
              Payments are <strong>non-refundable</strong> after the 7-day window, except where required
              by applicable law.
            </p>
            <p>
              You can still cancel your subscription at any time to prevent future charges. Your access
              will continue until the end of your current billing period.
            </p>
          </section>

          {/* Annual Plans */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Annual Subscriptions</h2>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <span className="text-emerald-500 mt-1">✓</span>
                <span>
                  <strong>Within 7 days:</strong> Full refund available, no questions asked
                </span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-yellow-500 mt-1">→</span>
                <span>
                  <strong>After 7 days:</strong> Cancellation stops future billing, but no refund is provided
                  for the remaining period
                </span>
              </li>
            </ul>
          </section>

          {/* Chargebacks */}
          <section className="bg-yellow-50 border border-yellow-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Chargebacks</h2>
            <p className="mb-4">
              We encourage you to request refunds through Paddle rather than filing chargebacks with your
              bank. Our 7-day refund process is quick and hassle-free.
            </p>
            <p className="text-yellow-800">
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
              . This ensures secure payment processing and easy refund management.
            </p>
          </section>

          {/* Contact - Optional */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Need Help?</h2>
            <p className="mb-4">
              While most refunds can be handled directly through Paddle, if you have any questions or
              issues, you can reach us at:
            </p>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm inline-block">
              <p className="text-emerald-600 font-semibold">DataSimplify Support</p>
              <p>Email: <a href="mailto:sasmalgiri@gmail.com" className="text-emerald-600 hover:text-emerald-700">sasmalgiri@gmail.com</a></p>
            </div>
          </section>

          {/* Summary Box */}
          <section className="bg-white border-2 border-emerald-200 p-6 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 text-center">Refund Policy Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="text-center p-3 bg-emerald-50 rounded-lg">
                <p className="text-emerald-700 font-bold text-2xl">7 Days</p>
                <p className="text-gray-600">Money-back guarantee</p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-blue-700 font-bold text-2xl">Self-Service</p>
                <p className="text-gray-600">Request via Paddle receipt</p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-purple-700 font-bold text-2xl">5-10 Days</p>
                <p className="text-gray-600">Processing time</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <p className="text-gray-700 font-bold text-2xl">No Questions</p>
                <p className="text-gray-600">Asked within 7 days</p>
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
