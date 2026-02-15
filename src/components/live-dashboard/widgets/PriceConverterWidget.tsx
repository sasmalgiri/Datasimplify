'use client';

import { useState, useMemo } from 'react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { getThemeColors } from '@/lib/live-dashboard/theme';
import { ArrowUpDown } from 'lucide-react';
import Image from 'next/image';

interface PriceConverterWidgetProps {}

export function PriceConverterWidget({}: PriceConverterWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const themeColors = getThemeColors(customization.colorTheme);
  const markets = data.markets;

  const [selectedCoinId, setSelectedCoinId] = useState('bitcoin');
  const [amount, setAmount] = useState<string>('1');

  const topCoins = useMemo(() => {
    if (!markets) return [];
    return markets.slice(0, 20);
  }, [markets]);

  const selectedCoin = useMemo(() => {
    return topCoins.find((c) => c.id === selectedCoinId) ?? topCoins[0] ?? null;
  }, [topCoins, selectedCoinId]);

  const btcCoin = useMemo(() => {
    return markets?.find((c) => c.id === 'bitcoin') ?? null;
  }, [markets]);

  if (!markets || markets.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
        Connect API key to use converter
      </div>
    );
  }

  const numericAmount = parseFloat(amount) || 0;
  const result = selectedCoin ? numericAmount * selectedCoin.current_price : 0;
  const btcPrice = btcCoin?.current_price ?? 0;
  const btcValue = btcPrice > 0 ? result / btcPrice : 0;

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow empty string, digits, and one decimal point
    if (val === '' || /^\d*\.?\d*$/.test(val)) {
      setAmount(val);
    }
  };

  const handleSwap = () => {
    // Swap: convert current USD result back to the selected coin
    // Effectively inverts the conversion direction
    if (selectedCoin && selectedCoin.current_price > 0) {
      const newAmount = result / selectedCoin.current_price;
      setAmount(newAmount ? newAmount.toFixed(6).replace(/\.?0+$/, '') : '1');
    }
  };

  const formatUsd = (n: number): string => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (n >= 1) return `$${n.toFixed(2)}`;
    if (n > 0) return `$${n.toFixed(6)}`;
    return '$0.00';
  };

  const formatBtc = (n: number): string => {
    if (n === 0) return '0 BTC';
    if (n >= 1) return `${n.toFixed(4)} BTC`;
    if (n >= 0.0001) return `${n.toFixed(6)} BTC`;
    return `${n.toFixed(8)} BTC`;
  };

  return (
    <div className="space-y-3">
      {/* From: Crypto Input */}
      <div>
        <label className="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-1.5 block">
          From
        </label>
        <div className="flex gap-2">
          {/* Amount input */}
          <input
            type="text"
            inputMode="decimal"
            value={amount}
            onChange={handleAmountChange}
            placeholder="0"
            className="flex-1 bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-white/[0.2] transition-colors"
          />
          {/* Coin selector */}
          <div className="relative">
            <select
              value={selectedCoin?.id ?? ''}
              onChange={(e) => setSelectedCoinId(e.target.value)}
              className="appearance-none bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2 pr-7 text-sm text-white outline-none focus:border-white/[0.2] transition-colors cursor-pointer"
            >
              {topCoins.map((coin) => (
                <option key={coin.id} value={coin.id} className="bg-gray-900 text-white">
                  {coin.symbol.toUpperCase()}
                </option>
              ))}
            </select>
            <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">
              &#9662;
            </div>
          </div>
        </div>
        {/* Selected coin info line */}
        {selectedCoin && (
          <div className="flex items-center gap-1.5 mt-1.5 px-1">
            {selectedCoin.image && (
              <Image
                src={selectedCoin.image}
                alt={selectedCoin.name}
                width={14}
                height={14}
                className="rounded-full"
              />
            )}
            <span className="text-xs text-gray-500">
              {selectedCoin.name} &middot; {formatUsd(selectedCoin.current_price)}/coin
            </span>
          </div>
        )}
      </div>

      {/* Swap button */}
      <div className="flex justify-center">
        <button
          onClick={handleSwap}
          className="p-1.5 rounded-lg bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] hover:border-white/[0.15] transition-all text-gray-400 hover:text-white"
          title="Swap direction"
        >
          <ArrowUpDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* To: USD Result */}
      <div>
        <label className="text-[11px] uppercase tracking-wider text-gray-500 font-medium mb-1.5 block">
          To
        </label>
        <div className="bg-white/[0.06] border border-white/[0.08] rounded-lg px-3 py-2.5">
          <div className="flex items-baseline justify-between">
            <span
              className="text-lg font-bold"
              style={{ color: themeColors.primary }}
            >
              {formatUsd(result)}
            </span>
            <span className="text-xs text-gray-500 font-medium">USD</span>
          </div>
          {/* BTC equivalent */}
          {selectedCoinId !== 'bitcoin' && btcPrice > 0 && (
            <div className="text-xs text-gray-500 mt-1">
              &#8776; {formatBtc(btcValue)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
