'use client';

import { useState, useMemo, useRef, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import type { ECharts } from 'echarts';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { SUPPORTED_COINS, getCoinGeckoId } from '@/lib/dataTypes';
import { WalletDistributionTreemap } from '@/components/features/WalletDistributionTreemap';

// Import echarts-gl after echarts core (must be in this order)
import 'echarts-gl';

// Dynamic import for ECharts to avoid SSR issues
const ReactECharts = dynamic(
  () => import('echarts-for-react'),
  { ssr: false }
);

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


const CHART_COLORS = ['#F7931A', '#627EEA', '#00D18C', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444'];

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
  | 'whale_tracker'
  | 'wallet_distribution';

type ChartCategory = '3d' | 'hierarchy' | 'flow' | 'metrics' | 'special';

interface CoinMetric {
  id: string;
  name: string;
  symbol: string;
  color: string;
  marketCap: number | null; // $B
  price: number | null; // USD
  volume: number | null; // $B
  change: number | null; // %
}

const ALL_COINS: CoinMetric[] = SUPPORTED_COINS.map((coin, index) => ({
  id: coin.symbol,
  name: coin.name,
  symbol: coin.symbol,
  marketCap: null,
  price: null,
  volume: null,
  change: null,
  color: CHART_COLORS[index % CHART_COLORS.length],
}));

const CHART_CONFIGS: Array<{
  type: AdvancedChartType;
  title: string;
  category: ChartCategory;
  icon: string;
  description: string;
}> = [
  { type: 'treemap', title: 'Treemap', category: 'hierarchy', icon: '▦', description: 'Market cap treemap (real market data)' },
  { type: 'sunburst', title: 'Sunburst', category: 'hierarchy', icon: '◔', description: 'Market structure by cap tiers (real market data)' },
  { type: 'graph_network', title: 'Network Graph', category: 'flow', icon: '◎', description: 'Coin network by market cap similarity (real market data)' },
  { type: 'funnel', title: 'Dominance Funnel', category: 'metrics', icon: '⏷', description: 'Dominance view by market cap (real market data)' },
  { type: 'wallet_distribution', title: 'Wallet Distribution', category: 'special', icon: '₿', description: 'Unavailable (no free, reliable wallet distribution source wired)' },

  // Disabled (no-fake-data policy): kept for navigation but will show Unavailable.
  { type: 'sankey', title: 'Sankey Flow', category: 'flow', icon: '⇄', description: 'Unavailable (requires real flow data source)' },
  { type: 'gauge', title: 'Market Gauges', category: 'metrics', icon: '⟲', description: 'Fear & Greed + Volatility gauges (real data via internal APIs)' },
  { type: 'radar_advanced', title: 'Radar', category: 'metrics', icon: '✶', description: 'Unavailable (requires real multi-factor fundamentals)' },
  { type: 'parallel', title: 'Parallel', category: 'metrics', icon: '≋', description: 'Unavailable (requires real multi-factor fundamentals)' },
  { type: 'calendar', title: 'Calendar Heatmap', category: 'special', icon: '▣', description: 'Bitcoin daily returns heatmap (real data via internal APIs)' },
  { type: 'whale_tracker', title: 'Whale Tracker', category: 'special', icon: '◉', description: 'Large BTC/ETH transactions (real data from Blockchair + Etherscan)' },
  { type: 'globe_3d', title: '3D Globe', category: '3d', icon: '◍', description: 'Unavailable (requires real 3D metric set)' },
];
// Valid chart types for URL validation
const VALID_ADVANCED_CHART_TYPES: AdvancedChartType[] = ['globe_3d', 'sankey', 'sunburst', 'gauge', 'treemap', 'radar_advanced', 'graph_network', 'parallel', 'funnel', 'calendar', 'whale_tracker', 'wallet_distribution'];

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

  const [marketMetricsBySymbol, setMarketMetricsBySymbol] = useState<Record<string, Pick<CoinMetric, 'marketCap' | 'price' | 'volume' | 'change'>>>({});
  const [calendarData, setCalendarData] = useState<Array<[string, number]>>([]);
  const [gaugeData, setGaugeData] = useState<{ fearGreed: number | null; volatility: number | null; fundingRate: number | null }>({
    fearGreed: null,
    volatility: null,
    fundingRate: null
  });
  const [whaleData, setWhaleData] = useState<Array<{ hash: string; amount: number; amountUsd: number; symbol: string; type: string; timestamp: string }>>([]);

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

  // Fetch real market metrics for selected coins (chunked, max 50 CoinGecko IDs per request)
  useEffect(() => {
    let cancelled = false;

    async function fetchSelectedMarketData() {
      try {
        if (selectedChart === 'wallet_distribution') return;

        const uniqueSymbols = Array.from(new Set(selectedCoins.map(s => s.toUpperCase())));
        if (uniqueSymbols.length === 0) {
          if (!cancelled) setMarketMetricsBySymbol({});
          return;
        }

        const ids = uniqueSymbols.map(getCoinGeckoId);
        const chunks: string[][] = [];
        for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));

        const results = await Promise.all(
          chunks.map(async (chunk) => {
            const res = await fetch(`/api/crypto?ids=${encodeURIComponent(chunk.join(','))}`);
            if (!res.ok) return null;
            const json = await res.json();
            if (!json?.success || !Array.isArray(json.data)) return null;
            return json.data;
          })
        );

        const merged: Record<string, Pick<CoinMetric, 'marketCap' | 'price' | 'volume' | 'change'>> = {};

        for (const arr of results) {
          if (!Array.isArray(arr)) continue;
          for (const coin of arr) {
            const symbol = typeof coin?.symbol === 'string' ? coin.symbol.toUpperCase() : null;
            if (!symbol) continue;

            const marketCapUsd = typeof coin?.market_cap === 'number' ? coin.market_cap : null;
            const volumeUsd = typeof coin?.total_volume === 'number' ? coin.total_volume : null;
            const priceUsd = typeof coin?.current_price === 'number' ? coin.current_price : null;
            const changePct =
              typeof coin?.price_change_percentage_24h_in_currency === 'number'
                ? coin.price_change_percentage_24h_in_currency
                : typeof coin?.price_change_percentage_24h === 'number'
                  ? coin.price_change_percentage_24h
                  : null;

            merged[symbol] = {
              marketCap: marketCapUsd !== null ? marketCapUsd / 1e9 : null,
              volume: volumeUsd !== null ? volumeUsd / 1e9 : null,
              price: priceUsd,
              change: changePct,
            };
          }
        }

        if (!cancelled) setMarketMetricsBySymbol(merged);
      } catch (e) {
        // No placeholders: on error, keep metrics null so charts render as unavailable.
        if (!cancelled) setMarketMetricsBySymbol({});
      }
    }

    fetchSelectedMarketData();
    return () => {
      cancelled = true;
    };
  }, [selectedCoins, selectedChart]);

  // Fetch calendar data (daily returns for past year) when calendar chart is selected
  useEffect(() => {
    if (selectedChart !== 'calendar') return;
    let cancelled = false;

    async function fetchCalendarData() {
      try {
        // Fetch BTC historical data for the calendar heatmap
        const res = await fetch('/api/crypto/bitcoin/history?days=365');
        if (!res.ok) {
          if (!cancelled) setCalendarData([]);
          return;
        }
        const json = await res.json();
        const prices = json?.prices;
        if (!Array.isArray(prices) || prices.length < 2) {
          if (!cancelled) setCalendarData([]);
          return;
        }

        // Calculate daily returns and format for calendar
        const dailyData: Array<[string, number]> = [];
        for (let i = 1; i < prices.length; i++) {
          const prev = prices[i - 1];
          const curr = prices[i];
          if (typeof prev?.price === 'number' && typeof curr?.price === 'number' && prev.price > 0) {
            const dailyReturn = ((curr.price - prev.price) / prev.price) * 100;
            const date = new Date(curr.timestamp);
            const dateStr = date.toISOString().split('T')[0];
            dailyData.push([dateStr, parseFloat(dailyReturn.toFixed(2))]);
          }
        }
        if (!cancelled) setCalendarData(dailyData);
      } catch {
        if (!cancelled) setCalendarData([]);
      }
    }

    fetchCalendarData();
    return () => { cancelled = true; };
  }, [selectedChart]);

  // Fetch gauge data (Fear & Greed, volatility, funding rate) when gauge chart is selected
  useEffect(() => {
    if (selectedChart !== 'gauge') return;
    let cancelled = false;

    async function fetchGaugeData() {
      try {
        // Fetch Fear & Greed index from internal API
        const fgPromise = fetch('/api/sentiment')
          .then(r => r.ok ? r.json() : null)
          .catch(() => null);

        // Fetch derivatives for funding rate
        const derivPromise = fetch('/api/derivatives')
          .then(r => r.ok ? r.json() : null)
          .catch(() => null);

        // Fetch BTC data for volatility calculation
        const btcPromise = fetch('/api/crypto/bitcoin')
          .then(r => r.ok ? r.json() : null)
          .catch(() => null);

        const [fgData, derivData, btcData] = await Promise.all([fgPromise, derivPromise, btcPromise]);

        const fearGreed = (fgData?.success && typeof fgData.value === 'number' && Number.isFinite(fgData.value))
          ? fgData.value
          : null;
        const fundingRate = derivData?.data?.btc?.fundingRate ?? null;

        // Calculate volatility from high/low spread
        let volatility: number | null = null;
        if (btcData?.high_24h && btcData?.low_24h && btcData?.current_price) {
          volatility = ((btcData.high_24h - btcData.low_24h) / btcData.current_price) * 100;
        }

        if (!cancelled) {
          setGaugeData({ fearGreed, volatility, fundingRate });
        }
      } catch {
        if (!cancelled) setGaugeData({ fearGreed: null, volatility: null, fundingRate: null });
      }
    }

    fetchGaugeData();
    return () => { cancelled = true; };
  }, [selectedChart]);

  // Fetch whale data when whale_tracker chart is selected
  useEffect(() => {
    if (selectedChart !== 'whale_tracker') return;
    let cancelled = false;

    async function fetchWhaleData() {
      try {
        const res = await fetch('/api/whales?type=dashboard');
        if (!res.ok) {
          if (!cancelled) setWhaleData([]);
          return;
        }
        const json = await res.json();
        const transactions = json?.data?.recentWhaleTransactions;
        if (!Array.isArray(transactions)) {
          if (!cancelled) setWhaleData([]);
          return;
        }

        const mapped = transactions.slice(0, 20).map((tx: {
          hash: string;
          amount: number;
          amountUsd: number;
          symbol: string;
          type: string;
          timestamp: string;
        }) => ({
          hash: tx.hash,
          amount: tx.amount,
          amountUsd: tx.amountUsd,
          symbol: tx.symbol,
          type: tx.type,
          timestamp: tx.timestamp
        }));

        if (!cancelled) setWhaleData(mapped);
      } catch {
        if (!cancelled) setWhaleData([]);
      }
    }

    fetchWhaleData();
    return () => { cancelled = true; };
  }, [selectedChart]);

  // Get filtered and sorted coins based on parameters
  const filteredCoins = useMemo(() => {
    let coins = ALL_COINS
      .filter(c => selectedCoins.includes(c.id))
      .map((coin) => ({
        ...coin,
        ...(marketMetricsBySymbol[coin.symbol] || { marketCap: null, price: null, volume: null, change: null }),
      }));

    // Sort coins
    coins = [...coins].sort((a, b) => {
      const aVal = sortBy === 'marketCap' ? a.marketCap : sortBy === 'change' ? a.change : a.volume;
      const bVal = sortBy === 'marketCap' ? b.marketCap : sortBy === 'change' ? b.change : b.volume;

      if (typeof aVal !== 'number' && typeof bVal !== 'number') return 0;
      if (typeof aVal !== 'number') return 1;
      if (typeof bVal !== 'number') return -1;
      return bVal - aVal;
    });

    // Limit to max items
    return coins.slice(0, maxItems);
  }, [selectedCoins, maxItems, sortBy, marketMetricsBySymbol]);

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
  const downloadChart = useCallback(async (format: 'png' | 'svg' | 'json' | 'xlsx' | 'iqy') => {
    setIsDownloading(true);
    try {
      if (format === 'iqy') {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://datasimplify.com';
        const url = new URL(`${baseUrl}/api/download`);
        url.searchParams.set('category', 'market_overview');
        url.searchParams.set('format', 'csv');
        url.searchParams.set('excel', 'true');
        if (selectedCoins.length > 0) url.searchParams.set('symbols', selectedCoins.join(','));
        url.searchParams.set('fields', 'symbol,name,price,market_cap,volume_24h,price_change_percent_24h');

        const iqy = `WEB\n1\n${url.toString()}\n`;
        const blob = new Blob([iqy], { type: 'text/plain; charset=utf-8' });
        downloadBlob(blob, `${selectedChart}_live.iqy`);
        setIsDownloading(false);
        return;
      }

      if (format === 'json') {
        // Export chart data as JSON
        const blob = new Blob([JSON.stringify(filteredCoins, null, 2)], { type: 'application/json' });
        downloadBlob(blob, `${selectedChart}_data.json`);
        setIsDownloading(false);
        return;
      }

      if (format === 'xlsx') {
        // Export chart data as Excel with chart image bundled in ZIP
        const zip = new JSZip();
        const dateStr = new Date().toISOString().split('T')[0];

        // Create Excel workbook
        const wb = XLSX.utils.book_new();

        // Sheet 1: Current chart data
        const chartDataForExcel = filteredCoins.map(coin => ({
          'Symbol': coin.symbol,
          'Name': coin.name,
          'Price (USD)': typeof coin.price === 'number' ? `$${coin.price.toLocaleString()}` : 'Unavailable',
          'Market Cap ($B)': typeof coin.marketCap === 'number' ? coin.marketCap : null,
          'Volume ($B)': typeof coin.volume === 'number' ? coin.volume : null,
          '24h Change (%)': typeof coin.change === 'number' ? coin.change : null,
          'Holders (M)': 'Unavailable',
          'Sentiment Score': 'Unavailable',
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
          [''],
          ['NOTE: Chart image is included in this ZIP file as a PNG.'],
        ];
        const wsInstructions = XLSX.utils.aoa_to_sheet(liveDataInstructions);
        wsInstructions['!cols'] = [{ wch: 35 }, { wch: 70 }];
        XLSX.utils.book_append_sheet(wb, wsInstructions, 'Live Data Guide');

        // Generate Excel buffer
        const excelBuffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
        zip.file(`${selectedChart}_data.xlsx`, new Uint8Array(excelBuffer));

        // Get chart image
        let chartImageBlob: Blob | null = null;
        const echartsInstance = chartInstanceRef.current;

        if (echartsInstance) {
          const dataURL = echartsInstance.getDataURL({
            type: 'png',
            pixelRatio: 2,
            backgroundColor: '#1f2937'
          });
          // Convert data URL to blob
          const response = await fetch(dataURL);
          chartImageBlob = await response.blob();
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
            chartImageBlob = await new Promise<Blob | null>((resolve) => {
              canvas.toBlob((blob) => resolve(blob), 'image/png', 0.95);
            });
          }
        }

        // Add chart image to ZIP
        if (chartImageBlob) {
          zip.file(`${selectedChart}_chart.png`, chartImageBlob);
        }

        // Generate and download ZIP
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        downloadBlob(zipBlob, `${selectedChart}_export_${dateStr}.zip`);

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
        {
        const treemapCoins = filteredCoins.filter(c => typeof c.marketCap === 'number' && Number.isFinite(c.marketCap));
        if (treemapCoins.length === 0) return {};

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
            data: treemapCoins.map(coin => ({
              name: `${coin.name} (${coin.symbol})`,
              value: coin.marketCap,
              itemStyle: {
                color: colorMode === 'change'
                  ? (typeof coin.change === 'number'
                      ? (coin.change >= 0 ?
                          `rgba(16, 185, 129, ${Math.min(0.95, Math.max(0.35, 0.4 + coin.change / 20))})` :
                          `rgba(239, 68, 68, ${Math.min(0.95, Math.max(0.35, 0.4 + Math.abs(coin.change) / 20))})`)
                      : coin.color)
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
        }

      case 'sunburst':
        {
        const sunburstCoins = filteredCoins.filter(c => typeof c.marketCap === 'number' && Number.isFinite(c.marketCap));
        if (sunburstCoins.length === 0) return {};

        // marketCap is stored in $B
        const megaCap = sunburstCoins.filter(c => (c.marketCap as number) >= 100); // $100B+
        const largeCap = sunburstCoins.filter(c => (c.marketCap as number) >= 10 && (c.marketCap as number) < 100); // $10B-$100B
        const midCap = sunburstCoins.filter(c => (c.marketCap as number) >= 1 && (c.marketCap as number) < 10); // $1B-$10B
        const smallCap = sunburstCoins.filter(c => (c.marketCap as number) < 1); // <$1B

        const sunburstColors = ['#F7931A', '#627EEA', '#00D18C', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B', '#EF4444'];

        const buildChildren = (coins: typeof sunburstCoins) =>
          coins.map((coin, idx) => ({
            name: coin.symbol,
            value: Math.max(1, Math.round(coin.marketCap as number)),
            itemStyle: { color: coin.color || sunburstColors[idx % sunburstColors.length] }
          }));

        const sunburstData = [];
        if (megaCap.length > 0) {
          sunburstData.push({ name: 'Mega Cap ($100B+)', children: buildChildren(megaCap), itemStyle: { color: '#3B82F6' } });
        }
        if (largeCap.length > 0) {
          sunburstData.push({ name: 'Large Cap ($10B-$100B)', children: buildChildren(largeCap), itemStyle: { color: '#8B5CF6' } });
        }
        if (midCap.length > 0) {
          sunburstData.push({ name: 'Mid Cap ($1B-$10B)', children: buildChildren(midCap), itemStyle: { color: '#10B981' } });
        }
        if (smallCap.length > 0) {
          sunburstData.push({ name: 'Small Cap (<$1B)', children: buildChildren(smallCap), itemStyle: { color: '#F59E0B' } });
        }

        return {
          title: {
            text: `Crypto Market Structure (${sunburstCoins.length} coins)`,
            left: 'center',
            textStyle: { color: '#fff' }
          },
          tooltip: {
            trigger: 'item',
            formatter: (params: { name: string; value?: number }) => {
              if (params.value) {
                return `${params.name}: $${params.value}B`;
              }
              return params.name;
            }
          },
          series: [{
            type: 'sunburst',
            data: sunburstData,
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
        }

      case 'sankey':
        // Previously used fabricated flow values.
        return {};

      case 'gauge':
        {
        // Market gauges showing Fear & Greed, Volatility, and Funding Rate
        const hasAnyData = gaugeData.fearGreed !== null || gaugeData.volatility !== null || gaugeData.fundingRate !== null;
        if (!hasAnyData) return {};

        const gauges: Array<{
          type: string;
          center: string[];
          radius: string;
          startAngle: number;
          endAngle: number;
          min: number;
          max: number;
          splitNumber: number;
          axisLine: { lineStyle: { width: number; color: Array<[number, string]> } };
          pointer: { width: number };
          axisTick: { show: boolean };
          splitLine: { show: boolean };
          axisLabel: { show: boolean };
          title: { offsetCenter: [string, string]; color: string };
          detail: { valueAnimation: boolean; formatter: string | ((v: number) => string); color: string; offsetCenter: [string, string] };
          data: Array<{ value: number; name: string }>;
        }> = [];

        // Fear & Greed Gauge
        if (typeof gaugeData.fearGreed === 'number') {
          gauges.push({
            type: 'gauge',
            center: ['25%', '55%'],
            radius: '60%',
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: 100,
            splitNumber: 4,
            axisLine: {
              lineStyle: {
                width: 15,
                color: [
                  [0.25, '#EF4444'], // Extreme Fear
                  [0.45, '#F59E0B'], // Fear
                  [0.55, '#9CA3AF'], // Neutral
                  [0.75, '#10B981'], // Greed
                  [1, '#059669']     // Extreme Greed
                ]
              }
            },
            pointer: { width: 5 },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            title: { offsetCenter: ['0', '30%'], color: '#9CA3AF' },
            detail: { valueAnimation: true, formatter: '{value}', color: '#fff', offsetCenter: ['0', '50%'] },
            data: [{ value: gaugeData.fearGreed, name: 'Fear & Greed' }]
          });
        }

        // Volatility Gauge
        if (typeof gaugeData.volatility === 'number') {
          gauges.push({
            type: 'gauge',
            center: ['75%', '55%'],
            radius: '60%',
            startAngle: 180,
            endAngle: 0,
            min: 0,
            max: 10,
            splitNumber: 5,
            axisLine: {
              lineStyle: {
                width: 15,
                color: [
                  [0.2, '#10B981'], // Low volatility
                  [0.4, '#3B82F6'], // Moderate
                  [0.6, '#F59E0B'], // Elevated
                  [0.8, '#EF4444'], // High
                  [1, '#991B1B']    // Extreme
                ]
              }
            },
            pointer: { width: 5 },
            axisTick: { show: false },
            splitLine: { show: false },
            axisLabel: { show: false },
            title: { offsetCenter: ['0', '30%'], color: '#9CA3AF' },
            detail: { valueAnimation: true, formatter: (v: number) => `${v.toFixed(2)}%`, color: '#fff', offsetCenter: ['0', '50%'] },
            data: [{ value: Math.min(10, gaugeData.volatility), name: '24h Volatility' }]
          });
        }

        return {
          title: {
            text: 'Market Gauges',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          tooltip: {
            formatter: (params: { value: number; name: string }) => `${params.name}: ${params.value}`
          },
          series: gauges
        };
        }

      case 'radar_advanced':
        // Previously relied on fabricated holders/sentiment/adoption signals.
        return {};

      case 'graph_network':
        {
        const networkCoins = filteredCoins.filter(c => typeof c.marketCap === 'number' && Number.isFinite(c.marketCap));
        if (networkCoins.length < 2) return {};

        // Build network from selected coins based on market cap tiers ($B)
        const networkCategories = [
          { name: 'Mega Cap ($100B+)' },
          { name: 'Large Cap ($10B-$100B)' },
          { name: 'Mid Cap ($1B-$10B)' },
          { name: 'Small Cap (<$1B)' }
        ];

        const getCategoryIndex = (marketCap: number) => {
          if (marketCap >= 100) return 0;
          if (marketCap >= 10) return 1;
          if (marketCap >= 1) return 2;
          return 3;
        };

        const maxMC = Math.max(...networkCoins.map(c => c.marketCap as number));
        const networkNodes = networkCoins.map(coin => ({
          name: coin.symbol,
          symbolSize: Math.max(15, Math.min(60, ((coin.marketCap as number) / maxMC) * 60)),
          category: getCategoryIndex(coin.marketCap as number),
          itemStyle: { color: coin.color }
        }));

        // Create links between coins in similar/related tiers
        const networkLinks: { source: string; target: string }[] = [];
        networkCoins.forEach((coin) => {
          // Link to 2-3 nearest coins by market cap
          const sorted = [...networkCoins].sort((a, b) =>
            Math.abs((a.marketCap as number) - (coin.marketCap as number)) - Math.abs((b.marketCap as number) - (coin.marketCap as number))
          );
          sorted.slice(1, 3).forEach(target => {
            if (!networkLinks.some(l =>
              (l.source === coin.symbol && l.target === target.symbol) ||
              (l.source === target.symbol && l.target === coin.symbol)
            )) {
              networkLinks.push({ source: coin.symbol, target: target.symbol });
            }
          });
        });

        return {
          title: {
            text: `Crypto Network (${networkCoins.length} coins)`,
            left: 'center',
            textStyle: { color: '#fff' }
          },
          legend: {
            data: networkCategories.map(c => c.name),
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
            categories: networkCategories,
            data: networkNodes,
            links: networkLinks,
            lineStyle: { color: 'source', curveness: 0.3 }
          }]
        };
        }

      case 'parallel':
        // Previously relied on fabricated holders/sentiment metrics.
        return {};

      case 'funnel':
        {
        const funnelCoins = filteredCoins.filter(c => typeof c.marketCap === 'number' && Number.isFinite(c.marketCap));
        if (funnelCoins.length === 0) return {};

        // Funnel showing market dominance of selected coins
        const totalMarketCap = funnelCoins.reduce((sum, c) => sum + (c.marketCap as number), 0);
        if (totalMarketCap <= 0) return {};

        const funnelData = funnelCoins
          .sort((a, b) => (b.marketCap as number) - (a.marketCap as number))
          .slice(0, 8)
          .map((coin, idx) => ({
            value: Math.round(((coin.marketCap as number) / totalMarketCap) * 100),
            name: `${coin.symbol} ($${coin.marketCap}B)`,
            itemStyle: { color: coin.color || CHART_COLORS[idx % CHART_COLORS.length] }
          }));

        return {
          title: {
            text: `Market Dominance Funnel (${filteredCoins.length} coins)`,
            left: 'center',
            textStyle: { color: '#fff' }
          },
          tooltip: {
            trigger: 'item',
            formatter: (params: { name: string; value: number }) =>
              `${params.name}<br/>Dominance: ${params.value}%`
          },
          series: [{
            type: 'funnel',
            left: '10%',
            width: '80%',
            sort: 'descending',
            label: { position: 'inside', color: '#fff', formatter: '{b}' },
            labelLine: { show: false },
            itemStyle: { borderWidth: 0 },
            emphasis: { label: { fontSize: 14 } },
            data: funnelData
          }]
        };
        }

      case 'calendar':
        {
        // Calendar heatmap showing daily BTC price returns
        if (calendarData.length === 0) return {};

        // Get date range from data
        const dates = calendarData.map(d => d[0]).sort();
        const startDate = dates[0];
        const endDate = dates[dates.length - 1];

        // Calculate max absolute value for color scaling
        const maxAbsReturn = Math.max(...calendarData.map(d => Math.abs(d[1])), 1);

        return {
          title: {
            text: 'Bitcoin Daily Returns Heatmap',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          tooltip: {
            position: 'top',
            formatter: (params: { value: [string, number] }) => {
              const [date, value] = params.value;
              const color = value >= 0 ? '#10B981' : '#EF4444';
              return `<div style="padding:4px 8px"><strong>${date}</strong><br/><span style="color:${color}">${value >= 0 ? '+' : ''}${value.toFixed(2)}%</span></div>`;
            }
          },
          visualMap: {
            min: -maxAbsReturn,
            max: maxAbsReturn,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '5%',
            inRange: {
              color: ['#EF4444', '#374151', '#10B981']
            },
            textStyle: { color: '#9CA3AF' }
          },
          calendar: {
            top: 60,
            left: 50,
            right: 30,
            cellSize: ['auto', 15],
            range: [startDate, endDate],
            itemStyle: {
              borderWidth: 1,
              borderColor: '#374151'
            },
            yearLabel: { color: '#9CA3AF' },
            monthLabel: { color: '#9CA3AF' },
            dayLabel: { color: '#9CA3AF' }
          },
          series: [{
            type: 'heatmap',
            coordinateSystem: 'calendar',
            data: calendarData
          }]
        };
        }

      case 'whale_tracker':
        {
        // Whale tracker scatter/bubble chart showing recent large transactions
        if (whaleData.length === 0) return {};

        // Group by symbol and create scatter data
        const btcTxs = whaleData.filter(tx => tx.symbol === 'BTC');
        const ethTxs = whaleData.filter(tx => tx.symbol === 'ETH');

        const formatScatterData = (txs: typeof whaleData) =>
          txs.map((tx) => {
            const date = new Date(tx.timestamp);
            const hours = date.getHours() + date.getMinutes() / 60;
            return [
              hours, // X: time of day
              Math.log10(tx.amountUsd + 1), // Y: log scale of USD value
              Math.sqrt(tx.amountUsd) / 100, // Size
              tx.type,
              tx.amount,
              tx.amountUsd,
              tx.hash.slice(0, 10)
            ];
          });

        return {
          title: {
            text: 'Recent Whale Transactions',
            left: 'center',
            textStyle: { color: '#fff' }
          },
          tooltip: {
            formatter: (params: { value: [number, number, number, string, number, number, string]; seriesName: string }) => {
              const [, , , type, amount, usd, hash] = params.value;
              const typeLabel = type === 'exchange_inflow' ? 'Exchange Inflow' :
                               type === 'exchange_outflow' ? 'Exchange Outflow' : 'Whale Transfer';
              return `<strong>${params.seriesName}</strong><br/>
                      Amount: ${amount.toLocaleString()} ${params.seriesName}<br/>
                      Value: $${(usd / 1e6).toFixed(2)}M<br/>
                      Type: ${typeLabel}<br/>
                      TX: ${hash}...`;
            }
          },
          legend: {
            data: ['BTC', 'ETH'],
            bottom: 10,
            textStyle: { color: '#9CA3AF' }
          },
          xAxis: {
            name: 'Time (Hour)',
            nameTextStyle: { color: '#9CA3AF' },
            min: 0,
            max: 24,
            axisLabel: { color: '#9CA3AF' },
            splitLine: { lineStyle: { color: '#374151' } }
          },
          yAxis: {
            name: 'Value (log scale)',
            nameTextStyle: { color: '#9CA3AF' },
            axisLabel: { color: '#9CA3AF', formatter: (v: number) => `$${Math.pow(10, v).toExponential(0)}` },
            splitLine: { lineStyle: { color: '#374151' } }
          },
          series: [
            {
              name: 'BTC',
              type: 'scatter',
              symbolSize: (data: number[]) => Math.min(50, Math.max(10, data[2])),
              data: formatScatterData(btcTxs),
              itemStyle: {
                color: '#F7931A',
                borderColor: '#fff',
                borderWidth: 1
              }
            },
            {
              name: 'ETH',
              type: 'scatter',
              symbolSize: (data: number[]) => Math.min(50, Math.max(10, data[2])),
              data: formatScatterData(ethTxs),
              itemStyle: {
                color: '#627EEA',
                borderColor: '#fff',
                borderWidth: 1
              }
            }
          ]
        };
        }

      case 'globe_3d':
        // Disabled: previously relied on fabricated holders/sentiment metrics.
        return {};

      default:
        return {};
    }
  }, [selectedChart, filteredCoins, colorMode, calendarData, gaugeData, whaleData]);

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
          <div className="col-span-12 lg:col-span-3 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:sticky lg:top-4">
            <div className="bg-gray-800 rounded-xl border border-gray-700 p-4">
              <h3 className="font-medium mb-4">Advanced Chart Types</h3>

              {/* Chart Type Selector with scrollable area */}
              <div className="max-h-64 overflow-y-auto pr-1">
                {['3d', 'hierarchy', 'flow', 'metrics', 'special'].map(category => (
                  <div key={category} className="mb-3">
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                      {category === '3d' ? '3D Visualization' :
                       category === 'hierarchy' ? 'Hierarchical' :
                       category === 'flow' ? 'Flow & Network' :
                       category === 'metrics' ? 'Metrics' : 'Special'}
                    </div>
                    {CHART_CONFIGS.filter(c => c.category === category).map(config => (
                      <button
                        type="button"
                        key={config.type}
                        onClick={() => setSelectedChart(config.type)}
                        className={`w-full text-left p-2 rounded-lg mb-1 transition ${
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
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700">
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
                  {/* Notice for BTC Distribution */}
                  {selectedChart === 'wallet_distribution' && (
                    <div className="p-3 bg-blue-900/30 border border-blue-700/50 rounded-lg">
                      <p className="text-xs text-blue-300">
                        <strong>Note:</strong> BTC Distribution is a specialized Bitcoin-only visualization.
                        The controls below apply to other chart types.
                      </p>
                    </div>
                  )}

                  {/* Coin Selection */}
                  <div className={selectedChart === 'wallet_distribution' ? 'opacity-50 pointer-events-none' : ''}>
                    <label className="block text-xs text-gray-400 mb-2">
                      Select Coins ({selectedCoins.length}/{ALL_COINS.length})
                    </label>
                    <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto p-2 bg-gray-900/50 rounded-lg border border-gray-700">
                      {ALL_COINS.map(coin => (
                        <button
                          type="button"
                          key={coin.id}
                          onClick={() => toggleCoin(coin.id)}
                          className={`px-2 py-1 rounded text-xs cursor-pointer transition-all duration-150 hover:scale-105 active:scale-95 ${
                            selectedCoins.includes(coin.id)
                              ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-500/30'
                              : 'bg-gray-700 text-gray-400 hover:bg-gray-600 hover:text-white'
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
                  <div className={selectedChart === 'wallet_distribution' ? 'opacity-50 pointer-events-none' : ''}>
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
                  <div className={selectedChart === 'wallet_distribution' ? 'opacity-50 pointer-events-none' : ''}>
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
                  <div className={selectedChart === 'wallet_distribution' ? 'opacity-50 pointer-events-none' : ''}>
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
                      title="Download ZIP with Excel data + Chart image"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                      ZIP
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadChart('iqy')}
                      disabled={isDownloading}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 text-white text-xs rounded transition flex items-center gap-1"
                      title="Live Excel (IQY): one-click import, refreshable in Excel"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      LIVE
                    </button>
                  </div>
                  <span className="px-3 py-1 bg-purple-600/30 text-purple-400 rounded-full text-xs font-medium">
                    ECharts
                  </span>
                </div>
              </div>

              <div className={selectedChart === 'wallet_distribution' ? 'min-h-[600px]' : 'h-[500px]'}>
                {selectedChart === 'wallet_distribution' ? (
                  <div className="h-full">
                    <WalletDistributionTreemap />
                  </div>
                ) : filteredCoins.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <p className="text-xl mb-2">No coins selected</p>
                      <p className="text-sm">Select at least one coin from the controls panel to view the chart.</p>
                    </div>
                  </div>
                ) : Object.keys(getChartOption).length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-gray-400">
                      <p className="text-xl mb-2">Chart not available</p>
                      <p className="text-sm">This chart type is not yet implemented for the selected data.</p>
                    </div>
                  </div>
                ) : (
                  <ReactECharts
                    key={`${selectedChart}-${selectedCoins.join('-')}`}
                    option={getChartOption}
                    style={{ height: '100%', width: '100%' }}
                    opts={{ renderer: 'canvas' }}
                    theme="dark"
                    notMerge={true}
                    lazyUpdate={false}
                    onChartReady={onChartReady}
                  />
                )}
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
                {selectedChart === 'globe_3d' && '3D Metrics visualization shows a rotating 3D bar chart comparing multiple metrics (Market Cap, Volume, Holders, Sentiment) across selected coins. Drag to rotate, scroll to zoom.'}
                {selectedChart === 'whale_tracker' && 'Whale Tracker monitors large cryptocurrency transactions (>$1M USD). Bubble size represents transaction value. Green border = buy, Red border = sell, Gray border = transfer. Track whale movements between exchanges, wallets, and DeFi protocols.'}
                {selectedChart === 'wallet_distribution' && 'Wallet Distribution is unavailable until a real public data source is integrated. (Hardcoded example buckets are not shown.)'}
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
                <div className="text-xs text-gray-400">Updates periodically</div>
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
