'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb customTitle="Community Guidelines" />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">Community Guidelines & Moderation Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: March 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Purpose</h2>
            <p>
              The CryptoReportKit community is intended for respectful discussion, market education,
              research sharing, and product-related collaboration. It is not a venue for scams,
              harassment, impersonation, or guaranteed-profit claims.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. What is allowed</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Good-faith discussion about crypto markets, analytics, tools, and workflows</li>
              <li>Sharing research, educational viewpoints, and personal experience</li>
              <li>Constructive product feedback and support questions</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. What is prohibited</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Harassment, hate, threats, bullying, or doxxing</li>
              <li>Scams, phishing, wallet-drain schemes, fake giveaways, or deceptive links</li>
              <li>Guaranteed returns, undisclosed promotions, or misleading investment claims</li>
              <li>Spam, repetitive promotion, or irrelevant self-promotion</li>
              <li>Infringing, unlawful, or confidential third-party content</li>
              <li>Posting personal or sensitive data without authorization</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Reporting and moderation workflow</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>Signed-in users may report threads or replies for moderator review.</li>
              <li>Reports are reviewed manually based on severity, context, and repeat behavior.</li>
              <li>Moderation actions may include warning, content removal, thread locking, or account restriction.</li>
              <li>We may preserve content and logs when reasonably necessary for safety, legal compliance, or dispute handling.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Appeals</h2>
            <p>
              If you believe moderation action was taken in error, contact{' '}
              <a href="mailto:support@cryptoreportkit.com" className="text-emerald-400 underline hover:text-emerald-300">
                support@cryptoreportkit.com
              </a>{' '}
              with the subject line <strong>Community Appeal</strong> and include the affected content or thread link.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Your responsibilities</h2>
            <p>
              You remain responsible for content you post. By posting, you confirm you have the right to share it,
              and you grant us a limited operational license to host, display, moderate, and process that content to run the service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Related documents</h2>
            <div className="flex flex-wrap gap-4 text-sm">
              <Link href="/terms" className="text-emerald-400 underline hover:text-emerald-300">Terms of Service</Link>
              <Link href="/privacy" className="text-emerald-400 underline hover:text-emerald-300">Privacy Policy</Link>
              <Link href="/disclaimer" className="text-emerald-400 underline hover:text-emerald-300">Disclaimer</Link>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}