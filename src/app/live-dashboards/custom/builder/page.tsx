'use client';

import { Suspense, useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { ArrowLeft, Plus, Trash2, GripVertical, Save, Layout, ChevronDown } from 'lucide-react';

// ─── Data Model ───
interface CustomDashboardWidget {
  id: string;
  component: string;
  title: string;
  gridColumn: string;
  props?: Record<string, any>;
}

interface CustomDashboardDef {
  id: string;
  name: string;
  icon: string;
  gridColumns: number;
  widgets: CustomDashboardWidget[];
  createdAt: number;
  updatedAt: number;
}

// ─── Widget Categories ───
const WIDGET_CATEGORIES: Record<string, string[]> = {
  'Market Overview': ['KPICards', 'TopCoinsTable', 'GainersLosersWidget', 'FearGreedWidget', 'TrendingWidget', 'DominanceWidget', 'MarketPulseWidget'],
  'Price Charts': ['PriceChartWidget', 'CandlestickChartWidget', 'HeikinAshiWidget', 'HistoricalPriceWidget'],
  'Volume': ['VolumeChartWidget', 'ExchangeVolumeWidget'],
  'Market Structure': ['TreemapWidget', 'PieChartWidget', 'SupplyWidget'],
  'Comparison': ['MultiLineChartWidget', 'CoinCompareWidget', 'CorrelationWidget', 'RadarChartWidget', 'BubbleChartWidget'],
  'Advanced Charts': ['AreaChartWidget', 'WaterfallChartWidget', 'DrawdownChartWidget', 'SankeyFlowWidget'],
  'Analytics': ['TechnicalScreenerWidget', 'TokenomicsWidget', 'MarketCycleWidget'],
  'Intelligence': ['CryptoHealthScoreWidget', 'SmartSignalWidget', 'RiskRadarWidget', 'AlphaFinderWidget', 'MarketBriefWidget'],
  'Utilities': ['PriceConverterWidget', 'WatchlistWidget', 'PriceAlertWidget'],
  'Portfolio & Tax': ['TaxReportWidget', 'DCASimulatorWidget', 'DCATrackerWidget', 'PortfolioInputWidget', 'PLSummaryWidget', 'PLChartWidget', 'AllocationPieWidget', 'ScreenerWidget', 'ExchangeBalanceWidget', 'CycleComparisonWidget'],
};

// Human-readable names for widget components
function widgetDisplayName(component: string): string {
  return component
    .replace(/Widget$/, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
}

const STORAGE_KEY = 'crk-custom-dashboards';

function loadAllDashboards(): CustomDashboardDef[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveDashboard(dashboard: CustomDashboardDef) {
  const all = loadAllDashboards();
  const idx = all.findIndex((d) => d.id === dashboard.id);
  if (idx >= 0) {
    all[idx] = dashboard;
  } else {
    all.push(dashboard);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export default function CustomDashboardBuilderPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center text-gray-500">Loading builder...</div>}>
      <BuilderContent />
    </Suspense>
  );
}

function BuilderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');

  const { siteTheme } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);

  // Dashboard state
  const [name, setName] = useState('My Dashboard');
  const [icon, setIcon] = useState('📊');
  const [gridColumns, setGridColumns] = useState<number>(4);
  const [widgets, setWidgets] = useState<CustomDashboardWidget[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [dashboardId, setDashboardId] = useState<string>(`custom-${Date.now()}`);
  const [isEditing, setIsEditing] = useState(false);

  // Load existing dashboard for editing
  useEffect(() => {
    if (editId) {
      const all = loadAllDashboards();
      const existing = all.find((d) => d.id === editId);
      if (existing) {
        setDashboardId(existing.id);
        setName(existing.name);
        setIcon(existing.icon);
        setGridColumns(existing.gridColumns);
        setWidgets(existing.widgets);
        setIsEditing(true);
      }
    }
  }, [editId]);

  // Selected widget component names
  const selectedComponents = new Set(widgets.map((w) => w.component));

  // Toggle a widget on/off
  const toggleWidget = useCallback((component: string) => {
    setWidgets((prev) => {
      if (prev.some((w) => w.component === component)) {
        return prev.filter((w) => w.component !== component);
      }
      const newWidget: CustomDashboardWidget = {
        id: `w-${component}-${Date.now()}`,
        component,
        title: widgetDisplayName(component),
        gridColumn: 'span 2',
      };
      return [...prev, newWidget];
    });
  }, []);

  // Toggle category expansion
  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  }, []);

  // Update widget grid width
  const setWidgetWidth = useCallback((widgetId: string, width: 'half' | 'full') => {
    setWidgets((prev) =>
      prev.map((w) =>
        w.id === widgetId
          ? { ...w, gridColumn: width === 'full' ? '1 / -1' : 'span 2' }
          : w
      )
    );
  }, []);

  // Remove a widget
  const removeWidget = useCallback((widgetId: string) => {
    setWidgets((prev) => prev.filter((w) => w.id !== widgetId));
  }, []);

  // Move widget up/down for reordering
  const moveWidget = useCallback((widgetId: string, direction: 'up' | 'down') => {
    setWidgets((prev) => {
      const idx = prev.findIndex((w) => w.id === widgetId);
      if (idx < 0) return prev;
      const newIdx = direction === 'up' ? idx - 1 : idx + 1;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy;
    });
  }, []);

  // Save dashboard
  const handleSave = useCallback(() => {
    if (!name.trim()) return;
    if (widgets.length === 0) return;

    const now = Date.now();
    const dashboard: CustomDashboardDef = {
      id: dashboardId,
      name: name.trim(),
      icon: icon || '📊',
      gridColumns,
      widgets,
      createdAt: isEditing ? (loadAllDashboards().find((d) => d.id === dashboardId)?.createdAt ?? now) : now,
      updatedAt: now,
    };

    saveDashboard(dashboard);
    router.push('/live-dashboards');
  }, [dashboardId, name, icon, gridColumns, widgets, isEditing, router]);

  const canSave = name.trim().length > 0 && widgets.length > 0;

  return (
    <div className={`min-h-screen ${st.pageBg}`} data-dashboard-theme={siteTheme}>
      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* ─── Header ─── */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link
              href="/live-dashboards"
              className={`p-2 rounded-xl ${st.buttonSecondary} transition`}
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className={`text-2xl font-bold ${st.textPrimary}`}>
                {isEditing ? 'Edit Dashboard' : 'Custom Dashboard Builder'}
              </h1>
              <p className={`text-sm ${st.textDim} mt-1`}>
                Choose widgets and layout to build your personalized dashboard
              </p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition ${
              canSave
                ? `${st.buttonPrimary}`
                : 'bg-gray-700/30 text-gray-600 cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            {isEditing ? 'Update' : 'Save'} Dashboard
          </button>
        </div>

        {/* ─── Dashboard Settings ─── */}
        <div className={`${st.cardClasses} p-6 mb-6`}>
          <h2 className={`text-sm font-semibold ${st.textMuted} uppercase tracking-widest mb-5 flex items-center gap-2`}>
            <Layout className="w-4 h-4" />
            Dashboard Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Name */}
            <div>
              <label className={`block text-xs font-medium ${st.textDim} mb-2`}>
                Dashboard Name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Dashboard"
                className={`w-full px-4 py-2.5 rounded-xl ${st.inputBg} text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400/40 transition`}
              />
            </div>

            {/* Icon */}
            <div>
              <label className={`block text-xs font-medium ${st.textDim} mb-2`}>
                Icon (emoji)
              </label>
              <input
                type="text"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
                placeholder="📊"
                className={`w-full px-4 py-2.5 rounded-xl ${st.inputBg} text-sm focus:outline-none focus:ring-1 focus:ring-emerald-400/40 transition`}
                maxLength={4}
              />
            </div>

            {/* Grid columns */}
            <div>
              <label className={`block text-xs font-medium ${st.textDim} mb-2`}>
                Grid Columns
              </label>
              <div className="flex gap-3">
                {[2, 4].map((cols) => (
                  <button
                    key={cols}
                    onClick={() => setGridColumns(cols)}
                    className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                      gridColumns === cols ? st.chipActive : st.chipInactive
                    }`}
                  >
                    {cols} Columns
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── Widget Picker ─── */}
        <div className={`${st.cardClasses} p-6 mb-6`}>
          <h2 className={`text-sm font-semibold ${st.textMuted} uppercase tracking-widest mb-5 flex items-center gap-2`}>
            <Plus className="w-4 h-4" />
            Add Widgets
          </h2>
          <div className="space-y-2">
            {Object.entries(WIDGET_CATEGORIES).map(([category, categoryWidgets]) => {
              const isExpanded = expandedCategories[category] ?? false;
              const selectedCount = categoryWidgets.filter((w) => selectedComponents.has(w)).length;

              return (
                <div key={category} className={`rounded-xl border ${st.subtleBorder} overflow-hidden`}>
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className={`w-full flex items-center justify-between px-4 py-3 ${st.subtleBg} hover:bg-white/[0.06] transition text-left`}
                  >
                    <div className="flex items-center gap-3">
                      <ChevronDown
                        className={`w-4 h-4 ${st.textDim} transition-transform ${isExpanded ? 'rotate-0' : '-rotate-90'}`}
                      />
                      <span className={`text-sm font-medium ${st.textSecondary}`}>{category}</span>
                    </div>
                    {selectedCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400/15 text-emerald-400 text-[10px] font-bold">
                        {selectedCount} selected
                      </span>
                    )}
                  </button>

                  {/* Category widgets */}
                  {isExpanded && (
                    <div className="px-4 py-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {categoryWidgets.map((component) => {
                        const isSelected = selectedComponents.has(component);
                        return (
                          <button
                            key={component}
                            onClick={() => toggleWidget(component)}
                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-left transition ${
                              isSelected
                                ? 'bg-emerald-400/10 border border-emerald-400/25 text-emerald-400'
                                : `${st.subtleBg} border ${st.subtleBorder} ${st.textDim} hover:bg-white/[0.06]`
                            }`}
                          >
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition ${
                                isSelected
                                  ? 'bg-emerald-400 border-emerald-400'
                                  : `${st.subtleBorder}`
                              }`}
                            >
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              )}
                            </div>
                            {widgetDisplayName(component)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ─── Selected Widgets (reorderable) ─── */}
        <div className={`${st.cardClasses} p-6`}>
          <h2 className={`text-sm font-semibold ${st.textMuted} uppercase tracking-widest mb-5 flex items-center gap-2`}>
            <GripVertical className="w-4 h-4" />
            Selected Widgets ({widgets.length})
          </h2>

          {widgets.length === 0 ? (
            <div className={`text-center py-12 ${st.textDim}`}>
              <Layout className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No widgets selected yet.</p>
              <p className="text-xs mt-1 opacity-60">Expand a category above and click widgets to add them.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {widgets.map((widget, idx) => (
                <div
                  key={widget.id}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl ${st.subtleBg} border ${st.subtleBorder} group`}
                >
                  {/* Drag handle / order controls */}
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => moveWidget(widget.id, 'up')}
                      disabled={idx === 0}
                      className={`p-0.5 rounded transition ${st.textDim} hover:text-white disabled:opacity-20 disabled:cursor-not-allowed`}
                      title="Move up"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M6 2l4 5H2l4-5z" fill="currentColor" />
                      </svg>
                    </button>
                    <button
                      onClick={() => moveWidget(widget.id, 'down')}
                      disabled={idx === widgets.length - 1}
                      className={`p-0.5 rounded transition ${st.textDim} hover:text-white disabled:opacity-20 disabled:cursor-not-allowed`}
                      title="Move down"
                    >
                      <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                        <path d="M6 10L2 5h8l-4 5z" fill="currentColor" />
                      </svg>
                    </button>
                  </div>

                  {/* Order number */}
                  <span className={`text-[10px] font-mono ${st.textFaint} w-5 text-center`}>
                    {idx + 1}
                  </span>

                  {/* Widget name */}
                  <span className={`text-sm ${st.textPrimary} flex-1 truncate`}>
                    {widget.title}
                  </span>

                  {/* Width selector */}
                  <div className="flex gap-1">
                    <button
                      onClick={() => setWidgetWidth(widget.id, 'half')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-medium transition ${
                        widget.gridColumn === 'span 2' ? st.chipActive : st.chipInactive
                      }`}
                      title="Half width"
                    >
                      Half
                    </button>
                    <button
                      onClick={() => setWidgetWidth(widget.id, 'full')}
                      className={`px-3 py-1 rounded-lg text-[10px] font-medium transition ${
                        widget.gridColumn === '1 / -1' ? st.chipActive : st.chipInactive
                      }`}
                      title="Full width"
                    >
                      Full
                    </button>
                  </div>

                  {/* Remove */}
                  <button
                    onClick={() => removeWidget(widget.id)}
                    className={`p-1.5 rounded-lg ${st.textDim} hover:text-red-400 hover:bg-red-400/10 transition`}
                    title="Remove widget"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ─── Bottom Save Bar ─── */}
        {widgets.length > 0 && (
          <div className="sticky bottom-4 mt-6">
            <div className={`${st.cardClasses} p-4 flex items-center justify-between`}>
              <span className={`text-sm ${st.textDim}`}>
                {widgets.length} widget{widgets.length !== 1 ? 's' : ''} selected &middot; {gridColumns}-column layout
              </span>
              <button
                onClick={handleSave}
                disabled={!canSave}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition ${
                  canSave
                    ? `${st.buttonPrimary}`
                    : 'bg-gray-700/30 text-gray-600 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                {isEditing ? 'Update' : 'Save'} Dashboard
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
