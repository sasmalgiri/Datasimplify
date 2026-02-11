/**
 * dashboardCharts.ts — Chart definitions per dashboard type (Premium 2x2 Grid)
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
 *
 * Data on data sheets starts at row 6 (after header + section + table headers).
 */

import type { ChartDefinition, ChartType } from './chartInjector';
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
// Helper: Generate 4 charts in 2x2 grid
// ============================================

interface GridChart {
  title: string;
  type: ChartType;
  valCol: string;
  /** Optional second series (multi-series line/bar) */
  series2?: { name: string; valCol: string; colorIdx?: number };
  colorIdx?: number;
  showLegend?: boolean;
}

function makeGridCharts(opts: {
  prefix: string;
  visualSheet: string;
  dataSheet: string;
  catCol: string;
  rows?: number;
  tl: GridChart;
  tr: GridChart;
  bl: GridChart;
  br: GridChart;
  palette: string[];
}): ChartDefinition[] {
  const d = `'${opts.dataSheet}'`;
  const n = opts.rows || 10;
  const r1 = 6;
  const r2 = r1 + n - 1;
  const cat = opts.catCol;
  const p = opts.palette;

  const make = (pos: string, gc: GridChart, position: typeof TL, idx: number): ChartDefinition => {
    const values: Array<{ name: string; ref: string; color?: string }> = [
      { name: gc.title, ref: `${d}!$${gc.valCol}$${r1}:$${gc.valCol}$${r2}`, color: p[gc.colorIdx ?? idx] },
    ];

    // Multi-series support
    if (gc.series2) {
      values.push({
        name: gc.series2.name,
        ref: `${d}!$${gc.series2.valCol}$${r1}:$${gc.series2.valCol}$${r2}`,
        color: p[gc.series2.colorIdx ?? ((gc.colorIdx ?? idx) + 1)],
      });
    }

    const isMultiSeries = !!gc.series2;
    const isDonut = gc.type === 'doughnut' || gc.type === 'pie';

    return {
      id: `${opts.prefix}-${pos}`,
      type: gc.type,
      title: gc.title,
      sheetName: opts.visualSheet,
      dataRange: {
        categories: `${d}!$${cat}$${r1}:$${cat}$${r2}`,
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
  const d = "'CRK Data'";
  return [
    { id: 'mkt-tl', type: 'bar', title: 'Top 10 by Market Cap', sheetName: 'CRK Dashboard',
      dataRange: { categories: `${d}!$B$6:$B$15`, values: [{ name: 'Market Cap', ref: `${d}!$E$6:$E$15`, color: palette[0] }] },
      position: TL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'mkt-tr', type: 'doughnut', title: 'Market Cap Distribution', sheetName: 'CRK Dashboard',
      dataRange: { categories: `${d}!$B$6:$B$15`, values: [{ name: 'Market Cap', ref: `${d}!$E$6:$E$15` }] },
      position: TR, style: { darkTheme: true, showLegend: true, colors: palette } },
    { id: 'mkt-bl', type: 'bar', title: '24h Price Change %', sheetName: 'CRK Dashboard',
      dataRange: { categories: `${d}!$B$6:$B$15`, values: [{ name: '24h Change', ref: `${d}!$F$6:$F$15`, color: palette[1] }] },
      position: BL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'mkt-br', type: 'line', title: 'Price Comparison', sheetName: 'CRK Dashboard',
      dataRange: { categories: `${d}!$B$6:$B$15`, values: [{ name: 'Price', ref: `${d}!$D$6:$D$15`, color: palette[2] }] },
      position: BR, style: { darkTheme: true, showLegend: false, colors: palette } },
  ];
}

/** Screener: Bar(MCap Top 20) → Doughnut(Share) → Bar(24h%) → Bar(7d%) */
function getScreenerCharts(palette: string[]): ChartDefinition[] {
  const d = "'CRK Screener Data'";
  return [
    { id: 'scr-tl', type: 'bar', title: 'Top 20 by Market Cap', sheetName: 'CRK Screener',
      dataRange: { categories: `${d}!$B$6:$B$25`, values: [{ name: 'Market Cap', ref: `${d}!$E$6:$E$25`, color: palette[0] }] },
      position: TL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'scr-tr', type: 'doughnut', title: 'Market Share (Top 10)', sheetName: 'CRK Screener',
      dataRange: { categories: `${d}!$B$6:$B$15`, values: [{ name: 'Market Cap', ref: `${d}!$E$6:$E$15` }] },
      position: TR, style: { darkTheme: true, showLegend: true, colors: palette } },
    { id: 'scr-bl', type: 'bar', title: '24h Change — Top 20', sheetName: 'CRK Screener',
      dataRange: { categories: `${d}!$B$6:$B$25`, values: [{ name: '24h Change', ref: `${d}!$F$6:$F$25`, color: palette[1] }] },
      position: BL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'scr-br', type: 'bar', title: '7d Change — Top 20', sheetName: 'CRK Screener',
      dataRange: { categories: `${d}!$B$6:$B$25`, values: [{ name: '7d Change', ref: `${d}!$G$6:$G$25`, color: palette[3] }] },
      position: BR, style: { darkTheme: true, showLegend: false, colors: palette } },
  ];
}

/** Portfolio: Doughnut(Allocation hero) → Bar(Holdings) → Bar(Top MCap) → Doughnut(Market) */
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

/** Bitcoin: Bar(Technicals) → Doughnut(BTC vs Market) → Line(Moving Avg) → Bar(Comparison) */
function getBitcoinCharts(palette: string[]): ChartDefinition[] {
  const d = "'CRK Bitcoin Data'";
  return [
    { id: 'btc-tl', type: 'bar', title: 'Technical Indicators', sheetName: 'CRK Bitcoin',
      dataRange: { categories: `${d}!$B$6:$B$12`, values: [{ name: 'Value', ref: `${d}!$C$6:$C$12`, color: palette[0] }] },
      position: TL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'btc-tr', type: 'doughnut', title: 'BTC vs Market', sheetName: 'CRK Bitcoin',
      dataRange: { categories: `${d}!$B$16:$B$25`, values: [{ name: 'Market Cap', ref: `${d}!$E$16:$E$25` }] },
      position: TR, style: { darkTheme: true, showLegend: true, colors: palette } },
    { id: 'btc-bl', type: 'line', title: 'Moving Averages', sheetName: 'CRK Bitcoin',
      dataRange: { categories: `${d}!$B$7:$B$10`, values: [{ name: 'Value', ref: `${d}!$C$7:$C$10`, color: palette[1] }] },
      position: BL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'btc-br', type: 'bar', title: 'Top Coins Comparison', sheetName: 'CRK Bitcoin',
      dataRange: { categories: `${d}!$B$16:$B$25`, values: [{ name: 'Price', ref: `${d}!$D$16:$D$25`, color: palette[2] }] },
      position: BR, style: { darkTheme: true, showLegend: false, colors: palette } },
  ];
}

/** Ethereum: Bar(Technicals) → Doughnut(DeFi Ecosystem) → Line(Moving Avg) → Bar(DeFi TVL) */
function getEthereumCharts(palette: string[]): ChartDefinition[] {
  const d = "'CRK Ethereum Data'";
  return [
    { id: 'eth-tl', type: 'bar', title: 'ETH Technical Indicators', sheetName: 'CRK Ethereum',
      dataRange: { categories: `${d}!$B$6:$B$12`, values: [{ name: 'Value', ref: `${d}!$C$6:$C$12`, color: palette[0] }] },
      position: TL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'eth-tr', type: 'doughnut', title: 'ETH vs DeFi Ecosystem', sheetName: 'CRK Ethereum',
      dataRange: { categories: `${d}!$A$16:$A$25`, values: [{ name: 'TVL', ref: `${d}!$B$16:$B$25` }] },
      position: TR, style: { darkTheme: true, showLegend: true, colors: palette } },
    { id: 'eth-bl', type: 'line', title: 'Moving Averages', sheetName: 'CRK Ethereum',
      dataRange: { categories: `${d}!$B$7:$B$10`, values: [{ name: 'Value', ref: `${d}!$C$7:$C$10`, color: palette[1] }] },
      position: BL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'eth-br', type: 'bar', title: 'DeFi Protocol TVL', sheetName: 'CRK Ethereum',
      dataRange: { categories: `${d}!$A$16:$A$25`, values: [{ name: 'TVL', ref: `${d}!$B$16:$B$25`, color: palette[2] }] },
      position: BR, style: { darkTheme: true, showLegend: false, colors: palette } },
  ];
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  ECOSYSTEM DASHBOARDS                                     ║
// ║  Show composition, distribution, ecosystem health         ║
// ╚═══════════════════════════════════════════════════════════╝

/** DeFi: Bar(TVL ranking) → Doughnut(Protocol share) → Bar(Volume) → Line(TVL vs Volume multi-series) */
function getDefiCharts(palette: string[]): ChartDefinition[] {
  const d = "'CRK DeFi Data'";
  return [
    { id: 'defi-tl', type: 'bar', title: 'Top 10 Protocols by TVL', sheetName: 'CRK DeFi',
      dataRange: { categories: `${d}!$A$6:$A$15`, values: [{ name: 'TVL', ref: `${d}!$C$6:$C$15`, color: palette[0] }] },
      position: TL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'defi-tr', type: 'doughnut', title: 'Protocol Distribution', sheetName: 'CRK DeFi',
      dataRange: { categories: `${d}!$A$6:$A$15`, values: [{ name: 'TVL', ref: `${d}!$C$6:$C$15` }] },
      position: TR, style: { darkTheme: true, showLegend: true, colors: palette } },
    { id: 'defi-bl', type: 'bar', title: 'DeFi 24h Volume', sheetName: 'CRK DeFi',
      dataRange: { categories: `${d}!$A$6:$A$15`, values: [{ name: 'Volume', ref: `${d}!$D$6:$D$15`, color: palette[1] }] },
      position: BL, style: { darkTheme: true, showLegend: false, colors: palette } },
    { id: 'defi-br', type: 'line', title: 'TVL vs Volume', sheetName: 'CRK DeFi',
      dataRange: { categories: `${d}!$A$6:$A$15`, values: [
        { name: 'TVL', ref: `${d}!$C$6:$C$15`, color: palette[0] },
        { name: 'Volume', ref: `${d}!$D$6:$D$15`, color: palette[2] },
      ] },
      position: BR, style: { darkTheme: true, showLegend: true, colors: palette } },
  ];
}

/** NFT: Bar(Volume ranking) → Doughnut(Volume share) → Bar(Floor price) → Line(24h trend) */
function getNftCharts(palette: string[]): ChartDefinition[] {
  // Collection(A) Floor(B) Volume(C) Owners(D) 24h%(E) — data row 6+
  return makeGridCharts({
    prefix: 'nft', visualSheet: 'CRK NFTs', dataSheet: 'CRK NFTs Data',
    catCol: 'A', palette,
    tl: { title: 'Top 10 by Volume', type: 'bar', valCol: 'C' },
    tr: { title: 'Volume Distribution', type: 'doughnut', valCol: 'C' },
    bl: { title: 'Floor Price Ranking', type: 'bar', valCol: 'B' },
    br: { title: '24h Performance', type: 'bar', valCol: 'E' },
  });
}

/** Stablecoins: Bar(MCap) → Doughnut(Market share) → Bar(Volume) → Line(Price stability) */
function getStablecoinCharts(palette: string[]): ChartDefinition[] {
  // Name(A) Price(B) MCap(C) Volume(D) 24h%(E)
  return makeGridCharts({
    prefix: 'stable', visualSheet: 'CRK Stablecoins', dataSheet: 'CRK Stablecoins Data',
    catCol: 'A', palette,
    tl: { title: 'Market Cap Ranking', type: 'bar', valCol: 'C' },
    tr: { title: 'Stablecoin Market Share', type: 'doughnut', valCol: 'C' },
    bl: { title: '24h Trading Volume', type: 'bar', valCol: 'D' },
    br: { title: 'Price Stability (Peg)', type: 'line', valCol: 'B' },  // Line shows peg deviation
  });
}

/** Categories: Bar(MCap) → Pie(Category share) → Bar(Volume) → Bar(24h%) */
function getCategoriesCharts(palette: string[]): ChartDefinition[] {
  // Category(A) MCap(B) Volume(C) 24h%(D) Coins(E)
  return makeGridCharts({
    prefix: 'cats', visualSheet: 'CRK Categories', dataSheet: 'CRK Categories Data',
    catCol: 'A', palette,
    tl: { title: 'Top Categories by Market Cap', type: 'bar', valCol: 'B' },
    tr: { title: 'Sector Distribution', type: 'pie', valCol: 'B' },
    bl: { title: '24h Trading Volume', type: 'bar', valCol: 'C' },
    br: { title: '24h Change by Category', type: 'bar', valCol: 'D' },
  });
}

/** Category tokens (RWA, Metaverse, Privacy): Bar(MCap) → Doughnut(Share) → Bar(24h%) → Line(Price) */
function getCategoryTokenCharts(palette: string[]): ChartDefinition[] {
  // Uses TOP() → #(A) Name(B) Symbol(C) Price(D) MCap(E) 24h%(F) 7d%(G)
  return makeGridCharts({
    prefix: 'cattoken', visualSheet: 'CRK Tokens', dataSheet: 'CRK Tokens Data',
    catCol: 'B', palette,
    tl: { title: 'Market Cap Ranking', type: 'bar', valCol: 'E' },
    tr: { title: 'Market Cap Distribution', type: 'doughnut', valCol: 'E' },
    bl: { title: '24h Price Change', type: 'bar', valCol: 'F' },
    br: { title: 'Price Comparison', type: 'line', valCol: 'D' },
  });
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  TRADING DASHBOARDS                                       ║
// ║  Decision support: indicators, OI, volatility             ║
// ╚═══════════════════════════════════════════════════════════╝

/**
 * Technical Analysis: Bar(RSI) → Bar(Price) → Line(SMA vs EMA multi-series) → Line(MACD)
 * Key: Moving averages use LINE charts, not bars — per other-levels design principles.
 */
function getTechnicalCharts(palette: string[]): ChartDefinition[] {
  // Coin(A) Price(B) RSI(C) SMA(D) EMA(E) BBU(F) BBL(G) MACD(H)
  return makeGridCharts({
    prefix: 'tech', visualSheet: 'CRK Technical', dataSheet: 'CRK Technical Data',
    catCol: 'A', palette,
    tl: { title: 'RSI Comparison', type: 'bar', valCol: 'C' },
    tr: { title: 'Price Comparison', type: 'bar', valCol: 'B' },
    bl: { title: 'SMA vs EMA', type: 'line', valCol: 'D',             // LINE for moving averages
          series2: { name: 'EMA(20)', valCol: 'E', colorIdx: 3 } },   // Multi-series: SMA + EMA
    br: { title: 'MACD Signal', type: 'line', valCol: 'H' },          // LINE for oscillator
  });
}

/** Derivatives: Bar(OI ranking) → Doughnut(OI share) → Bar(Volume) → Bar(Trust) */
function getDerivativesCharts(palette: string[]): ChartDefinition[] {
  // Exchange(A) OI(B) 24hVol(C) Pairs(D) Trust(E)
  return makeGridCharts({
    prefix: 'deriv', visualSheet: 'CRK Derivatives', dataSheet: 'CRK Derivatives Data',
    catCol: 'A', palette,
    tl: { title: 'Open Interest Ranking', type: 'bar', valCol: 'B' },
    tr: { title: 'OI Market Share', type: 'doughnut', valCol: 'B' },
    bl: { title: '24h Trading Volume', type: 'bar', valCol: 'C' },
    br: { title: 'Trust Score', type: 'bar', valCol: 'E' },
  });
}

/** Liquidations: Bar(OI) → Doughnut(OI share) → Bar(Volume) → Pie(Market share) */
function getLiquidationsCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'liq', visualSheet: 'CRK Liquidations', dataSheet: 'CRK Liquidations Data',
    catCol: 'A', palette,
    tl: { title: 'Open Interest', type: 'bar', valCol: 'B' },
    tr: { title: 'OI Distribution', type: 'doughnut', valCol: 'B' },
    bl: { title: '24h Trading Volume', type: 'bar', valCol: 'C' },
    br: { title: 'Volume Market Share', type: 'pie', valCol: 'C' },
  });
}

/** Volatility: Bar(Price vs ATH) → Doughnut(ATH distribution) → Bar(24h%) → Line(Price trend) */
function getVolatilityCharts(palette: string[]): ChartDefinition[] {
  // Coin(A) Price(B) 24h%(C) ATH(D)
  return makeGridCharts({
    prefix: 'vol', visualSheet: 'CRK Volatility', dataSheet: 'CRK Volatility Data',
    catCol: 'A', palette,
    tl: { title: 'Current Price', type: 'bar', valCol: 'B' },
    tr: { title: 'All-Time High', type: 'bar', valCol: 'D' },
    bl: { title: '24h Change %', type: 'bar', valCol: 'C' },
    br: { title: 'Price vs ATH', type: 'line', valCol: 'B',                  // Multi-series line
          series2: { name: 'ATH', valCol: 'D', colorIdx: 3 } },              // Price vs ATH comparison
  });
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  RANKING DASHBOARDS                                       ║
// ║  Movers, performance comparison, competitive analysis     ║
// ╚═══════════════════════════════════════════════════════════╝

/**
 * Gainers: Bar(24h% — THE key metric first) → Doughnut(MCap share) → Bar(7d%) → Line(Price)
 * The 24h change is the hero chart for a gainers dashboard.
 */
function getGainersCharts(palette: string[]): ChartDefinition[] {
  // TOP() → #(A) Name(B) Symbol(C) Price(D) MCap(E) 24h%(F) 7d%(G)
  return makeGridCharts({
    prefix: 'gain', visualSheet: 'CRK Gainers', dataSheet: 'CRK Gainers Data',
    catCol: 'B', rows: 20, palette,
    tl: { title: '24h Top Performers', type: 'bar', valCol: 'F' },           // HERO: 24h change
    tr: { title: 'Market Cap Share', type: 'doughnut', valCol: 'E' },
    bl: { title: '7d Performance', type: 'bar', valCol: 'G' },
    br: { title: 'Price Comparison', type: 'line', valCol: 'D' },            // Line for price trend
  });
}

/** Trending: Bar(MCap) → Doughnut(Distribution) → Bar(Price) → Bar(Score) */
function getTrendingCharts(palette: string[]): ChartDefinition[] {
  // Name(A) Symbol(B) Price(C) MCap(D) Score(E)
  return makeGridCharts({
    prefix: 'trend', visualSheet: 'CRK Trending', dataSheet: 'CRK Trending Data',
    catCol: 'A', rows: 7, palette,
    tl: { title: 'Trending — Market Cap', type: 'bar', valCol: 'D' },
    tr: { title: 'Trending Distribution', type: 'doughnut', valCol: 'D' },
    bl: { title: 'Price Ranking', type: 'bar', valCol: 'C' },
    br: { title: 'Trending Score', type: 'bar', valCol: 'E' },
  });
}

/**
 * Meme Coins: Bar(MCap ranking) → Doughnut(Meme market share) → Bar(24h%) → Line(7d trend)
 * Line chart for 7d% shows weekly momentum trend.
 */
function getMemeCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'meme', visualSheet: 'CRK Meme Coins', dataSheet: 'CRK Meme Coins Data',
    catCol: 'B', palette,
    tl: { title: 'Meme Market Cap', type: 'bar', valCol: 'E' },
    tr: { title: 'Meme Market Share', type: 'doughnut', valCol: 'E' },
    bl: { title: '24h Price Change', type: 'bar', valCol: 'F' },
    br: { title: '7d Trend', type: 'line', valCol: 'G' },                    // Line for weekly trend
  });
}

/** AI/Gaming: Bar(MCap) → Doughnut(Distribution) → Bar(24h%) → Line(Price) */
function getAiGamingCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'ai', visualSheet: 'CRK AI Tokens', dataSheet: 'CRK AI Tokens Data',
    catCol: 'B', palette,
    tl: { title: 'AI Token Market Cap', type: 'bar', valCol: 'E' },
    tr: { title: 'AI Market Distribution', type: 'doughnut', valCol: 'E' },
    bl: { title: '24h Performance', type: 'bar', valCol: 'F' },
    br: { title: 'Price Comparison', type: 'line', valCol: 'D' },
  });
}

/**
 * Altcoin Season: Doughnut(Dominance — hero gauge) → Bar(MCap ranking) → Bar(24h%) → Line(Price)
 * Doughnut as hero shows market dominance distribution (the core altcoin season metric).
 */
function getAltcoinCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'alt', visualSheet: 'CRK Altcoin Season', dataSheet: 'CRK Altcoin Season Data',
    catCol: 'B', palette,
    tl: { title: 'Dominance Distribution', type: 'doughnut', valCol: 'E' },  // HERO: dominance gauge
    tr: { title: 'Top Coins by Market Cap', type: 'bar', valCol: 'E' },
    bl: { title: '24h Performance', type: 'bar', valCol: 'F' },
    br: { title: 'Price Trend', type: 'line', valCol: 'D' },
  });
}

/**
 * Layer Compare: Bar(MCap) → Doughnut(MCap share) → Line(RSI analysis) → Bar(24h%)
 * RSI uses LINE chart — it's a continuous oscillator, not a discrete ranking.
 */
function getLayerCharts(palette: string[]): ChartDefinition[] {
  // Coin(A) Price(B) 24h%(C) MCap(D) RSI(E)
  return makeGridCharts({
    prefix: 'layer', visualSheet: 'CRK Layer Compare', dataSheet: 'CRK Layer Compare Data',
    catCol: 'A', palette,
    tl: { title: 'Market Cap Comparison', type: 'bar', valCol: 'D' },
    tr: { title: 'Market Share', type: 'doughnut', valCol: 'D' },
    bl: { title: 'RSI Analysis', type: 'line', valCol: 'E' },                // LINE for oscillator
    br: { title: '24h Performance', type: 'bar', valCol: 'C' },
  });
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  ANALYTICS DASHBOARDS                                     ║
// ║  Sentiment, research, correlation                         ║
// ╚═══════════════════════════════════════════════════════════╝

/**
 * Fear & Greed: Doughnut(Sentiment gauge — hero) → Bar(MCap) → Bar(24h%) → Line(Price)
 * Doughnut as hero mimics a "gauge meter" for sentiment — primary dashboard purpose.
 */
function getFearGreedCharts(palette: string[]): ChartDefinition[] {
  // Data sheet: TOP(10) → #(A) Name(B) Symbol(C) Price(D) MCap(E) 24h%(F) 7d%(G)
  return makeGridCharts({
    prefix: 'fg', visualSheet: 'CRK Fear & Greed', dataSheet: 'CRK Fear Greed Data',
    catCol: 'B', palette,
    tl: { title: 'Market Distribution', type: 'doughnut', valCol: 'E' },     // HERO: gauge-like
    tr: { title: 'Top 10 Market Cap', type: 'bar', valCol: 'E' },
    bl: { title: '24h Performance', type: 'bar', valCol: 'F' },
    br: { title: 'Price Trend', type: 'line', valCol: 'D' },
  });
}

/** Social Sentiment: Bar(24h gainers — key signal) → Doughnut(Distribution) → Bar(MCap) → Line(Price) */
function getSentimentCharts(palette: string[]): ChartDefinition[] {
  // Data sheet: GAINERS(20) → #(A) Name(B) Symbol(C) Price(D) MCap(E) 24h%(F) 7d%(G)
  return makeGridCharts({
    prefix: 'sent', visualSheet: 'CRK Sentiment', dataSheet: 'CRK Sentiment Data',
    catCol: 'B', palette,
    tl: { title: 'Top Gainers — 24h', type: 'bar', valCol: 'F' },            // HERO: biggest movers
    tr: { title: 'Gainers Market Share', type: 'doughnut', valCol: 'E' },
    bl: { title: 'Market Cap — Top Gainers', type: 'bar', valCol: 'E' },
    br: { title: 'Price Comparison', type: 'line', valCol: 'D' },
  });
}

/** Correlation: Bar(Price) → Doughnut(MCap share) → Bar(24h%) → Line(Price trend) */
function getCorrelationCharts(palette: string[]): ChartDefinition[] {
  // Coin(A) Price(B) 24h%(C) MCap(D)
  return makeGridCharts({
    prefix: 'corr', visualSheet: 'CRK Prices', dataSheet: 'CRK Prices Data',
    catCol: 'A', palette,
    tl: { title: 'Price Comparison', type: 'bar', valCol: 'B' },
    tr: { title: 'Market Cap Distribution', type: 'doughnut', valCol: 'D' },
    bl: { title: '24h Change', type: 'bar', valCol: 'C' },
    br: { title: 'Price Trend', type: 'line', valCol: 'B' },                 // Line for correlation
  });
}

/** On-Chain/Whale: Bar(Price) → Doughnut(MCap share) → Bar(24h%) → Line(Price trend) */
function getOnChainCharts(palette: string[]): ChartDefinition[] {
  // Coin(A) Price(B) 24h%(C) MCap(D)
  return makeGridCharts({
    prefix: 'onchain', visualSheet: 'CRK On-Chain', dataSheet: 'CRK On-Chain Data',
    catCol: 'A', palette,
    tl: { title: 'Price Comparison', type: 'bar', valCol: 'B' },
    tr: { title: 'On-Chain Value Distribution', type: 'doughnut', valCol: 'D' },
    bl: { title: '24h Change', type: 'bar', valCol: 'C' },
    br: { title: 'Market Cap Ranking', type: 'bar', valCol: 'D' },
  });
}

/** Dev Activity: Bar(Price) → Doughnut(MCap share) → Bar(24h%) → Line(Price trend) */
function getDevCharts(palette: string[]): ChartDefinition[] {
  // Coin(A) Price(B) 24h%(C) MCap(D)
  return makeGridCharts({
    prefix: 'dev', visualSheet: 'CRK Dev Activity', dataSheet: 'CRK Dev Activity Data',
    catCol: 'A', palette,
    tl: { title: 'Price Comparison', type: 'bar', valCol: 'B' },
    tr: { title: 'Development Ecosystem', type: 'doughnut', valCol: 'D' },
    bl: { title: '24h Performance', type: 'bar', valCol: 'C' },
    br: { title: 'Market Cap Overview', type: 'line', valCol: 'D' },         // Line for trend
  });
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  INSTITUTIONAL DASHBOARDS                                 ║
// ║  Exchange health, ETF holdings, reserves                  ║
// ╚═══════════════════════════════════════════════════════════╝

/** Exchanges: Bar(Volume ranking) → Doughnut(Volume share) → Bar(Pairs) → Bar(Trust) */
function getExchangeCharts(palette: string[]): ChartDefinition[] {
  // Exchange(A) Trust(B) 24hVol(C) Pairs(D) Year(E)
  return makeGridCharts({
    prefix: 'exch', visualSheet: 'CRK Exchanges', dataSheet: 'CRK Exchanges Data',
    catCol: 'A', palette,
    tl: { title: 'Top 10 — 24h Volume', type: 'bar', valCol: 'C' },
    tr: { title: 'Volume Market Share', type: 'doughnut', valCol: 'C' },
    bl: { title: 'Trading Pairs Count', type: 'bar', valCol: 'D' },
    br: { title: 'Trust Score', type: 'bar', valCol: 'B' },
  });
}

/** Exchange Reserves: Same exchange data, reserve-focused titles */
function getExchangeReserveCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'res', visualSheet: 'CRK Exchanges', dataSheet: 'CRK Exchanges Data',
    catCol: 'A', palette,
    tl: { title: 'Exchange Volume', type: 'bar', valCol: 'C' },
    tr: { title: 'Reserve Distribution', type: 'doughnut', valCol: 'C' },
    bl: { title: 'Trading Pairs', type: 'bar', valCol: 'D' },
    br: { title: 'Trust Score', type: 'bar', valCol: 'B' },
  });
}

/** ETF: Bar(Holdings) → Doughnut(Holdings share) → Bar(Value) → Pie(Value distribution) */
function getEtfCharts(palette: string[]): ChartDefinition[] {
  // Company(A) Symbol(B) Holdings(C) Value(D) Country(E)
  return makeGridCharts({
    prefix: 'etf', visualSheet: 'CRK ETFs', dataSheet: 'CRK ETFs Data',
    catCol: 'A', palette,
    tl: { title: 'BTC Holdings by Company', type: 'bar', valCol: 'C' },
    tr: { title: 'Holdings Distribution', type: 'doughnut', valCol: 'C' },
    bl: { title: 'Holding Value (USD)', type: 'bar', valCol: 'D' },
    br: { title: 'Value Distribution', type: 'pie', valCol: 'D' },
  });
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  YIELD DASHBOARDS                                         ║
// ║  Income opportunities, staking, DeFi yields               ║
// ╚═══════════════════════════════════════════════════════════╝

/** DeFi Yields: Bar(TVL) → Doughnut(TVL share) → Bar(Volume) → Line(24h trend) */
function getDefiYieldsCharts(palette: string[]): ChartDefinition[] {
  // Protocol(A) Chain(B) TVL(C) Volume(D) 24h%(E)
  return makeGridCharts({
    prefix: 'yield', visualSheet: 'CRK DeFi Yields', dataSheet: 'CRK DeFi Yields Data',
    catCol: 'A', palette,
    tl: { title: 'Top Protocols by TVL', type: 'bar', valCol: 'C' },
    tr: { title: 'TVL Distribution', type: 'doughnut', valCol: 'C' },
    bl: { title: '24h Volume', type: 'bar', valCol: 'D' },
    br: { title: '24h Performance', type: 'bar', valCol: 'E' },
  });
}

/** Token Unlocks: Bar(Price) → Doughnut(MCap share) → Bar(24h%) → Line(Price trend) */
function getTokenUnlockCharts(palette: string[]): ChartDefinition[] {
  // Coin(A) Price(B) 24h%(C) MCap(D)
  return makeGridCharts({
    prefix: 'unlock', visualSheet: 'CRK Token Data', dataSheet: 'CRK Token Data Data',
    catCol: 'A', palette,
    tl: { title: 'Token Prices', type: 'bar', valCol: 'B' },
    tr: { title: 'Market Cap Distribution', type: 'doughnut', valCol: 'D' },
    bl: { title: '24h Change', type: 'bar', valCol: 'C' },
    br: { title: 'Price Trend', type: 'line', valCol: 'B' },
  });
}

/** Staking: Bar(MCap) → Doughnut(Staking share) → Bar(24h%) → Line(Price) */
function getStakingCharts(palette: string[]): ChartDefinition[] {
  // TOP() → #(A) Name(B) Symbol(C) Price(D) MCap(E) 24h%(F) 7d%(G)
  return makeGridCharts({
    prefix: 'stake', visualSheet: 'CRK Staking', dataSheet: 'CRK Staking Data',
    catCol: 'B', palette,
    tl: { title: 'Staking Market Cap', type: 'bar', valCol: 'E' },
    tr: { title: 'Staking Distribution', type: 'doughnut', valCol: 'E' },
    bl: { title: '24h Performance', type: 'bar', valCol: 'F' },
    br: { title: 'Price Comparison', type: 'line', valCol: 'D' },
  });
}

// ╔═══════════════════════════════════════════════════════════╗
// ║  TOOLS DASHBOARDS                                         ║
// ║  Mining, custom watchlist                                 ║
// ╚═══════════════════════════════════════════════════════════╝

/** Mining: Bar(PoW MCap) → Doughnut(PoW distribution) → Bar(24h%) → Line(Price) */
function getMiningCharts(palette: string[]): ChartDefinition[] {
  return makeGridCharts({
    prefix: 'mine', visualSheet: 'CRK Mining', dataSheet: 'CRK Mining Data',
    catCol: 'B', palette,
    tl: { title: 'PoW Market Cap', type: 'bar', valCol: 'E' },
    tr: { title: 'PoW Distribution', type: 'doughnut', valCol: 'E' },
    bl: { title: '24h Performance', type: 'bar', valCol: 'F' },
    br: { title: 'Price Comparison', type: 'line', valCol: 'D' },
  });
}

/** Custom Watchlist: Bar(Price) → Doughnut(MCap share) → Bar(24h%) → Bar(Volume) */
function getWatchlistCharts(palette: string[]): ChartDefinition[] {
  // Coin(A) Price(B) 24h%(C) MCap(D) Volume(E)
  return makeGridCharts({
    prefix: 'cust', visualSheet: 'CRK Watchlist', dataSheet: 'CRK Watchlist Data',
    catCol: 'A', palette,
    tl: { title: 'Price Overview', type: 'bar', valCol: 'B' },
    tr: { title: 'Market Cap Distribution', type: 'doughnut', valCol: 'D' },
    bl: { title: '24h Change', type: 'bar', valCol: 'C' },
    br: { title: 'Trading Volume', type: 'bar', valCol: 'E' },
  });
}
