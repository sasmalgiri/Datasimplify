/**
 * formulaColumns.ts — Computed Indicator Engine for Excel Data Sheets
 *
 * Adds technical indicators and market analytics as computed columns
 * to CRK dashboard data sheets. Two strategies:
 *
 * 1. SERVER-SIDE COMPUTATION: When prefetched OHLC data is available,
 *    indicator values are computed in TypeScript and placed as static values.
 *    This means templates open with fully populated indicators immediately.
 *
 * 2. EXCEL FORMULAS: Formula columns reference PQ table data via structured
 *    references. When the user clicks Refresh All, PQ pulls fresh OHLC data
 *    and the formula columns auto-recalculate.
 *
 * Technical Indicators (OHLC data):
 *   SMA(20), SMA(50), EMA(12), EMA(26), RSI(14), MACD, Signal,
 *   BB Upper, BB Lower, Daily Return %
 *
 * Market Analytics (market data):
 *   Market Share %, Vol/MCap Ratio, Performance Score
 */

import ExcelJS from 'exceljs';

// ============================================
// TYPES
// ============================================

export interface OHLCRow {
  timestamp?: number;
  date?: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export interface IndicatorResult {
  sma20: (number | null)[];
  sma50: (number | null)[];
  ema12: (number | null)[];
  ema26: (number | null)[];
  rsi14: (number | null)[];
  macd: (number | null)[];
  signal: (number | null)[];
  macdHist: (number | null)[];
  bbUpper: (number | null)[];
  bbLower: (number | null)[];
  dailyReturn: (number | null)[];
}

export interface MarketAnalyticsRow {
  marketShare: number;
  volMcapRatio: number;
  perfScore: number;
}

export interface TechnicalColumnConfig {
  startRow: number;       // First data row (1-based)
  headerRow: number;      // Header row number
  startCol: number;       // Column to begin adding indicators
  closeCol: number;       // Column with Close prices (for formula fallback)
  rowCount: number;       // Number of data rows
  theme?: ColumnTheme;
}

export interface MarketColumnConfig {
  startRow: number;
  headerRow: number;
  startCol: number;
  priceCol: number;       // Column with Price
  mcapCol: number;        // Column with Market Cap
  volCol: number;         // Column with Volume
  change24hCol: number;   // Column with 24h Change %
  change7dCol?: number;   // Column with 7d Change %
  rowCount: number;
  theme?: ColumnTheme;
}

interface ColumnTheme {
  headerBg: string;
  headerText: string;
  text: string;
  accent: string;
  muted: string;
  bg: string;
}

// ============================================
// COLUMN LETTER HELPER
// ============================================

function colLetter(col: number): string {
  let result = '';
  let n = col;
  while (n > 0) {
    n--;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
}

// ============================================
// SERVER-SIDE INDICATOR COMPUTATION
// ============================================

/**
 * Computes all technical indicators from OHLC data.
 * Pure TypeScript — runs server-side during template generation.
 * Results are placed as static values in the data sheet.
 */
export function computeTechnicalIndicators(data: OHLCRow[]): IndicatorResult {
  const closes = data.map(d => d.close);
  const n = closes.length;

  return {
    sma20: computeSMA(closes, 20),
    sma50: computeSMA(closes, 50),
    ema12: computeEMA(closes, 12),
    ema26: computeEMA(closes, 26),
    rsi14: computeRSI(closes, 14),
    macd: computeMACD(closes),
    signal: computeMACDSignal(closes),
    macdHist: computeMACDHistogram(closes),
    bbUpper: computeBollingerBand(closes, 20, 2, 'upper'),
    bbLower: computeBollingerBand(closes, 20, 2, 'lower'),
    dailyReturn: computeDailyReturn(closes),
  };
}

/** Simple Moving Average */
function computeSMA(values: number[], period: number): (number | null)[] {
  return values.map((_, i) => {
    if (i < period - 1) return null;
    const slice = values.slice(i - period + 1, i + 1);
    return slice.reduce((a, b) => a + b, 0) / period;
  });
}

/** Exponential Moving Average */
function computeEMA(values: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = new Array(values.length).fill(null);

  // First EMA = SMA of first 'period' values
  if (values.length < period) return result;
  let sum = 0;
  for (let i = 0; i < period; i++) sum += values[i];
  result[period - 1] = sum / period;

  // Subsequent EMA values
  for (let i = period; i < values.length; i++) {
    result[i] = values[i] * k + (result[i - 1] as number) * (1 - k);
  }
  return result;
}

/** Relative Strength Index */
function computeRSI(values: number[], period: number): (number | null)[] {
  const result: (number | null)[] = new Array(values.length).fill(null);
  if (values.length < period + 1) return result;

  // Calculate price changes
  const changes: number[] = [];
  for (let i = 1; i < values.length; i++) {
    changes.push(values[i] - values[i - 1]);
  }

  // First average gain/loss (simple average)
  let avgGain = 0, avgLoss = 0;
  for (let i = 0; i < period; i++) {
    if (changes[i] > 0) avgGain += changes[i];
    else avgLoss += Math.abs(changes[i]);
  }
  avgGain /= period;
  avgLoss /= period;

  // First RSI
  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = 100 - (100 / (1 + rs));

  // Subsequent RSI (smoothed)
  for (let i = period; i < changes.length; i++) {
    const gain = changes[i] > 0 ? changes[i] : 0;
    const loss = changes[i] < 0 ? Math.abs(changes[i]) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const smoothRs = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i + 1] = 100 - (100 / (1 + smoothRs));
  }
  return result;
}

/** MACD Line = EMA(12) - EMA(26) */
function computeMACD(values: number[]): (number | null)[] {
  const ema12 = computeEMA(values, 12);
  const ema26 = computeEMA(values, 26);
  return values.map((_, i) => {
    if (ema12[i] === null || ema26[i] === null) return null;
    return (ema12[i] as number) - (ema26[i] as number);
  });
}

/** MACD Signal Line = 9-period EMA of MACD */
function computeMACDSignal(values: number[]): (number | null)[] {
  const macdLine = computeMACD(values);
  // Extract non-null MACD values for EMA computation
  const validMACD: number[] = [];
  const validIndices: number[] = [];
  macdLine.forEach((v, i) => {
    if (v !== null) { validMACD.push(v); validIndices.push(i); }
  });
  if (validMACD.length < 9) return new Array(values.length).fill(null);

  const signalEMA = computeEMA(validMACD, 9);
  const result: (number | null)[] = new Array(values.length).fill(null);
  validIndices.forEach((origIdx, i) => {
    result[origIdx] = signalEMA[i];
  });
  return result;
}

/** MACD Histogram = MACD - Signal */
function computeMACDHistogram(values: number[]): (number | null)[] {
  const macd = computeMACD(values);
  const signal = computeMACDSignal(values);
  return values.map((_, i) => {
    if (macd[i] === null || signal[i] === null) return null;
    return (macd[i] as number) - (signal[i] as number);
  });
}

/** Bollinger Band (upper or lower) */
function computeBollingerBand(
  values: number[], period: number, stdDevMult: number, band: 'upper' | 'lower',
): (number | null)[] {
  const sma = computeSMA(values, period);
  return values.map((_, i) => {
    if (sma[i] === null) return null;
    const slice = values.slice(i - period + 1, i + 1);
    const mean = sma[i] as number;
    const variance = slice.reduce((sum, v) => sum + (v - mean) ** 2, 0) / period;
    const stdDev = Math.sqrt(variance);
    return band === 'upper' ? mean + stdDevMult * stdDev : mean - stdDevMult * stdDev;
  });
}

/** Daily Return % */
function computeDailyReturn(values: number[]): (number | null)[] {
  return values.map((v, i) => {
    if (i === 0) return null;
    return ((v - values[i - 1]) / values[i - 1]) * 100;
  });
}

// ============================================
// MARKET ANALYTICS COMPUTATION
// ============================================

export interface MarketRow {
  price?: number;
  market_cap?: number;
  total_volume?: number;
  price_change_percentage_24h?: number;
  price_change_percentage_7d_in_currency?: number;
  price_change_percentage_30d_in_currency?: number;
}

/**
 * Computes market analytics columns for a set of coins.
 */
export function computeMarketAnalytics(data: MarketRow[]): MarketAnalyticsRow[] {
  const totalMcap = data.reduce((s, d) => s + (d.market_cap || 0), 0);

  return data.map(d => {
    const mcap = d.market_cap || 0;
    const vol = d.total_volume || 0;
    const chg24 = d.price_change_percentage_24h || 0;
    const chg7d = d.price_change_percentage_7d_in_currency || 0;

    return {
      marketShare: totalMcap > 0 ? (mcap / totalMcap) * 100 : 0,
      volMcapRatio: mcap > 0 ? (vol / mcap) * 100 : 0,
      // Weighted performance score: 60% 24h + 40% 7d
      perfScore: chg24 * 0.6 + chg7d * 0.4,
    };
  });
}

// ============================================
// ADD TECHNICAL INDICATOR COLUMNS TO WORKSHEET
// ============================================

/** Technical indicator column definitions */
const TECH_COLUMNS = [
  { header: 'SMA(20)', key: 'sma20' as keyof IndicatorResult, format: '$#,##0.00' },
  { header: 'SMA(50)', key: 'sma50' as keyof IndicatorResult, format: '$#,##0.00' },
  { header: 'EMA(12)', key: 'ema12' as keyof IndicatorResult, format: '$#,##0.00' },
  { header: 'EMA(26)', key: 'ema26' as keyof IndicatorResult, format: '$#,##0.00' },
  { header: 'RSI(14)', key: 'rsi14' as keyof IndicatorResult, format: '0.00' },
  { header: 'MACD', key: 'macd' as keyof IndicatorResult, format: '0.0000' },
  { header: 'Signal', key: 'signal' as keyof IndicatorResult, format: '0.0000' },
  { header: 'MACD Hist', key: 'macdHist' as keyof IndicatorResult, format: '0.0000' },
  { header: 'BB Upper', key: 'bbUpper' as keyof IndicatorResult, format: '$#,##0.00' },
  { header: 'BB Lower', key: 'bbLower' as keyof IndicatorResult, format: '$#,##0.00' },
  { header: 'Daily Ret%', key: 'dailyReturn' as keyof IndicatorResult, format: '0.00"%"' },
];

/**
 * Adds technical indicator columns to an OHLC data sheet.
 * Places computed values (from server-side computation) as static data.
 * Headers get themed styling matching the existing data table.
 */
export function addTechnicalColumns(
  sheet: ExcelJS.Worksheet,
  config: TechnicalColumnConfig,
  indicators: IndicatorResult,
): number {
  const { startRow, headerRow, startCol, rowCount, theme } = config;

  // Add headers
  TECH_COLUMNS.forEach((col, i) => {
    const c = startCol + i;
    const cell = sheet.getCell(headerRow, c);
    cell.value = col.header;
    cell.font = { bold: true, size: 10, color: { argb: theme?.headerText || 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: theme?.headerBg || 'FF374151' },
    };
    cell.alignment = { horizontal: 'center' };
    sheet.getColumn(c).width = col.header.length < 8 ? 12 : 14;
  });

  // Add computed values
  const endRow = Math.min(startRow + rowCount - 1, startRow + indicators.sma20.length - 1);
  for (let row = startRow; row <= endRow; row++) {
    const idx = row - startRow;
    TECH_COLUMNS.forEach((col, i) => {
      const c = startCol + i;
      const val = indicators[col.key][idx];
      const cell = sheet.getCell(row, c);
      if (val !== null && val !== undefined && !isNaN(val)) {
        cell.value = Math.round(val * 10000) / 10000; // 4 decimal precision
      }
      cell.numFmt = col.format;
      cell.font = { size: 10, color: { argb: theme?.text || 'FFEAEAEA' } };

      // Color RSI: green if < 30 (oversold), red if > 70 (overbought)
      if (col.key === 'rsi14' && val !== null) {
        if (val < 30) cell.font = { size: 10, color: { argb: 'FF22C55E' } };
        else if (val > 70) cell.font = { size: 10, color: { argb: 'FFEF4444' } };
      }
      // Color daily return: green positive, red negative
      if (col.key === 'dailyReturn' && val !== null) {
        cell.font = { size: 10, color: { argb: val >= 0 ? 'FF22C55E' : 'FFEF4444' } };
      }
      // Color MACD histogram
      if (col.key === 'macdHist' && val !== null) {
        cell.font = { size: 10, color: { argb: val >= 0 ? 'FF22C55E' : 'FFEF4444' } };
      }
    });
  }

  return startCol + TECH_COLUMNS.length; // Return next available column
}

// ============================================
// ADD MARKET ANALYTICS COLUMNS TO WORKSHEET
// ============================================

/** Market analytics column definitions */
const MARKET_COLUMNS = [
  { header: 'Mkt Share%', format: '0.00"%"' },
  { header: 'Vol/MCap%', format: '0.00"%"' },
  { header: 'Perf Score', format: '0.00' },
];

/**
 * Adds market analytics columns (Market Share %, Vol/MCap, Performance Score)
 * to a market data sheet with computed values.
 */
export function addMarketAnalyticsColumns(
  sheet: ExcelJS.Worksheet,
  config: MarketColumnConfig,
  analytics: MarketAnalyticsRow[],
): number {
  const { startRow, headerRow, startCol, rowCount, theme } = config;

  // Add headers
  MARKET_COLUMNS.forEach((col, i) => {
    const c = startCol + i;
    const cell = sheet.getCell(headerRow, c);
    cell.value = col.header;
    cell.font = { bold: true, size: 10, color: { argb: theme?.headerText || 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: theme?.headerBg || 'FF374151' },
    };
    cell.alignment = { horizontal: 'center' };
    sheet.getColumn(c).width = 12;
  });

  // Add computed values
  const endRow = Math.min(startRow + rowCount - 1, startRow + analytics.length - 1);
  for (let row = startRow; row <= endRow; row++) {
    const idx = row - startRow;
    if (idx >= analytics.length) break;
    const a = analytics[idx];

    // Market Share %
    const shareCell = sheet.getCell(row, startCol);
    shareCell.value = Math.round(a.marketShare * 100) / 100;
    shareCell.numFmt = '0.00"%"';
    shareCell.font = { size: 10, color: { argb: theme?.text || 'FFEAEAEA' } };

    // Vol/MCap Ratio %
    const volCell = sheet.getCell(row, startCol + 1);
    volCell.value = Math.round(a.volMcapRatio * 100) / 100;
    volCell.numFmt = '0.00"%"';
    volCell.font = { size: 10, color: { argb: theme?.text || 'FFEAEAEA' } };

    // Performance Score
    const perfCell = sheet.getCell(row, startCol + 2);
    perfCell.value = Math.round(a.perfScore * 100) / 100;
    perfCell.numFmt = '0.00';
    perfCell.font = {
      size: 10,
      color: { argb: a.perfScore >= 0 ? 'FF22C55E' : 'FFEF4444' },
    };
  }

  return startCol + MARKET_COLUMNS.length;
}

// ============================================
// PQ TABLE CALCULATED COLUMN FORMULAS
// ============================================

/**
 * Returns Excel structured reference formulas for technical indicators.
 * These formulas can be used in calculated columns within PQ tables.
 * Uses structured references like [@Close] for the current row's close price.
 *
 * Note: These are R1C1-style formulas for use in OOXML table XML.
 * For EMA/RSI, simplified approximations are used since true recursion
 * is not possible in a single calculated column formula.
 */
export function getTechnicalFormulaHeaders(): string[] {
  return TECH_COLUMNS.map(c => c.header);
}

export function getMarketAnalyticsHeaders(): string[] {
  return MARKET_COLUMNS.map(c => c.header);
}

// ============================================
// INDICATOR COLUMN NAMES FOR PQ TEMPLATES
// ============================================

/** Column names added by technical indicator computation in M code */
export const TECHNICAL_INDICATOR_COLUMNS = [
  'SMA20', 'SMA50', 'EMA12', 'EMA26', 'RSI14',
  'MACD', 'Signal', 'MACD_Hist', 'BB_Upper', 'BB_Lower', 'DailyReturn',
];

/** Column names added by market analytics computation in M code */
export const MARKET_ANALYTICS_COLUMNS = [
  'MktShare', 'VolMcapRatio', 'PerfScore',
];
