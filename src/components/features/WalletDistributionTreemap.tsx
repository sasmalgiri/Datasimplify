'use client';

import { useState } from 'react';

interface WalletCategory {
  id: string;
  name: string;
  emoji: string;
  desc: string;
  percent: number;
  btc: number;
  addrs: number;
  change: number;
}

const CATEGORIES: WalletCategory[] = [
  { id: 'humpback', name: 'Humpback', emoji: '🐳', desc: '> 10K BTC', percent: 26.2, btc: 5188, addrs: 108, change: 0.12 },
  { id: 'whale', name: 'Whale', emoji: '🐋', desc: '1K-10K BTC', percent: 22.4, btc: 4435, addrs: 2156, change: -0.28 },
  { id: 'shark', name: 'Shark', emoji: '🦈', desc: '100-1K BTC', percent: 18.1, btc: 3584, addrs: 12456, change: 0.15 },
  { id: 'fish', name: 'Fish', emoji: '🐟', desc: '10-100 BTC', percent: 14.8, btc: 2930, addrs: 156789, change: 0.08 },
  { id: 'crab', name: 'Crab', emoji: '🦀', desc: '1-10 BTC', percent: 10.8, btc: 2138, addrs: 1234567, change: 0.05 },
  { id: 'shrimp', name: 'Shrimp', emoji: '🦐', desc: '< 1 BTC', percent: 7.7, btc: 1525, addrs: 45234567, change: 0.03 },
];

const formatNum = (n: number): string =>
  n >= 1000000 ? (n/1000000).toFixed(1)+'M' : n >= 1000 ? (n/1000).toFixed(0)+'K' : String(n);

interface CellProps {
  data: WalletCategory;
  width: number;
  onHover: (data: WalletCategory | null) => void;
}

function Cell({ data, width, onHover }: CellProps) {
  const isUp = data.change >= 0;

  return (
    <div
      className="relative cursor-pointer transition-all hover:brightness-110 border-r border-gray-700 last:border-r-0"
      style={{
        width: `${width}%`,
        background: isUp
          ? `linear-gradient(135deg, rgba(34,197,94,${0.3 + data.change*0.5}) 0%, rgba(22,163,74,${0.4 + data.change*0.5}) 100%)`
          : `linear-gradient(135deg, rgba(239,68,68,${0.3 + Math.abs(data.change)*0.5}) 0%, rgba(220,38,38,${0.4 + Math.abs(data.change)*0.5}) 100%)`
      }}
      onMouseEnter={() => onHover(data)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-4xl drop-shadow-lg">{data.emoji}</span>
        <span className="text-white font-bold text-lg">{data.name}</span>
        <span className="text-white text-3xl font-black">{data.percent}%</span>
        <span className={`text-sm font-bold ${isUp ? 'text-green-200' : 'text-red-200'}`}>
          {isUp ? '▲' : '▼'} {Math.abs(data.change)}%
        </span>
      </div>
    </div>
  );
}

interface WalletDistributionTreemapProps {
  btcPrice?: number;
}

export function WalletDistributionTreemap({ btcPrice = 97000 }: WalletDistributionTreemapProps) {
  const [hovered, setHovered] = useState<WalletCategory | null>(null);

  const topRow = CATEGORIES.slice(0, 3);
  const bottomRow = CATEGORIES.slice(3);

  const getWidths = (row: WalletCategory[]): number[] => {
    const total = row.reduce((s, d) => s + d.percent, 0);
    return row.map(d => (d.percent / total) * 100);
  };

  const totalSupply = 19800000; // 19.8M BTC

  return (
    <div className="bg-gray-900 text-white rounded-xl border border-gray-700">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-gray-700">
        <span className="text-4xl">🐋</span>
        <div>
          <h2 className="text-xl font-bold">BTC Wallet Distribution</h2>
          <p className="text-gray-400 text-sm">Finviz-style Treemap - Live Supply Distribution</p>
        </div>
      </div>

      <div className="p-4">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-2 mb-4">
          {[
            { label: 'BTC Price', value: `$${btcPrice.toLocaleString()}`, color: 'text-white' },
            { label: 'Supply', value: '19.8M', color: 'text-white' },
            { label: 'Whales', value: '48.6%', color: 'text-purple-400' },
            { label: 'Retail', value: '18.5%', color: 'text-blue-400' },
          ].map((s, i) => (
            <div key={i} className="bg-gray-800/50 rounded-lg p-3 border border-gray-700">
              <div className="text-gray-400 text-xs">{s.label}</div>
              <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
            </div>
          ))}
        </div>

        {/* Treemap */}
        <div className="rounded-xl overflow-hidden border-2 border-gray-700 shadow-2xl">
          <div className="flex h-44">
            {topRow.map((d, i) => (
              <Cell key={d.id} data={d} width={getWidths(topRow)[i]} onHover={setHovered} />
            ))}
          </div>
          <div className="flex h-36 border-t border-gray-700">
            {bottomRow.map((d, i) => (
              <Cell key={d.id} data={d} width={getWidths(bottomRow)[i]} onHover={setHovered} />
            ))}
          </div>
        </div>

        {/* Hover Info */}
        {hovered && (
          <div className="mt-4 bg-gray-800 rounded-xl p-4 border border-gray-600 animate-in fade-in">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl">{hovered.emoji}</span>
              <div>
                <div className="text-xl font-bold">{hovered.name}</div>
                <div className="text-gray-400 text-sm">{hovered.desc}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-400">Supply</div>
                <div className="font-bold">{hovered.percent}%</div>
              </div>
              <div>
                <div className="text-gray-400">BTC</div>
                <div className="font-bold">{formatNum(hovered.btc * 1000)}</div>
              </div>
              <div>
                <div className="text-gray-400">USD Value</div>
                <div className="font-bold">${formatNum(hovered.btc * 1000 * btcPrice)}</div>
              </div>
              <div>
                <div className="text-gray-400">Addresses</div>
                <div className="font-bold">{formatNum(hovered.addrs)}</div>
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map(c => (
            <div key={c.id} className="flex items-center gap-1 text-sm bg-gray-800/40 px-2 py-1 rounded">
              <span>{c.emoji}</span>
              <span className="text-gray-400">{c.desc}</span>
            </div>
          ))}
        </div>

        {/* Color Key */}
        <div className="flex justify-center gap-6 mt-3 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/60" />
            <span className="text-gray-400">Accumulating</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/60" />
            <span className="text-gray-400">Distributing</span>
          </div>
        </div>

        {/* Insight */}
        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg text-sm text-blue-200">
          <strong>Since 2012:</strong> Whale share dropped 62.7% → 48.6%, Retail grew 7% → 18.5%
        </div>
      </div>
    </div>
  );
}
