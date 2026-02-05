/**
 * Advanced Excel Template Generator using ExcelJS
 *
 * Generates professional Excel files with:
 * - CRK formulas (BYOK - no data redistribution)
 * - Professional styling and formatting
 * - Charts and visualizations
 * - VBA macros for auto-refresh (.xlsm)
 * - Support for 5000+ coins via CoinGecko
 */

import ExcelJS from 'exceljs';
import { getTemplateConfig, type TemplateType, type FormulaTemplate, type TemplateConfig, type SheetDefinition, type ChartDefinition } from './templateConfig';
import { isCoinSupported, getAllCryptoSheetCoins, getTopCoins, CATEGORY_NAMES } from './cryptoSheetCoins';
import { getChartsForTemplate, CHART_COLORS, type ChartConfig } from './chartDefinitions';
import { type FormulaMode, convertToCRK } from './formulaMapping';

// Re-export FormulaMode for use by other components
export type { FormulaMode } from './formulaMapping';

/**
 * Content type options for template generation
 * - 'addin': CRK formulas + Office.js Add-in for interactive ChartJS charts (default)
 * - 'native_charts': CRK formulas + chart-ready data layout (no add-in needed for charts)
 * - 'formulas_only': Only CRK formulas, no charts
 */
export type ContentType = 'formulas_only' | 'addin' | 'native_charts';

export interface UserTemplateConfig {
  templateType: TemplateType;
  coins: string[]; // User-selected coins (e.g., ["BTC", "ETH", "SOL"])
  timeframe: string; // '24h', '7d', '30d', '1y'
  currency: string; // 'USD', 'EUR', 'BTC', 'ETH'
  contentType?: ContentType; // Type of content to generate (default: 'addin')
  formulaMode?: FormulaMode; // 'crk' only - CRK Add-in is the native solution
  customizations: {
    includeCharts: boolean;
    metricsList?: string[];
    comparedCoins?: string[];
    selectedIndicators?: string[];
    correlationCoins?: string[];
    period?: string;
    holdings?: Array<{ coin: string; quantity: number; avgPrice?: number }>;
    [key: string]: unknown;
  };
}

// Color palette matching website dark theme
const COLORS = {
  // Primary brand colors
  primary: '10B981', // Emerald (matches website emerald-500)
  primaryLight: '34D399', // Emerald light (emerald-400)
  primaryDark: '059669', // Emerald dark (emerald-600)

  // Accent colors
  secondary: '6366F1', // Indigo
  accent: 'F59E0B', // Amber

  // Status colors
  danger: 'EF4444', // Red
  success: '22C55E', // Green
  warning: 'F97316', // Orange

  // Dark theme backgrounds (matching website bg-gray-*)
  bgDark: '111827', // gray-900 (main background)
  bgMedium: '1F2937', // gray-800 (card background)
  bgLight: '374151', // gray-700 (input/hover background)
  bgLighter: '4B5563', // gray-600 (borders)

  // Header styling (dark theme)
  headerBg: '111827', // Dark background like website
  headerText: 'FFFFFF',
  headerBorder: '10B981', // Emerald accent border

  // Row styling (dark theme)
  rowBg: '1F2937', // gray-800
  altRowBg: '111827', // gray-900 (alternating)
  rowHover: '374151', // gray-700

  // Text colors
  textPrimary: 'FFFFFF',
  textSecondary: '9CA3AF', // gray-400
  textMuted: '6B7280', // gray-500

  // Border colors
  borderColor: '374151', // gray-700
  borderAccent: '10B981', // Emerald

  // Link color
  link: '34D399', // Emerald-400 (matches website links)

  // Positive/Negative values (for charts & conditional formatting)
  positive: '10B981', // Emerald for gains
  negative: 'EF4444', // Red for losses
  neutral: '6B7280', // Gray for neutral
};

// Excel data bar colors (gradient effects)
const DATA_BAR_COLORS = {
  volume: { start: '065F46', end: '10B981' }, // Dark to light emerald
  marketCap: { start: '1E40AF', end: '3B82F6' }, // Dark to light blue
  price: { start: '6D28D9', end: 'A78BFA' }, // Dark to light purple
  percent: { positive: '10B981', negative: 'EF4444' }, // Emerald/Red
};

/**
 * Generate Excel template with CRK formulas using ExcelJS
 *
 * Supports three content types:
 * - 'addin': Formulas + instructions for Office.js Add-in (interactive ChartJS charts) - default
 * - 'native_charts': Formulas + chart-ready data layout (no add-in needed)
 * - 'formulas_only': Only CRK formulas, no charts (lighter file)
 */
export async function generateTemplate(
  userConfig: UserTemplateConfig,
  format: 'xlsx' | 'xlsm'
): Promise<Buffer> {
  // Determine content type (default to 'addin' for best experience)
  const contentType = userConfig.contentType || 'addin';

  // 1. Get base template config
  const baseTemplate = getTemplateConfig(userConfig.templateType);

  // 2. Create workbook with ExcelJS
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = 'CryptoReportKit';
  workbook.lastModifiedBy = 'CryptoReportKit Template Generator';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();

  // Company info - Set document properties directly on workbook
  const contentLabel = contentType === 'formulas_only' ? ' (Formulas Only)' :
                       contentType === 'addin' ? ' (Interactive Charts)' : '';
  workbook.title = `${baseTemplate.name}${contentLabel} - CryptoReportKit`;
  workbook.subject = 'Cryptocurrency Data Template';
  workbook.keywords = 'crypto,bitcoin,ethereum,cryptosheets,cryptoreportkit';
  workbook.category = 'Finance';
  const addinBranding = userConfig.formulaMode === 'crk' ? 'CRK BYOK' : 'CRK Add-in';
  workbook.description = `${baseTemplate.description} - Data via ${addinBranding}`;
  workbook.company = 'CryptoReportKit';

  // 3. Add hidden __CRK__ metadata sheet (for refresh support)
  await createCRKMetadataSheet(workbook, baseTemplate, userConfig, contentType);

  // 4. Add START_HERE sheet (always first visible sheet)
  await createSetupSheet(workbook, baseTemplate, userConfig);

  // 5. Add CONFIGURATION sheet for user settings
  await createConfigSheet(workbook, userConfig);

  // 6. Add DATA sheet(s) with CRK formulas
  const dataSheets = baseTemplate.sheets.filter((s) => s.type === 'data');
  for (const sheetDef of dataSheets) {
    await createDataSheet(workbook, baseTemplate, userConfig, sheetDef);
  }

  // 7. Add CHART sheet based on content type
  if (contentType === 'addin') {
    // Add-in mode: Add instructions for installing Office.js Add-in
    await createAddinInstructionsSheet(workbook, baseTemplate, userConfig);
  } else if (contentType === 'native_charts') {
    // Native charts mode: Create chart-ready data layout with instructions
    // No add-in needed - user creates charts manually using Excel's built-in chart tools
    await createNativeChartsSheet(workbook, baseTemplate, userConfig);
  }
  // formulas_only mode: Skip charts entirely

  // 7.5. Add EMBEDDED CHARTS sheet if charts are enabled
  if (userConfig.customizations.includeCharts) {
    await createEmbeddedChartsSheet(workbook, baseTemplate, userConfig);
  }

  // 8. Add INSTRUCTIONS sheet
  await createInstructionsSheet(workbook, baseTemplate, userConfig);

  // 9. Add SUPPORTED_COINS reference sheet
  await createCoinsReferenceSheet(workbook);

  // 10. For .xlsm: Add VBA project (if supported)
  if (format === 'xlsm') {
    addVBAProject(workbook, baseTemplate);
  }

  // 11. Set the first data sheet as the active sheet (not START_HERE)
  // This ensures users see their data immediately when opening the file
  if (dataSheets.length > 0) {
    const firstDataSheetName = dataSheets[0].name;
    const firstDataSheet = workbook.getWorksheet(firstDataSheetName);
    if (firstDataSheet) {
      // Set this sheet as active by updating its view
      firstDataSheet.views = [{ state: 'frozen', ySplit: 1, activeCell: 'A2' }];
      // Set workbook to open with this sheet selected
      const activeTabIndex = workbook.worksheets.findIndex(ws => ws.name === firstDataSheetName);
      workbook.views = [{
        x: 0,
        y: 0,
        width: 10000,
        height: 10000,
        firstSheet: 0,
        activeTab: activeTabIndex >= 0 ? activeTabIndex : 0,
        visibility: 'visible'
      }];
    }
  }

  // 12. Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Create hidden __CRK__ metadata sheet for refresh support
 * Contains template configuration that can be used to regenerate or refresh the workbook
 */
async function createCRKMetadataSheet(
  workbook: ExcelJS.Workbook,
  template: TemplateConfig,
  userConfig: UserTemplateConfig,
  contentType: ContentType
): Promise<void> {
  const sheet = workbook.addWorksheet('__CRK__', {
    state: 'veryHidden', // Hidden from UI (cannot be unhidden via UI)
    properties: { tabColor: { argb: COLORS.primary } },
  });

  sheet.columns = [
    { width: 25 },
    { width: 80 },
  ];

  let row = 1;

  // Header
  sheet.getCell(`A${row}`).value = 'CryptoReportKit Template Metadata';
  sheet.getCell(`A${row}`).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
  row += 2;

  // Template configuration (as JSON)
  sheet.getCell(`A${row}`).value = 'TEMPLATE_CONFIG';
  sheet.getCell(`A${row}`).font = { bold: true };
  sheet.getCell(`B${row}`).value = JSON.stringify({
    templateType: userConfig.templateType,
    coins: userConfig.coins,
    timeframe: userConfig.timeframe,
    currency: userConfig.currency,
    contentType,
    formulaMode: userConfig.formulaMode || 'crk',
    customizations: userConfig.customizations,
    templateName: template.name,
    templateDescription: template.description,
    templateCategory: template.category,
  }, null, 2);
  sheet.getCell(`B${row}`).alignment = { wrapText: true, vertical: 'top' };
  row += 1;

  // Generation metadata
  sheet.getCell(`A${row}`).value = 'GENERATED_AT';
  sheet.getCell(`B${row}`).value = new Date().toISOString();
  row += 1;

  sheet.getCell(`A${row}`).value = 'GENERATOR_VERSION';
  sheet.getCell(`B${row}`).value = '1.0.0';
  row += 1;

  sheet.getCell(`A${row}`).value = 'GENERATOR_TYPE';
  sheet.getCell(`B${row}`).value = 'template_generator';
  row += 1;

  // Formula mode (cryptosheets or crk)
  sheet.getCell(`A${row}`).value = 'FORMULA_MODE';
  sheet.getCell(`B${row}`).value = userConfig.formulaMode || 'cryptosheets';
  row += 1;

  // Content type
  sheet.getCell(`A${row}`).value = 'CONTENT_TYPE';
  sheet.getCell(`B${row}`).value = contentType;
  row += 1;

  // Last refresh timestamp (empty initially, will be updated by add-in)
  sheet.getCell(`A${row}`).value = 'LAST_REFRESH';
  sheet.getCell(`B${row}`).value = '';
  row += 1;

  // Refresh count (will be incremented by add-in)
  sheet.getCell(`A${row}`).value = 'REFRESH_COUNT';
  sheet.getCell(`B${row}`).value = 0;
  row += 2;

  // Attribution requirements
  sheet.getCell(`A${row}`).value = 'ATTRIBUTION';
  sheet.getCell(`A${row}`).font = { bold: true };
  row += 1;

  const attribution = [
    'Template generated by CryptoReportKit (cryptoreportkit.com)',
    userConfig.formulaMode === 'crk'
      ? 'Data via Bring Your Own Key (BYOK) - user-provided API keys'
      : 'Data via CRK Add-in (cryptoreportkit.com)',
    'No data redistribution - formulas only',
  ];

  attribution.forEach((text) => {
    sheet.getCell(`B${row}`).value = text;
    sheet.getCell(`B${row}`).font = { italic: true, color: { argb: COLORS.textSecondary } };
    row += 1;
  });
  row += 1;

  // Instructions for refresh
  sheet.getCell(`A${row}`).value = 'REFRESH_INSTRUCTIONS';
  sheet.getCell(`A${row}`).font = { bold: true };
  row += 1;

  const instructions = [
    'This template can be refreshed using:',
    '1. CRK Excel Add-in - Click "Refresh All" in the add-in panel',
    '2. Auto-refresh - Formulas will auto-refresh based on your add-in settings',
    '3. Manual refresh - Press Ctrl+Alt+F9 (Windows) or Cmd+Opt+Shift+F9 (Mac)',
  ];

  instructions.forEach((text) => {
    sheet.getCell(`B${row}`).value = text;
    row += 1;
  });
  row += 2;

  // Footer
  sheet.getCell(`A${row}`).value = '© 2026 CryptoReportKit';
  sheet.getCell(`A${row}`).font = { italic: true, color: { argb: COLORS.textMuted } };
  row += 1;

  sheet.getCell(`A${row}`).value = 'All rights reserved';
  sheet.getCell(`A${row}`).font = { italic: true, color: { argb: COLORS.textMuted } };
}

/**
 * Create the START_HERE setup sheet with dark theme styling matching website
 * Includes quota-aware messaging and failure state detection
 */
async function createSetupSheet(
  workbook: ExcelJS.Workbook,
  template: TemplateConfig,
  userConfig: UserTemplateConfig
): Promise<void> {
  const isCRK = userConfig.formulaMode === 'crk';

  const sheet = workbook.addWorksheet('START_HERE', {
    properties: { tabColor: { argb: COLORS.primary } },
    views: [{ showGridLines: false }],
  });

  // Set column widths
  sheet.columns = [
    { width: 5 },
    { width: 45 },
    { width: 55 },
    { width: 5 },
  ];

  // Apply dark background to entire visible area
  for (let r = 1; r <= 70; r++) {
    for (let c = 1; c <= 4; c++) {
      const cell = sheet.getCell(r, c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.bgDark },
      };
    }
  }

  let row = 2;

  // Header with emerald accent
  sheet.mergeCells(`B${row}:C${row}`);
  const titleCell = sheet.getCell(`B${row}`);
  titleCell.value = `📊 ${template.name}`;
  titleCell.font = { bold: true, size: 24, color: { argb: COLORS.primary } };
  titleCell.alignment = { horizontal: 'center' };
  row += 1;

  // Subtitle
  sheet.mergeCells(`B${row}:C${row}`);
  const subtitleCell = sheet.getCell(`B${row}`);
  subtitleCell.value = isCRK ? 'CryptoReportKit Template - Data via BYOK' : 'CryptoReportKit Template - Data via CRK Add-in';
  subtitleCell.font = { size: 12, color: { argb: COLORS.textSecondary }, italic: true };
  subtitleCell.alignment = { horizontal: 'center' };
  row += 3;

  // ============ REQUIREMENTS BOX ============
  sheet.mergeCells(`B${row}:C${row}`);
  const reqHeader = sheet.getCell(`B${row}`);
  reqHeader.value = '⚠️ REQUIREMENTS - READ BEFORE CONTINUING';
  reqHeader.font = { bold: true, size: 14, color: { argb: COLORS.warning } };
  reqHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  reqHeader.border = { top: { style: 'medium', color: { argb: COLORS.warning } }, left: { style: 'medium', color: { argb: COLORS.warning } } };
  row += 1;

  const requirements = isCRK ? [
    ['✓ Excel Desktop', 'Windows or Mac (Excel Online NOT supported)'],
    ['✓ CRK Add-in', 'Install from cryptoreportkit.com/addin/setup'],
    ['✓ Provider API Key', 'Your own CoinGecko key (BYOK)'],
  ] : [
    ['✓ Excel Desktop', 'Windows or Mac (Excel Online NOT supported)'],
    ['✓ CRK Add-in', 'Install from cryptoreportkit.com/addin/setup'],
    ['✓ API Key (BYOK)', 'Connect your data provider API key'],
  ];

  for (const [req, note] of requirements) {
    sheet.getCell(`B${row}`).value = req;
    sheet.getCell(`B${row}`).font = { bold: true, color: { argb: COLORS.warning } };
    sheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
    sheet.getCell(`B${row}`).border = { left: { style: 'medium', color: { argb: COLORS.warning } } };
    sheet.getCell(`C${row}`).value = note;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textPrimary } };
    sheet.getCell(`C${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
    sheet.getCell(`C${row}`).border = { right: { style: 'medium', color: { argb: COLORS.warning } } };
    row++;
  }

  // Close box
  sheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  sheet.getCell(`B${row}`).border = { bottom: { style: 'medium', color: { argb: COLORS.warning } }, left: { style: 'medium', color: { argb: COLORS.warning } } };
  sheet.getCell(`C${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  sheet.getCell(`C${row}`).border = { bottom: { style: 'medium', color: { argb: COLORS.warning } }, right: { style: 'medium', color: { argb: COLORS.warning } } };
  row += 2;

  // ============ STATUS CHECKER ============
  sheet.mergeCells(`B${row}:C${row}`);
  const statusHeader = sheet.getCell(`B${row}`);
  statusHeader.value = '🔍 STATUS CHECKER';
  statusHeader.font = { bold: true, size: 14, color: { argb: COLORS.primary } };
  statusHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  statusHeader.border = { top: { style: 'medium', color: { argb: COLORS.primary } }, left: { style: 'medium', color: { argb: COLORS.primary } } };
  row += 1;

  // Add-in Status
  const addinLabel = isCRK ? 'CRK Add-in Status:' : 'CRK Add-in Status:';
  const statusFormula = isCRK ? 'IFERROR(CRK.INFO("bitcoin","name"), "❌ NOT INSTALLED")' : 'IFERROR(CRK.INFO("bitcoin","name"), "❌ NOT INSTALLED")';

  sheet.getCell(`B${row}`).value = addinLabel;
  sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textSecondary } };
  sheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  sheet.getCell(`B${row}`).border = { left: { style: 'medium', color: { argb: COLORS.primary } } };
  sheet.getCell(`C${row}`).value = { formula: statusFormula };
  sheet.getCell(`C${row}`).font = { bold: true, color: { argb: COLORS.textPrimary } };
  sheet.getCell(`C${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  sheet.getCell(`C${row}`).border = { right: { style: 'medium', color: { argb: COLORS.primary } } };
  row++;

  // Sample Data Check
  const sampleFormula = isCRK ? 'IFERROR(CRK.PRICE("bitcoin"), "❌ ERROR - Check status above")' : 'IFERROR(CRK.PRICE("bitcoin"), "❌ ERROR - Check status above")';

  sheet.getCell(`B${row}`).value = 'Sample Data (BTC Price):';
  sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textSecondary } };
  sheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  sheet.getCell(`B${row}`).border = { left: { style: 'medium', color: { argb: COLORS.primary } } };
  sheet.getCell(`C${row}`).value = { formula: sampleFormula };
  sheet.getCell(`C${row}`).font = { bold: true, color: { argb: COLORS.textPrimary } };
  sheet.getCell(`C${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  sheet.getCell(`C${row}`).border = { right: { style: 'medium', color: { argb: COLORS.primary } } };
  row++;

  // Close box
  sheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  sheet.getCell(`B${row}`).border = { bottom: { style: 'medium', color: { argb: COLORS.primary } }, left: { style: 'medium', color: { argb: COLORS.primary } } };
  sheet.getCell(`C${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  sheet.getCell(`C${row}`).border = { bottom: { style: 'medium', color: { argb: COLORS.primary } }, right: { style: 'medium', color: { argb: COLORS.primary } } };
  row += 2;

  // ============ REFRESH BUTTON AREA ============
  sheet.mergeCells(`B${row}:C${row}`);
  const refreshHeader = sheet.getCell(`B${row}`);
  refreshHeader.value = '🔄 REFRESH DATA';
  refreshHeader.font = { bold: true, size: 16, color: { argb: COLORS.textPrimary } };
  refreshHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.positive } };
  refreshHeader.alignment = { horizontal: 'center' };
  refreshHeader.border = {
    top: { style: 'thick', color: { argb: COLORS.positive } },
    left: { style: 'thick', color: { argb: COLORS.positive } },
    right: { style: 'thick', color: { argb: COLORS.positive } },
  };
  row++;

  sheet.mergeCells(`B${row}:C${row}`);
  const refreshInstr = sheet.getCell(`B${row}`);
  refreshInstr.value = 'Press Ctrl+Alt+F5 (Windows) or Cmd+Alt+F5 (Mac)';
  refreshInstr.font = { size: 12, color: { argb: COLORS.bgDark } };
  refreshInstr.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.positive } };
  refreshInstr.alignment = { horizontal: 'center' };
  refreshInstr.border = {
    bottom: { style: 'thick', color: { argb: COLORS.positive } },
    left: { style: 'thick', color: { argb: COLORS.positive } },
    right: { style: 'thick', color: { argb: COLORS.positive } },
  };
  row += 2;

  // ============ CONFIGURATION SUMMARY ============
  sheet.getCell(`B${row}`).value = 'Your Configuration:';
  sheet.getCell(`B${row}`).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
  row += 1;

  const refreshFrequencyRaw = userConfig.customizations.refreshFrequency;
  const refreshFrequency = typeof refreshFrequencyRaw === 'string' ? refreshFrequencyRaw : 'manual';
  const configItems: [string, string][] = [
    ['Template', template.name],
    ['Assets', `${userConfig.coins.length} coins${userConfig.coins.length <= 10 ? ' (Free tier OK)' : ' (May need Pro)'}`],
    ['Timeframe', userConfig.timeframe || '1d'],
    ['Refresh Mode', refreshFrequency === 'manual' ? 'Manual (Recommended)' : refreshFrequency],
    ['Currency', userConfig.currency || 'USD'],
    ['Charts', userConfig.customizations.includeCharts ? 'Enabled' : 'Disabled'],
    ['Generated', new Date().toLocaleString()],
  ];

  for (const [label, value] of configItems) {
    sheet.getCell(`B${row}`).value = `  ${label}:`;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textSecondary } };
    sheet.getCell(`C${row}`).value = value;
    sheet.getCell(`C${row}`).font = { bold: true, color: { argb: COLORS.textPrimary } };
    row++;
  }
  row += 2;

  // ============ QUOTA WARNING (if applicable) ============
  if (userConfig.coins.length > 10 || refreshFrequency !== 'manual') {
    sheet.mergeCells(`B${row}:C${row + 1}`);
    const quotaWarning = sheet.getCell(`B${row}`);
    quotaWarning.value = '⚠️ QUOTA WARNING: Your configuration may exceed API rate limits.\nCheck your provider\'s limits. Reduce assets or use manual refresh to stay within limits.';
    quotaWarning.font = { size: 11, color: { argb: COLORS.warning } };
    quotaWarning.alignment = { wrapText: true, vertical: 'middle' };
    quotaWarning.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
    quotaWarning.border = {
      top: { style: 'medium', color: { argb: COLORS.warning } },
      left: { style: 'medium', color: { argb: COLORS.warning } },
      bottom: { style: 'medium', color: { argb: COLORS.warning } },
      right: { style: 'medium', color: { argb: COLORS.warning } },
    };
    row += 3;
  }

  // ============ TROUBLESHOOTING ============
  sheet.getCell(`B${row}`).value = 'Common Issues:';
  sheet.getCell(`B${row}`).font = { bold: true, size: 14, color: { argb: COLORS.danger } };
  row += 1;

  const issues = [
    ['#NAME? errors', 'CRK Add-in not installed → Install from cryptoreportkit.com/addin/setup'],
    ['#VALUE! errors', 'Not signed in to CRK Add-in → Sign in via CRK taskpane'],
    ['Data not updating', 'Press Ctrl+Alt+F5 to refresh (auto-refresh is disabled)'],
    ['Rate limit errors', 'API quota exceeded → Wait or reduce asset count'],
    ['Stale data', 'Last refresh was too long ago → Press Ctrl+Alt+F5'],
  ];

  for (const [issue, solution] of issues) {
    sheet.getCell(`B${row}`).value = `  ${issue}:`;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.danger } };
    sheet.getCell(`C${row}`).value = solution;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textSecondary }, size: 10 };
    row++;
  }
  row += 2;

  // ============ LINKS ============
  sheet.getCell(`B${row}`).value = 'Helpful Links:';
  sheet.getCell(`B${row}`).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
  row += 1;

  const links = [
    ['Get CRK Add-in', 'https://cryptoreportkit.com/addin/setup'],
    ['CryptoReportKit Templates', 'https://cryptoreportkit.com/templates'],
    ['CryptoReportKit Help', 'https://cryptoreportkit.com/help'],
    ['Get CoinGecko API Key', 'https://www.coingecko.com/en/api/pricing'],
  ];

  for (const [label, url] of links) {
    sheet.getCell(`B${row}`).value = `  ${label}:`;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textSecondary } };
    sheet.getCell(`C${row}`).value = { text: url, hyperlink: url };
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.link }, underline: true };
    row++;
  }

  // Protect sheet from accidental edits (but allow formula calculation)
  sheet.protect('cryptoreportkit', { formatCells: true, selectLockedCells: true, selectUnlockedCells: true });
}

/**
 * Create configuration sheet with dark theme styling
 */
async function createConfigSheet(
  workbook: ExcelJS.Workbook,
  userConfig: UserTemplateConfig
): Promise<void> {
  const sheet = workbook.addWorksheet('Config', {
    properties: { tabColor: { argb: COLORS.secondary } },
  });

  sheet.columns = [
    { width: 25 },
    { width: 40 },
    { width: 50 },
  ];

  // Apply dark background
  for (let r = 1; r <= 15; r++) {
    for (let c = 1; c <= 3; c++) {
      sheet.getCell(r, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.bgDark },
      };
    }
  }

  // Header with emerald accent border
  sheet.getCell('A1').value = 'Setting';
  sheet.getCell('B1').value = 'Current Value';
  sheet.getCell('C1').value = 'Description';

  ['A1', 'B1', 'C1'].forEach(cellAddr => {
    const cell = sheet.getCell(cellAddr);
    cell.font = { bold: true, color: { argb: COLORS.headerText } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
    cell.alignment = { horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: COLORS.primary } },
    };
  });

  // Configuration rows with dark theme
  const configs = [
    ['Currency', userConfig.currency || 'USD', 'Base currency for prices (USD, EUR, GBP, BTC, ETH)'],
    ['Timeframe', userConfig.timeframe || '24h', 'Data timeframe (24h, 7d, 30d, 90d, 1y)'],
    ['Refresh_Rate', 'Manual', 'How often to refresh (Manual, 5min, 15min, 1h)'],
    ['Include_Charts', userConfig.customizations.includeCharts ? 'Yes' : 'No', 'Include chart visualizations'],
    ['Max_Rows', '100', 'Maximum data rows to display'],
    ['Sort_By', 'market_cap', 'Default sort column'],
    ['Sort_Order', 'desc', 'Sort order (asc or desc)'],
  ];

  configs.forEach((config, idx) => {
    const rowNum = idx + 2;
    const rowFill = idx % 2 === 0 ? COLORS.rowBg : COLORS.altRowBg;

    // Setting column
    sheet.getCell(`A${rowNum}`).value = config[0];
    sheet.getCell(`A${rowNum}`).font = { color: { argb: COLORS.textPrimary } };
    sheet.getCell(`A${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };

    // Value column - editable with emerald highlight
    sheet.getCell(`B${rowNum}`).value = config[1];
    sheet.getCell(`B${rowNum}`).font = { bold: true, color: { argb: COLORS.primary } };
    sheet.getCell(`B${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgLight } };
    sheet.getCell(`B${rowNum}`).border = {
      left: { style: 'thin', color: { argb: COLORS.primary } },
      right: { style: 'thin', color: { argb: COLORS.primary } },
    };

    // Description column
    sheet.getCell(`C${rowNum}`).value = config[2];
    sheet.getCell(`C${rowNum}`).font = { color: { argb: COLORS.textSecondary }, italic: true };
    sheet.getCell(`C${rowNum}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
  });

  // Add data validation for some fields
  sheet.getCell('B2').dataValidation = {
    type: 'list',
    allowBlank: false,
    formulae: ['"USD,EUR,GBP,JPY,CAD,AUD,CHF,BTC,ETH"'],
  };

  sheet.getCell('B3').dataValidation = {
    type: 'list',
    allowBlank: false,
    formulae: ['"1h,24h,7d,30d,90d,1y"'],
  };

  // Instructions row with emerald accent
  const lastRow = configs.length + 3;
  sheet.mergeCells(`A${lastRow}:C${lastRow}`);
  sheet.getCell(`A${lastRow}`).value = '💡 Tip: Modify values in column B to customize your template. Press Ctrl+Alt+F5 to refresh after changes.';
  sheet.getCell(`A${lastRow}`).font = { italic: true, color: { argb: COLORS.primary } };
  sheet.getCell(`A${lastRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgDark } };
}

/**
 * Create data sheet with dark theme styling, data bars, and enhanced formatting
 */
async function createDataSheet(
  workbook: ExcelJS.Workbook,
  template: TemplateConfig,
  userConfig: UserTemplateConfig,
  sheetDef: SheetDefinition
): Promise<void> {
  const sheet = workbook.addWorksheet(sheetDef.name, {
    properties: { tabColor: { argb: COLORS.primary } },
    views: [{ state: 'frozen', ySplit: 1 }], // Freeze header row
  });

  const columns = sheetDef.columns || [];

  // Set column widths and headers
  sheet.columns = columns.map((col, idx) => ({
    header: col.header,
    key: `col${idx}`,
    width: col.width || 15,
  }));

  // Style header row with dark theme and emerald accent
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: COLORS.headerText }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerBg },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: COLORS.primary } },
      right: { style: 'thin', color: { argb: COLORS.bgLight } },
    };
  });

  // Determine coins to use
  const coinsToUse = userConfig.coins.length > 0
    ? userConfig.coins
    : getTopCoins(20).map(c => c.symbol);

  // Add data rows with dark theme styling
  coinsToUse.forEach((coin, rowIdx) => {
    const row = sheet.getRow(rowIdx + 2);
    const rowFill = rowIdx % 2 === 0 ? COLORS.rowBg : COLORS.altRowBg;

    // Apply formulas
    template.formulas.forEach((formulaTpl) => {
      const formula = buildFormula(formulaTpl, coin, userConfig, rowIdx);
      const cell = row.getCell(formulaTpl.column + 1);
      cell.value = { formula };
    });

    // Style each cell with dark theme
    columns.forEach((col, colIdx) => {
      const cell = row.getCell(colIdx + 1);

      // Dark background
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowFill },
      };

      // White text for readability
      cell.font = { color: { argb: COLORS.textPrimary }, size: 10 };

      // Subtle border
      cell.border = {
        bottom: { style: 'thin', color: { argb: COLORS.bgLight } },
        right: { style: 'thin', color: { argb: COLORS.bgLight } },
      };

      // Number formatting based on column type
      switch (col.dataType) {
        case 'currency':
          cell.numFmt = '$#,##0.00';
          cell.font = { color: { argb: COLORS.textPrimary }, size: 10 };
          break;
        case 'percent':
          cell.numFmt = '0.00%';
          break;
        case 'number':
          cell.numFmt = '#,##0.00';
          break;
        case 'date':
          cell.numFmt = 'yyyy-mm-dd';
          break;
      }
    });

    row.height = 22;
  });

  // Add auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: coinsToUse.length + 1, column: columns.length },
  };

  // Enhanced conditional formatting for percent columns (green/red with backgrounds)
  columns.forEach((col, colIdx) => {
    const colLetter = String.fromCharCode(65 + colIdx);
    const dataRange = `${colLetter}2:${colLetter}${coinsToUse.length + 1}`;

    if (col.dataType === 'percent') {
      // Positive values - emerald green with semi-transparent background
      sheet.addConditionalFormatting({
        ref: dataRange,
        rules: [
          {
            type: 'cellIs',
            operator: 'greaterThan',
            formulae: ['0'],
            style: {
              font: { color: { argb: COLORS.positive }, bold: true },
              fill: {
                type: 'pattern',
                pattern: 'solid',
                bgColor: { argb: '0A3D2E' }, // Dark emerald background
              },
            },
            priority: 1,
          },
          {
            type: 'cellIs',
            operator: 'lessThan',
            formulae: ['0'],
            style: {
              font: { color: { argb: COLORS.negative }, bold: true },
              fill: {
                type: 'pattern',
                pattern: 'solid',
                bgColor: { argb: '3D0A0A' }, // Dark red background
              },
            },
            priority: 2,
          },
        ],
      });
    }

    // Data bars for volume and market cap columns
    if (col.dataType === 'number' && (col.header.toLowerCase().includes('volume') || col.header.toLowerCase().includes('market'))) {
      sheet.addConditionalFormatting({
        ref: dataRange,
        rules: [
          {
            type: 'dataBar',
            priority: 10,
            gradient: true,
            minLength: 0,
            maxLength: 100,
            cfvo: [
              { type: 'min' },
              { type: 'max' },
            ],
            color: { argb: COLORS.primary },
          } as ExcelJS.DataBarRuleType,
        ],
      });
    }

    // Data bars for currency columns (price)
    if (col.dataType === 'currency') {
      sheet.addConditionalFormatting({
        ref: dataRange,
        rules: [
          {
            type: 'dataBar',
            priority: 11,
            gradient: true,
            minLength: 0,
            maxLength: 100,
            cfvo: [
              { type: 'min' },
              { type: 'max' },
            ],
            color: { argb: COLORS.secondary },
          } as ExcelJS.DataBarRuleType,
        ],
      });
    }
  });

  // Icon sets for ranking columns
  const rankColIdx = columns.findIndex(col =>
    col.header.toLowerCase().includes('rank') || col.header.toLowerCase() === '#'
  );
  if (rankColIdx >= 0) {
    const colLetter = String.fromCharCode(65 + rankColIdx);
    sheet.addConditionalFormatting({
      ref: `${colLetter}2:${colLetter}${coinsToUse.length + 1}`,
      rules: [
        {
          type: 'iconSet',
          priority: 20,
          iconSet: '3Arrows',
          showValue: true,
          cfvo: [
            { type: 'percent', value: 0 },
            { type: 'percent', value: 33 },
            { type: 'percent', value: 67 },
          ],
        } as ExcelJS.IconSetRuleType,
      ],
    });
  }

  // Add footer with dark theme
  const footerRow = coinsToUse.length + 3;
  sheet.mergeCells(`A${footerRow}:${String.fromCharCode(64 + columns.length)}${footerRow}`);
  const footerCell = sheet.getCell(`A${footerRow}`);
  const isCRK = userConfig.formulaMode === 'crk';
  const dataSource = isCRK ? 'Data via BYOK' : 'Data via CRK Add-in';
  footerCell.value = `💡 Press Ctrl+Alt+F5 to refresh all data | ${dataSource}`;
  footerCell.font = { italic: true, color: { argb: COLORS.textSecondary } };
  footerCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.bgDark },
  };
}

/**
 * Build formula from template with advanced substitutions
 * Supports both CryptoSheets and CRK formula formats
 */
function buildFormula(
  formulaTpl: FormulaTemplate,
  coin: string,
  userConfig: UserTemplateConfig,
  rowIndex: number = 0
): string {
  // Start with the CryptoSheets formula pattern (source of truth)
  let formula = formulaTpl.formulaPattern
    // Coin placeholders
    .replace(/{COIN}/g, coin)
    .replace(/{COIN1}/g, userConfig.coins[0] || coin)
    .replace(/{COIN2}/g, userConfig.coins[1] || 'ETH')
    .replace(/{COIN3}/g, userConfig.coins[2] || 'BNB')
    .replace(/{COIN4}/g, userConfig.coins[3] || 'SOL')
    .replace(/{COIN5}/g, userConfig.coins[4] || 'XRP')
    // Configuration placeholders
    .replace(/{TIMEFRAME}/g, userConfig.timeframe || '24h')
    .replace(/{CURRENCY}/g, userConfig.currency || 'USD')
    .replace(/{PERIOD}/g, userConfig.customizations.period || '30d')
    // Dynamic placeholders
    .replace(/{ROW}/g, String(rowIndex + 1))
    .replace(/{PROTOCOL}/g, 'aave') // Default protocol for DeFi templates
    .replace(/{POOL}/g, 'eth-usdc') // Default pool
    .replace(/{TOKEN}/g, coin)
    .replace(/{COLLECTION}/g, 'boredapeyachtclub'); // Default NFT collection

  // Convert to CRK format if formulaMode is 'crk'
  if (userConfig.formulaMode === 'crk') {
    formula = convertToCRK(formula);
  }

  return formula;
}

/**
 * Create chart sheet with dark theme styling
 */
async function createChartSheet(
  workbook: ExcelJS.Workbook,
  template: TemplateConfig,
  userConfig: UserTemplateConfig,
  sheetDef: SheetDefinition
): Promise<void> {
  const sheet = workbook.addWorksheet(sheetDef.name, {
    properties: { tabColor: { argb: COLORS.accent } },
  });

  const charts = sheetDef.charts || [];

  // Column widths
  sheet.columns = [
    { width: 30 },
    { width: 20 },
    { width: 30 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ];

  // Apply dark background
  for (let r = 1; r <= 30; r++) {
    for (let c = 1; c <= 6; c++) {
      sheet.getCell(r, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.bgDark },
      };
    }
  }

  // Header with emerald accent
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = `📈 ${sheetDef.name} - Chart Definitions`;
  sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: COLORS.primary } };

  let row = 3;

  // Info box with dark theme
  sheet.mergeCells(`A${row}:F${row + 2}`);
  const infoCell = sheet.getCell(`A${row}`);
  infoCell.value = 'Note: ExcelJS creates chart definitions. To render charts:\n1. Open this file in Microsoft Excel Desktop\n2. The charts will render automatically using the data from your Data sheet\n3. You can customize chart styles in Excel after opening';
  infoCell.font = { size: 11, color: { argb: COLORS.textSecondary } };
  infoCell.alignment = { wrapText: true };
  infoCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.bgMedium },
  };
  infoCell.border = {
    top: { style: 'thin', color: { argb: COLORS.primary } },
    left: { style: 'thin', color: { argb: COLORS.primary } },
    bottom: { style: 'thin', color: { argb: COLORS.primary } },
    right: { style: 'thin', color: { argb: COLORS.primary } },
  };
  row += 5;

  // List chart definitions
  sheet.getCell(`A${row}`).value = 'Defined Charts:';
  sheet.getCell(`A${row}`).font = { bold: true, size: 12, color: { argb: COLORS.primary } };
  row += 1;

  charts.forEach((chart, idx) => {
    sheet.getCell(`A${row}`).value = `${idx + 1}. ${chart.title}`;
    sheet.getCell(`A${row}`).font = { bold: true, color: { argb: COLORS.textPrimary } };
    sheet.getCell(`B${row}`).value = `Type: ${chart.type}`;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textSecondary } };
    sheet.getCell(`C${row}`).value = chart.dataRange ? `Data: ${chart.dataRange}` : '';
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textSecondary } };
    row++;
  });

  // Add a sample chart placeholder
  if (charts.length > 0 && charts[0].dataRange) {
    try {
      row += 2;
      sheet.getCell(`A${row}`).value = '📊 Chart will render here when opened in Excel Desktop';
      sheet.getCell(`A${row}`).font = { italic: true, color: { argb: COLORS.textSecondary } };
    } catch {
      // Chart creation not supported, continue without
    }
  }
}

// Note: createEmbeddedChartsSheet removed - Embedded Charts content type no longer supported
// Only addin, native_charts, and formulas_only content types are available

/**
 * Create Office.js Add-in instructions sheet
 * For users who want interactive ChartJS charts inside Excel
 */
async function createAddinInstructionsSheet(
  workbook: ExcelJS.Workbook,
  template: TemplateConfig,
  userConfig: UserTemplateConfig
): Promise<void> {
  const sheet = workbook.addWorksheet('Interactive_Charts', {
    properties: { tabColor: { argb: COLORS.accent } },
    views: [{ showGridLines: false }],
  });

  // Set column widths
  sheet.columns = [
    { width: 5 },
    { width: 50 },
    { width: 50 },
    { width: 5 },
  ];

  // Apply dark background
  for (let r = 1; r <= 60; r++) {
    for (let c = 1; c <= 4; c++) {
      sheet.getCell(r, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.bgDark },
      };
    }
  }

  let row = 2;

  // Header
  sheet.mergeCells(`B${row}:C${row}`);
  const titleCell = sheet.getCell(`B${row}`);
  titleCell.value = '📊 Interactive Charts with CryptoReportKit Add-in';
  titleCell.font = { bold: true, size: 20, color: { argb: COLORS.primary } };
  titleCell.alignment = { horizontal: 'center' };
  row += 2;

  // Subtitle
  sheet.mergeCells(`B${row}:C${row}`);
  const subtitleCell = sheet.getCell(`B${row}`);
  subtitleCell.value = 'Beautiful, animated ChartJS visualizations inside Excel';
  subtitleCell.font = { size: 12, color: { argb: COLORS.textSecondary }, italic: true };
  subtitleCell.alignment = { horizontal: 'center' };
  row += 3;

  // What You Get section
  sheet.mergeCells(`B${row}:C${row}`);
  const whatHeader = sheet.getCell(`B${row}`);
  whatHeader.value = '✨ What You Get';
  whatHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  whatHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  whatHeader.border = { left: { style: 'thick', color: { argb: COLORS.positive } } };
  row += 1;

  const isCRK = userConfig.formulaMode === 'crk';
  const dataSource = isCRK ? 'CRK' : 'CRK';
  const features = [
    ['🎨', 'Beautiful animated charts matching CryptoReportKit website'],
    ['📈', 'Line, bar, doughnut, radar, and area charts'],
    ['🔄', `Auto-refresh when your ${dataSource} data updates`],
    ['🌙', 'Dark theme with emerald accents'],
    ['📱', 'Works on Microsoft 365 (Desktop + Web + Mobile)'],
    ['⚡', 'Interactive tooltips and hover effects'],
  ];

  for (const [icon, desc] of features) {
    sheet.getCell(`B${row}`).value = icon;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textPrimary } };
    sheet.getCell(`C${row}`).value = desc;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textPrimary } };
    row++;
  }
  row += 2;

  // Requirements section
  sheet.mergeCells(`B${row}:C${row}`);
  const reqHeader = sheet.getCell(`B${row}`);
  reqHeader.value = '📋 Requirements';
  reqHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  reqHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  reqHeader.border = { left: { style: 'thick', color: { argb: COLORS.warning } } };
  row += 1;

  const requirements = isCRK ? [
    ['Microsoft 365', 'Desktop (Windows/Mac), Web, or Mobile'],
    ['OR Office 2021/2019', 'Desktop only (Windows/Mac)'],
    ['CRK Add-in', 'For live crypto data formulas (BYOK)'],
    ['CryptoReportKit Add-in', 'For interactive chart visualization'],
    ['Internet connection', 'Required for both add-ins'],
  ] : [
    ['Microsoft 365', 'Desktop (Windows/Mac), Web, or Mobile'],
    ['OR Office 2021/2019', 'Desktop only (Windows/Mac)'],
    ['CRK Add-in', 'For live crypto data formulas (BYOK)'],
    ['CryptoReportKit Add-in', 'For interactive chart visualization'],
    ['Internet connection', 'Required for both add-ins'],
  ];

  for (const [req, note] of requirements) {
    sheet.getCell(`B${row}`).value = `✓ ${req}`;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.primary }, bold: true };
    sheet.getCell(`C${row}`).value = note;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textSecondary }, italic: true };
    row++;
  }
  row += 2;

  // Installation Steps
  sheet.mergeCells(`B${row}:C${row}`);
  const installHeader = sheet.getCell(`B${row}`);
  installHeader.value = '🚀 Installation Steps';
  installHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  installHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  installHeader.border = { left: { style: 'thick', color: { argb: COLORS.primary } } };
  row += 1;

  const steps = [
    ['Step 1:', 'Install CRK Add-in from cryptoreportkit.com/addin/setup'],
    ['Step 2:', 'Sign in to your CryptoReportKit account'],
    ['Step 3:', 'Connect your data provider API key (BYOK)'],
    ['Step 4:', 'Go to Home tab → Click "CRK" button'],
    ['Step 5:', 'The chart panel will open on the right side'],
    ['Step 6:', 'Click "Refresh Data" to load your data'],
    ['Step 7:', 'Select chart type (Line, Bar, Doughnut, etc.)'],
    ['Step 8:', 'Enjoy your interactive charts!'],
  ];

  for (const [step, instruction] of steps) {
    sheet.getCell(`B${row}`).value = step;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.accent }, bold: true };
    sheet.getCell(`C${row}`).value = instruction;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textPrimary } };
    row++;
  }
  row += 2;

  // Links section
  sheet.mergeCells(`B${row}:C${row}`);
  const linksHeader = sheet.getCell(`B${row}`);
  linksHeader.value = '🔗 Helpful Links';
  linksHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  linksHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  linksHeader.border = { left: { style: 'thick', color: { argb: COLORS.secondary } } };
  row += 1;

  const links = [
    ['Get CRK Add-in:', 'https://cryptoreportkit.com/addin/setup'],
    ['CryptoReportKit Help:', 'https://cryptoreportkit.com/help'],
    ['Get CoinGecko API Key:', 'https://www.coingecko.com/en/api/pricing'],
    ['Support:', 'https://cryptoreportkit.com/contact'],
  ];

  for (const [label, url] of links) {
    sheet.getCell(`B${row}`).value = label;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textSecondary } };
    sheet.getCell(`C${row}`).value = { text: url, hyperlink: url };
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.link }, underline: true };
    row++;
  }
  row += 2;

  // Configuration summary
  sheet.mergeCells(`B${row}:C${row}`);
  const configHeader = sheet.getCell(`B${row}`);
  configHeader.value = '⚙️ Your Configuration';
  configHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  configHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  configHeader.border = { left: { style: 'thick', color: { argb: COLORS.primary } } };
  row += 1;

  const configItems = [
    ['Template:', template.name],
    ['Coins:', userConfig.coins.length > 0 ? userConfig.coins.slice(0, 10).join(', ') + (userConfig.coins.length > 10 ? '...' : '') : 'Top 20'],
    ['Timeframe:', userConfig.timeframe || '24h'],
    ['Currency:', userConfig.currency || 'USD'],
  ];

  for (const [label, value] of configItems) {
    sheet.getCell(`B${row}`).value = label;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textSecondary } };
    sheet.getCell(`C${row}`).value = value;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textPrimary }, bold: true };
    row++;
  }
  row += 2;

  // Footer note
  sheet.mergeCells(`B${row}:C${row}`);
  const footerCell = sheet.getCell(`B${row}`);
  footerCell.value = '💡 The Data sheet contains your CRK formulas. The add-in reads this data to create interactive charts.';
  footerCell.font = { italic: true, color: { argb: COLORS.primary } };
  footerCell.alignment = { wrapText: true };
}

/**
 * Create Native Charts sheet - Chart-ready data layout with Excel chart creation instructions
 * No add-in needed for charts - user creates charts using Excel's built-in tools
 * Data still comes from CRK formulas
 */
async function createNativeChartsSheet(
  workbook: ExcelJS.Workbook,
  template: TemplateConfig,
  userConfig: UserTemplateConfig
): Promise<void> {
  const sheet = workbook.addWorksheet('Create_Charts', {
    properties: { tabColor: { argb: COLORS.positive } },
    views: [{ showGridLines: false }],
  });

  // Set column widths
  sheet.columns = [
    { width: 5 },
    { width: 55 },
    { width: 55 },
    { width: 5 },
  ];

  // Apply dark background
  for (let r = 1; r <= 80; r++) {
    for (let c = 1; c <= 4; c++) {
      sheet.getCell(r, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.bgDark },
      };
    }
  }

  let row = 2;

  // Header
  sheet.mergeCells(`B${row}:C${row}`);
  const titleCell = sheet.getCell(`B${row}`);
  titleCell.value = '📊 Create Native Excel Charts';
  titleCell.font = { bold: true, size: 20, color: { argb: COLORS.primary } };
  titleCell.alignment = { horizontal: 'center' };
  row += 2;

  // Subtitle
  sheet.mergeCells(`B${row}:C${row}`);
  const subtitleCell = sheet.getCell(`B${row}`);
  subtitleCell.value = 'Beautiful charts using Excel\'s built-in tools - No add-in required for charts!';
  subtitleCell.font = { size: 12, color: { argb: COLORS.textSecondary }, italic: true };
  subtitleCell.alignment = { horizontal: 'center' };
  row += 3;

  // Benefits section
  sheet.mergeCells(`B${row}:C${row}`);
  const benefitsHeader = sheet.getCell(`B${row}`);
  benefitsHeader.value = '✅ Why Native Excel Charts?';
  benefitsHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  benefitsHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  benefitsHeader.border = { left: { style: 'thick', color: { argb: COLORS.positive } } };
  row += 1;

  const benefits = [
    ['✓', 'Works in ALL Excel versions (no Microsoft 365 required)'],
    ['✓', 'No add-in installation needed for charts'],
    ['✓', 'Full customization - style charts however you want'],
    ['✓', 'Charts update automatically when CRK data refreshes'],
    ['✓', 'Save and share with anyone - charts embedded in file'],
    ['✓', 'Works offline after initial data load'],
  ];

  for (const [icon, desc] of benefits) {
    sheet.getCell(`B${row}`).value = icon;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.positive }, bold: true };
    sheet.getCell(`C${row}`).value = desc;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textPrimary } };
    row++;
  }
  row += 2;

  // Quick Start section
  sheet.mergeCells(`B${row}:C${row}`);
  const quickHeader = sheet.getCell(`B${row}`);
  quickHeader.value = '🚀 Quick Start: Create Your First Chart';
  quickHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  quickHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  quickHeader.border = { left: { style: 'thick', color: { argb: COLORS.primary } } };
  row += 1;

  const quickSteps = [
    ['Step 1:', 'Go to the "Data" sheet tab'],
    ['Step 2:', 'Select cells A1 to D21 (or your desired range)'],
    ['Step 3:', 'Click Insert → Chart (or press Alt+F1 for quick chart)'],
    ['Step 4:', 'Choose chart type: Column, Line, Pie, etc.'],
    ['Step 5:', 'Right-click chart → "Format Chart Area" to customize'],
    ['Step 6:', 'Done! Chart updates when you refresh CRK data'],
  ];

  for (const [step, instruction] of quickSteps) {
    sheet.getCell(`B${row}`).value = step;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.accent }, bold: true };
    sheet.getCell(`C${row}`).value = instruction;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textPrimary } };
    row++;
  }
  row += 2;

  // Recommended Charts section
  sheet.mergeCells(`B${row}:C${row}`);
  const recHeader = sheet.getCell(`B${row}`);
  recHeader.value = '📈 Recommended Charts for This Template';
  recHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  recHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  recHeader.border = { left: { style: 'thick', color: { argb: COLORS.secondary } } };
  row += 1;

  // Chart recommendations based on template type
  const chartRecommendations = getChartRecommendations(userConfig.templateType);
  for (const rec of chartRecommendations) {
    sheet.getCell(`B${row}`).value = rec.chartType;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.primary }, bold: true };
    sheet.getCell(`C${row}`).value = rec.description;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textSecondary } };
    row++;
  }
  row += 2;

  // Data Ranges section
  sheet.mergeCells(`B${row}:C${row}`);
  const rangesHeader = sheet.getCell(`B${row}`);
  rangesHeader.value = '📋 Pre-formatted Data Ranges';
  rangesHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  rangesHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  rangesHeader.border = { left: { style: 'thick', color: { argb: COLORS.warning } } };
  row += 1;

  const coinsCount = userConfig.coins.length > 0 ? userConfig.coins.length : 20;
  const dataRanges = [
    ['Price Chart:', `Data!A1:B${coinsCount + 1}`, 'Coin names + Current prices'],
    ['Market Cap:', `Data!A1:C${coinsCount + 1}`, 'Coin names + Prices + Market Cap'],
    ['24h Change:', `Data!A1:D${coinsCount + 1}`, 'Full data with % changes'],
    ['Top 5 Comparison:', `Data!A1:D6`, 'Best for pie/doughnut charts'],
  ];

  sheet.getCell(`B${row}`).value = 'Chart Type';
  sheet.getCell(`B${row}`).font = { bold: true, color: { argb: COLORS.textSecondary } };
  sheet.getCell(`C${row}`).value = 'Select This Range';
  sheet.getCell(`C${row}`).font = { bold: true, color: { argb: COLORS.textSecondary } };
  row++;

  for (const [chartType, range, note] of dataRanges) {
    sheet.getCell(`B${row}`).value = chartType;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textPrimary } };
    sheet.getCell(`C${row}`).value = `${range} (${note})`;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.primary }, name: 'Consolas' };
    row++;
  }
  row += 2;

  // Dark Theme Styling section
  sheet.mergeCells(`B${row}:C${row}`);
  const styleHeader = sheet.getCell(`B${row}`);
  styleHeader.value = '🎨 Match CryptoReportKit Dark Theme (Optional)';
  styleHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  styleHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  styleHeader.border = { left: { style: 'thick', color: { argb: COLORS.accent } } };
  row += 1;

  const styleSteps = [
    ['Background:', 'Right-click chart → Format Chart Area → Fill: #111827'],
    ['Plot Area:', 'Click plot area → Fill: #1F2937'],
    ['Title:', 'Chart title → Font color: #10B981 (emerald)'],
    ['Axis Labels:', 'Click axis → Font color: #9CA3AF (gray)'],
    ['Series Color:', 'Click data series → Fill: #10B981 (primary)'],
    ['Gridlines:', 'Click gridlines → Line color: #374151'],
  ];

  for (const [element, instruction] of styleSteps) {
    sheet.getCell(`B${row}`).value = element;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textSecondary } };
    sheet.getCell(`C${row}`).value = instruction;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textPrimary } };
    row++;
  }
  row += 2;

  // Keyboard Shortcuts section
  sheet.mergeCells(`B${row}:C${row}`);
  const shortcutsHeader = sheet.getCell(`B${row}`);
  shortcutsHeader.value = '⌨️ Helpful Keyboard Shortcuts';
  shortcutsHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  shortcutsHeader.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
  shortcutsHeader.border = { left: { style: 'thick', color: { argb: COLORS.primary } } };
  row += 1;

  const shortcuts = [
    ['Alt + F1', 'Quick chart from selected data'],
    ['F11', 'Create chart on new sheet'],
    ['Ctrl + Alt + F5', 'Refresh all CRK data'],
    ['Ctrl + 1', 'Format selected element'],
    ['Delete', 'Remove selected chart element'],
  ];

  for (const [shortcut, action] of shortcuts) {
    sheet.getCell(`B${row}`).value = shortcut;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.primary }, bold: true, name: 'Consolas' };
    sheet.getCell(`C${row}`).value = action;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textPrimary } };
    row++;
  }
  row += 2;

  // Footer note
  sheet.mergeCells(`B${row}:C${row}`);
  const footerCell = sheet.getCell(`B${row}`);
  footerCell.value = '💡 Tip: Charts created this way are embedded in the Excel file and will work for anyone you share it with - no add-ins needed to view!';
  footerCell.font = { italic: true, color: { argb: COLORS.primary } };
  footerCell.alignment = { wrapText: true };
}

/**
 * Get chart recommendations based on template type
 */
function getChartRecommendations(templateType: TemplateType): Array<{ chartType: string; description: string }> {
  const recommendations: Record<string, Array<{ chartType: string; description: string }>> = {
    screener: [
      { chartType: '📊 Column Chart', description: 'Compare prices across coins' },
      { chartType: '🥧 Pie Chart', description: 'Market cap distribution (top 5-10 coins)' },
      { chartType: '📈 Bar Chart', description: '24h % change comparison' },
    ],
    market_overview: [
      { chartType: '🍩 Doughnut Chart', description: 'Market dominance breakdown' },
      { chartType: '📊 Stacked Column', description: 'Volume by coin' },
      { chartType: '📈 Line Chart', description: 'Price trends over time' },
    ],
    compare: [
      { chartType: '📊 Clustered Column', description: 'Side-by-side price comparison' },
      { chartType: '🕸️ Radar Chart', description: 'Multi-metric comparison' },
      { chartType: '📈 Line Chart', description: 'Historical performance' },
    ],
    portfolio_tracker: [
      { chartType: '🥧 Pie Chart', description: 'Portfolio allocation' },
      { chartType: '📊 Column Chart', description: 'Holdings by value' },
      { chartType: '📈 Line Chart', description: 'Portfolio value over time' },
    ],
    correlation_matrix: [
      { chartType: '🗺️ Surface Chart', description: 'Correlation heatmap' },
      { chartType: '⚪ Scatter Chart', description: 'Price correlation pairs' },
    ],
    technical_indicators: [
      { chartType: '📈 Line Chart', description: 'RSI, MACD trends' },
      { chartType: '📊 Combo Chart', description: 'Price + indicators overlay' },
    ],
    default: [
      { chartType: '📊 Column Chart', description: 'General comparison' },
      { chartType: '📈 Line Chart', description: 'Trends over time' },
      { chartType: '🥧 Pie Chart', description: 'Distribution breakdown' },
    ],
  };

  return recommendations[templateType] || recommendations.default;
}

/**
 * Create a dedicated Dashboard sheet with visual data bars and summary tables
 * These visual elements work in all Excel versions without add-ins
 */
async function createEmbeddedChartsSheet(
  workbook: ExcelJS.Workbook,
  template: TemplateConfig,
  userConfig: UserTemplateConfig
): Promise<void> {
  const sheet = workbook.addWorksheet('Dashboard', {
    properties: { tabColor: { argb: COLORS.primary } },
    views: [{ showGridLines: false }],
  });

  // Set column widths
  sheet.getColumn(1).width = 3; // Margin
  sheet.getColumn(2).width = 12; // Coin
  sheet.getColumn(3).width = 14; // Price
  sheet.getColumn(4).width = 35; // Price Bar
  sheet.getColumn(5).width = 3; // Spacer
  sheet.getColumn(6).width = 12; // Coin
  sheet.getColumn(7).width = 10; // Change %
  sheet.getColumn(8).width = 25; // Change Bar
  sheet.getColumn(9).width = 3; // Spacer
  sheet.getColumn(10).width = 12; // Coin
  sheet.getColumn(11).width = 16; // Market Cap
  sheet.getColumn(12).width = 30; // Market Cap Bar

  // Apply dark background
  for (let r = 1; r <= 45; r++) {
    for (let c = 1; c <= 12; c++) {
      sheet.getCell(r, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.bgDark },
      };
    }
  }

  const coinsToUse = userConfig.coins.length > 0 ? userConfig.coins : ['BTC', 'ETH', 'SOL', 'BNB', 'XRP'];
  const coinsCount = Math.min(coinsToUse.length, 10); // Limit to 10 for dashboard

  let row = 1;

  // ===== TITLE =====
  sheet.mergeCells(`B${row}:L${row}`);
  const titleCell = sheet.getCell(`B${row}`);
  titleCell.value = '📊 Crypto Dashboard';
  titleCell.font = { bold: true, size: 22, color: { argb: COLORS.primary } };
  titleCell.alignment = { horizontal: 'center' };
  row += 1;

  // Subtitle
  sheet.mergeCells(`B${row}:L${row}`);
  const subtitleCell = sheet.getCell(`B${row}`);
  subtitleCell.value = `Live data for ${coinsCount} cryptocurrencies • Refresh with Ctrl+Alt+F5`;
  subtitleCell.font = { size: 11, color: { argb: COLORS.textSecondary }, italic: true };
  subtitleCell.alignment = { horizontal: 'center' };
  row += 2;

  // ===== SECTION 1: PRICE COMPARISON =====
  sheet.getCell(`B${row}`).value = '💰 Price Comparison';
  sheet.getCell(`B${row}`).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
  sheet.mergeCells(`B${row}:D${row}`);

  // Section 2 header
  sheet.getCell(`F${row}`).value = '📈 24h Change';
  sheet.getCell(`F${row}`).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
  sheet.mergeCells(`F${row}:H${row}`);

  // Section 3 header
  sheet.getCell(`J${row}`).value = '🏦 Market Cap';
  sheet.getCell(`J${row}`).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
  sheet.mergeCells(`J${row}:L${row}`);
  row += 1;

  // Column headers for each section
  const headerStyle = { bold: true, size: 10, color: { argb: COLORS.textSecondary } };
  const headerFill: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };

  // Price section headers
  sheet.getCell(`B${row}`).value = 'Coin';
  sheet.getCell(`B${row}`).font = headerStyle;
  sheet.getCell(`B${row}`).fill = headerFill;
  sheet.getCell(`C${row}`).value = 'Price (USD)';
  sheet.getCell(`C${row}`).font = headerStyle;
  sheet.getCell(`C${row}`).fill = headerFill;
  sheet.getCell(`D${row}`).value = 'Visual';
  sheet.getCell(`D${row}`).font = headerStyle;
  sheet.getCell(`D${row}`).fill = headerFill;

  // Change section headers
  sheet.getCell(`F${row}`).value = 'Coin';
  sheet.getCell(`F${row}`).font = headerStyle;
  sheet.getCell(`F${row}`).fill = headerFill;
  sheet.getCell(`G${row}`).value = '24h %';
  sheet.getCell(`G${row}`).font = headerStyle;
  sheet.getCell(`G${row}`).fill = headerFill;
  sheet.getCell(`H${row}`).value = 'Visual';
  sheet.getCell(`H${row}`).font = headerStyle;
  sheet.getCell(`H${row}`).fill = headerFill;

  // Market cap section headers
  sheet.getCell(`J${row}`).value = 'Coin';
  sheet.getCell(`J${row}`).font = headerStyle;
  sheet.getCell(`J${row}`).fill = headerFill;
  sheet.getCell(`K${row}`).value = 'Market Cap';
  sheet.getCell(`K${row}`).font = headerStyle;
  sheet.getCell(`K${row}`).fill = headerFill;
  sheet.getCell(`L${row}`).value = 'Visual';
  sheet.getCell(`L${row}`).font = headerStyle;
  sheet.getCell(`L${row}`).fill = headerFill;
  row += 1;

  const dataStartRow = row;

  // Add data rows with formulas referencing the Data sheet
  for (let i = 0; i < coinsCount; i++) {
    const dataRow = i + 2; // Data sheet starts at row 2
    const currentRow = row + i;
    const rowFill = i % 2 === 0 ? COLORS.rowBg : COLORS.altRowBg;

    // Price section
    sheet.getCell(`B${currentRow}`).value = { formula: `Data!A${dataRow}` };
    sheet.getCell(`B${currentRow}`).font = { bold: true, color: { argb: COLORS.textPrimary } };
    sheet.getCell(`B${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };

    sheet.getCell(`C${currentRow}`).value = { formula: `Data!B${dataRow}` };
    sheet.getCell(`C${currentRow}`).numFmt = '$#,##0.00';
    sheet.getCell(`C${currentRow}`).font = { color: { argb: COLORS.textPrimary } };
    sheet.getCell(`C${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };

    // Visual bar for price (using REPT function for visual bar)
    sheet.getCell(`D${currentRow}`).value = { formula: `REPT("█", MIN(30, IFERROR(C${currentRow}/MAX($C$${dataStartRow}:$C$${dataStartRow + coinsCount - 1})*30, 0)))` };
    sheet.getCell(`D${currentRow}`).font = { color: { argb: COLORS.primary }, size: 10 };
    sheet.getCell(`D${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };

    // Change section
    sheet.getCell(`F${currentRow}`).value = { formula: `Data!A${dataRow}` };
    sheet.getCell(`F${currentRow}`).font = { bold: true, color: { argb: COLORS.textPrimary } };
    sheet.getCell(`F${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };

    sheet.getCell(`G${currentRow}`).value = { formula: `Data!C${dataRow}` };
    sheet.getCell(`G${currentRow}`).numFmt = '0.00%';
    sheet.getCell(`G${currentRow}`).font = { color: { argb: COLORS.textPrimary } };
    sheet.getCell(`G${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };

    // Visual bar for change (green/red based on sign)
    sheet.getCell(`H${currentRow}`).value = { formula: `IF(G${currentRow}>=0, REPT("▓", MIN(20, ABS(G${currentRow})*100)), REPT("▒", MIN(20, ABS(G${currentRow})*100)))` };
    sheet.getCell(`H${currentRow}`).font = { size: 10 };
    sheet.getCell(`H${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };

    // Market cap section
    sheet.getCell(`J${currentRow}`).value = { formula: `Data!A${dataRow}` };
    sheet.getCell(`J${currentRow}`).font = { bold: true, color: { argb: COLORS.textPrimary } };
    sheet.getCell(`J${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };

    sheet.getCell(`K${currentRow}`).value = { formula: `Data!D${dataRow}` };
    sheet.getCell(`K${currentRow}`).numFmt = '$#,##0,,"M"';
    sheet.getCell(`K${currentRow}`).font = { color: { argb: COLORS.textPrimary } };
    sheet.getCell(`K${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };

    // Visual bar for market cap
    sheet.getCell(`L${currentRow}`).value = { formula: `REPT("█", MIN(25, IFERROR(K${currentRow}/MAX($K$${dataStartRow}:$K$${dataStartRow + coinsCount - 1})*25, 0)))` };
    sheet.getCell(`L${currentRow}`).font = { color: { argb: COLORS.secondary }, size: 10 };
    sheet.getCell(`L${currentRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
  }

  row = dataStartRow + coinsCount + 2;

  // ===== SUMMARY STATS =====
  sheet.mergeCells(`B${row}:D${row}`);
  sheet.getCell(`B${row}`).value = '📊 Quick Stats';
  sheet.getCell(`B${row}`).font = { bold: true, size: 14, color: { argb: COLORS.primary } };
  row += 1;

  // Stats in a clean layout
  const statsData = [
    ['Total Market Cap', `=SUM(Data!D2:D${coinsCount + 1})`, '$#,##0,,"B"'],
    ['Avg 24h Change', `=AVERAGE(Data!C2:C${coinsCount + 1})`, '0.00%'],
    ['Highest Price', `=MAX(Data!B2:B${coinsCount + 1})`, '$#,##0.00'],
    ['Lowest Price', `=MIN(Data!B2:B${coinsCount + 1})`, '$#,##0.00'],
  ];

  for (const [label, formula, numFmt] of statsData) {
    sheet.getCell(`B${row}`).value = label;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textSecondary } };
    sheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };

    sheet.getCell(`C${row}`).value = { formula: formula as string };
    sheet.getCell(`C${row}`).numFmt = numFmt;
    sheet.getCell(`C${row}`).font = { bold: true, color: { argb: COLORS.textPrimary } };
    sheet.getCell(`C${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bgMedium } };
    row++;
  }

  row += 2;

  // ===== INSTRUCTIONS FOR CREATING CHARTS =====
  sheet.mergeCells(`B${row}:L${row}`);
  sheet.getCell(`B${row}`).value = '📈 Create Native Excel Charts';
  sheet.getCell(`B${row}`).font = { bold: true, size: 14, color: { argb: COLORS.accent } };
  row += 1;

  const chartInstructions = [
    '1. Go to the "Data" sheet and select the data range you want to chart',
    '2. Click Insert → Chart (or press Alt+F1 for a quick chart)',
    '3. Choose your chart type: Pie, Bar, Column, or Line',
    '4. Charts will automatically update when you refresh the data (Ctrl+Alt+F5)',
  ];

  for (const instruction of chartInstructions) {
    sheet.getCell(`B${row}`).value = instruction;
    sheet.getCell(`B${row}`).font = { size: 10, color: { argb: COLORS.textSecondary } };
    row++;
  }

  row += 2;

  // Footer
  sheet.mergeCells(`B${row}:L${row}`);
  sheet.getCell(`B${row}`).value = `Generated by CryptoReportKit • ${new Date().toLocaleDateString()} • Refresh: Ctrl+Alt+F5`;
  sheet.getCell(`B${row}`).font = { size: 10, color: { argb: COLORS.textMuted }, italic: true };
  sheet.getCell(`B${row}`).alignment = { horizontal: 'center' };

  // Add conditional formatting for the 24h change column to color green/red
  sheet.addConditionalFormatting({
    ref: `G${dataStartRow}:G${dataStartRow + coinsCount - 1}`,
    rules: [
      {
        type: 'cellIs',
        operator: 'greaterThan',
        priority: 1,
        formulae: ['0'],
        style: { font: { color: { argb: COLORS.positive } } },
      },
      {
        type: 'cellIs',
        operator: 'lessThan',
        priority: 2,
        formulae: ['0'],
        style: { font: { color: { argb: COLORS.negative } } },
      },
    ],
  });

  // Add conditional formatting for the change visual bar column
  sheet.addConditionalFormatting({
    ref: `H${dataStartRow}:H${dataStartRow + coinsCount - 1}`,
    rules: [
      {
        type: 'expression',
        priority: 3,
        formulae: [`$G${dataStartRow}>=0`],
        style: { font: { color: { argb: COLORS.positive } } },
      },
      {
        type: 'expression',
        priority: 4,
        formulae: [`$G${dataStartRow}<0`],
        style: { font: { color: { argb: COLORS.negative } } },
      },
    ],
  });
}

/**
 * Create instructions sheet with dark theme styling
 */
async function createInstructionsSheet(
  workbook: ExcelJS.Workbook,
  template: TemplateConfig,
  userConfig: UserTemplateConfig
): Promise<void> {
  const sheet = workbook.addWorksheet('Instructions', {
    properties: { tabColor: { argb: COLORS.textSecondary } },
  });

  sheet.columns = [
    { width: 8 },
    { width: 70 },
    { width: 50 },
  ];

  // Apply dark background
  for (let r = 1; r <= 60; r++) {
    for (let c = 1; c <= 3; c++) {
      sheet.getCell(r, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.bgDark },
      };
    }
  }

  // Title with emerald accent
  sheet.mergeCells('A1:C1');
  sheet.getCell('A1').value = '📚 Instructions & Formula Reference';
  sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: COLORS.primary } };

  let row = 3;

  // Getting Started Section - Dark themed section header
  sheet.mergeCells(`A${row}:C${row}`);
  const startHeader = sheet.getCell(`A${row}`);
  startHeader.value = '🚀 Getting Started';
  startHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  startHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.bgMedium },
  };
  startHeader.border = {
    left: { style: 'thick', color: { argb: COLORS.primary } },
  };
  row += 1;

  const gettingStarted = [
    ['1', 'Open this file in Microsoft Excel Desktop (Windows or Mac)', 'Excel Online is NOT supported'],
    ['2', 'If you see "Protected View" → Click "Enable Editing"', ''],
    ['3', 'If you see #NAME? errors → CRK Add-in is not installed', ''],
    ['4', 'Install CRK Add-in: cryptoreportkit.com/addin/setup', 'BYOK - use your own API key'],
    ['5', 'Sign in to your CryptoReportKit account', ''],
    ['6', 'Press Ctrl+Alt+F5 to refresh all data', 'Mac: Cmd+Alt+F5'],
    ['7', 'Data will populate automatically', ''],
  ];

  gettingStarted.forEach(([step, instruction, note]) => {
    sheet.getCell(`A${row}`).value = step;
    sheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    sheet.getCell(`A${row}`).font = { color: { argb: COLORS.primary }, bold: true };
    sheet.getCell(`B${row}`).value = instruction;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textPrimary } };
    sheet.getCell(`C${row}`).value = note;
    sheet.getCell(`C${row}`).font = { italic: true, color: { argb: COLORS.textSecondary } };
    row++;
  });
  row += 2;

  // Common Formulas Section
  const isCRK = userConfig.formulaMode === 'crk';
  sheet.mergeCells(`A${row}:C${row}`);
  const formulaHeader = sheet.getCell(`A${row}`);
  formulaHeader.value = isCRK ? '📝 Common CRK Formulas' : '📝 Common CRK Formulas';
  formulaHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  formulaHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.bgMedium },
  };
  formulaHeader.border = {
    left: { style: 'thick', color: { argb: COLORS.positive } },
  };
  row += 1;

  const formulas = isCRK ? [
    ['=CRK.PRICE("bitcoin")', 'Get current Bitcoin price in USD'],
    ['=CRK.MARKETCAP("ethereum")', 'Get Ethereum market cap'],
    ['=CRK.INFO("solana","volume_24h")', 'Get Solana 24h trading volume'],
    ['=CRK.CHANGE24H("avalanche-2")', 'Get AVAX 24h price change %'],
    ['=CRK.INFO("ripple","price_change_7d")', 'Get XRP 7-day price change %'],
    ['=CRK.INFO("dogecoin","ath")', 'Get Dogecoin all-time high'],
    ['=CRK.INFO("cardano","ath_change_percentage")', 'Get Cardano % from ATH'],
    ['=CRK.INFO("matic-network","circulating_supply")', 'Get Polygon circulating supply'],
    ['=CRK.INFO("chainlink","total_supply")', 'Get Chainlink total supply'],
    ['=CRK.INFO("avalanche-2","market_cap_rank")', 'Get Avalanche market cap rank'],
    ['=CRK.RSI("bitcoin",14)', 'Get Bitcoin RSI (14 period)'],
    ['=CRK.FEARGREED()', 'Get Fear & Greed Index'],
    ['=CRK.GLOBAL("btc_dominance")', 'Get BTC market dominance %'],
    ['=CRK.GLOBAL("total_market_cap")', 'Get total crypto market cap'],
  ] : [
    ['=CRYPTOSHEETS("price", "BTC", "USD")', 'Get current Bitcoin price in USD'],
    ['=CRYPTOSHEETS("market_cap", "ETH")', 'Get Ethereum market cap'],
    ['=CRYPTOSHEETS("volume_24h", "SOL")', 'Get Solana 24h trading volume'],
    ['=CRYPTOSHEETS("price_change_24h", "BNB")', 'Get BNB 24h price change %'],
    ['=CRYPTOSHEETS("price_change_7d", "XRP")', 'Get XRP 7-day price change %'],
    ['=CRYPTOSHEETS("ath", "DOGE")', 'Get Dogecoin all-time high'],
    ['=CRYPTOSHEETS("ath_change", "ADA")', 'Get Cardano % from ATH'],
    ['=CRYPTOSHEETS("circulating_supply", "MATIC")', 'Get Polygon circulating supply'],
    ['=CRYPTOSHEETS("total_supply", "LINK")', 'Get Chainlink total supply'],
    ['=CRYPTOSHEETS("rank", "AVAX")', 'Get Avalanche market cap rank'],
    ['=CRYPTOSHEETS("rsi", "BTC", 14)', 'Get Bitcoin RSI (14 period)'],
    ['=CRYPTOSHEETS("fear_greed")', 'Get Fear & Greed Index'],
    ['=CRYPTOSHEETS("btc_dominance")', 'Get BTC market dominance %'],
    ['=CRYPTOSHEETS("total_market_cap")', 'Get total crypto market cap'],
  ];

  // Formula table header
  sheet.getCell(`A${row}`).value = 'Formula';
  sheet.getCell(`B${row}`).value = 'Description';
  sheet.getCell(`A${row}`).font = { bold: true, color: { argb: COLORS.primary } };
  sheet.getCell(`B${row}`).font = { bold: true, color: { argb: COLORS.primary } };
  row++;

  formulas.forEach(([formula, desc], idx) => {
    const rowFill = idx % 2 === 0 ? COLORS.rowBg : COLORS.altRowBg;
    sheet.getCell(`A${row}`).value = formula;
    sheet.getCell(`A${row}`).font = { name: 'Consolas', size: 10, color: { argb: COLORS.primaryLight } };
    sheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
    sheet.getCell(`B${row}`).value = desc;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textSecondary } };
    sheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
    row++;
  });
  row += 2;

  // Template-specific instructions
  if (template.setupInstructions && template.setupInstructions.length > 0) {
    sheet.mergeCells(`A${row}:C${row}`);
    const tipsHeader = sheet.getCell(`A${row}`);
    tipsHeader.value = `💡 ${template.name} Specific Tips`;
    tipsHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
    tipsHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.bgMedium },
    };
    tipsHeader.border = {
      left: { style: 'thick', color: { argb: COLORS.accent } },
    };
    row += 1;

    template.setupInstructions.forEach((instruction, idx) => {
      sheet.getCell(`A${row}`).value = `${idx + 1}`;
      sheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      sheet.getCell(`A${row}`).font = { color: { argb: COLORS.accent }, bold: true };
      sheet.getCell(`B${row}`).value = instruction;
      sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textPrimary } };
      row++;
    });
    row += 2;
  }

  // Troubleshooting Section
  sheet.mergeCells(`A${row}:C${row}`);
  const troubleHeader = sheet.getCell(`A${row}`);
  troubleHeader.value = '🔧 Troubleshooting';
  troubleHeader.font = { bold: true, size: 14, color: { argb: COLORS.textPrimary } };
  troubleHeader.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.bgMedium },
  };
  troubleHeader.border = {
    left: { style: 'thick', color: { argb: COLORS.danger } },
  };
  row += 1;

  const troubleshooting = [
    ['#NAME? error', 'CRK Add-in not installed or not signed in'],
    ['#VALUE! error', 'Invalid coin symbol or parameter'],
    ['Data not updating', 'Press Ctrl+Alt+F5 to refresh, check internet connection'],
    ['Slow performance', 'Reduce number of formulas or increase refresh interval'],
    ['Rate limit errors', 'Check your API provider limits or reduce requests'],
  ];

  // Troubleshooting table header
  sheet.getCell(`A${row}`).value = 'Issue';
  sheet.getCell(`B${row}`).value = 'Solution';
  sheet.getCell(`A${row}`).font = { bold: true, color: { argb: COLORS.danger } };
  sheet.getCell(`B${row}`).font = { bold: true, color: { argb: COLORS.primary } };
  row++;

  troubleshooting.forEach(([issue, solution], idx) => {
    const rowFill = idx % 2 === 0 ? COLORS.rowBg : COLORS.altRowBg;
    sheet.getCell(`A${row}`).value = issue;
    sheet.getCell(`A${row}`).font = { color: { argb: COLORS.danger } };
    sheet.getCell(`A${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
    sheet.getCell(`B${row}`).value = solution;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textPrimary } };
    sheet.getCell(`B${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: rowFill } };
    row++;
  });
  row += 2;

  // Footer
  sheet.mergeCells(`A${row}:C${row}`);
  sheet.getCell(`A${row}`).value = 'Template by CryptoReportKit | Data via BYOK | © 2026';
  sheet.getCell(`A${row}`).font = { italic: true, color: { argb: COLORS.textSecondary } };
  sheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
}

/**
 * Create a reference sheet with all supported coins - dark theme
 */
async function createCoinsReferenceSheet(workbook: ExcelJS.Workbook): Promise<void> {
  const sheet = workbook.addWorksheet('Supported_Coins', {
    properties: { tabColor: { argb: COLORS.textMuted } },
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  sheet.columns = [
    { header: 'Symbol', key: 'symbol', width: 12 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Rank', key: 'rank', width: 8 },
  ];

  // Style header with dark theme and emerald accent
  const headerRow = sheet.getRow(1);
  headerRow.height = 25;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.headerText }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerBg },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: COLORS.primary } },
    };
  });

  // Add all coins with dark theme styling
  const allCoins = getAllCryptoSheetCoins();
  allCoins.forEach((coin, idx) => {
    const row = sheet.addRow({
      symbol: coin.symbol,
      name: coin.name,
      category: CATEGORY_NAMES[coin.category] || coin.category,
      rank: coin.rank || '',
    });

    const rowFill = idx % 2 === 0 ? COLORS.rowBg : COLORS.altRowBg;
    row.eachCell((cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowFill },
      };
      cell.font = { color: { argb: COLORS.textPrimary }, size: 10 };
      cell.border = {
        bottom: { style: 'thin', color: { argb: COLORS.bgLight } },
      };
    });

    // Highlight symbol column with emerald
    row.getCell(1).font = { bold: true, color: { argb: COLORS.primary }, size: 10 };
  });

  // Add filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: allCoins.length + 1, column: 4 },
  };

  // Add note at bottom with dark theme
  const noteRow = allCoins.length + 3;
  sheet.mergeCells(`A${noteRow}:D${noteRow}`);
  const noteCell = sheet.getCell(`A${noteRow}`);
  noteCell.value = '💡 CRK supports 5000+ coins via CoinGecko. This list shows the most popular. Any coin supported by major exchanges can be used.';
  noteCell.font = { italic: true, color: { argb: COLORS.textSecondary } };
  noteCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.bgDark },
  };
}

/**
 * Add VBA project for .xlsm files (auto-refresh on open) - dark theme
 */
function addVBAProject(workbook: ExcelJS.Workbook, template: TemplateConfig): void {
  // Note: ExcelJS doesn't natively support VBA embedding
  // For production, you would:
  // 1. Start with a pre-built .xlsm template that has VBA
  // 2. Use a library like `xlsx-populate` that supports VBA
  // 3. Or provide separate VBA code for users to add manually

  // Add a sheet with VBA code for users to add manually
  const vbaSheet = workbook.addWorksheet('VBA_Code', {
    properties: { tabColor: { argb: COLORS.danger } },
  });

  vbaSheet.columns = [{ width: 100 }];

  // Apply dark background
  for (let r = 1; r <= 50; r++) {
    vbaSheet.getCell(r, 1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.bgDark },
    };
  }

  // Header with emerald accent
  vbaSheet.getCell('A1').value = '📜 VBA Code for Auto-Refresh (Add Manually)';
  vbaSheet.getCell('A1').font = { bold: true, size: 14, color: { argb: COLORS.primary } };

  const vbaCode = `
' ============================================
' CryptoReportKit Template - Auto Refresh VBA
' ============================================
' To add this code:
' 1. Press Alt+F11 to open VBA Editor
' 2. In Project Explorer, find "ThisWorkbook"
' 3. Double-click ThisWorkbook
' 4. Paste this code
' 5. Save as .xlsm (macro-enabled)
' ============================================

Private Sub Workbook_Open()
    ' Show loading message
    Application.StatusBar = "CryptoReportKit: Refreshing crypto data..."

    ' Refresh all data connections and formulas
    On Error Resume Next
    Application.CalculateFullRebuild
    ThisWorkbook.RefreshAll
    On Error GoTo 0

    ' Clear status bar
    Application.StatusBar = False

    ' Optional: Show confirmation
    ' MsgBox "Data refreshed successfully!", vbInformation, "CryptoReportKit"
End Sub

' Manual refresh button
Sub RefreshAllData()
    Application.StatusBar = "Refreshing all data..."
    Application.CalculateFullRebuild
    ThisWorkbook.RefreshAll
    Application.StatusBar = False
    MsgBox "Data refreshed!", vbInformation, "CryptoReportKit"
End Sub

' Scheduled refresh (every 5 minutes)
Sub StartAutoRefresh()
    Application.OnTime Now + TimeValue("00:05:00"), "AutoRefreshData"
End Sub

Sub StopAutoRefresh()
    On Error Resume Next
    Application.OnTime Now + TimeValue("00:05:00"), "AutoRefreshData", , False
    On Error GoTo 0
End Sub

Sub AutoRefreshData()
    Application.CalculateFullRebuild
    ThisWorkbook.RefreshAll
    StartAutoRefresh ' Schedule next refresh
End Sub
  `.trim();

  // VBA code cell with dark theme styling
  const codeCell = vbaSheet.getCell('A3');
  codeCell.value = vbaCode;
  codeCell.font = { name: 'Consolas', size: 10, color: { argb: COLORS.primaryLight } };
  codeCell.alignment = { wrapText: true, vertical: 'top' };
  codeCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.bgMedium },
  };
  codeCell.border = {
    top: { style: 'thin', color: { argb: COLORS.primary } },
    left: { style: 'thin', color: { argb: COLORS.primary } },
    bottom: { style: 'thin', color: { argb: COLORS.primary } },
    right: { style: 'thin', color: { argb: COLORS.primary } },
  };
  vbaSheet.getRow(3).height = 400;

  console.log('[Template Generator] VBA code added as reference sheet. Users need to add manually for .xlsm');
}

/**
 * Validate user configuration with support for all coins
 */
export function validateUserConfig(config: UserTemplateConfig): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Coins validation
  if (config.coins && config.coins.length > 0) {
    // Check if coins are supported
    const unsupportedCoins = config.coins.filter(coin => !isCoinSupported(coin));
    if (unsupportedCoins.length > 0) {
      warnings.push(`Some coins may not be in our list but CRK supports 5000+ coins via CoinGecko: ${unsupportedCoins.join(', ')}`);
    }

    if (config.coins.length > 500) {
      errors.push('Maximum 500 coins allowed per template for performance');
    }
  }

  // Timeframe validation
  const validTimeframes = ['1h', '24h', '7d', '30d', '90d', '1y', 'all'];
  if (config.timeframe && !validTimeframes.includes(config.timeframe)) {
    warnings.push(`Timeframe "${config.timeframe}" may not be supported. Valid: ${validTimeframes.join(', ')}`);
  }

  // Currency validation
  const validCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'BTC', 'ETH'];
  if (config.currency && !validCurrencies.includes(config.currency.toUpperCase())) {
    warnings.push(`Currency "${config.currency}" may not be supported. Common: ${validCurrencies.join(', ')}`);
  }

  // Template type validation
  const validTypes: TemplateType[] = [
    'screener', 'compare', 'risk_dashboard', 'watchlist',
    'market_overview', 'gainers_losers', 'ohlcv_history',
    'technical_indicators', 'onchain_btc', 'eth_gas_tracker',
    'defi_tvl', 'defi_yields', 'fear_greed', 'social_sentiment',
    'funding_rates', 'open_interest', 'token_unlocks', 'staking_rewards',
    'nft_collections', 'portfolio_tracker', 'correlation_matrix',
  ];

  if (!validTypes.includes(config.templateType)) {
    errors.push(`Invalid template type: ${config.templateType}`);
  }

  // Template-specific validation
  if (config.templateType === 'compare') {
    if (config.coins.length < 2) {
      errors.push('Compare template requires at least 2 coins');
    }
    if (config.coins.length > 10) {
      warnings.push('Compare template works best with 10 or fewer coins');
    }
  }

  if (config.templateType === 'correlation_matrix') {
    if (config.coins.length < 3) {
      errors.push('Correlation matrix requires at least 3 coins');
    }
    if (config.coins.length > 20) {
      warnings.push('Correlation matrix may be hard to read with more than 20 coins');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
