'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpDown, ArrowUp, ArrowDown, Download, Plus } from 'lucide-react';
import { CoinMarketData } from '@/types/crypto';
import { formatCurrency, formatPercent, getPriceChangeColor } from '@/lib/utils';

interface CoinTableProps {
  coins: CoinMarketData[];
  onCompare?: (coin: CoinMarketData) => void;
  compareList?: string[];
  loading?: boolean;
}

type SortKey = 'market_cap_rank' | 'name' | 'current_price' | 'price_change_percentage_24h' | 'price_change_percentage_7d' | 'market_cap' | 'total_volume';

// Moved outside to avoid recreating on each render
function SortHeader({
  label,
  sortKeyName,
  currentSortKey,
  sortOrder,
  onSort
}: {
  label: string;
  sortKeyName: SortKey;
  currentSortKey: SortKey;
  sortOrder: 'asc' | 'desc';
  onSort: (key: SortKey) => void;
}) {
  return (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
      onClick={() => onSort(sortKeyName)}
    >
      <div className="flex items-center gap-1">
        {label}
        {currentSortKey === sortKeyName ? (
          sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
        ) : (
          <ArrowUpDown className="w-3 h-3 opacity-30" />
        )}
      </div>
    </th>
  );
}

export default function CoinTable({ coins, onCompare, compareList = [], loading }: CoinTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('market_cap_rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder(key === 'market_cap_rank' ? 'asc' : 'desc');
    }
  };

  const sortedCoins = [...coins].sort((a, b) => {
    const aVal = a[sortKey] ?? 0;
    const bVal = b[sortKey] ?? 0;

    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return sortOrder === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    }

    return sortOrder === 'asc'
      ? (aVal as number) - (bVal as number)
      : (bVal as number) - (aVal as number);
  });

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="animate-pulse p-8">
          {[...Array(10)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-100">
              <div className="w-8 h-8 bg-gray-200 rounded-full" />
              <div className="flex-1 h-4 bg-gray-200 rounded" />
              <div className="w-20 h-4 bg-gray-200 rounded" />
              <div className="w-16 h-4 bg-gray-200 rounded" />
              <div className="w-24 h-4 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50 sticky top-0 z-10">
            <tr>
              <SortHeader label="#" sortKeyName="market_cap_rank" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
              <SortHeader label="Name" sortKeyName="name" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
              <SortHeader label="Price" sortKeyName="current_price" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
              <SortHeader label="24h %" sortKeyName="price_change_percentage_24h" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
              <SortHeader label="7d %" sortKeyName="price_change_percentage_7d" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
              <SortHeader label="Market Cap" sortKeyName="market_cap" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
              <SortHeader label="Volume (24h)" sortKeyName="total_volume" currentSortKey={sortKey} sortOrder={sortOrder} onSort={handleSort} />
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedCoins.map((coin) => (
              <tr 
                key={coin.id} 
                className="hover:bg-gray-50 transition-colors"
              >
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {coin.market_cap_rank}
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <Link href={`/coin/${coin.id}`} className="flex items-center gap-3 group">
                    <Image
                      src={coin.image}
                      alt={coin.name}
                      width={32}
                      height={32}
                      className="rounded-full"
                    />
                    <div>
                      <div className="font-medium text-gray-900 group-hover:text-orange-600 transition-colors">
                        {coin.name}
                      </div>
                      <div className="text-xs text-gray-500 uppercase">
                        {coin.symbol}
                      </div>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(coin.current_price, { compact: false })}
                </td>
                <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${getPriceChangeColor(coin.price_change_percentage_24h)}`}>
                  {formatPercent(coin.price_change_percentage_24h)}
                </td>
                <td className={`px-4 py-4 whitespace-nowrap text-sm font-medium ${typeof coin.price_change_percentage_7d === 'number' ? getPriceChangeColor(coin.price_change_percentage_7d) : 'text-gray-500'}`}>
                  {typeof coin.price_change_percentage_7d === 'number' ? formatPercent(coin.price_change_percentage_7d) : '-'}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(coin.market_cap)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatCurrency(coin.total_volume)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                  <div className="flex items-center justify-end gap-2">
                    {onCompare && (
                      <button
                        onClick={() => onCompare(coin)}
                        disabled={compareList.includes(coin.id)}
                        className={`p-2 rounded-lg transition-colors ${
                          compareList.includes(coin.id)
                            ? 'bg-orange-100 text-orange-600'
                            : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                        }`}
                        title={compareList.includes(coin.id) ? 'Added to compare' : 'Add to compare'}
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    )}
                    <Link
                      href={`/coin/${coin.id}`}
                      className="p-2 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
                      title="View details"
                    >
                      <Download className="w-4 h-4" />
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
