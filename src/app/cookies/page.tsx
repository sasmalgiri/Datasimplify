'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb customTitle="Cookie Policy" />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">Cookie Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: March 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. What this policy covers</h2>
            <p>
              This Cookie Policy explains how CryptoReportKit uses cookies, local storage, and similar
              technologies on our website. It should be read together with our{' '}
              <Link href="/privacy" className="text-emerald-400 underline hover:text-emerald-300">
                Privacy Policy
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Cookies and local storage we use</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-700">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-800 text-left text-gray-200">
                  <tr>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Purpose</th>
                    <th className="px-4 py-3">Examples</th>
                    <th className="px-4 py-3">Retention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800 bg-gray-900/60 text-gray-300">
                  <tr>
                    <td className="px-4 py-3 font-medium text-white">Necessary</td>
                    <td className="px-4 py-3">Security, authentication, core site operation, and user settings.</td>
                    <td className="px-4 py-3">Authentication/session cookies, app preferences.</td>
                    <td className="px-4 py-3">Session or until cleared.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-white">Analytics</td>
                    <td className="px-4 py-3">Measure traffic and improve site performance.</td>
                    <td className="px-4 py-3">Vercel Analytics, aggregated usage events.</td>
                    <td className="px-4 py-3">Depends on vendor settings and your consent choice.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-white">Functional</td>
                    <td className="px-4 py-3">Remember dashboard or interface preferences you choose.</td>
                    <td className="px-4 py-3">Theme or interface settings stored locally.</td>
                    <td className="px-4 py-3">Until changed or cleared.</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 font-medium text-white">Consent</td>
                    <td className="px-4 py-3">Store your cookie preferences.</td>
                    <td className="px-4 py-3">Local storage key: <span className="text-emerald-400">cookie-consent</span>.</td>
                    <td className="px-4 py-3">Until updated or cleared.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Marketing cookies</h2>
            <p>
              Our consent controls include a marketing category for future use, but we do not currently
              operate behavioral advertising or third-party ad-targeting cookies on the public site.
              If that changes, we will update this policy and our consent controls before enabling them.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. How to control cookies</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Use the cookie settings control in the site footer.</li>
              <li>Manage browser cookie and local storage settings directly in your browser.</li>
              <li>Clear local storage if you want to reset your consent preferences.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Contact</h2>
            <p>
              If you have questions about cookies or tracking technologies, contact us at{' '}
              <a href="mailto:support@cryptoreportkit.com" className="text-emerald-400 underline hover:text-emerald-300">
                support@cryptoreportkit.com
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}