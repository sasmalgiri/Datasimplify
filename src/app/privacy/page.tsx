'use client';

import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-600 mb-8">Last updated: December 2024</p>

        <div className="space-y-8 text-gray-700 leading-relaxed">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
            <p className="mb-4">
              DataSimplify (&quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) is committed to protecting your privacy 
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
              <li><strong>Payment Information:</strong> Processed securely by Paddle (our payment provider). We do not store your credit card details.</li>
              <li><strong>Portfolio Data:</strong> Cryptocurrency holdings and investments you choose to enter</li>
              <li><strong>Communications:</strong> Messages, feedback, and support requests you send us</li>
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
            <p>
              We may receive information from third-party services if you connect them to your account, 
              such as wallet addresses (if you choose to link them) or social login providers.
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
                  <li><strong>Paddle:</strong> Payment processing (Merchant of Record)</li>
                  <li><strong>Supabase:</strong> Database and authentication services</li>
                  <li><strong>Vercel:</strong> Website hosting and content delivery</li>
                  <li><strong>Groq/OpenAI:</strong> AI-powered features (anonymized queries only)</li>
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
              To exercise these rights, contact us at <span className="text-emerald-600">support@datasimplify.com</span>.
              We will respond to your request within 30 days.
            </p>
          </section>

          {/* Children's Privacy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">9. Children&apos;s Privacy</h2>
            <p>
              Our Services are not intended for users under 18 years of age. We do not knowingly 
              collect personal data from children. If we learn that we have collected data from a 
              child under 18, we will take steps to delete such information promptly. If you believe 
              a child has provided us with personal data, please contact us.
            </p>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">10. International Data Transfers</h2>
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
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">11. Third-Party Links</h2>
            <p>
              Our Services may contain links to third-party websites, services, or applications. 
              We are not responsible for the privacy practices of these third parties. We encourage 
              you to review the privacy policies of any third-party services you access.
            </p>
          </section>

          {/* Changes to Policy */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">12. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material 
              changes by posting the updated policy on our website and updating the &quot;Last updated&quot; date. 
              For significant changes, we may also notify you by email. Your continued use of our 
              Services after any changes constitutes acceptance of the updated Privacy Policy.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
            <p className="mb-4">
              If you have any questions, concerns, or requests regarding this Privacy Policy or
              our data practices, please contact us:
            </p>
            <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
              <p className="text-emerald-600 font-semibold">DataSimplify</p>
              <p>Email: support@datasimplify.com</p>
            </div>
          </section>

          {/* Summary Box */}
          <section className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Privacy at a Glance</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-emerald-600 font-semibold">✓ What we collect:</p>
                <p className="text-gray-600">Email, usage data, payment info (via Paddle)</p>
              </div>
              <div>
                <p className="text-emerald-600 font-semibold">✓ Why we collect:</p>
                <p className="text-gray-600">Provide services, process payments, improve UX</p>
              </div>
              <div>
                <p className="text-emerald-600 font-semibold">✓ Who we share with:</p>
                <p className="text-gray-600">Only service providers (Paddle, Supabase, Vercel)</p>
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
