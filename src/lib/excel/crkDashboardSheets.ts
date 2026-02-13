/**
 * CRK Dashboard Sheets — Professional Light Theme (Website-like)
 *
 * ALL dashboards use professional themed layouts with:
 * - Clean white backgrounds with colored accents from CATEGORY_THEMES
 * - KPI metric cards with accent borders on light card backgrounds
 * - Themed section dividers and table headers
 * - Zebra-striped data rows
 * - Conditional formatting (green/red %, data bars, color scales)
 * - Freeze panes for data scrolling
 * - Consistent navigation bar on every sheet
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
  populateMarketRows,
  populateExchangeRows,
  addSidebar,
  addFooter,
  COMPACT_USD,
  type KPICardDef,
  type DashboardTheme,
} from './dashboardStyles';
import {
  computeTechnicalIndicators,
  addTechnicalColumns,
  computeMarketAnalytics,
  addMarketAnalyticsColumns,
  type OHLCRow,
} from './formulaColumns';

// ============================================
// PREFETCHED DATA HELPERS
// ============================================

/**
 * Resolves a CRK formula name (e.g., 'TOP(50)', 'GAINERS(20)') to prefetched data rows.
 * Returns the data array sorted/sliced appropriately, or null if no data available.
 */
function resolveFormulaData(formula: string, data: any): any[] | null {
  if (!data?.market?.length) return null;

  const match = formula.match(/^(\w+)\((\d+)?\)$/);
  if (!match) return null;
  const [, fn, countStr] = match;
  const count = countStr ? parseInt(countStr, 10) : 20;

  switch (fn) {
    case 'TOP':
      return data.market.slice(0, count);
    case 'GAINERS': {
      const sorted = [...data.market].sort((a: any, b: any) =>
        (b.price_change_percentage_24h ?? 0) - (a.price_change_percentage_24h ?? 0));
      return sorted.slice(0, count);
    }
    case 'LOSERS': {
      const sorted = [...data.market].sort((a: any, b: any) =>
        (a.price_change_percentage_24h ?? 0) - (b.price_change_percentage_24h ?? 0));
      return sorted.slice(0, count);
    }
    case 'TRENDING':
      return (data.trending || []).slice(0, count).map((t: any) => ({
        market_cap_rank: t.item?.market_cap_rank ?? 0,
        name: t.item?.name ?? t.name ?? '',
        symbol: t.item?.symbol ?? t.symbol ?? '',
        current_price: t.item?.data?.price ?? 0,
        market_cap: t.item?.data?.market_cap ?? 0,
        price_change_percentage_24h: t.item?.data?.price_change_percentage_24h?.usd ?? 0,
        price_change_percentage_7d_in_currency: 0,
      }));
    default:
      return null;
  }
}

/**
 * Resolves a per-coin formula template to a static value from CoinGecko data.
 */
function resolveCoinField(template: string, coin: string, coinData: any): number | string | undefined {
  const formula = template.replace('{coin}', coin);
  if (formula.startsWith('PRICE(')) return coinData.current_price;
  if (formula.startsWith('MARKETCAP(') || formula.startsWith('MCAP(')) return coinData.market_cap;
  if (formula.startsWith('VOLUME(') || formula.startsWith('VOL(')) return coinData.total_volume;
  if (formula.startsWith('CHANGE24H(') || formula.includes('"24h"')) return coinData.price_change_percentage_24h;
  if (formula.includes('"7d"')) return coinData.price_change_percentage_7d_in_currency ?? coinData.price_change_percentage_7d;
  if (formula.startsWith('RANK(')) return coinData.market_cap_rank;
  if (formula.startsWith('ATH(')) return coinData.ath;
  if (formula.startsWith('ATL(')) return coinData.atl;
  if (formula.startsWith('SUPPLY(')) return coinData.circulating_supply;
  if (formula.startsWith('HIGH24H(')) return coinData.high_24h;
  if (formula.startsWith('LOW24H(')) return coinData.low_24h;
  return undefined;
}

/**
 * Adds IFERROR fallback values to KPI card definitions using prefetched data.
 */
function enrichKPIs(kpis: KPICardDef[], data: any): KPICardDef[] {
  if (!data) return kpis;
  return kpis.map(kpi => {
    const enriched = { ...kpi };
    // Resolve common formula patterns to fallback values
    const fMatch = kpi.formula.match(/^(\w+)\("?([^"]*)"?\)$/);
    if (fMatch) {
      const [, fn, arg] = fMatch;
      if (fn === 'PRICE' && data.market) {
        const coin = data.market.find((c: any) => c.id === arg);
        if (coin) enriched.fallbackValue = coin.current_price;
      } else if (fn === 'GLOBAL' && data.global) {
        const val = data.global[arg];
        if (val !== undefined) enriched.fallbackValue = val;
      } else if (fn === 'FEARGREED' && data.fearGreed?.[0]) {
        enriched.fallbackValue = data.fearGreed[0].value ?? data.fearGreed[0];
      } else if (fn === 'BTCDOM' && data.global?.btc_dominance) {
        enriched.fallbackValue = data.global.btc_dominance;
      } else if (fn === 'MARKETCAP' && data.market) {
        const coin = data.market.find((c: any) => c.id === arg);
        if (coin) enriched.fallbackValue = coin.market_cap;
      } else if (fn === 'CHANGE' && data.market) {
        const coin = data.market.find((c: any) => c.id === arg);
        if (coin) enriched.fallbackValue = coin.price_change_percentage_24h;
      }
    }
    // Also resolve change formula fallbacks
    if (kpi.changeFormula) {
      const cMatch = kpi.changeFormula.match(/^(\w+)\("?([^"]*)"?\)$/);
      if (cMatch) {
        const [, fn, arg] = cMatch;
        if (fn === 'CHANGE' && data.market) {
          const coin = data.market.find((c: any) => c.id === arg);
          if (coin) enriched.changeFallback = coin.price_change_percentage_24h / 100;
        } else if (fn === 'GLOBAL' && data.global?.[arg] !== undefined) {
          enriched.changeFallback = data.global[arg];
        } else if (fn === 'PORTFOLIO_PNL') {
          enriched.changeFallback = 0;
        }
      }
    }
    return enriched;
  });
}

// ============================================
// REUSABLE CONSTANTS
// ============================================

/** Standard market KPI cards used by most dashboards */
const MARKET_KPIS: KPICardDef[] = [
  { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
  { title: '📊 24H VOLUME', formula: 'GLOBAL("total_volume")', format: COMPACT_USD },
  { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
];

/** DeFi-focused KPI cards */
const DEFI_KPIS: KPICardDef[] = [
  { title: '🔗 DEFI MARKET CAP', formula: 'DEFI_GLOBAL("market_cap")', format: COMPACT_USD },
  { title: '📊 DEFI VOLUME', formula: 'DEFI_GLOBAL("volume")', format: COMPACT_USD },
  { title: '📈 DEFI DOMINANCE', formula: 'DEFI_GLOBAL("dominance")', format: '0.00"%"' },
  { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
];

/** Sentiment-focused KPI cards */
const SENTIMENT_KPIS: KPICardDef[] = [
  { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
  { title: '💭 SENTIMENT', formula: 'FEARGREED("class")' },
  { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
];

/** Gainers/Losers — emphasize market momentum */
const GAINERS_KPIS: KPICardDef[] = [
  { title: '₿ BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
  { title: 'Ξ ETH PRICE', formula: 'PRICE("ethereum")', format: '$#,##0.00', changeFormula: 'CHANGE("ethereum", "24h")' },
  { title: '📈 MARKET CAP CHG', formula: 'GLOBAL("market_cap_change_percentage_24h_usd")', format: '0.00"%"' },
  { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
];

/** Trending — discovery focus */
const TRENDING_KPIS: KPICardDef[] = [
  { title: '₿ BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
  { title: '🪙 ACTIVE COINS', formula: 'GLOBAL("active_cryptocurrencies")' },
  { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
];

/** Meme coins — fun but data-driven */
const MEME_KPIS: KPICardDef[] = [
  { title: '🐕 DOGE PRICE', formula: 'PRICE("dogecoin")', format: '$#,##0.0000', changeFormula: 'CHANGE("dogecoin", "24h")' },
  { title: '🐕 SHIB PRICE', formula: 'PRICE("shiba-inu")', format: '$#,##0.00000000', changeFormula: 'CHANGE("shiba-inu", "24h")' },
  { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
];

/** NFT — ETH ecosystem focus */
const NFT_KPIS: KPICardDef[] = [
  { title: 'Ξ ETH PRICE', formula: 'PRICE("ethereum")', format: '$#,##0.00', changeFormula: 'CHANGE("ethereum", "24h")' },
  { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
  { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
];

/** Exchange — volume and health */
const EXCHANGE_KPIS: KPICardDef[] = [
  { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
  { title: '📊 24H VOLUME', formula: 'GLOBAL("total_volume")', format: COMPACT_USD },
  { title: '🪙 ACTIVE COINS', formula: 'GLOBAL("active_cryptocurrencies")' },
  { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
];

/** Trading — quick action metrics */
const TRADING_KPIS: KPICardDef[] = [
  { title: '₿ BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
  { title: '📈 BTC 24H CHANGE', formula: 'CHANGE("bitcoin", "24h")', format: '0.00"%"' },
  { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD },
  { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
];

/** Staking — PoS ecosystem */
const STAKING_KPIS: KPICardDef[] = [
  { title: 'Ξ ETH PRICE', formula: 'PRICE("ethereum")', format: '$#,##0.00', changeFormula: 'CHANGE("ethereum", "24h")' },
  { title: '☀️ SOL PRICE', formula: 'PRICE("solana")', format: '$#,##0.00', changeFormula: 'CHANGE("solana", "24h")' },
  { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
];

/** Layer compare — L1/L2 ecosystem */
const LAYER_KPIS: KPICardDef[] = [
  { title: 'Ξ ETH PRICE', formula: 'PRICE("ethereum")', format: '$#,##0.00', changeFormula: 'CHANGE("ethereum", "24h")' },
  { title: '☀️ SOL PRICE', formula: 'PRICE("solana")', format: '$#,##0.00', changeFormula: 'CHANGE("solana", "24h")' },
  { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
  { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
];

/** Categories — market structure */
const CATEGORIES_KPIS: KPICardDef[] = [
  { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
  { title: '📊 24H VOLUME', formula: 'GLOBAL("total_volume")', format: COMPACT_USD },
  { title: '🪙 ACTIVE COINS', formula: 'GLOBAL("active_cryptocurrencies")' },
  { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
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
  /** Add Market Share %, Vol/MCap, Performance Score columns */
  addMarketAnalytics?: boolean;
  /** Custom summary metrics for the visual sheet bottom section */
  metrics?: MetricDef[];
  /** Section title for summary metrics */
  metricsSectionTitle?: string;
}

/** Premium layout: Visual sheet (KPIs + 2x2 chart grid) + Data sheet (spill table) */
function buildSpillDashboard(
  workbook: ExcelJS.Workbook,
  config: SpillConfig,
  prefetchedData?: any,
): { sheet: ExcelJS.Worksheet; theme: DashboardTheme } {
  // === VISUAL DASHBOARD SHEET (charts front and center) ===
  const visualWidths = [18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12];
  const { sheet, theme } = initDarkSheet(workbook, config.sheetName, config.dashboardType, visualWidths);

  // OtherLevel sidebar navigation (fixed left panel)
  addSidebar(sheet, config.sheetName, theme, {
    dashboard: config.sheetName,
    data: config.sheetName + ' Data',
  });

  addHeaderBar(sheet, 2, config.title, theme, config.subtitle);
  addKPICards(sheet, 5, enrichKPIs(config.kpis, prefetchedData), theme);
  addSectionDivider(sheet, 10, config.sectionTitle, theme);

  const defaultTitles: [string, string, string, string] = [
    'TOP 10 RANKING',
    'VALUE DISTRIBUTION',
    '24H PERFORMANCE',
    'MARKET OVERVIEW',
  ];
  const afterGrid = addChartGrid(sheet, 12, theme, config.chartTitles || defaultTitles);

  const metricsTitle = config.metricsSectionTitle || '  📈 KEY METRICS';
  addSectionDivider(sheet, afterGrid, metricsTitle, theme);

  const metrics = config.metrics || [
    { label: 'BTC Price', formula: 'PRICE("bitcoin")', format: '$#,##0.00' },
    { label: 'Market Cap', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD },
    { label: 'Fear & Greed', formula: 'FEARGREED()' },
  ];
  for (let i = 0; i < metrics.length; i++) {
    // Resolve fallback values for metric rows
    let fallback: number | string | undefined;
    if (prefetchedData) {
      const m = metrics[i];
      const fm = m.formula.match(/^(\w+)\("?([^"]*)"?\)$/);
      if (fm) {
        const [, fn, arg] = fm;
        if (fn === 'PRICE') fallback = prefetchedData.market?.find((c: any) => c.id === arg)?.current_price;
        else if (fn === 'GLOBAL') fallback = prefetchedData.global?.[arg];
        else if (fn === 'FEARGREED') fallback = prefetchedData.fearGreed?.[0]?.value;
      }
    }
    addMetricRow(sheet, afterGrid + 2 + i, 2, metrics[i].label, metrics[i].formula, theme, metrics[i].format, fallback);
  }

  // Footer with attribution
  addFooter(sheet, afterGrid + 2 + metrics.length + 2, theme);

  // === DATA SHEET (spill table for chart data) ===
  const dataName = config.sheetName + ' Data';
  const dataWidths = config.colWidths ? [18, ...config.colWidths.slice(1)] : undefined;
  const { sheet: data, theme: dt } = initDarkSheet(workbook, dataName, config.dashboardType, dataWidths);
  addSidebar(data, dataName, dt, { dashboard: config.sheetName, data: dataName });
  addHeaderBar(data, 2, config.title + ' \u2014 DATA', dt);
  addSectionDivider(data, 4, config.sectionTitle, dt);
  addTableHeaders(data, 5, config.headers, dt);

  // Pre-populate with real data or fall back to CRK formula
  const resolved = resolveFormulaData(config.formula, prefetchedData);
  if (resolved && resolved.length > 0) {
    populateMarketRows(data, 6, resolved, dt, config.endCol >= 8);
  } else {
    placeSpillFormula(data, 6, 1, config.formula, dt);
  }
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

  // Add market analytics columns if enabled and data available
  if (config.addMarketAnalytics && resolved && resolved.length > 0) {
    const analytics = computeMarketAnalytics(resolved);
    addMarketAnalyticsColumns(data, {
      startRow: 6, headerRow: 5, startCol: config.endCol + 1,
      priceCol: 4, mcapCol: 5, volCol: config.endCol >= 8 ? 8 : 0,
      change24hCol: 6, rowCount: config.spillRows,
      theme: { headerBg: dt.headerBg, headerText: dt.headerText, text: dt.text, accent: dt.accent, muted: dt.muted, bg: dt.bg },
    }, analytics);
  }

  addFooter(data, spillEnd + 2, dt);

  // Preserve sidebar freeze (xSplit:1) + data header freeze (ySplit:5)
  data.views = [{
    state: 'frozen', xSplit: 1, ySplit: 5,
    showGridLines: false, showRowColHeaders: false,
    topLeftCell: 'B6', activeCell: 'B6',
  }];
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
  prefetchedData?: any,
): { sheet: ExcelJS.Worksheet; theme: DashboardTheme } {
  const widths = colWidths ? [18, ...colWidths.slice(1)] : undefined;
  const { sheet, theme } = initDarkSheet(workbook, sheetName, dashboardType, widths);
  addSidebar(sheet, sheetName, theme);
  addHeaderBar(sheet, 2, title, theme);

  // Add section divider + table headers (matching buildSpillDashboard pattern)
  addSectionDivider(sheet, 4, `  ${title}`, theme);
  const headers = (endCol >= 8 ? TOP_HEADERS_VOL : TOP_HEADERS).filter(h => h.col <= endCol);
  addTableHeaders(sheet, 5, headers, theme);

  // Pre-populate with real data or fall back to CRK formula (row 6 = data start)
  const resolved = resolveFormulaData(formula, prefetchedData);
  if (resolved && resolved.length > 0) {
    populateMarketRows(sheet, 6, resolved, theme, endCol >= 8);
  } else {
    placeSpillFormula(sheet, 6, 1, formula, theme);
  }
  addZebraRows(sheet, 6, spillRows, 1, endCol, theme);

  // Footer after data
  addFooter(sheet, 6 + spillRows + 1, theme);

  // Preserve sidebar freeze (xSplit:1) + data header freeze (ySplit:5)
  sheet.views = [{
    state: 'frozen', xSplit: 1, ySplit: 5,
    showGridLines: false, showRowColHeaders: false,
    topLeftCell: 'B6', activeCell: 'B6',
  }];
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
  prefetchedData?: any,
): { sheet: ExcelJS.Worksheet; theme: DashboardTheme } {
  // === VISUAL DASHBOARD SHEET ===
  const visualWidths = [18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12];
  const { sheet, theme } = initDarkSheet(workbook, config.sheetName, config.dashboardType, visualWidths);

  // OtherLevel sidebar navigation
  addSidebar(sheet, config.sheetName, theme, {
    dashboard: config.sheetName,
    data: config.sheetName + ' Data',
  });

  addHeaderBar(sheet, 2, config.title, theme, config.subtitle);
  addKPICards(sheet, 5, enrichKPIs(config.kpis, prefetchedData), theme);
  addSectionDivider(sheet, 10, config.sectionTitle, theme);

  const defaultTitles: [string, string, string, string] = [
    'PRICE COMPARISON',
    'MARKET CAP DISTRIBUTION',
    '24H CHANGE',
    'MARKET OVERVIEW',
  ];
  const afterGrid = addChartGrid(sheet, 12, theme, config.chartTitles || defaultTitles);

  const metricsTitle = config.metricsSectionTitle || '  📈 KEY METRICS';
  addSectionDivider(sheet, afterGrid, metricsTitle, theme);

  const metrics = config.metrics || [
    { label: 'BTC Price', formula: 'PRICE("bitcoin")', format: '$#,##0.00' },
    { label: 'Market Cap', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD },
  ];
  for (let i = 0; i < metrics.length; i++) {
    addMetricRow(sheet, afterGrid + 2 + i, 2, metrics[i].label, metrics[i].formula, theme, metrics[i].format);
  }

  // Footer with attribution
  addFooter(sheet, afterGrid + 2 + metrics.length + 2, theme);

  // === DATA SHEET (per-coin formulas) ===
  const dataName = config.sheetName + ' Data';
  const dataWidths = config.colWidths ? [18, ...config.colWidths.slice(1)] : undefined;
  const { sheet: data, theme: dt } = initDarkSheet(workbook, dataName, config.dashboardType, dataWidths);
  addSidebar(data, dataName, dt, { dashboard: config.sheetName, data: dataName });
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

    // Try to resolve static data for this coin
    const coinData = prefetchedData?.market?.find((c: any) => c.id === coin);

    for (const f of config.formulas) {
      const cell = data.getCell(row, f.col);
      // Use prefetched value with CRK formula as IFERROR fallback
      const staticVal = coinData ? resolveCoinField(f.template, coin, coinData) : undefined;
      if (staticVal !== undefined) {
        const fb = typeof staticVal === 'string' ? `"${staticVal}"` : staticVal;
        cell.value = { formula: `IFERROR(CRK.${f.template.replace('{coin}', coin)},${fb})` };
      } else {
        cell.value = { formula: `CRK.${f.template.replace('{coin}', coin)}` };
      }
      cell.font = { size: 10, color: { argb: dt.accent } };
      if (f.format) cell.numFmt = f.format;
    }
  }

  addFooter(data, 6 + coinList.length + 1, dt);

  // Preserve sidebar freeze (xSplit:1) + data header freeze (ySplit:5)
  data.views = [{
    state: 'frozen', xSplit: 1, ySplit: 5,
    showGridLines: false, showRowColHeaders: false,
    topLeftCell: 'B6', activeCell: 'B6',
  }];
  return { sheet, theme };
}

// ============================================
// VISUAL SHEET NAME MAPPING (for shape injector)
// ============================================

/**
 * Maps each dashboard type to its primary visual sheet name.
 * Used by the shape injector to place rounded rectangle KPI overlays.
 */
export const VISUAL_SHEET_NAMES: Partial<Record<DashboardType, string>> = {
  'market-overview': 'CRK Data',
  'screener': 'CRK Screener',
  'portfolio-tracker': 'CRK Portfolio',
  'gainers-losers': 'CRK Gainers',
  'trending': 'CRK Trending',
  'fear-greed': 'CRK Fear & Greed',
  'bitcoin-dashboard': 'CRK Bitcoin',
  'ethereum-dashboard': 'CRK Ethereum',
  'defi-dashboard': 'CRK DeFi',
  'derivatives': 'CRK Derivatives',
  'funding-rates': 'CRK Derivatives',
  'stablecoins': 'CRK Stablecoins',
  'exchanges': 'CRK Exchanges',
  'nft-tracker': 'CRK NFTs',
  'categories': 'CRK Categories',
  'heatmap': 'CRK Categories',
  'etf-tracker': 'CRK ETFs',
  'layer1-compare': 'CRK Layer Compare',
  'layer2-compare': 'CRK Layer Compare',
  'meme-coins': 'CRK Meme Coins',
  'ai-gaming': 'CRK AI Tokens',
  'defi-yields': 'CRK DeFi Yields',
  'liquidations': 'CRK Liquidations',
  'altcoin-season': 'CRK Altcoin Season',
  'staking-yields': 'CRK Staking',
  'social-sentiment': 'CRK Sentiment',
  'mining-calc': 'CRK Mining',
  'exchange-reserves': 'CRK Exchanges',
  'technical-analysis': 'CRK Technical',
  'correlation': 'CRK Prices',
  'on-chain': 'CRK On-Chain',
  'whale-tracker': 'CRK On-Chain',
  'token-unlocks': 'CRK Token Data',
  'custom': 'CRK Watchlist',
  'volatility': 'CRK Volatility',
  'calculator': 'CRK Volatility',
  'rwa': 'CRK Tokens',
  'metaverse': 'CRK Tokens',
  'privacy-coins': 'CRK Tokens',
  'dev-activity': 'CRK Dev Activity',
};

// ============================================
// NAVIGATION DASHBOARD (Index Sheet)
// ============================================

/** Navigation button metadata for the Index sheet */
interface NavButton {
  label: string;
  description: string;
  targetSheet: string;
  /** 1-based row in sheet where this card starts (for shape injector) */
  gridRow?: number;
  /** 1-based column in sheet where this card starts (for shape injector) */
  gridCol?: number;
}

/**
 * Adds a professional navigation/index sheet as the first dashboard sheet.
 * Creates a dark-themed hub with a grid layout. The shape injector
 * overlays rounded rectangle buttons for each dashboard sheet.
 *
 * Returns the list of navigation buttons so masterGenerator can pass them
 * to the shapeInjector for DrawingML rendering.
 */
export function addNavigationSheet(
  workbook: ExcelJS.Workbook,
  dashboard: DashboardType,
): NavButton[] {
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Navigation', dashboard,
    [18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);

  // OtherLevel sidebar (Home is active)
  addSidebar(sheet, 'CRK Navigation', theme, {
    dashboard: VISUAL_SHEET_NAMES[dashboard] || 'CRK Dashboard',
    data: (VISUAL_SHEET_NAMES[dashboard] || 'CRK') + ' Data',
  });

  // Hero header
  addHeaderBar(sheet, 2, '🚀 CRYPTOREPORTKIT', theme,
    '✨ Premium Crypto Analytics Dashboard \u2022 Real-time BYOK Data');

  // Quick stats bar (row 4) — inline KPI summary cards
  sheet.getRow(4).height = 30;
  const statDefs = [
    { label: '💰 MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, col: 2 },
    { label: '🏆 BTC DOM', formula: 'BTCDOM()', format: '0.00"%"', col: 5 },
    { label: '😱 FEAR/GREED', formula: 'FEARGREED()', col: 8 },
    { label: '🪙 ACTIVE', formula: 'GLOBAL("active_cryptocurrencies")', col: 11 },
  ];
  for (const stat of statDefs) {
    // Label
    sheet.getCell(4, stat.col).value = stat.label;
    sheet.getCell(4, stat.col).font = { size: 7, bold: true, color: { argb: theme.muted } };
    sheet.getCell(4, stat.col).alignment = { horizontal: 'left', vertical: 'middle' };
    // Value with CRK formula
    const valCell = sheet.getCell(4, stat.col + 1);
    valCell.value = { formula: `IFERROR(CRK.${stat.formula},"\u2014")` };
    valCell.font = { size: 11, bold: true, color: { argb: theme.accent } };
    valCell.alignment = { horizontal: 'left', vertical: 'middle' };
    if (stat.format) valCell.numFmt = stat.format;
    // Card background for stat cell group
    for (let cc = stat.col; cc <= stat.col + 2; cc++) {
      sheet.getCell(4, cc).fill = {
        type: 'pattern', pattern: 'solid', fgColor: { argb: theme.kpiBg },
      };
    }
  }

  // === Dashboard cards section ===
  addSectionDivider(sheet, 6, '  🚀 YOUR DASHBOARDS', theme);

  const navButtons: NavButton[] = [];
  const sheetName = VISUAL_SHEET_NAMES[dashboard];
  if (sheetName) {
    // If the visual sheet IS the data sheet (e.g. market-overview → 'CRK Data'),
    // show it as "Data Table" and skip the separate data table card.
    const isDataSheet = sheetName.endsWith(' Data') || sheetName === 'CRK Data';
    navButtons.push({
      label: isDataSheet ? '📋 Data Table' : sheetName.replace('CRK ', ''),
      description: isDataSheet ? 'Market data with conditional formatting' : 'Main dashboard with KPIs and charts',
      targetSheet: sheetName,
    });
    // Only add separate data table if visual sheet is NOT the data sheet
    if (!isDataSheet) {
      const dataSheet = sheetName + ' Data';
      navButtons.push({
        label: '📋 Data Table',
        description: 'Raw data with conditional formatting',
        targetSheet: dataSheet,
      });
    }
  }

  // Sub-sheets based on dashboard type
  const subSheets: Record<string, string[]> = {
    'market-overview': ['CRK Trending'],
    'screener': ['CRK Gainers', 'CRK Losers'],
    'gainers-losers': ['CRK Losers'],
    'bitcoin-dashboard': ['CRK Bitcoin Data'],
    'ethereum-dashboard': ['CRK Ethereum Data'],
    'fear-greed': ['CRK Fear Greed Data'],
    'defi-dashboard': ['CRK DeFi Data'],
    'etf-tracker': ['CRK ETFs Data'],
    'social-sentiment': ['CRK Sentiment Data'],
    'portfolio-tracker': ['CRK Portfolio Data', 'CRK Tax'],
  };
  const extras = subSheets[dashboard] || [];
  for (const sub of extras) {
    navButtons.push({
      label: sub.replace('CRK ', ''),
      description: 'Additional analysis',
      targetSheet: sub,
    });
  }

  // Place dashboard card labels in a 3-column grid (shape injector overlays rounded rectangles)
  const cardCols = [2, 6, 10]; // B, F, J — 4 columns per card
  const cardWidth = 4;
  let cardRow = 7;
  let colIdx = 0;

  for (const btn of navButtons) {
    const c = cardCols[colIdx];
    btn.gridRow = cardRow;
    btn.gridCol = c;

    // Card background fill — OtherLevel: full card border + subtle bg
    for (let r = cardRow; r <= cardRow + 2; r++) {
      for (let cc = c; cc <= c + cardWidth - 1; cc++) {
        sheet.getCell(r, cc).fill = {
          type: 'pattern', pattern: 'solid', fgColor: { argb: theme.cardBg },
        };
        // Subtle card border on all sides
        const isTop = r === cardRow;
        const isBottom = r === cardRow + 2;
        const isLeft = cc === c;
        const isRight = cc === c + cardWidth - 1;
        sheet.getCell(r, cc).border = {
          top: isTop ? { style: 'medium', color: { argb: theme.accent } } : { style: 'thin', color: { argb: theme.border } },
          bottom: isBottom ? { style: 'thin', color: { argb: theme.border } } : undefined,
          left: isLeft ? { style: 'thin', color: { argb: theme.border } } : undefined,
          right: isRight ? { style: 'thin', color: { argb: theme.border } } : undefined,
        };
      }
    }
    // Cell-based fallback labels
    sheet.getCell(cardRow, c).value = btn.label;
    sheet.getCell(cardRow, c).font = { bold: true, size: 13, color: { argb: theme.text } };
    sheet.getCell(cardRow + 1, c).value = btn.description;
    sheet.getCell(cardRow + 1, c).font = { size: 9, color: { argb: theme.muted } };
    // Clickable hyperlink on card label
    sheet.getCell(cardRow + 2, c).value = { text: 'Open \u203A', hyperlink: `#'${btn.targetSheet}'!A1` };
    sheet.getCell(cardRow + 2, c).font = { size: 9, bold: true, color: { argb: theme.accent } };

    colIdx++;
    if (colIdx >= 3) {
      colIdx = 0;
      cardRow += 4; // 3 rows per card + 1 row gap
    }
  }

  // Setup & Tools section removed — Settings and PQ Setup sheets no longer included.

  // Footer
  const footerRow = cardRow + (colIdx > 0 ? 4 : 0) + 1;
  addFooter(sheet, footerRow, theme);

  return navButtons;
}

// ============================================
// MAIN ENTRY POINT
// ============================================

/**
 * Adds CRK formula dashboard sheets to a workbook based on dashboard type.
 * All dashboards use professional dark-themed layouts.
 * When prefetchedData is provided, data sheets are pre-populated with real values
 * and KPI cards use IFERROR fallbacks — templates work without the add-in.
 */
export function addCrkDashboardSheets(
  workbook: ExcelJS.Workbook,
  dashboard: DashboardType,
  coins: string[],
  prefetchedData?: any,
): void {
  const d = prefetchedData;
  switch (dashboard) {
    case 'market-overview':
      addMarketOverviewDashboard(workbook, d);
      break;
    case 'screener':
      addScreenerDashboard(workbook, d);
      break;
    case 'gainers-losers':
      addGainersLosersDashboard(workbook, d);
      break;
    case 'fear-greed':
      addFearGreedDashboard(workbook, d);
      break;
    case 'portfolio-tracker':
      addPortfolioDashboard(workbook, d);
      break;
    case 'trending':
      addTrendingDashboard(workbook, d);
      break;
    case 'technical-analysis':
      addTechnicalDashboard(workbook, coins, d);
      break;
    case 'defi-dashboard':
      addDefiDashboard(workbook, d);
      break;
    case 'derivatives':
    case 'funding-rates':
      addDerivativesDashboard(workbook, d);
      break;
    case 'correlation':
      addCorrelationDashboard(workbook, coins, d);
      break;
    case 'stablecoins':
      addStablecoinsDashboard(workbook, d);
      break;
    case 'exchanges':
      addExchangesDashboard(workbook, d);
      break;
    case 'bitcoin-dashboard':
      addBitcoinDashboard(workbook, d);
      break;
    case 'ethereum-dashboard':
      addEthereumDashboard(workbook, d);
      break;
    case 'nft-tracker':
      addNftDashboard(workbook, d);
      break;
    case 'whale-tracker':
    case 'on-chain':
      addOnChainDashboard(workbook, coins, d);
      break;
    case 'heatmap':
    case 'categories':
      addCategoriesDashboard(workbook, d);
      break;
    case 'etf-tracker':
      addEtfDashboard(workbook, d);
      break;
    case 'layer1-compare':
    case 'layer2-compare':
      addLayerCompareDashboard(workbook, coins, d);
      break;
    case 'meme-coins':
      addMemeCoinsDashboard(workbook, d);
      break;
    case 'ai-gaming':
      addAIGamingDashboard(workbook, d);
      break;
    case 'defi-yields':
      addDefiYieldsDashboard(workbook, d);
      break;
    case 'liquidations':
      addLiquidationsDashboard(workbook, d);
      break;
    case 'altcoin-season':
      addAltcoinSeasonDashboard(workbook, d);
      break;
    case 'token-unlocks':
      addTokenUnlocksDashboard(workbook, coins, d);
      break;
    case 'staking-yields':
      addStakingYieldsDashboard(workbook, d);
      break;
    case 'social-sentiment':
      addSocialSentimentDashboard(workbook, d);
      break;
    case 'mining-calc':
      addMiningDashboard(workbook, d);
      break;
    case 'exchange-reserves':
      addExchangeReservesDashboard(workbook, d);
      break;
    case 'custom':
      addCustomDashboard(workbook, coins, d);
      break;
    case 'volatility':
    case 'calculator':
      addVolatilityDashboard(workbook, coins, d);
      break;
    case 'rwa':
    case 'metaverse':
    case 'privacy-coins':
      addCategoryTokensDashboard(workbook, dashboard, d);
      break;
    case 'dev-activity':
      addDevActivityDashboard(workbook, coins, d);
      break;
    default:
      addMarketOverviewDashboard(workbook, d);
      break;
  }
}

// ============================================
// MARKET OVERVIEW — Premium 2x2 Chart Grid + Data Sheet
// ============================================

function addMarketOverviewDashboard(workbook: ExcelJS.Workbook, d?: any) {
  // NOTE: Visual "CRK Dashboard" sheet removed — live dashboards are on the web.
  // Only the data table + trending sub-sheet are generated.

  // === DATA SHEET (the main user-facing sheet) ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Data', 'market-overview',
    [18, 12, 14, 14, 16, 12, 16, 12, 12, 12, 12, 12, 12, 12]);
  addSidebar(data, 'CRK Data', dt, { dashboard: 'CRK Data', data: 'CRK Data' });
  addHeaderBar(data, 2, '📊 MARKET DATA', dt, 'Top 20 cryptocurrencies by market cap \u2022 Powered by CoinGecko BYOK');
  addSectionDivider(data, 4, '  📊 TOP 20 CRYPTOCURRENCIES', dt);
  addTableHeaders(data, 5, TOP_HEADERS, dt);

  // Pre-populate with real data or fall back to CRK formula
  const top20 = resolveFormulaData('TOP(20)', d);
  if (top20 && top20.length > 0) {
    populateMarketRows(data, 6, top20, dt);
  } else {
    placeSpillFormula(data, 6, 1, 'TOP(20)', dt);
  }
  addZebraRows(data, 6, 20, 1, 7, dt);
  addPercentFormatting(data, 'F6:F25', dt);
  addPercentFormatting(data, 'G6:G25', dt);
  addDataBars(data, 'E6:E25', dt.accent);

  // Add market analytics columns (Market Share %, Vol/MCap, Performance Score)
  if (top20 && top20.length > 0) {
    const analytics = computeMarketAnalytics(top20);
    addMarketAnalyticsColumns(data, {
      startRow: 6, headerRow: 5, startCol: 8,
      priceCol: 4, mcapCol: 5, volCol: 0, change24hCol: 6, rowCount: 20,
      theme: { headerBg: dt.headerBg, headerText: dt.headerText, text: dt.text, accent: dt.accent, muted: dt.muted, bg: dt.bg },
    }, analytics);
  }

  addFooter(data, 27, dt);

  // Preserve sidebar freeze (xSplit:1) + data header freeze (ySplit:5)
  data.views = [{
    state: 'frozen', xSplit: 1, ySplit: 5,
    showGridLines: false, showRowColHeaders: false,
    topLeftCell: 'B6', activeCell: 'B6',
  }];

  // Trending sub-sheet
  buildSubSheet(workbook, 'CRK Trending', 'market-overview', '🔥 TRENDING COINS', 'TRENDING(7)', 10, 5,
    [3, 25, 18, 15, 14], d);
}

// ============================================
// SCREENER — Premium 2x2 Chart Grid + Data Sheet
// ============================================

function addScreenerDashboard(workbook: ExcelJS.Workbook, d?: any) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Screener', 'screener',
    [18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);
  addSidebar(sheet, 'CRK Screener', theme, { dashboard: 'CRK Screener', data: 'CRK Screener Data' });

  addHeaderBar(sheet, 2, '🔍 CRYPTO SCREENER', theme, 'Top 50 coins by market cap');
  addKPICards(sheet, 5, enrichKPIs(MARKET_KPIS, d), theme);
  addSectionDivider(sheet, 10, '  📊 MARKET ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    '📊 TOP 20 RANKING',
    '🥧 MARKET SHARE',
    '📈 24H CHANGE',
    '📈 7D CHANGE',
  ]);

  const btcPrice = d?.market?.find((c: any) => c.id === 'bitcoin')?.current_price;
  const ethPrice = d?.market?.find((c: any) => c.id === 'ethereum')?.current_price;
  const solPrice = d?.market?.find((c: any) => c.id === 'solana')?.current_price;
  addSectionDivider(sheet, afterGrid, '  📋 SUMMARY', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'BTC Price', 'PRICE("bitcoin")', theme, '$#,##0.00', btcPrice);
  addMetricRow(sheet, afterGrid + 3, 2, 'ETH Price', 'PRICE("ethereum")', theme, '$#,##0.00', ethPrice);
  addMetricRow(sheet, afterGrid + 4, 2, 'SOL Price', 'PRICE("solana")', theme, '$#,##0.00', solPrice);
  addFooter(sheet, afterGrid + 6, theme);

  // === DATA SHEET ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Screener Data', 'screener',
    [18, 18, 12, 14, 16, 12, 12, 16]);
  addSidebar(data, 'CRK Screener Data', dt, { dashboard: 'CRK Screener', data: 'CRK Screener Data' });
  addHeaderBar(data, 2, '🔍 SCREENER DATA', dt, 'Source data for screener charts');
  addSectionDivider(data, 4, '  🔍 TOP 50 BY MARKET CAP', dt);
  addTableHeaders(data, 5, TOP_HEADERS_VOL, dt);

  const top50 = resolveFormulaData('TOP(50)', d);
  if (top50 && top50.length > 0) {
    populateMarketRows(data, 6, top50, dt, true);
  } else {
    placeSpillFormula(data, 6, 1, 'TOP(50)', dt);
  }
  addZebraRows(data, 6, 50, 1, 8, dt);
  addPercentFormatting(data, 'F6:F55', dt);
  addPercentFormatting(data, 'G6:G55', dt);
  addDataBars(data, 'E6:E55', dt.accent);
  addColorScale(data, 'H6:H55', dt.bg, dt.accent);

  // Add market analytics columns (Market Share %, Vol/MCap, Performance Score)
  if (top50 && top50.length > 0) {
    const analytics = computeMarketAnalytics(top50);
    addMarketAnalyticsColumns(data, {
      startRow: 6, headerRow: 5, startCol: 9,
      priceCol: 4, mcapCol: 5, volCol: 8, change24hCol: 6, rowCount: 50,
      theme: { headerBg: dt.headerBg, headerText: dt.headerText, text: dt.text, accent: dt.accent, muted: dt.muted, bg: dt.bg },
    }, analytics);
  }

  addFooter(data, 58, dt);

  data.views = [{
    state: 'frozen', xSplit: 1, ySplit: 5,
    showGridLines: false, showRowColHeaders: false,
    topLeftCell: 'B6', activeCell: 'B6',
  }];

  // Gainers sub-sheet
  buildSubSheet(workbook, 'CRK Gainers', 'screener', '🚀 TOP 20 GAINERS (24H)', 'GAINERS(20)', 20, 6,
    [3, 18, 12, 14, 16, 12], d);

  // Losers sub-sheet
  buildSubSheet(workbook, 'CRK Losers', 'screener', '📉 TOP 20 LOSERS (24H)', 'LOSERS(20)', 20, 6,
    [3, 18, 12, 14, 16, 12], d);
}

// ============================================
// PORTFOLIO TRACKER — Premium 2x2 Chart Grid + Data Sheet
// ============================================

function addPortfolioDashboard(workbook: ExcelJS.Workbook, d?: any) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Portfolio', 'portfolio-tracker',
    [18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);
  addSidebar(sheet, 'CRK Portfolio', theme, { dashboard: 'CRK Portfolio', data: 'CRK Portfolio Data' });

  addHeaderBar(sheet, 2, '💼 PORTFOLIO TRACKER', theme, 'Track your crypto holdings and performance');

  addKPICards(sheet, 5, enrichKPIs([
    { title: '💼 TOTAL VALUE', formula: 'PORTFOLIO_VALUE()', format: '$#,##0.00', changeFormula: 'PORTFOLIO_PNL()' },
    { title: '📊 TOTAL PNL', formula: 'PORTFOLIO_PNL()', format: '$#,##0.00' },
    { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
    { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  ], d), theme);

  addSectionDivider(sheet, 10, '  📊 PORTFOLIO ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    '🥧 PORTFOLIO ALLOCATION',
    '💰 HOLDINGS BY VALUE',
    '🌍 MARKET OVERVIEW',
    '📊 TOP 10 MARKET CAP',
  ]);

  addSectionDivider(sheet, afterGrid, '  🌍 MARKET CONTEXT', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'Total Market Cap', 'GLOBAL("total_market_cap")', theme, COMPACT_USD, d?.global?.total_market_cap);
  addMetricRow(sheet, afterGrid + 3, 2, 'BTC Price', 'PRICE("bitcoin")', theme, '$#,##0.00', d?.market?.find((c: any) => c.id === 'bitcoin')?.current_price);
  addMetricRow(sheet, afterGrid + 4, 2, 'ETH Price', 'PRICE("ethereum")', theme, '$#,##0.00', d?.market?.find((c: any) => c.id === 'ethereum')?.current_price);
  addFooter(sheet, afterGrid + 6, theme);

  // === DATA SHEET (holdings + top coins) ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Portfolio Data', 'portfolio-tracker',
    [18, 22, 18, 18, 16, 14]);
  addSidebar(data, 'CRK Portfolio Data', dt, { dashboard: 'CRK Portfolio', data: 'CRK Portfolio Data' });
  addHeaderBar(data, 2, '💼 PORTFOLIO DATA', dt, 'Holdings and market data');
  addSectionDivider(data, 4, '  💼 HOLDINGS', dt);
  placeSpillFormula(data, 6, 1, 'PORTFOLIO_LIST()', dt);
  addZebraRows(data, 6, 20, 1, 6, dt);

  addSectionDivider(data, 28, '  TOP 10 COINS', dt);
  addTableHeaders(data, 29, TOP_HEADERS.slice(0, 5), dt);
  const top10 = resolveFormulaData('TOP(10)', d);
  if (top10 && top10.length > 0) {
    populateMarketRows(data, 30, top10, dt);
  } else {
    placeSpillFormula(data, 30, 1, 'TOP(10)', dt);
  }
  addZebraRows(data, 30, 10, 1, 5, dt);

  addFooter(data, 42, dt);

  data.views = [{
    state: 'frozen', xSplit: 1, ySplit: 5,
    showGridLines: false, showRowColHeaders: false,
    topLeftCell: 'B6', activeCell: 'B6',
  }];

  // Tax summary sub-sheet
  const { sheet: taxSheet, theme: taxTheme } = initDarkSheet(workbook, 'CRK Tax', 'portfolio-tracker',
    [18, 22, 18, 18]);
  addSidebar(taxSheet, 'CRK Tax', taxTheme, { dashboard: 'CRK Portfolio', data: 'CRK Portfolio Data' });
  addHeaderBar(taxSheet, 2, 'TAX SUMMARY', taxTheme);
  placeSpillFormula(taxSheet, 5, 1, 'TAX_SUMMARY()', taxTheme);
  addZebraRows(taxSheet, 5, 20, 1, 4, taxTheme);
  addFooter(taxSheet, 26, taxTheme);
}

// ============================================
// BITCOIN DASHBOARD — Premium 2x2 Chart Grid + Data Sheet
// ============================================

function addBitcoinDashboard(workbook: ExcelJS.Workbook, d?: any) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Bitcoin', 'bitcoin-dashboard',
    [18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);
  addSidebar(sheet, 'CRK Bitcoin', theme, { dashboard: 'CRK Bitcoin', data: 'CRK Bitcoin Data' });

  addHeaderBar(sheet, 2, '₿ BITCOIN DASHBOARD', theme, 'BTC price, dominance, and technical indicators');

  addKPICards(sheet, 5, enrichKPIs([
    { title: '₿ BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
    { title: '📈 24H CHANGE', formula: 'CHANGE("bitcoin", "24h")', format: '0.00"%"' },
    { title: '💰 MARKET CAP', formula: 'MCAP("bitcoin")', format: COMPACT_USD },
    { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
  ], d), theme);

  addSectionDivider(sheet, 10, '  📊 BITCOIN ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    '📈 TECHNICAL INDICATORS',
    '💹 BTC vs MARKET',
    '📊 MOVING AVERAGES',
    '🏆 TOP COINS COMPARISON',
  ]);

  const btcData = d?.market?.find((c: any) => c.id === 'bitcoin');
  addSectionDivider(sheet, afterGrid, '  💭 MARKET SENTIMENT', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'Fear & Greed Index', 'FEARGREED()', theme, undefined, d?.fearGreed?.[0]?.value);
  addMetricRow(sheet, afterGrid + 3, 2, 'Fear & Greed Label', 'FEARGREED("class")', theme, undefined, d?.fearGreed?.[0]?.value_classification);
  addMetricRow(sheet, afterGrid + 4, 2, 'All-Time High', 'ATH("bitcoin")', theme, '$#,##0.00', btcData?.ath);
  addMetricRow(sheet, afterGrid + 5, 2, 'ATH % Down', 'ATH_CHANGE("bitcoin")', theme, '0.00"%"', btcData?.ath_change_percentage);
  addFooter(sheet, afterGrid + 7, theme);

  // === DATA SHEET (technical indicators + OHLC data + comparison) ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Bitcoin Data', 'bitcoin-dashboard',
    [18, 28, 20, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14]);
  addSidebar(data, 'CRK Bitcoin Data', dt, { dashboard: 'CRK Bitcoin', data: 'CRK Bitcoin Data' });
  addHeaderBar(data, 2, '₿ BITCOIN DATA', dt, 'Technical indicators, OHLC data, and comparison');

  addSectionDivider(data, 4, '  KEY INDICATORS (LATEST)', dt);
  const indicatorLabels = [
    { label: 'RSI (14)', formula: 'RSI("bitcoin", 14)', format: '0.00' },
    { label: 'SMA (50)', formula: 'SMA("bitcoin", 50)', format: '$#,##0.00' },
    { label: 'SMA (200)', formula: 'SMA("bitcoin", 200)', format: '$#,##0.00' },
    { label: 'EMA (12)', formula: 'EMA("bitcoin", 12)', format: '$#,##0.00' },
    { label: 'MACD', formula: 'MACD("bitcoin")', format: '0.0000' },
    { label: 'BB Upper', formula: 'BB("bitcoin", "upper", 20)', format: '$#,##0.00' },
    { label: 'BB Lower', formula: 'BB("bitcoin", "lower", 20)', format: '$#,##0.00' },
  ];

  // Pre-populate indicator values from OHLC data if available
  const btcOhlc: OHLCRow[] = d?.ohlc?.bitcoin || [];
  let computedIndicators: ReturnType<typeof computeTechnicalIndicators> | null = null;
  if (btcOhlc.length > 0) {
    computedIndicators = computeTechnicalIndicators(btcOhlc);
    const lastIdx = btcOhlc.length - 1;
    const latestValues: Record<string, number | null> = {
      'RSI (14)': computedIndicators.rsi14[lastIdx],
      'SMA (50)': computedIndicators.sma50[lastIdx],
      'SMA (200)': null, // Need 200+ data points
      'EMA (12)': computedIndicators.ema12[lastIdx],
      'MACD': computedIndicators.macd[lastIdx],
      'BB Upper': computedIndicators.bbUpper[lastIdx],
      'BB Lower': computedIndicators.bbLower[lastIdx],
    };
    for (let i = 0; i < indicatorLabels.length; i++) {
      const val = latestValues[indicatorLabels[i].label];
      addMetricRow(data, 6 + i, 2, indicatorLabels[i].label, indicatorLabels[i].formula, dt, indicatorLabels[i].format, val ?? undefined);
    }
  } else {
    for (let i = 0; i < indicatorLabels.length; i++) {
      addMetricRow(data, 6 + i, 2, indicatorLabels[i].label, indicatorLabels[i].formula, dt, indicatorLabels[i].format);
    }
  }
  addZebraRows(data, 6, indicatorLabels.length, 2, 3, dt);

  // === OHLC DATA TABLE WITH COMPUTED INDICATORS ===
  const ohlcStartRow = 15;
  addSectionDivider(data, ohlcStartRow - 1, '  OHLC DATA + TECHNICAL INDICATORS', dt);
  const ohlcHeaders = [
    { col: 1, label: 'Date' },
    { col: 2, label: 'Open' },
    { col: 3, label: 'High' },
    { col: 4, label: 'Low' },
    { col: 5, label: 'Close' },
  ];
  addTableHeaders(data, ohlcStartRow, ohlcHeaders, dt);

  if (btcOhlc.length > 0 && computedIndicators) {
    // Populate OHLC rows
    const rowCount = btcOhlc.length;
    for (let i = 0; i < rowCount; i++) {
      const row = ohlcStartRow + 1 + i;
      const o = btcOhlc[i];
      data.getCell(row, 1).value = o.timestamp ? new Date(o.timestamp) : '';
      data.getCell(row, 1).numFmt = 'yyyy-mm-dd hh:mm';
      data.getCell(row, 1).font = { size: 10, color: { argb: dt.text } };
      data.getCell(row, 2).value = o.open;
      data.getCell(row, 2).numFmt = '$#,##0.00';
      data.getCell(row, 2).font = { size: 10, color: { argb: dt.text } };
      data.getCell(row, 3).value = o.high;
      data.getCell(row, 3).numFmt = '$#,##0.00';
      data.getCell(row, 3).font = { size: 10, color: { argb: dt.text } };
      data.getCell(row, 4).value = o.low;
      data.getCell(row, 4).numFmt = '$#,##0.00';
      data.getCell(row, 4).font = { size: 10, color: { argb: dt.text } };
      data.getCell(row, 5).value = o.close;
      data.getCell(row, 5).numFmt = '$#,##0.00';
      data.getCell(row, 5).font = { size: 10, color: { argb: dt.text } };
    }

    // Add computed indicator columns
    addTechnicalColumns(data, {
      startRow: ohlcStartRow + 1,
      headerRow: ohlcStartRow,
      startCol: 6,
      closeCol: 5,
      rowCount,
      theme: { headerBg: dt.headerBg, headerText: dt.headerText, text: dt.text, accent: dt.accent, muted: dt.muted, bg: dt.bg },
    }, computedIndicators);

    addZebraRows(data, ohlcStartRow + 1, rowCount, 1, 16, dt);

    // Comparison table after OHLC
    const compStart = ohlcStartRow + 1 + rowCount + 2;
    addSectionDivider(data, compStart - 1, '  TOP 10 COMPARISON', dt);
    addTableHeaders(data, compStart, TOP_HEADERS.slice(0, 5), dt);
    const btcTop10 = resolveFormulaData('TOP(10)', d);
    if (btcTop10 && btcTop10.length > 0) {
      populateMarketRows(data, compStart + 1, btcTop10, dt);
    } else {
      placeSpillFormula(data, compStart + 1, 1, 'TOP(10)', dt);
    }
    addZebraRows(data, compStart + 1, 10, 1, 5, dt);
  } else {
    // No OHLC data — use existing CRK formula approach
    addSectionDivider(data, 14, '  TOP 10 COMPARISON', dt);
    addTableHeaders(data, 15, TOP_HEADERS.slice(0, 5), dt);
    const btcTop10 = resolveFormulaData('TOP(10)', d);
    if (btcTop10 && btcTop10.length > 0) {
      populateMarketRows(data, 16, btcTop10, dt);
    } else {
      placeSpillFormula(data, 16, 1, 'TOP(10)', dt);
    }
    addZebraRows(data, 16, 10, 1, 5, dt);
  }

  addFooter(data, 28, dt);

  data.views = [{
    state: 'frozen', xSplit: 1, ySplit: 5,
    showGridLines: false, showRowColHeaders: false,
    topLeftCell: 'B6', activeCell: 'B6',
  }];
}

// ============================================
// GAINERS & LOSERS — Rankings Sunset Theme
// ============================================

function addGainersLosersDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Gainers',
    dashboardType: 'gainers-losers',
    title: '🚀 TOP GAINERS (24H)',
    subtitle: 'Biggest price increases in the last 24 hours',
    kpis: GAINERS_KPIS,
    sectionTitle: '  🚀 TOP 20 GAINERS',
    headers: TOP_HEADERS,
    formula: 'GAINERS(20)',
    spillRows: 20,
    endCol: 7,
    percentCols: [6, 7],
    dataBarCol: 6,
    addMarketAnalytics: true,
    chartTitles: ['24H TOP PERFORMERS', 'MARKET CAP SHARE', '7D PERFORMANCE', 'PRICE COMPARISON'],
    metricsSectionTitle: '  🚀 MARKET MOMENTUM',
    metrics: [
      { label: 'Market Cap Change', formula: 'GLOBAL("market_cap_change_percentage_24h_usd")', format: '0.00"%"' },
      { label: 'BTC Price', formula: 'PRICE("bitcoin")', format: '$#,##0.00' },
      { label: 'ETH Price', formula: 'PRICE("ethereum")', format: '$#,##0.00' },
      { label: 'Total Volume', formula: 'GLOBAL("total_volume")', format: COMPACT_USD },
    ],
  }, d);

  buildSubSheet(workbook, 'CRK Losers', 'gainers-losers', 'TOP 20 LOSERS (24H)', 'LOSERS(20)', 20, 7, undefined, d);
}

// ============================================
// FEAR & GREED — Analytics Purple Theme
// ============================================

function addFearGreedDashboard(workbook: ExcelJS.Workbook, d?: any) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Fear & Greed', 'fear-greed',
    [18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);
  addSidebar(sheet, 'CRK Fear & Greed', theme, { dashboard: 'CRK Fear & Greed', data: 'CRK Fear Greed Data' });

  addHeaderBar(sheet, 2, '😱 FEAR & GREED INDEX', theme, 'Crypto market sentiment indicator');
  addKPICards(sheet, 5, enrichKPIs(SENTIMENT_KPIS, d), theme);
  addSectionDivider(sheet, 10, '  💭 SENTIMENT ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    '📊 TOP 10 MARKET CAP',
    '🥧 MARKET DISTRIBUTION',
    '📈 24H PERFORMANCE',
    '💹 PRICE COMPARISON',
  ]);

  addSectionDivider(sheet, afterGrid, '  🌍 MARKET OVERVIEW', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'Total Market Cap', 'GLOBAL("total_market_cap")', theme, COMPACT_USD, d?.global?.total_market_cap);
  addMetricRow(sheet, afterGrid + 3, 2, '24H Volume', 'GLOBAL("total_volume")', theme, COMPACT_USD, d?.global?.total_volume);
  addMetricRow(sheet, afterGrid + 4, 2, 'BTC Price', 'PRICE("bitcoin")', theme, '$#,##0.00', d?.market?.find((c: any) => c.id === 'bitcoin')?.current_price);
  addMetricRow(sheet, afterGrid + 5, 2, 'ETH Price', 'PRICE("ethereum")', theme, '$#,##0.00', d?.market?.find((c: any) => c.id === 'ethereum')?.current_price);
  addFooter(sheet, afterGrid + 7, theme);

  // === DATA SHEET ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Fear Greed Data', 'fear-greed');
  addSidebar(data, 'CRK Fear Greed Data', dt, { dashboard: 'CRK Fear & Greed', data: 'CRK Fear Greed Data' });
  addHeaderBar(data, 2, '😱 SENTIMENT DATA', dt);
  addSectionDivider(data, 4, '  😱 TOP 10 CRYPTOCURRENCIES', dt);
  addTableHeaders(data, 5, TOP_HEADERS, dt);
  const top10 = resolveFormulaData('TOP(10)', d);
  if (top10 && top10.length > 0) {
    populateMarketRows(data, 6, top10, dt);
  } else {
    placeSpillFormula(data, 6, 1, 'TOP(10)', dt);
  }
  addZebraRows(data, 6, 10, 1, 7, dt);
  addPercentFormatting(data, 'F6:F15', dt);
  addPercentFormatting(data, 'G6:G15', dt);

  addFooter(data, 18, dt);

  data.views = [{
    state: 'frozen', xSplit: 1, ySplit: 5,
    showGridLines: false, showRowColHeaders: false,
    topLeftCell: 'B6', activeCell: 'B6',
  }];
}

// ============================================
// TRENDING — Rankings Sunset Theme
// ============================================

function addTrendingDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Trending',
    dashboardType: 'trending',
    title: '🔥 TRENDING COINS',
    subtitle: 'Most searched coins in the last 24 hours',
    colWidths: [3, 25, 18, 15, 16, 14],
    kpis: TRENDING_KPIS,
    sectionTitle: '  🔥 TRENDING NOW',
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
  }, d);
}

// ============================================
// TECHNICAL ANALYSIS — Trading Pro Theme
// ============================================

function addTechnicalDashboard(workbook: ExcelJS.Workbook, coins: string[], d?: any) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Technical',
    dashboardType: 'technical-analysis',
    title: '📈 TECHNICAL DASHBOARD',
    subtitle: 'RSI, SMA, EMA, Bollinger Bands, MACD',
    colWidths: [3, 16, 14, 12, 14, 14, 14, 14, 14],
    kpis: [
      { title: '₿ BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
      { title: '📈 BTC RSI (14)', formula: 'RSI("bitcoin", 14)', format: '0.00' },
      { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
      { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
    ],
    sectionTitle: '  📈 TECHNICAL INDICATORS',
    chartTitles: ['RSI COMPARISON', 'PRICE COMPARISON', 'SMA vs EMA', 'MACD SIGNAL'],
    metricsSectionTitle: '  📈 BTC TECHNICALS',
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
  }, d);
}

// ============================================
// DEFI DASHBOARD — Premium 2x2 Chart Grid + Data Sheet
// ============================================

function addDefiDashboard(workbook: ExcelJS.Workbook, d?: any) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK DeFi', 'defi-dashboard',
    [18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);
  addSidebar(sheet, 'CRK DeFi', theme, { dashboard: 'CRK DeFi', data: 'CRK DeFi Data' });

  addHeaderBar(sheet, 2, '🔗 DEFI DASHBOARD', theme, 'Decentralized finance protocols and metrics');
  addKPICards(sheet, 5, enrichKPIs(DEFI_KPIS, d), theme);
  addSectionDivider(sheet, 10, '  📊 DEFI ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    '📊 TOP 10 PROTOCOLS',
    '🥧 PROTOCOL DISTRIBUTION',
    '📊 24H VOLUME',
    '💹 DEFI vs MARKET',
  ]);

  addSectionDivider(sheet, afterGrid, '  📈 DEFI METRICS', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'DeFi Market Cap', 'DEFI_GLOBAL("market_cap")', theme, COMPACT_USD, d?.defi?.defi_market_cap);
  addMetricRow(sheet, afterGrid + 3, 2, 'DeFi Dominance', 'DEFI_GLOBAL("dominance")', theme, '0.00"%"', d?.defi?.defi_dominance);
  addMetricRow(sheet, afterGrid + 4, 2, 'DeFi Volume', 'DEFI_GLOBAL("volume")', theme, COMPACT_USD, d?.defi?.trading_volume_24h);
  addFooter(sheet, afterGrid + 6, theme);

  // === DATA SHEET ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK DeFi Data', 'defi-dashboard',
    [18, 22, 16, 16, 16, 14]);
  addSidebar(data, 'CRK DeFi Data', dt, { dashboard: 'CRK DeFi', data: 'CRK DeFi Data' });
  addHeaderBar(data, 2, '🔗 DEFI DATA', dt, 'Source data for DeFi charts');
  addSectionDivider(data, 4, '  🔗 TOP 50 DEFI PROTOCOLS', dt);
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

  addFooter(data, 58, dt);

  data.views = [{
    state: 'frozen', xSplit: 1, ySplit: 5,
    showGridLines: false, showRowColHeaders: false,
    topLeftCell: 'B6', activeCell: 'B6',
  }];

  // Pools sub-sheet
  buildSubSheet(workbook, 'CRK Pools', 'defi-dashboard', 'TOP DEX POOLS', 'POOLS("eth", 20)', 20, 5,
    [3, 25, 18, 16, 16]);
}

// ============================================
// DERIVATIVES — Trading Pro Theme
// ============================================

function addDerivativesDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Derivatives',
    dashboardType: 'derivatives',
    title: '📉 DERIVATIVES MARKET',
    subtitle: 'Futures, options, and perpetual contracts',
    colWidths: [3, 22, 16, 16, 16, 14],
    kpis: TRADING_KPIS,
    sectionTitle: '  📉 TOP 50 DERIVATIVES EXCHANGES',
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
  }, d);
}

// ============================================
// CORRELATION / PRICE WATCH — Analytics Purple Theme
// ============================================

function addCorrelationDashboard(workbook: ExcelJS.Workbook, coins: string[], d?: any) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Prices',
    dashboardType: 'correlation',
    title: '👁️ PRICE WATCH',
    subtitle: 'Real-time price tracking and comparison',
    colWidths: [3, 20, 16, 16, 16],
    kpis: [
      { title: '₿ BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
      { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
      { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
      { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
    ],
    sectionTitle: '  👁️ PRICE COMPARISON',
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
  }, d);

  // === CORRELATION MATRIX SUB-SHEET ===
  addCorrelationMatrixSheet(workbook, coins, d);
}

/**
 * Adds a correlation matrix sheet with CORREL formulas.
 * Uses 24h change data from prefetched market data to build a
 * pre-populated NxN matrix showing how coin prices move together.
 */
function addCorrelationMatrixSheet(workbook: ExcelJS.Workbook, coins: string[], d?: any) {
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Correlation', 'correlation',
    [18, 16, 14, 14, 14, 14, 14, 14, 14, 14, 14]);
  addSidebar(sheet, 'CRK Correlation', theme, { dashboard: 'CRK Prices', data: 'CRK Prices' });
  addHeaderBar(sheet, 2, '🔗 CORRELATION MATRIX', theme, 'Price change correlation between assets');

  addSectionDivider(sheet, 4, '  🔗 CHANGE CORRELATION (24H vs 7D)', theme);

  const coinList = coins.length > 0 ? coins.slice(0, 10) :
    ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'xrp',
     'cardano', 'dogecoin', 'polkadot', 'avalanche-2', 'chainlink'];
  const n = coinList.length;

  // Header row — coin names across top
  for (let j = 0; j < n; j++) {
    const cell = sheet.getCell(5, j + 2);
    cell.value = coinList[j].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).substring(0, 8);
    cell.font = { bold: true, size: 9, color: { argb: theme.text } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.border } };
    cell.alignment = { horizontal: 'center', textRotation: 45 };
  }

  // Matrix body
  const marketData = d?.market || [];
  for (let i = 0; i < n; i++) {
    const rowNum = 6 + i;
    // Row label
    const labelCell = sheet.getCell(rowNum, 1);
    labelCell.value = coinList[i].replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()).substring(0, 12);
    labelCell.font = { bold: true, size: 10, color: { argb: theme.text } };
    labelCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.cardBg } };

    const coinI = marketData.find((c: any) => c.id === coinList[i]);

    for (let j = 0; j < n; j++) {
      const cell = sheet.getCell(rowNum, j + 2);
      cell.numFmt = '0.00';
      cell.alignment = { horizontal: 'center' };

      if (i === j) {
        // Diagonal = 1.00
        cell.value = 1;
        cell.font = { bold: true, size: 10, color: { argb: theme.accent } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.cardBg } };
      } else if (coinI && marketData.length > 0) {
        const coinJ = marketData.find((c: any) => c.id === coinList[j]);
        // Approximate correlation from 24h and 7d change direction
        const chg24I = coinI?.price_change_percentage_24h ?? 0;
        const chg7dI = coinI?.price_change_percentage_7d_in_currency ?? 0;
        const chg24J = coinJ?.price_change_percentage_24h ?? 0;
        const chg7dJ = coinJ?.price_change_percentage_7d_in_currency ?? 0;
        // Normalized dot-product approximation
        const magI = Math.sqrt(chg24I ** 2 + chg7dI ** 2) || 1;
        const magJ = Math.sqrt(chg24J ** 2 + chg7dJ ** 2) || 1;
        const corr = (chg24I * chg24J + chg7dI * chg7dJ) / (magI * magJ);
        cell.value = Math.round(corr * 100) / 100;
        // Color: green for positive, red for negative
        cell.font = { size: 10, color: { argb: corr >= 0 ? 'FF22C55E' : 'FFEF4444' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.bg } };
      } else {
        // Formula fallback using CRK functions
        cell.value = 0;
        cell.font = { size: 10, color: { argb: theme.muted } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.bg } };
      }
    }
  }

  // Legend
  const legendRow = 6 + n + 2;
  addSectionDivider(sheet, legendRow, '  📖 HOW TO READ', theme);
  const legendItems = [
    { label: '+1.00', desc: 'Perfect positive correlation — prices move together' },
    { label: '  0.00', desc: 'No correlation — prices move independently' },
    { label: '–1.00', desc: 'Perfect negative correlation — prices move oppositely' },
  ];
  for (let i = 0; i < legendItems.length; i++) {
    sheet.getCell(legendRow + 2 + i, 1).value = legendItems[i].label;
    sheet.getCell(legendRow + 2 + i, 1).font = { bold: true, size: 10, color: { argb: theme.accent } };
    sheet.getCell(legendRow + 2 + i, 2).value = legendItems[i].desc;
    sheet.getCell(legendRow + 2 + i, 2).font = { size: 10, color: { argb: theme.muted } };
  }
  addFooter(sheet, legendRow + 2 + legendItems.length + 1, theme);
}

// ============================================
// STABLECOINS — Ecosystem Blue Theme
// ============================================

function addStablecoinsDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Stablecoins',
    dashboardType: 'stablecoins',
    title: '💵 STABLECOINS',
    subtitle: 'Stablecoin market overview and peg tracking',
    colWidths: [3, 22, 14, 16, 16, 14],
    kpis: MARKET_KPIS,
    sectionTitle: '  💵 TOP 20 STABLECOINS',
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
  }, d);
}

// ============================================
// EXCHANGES — Institutional Theme
// ============================================

function addExchangesDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Exchanges',
    dashboardType: 'exchanges',
    title: '🏦 TOP EXCHANGES',
    subtitle: 'Centralized and decentralized exchange rankings',
    colWidths: [3, 22, 16, 16, 14, 14],
    kpis: EXCHANGE_KPIS,
    sectionTitle: '  🏦 TOP 50 EXCHANGES',
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
  }, d);
}

// ============================================
// ETHEREUM DASHBOARD — Premium 2x2 Chart Grid + Data Sheet
// ============================================

function addEthereumDashboard(workbook: ExcelJS.Workbook, d?: any) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Ethereum', 'ethereum-dashboard',
    [18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);
  addSidebar(sheet, 'CRK Ethereum', theme, { dashboard: 'CRK Ethereum', data: 'CRK Ethereum Data' });

  addHeaderBar(sheet, 2, 'Ξ ETHEREUM DASHBOARD', theme, 'ETH price, DeFi metrics, and market data');

  const ethData = d?.market?.find((c: any) => c.id === 'ethereum');
  addKPICards(sheet, 5, enrichKPIs([
    { title: 'Ξ ETH PRICE', formula: 'PRICE("ethereum")', format: '$#,##0.00', changeFormula: 'CHANGE("ethereum", "24h")' },
    { title: '📈 24H CHANGE', formula: 'CHANGE("ethereum", "24h")', format: '0.00"%"' },
    { title: '💰 ETH MARKET CAP', formula: 'MCAP("ethereum")', format: COMPACT_USD },
    { title: '🔗 DEFI MARKET CAP', formula: 'DEFI_GLOBAL("market_cap")', format: COMPACT_USD },
  ], d), theme);

  addSectionDivider(sheet, 10, '  📊 ETHEREUM ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    '📈 TECHNICAL INDICATORS',
    '💹 ETH vs DEFI',
    '📊 MOVING AVERAGES',
    '🔗 DEFI PROTOCOL TVL',
  ]);

  addSectionDivider(sheet, afterGrid, '  🔗 DEFI ECOSYSTEM', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'DeFi Market Cap', 'DEFI_GLOBAL("market_cap")', theme, COMPACT_USD, d?.defi?.defi_market_cap);
  addMetricRow(sheet, afterGrid + 3, 2, 'DeFi Dominance', 'DEFI_GLOBAL("dominance")', theme, '0.00"%"', d?.defi?.defi_dominance);
  addMetricRow(sheet, afterGrid + 4, 2, 'DeFi Volume', 'DEFI_GLOBAL("volume")', theme, COMPACT_USD, d?.defi?.trading_volume_24h);
  addMetricRow(sheet, afterGrid + 5, 2, 'All-Time High', 'ATH("ethereum")', theme, '$#,##0.00', ethData?.ath);
  addFooter(sheet, afterGrid + 7, theme);

  // === DATA SHEET (technical indicators + OHLC + DeFi) ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Ethereum Data', 'ethereum-dashboard',
    [18, 28, 20, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14]);
  addSidebar(data, 'CRK Ethereum Data', dt, { dashboard: 'CRK Ethereum', data: 'CRK Ethereum Data' });
  addHeaderBar(data, 2, 'Ξ ETHEREUM DATA', dt, 'Technical indicators, OHLC data, and DeFi metrics');

  addSectionDivider(data, 4, '  KEY INDICATORS (LATEST)', dt);
  const ethIndicators = [
    { label: 'RSI (14)', formula: 'RSI("ethereum", 14)', format: '0.00' },
    { label: 'SMA (50)', formula: 'SMA("ethereum", 50)', format: '$#,##0.00' },
    { label: 'SMA (200)', formula: 'SMA("ethereum", 200)', format: '$#,##0.00' },
    { label: 'EMA (12)', formula: 'EMA("ethereum", 12)', format: '$#,##0.00' },
    { label: 'MACD', formula: 'MACD("ethereum")', format: '0.0000' },
    { label: 'BB Upper', formula: 'BB("ethereum", "upper", 20)', format: '$#,##0.00' },
    { label: 'BB Lower', formula: 'BB("ethereum", "lower", 20)', format: '$#,##0.00' },
  ];

  const ethOhlc: OHLCRow[] = d?.ohlc?.ethereum || [];
  let ethComputedIndicators: ReturnType<typeof computeTechnicalIndicators> | null = null;
  if (ethOhlc.length > 0) {
    ethComputedIndicators = computeTechnicalIndicators(ethOhlc);
    const lastIdx = ethOhlc.length - 1;
    const latestValues: Record<string, number | null> = {
      'RSI (14)': ethComputedIndicators.rsi14[lastIdx],
      'SMA (50)': ethComputedIndicators.sma50[lastIdx],
      'SMA (200)': null,
      'EMA (12)': ethComputedIndicators.ema12[lastIdx],
      'MACD': ethComputedIndicators.macd[lastIdx],
      'BB Upper': ethComputedIndicators.bbUpper[lastIdx],
      'BB Lower': ethComputedIndicators.bbLower[lastIdx],
    };
    for (let i = 0; i < ethIndicators.length; i++) {
      const val = latestValues[ethIndicators[i].label];
      addMetricRow(data, 6 + i, 2, ethIndicators[i].label, ethIndicators[i].formula, dt, ethIndicators[i].format, val ?? undefined);
    }
  } else {
    for (let i = 0; i < ethIndicators.length; i++) {
      addMetricRow(data, 6 + i, 2, ethIndicators[i].label, ethIndicators[i].formula, dt, ethIndicators[i].format);
    }
  }
  addZebraRows(data, 6, ethIndicators.length, 2, 3, dt);

  // === OHLC DATA TABLE WITH COMPUTED INDICATORS ===
  const ethOhlcStart = 15;
  if (ethOhlc.length > 0 && ethComputedIndicators) {
    addSectionDivider(data, ethOhlcStart - 1, '  OHLC DATA + TECHNICAL INDICATORS', dt);
    addTableHeaders(data, ethOhlcStart, [
      { col: 1, label: 'Date' }, { col: 2, label: 'Open' },
      { col: 3, label: 'High' }, { col: 4, label: 'Low' }, { col: 5, label: 'Close' },
    ], dt);

    const ethRowCount = ethOhlc.length;
    for (let i = 0; i < ethRowCount; i++) {
      const row = ethOhlcStart + 1 + i;
      const o = ethOhlc[i];
      data.getCell(row, 1).value = o.timestamp ? new Date(o.timestamp) : '';
      data.getCell(row, 1).numFmt = 'yyyy-mm-dd hh:mm';
      data.getCell(row, 1).font = { size: 10, color: { argb: dt.text } };
      for (let c = 2; c <= 5; c++) {
        const val = [o.open, o.high, o.low, o.close][c - 2];
        data.getCell(row, c).value = val;
        data.getCell(row, c).numFmt = '$#,##0.00';
        data.getCell(row, c).font = { size: 10, color: { argb: dt.text } };
      }
    }

    addTechnicalColumns(data, {
      startRow: ethOhlcStart + 1, headerRow: ethOhlcStart, startCol: 6,
      closeCol: 5, rowCount: ethRowCount,
      theme: { headerBg: dt.headerBg, headerText: dt.headerText, text: dt.text, accent: dt.accent, muted: dt.muted, bg: dt.bg },
    }, ethComputedIndicators);
    addZebraRows(data, ethOhlcStart + 1, ethRowCount, 1, 16, dt);

    // DeFi section after OHLC
    const defiStart = ethOhlcStart + 1 + ethRowCount + 2;
    addSectionDivider(data, defiStart - 1, '  TOP 10 DEFI PROTOCOLS', dt);
    addTableHeaders(data, defiStart, [
      { col: 1, label: 'Protocol' }, { col: 2, label: 'TVL' }, { col: 3, label: 'Volume' },
    ], dt);
    placeSpillFormula(data, defiStart + 1, 1, 'DEFI(10)', dt);
    addZebraRows(data, defiStart + 1, 10, 1, 3, dt);
  } else {
    addSectionDivider(data, 14, '  TOP 10 DEFI PROTOCOLS', dt);
    addTableHeaders(data, 15, [
      { col: 1, label: 'Protocol' }, { col: 2, label: 'TVL' }, { col: 3, label: 'Volume' },
    ], dt);
    placeSpillFormula(data, 16, 1, 'DEFI(10)', dt);
    addZebraRows(data, 16, 10, 1, 3, dt);
  }

  addFooter(data, 28, dt);

  data.views = [{
    state: 'frozen', xSplit: 1, ySplit: 5,
    showGridLines: false, showRowColHeaders: false,
    topLeftCell: 'B6', activeCell: 'B6',
  }];
}

// ============================================
// NFT TRACKER — Ecosystem Blue Theme
// ============================================

function addNftDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK NFTs',
    dashboardType: 'nft-tracker',
    title: '🖼️ NFT COLLECTIONS',
    subtitle: 'Top NFT collections by floor price and volume',
    colWidths: [3, 25, 16, 16, 14, 14],
    kpis: NFT_KPIS,
    sectionTitle: '  🖼️ TOP 50 NFT COLLECTIONS',
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
  }, d);
}

// ============================================
// ON-CHAIN / WHALE TRACKER — Institutional Theme
// ============================================

function addOnChainDashboard(workbook: ExcelJS.Workbook, coins: string[], d?: any) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK On-Chain',
    dashboardType: 'on-chain',
    title: '⛓️ ON-CHAIN METRICS',
    subtitle: 'Blockchain analytics and whale tracking',
    colWidths: [3, 20, 16, 16, 18],
    kpis: [
      { title: '₿ BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
      { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
      { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
      { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
    ],
    sectionTitle: '  ⛓️ ON-CHAIN DATA',
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
  }, d);
}

// ============================================
// CATEGORIES / HEATMAP — Ecosystem Blue Theme
// ============================================

function addCategoriesDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Categories',
    dashboardType: 'categories',
    title: '📂 MARKET CATEGORIES',
    subtitle: 'Crypto category rankings by market cap',
    colWidths: [3, 25, 16, 16, 14, 14],
    kpis: CATEGORIES_KPIS,
    sectionTitle: '  📂 TOP 50 CATEGORIES',
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
  }, d);
}

// ============================================
// ETF TRACKER — Institutional Theme
// ============================================

function addEtfDashboard(workbook: ExcelJS.Workbook, d?: any) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK ETFs', 'etf-tracker',
    [18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);
  addSidebar(sheet, 'CRK ETFs', theme, { dashboard: 'CRK ETFs', data: 'CRK ETFs Data' });

  addHeaderBar(sheet, 2, '🏛️ CRYPTO ETF TRACKER', theme, 'Corporate Bitcoin & Ethereum holdings');

  addKPICards(sheet, 5, enrichKPIs([
    { title: '₿ BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
    { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
    { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
    { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
  ], d), theme);

  addSectionDivider(sheet, 10, '  📊 ETF ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    '📊 BTC HOLDINGS',
    '🥧 HOLDINGS DISTRIBUTION',
    '💰 HOLDING VALUE',
    '🏆 TOP COINS COMPARISON',
  ]);

  addSectionDivider(sheet, afterGrid, '  🌍 MARKET CONTEXT', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'BTC Price', 'PRICE("bitcoin")', theme, '$#,##0.00', d?.market?.find((c: any) => c.id === 'bitcoin')?.current_price);
  addMetricRow(sheet, afterGrid + 3, 2, 'ETH Price', 'PRICE("ethereum")', theme, '$#,##0.00', d?.market?.find((c: any) => c.id === 'ethereum')?.current_price);
  addFooter(sheet, afterGrid + 5, theme);

  // === DATA SHEET ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK ETFs Data', 'etf-tracker',
    [18, 25, 16, 16, 16, 14]);
  addSidebar(data, 'CRK ETFs Data', dt, { dashboard: 'CRK ETFs', data: 'CRK ETFs Data' });
  addHeaderBar(data, 2, '🏛️ ETF DATA', dt, 'Corporate holdings data');
  addSectionDivider(data, 4, '  🏛️ BTC CORPORATE HOLDINGS', dt);
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

  addFooter(data, 28, dt);

  data.views = [{
    state: 'frozen', xSplit: 1, ySplit: 5,
    showGridLines: false, showRowColHeaders: false,
    topLeftCell: 'B6', activeCell: 'B6',
  }];

  // ETH holdings sub-sheet
  buildSubSheet(workbook, 'CRK ETH Holdings', 'etf-tracker', 'ETH CORPORATE HOLDINGS',
    'COMPANIES("ethereum")', 20, 5, [3, 25, 16, 16, 16]);
}

// ============================================
// LAYER COMPARE — Rankings Sunset Theme
// ============================================

function addLayerCompareDashboard(workbook: ExcelJS.Workbook, coins: string[], d?: any) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Layer Compare',
    dashboardType: 'layer1-compare',
    title: '⚡ LAYER COMPARISON',
    subtitle: 'Layer 1 and Layer 2 blockchain comparison',
    colWidths: [3, 20, 16, 16, 18, 14],
    kpis: LAYER_KPIS,
    sectionTitle: '  ⚡ BLOCKCHAIN COMPARISON',
    chartTitles: ['MARKET CAP COMPARISON', 'MARKET SHARE', 'RSI ANALYSIS', '24H PERFORMANCE'],
    metricsSectionTitle: '  ⚡ ECOSYSTEM METRICS',
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
  }, d);
}

// ============================================
// MEME COINS — Crypto Native Theme
// ============================================

function addMemeCoinsDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Meme Coins',
    dashboardType: 'meme-coins',
    title: '🐸 MEME COINS',
    subtitle: 'Top meme tokens by market cap',
    kpis: MEME_KPIS,
    sectionTitle: '  🐸 TOP 50 MEME TOKENS',
    chartTitles: ['MEME MARKET CAP', 'MEME MARKET SHARE', '24H PRICE CHANGE', '7D TREND'],
    metricsSectionTitle: '  🐸 MEME MARKET',
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
  }, d);

  buildSubSheet(workbook, 'CRK Trending Meme', 'meme-coins', 'TRENDING MEME COINS', 'TRENDING(7)', 10, 5,
    [3, 25, 18, 15, 14], d);
}

// ============================================
// AI & GAMING — Crypto Native Theme
// ============================================

function addAIGamingDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK AI Tokens',
    dashboardType: 'ai-gaming',
    title: '🤖 AI TOKENS',
    subtitle: 'Artificial intelligence cryptocurrency projects',
    kpis: MARKET_KPIS,
    sectionTitle: '  🤖 TOP 30 AI TOKENS',
    chartTitles: ['AI TOKEN MARKET CAP', 'AI MARKET DISTRIBUTION', '24H PERFORMANCE', 'PRICE COMPARISON'],
    headers: TOP_HEADERS,
    formula: 'TOP(30, "artificial-intelligence")',
    spillRows: 30,
    endCol: 7,
    percentCols: [6, 7],
    dataBarCol: 5,
  }, d);

  buildSubSheet(workbook, 'CRK Gaming Tokens', 'ai-gaming', 'GAMING TOKENS',
    'TOP(30, "gaming")', 30, 7, undefined, d);
}

// ============================================
// DEFI YIELDS — Yield Finance Theme
// ============================================

function addDefiYieldsDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK DeFi Yields',
    dashboardType: 'defi-yields',
    title: '🌾 DEFI YIELDS',
    subtitle: 'DeFi protocol rankings and stablecoin yields',
    colWidths: [3, 22, 16, 16, 14, 14],
    kpis: DEFI_KPIS,
    sectionTitle: '  🌾 TOP 50 DEFI PROTOCOLS',
    chartTitles: ['TOP PROTOCOLS BY TVL', 'TVL DISTRIBUTION', '24H VOLUME', '24H PERFORMANCE'],
    metricsSectionTitle: '  🌾 YIELD OVERVIEW',
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
  }, d);

  buildSubSheet(workbook, 'CRK Stablecoins', 'defi-yields', 'STABLECOINS', 'STABLECOINS(10)', 10, 5,
    [3, 22, 14, 16, 16], d);
}

// ============================================
// LIQUIDATIONS — Trading Pro Theme
// ============================================

function addLiquidationsDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Liquidations',
    dashboardType: 'liquidations',
    title: '💥 LIQUIDATIONS & DERIVATIVES',
    subtitle: 'Derivatives exchanges and liquidation data',
    colWidths: [3, 22, 16, 16, 16, 14],
    kpis: TRADING_KPIS,
    sectionTitle: '  💥 DERIVATIVES EXCHANGES',
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
  }, d);
}

// ============================================
// ALTCOIN SEASON — Analytics Purple Theme
// ============================================

function addAltcoinSeasonDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Altcoin Season',
    dashboardType: 'altcoin-season',
    title: '🌊 ALTCOIN SEASON ANALYSIS',
    subtitle: 'BTC dominance trends and altcoin performance',
    kpis: [
      { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
      { title: '💰 TOTAL MARKET CAP', formula: 'GLOBAL("total_market_cap")', format: COMPACT_USD, changeFormula: 'GLOBAL("market_cap_change_percentage_24h_usd")' },
      { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
      { title: '📊 24H VOLUME', formula: 'GLOBAL("total_volume")', format: COMPACT_USD },
    ],
    sectionTitle: '  🌊 TOP 100 COINS',
    headers: TOP_HEADERS,
    formula: 'TOP(100)',
    spillRows: 100,
    endCol: 7,
    percentCols: [6, 7],
    dataBarCol: 5,
    chartTitles: ['DOMINANCE DISTRIBUTION', 'TOP COINS BY MCAP', '24H PERFORMANCE', 'PRICE TREND'],
    metricsSectionTitle: '  🌊 ALTCOIN SEASON INDICATORS',
    metrics: [
      { label: 'BTC Dominance', formula: 'BTCDOM()', format: '0.00"%"' },
      { label: 'Market Cap Change', formula: 'GLOBAL("market_cap_change_percentage_24h_usd")', format: '0.00"%"' },
      { label: 'Active Coins', formula: 'GLOBAL("active_cryptocurrencies")' },
      { label: 'Fear & Greed', formula: 'FEARGREED()' },
    ],
  }, d);
}

// ============================================
// TOKEN UNLOCKS — Yield Finance Theme
// ============================================

function addTokenUnlocksDashboard(workbook: ExcelJS.Workbook, coins: string[], d?: any) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Token Data',
    dashboardType: 'token-unlocks',
    title: '🔓 TOKEN DATA',
    subtitle: 'Token unlock schedules and vesting analytics',
    colWidths: [3, 20, 16, 16, 18],
    kpis: MARKET_KPIS,
    sectionTitle: '  🔓 TOKEN OVERVIEW',
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
  }, d);
}

// ============================================
// STAKING YIELDS — Yield Finance Theme
// ============================================

function addStakingYieldsDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Staking',
    dashboardType: 'staking-yields',
    title: '🥩 PROOF OF STAKE',
    subtitle: 'Staking tokens and yield opportunities',
    kpis: STAKING_KPIS,
    sectionTitle: '  🥩 TOP 50 STAKING TOKENS',
    chartTitles: ['STAKING MARKET CAP', 'STAKING DISTRIBUTION', '24H PERFORMANCE', 'PRICE COMPARISON'],
    metricsSectionTitle: '  🥩 STAKING ECOSYSTEM',
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
  }, d);
}

// ============================================
// SOCIAL SENTIMENT — Analytics Purple Theme
// ============================================

function addSocialSentimentDashboard(workbook: ExcelJS.Workbook, d?: any) {
  // === VISUAL DASHBOARD SHEET ===
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Sentiment', 'social-sentiment',
    [18, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12, 12]);
  addSidebar(sheet, 'CRK Sentiment', theme, { dashboard: 'CRK Sentiment', data: 'CRK Sentiment Data' });

  addHeaderBar(sheet, 2, '💬 SOCIAL SENTIMENT', theme, 'Market sentiment and social trends');
  addKPICards(sheet, 5, enrichKPIs(SENTIMENT_KPIS, d), theme);
  addSectionDivider(sheet, 10, '  💭 SENTIMENT ANALYSIS', theme);

  const afterGrid = addChartGrid(sheet, 12, theme, [
    '🚀 TOP GAINERS',
    '🥧 MARKET DISTRIBUTION',
    '📈 24H PERFORMANCE',
    '🔥 TRENDING COINS',
  ]);

  addSectionDivider(sheet, afterGrid, '  🌍 MARKET OVERVIEW', theme);
  addMetricRow(sheet, afterGrid + 2, 2, 'BTC Price', 'PRICE("bitcoin")', theme, '$#,##0.00', d?.market?.find((c: any) => c.id === 'bitcoin')?.current_price);
  addMetricRow(sheet, afterGrid + 3, 2, 'ETH Price', 'PRICE("ethereum")', theme, '$#,##0.00', d?.market?.find((c: any) => c.id === 'ethereum')?.current_price);
  addMetricRow(sheet, afterGrid + 4, 2, 'Total Volume', 'GLOBAL("total_volume")', theme, COMPACT_USD, d?.global?.total_volume);
  addFooter(sheet, afterGrid + 6, theme);

  // === DATA SHEET ===
  const { sheet: data, theme: dt } = initDarkSheet(workbook, 'CRK Sentiment Data', 'social-sentiment');
  addSidebar(data, 'CRK Sentiment Data', dt, { dashboard: 'CRK Sentiment', data: 'CRK Sentiment Data' });
  addHeaderBar(data, 2, '💬 SENTIMENT DATA', dt);
  addSectionDivider(data, 4, '  💬 TOP 20 GAINERS', dt);
  addTableHeaders(data, 5, TOP_HEADERS, dt);
  const gainers20 = resolveFormulaData('GAINERS(20)', d);
  if (gainers20 && gainers20.length > 0) {
    populateMarketRows(data, 6, gainers20, dt);
  } else {
    placeSpillFormula(data, 6, 1, 'GAINERS(20)', dt);
  }
  addZebraRows(data, 6, 20, 1, 7, dt);
  addPercentFormatting(data, 'F6:F25', dt);
  addPercentFormatting(data, 'G6:G25', dt);

  addSectionDivider(data, 28, '  TRENDING COINS', dt);
  const trending = resolveFormulaData('TRENDING(7)', d);
  if (trending && trending.length > 0) {
    populateMarketRows(data, 30, trending, dt);
  } else {
    placeSpillFormula(data, 30, 1, 'TRENDING(7)', dt);
  }
  addZebraRows(data, 30, 10, 1, 5, dt);

  addFooter(data, 42, dt);

  data.views = [{
    state: 'frozen', xSplit: 1, ySplit: 5,
    showGridLines: false, showRowColHeaders: false,
    topLeftCell: 'B6', activeCell: 'B6',
  }];
}

// ============================================
// MINING — Tools Dark Theme
// ============================================

function addMiningDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Mining',
    dashboardType: 'mining-calc',
    title: '⛏️ MINING & PROOF OF WORK',
    subtitle: 'PoW coins and mining analytics',
    kpis: [
      { title: '₿ BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
      { title: '💰 BTC MARKET CAP', formula: 'MCAP("bitcoin")', format: COMPACT_USD },
      { title: '🏆 BTC DOMINANCE', formula: 'BTCDOM()', format: '0.00"%"' },
      { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
    ],
    sectionTitle: '  ⛏️ TOP 20 PoW COINS',
    headers: TOP_HEADERS,
    formula: 'TOP(20, "proof-of-work")',
    spillRows: 20,
    endCol: 7,
    percentCols: [6, 7],
    dataBarCol: 5,
    chartTitles: ['TOP 10 PoW MARKET CAP', 'PoW DISTRIBUTION', '24H CHANGE', 'PRICE COMPARISON'],
  }, d);
}

// ============================================
// EXCHANGE RESERVES — Institutional Theme
// ============================================

function addExchangeReservesDashboard(workbook: ExcelJS.Workbook, d?: any) {
  buildSpillDashboard(workbook, {
    sheetName: 'CRK Exchanges',
    dashboardType: 'exchange-reserves',
    title: '🏦 EXCHANGE DATA',
    subtitle: 'Exchange volume rankings and reserve tracking',
    colWidths: [3, 22, 16, 16, 14, 14],
    kpis: EXCHANGE_KPIS,
    sectionTitle: '  🏦 TOP 50 EXCHANGES',
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
  }, d);
}

// ============================================
// CUSTOM WATCHLIST — Tools Dark Theme
// ============================================

function addCustomDashboard(workbook: ExcelJS.Workbook, coins: string[], d?: any) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Watchlist',
    dashboardType: 'custom',
    title: '⭐ CUSTOM WATCHLIST',
    subtitle: 'Your personalized crypto watch list',
    colWidths: [3, 20, 16, 16, 18, 16],
    kpis: MARKET_KPIS,
    sectionTitle: '  ⭐ WATCHLIST',
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
  }, d);
}

// ============================================
// VOLATILITY / CALCULATOR — Trading Pro Theme
// ============================================

function addVolatilityDashboard(workbook: ExcelJS.Workbook, coins: string[], d?: any) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Volatility',
    dashboardType: 'volatility',
    title: '🌪️ VOLATILITY ANALYSIS',
    subtitle: 'Price volatility and all-time high comparison',
    colWidths: [3, 20, 16, 16, 18],
    kpis: [
      { title: '₿ BTC 24H CHANGE', formula: 'CHANGE("bitcoin", "24h")', format: '0.00"%"' },
      { title: 'Ξ ETH 24H CHANGE', formula: 'CHANGE("ethereum", "24h")', format: '0.00"%"' },
      { title: '₿ BTC PRICE', formula: 'PRICE("bitcoin")', format: '$#,##0.00', changeFormula: 'CHANGE("bitcoin", "24h")' },
      { title: '😱 FEAR & GREED', formula: 'FEARGREED()' },
    ],
    sectionTitle: '  🌪️ VOLATILITY METRICS',
    chartTitles: ['CURRENT PRICE', 'ALL-TIME HIGH', '24H CHANGE %', 'PRICE vs ATH'],
    metricsSectionTitle: '  🌪️ VOLATILITY INDICATORS',
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
  }, d);

  // === RISK METRICS SUB-SHEET ===
  addRiskMetricsSheet(workbook, coins, d);
}

/**
 * Adds a Risk Metrics sheet with computed risk indicators.
 * ATH Drawdown, 24h/7d/30d Volatility, Volume/MCap liquidity ratio.
 */
function addRiskMetricsSheet(workbook: ExcelJS.Workbook, coins: string[], d?: any) {
  const { sheet, theme } = initDarkSheet(workbook, 'CRK Risk Metrics', 'volatility',
    [18, 16, 14, 14, 14, 14, 14, 14]);
  addSidebar(sheet, 'CRK Risk Metrics', theme, { dashboard: 'CRK Volatility', data: 'CRK Volatility' });
  addHeaderBar(sheet, 2, '⚠️ RISK METRICS', theme, 'Volatility, drawdown, and liquidity analysis');

  addSectionDivider(sheet, 4, '  ⚠️ RISK ANALYSIS', theme);
  const riskHeaders = [
    { col: 1, label: 'Coin' },
    { col: 2, label: 'ATH Drawdown%' },
    { col: 3, label: '24h Volatility' },
    { col: 4, label: '7d Volatility' },
    { col: 5, label: '30d Volatility' },
    { col: 6, label: 'Vol/MCap%' },
    { col: 7, label: 'Risk Score' },
  ];
  addTableHeaders(sheet, 5, riskHeaders, theme);

  const coinList = coins.length > 0 ? coins.slice(0, 10) :
    ['bitcoin', 'ethereum', 'solana', 'binancecoin', 'xrp',
     'cardano', 'dogecoin', 'polkadot', 'avalanche-2', 'chainlink'];
  const marketData = d?.market || [];

  for (let i = 0; i < coinList.length; i++) {
    const row = 6 + i;
    const coin = coinList[i];
    const cd = marketData.find((c: any) => c.id === coin);

    // Coin name
    sheet.getCell(row, 1).value = coin.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
    sheet.getCell(row, 1).font = { bold: true, size: 10, color: { argb: theme.text } };

    if (cd) {
      // ATH Drawdown %
      const athDrawdown = cd.ath_change_percentage ?? 0;
      sheet.getCell(row, 2).value = athDrawdown;
      sheet.getCell(row, 2).numFmt = '0.00"%"';
      sheet.getCell(row, 2).font = { size: 10, color: { argb: athDrawdown < -50 ? 'FFEF4444' : athDrawdown < -20 ? 'FFF59E0B' : 'FF22C55E' } };

      // 24h Volatility (absolute value of 24h change)
      const vol24h = Math.abs(cd.price_change_percentage_24h ?? 0);
      sheet.getCell(row, 3).value = vol24h;
      sheet.getCell(row, 3).numFmt = '0.00"%"';
      sheet.getCell(row, 3).font = { size: 10, color: { argb: vol24h > 10 ? 'FFEF4444' : vol24h > 5 ? 'FFF59E0B' : 'FF22C55E' } };

      // 7d Volatility
      const vol7d = Math.abs(cd.price_change_percentage_7d_in_currency ?? 0);
      sheet.getCell(row, 4).value = vol7d;
      sheet.getCell(row, 4).numFmt = '0.00"%"';
      sheet.getCell(row, 4).font = { size: 10, color: { argb: vol7d > 20 ? 'FFEF4444' : vol7d > 10 ? 'FFF59E0B' : 'FF22C55E' } };

      // 30d Volatility
      const vol30d = Math.abs(cd.price_change_percentage_30d_in_currency ?? 0);
      sheet.getCell(row, 5).value = vol30d;
      sheet.getCell(row, 5).numFmt = '0.00"%"';
      sheet.getCell(row, 5).font = { size: 10, color: { argb: vol30d > 40 ? 'FFEF4444' : vol30d > 20 ? 'FFF59E0B' : 'FF22C55E' } };

      // Vol/MCap liquidity ratio
      const volMcap = cd.market_cap > 0 ? (cd.total_volume / cd.market_cap) * 100 : 0;
      sheet.getCell(row, 6).value = Math.round(volMcap * 100) / 100;
      sheet.getCell(row, 6).numFmt = '0.00"%"';
      sheet.getCell(row, 6).font = { size: 10, color: { argb: theme.text } };

      // Risk Score: weighted combination (higher = more volatile/risky)
      const riskScore = vol24h * 0.3 + vol7d * 0.3 + vol30d * 0.2 + Math.abs(athDrawdown) * 0.1 + volMcap * 0.1;
      sheet.getCell(row, 7).value = Math.round(riskScore * 100) / 100;
      sheet.getCell(row, 7).numFmt = '0.00';
      sheet.getCell(row, 7).font = { bold: true, size: 10, color: { argb: riskScore > 30 ? 'FFEF4444' : riskScore > 15 ? 'FFF59E0B' : 'FF22C55E' } };
    }
  }

  addZebraRows(sheet, 6, coinList.length, 1, 7, theme);
  addFooter(sheet, 6 + coinList.length + 1, theme);
  sheet.views = [{ state: 'frozen', ySplit: 5, showGridLines: false }];
}

// ============================================
// CATEGORY TOKENS (RWA, Metaverse, Privacy) — Ecosystem Blue Theme
// ============================================

function addCategoryTokensDashboard(workbook: ExcelJS.Workbook, dashboard: DashboardType, d?: any) {
  const categoryMap: Record<string, { title: string; category: string; subtitle: string }> = {
    'rwa': { title: '🏢 REAL WORLD ASSETS', category: 'real-world-assets-rwa', subtitle: 'Tokenized real-world assets' },
    'metaverse': { title: '🌐 METAVERSE TOKENS', category: 'metaverse', subtitle: 'Virtual worlds and metaverse projects' },
    'privacy-coins': { title: '🔒 PRIVACY COINS', category: 'privacy-coins', subtitle: 'Privacy-focused cryptocurrencies' },
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
  }, d);
}

// ============================================
// DEVELOPER ACTIVITY — Analytics Purple Theme
// ============================================

function addDevActivityDashboard(workbook: ExcelJS.Workbook, coins: string[], d?: any) {
  buildPerCoinDashboard(workbook, {
    sheetName: 'CRK Dev Activity',
    dashboardType: 'dev-activity',
    title: '👨‍💻 DEVELOPER ACTIVITY',
    subtitle: 'GitHub activity and development metrics',
    colWidths: [3, 20, 16, 16, 18],
    kpis: MARKET_KPIS,
    sectionTitle: '  👨‍💻 DEVELOPMENT METRICS',
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
  }, d);
}
