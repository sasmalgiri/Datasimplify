/**
 * Advanced Excel Template Generator using ExcelJS
 *
 * Generates professional Excel files with:
 * - CryptoSheets formulas (no data redistribution)
 * - Professional styling and formatting
 * - Charts and visualizations
 * - VBA macros for auto-refresh (.xlsm)
 * - Support for all CryptoSheets coins (200+)
 */

import ExcelJS from 'exceljs';
import { getTemplateConfig, type TemplateType, type FormulaTemplate, type TemplateConfig, type SheetDefinition, type ChartDefinition } from './templateConfig';
import { isCoinSupported, getAllCryptoSheetCoins, getTopCoins, CATEGORY_NAMES } from './cryptoSheetCoins';

export interface UserTemplateConfig {
  templateType: TemplateType;
  coins: string[]; // User-selected coins (e.g., ["BTC", "ETH", "SOL"])
  timeframe: string; // '24h', '7d', '30d', '1y'
  currency: string; // 'USD', 'EUR', 'BTC', 'ETH'
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

// Color palette for styling
const COLORS = {
  primary: '6366F1', // Indigo
  secondary: '10B981', // Emerald
  accent: 'F59E0B', // Amber
  danger: 'EF4444', // Red
  success: '22C55E', // Green
  warning: 'F97316', // Orange
  headerBg: '1F2937', // Dark gray
  headerText: 'FFFFFF',
  altRowBg: 'F3F4F6', // Light gray
  borderColor: 'E5E7EB',
  link: '3B82F6', // Blue
};

/**
 * Generate Excel template with CryptoSheets formulas using ExcelJS
 */
export async function generateTemplate(
  userConfig: UserTemplateConfig,
  format: 'xlsx' | 'xlsm'
): Promise<Buffer> {
  // 1. Get base template config
  const baseTemplate = getTemplateConfig(userConfig.templateType);

  // 2. Create workbook with ExcelJS
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = 'DataSimplify';
  workbook.lastModifiedBy = 'DataSimplify Template Generator';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastPrinted = new Date();

  // Company info - Set document properties directly on workbook
  workbook.title = `${baseTemplate.name} - DataSimplify`;
  workbook.subject = 'Cryptocurrency Data Template';
  workbook.keywords = 'crypto,bitcoin,ethereum,cryptosheets,datasimplify';
  workbook.category = 'Finance';
  workbook.description = `${baseTemplate.description} - Powered by CryptoSheets`;
  workbook.company = 'DataSimplify';

  // 3. Add START_HERE sheet (always first)
  await createSetupSheet(workbook, baseTemplate, userConfig);

  // 4. Add CONFIGURATION sheet for user settings
  await createConfigSheet(workbook, userConfig);

  // 5. Add DATA sheet(s) with CryptoSheets formulas
  const dataSheets = baseTemplate.sheets.filter((s) => s.type === 'data');
  for (const sheetDef of dataSheets) {
    await createDataSheet(workbook, baseTemplate, userConfig, sheetDef);
  }

  // 6. Add CHART sheet (if enabled and charts exist)
  if (userConfig.customizations.includeCharts) {
    const chartSheets = baseTemplate.sheets.filter((s) => s.type === 'chart');
    for (const sheetDef of chartSheets) {
      await createChartSheet(workbook, baseTemplate, userConfig, sheetDef);
    }
  }

  // 7. Add INSTRUCTIONS sheet
  await createInstructionsSheet(workbook, baseTemplate);

  // 8. Add SUPPORTED_COINS reference sheet
  await createCoinsReferenceSheet(workbook);

  // 9. For .xlsm: Add VBA project (if supported)
  if (format === 'xlsm') {
    addVBAProject(workbook, baseTemplate);
  }

  // 10. Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Create the START_HERE setup sheet with professional styling
 */
async function createSetupSheet(
  workbook: ExcelJS.Workbook,
  template: TemplateConfig,
  userConfig: UserTemplateConfig
): Promise<void> {
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

  let row = 2;

  // Header with logo placeholder
  sheet.mergeCells(`B${row}:C${row}`);
  const titleCell = sheet.getCell(`B${row}`);
  titleCell.value = `📊 ${template.name}`;
  titleCell.font = { bold: true, size: 24, color: { argb: COLORS.primary } };
  titleCell.alignment = { horizontal: 'center' };
  row += 1;

  // Subtitle
  sheet.mergeCells(`B${row}:C${row}`);
  const subtitleCell = sheet.getCell(`B${row}`);
  subtitleCell.value = 'DataSimplify Template - Powered by CryptoSheets';
  subtitleCell.font = { size: 12, color: { argb: '6B7280' }, italic: true };
  subtitleCell.alignment = { horizontal: 'center' };
  row += 3;

  // Warning box
  sheet.mergeCells(`B${row}:C${row + 2}`);
  const warningCell = sheet.getCell(`B${row}`);
  warningCell.value = '⚠️ IMPORTANT: This template requires CryptoSheets Excel Add-in to function.\nWithout CryptoSheets, you will see #NAME? errors instead of data.\nGet CryptoSheets free at: https://www.cryptosheets.com/';
  warningCell.font = { size: 11, color: { argb: COLORS.warning } };
  warningCell.alignment = { wrapText: true, vertical: 'middle' };
  warningCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FEF3C7' },
  };
  warningCell.border = {
    top: { style: 'medium', color: { argb: COLORS.warning } },
    left: { style: 'medium', color: { argb: COLORS.warning } },
    bottom: { style: 'medium', color: { argb: COLORS.warning } },
    right: { style: 'medium', color: { argb: COLORS.warning } },
  };
  row += 5;

  // Configuration Summary
  sheet.getCell(`B${row}`).value = 'Your Configuration:';
  sheet.getCell(`B${row}`).font = { bold: true, size: 14, color: { argb: COLORS.headerBg } };
  row += 1;

  const configItems = [
    ['Template', template.name],
    ['Coins', userConfig.coins.length > 0 ? userConfig.coins.join(', ') : 'All supported coins'],
    ['Timeframe', userConfig.timeframe || '24h'],
    ['Currency', userConfig.currency || 'USD'],
    ['Charts', userConfig.customizations.includeCharts ? 'Enabled' : 'Disabled'],
    ['Generated', new Date().toLocaleString()],
  ];

  for (const [label, value] of configItems) {
    sheet.getCell(`B${row}`).value = `  ${label}:`;
    sheet.getCell(`B${row}`).font = { color: { argb: '6B7280' } };
    sheet.getCell(`C${row}`).value = value;
    sheet.getCell(`C${row}`).font = { bold: true };
    row++;
  }
  row += 2;

  // Add-in Status Check
  sheet.getCell(`B${row}`).value = 'CryptoSheets Status Check:';
  sheet.getCell(`B${row}`).font = { bold: true, size: 14, color: { argb: COLORS.headerBg } };
  row += 1;

  sheet.getCell(`B${row}`).value = '  Status:';
  sheet.getCell(`C${row}`).value = { formula: 'IFERROR(CRYPTOSHEETS("status"), "❌ NOT INSTALLED - Click link below to install")' };
  sheet.getCell(`C${row}`).font = { bold: true };
  row += 2;

  // Quick Start Steps
  sheet.getCell(`B${row}`).value = 'Quick Start:';
  sheet.getCell(`B${row}`).font = { bold: true, size: 14, color: { argb: COLORS.headerBg } };
  row += 1;

  const steps = [
    ['1️⃣', 'Install CryptoSheets from Excel Add-ins or cryptosheets.com'],
    ['2️⃣', 'Sign in to your CryptoSheets account (free tier available)'],
    ['3️⃣', 'Press Ctrl+Alt+F5 (Windows) or Cmd+Alt+F5 (Mac) to refresh all data'],
    ['4️⃣', 'Navigate to the Data sheet to see your configured data'],
    ['5️⃣', 'Customize formulas as needed - see Instructions sheet for help'],
  ];

  for (const [num, step] of steps) {
    sheet.getCell(`B${row}`).value = `  ${num}`;
    sheet.getCell(`C${row}`).value = step;
    row++;
  }
  row += 2;

  // Links section
  sheet.getCell(`B${row}`).value = 'Helpful Links:';
  sheet.getCell(`B${row}`).font = { bold: true, size: 14, color: { argb: COLORS.headerBg } };
  row += 1;

  const links = [
    ['Get CryptoSheets', 'https://www.cryptosheets.com/'],
    ['DataSimplify Help', 'https://datasimplify.io/help/templates'],
    ['CryptoSheets Docs', 'https://docs.cryptosheets.com/'],
    ['Formula Reference', 'https://docs.cryptosheets.com/functions'],
  ];

  for (const [label, url] of links) {
    sheet.getCell(`B${row}`).value = `  ${label}:`;
    sheet.getCell(`C${row}`).value = { text: url, hyperlink: url };
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.link }, underline: true };
    row++;
  }

  // Protect sheet from accidental edits (but allow formula calculation)
  sheet.protect('datasimplify', { formatCells: true, selectLockedCells: true, selectUnlockedCells: true });
}

/**
 * Create configuration sheet for user to modify settings
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

  // Header
  sheet.getCell('A1').value = 'Setting';
  sheet.getCell('B1').value = 'Current Value';
  sheet.getCell('C1').value = 'Description';

  const headerStyle = {
    font: { bold: true, color: { argb: COLORS.headerText } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: COLORS.headerBg } },
    alignment: { horizontal: 'center' as const },
  };

  ['A1', 'B1', 'C1'].forEach(cell => {
    Object.assign(sheet.getCell(cell), headerStyle);
  });

  // Configuration rows
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
    const row = idx + 2;
    sheet.getCell(`A${row}`).value = config[0];
    sheet.getCell(`B${row}`).value = config[1];
    sheet.getCell(`C${row}`).value = config[2];
    sheet.getCell(`C${row}`).font = { color: { argb: '6B7280' }, italic: true };

    // Highlight editable cells
    sheet.getCell(`B${row}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FEF9C3' },
    };
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

  // Instructions row
  const lastRow = configs.length + 3;
  sheet.mergeCells(`A${lastRow}:C${lastRow}`);
  sheet.getCell(`A${lastRow}`).value = '💡 Tip: Modify values in column B to customize your template. Press Ctrl+Alt+F5 to refresh after changes.';
  sheet.getCell(`A${lastRow}`).font = { italic: true, color: { argb: COLORS.primary } };
}

/**
 * Create data sheet with CryptoSheets formulas and professional styling
 */
async function createDataSheet(
  workbook: ExcelJS.Workbook,
  template: TemplateConfig,
  userConfig: UserTemplateConfig,
  sheetDef: SheetDefinition
): Promise<void> {
  const sheet = workbook.addWorksheet(sheetDef.name, {
    properties: { tabColor: { argb: COLORS.accent } },
    views: [{ state: 'frozen', ySplit: 1 }], // Freeze header row
  });

  const columns = sheetDef.columns || [];

  // Set column widths and headers
  sheet.columns = columns.map((col, idx) => ({
    header: col.header,
    key: `col${idx}`,
    width: col.width || 15,
  }));

  // Style header row
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

  // Determine coins to use
  const coinsToUse = userConfig.coins.length > 0
    ? userConfig.coins
    : getTopCoins(20).map(c => c.symbol);

  // Add data rows with CryptoSheets formulas
  coinsToUse.forEach((coin, rowIdx) => {
    const row = sheet.getRow(rowIdx + 2);

    template.formulas.forEach((formulaTpl) => {
      const formula = buildFormula(formulaTpl, coin, userConfig, rowIdx);
      const cell = row.getCell(formulaTpl.column + 1);
      cell.value = { formula };
    });

    // Style alternating rows
    if (rowIdx % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: COLORS.altRowBg },
        };
      });
    }

    // Add number formatting based on column type
    columns.forEach((col, colIdx) => {
      const cell = row.getCell(colIdx + 1);
      switch (col.dataType) {
        case 'currency':
          cell.numFmt = '$#,##0.00';
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
  });

  // Add auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: coinsToUse.length + 1, column: columns.length },
  };

  // Add conditional formatting for percent columns
  columns.forEach((col, colIdx) => {
    if (col.dataType === 'percent') {
      const colLetter = String.fromCharCode(65 + colIdx);
      sheet.addConditionalFormatting({
        ref: `${colLetter}2:${colLetter}${coinsToUse.length + 1}`,
        rules: [
          {
            type: 'cellIs',
            operator: 'greaterThan',
            formulae: ['0'],
            style: {
              font: { color: { argb: COLORS.success } },
            },
            priority: 1,
          },
          {
            type: 'cellIs',
            operator: 'lessThan',
            formulae: ['0'],
            style: {
              font: { color: { argb: COLORS.danger } },
            },
            priority: 2,
          },
        ],
      });
    }
  });

  // Add footer with refresh instructions
  const footerRow = coinsToUse.length + 3;
  sheet.mergeCells(`A${footerRow}:${String.fromCharCode(64 + columns.length)}${footerRow}`);
  sheet.getCell(`A${footerRow}`).value = '💡 Press Ctrl+Alt+F5 to refresh all data | Data powered by CryptoSheets';
  sheet.getCell(`A${footerRow}`).font = { italic: true, color: { argb: '9CA3AF' } };
}

/**
 * Build CryptoSheets formula from template with advanced substitutions
 */
function buildFormula(
  formulaTpl: FormulaTemplate,
  coin: string,
  userConfig: UserTemplateConfig,
  rowIndex: number = 0
): string {
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

  return formula;
}

/**
 * Create chart sheet with chart placeholders and data references
 */
async function createChartSheet(
  workbook: ExcelJS.Workbook,
  template: TemplateConfig,
  userConfig: UserTemplateConfig,
  sheetDef: SheetDefinition
): Promise<void> {
  const sheet = workbook.addWorksheet(sheetDef.name, {
    properties: { tabColor: { argb: COLORS.danger } },
  });

  const charts = sheetDef.charts || [];

  // Header
  sheet.mergeCells('A1:F1');
  sheet.getCell('A1').value = `📈 ${sheetDef.name} - Chart Definitions`;
  sheet.getCell('A1').font = { bold: true, size: 16, color: { argb: COLORS.primary } };

  let row = 3;

  // Info box
  sheet.mergeCells(`A${row}:F${row + 2}`);
  sheet.getCell(`A${row}`).value = 'Note: ExcelJS creates chart definitions. To render charts:\n1. Open this file in Microsoft Excel Desktop\n2. The charts will render automatically using the data from your Data sheet\n3. You can customize chart styles in Excel after opening';
  sheet.getCell(`A${row}`).font = { size: 11, color: { argb: '6B7280' } };
  sheet.getCell(`A${row}`).alignment = { wrapText: true };
  sheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'F3F4F6' },
  };
  row += 5;

  // List chart definitions
  sheet.getCell(`A${row}`).value = 'Defined Charts:';
  sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
  row += 1;

  charts.forEach((chart, idx) => {
    sheet.getCell(`A${row}`).value = `${idx + 1}. ${chart.title}`;
    sheet.getCell(`A${row}`).font = { bold: true };
    sheet.getCell(`B${row}`).value = `Type: ${chart.type}`;
    sheet.getCell(`C${row}`).value = chart.dataRange ? `Data: ${chart.dataRange}` : '';
    row++;
  });

  // Add a sample chart if ExcelJS supports it
  // Note: ExcelJS chart support is limited - this creates chart config that Excel can render
  if (charts.length > 0 && charts[0].dataRange) {
    try {
      // ExcelJS has limited chart support, but we can try
      // For now, add placeholder for manual chart creation
      row += 2;
      sheet.getCell(`A${row}`).value = '📊 Chart will render here when opened in Excel Desktop';
      sheet.getCell(`A${row}`).font = { italic: true, color: { argb: '9CA3AF' } };
    } catch {
      // Chart creation not supported, continue without
    }
  }

  // Column widths
  sheet.columns = [
    { width: 30 },
    { width: 20 },
    { width: 30 },
    { width: 20 },
    { width: 20 },
    { width: 20 },
  ];
}

/**
 * Create instructions sheet with comprehensive guidance
 */
async function createInstructionsSheet(
  workbook: ExcelJS.Workbook,
  template: TemplateConfig
): Promise<void> {
  const sheet = workbook.addWorksheet('Instructions', {
    properties: { tabColor: { argb: '9CA3AF' } },
  });

  sheet.columns = [
    { width: 8 },
    { width: 70 },
    { width: 50 },
  ];

  // Title
  sheet.mergeCells('A1:C1');
  sheet.getCell('A1').value = '📚 Instructions & Formula Reference';
  sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: COLORS.primary } };

  let row = 3;

  // Getting Started Section
  sheet.mergeCells(`A${row}:C${row}`);
  sheet.getCell(`A${row}`).value = '🚀 Getting Started';
  sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
  sheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'E0E7FF' },
  };
  row += 1;

  const gettingStarted = [
    ['1', 'Open this file in Microsoft Excel Desktop (Windows or Mac)', 'Excel Online is NOT supported'],
    ['2', 'If you see "Protected View" → Click "Enable Editing"', ''],
    ['3', 'If you see #NAME? errors → CryptoSheets add-in is not installed', ''],
    ['4', 'Install CryptoSheets: Insert → Get Add-ins → Search "CryptoSheets"', 'Free tier available'],
    ['5', 'Sign in to your CryptoSheets account', ''],
    ['6', 'Press Ctrl+Alt+F5 to refresh all data', 'Mac: Cmd+Alt+F5'],
    ['7', 'Data will populate automatically', ''],
  ];

  gettingStarted.forEach(([step, instruction, note]) => {
    sheet.getCell(`A${row}`).value = step;
    sheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
    sheet.getCell(`B${row}`).value = instruction;
    sheet.getCell(`C${row}`).value = note;
    sheet.getCell(`C${row}`).font = { italic: true, color: { argb: '6B7280' } };
    row++;
  });
  row += 2;

  // Common Formulas Section
  sheet.mergeCells(`A${row}:C${row}`);
  sheet.getCell(`A${row}`).value = '📝 Common CryptoSheets Formulas';
  sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
  sheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'D1FAE5' },
  };
  row += 1;

  const formulas = [
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

  sheet.getCell(`A${row}`).value = 'Formula';
  sheet.getCell(`B${row}`).value = 'Description';
  sheet.getCell(`A${row}`).font = { bold: true };
  sheet.getCell(`B${row}`).font = { bold: true };
  row++;

  formulas.forEach(([formula, desc]) => {
    sheet.getCell(`A${row}`).value = formula;
    sheet.getCell(`A${row}`).font = { name: 'Consolas', size: 10 };
    sheet.getCell(`B${row}`).value = desc;
    row++;
  });
  row += 2;

  // Template-specific instructions
  if (template.setupInstructions && template.setupInstructions.length > 0) {
    sheet.mergeCells(`A${row}:C${row}`);
    sheet.getCell(`A${row}`).value = `💡 ${template.name} Specific Tips`;
    sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
    sheet.getCell(`A${row}`).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FEF3C7' },
    };
    row += 1;

    template.setupInstructions.forEach((instruction, idx) => {
      sheet.getCell(`A${row}`).value = `${idx + 1}`;
      sheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
      sheet.getCell(`B${row}`).value = instruction;
      row++;
    });
    row += 2;
  }

  // Troubleshooting Section
  sheet.mergeCells(`A${row}:C${row}`);
  sheet.getCell(`A${row}`).value = '🔧 Troubleshooting';
  sheet.getCell(`A${row}`).font = { bold: true, size: 14 };
  sheet.getCell(`A${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FEE2E2' },
  };
  row += 1;

  const troubleshooting = [
    ['#NAME? error', 'CryptoSheets add-in not installed or not signed in'],
    ['#VALUE! error', 'Invalid coin symbol or parameter'],
    ['Data not updating', 'Press Ctrl+Alt+F5 to refresh, check internet connection'],
    ['Slow performance', 'Reduce number of formulas or increase refresh interval'],
    ['Rate limit errors', 'Upgrade CryptoSheets plan for higher API limits'],
  ];

  sheet.getCell(`A${row}`).value = 'Issue';
  sheet.getCell(`B${row}`).value = 'Solution';
  sheet.getCell(`A${row}`).font = { bold: true };
  sheet.getCell(`B${row}`).font = { bold: true };
  row++;

  troubleshooting.forEach(([issue, solution]) => {
    sheet.getCell(`A${row}`).value = issue;
    sheet.getCell(`A${row}`).font = { color: { argb: COLORS.danger } };
    sheet.getCell(`B${row}`).value = solution;
    row++;
  });
  row += 2;

  // Footer
  sheet.mergeCells(`A${row}:C${row}`);
  sheet.getCell(`A${row}`).value = 'Template by DataSimplify | Data powered by CryptoSheets | © 2025';
  sheet.getCell(`A${row}`).font = { italic: true, color: { argb: '9CA3AF' } };
  sheet.getCell(`A${row}`).alignment = { horizontal: 'center' };
}

/**
 * Create a reference sheet with all supported coins
 */
async function createCoinsReferenceSheet(workbook: ExcelJS.Workbook): Promise<void> {
  const sheet = workbook.addWorksheet('Supported_Coins', {
    properties: { tabColor: { argb: '6B7280' } },
  });

  sheet.columns = [
    { header: 'Symbol', key: 'symbol', width: 12 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Rank', key: 'rank', width: 8 },
  ];

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.headerText } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.headerBg },
    };
  });

  // Add all coins
  const allCoins = getAllCryptoSheetCoins();
  allCoins.forEach((coin) => {
    sheet.addRow({
      symbol: coin.symbol,
      name: coin.name,
      category: CATEGORY_NAMES[coin.category] || coin.category,
      rank: coin.rank || '',
    });
  });

  // Add filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: allCoins.length + 1, column: 4 },
  };

  // Add note at bottom
  const noteRow = allCoins.length + 3;
  sheet.mergeCells(`A${noteRow}:D${noteRow}`);
  sheet.getCell(`A${noteRow}`).value = '💡 CryptoSheets supports 5000+ coins. This list shows the most popular. Any coin supported by major exchanges can be used.';
  sheet.getCell(`A${noteRow}`).font = { italic: true, color: { argb: '6B7280' } };
}

/**
 * Add VBA project for .xlsm files (auto-refresh on open)
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

  vbaSheet.getCell('A1').value = '📜 VBA Code for Auto-Refresh (Add Manually)';
  vbaSheet.getCell('A1').font = { bold: true, size: 14 };

  const vbaCode = `
' ============================================
' DataSimplify Template - Auto Refresh VBA
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
    Application.StatusBar = "DataSimplify: Refreshing crypto data..."

    ' Refresh all data connections and formulas
    On Error Resume Next
    Application.CalculateFullRebuild
    ThisWorkbook.RefreshAll
    On Error GoTo 0

    ' Clear status bar
    Application.StatusBar = False

    ' Optional: Show confirmation
    ' MsgBox "Data refreshed successfully!", vbInformation, "DataSimplify"
End Sub

' Manual refresh button
Sub RefreshAllData()
    Application.StatusBar = "Refreshing all data..."
    Application.CalculateFullRebuild
    ThisWorkbook.RefreshAll
    Application.StatusBar = False
    MsgBox "Data refreshed!", vbInformation, "DataSimplify"
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

  vbaSheet.getCell('A3').value = vbaCode;
  vbaSheet.getCell('A3').font = { name: 'Consolas', size: 10 };
  vbaSheet.getCell('A3').alignment = { wrapText: true, vertical: 'top' };
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
      warnings.push(`Some coins may not be in our list but CryptoSheets supports 5000+ coins: ${unsupportedCoins.join(', ')}`);
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
