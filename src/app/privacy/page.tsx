'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: January 2026</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="mb-4">
              <strong>Ecosanskriti Innovations (OPC) Private Limited</strong> (CIN: U27100WB2025OPC279246),
              operating as CryptoReportKit (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;), is committed to protecting your privacy 
              and personal data. This Privacy Policy explains how we collect, use, disclose, and 
              safeguard your information when you use our cryptocurrency data analytics platform, 
              website, applications, and related services (collectively, the &quot;Services&quot;).
            </p>
            <p>
              By accessing or using our Services, you consent to the collection and use of your 
              information as described in this Privacy Policy. If you do not agree with our policies, 
              please do not use our Services.
            </p>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">2.1 Information You Provide</h3>
            <p className="mb-4">We collect information you voluntarily provide, including:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Account Information:</strong> Email address, name (optional), password</li>
              <li><strong>Profile Information:</strong> Preferences, settings, communication choices</li>
              <li><strong>Payment Information:</strong> Processed securely by our payment processor.
                We do not store your credit card details. Payment processors receive your payment information,
                billing address, and transaction details when you purchase a subscription.</li>
              <li><strong>Portfolio Data:</strong> Cryptocurrency holdings and investments you choose to enter</li>
              <li><strong>Communications:</strong> Messages, feedback, and support requests you send us</li>
              <li><strong>API Keys (BYOK):</strong> If you use our Bring Your Own Key (BYOK) feature, you may
                provide API keys from third-party data providers (CoinGecko, CoinMarketCap, etc.).
                See Section 2.4 below for details on how we handle these keys.</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">2.2 Information Collected Automatically</h3>
            <p className="mb-4">When you use our Services, we automatically collect:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Device Information:</strong> Browser type, operating system, device identifiers</li>
              <li><strong>Usage Data:</strong> Pages visited, features used, time spent, click patterns</li>
              <li><strong>Log Data:</strong> IP address, access times, referring URLs</li>
              <li><strong>Cookies:</strong> Session identifiers and preference data (see Section 6)</li>
            </ul>

            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">2.3 Information from Third Parties</h3>
            <p className="mb-4">
              We may receive information from third-party services if you connect them to your account,
              such as wallet addresses (if you choose to link them) or social login providers.
            </p>

            <h3 className="text-xl font-medium text-gray-900 mt-4 mb-2">2.4 API Keys (BYOK)</h3>
            <p className="mb-4">
              If you use our <strong>Bring Your Own Key (BYOK)</strong> feature, we collect and store your API keys from
              third-party data providers to enable our Excel add-in to fetch data on your behalf. Here&apos;s how we handle them:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Encryption at Rest:</strong> All API keys are encrypted using AES-256-GCM before storage.
                We never store your keys in plaintext.</li>
              <li><strong>Usage:</strong> Your encrypted keys are decrypted only in memory when making API calls to
                data providers on your behalf (server-proxy architecture).</li>
              <li><strong>Never Sold or Shared:</strong> We never sell, rent, or share your API keys with third parties
                for marketing or any other purpose.</li>
              <li><strong>Deletion:</strong> You can delete your API keys at any time from your account settings.
                Keys are also permanently deleted when you close your account.</li>
              <li><strong>Logs & Metadata:</strong> We may log API call metadata (timestamp, endpoint, response status)
                for troubleshooting and rate limit monitoring, but never log your plaintext keys.</li>
              <li><strong>Provider Terms:</strong> You are responsible for complying with your data provider&apos;s
                terms of service. We are not liable for provider API changes, downtime, or policy violations.</li>
            </ul>
            <p className="mb-4">
              <strong>Important:</strong> Your API keys grant access to your data provider accounts. Keep your CryptoReportKit
              account secure (strong password, enable 2FA if available) to protect your keys.
            </p>
          </section>

          {/* How We Use Your Information */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use your information to:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>Provide, maintain, and improve our Services</li>
              <li>Process your account registration and Subscriptions</li>
              <li>Process payments and prevent fraud</li>
              <li>Send important updates about your account and Services</li>
              <li>Respond to your inquiries and support requests</li>
              <li>Personalize your experience and deliver relevant content</li>
              <li>Analyze usage patterns to improve functionality and user experience</li>
              <li>Detect, prevent, and address security issues and abuse</li>
              <li>Comply with legal obligations and enforce our Terms of Service</li>
              <li>Send marketing communications (with your consent, which you can withdraw anytime)</li>
            </ul>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. How We Share Your Information</h2>
            <p className="mb-4 text-emerald-600 font-semibold">We do NOT sell your personal data.</p>
            <p className="mb-4">We may share your information with:</p>
            <ul className="list-disc list-inside space-y-2">
              <li>
                <strong>Service Providers:</strong> Third parties who help us operate our Services:
                <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                  <li><strong>Payment Processor:</strong> Payment processing and subscription management.
                    Your payment details, billing address, email, and transaction information are shared with our payment processor.</li>
                  <li><strong>Supabase:</strong> Database and authentication services</li>
                  <li><strong>Vercel:</strong> Website hosting and content delivery</li>
                  <li><strong>Data Providers:</strong> Market data aggregation services (CoinGecko, etc.)</li>
                </ul>
              </li>
              <li><strong>Legal Requirements:</strong> If required by law, court order, or government request</li>
              <li><strong>Protection of Rights:</strong> To protect our rights, property, or safety, or that of our users</li>
              <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
            </ul>
          </section>

          {/* Data Security */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
            <p className="mb-4">We implement industry-standard security measures to protect your data:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>All data transmitted via HTTPS/TLS encryption</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Regular security assessments and updates</li>
              <li>Access controls limiting employee access to personal data</li>
              <li>Database encryption at rest</li>
            </ul>
            <p>
              However, no method of transmission over the Internet or electronic storage is 100% secure. 
              While we strive to protect your data, we cannot guarantee absolute security.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cookies and Tracking Technologies</h2>
            <p className="mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Essential Cookies:</strong> Keep you signed in and remember your preferences</li>
              <li><strong>Analytics Cookies:</strong> Understand how users interact with our Services</li>
              <li><strong>Functional Cookies:</strong> Enable enhanced features and personalization</li>
            </ul>
            <p className="mb-4">
              You can control cookies through your browser settings. Disabling certain cookies may
              affect the functionality of our Services.
            </p>
            <p className="mb-4">
              <strong>Cookie Controls (EU/UK):</strong> Where required by law, we only set analytics cookies
              after you opt in via our cookie banner. You can withdraw consent anytime using the cookie settings
              link in the footer or through your browser settings.
            </p>
            <p>
              We do not use advertising cookies or sell your data to advertisers.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Data Retention</h2>
            <p className="mb-4">
              We retain your personal data for as long as your account is active or as needed to 
              provide you with our Services. We may also retain data as necessary to:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li>Comply with legal obligations</li>
              <li>Resolve disputes</li>
              <li>Enforce our agreements</li>
              <li>Maintain business records</li>
            </ul>
            <p>
              If you delete your account, we will delete or anonymize your personal data within 30 days, 
              except where retention is required for legal or legitimate business purposes.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Your Rights and Choices</h2>
            <p className="mb-4">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Correction:</strong> Update or correct inaccurate information</li>
              <li><strong>Deletion:</strong> Request deletion of your account and personal data</li>
              <li><strong>Portability:</strong> Receive your data in a portable format</li>
              <li><strong>Opt-out:</strong> Unsubscribe from marketing emails at any time</li>
              <li><strong>Restrict Processing:</strong> Limit how we use your data in certain circumstances</li>
            </ul>
            <p>
              To exercise these rights, contact us at <span className="text-emerald-600">support@cryptoreportkit.com</span>.
              We will respond to your request within 30 days.
            </p>
          </section>

          {/* GDPR Compliance */}
          <section className="bg-blue-50 border border-blue-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. GDPR Compliance (European Users)</h2>
            <p className="mb-4">
              If you are located in the European Economic Area (EEA), United Kingdom, or Switzerland,
              you have certain rights under the General Data Protection Regulation (GDPR):
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Legal Basis:</strong> We process your data based on: (a) your consent, (b) performance
                of a contract, (c) compliance with legal obligations, or (d) our legitimate interests.</li>
              <li><strong>Right to Access:</strong> Request a copy of your personal data we hold.</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate or incomplete data.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data (&quot;right to be forgotten&quot;).</li>
              <li><strong>Right to Restrict Processing:</strong> Request limitation of how we use your data.</li>
              <li><strong>Right to Data Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Right to Object:</strong> Object to processing based on legitimate interests or direct marketing.</li>
              <li><strong>Right to Withdraw Consent:</strong> Withdraw consent at any time where processing is based on consent.</li>
              <li><strong>Right to Lodge a Complaint:</strong> File a complaint with your local data protection authority.</li>
            </ul>
            <p className="mb-4">
              <strong>Data Controller:</strong> CryptoReportKit is the data controller for your personal data.
            </p>
            <p>
              To exercise these rights, contact us at <span className="text-emerald-600 font-semibold">support@cryptoreportkit.com</span>.
              We will respond within 30 days (or as required by law).
            </p>
          </section>

          {/* CCPA Compliance */}
          <section className="bg-purple-50 border border-purple-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. CCPA Compliance (California Residents)</h2>
            <p className="mb-4">
              If you are a California resident, you have rights under the California Consumer Privacy Act (CCPA)
              and California Privacy Rights Act (CPRA):
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Right to Know:</strong> You can request information about the categories and specific
                pieces of personal information we have collected about you.</li>
              <li><strong>Right to Delete:</strong> You can request deletion of your personal information,
                subject to certain exceptions.</li>
              <li><strong>Right to Opt-Out of Sale:</strong> You have the right to opt out of the &quot;sale&quot; of your
                personal information. <span className="text-emerald-600 font-semibold">Note: We do NOT sell your personal information.</span></li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against you for exercising
                your privacy rights.</li>
              <li><strong>Right to Correct:</strong> You can request correction of inaccurate personal information.</li>
              <li><strong>Right to Limit Use of Sensitive Information:</strong> You can limit the use and disclosure
                of sensitive personal information.</li>
            </ul>
            <p className="mb-4">
              <strong>Categories of Information Collected:</strong> Identifiers (email), commercial information
              (subscription data), internet activity (usage logs), and inferences (preferences).
            </p>
            <p className="mb-4">
              <strong>Do Not Sell My Personal Information:</strong> We do not sell, rent, or trade your personal
              information to third parties for monetary consideration.
            </p>
            <p>
              <strong>How to Request:</strong> To exercise your rights, email us at{' '}
              <span className="text-emerald-600 font-semibold">support@cryptoreportkit.com</span> with subject
              &quot;CCPA Request&quot;. If we are subject to CCPA and operate exclusively online, email may be sufficient;
              otherwise we provide additional request methods as required by law. We will verify your identity and
              respond within 45 days.
            </p>
          </section>

          {/* India DPDP Compliance */}
          <section className="bg-orange-50 border border-orange-200 p-6 rounded-lg">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. India (DPDP Act)</h2>
            <p className="mb-4">
              We process personal data in accordance with India&apos;s Digital Personal Data Protection Act, 2023 (DPDP)
              and related rules operationalized in 2025. If you are located in India, you have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-4">
              <li><strong>Right to Access:</strong> Request a summary of personal data we hold about you.</li>
              <li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete personal data.</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data, subject to legal retention requirements.</li>
              <li><strong>Right to Grievance Redressal:</strong> Lodge complaints regarding data processing.</li>
              <li><strong>Right to Nominate:</strong> Nominate another individual to exercise your rights in the event of death or incapacity.</li>
              <li><strong>Withdrawal of Consent:</strong> Withdraw consent for processing at any time (where processing is based on consent).</li>
            </ul>
            <p className="mb-4">
              <strong>Consent:</strong> Where we process your data based on consent, you have given such consent by creating
              an account and using our Services. You may withdraw consent at any time by contacting us or deleting your account.
            </p>
            <p>
              <strong>Grievance Officer:</strong> To exercise your rights or file a grievance, contact us at{' '}
              <span className="text-emerald-600 font-semibold">support@cryptoreportkit.com</span> with subject &quot;India DPDP Request&quot;.
              We will address grievances within a reasonable time as required by law.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Children&apos;s Privacy</h2>
            <p>
              Our Services are not intended for users under 18 years of age. We do not knowingly
              collect personal data from children. If we learn that we have collected data from a
              child under 18, we will take steps to delete such information promptly. If you believe
              a child has provided us with personal data, please contact us.
            </p>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. International Data Transfers</h2>
            <p>
              Our Services are operated globally, and your data may be processed in countries other 
              than your own. By using our Services, you consent to the transfer of your information 
              to countries which may have different data protection laws than your jurisdiction. 
              We take appropriate measures to ensure your data remains protected in accordance with 
              this Privacy Policy.
            </p>
          </section>

          {/* Third-Party Links */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">14. Third-Party Links</h2>
            <p>
              Our Services may contain links to third-party websites, services, or applications. 
              We are not responsible for the privacy practices of these third parties. We encourage 
              you to review the privacy policies of any third-party services you access.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">15. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material 
              changes by posting the updated policy on our website and updating the &quot;Last updated&quot; date. 
              For significant changes, we may also notify you by email. Your continued use of our 
              Services after any changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">16. Contact Us</h2>
            <p className="mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or
              our data practices, please contact us:
            </p>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-emerald-600 font-semibold">CryptoReportKit</p>
              <p>Email: support@cryptoreportkit.com</p>
            </div>
          </section>

          {/* Summary Box */}
          <section className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy at a Glance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-emerald-600 font-semibold">✓ What we collect:</p>
                <p className="text-gray-600">Email, usage data, encrypted API keys (BYOK), payment info (when available)</p>
              </div>
              <div>
                <p className="text-emerald-600 font-semibold">✓ Why we collect:</p>
                <p className="text-gray-600">Provide services, process payments, improve UX</p>
              </div>
              <div>
                <p className="text-emerald-600 font-semibold">✓ Who we share with:</p>
                <p className="text-gray-600">Only essential service providers (Supabase, Vercel)</p>
              </div>
              <div>
                <p className="text-emerald-600 font-semibold">✓ Your rights:</p>
                <p className="text-gray-600">Access, correct, delete, export your data</p>
              </div>
              <div>
                <p className="text-red-600 font-semibold">✗ What we DON&apos;T do:</p>
                <p className="text-gray-600">Sell your data, share with advertisers</p>
              </div>
              <div>
                <p className="text-emerald-600 font-semibold">✓ Security:</p>
                <p className="text-gray-600">HTTPS, encryption, secure password hashing</p>
              </div>
            </div>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 flex gap-4">
          <Link href="/" className="text-emerald-600 hover:text-emerald-700">← Back to Home</Link>
          <span className="text-gray-400">|</span>
          <Link href="/terms" className="text-emerald-600 hover:text-emerald-700">Terms of Service</Link>
        </div>
      </div>
    </div>
  );
}
