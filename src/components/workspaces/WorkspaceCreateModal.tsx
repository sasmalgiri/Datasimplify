'use client';

import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { CoinSelector } from '@/components/CoinSelector';
import { useWorkspaceStore } from '@/lib/workspaces/workspaceStore';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import type { WorkspaceConfig } from '@/lib/workspaces/types';

interface WorkspaceCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (workspaceId: string) => void;
  editWorkspaceId?: string | null;
}

export function WorkspaceCreateModal({
  isOpen,
  onClose,
  onCreated,
  editWorkspaceId,
}: WorkspaceCreateModalProps) {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];

  const { workspaces, createWorkspace, updateWorkspace } = useWorkspaceStore();
  const editingWorkspace = editWorkspaceId
    ? workspaces.find((w) => w.id === editWorkspaceId)
    : null;

  const [name, setName] = useState(editingWorkspace?.name ?? '');
  const [mode, setMode] = useState<'holdings' | 'watchlist'>(
    editingWorkspace?.mode ?? 'watchlist',
  );
  const [coins, setCoins] = useState<string[]>(editingWorkspace?.config?.coins ?? []);
  const [vsCurrency, setVsCurrency] = useState(
    editingWorkspace?.config?.vsCurrency ?? 'usd',
  );
  const [isSaving, setIsSaving] = useState(false);

  const isEditing = !!editWorkspaceId;

  const handleSubmit = async () => {
    if (!name.trim() || coins.length === 0) return;
    setIsSaving(true);

    const config: WorkspaceConfig = {
      coins,
      vsCurrency,
    };

    if (isEditing && editWorkspaceId) {
      await updateWorkspace(editWorkspaceId, { name: name.trim(), mode, config });
      onClose();
    } else {
      const ws = await createWorkspace(name.trim(), mode, config);
      if (ws) {
        onCreated?.(ws.id);
        onClose();
      }
    }

    setIsSaving(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={`relative w-full max-w-lg ${st.cardClasses} p-6 max-h-[90vh] overflow-y-auto`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-lg font-semibold ${st.textPrimary}`}>
            {isEditing ? 'Edit Workspace' : 'Create Workspace'}
          </h2>
          <button onClick={onClose} className={`p-1.5 rounded-lg ${st.buttonSecondary}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-1.5 ${st.textSecondary}`}>
            Workspace Name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Weekly Portfolio"
            className={`w-full px-3 py-2 rounded-lg text-sm ${st.inputBg} focus:ring-1 focus:ring-emerald-400/50 focus:outline-none`}
            maxLength={100}
          />
        </div>

        {/* Mode Toggle */}
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-1.5 ${st.textSecondary}`}>
            Mode
          </label>
          <div className="flex gap-2">
            {(['watchlist', 'holdings'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  mode === m ? st.chipActive : st.chipInactive
                }`}
              >
                {m === 'watchlist' ? 'Watchlist' : 'Holdings'}
              </button>
            ))}
          </div>
          <p className={`text-xs mt-1 ${st.textDim}`}>
            {mode === 'watchlist'
              ? 'Track coins without specifying quantities'
              : 'Track coins with holdings quantities'}
          </p>
        </div>

        {/* Currency */}
        <div className="mb-4">
          <label className={`block text-sm font-medium mb-1.5 ${st.textSecondary}`}>
            Currency
          </label>
          <select
            value={vsCurrency}
            onChange={(e) => setVsCurrency(e.target.value)}
            className={`w-full px-3 py-2 rounded-lg text-sm ${st.inputBg} focus:ring-1 focus:ring-emerald-400/50 focus:outline-none`}
          >
            <option value="usd" className={st.selectOptionBg}>USD</option>
            <option value="eur" className={st.selectOptionBg}>EUR</option>
            <option value="gbp" className={st.selectOptionBg}>GBP</option>
            <option value="btc" className={st.selectOptionBg}>BTC</option>
            <option value="eth" className={st.selectOptionBg}>ETH</option>
          </select>
        </div>

        {/* Coin Selector */}
        <div className="mb-6">
          <label className={`block text-sm font-medium mb-1.5 ${st.textSecondary}`}>
            Coins ({coins.length} selected)
          </label>
          <CoinSelector selected={coins} onChange={setCoins} maxCoins={50} />
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium ${st.buttonSecondary}`}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || coins.length === 0 || isSaving}
            className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-medium ${st.buttonPrimary} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
          >
            {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
            {isEditing ? 'Save Changes' : 'Create Workspace'}
          </button>
        </div>
      </div>
    </div>
  );
}
