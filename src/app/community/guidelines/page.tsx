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
            Rules and best practices for our AI Prediction Community
          </p>
        </div>

        {/* Guidelines Sections */}
        <div className="space-y-8">
          {/* Mission Statement */}
          <section className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-emerald-400 mb-4">Our Mission</h2>
            <p className="text-gray-300 leading-relaxed">
              DataSimplify&apos;s AI Community is a platform for crypto enthusiasts to share predictions,
              discuss market trends, and learn from each other. We aim to foster a respectful,
              educational, and transparent environment where everyone can contribute meaningfully.
            </p>
          </section>

          {/* Prediction Rules */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
              <span>1.</span> Prediction Rules
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Be Specific:</strong> Include target price, timeframe (24h, 7d, 30d), and reasoning for your prediction.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Provide Analysis:</strong> Back your predictions with technical analysis, on-chain data, or fundamental research.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">One Prediction Per Coin:</strong> You can only have one active prediction per cryptocurrency at a time.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Realistic Targets:</strong> Predictions with unrealistic targets (e.g., 1000% gains in 24h) will be flagged.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">No Financial Advice:</strong> Predictions are opinions, not financial advice. Always include a disclaimer.
                </div>
              </li>
            </ul>
          </section>

          {/* Conduct Rules */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-purple-400 mb-4 flex items-center gap-2">
              <span>2.</span> Community Conduct
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
                  <strong className="text-white">Constructive Feedback:</strong> When disagreeing, provide constructive criticism with your own analysis.
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
              <span>3.</span> Prohibited Content
            </h2>
            <ul className="space-y-3 text-gray-300">
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

          {/* Accuracy & Leaderboard */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-yellow-400 mb-4 flex items-center gap-2">
              <span>4.</span> Accuracy & Leaderboard
            </h2>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Accuracy Tracking:</strong> Your prediction accuracy is tracked automatically based on actual price movements.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Leaderboard Rankings:</strong> Top predictors are ranked based on accuracy, consistency, and community engagement.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Badges & Rewards:</strong> Earn badges for milestones (10+ predictions, 70%+ accuracy, top 10 ranking).
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-emerald-400 mt-1">&#10003;</span>
                <div>
                  <strong className="text-white">Fair Play:</strong> Gaming the system (e.g., deleting failed predictions) will result in account penalties.
                </div>
              </li>
            </ul>
          </section>

          {/* AI Moderation */}
          <section className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
              <span>5.</span> AI-Powered Moderation
            </h2>
            <p className="text-gray-300 mb-4">
              Our community is monitored by advanced AI to ensure a safe environment:
            </p>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">&#9679;</span>
                <div>
                  <strong className="text-white">Content Screening:</strong> Predictions and comments may be screened for prohibited content before publishing.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">&#9679;</span>
                <div>
                  <strong className="text-white">Spam Detection:</strong> AI identifies and flags spam, duplicate content, and low-quality posts.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">&#9679;</span>
                <div>
                  <strong className="text-white">Sentiment Analysis:</strong> Toxic or hostile content is automatically flagged for review.
                </div>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-blue-400 mt-1">&#9679;</span>
                <div>
                  <strong className="text-white">Human Review:</strong> If your content is flagged incorrectly, you can request a human review.
                </div>
              </li>
            </ul>
          </section>

          {/* Enforcement */}
          <section className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6">
            <h2 className="text-2xl font-bold text-orange-400 mb-4 flex items-center gap-2">
              <span>6.</span> Enforcement
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
            <h2 className="text-xl font-bold text-gray-400 mb-3">Disclaimer</h2>
            <p className="text-gray-400 text-sm leading-relaxed">
              All predictions shared on DataSimplify&apos;s AI Community are user-generated content and represent
              personal opinions only. They do not constitute financial advice. Cryptocurrency investments
              carry significant risk, and you should always conduct your own research (DYOR) before making
              any investment decisions. DataSimplify is not responsible for any financial losses resulting
              from following community predictions.
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
