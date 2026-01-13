'use client';

import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function CommunityGuidelinesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />

      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Community Guidelines</h1>
          <p className="text-gray-400 text-lg">
            Rules and best practices for the DataSimplify Community
          </p>
        </div>

        {/* Guidelines Sections */}
        <div className="space-y-8">
          {/* Mission Statement */}
          <section className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">Our Mission</h2>
            <p className="text-gray-300 leading-relaxed">
              DataSimplify provides software analytics tools and Excel templates for crypto enthusiasts
              to visualize and analyze market data. Our community is a place to discuss data analysis
              techniques, share spreadsheet tips, and help each other use our tools effectively.
            </p>
          </section>

          {/* Product Scope */}
          <section className="bg-yellow-900/20 border border-yellow-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <span>1.</span> Understanding Our Product
            </h2>
            <div className="space-y-3 text-gray-300">
              <p className="mb-4">DataSimplify is software analytics tooling, not a financial service:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 mt-1">&#10003;</span>
                  <span><strong className="text-white">Software Tools:</strong> We provide Excel templates with formulas (no embedded data)</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 mt-1">&#10003;</span>
                  <span><strong className="text-white">Educational Visualization:</strong> Dashboard displays are for educational purposes only</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-yellow-400 mt-1">&#10003;</span>
                  <span><strong className="text-white">CryptoSheets Integration:</strong> Templates require the CryptoSheets add-in to fetch data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">&#10007;</span>
                  <span><strong className="text-white">Not a Data Vendor:</strong> We do not sell or redistribute market data</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-red-400 mt-1">&#10007;</span>
                  <span><strong className="text-white">Not Financial Advice:</strong> Nothing on this platform constitutes investment recommendations</span>
                </li>
              </ul>
            </div>
          </section>

          {/* Discussion Rules */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
              <span>2.</span> Discussion Rules
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Stay On Topic:</strong> Discussions should relate to data analysis, spreadsheet techniques, and tool usage.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Share Knowledge:</strong> Help others learn Excel formulas, data visualization, and analysis techniques.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Report Issues:</strong> If you find bugs or have feature requests, share them constructively.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Educational Focus:</strong> Discussions should be educational - learning about data, not making money.
                </div>
              </li>
            </ul>
          </section>

          {/* Conduct Rules */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
              <span>3.</span> Community Conduct
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Be Respectful:</strong> Treat all members with respect. No personal attacks, harassment, or discrimination.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Constructive Feedback:</strong> When disagreeing, provide constructive criticism with reasoning.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">No Spam:</strong> Avoid repetitive posts, excessive self-promotion, or irrelevant content.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">English Language:</strong> To ensure everyone can participate, please post in English.
                </div>
              </li>
            </ul>
          </section>

          {/* Prohibited Content */}
          <section className="bg-red-900/20 border border-red-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
              <span>4.</span> Prohibited Content
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">&#10007;</span>
                <div>
                  <strong className="text-white">Financial Advice:</strong> Do not give or solicit investment advice, price targets, or trading recommendations.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">&#10007;</span>
                <div>
                  <strong className="text-white">Market Manipulation:</strong> Pump-and-dump schemes, coordinated buying/selling, or misleading information.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">&#10007;</span>
                <div>
                  <strong className="text-white">Scams & Fraud:</strong> Promoting scam projects, phishing links, or fraudulent services.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">&#10007;</span>
                <div>
                  <strong className="text-white">Hate Speech:</strong> Content that promotes hatred based on race, religion, gender, or any protected characteristic.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">&#10007;</span>
                <div>
                  <strong className="text-white">Illegal Activities:</strong> Discussion of money laundering, tax evasion, or other illegal activities.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-400 mt-1">&#10007;</span>
                <div>
                  <strong className="text-white">Personal Information:</strong> Sharing others&apos; personal information (doxxing) is strictly prohibited.
                </div>
              </li>
            </ul>
          </section>

          {/* Enforcement */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-orange-400 mb-4 flex items-center gap-2">
              <span>5.</span> Enforcement
            </h2>
            <div className="space-y-4 text-gray-300">
              <p>Violations of these guidelines will result in the following actions:</p>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">1st Offense</div>
                  <div className="text-yellow-400 font-semibold">Warning</div>
                  <p className="text-sm text-gray-400 mt-1">Content removed + written warning</p>
                </div>
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">2nd Offense</div>
                  <div className="text-orange-400 font-semibold">Temporary Ban</div>
                  <p className="text-sm text-gray-400 mt-1">7-day suspension from posting</p>
                </div>
                <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
                  <div className="text-2xl mb-2">3rd Offense</div>
                  <div className="text-red-400 font-semibold">Permanent Ban</div>
                  <p className="text-sm text-gray-400 mt-1">Account permanently suspended</p>
                </div>
              </div>
              <p className="text-sm text-gray-400 mt-4">
                * Severe violations (scams, hate speech, illegal content) may result in immediate permanent ban.
              </p>
            </div>
          </section>

          {/* Disclaimer */}
          <section className="bg-gray-900/50 border border-gray-600 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-gray-400 mb-3">Important Disclaimer</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              DataSimplify provides educational software tools only. All community discussions are for
              educational and informational purposes. Nothing shared in this community constitutes
              financial, investment, tax, or legal advice. Cryptocurrency investments carry significant
              risk, and you should always conduct your own research (DYOR) and consult qualified
              professionals before making any investment decisions. DataSimplify is not responsible
              for any financial decisions made based on community discussions.
            </p>
          </section>
        </div>

        {/* Back to Community */}
        <div className="text-center mt-12">
          <Link
            href="/community"
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold transition"
          >
            &#8592; Back to Community
          </Link>
        </div>
      </div>
    </div>
  );
}
