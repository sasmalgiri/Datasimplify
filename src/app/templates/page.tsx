'use client';

import { useState, useMemo } from 'react';
import { Settings, Star, ChevronDown, ChevronUp, ArrowRight, Filter, Clock, Users, Key } from 'lucide-react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadModal } from '@/components/TemplateDownloadModal';
import { REPORT_KITS } from '@/lib/reportKits';
import { CoinSelector } from '@/components/CoinSelector';
import { type TemplateCategoryId } from '@/lib/templates/templateConfig';
import { useViewMode } from '@/lib/viewMode';
import {
  filterAndScoreTemplates,
  getBestMatches,
  getFilteredTemplatesGroupedByCategory,
  getDefaultConfiguration,
  TIMEFRAME_OPTIONS,
  MODE_OPTIONS,
  REFRESH_ENGINE_OPTIONS,
  DIFFICULTY_OPTIONS,
  getCategoryOptions,
  type UserConfiguration,
  type FilteredTemplate,
  type TemplateMode,
  type RefreshEngine,
  type Difficulty,
} from '@/lib/templates/templateFilter';

// Simple mode kit metadata (best for, setup time)
const KIT_METADATA: Record<string, { bestFor: string; setupTime: string; needsKey: boolean }> = {
  'portfolio-starter': { bestFor: 'Beginners', setupTime: '3 min', needsKey: true },
  'market-overview': { bestFor: 'Traders', setupTime: '5 min', needsKey: true },
  'trader-charts': { bestFor: 'Traders', setupTime: '5 min', needsKey: true },
  'screener-watchlist': { bestFor: 'Research', setupTime: '5 min', needsKey: true },
  'coin-research': { bestFor: 'Research', setupTime: '5 min', needsKey: true },
  'risk-correlation': { bestFor: 'Analysts', setupTime: '10 min', needsKey: true },
  'defi-tvl': { bestFor: 'DeFi users', setupTime: '5 min', needsKey: true },
  'stablecoin-monitor': { bestFor: 'Traders', setupTime: '3 min', needsKey: true },
};

// Compact Template Card Component
function TemplateCard({
  template,
  onSelect,
}: {
  template: FilteredTemplate;
  onSelect: (id: string) => void;
}) {
  return (
    <div
      onClick={() => onSelect(template.id)}
      className={`relative bg-gray-800/50 border rounded-lg p-3 cursor-pointer transition-all hover:border-emerald-500/50 hover:bg-gray-800/70 ${
        template.isBestMatch
          ? 'border-emerald-500/30 ring-1 ring-emerald-500/20'
          : 'border-gray-700'
      }`}
    >
      {template.tier === 'pro' && (
        <div className="absolute -top-1.5 -left-1.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
          PRO
        </div>
      )}
      {template.isBestMatch && (
        <div className="absolute -top-1.5 -right-1.5 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
          <Star className="w-2.5 h-2.5" />
        </div>
      )}
      <div className="flex items-center gap-2">
        <span className="text-lg">{template.icon}</span>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-white text-sm truncate">{template.name}</h3>
          <div className="flex items-center gap-1 mt-0.5">
            <span className={`text-[10px] px-1 py-0.5 rounded ${
              template.mode === 'crk'
                ? 'bg-emerald-500/20 text-emerald-400'
                : 'bg-blue-500/20 text-blue-400'
            }`}>
              {template.mode === 'crk' ? 'Static' : '3P'}
            </span>
            <span className={`text-[10px] px-1 py-0.5 rounded ${
              template.difficulty === 'beginner'
                ? 'bg-green-500/20 text-green-400'
                : template.difficulty === 'intermediate'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-red-500/20 text-red-400'
            }`}>
              {template.difficulty === 'beginner' ? '🟢' : template.difficulty === 'intermediate' ? '🟡' : '🔴'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const { isSimple, isPro } = useViewMode();
  const [config, setConfig] = useState<UserConfiguration>(getDefaultConfiguration());
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [showAllTemplates, setShowAllTemplates] = useState(false);

  const bestMatches = useMemo(() => getBestMatches(config, 4), [config]);
  const groupedTemplates = useMemo(() => getFilteredTemplatesGroupedByCategory(config), [config]);
  const categoryOptions = getCategoryOptions();

  const handleTemplateSelect = (templateId: string) => {
    const allTemplates = filterAndScoreTemplates(config);
    const template = allTemplates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setSelectedTemplateName(template.name);
      setShowTemplateModal(true);
    }
  };

  const updateConfig = (updates: Partial<UserConfiguration>) => {
    setConfig((prev) => ({ ...prev, ...updates }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Header - Different messaging for Simple vs Pro */}
        <div className="text-center mb-4">
          <h1 className="text-2xl font-bold text-white">
            {isSimple ? 'Pick a Template Kit' : 'Crypto'} <span className="text-emerald-400">{isSimple ? '' : 'Report Kits'}</span>
          </h1>
          <p className="text-sm text-gray-400">
            {isSimple
              ? 'Choose one to get started. Each kit has everything you need.'
              : 'Professional Excel templates with live data. Pick a kit to get started.'}
          </p>
        </div>

        {/* Report Kits - Different layouts for Simple vs Pro */}
        {isSimple ? (
          // Simple Mode: Larger cards with more info
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {REPORT_KITS.map((kit) => {
              const meta = KIT_METADATA[kit.id] || { bestFor: 'All users', setupTime: '5 min', needsKey: true };
              return (
                <Link
                  key={kit.id}
                  href={`/templates/${kit.slug}`}
                  className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 hover:border-emerald-500/50 hover:bg-gray-800/70 transition-all group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{kit.icon}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                      kit.tier === 'free'
                        ? 'bg-green-500/20 text-green-400'
                        : kit.tier === 'pro'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {kit.tier === 'free' ? 'Free' : 'Pro'}
                    </span>
                  </div>
                  <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors mb-1">
                    {kit.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-3">{kit.tagline}</p>
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="px-2 py-0.5 bg-gray-700/50 rounded text-gray-300">
                      <Users className="w-3 h-3 inline mr-1" />
                      {meta.bestFor}
                    </span>
                    <span className="px-2 py-0.5 bg-gray-700/50 rounded text-gray-300">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {meta.setupTime}
                    </span>
                    {meta.needsKey && (
                      <span className="px-2 py-0.5 bg-yellow-500/20 rounded text-yellow-400">
                        <Key className="w-3 h-3 inline mr-1" />
                        API Key
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex items-center gap-1 text-emerald-400 text-sm font-medium">
                    Get Started <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          // Pro Mode: Compact 4-column grid
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            {REPORT_KITS.map((kit) => (
              <Link
                key={kit.id}
                href={`/templates/${kit.slug}`}
                className="bg-gray-800/50 border border-gray-700 rounded-lg p-3 hover:border-emerald-500/50 hover:bg-gray-800/70 transition-all group"
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{kit.icon}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    kit.tier === 'free'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {kit.tier === 'free' ? 'Free' : 'Pro'}
                  </span>
                </div>
                <h3 className="font-medium text-white text-sm group-hover:text-emerald-400 transition-colors truncate">
                  {kit.name}
                </h3>
                <p className="text-gray-500 text-xs truncate">{kit.tagline}</p>
                <div className="mt-1 flex items-center gap-1 text-emerald-400 text-xs">
                  View <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Browse Templates Toggle - Different labels for Simple vs Pro */}
        <button
          type="button"
          onClick={() => setShowAllTemplates(!showAllTemplates)}
          className="w-full flex items-center justify-between p-3 bg-gray-800/50 border border-gray-700 rounded-lg hover:border-gray-600 transition mb-4"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-emerald-500" />
            <span className="text-sm font-medium">
              {isSimple ? 'Show Advanced Library' : 'Browse All Templates'}
            </span>
            {isPro && (
              <span className="text-xs text-gray-500">({groupedTemplates.reduce((acc, g) => acc + g.templates.length, 0)} templates)</span>
            )}
          </div>
          {showAllTemplates ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </button>

        {showAllTemplates && (
          <>
            {/* Compact Configuration Row */}
            <div className="mb-4 p-3 bg-gray-800/30 border border-gray-700 rounded-lg">
              <div className="flex flex-wrap items-center gap-3">
                {/* Coin Selector - Inline */}
                <div className="flex-1 min-w-[200px]">
                  <CoinSelector
                    selected={config.coins}
                    onChange={(coins) => updateConfig({ coins })}
                    maxCoins={50}
                    placeholder="Select coins..."
                  />
                </div>

                {/* Timeframe Buttons */}
                <div className="flex gap-1">
                  {TIMEFRAME_OPTIONS.map((opt) => (
                    <button
                      type="button"
                      key={opt.value}
                      onClick={() => updateConfig({ timeframe: opt.value })}
                      className={`px-2 py-1 text-xs rounded transition ${
                        config.timeframe === opt.value
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Filter Toggle */}
                <button
                  type="button"
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-2 py-1 text-xs rounded flex items-center gap-1 transition ${
                    showFilters ? 'bg-emerald-500 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  Filters
                </button>
              </div>

              {/* Expandable Filters */}
              {showFilters && (
                <div className="mt-3 pt-3 border-t border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-3">
                  {/* Category */}
                  <div>
                    <label htmlFor="filter-category" className="text-[10px] text-gray-500 uppercase mb-1 block">Category</label>
                    <select
                      id="filter-category"
                      aria-label="Select category"
                      value={config.category}
                      onChange={(e) => updateConfig({ category: e.target.value as TemplateCategoryId | 'all' })}
                      className="w-full px-2 py-1 text-xs bg-gray-700/50 border border-gray-600 rounded text-white"
                    >
                      {categoryOptions.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.icon} {cat.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Mode */}
                  <div>
                    <label htmlFor="filter-mode" className="text-[10px] text-gray-500 uppercase mb-1 block">Mode</label>
                    <select
                      id="filter-mode"
                      aria-label="Select template mode"
                      value={config.mode}
                      onChange={(e) => updateConfig({ mode: e.target.value as TemplateMode | 'all' })}
                      className="w-full px-2 py-1 text-xs bg-gray-700/50 border border-gray-600 rounded text-white"
                    >
                      {MODE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                      ))}
                    </select>
                  </div>
                  {/* Refresh Engine */}
                  <div>
                    <label htmlFor="filter-type" className="text-[10px] text-gray-500 uppercase mb-1 block">Type</label>
                    <select
                      id="filter-type"
                      aria-label="Select refresh type"
                      value={config.refreshEngine}
                      onChange={(e) => updateConfig({ refreshEngine: e.target.value as RefreshEngine | 'all' })}
                      className="w-full px-2 py-1 text-xs bg-gray-700/50 border border-gray-600 rounded text-white"
                    >
                      {REFRESH_ENGINE_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                      ))}
                    </select>
                  </div>
                  {/* Difficulty */}
                  <div>
                    <label htmlFor="filter-level" className="text-[10px] text-gray-500 uppercase mb-1 block">Level</label>
                    <select
                      id="filter-level"
                      aria-label="Select difficulty level"
                      value={config.difficulty}
                      onChange={(e) => updateConfig({ difficulty: e.target.value as Difficulty | 'all' })}
                      className="w-full px-2 py-1 text-xs bg-gray-700/50 border border-gray-600 rounded text-white"
                    >
                      {DIFFICULTY_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.icon} {opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Best Matches */}
            {bestMatches.length > 0 && config.category === 'all' && (
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-sm font-semibold text-white">Best Matches</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {bestMatches.map((template) => (
                    <TemplateCard key={template.id} template={template} onSelect={handleTemplateSelect} />
                  ))}
                </div>
              </div>
            )}

            {/* Templates by Category - Compact */}
            {groupedTemplates.map((group) => (
              <div key={group.category.id} className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">{group.category.icon}</span>
                  <h2 className="text-sm font-semibold text-white">{group.category.name}</h2>
                  <span className="text-xs text-gray-500">({group.templates.length})</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2">
                  {group.templates.map((template) => (
                    <TemplateCard key={template.id} template={template} onSelect={handleTemplateSelect} />
                  ))}
                </div>
              </div>
            ))}
          </>
        )}

        {/* Compact Footer */}
        <div className="flex flex-wrap items-center justify-center gap-4 py-4 text-xs text-gray-500 border-t border-gray-800">
          <Link href="/template-requirements" className="text-emerald-400 hover:underline">Setup Guide</Link>
          <span>•</span>
          <Link href="/faq" className="hover:text-gray-300">FAQ</Link>
          <span>•</span>
          <Link href="/disclaimer" className="hover:text-gray-300">Disclaimer</Link>
          <span>•</span>
          <span>Templates contain formulas only</span>
        </div>
      </div>

      <TemplateDownloadModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        templateType={selectedTemplateId}
        templateName={selectedTemplateName}
        userConfig={{
          coins: config.coins.length > 0 ? config.coins : ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'],
          timeframe: config.timeframe,
          currency: config.currency,
          customizations: { includeCharts: true },
        }}
      />
    </div>
  );
}
