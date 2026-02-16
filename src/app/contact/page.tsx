'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
        <p className="text-gray-600 mb-8">
          Have questions about CryptoReportKit? We&apos;re here to help.
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Information */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Get in Touch</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900">Email Support</h3>
                  <p className="text-gray-600">For general inquiries and support:</p>
                  <a
                    href="mailto:support@cryptoreportkit.com"
                    className="text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    support@cryptoreportkit.com
                  </a>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900">Response Time</h3>
                  <p className="text-gray-600">
                    We aim to respond to all inquiries within 24-48 business hours.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Company Information</h2>

              <div className="space-y-3 text-gray-700">
                <p>
                  <strong>Company Name:</strong><br />
                  Ecosanskriti Innovations (OPC) Private Limited
                </p>
                <p>
                  <strong>CIN:</strong><br />
                  U27100WB2025OPC279246
                </p>
                <p>
                  <strong>Country:</strong><br />
                  India
                </p>
              </div>
            </div>
          </div>

          {/* Support Topics */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-xl font-semibold mb-4">Common Topics</h2>

              <div className="space-y-4">
                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-medium text-gray-900">Billing & Subscriptions</h3>
                  <p className="text-gray-600 text-sm">
                    Questions about your subscription, payments, or refunds?
                    Contact us via email and we&apos;ll help you promptly.
                  </p>
                </div>

                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-medium text-gray-900">Technical Support</h3>
                  <p className="text-gray-600 text-sm">
                    Issues with templates, Excel integrations, or chart tools?
                    Describe your issue and we&apos;ll help resolve it.
                  </p>
                </div>

                <div className="border-b border-gray-100 pb-3">
                  <h3 className="font-medium text-gray-900">Data Requests</h3>
                  <p className="text-gray-600 text-sm">
                    Need to access, correct, or delete your personal data?
                    See our <Link href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</Link> for details.
                  </p>
                </div>

                <div>
                  <h3 className="font-medium text-gray-900">Business Inquiries</h3>
                  <p className="text-gray-600 text-sm">
                    Interested in enterprise solutions or partnerships?
                    Reach out via email with your requirements.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-3">About CryptoReportKit</h2>
              <p className="text-blue-700 text-sm">
                CryptoReportKit is a cryptocurrency research and comparison tool designed for
                researchers, analysts, and educators. We provide static Excel templates with
                prefetched data using BYOK (bring your own API key) architecture.
              </p>
              <p className="text-blue-700 text-sm mt-2">
                <strong>Note:</strong> We do not provide financial advice, trading signals,
                or investment recommendations. Our tools are for informational and educational
                purposes only.
              </p>
            </div>
          </div>
        </div>

        {/* Legal Links */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <h3 className="font-semibold mb-4">Legal & Policies</h3>
          <div className="flex flex-wrap gap-4">
            <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">
              Privacy Policy
            </Link>
            <Link href="/refund" className="text-emerald-600 hover:text-emerald-700">
              Refund Policy
            </Link>
          </div>
        </div>

        <div className="mt-8">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
