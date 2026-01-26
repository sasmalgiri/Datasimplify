/**
 * Pack Generator - Creates Excel "Packs" for the Report-First Approach
 *
 * Packs are pre-built Excel workbooks with:
 * 1. Hidden __CRK__ sheet containing recipe JSON
 * 2. Pre-formatted table areas that get populated via /api/v1/report/run
 * 3. Charts linked to table data
 * 4. No formulas - data is static and refreshed via the CRK add-in
 *
 * This is the "report-first" approach vs the "formula-first" approach.
 */

import ExcelJS from 'exceljs';

// Pack recipe configuration
export interface PackRecipe {
  id: string;
  name: string;
  description: string;
  version: string;
  coins: string[];
  metrics: ('price' | 'ohlcv' | 'movers' | 'market_cap' | 'volume' | 'change_24h')[];
  currency: string;
  ohlcv_days?: number;
  movers_count?: number;
  include_global?: boolean;
  refresh_interval?: number; // minutes, 0 = manual
}

// Color palette (matches website dark theme)
const COLORS = {
  primary: '10B981',
  primaryDark: '059669',
  bgDark: '111827',
  bgMedium: '1F2937',
  bgLight: '374151',
  textPrimary: 'FFFFFF',
  textSecondary: '9CA3AF',
  positive: '10B981',
  negative: 'EF4444',
  warning: 'F59E0B',
  accent: 'F59E0B',
};

/**
 * Generate a Pack Excel file with recipe embedded
 */
export async function generatePack(recipe: PackRecipe): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = 'CryptoReportKit';
  workbook.lastModifiedBy = 'CryptoReportKit Pack Generator';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.title = `${recipe.name} - CryptoReportKit Pack`;
  workbook.subject = 'Cryptocurrency Data Pack';
  workbook.keywords = 'crypto,bitcoin,ethereum,cryptoreportkit,pack';
  workbook.category = 'Finance';
  workbook.description = recipe.description;
  workbook.company = 'CryptoReportKit';

  // 1. Create hidden __CRK__ sheet with recipe
  await createCRKSheet(workbook, recipe);

  // 2. Create main data sheet
  await createDataSheet(workbook, recipe);

  // 3. Create movers sheet if applicable
  if (recipe.metrics.includes('movers') || recipe.movers_count) {
    await createMoversSheet(workbook, recipe);
  }

  // 4. Create OHLCV sheet if applicable
  if (recipe.metrics.includes('ohlcv')) {
    await createOHLCVSheet(workbook, recipe);
  }

  // 5. Create instructions sheet
  await createPackInstructionsSheet(workbook, recipe);

  // Write to buffer
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Create hidden __CRK__ sheet with recipe configuration
 */
async function createCRKSheet(
  workbook: ExcelJS.Workbook,
  recipe: PackRecipe
): Promise<void> {
  const sheet = workbook.addWorksheet('__CRK__', {
    state: 'veryHidden', // Hidden and not accessible via UI
    properties: { tabColor: { argb: COLORS.primary } },
  });

  sheet.columns = [
    { width: 20 },
    { width: 80 },
  ];

  // Store recipe as JSON in cell A1
  sheet.getCell('A1').value = 'recipe';
  sheet.getCell('B1').value = JSON.stringify(recipe, null, 2);

  // Store metadata
  sheet.getCell('A2').value = 'version';
  sheet.getCell('B2').value = recipe.version;

  sheet.getCell('A3').value = 'generated_at';
  sheet.getCell('B3').value = new Date().toISOString();

  sheet.getCell('A4').value = 'pack_type';
  sheet.getCell('B4').value = 'market_overview';

  // Store last refresh timestamp (will be updated by add-in)
  sheet.getCell('A5').value = 'last_refresh';
  sheet.getCell('B5').value = '';
}

/**
 * Create main data sheet with placeholder structure
 */
async function createDataSheet(
  workbook: ExcelJS.Workbook,
  recipe: PackRecipe
): Promise<void> {
  const sheet = workbook.addWorksheet('Market Data', {
    properties: { tabColor: { argb: COLORS.primary } },
    views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
  });

  // Column definitions
  const columns = [
    { header: '#', width: 6 },
    { header: 'Coin', width: 15 },
    { header: 'Price', width: 15 },
    { header: '24h Change', width: 14 },
    { header: 'Market Cap', width: 18 },
    { header: 'Volume (24h)', width: 18 },
  ];

  sheet.columns = columns.map((col) => ({
    header: col.header,
    width: col.width,
  }));

  // Apply dark background to visible area
  const rowCount = Math.max(recipe.coins.length + 5, 30);
  for (let r = 1; r <= rowCount; r++) {
    for (let c = 1; c <= columns.length; c++) {
      const cell = sheet.getCell(r, c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.bgDark },
      };
    }
  }

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell, colNumber) => {
    cell.font = { bold: true, color: { argb: COLORS.textPrimary }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.bgMedium },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: COLORS.primary } },
    };
  });

  // Add placeholder data rows
  recipe.coins.forEach((coin, idx) => {
    const rowNum = idx + 2;
    const row = sheet.getRow(rowNum);
    const rowFill = idx % 2 === 0 ? COLORS.bgMedium : COLORS.bgDark;

    // Rank
    row.getCell(1).value = idx + 1;
    row.getCell(1).font = { color: { argb: COLORS.textSecondary } };
    row.getCell(1).alignment = { horizontal: 'center' };

    // Coin (placeholder - will be populated by add-in)
    row.getCell(2).value = coin.toUpperCase();
    row.getCell(2).font = { bold: true, color: { argb: COLORS.primary } };

    // Price (placeholder)
    row.getCell(3).value = '—';
    row.getCell(3).font = { color: { argb: COLORS.textPrimary } };
    row.getCell(3).numFmt = '"$"#,##0.00';

    // 24h Change (placeholder)
    row.getCell(4).value = '—';
    row.getCell(4).font = { color: { argb: COLORS.textSecondary } };

    // Market Cap (placeholder)
    row.getCell(5).value = '—';
    row.getCell(5).font = { color: { argb: COLORS.textPrimary } };

    // Volume (placeholder)
    row.getCell(6).value = '—';
    row.getCell(6).font = { color: { argb: COLORS.textPrimary } };

    // Apply row fill
    for (let c = 1; c <= columns.length; c++) {
      const cell = row.getCell(c);
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowFill },
      };
      cell.border = {
        bottom: { style: 'thin', color: { argb: COLORS.bgLight } },
      };
    }

    row.height = 24;
  });

  // Add refresh notice at bottom
  const footerRow = recipe.coins.length + 4;
  sheet.mergeCells(`A${footerRow}:F${footerRow}`);
  const footerCell = sheet.getCell(`A${footerRow}`);
  footerCell.value =
    '🔄 Click "Refresh Data" in the CRK add-in to update all values';
  footerCell.font = { italic: true, color: { argb: COLORS.primary } };
  footerCell.alignment = { horizontal: 'center' };

  // Add auto-filter
  sheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: recipe.coins.length + 1, column: columns.length },
  };

  // Add conditional formatting for 24h change column
  const changeCol = 'D';
  const dataRange = `${changeCol}2:${changeCol}${recipe.coins.length + 1}`;

  sheet.addConditionalFormatting({
    ref: dataRange,
    rules: [
      {
        type: 'cellIs',
        operator: 'greaterThan',
        formulae: ['0'],
        style: {
          font: { color: { argb: COLORS.positive }, bold: true },
        },
        priority: 1,
      },
      {
        type: 'cellIs',
        operator: 'lessThan',
        formulae: ['0'],
        style: {
          font: { color: { argb: COLORS.negative }, bold: true },
        },
        priority: 2,
      },
    ],
  });
}

/**
 * Create movers sheet for top gainers/losers
 */
async function createMoversSheet(
  workbook: ExcelJS.Workbook,
  recipe: PackRecipe
): Promise<void> {
  const sheet = workbook.addWorksheet('Movers', {
    properties: { tabColor: { argb: COLORS.accent } },
    views: [{ showGridLines: false }],
  });

  const count = recipe.movers_count || 5;

  sheet.columns = [
    { width: 5 },
    { width: 20 },
    { width: 15 },
    { width: 15 },
    { width: 10 },
    { width: 20 },
    { width: 15 },
    { width: 15 },
    { width: 5 },
  ];

  // Apply dark background
  for (let r = 1; r <= 25; r++) {
    for (let c = 1; c <= 9; c++) {
      sheet.getCell(r, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.bgDark },
      };
    }
  }

  let row = 2;

  // Title
  sheet.mergeCells(`B${row}:H${row}`);
  sheet.getCell(`B${row}`).value = '📈 Top Movers (24h)';
  sheet.getCell(`B${row}`).font = {
    bold: true,
    size: 18,
    color: { argb: COLORS.primary },
  };
  row += 2;

  // Top Gainers Section
  sheet.getCell(`B${row}`).value = '🟢 Top Gainers';
  sheet.getCell(`B${row}`).font = {
    bold: true,
    size: 14,
    color: { argb: COLORS.positive },
  };

  sheet.getCell(`F${row}`).value = '🔴 Top Losers';
  sheet.getCell(`F${row}`).font = {
    bold: true,
    size: 14,
    color: { argb: COLORS.negative },
  };
  row += 1;

  // Headers
  ['B', 'C', 'D'].forEach((col, idx) => {
    const headers = ['Coin', 'Price', 'Change'];
    sheet.getCell(`${col}${row}`).value = headers[idx];
    sheet.getCell(`${col}${row}`).font = {
      bold: true,
      color: { argb: COLORS.textSecondary },
    };
  });

  ['F', 'G', 'H'].forEach((col, idx) => {
    const headers = ['Coin', 'Price', 'Change'];
    sheet.getCell(`${col}${row}`).value = headers[idx];
    sheet.getCell(`${col}${row}`).font = {
      bold: true,
      color: { argb: COLORS.textSecondary },
    };
  });
  row += 1;

  // Placeholder rows for gainers and losers
  for (let i = 0; i < count; i++) {
    // Gainers
    sheet.getCell(`B${row}`).value = '—';
    sheet.getCell(`B${row}`).font = { bold: true, color: { argb: COLORS.textPrimary } };
    sheet.getCell(`C${row}`).value = '—';
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textPrimary } };
    sheet.getCell(`D${row}`).value = '—';
    sheet.getCell(`D${row}`).font = { color: { argb: COLORS.positive } };

    // Losers
    sheet.getCell(`F${row}`).value = '—';
    sheet.getCell(`F${row}`).font = { bold: true, color: { argb: COLORS.textPrimary } };
    sheet.getCell(`G${row}`).value = '—';
    sheet.getCell(`G${row}`).font = { color: { argb: COLORS.textPrimary } };
    sheet.getCell(`H${row}`).value = '—';
    sheet.getCell(`H${row}`).font = { color: { argb: COLORS.negative } };

    row++;
  }

  // Footer
  row += 2;
  sheet.mergeCells(`B${row}:H${row}`);
  sheet.getCell(`B${row}`).value =
    '💡 Data updates when you click "Refresh Data" in the CRK add-in';
  sheet.getCell(`B${row}`).font = {
    italic: true,
    color: { argb: COLORS.textSecondary },
  };
}

/**
 * Create OHLCV history sheet
 */
async function createOHLCVSheet(
  workbook: ExcelJS.Workbook,
  recipe: PackRecipe
): Promise<void> {
  const sheet = workbook.addWorksheet('Price History', {
    properties: { tabColor: { argb: COLORS.primaryDark } },
    views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
  });

  // For the first coin
  const mainCoin = recipe.coins[0] || 'bitcoin';
  const days = recipe.ohlcv_days || 30;

  sheet.columns = [
    { header: 'Date', width: 15 },
    { header: 'Open', width: 15 },
    { header: 'High', width: 15 },
    { header: 'Low', width: 15 },
    { header: 'Close', width: 15 },
  ];

  // Apply dark background
  for (let r = 1; r <= days + 5; r++) {
    for (let c = 1; c <= 5; c++) {
      sheet.getCell(r, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.bgDark },
      };
    }
  }

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.textPrimary }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: COLORS.bgMedium },
    };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: COLORS.primary } },
    };
  });

  // Add coin name above table
  sheet.mergeCells('A1:E1');
  sheet.getCell('A1').value = `${mainCoin.toUpperCase()} - ${days} Day OHLCV`;

  // Placeholder rows
  for (let i = 0; i < days; i++) {
    const rowNum = i + 2;
    const row = sheet.getRow(rowNum);
    const rowFill = i % 2 === 0 ? COLORS.bgMedium : COLORS.bgDark;

    for (let c = 1; c <= 5; c++) {
      const cell = row.getCell(c);
      cell.value = '—';
      cell.font = { color: { argb: COLORS.textPrimary } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: rowFill },
      };
      if (c > 1) {
        cell.numFmt = '"$"#,##0.00';
      }
    }

    row.height = 22;
  }
}

/**
 * Create instructions sheet for the pack
 */
async function createPackInstructionsSheet(
  workbook: ExcelJS.Workbook,
  recipe: PackRecipe
): Promise<void> {
  const sheet = workbook.addWorksheet('How to Use', {
    properties: { tabColor: { argb: COLORS.textSecondary } },
    views: [{ showGridLines: false }],
  });

  sheet.columns = [
    { width: 5 },
    { width: 50 },
    { width: 50 },
    { width: 5 },
  ];

  // Apply dark background
  for (let r = 1; r <= 50; r++) {
    for (let c = 1; c <= 4; c++) {
      sheet.getCell(r, c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: COLORS.bgDark },
      };
    }
  }

  let row = 2;

  // Title
  sheet.mergeCells(`B${row}:C${row}`);
  sheet.getCell(`B${row}`).value = `📊 ${recipe.name}`;
  sheet.getCell(`B${row}`).font = {
    bold: true,
    size: 22,
    color: { argb: COLORS.primary },
  };
  sheet.getCell(`B${row}`).alignment = { horizontal: 'center' };
  row += 1;

  sheet.mergeCells(`B${row}:C${row}`);
  sheet.getCell(`B${row}`).value = 'CryptoReportKit Data Pack';
  sheet.getCell(`B${row}`).font = {
    size: 12,
    color: { argb: COLORS.textSecondary },
    italic: true,
  };
  sheet.getCell(`B${row}`).alignment = { horizontal: 'center' };
  row += 3;

  // How It Works section
  sheet.mergeCells(`B${row}:C${row}`);
  sheet.getCell(`B${row}`).value = '🔄 How This Pack Works';
  sheet.getCell(`B${row}`).font = {
    bold: true,
    size: 14,
    color: { argb: COLORS.textPrimary },
  };
  sheet.getCell(`B${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.bgMedium },
  };
  sheet.getCell(`B${row}`).border = {
    left: { style: 'thick', color: { argb: COLORS.primary } },
  };
  row += 1;

  const howItWorks = [
    'This is a CryptoReportKit Data Pack - a pre-configured Excel workbook.',
    'Data is NOT fetched via formulas - instead, you refresh via the CRK add-in.',
    'When you click "Refresh Data", the add-in fetches live data and populates all tables.',
    'Charts and formatting are preserved - only the data values change.',
  ];

  for (const text of howItWorks) {
    sheet.getCell(`B${row}`).value = `• ${text}`;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textPrimary } };
    row++;
  }
  row += 2;

  // Getting Started section
  sheet.mergeCells(`B${row}:C${row}`);
  sheet.getCell(`B${row}`).value = '🚀 Getting Started';
  sheet.getCell(`B${row}`).font = {
    bold: true,
    size: 14,
    color: { argb: COLORS.textPrimary },
  };
  sheet.getCell(`B${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.bgMedium },
  };
  sheet.getCell(`B${row}`).border = {
    left: { style: 'thick', color: { argb: COLORS.positive } },
  };
  row += 1;

  const steps = [
    ['Step 1:', 'Install the CryptoReportKit add-in (Insert → Get Add-ins → Search "CryptoReportKit")'],
    ['Step 2:', 'Sign in to your CryptoReportKit account in the add-in panel'],
    ['Step 3:', 'Click "Refresh Data" to fetch live crypto data'],
    ['Step 4:', 'Data will populate all tables in this workbook'],
    ['Step 5:', 'Re-click "Refresh Data" anytime to get latest prices'],
  ];

  for (const [step, instruction] of steps) {
    sheet.getCell(`B${row}`).value = step;
    sheet.getCell(`B${row}`).font = {
      bold: true,
      color: { argb: COLORS.accent },
    };
    sheet.getCell(`C${row}`).value = instruction;
    sheet.getCell(`C${row}`).font = { color: { argb: COLORS.textPrimary } };
    row++;
  }
  row += 2;

  // What's Included section
  sheet.mergeCells(`B${row}:C${row}`);
  sheet.getCell(`B${row}`).value = '📋 What\'s Included in This Pack';
  sheet.getCell(`B${row}`).font = {
    bold: true,
    size: 14,
    color: { argb: COLORS.textPrimary },
  };
  sheet.getCell(`B${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.bgMedium },
  };
  sheet.getCell(`B${row}`).border = {
    left: { style: 'thick', color: { argb: COLORS.accent } },
  };
  row += 1;

  const included = [
    ['Coins:', recipe.coins.slice(0, 10).join(', ') + (recipe.coins.length > 10 ? '...' : '')],
    ['Data Points:', recipe.metrics.join(', ')],
    ['Currency:', recipe.currency.toUpperCase()],
  ];

  if (recipe.ohlcv_days) {
    included.push(['OHLCV History:', `${recipe.ohlcv_days} days`]);
  }

  if (recipe.movers_count) {
    included.push(['Movers:', `Top ${recipe.movers_count} gainers/losers`]);
  }

  for (const [label, value] of included) {
    sheet.getCell(`B${row}`).value = label;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.textSecondary } };
    sheet.getCell(`C${row}`).value = value;
    sheet.getCell(`C${row}`).font = {
      bold: true,
      color: { argb: COLORS.textPrimary },
    };
    row++;
  }
  row += 2;

  // Benefits vs Formula Mode
  sheet.mergeCells(`B${row}:C${row}`);
  sheet.getCell(`B${row}`).value = '💡 Why Use a Pack vs Formulas?';
  sheet.getCell(`B${row}`).font = {
    bold: true,
    size: 14,
    color: { argb: COLORS.textPrimary },
  };
  sheet.getCell(`B${row}`).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: COLORS.bgMedium },
  };
  sheet.getCell(`B${row}`).border = {
    left: { style: 'thick', color: { argb: COLORS.primaryDark } },
  };
  row += 1;

  const benefits = [
    '✓ Faster refresh - all data fetched in one API call',
    '✓ Shareable - recipients don\'t need add-ins to VIEW data',
    '✓ Smaller file size - no formula overhead',
    '✓ Better for reports - data is "frozen" until you refresh',
    '✓ Works offline - once data is loaded, no internet needed',
  ];

  for (const benefit of benefits) {
    sheet.getCell(`B${row}`).value = benefit;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.primary } };
    row++;
  }
  row += 2;

  // Footer
  sheet.mergeCells(`B${row}:C${row}`);
  sheet.getCell(`B${row}`).value =
    'Generated by CryptoReportKit | cryptoreportkit.com';
  sheet.getCell(`B${row}`).font = {
    italic: true,
    color: { argb: COLORS.textSecondary },
  };
  sheet.getCell(`B${row}`).alignment = { horizontal: 'center' };
}

/**
 * Pre-defined pack recipes
 */
export const PACK_RECIPES: Record<string, PackRecipe> = {
  market_overview: {
    id: 'market_overview',
    name: 'Market Overview',
    description: 'Top cryptocurrencies by market cap with price, change, and volume data',
    version: '1.0.0',
    coins: [
      'bitcoin', 'ethereum', 'tether', 'solana', 'ripple',
      'ripple', 'usd-coin', 'cardano', 'avalanche-2', 'dogecoin',
      'chainlink', 'polkadot', 'polygon', 'litecoin', 'bitcoin-cash',
      'uniswap', 'stellar', 'cosmos', 'ethereum-classic', 'monero',
    ],
    metrics: ['price', 'change_24h', 'market_cap', 'volume', 'movers'],
    currency: 'usd',
    ohlcv_days: 30,
    movers_count: 5,
    include_global: true,
    refresh_interval: 0, // manual
  },

  defi_dashboard: {
    id: 'defi_dashboard',
    name: 'DeFi Dashboard',
    description: 'Top DeFi tokens and protocols',
    version: '1.0.0',
    coins: [
      'uniswap', 'aave', 'chainlink', 'maker', 'compound-governance-token',
      'yearn-finance', 'curve-dao-token', 'synthetix-network-token', 'sushi',
      '1inch', 'pancakeswap-token', 'lido-dao', 'rocket-pool', 'frax-share',
      'convex-finance', 'balancer', 'gmx', 'dydx', 'ribbon-finance', 'perpetual-protocol',
    ],
    metrics: ['price', 'change_24h', 'market_cap', 'volume', 'movers'],
    currency: 'usd',
    movers_count: 5,
    refresh_interval: 0,
  },

  layer1_comparison: {
    id: 'layer1_comparison',
    name: 'Layer 1 Comparison',
    description: 'Compare top Layer 1 blockchain tokens',
    version: '1.0.0',
    coins: [
      'bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2',
      'polkadot', 'near', 'cosmos', 'algorand', 'aptos',
      'sui', 'fantom', 'tron', 'tezos', 'flow',
    ],
    metrics: ['price', 'change_24h', 'market_cap', 'volume', 'ohlcv'],
    currency: 'usd',
    ohlcv_days: 30,
    refresh_interval: 0,
  },
};
