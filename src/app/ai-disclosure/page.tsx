'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function AIDisclosurePage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb customTitle="AI Disclosure" />

      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold mb-4">AI Disclosure & Usage Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: March 2026</p>

        <div className="space-y-8 text-gray-300 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Where AI is used</h2>
            <p>
              CryptoReportKit uses AI in selected features such as natural-language assistance,
              dashboard generation, summaries, and workflow support tools. AI features are designed
              to assist users, not replace independent review or professional judgment.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. No professional advice</h2>
            <p>
              AI-generated output is provided for informational assistance only. It does not constitute
              financial, investment, tax, legal, compliance, or other professional advice. You are solely
              responsible for reviewing, validating, and deciding whether to rely on any output.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Accuracy limitations</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>AI output may be inaccurate, incomplete, misleading, outdated, or biased.</li>
              <li>AI output may omit important context, warnings, or exceptions.</li>
              <li>Model behavior may change over time due to provider updates.</li>
              <li>You should independently verify important facts, calculations, code, and decisions.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Prompt and data handling</h2>
            <p className="mb-4">
              When you use AI-powered features, your prompts and relevant request context may be sent to
              our systems and to third-party model or infrastructure providers to generate a response.
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li>Avoid entering secrets, wallet seed phrases, passwords, or highly sensitive personal data.</li>
              <li>Avoid submitting third-party confidential data unless you are authorized to do so.</li>
              <li>Prompts and outputs may be logged for abuse prevention, quality improvement, or usage accounting.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. AI providers and subprocessors</h2>
            <p className="mb-4">
              AI features may rely on third-party providers and supporting infrastructure. As of March 2026,
              the primary providers used in code and infrastructure include:
            </p>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>Groq</strong> — model inference for AI responses and generation workflows</li>
              <li><strong>Vercel</strong> — application hosting and runtime infrastructure</li>
              <li><strong>Supabase</strong> — application database, auth, and storage support</li>
              <li><strong>Resend</strong> — transactional email delivery where applicable</li>
            </ul>
            <p className="mt-4">
              This list may change as features evolve. Material updates may be reflected in our{' '}
              <Link href="/privacy" className="text-emerald-400 underline hover:text-emerald-300">Privacy Policy</Link>{' '}
              and product disclosures.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Acceptable use</h2>
            <p className="mb-4">
              You may not use our AI features to generate unlawful content, infringing material, scams,
              impersonation, malware, or abusive content, or to violate third-party rights or platform rules.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Contact</h2>
            <p>
              Questions about AI features or data handling can be sent to{' '}
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