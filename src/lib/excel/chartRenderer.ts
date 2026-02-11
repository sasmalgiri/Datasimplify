/**
 * Chart Renderer for Excel
 *
 * Generates beautiful chart images that can be embedded in Excel.
 * Uses server-side rendering for Chart.js-style visualizations.
 */

import ExcelJS from 'exceljs';

// Chart color palettes (matching website + OtherLevel quality)
export const CHART_PALETTES = {
  default: ['#059669', '#10B981', '#34D399', '#6EE7B7', '#A7F3D0'],
  vibrant: ['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981'],
  crypto: ['#F7931A', '#627EEA', '#00D395', '#E84142', '#8247E5'],
  heatmap: ['#EF4444', '#F97316', '#FACC15', '#84CC16', '#22C55E'],
  gradient: ['#059669', '#0D9488', '#0891B2', '#0284C7', '#2563EB'],
  // OtherLevel-inspired palettes
  otherlevel: ['#C9A470', '#FFDDDF', '#8B7355', '#D4B896', '#F5E6D3'],
  executive: ['#2C3E50', '#34495E', '#7F8C8D', '#BDC3C7', '#ECF0F1'],
  finance: ['#1ABC9C', '#16A085', '#2ECC71', '#27AE60', '#3498DB'],
  midnight: ['#6366F1', '#8B5CF6', '#A78BFA', '#C4B5FD', '#E0E7FF'],
  sunset: ['#F97316', '#FB923C', '#FDBA74', '#FED7AA', '#FFEDD5'],
};

export const CHART_THEMES = {
  dark: {
    background: '#111827',
    gridColor: '#374151',
    textColor: '#E5E7EB',
    accentColor: '#059669',
  },
  light: {
    background: '#FFFFFF',
    gridColor: '#E5E7EB',
    textColor: '#1F2937',
    accentColor: '#059669',
  },
  emerald: {
    background: '#0D1117',
    gridColor: '#1F2937',
    textColor: '#10B981',
    accentColor: '#059669',
  },
  // OtherLevel-inspired themes
  otherlevel: {
    background: '#1F1F1F',
    gridColor: '#2D2D2D',
    textColor: '#FFDDDF',
    accentColor: '#C9A470',
    cardBg: '#171717',
    headerBg: '#2A2A2A',
  },
  executive: {
    background: '#1A1A2E',
    gridColor: '#16213E',
    textColor: '#EAEAEA',
    accentColor: '#E94560',
    cardBg: '#0F3460',
    headerBg: '#533483',
  },
  finance: {
    background: '#0A192F',
    gridColor: '#172A45',
    textColor: '#CCD6F6',
    accentColor: '#64FFDA',
    cardBg: '#112240',
    headerBg: '#233554',
  },
};

// ============================================
// SPARKLINE MINI-CHARTS
// ============================================

export interface SparklineData {
  values: number[];
  color?: string;
  showTrend?: boolean;
}

/**
 * Creates an advanced sparkline visualization in cells
 */
export function createAdvancedSparkline(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  data: SparklineData,
  options: { width?: number; height?: number } = {}
): void {
  const { values, color = '#059669', showTrend = true } = data;
  const { width = 15 } = options;

  if (values.length === 0) return;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  // Normalize to 0-8 scale for block characters
  const normalized = values.map(v => Math.round(((v - min) / range) * 8));

  // Block characters for different heights
  const blocks = [' ', '▁', '▂', '▃', '▄', '▅', '▆', '▇', '█'];

  // Take last N values to fit width
  const displayValues = normalized.slice(-width);

  // Build sparkline string
  const sparkline = displayValues.map(v => blocks[v]).join('');

  const cell = sheet.getCell(row, col);
  cell.value = sparkline;

  // Color based on trend
  if (showTrend) {
    const firstVal = values[0];
    const lastVal = values[values.length - 1];
    const trendColor = lastVal >= firstVal ? '#22C55E' : '#EF4444';
    cell.font = { color: { argb: trendColor.replace('#', 'FF') } };
  } else {
    cell.font = { color: { argb: color.replace('#', 'FF') } };
  }
}

// ============================================
// AREA CHART (Cell-based)
// ============================================

export function createAreaChart(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: { label: string; values: number[] }[],
  options: {
    title?: string;
    width?: number;
    height?: number;
    showLegend?: boolean;
  } = {}
): void {
  const { title, width = 40, height = 10, showLegend = true } = options;
  const colors = CHART_PALETTES.default;

  // Title
  if (title) {
    const titleCell = sheet.getCell(startRow, startCol);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 12, color: { argb: 'FF059669' } };
  }

  const chartStartRow = title ? startRow + 1 : startRow;

  // Find global min/max
  const allValues = data.flatMap(d => d.values);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);
  const range = max - min || 1;

  // Draw each series
  data.forEach((series, seriesIndex) => {
    const color = colors[seriesIndex % colors.length];

    for (let x = 0; x < Math.min(series.values.length, width); x++) {
      const normalizedHeight = Math.round(((series.values[x] - min) / range) * (height - 1));

      for (let y = 0; y < height; y++) {
        const cellRow = chartStartRow + (height - 1 - y);
        const cellCol = startCol + x;
        const cell = sheet.getCell(cellRow, cellCol);

        if (y <= normalizedHeight) {
          // Fill area
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: color.replace('#', 'FF') + (y === normalizedHeight ? '' : '40') },
          };
        }
      }
    }
  });

  // Legend
  if (showLegend) {
    const legendRow = chartStartRow + height + 1;
    data.forEach((series, i) => {
      const legendCell = sheet.getCell(legendRow, startCol + i * 10);
      legendCell.value = `■ ${series.label}`;
      legendCell.font = { color: { argb: colors[i % colors.length].replace('#', 'FF') } };
    });
  }
}

// ============================================
// DONUT/PIE CHART (Cell-based visual)
// ============================================

export function createDonutChart(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: { label: string; value: number; color?: string }[],
  options: { title?: string; size?: number } = {}
): void {
  const { title, size = 8 } = options;
  const colors = CHART_PALETTES.vibrant;

  // Title
  if (title) {
    const titleCell = sheet.getCell(startRow, startCol);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 12, color: { argb: 'FF059669' } };
  }

  const chartRow = title ? startRow + 2 : startRow;

  // Calculate percentages
  const total = data.reduce((sum, d) => sum + d.value, 0);

  // Create visual representation
  const segments: string[] = [];
  data.forEach((item, i) => {
    const percentage = (item.value / total) * 100;
    const blocks = Math.round(percentage / 5); // Each block = 5%
    const color = item.color || colors[i % colors.length];
    segments.push('█'.repeat(blocks));
  });

  // Draw circular representation
  sheet.getCell(chartRow, startCol).value = segments.join('');

  // Legend with percentages
  data.forEach((item, i) => {
    const percentage = ((item.value / total) * 100).toFixed(1);
    const legendRow = chartRow + 2 + i;
    const color = item.color || colors[i % colors.length];

    sheet.getCell(legendRow, startCol).value = '■';
    sheet.getCell(legendRow, startCol).font = { color: { argb: color.replace('#', 'FF') } };

    sheet.getCell(legendRow, startCol + 1).value = `${item.label}: ${percentage}%`;
  });
}

// ============================================
// CANDLESTICK CHART
// ============================================

export interface CandlestickData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
}

export function createCandlestickChart(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: CandlestickData[],
  options: { title?: string; width?: number } = {}
): void {
  const { title, width = 30 } = options;

  if (title) {
    const titleCell = sheet.getCell(startRow, startCol);
    titleCell.value = title;
    titleCell.font = { bold: true, size: 12, color: { argb: 'FF059669' } };
  }

  const chartRow = title ? startRow + 2 : startRow;

  // Display last N candles
  const candles = data.slice(-width);

  // Find price range
  const allPrices = candles.flatMap(c => [c.high, c.low]);
  const minPrice = Math.min(...allPrices);
  const maxPrice = Math.max(...allPrices);
  const priceRange = maxPrice - minPrice || 1;

  // Candle characters
  candles.forEach((candle, i) => {
    const cell = sheet.getCell(chartRow, startCol + i);
    const isGreen = candle.close >= candle.open;

    // Simple candle representation
    if (isGreen) {
      cell.value = '▲';
      cell.font = { color: { argb: 'FF22C55E' } };
    } else {
      cell.value = '▼';
      cell.font = { color: { argb: 'FFEF4444' } };
    }
  });

  // Price labels
  sheet.getCell(chartRow + 1, startCol).value = `High: $${maxPrice.toLocaleString()}`;
  sheet.getCell(chartRow + 2, startCol).value = `Low: $${minPrice.toLocaleString()}`;
}

// ============================================
// HEATMAP GRID
// ============================================

export function createHeatmapGrid(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: { label: string; value: number }[][],
  options: { title?: string; colorScale?: 'green-red' | 'blue-yellow' | 'purple' } = {}
): void {
  const { title, colorScale = 'green-red' } = options;

  if (title) {
    sheet.getCell(startRow, startCol).value = title;
    sheet.getCell(startRow, startCol).font = { bold: true, size: 12 };
  }

  const gridRow = title ? startRow + 2 : startRow;

  // Color interpolation
  const getColor = (value: number, min: number, max: number): string => {
    const normalized = (value - min) / (max - min || 1);

    if (colorScale === 'green-red') {
      if (normalized >= 0.5) {
        // Green gradient
        const intensity = Math.round((normalized - 0.5) * 2 * 255);
        return `FF${(255 - intensity).toString(16).padStart(2, '0')}FF${(255 - intensity).toString(16).padStart(2, '0')}`;
      } else {
        // Red gradient
        const intensity = Math.round((0.5 - normalized) * 2 * 255);
        return `FFFF${(255 - intensity).toString(16).padStart(2, '0')}${(255 - intensity).toString(16).padStart(2, '0')}`;
      }
    }

    return 'FFFFFFFF';
  };

  // Find global min/max
  const allValues = data.flat().map(d => d.value);
  const min = Math.min(...allValues);
  const max = Math.max(...allValues);

  // Render grid
  data.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      const excelCell = sheet.getCell(gridRow + rowIndex, startCol + colIndex);
      excelCell.value = cell.value.toFixed(1);
      excelCell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: getColor(cell.value, min, max) },
      };
      excelCell.alignment = { horizontal: 'center' };
    });
  });
}

// ============================================
// GAUGE / METER CHART
// ============================================

export function createGaugeMeter(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  value: number,
  options: {
    min?: number;
    max?: number;
    label?: string;
    showValue?: boolean;
    size?: 'small' | 'medium' | 'large';
  } = {}
): void {
  const { min = 0, max = 100, label, showValue = true, size = 'medium' } = options;

  const percentage = ((value - min) / (max - min)) * 100;
  const width = size === 'small' ? 10 : size === 'medium' ? 20 : 30;

  // Determine color based on value
  let color: string;
  if (percentage <= 25) {
    color = 'FFEF4444'; // Red
  } else if (percentage <= 50) {
    color = 'FFF97316'; // Orange
  } else if (percentage <= 75) {
    color = 'FFFACC15'; // Yellow
  } else {
    color = 'FF22C55E'; // Green
  }

  // Create gauge bar
  const filledBlocks = Math.round((percentage / 100) * width);
  const emptyBlocks = width - filledBlocks;

  const gaugeCell = sheet.getCell(row, col);
  gaugeCell.value = '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  gaugeCell.font = { color: { argb: color } };

  // Value display
  if (showValue) {
    const valueCell = sheet.getCell(row, col + 1);
    valueCell.value = ` ${value}${label ? ` ${label}` : ''}`;
    valueCell.font = { bold: true, color: { argb: color } };
  }
}

// ============================================
// COMPARISON BAR CHART
// ============================================

export function createComparisonBars(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: { label: string; value1: number; value2: number; label1?: string; label2?: string }[],
  options: { title?: string; maxWidth?: number } = {}
): void {
  const { title, maxWidth = 20 } = options;

  if (title) {
    sheet.getCell(startRow, startCol).value = title;
    sheet.getCell(startRow, startCol).font = { bold: true, size: 12, color: { argb: 'FF059669' } };
  }

  const chartRow = title ? startRow + 2 : startRow;

  // Find max value
  const maxValue = Math.max(...data.flatMap(d => [d.value1, d.value2]));

  data.forEach((item, i) => {
    const row = chartRow + i * 3;

    // Label
    sheet.getCell(row, startCol).value = item.label;
    sheet.getCell(row, startCol).font = { bold: true };

    // First bar
    const bar1Width = Math.round((item.value1 / maxValue) * maxWidth);
    sheet.getCell(row + 1, startCol).value = '█'.repeat(bar1Width) + ` ${item.value1.toLocaleString()}`;
    sheet.getCell(row + 1, startCol).font = { color: { argb: 'FF3B82F6' } };

    // Second bar
    const bar2Width = Math.round((item.value2 / maxValue) * maxWidth);
    sheet.getCell(row + 2, startCol).value = '█'.repeat(bar2Width) + ` ${item.value2.toLocaleString()}`;
    sheet.getCell(row + 2, startCol).font = { color: { argb: 'FF10B981' } };
  });
}

// ============================================
// TREND INDICATOR
// ============================================

export function addTrendIndicator(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  currentValue: number,
  previousValue: number,
  options: { showPercentage?: boolean; showArrow?: boolean } = {}
): void {
  const { showPercentage = true, showArrow = true } = options;

  const change = currentValue - previousValue;
  const percentChange = previousValue !== 0 ? (change / previousValue) * 100 : 0;
  const isPositive = change >= 0;

  const cell = sheet.getCell(row, col);

  let displayValue = '';
  if (showArrow) {
    displayValue += isPositive ? '▲ ' : '▼ ';
  }
  if (showPercentage) {
    displayValue += `${isPositive ? '+' : ''}${percentChange.toFixed(2)}%`;
  }

  cell.value = displayValue;
  cell.font = {
    bold: true,
    color: { argb: isPositive ? 'FF22C55E' : 'FFEF4444' },
  };
}

// ============================================
// MINI DASHBOARD CARD
// ============================================

export function createDashboardCard(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: {
    title: string;
    value: string | number;
    change?: number;
    sparkline?: number[];
    icon?: string;
  },
  options: { width?: number; color?: string } = {}
): void {
  const { width = 4, color = '#059669' } = options;

  // Card background
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < width; c++) {
      sheet.getCell(startRow + r, startCol + c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF1F2937' },
      };
    }
  }

  // Title
  sheet.getCell(startRow, startCol).value = data.icon ? `${data.icon} ${data.title}` : data.title;
  sheet.getCell(startRow, startCol).font = { color: { argb: 'FF9CA3AF' }, size: 10 };

  // Value
  sheet.getCell(startRow + 1, startCol).value = data.value;
  sheet.getCell(startRow + 1, startCol).font = {
    bold: true,
    size: 16,
    color: { argb: color.replace('#', 'FF') },
  };

  // Change
  if (data.change !== undefined) {
    const changeCell = sheet.getCell(startRow + 2, startCol);
    changeCell.value = `${data.change >= 0 ? '▲' : '▼'} ${Math.abs(data.change).toFixed(2)}%`;
    changeCell.font = {
      color: { argb: data.change >= 0 ? 'FF22C55E' : 'FFEF4444' },
    };
  }

  // Sparkline
  if (data.sparkline && data.sparkline.length > 0) {
    createAdvancedSparkline(sheet, startRow + 3, startCol, {
      values: data.sparkline,
      showTrend: true,
    });
  }
}

// ============================================
// OTHERLEVEL-STYLE KPI CARD (Premium)
// ============================================

export interface KPICardData {
  title: string;
  value: string | number;
  subtitle?: string;
  change?: number;
  changeLabel?: string;
  icon?: string;
  trend?: 'up' | 'down' | 'neutral';
  badge?: string;
}

export function createOtherLevelKPICard(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: KPICardData,
  options: {
    width?: number;
    height?: number;
    theme?: 'otherlevel' | 'executive' | 'finance' | 'dark';
  } = {}
): number {
  const { width = 5, height = 5, theme = 'otherlevel' } = options;

  // Theme colors
  const themes = {
    otherlevel: { bg: 'FF171717', accent: 'FFC9A470', text: 'FFFFDDDF', muted: 'FF8B7355' },
    executive: { bg: 'FF1A1A2E', accent: 'FFE94560', text: 'FFEAEAEA', muted: 'FF7F8C8D' },
    finance: { bg: 'FF0A192F', accent: 'FF64FFDA', text: 'FFCCD6F6', muted: 'FF8892B0' },
    dark: { bg: 'FF111827', accent: 'FF059669', text: 'FFF9FAFB', muted: 'FF9CA3AF' },
  };
  const colors = themes[theme];

  // Card background with rounded appearance
  for (let r = 0; r < height; r++) {
    for (let c = 0; c < width; c++) {
      const cell = sheet.getCell(startRow + r, startCol + c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.bg },
      };
      // Add subtle border
      cell.border = {
        top: r === 0 ? { style: 'thin', color: { argb: colors.accent } } : undefined,
        bottom: r === height - 1 ? { style: 'thin', color: { argb: colors.accent } } : undefined,
        left: c === 0 ? { style: 'thin', color: { argb: colors.accent } } : undefined,
        right: c === width - 1 ? { style: 'thin', color: { argb: colors.accent } } : undefined,
      };
    }
  }

  // Icon + Title row
  const titleCell = sheet.getCell(startRow + 1, startCol + 1);
  titleCell.value = data.icon ? `${data.icon} ${data.title}` : data.title;
  titleCell.font = { size: 10, color: { argb: colors.muted } };

  // Badge (optional)
  if (data.badge) {
    const badgeCell = sheet.getCell(startRow + 1, startCol + width - 1);
    badgeCell.value = data.badge;
    badgeCell.font = { size: 8, bold: true, color: { argb: colors.accent } };
    badgeCell.alignment = { horizontal: 'right' };
  }

  // Main value
  const valueCell = sheet.getCell(startRow + 2, startCol + 1);
  valueCell.value = data.value;
  valueCell.font = { size: 22, bold: true, color: { argb: colors.text } };

  // Subtitle
  if (data.subtitle) {
    const subtitleCell = sheet.getCell(startRow + 3, startCol + 1);
    subtitleCell.value = data.subtitle;
    subtitleCell.font = { size: 9, color: { argb: colors.muted } };
  }

  // Change indicator
  if (data.change !== undefined) {
    const changeRow = startRow + (data.subtitle ? 4 : 3);
    const changeCell = sheet.getCell(changeRow, startCol + 1);
    const isPositive = data.change >= 0;
    const arrow = isPositive ? '▲' : '▼';
    const changeText = `${arrow} ${Math.abs(data.change).toFixed(2)}%`;
    const label = data.changeLabel ? ` ${data.changeLabel}` : '';

    changeCell.value = changeText + label;
    changeCell.font = {
      size: 10,
      bold: true,
      color: { argb: isPositive ? 'FF22C55E' : 'FFEF4444' },
    };
  }

  return startRow + height;
}

// ============================================
// EXECUTIVE SUMMARY PANEL
// ============================================

export interface SummaryPanelData {
  title: string;
  metrics: { label: string; value: string | number; change?: number }[];
}

export function createExecutiveSummaryPanel(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: SummaryPanelData,
  options: { width?: number; theme?: 'otherlevel' | 'executive' | 'finance' | 'dark' } = {}
): number {
  const { width = 12, theme = 'otherlevel' } = options;

  const themes = {
    otherlevel: { headerBg: 'FF2A2A2A', bg: 'FF1F1F1F', accent: 'FFC9A470', text: 'FFFFDDDF' },
    executive: { headerBg: 'FF533483', bg: 'FF1A1A2E', accent: 'FFE94560', text: 'FFEAEAEA' },
    finance: { headerBg: 'FF233554', bg: 'FF0A192F', accent: 'FF64FFDA', text: 'FFCCD6F6' },
    dark: { headerBg: 'FF1F2937', bg: 'FF111827', accent: 'FF059669', text: 'FFF9FAFB' },
  };
  const colors = themes[theme];

  // Header
  sheet.mergeCells(startRow, startCol, startRow, startCol + width - 1);
  const headerCell = sheet.getCell(startRow, startCol);
  headerCell.value = `  ${data.title}`;
  headerCell.font = { bold: true, size: 14, color: { argb: colors.text } };
  headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.headerBg } };
  headerCell.alignment = { vertical: 'middle' };
  sheet.getRow(startRow).height = 30;

  // Metrics grid
  const metricsPerRow = 4;
  const metricWidth = Math.floor(width / metricsPerRow);

  data.metrics.forEach((metric, i) => {
    const row = startRow + 1 + Math.floor(i / metricsPerRow) * 3;
    const col = startCol + (i % metricsPerRow) * metricWidth;

    // Background
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < metricWidth; c++) {
        sheet.getCell(row + r, col + c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: colors.bg },
        };
      }
    }

    // Label
    sheet.getCell(row, col).value = metric.label;
    sheet.getCell(row, col).font = { size: 9, color: { argb: 'FF9CA3AF' } };

    // Value
    sheet.getCell(row + 1, col).value = metric.value;
    sheet.getCell(row + 1, col).font = { size: 16, bold: true, color: { argb: colors.text } };

    // Change
    if (metric.change !== undefined) {
      const changeCell = sheet.getCell(row + 2, col);
      const isPositive = metric.change >= 0;
      changeCell.value = `${isPositive ? '▲' : '▼'} ${Math.abs(metric.change).toFixed(2)}%`;
      changeCell.font = { size: 9, color: { argb: isPositive ? 'FF22C55E' : 'FFEF4444' } };
    }
  });

  const totalRows = 1 + Math.ceil(data.metrics.length / metricsPerRow) * 3;
  return startRow + totalRows;
}

// ============================================
// PROFESSIONAL DATA TABLE
// ============================================

export function createProfessionalTable(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  startCol: number,
  data: {
    headers: string[];
    rows: (string | number)[][];
    title?: string;
  },
  options: {
    theme?: 'otherlevel' | 'executive' | 'finance' | 'dark';
    zebraStripe?: boolean;
    highlightColumn?: number;
  } = {}
): number {
  const { theme = 'otherlevel', zebraStripe = true, highlightColumn } = options;

  const themes = {
    otherlevel: {
      headerBg: 'FFC9A470', headerText: 'FF171717',
      rowBg: 'FF1F1F1F', rowAltBg: 'FF2A2A2A', text: 'FFFFDDDF',
    },
    executive: {
      headerBg: 'FFE94560', headerText: 'FFFFFFFF',
      rowBg: 'FF1A1A2E', rowAltBg: 'FF16213E', text: 'FFEAEAEA',
    },
    finance: {
      headerBg: 'FF64FFDA', headerText: 'FF0A192F',
      rowBg: 'FF0A192F', rowAltBg: 'FF112240', text: 'FFCCD6F6',
    },
    dark: {
      headerBg: 'FF059669', headerText: 'FFFFFFFF',
      rowBg: 'FF111827', rowAltBg: 'FF1F2937', text: 'FFF9FAFB',
    },
  };
  const colors = themes[theme];

  let currentRow = startRow;

  // Title
  if (data.title) {
    sheet.mergeCells(currentRow, startCol, currentRow, startCol + data.headers.length - 1);
    const titleCell = sheet.getCell(currentRow, startCol);
    titleCell.value = data.title;
    titleCell.font = { bold: true, size: 14, color: { argb: colors.text } };
    titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.rowBg } };
    sheet.getRow(currentRow).height = 25;
    currentRow++;
  }

  // Headers
  data.headers.forEach((header, i) => {
    const cell = sheet.getCell(currentRow, startCol + i);
    cell.value = header;
    cell.font = { bold: true, color: { argb: colors.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.headerBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: colors.headerBg } },
    };
  });
  sheet.getRow(currentRow).height = 25;
  currentRow++;

  // Data rows
  data.rows.forEach((row, rowIndex) => {
    const isAlt = zebraStripe && rowIndex % 2 === 1;
    const bgColor = isAlt ? colors.rowAltBg : colors.rowBg;

    row.forEach((value, colIndex) => {
      const cell = sheet.getCell(currentRow, startCol + colIndex);
      cell.value = value;
      cell.font = { color: { argb: colors.text } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bgColor } };

      // Highlight column
      if (highlightColumn !== undefined && colIndex === highlightColumn) {
        cell.font = { bold: true, color: { argb: themes[theme].headerBg.replace('FF', '') } };
      }

      // Format numbers with color for percentages
      if (typeof value === 'number') {
        cell.alignment = { horizontal: 'right' };
      } else if (typeof value === 'string' && value.includes('%')) {
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
          cell.font = {
            color: { argb: numValue >= 0 ? 'FF22C55E' : 'FFEF4444' },
            bold: true,
          };
        }
      }
    });

    currentRow++;
  });

  return currentRow;
}

// ============================================
// PROGRESS RING (Circular Progress)
// ============================================

export function createProgressRing(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  percentage: number,
  options: { label?: string; size?: 'small' | 'medium' | 'large'; color?: string } = {}
): void {
  const { label, size = 'medium', color = '#059669' } = options;

  // Unicode circle segments for progress visualization
  const segments = ['○', '◔', '◑', '◕', '●'];
  const segmentIndex = Math.min(4, Math.floor(percentage / 25));

  const cell = sheet.getCell(row, col);
  cell.value = `${segments[segmentIndex]} ${percentage.toFixed(0)}%`;
  cell.font = {
    size: size === 'small' ? 10 : size === 'large' ? 18 : 14,
    bold: true,
    color: { argb: color.replace('#', 'FF') },
  };

  if (label) {
    const labelCell = sheet.getCell(row + 1, col);
    labelCell.value = label;
    labelCell.font = { size: 9, color: { argb: 'FF9CA3AF' } };
  }
}

// ============================================
// METRIC COMPARISON ROW
// ============================================

export function createMetricComparisonRow(
  sheet: ExcelJS.Worksheet,
  row: number,
  startCol: number,
  data: {
    label: string;
    current: number;
    previous: number;
    format?: 'currency' | 'percent' | 'number';
  },
  options: { theme?: 'otherlevel' | 'dark' } = {}
): void {
  const { theme = 'otherlevel' } = options;
  const colors = theme === 'otherlevel'
    ? { bg: 'FF1F1F1F', text: 'FFFFDDDF', muted: 'FF8B7355' }
    : { bg: 'FF1F2937', text: 'FFF9FAFB', muted: 'FF9CA3AF' };

  // Background
  for (let c = 0; c < 5; c++) {
    sheet.getCell(row, startCol + c).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.bg },
    };
  }

  // Label
  sheet.getCell(row, startCol).value = data.label;
  sheet.getCell(row, startCol).font = { color: { argb: colors.muted } };

  // Format value
  const formatValue = (val: number): string => {
    switch (data.format) {
      case 'currency': return `$${val.toLocaleString()}`;
      case 'percent': return `${val.toFixed(2)}%`;
      default: return val.toLocaleString();
    }
  };

  // Current value
  sheet.getCell(row, startCol + 1).value = formatValue(data.current);
  sheet.getCell(row, startCol + 1).font = { bold: true, color: { argb: colors.text } };

  // Previous value
  sheet.getCell(row, startCol + 2).value = formatValue(data.previous);
  sheet.getCell(row, startCol + 2).font = { color: { argb: colors.muted } };

  // Change
  const change = data.previous !== 0 ? ((data.current - data.previous) / data.previous) * 100 : 0;
  const isPositive = change >= 0;
  sheet.getCell(row, startCol + 3).value = `${isPositive ? '+' : ''}${change.toFixed(2)}%`;
  sheet.getCell(row, startCol + 3).font = {
    bold: true,
    color: { argb: isPositive ? 'FF22C55E' : 'FFEF4444' },
  };

  // Visual bar
  const barWidth = Math.min(20, Math.abs(change));
  sheet.getCell(row, startCol + 4).value = '█'.repeat(Math.round(barWidth / 2));
  sheet.getCell(row, startCol + 4).font = {
    color: { argb: isPositive ? 'FF22C55E' : 'FFEF4444' },
  };
}
