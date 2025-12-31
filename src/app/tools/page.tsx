'use client';

import Link from 'next/link';
import { BeginnerTip } from '@/components/ui/BeginnerHelpers';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

export default function ToolsPage() {
  const tools = [
    {
      id: 'portfolio',
      name: 'Portfolio Builder',
      emoji: '💼',
      description: 'Build your first crypto portfolio with guided recommendations',
      href: '/portfolio',
      color: 'from-blue-500 to-indigo-500',
      forBeginner: true,
      features: ['Risk-based allocation', 'Visual pie chart', 'PDF export']
    },
    {
      id: 'backtest',
      name: 'Strategy Backtester',
      emoji: '🧪',
      description: 'Test trading strategies using historical data',
      href: '/backtest',
      color: 'from-purple-500 to-pink-500',
      forBeginner: true,
      features: ['Plain English strategies', 'No coding needed', 'Performance metrics']
    },
    {
      id: 'download',
      name: 'Data Download',
      emoji: '📥',
      description: 'Export crypto data to Excel, CSV, or PDF',
      href: '/download',
      color: 'from-green-500 to-teal-500',
      forBeginner: true,
      features: ['One-click exports', 'Historical data', 'Multiple formats']
    },
    {
      id: 'chat',
      name: 'AI Assistant',
      emoji: '🤖',
      description: 'Ask questions about crypto in plain English',
      href: '/chat',
      color: 'from-orange-500 to-red-500',
      forBeginner: true,
      features: ['Natural language', 'Real-time data', 'Personalized answers']
    },
    {
      id: 'compare',
      name: 'Coin Comparison',
      emoji: '⚖️',
      description: 'Compare multiple cryptocurrencies side-by-side',
      href: '/compare',
      color: 'from-cyan-500 to-blue-500',
      forBeginner: true,
      features: ['Up to 10 coins', 'Key metrics', 'Visual charts']
    },
    {
      id: 'correlation',
      name: 'Correlation Heatmap',
      emoji: '🔗',
      description: 'See how different coins move together',
      href: '/correlation',
      color: 'from-violet-500 to-purple-500',
      forBeginner: false,
      features: ['Diversification insights', 'Historical analysis', 'Portfolio optimization']
    },
    {
      id: 'risk',
      name: 'Risk Analyzer',
      emoji: '⚠️',
      description: 'Understand the risk level of each coin',
      href: '/risk',
      color: 'from-red-500 to-orange-500',
      forBeginner: true,
      features: ['VaR calculation', 'Sharpe ratio', 'Max drawdown']
    },
    {
      id: 'whales',
      name: 'Whale Tracker',
      emoji: '🐋',
      description: 'Monitor large transactions and smart money',
      href: '/whales',
      color: 'from-blue-600 to-cyan-500',
      forBeginner: false,
      features: ['Real-time alerts', 'Wallet distribution', 'Exchange flows']
    },
    {
      id: 'etf',
      name: 'ETF Flow Tracker',
      emoji: '📊',
      description: 'Track Bitcoin ETF inflows and outflows',
      href: '/etf',
      color: 'from-emerald-500 to-green-500',
      forBeginner: true,
      features: ['Daily updates', 'All major ETFs', 'Historical trends']
    },
    {
      id: 'social',
      name: 'Social Sentiment',
      emoji: '📱',
      description: 'See what people are saying on social media',
      href: '/social',
      color: 'from-pink-500 to-rose-500',
      forBeginner: true,
      features: ['Twitter, Reddit, YouTube', 'Sentiment scores', 'Trending topics']
    },
    {
      id: 'fear-greed',
      name: 'Fear & Greed Index',
      emoji: '😱',
      description: 'Measure overall market sentiment',
      href: '/sentiment',
      color: 'from-yellow-500 to-orange-500',
      forBeginner: true,
      features: ['Live index', 'Historical chart', 'Market signals']
    },
    {
      id: 'templates',
      name: 'Report Templates',
      emoji: '📋',
      description: 'Pre-built analysis reports ready to download',
      href: '/templates',
      color: 'from-gray-600 to-gray-800',
      forBeginner: true,
      features: ['One-click reports', 'Multiple formats', 'Customizable']
    },
  ];

  const beginnerTools = tools.filter(t => t.forBeginner);
  const advancedTools = tools.filter(t => !t.forBeginner);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white py-12 border-b border-gray-700">
        <div className="max-w-6xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">🛠️ Analysis Tools</h1>
          <p className="text-xl text-gray-300">
            Powerful tools to help you make smarter crypto decisions
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Beginner Tip */}
        <BeginnerTip title="💡 Where to Start?">
          If you&apos;re new to crypto, we recommend starting with:
          <br/>
          1. <strong>Portfolio Builder</strong> - Create your first portfolio
          <br/>
          2. <strong>AI Assistant</strong> - Ask any questions you have
          <br/>
          3. <strong>Fear & Greed Index</strong> - Understand market sentiment
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
          <h2 className="text-2xl font-bold mb-3">Need Help Using These Tools?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            Our AI assistant can guide you through any tool. Just ask!
          </p>
          <Link
            href="/chat"
            className="inline-block bg-white text-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-50 transition-colors"
          >
            🤖 Ask AI Assistant
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
