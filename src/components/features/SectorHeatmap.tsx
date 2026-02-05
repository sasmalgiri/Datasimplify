'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw, TrendingUp, TrendingDown, Maximize2, Minimize2, Info, ExternalLink } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  market_cap: number;
  market_cap_change_24h: number;
  volume_24h: number;
  top_3_coins: string[];
}

interface SectorHeatmapProps {
  maxSectors?: number;
  showControls?: boolean;
  height?: string;
  className?: string;
}

interface TreemapRect {
  category: Category;
  x: number;
  y: number;
  width: number;
  height: number;
}

export function SectorHeatmap({
  maxSectors = 30,
  showControls = true,
  height = '500px',
  className = '',
}: SectorHeatmapProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'gainers' | 'losers'>('all');

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/crypto/categories?limit=${maxSectors + 20}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch categories');
      }

      setCategories(result.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Unable to load sector data');
    } finally {
      setLoading(false);
    }
  }, [maxSectors]);

  useEffect(() => {
    fetchCategories();
    const interval = setInterval(fetchCategories, 5 * 60 * 1000); // Refresh every 5 minutes
    return () => clearInterval(interval);
  }, [fetchCategories]);

  // Filter and prepare data for treemap
  const filteredCategories = useMemo(() => {
    let data = [...categories];

    if (filter === 'gainers') {
      data = data.filter((c) => c.market_cap_change_24h > 0);
    } else if (filter === 'losers') {
      data = data.filter((c) => c.market_cap_change_24h < 0);
    }

    return data.slice(0, maxSectors);
  }, [categories, filter, maxSectors]);

  // Calculate treemap layout using squarified algorithm
  const treemapRects = useMemo(() => {
    if (filteredCategories.length === 0) return [];

    const totalMarketCap = filteredCategories.reduce((sum, c) => sum + c.market_cap, 0);
    const containerWidth = 100; // percentage
    const containerHeight = 100; // percentage

    // Simple row-based layout for better readability
    const rects: TreemapRect[] = [];
    let currentY = 0;
    let remainingCategories = [...filteredCategories];

    while (remainingCategories.length > 0) {
      // Calculate how many items fit in this row
      const rowHeight = Math.max(100 / Math.ceil(Math.sqrt(filteredCategories.length)), 15);
      let rowWidth = 0;
      const rowItems: Category[] = [];

      for (const cat of remainingCategories) {
        const itemWidth = (cat.market_cap / totalMarketCap) * containerWidth * 3;
        if (rowWidth + itemWidth <= containerWidth || rowItems.length === 0) {
          rowItems.push(cat);
          rowWidth += itemWidth;
        } else {
          break;
        }
      }

      // Normalize widths to fill the row
      let currentX = 0;
      for (const cat of rowItems) {
        const normalizedWidth = (cat.market_cap / rowItems.reduce((sum, c) => sum + c.market_cap, 0)) * containerWidth;
        rects.push({
          category: cat,
          x: currentX,
          y: currentY,
          width: normalizedWidth,
          height: rowHeight,
        });
        currentX += normalizedWidth;
      }

      currentY += rowHeight;
      remainingCategories = remainingCategories.slice(rowItems.length);

      if (currentY >= containerHeight) break;
    }

    // Normalize heights if needed
    if (currentY > 100) {
      const scale = 100 / currentY;
      rects.forEach((r) => {
        r.y *= scale;
        r.height *= scale;
      });
    }

    return rects;
  }, [filteredCategories]);

  // Get color based on 24h change - TradingView style
  const getBackgroundColor = (change: number): string => {
    if (change >= 10) return 'rgb(0, 150, 80)'; // Strong green
    if (change >= 5) return 'rgb(0, 135, 75)';
    if (change >= 3) return 'rgb(0, 120, 70)';
    if (change >= 1) return 'rgb(0, 105, 65)';
    if (change >= 0) return 'rgb(30, 85, 55)'; // Dim green
    if (change >= -1) return 'rgb(85, 40, 40)'; // Dim red
    if (change >= -3) return 'rgb(120, 35, 35)';
    if (change >= -5) return 'rgb(145, 30, 30)';
    if (change >= -10) return 'rgb(170, 25, 25)';
    return 'rgb(190, 20, 20)'; // Strong red
  };

  // Format market cap
  const formatMarketCap = (mc: number): string => {
    if (mc >= 1e12) return `$${(mc / 1e12).toFixed(2)}T`;
    if (mc >= 1e9) return `$${(mc / 1e9).toFixed(2)}B`;
    if (mc >= 1e6) return `$${(mc / 1e6).toFixed(2)}M`;
    return `$${mc.toLocaleString()}`;
  };

  // Get font size based on rect size
  const getFontSize = (width: number, height: number): string => {
    const minDim = Math.min(width, height);
    if (minDim > 25) return 'text-sm';
    if (minDim > 18) return 'text-xs';
    return 'text-[10px]';
  };

  // Should show change in rect
  const shouldShowDetails = (width: number, height: number): boolean => {
    return width > 10 && height > 18;
  };

  if (loading && categories.length === 0) {
    return (
      <div className={`bg-gray-900 rounded-xl border border-gray-800 p-8 text-center ${className}`}>
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Loading sector heatmap...</p>
      </div>
    );
  }

  if (error && categories.length === 0) {
    return (
      <div className={`bg-gray-900 rounded-xl border border-gray-800 p-8 text-center ${className}`}>
        <p className="text-gray-400 mb-4">{error}</p>
        <button
          onClick={fetchCategories}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition"
        >
          Try Again
        </button>
      </div>
    );
  }

  const containerClasses = isFullscreen
    ? 'fixed inset-0 z-50 bg-gray-950 p-4'
    : `bg-gray-900 rounded-xl border border-gray-800 ${className}`;

  return (
    <div className={containerClasses}>
      {/* Header */}
      {showControls && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              Crypto Sector Heatmap
              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                Live Data
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            {/* Filter Buttons */}
            <div className="flex rounded-lg overflow-hidden border border-gray-700">
              <button
                onClick={() => setFilter('all')}
                className={`px-3 py-1.5 text-xs font-medium transition ${
                  filter === 'all'
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilter('gainers')}
                className={`px-3 py-1.5 text-xs font-medium transition flex items-center gap-1 ${
                  filter === 'gainers'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-emerald-400'
                }`}
              >
                <TrendingUp className="w-3 h-3" />
                Gainers
              </button>
              <button
                onClick={() => setFilter('losers')}
                className={`px-3 py-1.5 text-xs font-medium transition flex items-center gap-1 ${
                  filter === 'losers'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-red-400'
                }`}
              >
                <TrendingDown className="w-3 h-3" />
                Losers
              </button>
            </div>

            {/* Last Updated */}
            {lastUpdated && (
              <span className="text-xs text-gray-500 hidden md:block">
                {lastUpdated.toLocaleTimeString()}
              </span>
            )}

            {/* Refresh */}
            <button
              onClick={fetchCategories}
              disabled={loading}
              className="p-1.5 text-gray-400 hover:text-white rounded transition"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-1.5 text-gray-400 hover:text-white rounded transition"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      )}

      {/* Heatmap Container */}
      <div
        className="relative"
        style={{ height: isFullscreen ? 'calc(100vh - 180px)' : height }}
      >
        <div className="absolute inset-0 m-2">
          {treemapRects.map((rect, index) => (
            <button
              key={rect.category.id}
              onClick={() => setSelectedCategory(rect.category)}
              className="absolute transition-all duration-200 hover:brightness-110 hover:z-10 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-white/30"
              style={{
                left: `${rect.x}%`,
                top: `${rect.y}%`,
                width: `${rect.width}%`,
                height: `${rect.height}%`,
                backgroundColor: getBackgroundColor(rect.category.market_cap_change_24h),
                padding: '2px',
              }}
            >
              <div className="w-full h-full flex flex-col items-center justify-center overflow-hidden px-1">
                <span
                  className={`font-bold text-white truncate w-full text-center leading-tight ${getFontSize(rect.width, rect.height)}`}
                >
                  {rect.category.name}
                </span>
                {shouldShowDetails(rect.width, rect.height) && (
                  <span
                    className={`text-white/90 ${rect.width > 15 ? 'text-xs' : 'text-[9px]'}`}
                  >
                    {rect.category.market_cap_change_24h >= 0 ? '+' : ''}
                    {rect.category.market_cap_change_24h.toFixed(2)}%
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800">
        <div className="flex items-center gap-4 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5">
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgb(190, 20, 20)' }} />
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgb(145, 30, 30)' }} />
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgb(85, 40, 40)' }} />
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgb(30, 85, 55)' }} />
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgb(0, 105, 65)' }} />
              <div className="w-4 h-3 rounded-sm" style={{ backgroundColor: 'rgb(0, 150, 80)' }} />
            </div>
            <span>-10% to +10%</span>
          </div>
          <span className="hidden sm:block">Larger boxes = Higher market cap</span>
        </div>
        <div className="text-xs text-gray-500">
          Data by{' '}
          <a href="https://www.coingecko.com" target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">
            CoinGecko
          </a>
        </div>
      </div>

      {/* Selected Category Modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setSelectedCategory(null)}>
          <div
            className="bg-gray-900 rounded-xl border border-gray-700 max-w-md w-full p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedCategory.name}</h3>
                <p className="text-gray-400 text-sm">Sector Overview</p>
              </div>
              <span
                className={`flex items-center gap-1 text-lg font-bold px-3 py-1 rounded-lg ${
                  selectedCategory.market_cap_change_24h >= 0
                    ? 'text-emerald-400 bg-emerald-500/20'
                    : 'text-red-400 bg-red-500/20'
                }`}
              >
                {selectedCategory.market_cap_change_24h >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {selectedCategory.market_cap_change_24h >= 0 ? '+' : ''}
                {selectedCategory.market_cap_change_24h.toFixed(2)}%
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Market Cap</p>
                <p className="text-white font-semibold">{formatMarketCap(selectedCategory.market_cap)}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">24h Volume</p>
                <p className="text-white font-semibold">{formatMarketCap(selectedCategory.volume_24h)}</p>
              </div>
            </div>

            {/* Top Coins */}
            {selectedCategory.top_3_coins && selectedCategory.top_3_coins.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-400 text-xs mb-2">Top Coins in Sector</p>
                <div className="flex gap-2">
                  {selectedCategory.top_3_coins.slice(0, 5).map((coinImg, i) => (
                    <div key={i} className="relative w-8 h-8">
                      <Image
                        src={coinImg}
                        alt={`Top ${i + 1}`}
                        fill
                        className="rounded-full object-cover border-2 border-gray-700"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Link
                href={`/categories`}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition text-sm font-medium"
              >
                View All Categories
                <ExternalLink className="w-4 h-4" />
              </Link>
              <button
                onClick={() => setSelectedCategory(null)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Close Button */}
      {isFullscreen && (
        <div className="absolute top-4 right-4">
          <button
            onClick={() => setIsFullscreen(false)}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition text-sm"
          >
            Exit Fullscreen (ESC)
          </button>
        </div>
      )}
    </div>
  );
}

export default SectorHeatmap;
