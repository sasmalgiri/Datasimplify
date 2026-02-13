/**
 * dashboardStyles.ts — Premium professional styling utilities for CRK Excel dashboards
 *
 * Implements other-levels.com quality design methodology:
 * - Hidden gridlines, floating dashboard effect with margins
 * - Large KPI values (22pt WHITE) with left accent bar + change indicators
 * - Typography hierarchy: 20pt title, 13pt section, 14pt metric
 * - Compact number formatting ($2.5T, $1.2B, $123M)
 * - Data bars, color scales, green/red conditional formatting
 * - 2x2 chart grid with card containers
 */

import ExcelJS from 'exceljs';
import { CATEGORY_THEMES, getDashboardTheme, type DashboardType } from './masterGenerator';

// Theme type from CATEGORY_THEMES values
export type DashboardTheme = (typeof CATEGORY_THEMES)[keyof typeof CATEGORY_THEMES];

// ============================================
// COMPACT NUMBER FORMATS (Other Level style)
// ============================================

/** Compact USD: $2.5T / $1.2B / $123M / $45.6K / $1,234 */
export const COMPACT_USD = '[>=1000000000000]$#,##0.0,,,,"T";[>=1000000000]$#,##0.0,,,"B";$#,##0.0,,"M"';

/** Compact USD with full breakdown: T/B/M/K */
export const COMPACT_USD_FULL = '[>=1000000000000]$#,##0.0,,,,"T";[>=1000000000]$#,##0.0,,,"B";[>=1000000]$#,##0.0,,"M";$#,##0';

/** Change indicator format: ▲ 2.50% / ▼ -1.30% / — 0.00% */
export const CHANGE_FORMAT = '"▲ "0.00"%";"▼ "0.00"%";"— "0.00"%"';

// ============================================
// INIT SHEET — Premium Light Theme Foundation
// ============================================

/**
 * Initialize a premium themed worksheet.
 * Hides gridlines for clean website-like look, fills visible area with theme bg,
 * adds right margin column for floating dashboard effect.
 */
export function initDarkSheet(
  workbook: ExcelJS.Workbook,
  name: string,
  dashboard: DashboardType,
  colWidths?: number[],
): { sheet: ExcelJS.Worksheet; theme: DashboardTheme } {
  const theme = getDashboardTheme(dashboard);
  const sheet = workbook.addWorksheet(name, {
    properties: { tabColor: { argb: theme.accent } },
  });

  // Default column widths: A(3 margin) B-N(working area) O(3 right margin)
  const widths = colWidths || [3, 18, 14, 14, 16, 12, 16, 12, 12, 12, 12, 12, 12, 12];
  widths.forEach((w, i) => {
    sheet.getColumn(i + 1).width = w;
  });

  // Right margin columns for floating effect (fill extends beyond content)
  const rightMarginStart = widths.length + 1;
  for (let c = rightMarginStart; c <= rightMarginStart + 4; c++) {
    sheet.getColumn(c).width = 3;
  }

  // Fill visible area with theme background (rows 1-80, cols A through right margin)
  // For light themes: white/light gray creates clean website-like canvas
  const totalCols = rightMarginStart + 4;
  for (let r = 1; r <= 80; r++) {
    const row = sheet.getRow(r);
    for (let c = 1; c <= totalCols; c++) {
      row.getCell(c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: theme.bg },
      };
    }
  }

  // === NAVIGATION BAR (Row 1) — Website-like top nav ===
  addSheetNavBar(sheet, name, theme);

  // Hide gridlines + row/column headers — clean website-like design
  // Freeze top rows so header + nav stays visible while scrolling
  sheet.views = [{
    showGridLines: false,
    showRowColHeaders: false,
    state: 'frozen',
    ySplit: 3,
    topLeftCell: 'A4',
    activeCell: 'B4',
  }];

  return { sheet, theme };
}

/**
 * Add a thin breadcrumb status bar at row 1 of every sheet.
 * Light design: subtle accent-tinted bar with breadcrumb path.
 */
export function addSheetNavBar(
  sheet: ExcelJS.Worksheet,
  currentSheetName: string,
  theme: DashboardTheme,
): void {
  sheet.getRow(1).height = 22;

  // Light status bar background across full width with accent tinting
  for (let c = 1; c <= 18; c++) {
    sheet.getCell(1, c).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: theme.kpiBg },
    };
    sheet.getCell(1, c).border = {
      bottom: { style: 'thin', color: { argb: theme.accent } },
    };
  }

  // Clickable breadcrumb path in column B
  const pageName = currentSheetName.replace('CRK ', '');
  const cell = sheet.getCell(1, 2);
  cell.value = { text: `CRK  \u203A  ${pageName}`, hyperlink: "#'CRK Navigation'!A1" };
  cell.font = { size: 9, color: { argb: theme.muted } };
  cell.alignment = { horizontal: 'left', vertical: 'middle' };

  // Generated date on the right side
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  const tsCell = sheet.getCell(1, 13);
  tsCell.value = dateStr;
  tsCell.font = { size: 8, color: { argb: theme.muted } };
  tsCell.alignment = { horizontal: 'right', vertical: 'middle' };
}

// ============================================
// SIDEBAR NAVIGATION — OtherLevel Signature
// ============================================

/**
 * Add a light left sidebar navigation panel in column A.
 * Clean light design: accent-tinted background, themed nav links, and tools section.
 * Added to all dashboard sheets for consistent website-like navigation.
 */
export function addSidebar(
  sheet: ExcelJS.Worksheet,
  currentSheetName: string,
  theme: DashboardTheme,
  navTargets?: { dashboard?: string; data?: string },
): void {
  // Light sidebar: use kpiBg (light slate) instead of dark headerBg
  const sidebarBg = theme.kpiBg;

  // Set column A to sidebar width
  sheet.getColumn(1).width = 18;

  // Fill sidebar column with light background + accent right border separator
  for (let r = 1; r <= 80; r++) {
    const cell = sheet.getCell(r, 1);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: sidebarBg } };
    cell.border = { right: { style: 'medium', color: { argb: theme.accent } } };
  }

  // Brand logo — prominent brand mark with accent color
  const brandCell = sheet.getCell(2, 1);
  brandCell.value = '⬡ CRK';
  brandCell.font = { size: 18, bold: true, color: { argb: theme.accent } };
  brandCell.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 32;

  // Thin accent divider line
  sheet.getCell(3, 1).border = {
    bottom: { style: 'thin', color: { argb: theme.accent } },
    right: { style: 'medium', color: { argb: theme.accent } },
  };
  sheet.getRow(3).height = 8;

  // MENU section label
  sheet.getCell(4, 1).value = 'MENU';
  sheet.getCell(4, 1).font = { size: 7, bold: true, color: { argb: theme.muted } };
  sheet.getCell(4, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(4).height = 18;

  // Navigation items
  const navItems: Array<{ label: string; target: string }> = [
    { label: '🏠 Home', target: 'CRK Navigation' },
  ];
  if (navTargets?.dashboard) {
    navItems.push({ label: '📊 Dashboard', target: navTargets.dashboard });
  }
  if (navTargets?.data) {
    navItems.push({ label: '📋 Data', target: navTargets.data });
  }

  let row = 5;
  for (const item of navItems) {
    const navCell = sheet.getCell(row, 1);
    const isActive = currentSheetName === item.target
      || currentSheetName.startsWith(item.target.replace('CRK ', ''));

    if (isActive) {
      navCell.value = `\u25B8 ${item.label}`;
      navCell.font = { size: 9, bold: true, color: { argb: theme.accent } };
      navCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.cardBg } };
      navCell.border = {
        left: { style: 'thick', color: { argb: theme.accent } },
        right: { style: 'medium', color: { argb: theme.accent } },
      };
    } else {
      navCell.value = { text: `  ${item.label}`, hyperlink: `#'${item.target}'!A1` };
      navCell.font = { size: 9, color: { argb: theme.text } };
    }
    navCell.alignment = { horizontal: 'left', vertical: 'middle' };
    row++;
  }

  row++; // spacer

  // TOOLS section label
  sheet.getCell(row, 1).value = 'TOOLS';
  sheet.getCell(row, 1).font = { size: 7, bold: true, color: { argb: theme.muted } };
  sheet.getCell(row, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  row++;

  const toolItems = [
    { label: '⚙️ Settings', target: 'Settings' },
    { label: '🔗 PQ Setup', target: 'PQ Setup' },
    { label: '📖 Docs', target: 'Documentation' },
  ];

  for (const item of toolItems) {
    const toolCell = sheet.getCell(row, 1);
    const isActive = currentSheetName === item.target;

    if (isActive) {
      toolCell.value = `\u25B8 ${item.label}`;
      toolCell.font = { size: 9, bold: true, color: { argb: theme.accent } };
      toolCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.cardBg } };
      toolCell.border = {
        left: { style: 'thick', color: { argb: theme.accent } },
        right: { style: 'medium', color: { argb: theme.accent } },
      };
    } else {
      toolCell.value = { text: `  ${item.label}`, hyperlink: `#'${item.target}'!A1` };
      toolCell.font = { size: 9, color: { argb: theme.text } };
    }
    toolCell.alignment = { horizontal: 'left', vertical: 'middle' };
    row++;
  }

  // Sidebar footer branding
  sheet.getCell(42, 1).value = 'CryptoReportKit';
  sheet.getCell(42, 1).font = { size: 7, italic: true, color: { argb: theme.muted } };
  sheet.getCell(42, 1).alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getCell(43, 1).value = '✨ v3.0';
  sheet.getCell(43, 1).font = { size: 7, color: { argb: theme.muted } };
  sheet.getCell(43, 1).alignment = { horizontal: 'center', vertical: 'middle' };

  // Update freeze panes: freeze sidebar column + header rows
  sheet.views = [{
    showGridLines: false,
    showRowColHeaders: false,
    state: 'frozen',
    xSplit: 1,
    ySplit: 3,
    topLeftCell: 'B4',
    activeCell: 'B4',
  }];
}

// ============================================
// HEADER BAR — 22pt Premium Title with accent border
// ============================================

/**
 * Add a full-width header bar with title and optional subtitle.
 * Light theme: accent-colored text on light background, accent bottom border.
 */
export function addHeaderBar(
  sheet: ExcelJS.Worksheet,
  row: number,
  title: string,
  theme: DashboardTheme,
  subtitle?: string,
): number {
  // Merge B-N for title
  sheet.mergeCells(row, 2, row, 14);
  const titleCell = sheet.getCell(row, 2);
  titleCell.value = title;
  titleCell.font = { size: 22, bold: true, color: { argb: theme.accent } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.kpiBg } };
  titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  // Accent left bar + bottom border for premium depth
  titleCell.border = {
    left: { style: 'thick', color: { argb: theme.accent } },
    bottom: { style: 'medium', color: { argb: theme.accent } },
  };
  for (let c = 3; c <= 14; c++) {
    const cell = sheet.getCell(row, c);
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.kpiBg } };
    cell.border = { bottom: { style: 'medium', color: { argb: theme.accent } } };
  }
  sheet.getRow(row).height = 56;

  let nextRow = row + 1;

  if (subtitle) {
    sheet.mergeCells(nextRow, 2, nextRow, 14);
    const subCell = sheet.getCell(nextRow, 2);
    subCell.value = `  ${subtitle}`;
    subCell.font = { size: 10, italic: true, color: { argb: theme.muted } };
    subCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.bg } };
    sheet.getRow(nextRow).height = 22;
    nextRow++;
  }

  return nextRow;
}

// ============================================
// KPI CARDS — Premium Other Level Design
// ============================================

/**
 * KPI card definition for addKPICards().
 */
export interface KPICardDef {
  title: string;
  formula: string; // CRK formula without the CRK. prefix, e.g., 'GLOBAL("total_market_cap")'
  format?: string; // Number format, e.g., '$#,##0', '0.00%'
  changeFormula?: string; // Optional CRK formula for change indicator (▲/▼)
  fallbackValue?: number | string; // Static fallback for IFERROR wrapping (prefetched value)
  changeFallback?: number | string; // Static fallback for change indicator
}

/**
 * Add a row of 2-4 premium KPI metric cards.
 * Other Level design: large 22pt WHITE value, left accent bar, change indicator.
 * Cards at columns B, E, H, K (3 cols wide each, 5 rows tall).
 * Cells are MERGED across card width so large values display without #####.
 */
export function addKPICards(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  cards: KPICardDef[],
  theme: DashboardTheme,
): number {
  const startCols = [2, 5, 8, 11]; // B, E, H, K
  const cardWidth = 3;
  const cardHeight = 5; // 5 rows: title, value, change, spacer, bottom border

  for (let i = 0; i < Math.min(cards.length, 4); i++) {
    const col = startCols[i];
    const card = cards[i];
    const endCol = col + cardWidth - 1;

    // Card background (3 cols × 5 rows) with kpiBg
    // Bottom row uses slightly darker shade for subtle gradient effect
    for (let r = startRow; r < startRow + cardHeight; r++) {
      for (let c = col; c <= endCol; c++) {
        sheet.getCell(r, c).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: theme.kpiBg },
        };
      }
    }

    // FULL ACCENT BORDER on all 4 sides (OtherLevel signature)
    // Top border
    for (let c = col; c <= endCol; c++) {
      const cell = sheet.getCell(startRow, c);
      cell.border = { ...(cell.border || {}), top: { style: 'thin', color: { argb: theme.accent } } };
    }
    // Bottom border
    for (let c = col; c <= endCol; c++) {
      const cell = sheet.getCell(startRow + cardHeight - 1, c);
      cell.border = { ...(cell.border || {}), bottom: { style: 'thin', color: { argb: theme.accent } } };
    }
    // Left border (accent bar — slightly thicker for emphasis)
    for (let r = startRow; r < startRow + cardHeight; r++) {
      const cell = sheet.getCell(r, col);
      cell.border = { ...(cell.border || {}), left: { style: 'medium', color: { argb: theme.accent } } };
    }
    // Right border
    for (let r = startRow; r < startRow + cardHeight; r++) {
      const cell = sheet.getCell(r, endCol);
      cell.border = { ...(cell.border || {}), right: { style: 'thin', color: { argb: theme.accent } } };
    }

    // Title: 9pt, ALL CAPS, muted gray — merged across card width
    sheet.mergeCells(startRow, col, startRow, endCol);
    const titleCell = sheet.getCell(startRow, col);
    titleCell.value = card.title;
    titleCell.font = { size: 9, color: { argb: theme.muted }, bold: true };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
    sheet.getRow(startRow).height = 20;

    // Value: 22pt, BOLD, WHITE — merged across card width so large numbers display
    sheet.mergeCells(startRow + 1, col, startRow + 1, endCol);
    const valueCell = sheet.getCell(startRow + 1, col);
    if (card.fallbackValue !== undefined) {
      // IFERROR wrapping: shows live CRK value if available, prefetched fallback otherwise
      let fb: string | number;
      if (typeof card.fallbackValue === 'string') {
        fb = `"${card.fallbackValue.replace(/"/g, '""')}"`;
      } else {
        fb = typeof card.fallbackValue === 'number' && !isNaN(card.fallbackValue) ? card.fallbackValue : 0;
      }
      valueCell.value = { formula: `IFERROR(CRK.${card.formula},${fb})` };
    } else {
      valueCell.value = { formula: `CRK.${card.formula}` };
    }
    valueCell.font = { size: 22, bold: true, color: { argb: theme.text } };
    valueCell.alignment = { horizontal: 'left', vertical: 'middle' };
    if (card.format) {
      valueCell.numFmt = card.format;
    }
    sheet.getRow(startRow + 1).height = 34;

    // Change indicator: ▲/▼ with green/red — merged, wrapped in IFERROR
    sheet.mergeCells(startRow + 2, col, startRow + 2, endCol);
    if (card.changeFormula) {
      const changeCell = sheet.getCell(startRow + 2, col);
      if (card.changeFallback !== undefined) {
        let cfb: string | number;
        if (typeof card.changeFallback === 'string') {
          cfb = `"${card.changeFallback.replace(/"/g, '""')}"`;
        } else {
          cfb = typeof card.changeFallback === 'number' && !isNaN(card.changeFallback) ? card.changeFallback : 0;
        }
        changeCell.value = { formula: `IFERROR(CRK.${card.changeFormula},${cfb})` };
      } else {
        changeCell.value = { formula: `IFERROR(CRK.${card.changeFormula},"")` };
      }
      changeCell.font = { size: 10, color: { argb: theme.muted } };
      changeCell.numFmt = CHANGE_FORMAT;
      changeCell.alignment = { horizontal: 'left', vertical: 'middle' };
      sheet.getRow(startRow + 2).height = 18;

      // Green/red conditional formatting for the change cell
      const ref = `${String.fromCharCode(64 + col)}${startRow + 2}`;
      sheet.addConditionalFormatting({
        ref,
        rules: [
          {
            type: 'cellIs',
            operator: 'greaterThan' as unknown as ExcelJS.CellIsRuleType['operator'],
            formulae: ['0'],
            priority: 1,
            style: { font: { color: { argb: theme.success } } },
          },
          {
            type: 'cellIs',
            operator: 'lessThan' as unknown as ExcelJS.CellIsRuleType['operator'],
            formulae: ['0'],
            priority: 2,
            style: { font: { color: { argb: theme.danger } } },
          },
        ] as ExcelJS.ConditionalFormattingRule[],
      });
    } else {
      sheet.getRow(startRow + 2).height = 14;
    }

    // Corner cells need combined borders (top+left, top+right, bottom+left, bottom+right)
    const tl = sheet.getCell(startRow, col);
    tl.border = { top: { style: 'thin', color: { argb: theme.accent } }, left: { style: 'medium', color: { argb: theme.accent } } };
    const tr = sheet.getCell(startRow, endCol);
    tr.border = { top: { style: 'thin', color: { argb: theme.accent } }, right: { style: 'thin', color: { argb: theme.accent } } };
    const bl = sheet.getCell(startRow + cardHeight - 1, col);
    bl.border = { bottom: { style: 'thin', color: { argb: theme.accent } }, left: { style: 'medium', color: { argb: theme.accent } } };
    const br = sheet.getCell(startRow + cardHeight - 1, endCol);
    br.border = { bottom: { style: 'thin', color: { argb: theme.accent } }, right: { style: 'thin', color: { argb: theme.accent } } };
  }

  return startRow + cardHeight + 1; // Next available row
}

// ============================================
// SECTION DIVIDERS — with accent underline
// ============================================

/**
 * Add a themed section divider with accent top + bottom borders.
 * Premium look: top thin accent + bottom medium accent for depth.
 */
export function addSectionDivider(
  sheet: ExcelJS.Worksheet,
  row: number,
  title: string,
  theme: DashboardTheme,
): void {
  sheet.mergeCells(row, 2, row, 14);
  const cell = sheet.getCell(row, 2);
  cell.value = title;
  cell.font = { size: 13, bold: true, color: { argb: theme.accent } };
  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.kpiBg } };
  cell.alignment = { horizontal: 'left', vertical: 'middle' };
  // Accent left bar + bottom border for premium section identity
  cell.border = {
    left: { style: 'thick', color: { argb: theme.accent } },
    top: { style: 'thin', color: { argb: theme.border } },
    bottom: { style: 'medium', color: { argb: theme.accent } },
  };
  for (let c = 3; c <= 14; c++) {
    const sc = sheet.getCell(row, c);
    sc.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.kpiBg } };
    sc.border = {
      top: { style: 'thin', color: { argb: theme.border } },
      bottom: { style: 'medium', color: { argb: theme.accent } },
    };
  }
  sheet.getRow(row).height = 38;
}

// ============================================
// TABLE HEADERS — no vertical borders (modern)
// ============================================

/**
 * Add themed column headers for a data table.
 * Premium: accent bottom border, uppercase text, padded height.
 */
export function addTableHeaders(
  sheet: ExcelJS.Worksheet,
  row: number,
  headers: Array<{ col: number; label: string; width?: number }>,
  theme: DashboardTheme,
): void {
  for (const h of headers) {
    const cell = sheet.getCell(row, h.col);
    cell.value = h.label.toUpperCase();
    cell.font = { size: 9, bold: true, color: { argb: theme.accent } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: theme.kpiBg } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: theme.accent } },
      top: { style: 'thin', color: { argb: theme.border } },
    };
  }
  sheet.getRow(row).height = 28;
}

// ============================================
// ZEBRA ROWS — alternating data rows
// ============================================

/**
 * Pre-fill zebra-striped rows for a spill formula area.
 * Alternates between cardBg and bg colors.
 */
export function addZebraRows(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  rowCount: number,
  startCol: number,
  endCol: number,
  theme: DashboardTheme,
): void {
  for (let r = 0; r < rowCount; r++) {
    const bgColor = r % 2 === 0 ? theme.cardBg : theme.bg;
    const row = sheet.getRow(startRow + r);
    for (let c = startCol; c <= endCol; c++) {
      row.getCell(c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: bgColor },
      };
      row.getCell(c).font = { size: 10, color: { argb: theme.text } };
    }
  }
}

// ============================================
// CONDITIONAL FORMATTING
// ============================================

/**
 * Add conditional formatting for percentage columns (green >= 0, red < 0).
 */
export function addPercentFormatting(
  sheet: ExcelJS.Worksheet,
  ref: string,
  theme: DashboardTheme,
): void {
  sheet.addConditionalFormatting({
    ref,
    rules: [
      {
        type: 'cellIs',
        operator: 'greaterThanOrEqual' as unknown as ExcelJS.CellIsRuleType['operator'],
        formulae: ['0'],
        priority: 1,
        style: { font: { color: { argb: theme.success } } },
      },
      {
        type: 'cellIs',
        operator: 'lessThan' as unknown as ExcelJS.CellIsRuleType['operator'],
        formulae: ['0'],
        priority: 2,
        style: { font: { color: { argb: theme.danger } } },
      },
    ] as ExcelJS.ConditionalFormattingRule[],
  });
}

/**
 * Add data bar conditional formatting for volume/market cap columns.
 */
export function addDataBars(
  sheet: ExcelJS.Worksheet,
  ref: string,
  color: string,
): void {
  sheet.addConditionalFormatting({
    ref,
    rules: [
      {
        type: 'dataBar',
        priority: 10,
        minLength: 0,
        maxLength: 100,
        gradient: true,
        cfvo: [{ type: 'min' }, { type: 'max' }],
        color: { argb: color },
      } as unknown as ExcelJS.ConditionalFormattingRule,
    ],
  });
}

/**
 * Add color scale conditional formatting (heatmap-style) for numeric columns.
 */
export function addColorScale(
  sheet: ExcelJS.Worksheet,
  ref: string,
  lowColor: string,
  highColor: string,
): void {
  sheet.addConditionalFormatting({
    ref,
    rules: [
      {
        type: 'colorScale',
        priority: 5,
        cfvo: [{ type: 'min' }, { type: 'max' }],
        color: [{ argb: lowColor }, { argb: highColor }],
      } as unknown as ExcelJS.ConditionalFormattingRule,
    ],
  });
}

// ============================================
// CHART CARDS — Card containers for native charts
// ============================================

/**
 * Add a chart card container — filled background with accent top border and optional title.
 */
export function addChartCard(
  sheet: ExcelJS.Worksheet,
  fromRow: number,
  toRow: number,
  fromCol: number,
  toCol: number,
  theme: DashboardTheme,
  title?: string,
): void {
  // Fill entire card area with cardBg
  for (let r = fromRow; r <= toRow; r++) {
    for (let c = fromCol; c <= toCol; c++) {
      sheet.getCell(r, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: theme.cardBg },
      };
    }
  }

  // Premium accent border — medium top, thin sides + bottom (OtherLevel card style)
  for (let c = fromCol; c <= toCol; c++) {
    sheet.getCell(fromRow, c).border = {
      ...(sheet.getCell(fromRow, c).border || {}),
      top: { style: 'medium', color: { argb: theme.accent } },
    };
    sheet.getCell(toRow, c).border = {
      ...(sheet.getCell(toRow, c).border || {}),
      bottom: { style: 'thin', color: { argb: theme.accent } },
    };
  }
  for (let r = fromRow; r <= toRow; r++) {
    sheet.getCell(r, fromCol).border = {
      ...(sheet.getCell(r, fromCol).border || {}),
      left: { style: 'thin', color: { argb: theme.border } },
    };
    sheet.getCell(r, toCol).border = {
      ...(sheet.getCell(r, toCol).border || {}),
      right: { style: 'thin', color: { argb: theme.border } },
    };
  }

  // Optional title in top-left of card with accent color
  if (title) {
    const titleCell = sheet.getCell(fromRow, fromCol);
    titleCell.value = title;
    titleCell.font = { size: 9, bold: true, color: { argb: theme.accent } };
    titleCell.alignment = { horizontal: 'left', vertical: 'middle' };
  }
}

/**
 * Add a 2x2 chart grid with card containers.
 * Returns the row after the grid ends.
 */
export function addChartGrid(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  theme: DashboardTheme,
  titles?: [string, string, string, string],
): number {
  const gridHeight = 12;
  const gap = 1;
  const leftCols: [number, number] = [2, 7];   // B-G
  const rightCols: [number, number] = [8, 13];  // H-M

  // Top-left chart card
  addChartCard(sheet, startRow, startRow + gridHeight - 1, leftCols[0], leftCols[1], theme, titles?.[0]);
  // Top-right chart card
  addChartCard(sheet, startRow, startRow + gridHeight - 1, rightCols[0], rightCols[1], theme, titles?.[1]);

  const row2Start = startRow + gridHeight + gap;
  // Bottom-left chart card
  addChartCard(sheet, row2Start, row2Start + gridHeight - 1, leftCols[0], leftCols[1], theme, titles?.[2]);
  // Bottom-right chart card
  addChartCard(sheet, row2Start, row2Start + gridHeight - 1, rightCols[0], rightCols[1], theme, titles?.[3]);

  return row2Start + gridHeight + 1;
}

// ============================================
// SPILL FORMULA + METRIC ROW
// ============================================

/**
 * Place a CRK spill formula in a cell with themed styling.
 */
export function placeSpillFormula(
  sheet: ExcelJS.Worksheet,
  row: number,
  col: number,
  formula: string,
  theme: DashboardTheme,
): void {
  const cell = sheet.getCell(row, col);
  cell.value = { formula: `CRK.${formula}` };
  cell.font = { size: 10, color: { argb: theme.text } };
}

/**
 * Place a metric row: label in one column, CRK formula in the next.
 * Uses 14pt value (larger than table data) with accent color for emphasis.
 */
export function addMetricRow(
  sheet: ExcelJS.Worksheet,
  row: number,
  labelCol: number,
  label: string,
  formula: string,
  theme: DashboardTheme,
  format?: string,
  fallbackValue?: number | string,
): void {
  const endCol = labelCol + 2; // 3 columns wide for card effect

  // Card background fill (premium mini-card look)
  for (let c = labelCol; c <= endCol; c++) {
    sheet.getCell(row, c).fill = {
      type: 'pattern', pattern: 'solid',
      fgColor: { argb: theme.cardBg },
    };
  }

  // Accent left border (matching KPI card signature)
  sheet.getCell(row, labelCol).border = {
    left: { style: 'medium', color: { argb: theme.accent } },
  };

  const labelCell = sheet.getCell(row, labelCol);
  labelCell.value = label;
  labelCell.font = { size: 11, bold: true, color: { argb: theme.text } };

  const valueCol = labelCol + 1;
  const valueCell = sheet.getCell(row, valueCol);
  if (fallbackValue !== undefined) {
    let fb: string | number;
    if (typeof fallbackValue === 'string') {
      // Escape double quotes for Excel formula strings (double them up)
      const escaped = fallbackValue.replace(/"/g, '""');
      fb = `"${escaped}"`;
    } else {
      fb = typeof fallbackValue === 'number' && !isNaN(fallbackValue) ? fallbackValue : 0;
    }
    valueCell.value = { formula: `IFERROR(CRK.${formula},${fb})` };
  } else {
    valueCell.value = { formula: `CRK.${formula}` };
  }
  valueCell.font = { size: 14, bold: true, color: { argb: theme.accent } };
  if (format) {
    valueCell.numFmt = format;
  }
  sheet.getRow(row).height = 26; // Slightly taller for card spacing
}

// ============================================
// POPULATE DATA ROWS — Server-fetched values
// ============================================

/**
 * Populate data rows with server-fetched CoinGecko market data.
 * Used instead of placeSpillFormula when prefetched data is available.
 * Column layout matches TOP_HEADERS: #, Name, Symbol, Price, MCap, 24h%, 7d%, [Volume]
 */
export function populateMarketRows(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  rows: any[],
  theme: DashboardTheme,
  includeVolume?: boolean,
): void {
  const endCol = includeVolume ? 8 : 7;
  for (let i = 0; i < rows.length; i++) {
    const r = startRow + i;
    const coin = rows[i];
    sheet.getCell(r, 1).value = coin.market_cap_rank || (i + 1);
    sheet.getCell(r, 2).value = coin.name || '';
    sheet.getCell(r, 3).value = ((coin.symbol as string) || '').toUpperCase();

    const priceCell = sheet.getCell(r, 4);
    priceCell.value = coin.current_price ?? 0;
    priceCell.numFmt = '$#,##0.00';

    const mcapCell = sheet.getCell(r, 5);
    mcapCell.value = coin.market_cap ?? 0;
    mcapCell.numFmt = COMPACT_USD;

    const chg24 = sheet.getCell(r, 6);
    chg24.value = (coin.price_change_percentage_24h ?? 0) / 100;
    chg24.numFmt = '0.00%';

    const chg7d = sheet.getCell(r, 7);
    chg7d.value = (coin.price_change_percentage_7d_in_currency ?? coin.price_change_percentage_7d ?? 0) / 100;
    chg7d.numFmt = '0.00%';

    if (includeVolume) {
      const volCell = sheet.getCell(r, 8);
      volCell.value = coin.total_volume ?? 0;
      volCell.numFmt = COMPACT_USD;
    }

    // Apply theme styling
    for (let c = 1; c <= endCol; c++) {
      const cell = sheet.getCell(r, c);
      cell.font = { ...cell.font, size: 10, color: { argb: theme.text } };
    }
  }
}

/**
 * Populate exchange data rows.
 * Column layout: #, Name, Trust Score, 24h Volume, Year Est.
 */
export function populateExchangeRows(
  sheet: ExcelJS.Worksheet,
  startRow: number,
  rows: any[],
  theme: DashboardTheme,
): void {
  for (let i = 0; i < rows.length; i++) {
    const r = startRow + i;
    const ex = rows[i];
    sheet.getCell(r, 1).value = i + 1;
    sheet.getCell(r, 2).value = ex.name || '';
    sheet.getCell(r, 3).value = ex.trust_score ?? 0;

    const volCell = sheet.getCell(r, 4);
    volCell.value = ex.trade_volume_24h_btc ?? 0;
    volCell.numFmt = '#,##0.00';

    sheet.getCell(r, 5).value = ex.year_established ?? '';

    for (let c = 1; c <= 5; c++) {
      sheet.getCell(r, c).font = { size: 10, color: { argb: theme.text } };
    }
  }
}

// ============================================
// FOOTER — Consistent branding on every sheet
// ============================================

/**
 * Add a branded footer with attribution and timestamp.
 * OtherLevel pattern: thin separator + attribution line.
 */
export function addFooter(
  sheet: ExcelJS.Worksheet,
  row: number,
  theme: DashboardTheme,
): void {
  // Accent separator line
  for (let c = 2; c <= 14; c++) {
    sheet.getCell(row, c).border = {
      top: { style: 'thin', color: { argb: theme.accent } },
    };
    sheet.getCell(row, c).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: theme.bg },
    };
  }
  sheet.getRow(row).height = 8;

  // Attribution row with accent-tinted background
  const footRow = row + 1;
  sheet.mergeCells(footRow, 2, footRow, 8);
  sheet.getCell(footRow, 2).value = 'Data provided by CoinGecko  \u2022  cryptoreportkit.com';
  sheet.getCell(footRow, 2).font = { size: 8, italic: true, color: { argb: theme.accent } };
  sheet.getCell(footRow, 2).alignment = { horizontal: 'left', vertical: 'middle' };
  for (let c = 2; c <= 14; c++) {
    sheet.getCell(footRow, c).fill = {
      type: 'pattern', pattern: 'solid', fgColor: { argb: theme.kpiBg },
    };
  }

  // Timestamp on right
  sheet.mergeCells(footRow, 9, footRow, 14);
  const dateStr = new Date().toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  });
  sheet.getCell(footRow, 9).value = `Generated: ${dateStr}`;
  sheet.getCell(footRow, 9).font = { size: 8, italic: true, color: { argb: theme.muted } };
  sheet.getCell(footRow, 9).alignment = { horizontal: 'right', vertical: 'middle' };
  sheet.getRow(footRow).height = 18;
}
