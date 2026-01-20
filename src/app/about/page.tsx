'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { Mail, MapPin, Building2, Shield, FileText } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-4xl mx-auto px-4 py-12">
        <h1 className="text-4xl font-bold mb-4">About CryptoReportKit</h1>
        <p className="text-gray-400 mb-8 text-lg">
          Professional crypto analytics software for Excel
        </p>

        {/* Mission */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Our Mission</h2>
          <p className="text-gray-300 leading-relaxed">
            CryptoReportKit provides software tools that help analysts, investors, and researchers
            build professional crypto reports in Excel. We believe in giving users full control
            over their data through our BYOK (Bring Your Own Key) architecture - you provide your
            own data provider API keys, and our tools help you visualize and analyze that data.
          </p>
        </section>

        {/* What We Do */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">What We Provide</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold text-emerald-400 mb-2">Excel Templates</h3>
              <p className="text-gray-400 text-sm">
                Pre-built Excel template packs with CRK formulas. Templates contain formulas only -
                no embedded market data. Data is fetched using your own API keys.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold text-emerald-400 mb-2">CRK Excel Add-in</h3>
              <p className="text-gray-400 text-sm">
                Our Excel add-in powers the CRK formulas. Sign in, connect your API keys,
                and refresh to pull live data directly into your spreadsheets.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold text-emerald-400 mb-2">Report Builder</h3>
              <p className="text-gray-400 text-sm">
                Configure custom report packs by selecting coins, metrics, and layouts.
                Download template packs tailored to your analysis needs.
              </p>
            </div>
            <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-5">
              <h3 className="font-semibold text-emerald-400 mb-2">Educational Dashboards</h3>
              <p className="text-gray-400 text-sm">
                Our website displays market data for educational and demonstration purposes,
                showing what kind of analytics you can build with our tools.
              </p>
            </div>
          </div>
        </section>

        {/* What We Don't Do */}
        <section className="mb-12 bg-gray-800/30 border border-gray-700 rounded-xl p-6">
          <h2 className="text-2xl font-semibold text-white mb-4">What We Are Not</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1">✕</span>
              <span><strong>Not a data vendor:</strong> We don&apos;t sell, license, or redistribute market data.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1">✕</span>
              <span><strong>Not a broker:</strong> We don&apos;t execute trades or provide brokerage services.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-red-400 mt-1">✕</span>
              <span><strong>Not financial advisors:</strong> Our tools are for informational purposes only, not investment advice.</span>
            </li>
          </ul>
        </section>

        {/* Company Information */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Company Information</h2>
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-xl p-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Building2 className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">Ecosanskriti Innovations (OPC) Private Limited</p>
                  <p className="text-sm text-gray-400">One Person Company incorporated in India</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">CIN: U27100WB2025OPC279246</p>
                  <p className="text-sm text-gray-400">Corporate Identification Number</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">West Bengal, India</p>
                  <p className="text-sm text-gray-400">Registered Office Location</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-white">sasmalgiri@gmail.com</p>
                  <p className="text-sm text-gray-400">Contact Email</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Security */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold text-white mb-4">Trust & Security</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">BYOK Architecture</h3>
                <p className="text-gray-400 text-sm">
                  Your API keys are encrypted with AES-256-GCM before storage. We never see your
                  plaintext keys - they&apos;re decrypted only when making requests on your behalf.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">No Data Storage</h3>
                <p className="text-gray-400 text-sm">
                  We don&apos;t store market data. When you refresh a template, data flows directly
                  from your data provider to your Excel workbook through our proxy.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-emerald-400 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-medium text-white">Open Pricing</h3>
                <p className="text-gray-400 text-sm">
                  Our pricing is transparent. Free tier available. Paid plans coming soon with
                  clear feature differences - no hidden fees.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Legal Links */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">Legal</h2>
          <div className="flex flex-wrap gap-4">
            <Link
              href="/terms"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Privacy Policy
            </Link>
            <Link
              href="/disclaimer"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Disclaimer
            </Link>
            <Link
              href="/refund"
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition-colors"
            >
              Refund Policy
            </Link>
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-gray-800/50 border border-gray-700 rounded-xl p-6 text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Questions?</h2>
          <p className="text-gray-400 mb-4">
            We&apos;re happy to help with any questions about CryptoReportKit.
          </p>
          <a
            href="mailto:sasmalgiri@gmail.com"
            className="inline-block px-6 py-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium transition-colors"
          >
            Contact Us
          </a>
        </section>

        {/* Back Link */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <Link href="/" className="text-emerald-400 hover:text-emerald-300">
            &larr; Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
