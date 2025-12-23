'use client';

import { useState, useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatCurrency } from '@/lib/utils';

interface PriceChartProps {
  data: Array<{ timestamp: number; price: number }>;
  height?: number;
  showAxis?: boolean;
  color?: string;
}

type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y';

const TIME_RANGES: Record<TimeRange, number> = {
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
  '30d': 30 * 24 * 60 * 60 * 1000,
  '90d': 90 * 24 * 60 * 60 * 1000,
  '1y': 365 * 24 * 60 * 60 * 1000,
};

export default function PriceChart({
  data,
  height = 300,
  showAxis = true,
  color: _color = '#F7931A' // Prefixed - uses dynamic chartColor based on price change
}: PriceChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('7d');

  // Memoize filtered data to avoid Date.now() impurity during render
  const filteredData = useMemo(() => {
    const now = Date.now();
    const cutoff = now - TIME_RANGES[timeRange];
    return data.filter(d => d.timestamp >= cutoff);
  }, [data, timeRange]);
  
  // Calculate price change for the period
  const priceChange = filteredData.length > 1
    ? ((filteredData[filteredData.length - 1].price - filteredData[0].price) / filteredData[0].price) * 100
    : 0;
  
  const isPositive = priceChange >= 0;
  const chartColor = isPositive ? '#22C55E' : '#EF4444';

  // Format data for chart
  const chartData = filteredData.map(d => ({
    time: new Date(d.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      ...(timeRange === '24h' && { hour: '2-digit', minute: '2-digit' }),
    }),
    price: d.price,
    timestamp: d.timestamp,
  }));

  const timeRangeButtons: TimeRange[] = ['24h', '7d', '30d', '90d', '1y'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      {/* Time range selector */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          {timeRangeButtons.map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-3 py-1 text-sm font-medium rounded-lg transition-colors ${
                timeRange === range
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
        <div className={`text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
          {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
        </div>
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          {showAxis && (
            <>
              <XAxis 
                dataKey="time" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickMargin={10}
                interval="preserveStartEnd"
              />
              <YAxis 
                domain={['auto', 'auto']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#9CA3AF', fontSize: 12 }}
                tickFormatter={(value) => formatCurrency(value, { compact: true })}
                width={80}
              />
            </>
          )}
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-gray-900 text-white px-3 py-2 rounded-lg shadow-lg">
                    <p className="text-xs text-gray-400">{data.time}</p>
                    <p className="font-medium">{formatCurrency(data.price, { compact: false })}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="price"
            stroke={chartColor}
            strokeWidth={2}
            fill="url(#priceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Mini sparkline chart for table rows
export function SparklineChart({ 
  data, 
  width = 120, 
  height = 40,
  positive = true 
}: { 
  data: number[]; 
  width?: number; 
  height?: number;
  positive?: boolean;
}) {
  const chartData = data.map((price, i) => ({ price, index: i }));
  const color = positive ? '#22C55E' : '#EF4444';

  return (
    <ResponsiveContainer width={width} height={height}>
      <LineChart data={chartData}>
        <Line
          type="monotone"
          dataKey="price"
          stroke={color}
          strokeWidth={1.5}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
