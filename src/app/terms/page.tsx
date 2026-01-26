'use client';

import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
        <p className="text-gray-600 mb-8">Last updated: January 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="mb-4">
              Welcome to CryptoReportKit, a product of <strong>Ecosanskriti Innovations (OPC) Private Limited</strong>,
              a company registered in India (CIN: U27100WB2025OPC279246), referred to as &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;.
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
              <li><strong>&quot;Services&quot;</strong> means the CryptoReportKit platform, website, Excel templates (containing formulas only), analytics tools, and all related features.</li>
              <li><strong>&quot;User&quot;</strong> or <strong>&quot;you&quot;</strong> means any individual or entity accessing or using our Services.</li>
              <li><strong>&quot;Content&quot;</strong> means all analytics visualizations, templates, charts, and educational information provided through our Services.</li>
              <li><strong>&quot;Templates&quot;</strong> means Excel files containing CRK formulas (no embedded data) that fetch live data via the CRK Excel add-in on your machine using your own API keys (BYOK).</li>
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
              <strong>CRYPTOREPORTKIT DOES NOT PROVIDE FINANCIAL, INVESTMENT, TAX, OR LEGAL ADVICE.</strong>
            </p>
            <p className="mb-4">
              All Content provided through our Services, including but not limited to cryptocurrency visualizations,
              analytics, technical indicators, charts, templates, and any other information, is for
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

          {/* Product Scope */}
          <section className="bg-blue-50 border border-blue-300 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4">5. Market Data, Dashboards, and Data Rights</h2>

            <h3 className="text-xl font-semibold text-blue-900 mb-3 mt-4">5.1 We Are Not a Data Vendor</h3>
            <p className="mb-4">
              CryptoReportKit provides <strong>software tools</strong> (Excel templates, add-ins, formulas) —
              we are <strong>not a data vendor</strong> and do not sell, license, or redistribute market data as a product.
            </p>

            <h3 className="text-xl font-semibold text-blue-900 mb-3 mt-4">5.2 Display-Only Dashboards (Website)</h3>
            <p className="mb-4">
              Our website includes <strong>display-only dashboards</strong> (e.g., /market, /research) that show
              educational visualizations of cryptocurrency market data sourced from third-party APIs. These dashboards:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong>Educational Purpose Only:</strong> For research, learning, and general informational purposes</li>
              <li><strong>Not Investment Advice:</strong> Do not constitute financial or investment recommendations</li>
              <li><strong>Public Display Use:</strong> Displayed publicly on our website. We aim to comply with provider terms; use is subject to provider policies; availability may change.</li>
              <li><strong>Not for Redistribution:</strong> You may not scrape, export, or redistribute this data commercially</li>
              <li><strong>Attribution Provided:</strong> Required attribution (e.g., &quot;Powered by CoinGecko API&quot;)
                is displayed in-product wherever provider data is shown, including loading states. See our{' '}
                <a href="/data-sources" className="underline text-blue-700">Data Sources</a> page for the full list of providers.</li>
            </ul>

            <h3 className="text-xl font-semibold text-blue-900 mb-3 mt-4">5.3 BYOK (Bring Your Own Keys) Software Tools</h3>
            <p className="mb-4">
              Our Excel add-in and templates operate on a <strong>BYOK (Bring Your Own Key)</strong> model:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
              <li><strong>Your Own API Keys:</strong> You provide your own API keys from data providers (CoinGecko, CoinMarketCap, etc.)</li>
              <li><strong>Formulas Only:</strong> Excel templates contain formulas, not embedded market data</li>
              <li><strong>Server-Proxy Architecture:</strong> When you use the CRK add-in, our server proxies requests
                using your encrypted API keys, calling providers on your behalf</li>
              <li><strong>Your Responsibility:</strong> You must comply with your data provider&apos;s terms of use,
                rate limits, and acceptable use policies</li>
              <li><strong>Data Ownership:</strong> Data fetched via your API keys belongs to you and the provider,
                not to CryptoReportKit</li>
            </ul>

            <h3 className="text-xl font-semibold text-blue-900 mb-3 mt-4">5.4 Third-Party Data Providers</h3>

            <p className="mb-4">
              <strong>Provider Ownership & Rights:</strong> All market data displayed on our platform or accessed via
              the CRK add-in is sourced from third-party data providers, including but not limited to{' '}
              <strong>CoinGecko</strong> (cryptocurrency market data) and others listed on our{' '}
              <a href="/data-sources" className="underline text-blue-700">Data Sources</a> page.
              This data remains the <strong>intellectual property of the respective providers</strong>.
              CryptoReportKit does not claim ownership of provider data.
            </p>

            <p className="mb-4">
              <strong>We Do Not Sell or Sublicense Data:</strong> CryptoReportKit <strong>does not sublicense, sell,
              syndicate, or redistribute provider API keys, credentials, or data</strong> as a standalone product. When using our
              BYOK (Bring Your Own Keys) tools, you are accessing data directly from providers using your own API keys.
              When using our website dashboards, we display data for educational and informational purposes in compliance
              with provider terms.
            </p>

            <p className="mb-4">
              <strong>Required Provider Attribution:</strong> We display required attribution (e.g., &quot;Powered by
              CoinGecko API&quot;) <strong>in-product wherever provider data is shown</strong>, including in loading states,
              error states, and data displays. This ensures compliance with provider terms of service. A full list of data
              providers is available on our <a href="/data-sources" className="underline text-blue-700">Data Sources</a> page.
            </p>

            <p className="mb-4">
              <strong>Your Compliance Obligations:</strong> When using our Services, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4 ml-4">
              <li>Review and comply with each provider&apos;s terms of service (see{' '}
                <a href="/data-sources" className="underline text-blue-700">Data Sources</a>)</li>
              <li>Respect rate limits and usage restrictions of your API tier (free, pro, etc.)</li>
              <li>Not violate provider policies (e.g., no unauthorized resale of data obtained via your keys)</li>
              <li>Understand that CryptoReportKit is not liable for provider API downtime, data accuracy, or policy changes</li>
              <li>Acknowledge that provider terms may change and it is your responsibility to remain compliant</li>
            </ul>

            <p className="mb-4">
              <strong>Server-Side Caching:</strong> To improve performance and reduce API load, we may cache data
              server-side with a Time-to-Live (TTL) of <strong>up to 24 hours</strong>. Cached data is refreshed
              regularly to ensure compliance with provider requirements (e.g., CoinGecko expects data to be refreshed
              at least every 24 hours). You acknowledge that data displayed on our website may be cached and may not
              reflect real-time information.
            </p>

            <p className="text-blue-800 font-semibold">
              <strong>Summary:</strong> Provider data is their property. We display it in-product with proper attribution.
              We do not resell or sublicense access. You must comply with provider terms when using BYOK features.
            </p>

            <h3 className="text-xl font-semibold text-blue-900 mb-3 mt-4">5.5 No Trading Execution</h3>
            <p className="mb-4">
              We do not offer order routing, brokerage, or trading services of any kind. We are not a broker-dealer or exchange.
            </p>

            <p className="text-blue-800 font-semibold">
              See our <a href="/template-requirements" className="underline">Template Requirements</a> page for
              detailed setup instructions and <a href="/disclaimer" className="underline">Disclaimer</a> for full details.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Account Registration</h2>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Subscriptions and Payments</h2>

            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">7.1 Billing</h3>
            <p className="mb-4">
              Paid Subscriptions are billed in advance on a monthly or annual basis, depending on your
              selected plan. Payments are processed securely through our payment provider.
              <strong className="text-amber-600"> Note: Paid plans and payment processing are coming soon.</strong>
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">7.2 Automatic Renewal</h3>
            <p className="mb-4">
              Subscriptions automatically renew at the end of each billing period unless cancelled 
              before the renewal date. You may cancel your Subscription at any time through your 
              account settings or by contacting support.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">7.3 Price Changes</h3>
            <p className="mb-4">
              We reserve the right to modify Subscription prices. Any price changes will be communicated 
              to you in advance and will apply to subsequent billing periods.
            </p>
            
            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">7.4 Refund Policy</h3>
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
              <p className="mb-3">
                <strong className="text-green-800">30-Day Money-Back Guarantee:</strong> We offer a full refund
                within 30 days of your initial subscription purchase, no questions asked.
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm mb-3">
                <li><strong>Eligibility:</strong> Refunds are available within 30 days from the date of your first payment.</li>
                <li><strong>How to Request:</strong> Contact us at support@cryptoreportkit.com or use your payment receipt
                  to request a refund directly.</li>
                <li><strong>Processing:</strong> Refunds are typically processed within 5-10 business days and
                  appear in your account depending on your payment method.</li>
                <li><strong>After 30 Days:</strong> Payments are non-refundable after the 30-day window, except where
                  required by applicable law (e.g., EU/UK statutory rights).</li>
                <li><strong>Annual Plans:</strong> For annual subscriptions cancelled within 30 days, you receive a full refund.
                  After 30 days, cancellation stops future billing but no refund is provided for the remaining period.</li>
                <li><strong>Templates:</strong> Excel templates are formula-based tools, not data products. Refunds for template
                  purchases follow the same 30-day policy as subscriptions.</li>
                <li><strong>Chargebacks:</strong> We encourage you to request refunds directly rather than filing chargebacks.
                  Fraudulent chargebacks may result in account termination.</li>
              </ul>
              <p className="text-sm text-gray-600">
                <strong>Note:</strong> See our full <a href="/refund" className="text-green-700 underline">Refund Policy</a> for details.
              </p>
            </div>
          </section>

          {/* Acceptable Use */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Acceptable Use</h2>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Intellectual Property</h2>
            <p className="mb-4">
              All Content, features, and functionality of our Services, including but not limited to 
              text, graphics, logos, data, software, and analytics, are owned by CryptoReportKit or our 
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. Data Accuracy and Third-Party Sources</h2>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
            <p className="mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CRYPTOREPORTKIT SHALL NOT BE LIABLE FOR ANY 
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless CryptoReportKit and its officers, directors, 
              employees, and agents from any claims, damages, losses, costs, and expenses (including 
              reasonable legal fees) arising from your use of the Services, violation of these Terms, 
              or infringement of any third-party rights.
            </p>
          </section>

          {/* Disclaimer of Warranties */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Disclaimer of Warranties</h2>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Termination</h2>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material 
              changes by posting the updated Terms on our website or by email. Your continued use of 
              the Services after such changes constitutes acceptance of the modified Terms. It is your 
              responsibility to review these Terms periodically.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Governing Law & Venue</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of India,
              without regard to conflict of law principles.
            </p>
            <p>
              Any disputes arising from these Terms or use of the Services shall be resolved through
              good faith negotiation. If negotiation fails, the courts of Kolkata, West Bengal, India
              shall have exclusive jurisdiction, except where applicable consumer law requires a different forum.
            </p>
          </section>

          {/* Severability */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">17. Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision 
              shall be limited or eliminated to the minimum extent necessary, and the remaining 
              provisions shall remain in full force and effect.
            </p>
          </section>

          {/* Third-Party Content & Advertisements */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">18. Third-Party Content & Advertisements</h2>
            <p className="mb-4">
              Our Services may display advertisements, sponsored content, or links to third-party websites,
              products, or services. You acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>No Endorsement:</strong> We do not endorse, verify, or guarantee the authenticity,
                legality, or quality of any third-party advertiser, product, or service displayed on our platform.</li>
              <li><strong>Scam Warning:</strong> The cryptocurrency industry is susceptible to scams, frauds,
                and malicious actors. We strongly advise users to conduct thorough due diligence before engaging
                with any third-party service, investment opportunity, or advertised product.</li>
              <li><strong>User Responsibility:</strong> Any interactions, transactions, or agreements between
                you and third parties are solely between you and such third parties. We are not responsible
                for any loss, damage, or harm resulting from such interactions.</li>
              <li><strong>Reporting:</strong> If you encounter suspicious or fraudulent content on our platform,
                please report it to us immediately.</li>
            </ul>
            <p className="text-red-600 font-semibold">
              WARNING: Never share your private keys, seed phrases, or passwords with anyone. Legitimate services
              will never ask for this information. Be extremely cautious of unsolicited investment opportunities.
            </p>
          </section>

          {/* DMCA / Copyright Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">19. DMCA / Copyright Policy</h2>
            <p className="mb-4">
              We respect intellectual property rights and expect our users to do the same. If you believe
              that content on our Services infringes your copyright, please submit a DMCA takedown notice
              containing the following information:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>A physical or electronic signature of the copyright owner or authorized representative</li>
              <li>Identification of the copyrighted work claimed to have been infringed</li>
              <li>Identification of the infringing material and its location on our Services</li>
              <li>Your contact information (address, telephone number, email)</li>
              <li>A statement that you have a good faith belief that the use is not authorized</li>
              <li>A statement, under penalty of perjury, that the information is accurate and you are authorized to act</li>
            </ul>
            <p className="mb-4">
              Send DMCA notices to: <span className="text-emerald-600 font-semibold">support@cryptoreportkit.com</span>
              with subject line &quot;DMCA Takedown Request&quot;
            </p>
            <p>
              We may terminate accounts of users who are found to be repeat infringers of intellectual property rights.
            </p>
          </section>

          {/* Entire Agreement */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">20. Entire Agreement</h2>
            <p>
              These Terms, together with our Privacy Policy and any other agreements expressly incorporated
              by reference, constitute the entire agreement between you and CryptoReportKit regarding your use
              of the Services. These Terms supersede any prior agreements or understandings, whether written
              or oral, relating to the subject matter hereof. No waiver of any provision shall be deemed a
              further or continuing waiver of such provision or any other provision.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">22. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us:
            </p>
            <p className="text-emerald-600">
              Email: support@cryptoreportkit.com
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
