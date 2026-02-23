'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-400 mb-8">
          Have questions about CryptoReportKit? We&apos;re here to help.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-white">Email Support</h3>
                  <p className="text-gray-400">For general inquiries and support:</p>
                  <a
                    href="mailto:support@cryptoreportkit.com"
                    className="text-emerald-400 hover:text-emerald-300 font-medium"
                  >
                    support@cryptoreportkit.com
                  </a>
                </div>

                <div>
                  <h3 className="font-medium text-white">Response Time</h3>
                  <p className="text-gray-400">
                    We aim to respond to all inquiries within 24-48 business hours.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Company Information</h2>

              <div className="space-y-3 text-gray-300">
                <p>
                  <strong className="text-white">Company Name:</strong><br />
                  Ecosanskriti Innovations (OPC) Private Limited
                </p>
                <p>
                  <strong className="text-white">CIN:</strong><br />
                  U27100WB2025OPC279246
                </p>
                <p>
                  <strong className="text-white">Country:</strong><br />
                  India
                </p>
              </div>
            </div>
          </div>

          {/* Support Topics */}
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6">
              <h2 className="text-xl font-semibold mb-4">Common Topics</h2>

              <div className="space-y-4">
                <div className="border-b border-gray-700 pb-3">
                  <h3 className="font-medium text-white">Billing & Subscriptions</h3>
                  <p className="text-gray-400 text-sm">
                    Questions about your subscription, payments, or refunds?
                    Contact us via email and we&apos;ll help you promptly.
                  </p>
                </div>

                <div className="border-b border-gray-700 pb-3">
                  <h3 className="font-medium text-white">Technical Support</h3>
                  <p className="text-gray-400 text-sm">
                    Issues with dashboards, live data, or chart tools?
                    Describe your issue and we&apos;ll help resolve it.
                  </p>
                </div>

                <div className="border-b border-gray-700 pb-3">
                  <h3 className="font-medium text-white">Data Requests</h3>
                  <p className="text-gray-400 text-sm">
                    Need to access, correct, or delete your personal data?
                    See our <Link href="/privacy" className="text-emerald-400 hover:underline">Privacy Policy</Link> for details.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-white">Business Inquiries</h3>
                  <p className="text-gray-400 text-sm">
                    Interested in enterprise solutions or partnerships?
                    Reach out via email with your requirements.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-emerald-500/10 rounded-xl border border-emerald-500/20 p-6">
              <h2 className="text-lg font-semibold text-emerald-400 mb-3">About CryptoReportKit</h2>
              <p className="text-gray-400 text-sm">
                CryptoReportKit is a cryptocurrency analytics platform with 83+ interactive
                dashboards, real-time market data, and research tools. Powered by BYOK
                (Bring Your Own Key) architecture — your API key never leaves your browser.
              </p>
              <p className="text-gray-500 text-sm mt-2">
                <strong className="text-gray-300">Note:</strong> We do not provide financial advice, trading signals,
                or investment recommendations. Our tools are for informational and educational
                purposes only.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-12 pt-8 border-t border-gray-700">
          <h3 className="font-semibold mb-4">Legal & Policies</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="text-emerald-400 hover:text-emerald-300">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-emerald-400 hover:text-emerald-300">
              Privacy Policy
            </Link>
            <Link href="/refund" className="text-emerald-400 hover:text-emerald-300">
              Refund Policy
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-emerald-400 hover:text-emerald-300">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
