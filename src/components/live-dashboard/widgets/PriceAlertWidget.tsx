'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { useUserPrefsStore, type PriceAlert } from '@/lib/live-dashboard/user-prefs-store';
import { getThemeColors } from '@/lib/live-dashboard/theme';
import { Bell, BellOff, Plus, Trash2, ArrowUp, ArrowDown, Check } from 'lucide-react';

/* ---------- helpers ---------- */

function formatPrice(n: number): string {
  if (n < 0.01) return `$${n.toFixed(8)}`;
  if (n < 1) return `$${n.toFixed(6)}`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function sendBrowserNotification(title: string, body: string) {
  if (typeof window === 'undefined') return;
  if (!('Notification' in window)) return;

  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
    });
  }
}

/* ---------- component ---------- */

export interface PriceAlertWidgetProps {}

export function PriceAlertWidget({}: PriceAlertWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const {
    priceAlerts,
    addPriceAlert,
    removePriceAlert,
    togglePriceAlert,
    markAlertTriggered,
  } = useUserPrefsStore();
  const themeColors = getThemeColors(customization.colorTheme);

  // Track which alerts we have already notified about, to avoid duplicate notifications
  const notifiedRef = useRef<Set<string>>(new Set());

  // ---- Form state ----
  const [selectedCoinId, setSelectedCoinId] = useState('');
  const [condition, setCondition] = useState<'above' | 'below'>('above');
  const [threshold, setThreshold] = useState('');
  const [showForm, setShowForm] = useState(false);

  const markets = data.markets ?? [];
  const selectableCoins = markets.slice(0, 20);

  // ---- Check alerts against current prices ----
  const checkAlerts = useCallback(() => {
    if (!markets.length) return;

    for (const alert of priceAlerts) {
      if (!alert.enabled || alert.triggered) continue;

      const coin = markets.find((c) => c.id === alert.coinId);
      if (!coin) continue;

      const price = coin.current_price;
      const triggered =
        (alert.condition === 'above' && price >= alert.threshold) ||
        (alert.condition === 'below' && price <= alert.threshold);

      if (triggered) {
        markAlertTriggered(alert.id);

        // Send browser notification (once per alert)
        if (!notifiedRef.current.has(alert.id)) {
          notifiedRef.current.add(alert.id);
          sendBrowserNotification(
            'Price Alert Triggered',
            `${alert.coinName} is now ${formatPrice(price)} (${alert.condition} ${formatPrice(alert.threshold)})`,
          );
        }
      }
    }
  }, [markets, priceAlerts, markAlertTriggered]);

  useEffect(() => {
    checkAlerts();
  }, [checkAlerts]);

  // ---- Request notification permission on mount ----
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // ---- Add alert handler ----
  const handleAddAlert = () => {
    if (!selectedCoinId || !threshold) return;
    const coin = markets.find((c) => c.id === selectedCoinId);
    if (!coin) return;

    addPriceAlert({
      coinId: coin.id,
      coinName: coin.name,
      condition,
      threshold: parseFloat(threshold),
      enabled: true,
    });

    // Reset form
    setSelectedCoinId('');
    setThreshold('');
    setCondition('above');
    setShowForm(false);
  };

  /* -- empty state -- */
  if (priceAlerts.length === 0 && !showForm) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}
        >
          <Bell className="w-6 h-6 text-gray-500" />
        </div>
        <p className="text-gray-400 text-sm font-medium mb-1">No alerts yet</p>
        <p className="text-gray-500 text-xs max-w-[240px] mb-4">
          Set price alerts to get notified when coins cross your target prices.
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
          style={{
            backgroundColor: `${themeColors.primary}20`,
            color: themeColors.primary,
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Alert
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ---- Alert list ---- */}
      {priceAlerts.length > 0 && (
        <div className="space-y-1.5">
          {priceAlerts.map((alert) => (
            <AlertRow
              key={alert.id}
              alert={alert}
              currentPrice={markets.find((c) => c.id === alert.coinId)?.current_price}
              onToggle={() => togglePriceAlert(alert.id)}
              onDelete={() => removePriceAlert(alert.id)}
              themeColors={themeColors}
            />
          ))}
        </div>
      )}

      {/* ---- Add alert button / form ---- */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.06] border border-white/[0.06] transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Alert
        </button>
      ) : (
        <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] p-3 space-y-3">
          <p className="text-xs font-semibold text-gray-300 uppercase tracking-wider">
            New Alert
          </p>

          {/* Coin selector */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">
              Coin
            </label>
            <select
              value={selectedCoinId}
              onChange={(e) => setSelectedCoinId(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-400/40 transition-colors appearance-none"
            >
              <option value="" className="bg-[#0a0a0f]">
                Select a coin...
              </option>
              {selectableCoins.map((coin) => (
                <option key={coin.id} value={coin.id} className="bg-[#0a0a0f]">
                  {coin.name} ({coin.symbol.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {/* Condition toggle */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">
              Condition
            </label>
            <div className="flex rounded-lg overflow-hidden border border-white/[0.08]">
              <button
                onClick={() => setCondition('above')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  condition === 'above'
                    ? 'bg-emerald-400/15 text-emerald-400'
                    : 'bg-white/[0.03] text-gray-400 hover:text-gray-300'
                }`}
              >
                <ArrowUp className="w-3 h-3" />
                Price above
              </button>
              <button
                onClick={() => setCondition('below')}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors ${
                  condition === 'below'
                    ? 'bg-red-400/15 text-red-400'
                    : 'bg-white/[0.03] text-gray-400 hover:text-gray-300'
                }`}
              >
                <ArrowDown className="w-3 h-3" />
                Price below
              </button>
            </div>
          </div>

          {/* Threshold input */}
          <div>
            <label className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 block">
              Threshold (USD)
            </label>
            <input
              type="number"
              step="any"
              min="0"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              placeholder="e.g. 100000"
              className="w-full bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:outline-none focus:border-emerald-400/40 transition-colors tabular-nums"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleAddAlert}
              disabled={!selectedCoinId || !threshold}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor: selectedCoinId && threshold ? `${themeColors.primary}20` : undefined,
                color: selectedCoinId && threshold ? themeColors.primary : undefined,
              }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add
            </button>
            <button
              onClick={() => {
                setShowForm(false);
                setSelectedCoinId('');
                setThreshold('');
                setCondition('above');
              }}
              className="px-3 py-2 rounded-lg text-xs font-medium text-gray-400 hover:text-white bg-white/[0.04] hover:bg-white/[0.06] transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- alert row sub-component ---------- */

function AlertRow({
  alert,
  currentPrice,
  onToggle,
  onDelete,
  themeColors,
}: {
  alert: PriceAlert;
  currentPrice?: number;
  onToggle: () => void;
  onDelete: () => void;
  themeColors: { primary: string };
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg px-3 py-2 transition-colors ${
        alert.triggered
          ? 'bg-emerald-400/[0.06] border border-emerald-400/[0.15]'
          : 'bg-white/[0.04] border border-transparent'
      }`}
    >
      {/* Icon */}
      <div className="shrink-0">
        {alert.triggered ? (
          <div className="w-7 h-7 rounded-full bg-emerald-400/15 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        ) : alert.enabled ? (
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${themeColors.primary}15` }}
          >
            <Bell className="w-3.5 h-3.5" style={{ color: themeColors.primary }} />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center">
            <BellOff className="w-3.5 h-3.5 text-gray-500" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-medium text-white truncate">
            {alert.coinName}
          </span>
          {alert.triggered && (
            <span className="shrink-0 text-[10px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
              Triggered!
            </span>
          )}
        </div>
        <p className="text-[10px] text-gray-500 leading-tight">
          {alert.condition === 'above' ? 'Above' : 'Below'}{' '}
          {formatPrice(alert.threshold)}
          {currentPrice != null && (
            <span className="text-gray-600 ml-1">
              (now {formatPrice(currentPrice)})
            </span>
          )}
        </p>
      </div>

      {/* Toggle */}
      <button
        onClick={onToggle}
        className="shrink-0 p-1 rounded-md hover:bg-white/[0.06] transition-colors"
        aria-label={alert.enabled ? 'Disable alert' : 'Enable alert'}
        title={alert.enabled ? 'Disable' : 'Enable'}
      >
        {alert.enabled ? (
          <Bell className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <BellOff className="w-3.5 h-3.5 text-gray-500" />
        )}
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="shrink-0 p-1 rounded-md hover:bg-red-400/10 transition-colors group"
        aria-label={`Delete alert for ${alert.coinName}`}
        title="Delete"
      >
        <Trash2 className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 transition-colors" />
      </button>
    </div>
  );
}
