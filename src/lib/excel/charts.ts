/**
 * Advanced Chart Generation for Excel
 *
 * Creates visual charts using cell-based rendering
 * since native Excel charts require Office.js or complex XML.
 */

import ExcelJS from 'exceljs';

// Color palette
const COLORS = {
  primary: 'FF059669',
  success: 'FF22C55E',
  danger: 'FFEF4444',
  warning: 'FFF59E0B',
  info: 'FF3B82F6',
  purple: 'FF8B5CF6',
  pink: 'FFEC4899',
  cyan: 'FF06B6D4',
  orange: 'FFF97316',
  lime: 'FF84CC16',
  bitcoin: 'FFF7931A',
  ethereum: 'FF627EEA',
  dark: 'FF1F2937',
  light: 'FF6B7280',
  white: 'FFFFFFFF',
};

/**
 * Create a horizontal bar chart using cells
 */
export function createHorizontalBarChart(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: { label: string; value: number; color?: string }[],
  options: {
    title?: string;
    maxBarWidth?: number;
    showValues?: boolean;
  } = {}
) {
  const { title, maxBarWidth = 30, showValues = true } = options;
  const maxValue = Math.max(...data.map(d => d.value));
  let currentRow = startRow;

  // Title
  if (title) {
    sheet.getCell(currentRow, startCol).value = title;
    sheet.getCell(currentRow, startCol).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
    currentRow += 2;
  }

  // Bars
  data.forEach((item, i) => {
    const barWidth = Math.round((item.value / maxValue) * maxBarWidth);
    const color = item.color || COLORS.primary;

    // Label
    sheet.getCell(currentRow, startCol).value = item.label;
    sheet.getCell(currentRow, startCol).font = { bold: true };

    // Bar
    sheet.getCell(currentRow, startCol + 1).value = '█'.repeat(Math.max(1, barWidth));
    sheet.getCell(currentRow, startCol + 1).font = { color: { argb: color } };

    // Value
    if (showValues) {
      sheet.getCell(currentRow, startCol + 2).value = formatNumber(item.value);
      sheet.getCell(currentRow, startCol + 2).alignment = { horizontal: 'right' };
    }

    currentRow++;
  });

  return currentRow;
}

/**
 * Create a vertical bar chart using cells
 */
export function createVerticalBarChart(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: { label: string; value: number; color?: string }[],
  options: {
    title?: string;
    maxBarHeight?: number;
  } = {}
) {
  const { title, maxBarHeight = 10 } = options;
  const maxValue = Math.max(...data.map(d => d.value));
  let currentRow = startRow;

  // Title
  if (title) {
    sheet.mergeCells(currentRow, startCol, currentRow, startCol + data.length - 1);
    sheet.getCell(currentRow, startCol).value = title;
    sheet.getCell(currentRow, startCol).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
    sheet.getCell(currentRow, startCol).alignment = { horizontal: 'center' };
    currentRow += 2;
  }

  // Draw bars from bottom up
  for (let row = maxBarHeight - 1; row >= 0; row--) {
    data.forEach((item, col) => {
      const barHeight = Math.round((item.value / maxValue) * maxBarHeight);
      const color = item.color || COLORS.primary;

      if (row < barHeight) {
        sheet.getCell(currentRow, startCol + col).value = '█';
        sheet.getCell(currentRow, startCol + col).font = { color: { argb: color } };
        sheet.getCell(currentRow, startCol + col).alignment = { horizontal: 'center' };
      }
    });
    currentRow++;
  }

  // Labels
  data.forEach((item, col) => {
    sheet.getCell(currentRow, startCol + col).value = item.label;
    sheet.getCell(currentRow, startCol + col).font = { size: 9 };
    sheet.getCell(currentRow, startCol + col).alignment = { horizontal: 'center' };
  });

  return currentRow + 1;
}

/**
 * Create a pie chart representation using cells
 */
export function createPieChartLegend(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: { label: string; value: number; percentage: number; color: string }[],
  options: { title?: string } = {}
) {
  let currentRow = startRow;

  if (options.title) {
    sheet.getCell(currentRow, startCol).value = options.title;
    sheet.getCell(currentRow, startCol).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
    currentRow += 2;
  }

  // Visual representation
  const totalWidth = 50;
  let visualRow = '';
  data.forEach(item => {
    const width = Math.round((item.percentage / 100) * totalWidth);
    visualRow += '█'.repeat(Math.max(1, width));
  });

  sheet.getCell(currentRow, startCol).value = visualRow;
  currentRow += 2;

  // Legend
  data.forEach((item, i) => {
    sheet.getCell(currentRow, startCol).value = '██';
    sheet.getCell(currentRow, startCol).font = { color: { argb: item.color } };

    sheet.getCell(currentRow, startCol + 1).value = item.label;
    sheet.getCell(currentRow, startCol + 1).font = { bold: true };

    sheet.getCell(currentRow, startCol + 2).value = `${item.percentage.toFixed(1)}%`;
    sheet.getCell(currentRow, startCol + 2).alignment = { horizontal: 'right' };

    sheet.getCell(currentRow, startCol + 3).value = formatNumber(item.value);
    sheet.getCell(currentRow, startCol + 3).alignment = { horizontal: 'right' };

    currentRow++;
  });

  return currentRow;
}

/**
 * Create a sparkline-style mini chart
 */
export function createSparkline(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  values: number[],
  options: { width?: number; color?: string } = {}
) {
  const { width = 20, color = COLORS.primary } = options;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Normalize values to 0-8 range for block characters
  const blocks = ['▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];
  const normalized = values.map(v => Math.floor(((v - min) / range) * 7));

  // Sample if too many points
  const step = Math.max(1, Math.floor(values.length / width));
  const sampledValues = normalized.filter((_, i) => i % step === 0).slice(0, width);

  const sparkline = sampledValues.map(v => blocks[v]).join('');

  sheet.getCell(row, col).value = sparkline;

  // Color based on trend
  const trend = values[values.length - 1] > values[0];
  sheet.getCell(row, col).font = { color: { argb: trend ? COLORS.success : COLORS.danger } };
}

/**
 * Create a gauge/meter visualization
 */
export function createGauge(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  value: number,
  options: {
    title?: string;
    min?: number;
    max?: number;
    width?: number;
    thresholds?: { value: number; color: string }[];
  } = {}
) {
  const {
    title,
    min = 0,
    max = 100,
    width = 30,
    thresholds = [
      { value: 25, color: COLORS.danger },
      { value: 50, color: COLORS.warning },
      { value: 75, color: COLORS.lime },
      { value: 100, color: COLORS.success },
    ]
  } = options;

  let currentRow = startRow;

  if (title) {
    sheet.getCell(currentRow, startCol).value = title;
    sheet.getCell(currentRow, startCol).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
    currentRow += 1;
  }

  // Determine color
  let color = COLORS.light;
  for (const threshold of thresholds) {
    if (value <= threshold.value) {
      color = threshold.color;
      break;
    }
  }

  // Gauge bar
  const position = Math.round(((value - min) / (max - min)) * width);
  const gauge = '░'.repeat(position) + '█' + '░'.repeat(width - position - 1);

  sheet.getCell(currentRow, startCol).value = gauge;
  sheet.getCell(currentRow, startCol).font = { color: { argb: color } };
  currentRow++;

  // Labels
  sheet.getCell(currentRow, startCol).value = `${min}`;
  sheet.getCell(currentRow, startCol).font = { size: 9, color: { argb: COLORS.light } };

  sheet.getCell(currentRow, startCol + 1).value = `Value: ${value}`;
  sheet.getCell(currentRow, startCol + 1).font = { bold: true, color: { argb: color } };
  sheet.getCell(currentRow, startCol + 1).alignment = { horizontal: 'center' };

  return currentRow + 1;
}

/**
 * Create a trend indicator
 */
export function createTrendIndicator(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  currentValue: number,
  previousValue: number
) {
  const change = ((currentValue - previousValue) / previousValue) * 100;
  const isUp = change >= 0;

  const arrow = isUp ? '▲' : '▼';
  const text = `${arrow} ${Math.abs(change).toFixed(2)}%`;

  sheet.getCell(row, col).value = text;
  sheet.getCell(row, col).font = {
    bold: true,
    color: { argb: isUp ? COLORS.success : COLORS.danger }
  };
}

/**
 * Create a comparison chart (before/after or A vs B)
 */
export function createComparisonChart(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: { label: string; valueA: number; valueB: number; labelA?: string; labelB?: string }[],
  options: { title?: string } = {}
) {
  let currentRow = startRow;
  const maxValue = Math.max(...data.flatMap(d => [d.valueA, d.valueB]));

  if (options.title) {
    sheet.getCell(currentRow, startCol).value = options.title;
    sheet.getCell(currentRow, startCol).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
    currentRow += 2;
  }

  // Headers
  sheet.getCell(currentRow, startCol + 1).value = data[0]?.labelA || 'Value A';
  sheet.getCell(currentRow, startCol + 1).font = { color: { argb: COLORS.info } };
  sheet.getCell(currentRow, startCol + 2).value = data[0]?.labelB || 'Value B';
  sheet.getCell(currentRow, startCol + 2).font = { color: { argb: COLORS.purple } };
  currentRow++;

  data.forEach(item => {
    const widthA = Math.round((item.valueA / maxValue) * 15);
    const widthB = Math.round((item.valueB / maxValue) * 15);

    sheet.getCell(currentRow, startCol).value = item.label;
    sheet.getCell(currentRow, startCol).font = { bold: true };

    sheet.getCell(currentRow, startCol + 1).value = '█'.repeat(Math.max(1, widthA)) + ` ${formatNumber(item.valueA)}`;
    sheet.getCell(currentRow, startCol + 1).font = { color: { argb: COLORS.info } };

    sheet.getCell(currentRow, startCol + 2).value = '█'.repeat(Math.max(1, widthB)) + ` ${formatNumber(item.valueB)}`;
    sheet.getCell(currentRow, startCol + 2).font = { color: { argb: COLORS.purple } };

    currentRow++;
  });

  return currentRow;
}

/**
 * Create a progress bar
 */
export function createProgressBar(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: number,
  max: number,
  options: { width?: number; showPercent?: boolean; color?: string } = {}
) {
  const { width = 20, showPercent = true, color = COLORS.primary } = options;
  const percent = (value / max) * 100;
  const filled = Math.round((value / max) * width);

  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);

  sheet.getCell(row, col).value = bar;
  sheet.getCell(row, col).font = { color: { argb: color } };

  if (showPercent) {
    sheet.getCell(row, col + 1).value = `${percent.toFixed(1)}%`;
    sheet.getCell(row, col + 1).font = { color: { argb: COLORS.light } };
  }
}

/**
 * Create a heatmap cell
 */
export function colorHeatmapCell(
  cell: ExcelJS.Cell,
  value: number,
  min: number = -10,
  max: number = 10
) {
  const normalized = (value - min) / (max - min);

  let bgColor: string;
  if (normalized <= 0.2) bgColor = 'B91C1C';      // Dark red
  else if (normalized <= 0.35) bgColor = 'EF4444'; // Red
  else if (normalized <= 0.45) bgColor = 'FCA5A5'; // Light red
  else if (normalized <= 0.55) bgColor = 'F3F4F6'; // Gray
  else if (normalized <= 0.65) bgColor = 'BBF7D0'; // Light green
  else if (normalized <= 0.8) bgColor = '22C55E';  // Green
  else bgColor = '166534';                          // Dark green

  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + bgColor } };

  if (normalized <= 0.2 || normalized >= 0.8) {
    cell.font = { color: { argb: COLORS.white }, bold: true };
  }
}

/**
 * Create candlestick representation
 */
export function createCandlestick(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  open: number,
  high: number,
  low: number,
  close: number
) {
  const isGreen = close >= open;
  const body = Math.abs(close - open);
  const range = high - low || 1;
  const bodySize = Math.round((body / range) * 5);

  const candle = isGreen
    ? '│' + '▓'.repeat(Math.max(1, bodySize)) + '│'
    : '│' + '░'.repeat(Math.max(1, bodySize)) + '│';

  sheet.getCell(row, col).value = candle;
  sheet.getCell(row, col).font = { color: { argb: isGreen ? COLORS.success : COLORS.danger } };
}

// Helper function
function formatNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`;
  return `$${value.toFixed(2)}`;
}
