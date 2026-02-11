/**
 * CRK Dashboard Sheets — Professional Dark Theme
 *
 * ALL dashboards use professional dark-themed layouts with:
 * - Dark background fills from CATEGORY_THEMES
 * - KPI metric cards with accent borders
 * - Themed section dividers and table headers
 * - Zebra-striped data rows
 * - Conditional formatting (green/red %, data bars, color scales)
 * - Freeze panes for data scrolling
 * - Native Excel charts (via chartInjector post-processing)
 *
 * Dual-mode: same xlsx has both CRK formulas AND Power Query connections.
 */

import ExcelJS from 'exceljs';
import type { DashboardType } from './masterGenerator';
import {
  initDarkSheet,
  addHeaderBar,
  addKPICards,
  addSectionDivider,
  addTableHeaders,
  addZebraRows,
  addPercentFormatting,
  addDataBars,
  addColorScale,
  addChartGrid,
  placeSpillFormula,
  addMetricRow,
  COMPACT_USD,
  type KPICardDef,
  type DashboardTheme,
} from './dashboardStyles';

// ============================================
// REUSABLE CONSTANTS
// ============================================

/** Standard market KPI cards used by most dashboards */
const MARKET_KPIS: KPICardDef[] = [
  { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
  { title: '24H VOLUME', formula: 'GLOBAL("total_volume")', format: COMPACT_USD },
  { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  { title: 'FEAR & GREED', formula: 'FEARGREED()' },
];

/** DeFi-focused KPI cards */
const DEFI_KPIS: KPICardDef[] = [
  { title: 'DEFI MARKET CAP', formula: 'DEFI_GLOBAL("market_cap")', format: COMPACT_USD },
  { title: 'DEFI VOLUME', formula: 'DEFI_GLOBAL("volume")', format: COMPACT_USD },
  { title: 'DEFI DOMINANCE', formula: 'DEFI_GLOBAL("dominance")', format: '0.00"%"' },
  { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
];

/** Sentiment-focused KPI cards */
const SENTIMENT_KPIS: KPICardDef[] = [
  { title: 'FEAR & GREED', formula: 'FEARGREED()' },
  { title: 'SENTIMENT', formula: 'FEARGREED("class")' },
  { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
];

/** Gainers/Losers — emphasize market momentum */
const GAINERS_KPIS: KPICardDef[] = [
  { title: 'BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
  { title: 'ETH PRICE', formula: 'PRICE("ethereum")', format: '$#,##0.00', changeFormula: 'CHANGE("ethereum", "24h")' },
  { title: 'MARKET CAP CHG', formula: 'GLOBAL("market_cap_change_percentage_24h_usd")', format: '0.00"%"' },
  { title: 'FEAR & GREED', formula: 'FEARGREED()' },
];

/** Trending — discovery focus */
const TRENDING_KPIS: KPICardDef[] = [
  { title: 'BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
  { title: 'ACTIVE COINS', formula: 'GLOBAL("active_cryptocurrencies")' },
  { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  { title: 'FEAR & GREED', formula: 'FEARGREED()' },
];

/** Meme coins — fun but data-driven */
const MEME_KPIS: KPICardDef[] = [
  { title: 'DOGE PRICE', formula: 'PRICE("dogecoin")', format: '$#,##0.0000', changeFormula: 'CHANGE("dogecoin", "24h")' },
  { title: 'SHIB PRICE', formula: 'PRICE("shiba-inu")', format: '$#,##0.00000000', changeFormula: 'CHANGE("shiba-inu", "24h")' },
  { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  { title: 'FEAR & GREED', formula: 'FEARGREED()' },
];

/** NFT — ETH ecosystem focus */
const NFT_KPIS: KPICardDef[] = [
  { title: 'ETH PRICE', formula: 'PRICE("ethereum")', format: '$#,##0.00', changeFormula: 'CHANGE("ethereum", "24h")' },
  { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
  { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  { title: 'FEAR & GREED', formula: 'FEARGREED()' },
];

/** Exchange — volume and health */
const EXCHANGE_KPIS: KPICardDef[] = [
  { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
  { title: '24H VOLUME', formula: 'GLOBAL("total_volume")', format: COMPACT_USD },
  { title: 'ACTIVE COINS', formula: 'GLOBAL("active_cryptocurrencies")' },
  { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
];

/** Trading — quick action metrics */
const TRADING_KPIS: KPICardDef[] = [
  { title: 'BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
  { title: 'BTC 24H CHANGE', formula: 'CHANGE("bitcoin", "24h")', format: '0.00"%"' },
  { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD },
  { title: 'FEAR & GREED', formula: 'FEARGREED()' },
];

/** Staking — PoS ecosystem */
const STAKING_KPIS: KPICardDef[] = [
  { title: 'ETH PRICE', formula: 'PRICE("ethereum")', format: '$#,##0.00', changeFormula: 'CHANGE("ethereum", "24h")' },
  { title: 'SOL PRICE', formula: 'PRICE("solana")', format: '$#,##0.00', changeFormula: 'CHANGE("solana", "24h")' },
  { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
];

/** Layer compare — L1/L2 ecosystem */
const LAYER_KPIS: KPICardDef[] = [
  { title: 'ETH PRICE', formula: 'PRICE("ethereum")', format: '$#,##0.00', changeFormula: 'CHANGE("ethereum", "24h")' },
  { title: 'SOL PRICE', formula: 'PRICE("solana")', format: '$#,##0.00', changeFormula: 'CHANGE("solana", "24h")' },
  { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
  { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
];

/** Categories — market structure */
const CATEGORIES_KPIS: KPICardDef[] = [
  { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
  { title: '24H VOLUME', formula: 'GLOBAL("total_volume")', format: COMPACT_USD },
  { title: 'ACTIVE COINS', formula: 'GLOBAL("active_cryptocurrencies")' },
  { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
];

/** Standard TOP() spill table headers */
const TOP_HEADERS = [
  { col: 1, label: '#' },
  { col: 2, label: 'Name' },
  { col: 3, label: 'Symbol' },
  { col: 4, label: 'Price (USD)' },
  { col: 5, label: 'Market Cap' },
  { col: 6, label: '24h %' },
  { col: 7, label: '7d %' },
];

/** TOP() headers with Volume column */
const TOP_HEADERS_VOL = [
  ...TOP_HEADERS,
  { col: 8, label: 'Volume' },
];

// ============================================
// HELPER: Column letter from number
// ============================================

function colLetter(col: number): string {
  return String.fromCharCode(64 + col);
}

// ============================================
// HELPER: Standard spill-table dashboard
// ============================================

interface MetricDef {
  label: string;
  formula: string;
  format?: string;
}

interface SpillConfig {
  sheetName: string;
  dashboardType: DashboardType;
  title: string;
  subtitle?: string;
  colWidths?: number[];
  kpis: KPICardDef[];
  sectionTitle: string;
  headers: Array<{ col: number; label: string }>;
  formula: string;
  spillRows: number;
  endCol: number;
  percentCols?: number[];
  dataBarCol?: number;
  colorScaleCol?: number;
  chartTitles?: [string, string, string, string];
  /** Custom summary metrics for the visual sheet bottom section */
  metrics?: MetricDef[];
  /** Section title for summary metrics */
  metricsSectionTitle?: string;
}

/** Premium layout: Visual sheet (KPIs + 2x2 chart grid) + Data sheet (spill table) */
function buildSpillDashboard(
  workbook: ExcelJS.Workbook,
  config: SpillConfig,
): { sheet: ExcelJS.Worksheet; theme: DashboardTheme } {
  // === VISUAL DASHBOARD SHEET (charts front and center) ===
  const visualWidths = [3, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12];
  const { sheet, theme } = initDarkSheet(workbook, config.sheetName, config.dashboardType, visualWidths);
  addHeaderBar(sheet, 2, config.title, theme, config.subtitle);
  addKPICards(sheet, 5, config.kpis, theme);
  addSectionDivider(sheet, 10, config.sectionTitle, theme);

  const defaultTitles: [string, string, string, string] = [
    'TOP 10 RANKING',
    'VALUE DISTRIBUTION',
    '24H PERFORMANCE',
    'MARKET OVERVIEW',
  ];
  const afterGrid = addChartGrid(sheet, 12, theme, config.chartTitles || defaultTitles);

  const metricsTitle = config.metricsSectionTitle || '  KEY METRICS';
  addSectionDivider(sheet, afterGrid, metricsTitle, theme);

  const metrics = config.metrics || [
    { label: 'BTC Price', formula: 'PRICE("bitcoin")', format: '$#,##0.00' },
    { label: 'Market Cap', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD },
    { label: 'Fear & Greed', formula: 'FEARGREED()' },
  ];
  for (let i = 0; i < metrics.length; i++) {
    addMetricRow(sheet, afterGrid + 2 + i, 2, metrics[i].label, metrics[i].formula, theme, metrics[i].format);
  }

  // === DATA SHEET (spill table for chart data) ===
  const dataName = config.sheetName + ' Data';
  const { sheet: data, theme: dt } = initDarkSheet(workbook, dataName, config.dashboardType, config.colWidths);
  addHeaderBar(data, 2, config.title + ' \u2014 DATA', dt);
  addSectionDivider(data, 4, config.sectionTitle, dt);
  addTableHeaders(data, 5, config.headers, dt);
  placeSpillFormula(data, 6, 1, config.formula, dt);
  addZebraRows(data, 6, config.spillRows, 1, config.endCol, dt);

  const spillEnd = 6 + config.spillRows - 1;
  if (config.percentCols) {
    for (const c of config.percentCols) {
      addPercentFormatting(data, `${colLetter(c)}6:${colLetter(c)}${spillEnd}`, dt);
    }
  }
  if (config.dataBarCol) {
    addDataBars(data, `${colLetter(config.dataBarCol)}6:${colLetter(config.dataBarCol)}${spillEnd}`, dt.accent);
  }
  if (config.colorScaleCol) {
    addColorScale(data, `${colLetter(config.colorScaleCol)}6:${colLetter(config.colorScaleCol)}${spillEnd}`, dt.bg, dt.accent);
  }

  data.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];
  return { sheet, theme };
}

// ============================================
// HELPER: Simple sub-sheet (no KPIs)
// ============================================

function buildSubSheet(
  workbook: ExcelJS.Workbook,
  sheetName: string,
  dashboardType: DashboardType,
  title: string,
  formula: string,
  spillRows: number,
  endCol: number,
  colWidths?: number[],
): { sheet: ExcelJS.Worksheet; theme: DashboardTheme } {
  const { sheet, theme } = initDarkSheet(workbook, sheetName, dashboardType, colWidths);
  addHeaderBar(sheet, 2, title, theme);
  placeSpillFormula(sheet, 5, 1, formula, theme);
  addZebraRows(sheet, 5, spillRows, 1, endCol, theme);
  return { sheet, theme };
}

// ============================================
// HELPER: Per-coin table dashboard
// ============================================

interface CoinFormula {
  col: number;
  template: string; // e.g., 'PRICE("{coin}")' — {coin} gets replaced
  format?: string;
}

/** Premium layout: Visual sheet (KPIs + 2x2 chart grid) + Data sheet (per-coin table) */
function buildPerCoinDashboard(
  workbook: ExcelJS.Workbook,
  config: {
    sheetName: string;
    dashboardType: DashboardType;
    title: string;
    subtitle?: string;
    colWidths?: number[];
    kpis: KPICardDef[];
    sectionTitle: string;
    headers: Array<{ col: number; label: string }>;
    coins: string[];
    defaultCoins: string[];
    maxCoins: number;
    formulas: CoinFormula[];
    chartTitles?: [string, string, string, string];
    metrics?: MetricDef[];
    metricsSectionTitle?: string;
  },
): { sheet: ExcelJS.Worksheet; theme: DashboardTheme } {
  // === VISUAL DASHBOARD SHEET ===
  const visualWidths = [3, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12];
  const { sheet, theme } = initDarkSheet(workbook, config.sheetName, config.dashboardType, visualWidths);
  addHeaderBar(sheet, 2, config.title, theme, config.subtitle);
  addKPICards(sheet, 5, config.kpis, theme);
  addSectionDivider(sheet, 10, config.sectionTitle, theme);

  const defaultTitles: [string, string, string, string] = [
    'PRICE COMPARISON',
    'MARKET CAP DISTRIBUTION',
    '24H CHANGE',
    'MARKET OVERVIEW',
  ];
  const afterGrid = addChartGrid(sheet, 12, theme, config.chartTitles || defaultTitles);

  const metricsTitle = config.metricsSectionTitle || '  KEY METRICS';
  addSectionDivider(sheet, afterGrid, metricsTitle, theme);

  const metrics = config.metrics || [
    { label: 'BTC Price', formula: 'PRICE("bitcoin")', format: '$#,##0.00' },
    { label: 'Market Cap', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD },
  ];
  for (let i = 0; i < metrics.length; i++) {
    addMetricRow(sheet, afterGrid + 2 + i, 2, metrics[i].label, metrics[i].formula, theme, metrics[i].format);
  }

  // === DATA SHEET (per-coin formulas) ===
  const dataName = config.sheetName + ' Data';
  const { sheet: data, theme: dt } = initDarkSheet(workbook, dataName, config.dashboardType, config.colWidths);
  addHeaderBar(data, 2, config.title + ' \u2014 DATA', dt);
  addSectionDivider(data, 4, config.sectionTitle, dt);
  addTableHeaders(data, 5, config.headers, dt);

  const coinList = config.coins.length > 0 ? config.coins.slice(0, config.maxCoins) : config.defaultCoins;
  const endCol = Math.max(...config.headers.map(h => h.col));
  addZebraRows(data, 6, coinList.length, 1, endCol, dt);

  for (let i = 0; i < coinList.length; i++) {
    const coin = coinList[i];
    const row = 6 + i;
    const nameCell = data.getCell(row, 1);
    nameCell.value = coin;
    nameCell.font = { size: 10, bold: true, color: { argb: dt.text } };

    for (const f of config.formulas) {
      const cell = data.getCell(row, f.col);
      cell.value = { formula: `CRK.${f.template.replace('{coin}', coin)}` };
      cell.font = { size: 10, color: { argb: dt.accent } };
      if (f.format) cell.numFmt = f.format;
    }
  }

  data.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];
  return { sheet, theme };
}

// ============================================
// MAIN ENTRY POINT
// ============================================

/**
 * Adds CRK formula dashboard sheets to a workbook based on dashboard type.
 * All dashboards use professional dark-themed layouts.
 */
export function addCrkDashboardSheets(
  workbook: ExcelJS.Workbook,
  dashboard: DashboardType,
  coins: string[],
): void {
  switch (dashboard) {
    case 'market-overview':
      addMarketOverviewDashboard(workbook);
      break;
    case 'screener':
      addScreenerDashboard(workbook);
      break;
    case 'gainers-losers':
      addGainersLosersDashboard(workbook);
      break;
    case 'fear-greed':
      addFearGreedDashboard(workbook);
      break;
    case 'portfolio-tracker':
      addPortfolioDashboard(workbook);
      break;
    case 'trending':
      addTrendingDashboard(workbook);
      break;
    case 'technical-analysis':
      addTechnicalDashboard(workbook, coins);
      break;
    case 'defi-dashboard':
      addDefiDashboard(workbook);
      break;
    case 'derivatives':
    case 'funding-rates':
      addDerivativesDashboard(workbook);
      break;
    case 'correlation':
      addCorrelationDashboard(workbook, coins);
      break;
    case 'stablecoins':
      addStablecoinsDashboard(workbook);
      break;
    case 'exchanges':
      addExchangesDashboard(workbook);
      break;
    case 'bitcoin-dashboard':
      addBitcoinDashboard(workbook);
      break;
    case 'ethereum-dashboard':
      addEthereumDashboard(workbook);
      break;
    case 'nft-tracker':
      addNftDashboard(workbook);
      break;
    case 'whale-tracker':
    case 'on-chain':
      addOnChainDashboard(workbook, coins);
      break;
    case 'heatmap':
    case 'categories':
      addCategoriesDashboard(workbook);
      break;
    case 'etf-tracker':
      addEtfDashboard(workbook);
      break;
    case 'layer1-compare':
    case 'layer2-compare':
      addLayerCompareDashboard(workbook, coins);
      break;
    case 'meme-coins':
      addMemeCoinsDashboard(workbook);
      break;
    case 'ai-gaming':
      addAIGamingDashboard(workbook);
      break;
    case 'defi-yields':
      addDefiYieldsDashboard(workbook);
      break;
    case 'liquidations':
      addLiquidationsDashboard(workbook);
      break;
    case 'altcoin-season':
      addAltcoinSeasonDashboard(workbook);
      break;
    case 'token-unlocks':
      addTokenUnlocksDashboard(workbook, coins);
      break;
    case 'staking-yields':
      addStakingYieldsDashboard(workbook);
      break;
    case 'social-sentiment':
      addSocialSentimentDashboard(workbook);
      break;
    case 'mining-calc':
      addMiningDashboard(workbook);
      break;
    case 'exchange-reserves':
      addExchangeReservesDashboard(workbook);
      break;
    case 'custom':
      addCustomDashboard(workbook, coins);
      break;
    case 'volatility':
    case 'calculator':
      addVolatilityDashboard(workbook, coins);
      break;
    case 'rwa':
    case 'metaverse':
    case 'privacy-coins':
      addCategoryTokensDashboard(workbook, dashboard);
      break;
    case 'dev-activity':
      addDevActivityDashboard(workbook, coins);
      break;
    default:
      addMarketOverviewDashboard(workbook);
      break;
  }
}

// ============================================
// MARKET OVERVIEW — Premium 2x2 Chart Grid + Data Sheet
// ============================================

function addMarketOverviewDashboard(workbook: ExcelJS.Workbook) {
  // === VISUAL DASHBOARD SHEET (charts front and center) ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Dashboard', 'market-overview',
    [3, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);

  addHeaderBar(sheet, 2, 'CRYPTO MARKET DASHBOARD', theme, 'Live data via CRK formulas \u2022 Powered by CoinGecko BYOK');

  addKPICards(sheet, 5, [
    { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
    { title: '24H VOLUME', formula: 'GLOBAL("total_volume")', format: COMPACT_USD },
    { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
    { title: 'FEAR & GREED', formula: 'FEARGREED()' },
  ], theme);

  addSectionDivider(sheet, 10, '  MARKET ANALYSIS', theme);

  // 2x2 chart grid with card backgrounds (charts injected by chartInjector)
  const afterGrid = addChartGrid(sheet, 12, theme, [
    'TOP 10 BY MARKET CAP',
    'MARKET CAP DISTRIBUTION',
    '24H PRICE CHANGE %',
    'PRICE COMPARISON',
  ]);

  // Summary metrics below charts
  addSectionDivider(sheet, afterGrid, '  KEY METRICS', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'Active Coins', 'GLOBAL("active_cryptocurrencies")', theme);
  addMetricRow(sheet, afterGrid + 3, 2, 'Market Cap Change', 'GLOBAL("market_cap_change_percentage_24h_usd")', theme, '0.00"%"');
  addMetricRow(sheet, afterGrid + 4, 2, 'BTC Price', 'PRICE("bitcoin")', theme, '$#,##0.00');
  addMetricRow(sheet, afterGrid + 5, 2, 'ETH Price', 'PRICE("ethereum")', theme, '$#,##0.00');

  // === DATA SHEET (spill tables for chart data) ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Data', 'market-overview');
  addHeaderBar(data, 2, 'MARKET DATA', dt, 'Source data for dashboard charts');
  addSectionDivider(data, 4, '  TOP 20 CRYPTOCURRENCIES', dt);
  addTableHeaders(data, 5, TOP_HEADERS, dt);
  placeSpillFormula(data, 6, 1, 'TOP(20)', dt);
  addZebraRows(data, 6, 20, 1, 7, dt);
  addPercentFormatting(data, 'F6:F25', dt);
  addPercentFormatting(data, 'G6:G25', dt);
  addDataBars(data, 'E6:E25', dt.accent);
  data.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];

  // Trending sub-sheet
  buildSubSheet(workbook, 'CRK Trending', 'market-overview', 'TRENDING COINS', 'TRENDING(7)', 10, 5,
    [3, 25, 18, 15, 14]);
}

// ============================================
// SCREENER — Premium 2x2 Chart Grid + Data Sheet
// ============================================

function addScreenerDashboard(workbook: ExcelJS.Workbook) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Screener', 'screener',
    [3, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);

  addHeaderBar(sheet, 2, 'CRYPTO SCREENER', theme, 'Top 50 coins by market cap');
  addKPICards(sheet, 5, MARKET_KPIS, theme);
  addSectionDivider(sheet, 10, '  MARKET ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    'TOP 20 BY MARKET CAP',
    'MARKET SHARE (TOP 10)',
    '24H CHANGE — TOP 20',
    '7D CHANGE — TOP 20',
  ]);

  addSectionDivider(sheet, afterGrid, '  SUMMARY', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'BTC Price', 'PRICE("bitcoin")', theme, '$#,##0.00');
  addMetricRow(sheet, afterGrid + 3, 2, 'ETH Price', 'PRICE("ethereum")', theme, '$#,##0.00');
  addMetricRow(sheet, afterGrid + 4, 2, 'SOL Price', 'PRICE("solana")', theme, '$#,##0.00');

  // === DATA SHEET ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Screener Data', 'screener',
    [3, 18, 12, 14, 16, 12, 12, 16]);
  addHeaderBar(data, 2, 'SCREENER DATA', dt, 'Source data for screener charts');
  addSectionDivider(data, 4, '  TOP 50 BY MARKET CAP', dt);
  addTableHeaders(data, 5, TOP_HEADERS_VOL, dt);
  placeSpillFormula(data, 6, 1, 'TOP(50)', dt);
  addZebraRows(data, 6, 50, 1, 8, dt);
  addPercentFormatting(data, 'F6:F55', dt);
  addPercentFormatting(data, 'G6:G55', dt);
  addDataBars(data, 'E6:E55', dt.accent);
  addColorScale(data, 'H6:H55', dt.bg, dt.accent);
  data.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];

  // Gainers sub-sheet
  buildSubSheet(workbook, 'CRK Gainers', 'screener', 'TOP 20 GAINERS (24H)', 'GAINERS(20)', 20, 6,
    [3, 18, 12, 14, 16, 12]);

  // Losers sub-sheet
  buildSubSheet(workbook, 'CRK Losers', 'screener', 'TOP 20 LOSERS (24H)', 'LOSERS(20)', 20, 6,
    [3, 18, 12, 14, 16, 12]);
}

// ============================================
// PORTFOLIO TRACKER — Premium 2x2 Chart Grid + Data Sheet
// ============================================

function addPortfolioDashboard(workbook: ExcelJS.Workbook) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Portfolio', 'portfolio-tracker',
    [3, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);

  addHeaderBar(sheet, 2, 'PORTFOLIO TRACKER', theme, 'Track your crypto holdings and performance');

  addKPICards(sheet, 5, [
    { title: 'TOTAL VALUE', formula: 'PORTFOLIO_VALUE()', format: '$#,##0.00', changeFormula: 'PORTFOLIO_PNL()' },
    { title: 'TOTAL PNL', formula: 'PORTFOLIO_PNL()', format: '$#,##0.00' },
    { title: 'FEAR & GREED', formula: 'FEARGREED()' },
    { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  ], theme);

  addSectionDivider(sheet, 10, '  PORTFOLIO ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    'PORTFOLIO ALLOCATION',
    'HOLDINGS BY VALUE',
    'MARKET OVERVIEW',
    'TOP 10 MARKET CAP',
  ]);

  addSectionDivider(sheet, afterGrid, '  MARKET CONTEXT', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'Total Market Cap', 'GLOBAL("total_market_cap")', theme, COMPACT_USD);
  addMetricRow(sheet, afterGrid + 3, 2, 'BTC Price', 'PRICE("bitcoin")', theme, '$#,##0.00');
  addMetricRow(sheet, afterGrid + 4, 2, 'ETH Price', 'PRICE("ethereum")', theme, '$#,##0.00');

  // === DATA SHEET (holdings + top coins) ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Portfolio Data', 'portfolio-tracker',
    [3, 22, 18, 18, 16, 14]);
  addHeaderBar(data, 2, 'PORTFOLIO DATA', dt, 'Holdings and market data');
  addSectionDivider(data, 4, '  HOLDINGS', dt);
  placeSpillFormula(data, 6, 1, 'PORTFOLIO_LIST()', dt);
  addZebraRows(data, 6, 20, 1, 6, dt);

  addSectionDivider(data, 28, '  TOP 10 COINS', dt);
  addTableHeaders(data, 29, TOP_HEADERS.slice(0, 5), dt);
  placeSpillFormula(data, 30, 1, 'TOP(10)', dt);
  addZebraRows(data, 30, 10, 1, 5, dt);
  data.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];

  // Tax summary sub-sheet
  const { sheet: taxSheet, theme: taxTheme } = initDarkSheet(workbook, 'CRK Tax', 'portfolio-tracker',
    [3, 22, 18, 18]);
  addHeaderBar(taxSheet, 2, 'TAX SUMMARY', taxTheme);
  placeSpillFormula(taxSheet, 5, 1, 'TAX_SUMMARY()', taxTheme);
  addZebraRows(taxSheet, 5, 20, 1, 4, taxTheme);
}

// ============================================
// BITCOIN DASHBOARD — Premium 2x2 Chart Grid + Data Sheet
// ============================================

function addBitcoinDashboard(workbook: ExcelJS.Workbook) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Bitcoin', 'bitcoin-dashboard',
    [3, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);

  addHeaderBar(sheet, 2, 'BITCOIN DASHBOARD', theme, 'BTC price, dominance, and technical indicators');

  addKPICards(sheet, 5, [
    { title: 'BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
    { title: '24H CHANGE', formula: 'CHANGE("bitcoin", "24h")', format: '0.00"%"' },
    { title: 'MARKET CAP', formula: 'MCAP("bitcoin")', format: COMPACT_USD },
    { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  ], theme);

  addSectionDivider(sheet, 10, '  BITCOIN ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    'TECHNICAL INDICATORS',
    'BTC vs MARKET',
    'MOVING AVERAGES',
    'TOP COINS COMPARISON',
  ]);

  addSectionDivider(sheet, afterGrid, '  MARKET SENTIMENT', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'Fear & Greed Index', 'FEARGREED()', theme);
  addMetricRow(sheet, afterGrid + 3, 2, 'Fear & Greed Label', 'FEARGREED("class")', theme);
  addMetricRow(sheet, afterGrid + 4, 2, 'All-Time High', 'ATH("bitcoin")', theme, '$#,##0.00');
  addMetricRow(sheet, afterGrid + 5, 2, 'ATH % Down', 'ATH_CHANGE("bitcoin")', theme, '0.00"%"');

  // === DATA SHEET (technical indicators + comparison) ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Bitcoin Data', 'bitcoin-dashboard',
    [3, 28, 20, 14]);
  addHeaderBar(data, 2, 'BITCOIN DATA', dt, 'Technical indicators and comparison data');

  addSectionDivider(data, 4, '  TECHNICAL INDICATORS', dt);
  const indicators = [
    { label: 'RSI (14)', formula: 'RSI("bitcoin", 14)', format: '0.00' },
    { label: 'SMA (50)', formula: 'SMA("bitcoin", 50)', format: '$#,##0.00' },
    { label: 'SMA (200)', formula: 'SMA("bitcoin", 200)', format: '$#,##0.00' },
    { label: 'EMA (20)', formula: 'EMA("bitcoin", 20)', format: '$#,##0.00' },
    { label: 'MACD', formula: 'MACD("bitcoin")', format: '0.0000' },
    { label: 'BB Upper', formula: 'BB("bitcoin", "upper", 20)', format: '$#,##0.00' },
    { label: 'BB Lower', formula: 'BB("bitcoin", "lower", 20)', format: '$#,##0.00' },
  ];
  for (let i = 0; i < indicators.length; i++) {
    addMetricRow(data, 6 + i, 2, indicators[i].label, indicators[i].formula, dt, indicators[i].format);
  }
  addZebraRows(data, 6, indicators.length, 2, 3, dt);

  addSectionDivider(data, 14, '  TOP 10 COMPARISON', dt);
  addTableHeaders(data, 15, TOP_HEADERS.slice(0, 5), dt);
  placeSpillFormula(data, 16, 1, 'TOP(10)', dt);
  addZebraRows(data, 16, 10, 1, 5, dt);
}

// ============================================
// GAINERS & LOSERS — Rankings Sunset Theme
// ============================================

function addGainersLosersDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Gainers',
    dashboardType: 'gainers-losers',
    title: 'TOP GAINERS (24H)',
    subtitle: 'Biggest price increases in the last 24 hours',
    kpis: GAINERS_KPIS,
    sectionTitle: '  TOP 20 GAINERS',
    headers: TOP_HEADERS,
    formula: 'GAINERS(20)',
    spillRows: 20,
    endCol: 7,
    percentCols: [6, 7],
    dataBarCol: 6,
    chartTitles: ['24H TOP PERFORMERS', 'MARKET CAP SHARE', '7D PERFORMANCE', 'PRICE COMPARISON'],
    metricsSectionTitle: '  MARKET MOMENTUM',
    metrics: [
      { label: 'Market Cap Change', formula: 'GLOBAL("market_cap_change_percentage_24h_usd")', format: '0.00"%"' },
      { label: 'BTC Price', formula: 'PRICE("bitcoin")', format: '$#,##0.00' },
      { label: 'ETH Price', formula: 'PRICE("ethereum")', format: '$#,##0.00' },
      { label: 'Total Volume', formula: 'GLOBAL("total_volume")', format: COMPACT_USD },
    ],
  });

  buildSubSheet(workbook, 'CRK Losers', 'gainers-losers', 'TOP 20 LOSERS (24H)', 'LOSERS(20)', 20, 7);
}

// ============================================
// FEAR & GREED — Analytics Purple Theme
// ============================================

function addFearGreedDashboard(workbook: ExcelJS.Workbook) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Fear & Greed', 'fear-greed',
    [3, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);

  addHeaderBar(sheet, 2, 'FEAR & GREED INDEX', theme, 'Crypto market sentiment indicator');
  addKPICards(sheet, 5, SENTIMENT_KPIS, theme);
  addSectionDivider(sheet, 10, '  SENTIMENT ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    'TOP 10 MARKET CAP',
    'MARKET DISTRIBUTION',
    '24H PERFORMANCE',
    'PRICE COMPARISON',
  ]);

  addSectionDivider(sheet, afterGrid, '  MARKET OVERVIEW', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'Total Market Cap', 'GLOBAL("total_market_cap")', theme, COMPACT_USD);
  addMetricRow(sheet, afterGrid + 3, 2, '24H Volume', 'GLOBAL("total_volume")', theme, COMPACT_USD);
  addMetricRow(sheet, afterGrid + 4, 2, 'BTC Price', 'PRICE("bitcoin")', theme, '$#,##0.00');
  addMetricRow(sheet, afterGrid + 5, 2, 'ETH Price', 'PRICE("ethereum")', theme, '$#,##0.00');

  // === DATA SHEET ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Fear Greed Data', 'fear-greed');
  addHeaderBar(data, 2, 'SENTIMENT DATA', dt);
  addSectionDivider(data, 4, '  TOP 10 CRYPTOCURRENCIES', dt);
  addTableHeaders(data, 5, TOP_HEADERS, dt);
  placeSpillFormula(data, 6, 1, 'TOP(10)', dt);
  addZebraRows(data, 6, 10, 1, 7, dt);
  addPercentFormatting(data, 'F6:F15', dt);
  addPercentFormatting(data, 'G6:G15', dt);
  data.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];
}

// ============================================
// TRENDING — Rankings Sunset Theme
// ============================================

function addTrendingDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Trending',
    dashboardType: 'trending',
    title: 'TRENDING COINS',
    subtitle: 'Most searched coins in the last 24 hours',
    colWidths: [3, 25, 18, 15, 16, 14],
    kpis: TRENDING_KPIS,
    sectionTitle: '  TRENDING NOW',
    headers: [
      { col: 1, label: 'Name' },
      { col: 2, label: 'Symbol' },
      { col: 3, label: 'Price' },
      { col: 4, label: 'Market Cap' },
      { col: 5, label: 'Score' },
    ],
    formula: 'TRENDING(7)',
    spillRows: 10,
    endCol: 5,
    dataBarCol: 4,
  });
}

// ============================================
// TECHNICAL ANALYSIS — Trading Pro Theme
// ============================================

function addTechnicalDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Technical',
    dashboardType: 'technical-analysis',
    title: 'TECHNICAL DASHBOARD',
    subtitle: 'RSI, SMA, EMA, Bollinger Bands, MACD',
    colWidths: [3, 16, 14, 12, 14, 14, 14, 14, 14],
    kpis: [
      { title: 'BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
      { title: 'BTC RSI (14)', formula: 'RSI("bitcoin", 14)', format: '0.00' },
      { title: 'FEAR & GREED', formula: 'FEARGREED()' },
      { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
    ],
    sectionTitle: '  TECHNICAL INDICATORS',
    chartTitles: ['RSI COMPARISON', 'PRICE COMPARISON', 'SMA vs EMA', 'MACD SIGNAL'],
    metricsSectionTitle: '  BTC TECHNICALS',
    metrics: [
      { label: 'BTC RSI(14)', formula: 'RSI("bitcoin", 14)', format: '0.00' },
      { label: 'BTC SMA(50)', formula: 'SMA("bitcoin", 50)', format: '$#,##0.00' },
      { label: 'BTC EMA(20)', formula: 'EMA("bitcoin", 20)', format: '$#,##0.00' },
      { label: 'BTC MACD', formula: 'MACD("bitcoin")', format: '0.0000' },
    ],
    headers: [
      { col: 1, label: 'Coin' },
      { col: 2, label: 'Price' },
      { col: 3, label: 'RSI(14)' },
      { col: 4, label: 'SMA(20)' },
      { col: 5, label: 'EMA(20)' },
      { col: 6, label: 'BB Upper' },
      { col: 7, label: 'BB Lower' },
      { col: 8, label: 'MACD' },
    ],
    coins,
    defaultCoins: ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'xrp',
      'cardano', 'dogecoin', 'polkadot', 'avalanche-2', 'chainlink'],
    maxCoins: 10,
    formulas: [
      { col: 2, template: 'PRICE("{coin}")', format: '$#,##0.00' },
      { col: 3, template: 'RSI("{coin}", 14)', format: '0.00' },
      { col: 4, template: 'SMA("{coin}", 20)', format: '$#,##0.00' },
      { col: 5, template: 'EMA("{coin}", 20)', format: '$#,##0.00' },
      { col: 6, template: 'BB("{coin}", "upper", 20)', format: '$#,##0.00' },
      { col: 7, template: 'BB("{coin}", "lower", 20)', format: '$#,##0.00' },
      { col: 8, template: 'MACD("{coin}")', format: '0.0000' },
    ],
  });
}

// ============================================
// DEFI DASHBOARD — Premium 2x2 Chart Grid + Data Sheet
// ============================================

function addDefiDashboard(workbook: ExcelJS.Workbook) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK DeFi', 'defi-dashboard',
    [3, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);

  addHeaderBar(sheet, 2, 'DEFI DASHBOARD', theme, 'Decentralized finance protocols and metrics');
  addKPICards(sheet, 5, DEFI_KPIS, theme);
  addSectionDivider(sheet, 10, '  DEFI ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    'TOP 10 PROTOCOLS BY TVL',
    'PROTOCOL DISTRIBUTION',
    'DEFI 24H VOLUME',
    'DEFI vs MARKET',
  ]);

  addSectionDivider(sheet, afterGrid, '  DEFI METRICS', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'DeFi Market Cap', 'DEFI_GLOBAL("market_cap")', theme, COMPACT_USD);
  addMetricRow(sheet, afterGrid + 3, 2, 'DeFi Dominance', 'DEFI_GLOBAL("dominance")', theme, '0.00"%"');
  addMetricRow(sheet, afterGrid + 4, 2, 'DeFi Volume', 'DEFI_GLOBAL("volume")', theme, COMPACT_USD);

  // === DATA SHEET ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK DeFi Data', 'defi-dashboard',
    [3, 22, 16, 16, 16, 14]);
  addHeaderBar(data, 2, 'DEFI DATA', dt, 'Source data for DeFi charts');
  addSectionDivider(data, 4, '  TOP 50 DEFI PROTOCOLS', dt);
  addTableHeaders(data, 5, [
    { col: 1, label: 'Protocol' },
    { col: 2, label: 'Chain' },
    { col: 3, label: 'TVL' },
    { col: 4, label: 'Volume' },
    { col: 5, label: '24h %' },
  ], dt);
  placeSpillFormula(data, 6, 1, 'DEFI(50)', dt);
  addZebraRows(data, 6, 50, 1, 5, dt);
  addPercentFormatting(data, 'E6:E55', dt);
  addDataBars(data, 'C6:C55', dt.accent);
  data.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];

  // Pools sub-sheet
  buildSubSheet(workbook, 'CRK Pools', 'defi-dashboard', 'TOP DEX POOLS', 'POOLS("eth", 20)', 20, 5,
    [3, 25, 18, 16, 16]);
}

// ============================================
// DERIVATIVES — Trading Pro Theme
// ============================================

function addDerivativesDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Derivatives',
    dashboardType: 'derivatives',
    title: 'DERIVATIVES MARKET',
    subtitle: 'Futures, options, and perpetual contracts',
    colWidths: [3, 22, 16, 16, 16, 14],
    kpis: TRADING_KPIS,
    sectionTitle: '  TOP 50 DERIVATIVES EXCHANGES',
    headers: [
      { col: 1, label: 'Exchange' },
      { col: 2, label: 'Open Interest' },
      { col: 3, label: '24h Volume' },
      { col: 4, label: 'Pairs' },
      { col: 5, label: 'Trust' },
    ],
    formula: 'DERIVATIVES(50)',
    spillRows: 50,
    endCol: 5,
    dataBarCol: 3,
    colorScaleCol: 5,
  });
}

// ============================================
// CORRELATION / PRICE WATCH — Analytics Purple Theme
// ============================================

function addCorrelationDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Prices',
    dashboardType: 'correlation',
    title: 'PRICE WATCH',
    subtitle: 'Real-time price tracking and comparison',
    colWidths: [3, 20, 16, 16, 16],
    kpis: [
      { title: 'BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
      { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
      { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
      { title: 'FEAR & GREED', formula: 'FEARGREED()' },
    ],
    sectionTitle: '  PRICE COMPARISON',
    headers: [
      { col: 1, label: 'Coin' },
      { col: 2, label: 'Price (USD)' },
      { col: 3, label: '24h Change' },
      { col: 4, label: 'Market Cap' },
    ],
    coins,
    defaultCoins: ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'xrp'],
    maxCoins: 10,
    formulas: [
      { col: 2, template: 'PRICE("{coin}")', format: '$#,##0.00' },
      { col: 3, template: 'CHANGE("{coin}", "24h")', format: '0.00"%"' },
      { col: 4, template: 'MCAP("{coin}")', format: COMPACT_USD },
    ],
  });
}

// ============================================
// STABLECOINS — Ecosystem Blue Theme
// ============================================

function addStablecoinsDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Stablecoins',
    dashboardType: 'stablecoins',
    title: 'STABLECOINS',
    subtitle: 'Stablecoin market overview and peg tracking',
    colWidths: [3, 22, 14, 16, 16, 14],
    kpis: MARKET_KPIS,
    sectionTitle: '  TOP 20 STABLECOINS',
    chartTitles: ['MARKET CAP RANKING', 'STABLECOIN MARKET SHARE', '24H TRADING VOLUME', 'PRICE STABILITY (PEG)'],
    headers: [
      { col: 1, label: 'Name' },
      { col: 2, label: 'Price' },
      { col: 3, label: 'Market Cap' },
      { col: 4, label: 'Volume' },
      { col: 5, label: '24h %' },
    ],
    formula: 'STABLECOINS(20)',
    spillRows: 20,
    endCol: 5,
    percentCols: [5],
    dataBarCol: 3,
  });
}

// ============================================
// EXCHANGES — Institutional Theme
// ============================================

function addExchangesDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Exchanges',
    dashboardType: 'exchanges',
    title: 'TOP EXCHANGES',
    subtitle: 'Centralized and decentralized exchange rankings',
    colWidths: [3, 22, 16, 16, 14, 14],
    kpis: EXCHANGE_KPIS,
    sectionTitle: '  TOP 50 EXCHANGES BY VOLUME',
    chartTitles: ['TOP 10 — 24H VOLUME', 'VOLUME MARKET SHARE', 'TRADING PAIRS COUNT', 'TRUST SCORE'],
    headers: [
      { col: 1, label: 'Exchange' },
      { col: 2, label: 'Trust Score' },
      { col: 3, label: '24h Volume' },
      { col: 4, label: 'Pairs' },
      { col: 5, label: 'Year Est.' },
    ],
    formula: 'EXCHANGES(50)',
    spillRows: 50,
    endCol: 5,
    dataBarCol: 3,
    colorScaleCol: 2,
  });
}

// ============================================
// ETHEREUM DASHBOARD — Premium 2x2 Chart Grid + Data Sheet
// ============================================

function addEthereumDashboard(workbook: ExcelJS.Workbook) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Ethereum', 'ethereum-dashboard',
    [3, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);

  addHeaderBar(sheet, 2, 'ETHEREUM DASHBOARD', theme, 'ETH price, DeFi metrics, and market data');

  addKPICards(sheet, 5, [
    { title: 'ETH PRICE', formula: 'PRICE("ethereum")', format: '$#,##0.00', changeFormula: 'CHANGE("ethereum", "24h")' },
    { title: '24H CHANGE', formula: 'CHANGE("ethereum", "24h")', format: '0.00"%"' },
    { title: 'ETH MARKET CAP', formula: 'MCAP("ethereum")', format: COMPACT_USD },
    { title: 'DEFI MARKET CAP', formula: 'DEFI_GLOBAL("market_cap")', format: COMPACT_USD },
  ], theme);

  addSectionDivider(sheet, 10, '  ETHEREUM ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    'TECHNICAL INDICATORS',
    'ETH vs DEFI ECOSYSTEM',
    'MOVING AVERAGES',
    'DEFI PROTOCOL TVL',
  ]);

  addSectionDivider(sheet, afterGrid, '  DEFI ECOSYSTEM', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'DeFi Market Cap', 'DEFI_GLOBAL("market_cap")', theme, COMPACT_USD);
  addMetricRow(sheet, afterGrid + 3, 2, 'DeFi Dominance', 'DEFI_GLOBAL("dominance")', theme, '0.00"%"');
  addMetricRow(sheet, afterGrid + 4, 2, 'DeFi Volume', 'DEFI_GLOBAL("volume")', theme, COMPACT_USD);
  addMetricRow(sheet, afterGrid + 5, 2, 'All-Time High', 'ATH("ethereum")', theme, '$#,##0.00');

  // === DATA SHEET ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Ethereum Data', 'ethereum-dashboard',
    [3, 28, 20, 14]);
  addHeaderBar(data, 2, 'ETHEREUM DATA', dt, 'Technical indicators and DeFi data');

  addSectionDivider(data, 4, '  TECHNICAL INDICATORS', dt);
  const indicators = [
    { label: 'RSI (14)', formula: 'RSI("ethereum", 14)', format: '0.00' },
    { label: 'SMA (50)', formula: 'SMA("ethereum", 50)', format: '$#,##0.00' },
    { label: 'SMA (200)', formula: 'SMA("ethereum", 200)', format: '$#,##0.00' },
    { label: 'EMA (20)', formula: 'EMA("ethereum", 20)', format: '$#,##0.00' },
    { label: 'MACD', formula: 'MACD("ethereum")', format: '0.0000' },
    { label: 'BB Upper', formula: 'BB("ethereum", "upper", 20)', format: '$#,##0.00' },
    { label: 'BB Lower', formula: 'BB("ethereum", "lower", 20)', format: '$#,##0.00' },
  ];
  for (let i = 0; i < indicators.length; i++) {
    addMetricRow(data, 6 + i, 2, indicators[i].label, indicators[i].formula, dt, indicators[i].format);
  }
  addZebraRows(data, 6, indicators.length, 2, 3, dt);

  addSectionDivider(data, 14, '  TOP 10 DEFI PROTOCOLS', dt);
  addTableHeaders(data, 15, [
    { col: 1, label: 'Protocol' },
    { col: 2, label: 'TVL' },
    { col: 3, label: 'Volume' },
  ], dt);
  placeSpillFormula(data, 16, 1, 'DEFI(10)', dt);
  addZebraRows(data, 16, 10, 1, 3, dt);
}

// ============================================
// NFT TRACKER — Ecosystem Blue Theme
// ============================================

function addNftDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK NFTs',
    dashboardType: 'nft-tracker',
    title: 'NFT COLLECTIONS',
    subtitle: 'Top NFT collections by floor price and volume',
    colWidths: [3, 25, 16, 16, 14, 14],
    kpis: NFT_KPIS,
    sectionTitle: '  TOP 50 NFT COLLECTIONS',
    chartTitles: ['TOP 10 BY VOLUME', 'VOLUME DISTRIBUTION', 'FLOOR PRICE RANKING', '24H PERFORMANCE'],
    headers: [
      { col: 1, label: 'Collection' },
      { col: 2, label: 'Floor Price' },
      { col: 3, label: 'Volume' },
      { col: 4, label: 'Owners' },
      { col: 5, label: '24h %' },
    ],
    formula: 'NFTS(50)',
    spillRows: 50,
    endCol: 5,
    percentCols: [5],
    dataBarCol: 3,
  });
}

// ============================================
// ON-CHAIN / WHALE TRACKER — Institutional Theme
// ============================================

function addOnChainDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK On-Chain',
    dashboardType: 'on-chain',
    title: 'ON-CHAIN METRICS',
    subtitle: 'Blockchain analytics and whale tracking',
    colWidths: [3, 20, 16, 16, 18],
    kpis: [
      { title: 'BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
      { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
      { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
      { title: 'FEAR & GREED', formula: 'FEARGREED()' },
    ],
    sectionTitle: '  ON-CHAIN DATA',
    headers: [
      { col: 1, label: 'Coin' },
      { col: 2, label: 'Price' },
      { col: 3, label: '24h Change' },
      { col: 4, label: 'Market Cap' },
    ],
    coins,
    defaultCoins: ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'xrp'],
    maxCoins: 10,
    formulas: [
      { col: 2, template: 'PRICE("{coin}")', format: '$#,##0.00' },
      { col: 3, template: 'CHANGE("{coin}", "24h")', format: '0.00"%"' },
      { col: 4, template: 'MCAP("{coin}")', format: COMPACT_USD },
    ],
    chartTitles: ['PRICE COMPARISON', 'ON-CHAIN DISTRIBUTION', '24H CHANGE', 'MARKET CAP'],
  });
}

// ============================================
// CATEGORIES / HEATMAP — Ecosystem Blue Theme
// ============================================

function addCategoriesDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Categories',
    dashboardType: 'categories',
    title: 'MARKET CATEGORIES',
    subtitle: 'Crypto category rankings by market cap',
    colWidths: [3, 25, 16, 16, 14, 14],
    kpis: CATEGORIES_KPIS,
    sectionTitle: '  TOP 50 CATEGORIES',
    chartTitles: ['TOP CATEGORIES BY MCAP', 'SECTOR DISTRIBUTION', '24H TRADING VOLUME', '24H CHANGE BY CATEGORY'],
    headers: [
      { col: 1, label: 'Category' },
      { col: 2, label: 'Market Cap' },
      { col: 3, label: 'Volume' },
      { col: 4, label: '24h %' },
      { col: 5, label: 'Coins' },
    ],
    formula: 'CATEGORIES(50)',
    spillRows: 50,
    endCol: 5,
    percentCols: [4],
    dataBarCol: 2,
  });
}

// ============================================
// ETF TRACKER — Institutional Theme
// ============================================

function addEtfDashboard(workbook: ExcelJS.Workbook) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK ETFs', 'etf-tracker',
    [3, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);

  addHeaderBar(sheet, 2, 'CRYPTO ETF TRACKER', theme, 'Corporate Bitcoin & Ethereum holdings');

  addKPICards(sheet, 5, [
    { title: 'BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
    { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
    { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
    { title: 'FEAR & GREED', formula: 'FEARGREED()' },
  ], theme);

  addSectionDivider(sheet, 10, '  ETF ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    'BTC HOLDINGS BY COMPANY',
    'HOLDINGS DISTRIBUTION',
    'HOLDING VALUE (USD)',
    'TOP COINS COMPARISON',
  ]);

  addSectionDivider(sheet, afterGrid, '  MARKET CONTEXT', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'BTC Price', 'PRICE("bitcoin")', theme, '$#,##0.00');
  addMetricRow(sheet, afterGrid + 3, 2, 'ETH Price', 'PRICE("ethereum")', theme, '$#,##0.00');

  // === DATA SHEET ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK ETFs Data', 'etf-tracker',
    [3, 25, 16, 16, 16, 14]);
  addHeaderBar(data, 2, 'ETF DATA', dt, 'Corporate holdings data');
  addSectionDivider(data, 4, '  BTC CORPORATE HOLDINGS', dt);
  addTableHeaders(data, 5, [
    { col: 1, label: 'Company' },
    { col: 2, label: 'Symbol' },
    { col: 3, label: 'Holdings' },
    { col: 4, label: 'Value (USD)' },
    { col: 5, label: 'Country' },
  ], dt);
  placeSpillFormula(data, 6, 1, 'COMPANIES("bitcoin")', dt);
  addZebraRows(data, 6, 20, 1, 5, dt);
  addDataBars(data, 'D6:D25', dt.accent);
  data.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];

  // ETH holdings sub-sheet
  buildSubSheet(workbook, 'CRK ETH Holdings', 'etf-tracker', 'ETH CORPORATE HOLDINGS',
    'COMPANIES("ethereum")', 20, 5, [3, 25, 16, 16, 16]);
}

// ============================================
// LAYER COMPARE — Rankings Sunset Theme
// ============================================

function addLayerCompareDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Layer Compare',
    dashboardType: 'layer1-compare',
    title: 'LAYER COMPARISON',
    subtitle: 'Layer 1 and Layer 2 blockchain comparison',
    colWidths: [3, 20, 16, 16, 18, 14],
    kpis: LAYER_KPIS,
    sectionTitle: '  BLOCKCHAIN COMPARISON',
    chartTitles: ['MARKET CAP COMPARISON', 'MARKET SHARE', 'RSI ANALYSIS', '24H PERFORMANCE'],
    metricsSectionTitle: '  ECOSYSTEM METRICS',
    metrics: [
      { label: 'Ethereum Price', formula: 'PRICE("ethereum")', format: '$#,##0.00' },
      { label: 'Solana Price', formula: 'PRICE("solana")', format: '$#,##0.00' },
      { label: 'Cardano Price', formula: 'PRICE("cardano")', format: '$#,##0.00' },
    ],
    headers: [
      { col: 1, label: 'Coin' },
      { col: 2, label: 'Price' },
      { col: 3, label: '24h Change' },
      { col: 4, label: 'Market Cap' },
      { col: 5, label: 'RSI(14)' },
    ],
    coins,
    defaultCoins: ['ethereum', 'solana', 'cardano', 'polkadot', 'avalanche-2',
      'near', 'cosmos', 'algorand', 'aptos', 'sui'],
    maxCoins: 15,
    formulas: [
      { col: 2, template: 'PRICE("{coin}")', format: '$#,##0.00' },
      { col: 3, template: 'CHANGE("{coin}", "24h")', format: '0.00"%"' },
      { col: 4, template: 'MCAP("{coin}")', format: COMPACT_USD },
      { col: 5, template: 'RSI("{coin}", 14)', format: '0.00' },
    ],
  });
}

// ============================================
// MEME COINS — Crypto Native Theme
// ============================================

function addMemeCoinsDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Meme Coins',
    dashboardType: 'meme-coins',
    title: 'MEME COINS',
    subtitle: 'Top meme tokens by market cap',
    kpis: MEME_KPIS,
    sectionTitle: '  TOP 50 MEME TOKENS',
    chartTitles: ['MEME MARKET CAP', 'MEME MARKET SHARE', '24H PRICE CHANGE', '7D TREND'],
    metricsSectionTitle: '  MEME MARKET',
    metrics: [
      { label: 'Dogecoin Price', formula: 'PRICE("dogecoin")', format: '$#,##0.0000' },
      { label: 'Shiba Inu Price', formula: 'PRICE("shiba-inu")', format: '$#,##0.00000000' },
      { label: 'PEPE Price', formula: 'PRICE("pepe")', format: '$#,##0.00000000' },
      { label: 'Fear & Greed', formula: 'FEARGREED()' },
    ],
    headers: TOP_HEADERS,
    formula: 'TOP(50, "meme-token")',
    spillRows: 50,
    endCol: 7,
    percentCols: [6, 7],
    dataBarCol: 5,
  });

  buildSubSheet(workbook, 'CRK Trending Meme', 'meme-coins', 'TRENDING MEME COINS', 'TRENDING(7)', 10, 5,
    [3, 25, 18, 15, 14]);
}

// ============================================
// AI & GAMING — Crypto Native Theme
// ============================================

function addAIGamingDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK AI Tokens',
    dashboardType: 'ai-gaming',
    title: 'AI TOKENS',
    subtitle: 'Artificial intelligence cryptocurrency projects',
    kpis: MARKET_KPIS,
    sectionTitle: '  TOP 30 AI TOKENS',
    chartTitles: ['AI TOKEN MARKET CAP', 'AI MARKET DISTRIBUTION', '24H PERFORMANCE', 'PRICE COMPARISON'],
    headers: TOP_HEADERS,
    formula: 'TOP(30, "artificial-intelligence")',
    spillRows: 30,
    endCol: 7,
    percentCols: [6, 7],
    dataBarCol: 5,
  });

  buildSubSheet(workbook, 'CRK Gaming Tokens', 'ai-gaming', 'GAMING TOKENS',
    'TOP(30, "gaming")', 30, 7);
}

// ============================================
// DEFI YIELDS — Yield Finance Theme
// ============================================

function addDefiYieldsDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK DeFi Yields',
    dashboardType: 'defi-yields',
    title: 'DEFI YIELDS',
    subtitle: 'DeFi protocol rankings and stablecoin yields',
    colWidths: [3, 22, 16, 16, 14, 14],
    kpis: DEFI_KPIS,
    sectionTitle: '  TOP 50 DEFI PROTOCOLS',
    chartTitles: ['TOP PROTOCOLS BY TVL', 'TVL DISTRIBUTION', '24H VOLUME', '24H PERFORMANCE'],
    metricsSectionTitle: '  YIELD OVERVIEW',
    metrics: [
      { label: 'DeFi Market Cap', formula: 'DEFI_GLOBAL("market_cap")', format: COMPACT_USD },
      { label: 'DeFi Dominance', formula: 'DEFI_GLOBAL("dominance")', format: '0.00"%"' },
      { label: 'DeFi Volume', formula: 'DEFI_GLOBAL("volume")', format: COMPACT_USD },
    ],
    headers: [
      { col: 1, label: 'Protocol' },
      { col: 2, label: 'Chain' },
      { col: 3, label: 'TVL' },
      { col: 4, label: 'Volume' },
      { col: 5, label: '24h %' },
    ],
    formula: 'DEFI(50)',
    spillRows: 50,
    endCol: 5,
    percentCols: [5],
    dataBarCol: 3,
  });

  buildSubSheet(workbook, 'CRK Stablecoins', 'defi-yields', 'STABLECOINS', 'STABLECOINS(10)', 10, 5,
    [3, 22, 14, 16, 16]);
}

// ============================================
// LIQUIDATIONS — Trading Pro Theme
// ============================================

function addLiquidationsDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Liquidations',
    dashboardType: 'liquidations',
    title: 'LIQUIDATIONS & DERIVATIVES',
    subtitle: 'Derivatives exchanges and liquidation data',
    colWidths: [3, 22, 16, 16, 16, 14],
    kpis: TRADING_KPIS,
    sectionTitle: '  DERIVATIVES EXCHANGES',
    chartTitles: ['OPEN INTEREST', 'OI DISTRIBUTION', '24H TRADING VOLUME', 'VOLUME MARKET SHARE'],
    headers: [
      { col: 1, label: 'Exchange' },
      { col: 2, label: 'Open Interest' },
      { col: 3, label: '24h Volume' },
      { col: 4, label: 'Pairs' },
      { col: 5, label: 'Trust' },
    ],
    formula: 'DERIVATIVES(50)',
    spillRows: 50,
    endCol: 5,
    dataBarCol: 3,
  });
}

// ============================================
// ALTCOIN SEASON — Analytics Purple Theme
// ============================================

function addAltcoinSeasonDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Altcoin Season',
    dashboardType: 'altcoin-season',
    title: 'ALTCOIN SEASON ANALYSIS',
    subtitle: 'BTC dominance trends and altcoin performance',
    kpis: [
      { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
      { title: 'TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
      { title: 'FEAR & GREED', formula: 'FEARGREED()' },
      { title: '24H VOLUME', formula: 'GLOBAL("total_volume")', format: COMPACT_USD },
    ],
    sectionTitle: '  TOP 100 COINS',
    headers: TOP_HEADERS,
    formula: 'TOP(100)',
    spillRows: 100,
    endCol: 7,
    percentCols: [6, 7],
    dataBarCol: 5,
    chartTitles: ['DOMINANCE DISTRIBUTION', 'TOP COINS BY MCAP', '24H PERFORMANCE', 'PRICE TREND'],
    metricsSectionTitle: '  ALTCOIN SEASON INDICATORS',
    metrics: [
      { label: 'BTC Dominance', formula: 'BTCDOM()', format: '0.00"%"' },
      { label: 'Market Cap Change', formula: 'GLOBAL("market_cap_change_percentage_24h_usd")', format: '0.00"%"' },
      { label: 'Active Coins', formula: 'GLOBAL("active_cryptocurrencies")' },
      { label: 'Fear & Greed', formula: 'FEARGREED()' },
    ],
  });
}

// ============================================
// TOKEN UNLOCKS — Yield Finance Theme
// ============================================

function addTokenUnlocksDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Token Data',
    dashboardType: 'token-unlocks',
    title: 'TOKEN DATA',
    subtitle: 'Token unlock schedules and vesting analytics',
    colWidths: [3, 20, 16, 16, 18],
    kpis: MARKET_KPIS,
    sectionTitle: '  TOKEN OVERVIEW',
    headers: [
      { col: 1, label: 'Coin' },
      { col: 2, label: 'Price' },
      { col: 3, label: '24h Change' },
      { col: 4, label: 'Market Cap' },
    ],
    coins,
    defaultCoins: ['aptos', 'sui', 'arbitrum', 'optimism', 'celestia',
      'sei-network', 'injective-protocol', 'worldcoin-wld', 'pyth-network', 'jito-governance-token'],
    maxCoins: 10,
    formulas: [
      { col: 2, template: 'PRICE("{coin}")', format: '$#,##0.00' },
      { col: 3, template: 'CHANGE("{coin}", "24h")', format: '0.00"%"' },
      { col: 4, template: 'MCAP("{coin}")', format: COMPACT_USD },
    ],
  });
}

// ============================================
// STAKING YIELDS — Yield Finance Theme
// ============================================

function addStakingYieldsDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Staking',
    dashboardType: 'staking-yields',
    title: 'PROOF OF STAKE',
    subtitle: 'Staking tokens and yield opportunities',
    kpis: STAKING_KPIS,
    sectionTitle: '  TOP 50 STAKING TOKENS',
    chartTitles: ['STAKING MARKET CAP', 'STAKING DISTRIBUTION', '24H PERFORMANCE', 'PRICE COMPARISON'],
    metricsSectionTitle: '  STAKING ECOSYSTEM',
    metrics: [
      { label: 'ETH Price', formula: 'PRICE("ethereum")', format: '$#,##0.00' },
      { label: 'SOL Price', formula: 'PRICE("solana")', format: '$#,##0.00' },
      { label: 'ADA Price', formula: 'PRICE("cardano")', format: '$#,##0.0000' },
      { label: 'DOT Price', formula: 'PRICE("polkadot")', format: '$#,##0.00' },
    ],
    headers: TOP_HEADERS,
    formula: 'TOP(50, "proof-of-stake")',
    spillRows: 50,
    endCol: 7,
    percentCols: [6, 7],
    dataBarCol: 5,
  });
}

// ============================================
// SOCIAL SENTIMENT — Analytics Purple Theme
// ============================================

function addSocialSentimentDashboard(workbook: ExcelJS.Workbook) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Sentiment', 'social-sentiment',
    [3, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);

  addHeaderBar(sheet, 2, 'SOCIAL SENTIMENT', theme, 'Market sentiment and social trends');
  addKPICards(sheet, 5, SENTIMENT_KPIS, theme);
  addSectionDivider(sheet, 10, '  SENTIMENT ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    'TOP GAINERS (24H)',
    'MARKET DISTRIBUTION',
    '24H PERFORMANCE',
    'TRENDING COINS',
  ]);

  addSectionDivider(sheet, afterGrid, '  MARKET OVERVIEW', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'BTC Price', 'PRICE("bitcoin")', theme, '$#,##0.00');
  addMetricRow(sheet, afterGrid + 3, 2, 'ETH Price', 'PRICE("ethereum")', theme, '$#,##0.00');
  addMetricRow(sheet, afterGrid + 4, 2, 'Total Volume', 'GLOBAL("total_volume")', theme, COMPACT_USD);

  // === DATA SHEET ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Sentiment Data', 'social-sentiment');
  addHeaderBar(data, 2, 'SENTIMENT DATA', dt);
  addSectionDivider(data, 4, '  TOP 20 GAINERS', dt);
  addTableHeaders(data, 5, TOP_HEADERS, dt);
  placeSpillFormula(data, 6, 1, 'GAINERS(20)', dt);
  addZebraRows(data, 6, 20, 1, 7, dt);
  addPercentFormatting(data, 'F6:F25', dt);
  addPercentFormatting(data, 'G6:G25', dt);

  addSectionDivider(data, 28, '  TRENDING COINS', dt);
  placeSpillFormula(data, 30, 1, 'TRENDING(7)', dt);
  addZebraRows(data, 30, 10, 1, 5, dt);
  data.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];
}

// ============================================
// MINING — Tools Dark Theme
// ============================================

function addMiningDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Mining',
    dashboardType: 'mining-calc',
    title: 'MINING & PROOF OF WORK',
    subtitle: 'PoW coins and mining analytics',
    kpis: [
      { title: 'BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
      { title: 'BTC MARKET CAP', formula: 'MCAP("bitcoin")', format: COMPACT_USD },
      { title: 'BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
      { title: 'FEAR & GREED', formula: 'FEARGREED()' },
    ],
    sectionTitle: '  TOP 20 PROOF OF WORK COINS',
    headers: TOP_HEADERS,
    formula: 'TOP(20, "proof-of-work")',
    spillRows: 20,
    endCol: 7,
    percentCols: [6, 7],
    dataBarCol: 5,
    chartTitles: ['TOP 10 PoW MARKET CAP', 'PoW DISTRIBUTION', '24H CHANGE', 'PRICE COMPARISON'],
  });
}

// ============================================
// EXCHANGE RESERVES — Institutional Theme
// ============================================

function addExchangeReservesDashboard(workbook: ExcelJS.Workbook) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Exchanges',
    dashboardType: 'exchange-reserves',
    title: 'EXCHANGE DATA',
    subtitle: 'Exchange volume rankings and reserve tracking',
    colWidths: [3, 22, 16, 16, 14, 14],
    kpis: EXCHANGE_KPIS,
    sectionTitle: '  TOP 50 EXCHANGES',
    chartTitles: ['EXCHANGE VOLUME', 'RESERVE DISTRIBUTION', 'TRADING PAIRS', 'TRUST SCORE'],
    headers: [
      { col: 1, label: 'Exchange' },
      { col: 2, label: 'Trust Score' },
      { col: 3, label: '24h Volume' },
      { col: 4, label: 'Pairs' },
      { col: 5, label: 'Year Est.' },
    ],
    formula: 'EXCHANGES(50)',
    spillRows: 50,
    endCol: 5,
    dataBarCol: 3,
    colorScaleCol: 2,
  });
}

// ============================================
// CUSTOM WATCHLIST — Tools Dark Theme
// ============================================

function addCustomDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Watchlist',
    dashboardType: 'custom',
    title: 'CUSTOM WATCHLIST',
    subtitle: 'Your personalized crypto watch list',
    colWidths: [3, 20, 16, 16, 18, 16],
    kpis: MARKET_KPIS,
    sectionTitle: '  WATCHLIST',
    headers: [
      { col: 1, label: 'Coin' },
      { col: 2, label: 'Price' },
      { col: 3, label: '24h Change' },
      { col: 4, label: 'Market Cap' },
      { col: 5, label: 'Volume' },
    ],
    coins,
    defaultCoins: ['bitcoin', 'ethereum', 'solana'],
    maxCoins: 20,
    formulas: [
      { col: 2, template: 'PRICE("{coin}")', format: '$#,##0.00' },
      { col: 3, template: 'CHANGE("{coin}", "24h")', format: '0.00"%"' },
      { col: 4, template: 'MCAP("{coin}")', format: COMPACT_USD },
      { col: 5, template: 'VOL("{coin}")', format: COMPACT_USD },
    ],
  });
}

// ============================================
// VOLATILITY / CALCULATOR — Trading Pro Theme
// ============================================

function addVolatilityDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Volatility',
    dashboardType: 'volatility',
    title: 'VOLATILITY ANALYSIS',
    subtitle: 'Price volatility and all-time high comparison',
    colWidths: [3, 20, 16, 16, 18],
    kpis: [
      { title: 'BTC 24H CHANGE', formula: 'CHANGE("bitcoin", "24h")', format: '0.00"%"' },
      { title: 'ETH 24H CHANGE', formula: 'CHANGE("ethereum", "24h")', format: '0.00"%"' },
      { title: 'BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
      { title: 'FEAR & GREED', formula: 'FEARGREED()' },
    ],
    sectionTitle: '  VOLATILITY METRICS',
    chartTitles: ['CURRENT PRICE', 'ALL-TIME HIGH', '24H CHANGE %', 'PRICE vs ATH'],
    metricsSectionTitle: '  VOLATILITY INDICATORS',
    metrics: [
      { label: 'BTC All-Time High', formula: 'ATH("bitcoin")', format: '$#,##0.00' },
      { label: 'ETH All-Time High', formula: 'ATH("ethereum")', format: '$#,##0.00' },
      { label: 'Market Cap Change 24h', formula: 'GLOBAL("market_cap_change_percentage_24h_usd")', format: '0.00"%"' },
    ],
    headers: [
      { col: 1, label: 'Coin' },
      { col: 2, label: 'Price' },
      { col: 3, label: '24h Change' },
      { col: 4, label: 'All-Time High' },
    ],
    coins,
    defaultCoins: ['bitcoin', 'ethereum', 'solana'],
    maxCoins: 10,
    formulas: [
      { col: 2, template: 'PRICE("{coin}")', format: '$#,##0.00' },
      { col: 3, template: 'CHANGE("{coin}", "24h")', format: '0.00"%"' },
      { col: 4, template: 'ATH("{coin}")', format: '$#,##0.00' },
    ],
  });
}

// ============================================
// CATEGORY TOKENS (RWA, Metaverse, Privacy) — Ecosystem Blue Theme
// ============================================

function addCategoryTokensDashboard(workbook: ExcelJS.Workbook, dashboard: DashboardType) {
  const categoryMap: Record<string, { title: string; category: string; subtitle: string }> = {
    'rwa': { title: 'REAL WORLD ASSETS', category: 'real-world-assets-rwa', subtitle: 'Tokenized real-world assets' },
    'metaverse': { title: 'METAVERSE TOKENS', category: 'metaverse', subtitle: 'Virtual worlds and metaverse projects' },
    'privacy-coins': { title: 'PRIVACY COINS', category: 'privacy-coins', subtitle: 'Privacy-focused cryptocurrencies' },
  };

  const info = categoryMap[dashboard] || { title: 'TOKENS', category: dashboard, subtitle: 'Token analytics' };

  buildSpillDashboard(workbook, {
    sheetName: 'CRK Tokens',
    dashboardType: dashboard,
    title: info.title,
    subtitle: info.subtitle,
    kpis: MARKET_KPIS,
    sectionTitle: `  TOP 50 ${info.title}`,
    headers: TOP_HEADERS,
    formula: `TOP(50, "${info.category}")`,
    spillRows: 50,
    endCol: 7,
    percentCols: [6, 7],
    dataBarCol: 5,
    chartTitles: ['MARKET CAP RANKING', 'MARKET CAP DISTRIBUTION', '24H PRICE CHANGE', 'PRICE COMPARISON'],
  });
}

// ============================================
// DEVELOPER ACTIVITY — Analytics Purple Theme
// ============================================

function addDevActivityDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Dev Activity',
    dashboardType: 'dev-activity',
    title: 'DEVELOPER ACTIVITY',
    subtitle: 'GitHub activity and development metrics',
    colWidths: [3, 20, 16, 16, 18],
    kpis: MARKET_KPIS,
    sectionTitle: '  DEVELOPMENT METRICS',
    headers: [
      { col: 1, label: 'Coin' },
      { col: 2, label: 'Price' },
      { col: 3, label: '24h Change' },
      { col: 4, label: 'Market Cap' },
    ],
    coins,
    defaultCoins: ['ethereum', 'polkadot', 'cardano', 'cosmos', 'solana',
      'near', 'internet-computer', 'chainlink', 'filecoin', 'aptos'],
    maxCoins: 10,
    formulas: [
      { col: 2, template: 'PRICE("{coin}")', format: '$#,##0.00' },
      { col: 3, template: 'CHANGE("{coin}", "24h")', format: '0.00"%"' },
      { col: 4, template: 'MCAP("{coin}")', format: COMPACT_USD },
    ],
  });
}
