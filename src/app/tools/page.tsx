'use client';

import Link from 'next/link';
import { BeginnerTip } from '@/components/ui/BeginnerHelpers';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { isFeatureEnabled } from '@/lib/featureFlags';

export default function ToolsPage() {
  const tools = [
    {
      id: 'templates',
      name: 'Power Query Templates',
      emoji: '📊',
      description: 'Power Query templates for live crypto data (BYOK)',
      href: '/downloads',
      color: 'from-green-500 to-teal-500',
      forBeginner: true,
      features: ['Prefetched data', 'Ready to use', 'BYOK available']
    },
    {
      id: 'research',
      name: 'Research Workspace',
      emoji: '🔎',
      description: 'A focused place for charts, comparisons, and templates',
      href: '/research',
      color: 'from-blue-500 to-indigo-500',
      forBeginner: true,
      features: ['Quick links', 'Repeatable research flow', 'Education-first']
    },
    {
      id: 'market',
      name: 'Market Analytics',
      emoji: '📈',
      description: 'Market overview and rankings',
      href: '/market',
      color: 'from-cyan-500 to-blue-500',
      forBeginner: true,
      features: ['Market map', 'Top movers', 'Market stats']
    },
    {
      id: 'onchain',
      name: 'On-Chain Analytics',
      emoji: '⛓️',
      description: 'Explore network activity and on-chain metrics',
      href: '/onchain',
      color: 'from-violet-500 to-purple-500',
      forBeginner: false,
      features: ['On-chain indicators', 'Availability varies by config', 'Template-ready']
    },
    {
      id: 'charts',
      name: 'Charts',
      emoji: '📊',
      description: 'Explore interactive charts and visualizations',
      href: '/charts',
      color: 'from-purple-500 to-pink-500',
      forBeginner: true,
      features: ['Chart library', 'Indicators', 'Visual analysis']
    },
    {
      id: 'compare',
      name: 'Coin Comparison',
      emoji: '⚖️',
      description: 'Compare multiple cryptocurrencies side-by-side',
      href: '/compare',
      color: 'from-emerald-500 to-green-500',
      forBeginner: true,
      features: ['Up to 10 coins', 'Key metrics', 'Visual charts']
    },
    {
      id: 'correlation',
      name: 'Correlation Heatmap',
      emoji: '🔗',
      description: 'See how different assets move together',
      href: '/correlation',
      color: 'from-gray-600 to-gray-800',
      forBeginner: false,
      features: ['Diversification insights', 'Historical analysis', 'Portfolio optimization']
    },
    {
      id: 'risk',
      name: 'Risk Analyzer',
      emoji: '⚠️',
      description: 'Explore risk metrics and explanations',
      href: '/risk',
      color: 'from-red-500 to-orange-500',
      forBeginner: true,
      features: ['VaR calculation', 'Sharpe ratio', 'Max drawdown']
    },
    {
      id: 'smart-contract-verifier',
      name: 'SafeContract',
      emoji: '🔐',
      description: 'Check whether a smart contract is verified (not a security audit)',
      href: '/smart-contract-verifier',
      color: 'from-emerald-600 to-green-500',
      forBeginner: false,
      features: ['Verification status', 'Cache-backed checks', 'No safety guarantees']
    },
    {
      id: 'fear-greed',
      name: 'Fear & Greed Index',
      emoji: '😱',
      description: 'A simple sentiment gauge with historical context',
      href: '/sentiment',
      color: 'from-yellow-500 to-orange-500',
      forBeginner: true,
      features: ['Live index', 'Historical chart', 'Educational explanations']
    },
  ].filter((t) => (t.id === 'smart-contract-verifier' ? isFeatureEnabled('smartContractVerifier') : true));

  const beginnerTools = tools.filter(t => t.forBeginner);
  const advancedTools = tools.filter(t => !t.forBeginner);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">🧰 Research Tools</h1>
          <p className="text-xl text-gray-300">
            Datasets, analytics, and explanations — education-first
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Beginner Tip */}
        <BeginnerTip title="💡 Where to Start?">
          If you&apos;re new, start with:
          <br/>
          1. <strong>Excel Templates</strong> - CRK formula templates for live data
          <br/>
          2. <strong>Charts</strong> - Explore interactive visualizations
          <br/>
          3. <strong>Comparisons</strong> - Side-by-side metrics with explanations
        </BeginnerTip>

        {/* Beginner-Friendly Tools */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-green-500">🔰</span> Beginner Friendly
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {beginnerTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 hover:shadow-lg transition-all group"
              >
                <div className={`bg-gradient-to-r ${tool.color} p-6 text-white`}>
                  <span className="text-4xl">{tool.emoji}</span>
                  <h3 className="text-xl font-bold mt-2 group-hover:translate-x-1 transition-transform">
                    {tool.name}
                  </h3>
                </div>
                <div className="p-4">
                  <p className="text-gray-400 text-sm mb-3">{tool.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {tool.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Advanced Tools */}
        <section>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <span className="text-purple-500">🎯</span> Advanced Analytics
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {advancedTools.map((tool) => (
              <Link
                key={tool.id}
                href={tool.href}
                className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700 hover:border-gray-600 hover:shadow-lg transition-all group"
              >
                <div className={`bg-gradient-to-r ${tool.color} p-6 text-white`}>
                  <span className="text-4xl">{tool.emoji}</span>
                  <h3 className="text-xl font-bold mt-2 group-hover:translate-x-1 transition-transform">
                    {tool.name}
                  </h3>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full mt-2 inline-block">
                    Advanced
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-gray-400 text-sm mb-3">{tool.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {tool.features.map((feature) => (
                      <span
                        key={feature}
                        className="text-xs px-2 py-1 bg-gray-700 text-gray-300 rounded-full"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-3">Want Metric Explanations?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Start with the Academy and Glossary for clear, non-trading explanations.
          </p>
          <Link
            href="/learn"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
          >
            📚 Go to Academy
          </Link>
        </div>

        {/* Coming Soon */}
        <section className="mt-12">
          <h2 className="text-xl font-bold text-gray-500 mb-4">🔮 Coming Soon</h2>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { name: 'Price Alerts', emoji: '🔔' },
              { name: 'Tax Calculator', emoji: '📝' },
              { name: 'DeFi Tracker', emoji: '🏦' },
              { name: 'NFT Analytics', emoji: '🖼️' },
            ].map((item) => (
              <div
                key={item.name}
                className="bg-gray-800 rounded-lg p-4 text-center opacity-60 border border-gray-700"
              >
                <span className="text-3xl">{item.emoji}</span>
                <p className="text-sm text-gray-500 mt-2">{item.name}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
