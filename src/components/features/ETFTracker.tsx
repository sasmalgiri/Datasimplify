'use client';

import { useState, useEffect, useRef } from 'react';

// Bar component that uses ref to avoid inline style warnings
function FlowBar({ height, isPositive, title }: { height: number; isPositive: boolean; title: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = `${height}%`;
    }
  }, [height]);
  return (
    <div
      ref={ref}
      className={`flex-1 rounded-t ${isPositive ? 'bg-green-400' : 'bg-red-400'}`}
      title={title}
    />
  );
}
import { BeginnerTip, InfoButton, TrafficLight } from '../ui/BeginnerHelpers';

interface ETFData {
  name: string;
  ticker: string;
  provider: string;
  today_flow: number;
  week_flow: number;
  total_aum: number;
  logo?: string;
}

export function ETFTracker({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  const [etfs, setEtfs] = useState<ETFData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'today' | 'week' | 'month'>('today');

  useEffect(() => {
    // Sample ETF data - in production this would come from an API
    const sampleETFs: ETFData[] = [
      { name: 'iShares Bitcoin Trust', ticker: 'IBIT', provider: 'BlackRock', today_flow: 200000000, week_flow: 1200000000, total_aum: 35000000000 },
      { name: 'Fidelity Wise Origin', ticker: 'FBTC', provider: 'Fidelity', today_flow: 80000000, week_flow: 400000000, total_aum: 12000000000 },
      { name: 'ARK 21Shares Bitcoin', ticker: 'ARKB', provider: 'ARK Invest', today_flow: -15000000, week_flow: 50000000, total_aum: 3000000000 },
      { name: 'Grayscale Bitcoin Trust', ticker: 'GBTC', provider: 'Grayscale', today_flow: -50000000, week_flow: -200000000, total_aum: 20000000000 },
      { name: 'Bitwise Bitcoin ETF', ticker: 'BITB', provider: 'Bitwise', today_flow: 25000000, week_flow: 100000000, total_aum: 2000000000 },
      { name: 'VanEck Bitcoin Trust', ticker: 'HODL', provider: 'VanEck', today_flow: 10000000, week_flow: 45000000, total_aum: 800000000 },
      { name: 'Invesco Galaxy Bitcoin', ticker: 'BTCO', provider: 'Invesco', today_flow: 5000000, week_flow: 30000000, total_aum: 500000000 },
    ];
    setEtfs(sampleETFs);
  }, []);

  // Calculate totals
  const totalTodayFlow = etfs.reduce((sum, etf) => sum + etf.today_flow, 0);
  const totalWeekFlow = etfs.reduce((sum, etf) => sum + etf.week_flow, 0);
  const totalAUM = etfs.reduce((sum, etf) => sum + etf.total_aum, 0);

  // Format currency
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
    if (absValue >= 1e6) return `$${(value / 1e6).toFixed(0)}M`;
    if (absValue >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
    return `$${value.toFixed(0)}`;
  };

  // Format with sign
  const formatWithSign = (value: number) => {
    const formatted = formatCurrency(value);
    return value >= 0 ? `+${formatted}` : formatted;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          📊 Bitcoin ETF Tracker
          <InfoButton explanation="Bitcoin ETFs let you invest in Bitcoin through regular stock brokers like Fidelity or Schwab, without actually owning Bitcoin directly. Tracking money flowing in/out helps predict price movements." />
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          Track institutional money flowing into Bitcoin
        </p>
      </div>

      {/* Beginner Explanation */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 What Are Bitcoin ETFs?">
          <strong>ETFs (Exchange-Traded Funds)</strong> are like stocks that hold Bitcoin for you. 
          Instead of buying Bitcoin directly, you can buy shares of these ETFs through your regular 
          stock broker (like Fidelity or Charles Schwab).
          <br/><br/>
          <strong>Why track flows?</strong>
          <br/>
          • <span className="text-green-600">Money flowing IN</span> = Big investors are buying (bullish!) 📈
          <br/>
          • <span className="text-red-600">Money flowing OUT</span> = Big investors are selling (bearish) 📉
        </BeginnerTip>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className={`p-4 rounded-lg ${totalTodayFlow >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className="text-sm text-gray-600">Today&apos;s Net Flow</p>
          <p className={`text-2xl font-bold ${totalTodayFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatWithSign(totalTodayFlow)}
          </p>
          <TrafficLight 
            status={totalTodayFlow >= 0 ? 'good' : 'bad'} 
            label={totalTodayFlow >= 0 ? 'Bullish' : 'Bearish'} 
          />
        </div>

        <div className={`p-4 rounded-lg ${totalWeekFlow >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className="text-sm text-gray-600">This Week</p>
          <p className={`text-2xl font-bold ${totalWeekFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatWithSign(totalWeekFlow)}
          </p>
          <p className="text-xs text-gray-500 mt-1">7-day net flow</p>
        </div>

        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-gray-600">Total Assets</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatCurrency(totalAUM)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Combined AUM</p>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex gap-2 mb-4">
        {[
          { id: 'today' as const, label: 'Today' },
          { id: 'week' as const, label: 'This Week' },
          { id: 'month' as const, label: 'This Month' },
        ].map((period) => (
          <button
            key={period.id}
            onClick={() => setSelectedPeriod(period.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === period.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {period.label}
          </button>
        ))}
      </div>

      {/* ETF Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 bg-white">
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-2">ETF</th>
              <th className="text-left py-3 px-2">Provider</th>
              <th className="text-right py-3 px-2">
                {selectedPeriod === 'today' ? "Today's Flow" : selectedPeriod === 'week' ? 'Week Flow' : 'Month Flow'}
              </th>
              <th className="text-right py-3 px-2">Total Assets</th>
              <th className="text-center py-3 px-2">Signal</th>
            </tr>
          </thead>
          <tbody>
            {etfs.map((etf) => {
              const flow = selectedPeriod === 'today' ? etf.today_flow : etf.week_flow;
              return (
                <tr key={etf.ticker} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-2">
                    <div className="font-bold">{etf.ticker}</div>
                    <div className="text-xs text-gray-500">{etf.name}</div>
                  </td>
                  <td className="py-3 px-2 text-gray-600">{etf.provider}</td>
                  <td className={`py-3 px-2 text-right font-bold ${flow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatWithSign(flow)}
                  </td>
                  <td className="py-3 px-2 text-right text-gray-600">
                    {formatCurrency(etf.total_aum)}
                  </td>
                  <td className="py-3 px-2 text-center">
                    {flow > 50000000 ? '🟢🟢' : flow > 0 ? '🟢' : flow > -50000000 ? '🔴' : '🔴🔴'}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 font-bold">
              <td className="py-3 px-2" colSpan={2}>TOTAL</td>
              <td className={`py-3 px-2 text-right ${totalTodayFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatWithSign(selectedPeriod === 'today' ? totalTodayFlow : totalWeekFlow)}
              </td>
              <td className="py-3 px-2 text-right">{formatCurrency(totalAUM)}</td>
              <td className="py-3 px-2 text-center">
                {totalTodayFlow >= 0 ? '📈' : '📉'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Interpretation Box */}
      <div className={`mt-6 p-4 rounded-lg ${totalTodayFlow >= 0 ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
        <h3 className={`font-semibold mb-2 ${totalTodayFlow >= 0 ? 'text-green-800' : 'text-red-800'}`}>
          💡 What This Means For You
        </h3>
        {totalTodayFlow >= 0 ? (
          <div className="text-sm text-green-900 space-y-2">
            <p>✅ <strong>Bullish Signal:</strong> Net {formatCurrency(totalTodayFlow)} flowed INTO Bitcoin ETFs today.</p>
            <p>This means big institutional investors (hedge funds, pension funds, etc.) are buying Bitcoin through these ETFs.</p>
            <p>Historically, consistent ETF inflows are associated with Bitcoin price increases.</p>
          </div>
        ) : (
          <div className="text-sm text-red-900 space-y-2">
            <p>⚠️ <strong>Bearish Signal:</strong> Net {formatCurrency(Math.abs(totalTodayFlow))} flowed OUT of Bitcoin ETFs today.</p>
            <p>This means institutional investors are selling their ETF shares, possibly taking profits.</p>
            <p>Watch for continued outflows - sustained selling pressure can push prices down.</p>
          </div>
        )}
      </div>

      {/* Historical Chart Placeholder */}
      <div className="mt-6">
        <h3 className="font-semibold text-gray-700 mb-3">📈 Flow History (Last 30 Days)</h3>
        <div className="h-40 bg-gray-50 rounded-lg flex items-end gap-1 p-4">
          {/* Simple bar chart visualization */}
          {Array.from({ length: 30 }).map((_, i) => {
            const value = Math.sin(i * 0.3) * 100 + Math.random() * 50;
            const isPositive = value > 50;
            return (
              <FlowBar
                key={i}
                height={Math.abs(value - 50) + 20}
                isPositive={isPositive}
                title={`Day ${30 - i}`}
              />
            );
          })}
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </div>

      {/* Quick Facts */}
      {showBeginnerTips && (
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">🏆 Why BlackRock (IBIT) Leads?</h4>
            <p className="text-sm text-blue-700">
              BlackRock is the world&apos;s largest asset manager with $10 trillion under management. 
              Their ETF approval in January 2024 brought massive credibility to Bitcoin investing.
            </p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg">
            <h4 className="font-semibold text-amber-800 mb-2">⚠️ Why GBTC Often Shows Outflows?</h4>
            <p className="text-sm text-amber-700">
              Grayscale (GBTC) existed before the new ETFs and had higher fees (1.5% vs 0.25%). 
              Many investors are moving their money to cheaper ETFs like IBIT.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default ETFTracker;
