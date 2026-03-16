'use client';

import { useState } from 'react';
import {
  ArrowDownUp,
  Download,
  Loader2,
  Shield,
  RefreshCw,
  FileText,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';

type Exchange = 'binance' | 'coinbase' | 'kraken';

interface Transaction {
  id: string;
  date: string;
  pair: string;
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  total: number;
  fee: number;
  feeCurrency: string;
}

const EXCHANGES: { id: Exchange; name: string; color: string; desc: string }[] = [
  { id: 'binance', name: 'Binance', color: '#F0B90B', desc: 'Largest exchange by volume' },
  { id: 'coinbase', name: 'Coinbase', color: '#0052FF', desc: 'US-regulated exchange' },
  { id: 'kraken', name: 'Kraken', color: '#7B61FF', desc: 'Security-focused exchange' },
];

export default function ExchangeImportPage() {
  const [selectedExchange, setSelectedExchange] = useState<Exchange | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [imported, setImported] = useState(false);

  const handleImport = async () => {
    if (!selectedExchange || !apiKey || !apiSecret) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/v1/exchange/${selectedExchange}/transactions`, {
        headers: {
          'Authorization': `Bearer ${document.cookie.replace(/.*sb-access-token=([^;]+).*/, '$1')}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Import failed: ${res.status}`);
      }

      const data = await res.json();
      setTransactions(data.transactions || []);
      setImported(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const headers = ['Date', 'Pair', 'Side', 'Price', 'Quantity', 'Total', 'Fee', 'Fee Currency'];
    const rows = transactions.map((t) =>
      [t.date, t.pair, t.side, t.price, t.quantity, t.total, t.fee, t.feeCurrency].join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedExchange}-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalBuys = transactions.filter((t) => t.side === 'buy').reduce((s, t) => s + t.total, 0);
  const totalSells = transactions.filter((t) => t.side === 'sell').reduce((s, t) => s + t.total, 0);
  const totalFees = transactions.reduce((s, t) => s + t.fee, 0);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <ArrowDownUp className="w-7 h-7 text-emerald-400" />
          <h1 className="text-3xl font-bold">Exchange Import</h1>
        </div>
        <p className="text-gray-400 mb-8">
          Auto-import your trade history from major exchanges. Your API keys are encrypted and never stored in plain text.
        </p>

        {/* Security banner */}
        <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 mb-8 flex items-start gap-3">
          <Shield className="w-5 h-5 text-emerald-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-emerald-400 font-medium text-sm">Your keys are safe</p>
            <p className="text-gray-400 text-xs mt-1">
              API keys are encrypted server-side with AES-256, used only for read-only operations, and
              can be deleted anytime. We recommend using <strong>read-only API keys</strong> without withdrawal permissions.
            </p>
          </div>
        </div>

        {/* Step 1: Select Exchange */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">1</span>
            Select Exchange
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {EXCHANGES.map((ex) => (
              <button
                key={ex.id}
                type="button"
                onClick={() => setSelectedExchange(ex.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedExchange === ex.id
                    ? 'border-emerald-500/50 bg-emerald-500/10'
                    : 'border-gray-700/50 bg-gray-800/40 hover:border-gray-600/50'
                }`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{ backgroundColor: ex.color + '20', color: ex.color }}>
                    {ex.name[0]}
                  </div>
                  <span className="font-semibold">{ex.name}</span>
                  {selectedExchange === ex.id && <CheckCircle2 className="w-4 h-4 text-emerald-400 ml-auto" />}
                </div>
                <p className="text-xs text-gray-500">{ex.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: API Keys */}
        {selectedExchange && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold">2</span>
              Enter Read-Only API Keys
            </h2>
            <div className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-6 space-y-4">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">API Key</label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  className="w-full bg-gray-900/60 border border-gray-700/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <div>
                <label className="text-sm text-gray-400 mb-1 block">API Secret</label>
                <input
                  type="password"
                  value={apiSecret}
                  onChange={(e) => setApiSecret(e.target.value)}
                  placeholder="Enter your API secret"
                  className="w-full bg-gray-900/60 border border-gray-700/50 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-emerald-500/50"
                />
              </div>
              <button
                type="button"
                onClick={handleImport}
                disabled={!apiKey || !apiSecret || loading}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 rounded-lg font-medium transition"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Importing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4" /> Import Transactions
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-red-400 font-medium text-sm">Import failed</p>
              <p className="text-gray-400 text-xs mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {imported && transactions.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Total Transactions</div>
                <div className="text-xl font-bold mt-1">{transactions.length}</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Total Bought</div>
                <div className="text-xl font-bold mt-1 text-green-400">${totalBuys.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Total Sold</div>
                <div className="text-xl font-bold mt-1 text-red-400">${totalSells.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
              <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-4">
                <div className="text-xs text-gray-400">Total Fees</div>
                <div className="text-xl font-bold mt-1 text-amber-400">${totalFees.toLocaleString(undefined, { maximumFractionDigits: 4 })}</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mb-6">
              <button type="button" onClick={exportCsv} className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm transition">
                <Download className="w-4 h-4" /> Export CSV
              </button>
              <a href="/tax-report" className="flex items-center gap-2 px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 rounded-lg text-sm text-emerald-400 transition">
                <FileText className="w-4 h-4" /> Send to Tax Report <ArrowRight className="w-3 h-3" />
              </a>
            </div>

            {/* Transaction Table */}
            <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-gray-800">
                    <tr className="text-left text-gray-400 text-xs border-b border-gray-700/50">
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Pair</th>
                      <th className="px-4 py-3">Side</th>
                      <th className="px-4 py-3 text-right">Price</th>
                      <th className="px-4 py-3 text-right">Quantity</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      <th className="px-4 py-3 text-right">Fee</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id} className="border-t border-gray-700/30 hover:bg-gray-700/20">
                        <td className="px-4 py-2 text-gray-300">{new Date(t.date).toLocaleDateString()}</td>
                        <td className="px-4 py-2 font-medium">{t.pair}</td>
                        <td className="px-4 py-2">
                          <span className={`px-2 py-0.5 rounded text-xs ${t.side === 'buy' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                            {t.side.toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right">${t.price.toLocaleString(undefined, { maximumFractionDigits: 6 })}</td>
                        <td className="px-4 py-2 text-right text-gray-400">{t.quantity.toFixed(6)}</td>
                        <td className="px-4 py-2 text-right">${t.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="px-4 py-2 text-right text-gray-500">{t.fee.toFixed(6)} {t.feeCurrency}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {imported && transactions.length === 0 && (
          <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-12 text-center">
            <ArrowDownUp className="w-12 h-12 mx-auto mb-3 text-gray-600" />
            <p className="text-gray-400">No transactions found for this exchange</p>
            <p className="text-gray-600 text-sm mt-1">Try a different time range or check your API key permissions</p>
          </div>
        )}
      </div>
    </div>
  );
}
