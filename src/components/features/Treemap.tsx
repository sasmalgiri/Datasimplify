'use client';

import { useState, useMemo } from 'react';
import { BeginnerTip, InfoButton } from '../ui/BeginnerHelpers';

interface CoinData {
  id: string;
  symbol: string;
  name: string;
  market_cap: number;
  price_change_percentage_24h: number;
  current_price: number;
}

interface TreemapProps {
  coins: CoinData[];
  showBeginnerTips?: boolean;
}

export function Treemap({ coins, showBeginnerTips = true }: TreemapProps) {
  const [selectedCoin, setSelectedCoin] = useState<CoinData | null>(null);
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers'>('all');

  // Calculate treemap layout
  const treemapData = useMemo(() => {
    let filteredCoins = [...coins];
    
    if (filter === 'gainers') {
      filteredCoins = filteredCoins.filter(c => c.price_change_percentage_24h > 0);
    } else if (filter === 'losers') {
      filteredCoins = filteredCoins.filter(c => c.price_change_percentage_24h < 0);
    }

    // Sort by market cap
    filteredCoins.sort((a, b) => b.market_cap - a.market_cap);

    // Take top 50 for display
    const topCoins = filteredCoins.slice(0, 50);
    const totalMarketCap = topCoins.reduce((sum, c) => sum + c.market_cap, 0);

    return topCoins.map(coin => ({
      ...coin,
      percentage: (coin.market_cap / totalMarketCap) * 100
    }));
  }, [coins, filter]);

  // Get color based on price change
  const getColor = (change: number) => {
    if (change >= 10) return 'bg-green-600 hover:bg-green-700';
    if (change >= 5) return 'bg-green-500 hover:bg-green-600';
    if (change >= 2) return 'bg-green-400 hover:bg-green-500';
    if (change >= 0) return 'bg-green-300 hover:bg-green-400';
    if (change >= -2) return 'bg-red-300 hover:bg-red-400';
    if (change >= -5) return 'bg-red-400 hover:bg-red-500';
    if (change >= -10) return 'bg-red-500 hover:bg-red-600';
    return 'bg-red-600 hover:bg-red-700';
  };

  // Get text color for contrast
  const getTextColor = (change: number) => {
    if (Math.abs(change) >= 5) return 'text-white';
    return 'text-gray-800';
  };

  // Format market cap
  const formatMarketCap = (mc: number) => {
    if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
    if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
    if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
    return `$${mc.toFixed(2)}`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            🗺️ Crypto Market Map
            <InfoButton explanation="This treemap shows the relative size of cryptocurrencies. Bigger boxes = larger market cap. Colors show price change (green = up, red = down)." />
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Visual overview of the top 50 cryptocurrencies by market cap
          </p>
        </div>
        
        {/* Filter Buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('gainers')}
            className={`px-3 py-1 rounded-lg text-sm ${filter === 'gainers' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}
          >
            🟢 Gainers
          </button>
          <button
            onClick={() => setFilter('losers')}
            className={`px-3 py-1 rounded-lg text-sm ${filter === 'losers' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'}`}
          >
            🔴 Losers
          </button>
        </div>
      </div>

      {/* Beginner Tip */}
      {showBeginnerTips && (
        <BeginnerTip>
          <strong>How to read this map:</strong> Each box represents a cryptocurrency. 
          The <strong>size</strong> shows how big it is (market cap). 
          The <strong>color</strong> shows if the price is going up (green) or down (red) today.
          Click any box to learn more!
        </BeginnerTip>
      )}

      {/* Treemap Grid */}
      <div className="grid grid-cols-10 gap-1 aspect-[2/1]">
        {treemapData.map((coin, index) => {
          // Calculate grid span based on market cap percentage
          let colSpan = 1;
          let rowSpan = 1;
          
          if (coin.percentage > 20) { colSpan = 3; rowSpan = 2; }
          else if (coin.percentage > 10) { colSpan = 2; rowSpan = 2; }
          else if (coin.percentage > 5) { colSpan = 2; rowSpan = 1; }
          
          return (
            <button
              key={coin.id}
              onClick={() => setSelectedCoin(coin)}
              className={`
                ${getColor(coin.price_change_percentage_24h)}
                ${getTextColor(coin.price_change_percentage_24h)}
                rounded p-2 flex flex-col items-center justify-center
                transition-all duration-200 cursor-pointer
                ${colSpan > 1 ? `col-span-${colSpan}` : ''}
                ${rowSpan > 1 ? `row-span-${rowSpan}` : ''}
                ${selectedCoin?.id === coin.id ? 'ring-2 ring-blue-500' : ''}
              `}
              style={{
                gridColumn: colSpan > 1 ? `span ${Math.min(colSpan, 3)}` : undefined,
                gridRow: rowSpan > 1 ? `span ${Math.min(rowSpan, 2)}` : undefined
              }}
            >
              <span className="font-bold text-xs md:text-sm truncate w-full text-center">
                {coin.symbol.toUpperCase()}
              </span>
              <span className={`text-xs ${colSpan > 1 ? '' : 'hidden md:block'}`}>
                {coin.price_change_percentage_24h >= 0 ? '+' : ''}
                {coin.price_change_percentage_24h.toFixed(1)}%
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex justify-center gap-4 mt-4 text-xs text-gray-500">
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>Price Up</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>Price Down</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-8 h-4 bg-gray-300 rounded"></div>
          <span>Bigger = Larger Market Cap</span>
        </div>
      </div>

      {/* Selected Coin Details */}
      {selectedCoin && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-lg">{selectedCoin.name} ({selectedCoin.symbol.toUpperCase()})</h3>
              <p className="text-2xl font-bold mt-1">
                ${selectedCoin.current_price.toLocaleString()}
              </p>
            </div>
            <div className={`text-right ${selectedCoin.price_change_percentage_24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              <p className="text-2xl font-bold">
                {selectedCoin.price_change_percentage_24h >= 0 ? '+' : ''}
                {selectedCoin.price_change_percentage_24h.toFixed(2)}%
              </p>
              <p className="text-sm text-gray-500">24h Change</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <p className="text-gray-500 text-sm">Market Cap</p>
              <p className="font-semibold">{formatMarketCap(selectedCoin.market_cap)}</p>
            </div>
            <div>
              <p className="text-gray-500 text-sm">What This Means</p>
              <p className="text-sm">
                {selectedCoin.price_change_percentage_24h >= 5 
                  ? '🟢 Strong bullish movement today!'
                  : selectedCoin.price_change_percentage_24h >= 0
                  ? '🟢 Slight positive movement'
                  : selectedCoin.price_change_percentage_24h >= -5
                  ? '🔴 Slight negative movement'
                  : '🔴 Significant drop today - be cautious'}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <a 
              href={`/coin/${selectedCoin.id}`}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg text-center hover:bg-blue-700"
            >
              View Details
            </a>
            <button 
              onClick={() => setSelectedCoin(null)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Treemap;
