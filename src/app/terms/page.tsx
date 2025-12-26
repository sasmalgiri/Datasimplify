'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: December 2024</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to DataSimplify, operated by DataSimplify (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;). 
              These Terms of Service (&quot;Terms&quot;) govern your access to and use of our website, 
              applications, APIs, and all related services (collectively, the &quot;Services&quot;).
            </p>
            <p>
              By accessing or using our Services, you agree to be bound by these Terms, our Privacy Policy, 
              and any additional terms applicable to specific Services. If you do not agree to these Terms, 
              you must not access or use our Services.
            </p>
          </section>

          {/* Definitions */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Definitions</h2>
            <ul className="list-disc list-inside space-y-2">
              <li><strong>&quot;Services&quot;</strong> means the DataSimplify platform, website, APIs, analytics tools, downloadable reports, and all related features.</li>
              <li><strong>&quot;User&quot;</strong> or <strong>&quot;you&quot;</strong> means any individual or entity accessing or using our Services.</li>
              <li><strong>&quot;Content&quot;</strong> means all data, analytics, reports, charts, and information provided through our Services.</li>
              <li><strong>&quot;Subscription&quot;</strong> means a paid plan providing access to premium features of our Services.</li>
            </ul>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Eligibility</h2>
            <p className="mb-4">
              To use our Services, you must be at least 18 years of age and legally capable of entering 
              into binding contracts. By using our Services, you represent and warrant that you meet 
              these requirements.
            </p>
            <p>
              Our Services are not intended for use by persons in jurisdictions where such use would 
              be prohibited by law. You are responsible for compliance with all applicable local laws.
            </p>
          </section>

          {/* IMPORTANT DISCLAIMER */}
          <section className="bg-yellow-50 border border-yellow-300 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-yellow-800 mb-4">4. IMPORTANT: Not Financial Advice</h2>
            <p className="mb-4 text-yellow-900">
              <strong>DATASIMPLIFY DOES NOT PROVIDE FINANCIAL, INVESTMENT, TAX, OR LEGAL ADVICE.</strong>
            </p>
            <p className="mb-4">
              All Content provided through our Services, including but not limited to cryptocurrency data, 
              analytics, AI-generated insights, charts, reports, and any other information, is for 
              <strong> educational and informational purposes only</strong>.
            </p>
            <p className="mb-4">
              No Content should be construed as:
            </p>
            <ul className="list-disc list-inside space-y-1 mb-4">
              <li>A recommendation or solicitation to buy, sell, or hold any cryptocurrency or asset</li>
              <li>An offer or invitation to invest in any security or financial instrument</li>
              <li>Financial, investment, tax, legal, or other professional advice</li>
              <li>A guarantee of future performance or returns</li>
            </ul>
            <p className="mb-4">
              <strong>Cryptocurrency investments are highly volatile and risky.</strong> You may lose some 
              or all of your investment. Past performance is not indicative of future results.
            </p>
            <p className="text-yellow-800 font-semibold">
              Always conduct your own research (DYOR) and consult with qualified financial advisors
              before making any investment decisions. You are solely responsible for your investment choices.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Account Registration</h2>
            <p className="mb-4">To access certain features, you must create an account. When registering, you agree to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access or security breaches</li>
            </ul>
            <p className="mt-4">
              Your account is personal and non-transferable. You may not share your login credentials 
              with any third party.
            </p>
          </section>

          {/* Subscriptions and Payments */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Subscriptions and Payments</h2>

            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">6.1 Billing</h3>
            <p className="mb-4">
              Paid Subscriptions are billed in advance on a monthly or annual basis, depending on your 
              selected plan. Payments are processed securely through our payment provider, Paddle, 
              which acts as our Merchant of Record.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">6.2 Automatic Renewal</h3>
            <p className="mb-4">
              Subscriptions automatically renew at the end of each billing period unless cancelled 
              before the renewal date. You may cancel your Subscription at any time through your 
              account settings or by contacting support.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">6.3 Price Changes</h3>
            <p className="mb-4">
              We reserve the right to modify Subscription prices. Any price changes will be communicated 
              to you in advance and will apply to subsequent billing periods.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">6.4 Refund Policy</h3>
            <p>
              We offer a <strong>7-day money-back guarantee</strong> for new Subscribers. If you are not 
              satisfied within the first 7 days of your initial Subscription, contact us for a full refund. 
              After 7 days, payments are non-refundable except where required by law. Refunds for 
              annual plans will be prorated based on usage.
            </p>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Acceptable Use</h2>
            <p className="mb-4">You agree NOT to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Use the Services for any illegal or unauthorized purpose</li>
              <li>Redistribute, resell, or sublicense our Content or data without permission</li>
              <li>Use automated tools (bots, scrapers) to extract data beyond normal usage</li>
              <li>Attempt to gain unauthorized access to our systems or networks</li>
              <li>Interfere with or disrupt the integrity or performance of the Services</li>
              <li>Circumvent any security measures or access restrictions</li>
              <li>Use the Services to develop competing products</li>
              <li>Violate any applicable laws or regulations</li>
              <li>Use our Services or API to train AI/ML models without explicit authorization</li>
            </ul>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Intellectual Property</h2>
            <p className="mb-4">
              All Content, features, and functionality of our Services, including but not limited to 
              text, graphics, logos, data, software, and analytics, are owned by DataSimplify or our 
              licensors and are protected by intellectual property laws.
            </p>
            <p>
              Your Subscription grants you a limited, non-exclusive, non-transferable license to access 
              and use the Services for your personal or internal business purposes. You may not copy, 
              modify, distribute, or create derivative works without our prior written consent.
            </p>
          </section>

          {/* Data Accuracy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Data Accuracy and Third-Party Sources</h2>
            <p className="mb-4">
              Our Content is compiled from various third-party sources including cryptocurrency exchanges, 
              market data providers, and public blockchain data. While we strive to provide accurate 
              and up-to-date information, we cannot guarantee the accuracy, completeness, reliability, 
              or timeliness of any Content.
            </p>
            <p>
              Data may be delayed, contain errors, or become outdated. You acknowledge that any reliance 
              on our Content is at your own risk. We recommend verifying critical information from 
              multiple sources before making any decisions.
            </p>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, DATASIMPLIFY SHALL NOT BE LIABLE FOR ANY 
              INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT 
              LIMITED TO:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Loss of profits, revenue, or data</li>
              <li>Financial losses from investment decisions</li>
              <li>Business interruption</li>
              <li>Cost of substitute services</li>
              <li>Any damages arising from use of or inability to use our Services</li>
            </ul>
            <p>
              OUR TOTAL LIABILITY SHALL NOT EXCEED THE AMOUNT PAID BY YOU TO US IN THE TWELVE (12) 
              MONTHS PRECEDING THE CLAIM.
            </p>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless DataSimplify and its officers, directors, 
              employees, and agents from any claims, damages, losses, costs, and expenses (including 
              reasonable legal fees) arising from your use of the Services, violation of these Terms, 
              or infringement of any third-party rights.
            </p>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Disclaimer of Warranties</h2>
            <p className="mb-4">
              THE SERVICES ARE PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND, 
              EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
              MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p>
              We do not warrant that the Services will be uninterrupted, error-free, secure, or free 
              of viruses or other harmful components.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Termination</h2>
            <p className="mb-4">
              We may suspend or terminate your access to the Services at any time, with or without 
              cause, and with or without notice. You may terminate your account at any time by 
              contacting us or through your account settings.
            </p>
            <p>
              Upon termination, your right to use the Services will immediately cease. Provisions 
              that by their nature should survive termination shall survive, including ownership, 
              warranty disclaimers, indemnity, and limitations of liability.
            </p>
          </section>

          {/* Modifications */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material 
              changes by posting the updated Terms on our website or by email. Your continued use of 
              the Services after such changes constitutes acceptance of the modified Terms. It is your 
              responsibility to review these Terms periodically.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Governing Law and Disputes</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of India, 
              without regard to conflict of law principles.
            </p>
            <p>
              Any disputes arising from these Terms or use of the Services shall be resolved through 
              good faith negotiation. If negotiation fails, disputes shall be submitted to the 
              exclusive jurisdiction of the courts located in Kolkata, India.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision 
              shall be limited or eliminated to the minimum extent necessary, and the remaining 
              provisions shall remain in full force and effect.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <p className="text-emerald-600">
              Email: sasmalgiri@gmail.com
            </p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-4">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700">← Back to Home</Link>
          <span className="text-gray-400">|</span>
          <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700">Privacy Policy</Link>
        </div>
      </div>
    </div>
  );
}
