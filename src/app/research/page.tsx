import Link from 'next/link';
import {
  FileSpreadsheet,
  LineChart,
  Scale,
  TrendingUp,
  Activity,
  BarChart3,
  ArrowRight,
  Zap,
  Search,
} from 'lucide-react';

const researchTools = [
  {
    href: '/templates',
    title: 'Excel Downloads',
    description: 'Static Excel templates with prefetched crypto data',
    icon: FileSpreadsheet,
    color: 'emerald',
  },
  {
    href: '/charts',
    title: 'Charts',
    description: 'Interactive time series and visual analysis tools',
    icon: LineChart,
    color: 'blue',
  },
  {
    href: '/compare',
    title: 'Coin Comparisons',
    description: 'Side-by-side metrics with detailed explanations',
    icon: Scale,
    color: 'purple',
  },
];

const analyticsTools = [
  {
    href: '/market',
    title: 'Market Analytics',
    description: 'Rankings, market movers, and comprehensive stats',
    icon: TrendingUp,
    color: 'orange',
  },
  {
    href: '/technical',
    title: 'Technical Metrics',
    description: 'Educational indicators, levels, and signals',
    icon: BarChart3,
    color: 'pink',
  },
  {
    href: '/sentiment',
    title: 'Sentiment Analysis',
    description: 'Fear & Greed Index and market mood',
    icon: Activity,
    color: 'cyan',
  },
];

const quickActions = [
  { href: '/trending', label: 'Trending Coins', icon: Zap },
  { href: '/gainers-losers', label: 'Top Movers', icon: TrendingUp },
  { href: '/correlation', label: 'Correlation Matrix', icon: Activity },
  { href: '/sentiment', label: 'Fear & Greed', icon: BarChart3 },
];

const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
  emerald: {
    bg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    icon: 'text-emerald-400',
    border: 'border-emerald-500/20 group-hover:border-emerald-500/40',
  },
  blue: {
    bg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
    icon: 'text-blue-400',
    border: 'border-blue-500/20 group-hover:border-blue-500/40',
  },
  purple: {
    bg: 'bg-purple-500/10 group-hover:bg-purple-500/20',
    icon: 'text-purple-400',
    border: 'border-purple-500/20 group-hover:border-purple-500/40',
  },
  orange: {
    bg: 'bg-orange-500/10 group-hover:bg-orange-500/20',
    icon: 'text-orange-400',
    border: 'border-orange-500/20 group-hover:border-orange-500/40',
  },
  cyan: {
    bg: 'bg-cyan-500/10 group-hover:bg-cyan-500/20',
    icon: 'text-cyan-400',
    border: 'border-cyan-500/20 group-hover:border-cyan-500/40',
  },
  pink: {
    bg: 'bg-pink-500/10 group-hover:bg-pink-500/20',
    icon: 'text-pink-400',
    border: 'border-pink-500/20 group-hover:border-pink-500/40',
  },
};

export default function ResearchPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950">
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-4">
            <Search className="w-4 h-4" />
            Research Hub
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">
            Research Workspace
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto">
            Your focused space for exploring datasets, comparing assets, and building a repeatable research workflow.
          </p>
        </div>

        {/* Core Research Tools */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            Core Research Tools
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {researchTools.map((tool) => {
              const colors = colorClasses[tool.color];
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`group relative rounded-xl border ${colors.border} bg-gray-800/50 p-6 transition-all duration-300 hover:bg-gray-800/80 hover:shadow-lg hover:shadow-${tool.color}-500/5`}
                >
                  <div className={`inline-flex p-3 rounded-lg ${colors.bg} mb-4 transition-colors`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-emerald-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Analytics Tools */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            Analytics & Metrics
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {analyticsTools.map((tool) => {
              const colors = colorClasses[tool.color];
              const Icon = tool.icon;
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={`group relative rounded-xl border ${colors.border} bg-gray-800/50 p-6 transition-all duration-300 hover:bg-gray-800/80`}
                >
                  <div className={`inline-flex p-3 rounded-lg ${colors.bg} mb-4 transition-colors`}>
                    <Icon className={`w-6 h-6 ${colors.icon}`} />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    {tool.description}
                  </p>
                  <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="w-5 h-5 text-emerald-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Quick Actions */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Quick Actions
          </h2>
          <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-lg border border-gray-700 bg-gray-800/30 px-4 py-3 transition-all hover:bg-gray-800/60 hover:border-gray-600"
                >
                  <Icon className="w-4 h-4 text-gray-400 group-hover:text-emerald-400 transition-colors" />
                  <span className="text-sm text-gray-300 group-hover:text-white transition-colors">
                    {action.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Display Only Note */}
        <div className="mt-12 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
          <p className="text-sm text-blue-300 text-center">
            All data displayed is for informational purposes only.
            <Link href="/downloads" className="underline ml-1 hover:text-blue-200">
              Download Excel templates
            </Link>
            {' '}to work with live data in Excel (BYOK).
          </p>
        </div>
      </div>
    </div>
  );
}
