'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, Bell, BellRing, Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors } from '@/lib/live-dashboard/theme';

// ─── Types ───

export interface DashboardAlert {
  id: string;
  type: 'price_above' | 'price_below' | 'tvl_change' | 'yield_above';
  coinId?: string;
  coinName?: string;
  protocol?: string;
  threshold: number;
  isActive: boolean;
  createdAt: number;
  lastTriggered?: number;
}

const STORAGE_KEY = 'crk-dashboard-alerts';

const ALERT_TYPE_LABELS: Record<DashboardAlert['type'], string> = {
  price_above: 'Price Above',
  price_below: 'Price Below',
  tvl_change: 'TVL Change %',
  yield_above: 'Yield Above %',
};

const ALERT_TYPE_OPTIONS: { value: DashboardAlert['type']; label: string }[] = [
  { value: 'price_above', label: 'Price Above' },
  { value: 'price_below', label: 'Price Below' },
  { value: 'tvl_change', label: 'TVL Change %' },
  { value: 'yield_above', label: 'Yield Above %' },
];

// ─── localStorage helpers ───

function loadAlerts(): DashboardAlert[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveAlerts(alerts: DashboardAlert[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
  } catch {
    // storage full or unavailable
  }
}

// ─── Exported: check alerts against live data ───

export function checkAlerts(alerts: DashboardAlert[], data: any): DashboardAlert[] {
  if (!data) return [];
  const triggered: DashboardAlert[] = [];

  for (const alert of alerts) {
    if (!alert.isActive) continue;

    if (alert.type === 'price_above' || alert.type === 'price_below') {
      if (!data.markets || !alert.coinId) continue;
      const coin = data.markets.find(
        (m: any) => m.id === alert.coinId,
      );
      if (!coin) continue;
      const price = coin.current_price;
      if (alert.type === 'price_above' && price >= alert.threshold) {
        triggered.push(alert);
      } else if (alert.type === 'price_below' && price <= alert.threshold) {
        triggered.push(alert);
      }
    }

    if (alert.type === 'tvl_change') {
      if (!data.defiProtocols || !alert.protocol) continue;
      const protocol = data.defiProtocols.find(
        (p: any) => p.slug === alert.protocol || p.name === alert.protocol,
      );
      if (!protocol) continue;
      const change = Math.abs(protocol.change_1d ?? 0);
      if (change >= alert.threshold) {
        triggered.push(alert);
      }
    }

    if (alert.type === 'yield_above') {
      if (!data.defiYields || !alert.protocol) continue;
      const pool = data.defiYields.find(
        (y: any) => y.project === alert.protocol || y.pool === alert.protocol,
      );
      if (!pool) continue;
      if (pool.apy >= alert.threshold) {
        triggered.push(alert);
      }
    }
  }

  return triggered;
}

// ─── Exported: hook for alert badge count ───

export function useAlertCount(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => {
      const alerts = loadAlerts();
      setCount(alerts.filter((a) => a.isActive).length);
    };
    update();

    // Listen for storage changes from other tabs
    const handler = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) update();
    };
    window.addEventListener('storage', handler);

    // Poll for same-tab changes (localStorage doesn't fire events in same tab)
    const interval = setInterval(update, 2000);

    return () => {
      window.removeEventListener('storage', handler);
      clearInterval(interval);
    };
  }, []);

  return count;
}

// ─── Notification helper ───

function requestNotificationPermission(): void {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(alert: DashboardAlert, currentValue?: number): void {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const direction = alert.type === 'price_above' ? 'above' : alert.type === 'price_below' ? 'below' : 'at';
  let body: string;

  if (alert.type === 'price_above' || alert.type === 'price_below') {
    body = `${alert.coinName ?? alert.coinId} price is now ${direction} $${alert.threshold}`;
  } else if (alert.type === 'tvl_change') {
    body = `${alert.protocol} TVL changed by more than ${alert.threshold}%`;
  } else {
    body = `${alert.protocol} yield is now above ${alert.threshold}%`;
  }

  new Notification('CRK Alert', {
    body,
    icon: '/icon.png',
  });
}

// ─── Main Panel Component ───

interface DashboardAlertPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DashboardAlertPanel({ isOpen, onClose }: DashboardAlertPanelProps) {
  const { data, siteTheme } = useLiveDashboardStore((s) => ({
    data: s.data,
    siteTheme: s.siteTheme,
  }));
  const st = getSiteThemeClasses(siteTheme);

  // ── Alert state ──
  const [alerts, setAlerts] = useState<DashboardAlert[]>([]);
  const [triggeredIds, setTriggeredIds] = useState<Set<string>>(new Set());

  // ── Form state ──
  const [formType, setFormType] = useState<DashboardAlert['type']>('price_above');
  const [formCoinId, setFormCoinId] = useState('');
  const [formProtocol, setFormProtocol] = useState('');
  const [formThreshold, setFormThreshold] = useState('');
  const [showForm, setShowForm] = useState(false);

  // Load alerts from localStorage on mount
  useEffect(() => {
    setAlerts(loadAlerts());
  }, []);

  // Persist alerts whenever they change
  const updateAlerts = useCallback((next: DashboardAlert[]) => {
    setAlerts(next);
    saveAlerts(next);
  }, []);

  // Check alerts against current data
  useEffect(() => {
    if (!data) return;
    const active = alerts.filter((a) => a.isActive);
    if (active.length === 0) return;

    const triggered = checkAlerts(active, data);
    if (triggered.length === 0) return;

    const now = Date.now();
    const cooldown = 60_000; // 1 minute cooldown between re-triggers
    const newTriggeredIds = new Set<string>();

    const updated = alerts.map((a) => {
      const match = triggered.find((t) => t.id === a.id);
      if (match && (!a.lastTriggered || now - a.lastTriggered > cooldown)) {
        sendNotification(a);
        newTriggeredIds.add(a.id);
        return { ...a, lastTriggered: now };
      }
      return a;
    });

    if (newTriggeredIds.size > 0) {
      updateAlerts(updated);
      setTriggeredIds(newTriggeredIds);
      // Clear flash after 2 seconds
      setTimeout(() => setTriggeredIds(new Set()), 2000);
    }
  }, [data, alerts, updateAlerts]);

  // ── Handlers ──

  const handleCreate = () => {
    const isPriceType = formType === 'price_above' || formType === 'price_below';
    const thresholdNum = parseFloat(formThreshold);

    if (isNaN(thresholdNum) || thresholdNum <= 0) return;
    if (isPriceType && !formCoinId) return;
    if (!isPriceType && !formProtocol) return;

    // Request notification permission on first alert creation
    requestNotificationPermission();

    const coinData = data?.markets?.find((m) => m.id === formCoinId);

    const newAlert: DashboardAlert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: formType,
      coinId: isPriceType ? formCoinId : undefined,
      coinName: isPriceType && coinData ? coinData.name : undefined,
      protocol: !isPriceType ? formProtocol : undefined,
      threshold: thresholdNum,
      isActive: true,
      createdAt: Date.now(),
    };

    updateAlerts([newAlert, ...alerts]);

    // Reset form
    setFormThreshold('');
    setFormCoinId('');
    setFormProtocol('');
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    updateAlerts(alerts.filter((a) => a.id !== id));
  };

  const handleToggle = (id: string) => {
    updateAlerts(
      alerts.map((a) => (a.id === id ? { ...a, isActive: !a.isActive } : a)),
    );
  };

  // ── Derived values ──

  const isPriceType = formType === 'price_above' || formType === 'price_below';
  const activeCount = alerts.filter((a) => a.isActive).length;

  const selectClass = `w-full ${st.inputBg} rounded-lg px-3 py-2 text-sm focus:border-emerald-400/40 focus:outline-none`;
  const inputClass = `w-full ${st.inputBg} rounded-lg px-3 py-2 text-sm focus:border-emerald-400/40 focus:outline-none`;

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
          onClick={onClose}
        />
      )}

      {/* Slide-out drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-96 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className={`h-full flex flex-col ${
          siteTheme === 'dark'
            ? 'bg-[#0e0e14] border-l border-white/[0.06]'
            : 'bg-white border-l border-blue-200/30'
        } shadow-2xl`}>
          {/* Header */}
          <div className={`flex items-center justify-between px-5 py-4 border-b ${st.divider}`}>
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Bell className={`w-5 h-5 ${st.textSecondary}`} />
                {activeCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-emerald-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
                    {activeCount}
                  </span>
                )}
              </div>
              <div>
                <h2 className={`text-sm font-semibold ${st.textPrimary}`}>Alerts</h2>
                <p className={`text-[11px] ${st.textDim}`}>
                  {activeCount} active alert{activeCount !== 1 ? 's' : ''}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg ${st.buttonSecondary} transition`}
              title="Close alerts"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Create alert section */}
          <div className={`px-5 py-3 border-b ${st.divider}`}>
            {!showForm ? (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium ${st.buttonPrimary} transition`}
              >
                <Plus className="w-4 h-4" />
                New Alert
              </button>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className={`text-xs font-semibold uppercase tracking-wider ${st.textDim}`}>
                    Create Alert
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className={`text-xs ${st.textDim} hover:${st.textPrimary} transition`}
                  >
                    Cancel
                  </button>
                </div>

                {/* Type selector */}
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value as DashboardAlert['type'])}
                  title="Alert type"
                  className={selectClass}
                >
                  {ALERT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value} className={st.selectOptionBg}>
                      {opt.label}
                    </option>
                  ))}
                </select>

                {/* Coin picker (for price alerts) */}
                {isPriceType && (
                  <select
                    value={formCoinId}
                    onChange={(e) => setFormCoinId(e.target.value)}
                    title="Select coin"
                    className={selectClass}
                  >
                    <option value="" className={st.selectOptionBg}>
                      Select a coin...
                    </option>
                    {(data?.markets ?? []).map((coin) => (
                      <option key={coin.id} value={coin.id} className={st.selectOptionBg}>
                        {coin.name} ({coin.symbol.toUpperCase()}) - ${coin.current_price?.toLocaleString() ?? '?'}
                      </option>
                    ))}
                  </select>
                )}

                {/* Protocol picker (for TVL / yield alerts) */}
                {!isPriceType && formType === 'tvl_change' && (
                  <select
                    value={formProtocol}
                    onChange={(e) => setFormProtocol(e.target.value)}
                    title="Select protocol"
                    className={selectClass}
                  >
                    <option value="" className={st.selectOptionBg}>
                      Select a protocol...
                    </option>
                    {(data?.defiProtocols ?? []).slice(0, 100).map((p) => (
                      <option key={p.slug} value={p.slug} className={st.selectOptionBg}>
                        {p.name} - TVL ${(p.tvl / 1e9).toFixed(2)}B
                      </option>
                    ))}
                  </select>
                )}

                {!isPriceType && formType === 'yield_above' && (
                  <select
                    value={formProtocol}
                    onChange={(e) => setFormProtocol(e.target.value)}
                    title="Select yield pool"
                    className={selectClass}
                  >
                    <option value="" className={st.selectOptionBg}>
                      Select a pool/project...
                    </option>
                    {(data?.defiYields ?? []).slice(0, 100).map((y, i) => (
                      <option key={`${y.pool}-${i}`} value={y.project} className={st.selectOptionBg}>
                        {y.project} - {y.symbol} ({y.apy?.toFixed(2)}% APY)
                      </option>
                    ))}
                  </select>
                )}

                {/* Threshold input */}
                <div className="relative">
                  <input
                    type="number"
                    value={formThreshold}
                    onChange={(e) => setFormThreshold(e.target.value)}
                    placeholder={
                      isPriceType
                        ? 'Price threshold (e.g. 50000)'
                        : formType === 'tvl_change'
                          ? 'Change % threshold (e.g. 5)'
                          : 'APY threshold (e.g. 10)'
                    }
                    className={inputClass}
                    min="0"
                    step="any"
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs ${st.textFaint}`}>
                    {isPriceType ? 'USD' : '%'}
                  </span>
                </div>

                {/* Create button */}
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={
                    !formThreshold ||
                    (isPriceType && !formCoinId) ||
                    (!isPriceType && !formProtocol)
                  }
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                    !formThreshold || (isPriceType && !formCoinId) || (!isPriceType && !formProtocol)
                      ? `${st.subtleBg} ${st.textFaint} cursor-not-allowed border ${st.subtleBorder}`
                      : st.buttonPrimary
                  }`}
                >
                  <BellRing className="w-4 h-4" />
                  Create Alert
                </button>
              </div>
            )}
          </div>

          {/* Alert list */}
          <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2">
            {alerts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Bell className={`w-10 h-10 ${st.textFaint} mb-3`} />
                <p className={`text-sm font-medium ${st.textMuted}`}>No alerts yet</p>
                <p className={`text-xs ${st.textDim} mt-1`}>
                  Create an alert to get notified when conditions are met.
                </p>
              </div>
            ) : (
              alerts.map((alert) => {
                const isTriggered = triggeredIds.has(alert.id);
                return (
                  <div
                    key={alert.id}
                    className={`rounded-xl border p-3 transition-all duration-300 ${
                      isTriggered
                        ? 'border-amber-400/50 bg-amber-400/10 animate-pulse'
                        : alert.isActive
                          ? `${st.chipActive} bg-opacity-30`
                          : `${st.subtleBg} ${st.subtleBorder} opacity-60`
                    }`}
                  >
                    {/* Alert header row */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wide ${
                            alert.type === 'price_above'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : alert.type === 'price_below'
                                ? 'bg-red-500/15 text-red-400'
                                : alert.type === 'tvl_change'
                                  ? 'bg-blue-500/15 text-blue-400'
                                  : 'bg-purple-500/15 text-purple-400'
                          }`}
                        >
                          {ALERT_TYPE_LABELS[alert.type]}
                        </span>
                        {isTriggered && (
                          <span className="inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-500/20 text-amber-400 animate-bounce">
                            TRIGGERED
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Toggle */}
                        <button
                          type="button"
                          onClick={() => handleToggle(alert.id)}
                          className={`p-1 rounded-lg transition ${st.textDim} hover:${st.textPrimary}`}
                          title={alert.isActive ? 'Disable alert' : 'Enable alert'}
                        >
                          {alert.isActive ? (
                            <ToggleRight className="w-5 h-5 text-emerald-400" />
                          ) : (
                            <ToggleLeft className={`w-5 h-5 ${st.textFaint}`} />
                          )}
                        </button>
                        {/* Delete */}
                        <button
                          type="button"
                          onClick={() => handleDelete(alert.id)}
                          className={`p-1 rounded-lg transition ${st.textDim} hover:text-red-400`}
                          title="Delete alert"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Alert details */}
                    <div className="mt-2">
                      <p className={`text-sm font-medium ${st.textPrimary} truncate`}>
                        {alert.coinName ?? alert.protocol ?? alert.coinId ?? '—'}
                      </p>
                      <p className={`text-xs ${st.textDim} mt-0.5`}>
                        {alert.type === 'price_above' && `Notify when price >= $${alert.threshold.toLocaleString()}`}
                        {alert.type === 'price_below' && `Notify when price <= $${alert.threshold.toLocaleString()}`}
                        {alert.type === 'tvl_change' && `Notify when TVL changes >= ${alert.threshold}%`}
                        {alert.type === 'yield_above' && `Notify when APY >= ${alert.threshold}%`}
                      </p>
                    </div>

                    {/* Footer: timestamp */}
                    <div className={`flex items-center justify-between mt-2 pt-2 border-t ${st.divider}`}>
                      <span className={`text-[10px] ${st.textFaint}`}>
                        Created {new Date(alert.createdAt).toLocaleDateString()}
                      </span>
                      {alert.lastTriggered && (
                        <span className="text-[10px] text-amber-500/70">
                          Last triggered {new Date(alert.lastTriggered).toLocaleTimeString()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          {alerts.length > 0 && (
            <div className={`px-5 py-3 border-t ${st.divider} flex items-center justify-between`}>
              <span className={`text-xs ${st.textDim}`}>
                {alerts.length} alert{alerts.length !== 1 ? 's' : ''} total
              </span>
              <button
                type="button"
                onClick={() => updateAlerts([])}
                className={`text-xs ${st.textDim} hover:text-red-400 transition`}
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
