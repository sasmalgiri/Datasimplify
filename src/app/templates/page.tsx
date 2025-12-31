'use client';

import { useState } from 'react';
import { FileSpreadsheet, TrendingUp, Wallet, LayoutGrid, Download, Lock } from 'lucide-react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

interface Template {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  coinCount: number;
  category: string;
  isPremium: boolean;
}

const templates: Template[] = [
  {
    id: 'market-overview',
    name: 'Market Overview',
    description: 'Top 100 cryptocurrencies by market cap with all key metrics',
    icon: LayoutGrid,
    coinCount: 100,
    category: 'Market',
    isPremium: false,
  },
  {
    id: 'defi-dashboard',
    name: 'DeFi Dashboard',
    description: 'Top 50 DeFi tokens including TVL, APY, and protocol data',
    icon: TrendingUp,
    coinCount: 50,
    category: 'DeFi',
    isPremium: false,
  },
  {
    id: 'portfolio-tracker',
    name: 'Portfolio Tracker',
    description: 'Custom template to track your holdings with P&L calculations',
    icon: Wallet,
    coinCount: 0,
    category: 'Portfolio',
    isPremium: false,
  },
  {
    id: 'gainers-losers',
    name: 'Top Gainers & Losers',
    description: 'Daily top performers and biggest drops in the market',
    icon: TrendingUp,
    coinCount: 50,
    category: 'Market',
    isPremium: true,
  },
  {
    id: 'exchange-volumes',
    name: 'Exchange Volumes',
    description: 'Trading volume comparison across major exchanges',
    icon: FileSpreadsheet,
    coinCount: 20,
    category: 'Exchange',
    isPremium: true,
  },
];

export default function TemplatesPage() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const filteredTemplates = selectedCategory
    ? templates.filter(t => t.category === selectedCategory)
    : templates;

  const handleDownload = async (templateId: string, isPremium: boolean) => {
    if (isPremium) {
      // Redirect to pricing for premium templates
      window.location.href = '/pricing';
      return;
    }

    setDownloading(templateId);
    try {
      const response = await fetch(`/api/export?template=${templateId}`);
      const blob = await response.blob();

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${templateId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Pre-Built <span className="text-emerald-400">Templates</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Download ready-to-use Excel templates with live crypto data.
            One click, instant download.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex justify-center gap-2 mb-8">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedCategory === null
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
            }`}
          >
            All
          </button>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map(template => {
            const Icon = template.icon;

            return (
              <div
                key={template.id}
                className="bg-gray-800 rounded-xl border border-gray-700 p-6 hover:border-gray-600 transition-colors relative"
              >
                {template.isPremium && (
                  <div className="absolute top-4 right-4 bg-orange-900/50 text-orange-400 text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1 border border-orange-800">
                    <Lock className="w-3 h-3" />
                    Pro
                  </div>
                )}

                <div className="w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center mb-4 border border-emerald-800">
                  <Icon className="w-6 h-6 text-emerald-400" />
                </div>

                <h3 className="text-lg font-semibold text-white mb-2">
                  {template.name}
                </h3>
                <p className="text-gray-400 text-sm mb-4">
                  {template.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm">
                    {template.coinCount > 0 ? `${template.coinCount} coins` : 'Custom'}
                  </span>
                  <button
                    onClick={() => handleDownload(template.id, template.isPremium)}
                    disabled={downloading === template.id}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                      template.isPremium
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-emerald-500 text-white hover:bg-emerald-600'
                    }`}
                  >
                    {downloading === template.id ? (
                      <span className="animate-spin">⏳</span>
                    ) : template.isPremium ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    {template.isPremium ? 'Upgrade' : 'Download'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Custom Template CTA */}
        <div className="mt-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">Need a Custom Template?</h2>
          <p className="text-emerald-100 mb-6">
            Upgrade to Pro and build your own templates with any coins and metrics you need.
          </p>
          <Link
            href="/pricing"
            className="inline-block bg-white text-emerald-600 font-semibold px-6 py-3 rounded-lg hover:bg-emerald-50 transition-colors"
          >
            View Pricing →
          </Link>
        </div>
      </div>
    </div>
  );
}
