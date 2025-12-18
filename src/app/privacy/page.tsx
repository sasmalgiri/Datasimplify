'use client';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>
        <p className="text-gray-400 mb-8">Last updated: December 2024</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Information We Collect</h2>
            <p>We collect: email address, payment info (via Paddle), and usage data to provide our service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. How We Use Your Data</h2>
            <p>We use your data to: provide the service, process payments, send updates, and improve our platform.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Data Sharing</h2>
            <p>We do NOT sell your data. We only share with: Paddle (payments), Supabase (database), and Vercel (hosting).</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Security</h2>
            <p>We use HTTPS encryption and secure password hashing to protect your data.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Your Rights</h2>
            <p>You can request to access, update, or delete your data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Contact</h2>
            <p>Questions? Email us at: <span className="text-emerald-400">support@datasimplify.com</span></p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-700">
          <a href="/" className="text-emerald-400 hover:text-emerald-300">← Back to Home</a>
        </div>
      </div>
    </div>
  );
}