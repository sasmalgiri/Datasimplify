'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import for ECharts to avoid SSR issues
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// Chart type definitions
type AdvancedChartType =
  | 'globe_3d'
  | 'sankey'
  | 'sunburst'
  | 'gauge'
  | 'treemap'
  | 'radar_advanced'
  | 'graph_network'
  | 'parallel'
  | 'funnel'
  | 'calendar';

interface ChartConfig {
  type: AdvancedChartType;
  title: string;
  description: string;
  icon: string;
  category: '3d' | 'flow' | 'hierarchy' | 'metrics' | 'special';
}

const CHART_CONFIGS: ChartConfig[] = [
  { type: 'globe_3d', title: '3D Globe', description: 'Global crypto adoption visualization', icon: '🌍', category: '3d' },
  { type: 'sankey', title: 'Sankey Flow', description: 'Money flow between exchanges and wallets', icon: '🌊', category: 'flow' },
  { type: 'sunburst', title: 'Sunburst', description: 'Hierarchical market structure', icon: '☀️', category: 'hierarchy' },
  { type: 'treemap', title: 'Treemap', description: 'Market cap weighted visualization', icon: '🗺️', category: 'hierarchy' },
  { type: 'gauge', title: 'Gauges', description: 'Key metrics dashboard', icon: '⏱️', category: 'metrics' },
  { type: 'radar_advanced', title: 'Radar Analysis', description: 'Multi-dimensional coin comparison', icon: '📡', category: 'metrics' },
  { type: 'graph_network', title: 'Network Graph', description: 'Token relationships and connections', icon: '🕸️', category: 'flow' },
  { type: 'parallel', title: 'Parallel Coords', description: 'Multi-factor analysis', icon: '📊', category: 'special' },
  { type: 'funnel', title: 'Funnel', description: 'Conversion and adoption rates', icon: '🔻', category: 'special' },
  { type: 'calendar', title: 'Calendar Heatmap', description: 'Daily activity patterns', icon: '📅', category: 'special' },
];

// Sample data for charts
const COINS_DATA = [
  { name: 'Bitcoin', symbol: 'BTC', marketCap: 900, price: 45000, volume: 25, change: 2.5, holders: 45, sentiment: 78 },
  { name: 'Ethereum', symbol: 'ETH', marketCap: 350, price: 2500, volume: 15, change: 3.2, holders: 35, sentiment: 72 },
  { name: 'BNB', symbol: 'BNB', marketCap: 80, price: 300, volume: 5, change: 1.1, holders: 20, sentiment: 65 },
  { name: 'Solana', symbol: 'SOL', marketCap: 60, price: 100, volume: 8, change: 5.5, holders: 15, sentiment: 80 },
  { name: 'XRP', symbol: 'XRP', marketCap: 40, price: 0.5, volume: 3, change: -1.2, holders: 25, sentiment: 55 },
  { name: 'Cardano', symbol: 'ADA', marketCap: 20, price: 0.4, volume: 2, change: 0.8, holders: 18, sentiment: 60 },
  { name: 'Dogecoin', symbol: 'DOGE', marketCap: 15, price: 0.08, volume: 4, change: 8.5, holders: 30, sentiment: 70 },
  { name: 'Polkadot', symbol: 'DOT', marketCap: 12, price: 7, volume: 1.5, change: 2.1, holders: 12, sentiment: 58 },
];

export default function AdvancedChartsPage() {
  const [selectedChart, setSelectedChart] = useState<AdvancedChartType>('treemap');

  // Chart options generators
  const getChartOption = useMemo(() => {
    switch (selectedChart) {
      case 'treemap':
        return {
          title: {
            text: 'Crypto Market Cap Treemap',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          tooltip: {
            trigger: 'item',
            formatter: (params: { name: string; value: number }) => `${params.name}: $${params.value}B`
          },
          series: [{
            type: 'treemap',
            roam: 'move',
            data: COINS_DATA.map(coin => ({
              name: `${coin.name} (${coin.symbol})`,
              value: coin.marketCap,
              itemStyle: {
                color: coin.change >= 0 ?
                  `rgba(16, 185, 129, ${0.4 + coin.change / 20})` :
                  `rgba(239, 68, 68, ${0.4 + Math.abs(coin.change) / 20})`
              }
            })),
            breadcrumb: { show: false },
            label: {
              show: true,
              formatter: '{b}\n${c}B',
              color: '#fff'
            },
            levels: [{
              itemStyle: {
                borderWidth: 2,
                borderColor: '#1f2937',
                gapWidth: 2
              }
            }]
          }]
        };

      case 'sunburst':
        return {
          title: {
            text: 'Crypto Ecosystem Structure',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          tooltip: { trigger: 'item' },
          series: [{
            type: 'sunburst',
            data: [
              {
                name: 'Layer 1',
                children: [
                  { name: 'Bitcoin', value: 900, itemStyle: { color: '#F7931A' } },
                  { name: 'Ethereum', value: 350, itemStyle: { color: '#627EEA' } },
                  { name: 'Solana', value: 60, itemStyle: { color: '#00D18C' } },
                  { name: 'Cardano', value: 20, itemStyle: { color: '#0033AD' } },
                ]
              },
              {
                name: 'DeFi',
                children: [
                  { name: 'Uniswap', value: 8, itemStyle: { color: '#FF007A' } },
                  { name: 'Aave', value: 5, itemStyle: { color: '#B6509E' } },
                  { name: 'Compound', value: 3, itemStyle: { color: '#00D395' } },
                ]
              },
              {
                name: 'Exchange',
                children: [
                  { name: 'BNB', value: 80, itemStyle: { color: '#F3BA2F' } },
                  { name: 'CRO', value: 10, itemStyle: { color: '#002D74' } },
                ]
              },
              {
                name: 'Meme',
                children: [
                  { name: 'DOGE', value: 15, itemStyle: { color: '#C3A634' } },
                  { name: 'SHIB', value: 8, itemStyle: { color: '#FFA409' } },
                ]
              }
            ],
            radius: ['15%', '90%'],
            label: {
              rotate: 'radial',
              color: '#fff'
            },
            emphasis: {
              focus: 'ancestor',
              itemStyle: {
                shadowBlur: 20,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        };

      case 'sankey':
        return {
          title: {
            text: 'Crypto Money Flow',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          tooltip: { trigger: 'item' },
          series: [{
            type: 'sankey',
            layout: 'none',
            emphasis: { focus: 'adjacency' },
            nodeAlign: 'left',
            data: [
              { name: 'Retail Investors' },
              { name: 'Institutions' },
              { name: 'Whales' },
              { name: 'Binance' },
              { name: 'Coinbase' },
              { name: 'Kraken' },
              { name: 'Bitcoin' },
              { name: 'Ethereum' },
              { name: 'Altcoins' },
              { name: 'DeFi Protocols' },
              { name: 'Cold Storage' },
            ],
            links: [
              { source: 'Retail Investors', target: 'Binance', value: 30 },
              { source: 'Retail Investors', target: 'Coinbase', value: 25 },
              { source: 'Institutions', target: 'Coinbase', value: 40 },
              { source: 'Institutions', target: 'Kraken', value: 20 },
              { source: 'Whales', target: 'Binance', value: 50 },
              { source: 'Binance', target: 'Bitcoin', value: 35 },
              { source: 'Binance', target: 'Ethereum', value: 25 },
              { source: 'Binance', target: 'Altcoins', value: 20 },
              { source: 'Coinbase', target: 'Bitcoin', value: 40 },
              { source: 'Coinbase', target: 'Ethereum', value: 20 },
              { source: 'Kraken', target: 'Bitcoin', value: 15 },
              { source: 'Bitcoin', target: 'Cold Storage', value: 50 },
              { source: 'Ethereum', target: 'DeFi Protocols', value: 30 },
              { source: 'Ethereum', target: 'Cold Storage', value: 15 },
            ],
            lineStyle: {
              color: 'gradient',
              curveness: 0.5
            },
            itemStyle: {
              borderWidth: 1,
              borderColor: '#aaa'
            },
            label: {
              color: '#fff'
            }
          }]
        };

      case 'gauge':
        return {
          title: {
            text: 'Market Metrics Dashboard',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          series: [
            {
              type: 'gauge',
              center: ['25%', '55%'],
              radius: '40%',
              startAngle: 200,
              endAngle: -20,
              min: 0,
              max: 100,
              splitNumber: 10,
              axisLine: {
                lineStyle: {
                  width: 6,
                  color: [
                    [0.25, '#EF4444'],
                    [0.5, '#F59E0B'],
                    [0.75, '#10B981'],
                    [1, '#3B82F6']
                  ]
                }
              },
              pointer: { show: true, length: '60%', width: 6 },
              axisTick: { distance: -30, splitNumber: 5, lineStyle: { width: 2, color: '#999' } },
              splitLine: { distance: -32, length: 14, lineStyle: { width: 3, color: '#999' } },
              axisLabel: { distance: -20, color: '#999', fontSize: 10 },
              anchor: { show: true, size: 20, itemStyle: { borderWidth: 2 } },
              title: { show: true, offsetCenter: [0, '70%'], color: '#fff' },
              detail: { valueAnimation: true, fontSize: 20, offsetCenter: [0, '90%'], color: '#fff', formatter: '{value}' },
              data: [{ value: 72, name: 'Fear & Greed' }]
            },
            {
              type: 'gauge',
              center: ['75%', '55%'],
              radius: '40%',
              startAngle: 200,
              endAngle: -20,
              min: 0,
              max: 100,
              axisLine: {
                lineStyle: {
                  width: 6,
                  color: [
                    [0.3, '#EF4444'],
                    [0.7, '#F59E0B'],
                    [1, '#10B981']
                  ]
                }
              },
              pointer: { show: true, length: '60%', width: 6 },
              axisTick: { distance: -30, splitNumber: 5, lineStyle: { width: 2, color: '#999' } },
              splitLine: { distance: -32, length: 14, lineStyle: { width: 3, color: '#999' } },
              axisLabel: { distance: -20, color: '#999', fontSize: 10 },
              anchor: { show: true, size: 20, itemStyle: { borderWidth: 2 } },
              title: { show: true, offsetCenter: [0, '70%'], color: '#fff' },
              detail: { valueAnimation: true, fontSize: 20, offsetCenter: [0, '90%'], color: '#fff', formatter: '{value}%' },
              data: [{ value: 68, name: 'AI Confidence' }]
            }
          ]
        };

      case 'radar_advanced':
        return {
          title: {
            text: 'Multi-Coin Comparison',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          legend: {
            data: ['Bitcoin', 'Ethereum', 'Solana'],
            bottom: 0,
            textStyle: { color: '#9CA3AF' }
          },
          radar: {
            indicator: [
              { name: 'Market Cap', max: 100 },
              { name: 'Volume', max: 100 },
              { name: 'Holders', max: 100 },
              { name: 'Sentiment', max: 100 },
              { name: 'Dev Activity', max: 100 },
              { name: 'Adoption', max: 100 }
            ],
            axisName: { color: '#9CA3AF' },
            splitArea: { areaStyle: { color: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)'] } },
            axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.2)' } },
            splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } }
          },
          series: [{
            type: 'radar',
            data: [
              {
                value: [95, 85, 90, 78, 70, 95],
                name: 'Bitcoin',
                areaStyle: { opacity: 0.3 },
                lineStyle: { color: '#F7931A' },
                itemStyle: { color: '#F7931A' }
              },
              {
                value: [70, 75, 80, 72, 95, 85],
                name: 'Ethereum',
                areaStyle: { opacity: 0.3 },
                lineStyle: { color: '#627EEA' },
                itemStyle: { color: '#627EEA' }
              },
              {
                value: [40, 60, 45, 80, 85, 60],
                name: 'Solana',
                areaStyle: { opacity: 0.3 },
                lineStyle: { color: '#00D18C' },
                itemStyle: { color: '#00D18C' }
              }
            ]
          }]
        };

      case 'graph_network':
        const categories = [
          { name: 'Layer 1' },
          { name: 'DeFi' },
          { name: 'Exchange' },
          { name: 'Infrastructure' }
        ];
        return {
          title: {
            text: 'Crypto Ecosystem Network',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          legend: {
            data: categories.map(c => c.name),
            bottom: 0,
            textStyle: { color: '#9CA3AF' }
          },
          tooltip: {},
          series: [{
            type: 'graph',
            layout: 'force',
            roam: true,
            label: { show: true, position: 'right', color: '#fff' },
            force: { repulsion: 200, edgeLength: 100 },
            categories,
            data: [
              { name: 'Bitcoin', symbolSize: 60, category: 0 },
              { name: 'Ethereum', symbolSize: 50, category: 0 },
              { name: 'Solana', symbolSize: 30, category: 0 },
              { name: 'Uniswap', symbolSize: 25, category: 1 },
              { name: 'Aave', symbolSize: 20, category: 1 },
              { name: 'Curve', symbolSize: 18, category: 1 },
              { name: 'Binance', symbolSize: 40, category: 2 },
              { name: 'Coinbase', symbolSize: 35, category: 2 },
              { name: 'Chainlink', symbolSize: 25, category: 3 },
              { name: 'The Graph', symbolSize: 15, category: 3 },
            ],
            links: [
              { source: 'Ethereum', target: 'Uniswap' },
              { source: 'Ethereum', target: 'Aave' },
              { source: 'Ethereum', target: 'Curve' },
              { source: 'Bitcoin', target: 'Binance' },
              { source: 'Bitcoin', target: 'Coinbase' },
              { source: 'Ethereum', target: 'Binance' },
              { source: 'Ethereum', target: 'Coinbase' },
              { source: 'Solana', target: 'Binance' },
              { source: 'Chainlink', target: 'Aave' },
              { source: 'Chainlink', target: 'Uniswap' },
              { source: 'The Graph', target: 'Uniswap' },
            ],
            lineStyle: { color: 'source', curveness: 0.3 }
          }]
        };

      case 'parallel':
        return {
          title: {
            text: 'Multi-Factor Coin Analysis',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          parallelAxis: [
            { dim: 0, name: 'Coin', type: 'category', data: COINS_DATA.map(c => c.symbol) },
            { dim: 1, name: 'Market Cap ($B)', min: 0, max: 1000 },
            { dim: 2, name: 'Volume ($B)', min: 0, max: 30 },
            { dim: 3, name: 'Change %', min: -10, max: 10 },
            { dim: 4, name: 'Holders (M)', min: 0, max: 50 },
            { dim: 5, name: 'Sentiment', min: 0, max: 100 }
          ],
          parallel: {
            left: '5%',
            right: '15%',
            parallelAxisDefault: {
              type: 'value',
              nameLocation: 'end',
              nameGap: 20,
              nameTextStyle: { color: '#9CA3AF' },
              axisLine: { lineStyle: { color: '#374151' } },
              axisTick: { lineStyle: { color: '#374151' } },
              axisLabel: { color: '#9CA3AF' }
            }
          },
          series: [{
            type: 'parallel',
            lineStyle: { width: 2 },
            data: COINS_DATA.map((coin, i) => ({
              value: [i, coin.marketCap, coin.volume, coin.change, coin.holders, coin.sentiment],
              lineStyle: { color: coin.change >= 0 ? '#10B981' : '#EF4444' }
            }))
          }]
        };

      case 'funnel':
        return {
          title: {
            text: 'Crypto User Journey',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
          series: [{
            type: 'funnel',
            left: '10%',
            width: '80%',
            label: { position: 'inside', color: '#fff' },
            labelLine: { show: false },
            itemStyle: { borderWidth: 0 },
            emphasis: { label: { fontSize: 16 } },
            data: [
              { value: 100, name: 'Awareness', itemStyle: { color: '#3B82F6' } },
              { value: 80, name: 'Interest', itemStyle: { color: '#8B5CF6' } },
              { value: 60, name: 'Research', itemStyle: { color: '#EC4899' } },
              { value: 40, name: 'First Purchase', itemStyle: { color: '#F59E0B' } },
              { value: 25, name: 'Regular Trading', itemStyle: { color: '#10B981' } },
              { value: 10, name: 'HODLer', itemStyle: { color: '#06B6D4' } }
            ]
          }]
        };

      case 'calendar':
        // Generate calendar data for the past 6 months
        // Use deterministic values based on date to avoid Math.random() impurity
        const calendarData: [string, number][] = [];
        const today = new Date();
        for (let i = 180; i >= 0; i--) {
          const date = new Date(today);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          // Deterministic pseudo-random based on date components
          const dateParts = dateStr.split('-');
          const seed = parseInt(dateParts[0]) + parseInt(dateParts[1]) * 31 + parseInt(dateParts[2]) * 12;
          const value = Math.floor(Math.abs(Math.sin(seed) * 10000));
          calendarData.push([dateStr, value]);
        }

        const startMonth = new Date(today);
        startMonth.setMonth(startMonth.getMonth() - 6);

        return {
          title: {
            text: 'Daily Trading Activity',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          tooltip: {
            formatter: (params: { value: [string, number] }) =>
              `${params.value[0]}: ${params.value[1].toLocaleString()} trades`
          },
          visualMap: {
            min: 0,
            max: 10000,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            top: 'bottom',
            textStyle: { color: '#9CA3AF' },
            inRange: {
              color: ['#1e3a5f', '#3B82F6', '#60A5FA', '#93C5FD']
            }
          },
          calendar: {
            top: 80,
            left: 30,
            right: 30,
            cellSize: ['auto', 15],
            range: [startMonth.toISOString().split('T')[0], today.toISOString().split('T')[0]],
            itemStyle: { borderWidth: 0.5, borderColor: '#1f2937' },
            yearLabel: { show: false },
            monthLabel: { color: '#9CA3AF' },
            dayLabel: { color: '#9CA3AF' }
          },
          series: [{
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: calendarData
          }]
        };

      case 'globe_3d':
        // For 3D globe, we'll show a message since echarts-gl needs special setup
        return {
          title: {
            text: '3D Globe - Global Crypto Adoption',
            left: 'center',
            top: 'center',
            textStyle: { color: '#fff', fontSize: 24 }
          },
          graphic: [{
            type: 'text',
            left: 'center',
            top: '60%',
            style: {
              text: '🌍 3D Globe visualization\nShowing global crypto adoption rates\n\n(WebGL rendering)',
              fill: '#9CA3AF',
              fontSize: 16,
              textAlign: 'center'
            }
          }]
        };

      default:
        return {};
    }
  }, [selectedChart]);

  const selectedConfig = CHART_CONFIGS.find(c => c.type === selectedChart);

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold text-blue-400">
              DataSimplify
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/charts" className="text-blue-400 hover:text-blue-300">
                ← Basic Charts
              </Link>
              <Link href="/download" className="text-gray-400 hover:text-white">Downloads</Link>
              <Link href="/dashboard" className="text-gray-400 hover:text-white">Dashboard</Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Advanced Charts</h1>
          <p className="text-gray-400 mt-1">Powered by Apache ECharts - Advanced visualizations for deeper insights</p>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Chart Selection */}
          <div className="col-span-12 lg:col-span-3">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 sticky top-4">
              <h3 className="font-medium mb-4">Advanced Chart Types</h3>

              {['3d', 'hierarchy', 'flow', 'metrics', 'special'].map(category => (
                <div key={category} className="mb-4">
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                    {category === '3d' ? '3D Visualization' :
                     category === 'hierarchy' ? 'Hierarchical' :
                     category === 'flow' ? 'Flow & Network' :
                     category === 'metrics' ? 'Metrics' : 'Special'}
                  </div>
                  {CHART_CONFIGS.filter(c => c.category === category).map(config => (
                    <button
                      key={config.type}
                      onClick={() => setSelectedChart(config.type)}
                      className={`w-full text-left p-3 rounded-lg mb-1 transition ${
                        selectedChart === config.type
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700/50 hover:bg-gray-700 text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span>{config.icon}</span>
                        <span className="text-sm font-medium">{config.title}</span>
                      </div>
                    </button>
                  ))}
                </div>
              ))}

              <div className="mt-6 pt-4 border-t border-gray-700">
                <Link
                  href="/charts"
                  className="w-full block text-center py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm"
                >
                  View Basic Charts →
                </Link>
              </div>
            </div>
          </div>

          {/* Main Chart Area */}
          <div className="col-span-12 lg:col-span-9">
            {/* Chart Container */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span>{selectedConfig?.icon}</span>
                    {selectedConfig?.title}
                  </h2>
                  <p className="text-gray-400 text-sm">{selectedConfig?.description}</p>
                </div>
                <span className="px-3 py-1 bg-purple-600/30 text-purple-400 rounded-full text-xs font-medium">
                  ECharts
                </span>
              </div>

              <div className="h-[500px]">
                <ReactECharts
                  option={getChartOption}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'canvas' }}
                  theme="dark"
                />
              </div>
            </div>

            {/* Chart Info */}
            <div className="mt-4 bg-gray-800/50 rounded-xl border border-gray-700 p-4">
              <h3 className="font-medium mb-2">About This Chart</h3>
              <p className="text-gray-400 text-sm">
                {selectedChart === 'treemap' && 'Treemap visualization shows market cap distribution with color indicating price change. Green indicates positive movement, red indicates negative.'}
                {selectedChart === 'sunburst' && 'Sunburst chart shows the hierarchical structure of the crypto ecosystem, with categories expanding outward from the center.'}
                {selectedChart === 'sankey' && 'Sankey diagram visualizes the flow of money between different entities in the crypto ecosystem - from investors through exchanges to final destinations.'}
                {selectedChart === 'gauge' && 'Gauge charts display key market metrics at a glance. The Fear & Greed index and AI Confidence scores are shown as intuitive dial indicators.'}
                {selectedChart === 'radar_advanced' && 'Radar chart enables multi-dimensional comparison of different cryptocurrencies across various metrics like market cap, volume, sentiment, and more.'}
                {selectedChart === 'graph_network' && 'Network graph shows relationships and connections between different entities in the crypto ecosystem. Drag nodes to explore connections.'}
                {selectedChart === 'parallel' && 'Parallel coordinates chart allows you to see multiple metrics for each coin simultaneously. Each line represents a coin flowing through different metric axes.'}
                {selectedChart === 'funnel' && 'Funnel chart shows the typical user journey in crypto - from initial awareness to becoming a long-term holder (HODLer).'}
                {selectedChart === 'calendar' && 'Calendar heatmap shows daily trading activity over the past 6 months. Darker colors indicate higher trading volume.'}
                {selectedChart === 'globe_3d' && '3D Globe visualization would show global crypto adoption rates by country. This requires WebGL and echarts-gl for full 3D rendering.'}
              </p>
            </div>

            {/* Features Grid */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl mb-2">🖱️</div>
                <div className="text-sm font-medium">Interactive</div>
                <div className="text-xs text-gray-400">Click, drag, zoom</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl mb-2">🎨</div>
                <div className="text-sm font-medium">Rich Styling</div>
                <div className="text-xs text-gray-400">Professional look</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl mb-2">📊</div>
                <div className="text-sm font-medium">Data-Driven</div>
                <div className="text-xs text-gray-400">Real-time updates</div>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
                <div className="text-2xl mb-2">💾</div>
                <div className="text-sm font-medium">Exportable</div>
                <div className="text-xs text-gray-400">Save as image</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
