'use client';

import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SectorHeatmap } from '@/components/features/SectorHeatmap';
import { Treemap } from '@/components/features/Treemap';
import { UniversalExport } from '@/components/UniversalExport';
import { useState, useEffect, useCallback } from 'react';
import { Grid3X3, Layers, RefreshCw } from 'lucide-react';
import Link from 'next/link';

interface Coin {
  id: string;
  symbol: string;
  name: string;
  market_cap: number;
  price_change_percentage_24h: number;
  current_price: number;
}

export default function HeatmapPage() {
  const [view, setView] = useState<'sectors' | 'coins'>('sectors');
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCoins = useCallback(async () => {
    if (view !== 'coins' || coins.length > 0) return;

    setLoading(true);
    try {
      const res = await fetch('/api/crypto?limit=100');
      const json = await res.json();
      if (json?.data) {
        setCoins(json.data);
      }
    } catch (error) {
      console.error('Error fetching coins:', error);
    } finally {
      setLoading(false);
    }
  }, [view, coins.length]);

  useEffect(() => {
    fetchCoins();
  }, [fetchCoins]);

  return (
    <div className="min-h-screen bg-gray-950">
      <FreeNavbar />
      <Breadcrumb />

      <main className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Grid3X3 className="w-8 h-8 text-emerald-500" />
              <h1 className="text-3xl font-bold text-white">Market Heatmaps</h1>
              <span className="text-xs px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">
                Live Data
              </span>
            </div>
            <p className="text-gray-400">
              TradingView-style visual overview of crypto market performance by sector and individual coins.
            </p>
          </div>

          {/* View Toggle + Export */}
          <div className="flex items-center gap-3">
            <UniversalExport name="Market-Heatmaps" compact />
            <div className="flex rounded-lg overflow-hidden border border-gray-700">
              <button
                onClick={() => setView('sectors')}
                className={`px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${
                  view === 'sectors'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Layers className="w-4 h-4" />
                Sectors
              </button>
              <button
                onClick={() => setView('coins')}
                className={`px-4 py-2 text-sm font-medium transition flex items-center gap-2 ${
                  view === 'coins'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Coins
              </button>
            </div>
          </div>
        </div>

        {/* Heatmap Views */}
        {view === 'sectors' ? (
          <SectorHeatmap maxSectors={50} height="calc(100vh - 350px)" className="min-h-[500px]" />
        ) : (
          <>
            {loading ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
                <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Loading coin data...</p>
              </div>
            ) : coins.length > 0 ? (
              <div className="bg-gray-900 rounded-xl border border-gray-800">
                <Treemap coins={coins} showBeginnerTips={false} />
              </div>
            ) : (
              <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
                <p className="text-gray-400">No coin data available</p>
              </div>
            )}
          </>
        )}

        {/* Info Section */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-3">How to Read the Heatmap</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span><strong>Rectangle Size:</strong> Represents market capitalization - larger = bigger market cap</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span><strong>Green Colors:</strong> Positive 24h price change (brighter = larger gain)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span><strong>Red Colors:</strong> Negative 24h price change (brighter = larger loss)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400">•</span>
                <span><strong>Click:</strong> Click any sector/coin for detailed information</span>
              </li>
            </ul>
          </div>

          <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Explore More</h3>
            <div className="flex gap-3">
              <Link
                href="/categories"
                className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium"
              >
                View All Categories
              </Link>
            </div>
          </div>
        </div>

        {/* Attribution */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            Data provided by{' '}
            <a
              href="https://www.coingecko.com/en/api"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-400 hover:underline"
            >
              CoinGecko
            </a>
            . Updated every 5 minutes.
          </p>
        </div>
      </main>
    </div>
  );
}
