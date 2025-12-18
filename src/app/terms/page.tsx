'use client';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-900 text-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>
        <p className="text-gray-400 mb-8">Last updated: December 2024</p>

        <div className="space-y-8 text-gray-300">
          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>By accessing and using DataSimplify, you agree to be bound by these Terms of Service.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p>DataSimplify provides cryptocurrency data analytics tools including real-time prices, AI chat, downloadable reports, and portfolio tracking.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Not Financial Advice</h2>
            <p className="text-yellow-400 font-semibold">IMPORTANT: DataSimplify does NOT provide financial advice. All information is for educational purposes only. Always do your own research (DYOR).</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Subscriptions & Payments</h2>
            <p>Paid subscriptions are billed monthly. Payments are processed securely through Paddle.</p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Refund Policy</h2>
            <p>We offer a 7-day money-back guarantee for new subscribers. Contact support for refund requests.</p>
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