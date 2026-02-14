'use client';

import { useLiveDashboardStore, type DerivativeTicker } from '@/lib/live-dashboard/store';
import { TABLE_DENSITY_MAP, getThemeColors } from '@/lib/live-dashboard/theme';

function formatCompactNumber(n: number): string {
  if (n >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

function formatPrice(price: string): string {
  const num = parseFloat(price);
  if (isNaN(num)) return price;
  if (num < 1) return `$${num.toFixed(6)}`;
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatFundingRate(rate: number): string {
  if (rate === 0 || isNaN(rate)) return '0.0000%';
  return `${rate >= 0 ? '+' : ''}${(rate * 100).toFixed(4)}%`;
}

interface DerivativesTableWidgetProps {
  limit?: number;
}

export function DerivativesTableWidget({ limit = 20 }: DerivativesTableWidgetProps) {
  const { data, customization } = useLiveDashboardStore();
  const density = TABLE_DENSITY_MAP[customization.tableDensity];
  const derivatives = data.derivatives?.slice(0, limit) || [];

  if (!data.derivatives) {
    return (
      <div className="flex items-center justify-center h-[280px] text-gray-600 text-sm">No data available</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`w-full ${density.text}`}>
        <thead>
          <tr className="text-gray-500 text-xs uppercase border-b border-gray-700">
            <th className={`text-left ${density.py} ${density.px}`}>Market</th>
            <th className={`text-left ${density.py} ${density.px}`}>Symbol</th>
            <th className={`text-right ${density.py} ${density.px}`}>Price</th>
            <th className={`text-right ${density.py} ${density.px}`}>24h %</th>
            <th className={`text-right ${density.py} ${density.px}`}>Funding Rate</th>
            <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>Open Interest</th>
            <th className={`text-right ${density.py} ${density.px} hidden md:table-cell`}>Volume (24h)</th>
            <th className={`text-left ${density.py} ${density.px} hidden lg:table-cell`}>Type</th>
          </tr>
        </thead>
        <tbody>
          {derivatives.map((ticker: DerivativeTicker, idx: number) => {
            const change24h = ticker.price_percentage_change_24h ?? 0;
            const fundingRate = ticker.funding_rate ?? 0;

            return (
              <tr
                key={`${ticker.market}-${ticker.symbol}-${idx}`}
                className="border-b border-gray-800 hover:bg-white/[0.02] transition"
              >
                <td className={`${density.py} ${density.px} text-white font-medium`}>{ticker.market}</td>
                <td className={`${density.py} ${density.px} text-gray-300`}>{ticker.symbol}</td>
                <td className={`${density.py} ${density.px} text-right text-white font-medium`}>
                  {formatPrice(ticker.price)}
                </td>
                <td className={`${density.py} ${density.px} text-right`}>
                  <span
                    className={`font-medium ${
                      change24h >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {change24h >= 0 ? '+' : ''}
                    {change24h.toFixed(2)}%
                  </span>
                </td>
                <td className={`${density.py} ${density.px} text-right`}>
                  <span
                    className={`font-medium ${
                      fundingRate >= 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatFundingRate(fundingRate)}
                  </span>
                </td>
                <td className={`${density.py} ${density.px} text-right text-gray-300 hidden md:table-cell`}>
                  ${formatCompactNumber(ticker.open_interest)}
                </td>
                <td className={`${density.py} ${density.px} text-right text-gray-300 hidden md:table-cell`}>
                  ${formatCompactNumber(ticker.volume_24h)}
                </td>
                <td className={`${density.py} ${density.px} text-left hidden lg:table-cell`}>
                  <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-white/[0.06] text-gray-400 capitalize">
                    {ticker.contract_type || '—'}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
