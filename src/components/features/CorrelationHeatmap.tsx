'use client';

import { useState, useMemo } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  prices: number[]; // Historical prices for correlation calculation
}

interface CorrelationHeatmapProps {
  coins: CoinData[];
  showBeginnerTips?: boolean;
}

// Calculate Pearson correlation coefficient
function calculateCorrelation(arr1: number[], arr2: number[]): number {
  const n = Math.min(arr1.length, arr2.length);
  if (n < 2) return 0;

  const mean1 = arr1.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const mean2 = arr2.slice(0, n).reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denom1 = 0;
  let denom2 = 0;

  for (let i = 0; i < n; i++) {
    const diff1 = arr1[i] - mean1;
    const diff2 = arr2[i] - mean2;
    numerator += diff1 * diff2;
    denom1 += diff1 * diff1;
    denom2 += diff2 * diff2;
  }

  if (denom1 === 0 || denom2 === 0) return 0;
  return numerator / Math.sqrt(denom1 * denom2);
}

export function CorrelationHeatmap({ coins, showBeginnerTips = true }: CorrelationHeatmapProps) {
  const [selectedCell, setSelectedCell] = useState<{ coin1: string; coin2: string; value: number } | null>(null);

  // Calculate correlation matrix
  const correlationMatrix = useMemo(() => {
    const matrix: { [key: string]: { [key: string]: number } } = {};
    
    for (const coin1 of coins) {
      matrix[coin1.symbol] = {};
      for (const coin2 of coins) {
        if (coin1.symbol === coin2.symbol) {
          matrix[coin1.symbol][coin2.symbol] = 1;
        } else {
          matrix[coin1.symbol][coin2.symbol] = calculateCorrelation(coin1.prices, coin2.prices);
        }
      }
    }
    
    return matrix;
  }, [coins]);

  // Get color based on correlation value
  const getColor = (value: number) => {
    if (value >= 0.9) return 'bg-green-600 text-white';
    if (value >= 0.7) return 'bg-green-500 text-white';
    if (value >= 0.5) return 'bg-green-400 text-white';
    if (value >= 0.3) return 'bg-green-300 text-gray-800';
    if (value >= 0.1) return 'bg-green-200 text-gray-800';
    if (value >= -0.1) return 'bg-gray-100 text-gray-800';
    if (value >= -0.3) return 'bg-red-200 text-gray-800';
    if (value >= -0.5) return 'bg-red-300 text-gray-800';
    if (value >= -0.7) return 'bg-red-400 text-white';
    return 'bg-red-500 text-white';
  };

  // Get interpretation text
  const getInterpretation = (value: number) => {
    if (value >= 0.9) return { level: 'Very High', meaning: 'These coins move almost identically' };
    if (value >= 0.7) return { level: 'High', meaning: 'These coins usually move in the same direction' };
    if (value >= 0.5) return { level: 'Moderate', meaning: 'These coins often move together' };
    if (value >= 0.3) return { level: 'Low', meaning: 'These coins have some connection' };
    if (value >= -0.3) return { level: 'Very Low', meaning: 'These coins move independently - good for diversification!' };
    if (value >= -0.5) return { level: 'Negative', meaning: 'These coins often move opposite to each other' };
    return { level: 'Strong Negative', meaning: 'These coins typically move in opposite directions' };
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="mb-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          🔗 Correlation Heatmap
          <InfoButton explanation="This shows how different cryptocurrencies move in relation to each other. High correlation (green) means they move together. Low or negative correlation (red) means they move independently or opposite." />
        </h2>
        <p className="text-gray-500 text-sm mt-1">
          See which coins move together and which are independent
        </p>
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip title="💡 Why Does This Matter?">
          <strong>Diversification</strong> is key to reducing risk! If all your coins move together, 
          they&apos;ll all crash at the same time. Look for coins with <strong>low correlation</strong> (yellow/red cells) 
          to build a safer portfolio.
        </BeginnerTip>
      )}

      {/* Heatmap Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Header Row */}
          <div className="flex">
            <div className="w-16 h-12"></div> {/* Empty corner */}
            {coins.map(coin => (
              <div 
                key={`header-${coin.symbol}`}
                className="w-16 h-12 flex items-center justify-center text-xs font-bold text-gray-600"
              >
                {coin.symbol.toUpperCase()}
              </div>
            ))}
          </div>

          {/* Data Rows */}
          {coins.map(coin1 => (
            <div key={`row-${coin1.symbol}`} className="flex">
              {/* Row Label */}
              <div className="w-16 h-12 flex items-center justify-center text-xs font-bold text-gray-600">
                {coin1.symbol.toUpperCase()}
              </div>
              
              {/* Cells */}
              {coins.map(coin2 => {
                const value = correlationMatrix[coin1.symbol]?.[coin2.symbol] || 0;
                return (
                  <button
                    key={`cell-${coin1.symbol}-${coin2.symbol}`}
                    onClick={() => setSelectedCell({ 
                      coin1: coin1.name, 
                      coin2: coin2.name, 
                      value 
                    })}
                    className={`
                      w-16 h-12 flex items-center justify-center text-xs font-medium
                      ${getColor(value)}
                      ${coin1.symbol === coin2.symbol ? 'cursor-default' : 'cursor-pointer hover:opacity-80'}
                      transition-opacity border border-white/20
                    `}
                  >
                    {value.toFixed(2)}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <div className="flex items-center gap-1 text-xs">
          <div className="w-4 h-4 bg-green-600 rounded"></div>
          <span>High (0.9+)</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-4 h-4 bg-green-400 rounded"></div>
          <span>Moderate (0.5+)</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-4 h-4 bg-gray-200 rounded"></div>
          <span>Low (-0.1 to 0.1)</span>
        </div>
        <div className="flex items-center gap-1 text-xs">
          <div className="w-4 h-4 bg-red-400 rounded"></div>
          <span>Negative</span>
        </div>
      </div>

      {/* Selected Cell Details */}
      {selectedCell && selectedCell.coin1 !== selectedCell.coin2 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-semibold">
                {selectedCell.coin1} ↔ {selectedCell.coin2}
              </h3>
              <p className={`text-2xl font-bold mt-1 ${selectedCell.value >= 0.5 ? 'text-green-600' : selectedCell.value >= 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                {selectedCell.value.toFixed(3)}
              </p>
            </div>
            <button 
              onClick={() => setSelectedCell(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="mt-4 space-y-3">
            <div>
              <p className="text-sm text-gray-500">Correlation Level</p>
              <p className="font-medium">{getInterpretation(selectedCell.value).level}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">What This Means</p>
              <p className="text-sm">{getInterpretation(selectedCell.value).meaning}</p>
            </div>
            
            {/* Portfolio Advice */}
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>💡 Portfolio Tip:</strong>{' '}
                {selectedCell.value >= 0.8 
                  ? `Owning both ${selectedCell.coin1} and ${selectedCell.coin2} doesn't add much diversification since they move together.`
                  : selectedCell.value >= 0.5
                  ? `These coins have moderate correlation. They provide some diversification.`
                  : selectedCell.value >= 0
                  ? `Great for diversification! These coins move quite independently.`
                  : `Excellent for hedging! When one goes up, the other tends to go down.`
                }
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Diversification Score */}
      <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
        <h3 className="font-semibold mb-2">🎯 Diversification Tips</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-600 mb-1"><strong>Best Pairs for Diversification:</strong></p>
            <p className="text-gray-800">
              Look for cells with values close to 0 or negative. These coins don&apos;t move together!
            </p>
          </div>
          <div>
            <p className="text-gray-600 mb-1"><strong>Avoid Redundancy:</strong></p>
            <p className="text-gray-800">
              If two coins have correlation above 0.9, owning both is like owning double of one coin.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Demo component with sample data
export function CorrelationHeatmapDemo({ showBeginnerTips = true }: { showBeginnerTips?: boolean }) {
  // Generate sample price data
  const generatePrices = (basePrice: number, volatility: number, correlation: number, basePrices?: number[]) => {
    const prices: number[] = [];
    for (let i = 0; i < 30; i++) {
      if (basePrices) {
        // Correlated with base
        const noise = (Math.random() - 0.5) * volatility;
        const correlated = basePrices[i] + (Math.random() - 0.5) * (1 - correlation) * volatility * 10;
        prices.push(correlated + noise);
      } else {
        // Independent
        const change = (Math.random() - 0.5) * volatility;
        prices.push(i === 0 ? basePrice : prices[i-1] + change);
      }
    }
    return prices;
  };

  const btcPrices = generatePrices(97000, 2000, 0);
  
  const sampleCoins: CoinData[] = [
    { id: 'bitcoin', symbol: 'BTC', name: 'Bitcoin', prices: btcPrices },
    { id: 'ethereum', symbol: 'ETH', name: 'Ethereum', prices: generatePrices(3800, 200, 0.9, btcPrices) },
    { id: 'solana', symbol: 'SOL', name: 'Solana', prices: generatePrices(220, 20, 0.8, btcPrices) },
    { id: 'ripple', symbol: 'XRP', name: 'Ripple', prices: generatePrices(2.3, 0.2, 0.6, btcPrices) },
    { id: 'dogecoin', symbol: 'DOGE', name: 'Dogecoin', prices: generatePrices(0.4, 0.05, 0.5, btcPrices) },
  ];

  return <CorrelationHeatmap coins={sampleCoins} showBeginnerTips={showBeginnerTips} />;
}

export default CorrelationHeatmap;
