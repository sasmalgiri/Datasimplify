'use client';

import { useState, useRef, useEffect } from 'react';
import { RefreshCw, Plus, Camera, Download, FlaskConical, Bell, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import { useWorkspaceStore, useActiveWorkspace } from '@/lib/workspaces/workspaceStore';
import type { Workspace } from '@/lib/workspaces/types';

interface QuickActionsBarProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  getData: () => any;
  onSnapshot: () => void;
}

export function QuickActionsBar({ onRefresh, isRefreshing, getData, onSnapshot }: QuickActionsBarProps) {
  const router = useRouter();
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];
  const activeWorkspace = useActiveWorkspace();
  const { updateWorkspace } = useWorkspaceStore();

  const [showCoinInput, setShowCoinInput] = useState(false);
  const [coinSearch, setCoinSearch] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; symbol: string; name: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const coinInputRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close popover on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (coinInputRef.current && !coinInputRef.current.contains(e.target as Node)) {
        setShowCoinInput(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Debounced coin search
  const handleSearch = (query: string) => {
    setCoinSearch(query);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (query.length < 2) { setSearchResults([]); return; }

    searchTimerRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults((data.coins ?? []).slice(0, 8).map((c: any) => ({
            id: c.id,
            symbol: c.symbol,
            name: c.name,
          })));
        }
      } catch { /* ignore */ }
      setSearching(false);
    }, 350);
  };

  const addCoinToWorkspace = async (coinSymbol: string) => {
    if (!activeWorkspace) return;
    const current = activeWorkspace.config?.coins ?? [];
    const upper = coinSymbol.toUpperCase();
    if (current.map((c) => c.toUpperCase()).includes(upper)) return;
    if (current.length >= 50) return;

    await updateWorkspace(activeWorkspace.id, {
      config: { ...activeWorkspace.config, coins: [...current, upper] },
    });
    setCoinSearch('');
    setSearchResults([]);
    setShowCoinInput(false);
    // Trigger refresh to get new coin data
    setTimeout(() => onRefresh(), 300);
  };

  const handleExport = () => {
    const filteredData = getData();
    if (!filteredData?.markets) return;
    const csv = [
      ['Coin', 'Symbol', 'Price', '24h%', '7d%', 'Market Cap'].join(','),
      ...filteredData.markets.map((m: any) =>
        [m.name, m.symbol.toUpperCase(), m.current_price, (m.price_change_percentage_24h ?? 0).toFixed(2), (m.price_change_percentage_7d_in_currency ?? 0).toFixed(2), m.market_cap].join(',')
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeWorkspace?.name ?? 'workspace'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actions = [
    { label: 'Refresh', icon: RefreshCw, onClick: onRefresh, loading: isRefreshing, primary: true },
    { label: 'Add Coin', icon: Plus, onClick: () => setShowCoinInput(!showCoinInput) },
    { label: 'Snapshot', icon: Camera, onClick: onSnapshot },
    { label: 'Export', icon: Download, onClick: handleExport },
    { label: 'DataLab', icon: FlaskConical, onClick: () => router.push('/datalab') },
  ];

  return (
    <div className="sticky bottom-4 z-40 max-w-3xl mx-auto">
      <div className={`${st.cardClasses} px-4 py-2.5 flex items-center justify-center gap-2 shadow-2xl backdrop-blur-xl`}>
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              type="button"
              title={action.label}
              onClick={action.onClick}
              disabled={!activeWorkspace || action.loading}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium transition disabled:opacity-30 disabled:cursor-not-allowed ${
                action.primary
                  ? `${st.buttonPrimary}`
                  : `${st.buttonSecondary}`
              }`}
            >
              {action.loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Icon className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">{action.label}</span>
            </button>
          );
        })}
      </div>

      {/* Add Coin Popover */}
      {showCoinInput && (
        <div ref={coinInputRef} className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-80 ${st.cardClasses} p-3 shadow-2xl`}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-xs font-semibold ${st.textSecondary}`}>Quick Add Coin</span>
            <button type="button" onClick={() => setShowCoinInput(false)} className="text-gray-500 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <input
            type="text"
            placeholder="Search coins (e.g. bitcoin, ETH)..."
            value={coinSearch}
            onChange={(e) => handleSearch(e.target.value)}
            autoFocus
            className={`w-full px-3 py-2 rounded-lg text-sm ${st.inputBg} focus:outline-none focus:ring-1 focus:ring-emerald-400/40`}
          />
          {searching && (
            <div className="flex items-center gap-2 py-2 px-1">
              <Loader2 className="w-3 h-3 animate-spin text-gray-500" />
              <span className="text-[11px] text-gray-500">Searching...</span>
            </div>
          )}
          {searchResults.length > 0 && (
            <div className="mt-2 max-h-48 overflow-y-auto space-y-0.5">
              {searchResults.map((coin) => (
                <button
                  key={coin.id}
                  type="button"
                  onClick={() => addCoinToWorkspace(coin.symbol)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-[11px] hover:bg-white/[0.06] transition flex items-center justify-between ${st.textSecondary}`}
                >
                  <span>
                    <span className="font-medium">{coin.name}</span>
                    <span className="text-gray-500 ml-1.5">{coin.symbol.toUpperCase()}</span>
                  </span>
                  <Plus className="w-3 h-3 text-emerald-400" />
                </button>
              ))}
            </div>
          )}
          {coinSearch.length >= 2 && !searching && searchResults.length === 0 && (
            <p className="text-[11px] text-gray-500 text-center py-2">No results found</p>
          )}
        </div>
      )}
    </div>
  );
}
