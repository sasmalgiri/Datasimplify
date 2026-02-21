'use client';

import { useState } from 'react';
import { ArrowRight, ArrowLeft, Check, Loader2, Sparkles, BarChart3, TrendingUp, Layers } from 'lucide-react';
import { CoinSelector } from '@/components/CoinSelector';
import { useWorkspaceStore } from '@/lib/workspaces/workspaceStore';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import { getTopCoins } from '@/lib/templates/cryptoSheetCoins';

interface QuickStartWizardProps {
  onComplete: (workspaceId: string) => void;
  onSkip?: () => void;
}

const PACK_PRESETS = [
  {
    id: 'portfolio-weekly',
    name: 'Portfolio Weekly',
    description: 'Track your portfolio with weekly reports, KPIs, and performance charts',
    icon: BarChart3,
    defaultCoins: () => getTopCoins(10).map((c) => c.symbol),
  },
  {
    id: 'defi-watch',
    name: 'DeFi Watch',
    description: 'Monitor DeFi tokens and protocols',
    icon: Layers,
    defaultCoins: () => ['UNI', 'AAVE', 'MKR', 'LDO', 'CRV', 'SNX', 'LINK', 'COMP'],
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'Pick your own coins and build a custom workspace',
    icon: Sparkles,
    defaultCoins: () => [] as string[],
  },
];

const COIN_PRESETS = [
  { name: 'Top 10 by Market Cap', getCoins: () => getTopCoins(10).map((c) => c.symbol) },
  { name: 'Top 20 by Market Cap', getCoins: () => getTopCoins(20).map((c) => c.symbol) },
  { name: 'DeFi Blue Chips', getCoins: () => ['UNI', 'AAVE', 'MKR', 'LDO', 'CRV', 'SNX'] },
  { name: 'Layer 1s', getCoins: () => ['BTC', 'ETH', 'SOL', 'ADA', 'AVAX', 'DOT', 'NEAR', 'ATOM'] },
];

export function QuickStartWizard({ onComplete, onSkip }: QuickStartWizardProps) {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];
  const { createWorkspace } = useWorkspaceStore();

  const [step, setStep] = useState(1);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [coins, setCoins] = useState<string[]>([]);
  const [name, setName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const handlePackSelect = (packId: string) => {
    setSelectedPack(packId);
    const preset = PACK_PRESETS.find((p) => p.id === packId);
    if (preset) {
      const defaultCoins = preset.defaultCoins();
      setCoins(defaultCoins);
      if (packId !== 'custom') {
        setName(preset.name);
      }
    }
  };

  const handleFinish = async () => {
    if (!name.trim() || coins.length === 0) return;
    setIsCreating(true);
    const ws = await createWorkspace(name.trim(), 'watchlist', {
      coins,
      vsCurrency: 'usd',
      reportPackId: selectedPack !== 'custom' ? selectedPack ?? undefined : undefined,
    });
    setIsCreating(false);
    if (ws) {
      onComplete(ws.id);
    }
  };

  return (
    <div className={`max-w-2xl mx-auto py-12 px-4`}>
      {/* Progress */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                step > s
                  ? 'bg-emerald-500 text-white'
                  : step === s
                    ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                    : `${st.subtleBg} ${st.textDim} border ${st.subtleBorder}`
              }`}
            >
              {step > s ? <Check className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div
                className={`w-12 h-0.5 ${step > s ? 'bg-emerald-500' : `${st.subtleBg}`}`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Pick Pack Type */}
      {step === 1 && (
        <div>
          <h2 className={`text-2xl font-bold text-center mb-2 ${st.textPrimary}`}>
            Welcome! What would you like to track?
          </h2>
          <p className={`text-center mb-8 ${st.textMuted}`}>
            Pick a starting point — you can always customize later
          </p>

          <div className="grid gap-4">
            {PACK_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const isSelected = selectedPack === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handlePackSelect(preset.id)}
                  className={`${st.cardClasses} p-5 text-left transition-all ${
                    isSelected
                      ? 'border-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.08)]'
                      : st.cardGlow
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isSelected
                          ? 'bg-emerald-400/20 text-emerald-400'
                          : `${st.subtleBg} ${st.textMuted}`
                      }`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className={`font-semibold ${st.textPrimary}`}>{preset.name}</h3>
                      <p className={`text-sm ${st.textMuted}`}>{preset.description}</p>
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-emerald-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="flex justify-between mt-8">
            {onSkip && (
              <button
                onClick={onSkip}
                className={`text-sm ${st.textDim} hover:${st.textMuted}`}
              >
                Skip for now
              </button>
            )}
            <button
              onClick={() => setStep(2)}
              disabled={!selectedPack}
              className={`ml-auto px-6 py-2.5 rounded-lg text-sm font-medium ${st.buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2`}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Coins */}
      {step === 2 && (
        <div>
          <h2 className={`text-2xl font-bold text-center mb-2 ${st.textPrimary}`}>
            Select your coins
          </h2>
          <p className={`text-center mb-6 ${st.textMuted}`}>
            Pick from presets or search for specific coins
          </p>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-2 mb-4">
            {COIN_PRESETS.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setCoins(preset.getCoins())}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${st.chipInactive}`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Coin Selector */}
          <div className="mb-6">
            <CoinSelector selected={coins} onChange={setCoins} maxCoins={50} />
          </div>

          <p className={`text-sm mb-6 ${st.textDim}`}>
            {coins.length} coin{coins.length !== 1 ? 's' : ''} selected
          </p>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium ${st.buttonSecondary} flex items-center gap-2`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={coins.length === 0}
              className={`flex-1 px-6 py-2.5 rounded-lg text-sm font-medium ${st.buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Name + Confirm */}
      {step === 3 && (
        <div>
          <h2 className={`text-2xl font-bold text-center mb-2 ${st.textPrimary}`}>
            Name your workspace
          </h2>
          <p className={`text-center mb-8 ${st.textMuted}`}>
            Give it a name you'll recognize
          </p>

          <div className="mb-6">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. My Weekly Portfolio"
              className={`w-full px-4 py-3 rounded-xl text-base ${st.inputBg} focus:ring-2 focus:ring-emerald-400/50 focus:outline-none`}
              maxLength={100}
              autoFocus
            />
          </div>

          {/* Summary */}
          <div className={`${st.cardClasses} p-4 mb-8`}>
            <h4 className={`text-xs uppercase font-medium mb-3 ${st.textDim}`}>
              Summary
            </h4>
            <div className={`space-y-2 text-sm ${st.textSecondary}`}>
              <div className="flex justify-between">
                <span>Pack Type</span>
                <span className={`font-medium ${st.textPrimary}`}>
                  {PACK_PRESETS.find((p) => p.id === selectedPack)?.name ?? 'Custom'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Coins</span>
                <span className={`font-medium ${st.textPrimary}`}>
                  {coins.length} selected
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mode</span>
                <span className={`font-medium ${st.textPrimary}`}>Watchlist</span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              className={`px-4 py-2.5 rounded-lg text-sm font-medium ${st.buttonSecondary} flex items-center gap-2`}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
            <button
              onClick={handleFinish}
              disabled={!name.trim() || coins.length === 0 || isCreating}
              className={`flex-1 px-6 py-2.5 rounded-lg text-sm font-medium ${st.buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Create & Start
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
