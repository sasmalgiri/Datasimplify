'use client';

import { useState, useRef, useCallback } from 'react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

type CostBasisMethod = 'fifo' | 'lifo' | 'avg';

interface Transaction {
  date: string;
  coin: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
}

interface TaxLot {
  date: string;
  amount: number;
  price: number;
}

interface TaxEvent {
  sellDate: string;
  buyDate: string;
  coin: string;
  amount: number;
  costBasis: number;
  proceeds: number;
  gainLoss: number;
  holdingPeriod: 'short' | 'long';
}

interface TaxSummary {
  events: TaxEvent[];
  shortTermGains: number;
  longTermGains: number;
  totalGains: number;
  totalProceeds: number;
  totalCostBasis: number;
}

function parseCSV(text: string): Transaction[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const header = lines[0].toLowerCase().replace(/['"]/g, '');
  const cols = header.split(/[,\t;]/);

  const dateIdx = cols.findIndex(c => c.includes('date') || c.includes('time'));
  const coinIdx = cols.findIndex(c => c.includes('coin') || c.includes('symbol') || c.includes('asset') || c.includes('token'));
  const typeIdx = cols.findIndex(c => c.includes('type') || c.includes('side') || c.includes('action'));
  const amountIdx = cols.findIndex(c => c.includes('amount') || c.includes('quantity') || c.includes('qty'));
  const priceIdx = cols.findIndex(c => c.includes('price') || c.includes('rate'));
  const totalIdx = cols.findIndex(c => c.includes('total') || c.includes('cost') || c.includes('value'));

  const transactions: Transaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = lines[i].replace(/['"]/g, '').trim().split(/[,\t;]/);
    if (!vals.length) continue;
    const date = dateIdx >= 0 ? vals[dateIdx]?.trim() || '' : '';
    const coin = coinIdx >= 0 ? (vals[coinIdx]?.trim() || '').toUpperCase() : '';
    const typeRaw = typeIdx >= 0 ? (vals[typeIdx]?.trim() || '').toLowerCase() : 'buy';
    const type: 'buy' | 'sell' = typeRaw.includes('sell') ? 'sell' : 'buy';
    const amount = amountIdx >= 0 ? Math.abs(parseFloat(vals[amountIdx]) || 0) : 0;
    const price = priceIdx >= 0 ? Math.abs(parseFloat(vals[priceIdx]) || 0) : 0;
    const total = totalIdx >= 0 ? Math.abs(parseFloat(vals[totalIdx]) || 0) : amount * price;
    if (coin && amount > 0) {
      transactions.push({ date, coin, type, amount, price: price || (total / amount), total: total || (amount * price) });
    }
  }
  return transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

function calculateTaxEvents(transactions: Transaction[], method: CostBasisMethod): TaxSummary {
  const lots: Record<string, TaxLot[]> = {};
  const events: TaxEvent[] = [];

  for (const tx of transactions) {
    if (!lots[tx.coin]) lots[tx.coin] = [];

    if (tx.type === 'buy') {
      lots[tx.coin].push({ date: tx.date, amount: tx.amount, price: tx.price });
    } else {
      // Sell — match against lots
      let remaining = tx.amount;
      const coinLots = lots[tx.coin];

      while (remaining > 0 && coinLots.length > 0) {
        let lotIdx: number;
        if (method === 'lifo') {
          lotIdx = coinLots.length - 1;
        } else {
          lotIdx = 0; // FIFO
        }

        if (method === 'avg') {
          // Average cost basis
          const totalAmount = coinLots.reduce((s, l) => s + l.amount, 0);
          const totalCost = coinLots.reduce((s, l) => s + l.amount * l.price, 0);
          const avgPrice = totalCost / totalAmount;
          const sellAmount = Math.min(remaining, totalAmount);
          const costBasis = sellAmount * avgPrice;
          const proceeds = sellAmount * tx.price;
          const buyDate = coinLots[0].date;
          const holdingDays = (new Date(tx.date).getTime() - new Date(buyDate).getTime()) / (1000 * 60 * 60 * 24);

          events.push({
            sellDate: tx.date,
            buyDate: buyDate,
            coin: tx.coin,
            amount: sellAmount,
            costBasis,
            proceeds,
            gainLoss: proceeds - costBasis,
            holdingPeriod: holdingDays > 365 ? 'long' : 'short',
          });

          // Reduce lots proportionally
          const factor = (totalAmount - sellAmount) / totalAmount;
          if (factor <= 0) {
            coinLots.length = 0;
          } else {
            coinLots.forEach(l => l.amount *= factor);
          }
          remaining = 0;
        } else {
          const lot = coinLots[lotIdx];
          const sellAmount = Math.min(remaining, lot.amount);
          const costBasis = sellAmount * lot.price;
          const proceeds = sellAmount * tx.price;
          const holdingDays = (new Date(tx.date).getTime() - new Date(lot.date).getTime()) / (1000 * 60 * 60 * 24);

          events.push({
            sellDate: tx.date,
            buyDate: lot.date,
            coin: tx.coin,
            amount: sellAmount,
            costBasis,
            proceeds,
            gainLoss: proceeds - costBasis,
            holdingPeriod: holdingDays > 365 ? 'long' : 'short',
          });

          lot.amount -= sellAmount;
          remaining -= sellAmount;
          if (lot.amount <= 0.00000001) coinLots.splice(lotIdx, 1);
        }
      }
    }
  }

  const shortTermGains = events.filter(e => e.holdingPeriod === 'short').reduce((s, e) => s + e.gainLoss, 0);
  const longTermGains = events.filter(e => e.holdingPeriod === 'long').reduce((s, e) => s + e.gainLoss, 0);

  return {
    events,
    shortTermGains,
    longTermGains,
    totalGains: shortTermGains + longTermGains,
    totalProceeds: events.reduce((s, e) => s + e.proceeds, 0),
    totalCostBasis: events.reduce((s, e) => s + e.costBasis, 0),
  };
}

export default function TaxReportPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [method, setMethod] = useState<CostBasisMethod>('fifo');
  const [summary, setSummary] = useState<TaxSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [taxYear, setTaxYear] = useState(new Date().getFullYear());
  const fileRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const txns = parseCSV(text);
      if (txns.length === 0) {
        setError('No valid transactions found in CSV');
        return;
      }
      setTransactions(txns);
      const result = calculateTaxEvents(txns, method);
      setSummary(result);
    };
    reader.readAsText(file);
  }, [method]);

  const recalculate = useCallback((newMethod: CostBasisMethod) => {
    setMethod(newMethod);
    if (transactions.length > 0) {
      setSummary(calculateTaxEvents(transactions, newMethod));
    }
  }, [transactions]);

  const exportForm8949 = useCallback(() => {
    if (!summary) return;

    // Filter by tax year
    const yearEvents = summary.events.filter(e => {
      const year = new Date(e.sellDate).getFullYear();
      return year === taxYear;
    });

    const header = 'Description,Date Acquired,Date Sold,Proceeds,Cost Basis,Gain or Loss,Short/Long Term\n';
    const rows = yearEvents.map(e =>
      `${e.amount.toFixed(8)} ${e.coin},${e.buyDate},${e.sellDate},${e.proceeds.toFixed(2)},${e.costBasis.toFixed(2)},${e.gainLoss.toFixed(2)},${e.holdingPeriod === 'short' ? 'Short-term' : 'Long-term'}`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `form-8949-${taxYear}-${method}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [summary, taxYear, method]);

  const exportTurboTax = useCallback(() => {
    if (!summary) return;

    const yearEvents = summary.events.filter(e => new Date(e.sellDate).getFullYear() === taxYear);
    const header = 'Currency Name,Purchase Date,Cost Basis,Date Sold,Proceeds\n';
    const rows = yearEvents.map(e =>
      `${e.coin},${e.buyDate},${e.costBasis.toFixed(2)},${e.sellDate},${e.proceeds.toFixed(2)}`
    ).join('\n');

    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `turbotax-crypto-${taxYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [summary, taxYear]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb customTitle="Tax Report" />

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-3xl font-bold">📋 Crypto Tax Report</h1>
        </div>

        {/* Upload Section */}
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
          <h2 className="text-lg font-bold mb-3">Upload Transaction History</h2>
          <p className="text-sm text-gray-400 mb-4">
            Upload the same CSV format as Portfolio Import: date, coin, type (buy/sell), amount, price, total
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <input ref={fileRef} type="file" accept=".csv" onChange={handleUpload} className="hidden" aria-label="Upload CSV" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition"
            >
              📁 Upload CSV
            </button>

            {transactions.length > 0 && (
              <span className="text-sm text-gray-400">{transactions.length} transactions loaded</span>
            )}
          </div>

          {error && <p className="mt-3 text-red-400 text-sm">{error}</p>}
        </div>

        {/* Settings */}
        {transactions.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 mb-6">
            <div className="flex flex-wrap gap-6">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Cost Basis Method</label>
                <div className="flex gap-2">
                  {([['fifo', 'FIFO'], ['lifo', 'LIFO'], ['avg', 'Average']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => recalculate(val)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                        method === val ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Tax Year</label>
                <select
                  title="Tax year"
                  value={taxYear}
                  onChange={(e) => setTaxYear(Number(e.target.value))}
                  className="bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-sm"
                >
                  {[2024, 2023, 2022, 2021].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {summary && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-400">Short-Term Gains</p>
                <p className={`text-xl font-bold ${summary.shortTermGains >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${summary.shortTermGains.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">Taxed as ordinary income</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-400">Long-Term Gains</p>
                <p className={`text-xl font-bold ${summary.longTermGains >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  ${summary.longTermGains.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
                <p className="text-xs text-gray-500 mt-1">Favorable tax rate</p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-400">Total Proceeds</p>
                <p className="text-xl font-bold text-white">
                  ${summary.totalProceeds.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <p className="text-xs text-gray-400">Total Cost Basis</p>
                <p className="text-xl font-bold text-white">
                  ${summary.totalCostBasis.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={exportForm8949}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition"
              >
                📥 Export Form 8949 (CSV)
              </button>
              <button
                onClick={exportTurboTax}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-sm font-medium transition"
              >
                📥 TurboTax Format
              </button>
            </div>

            {/* Tax Events Table */}
            <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
              <h3 className="font-semibold mb-3">
                Taxable Events ({summary.events.filter(e => new Date(e.sellDate).getFullYear() === taxYear).length} in {taxYear})
              </h3>
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-800">
                    <tr className="border-b border-gray-600 text-gray-400">
                      <th className="text-left py-2 px-2">Asset</th>
                      <th className="text-left py-2 px-2">Acquired</th>
                      <th className="text-left py-2 px-2">Sold</th>
                      <th className="text-right py-2 px-2">Amount</th>
                      <th className="text-right py-2 px-2">Cost Basis</th>
                      <th className="text-right py-2 px-2">Proceeds</th>
                      <th className="text-right py-2 px-2">Gain/Loss</th>
                      <th className="text-center py-2 px-2">Term</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.events
                      .filter(e => new Date(e.sellDate).getFullYear() === taxYear)
                      .map((e, i) => (
                        <tr key={i} className="border-b border-gray-700/30">
                          <td className="py-1.5 px-2 font-medium">{e.coin}</td>
                          <td className="py-1.5 px-2 text-gray-400">{e.buyDate}</td>
                          <td className="py-1.5 px-2 text-gray-400">{e.sellDate}</td>
                          <td className="py-1.5 px-2 text-right">{e.amount < 1 ? e.amount.toFixed(8) : e.amount.toFixed(4)}</td>
                          <td className="py-1.5 px-2 text-right">${e.costBasis.toFixed(2)}</td>
                          <td className="py-1.5 px-2 text-right">${e.proceeds.toFixed(2)}</td>
                          <td className={`py-1.5 px-2 text-right font-medium ${e.gainLoss >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {e.gainLoss >= 0 ? '+' : ''}${e.gainLoss.toFixed(2)}
                          </td>
                          <td className="py-1.5 px-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              e.holdingPeriod === 'long' ? 'bg-green-900/50 text-green-400' : 'bg-yellow-900/50 text-yellow-400'
                            }`}>
                              {e.holdingPeriod === 'long' ? 'Long' : 'Short'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 p-4 bg-amber-900/20 border border-amber-800/30 rounded-xl text-amber-400/80 text-xs">
              ⚠️ This is an estimate for informational purposes only. Not tax advice. Consult a qualified tax professional for your specific situation. Tax laws vary by jurisdiction.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
