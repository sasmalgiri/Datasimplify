'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { BeginnerTip, InfoButton, RiskMeter } from '@/components/ui/BeginnerHelpers';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { TemplateDownloadButton } from '@/components/TemplateDownloadButton';
import { UniversalExport } from '@/components/UniversalExport';

// Color dot component using ref to avoid inline style warnings
function ColorDot({ color, className = '' }: { color: string; className?: string }) {
  const dotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dotRef.current) {
      dotRef.current.style.setProperty('--dot-color', color);
    }
  }, [color]);

  return <div ref={dotRef} className={`color-dot ${className}`} />;
}

interface Allocation {
  id: string;
  name: string;
  symbol: string;
  percentage: number;
  riskLevel: 1 | 2 | 3 | 4 | 5;
  color: string;
}

interface CoinPrice {
  symbol: string;
  price: number;
  change_24h: number;
}

interface CsvTransaction {
  date: string;
  coin: string;
  type: 'buy' | 'sell';
  amount: number;
  price: number;
  total: number;
}

interface CoinHolding {
  symbol: string;
  totalBought: number;
  totalSold: number;
  totalCostBasis: number;
  totalSellProceeds: number;
  netHolding: number;
  avgBuyPrice: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  realizedPnL: number;
}

function parseCSV(text: string): CsvTransaction[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().replace(/['"]/g, '');
  const cols = header.split(/[,\t;]/);

  // Find column indices flexibly
  const dateIdx = cols.findIndex(c => c.includes('date') || c.includes('time'));
  const coinIdx = cols.findIndex(c => c.includes('coin') || c.includes('symbol') || c.includes('asset') || c.includes('currency') || c.includes('token'));
  const typeIdx = cols.findIndex(c => c.includes('type') || c.includes('side') || c.includes('action'));
  const amountIdx = cols.findIndex(c => c.includes('amount') || c.includes('quantity') || c.includes('qty') || c.includes('size'));
  const priceIdx = cols.findIndex(c => c.includes('price') || c.includes('rate'));
  const totalIdx = cols.findIndex(c => c.includes('total') || c.includes('cost') || c.includes('value') || c.includes('usd'));

  const transactions: CsvTransaction[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/['"]/g, '').trim();
    if (!line) continue;
    const vals = line.split(/[,\t;]/);

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

  return transactions;
}

export default function PortfolioBuilderPage() {
  const router = useRouter();
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [step, setStep] = useState(1);
  const [coinPrices, setCoinPrices] = useState<Record<string, CoinPrice>>({});
  const [pricesLoading, setPricesLoading] = useState(true);
  const [presetLoading, setPresetLoading] = useState(false);
  const [presetError, setPresetError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [mode, setMode] = useState<'builder' | 'import'>('builder');
  const [csvTransactions, setCsvTransactions] = useState<CsvTransaction[]>([]);
  const [csvHoldings, setCsvHoldings] = useState<CoinHolding[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch real coin prices
  useEffect(() => {
    const fetchPrices = async () => {
      setPricesLoading(true);
      try {
        const response = await fetch('/api/crypto?limit=250');
        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data) {
            const priceMap: Record<string, CoinPrice> = {};
            result.data.forEach((coin: { symbol: string; current_price?: number; price?: number; price_change_percentage_24h?: number; price_change_24h?: number }) => {
              const symbol = (coin.symbol || '').toUpperCase();
              if (!symbol) return;
              const price = (typeof coin.current_price === 'number' ? coin.current_price : coin.price) || 0;
              const changePct = typeof coin.price_change_percentage_24h === 'number'
                ? coin.price_change_percentage_24h
                : (typeof coin.price_change_24h === 'number' ? coin.price_change_24h : 0);
              priceMap[symbol] = {
                symbol,
                price,
                change_24h: changePct,
              };
            });
            setCoinPrices(priceMap);
          }
        }
      } catch (err) {
        console.error('Failed to fetch coin prices:', err);
      }
      setPricesLoading(false);
    };

    fetchPrices();
    // Refresh prices every 2 minutes
    const interval = setInterval(fetchPrices, 2 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to get coin price
  const getCoinPrice = (symbol: string): number => {
    const mapped = coinPrices[symbol]?.price;
    if (typeof mapped === 'number' && mapped > 0) return mapped;
    return 0;
  };

  // Helper to calculate how many coins you'd get
  const getCoinsAmount = (symbol: string, dollarAmount: number): string => {
    const price = getCoinPrice(symbol);
    if (price === 0) return '';
    const amount = dollarAmount / price;
    if (amount >= 1) return amount.toFixed(4);
    return amount.toFixed(8);
  };

  // Calculate weighted risk
  const calculatePortfolioRisk = (allocs: Allocation[]) => {
    if (allocs.length === 0) return 0;
    const weightedRisk = allocs.reduce((sum, a) => sum + (a.riskLevel * a.percentage), 0) / 100;
    return Math.round(weightedRisk * 10) / 10;
  };

  const handleRiskSelect = async (risk: 'conservative' | 'balanced' | 'aggressive') => {
    setPresetLoading(true);
    try {
      const response = await fetch(`/api/portfolio/presets?risk=${risk}`);
      const result = await response.json();
      if (!response.ok || !result?.success || !Array.isArray(result?.data)) {
        throw new Error(result?.error || 'Failed to load preset');
      }
      setRiskTolerance(risk);
      setAllocations(result.data);
      setStep(2);
    } catch (err) {
      console.error('Failed to fetch portfolio preset:', err);
      setPresetError('Unable to load portfolio preset from live data. Please try again.');
    } finally {
      setPresetLoading(false);
    }
  };

  const updateAllocation = (id: string, newPercentage: number) => {
    const updated = allocations.map(a =>
      a.id === id ? { ...a, percentage: newPercentage } : a
    );
    // Normalize to 100%
    const total = updated.reduce((sum, a) => sum + a.percentage, 0);
    if (total === 0) {
      setAllocations(updated);
    } else if (total !== 100) {
      const factor = 100 / total;
      setAllocations(updated.map(a => ({ ...a, percentage: Math.round(a.percentage * factor) })));
    } else {
      setAllocations(updated);
    }
  };

  const portfolioRisk = calculatePortfolioRisk(allocations);

  // Download portfolio as PDF (generates a printable summary)
  const downloadPortfolioPDF = () => {
    const content = `
CRYPTOREPORTKIT PORTFOLIO PLAN
Generated: ${new Date().toLocaleDateString()}
================================

INVESTMENT SUMMARY
------------------
Total Investment: $${investmentAmount.toLocaleString()}
Risk Level: ${riskTolerance.charAt(0).toUpperCase() + riskTolerance.slice(1)}
Portfolio Risk Score: ${portfolioRisk}/5

ALLOCATION BREAKDOWN
--------------------
${allocations.map(a => `${a.name} (${a.symbol}): ${a.percentage}% = $${Math.round(investmentAmount * a.percentage / 100).toLocaleString()}`).join('\n')}

IMPORTANT REMINDERS
-------------------
• Never invest more than you can afford to lose
• Crypto is highly volatile - expect 50%+ swings
• This is not financial advice - DYOR
• Consider dollar-cost averaging

================================
Generated by CryptoReportKit
https://cryptoreportkit.com
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-plan-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    alert('Portfolio plan downloaded! Open the file to view your plan.');
  };

  // Track portfolio - save to localStorage and redirect to dashboard
  const trackPortfolio = () => {
    const portfolioData = {
      id: Date.now().toString(),
      name: `${riskTolerance.charAt(0).toUpperCase() + riskTolerance.slice(1)} Portfolio`,
      investmentAmount,
      riskTolerance,
      allocations,
      portfolioRisk,
      createdAt: new Date().toISOString()
    };

    // Save to localStorage
    const savedPortfolios = JSON.parse(localStorage.getItem('savedPortfolios') || '[]');
    savedPortfolios.push(portfolioData);
    localStorage.setItem('savedPortfolios', JSON.stringify(savedPortfolios));
    localStorage.setItem('activePortfolio', JSON.stringify(portfolioData));

    setSaveSuccess(true);
    setTimeout(() => router.push('/dashboard'), 1500);
  };

  // ── CSV Import Logic ──
  const handleCsvUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvError(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const transactions = parseCSV(text);
        if (transactions.length === 0) {
          setCsvError('No valid transactions found. Expected columns: date, coin/symbol, type (buy/sell), amount, price');
          return;
        }
        setCsvTransactions(transactions);

        // Calculate holdings
        const holdingMap: Record<string, { bought: number; sold: number; costBasis: number; sellProceeds: number }> = {};
        transactions.forEach(tx => {
          if (!holdingMap[tx.coin]) holdingMap[tx.coin] = { bought: 0, sold: 0, costBasis: 0, sellProceeds: 0 };
          if (tx.type === 'buy') {
            holdingMap[tx.coin].bought += tx.amount;
            holdingMap[tx.coin].costBasis += tx.total;
          } else {
            holdingMap[tx.coin].sold += tx.amount;
            holdingMap[tx.coin].sellProceeds += tx.total;
          }
        });

        const holdings: CoinHolding[] = Object.entries(holdingMap).map(([symbol, data]) => {
          const netHolding = data.bought - data.sold;
          const avgBuyPrice = data.bought > 0 ? data.costBasis / data.bought : 0;
          const currentPrice = coinPrices[symbol]?.price || 0;
          const currentValue = netHolding * currentPrice;
          const unrealizedPnL = currentValue - (netHolding * avgBuyPrice);
          const realizedPnL = data.sellProceeds - (data.sold * avgBuyPrice);

          return {
            symbol,
            totalBought: data.bought,
            totalSold: data.sold,
            totalCostBasis: data.costBasis,
            totalSellProceeds: data.sellProceeds,
            netHolding,
            avgBuyPrice,
            currentPrice,
            currentValue,
            unrealizedPnL,
            realizedPnL,
          };
        }).sort((a, b) => b.currentValue - a.currentValue);

        setCsvHoldings(holdings);
      } catch {
        setCsvError('Failed to parse CSV file. Check the format and try again.');
      }
    };
    reader.readAsText(file);
  }, [coinPrices]);

  const exportHoldingsCSV = useCallback(() => {
    const header = 'Symbol,Net Holding,Avg Buy Price,Current Price,Current Value,Unrealized P&L,Realized P&L\n';
    const rows = csvHoldings.map(h =>
      `${h.symbol},${h.netHolding.toFixed(8)},${h.avgBuyPrice.toFixed(2)},${h.currentPrice.toFixed(2)},${h.currentValue.toFixed(2)},${h.unrealizedPnL.toFixed(2)},${h.realizedPnL.toFixed(2)}`
    ).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `portfolio-holdings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [csvHoldings]);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb />
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 flex items-start justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-4">💼 Portfolio Builder</h1>
            <p className="text-xl text-blue-100">
              Build your first crypto portfolio in 3 easy steps
            </p>
          </div>
          <UniversalExport name="Portfolio-Builder" compact />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Mode Toggle: Builder vs Import */}
        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setMode('builder')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              mode === 'builder' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            🏗️ Build Portfolio
          </button>
          <button
            type="button"
            onClick={() => setMode('import')}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              mode === 'import' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            📤 Import CSV
          </button>
        </div>

        {/* ── CSV Import Mode ── */}
        {mode === 'import' && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                📤 Import Transaction History
                <InfoButton explanation="Upload a CSV file with your trade history. Supported columns: date, coin/symbol, type (buy/sell), amount/quantity, price, total. Most exchange exports work automatically." />
              </h2>

              <div className="bg-gray-700/50 rounded-lg p-4 mb-4 text-sm text-gray-400">
                <p className="font-medium text-gray-300 mb-2">Expected CSV format:</p>
                <code className="block bg-gray-900 rounded p-3 text-xs overflow-x-auto">
                  date,coin,type,amount,price,total<br/>
                  2024-01-15,BTC,buy,0.5,42000,21000<br/>
                  2024-03-20,ETH,buy,10,3200,32000<br/>
                  2024-06-01,BTC,sell,0.1,65000,6500
                </code>
                <p className="mt-2 text-xs">Works with exports from Binance, Coinbase, Kraken, and most exchanges.</p>
              </div>

              <div className="flex items-center gap-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleCsvUpload}
                  className="hidden"
                  aria-label="Upload CSV file"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition"
                >
                  📁 Choose CSV File
                </button>
                {csvTransactions.length > 0 && (
                  <span className="text-sm text-gray-400">
                    {csvTransactions.length} transactions loaded
                  </span>
                )}
              </div>

              {csvError && (
                <div className="mt-4 p-3 bg-red-900/30 border border-red-800 rounded-lg text-red-400 text-sm">
                  {csvError}
                </div>
              )}
            </div>

            {/* Holdings Summary */}
            {csvHoldings.length > 0 && (
              <>
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold">📊 Portfolio Holdings</h2>
                    <button
                      type="button"
                      onClick={exportHoldingsCSV}
                      className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition"
                    >
                      📥 Export Holdings
                    </button>
                  </div>

                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-3">
                      <p className="text-xs text-blue-400">Total Invested</p>
                      <p className="text-lg font-bold">
                        ${csvHoldings.reduce((s, h) => s + h.totalCostBasis, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className="bg-emerald-900/30 border border-emerald-800 rounded-lg p-3">
                      <p className="text-xs text-emerald-400">Current Value</p>
                      <p className="text-lg font-bold">
                        ${csvHoldings.reduce((s, h) => s + h.currentValue, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 border ${
                      csvHoldings.reduce((s, h) => s + h.unrealizedPnL, 0) >= 0
                        ? 'bg-green-900/30 border-green-800' : 'bg-red-900/30 border-red-800'
                    }`}>
                      <p className="text-xs text-gray-400">Unrealized P&amp;L</p>
                      <p className={`text-lg font-bold ${
                        csvHoldings.reduce((s, h) => s + h.unrealizedPnL, 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${csvHoldings.reduce((s, h) => s + h.unrealizedPnL, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                    <div className={`rounded-lg p-3 border ${
                      csvHoldings.reduce((s, h) => s + h.realizedPnL, 0) >= 0
                        ? 'bg-green-900/30 border-green-800' : 'bg-red-900/30 border-red-800'
                    }`}>
                      <p className="text-xs text-gray-400">Realized P&amp;L</p>
                      <p className={`text-lg font-bold ${
                        csvHoldings.reduce((s, h) => s + h.realizedPnL, 0) >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        ${csvHoldings.reduce((s, h) => s + h.realizedPnL, 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </p>
                    </div>
                  </div>

                  {/* Holdings Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-600 text-gray-400">
                          <th className="text-left py-2 px-2">Asset</th>
                          <th className="text-right py-2 px-2">Holding</th>
                          <th className="text-right py-2 px-2">Avg Buy</th>
                          <th className="text-right py-2 px-2">Current</th>
                          <th className="text-right py-2 px-2">Value</th>
                          <th className="text-right py-2 px-2">P&amp;L</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvHoldings.map(h => (
                          <tr key={h.symbol} className="border-b border-gray-700/50">
                            <td className="py-2 px-2 font-medium">{h.symbol}</td>
                            <td className="py-2 px-2 text-right text-gray-400">
                              {h.netHolding < 0.001 ? h.netHolding.toFixed(8) : h.netHolding.toFixed(4)}
                            </td>
                            <td className="py-2 px-2 text-right text-gray-400">
                              ${h.avgBuyPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                            </td>
                            <td className="py-2 px-2 text-right">
                              {h.currentPrice > 0
                                ? `$${h.currentPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
                                : <span className="text-gray-500">N/A</span>}
                            </td>
                            <td className="py-2 px-2 text-right font-medium">
                              ${h.currentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                            <td className={`py-2 px-2 text-right font-medium ${
                              h.unrealizedPnL >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}>
                              {h.unrealizedPnL >= 0 ? '+' : ''}{h.unrealizedPnL.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Transaction History */}
                <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
                  <h2 className="text-lg font-bold mb-4">📝 Transaction History ({csvTransactions.length})</h2>
                  <div className="overflow-x-auto max-h-80 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="sticky top-0 bg-gray-800">
                        <tr className="border-b border-gray-600 text-gray-400">
                          <th className="text-left py-2 px-2">Date</th>
                          <th className="text-left py-2 px-2">Coin</th>
                          <th className="text-center py-2 px-2">Type</th>
                          <th className="text-right py-2 px-2">Amount</th>
                          <th className="text-right py-2 px-2">Price</th>
                          <th className="text-right py-2 px-2">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {csvTransactions.map((tx, i) => (
                          <tr key={i} className="border-b border-gray-700/30">
                            <td className="py-1.5 px-2 text-gray-400">{tx.date || '-'}</td>
                            <td className="py-1.5 px-2 font-medium">{tx.coin}</td>
                            <td className="py-1.5 px-2 text-center">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                tx.type === 'buy' ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'
                              }`}>
                                {tx.type.toUpperCase()}
                              </span>
                            </td>
                            <td className="py-1.5 px-2 text-right">{tx.amount < 0.001 ? tx.amount.toFixed(8) : tx.amount.toFixed(4)}</td>
                            <td className="py-1.5 px-2 text-right">${tx.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                            <td className="py-1.5 px-2 text-right font-medium">${tx.total.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Builder Mode ── */}
        {mode === 'builder' && (<>
        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`ml-2 font-medium ${step >= s ? 'text-white' : 'text-gray-500'}`}>
                {s === 1 ? 'Your Goals' : s === 2 ? 'Customize' : 'Review'}
              </span>
              {s < 3 && <div className={`w-20 h-1 mx-4 ${step > s ? 'bg-blue-600' : 'bg-gray-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Risk Tolerance */}
        {step === 1 && (
          <div className="bg-gray-800 rounded-xl p-8 border border-gray-700">
            <h2 className="text-2xl font-bold mb-2">What&apos;s your investment style?</h2>
            <p className="text-gray-400 mb-6">Choose the approach that matches how you feel about risk.</p>

            <BeginnerTip>
              <strong>Don&apos;t know which to pick?</strong> If you&apos;re new to crypto, start with &quot;Conservative&quot; or &quot;Balanced.&quot;
              You can always adjust later as you learn more!
            </BeginnerTip>

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <button
                type="button"
                onClick={() => handleRiskSelect('conservative')}
                disabled={presetLoading}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                  riskTolerance === 'conservative' ? 'border-green-500 bg-green-900/30' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="text-xl font-bold">Conservative</h3>
                <p className="text-gray-400 text-sm mt-2">
                  Lower risk, steady growth. Focuses on Bitcoin and Ethereum.
                </p>
                <div className="mt-4">
                  <RiskMeter level={2} label="Lower" />
                </div>
                <ul className="mt-4 text-sm text-gray-500 space-y-1">
                  <li>• 60% Bitcoin</li>
                  <li>• 30% Ethereum</li>
                  <li>• 10% Stablecoins</li>
                </ul>
              </button>

              <button
                type="button"
                onClick={() => handleRiskSelect('balanced')}
                disabled={presetLoading}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                  riskTolerance === 'balanced' ? 'border-blue-500 bg-blue-900/30' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="text-4xl mb-4">⚖️</div>
                <h3 className="text-xl font-bold">Balanced</h3>
                <p className="text-gray-400 text-sm mt-2">
                  Mix of stability and growth. Good for most investors.
                </p>
                <div className="mt-4">
                  <RiskMeter level={3} label="Medium" />
                </div>
                <ul className="mt-4 text-sm text-gray-500 space-y-1">
                  <li>• 45% Bitcoin</li>
                  <li>• 30% Ethereum</li>
                  <li>• 15% Solana</li>
                  <li>• 10% Other Alts</li>
                </ul>
              </button>

              <button
                type="button"
                onClick={() => handleRiskSelect('aggressive')}
                disabled={presetLoading}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                  riskTolerance === 'aggressive' ? 'border-orange-500 bg-orange-900/30' : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                }`}
              >
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-bold">Aggressive</h3>
                <p className="text-gray-400 text-sm mt-2">
                  Higher risk, higher potential. For experienced investors.
                </p>
                <div className="mt-4">
                  <RiskMeter level={4} label="Higher" />
                </div>
                <ul className="mt-4 text-sm text-gray-500 space-y-1">
                  <li>• 30% Bitcoin</li>
                  <li>• 25% Ethereum</li>
                  <li>• 20% Solana</li>
                  <li>• 25% Altcoins</li>
                </ul>
              </button>
            </div>

            {presetError && (
              <div className="mt-4 p-3 bg-red-900/40 border border-red-700 rounded-lg text-red-300 text-sm">
                {presetError}
              </div>
            )}
          </div>
        )}
        {step === 2 && (
          <div className="space-y-6">
            {/* Investment Amount */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                💰 How much are you investing?
                <InfoButton explanation="Only invest what you can afford to lose completely. Crypto is volatile and can go to zero." />
              </h2>

              <div className="flex items-center gap-4">
                <label htmlFor="investment-amount" className="text-2xl">$</label>
                <input
                  id="investment-amount"
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value) || 0)}
                  className="text-3xl font-bold w-40 border-b-2 border-gray-600 bg-transparent focus:border-blue-500 outline-none"
                  aria-label="Investment amount in dollars"
                />
              </div>

              <div className="flex gap-2 mt-4">
                {[100, 500, 1000, 5000, 10000].map((amount) => (
                  <button
                    type="button"
                    key={amount}
                    onClick={() => setInvestmentAmount(amount)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      investmentAmount === amount ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Allocation Customizer */}
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold mb-4">📊 Your Allocation</h2>

              {/* Pie Chart Visual */}
              <div className="flex flex-col md:flex-row gap-8 items-center mb-6">
                <div className="relative w-48 h-48">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    {allocations.reduce((acc, alloc, index) => {
                      const prevTotal = allocations.slice(0, index).reduce((sum, a) => sum + a.percentage, 0);
                      const dashArray = `${alloc.percentage} ${100 - alloc.percentage}`;
                      const dashOffset = -prevTotal;

                      return [...acc, (
                        <circle
                          key={alloc.id}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={alloc.color}
                          strokeWidth="20"
                          pathLength={100}
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          className="transition-all duration-300"
                        />
                      )];
                    }, [] as React.ReactElement[])}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold">${investmentAmount.toLocaleString()}</div>
                      <div className="text-xs text-gray-500">Total</div>
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-3">
                  {allocations.map((alloc) => (
                    <div key={alloc.id} className="flex items-center gap-4">
                      <ColorDot color={alloc.color} className="w-4 h-4 rounded" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <label htmlFor={`allocation-${alloc.id}`} className="font-medium">{alloc.name}</label>
                          <span className="text-sm text-gray-400">
                            ${Math.round(investmentAmount * alloc.percentage / 100).toLocaleString()}
                          </span>
                        </div>
                        <input
                          id={`allocation-${alloc.id}`}
                          type="range"
                          min="0"
                          max="80"
                          value={alloc.percentage}
                          onChange={(e) => updateAllocation(alloc.id, Number(e.target.value))}
                          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                          aria-label={`${alloc.name} allocation percentage`}
                          title={`Adjust ${alloc.name} allocation`}
                        />
                      </div>
                      <span className="font-bold w-12 text-right">{alloc.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio Risk Score */}
              <div className="bg-gray-700/50 rounded-lg p-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Portfolio Risk Score:</span>
                  <span className={`font-bold text-lg ${
                    portfolioRisk <= 2 ? 'text-green-400' :
                    portfolioRisk <= 3 ? 'text-yellow-400' :
                    'text-red-400'
                  }`}>
                    {portfolioRisk}/5
                  </span>
                </div>
                <p className="text-sm text-gray-400 mt-1">
                  {portfolioRisk <= 2 ? 'Low risk - Good for long-term holding' :
                   portfolioRisk <= 3 ? 'Moderate risk - Balanced approach' :
                   'Higher risk - Prepare for volatility'}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-6 py-3 text-gray-400 hover:text-white"
              >
                ← Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                Review Portfolio →
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
              <h2 className="text-2xl font-bold mb-6">🎉 Your Portfolio Summary</h2>

              {/* Summary Cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-900/30 border border-blue-800 p-4 rounded-lg">
                  <p className="text-blue-400 text-sm">Total Investment</p>
                  <p className="text-2xl font-bold">${investmentAmount.toLocaleString()}</p>
                </div>
                <div className="bg-green-900/30 border border-green-800 p-4 rounded-lg">
                  <p className="text-green-400 text-sm">Number of Assets</p>
                  <p className="text-2xl font-bold">{allocations.length} coins</p>
                </div>
                <div className={`p-4 rounded-lg border ${
                  portfolioRisk <= 2 ? 'bg-green-900/30 border-green-800' : portfolioRisk <= 3 ? 'bg-yellow-900/30 border-yellow-800' : 'bg-red-900/30 border-red-800'
                }`}>
                  <p className={`text-sm ${
                    portfolioRisk <= 2 ? 'text-green-400' : portfolioRisk <= 3 ? 'text-yellow-400' : 'text-red-400'
                  }`}>Risk Level</p>
                  <p className="text-2xl font-bold">
                    {portfolioRisk <= 2 ? '🛡️ Low' : portfolioRisk <= 3 ? '⚖️ Medium' : '🚀 High'}
                  </p>
                </div>
              </div>

              {/* Live Prices Banner */}
              {!pricesLoading && Object.keys(coinPrices).length > 0 && (
                <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className="text-blue-400 text-sm font-medium">📊 Live Prices:</span>
                    <div className="flex gap-4 text-sm">
                      {['BTC', 'ETH', 'SOL'].map((symbol) => (
                        coinPrices[symbol] && (
                          <span key={symbol} className="flex items-center gap-1">
                            <span className="text-gray-400">{symbol}:</span>
                            <span className="font-medium">${coinPrices[symbol].price.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                            <span className={coinPrices[symbol].change_24h >= 0 ? 'text-green-400' : 'text-red-400'}>
                              {coinPrices[symbol].change_24h >= 0 ? '+' : ''}{coinPrices[symbol].change_24h.toFixed(1)}%
                            </span>
                          </span>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Allocation Table */}
              <table className="w-full">
                <thead className="sticky top-0 z-10 bg-gray-700">
                  <tr className="border-b border-gray-600">
                    <th className="text-left py-3 px-2">Asset</th>
                    <th className="text-right py-3 px-2">Current Price</th>
                    <th className="text-right py-3 px-2">Allocation</th>
                    <th className="text-right py-3 px-2">Amount</th>
                    <th className="text-right py-3 px-2">You Get</th>
                    <th className="text-right py-3 px-2">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc) => {
                    const dollarAmount = Math.round(investmentAmount * alloc.percentage / 100);
                    const currentPrice = getCoinPrice(alloc.symbol);
                    const coinsYouGet = getCoinsAmount(alloc.symbol, dollarAmount);

                    return (
                      <tr key={alloc.id} className="border-b border-gray-700">
                        <td className="py-3 px-2">
                          <div className="flex items-center gap-2">
                            <ColorDot color={alloc.color} className="w-3 h-3 rounded" />
                            <span className="font-medium">{alloc.name}</span>
                            <span className="text-gray-500">({alloc.symbol})</span>
                          </div>
                        </td>
                        <td className="text-right py-3 px-2 text-gray-400">
                          {currentPrice > 0
                            ? `$${currentPrice.toLocaleString(undefined, { maximumFractionDigits: currentPrice < 1 ? 4 : 0 })}`
                            : ''}
                        </td>
                        <td className="text-right py-3 px-2 font-medium">{alloc.percentage}%</td>
                        <td className="text-right py-3 px-2">
                          ${dollarAmount.toLocaleString()}
                        </td>
                        <td className="text-right py-3 px-2 text-blue-400 font-medium">
                          {coinsYouGet ? `${coinsYouGet} ${alloc.symbol}` : ''}
                        </td>
                        <td className="text-right py-3 px-2">
                          <span className={`px-2 py-1 rounded text-xs ${
                            alloc.riskLevel <= 2 ? 'bg-green-900/50 text-green-400' :
                            alloc.riskLevel <= 3 ? 'bg-yellow-900/50 text-yellow-400' :
                            'bg-red-900/50 text-red-400'
                          }`}>
                            {alloc.riskLevel <= 2 ? 'Low' : alloc.riskLevel <= 3 ? 'Med' : 'High'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Important Notes */}
              <div className="bg-yellow-900/30 border border-yellow-800 rounded-lg p-4 mt-6">
                <h3 className="font-bold text-yellow-400 mb-2">⚠️ Important Reminders</h3>
                <ul className="text-sm text-yellow-300 space-y-1">
                  <li>• Never invest more than you can afford to lose completely</li>
                  <li>• Crypto is highly volatile - expect 50%+ swings</li>
                  <li>• This is not financial advice - DYOR (Do Your Own Research)</li>
                  <li>• Consider dollar-cost averaging instead of buying all at once</li>
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col md:flex-row gap-4">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800"
              >
                ← Modify Portfolio
              </button>
              <button
                type="button"
                onClick={downloadPortfolioPDF}
                className="flex-1 px-8 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
              >
                📥 Download Portfolio Plan (PDF)
              </button>
              <TemplateDownloadButton
                pageContext={{
                  pageId: 'portfolio',
                  selectedCoins: allocations.map(a => a.symbol.toLowerCase()),
                  timeframe: '24h',
                  currency: 'USD',
                  holdings: allocations.map(a => ({
                    coin: a.symbol,
                    quantity: (investmentAmount * a.percentage / 100) / (coinPrices[a.symbol]?.price || 1),
                  })),
                  customizations: {
                    riskTolerance,
                    investmentAmount,
                    includeCharts: true,
                  },
                }}
                variant="outline"
                size="lg"
              />
              <button
                type="button"
                onClick={trackPortfolio}
                disabled={saveSuccess}
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50"
              >
                {saveSuccess ? '✅ Saved! Redirecting...' : '📊 Track This Portfolio'}
              </button>
            </div>
          </div>
        )}
        </>)}
      </div>
    </div>
  );
}
