'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import { SUPPORTED_COINS, getCoinGeckoId } from '@/lib/dataTypes';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart,
  BarChart, Bar,
} from 'recharts';

type LayoutType = '1x1' | '1x2' | '2x2' | '2x3' | '3x3';
type ChartMode = 'price' | 'volume' | 'change';

interface ChartCell {
  id: string;
  coinId: string;
  mode: ChartMode;
  days: number;
}

interface ChartCellData {
  data: { date: string; price: number; volume: number; change: number }[];
  loading: boolean;
  error: string | null;
  coinName: string;
}

const LAYOUT_CONFIGS: Record<LayoutType, { cols: number; rows: number; count: number; label: string }> = {
  '1x1': { cols: 1, rows: 1, count: 1, label: 'Single' },
  '1x2': { cols: 2, rows: 1, count: 2, label: '1×2' },
  '2x2': { cols: 2, rows: 2, count: 4, label: '2×2' },
  '2x3': { cols: 3, rows: 2, count: 6, label: '2×3' },
  '3x3': { cols: 3, rows: 3, count: 9, label: '3×3' },
};

const TOP_COINS = SUPPORTED_COINS.slice(0, 30);
const DEFAULT_COINS = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'LINK', 'DOGE', 'XRP'];

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16', '#F97316'];

function createCells(count: number): ChartCell[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `cell-${i}`,
    coinId: DEFAULT_COINS[i] || DEFAULT_COINS[i % DEFAULT_COINS.length],
    mode: 'price' as ChartMode,
    days: 30,
  }));
}

function MiniChart({ cell, cellData }: { cell: ChartCell; cellData: ChartCellData }) {
  if (cellData.loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
      </div>
    );
  }
  if (cellData.error) {
    return (
      <div className="flex items-center justify-center h-full text-red-400 text-xs p-2 text-center">
        {cellData.error}
      </div>
    );
  }
  if (!cellData.data.length) return null;

  const dataKey = cell.mode === 'volume' ? 'volume' : cell.mode === 'change' ? 'change' : 'price';
  const colorIdx = DEFAULT_COINS.indexOf(cell.coinId) % COLORS.length;
  const color = COLORS[colorIdx >= 0 ? colorIdx : 0];

  if (cell.mode === 'volume') {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={cellData.data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} />
          <YAxis tick={{ fontSize: 9, fill: '#9CA3AF' }} tickFormatter={(v: number) => `$${(v / 1e9).toFixed(1)}B`} tickLine={false} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '11px' }}
            formatter={(v: any) => [`$${Number(v).toLocaleString()}`, 'Volume']}
          />
          <Bar dataKey="volume" fill={color} opacity={0.8} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={cellData.data} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
        <defs>
          <linearGradient id={`grad-${cell.id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
        <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#9CA3AF' }} tickLine={false} />
        <YAxis
          tick={{ fontSize: 9, fill: '#9CA3AF' }}
          tickLine={false}
          tickFormatter={(v: number) => dataKey === 'change' ? `${v.toFixed(1)}%` : `$${v.toLocaleString()}`}
          domain={dataKey === 'change' ? ['auto', 'auto'] : ['auto', 'auto']}
        />
        <Tooltip
          contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', fontSize: '11px' }}
          formatter={(v: any) => [dataKey === 'change' ? `${Number(v).toFixed(2)}%` : `$${Number(v).toLocaleString()}`, cellData.coinName]}
        />
        <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#grad-${cell.id})`} strokeWidth={2} dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export default function MultiChartPage() {
  const [layout, setLayout] = useState<LayoutType>('2x2');
  const [cells, setCells] = useState<ChartCell[]>(createCells(4));
  const [cellDataMap, setCellDataMap] = useState<Record<string, ChartCellData>>({});

  const updateLayout = (newLayout: LayoutType) => {
    const count = LAYOUT_CONFIGS[newLayout].count;
    setLayout(newLayout);
    setCells(prev => {
      if (prev.length >= count) return prev.slice(0, count);
      return [...prev, ...createCells(count - prev.length).map((c, i) => ({ ...c, coinId: DEFAULT_COINS[(prev.length + i) % DEFAULT_COINS.length] }))];
    });
  };

  const updateCell = (id: string, updates: Partial<ChartCell>) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    // Fetch data only for the changed cell (avoid re-fetching all cells)
    const updatedCell = { ...cells.find(c => c.id === id)!, ...updates };
    fetchCellData(updatedCell);
  };

  const fetchCellData = useCallback(async (cell: ChartCell) => {
    setCellDataMap(prev => ({ ...prev, [cell.id]: { ...prev[cell.id], loading: true, error: null, data: prev[cell.id]?.data || [], coinName: cell.coinId } }));

    try {
      const geckoId = getCoinGeckoId(cell.coinId);
      const coin = TOP_COINS.find(c => c.symbol === cell.coinId);
      const coinName = coin?.name || cell.coinId;

      const res = await fetch(`/api/charts/history?coin=${geckoId}&days=${cell.days}`);
      if (!res.ok) throw new Error('Fetch failed');
      const json = await res.json();

      // API returns { prices: Array<{ timestamp, price, volume?, ... }> }
      const prices: { timestamp: number; price: number; volume?: number }[] = json.prices || [];
      const firstPrice = prices[0]?.price || 1;

      const data = prices.map((p) => ({
        date: new Date(p.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: p.price,
        volume: p.volume || 0,
        change: ((p.price - firstPrice) / firstPrice) * 100,
      }));

      setCellDataMap(prev => ({ ...prev, [cell.id]: { data, loading: false, error: null, coinName } }));
    } catch {
      setCellDataMap(prev => ({ ...prev, [cell.id]: { data: [], loading: false, error: 'Failed to load', coinName: cell.coinId } }));
    }
  }, []);

  // Only fetch on initial mount and layout changes (new cells added)
  const prevCellIdsRef = useRef<string>('');
  useEffect(() => {
    const currentIds = cells.map(c => `${c.id}-${c.coinId}-${c.days}`).join(',');
    if (prevCellIdsRef.current === currentIds) return;
    const prevIds = prevCellIdsRef.current ? prevCellIdsRef.current.split(',').map(s => s.split('-')[0]) : [];
    prevCellIdsRef.current = currentIds;
    // Only fetch cells that are new (not already fetched)
    cells.forEach(cell => {
      if (!prevIds.includes(cell.id) || !cellDataMap[cell.id]) {
        fetchCellData(cell);
      }
    });
  }, [cells, fetchCellData]);

  const { cols } = LAYOUT_CONFIGS[layout];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />
      <Breadcrumb customTitle="Multi-Chart Layout" />

      <div className="max-w-[1800px] mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">📊 Multi-Chart Layout</h1>
            <p className="text-sm text-gray-400">Compare multiple coins side-by-side</p>
          </div>

          {/* Layout selector */}
          <div className="flex gap-2">
            {(Object.keys(LAYOUT_CONFIGS) as LayoutType[]).map(l => (
              <button
                key={l}
                onClick={() => updateLayout(l)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  layout === l ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                }`}
              >
                {LAYOUT_CONFIGS[l].label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Grid */}
        <div
          className={`grid gap-4 ${
            cols === 1
              ? 'grid-cols-1'
              : cols === 2
                ? 'grid-cols-2'
                : 'grid-cols-3'
          }`}
        >
          {cells.map((cell, idx) => {
            const cellData = cellDataMap[cell.id] || { data: [], loading: true, error: null, coinName: cell.coinId };
            const lastPrice = cellData.data[cellData.data.length - 1]?.price;
            const firstPrice = cellData.data[0]?.price;
            const pctChange = firstPrice && lastPrice ? ((lastPrice - firstPrice) / firstPrice) * 100 : 0;

            return (
              <div
                key={cell.id}
                className={`bg-gray-800 rounded-xl border border-gray-700 overflow-hidden flex flex-col ${
                  layout === '1x1'
                    ? 'min-h-[500px]'
                    : layout === '3x3'
                      ? 'min-h-[220px]'
                      : 'min-h-[280px]'
                }`}
              >
                {/* Cell Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700 bg-gray-800/80">
                  <div className="flex items-center gap-2">
                    <select
                      title="Select coin"
                      value={cell.coinId}
                      onChange={(e) => updateCell(cell.id, { coinId: e.target.value })}
                      className="bg-gray-700 text-white text-xs rounded px-2 py-1 border-none"
                    >
                      {TOP_COINS.map(c => (
                        <option key={c.symbol} value={c.symbol}>{c.symbol}</option>
                      ))}
                    </select>
                    {lastPrice && (
                      <span className="text-xs font-medium text-gray-300">
                        ${lastPrice.toLocaleString(undefined, { maximumFractionDigits: lastPrice < 1 ? 6 : 2 })}
                      </span>
                    )}
                    {pctChange !== 0 && (
                      <span className={`text-xs font-medium ${pctChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {pctChange >= 0 ? '+' : ''}{pctChange.toFixed(1)}%
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    {(['price', 'volume', 'change'] as ChartMode[]).map(m => (
                      <button
                        key={m}
                        onClick={() => updateCell(cell.id, { mode: m })}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium transition ${
                          cell.mode === m ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-gray-200'
                        }`}
                      >
                        {m === 'price' ? '💰' : m === 'volume' ? '📊' : '📈'}
                      </button>
                    ))}
                    <select
                      title="Select range"
                      value={cell.days}
                      onChange={(e) => updateCell(cell.id, { days: Number(e.target.value) })}
                      className="bg-gray-700 text-gray-300 text-[10px] rounded px-1 py-0.5 ml-1"
                    >
                      <option value={7}>7D</option>
                      <option value={30}>30D</option>
                      <option value={90}>90D</option>
                      <option value={365}>1Y</option>
                    </select>
                  </div>
                </div>

                {/* Chart area */}
                <div className="flex-1 p-1">
                  <MiniChart cell={cell} cellData={cellData} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
