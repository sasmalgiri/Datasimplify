/**
 * dashboardCharts.ts — Chart definitions per dashboard type (Premium 2x2 Grid)
 *
 * Charts now use structured table references (TableName[ColumnName]) that
 * auto-update when Power Query refreshes data. This replaces the old
 * hardcoded cell ranges ('Sheet'!$A$1:$A$10) that broke on data resize.
 *
 * OTHER-LEVELS DESIGN PRINCIPLES applied:
 * - Chart types matched to data purpose (not one-size-fits-all)
 * - Bar charts → Rankings, discrete comparisons, indicator values
 * - Doughnut charts → Market share, allocation, distribution (hero gauges)
 * - Line charts → Trends, moving averages, price trajectories
 * - Pie charts → Simple composition (< 6 categories)
 * - Multi-series where data warrants it (SMA vs EMA, TVL vs Volume)
 *
 * Grid positions (consistent for all dashboards):
 *   TL: fromCol=2, fromRow=12, toCol=7, toRow=23   (B12:G23)
 *   TR: fromCol=8, fromRow=12, toCol=13, toRow=23   (H12:M23)
 *   BL: fromCol=2, fromRow=25, toCol=7, toRow=36    (B25:G36)
 *   BR: fromCol=8, fromRow=25, toCol=13, toRow=36    (H25:M36)
 */

import type { ChartDefinition, ChartType, StructuredRef, StructuredSeriesRef } from './chartInjector';
import type { DashboardType } from './masterGenerator';
import { getDashboardTheme } from './masterGenerator';

// ============================================
// Standard 2x2 grid positions
// ============================================

const TL = { fromCol: 2, fromRow: 12, toCol: 7, toRow: 23 };
const TR = { fromCol: 8, fromRow: 12, toCol: 13, toRow: 23 };
const BL = { fromCol: 2, fromRow: 25, toCol: 7, toRow: 36 };
const BR = { fromCol: 8, fromRow: 25, toCol: 13, toRow: 36 };

// ============================================
// Helper: structured series ref shorthand
// ============================================

function sRef(name: string, table: string, column: string, color?: string): StructuredSeriesRef {
  return { name, table, column, color };
}

function tRef(table: string, column: string): StructuredRef {
  return { table, column };
}

// ============================================
// Helper: Generate 4 charts in 2x2 grid
// Uses structured table references for PQ auto-refresh.
// ============================================

interface GridChart {
  title: string;
  type: ChartType;
  column: string;       // PQ column name for value data
  /** Optional second series (multi-series line/bar) */
  series2?: { name: string; column: string; colorIdx?: number };
  colorIdx?: number;
  showLegend?: boolean;
}

function makeGridCharts(opts: {
  prefix: string;
  visualSheet: string;
  tableName: string;      // PQ table name (e.g., 'CRK_Market')
  catColumn: string;      // PQ column name for categories (e.g., 'Name')
  tl: GridChart;
  tr: GridChart;
  bl: GridChart;
  br: GridChart;
  palette: string[];
}): ChartDefinition[] {
  const p = opts.palette;
  const t = opts.tableName;
  const cat = opts.catColumn;

  const make = (pos: string, gc: GridChart, position: typeof TL, idx: number): ChartDefinition => {
    const values: StructuredSeriesRef[] = [
      sRef(gc.title, t, gc.column, p[gc.colorIdx ?? idx]),
    ];

    // Multi-series support
    if (gc.series2) {
      values.push(
        sRef(gc.series2.name, t, gc.series2.column, p[gc.series2.colorIdx ?? ((gc.colorIdx ?? idx) + 1)]),
      );
    }

    const isMultiSeries = !!gc.series2;
    const isDonut = gc.type === 'doughnut' || gc.type === 'pie';

    return {
      id: `${opts.prefix}-${pos}`,
      type: gc.type,
      title: gc.title,
      sheetName: opts.visualSheet,
      dataRange: {
        categories: tRef(t, cat),
        values,
      },
      position,
      style: {
        darkTheme: true,
        showLegend: gc.showLegend ?? (isDonut || isMultiSeries),
        colors: p,
      },
    };
  };

  return [
    make('tl', opts.tl, TL, 0),
    make('tr', opts.tr, TR, 1),
    make('bl', opts.bl, BL, 2),
    make('br', opts.br, BR, 3),
  ];
}

// ============================================
// Main Entry Point
// ============================================

export function getChartsForDashboard(dashboard: DashboardType): ChartDefinition[] {
  const theme = getDashboardTheme(dashboard);
  const palette = theme.palette;

  switch (dashboard) {
    // ═══════════════════════════════════════════
    // EXECUTIVE DASHBOARDS (Gold theme)
    // ═══════════════════════════════════════════
    case 'market-overview': return getMarketOverviewCharts(palette);
    case 'screener': return getScreenerCharts(palette);
    case 'portfolio-tracker': return getPortfolioCharts(palette);

    // ═══════════════════════════════════════════
    // ASSET-SPECIFIC DASHBOARDS (Crypto colors)
    // Purpose: Deep dive on single asset — technical + dominance
    // ═══════════════════════════════════════════
    case 'bitcoin-dashboard': return getBitcoinCharts(palette);
    case 'ethereum-dashboard': return getEthereumCharts(palette);

    // ═══════════════════════════════════════════
    // ECOSYSTEM DASHBOARDS (Blue theme)
    // Purpose: Show ecosystem composition and health
    // ═══════════════════════════════════════════
    case 'defi-dashboard': return getDefiCharts(palette);
    case 'nft-tracker': return getNftCharts(palette);
    case 'stablecoins': return getStablecoinCharts(palette);
    case 'categories':
    case 'heatmap': return getCategoriesCharts(palette);
    case 'rwa':
    case 'metaverse':
    case 'privacy-coins': return getCategoryTokenCharts(palette);

    // ═══════════════════════════════════════════
    // TRADING DASHBOARDS (Cyan theme)
    // Purpose: Decision support — indicators, OI, volatility
    // ═══════════════════════════════════════════
    case 'technical-analysis': return getTechnicalCharts(palette);
    case 'derivatives':
    case 'funding-rates': return getDerivativesCharts(palette);
    case 'liquidations': return getLiquidationsCharts(palette);
    case 'volatility':
    case 'calculator': return getVolatilityCharts(palette);

    // ═══════════════════════════════════════════
    // RANKING DASHBOARDS (Sunset orange theme)
    // Purpose: Show movers, compare performance
    // ═══════════════════════════════════════════
    case 'gainers-losers': return getGainersCharts(palette);
    case 'trending': return getTrendingCharts(palette);
    case 'meme-coins': return getMemeCharts(palette);
    case 'ai-gaming': return getAiGamingCharts(palette);
    case 'altcoin-season': return getAltcoinCharts(palette);
    case 'layer1-compare':
    case 'layer2-compare': return getLayerCharts(palette);

    // ═══════════════════════════════════════════
    // ANALYTICS DASHBOARDS (Purple theme)
    // Purpose: Sentiment, research, correlation
    // ═══════════════════════════════════════════
    case 'fear-greed': return getFearGreedCharts(palette);
    case 'social-sentiment': return getSentimentCharts(palette);
    case 'correlation': return getCorrelationCharts(palette);
    case 'on-chain':
    case 'whale-tracker': return getOnChainCharts(palette);
    case 'dev-activity': return getDevCharts(palette);

    // ═══════════════════════════════════════════
    // INSTITUTIONAL DASHBOARDS (Red theme)
    // Purpose: Exchange health, ETF holdings, reserves
    // ═══════════════════════════════════════════
    case 'exchanges': return getExchangeCharts(palette);
    case 'exchange-reserves': return getExchangeReserveCharts(palette);
    case 'etf-tracker': return getEtfCharts(palette);

    // ═══════════════════════════════════════════
    // YIELD DASHBOARDS (Teal theme)
    // Purpose: Income opportunities, staking, DeFi yields
    // ═══════════════════════════════════════════
    case 'defi-yields': return getDefiYieldsCharts(palette);
    case 'token-unlocks': return getTokenUnlockCharts(palette);
    case 'staking-yields': return getStakingCharts(palette);

    // ═══════════════════════════════════════════
    // TOOLS DASHBOARDS (Emerald theme)
    // ═══════════════════════════════════════════
    case 'mining-calc': return getMiningCharts(palette);
    case 'custom': return getWatchlistCharts(palette);

    default: return [];
  }
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  EXECUTIVE DASHBOARDS                                     ║
// ║  Market overview, screener, portfolio                     ║
// ╚═══════════════════════════════════════════════════════════╝

/** Market Overview: Bar(MCap) → Doughnut(Share) → Bar(24h%) → Line(Price trend) */
function getMarketOverviewCharts(palette: string[]): ChartDefinition[] {
  const t = 'CRK_Market';
  return [
    { id: 'mkt-tl', type: 'bar', title: 'Top 10 by Market Cap', sheetName: 'CRK Dashboard',
      dataRange: { categories: tRef(t, 'Name'), values: [sRef('Market Cap', t, 'MarketCap', palette[0])] },
      position: TL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'mkt-tr', type: 'doughnut', title: 'Market Cap Distribution', sheetName: 'CRK Dashboard',
      dataRange: { categories: tRef(t, 'Name'), values: [sRef('Market Cap', t, 'MarketCap')] },
      position: TR, style: { darkTheme: true, showLegend: true, colors: palette } },
    { id: 'mkt-bl', type: 'bar', title: '24h Price Change %', sheetName: 'CRK Dashboard',
      dataRange: { categories: tRef(t, 'Name'), values: [sRef('24h Change', t, 'Change24h', palette[1])] },
      position: BL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'mkt-br', type: 'line', title: 'Price Comparison', sheetName: 'CRK Dashboard',
      dataRange: { categories: tRef(t, 'Name'), values: [sRef('Price', t, 'Price', palette[2])] },
      position: BR, style: { darkTheme: true, showLegend: false, colors: palette } },
  ];
}

/** Screener: Bar(MCap Top 20) → Doughnut(Share) → Bar(24h%) → Bar(7d%) */
function getScreenerCharts(palette: string[]): ChartDefinition[] {
  const t = 'CRK_Market';
  return [
    { id: 'scr-tl', type: 'bar', title: 'Top 20 by Market Cap', sheetName: 'CRK Screener',
      dataRange: { categories: tRef(t, 'Name'), values: [sRef('Market Cap', t, 'MarketCap', palette[0])] },
      position: TL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'scr-tr', type: 'doughnut', title: 'Market Share (Top 10)', sheetName: 'CRK Screener',
      dataRange: { categories: tRef(t, 'Name'), values: [sRef('Market Cap', t, 'MarketCap')] },
      position: TR, style: { darkTheme: true, showLegend: true, colors: palette } },
    { id: 'scr-bl', type: 'bar', title: '24h Change — Top 20', sheetName: 'CRK Screener',
      dataRange: { categories: tRef(t, 'Name'), values: [sRef('24h Change', t, 'Change24h', palette[1])] },
      position: BL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'scr-br', type: 'bar', title: '7d Change — Top 20', sheetName: 'CRK Screener',
      dataRange: { categories: tRef(t, 'Name'), values: [sRef('7d Change', t, 'Change7d', palette[3])] },
      position: BR, style: { darkTheme: true, showLegend: false, colors: palette } },
  ];
}

/** Portfolio: Legacy cell-range refs (dual row ranges can't be structured refs) */
function getPortfolioCharts(palette: string[]): ChartDefinition[] {
  const d = "'CRK Portfolio Data'";
  return [
    { id: 'ptf-tl', type: 'doughnut', title: 'Portfolio Allocation', sheetName: 'CRK Portfolio',
      dataRange: { categories: `${d}!$A$6:$A$15`, values: [{ name: 'Value', ref: `${d}!$C$6:$C$15` }] },
      position: TL, style: { darkTheme: true, showLegend: true, colors: palette } },
    { id: 'ptf-tr', type: 'bar', title: 'Holdings by Value', sheetName: 'CRK Portfolio',
      dataRange: { categories: `${d}!$A$6:$A$15`, values: [{ name: 'Value', ref: `${d}!$C$6:$C$15`, color: palette[0] }] },
      position: TR, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'ptf-bl', type: 'bar', title: 'Top 10 Market Cap', sheetName: 'CRK Portfolio',
      dataRange: { categories: `${d}!$A$30:$A$39`, values: [{ name: 'Market Cap', ref: `${d}!$E$30:$E$39`, color: palette[1] }] },
      position: BL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'ptf-br', type: 'doughnut', title: 'Market Overview', sheetName: 'CRK Portfolio',
      dataRange: { categories: `${d}!$A$30:$A$39`, values: [{ name: 'Market Cap', ref: `${d}!$E$30:$E$39` }] },
      position: BR, style: { darkTheme: true, showLegend: true, colors: palette } },
  ];
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  ASSET-SPECIFIC DASHBOARDS                                ║
// ║  Deep dive: technicals + dominance + comparison           ║
// ╚═══════════════════════════════════════════════════════════╝

/** Bitcoin: Area(Price+BB) → Line(Moving Averages) → Line(RSI) → Combo(MACD) */
function getBitcoinCharts(palette: string[]): ChartDefinition[] {
  const t = 'CRK_BTC_Technical';
  return [
    // TL: Price + Bollinger Bands (area chart)
    { id: 'btc-tl', type: 'area', title: 'Price + Bollinger Bands', sheetName: 'CRK Bitcoin',
      dataRange: {
        categories: tRef(t, 'Date'),
        values: [
          sRef('Close', t, 'Close', palette[0]),
          sRef('BB Upper', t, 'BB_Upper', palette[1]),
          sRef('BB Lower', t, 'BB_Lower', palette[2]),
        ],
      },
      position: TL, style: { darkTheme: true, showLegend: true, transparent: true, colors: palette } },
    // TR: Moving Averages (line)
    { id: 'btc-tr', type: 'line', title: 'Moving Averages', sheetName: 'CRK Bitcoin',
      dataRange: {
        categories: tRef(t, 'Date'),
        values: [
          sRef('Close', t, 'Close', palette[0]),
          sRef('SMA(20)', t, 'SMA20', palette[1]),
          sRef('SMA(50)', t, 'SMA50', palette[3]),
          sRef('EMA(12)', t, 'EMA12', palette[4]),
        ],
      },
      position: TR, style: { darkTheme: true, showLegend: true, transparent: true, colors: palette } },
    // BL: RSI(14)
    { id: 'btc-bl', type: 'line', title: 'RSI(14)', sheetName: 'CRK Bitcoin',
      dataRange: {
        categories: tRef(t, 'Date'),
        values: [sRef('RSI', t, 'RSI14', palette[0])],
      },
      position: BL, style: { darkTheme: true, showLegend: false, transparent: true, colors: palette } },
    // BR: MACD + Signal (combo)
    { id: 'btc-br', type: 'combo', title: 'MACD', sheetName: 'CRK Bitcoin',
      dataRange: {
        categories: tRef(t, 'Date'),
        values: [
          sRef('MACD Hist', t, 'MACD_Hist', palette[2]),
          sRef('MACD', t, 'MACD', palette[0]),
          sRef('Signal', t, 'Signal', palette[1]),
        ],
      },
      position: BR, style: { darkTheme: true, showLegend: true, transparent: true, colors: palette } },
  ];
}

/** Ethereum: Area(Price+BB) → Line(Moving Averages) → Line(RSI) → Combo(MACD) */
function getEthereumCharts(palette: string[]): ChartDefinition[] {
  const t = 'CRK_ETH_Technical';
  return [
    { id: 'eth-tl', type: 'area', title: 'Price + Bollinger Bands', sheetName: 'CRK Ethereum',
      dataRange: {
        categories: tRef(t, 'Date'),
        values: [
          sRef('Close', t, 'Close', palette[0]),
          sRef('BB Upper', t, 'BB_Upper', palette[1]),
          sRef('BB Lower', t, 'BB_Lower', palette[2]),
        ],
      },
      position: TL, style: { darkTheme: true, showLegend: true, transparent: true, colors: palette } },
    { id: 'eth-tr', type: 'line', title: 'Moving Averages', sheetName: 'CRK Ethereum',
      dataRange: {
        categories: tRef(t, 'Date'),
        values: [
          sRef('Close', t, 'Close', palette[0]),
          sRef('SMA(20)', t, 'SMA20', palette[1]),
          sRef('SMA(50)', t, 'SMA50', palette[3]),
          sRef('EMA(12)', t, 'EMA12', palette[4]),
        ],
      },
      position: TR, style: { darkTheme: true, showLegend: true, transparent: true, colors: palette } },
    { id: 'eth-bl', type: 'line', title: 'RSI(14)', sheetName: 'CRK Ethereum',
      dataRange: {
        categories: tRef(t, 'Date'),
        values: [sRef('RSI', t, 'RSI14', palette[0])],
      },
      position: BL, style: { darkTheme: true, showLegend: false, transparent: true, colors: palette } },
    { id: 'eth-br', type: 'combo', title: 'MACD', sheetName: 'CRK Ethereum',
      dataRange: {
        categories: tRef(t, 'Date'),
        values: [
          sRef('MACD Hist', t, 'MACD_Hist', palette[2]),
          sRef('MACD', t, 'MACD', palette[0]),
          sRef('Signal', t, 'Signal', palette[1]),
        ],
      },
      position: BR, style: { darkTheme: true, showLegend: true, transparent: true, colors: palette } },
  ];
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  ECOSYSTEM DASHBOARDS                                     ║
// ║  Show composition, distribution, ecosystem health         ║
// ╚═══════════════════════════════════════════════════════════╝

/** DeFi: Bar(MCap ranking) → Doughnut(Protocol share) → Bar(Volume) → Line(MCap vs Volume) */
function getDefiCharts(palette: string[]): ChartDefinition[] {
  const t = 'CRK_DeFi';
  return [
    { id: 'defi-tl', type: 'bar', title: 'Top DeFi by Market Cap', sheetName: 'CRK DeFi',
      dataRange: { categories: tRef(t, 'Name'), values: [sRef('Market Cap', t, 'MarketCap', palette[0])] },
      position: TL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'defi-tr', type: 'doughnut', title: 'DeFi Protocol Share', sheetName: 'CRK DeFi',
      dataRange: { categories: tRef(t, 'Name'), values: [sRef('Market Cap', t, 'MarketCap')] },
      position: TR, style: { darkTheme: true, showLegend: true, colors: palette } },
    { id: 'defi-bl', type: 'bar', title: '24h Trading Volume', sheetName: 'CRK DeFi',
      dataRange: { categories: tRef(t, 'Name'), values: [sRef('Volume', t, 'Volume24h', palette[1])] },
      position: BL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'defi-br', type: 'line', title: 'MCap vs Volume', sheetName: 'CRK DeFi',
      dataRange: { categories: tRef(t, 'Name'), values: [
        sRef('Market Cap', t, 'MarketCap', palette[0]),
        sRef('Volume', t, 'Volume24h', palette[1]),
      ] },
      position: BR, style: { darkTheme: true, showLegend: true, colors: palette } },
  ];
}

/** NFT: Legacy cell-range refs (PQ has metadata only, no numeric chart data) */
function getNftCharts(palette: string[]): ChartDefinition[] {
  const d = "'CRK NFTs Data'";
  return makeGridChartsLegacy({
    prefix: 'nft', visualSheet: 'CRK NFTs', dataSheet: d,
    catCol: 'A', palette,
    tl: { title: 'Top 10 by Volume', type: 'bar', valCol: 'C' },
    tr: { title: 'Volume Distribution', type: 'doughnut', valCol: 'C' },
    bl: { title: 'Floor Price Ranking', type: 'bar', valCol: 'B' },
    br: { title: '24h Performance', type: 'bar', valCol: 'E' },
  });
}

/** Stablecoins: Bar(MCap) → Doughnut(Market share) → Bar(Volume) → Line(Price stability) */
function getStablecoinCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'stable', visualSheet: 'CRK Stablecoins',
    tableName: 'CRK_Stablecoins', catColumn: 'Name', palette,
    tl: { title: 'Market Cap Ranking', type: 'bar', column: 'MarketCap' },
    tr: { title: 'Stablecoin Market Share', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Trading Volume', type: 'bar', column: 'Volume24h' },
    br: { title: 'Price Stability (Peg)', type: 'line', column: 'Price' },
  });
}

/** Categories: Bar(MCap) → Pie(Category share) → Bar(Volume) → Bar(24h%) */
function getCategoriesCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'cats', visualSheet: 'CRK Categories',
    tableName: 'CRK_Categories', catColumn: 'Name', palette,
    tl: { title: 'Top Categories by Market Cap', type: 'bar', column: 'MarketCap' },
    tr: { title: 'Sector Distribution', type: 'pie', column: 'MarketCap' },
    bl: { title: '24h Trading Volume', type: 'bar', column: 'Volume24h' },
    br: { title: '24h Change by Category', type: 'bar', column: 'MarketCapChange24h' },
  });
}

/** Category tokens (RWA, Metaverse, Privacy): Bar(MCap) → Doughnut(Share) → Bar(24h%) → Line(Price) */
function getCategoryTokenCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'cattoken', visualSheet: 'CRK Tokens',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'Market Cap Ranking', type: 'bar', column: 'MarketCap' },
    tr: { title: 'Market Cap Distribution', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Price Change', type: 'bar', column: 'Change24h' },
    br: { title: 'Price Comparison', type: 'line', column: 'Price' },
  });
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  TRADING DASHBOARDS                                       ║
// ║  Decision support: indicators, OI, volatility             ║
// ╚═══════════════════════════════════════════════════════════╝

/** Technical Analysis: Bar(Price) → Doughnut(MCap) → Bar(24h%) → Bar(Volume) */
function getTechnicalCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'tech', visualSheet: 'CRK Technical',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'Price Comparison', type: 'bar', column: 'Price' },
    tr: { title: 'Market Cap Distribution', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Change', type: 'bar', column: 'Change24h',
          series2: { name: '7d Change', column: 'Change7d', colorIdx: 3 } },
    br: { title: 'Trading Volume', type: 'bar', column: 'Volume24h' },
  });
}

/** Derivatives: Bar(OI ranking) → Doughnut(OI share) → Bar(Volume) → Bar(Funding Rate) */
function getDerivativesCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'deriv', visualSheet: 'CRK Derivatives',
    tableName: 'CRK_Derivatives', catColumn: 'Market', palette,
    tl: { title: 'Open Interest Ranking', type: 'bar', column: 'OpenInterest' },
    tr: { title: 'OI Market Share', type: 'doughnut', column: 'OpenInterest' },
    bl: { title: '24h Trading Volume', type: 'bar', column: 'Volume24h' },
    br: { title: 'Funding Rate', type: 'bar', column: 'FundingRate' },
  });
}

/** Liquidations: Bar(OI) → Doughnut(OI share) → Bar(Volume) → Pie(Market share) */
function getLiquidationsCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'liq', visualSheet: 'CRK Liquidations',
    tableName: 'CRK_Derivatives', catColumn: 'Market', palette,
    tl: { title: 'Open Interest', type: 'bar', column: 'OpenInterest' },
    tr: { title: 'OI Distribution', type: 'doughnut', column: 'OpenInterest' },
    bl: { title: '24h Trading Volume', type: 'bar', column: 'Volume24h' },
    br: { title: 'Volume Market Share', type: 'pie', column: 'Volume24h' },
  });
}

/** Volatility: Bar(Price) → Bar(ATH) → Bar(24h%) → Line(Price vs ATH) */
function getVolatilityCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'vol', visualSheet: 'CRK Volatility',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'Current Price', type: 'bar', column: 'Price' },
    tr: { title: 'All-Time High', type: 'bar', column: 'ATH' },
    bl: { title: '24h Change %', type: 'bar', column: 'Change24h' },
    br: { title: 'Price vs ATH', type: 'line', column: 'Price',
          series2: { name: 'ATH', column: 'ATH', colorIdx: 3 } },
  });
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  RANKING DASHBOARDS                                       ║
// ║  Movers, performance comparison, competitive analysis     ║
// ╚═══════════════════════════════════════════════════════════╝

/** Gainers: Bar(24h%) → Doughnut(MCap share) → Bar(Volume) → Line(Price) */
function getGainersCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'gain', visualSheet: 'CRK Gainers',
    tableName: 'CRK_Gainers', catColumn: 'Name', palette,
    tl: { title: '24h Top Performers', type: 'bar', column: 'Change24h' },
    tr: { title: 'Market Cap Share', type: 'doughnut', column: 'MarketCap' },
    bl: { title: 'Trading Volume', type: 'bar', column: 'Volume24h' },
    br: { title: 'Price Comparison', type: 'line', column: 'Price' },
  });
}

/** Trending: Bar(MCap) → Doughnut(Distribution) → Bar(Score) → Bar(Rank) */
function getTrendingCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'trend', visualSheet: 'CRK Trending',
    tableName: 'CRK_Trending', catColumn: 'Name', palette,
    tl: { title: 'Trending — Rank', type: 'bar', column: 'MarketCapRank' },
    tr: { title: 'Trending Score', type: 'bar', column: 'Score' },
    bl: { title: 'Score Distribution', type: 'doughnut', column: 'Score' },
    br: { title: 'Rank Overview', type: 'bar', column: 'MarketCapRank' },
  });
}

/** Meme Coins: Bar(MCap) → Doughnut(Meme market share) → Bar(24h%) → Bar(Volume) */
function getMemeCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'meme', visualSheet: 'CRK Meme Coins',
    tableName: 'CRK_MemeCoins', catColumn: 'Name', palette,
    tl: { title: 'Meme Market Cap', type: 'bar', column: 'MarketCap' },
    tr: { title: 'Meme Market Share', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Price Change', type: 'bar', column: 'Change24h' },
    br: { title: 'Trading Volume', type: 'bar', column: 'Volume24h' },
  });
}

/** AI/Gaming: Bar(MCap) → Doughnut(Distribution) → Bar(24h%) → Line(Price) */
function getAiGamingCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'ai', visualSheet: 'CRK AI Tokens',
    tableName: 'CRK_AI_Tokens', catColumn: 'Name', palette,
    tl: { title: 'AI Token Market Cap', type: 'bar', column: 'MarketCap' },
    tr: { title: 'AI Market Distribution', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Performance', type: 'bar', column: 'Change24h' },
    br: { title: 'Price Comparison', type: 'line', column: 'Price' },
  });
}

/** Altcoin Season: Doughnut(Dominance) → Bar(MCap ranking) → Bar(24h%) → Line(Price) */
function getAltcoinCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'alt', visualSheet: 'CRK Altcoin Season',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'Dominance Distribution', type: 'doughnut', column: 'MarketCap' },
    tr: { title: 'Top Coins by Market Cap', type: 'bar', column: 'MarketCap' },
    bl: { title: '24h Performance', type: 'bar', column: 'Change24h' },
    br: { title: 'Price Trend', type: 'line', column: 'Price' },
  });
}

/** Layer Compare: Bar(MCap) → Doughnut(MCap share) → Bar(24h%) → Line(Price) */
function getLayerCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'layer', visualSheet: 'CRK Layer Compare',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'Market Cap Comparison', type: 'bar', column: 'MarketCap' },
    tr: { title: 'Market Share', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Performance', type: 'bar', column: 'Change24h' },
    br: { title: 'Price Comparison', type: 'line', column: 'Price' },
  });
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  ANALYTICS DASHBOARDS                                     ║
// ║  Sentiment, research, correlation                         ║
// ╚═══════════════════════════════════════════════════════════╝

/** Fear & Greed: Doughnut(Sentiment gauge) → Bar(MCap) → Bar(24h%) → Line(Price) */
function getFearGreedCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'fg', visualSheet: 'CRK Fear & Greed',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'Market Distribution', type: 'doughnut', column: 'MarketCap' },
    tr: { title: 'Top 10 Market Cap', type: 'bar', column: 'MarketCap' },
    bl: { title: '24h Performance', type: 'bar', column: 'Change24h' },
    br: { title: 'Price Trend', type: 'line', column: 'Price' },
  });
}

/** Social Sentiment: Bar(24h gainers) → Doughnut(Distribution) → Bar(MCap) → Line(Price) */
function getSentimentCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'sent', visualSheet: 'CRK Sentiment',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'Top Gainers — 24h', type: 'bar', column: 'Change24h' },
    tr: { title: 'Market Share', type: 'doughnut', column: 'MarketCap' },
    bl: { title: 'Market Cap — Top Coins', type: 'bar', column: 'MarketCap' },
    br: { title: 'Price Comparison', type: 'line', column: 'Price' },
  });
}

/** Correlation: Bar(Price) → Doughnut(MCap share) → Bar(24h%) → Line(Price trend) */
function getCorrelationCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'corr', visualSheet: 'CRK Prices',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'Price Comparison', type: 'bar', column: 'Price' },
    tr: { title: 'Market Cap Distribution', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Change', type: 'bar', column: 'Change24h' },
    br: { title: 'Price Trend', type: 'line', column: 'Price' },
  });
}

/** On-Chain/Whale: Bar(Price) → Doughnut(MCap share) → Bar(24h%) → Bar(MCap) */
function getOnChainCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'onchain', visualSheet: 'CRK On-Chain',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'Price Comparison', type: 'bar', column: 'Price' },
    tr: { title: 'On-Chain Value Distribution', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Change', type: 'bar', column: 'Change24h' },
    br: { title: 'Market Cap Ranking', type: 'bar', column: 'MarketCap' },
  });
}

/** Dev Activity: Bar(Price) → Doughnut(MCap share) → Bar(24h%) → Line(MCap) */
function getDevCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'dev', visualSheet: 'CRK Dev Activity',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'Price Comparison', type: 'bar', column: 'Price' },
    tr: { title: 'Development Ecosystem', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Performance', type: 'bar', column: 'Change24h' },
    br: { title: 'Market Cap Overview', type: 'line', column: 'MarketCap' },
  });
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  INSTITUTIONAL DASHBOARDS                                 ║
// ║  Exchange health, ETF holdings, reserves                  ║
// ╚═══════════════════════════════════════════════════════════╝

/** Exchanges: Bar(Volume) → Doughnut(Volume share) → Bar(Trust) → Bar(Year) */
function getExchangeCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'exch', visualSheet: 'CRK Exchanges',
    tableName: 'CRK_Exchanges', catColumn: 'Name', palette,
    tl: { title: 'Top 10 — 24h Volume', type: 'bar', column: 'Volume24hBTC' },
    tr: { title: 'Volume Market Share', type: 'doughnut', column: 'Volume24hBTC' },
    bl: { title: 'Trust Score', type: 'bar', column: 'TrustScore' },
    br: { title: 'Established Year', type: 'bar', column: 'Year' },
  });
}

/** Exchange Reserves: Same exchange data, reserve-focused titles */
function getExchangeReserveCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'res', visualSheet: 'CRK Exchanges',
    tableName: 'CRK_Exchanges', catColumn: 'Name', palette,
    tl: { title: 'Exchange Volume', type: 'bar', column: 'Volume24hBTC' },
    tr: { title: 'Reserve Distribution', type: 'doughnut', column: 'Volume24hBTC' },
    bl: { title: 'Trust Score', type: 'bar', column: 'TrustScore' },
    br: { title: 'Year Established', type: 'bar', column: 'Year' },
  });
}

/** ETF: Bar(Holdings) → Doughnut(Holdings share) → Bar(Value) → Pie(Value distribution) */
function getEtfCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'etf', visualSheet: 'CRK ETFs',
    tableName: 'CRK_BTC_Companies', catColumn: 'Name', palette,
    tl: { title: 'BTC Holdings by Company', type: 'bar', column: 'TotalHoldings' },
    tr: { title: 'Holdings Distribution', type: 'doughnut', column: 'TotalHoldings' },
    bl: { title: 'Holding Value (USD)', type: 'bar', column: 'TotalCurrentValueUSD' },
    br: { title: 'Value Distribution', type: 'pie', column: 'TotalCurrentValueUSD' },
  });
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  YIELD DASHBOARDS                                         ║
// ║  Income opportunities, staking, DeFi yields               ║
// ╚═══════════════════════════════════════════════════════════╝

/** DeFi Yields: Bar(MCap) → Doughnut(MCap share) → Bar(Volume) → Bar(24h%) */
function getDefiYieldsCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'yield', visualSheet: 'CRK DeFi Yields',
    tableName: 'CRK_DeFi', catColumn: 'Name', palette,
    tl: { title: 'Top Protocols by Market Cap', type: 'bar', column: 'MarketCap' },
    tr: { title: 'Market Cap Distribution', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Volume', type: 'bar', column: 'Volume24h' },
    br: { title: '24h Performance', type: 'bar', column: 'Change24h' },
  });
}

/** Token Unlocks: Bar(Price) → Doughnut(MCap share) → Bar(24h%) → Line(Price trend) */
function getTokenUnlockCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'unlock', visualSheet: 'CRK Token Data',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'Token Prices', type: 'bar', column: 'Price' },
    tr: { title: 'Market Cap Distribution', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Change', type: 'bar', column: 'Change24h' },
    br: { title: 'Price Trend', type: 'line', column: 'Price' },
  });
}

/** Staking: Bar(MCap) → Doughnut(Staking share) → Bar(24h%) → Line(Price) */
function getStakingCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'stake', visualSheet: 'CRK Staking',
    tableName: 'CRK_StakingCoins', catColumn: 'Name', palette,
    tl: { title: 'Staking Market Cap', type: 'bar', column: 'MarketCap' },
    tr: { title: 'Staking Distribution', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Performance', type: 'bar', column: 'Change24h' },
    br: { title: 'Price Comparison', type: 'line', column: 'Price' },
  });
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  TOOLS DASHBOARDS                                         ║
// ║  Mining, custom watchlist                                 ║
// ╚═══════════════════════════════════════════════════════════╝

/** Mining: Bar(MCap) → Doughnut(Distribution) → Bar(24h%) → Line(Price) */
function getMiningCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'mine', visualSheet: 'CRK Mining',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'PoW Market Cap', type: 'bar', column: 'MarketCap' },
    tr: { title: 'PoW Distribution', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Performance', type: 'bar', column: 'Change24h' },
    br: { title: 'Price Comparison', type: 'line', column: 'Price' },
  });
}

/** Custom Watchlist: Bar(Price) → Doughnut(MCap share) → Bar(24h%) → Bar(Volume) */
function getWatchlistCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'cust', visualSheet: 'CRK Watchlist',
    tableName: 'CRK_Market', catColumn: 'Name', palette,
    tl: { title: 'Price Overview', type: 'bar', column: 'Price' },
    tr: { title: 'Market Cap Distribution', type: 'doughnut', column: 'MarketCap' },
    bl: { title: '24h Change', type: 'bar', column: 'Change24h' },
    br: { title: 'Trading Volume', type: 'bar', column: 'Volume24h' },
  });
}

// ============================================
// Legacy helper for dashboards where PQ table
// doesn't have all needed chart columns (NFT).
// Uses hardcoded cell ranges — NOT auto-refreshable.
// ============================================

interface LegacyGridChart {
  title: string;
  type: ChartType;
  valCol: string;
}

function makeGridChartsLegacy(opts: {
  prefix: string;
  visualSheet: string;
  dataSheet: string;
  catCol: string;
  rows?: number;
  tl: LegacyGridChart;
  tr: LegacyGridChart;
  bl: LegacyGridChart;
  br: LegacyGridChart;
  palette: string[];
}): ChartDefinition[] {
  const d = opts.dataSheet;
  const n = opts.rows || 10;
  const r1 = 6;
  const r2 = r1 + n - 1;
  const cat = opts.catCol;
  const p = opts.palette;

  const make = (pos: string, gc: LegacyGridChart, position: typeof TL, idx: number): ChartDefinition => {
    return {
      id: `${opts.prefix}-${pos}`,
      type: gc.type,
      title: gc.title,
      sheetName: opts.visualSheet,
      dataRange: {
        categories: `${d}!$${cat}$${r1}:$${cat}$${r2}`,
        values: [{ name: gc.title, ref: `${d}!$${gc.valCol}$${r1}:$${gc.valCol}$${r2}`, color: p[idx] }],
      },
      position,
      style: { darkTheme: true, showLegend: gc.type === 'doughnut' || gc.type === 'pie', colors: p },
    };
  };

  return [
    make('tl', opts.tl, TL, 0),
    make('tr', opts.tr, TR, 1),
    make('bl', opts.bl, BL, 2),
    make('br', opts.br, BR, 3),
  ];
}
