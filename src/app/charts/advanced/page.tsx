'use client';

import { useState, useMemo, useRef, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { ECharts } from 'echarts';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { SUPPORTED_COINS } from '@/lib/dataTypes';

// Dynamic import for ECharts to avoid SSR issues
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// Loading fallback for Suspense
function ChartLoading() {
  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading charts...</p>
      </div>
    </div>
  );
}

// Download helper functions
function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadDataURL(dataURL: string, filename: string) {
  const a = document.createElement('a');
  a.href = dataURL;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

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
  | 'calendar'
  | 'whale_tracker';

interface ChartConfig {
  type: AdvancedChartType;
  title: string;
  description: string;
  icon: string;
  category: '3d' | 'flow' | 'hierarchy' | 'metrics' | 'special';
}

const CHART_CONFIGS: ChartConfig[] = [
  { type: 'globe_3d', title: '3D Globe', description: 'Global crypto adoption visualization', icon: '🌍', category: '3d' },
  { type: 'whale_tracker', title: 'Whale Tracker', description: 'Large transaction monitoring', icon: '🐋', category: 'flow' },
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

// Chart color palette for all 67 coins
const CHART_COLORS = [
  '#F7931A', '#627EEA', '#F3BA2F', '#00D18C', '#23292F', '#0033AD', '#C3A634', '#E6007A',
  '#E84142', '#2A5ADA', '#8247E5', '#FF007A', '#00CED1', '#FF6B6B', '#4ECDC4', '#45B7D1',
  '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F8B500',
  '#7FDBFF', '#39CCCC', '#3D9970', '#2ECC40', '#01FF70', '#FFDC00', '#FF851B', '#FF4136',
];

// Generate chart data from all 67 SUPPORTED_COINS with mock visualization data
const ALL_COINS = SUPPORTED_COINS.map((coin, index) => ({
  id: coin.symbol,
  name: coin.name,
  symbol: coin.symbol,
  marketCap: Math.max(5, 900 - index * 12),
  price: coin.symbol === 'BTC' ? 97000 : coin.symbol === 'ETH' ? 3400 : Math.max(0.01, 100 - index * 1.5),
  volume: Math.max(0.5, 25 - index * 0.3),
  change: Number((Math.sin(index) * 10 - 2).toFixed(1)),
  holders: Math.max(5, 45 - Math.floor(index * 0.5)),
  sentiment: Math.min(95, Math.max(40, Math.floor(78 - index * 0.5 + Math.cos(index) * 10))),
  color: CHART_COLORS[index % CHART_COLORS.length],
}));

// Sample data for charts (first 8 coins)
const COINS_DATA = ALL_COINS.slice(0, 8).map(coin => ({
  name: coin.name,
  symbol: coin.symbol,
  marketCap: coin.marketCap,
  price: coin.price,
  volume: coin.volume,
  change: coin.change,
  holders: coin.holders,
  sentiment: coin.sentiment,
}));

// Valid chart types for URL validation
const VALID_ADVANCED_CHART_TYPES: AdvancedChartType[] = ['globe_3d', 'sankey', 'sunburst', 'gauge', 'treemap', 'radar_advanced', 'graph_network', 'parallel', 'funnel', 'calendar', 'whale_tracker'];

function AdvancedChartsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialized = useRef(false);

  // Initialize state with defaults - URL params loaded in useEffect
  const [selectedChart, setSelectedChart] = useState<AdvancedChartType>('treemap');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Chart parameter states - defaults
  const [selectedCoins, setSelectedCoins] = useState<string[]>(['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT']);
  const [maxItems, setMaxItems] = useState(8);
  const [sortBy, setSortBy] = useState<'marketCap' | 'change' | 'volume'>('marketCap');
  const [colorMode, setColorMode] = useState<'change' | 'category'>('change');

  // Initialize state from URL params on mount (client-side only)
  useEffect(() => {
    if (isInitialized.current) return;
    isInitialized.current = true;

    const chart = searchParams.get('chart');
    if (chart && VALID_ADVANCED_CHART_TYPES.includes(chart as AdvancedChartType)) {
      setSelectedChart(chart as AdvancedChartType);
    }

    const coins = searchParams.get('coins');
    if (coins) {
      const validCoins = coins.split(',').filter(c => ALL_COINS.some(ac => ac.id === c));
      if (validCoins.length > 0) {
        setSelectedCoins(validCoins);
      }
    }

    const max = searchParams.get('max');
    if (max) {
      const parsed = parseInt(max);
      if (parsed >= 2 && parsed <= 12) {
        setMaxItems(parsed);
      }
    }

    const sort = searchParams.get('sort');
    if (sort === 'marketCap' || sort === 'change' || sort === 'volume') {
      setSortBy(sort);
    }

    const color = searchParams.get('color');
    if (color === 'change' || color === 'category') {
      setColorMode(color);
    }
  }, [searchParams]);

  // Sync state to URL (only after initialization)
  useEffect(() => {
    if (!isInitialized.current) return;

    const params = new URLSearchParams();
    params.set('chart', selectedChart);
    params.set('coins', selectedCoins.join(','));
    params.set('max', maxItems.toString());
    params.set('sort', sortBy);
    params.set('color', colorMode);

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    router.replace(newUrl, { scroll: false });
  }, [selectedChart, selectedCoins, maxItems, sortBy, colorMode, router]);

  // Get filtered and sorted coins based on parameters
  const filteredCoins = useMemo(() => {
    let coins = ALL_COINS.filter(c => selectedCoins.includes(c.id));

    // Sort coins
    coins = [...coins].sort((a, b) => {
      if (sortBy === 'marketCap') return b.marketCap - a.marketCap;
      if (sortBy === 'change') return b.change - a.change;
      return b.volume - a.volume;
    });

    // Limit to max items
    return coins.slice(0, maxItems);
  }, [selectedCoins, maxItems, sortBy]);

  // Ref to store ECharts instance (set via onChartReady callback)
  const chartInstanceRef = useRef<ECharts | null>(null);

  // Toggle coin selection
  const toggleCoin = (coinId: string) => {
    setSelectedCoins(prev =>
      prev.includes(coinId)
        ? prev.filter(id => id !== coinId)
        : [...prev, coinId]
    );
  };

  // Select all / deselect all
  const selectAllCoins = () => setSelectedCoins(ALL_COINS.map(c => c.id));
  const deselectAllCoins = () => setSelectedCoins(['BTC', 'ETH']); // Keep at least 2

  // Callback when chart is ready
  const onChartReady = useCallback((instance: ECharts) => {
    chartInstanceRef.current = instance;
  }, []);

  // Download chart function
  const downloadChart = useCallback(async (format: 'png' | 'svg' | 'json' | 'xlsx') => {
    setIsDownloading(true);
    try {
      if (format === 'json') {
        // Export chart data as JSON
        const blob = new Blob([JSON.stringify(filteredCoins, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${selectedChart}_data.json`);
        setIsDownloading(false);
        return;
      }

      if (format === 'xlsx') {
        // Export chart data as Excel with live data instructions
        const wb = XLSX.utils.book_new();

        // Sheet 1: Current chart data
        const chartDataForExcel = filteredCoins.map(coin => ({
          'Symbol': coin.symbol,
          'Name': coin.name,
          'Price (USD)': `$${coin.price.toLocaleString()}`,
          'Market Cap ($B)': coin.marketCap,
          'Volume ($B)': coin.volume,
          '24h Change (%)': coin.change,
          'Holders (M)': coin.holders,
          'Sentiment Score': coin.sentiment,
        }));
        const wsData = XLSX.utils.json_to_sheet(chartDataForExcel);
        wsData['!cols'] = [{ wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 12 }, { wch: 15 }, { wch: 12 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsData, 'Chart Data');

        // Sheet 2: Live Data Instructions
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://datasimplify.com';
        const liveDataInstructions = [
          ['DataSimplify - Live Data Connection'],
          [''],
          ['Chart Type:', selectedChart],
          ['Generated:', new Date().toISOString()],
          ['Coins:', selectedCoins.join(', ')],
          [''],
          ['GET LIVE DATA IN EXCEL (Power Query):'],
          ['1. Go to Data tab → Get Data → From Web'],
          ['2. Paste this URL:', `${baseUrl}/api/download?category=market_overview&format=json`],
          ['3. Click OK and transform JSON to table'],
          ['4. Right-click query → Properties → Enable auto-refresh'],
          [''],
          ['GET LIVE DATA IN GOOGLE SHEETS:'],
          ['Paste this formula in any cell:'],
          [`=IMPORTDATA("${baseUrl}/api/download?category=market_overview&format=csv")`],
          [''],
          ['More data available at:', `${baseUrl}/download`],
        ];
        const wsInstructions = XLSX.utils.aoa_to_sheet(liveDataInstructions);
        wsInstructions['!cols'] = [{ wch: 35 }, { wch: 70 }];
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Live Data Guide');

        // Generate and download Excel
        const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        const excelBlob = new Blob([new Uint8Array(excelBuffer)], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        downloadBlob(excelBlob, `${selectedChart}_data_${new Date().toISOString().split('T')[0]}.xlsx`);

        // Also download chart image automatically
        const echartsInstance = chartInstanceRef.current;
        if (echartsInstance) {
          const dataURL = echartsInstance.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#1f2937'
          });
          // Small delay to avoid browser blocking multiple downloads
          setTimeout(() => {
            downloadDataURL(dataURL, `${selectedChart}_chart_${new Date().toISOString().split('T')[0]}.png`);
          }, 500);
        } else {
          // Fallback to html2canvas
          const chartContainer = document.querySelector('.echarts-for-react');
          if (chartContainer) {
            const canvas = await html2canvas(chartContainer as HTMLElement, {
              backgroundColor: '#1f2937',
              scale: 2,
              logging: false,
              useCORS: true,
            });
            setTimeout(() => {
              canvas.toBlob((blob) => {
                if (blob) downloadBlob(blob, `${selectedChart}_chart_${new Date().toISOString().split('T')[0]}.png`);
              }, 'image/png', 0.95);
            }, 500);
          }
        }
        setIsDownloading(false);
        return;
      }

      // For PNG/SVG only - Generate and download
      const echartsInstance = chartInstanceRef.current;

      if (format === 'png') {
        if (echartsInstance) {
          // ECharts built-in PNG export with high resolution
          const dataURL = echartsInstance.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#1f2937'
          });
          downloadDataURL(dataURL, `${selectedChart}_chart.png`);
        } else {
          // Fallback to html2canvas if ECharts not available
          const chartContainer = document.querySelector('.echarts-for-react');
          if (chartContainer) {
            const canvas = await html2canvas(chartContainer as HTMLElement, {
              backgroundColor: '#1f2937',
              scale: 2,
              logging: false,
              useCORS: true,
            });
            canvas.toBlob((blob) => {
              if (blob) downloadBlob(blob, `${selectedChart}_chart.png`);
            }, 'image/png', 0.95);
          } else {
            console.error('Chart container not found');
          }
        }
      } else if (format === 'svg') {
        if (echartsInstance) {
          // For SVG export - ECharts can export SVG when using canvas renderer
          const dataURL = echartsInstance.getDataURL({
            type: 'png',
            pixelRatio: 3,
            backgroundColor: '#1f2937'
          });
          const img = new Image();
          img.onload = () => {
            const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${img.width}" height="${img.height}" viewBox="0 0 ${img.width} ${img.height}">
  <rect width="100%" height="100%" fill="#1f2937"/>
  <image xlink:href="${dataURL}" width="${img.width}" height="${img.height}"/>
</svg>`;
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            downloadBlob(blob, `${selectedChart}_chart.svg`);
          };
          img.src = dataURL;
        } else {
          console.error('ECharts instance not available for SVG export');
        }
      }
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setIsDownloading(false);
    }
  }, [selectedChart, filteredCoins, selectedCoins]);

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
            data: filteredCoins.map(coin => ({
              name: `${coin.name} (${coin.symbol})`,
              value: coin.marketCap,
              itemStyle: {
                color: colorMode === 'change'
                  ? (coin.change >= 0 ?
                      `rgba(16, 185, 129, ${0.4 + coin.change / 20})` :
                      `rgba(239, 68, 68, ${0.4 + Math.abs(coin.change) / 20})`)
                  : coin.color
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
          tooltip: {
            trigger: 'item',
            formatter: (params: { dataType: string; data: { name?: string; source?: string; target?: string }; name?: string }) => {
              if (params.dataType === 'node') {
                return `<strong>${params.data.name || params.name}</strong>`;
              } else if (params.dataType === 'edge') {
                return `${params.data.source} → ${params.data.target}`;
              }
              return params.name || '';
            }
          },
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
            { dim: 0, name: 'Coin', type: 'category', data: filteredCoins.map(c => c.symbol) },
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
            data: filteredCoins.map((coin, i) => ({
              value: [i, coin.marketCap, coin.volume, coin.change, coin.holders, coin.sentiment],
              lineStyle: { color: colorMode === 'change' ? (coin.change >= 0 ? '#10B981' : '#EF4444') : coin.color }
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

      case 'whale_tracker':
        // Whale transactions visualization - scatter plot with bubbles
        const whaleTransactions = [
          { time: '00:15', coin: 'BTC', amount: 500, type: 'buy', from: 'Exchange', to: 'Wallet' },
          { time: '01:30', coin: 'ETH', amount: 2500, type: 'sell', from: 'Wallet', to: 'Exchange' },
          { time: '02:45', coin: 'BTC', amount: 1200, type: 'transfer', from: 'Wallet', to: 'Cold Storage' },
          { time: '04:00', coin: 'SOL', amount: 150000, type: 'buy', from: 'Exchange', to: 'Wallet' },
          { time: '05:20', coin: 'BTC', amount: 800, type: 'sell', from: 'Wallet', to: 'Exchange' },
          { time: '06:45', coin: 'ETH', amount: 5000, type: 'buy', from: 'Exchange', to: 'DeFi' },
          { time: '08:00', coin: 'BTC', amount: 2000, type: 'transfer', from: 'Exchange', to: 'Cold Storage' },
          { time: '09:30', coin: 'DOGE', amount: 50000000, type: 'buy', from: 'Exchange', to: 'Wallet' },
          { time: '10:15', coin: 'BTC', amount: 350, type: 'sell', from: 'Wallet', to: 'Exchange' },
          { time: '11:45', coin: 'ETH', amount: 8000, type: 'transfer', from: 'DeFi', to: 'Wallet' },
          { time: '13:00', coin: 'BTC', amount: 1500, type: 'buy', from: 'OTC', to: 'Cold Storage' },
          { time: '14:30', coin: 'SOL', amount: 200000, type: 'sell', from: 'Wallet', to: 'Exchange' },
          { time: '16:00', coin: 'BTC', amount: 600, type: 'transfer', from: 'Exchange', to: 'Wallet' },
          { time: '17:20', coin: 'ETH', amount: 3500, type: 'buy', from: 'Exchange', to: 'DeFi' },
          { time: '19:00', coin: 'BTC', amount: 950, type: 'sell', from: 'Cold Storage', to: 'Exchange' },
        ];

        const coinColors: Record<string, string> = {
          'BTC': '#F7931A',
          'ETH': '#627EEA',
          'SOL': '#00D18C',
          'DOGE': '#C3A634'
        };

        const typeSymbols: Record<string, string> = {
          'buy': 'circle',
          'sell': 'triangle',
          'transfer': 'diamond'
        };

        return {
          title: {
            text: 'Whale Transaction Tracker (24h)',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          tooltip: {
            trigger: 'item',
            formatter: (params: { data: { value: number[]; coin: string; type: string; amount: number; from: string; to: string } }) => {
              const d = params.data;
              const usdValue = d.coin === 'BTC' ? d.amount * 45000 :
                              d.coin === 'ETH' ? d.amount * 2500 :
                              d.coin === 'SOL' ? d.amount * 100 : d.amount * 0.08;
              return `<strong>${d.coin}</strong><br/>
                      Type: ${d.type.toUpperCase()}<br/>
                      Amount: ${d.amount.toLocaleString()} ${d.coin}<br/>
                      Value: $${(usdValue / 1000000).toFixed(2)}M<br/>
                      ${d.from} → ${d.to}`;
            }
          },
          legend: {
            data: ['BTC', 'ETH', 'SOL', 'DOGE'],
            bottom: 10,
            textStyle: { color: '#9CA3AF' }
          },
          grid: {
            left: '8%',
            right: '8%',
            top: '15%',
            bottom: '18%'
          },
          xAxis: {
            type: 'category',
            data: whaleTransactions.map(t => t.time),
            axisLabel: { color: '#9CA3AF' },
            axisLine: { lineStyle: { color: '#374151' } },
            name: 'Time (UTC)',
            nameTextStyle: { color: '#9CA3AF' }
          },
          yAxis: {
            type: 'value',
            name: 'USD Value (Millions)',
            nameTextStyle: { color: '#9CA3AF' },
            axisLabel: {
              color: '#9CA3AF',
              formatter: (val: number) => `$${(val / 1000000).toFixed(0)}M`
            },
            axisLine: { lineStyle: { color: '#374151' } },
            splitLine: { lineStyle: { color: '#374151', type: 'dashed' } }
          },
          series: ['BTC', 'ETH', 'SOL', 'DOGE'].map(coin => ({
            name: coin,
            type: 'scatter',
            data: whaleTransactions
              .filter(t => t.coin === coin)
              .map(t => {
                const usdValue = coin === 'BTC' ? t.amount * 45000 :
                                coin === 'ETH' ? t.amount * 2500 :
                                coin === 'SOL' ? t.amount * 100 : t.amount * 0.08;
                return {
                  value: [t.time, usdValue],
                  coin: t.coin,
                  type: t.type,
                  amount: t.amount,
                  from: t.from,
                  to: t.to,
                  symbolSize: Math.min(Math.max(usdValue / 500000, 15), 60),
                  itemStyle: {
                    color: coinColors[coin],
                    opacity: t.type === 'buy' ? 0.9 : t.type === 'sell' ? 0.7 : 0.5,
                    borderColor: t.type === 'sell' ? '#EF4444' : t.type === 'buy' ? '#10B981' : '#9CA3AF',
                    borderWidth: 2
                  }
                };
              }),
            symbol: (_value: unknown, params: { data?: { type?: string } }) => typeSymbols[params.data?.type || 'buy'] || 'circle',
            emphasis: {
              scale: 1.5
            }
          }))
        };

      case 'globe_3d':
        // For 3D globe, we'll show a message since echarts-gl needs special setup
        return {
          title: {
            text: '3D Globe - Global Crypto Adoption',
            left: 'center',
            top: 20,
            textStyle: { color: '#fff', fontSize: 24 }
          },
          graphic: [{
            type: 'text',
            left: 'center',
            bottom: 30,
            style: {
              text: '🌍 3D Globe visualization - Showing global crypto adoption rates (Requires WebGL/echarts-gl)',
              fill: '#9CA3AF',
              fontSize: 14,
              textAlign: 'center'
            }
          }]
        };

      default:
        return {};
    }
  }, [selectedChart, filteredCoins, colorMode]);

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

            {/* Chart Controls Panel */}
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4 mt-4">
              <button
                type="button"
                onClick={() => setShowControls(!showControls)}
                className="w-full flex items-center justify-between text-left"
              >
                <h3 className="font-medium">Chart Controls</h3>
                <span className="text-gray-400">{showControls ? '▼' : '▶'}</span>
              </button>

              {showControls && (
                <div className="mt-4 space-y-4">
                  {/* Coin Selection */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Select Coins</label>
                    <div className="flex flex-wrap gap-1">
                      {ALL_COINS.map(coin => (
                        <button
                          type="button"
                          key={coin.id}
                          onClick={() => toggleCoin(coin.id)}
                          className={`px-2 py-1 rounded text-xs transition ${
                            selectedCoins.includes(coin.id)
                              ? 'bg-emerald-600 text-white'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                          }`}
                        >
                          {coin.symbol}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        onClick={selectAllCoins}
                        className="text-xs text-emerald-400 hover:text-emerald-300"
                      >
                        Select All
                      </button>
                      <button
                        type="button"
                        onClick={deselectAllCoins}
                        className="text-xs text-gray-400 hover:text-gray-300"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Max Items */}
                  <div>
                    <label htmlFor="max-items-slider" className="block text-xs text-gray-400 mb-2">
                      Max Items: {maxItems}
                    </label>
                    <input
                      id="max-items-slider"
                      type="range"
                      min="2"
                      max="12"
                      value={maxItems}
                      onChange={(e) => setMaxItems(Number(e.target.value))}
                      title={`Maximum items to display: ${maxItems}`}
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                    />
                  </div>

                  {/* Sort By */}
                  <div>
                    <label htmlFor="sort-by-select" className="block text-xs text-gray-400 mb-2">Sort By</label>
                    <select
                      id="sort-by-select"
                      title="Sort coins by"
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'marketCap' | 'change' | 'volume')}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-sm text-white focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="marketCap">Market Cap</option>
                      <option value="change">Price Change</option>
                      <option value="volume">Volume</option>
                    </select>
                  </div>

                  {/* Color Mode */}
                  <div>
                    <label className="block text-xs text-gray-400 mb-2">Color Mode</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setColorMode('change')}
                        className={`flex-1 px-3 py-1.5 rounded text-xs transition ${
                          colorMode === 'change'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        By Change
                      </button>
                      <button
                        type="button"
                        onClick={() => setColorMode('category')}
                        className={`flex-1 px-3 py-1.5 rounded text-xs transition ${
                          colorMode === 'category'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                        }`}
                      >
                        By Coin
                      </button>
                    </div>
                  </div>

                  {/* Active Coins Count */}
                  <div className="pt-2 border-t border-gray-700">
                    <p className="text-xs text-gray-500">
                      Showing {filteredCoins.length} of {selectedCoins.length} selected coins
                    </p>
                  </div>
                </div>
              )}
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
                <div className="flex items-center gap-2">
                  {/* Download Buttons */}
                  <div className="flex items-center gap-1 mr-2">
                    <button
                      type="button"
                      onClick={() => downloadChart('png')}
                      disabled={isDownloading}
                      className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 text-white text-xs rounded transition flex items-center gap-1"
                      title="Download as PNG image"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      PNG
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadChart('svg')}
                      disabled={isDownloading}
                      className="px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white text-xs rounded transition flex items-center gap-1"
                      title="Download as SVG vector"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      SVG
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadChart('json')}
                      disabled={isDownloading}
                      className="px-2 py-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white text-xs rounded transition flex items-center gap-1"
                      title="Download chart data as JSON"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadChart('xlsx')}
                      disabled={isDownloading}
                      className="px-2 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-xs rounded transition flex items-center gap-1"
                      title="Download as Excel with live data connection"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      Excel
                    </button>
                  </div>
                  <span className="px-3 py-1 bg-purple-600/30 text-purple-400 rounded-full text-xs font-medium">
                    ECharts
                  </span>
                </div>
              </div>

              <div className="h-[500px]">
                <ReactECharts
                  option={getChartOption}
                  style={{ height: '100%', width: '100%' }}
                  opts={{ renderer: 'canvas' }}
                  theme="dark"
                  onChartReady={onChartReady}
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
                {selectedChart === 'whale_tracker' && 'Whale Tracker monitors large cryptocurrency transactions (>$1M USD). Bubble size represents transaction value. Green border = buy, Red border = sell, Gray border = transfer. Track whale movements between exchanges, wallets, and DeFi protocols.'}
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

// Default export wrapped in Suspense for useSearchParams
export default function AdvancedChartsPage() {
  return (
    <Suspense fallback={<ChartLoading />}>
      <AdvancedChartsContent />
    </Suspense>
  );
}
