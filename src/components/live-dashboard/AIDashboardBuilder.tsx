'use client';

import { useState } from 'react';
import { Sparkles, Loader2, ArrowLeft, RefreshCw, Zap } from 'lucide-react';
import { DashboardShell } from '@/components/live-dashboard/DashboardShell';
import { ApiKeyModal } from '@/components/live-dashboard/ApiKeyModal';
import { useLiveDashboardStore, isKeyFreeEndpoints } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses } from '@/lib/live-dashboard/theme';
import { useCreditStore, CREDIT_COSTS } from '@/lib/live-dashboard/credits';
import type { LiveDashboardDefinition } from '@/lib/live-dashboard/definitions';

const EXAMPLE_PROMPTS = [
  'Bitcoin vs Ethereum price comparison',
  'DeFi protocol TVL overview with yields',
  'Market overview with fear & greed and trending coins',
  'Derivatives and funding rate analysis',
  'Stablecoin market share and chain TVL',
  'Top gainers with volume analysis',
];

const KEY_FREE_ONLY_ENDPOINTS = new Set([
  'defillama_protocols',
  'defillama_chains',
  'defillama_yields',
  'defillama_stablecoins',
  'defillama_protocol_tvl',
  'defillama_dex_overview',
  'defillama_fees_overview',
  'fear_greed',
]);

export default function AIDashboardBuilder() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [definition, setDefinition] = useState<LiveDashboardDefinition | null>(null);
  const [showKeyModal, setShowKeyModal] = useState(false);

  const { apiKey, siteTheme } = useLiveDashboardStore();
  const st = getSiteThemeClasses(siteTheme);
  const canAfford = useCreditStore((s) => s.canAfford);
  const creditUse = useCreditStore((s) => s.useCredits);

  const handleGenerate = async (desc?: string) => {
    const text = (desc || prompt).trim();
    if (!text) return;

    // Check credit balance
    if (!canAfford('ai_dashboard_build')) {
      setError(`Not enough credits (need ${CREDIT_COSTS.ai_dashboard_build}). Click the credits pill to buy more.`);
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const res = await fetch('/api/live-dashboard/ai-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: text }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed to generate dashboard (${res.status})`);
      }

      const data = await res.json();

      // Determine tier based on required endpoints
      const endpoints: string[] = data.requiredEndpoints || [];
      const tier = isKeyFreeEndpoints(endpoints) ? 'free' : 'pro';

      // Check if CoinGecko API key is needed
      if (!isKeyFreeEndpoints(endpoints) && !apiKey) {
        // Build the definition anyway but show key modal
        const def: LiveDashboardDefinition = {
          slug: `ai-${Date.now()}`,
          name: data.name || 'AI Dashboard',
          description: data.description || '',
          icon: data.icon || '🤖',
          tier,
          gridColumns: 4,
          widgets: data.widgets || [],
          requiredEndpoints: endpoints,
        };
        setDefinition(def);
        setShowKeyModal(true);
        return;
      }

      const def: LiveDashboardDefinition = {
        slug: `ai-${Date.now()}`,
        name: data.name || 'AI Dashboard',
        description: data.description || '',
        icon: data.icon || '🤖',
        tier,
        gridColumns: 4,
        widgets: data.widgets || [],
        requiredEndpoints: endpoints,
      };

      setDefinition(def);
      creditUse('ai_dashboard_build', `AI-built: ${def.name}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setDefinition(null);
    setError(null);
    handleGenerate();
  };

  const handleEditPrompt = () => {
    setDefinition(null);
    setError(null);
  };

  const handleKeySuccess = () => {
    setShowKeyModal(false);
    // Re-fetch data now that we have a key — DashboardShell handles this automatically
  };

  // ── Render: Generated Dashboard View ──────────────────────────────────────
  if (definition) {
    return (
      <div className="min-h-screen">
        {/* Top bar with back / regenerate controls */}
        <div className={`sticky top-0 z-30 backdrop-blur-xl border-b ${st.subtleBorder} px-6 py-3 flex items-center gap-3`}
             style={{ backgroundColor: 'rgba(10, 10, 15, 0.85)' }}>
          <button
            onClick={handleEditPrompt}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${st.buttonSecondary}`}
          >
            <ArrowLeft className="w-4 h-4" />
            Edit Prompt
          </button>
          <button
            onClick={handleRegenerate}
            disabled={isGenerating}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${st.buttonSecondary}`}
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
            Regenerate
          </button>
          <div className="flex-1" />
          <span className="text-xs text-gray-500 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
            AI-Generated
          </span>
        </div>

        <DashboardShell
          definition={definition}
          onOpenKeyModal={() => setShowKeyModal(true)}
        />

        <ApiKeyModal
          isOpen={showKeyModal}
          onClose={() => setShowKeyModal(false)}
          onSuccess={handleKeySuccess}
        />
      </div>
    );
  }

  // ── Render: Prompt Input View ─────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${st.pageBg} flex flex-col items-center justify-center px-4 py-16`}>
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-400/10 border border-emerald-400/20 mb-2">
            <Sparkles className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className={`text-3xl font-bold ${st.textPrimary}`}>
            AI Dashboard Builder
          </h1>
          <p className={`text-base ${st.textMuted}`}>
            Describe the dashboard you want and AI will generate it for you.
          </p>
        </div>

        {/* Text input area */}
        <div className="space-y-4">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the dashboard you want..."
            rows={4}
            className={`w-full rounded-xl px-5 py-4 text-base resize-none focus:outline-none focus:ring-2 focus:ring-emerald-400/40 transition-all placeholder:text-gray-600 ${st.inputBg}`}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handleGenerate();
              }
            }}
          />

          {/* Generate button */}
          <button
            onClick={() => handleGenerate()}
            disabled={!prompt.trim() || isGenerating}
            className={`w-full flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-base font-semibold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
              isGenerating
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30'
            }`}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Dashboard...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Dashboard
                <span className="flex items-center gap-0.5 text-xs opacity-75">
                  <Zap className="w-3 h-3" />
                  {CREDIT_COSTS.ai_dashboard_build}
                </span>
              </>
            )}
          </button>

          <p className={`text-center text-xs ${st.textDim}`}>
            Press <kbd className={`px-1.5 py-0.5 rounded text-xs border ${st.kbdBg}`}>Ctrl</kbd>+<kbd className={`px-1.5 py-0.5 rounded text-xs border ${st.kbdBg}`}>Enter</kbd> to generate
          </p>
        </div>

        {/* Error display */}
        {error && (
          <div className={`rounded-xl px-5 py-4 text-sm ${st.errorBg}`}>
            <p className="font-medium mb-1">Generation failed</p>
            <p className="opacity-80">{error}</p>
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="mt-3 flex items-center gap-2 text-sm underline underline-offset-2 hover:no-underline transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Try again
            </button>
          </div>
        )}

        {/* Example prompts */}
        <div className="space-y-3">
          <p className={`text-xs font-medium uppercase tracking-wider ${st.textDim}`}>
            Try an example
          </p>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_PROMPTS.map((example) => (
              <button
                key={example}
                onClick={() => {
                  setPrompt(example);
                  handleGenerate(example);
                }}
                disabled={isGenerating}
                className={`px-3.5 py-2 rounded-lg text-sm transition-all disabled:opacity-40 ${st.chipInactive} hover:border-emerald-400/30 hover:text-emerald-400`}
              >
                {example}
              </button>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className={`text-center text-xs space-y-1 ${st.textFaint}`}>
          <p>Powered by CRK AI &middot; Generates from 40+ widget components</p>
          <p>DeFi Llama dashboards work without an API key</p>
        </div>
      </div>

      <ApiKeyModal
        isOpen={showKeyModal}
        onClose={() => setShowKeyModal(false)}
        onSuccess={handleKeySuccess}
      />
    </div>
  );
}
