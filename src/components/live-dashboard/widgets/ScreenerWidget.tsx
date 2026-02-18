'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useLiveDashboardStore, type MarketCoin } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors, formatCompact, formatPercent, percentColor } from '@/lib/live-dashboard/theme';
import {
  type ScreenerCondition,
  type ScreenerPreset,
  SCREENER_FIELDS,
  SCREENER_OPERATORS,
  DEFAULT_PRESETS,
  applyScreenerConditions,
} from '@/lib/live-dashboard/screener-types';
import Image from 'next/image';
import { Filter, Plus, Trash2, Save, X } from 'lucide-react';

/* ---------- localStorage helpers ---------- */

const STORAGE_KEY = 'crk-screener-presets';

function loadUserPresets(): ScreenerPreset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUserPresets(presets: ScreenerPreset[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presets));
  } catch {
    // silently fail
  }
}

/* ---------- id helper ---------- */

let _idCounter = 0;
function nextId(): string {
  return `sc_${Date.now()}_${++_idCounter}`;
}

/* ---------- component ---------- */

export function ScreenerWidget() {
  const data = useLiveDashboardStore((s) => s.data);
  const { siteTheme, colorTheme, vsCurrency } = useLiveDashboardStore(useShallow((s) => ({
    siteTheme: s.siteTheme,
    colorTheme: s.customization.colorTheme,
    vsCurrency: s.customization.vsCurrency,
  })));

  const tc = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(colorTheme);

  /* ---- conditions state ---- */
  const [conditions, setConditions] = useState<ScreenerCondition[]>([]);
  const [activePresetId, setActivePresetId] = useState<string | null>(null);

  /* ---- user presets from localStorage ---- */
  const [userPresets, setUserPresets] = useState<ScreenerPreset[]>([]);
  const [presetName, setPresetName] = useState('');
  const [showSaveForm, setShowSaveForm] = useState(false);

  // Load user presets on mount
  useEffect(() => {
    setUserPresets(loadUserPresets());
  }, []);

  const allPresets = useMemo(
    () => [...DEFAULT_PRESETS, ...userPresets],
    [userPresets],
  );

  /* ---- preset actions ---- */
  const activatePreset = useCallback((preset: ScreenerPreset) => {
    setConditions(preset.conditions.map((c) => ({ ...c, id: nextId() })));
    setActivePresetId(preset.id);
  }, []);

  const clearPreset = useCallback(() => {
    setConditions([]);
    setActivePresetId(null);
  }, []);

  const handleSavePreset = useCallback(() => {
    if (!presetName.trim() || conditions.length === 0) return;
    const newPreset: ScreenerPreset = {
      id: nextId(),
      name: presetName.trim(),
      conditions: conditions.map((c) => ({ ...c })),
      createdAt: Date.now(),
    };
    const updated = [...userPresets, newPreset];
    setUserPresets(updated);
    saveUserPresets(updated);
    setActivePresetId(newPreset.id);
    setPresetName('');
    setShowSaveForm(false);
  }, [presetName, conditions, userPresets]);

  const deleteUserPreset = useCallback(
    (presetId: string) => {
      const updated = userPresets.filter((p) => p.id !== presetId);
      setUserPresets(updated);
      saveUserPresets(updated);
      if (activePresetId === presetId) {
        setActivePresetId(null);
        setConditions([]);
      }
    },
    [userPresets, activePresetId],
  );

  /* ---- condition builder actions ---- */
  const addCondition = useCallback(() => {
    setConditions((prev) => [
      ...prev,
      { id: nextId(), field: 'price_change_24h', operator: 'gt', value: 0 },
    ]);
    setActivePresetId(null);
  }, []);

  const updateCondition = useCallback(
    (id: string, updates: Partial<ScreenerCondition>) => {
      setConditions((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
      setActivePresetId(null);
    },
    [],
  );

  const removeCondition = useCallback((id: string) => {
    setConditions((prev) => prev.filter((c) => c.id !== id));
    setActivePresetId(null);
  }, []);

  /* ---- apply filter ---- */
  const filtered = useMemo(() => {
    if (!data.markets) return [];
    const result = applyScreenerConditions(data.markets, conditions);
    return [...result].sort(
      (a, b) => (a.market_cap_rank ?? 9999) - (b.market_cap_rank ?? 9999),
    );
  }, [data.markets, conditions]);

  /* ---- loading state ---- */
  if (!data.markets) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-white/[0.04] rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ---- Preset chips ---- */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={clearPreset}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            activePresetId === null && conditions.length === 0
              ? tc.chipActive
              : tc.chipInactive
          }`}
        >
          All Coins
        </button>
        {allPresets.map((preset) => (
          <div key={preset.id} className="relative group">
            <button
              onClick={() => activatePreset(preset)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activePresetId === preset.id ? tc.chipActive : tc.chipInactive
              }`}
            >
              {preset.name}
            </button>
            {/* Delete button for user presets (not built-in) */}
            {preset.createdAt > 0 && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteUserPreset(preset.id);
                }}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                title="Delete preset"
              >
                <X className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* ---- Condition Builder ---- */}
      <div className={`rounded-xl p-3 space-y-2 ${tc.subtleBg} border ${tc.subtleBorder}`}>
        <div className="flex items-center justify-between">
          <span className={`text-xs font-semibold uppercase tracking-wider ${tc.textMuted}`}>
            <Filter className="w-3 h-3 inline mr-1" />
            Conditions
          </span>
          <div className="flex items-center gap-2">
            {conditions.length > 0 && (
              <button
                onClick={() => setShowSaveForm(!showSaveForm)}
                className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors ${tc.chipInactive}`}
              >
                <Save className="w-3 h-3" />
                Save Preset
              </button>
            )}
            <button
              onClick={addCondition}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-colors"
              style={{
                backgroundColor: `${themeColors.primary}20`,
                color: themeColors.primary,
              }}
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
        </div>

        {/* Save preset form */}
        {showSaveForm && (
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Preset name..."
              className={`flex-1 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-emerald-400/40 transition-colors ${tc.inputBg}`}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSavePreset();
              }}
            />
            <button
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: `${themeColors.primary}20`,
                color: themeColors.primary,
              }}
            >
              Save
            </button>
            <button
              onClick={() => {
                setShowSaveForm(false);
                setPresetName('');
              }}
              className={`px-2 py-1.5 rounded-lg text-xs ${tc.textMuted} hover:${tc.textPrimary} transition-colors`}
            >
              Cancel
            </button>
          </div>
        )}

        {/* Condition rows */}
        {conditions.length === 0 && (
          <p className={`text-xs ${tc.textDim} text-center py-2`}>
            No conditions set. Click "Add" to build a filter.
          </p>
        )}

        {conditions.map((condition) => (
          <div
            key={condition.id}
            className="flex items-center gap-2 flex-wrap"
          >
            {/* Field dropdown */}
            <select
              value={condition.field}
              onChange={(e) =>
                updateCondition(condition.id, {
                  field: e.target.value as ScreenerCondition['field'],
                })
              }
              className={`rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-400/40 transition-colors appearance-none ${tc.inputBg}`}
            >
              {SCREENER_FIELDS.map((f) => (
                <option key={f.value} value={f.value} className={tc.selectOptionBg}>
                  {f.label}
                </option>
              ))}
            </select>

            {/* Operator dropdown */}
            <select
              value={condition.operator}
              onChange={(e) =>
                updateCondition(condition.id, {
                  operator: e.target.value as ScreenerCondition['operator'],
                })
              }
              className={`rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-emerald-400/40 transition-colors appearance-none w-20 ${tc.inputBg}`}
            >
              {SCREENER_OPERATORS.map((op) => (
                <option key={op.value} value={op.value} className={tc.selectOptionBg}>
                  {op.label}
                </option>
              ))}
            </select>

            {/* Value input */}
            <input
              type="number"
              step="any"
              value={condition.value}
              onChange={(e) =>
                updateCondition(condition.id, {
                  value: parseFloat(e.target.value) || 0,
                })
              }
              className={`rounded-lg px-2 py-1.5 text-xs w-24 focus:outline-none focus:border-emerald-400/40 transition-colors tabular-nums ${tc.inputBg}`}
              placeholder="Value"
            />

            {/* Second value for 'between' */}
            {condition.operator === 'between' && (
              <>
                <span className={`text-xs ${tc.textDim}`}>and</span>
                <input
                  type="number"
                  step="any"
                  value={condition.value2 ?? ''}
                  onChange={(e) =>
                    updateCondition(condition.id, {
                      value2: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={`rounded-lg px-2 py-1.5 text-xs w-24 focus:outline-none focus:border-emerald-400/40 transition-colors tabular-nums ${tc.inputBg}`}
                  placeholder="Value 2"
                />
              </>
            )}

            {/* Remove button */}
            <button
              onClick={() => removeCondition(condition.id)}
              className="p-1 rounded-md hover:bg-red-400/10 transition-colors group"
              title="Remove condition"
            >
              <Trash2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 transition-colors" />
            </button>
          </div>
        ))}
      </div>

      {/* ---- Match count ---- */}
      <div className="flex items-center justify-between">
        <p className={`text-xs font-medium ${tc.textMuted}`}>
          <span style={{ color: themeColors.primary }}>{filtered.length}</span>{' '}
          coin{filtered.length !== 1 ? 's' : ''} match
        </p>
        {conditions.length > 0 && (
          <p className={`text-[10px] ${tc.textDim}`}>
            {conditions.length} condition{conditions.length !== 1 ? 's' : ''} active
          </p>
        )}
      </div>

      {/* ---- Results table ---- */}
      {filtered.length === 0 && conditions.length > 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
          >
            <Filter className="w-6 h-6 text-gray-500" />
          </div>
          <p className={`text-sm font-medium mb-1 ${tc.textMuted}`}>
            No coins match your criteria
          </p>
          <p className={`text-xs max-w-[240px] ${tc.textDim}`}>
            Try adjusting the conditions or removing a filter to see results.
          </p>
        </div>
      ) : filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`text-xs uppercase border-b ${tc.textDim} ${tc.subtleBorder}`}>
                <th className="text-left py-2 px-3">#</th>
                <th className="text-left py-2 px-3">Coin</th>
                <th className="text-right py-2 px-3">Price</th>
                <th className="text-right py-2 px-3">24h %</th>
                <th className="text-right py-2 px-3 hidden md:table-cell">7d %</th>
                <th className="text-right py-2 px-3 hidden md:table-cell">MCap</th>
                <th className="text-right py-2 px-3 hidden lg:table-cell">Volume</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((coin: MarketCoin) => {
                const change24h = coin.price_change_percentage_24h ?? 0;
                const change7d = coin.price_change_percentage_7d_in_currency ?? null;

                return (
                  <tr
                    key={coin.id}
                    className={`border-b hover:bg-white/[0.03] transition-colors ${tc.divider}`}
                  >
                    <td className={`py-2 px-3 ${tc.textDim}`}>{coin.market_cap_rank}</td>
                    <td className="py-2 px-3">
                      <div className="flex items-center gap-2">
                        {coin.image && (
                          <Image
                            src={coin.image}
                            alt={coin.name}
                            width={20}
                            height={20}
                            className="rounded-full"
                          />
                        )}
                        <div className="flex items-baseline gap-1.5 min-w-0">
                          <span className={`font-medium truncate ${tc.textPrimary}`}>
                            {coin.name}
                          </span>
                          <span className={`uppercase text-[10px] shrink-0 ${tc.textFaint}`}>
                            {coin.symbol}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className={`py-2 px-3 text-right font-medium tabular-nums ${tc.textPrimary}`}>
                      {formatCompact(coin.current_price, vsCurrency)}
                    </td>
                    <td className="py-2 px-3 text-right">
                      <span className={`font-medium ${percentColor(change24h)}`}>
                        {formatPercent(change24h)}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right hidden md:table-cell">
                      <span className={`font-medium ${percentColor(change7d)}`}>
                        {formatPercent(change7d)}
                      </span>
                    </td>
                    <td className={`py-2 px-3 text-right hidden md:table-cell ${tc.textSecondary}`}>
                      {formatCompact(coin.market_cap, vsCurrency)}
                    </td>
                    <td className={`py-2 px-3 text-right hidden lg:table-cell ${tc.textSecondary}`}>
                      {formatCompact(coin.total_volume, vsCurrency)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
