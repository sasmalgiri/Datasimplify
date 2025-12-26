'use client';

import Link from 'next/link';

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Refund Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: December 2024</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">

          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Overview</h2>
            <p className="mb-4">
              At DataSimplify, we strive to provide high-quality cryptocurrency data and analytics services.
              We want you to be completely satisfied with your purchase. This Refund Policy outlines the
              terms and conditions for refunds on our subscription plans and services.
            </p>
            <p>
              All payments are processed securely through Paddle, our Merchant of Record. Paddle handles
              all billing, invoicing, and refund processing on our behalf.
            </p>
          </section>

          {/* Subscription Refunds */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Subscription Refunds</h2>

            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">2.1 Monthly Subscriptions</h3>
            <p className="mb-4">
              For monthly subscription plans, you may request a full refund within <strong>7 days</strong> of
              your initial purchase or renewal date if you are not satisfied with our services. After the
              7-day period, refunds will be evaluated on a case-by-case basis.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">2.2 Annual Subscriptions</h3>
            <p className="mb-4">
              For annual subscription plans, you may request a full refund within <strong>14 days</strong> of
              your initial purchase date. After this period, we may offer a prorated refund based on the
              unused portion of your subscription, minus any discounts applied.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">2.3 Free Trial</h3>
            <p>
              If you signed up for a free trial and were charged after the trial period ended, you may
              request a refund within <strong>7 days</strong> of the first charge if you forgot to cancel
              before the trial ended.
            </p>
          </section>

          {/* Data Downloads */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Data Download Purchases</h2>
            <p className="mb-4">
              Due to the nature of digital products, data downloads (Excel/CSV files) are generally
              <strong> non-refundable</strong> once downloaded, as the product has been delivered and cannot
              be &quot;returned.&quot;
            </p>
            <p className="mb-4">However, we will provide a full refund if:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>The downloaded file is corrupted or unusable</li>
              <li>The data is significantly different from what was described</li>
              <li>Technical issues on our end prevented you from accessing your purchased data</li>
              <li>You were charged in error (duplicate charges, wrong amount)</li>
            </ul>
            <p>
              Refund requests for data downloads must be made within <strong>48 hours</strong> of purchase.
            </p>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Refund Eligibility</h2>
            <p className="mb-4">To be eligible for a refund, you must meet the following criteria:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Your refund request is within the applicable time period (see above)</li>
              <li>You have not violated our Terms of Service</li>
              <li>You have not previously received a refund for the same product or service</li>
              <li>Your account has not been suspended or terminated for abuse</li>
            </ul>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
              <p className="text-yellow-800">
                <strong>Note:</strong> Refunds are not available for accounts terminated due to
                Terms of Service violations, fraudulent activity, or abuse of our platform.
              </p>
            </div>
          </section>

          {/* How to Request */}
          <section className="bg-emerald-50 border border-emerald-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. How to Request a Refund</h2>
            <p className="mb-4">To request a refund, please follow these steps:</p>
            <ol className="list-decimal list-inside space-y-3 mb-4">
              <li>
                <strong>Email us</strong> at{' '}
                <a href="mailto:sasmalgiri@gmail.com" className="text-emerald-600 hover:text-emerald-700">
                  sasmalgiri@gmail.com
                </a>
              </li>
              <li>
                <strong>Include in your email:</strong>
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600">
                  <li>Your account email address</li>
                  <li>Date of purchase</li>
                  <li>Order number or transaction ID (from your receipt)</li>
                  <li>Reason for refund request</li>
                </ul>
              </li>
              <li>
                <strong>Wait for confirmation:</strong> We will review your request and respond within
                <strong> 3-5 business days</strong>.
              </li>
            </ol>
            <p className="text-sm text-gray-600">
              You can also request a refund directly through Paddle by locating your receipt email
              and clicking the &quot;Manage Subscription&quot; or &quot;Request Refund&quot; link.
            </p>
          </section>

          {/* Processing Time */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Refund Processing</h2>
            <p className="mb-4">Once your refund request is approved:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>
                <strong>Credit/Debit Cards:</strong> Refunds typically appear within 5-10 business days,
                depending on your bank or card issuer.
              </li>
              <li>
                <strong>PayPal:</strong> Refunds are typically processed within 3-5 business days.
              </li>
              <li>
                <strong>Other Payment Methods:</strong> Processing times vary; please allow up to 14
                business days.
              </li>
            </ul>
            <p>
              Refunds will be issued to the original payment method used for the purchase. We cannot
              issue refunds to a different payment method or account.
            </p>
          </section>

          {/* Cancellation */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Subscription Cancellation</h2>
            <p className="mb-4">
              You can cancel your subscription at any time. When you cancel:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>You will retain access to premium features until the end of your current billing period</li>
              <li>Your subscription will not automatically renew</li>
              <li>No further charges will be made to your payment method</li>
              <li>Cancellation does not automatically entitle you to a refund for the current period</li>
            </ul>
            <p>
              To cancel your subscription, go to your account settings or contact us at{' '}
              <a href="mailto:sasmalgiri@gmail.com" className="text-emerald-600 hover:text-emerald-700">
                sasmalgiri@gmail.com
              </a>.
            </p>
          </section>

          {/* Currency */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Currency and Exchange Rates</h2>
            <p>
              All refunds will be processed in the original currency of the transaction. If the
              transaction was converted from your local currency, the refund amount may differ
              slightly due to exchange rate fluctuations. DataSimplify is not responsible for any
              differences in exchange rates between the time of purchase and the time of refund.
            </p>
          </section>

          {/* Disputes */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Chargebacks and Disputes</h2>
            <p className="mb-4">
              If you have an issue with your purchase, please contact us first before initiating a
              chargeback or dispute with your bank or payment provider. We are committed to resolving
              any issues quickly and fairly.
            </p>
            <p>
              Filing a chargeback without first attempting to resolve the issue with us may result in
              the suspension of your account and may affect your ability to use our services in the future.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Refund Policy or need assistance with a refund request,
              please contact us:
            </p>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-emerald-600 font-semibold">DataSimplify Support</p>
              <p>Email: <a href="mailto:sasmalgiri@gmail.com" className="text-emerald-600 hover:text-emerald-700">sasmalgiri@gmail.com</a></p>
              <p className="text-sm text-gray-500 mt-2">We typically respond within 24-48 hours.</p>
            </div>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Changes to This Policy</h2>
            <p>
              We reserve the right to modify this Refund Policy at any time. Changes will be effective
              immediately upon posting to our website. Your continued use of our services after any
              changes constitutes acceptance of the updated Refund Policy. We encourage you to review
              this policy periodically.
            </p>
          </section>

          {/* Summary Box */}
          <section className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Refund Policy Summary</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-emerald-600 font-semibold">Monthly Subscriptions:</p>
                <p className="text-gray-600">7-day refund window</p>
              </div>
              <div>
                <p className="text-emerald-600 font-semibold">Annual Subscriptions:</p>
                <p className="text-gray-600">14-day refund window</p>
              </div>
              <div>
                <p className="text-emerald-600 font-semibold">Data Downloads:</p>
                <p className="text-gray-600">48-hour window for technical issues</p>
              </div>
              <div>
                <p className="text-emerald-600 font-semibold">Processing Time:</p>
                <p className="text-gray-600">5-10 business days</p>
              </div>
              <div>
                <p className="text-emerald-600 font-semibold">Contact:</p>
                <p className="text-gray-600">sasmalgiri@gmail.com</p>
              </div>
              <div>
                <p className="text-emerald-600 font-semibold">Payment Processor:</p>
                <p className="text-gray-600">Paddle (Merchant of Record)</p>
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
