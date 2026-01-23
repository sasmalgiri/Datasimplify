'use client';

import { useState, useEffect, useMemo } from 'react';
import { FileSpreadsheet, AlertTriangle, Settings, Star, ChevronDown, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadModal } from '@/components/TemplateDownloadModal';
import { ProductDisclaimer } from '@/components/ProductDisclaimer';
import { REPORT_KITS, type ReportKit } from '@/lib/reportKits';
import { CoinSelector } from '@/components/CoinSelector';
import {
  getTemplatesGroupedByCategory,
  getSortedCategories,
  type TemplateCategoryId,
} from '@/lib/templates/templateConfig';
import {
  filterAndScoreTemplates,
  getBestMatches,
  getFilteredTemplatesGroupedByCategory,
  getDefaultConfiguration,
  TIMEFRAME_OPTIONS,
  CURRENCY_OPTIONS,
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

// Template Card Component (inline for this page)
function TemplateCard({
  template,
  onSelect,
  config,
}: {
  template: FilteredTemplate;
  onSelect: (id: string) => void;
  config: UserConfiguration;
}) {
  return (
    <div
      onClick={() => onSelect(template.id)}
      className={`relative bg-gray-800/50 border rounded-xl p-4 cursor-pointer transition-all hover:border-emerald-500/50 hover:bg-gray-800/70 ${
        template.isBestMatch
          ? 'border-emerald-500/30 ring-1 ring-emerald-500/20'
          : 'border-gray-700'
      }`}
    >
      {/* Best Match Badge */}
      {template.isBestMatch && (
        <div className="absolute -top-2 -right-2 bg-emerald-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
          <Star className="w-3 h-3" />
          Best Match
        </div>
      )}

      {/* Icon and Title */}
      <div className="flex items-start gap-3">
        <span className="text-2xl">{template.icon}</span>
        <div className="flex-1">
          <h3 className="font-medium text-white mb-1">{template.name}</h3>
          <p className="text-gray-400 text-sm line-clamp-2">
            {template.description}
          </p>
        </div>
      </div>

      {/* Match Reasons */}
      {template.matchReasons.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {template.matchReasons.slice(0, 2).map((reason, i) => (
            <span
              key={i}
              className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded"
            >
              {reason}
            </span>
          ))}
        </div>
      )}

      {/* Mode, Refresh Engine, Difficulty Badges */}
      <div className="mt-3 flex flex-wrap gap-1 items-center">
        {/* Mode Badge */}
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${
            template.mode === 'crk'
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
              : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
          }`}
        >
          {template.mode === 'crk' ? '📊 CRK BYOK' : '🔗 CryptoSheets'}
        </span>

        {/* Refresh Engine Badge */}
        <span className="text-xs px-2 py-0.5 rounded bg-gray-700/50 text-gray-300">
          {template.refreshEngine === 'pack' ? '📦 Pack' : '⚙️ Formula'}
        </span>

        {/* Difficulty Badge */}
        <span
          className={`text-xs px-2 py-0.5 rounded ${
            template.difficulty === 'beginner'
              ? 'bg-green-500/20 text-green-400'
              : template.difficulty === 'intermediate'
              ? 'bg-yellow-500/20 text-yellow-400'
              : 'bg-red-500/20 text-red-400'
          }`}
        >
          {template.difficulty === 'beginner'
            ? '🟢'
            : template.difficulty === 'intermediate'
            ? '🟡'
            : '🔴'}{' '}
          {template.difficulty}
        </span>
      </div>

      {/* Relevance Score (subtle) */}
      {template.relevanceScore > 0 && (
        <div className="mt-2 text-xs text-gray-500">
          Relevance: {template.relevanceScore}
        </div>
      )}
    </div>
  );
}

export default function TemplatesPage() {
  // User configuration state
  const [config, setConfig] = useState<UserConfiguration>(getDefaultConfiguration());

  // Template modal state
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [selectedTemplateName, setSelectedTemplateName] = useState<string>('');

  // Category filter UI state
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);

  // Compute best matches based on configuration
  const bestMatches = useMemo(() => {
    return getBestMatches(config, 4);
  }, [config]);

  // Compute grouped templates based on configuration
  const groupedTemplates = useMemo(() => {
    return getFilteredTemplatesGroupedByCategory(config);
  }, [config]);

  // Handler for template selection
  const handleTemplateSelect = (templateId: string) => {
    const allTemplates = filterAndScoreTemplates(config);
    const template = allTemplates.find((t) => t.id === templateId);
    if (template) {
      setSelectedTemplateId(templateId);
      setSelectedTemplateName(template.name);
      setShowTemplateModal(true);
    }
  };

  // Config update handlers
  const updateCoins = (coins: string[]) => {
    setConfig((prev) => ({ ...prev, coins }));
  };

  const updateTimeframe = (timeframe: string) => {
    setConfig((prev) => ({ ...prev, timeframe }));
  };

  const updateCurrency = (currency: string) => {
    setConfig((prev) => ({ ...prev, currency }));
  };

  const updateCategory = (category: TemplateCategoryId | 'all') => {
    setConfig((prev) => ({ ...prev, category }));
    setShowCategoryDropdown(false);
  };

  const updateMode = (mode: TemplateMode | 'all') => {
    setConfig((prev) => ({ ...prev, mode }));
  };

  const updateRefreshEngine = (refreshEngine: RefreshEngine | 'all') => {
    setConfig((prev) => ({ ...prev, refreshEngine }));
  };

  const updateDifficulty = (difficulty: Difficulty | 'all') => {
    setConfig((prev) => ({ ...prev, difficulty }));
  };

  const categoryOptions = getCategoryOptions();
  const selectedCategoryInfo = categoryOptions.find((c) => c.id === config.category);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            Build Refreshable <span className="text-emerald-400">Crypto Reports</span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto mb-4">
            Professional Excel templates that update with live data. Start with a Report Kit or browse all templates.
          </p>
          {/* Trust Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm">
            <Shield className="w-4 h-4" />
            30-Day Money-Back Guarantee
          </div>
        </div>

        {/* Report Kits Section */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Report Kits</h2>
              <p className="text-gray-400">Complete solutions for common use cases</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {REPORT_KITS.map((kit) => (
              <Link
                key={kit.id}
                href={`/templates/${kit.slug}`}
                className="bg-gray-800/50 border border-gray-700 rounded-xl p-5 hover:border-emerald-500/50 hover:bg-gray-800/70 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <span className="text-4xl">{kit.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-white group-hover:text-emerald-400 transition-colors">
                        {kit.name}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        kit.tier === 'free'
                          ? 'bg-green-500/20 text-green-400'
                          : kit.tier === 'pro'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {kit.tier === 'free' ? 'Free' : kit.tier === 'pro' ? 'Pro' : 'Premium'}
                      </span>
                    </div>
                    <p className="text-gray-400 text-sm mb-3">{kit.tagline}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{kit.templates.length} template(s)</span>
                      <span>{kit.presets.coins} coins</span>
                    </div>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-1 text-emerald-400 text-sm font-medium">
                  View Details <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Product Disclaimer */}
        <ProductDisclaimer variant="compact" className="mb-8 bg-gray-800/50 border-gray-700" />

        {/* Browse All Templates Section */}
        <div id="all" className="border-t border-gray-800 pt-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-white">Browse All Templates</h2>
              <p className="text-gray-400">Configure and download individual templates</p>
            </div>
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="mb-8 bg-gray-800/50 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-emerald-500" />
            <h2 className="text-lg font-semibold text-white">Configure Your Data</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coin Selector */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Coins
              </label>
              <CoinSelector
                selected={config.coins}
                onChange={updateCoins}
                maxCoins={50}
                placeholder="Click to select coins..."
              />
              <p className="text-xs text-gray-500 mt-1">
                Select coins to see relevant templates. Leave empty for market-wide templates.
              </p>
            </div>

            {/* Timeframe & Currency */}
            <div className="space-y-4">
              {/* Timeframe */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Timeframe
                </label>
                <div className="flex flex-wrap gap-1">
                  {TIMEFRAME_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateTimeframe(opt.value)}
                      className={`px-3 py-1.5 text-sm rounded transition ${
                        config.timeframe === opt.value
                          ? 'bg-emerald-500 text-white'
                          : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Currency */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Currency
                </label>
                <select
                  value={config.currency}
                  onChange={(e) => updateCurrency(e.target.value)}
                  aria-label="Select currency"
                  className="w-full px-3 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
                >
                  {CURRENCY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Configuration Summary */}
          <div className="mt-4 pt-4 border-t border-gray-700 flex items-center justify-between">
            <div className="text-sm text-gray-400">
              {config.coins.length === 0 ? (
                <span>No coins selected - showing market-wide templates</span>
              ) : (
                <span>
                  <strong className="text-white">{config.coins.length}</strong> coins selected
                  {config.coins.length <= 3 && (
                    <span className="text-gray-500 ml-1">
                      ({config.coins.join(', ')})
                    </span>
                  )}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-400">
              {bestMatches.length > 0 && (
                <span className="text-emerald-400">
                  <Star className="w-4 h-4 inline mr-1" />
                  {bestMatches.length} best matches found
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="mb-4 flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-400">Category:</span>
          <div className="flex flex-wrap gap-1">
            {categoryOptions.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => updateCategory(cat.id as TemplateCategoryId | 'all')}
                className={`px-3 py-1.5 text-sm rounded-lg transition flex items-center gap-1 ${
                  config.category === cat.id
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gray-800/50 text-gray-300 border border-gray-700 hover:border-gray-600'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="mb-6 bg-gray-800/30 border border-gray-700 rounded-xl p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Mode Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Add-in Mode
              </label>
              <div className="flex flex-wrap gap-1">
                {MODE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateMode(opt.value as TemplateMode | 'all')}
                    className={`px-3 py-1.5 text-xs rounded transition ${
                      config.mode === opt.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
                    }`}
                    title={'description' in opt ? opt.description : opt.label}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Refresh Engine Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Refresh Type
              </label>
              <div className="flex flex-wrap gap-1">
                {REFRESH_ENGINE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateRefreshEngine(opt.value as RefreshEngine | 'all')}
                    className={`px-3 py-1.5 text-xs rounded transition ${
                      config.refreshEngine === opt.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
                    }`}
                    title={'description' in opt ? opt.description : opt.label}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Difficulty Level
              </label>
              <div className="flex flex-wrap gap-1">
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => updateDifficulty(opt.value as Difficulty | 'all')}
                    className={`px-3 py-1.5 text-xs rounded transition ${
                      config.difficulty === opt.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'
                    }`}
                    title={'description' in opt ? opt.description : opt.label}
                  >
                    {opt.icon} {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Filter Summary */}
          <div className="mt-4 pt-3 border-t border-gray-700 flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4 flex-wrap">
              {config.mode && config.mode !== 'all' && (
                <span className="text-emerald-400">
                  Add-in: {MODE_OPTIONS.find((o) => o.value === config.mode)?.label}
                </span>
              )}
              {config.refreshEngine && config.refreshEngine !== 'all' && (
                <span className="text-emerald-400">
                  Type: {REFRESH_ENGINE_OPTIONS.find((o) => o.value === config.refreshEngine)?.label}
                </span>
              )}
              {config.difficulty && config.difficulty !== 'all' && (
                <span className="text-emerald-400">
                  Level: {DIFFICULTY_OPTIONS.find((o) => o.value === config.difficulty)?.label}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setConfig(getDefaultConfiguration())}
              className="text-gray-500 hover:text-gray-300 transition"
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* Important Notice (collapsible) */}
        <details className="mb-8 bg-yellow-900/20 border border-yellow-500/30 rounded-xl overflow-hidden">
          <summary className="p-4 cursor-pointer flex items-center gap-3 hover:bg-yellow-900/30 transition">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
            <span className="font-semibold text-yellow-400">CRK Add-in + API Key Required</span>
            <ChevronDown className="w-4 h-4 text-yellow-500 ml-auto" />
          </summary>
          <div className="px-4 pb-4 pt-0">
            <p className="text-gray-300 text-sm">
              These templates contain <strong>formulas only</strong> - no market data is embedded.
              Data is fetched via the{' '}
              <Link
                href="/template-requirements"
                className="text-emerald-400 hover:underline"
              >
                CRK Excel add-in
              </Link>{' '}
              when you open the file in Microsoft Excel Desktop.
              You must have a <strong>CryptoReportKit account</strong> and connect your own API key (BYOK).
            </p>
            <Link
              href="/template-requirements"
              className="inline-block mt-2 text-sm text-yellow-400 hover:text-yellow-300"
            >
              View full requirements
            </Link>
          </div>
        </details>

        {/* Best Matches Section */}
        {bestMatches.length > 0 && config.category === 'all' && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-semibold text-white">
                Best Matches for Your Selection
              </h2>
              <span className="text-gray-400 text-sm">({bestMatches.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {bestMatches.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                  config={config}
                />
              ))}
            </div>
          </div>
        )}

        {/* Templates Grouped by Category */}
        {groupedTemplates.map((group) => (
          <div key={group.category.id} className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">{group.category.icon}</span>
              <h2 className="text-xl font-semibold text-white">{group.category.name}</h2>
              <span className="text-gray-400 text-sm">({group.templates.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {group.templates.map((template) => (
                <TemplateCard
                  key={template.id}
                  template={template}
                  onSelect={handleTemplateSelect}
                  config={config}
                />
              ))}
            </div>
          </div>
        ))}

        {/* How It Works */}
        <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-6 mb-8">
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
            How Templates Work
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                1
              </div>
              <h3 className="font-medium text-white mb-1">Configure</h3>
              <p className="text-gray-400 text-xs">Select coins and settings above</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                2
              </div>
              <h3 className="font-medium text-white mb-1">Download</h3>
              <p className="text-gray-400 text-xs">Get the .xlsx template file</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                3
              </div>
              <h3 className="font-medium text-white mb-1">Open in Excel</h3>
              <p className="text-gray-400 text-xs">CRK add-in fetches data via BYOK</p>
            </div>
            <div className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center mx-auto mb-3 text-white font-bold">
                4
              </div>
              <h3 className="font-medium text-white mb-1">Refresh</h3>
              <p className="text-gray-400 text-xs">Click Refresh All for latest data</p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="bg-gradient-to-r from-emerald-900/30 to-blue-900/30 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Need Help Getting Started?</h2>
          <p className="text-gray-400 mb-6">
            Check out our setup guide to get your templates working in Excel.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/template-requirements"
              className="inline-block bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              Setup Guide
            </Link>
            <Link
              href="/faq"
              className="inline-block bg-gray-700 hover:bg-gray-600 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
            >
              View FAQ
            </Link>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 text-center">
          <p className="text-gray-500 text-xs">
            <strong>Disclaimer:</strong> Templates contain formulas only - no market data is embedded.
            CryptoReportKit is software tooling, not a data vendor.
            <Link href="/disclaimer" className="text-emerald-400 hover:underline ml-1">
              View full disclaimer
            </Link>
          </p>
        </div>
      </div>

      {/* Template Download Modal */}
      <TemplateDownloadModal
        isOpen={showTemplateModal}
        onClose={() => setShowTemplateModal(false)}
        templateType={selectedTemplateId}
        templateName={selectedTemplateName}
        userConfig={{
          coins: config.coins.length > 0 ? config.coins : ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'],
          timeframe: config.timeframe,
          currency: config.currency,
          customizations: {
            includeCharts: true,
          },
        }}
      />
    </div>
  );
}
