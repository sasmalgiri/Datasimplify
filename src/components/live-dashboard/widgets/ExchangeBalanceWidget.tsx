'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getSiteThemeClasses, getThemeColors, formatCompact, TABLE_DENSITY_MAP } from '@/lib/live-dashboard/theme';
import { RefreshCw, Link2, Unlink, Eye, EyeOff, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

/* ---------- types ---------- */

interface ExchangeCredentials {
  exchange: string;
  apiKey: string;
  apiSecret: string;
  passphrase?: string;
  connected: boolean;
  lastFetched?: number;
}

interface BalanceEntry {
  asset: string;
  free: number;
  locked: number;
}

interface ExchangeBalanceData {
  exchange: string;
  balances: BalanceEntry[];
  fetchedAt: number;
  error?: string;
}

/* ---------- constants ---------- */

const STORAGE_KEY = 'crk-exchange-credentials';

const EXCHANGE_META: Record<
  string,
  { name: string; color: string; needsPassphrase: boolean }
> = {
  binance: { name: 'Binance', color: '#F0B90B', needsPassphrase: false },
  coinbase: { name: 'Coinbase', color: '#0052FF', needsPassphrase: false },
  kraken: { name: 'Kraken', color: '#5741D9', needsPassphrase: false },
  kucoin: { name: 'KuCoin', color: '#23AF91', needsPassphrase: true },
  bybit: { name: 'Bybit', color: '#F7A600', needsPassphrase: false },
  okx: { name: 'OKX', color: '#FFFFFF', needsPassphrase: true },
};

const ALL_EXCHANGES = Object.keys(EXCHANGE_META);

/* ---------- localStorage helpers ---------- */

function loadCredentials(): ExchangeCredentials[] {
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

function saveCredentials(credentials: ExchangeCredentials[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
  } catch {
    // Quota exceeded - silently ignore
  }
}

/* ---------- helpers ---------- */

function formatUsd(n: number): string {
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n === 0) return '$0.00';
  return `$${n.toFixed(6)}`;
}

function getExchangeInitial(exchange: string): string {
  return (EXCHANGE_META[exchange]?.name?.[0] || exchange[0] || '?').toUpperCase();
}

/* ---------- component ---------- */

export function ExchangeBalanceWidget() {
  const data = useLiveDashboardStore((s) => s.data);
  const { siteTheme, colorTheme, tableDensity } = useLiveDashboardStore((s) => ({
    siteTheme: s.siteTheme,
    colorTheme: s.customization.colorTheme,
    tableDensity: s.customization.tableDensity,
  }));

  const st = getSiteThemeClasses(siteTheme);
  const themeColors = getThemeColors(colorTheme);
  const density = TABLE_DENSITY_MAP[tableDensity];

  // ---- State ----
  const [credentials, setCredentials] = useState<ExchangeCredentials[]>([]);
  const [balanceData, setBalanceData] = useState<ExchangeBalanceData[]>([]);
  const [connectingExchange, setConnectingExchange] = useState<string | null>(null);
  const [formApiKey, setFormApiKey] = useState('');
  const [formApiSecret, setFormApiSecret] = useState('');
  const [formPassphrase, setFormPassphrase] = useState('');
  const [showSecrets, setShowSecrets] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedExchanges, setExpandedExchanges] = useState<Set<string>>(new Set());

  // Load credentials on mount
  useEffect(() => {
    setCredentials(loadCredentials());
  }, []);

  // ---- Credential helpers ----
  const getCredential = useCallback(
    (exchange: string) => credentials.find((c) => c.exchange === exchange),
    [credentials],
  );

  const connectedExchanges = credentials.filter((c) => c.connected);

  // ---- Build price lookup from market data ----
  const priceMap: Record<string, number> = {};
  if (data.markets) {
    for (const coin of data.markets) {
      priceMap[coin.symbol.toUpperCase()] = coin.current_price;
    }
  }
  // Common stablecoin fallbacks
  if (!priceMap['USDT']) priceMap['USDT'] = 1;
  if (!priceMap['USDC']) priceMap['USDC'] = 1;
  if (!priceMap['BUSD']) priceMap['BUSD'] = 1;
  if (!priceMap['DAI']) priceMap['DAI'] = 1;
  if (!priceMap['USD']) priceMap['USD'] = 1;
  if (!priceMap['EUR']) priceMap['EUR'] = 1.08;
  if (!priceMap['GBP']) priceMap['GBP'] = 1.27;

  // ---- Fetch balances for a single exchange ----
  const fetchExchangeBalances = useCallback(
    async (cred: ExchangeCredentials): Promise<ExchangeBalanceData> => {
      try {
        const res = await fetch('/api/live-dashboard/exchange-balance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            exchange: cred.exchange,
            apiKey: cred.apiKey,
            apiSecret: cred.apiSecret,
            passphrase: cred.passphrase,
          }),
        });

        const json = await res.json();
        if (!res.ok) {
          return {
            exchange: cred.exchange,
            balances: [],
            fetchedAt: Date.now(),
            error: json.error || `Error ${res.status}`,
          };
        }

        return {
          exchange: cred.exchange,
          balances: json.balances || [],
          fetchedAt: json.fetchedAt || Date.now(),
        };
      } catch (err) {
        return {
          exchange: cred.exchange,
          balances: [],
          fetchedAt: Date.now(),
          error: err instanceof Error ? err.message : 'Network error',
        };
      }
    },
    [],
  );

  // ---- Refresh all connected exchange balances ----
  const refreshAll = useCallback(async () => {
    const connected = credentials.filter((c) => c.connected);
    if (connected.length === 0) return;

    setIsRefreshing(true);
    const results = await Promise.all(connected.map(fetchExchangeBalances));
    setBalanceData(results);

    // Update lastFetched timestamps
    const updated = credentials.map((c) => {
      if (c.connected) {
        return { ...c, lastFetched: Date.now() };
      }
      return c;
    });
    setCredentials(updated);
    saveCredentials(updated);

    setIsRefreshing(false);
  }, [credentials, fetchExchangeBalances]);

  // Auto-fetch on mount when there are connected exchanges
  useEffect(() => {
    const connected = credentials.filter((c) => c.connected);
    if (connected.length > 0 && balanceData.length === 0) {
      refreshAll();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [credentials.length]);

  // ---- Test connection ----
  const handleTestConnection = async () => {
    if (!connectingExchange || !formApiKey || !formApiSecret) return;

    const meta = EXCHANGE_META[connectingExchange];
    if (meta.needsPassphrase && !formPassphrase) {
      setTestResult({ ok: false, message: 'Passphrase is required for this exchange.' });
      return;
    }

    setTestingConnection(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/live-dashboard/exchange-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          exchange: connectingExchange,
          apiKey: formApiKey,
          apiSecret: formApiSecret,
          passphrase: formPassphrase || undefined,
        }),
      });

      const json = await res.json();
      if (res.ok) {
        setTestResult({
          ok: true,
          message: `Connected! Found ${json.count || 0} assets with non-zero balances.`,
        });
      } else {
        setTestResult({
          ok: false,
          message: json.error || `Connection failed (${res.status})`,
        });
      }
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Network error',
      });
    }

    setTestingConnection(false);
  };

  // ---- Save credentials ----
  const handleSave = () => {
    if (!connectingExchange || !formApiKey || !formApiSecret) return;

    const meta = EXCHANGE_META[connectingExchange];
    if (meta.needsPassphrase && !formPassphrase) return;

    const newCred: ExchangeCredentials = {
      exchange: connectingExchange,
      apiKey: formApiKey,
      apiSecret: formApiSecret,
      passphrase: formPassphrase || undefined,
      connected: true,
      lastFetched: undefined,
    };

    const updated = [
      ...credentials.filter((c) => c.exchange !== connectingExchange),
      newCred,
    ];

    setCredentials(updated);
    saveCredentials(updated);
    resetForm();

    // Fetch balances for newly connected exchange
    fetchExchangeBalances(newCred).then((result) => {
      setBalanceData((prev) => [
        ...prev.filter((d) => d.exchange !== connectingExchange),
        result,
      ]);
    });
  };

  // ---- Disconnect exchange ----
  const handleDisconnect = (exchange: string) => {
    const updated = credentials.filter((c) => c.exchange !== exchange);
    setCredentials(updated);
    saveCredentials(updated);
    setBalanceData((prev) => prev.filter((d) => d.exchange !== exchange));
  };

  // ---- Reset form ----
  const resetForm = () => {
    setConnectingExchange(null);
    setFormApiKey('');
    setFormApiSecret('');
    setFormPassphrase('');
    setShowSecrets(false);
    setTestResult(null);
    setTestingConnection(false);
  };

  // ---- Toggle expand/collapse for exchange group ----
  const toggleExpand = (exchange: string) => {
    setExpandedExchanges((prev) => {
      const next = new Set(prev);
      if (next.has(exchange)) {
        next.delete(exchange);
      } else {
        next.add(exchange);
      }
      return next;
    });
  };

  // ---- Calculate totals ----
  let grandTotalUsd = 0;
  const exchangeTotals: Record<string, number> = {};
  for (const bd of balanceData) {
    let exchangeTotal = 0;
    for (const bal of bd.balances) {
      const price = priceMap[bal.asset.toUpperCase()] || 0;
      const totalQty = bal.free + bal.locked;
      exchangeTotal += totalQty * price;
    }
    exchangeTotals[bd.exchange] = exchangeTotal;
    grandTotalUsd += exchangeTotal;
  }

  /* ─────────── Render ─────────── */

  return (
    <div className="space-y-4">
      {/* ---- Header with refresh ---- */}
      {connectedExchanges.length > 0 && (
        <div className="flex items-center justify-between">
          <div>
            <p className={`text-lg font-semibold ${st.textPrimary}`}>
              {formatUsd(grandTotalUsd)}
            </p>
            <p className={`text-[10px] uppercase tracking-wider ${st.textDim}`}>
              Total portfolio value across {connectedExchanges.length} exchange{connectedExchanges.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={refreshAll}
            disabled={isRefreshing}
            className={`p-2 rounded-lg transition-all ${st.buttonSecondary} ${isRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
            title="Refresh all exchange balances"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      )}

      {/* ---- Exchange Connection Cards ---- */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {ALL_EXCHANGES.map((exKey) => {
          const meta = EXCHANGE_META[exKey];
          const cred = getCredential(exKey);
          const isConnected = cred?.connected === true;

          return (
            <div
              key={exKey}
              className={`rounded-xl p-3 transition-all ${st.cardClasses} ${
                isConnected
                  ? 'ring-1'
                  : ''
              }`}
              style={isConnected ? { borderColor: `${meta.color}40` } : undefined}
            >
              <div className="flex items-center gap-2 mb-2">
                {/* Logo placeholder: colored circle with initial */}
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{
                    backgroundColor: `${meta.color}20`,
                    color: meta.color,
                  }}
                >
                  {getExchangeInitial(exKey)}
                </div>
                <div className="min-w-0">
                  <p className={`text-xs font-medium truncate ${st.textPrimary}`}>
                    {meta.name}
                  </p>
                  {isConnected ? (
                    <span className="text-[9px] font-semibold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
                      Connected
                    </span>
                  ) : (
                    <span className={`text-[9px] ${st.textDim}`}>Not Connected</span>
                  )}
                </div>
              </div>

              {/* Connected: show total + disconnect */}
              {isConnected ? (
                <div className="flex items-center justify-between mt-1">
                  <p className={`text-xs font-medium tabular-nums ${st.textSecondary}`}>
                    {exchangeTotals[exKey] != null
                      ? formatUsd(exchangeTotals[exKey])
                      : '...'}
                  </p>
                  <button
                    onClick={() => handleDisconnect(exKey)}
                    className="p-1 rounded-md hover:bg-red-400/10 transition-colors group"
                    title="Disconnect"
                  >
                    <Unlink className="w-3.5 h-3.5 text-gray-500 group-hover:text-red-400 transition-colors" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    resetForm();
                    setConnectingExchange(exKey);
                  }}
                  className="w-full mt-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-[11px] font-medium transition-all"
                  style={{
                    backgroundColor: `${themeColors.primary}15`,
                    color: themeColors.primary,
                  }}
                >
                  <Link2 className="w-3 h-3" />
                  Connect
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* ---- Credentials Form (inline modal) ---- */}
      {connectingExchange && (
        <div className={`rounded-xl p-4 space-y-3 ${st.cardClasses}`}>
          <div className="flex items-center justify-between">
            <p className={`text-xs font-semibold uppercase tracking-wider ${st.textMuted}`}>
              Connect {EXCHANGE_META[connectingExchange].name}
            </p>
            <button
              onClick={resetForm}
              className={`text-xs ${st.textDim} hover:${st.textPrimary} transition-colors`}
            >
              Cancel
            </button>
          </div>

          {/* Security warning */}
          <div className="flex gap-2 rounded-lg p-2.5 bg-amber-500/[0.08] border border-amber-500/20">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              Use read-only API keys only. Keys are stored in your browser and sent directly to the exchange.
            </p>
          </div>

          {/* API Key */}
          <div>
            <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
              API Key
            </label>
            <input
              type={showSecrets ? 'text' : 'password'}
              value={formApiKey}
              onChange={(e) => setFormApiKey(e.target.value)}
              placeholder="Enter your API key"
              className={`w-full rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors ${st.inputBg}`}
              autoComplete="off"
            />
          </div>

          {/* API Secret */}
          <div>
            <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
              API Secret
            </label>
            <input
              type={showSecrets ? 'text' : 'password'}
              value={formApiSecret}
              onChange={(e) => setFormApiSecret(e.target.value)}
              placeholder="Enter your API secret"
              className={`w-full rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors ${st.inputBg}`}
              autoComplete="off"
            />
          </div>

          {/* Passphrase (KuCoin, OKX only) */}
          {EXCHANGE_META[connectingExchange].needsPassphrase && (
            <div>
              <label className={`text-[10px] uppercase tracking-wider ${st.textDim} mb-1 block`}>
                Passphrase
              </label>
              <input
                type={showSecrets ? 'text' : 'password'}
                value={formPassphrase}
                onChange={(e) => setFormPassphrase(e.target.value)}
                placeholder="Enter your API passphrase"
                className={`w-full rounded-lg px-3 py-2 text-xs focus:outline-none transition-colors ${st.inputBg}`}
                autoComplete="off"
              />
            </div>
          )}

          {/* Show/hide toggle */}
          <button
            onClick={() => setShowSecrets((p) => !p)}
            className={`inline-flex items-center gap-1 text-[11px] ${st.textDim} hover:${st.textSecondary} transition-colors`}
          >
            {showSecrets ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            {showSecrets ? 'Hide' : 'Show'} credentials
          </button>

          {/* Test result message */}
          {testResult && (
            <div
              className={`rounded-lg px-3 py-2 text-xs ${
                testResult.ok
                  ? 'bg-emerald-400/10 border border-emerald-400/20 text-emerald-400'
                  : 'bg-red-500/10 border border-red-500/20 text-red-400'
              }`}
            >
              {testResult.message}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <button
              onClick={handleTestConnection}
              disabled={testingConnection || !formApiKey || !formApiSecret}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed ${st.buttonSecondary}`}
            >
              {testingConnection ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )}
              Test Connection
            </button>
            <button
              onClick={handleSave}
              disabled={!formApiKey || !formApiSecret || (EXCHANGE_META[connectingExchange].needsPassphrase && !formPassphrase)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                backgroundColor:
                  formApiKey && formApiSecret
                    ? `${themeColors.primary}20`
                    : undefined,
                color:
                  formApiKey && formApiSecret
                    ? themeColors.primary
                    : undefined,
              }}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* ---- Unified Balance Table ---- */}
      {balanceData.length > 0 && (
        <div className="space-y-1">
          <p className={`text-[10px] uppercase tracking-wider font-semibold ${st.textDim} mb-2`}>
            All Balances
          </p>

          {balanceData.map((bd) => {
            const meta = EXCHANGE_META[bd.exchange];
            const isExpanded = expandedExchanges.has(bd.exchange);
            const displayBalances = isExpanded
              ? bd.balances
              : bd.balances.slice(0, 5);

            return (
              <div key={bd.exchange} className={`rounded-xl overflow-hidden ${st.cardClasses} mb-2`}>
                {/* Exchange group header */}
                <button
                  onClick={() => toggleExpand(bd.exchange)}
                  className={`w-full flex items-center justify-between px-3 ${density.py} ${st.subtleBg} transition-colors`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold"
                      style={{
                        backgroundColor: `${meta.color}20`,
                        color: meta.color,
                      }}
                    >
                      {getExchangeInitial(bd.exchange)}
                    </div>
                    <span className={`text-xs font-medium ${st.textPrimary}`}>
                      {meta.name}
                    </span>
                    <span className={`text-[10px] tabular-nums ${st.textDim}`}>
                      ({bd.balances.length} assets)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-medium tabular-nums ${st.textSecondary}`}>
                      {formatUsd(exchangeTotals[bd.exchange] || 0)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className={`w-3.5 h-3.5 ${st.textDim}`} />
                    ) : (
                      <ChevronDown className={`w-3.5 h-3.5 ${st.textDim}`} />
                    )}
                  </div>
                </button>

                {/* Error state */}
                {bd.error && (
                  <div className="px-3 py-2 text-[11px] text-red-400 bg-red-500/[0.06]">
                    {bd.error}
                  </div>
                )}

                {/* Balance rows */}
                {bd.balances.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className={`w-full ${density.text}`}>
                      <thead>
                        <tr className={`text-[10px] uppercase tracking-wider ${st.textDim} border-b ${st.subtleBorder}`}>
                          <th className={`text-left ${density.py} ${density.px}`}>Asset</th>
                          <th className={`text-right ${density.py} ${density.px}`}>Free</th>
                          <th className={`text-right ${density.py} ${density.px}`}>Locked</th>
                          <th className={`text-right ${density.py} ${density.px}`}>Total</th>
                          <th className={`text-right ${density.py} ${density.px}`}>Est. Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayBalances.map((bal) => {
                          const total = bal.free + bal.locked;
                          const price = priceMap[bal.asset.toUpperCase()] || 0;
                          const estValue = total * price;

                          return (
                            <tr
                              key={`${bd.exchange}-${bal.asset}`}
                              className={`border-b ${st.divider} hover:${st.subtleBg} transition-colors`}
                            >
                              <td className={`${density.py} ${density.px}`}>
                                <span className={`font-medium ${st.textPrimary}`}>
                                  {bal.asset}
                                </span>
                              </td>
                              <td className={`${density.py} ${density.px} text-right tabular-nums ${st.textSecondary}`}>
                                {bal.free > 0 ? bal.free.toFixed(bal.free < 1 ? 8 : 4) : '0'}
                              </td>
                              <td className={`${density.py} ${density.px} text-right tabular-nums ${st.textDim}`}>
                                {bal.locked > 0 ? bal.locked.toFixed(bal.locked < 1 ? 8 : 4) : '0'}
                              </td>
                              <td className={`${density.py} ${density.px} text-right tabular-nums font-medium ${st.textPrimary}`}>
                                {total.toFixed(total < 1 ? 8 : 4)}
                              </td>
                              <td className={`${density.py} ${density.px} text-right tabular-nums ${st.textSecondary}`}>
                                {price > 0 ? formatUsd(estValue) : '--'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>

                    {/* Show more/less toggle */}
                    {bd.balances.length > 5 && (
                      <button
                        onClick={() => toggleExpand(bd.exchange)}
                        className={`w-full py-1.5 text-[10px] font-medium ${st.textDim} hover:${st.textSecondary} transition-colors`}
                      >
                        {isExpanded
                          ? 'Show less'
                          : `Show all ${bd.balances.length} assets`}
                      </button>
                    )}
                  </div>
                )}

                {/* Empty state */}
                {!bd.error && bd.balances.length === 0 && (
                  <div className={`px-3 py-4 text-center text-xs ${st.textDim}`}>
                    No non-zero balances found.
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand total footer */}
          {balanceData.length > 1 && (
            <div className={`flex items-center justify-between rounded-xl px-4 py-3 ${st.cardClasses}`}>
              <span className={`text-xs font-semibold uppercase tracking-wider ${st.textMuted}`}>
                Grand Total
              </span>
              <span
                className="text-sm font-bold tabular-nums"
                style={{ color: themeColors.primary }}
              >
                {formatUsd(grandTotalUsd)}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ---- Empty state ---- */}
      {connectedExchanges.length === 0 && !connectingExchange && (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
            style={{ backgroundColor: `${themeColors.primary}10` }}
          >
            <Link2 className="w-6 h-6" style={{ color: themeColors.primary, opacity: 0.6 }} />
          </div>
          <p className={`text-sm font-medium mb-1 ${st.textMuted}`}>
            No exchanges connected
          </p>
          <p className={`text-xs max-w-[260px] ${st.textDim}`}>
            Connect your exchange accounts above to view balances across all your portfolios in one place.
          </p>
        </div>
      )}
    </div>
  );
}
