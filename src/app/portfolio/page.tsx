'use client';

import { useState } from 'react';
import { BeginnerTip, InfoButton, RiskMeter, TrafficLight } from '@/components/ui/BeginnerHelpers';

interface Allocation {
  id: string;
  name: string;
  symbol: string;
  percentage: number;
  riskLevel: 1 | 2 | 3 | 4 | 5;
  color: string;
}

export default function PortfolioBuilderPage() {
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [riskTolerance, setRiskTolerance] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [step, setStep] = useState(1);

  // Preset portfolios based on risk tolerance
  const presetPortfolios = {
    conservative: [
      { id: 'btc', name: 'Bitcoin', symbol: 'BTC', percentage: 60, riskLevel: 2 as const, color: '#F7931A' },
      { id: 'eth', name: 'Ethereum', symbol: 'ETH', percentage: 30, riskLevel: 2 as const, color: '#627EEA' },
      { id: 'usdc', name: 'USD Coin', symbol: 'USDC', percentage: 10, riskLevel: 1 as const, color: '#2775CA' },
    ],
    balanced: [
      { id: 'btc', name: 'Bitcoin', symbol: 'BTC', percentage: 45, riskLevel: 2 as const, color: '#F7931A' },
      { id: 'eth', name: 'Ethereum', symbol: 'ETH', percentage: 30, riskLevel: 2 as const, color: '#627EEA' },
      { id: 'sol', name: 'Solana', symbol: 'SOL', percentage: 15, riskLevel: 3 as const, color: '#00FFA3' },
      { id: 'other', name: 'Other Altcoins', symbol: 'ALTS', percentage: 10, riskLevel: 4 as const, color: '#9945FF' },
    ],
    aggressive: [
      { id: 'btc', name: 'Bitcoin', symbol: 'BTC', percentage: 30, riskLevel: 2 as const, color: '#F7931A' },
      { id: 'eth', name: 'Ethereum', symbol: 'ETH', percentage: 25, riskLevel: 2 as const, color: '#627EEA' },
      { id: 'sol', name: 'Solana', symbol: 'SOL', percentage: 20, riskLevel: 3 as const, color: '#00FFA3' },
      { id: 'other', name: 'Other Altcoins', symbol: 'ALTS', percentage: 15, riskLevel: 4 as const, color: '#9945FF' },
      { id: 'meme', name: 'Meme Coins', symbol: 'MEME', percentage: 10, riskLevel: 5 as const, color: '#FF6B6B' },
    ],
  };

  // Calculate weighted risk
  const calculatePortfolioRisk = (allocs: Allocation[]) => {
    if (allocs.length === 0) return 0;
    const weightedRisk = allocs.reduce((sum, a) => sum + (a.riskLevel * a.percentage), 0) / 100;
    return Math.round(weightedRisk * 10) / 10;
  };

  const handleRiskSelect = (risk: 'conservative' | 'balanced' | 'aggressive') => {
    setRiskTolerance(risk);
    setAllocations(presetPortfolios[risk]);
    setStep(2);
  };

  const updateAllocation = (id: string, newPercentage: number) => {
    const updated = allocations.map(a => 
      a.id === id ? { ...a, percentage: newPercentage } : a
    );
    // Normalize to 100%
    const total = updated.reduce((sum, a) => sum + a.percentage, 0);
    if (total !== 100) {
      const factor = 100 / total;
      setAllocations(updated.map(a => ({ ...a, percentage: Math.round(a.percentage * factor) })));
    } else {
      setAllocations(updated);
    }
  };

  const portfolioRisk = calculatePortfolioRisk(allocations);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-4">💼 Portfolio Builder</h1>
          <p className="text-xl text-blue-100">
            Build your first crypto portfolio in 3 easy steps
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="flex justify-between items-center mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {step > s ? '✓' : s}
              </div>
              <span className={`ml-2 font-medium ${step >= s ? 'text-gray-900' : 'text-gray-400'}`}>
                {s === 1 ? 'Your Goals' : s === 2 ? 'Customize' : 'Review'}
              </span>
              {s < 3 && <div className={`w-20 h-1 mx-4 ${step > s ? 'bg-blue-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Risk Tolerance */}
        {step === 1 && (
          <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold mb-2">What&apos;s your investment style?</h2>
            <p className="text-gray-600 mb-6">Choose the approach that matches how you feel about risk.</p>

            <BeginnerTip>
              <strong>Don&apos;t know which to pick?</strong> If you&apos;re new to crypto, start with &quot;Conservative&quot; or &quot;Balanced.&quot; 
              You can always adjust later as you learn more!
            </BeginnerTip>

            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <button
                onClick={() => handleRiskSelect('conservative')}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                  riskTolerance === 'conservative' ? 'border-green-500 bg-green-50' : 'border-gray-200'
                }`}
              >
                <div className="text-4xl mb-4">🛡️</div>
                <h3 className="text-xl font-bold">Conservative</h3>
                <p className="text-gray-600 text-sm mt-2">
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
                onClick={() => handleRiskSelect('balanced')}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                  riskTolerance === 'balanced' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
              >
                <div className="text-4xl mb-4">⚖️</div>
                <h3 className="text-xl font-bold">Balanced</h3>
                <p className="text-gray-600 text-sm mt-2">
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
                onClick={() => handleRiskSelect('aggressive')}
                className={`p-6 rounded-xl border-2 text-left transition-all hover:shadow-lg ${
                  riskTolerance === 'aggressive' ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                }`}
              >
                <div className="text-4xl mb-4">🚀</div>
                <h3 className="text-xl font-bold">Aggressive</h3>
                <p className="text-gray-600 text-sm mt-2">
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
          </div>
        )}

        {/* Step 2: Customize */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Investment Amount */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                💰 How much are you investing?
                <InfoButton explanation="Only invest what you can afford to lose completely. Crypto is volatile and can go to zero." />
              </h2>
              
              <div className="flex items-center gap-4">
                <span className="text-2xl">$</span>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value) || 0)}
                  className="text-3xl font-bold w-40 border-b-2 border-gray-300 focus:border-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-2 mt-4">
                {[100, 500, 1000, 5000, 10000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setInvestmentAmount(amount)}
                    className={`px-3 py-1 rounded-lg text-sm ${
                      investmentAmount === amount ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    ${amount.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Allocation Customizer */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
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
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          className="transition-all duration-300"
                        />
                      )];
                    }, [] as JSX.Element[])}
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
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: alloc.color }}
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">{alloc.name}</span>
                          <span className="text-sm text-gray-500">
                            ${Math.round(investmentAmount * alloc.percentage / 100).toLocaleString()}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="80"
                          value={alloc.percentage}
                          onChange={(e) => updateAllocation(alloc.id, Number(e.target.value))}
                          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      <span className="font-bold w-12 text-right">{alloc.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Portfolio Risk Score */}
              <div className="bg-gray-50 rounded-lg p-4 mt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Portfolio Risk Score:</span>
                  <span className={`font-bold text-lg ${
                    portfolioRisk <= 2 ? 'text-green-600' :
                    portfolioRisk <= 3 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {portfolioRisk}/5
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  {portfolioRisk <= 2 ? 'Low risk - Good for long-term holding' :
                   portfolioRisk <= 3 ? 'Moderate risk - Balanced approach' :
                   'Higher risk - Prepare for volatility'}
                </p>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 text-gray-600 hover:text-gray-800"
              >
                ← Back
              </button>
              <button
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
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
              <h2 className="text-2xl font-bold mb-6">🎉 Your Portfolio Summary</h2>

              {/* Summary Cards */}
              <div className="grid md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-blue-600 text-sm">Total Investment</p>
                  <p className="text-2xl font-bold">${investmentAmount.toLocaleString()}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-green-600 text-sm">Number of Assets</p>
                  <p className="text-2xl font-bold">{allocations.length} coins</p>
                </div>
                <div className={`p-4 rounded-lg ${
                  portfolioRisk <= 2 ? 'bg-green-50' : portfolioRisk <= 3 ? 'bg-yellow-50' : 'bg-red-50'
                }`}>
                  <p className={`text-sm ${
                    portfolioRisk <= 2 ? 'text-green-600' : portfolioRisk <= 3 ? 'text-yellow-600' : 'text-red-600'
                  }`}>Risk Level</p>
                  <p className="text-2xl font-bold">
                    {portfolioRisk <= 2 ? '🛡️ Low' : portfolioRisk <= 3 ? '⚖️ Medium' : '🚀 High'}
                  </p>
                </div>
              </div>

              {/* Allocation Table */}
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3">Asset</th>
                    <th className="text-right py-3">Allocation</th>
                    <th className="text-right py-3">Amount</th>
                    <th className="text-right py-3">Risk</th>
                  </tr>
                </thead>
                <tbody>
                  {allocations.map((alloc) => (
                    <tr key={alloc.id} className="border-b border-gray-100">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded" style={{ backgroundColor: alloc.color }} />
                          <span className="font-medium">{alloc.name}</span>
                          <span className="text-gray-400">({alloc.symbol})</span>
                        </div>
                      </td>
                      <td className="text-right py-3 font-medium">{alloc.percentage}%</td>
                      <td className="text-right py-3">
                        ${Math.round(investmentAmount * alloc.percentage / 100).toLocaleString()}
                      </td>
                      <td className="text-right py-3">
                        <span className={`px-2 py-1 rounded text-xs ${
                          alloc.riskLevel <= 2 ? 'bg-green-100 text-green-700' :
                          alloc.riskLevel <= 3 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {alloc.riskLevel <= 2 ? 'Low' : alloc.riskLevel <= 3 ? 'Med' : 'High'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Important Notes */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-6">
                <h3 className="font-bold text-yellow-800 mb-2">⚠️ Important Reminders</h3>
                <ul className="text-sm text-yellow-700 space-y-1">
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
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50"
              >
                ← Modify Portfolio
              </button>
              <button
                className="flex-1 px-8 py-4 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700"
              >
                📥 Download Portfolio Plan (PDF)
              </button>
              <button
                className="px-8 py-4 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
              >
                📊 Track This Portfolio
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
