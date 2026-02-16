/**
 * Excel Workbook Generator
 *
 * Converts Recipe + Execution Results → Excel file
 */

import ExcelJS from 'exceljs';
import type { RecipeV1, ChartConfig, KPIConfig } from './types';
import type { ExecutionResult, DatasetResult } from './executor';

/**
 * Generate Excel workbook from recipe and data
 */
export async function generateWorkbook(
  recipe: RecipeV1,
  executionResult: ExecutionResult
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();

  // Set workbook properties
  workbook.creator = 'CryptoReportKit';
  workbook.created = new Date();
  workbook.modified = new Date();
  workbook.lastModifiedBy = 'CryptoReportKit';

  // Create __CRK__ metadata sheet (must be first)
  await createMetadataSheet(workbook, recipe, executionResult);

  // Create Dashboard sheet
  const dashboardSheet = workbook.addWorksheet('Dashboard', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
  });
  await createDashboardSheet(dashboardSheet, recipe, executionResult);

  // Create data sheets and populate with tables
  const datasetMap = new Map<string, DatasetResult>();
  executionResult.datasets.forEach((ds) => {
    datasetMap.set(ds.datasetId, ds);
  });

  for (const dataset of recipe.datasets) {
    const result = datasetMap.get(dataset.id);
    if (result && result.data.length > 0) {
      const sheetName = dataset.sheetName || 'Data';
      let sheet = workbook.getWorksheet(sheetName);
      if (!sheet) {
        sheet = workbook.addWorksheet(sheetName, {
          views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }],
        });
      }

      await addDataTable(sheet, dataset.tableName, result);
    }
  }

  // Create Charts sheet if charts are defined
  if (recipe.charts.length > 0) {
    const chartsSheet = workbook.addWorksheet('Charts');
    await addChartsPlaceholders(chartsSheet, recipe.charts);
  }

  // Create Instructions sheet
  const instructionsSheet = workbook.addWorksheet('Instructions');
  await createInstructionsSheet(instructionsSheet, recipe);

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

/**
 * Create __CRK__ metadata sheet
 */
async function createMetadataSheet(
  workbook: ExcelJS.Workbook,
  recipe: RecipeV1,
  executionResult: ExecutionResult
): Promise<void> {
  const sheet = workbook.addWorksheet('__CRK__', {
    state: 'hidden', // Hidden by default
  });

  // Add recipe JSON
  sheet.getCell('A1').value = 'RECIPE_JSON';
  sheet.getCell('A1').font = { bold: true, size: 14, color: { argb: 'FF10b981' } };

  sheet.getCell('A2').value = JSON.stringify(recipe, null, 2);
  sheet.getCell('A2').alignment = { wrapText: false, vertical: 'top' };

  // Add execution metadata
  sheet.getCell('D1').value = 'EXECUTION_METADATA';
  sheet.getCell('D1').font = { bold: true, size: 14, color: { argb: 'FF10b981' } };

  sheet.getCell('D2').value = 'Executed At:';
  sheet.getCell('E2').value = executionResult.metadata.executedAt;

  sheet.getCell('D3').value = 'Execution Time:';
  sheet.getCell('E3').value = `${executionResult.metadata.executionTimeMs}ms`;

  sheet.getCell('D4').value = 'Datasets:';
  sheet.getCell('E4').value = executionResult.metadata.datasetsExecuted;

  sheet.getCell('D5').value = 'Total Rows:';
  sheet.getCell('E5').value = executionResult.metadata.totalRows;

  sheet.getCell('D7').value = 'REFRESH_INFO';
  sheet.getCell('D7').font = { bold: true, size: 14, color: { argb: 'FF10b981' } };

  sheet.getCell('D8').value = 'Min Interval:';
  sheet.getCell('E8').value = `${recipe.refreshPolicy.minInterval}s`;

  sheet.getCell('D9').value = 'Plan Limits:';
  sheet.getCell('E9').value = `Free: ${recipe.refreshPolicy.planLimits.free}/day | Pro: ${recipe.refreshPolicy.planLimits.pro}/day`;

  // Add attribution requirements
  sheet.getCell('D11').value = 'ATTRIBUTION';
  sheet.getCell('D11').font = { bold: true, size: 14, color: { argb: 'FF10b981' } };

  const attributions = recipe.datasets
    .filter((ds) => ds.mode === 'public' && ['alternative', 'defillama', 'fred', 'yahoo'].includes(ds.provider))
    .map((ds) => {
      const providerNames: Record<string, string> = {
        alternative: 'Alternative.me',
        defillama: 'DeFiLlama',
        fred: 'FRED',
        yahoo: 'Yahoo Finance',
      };
      return `Data from ${providerNames[ds.provider] || ds.provider}`;
    });

  if (attributions.length > 0) {
    sheet.getCell('D12').value = attributions.join(' | ');
  } else {
    sheet.getCell('D12').value = 'No attribution required';
  }

  // Set column widths
  sheet.getColumn('A').width = 100;
  sheet.getColumn('D').width = 20;
  sheet.getColumn('E').width = 40;
}

/**
 * Create Dashboard sheet with KPIs
 */
async function createDashboardSheet(
  sheet: ExcelJS.Worksheet,
  recipe: RecipeV1,
  executionResult: ExecutionResult
): Promise<void> {
  // Title
  sheet.getCell('A1').value = recipe.name;
  sheet.getCell('A1').font = { bold: true, size: 24, color: { argb: 'FF10b981' } };
  sheet.mergeCells('A1:F1');

  sheet.getCell('A2').value = recipe.description || '';
  sheet.getCell('A2').font = { size: 14, color: { argb: 'FF6b7280' } };
  sheet.mergeCells('A2:F2');

  // Add KPIs
  const _startRow = 4; // Starting row for KPIs (used by kpi.cell.row)
  for (const kpi of recipe.kpis) {
    if (kpi.cell.sheet === 'Dashboard') {
      const cell = sheet.getCell(kpi.cell.row, kpi.cell.col);

      // Label
      const labelCell = sheet.getCell(kpi.cell.row - 1, kpi.cell.col);
      labelCell.value = kpi.label;
      labelCell.font = { size: 12, color: { argb: 'FF9ca3af' } };

      // Value (formula or static)
      cell.value = { formula: kpi.formula.replace(/^=/, '') };
      cell.numFmt = kpi.format;

      // Styling
      if (kpi.style) {
        cell.font = {
          size: kpi.style.fontSize || 16,
          bold: kpi.style.bold !== false,
          color: { argb: kpi.style.color?.replace('#', 'FF') || 'FFFFFFFF' },
        };
        if (kpi.style.bgColor) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: kpi.style.bgColor.replace('#', 'FF') },
          };
        }
      }
    }
  }

  // Last updated timestamp
  sheet.getCell('A25').value = 'Last Updated:';
  sheet.getCell('A25').font = { size: 10, color: { argb: 'FF9ca3af' } };
  sheet.getCell('B25').value = new Date();
  sheet.getCell('B25').numFmt = 'yyyy-mm-dd hh:mm:ss';
  sheet.getCell('B25').font = { size: 10, color: { argb: 'FF9ca3af' } };

  // Instructions
  sheet.getCell('A27').value = 'To get fresh data: Download a new template from cryptoreportkit.com/downloads';
  sheet.getCell('A27').font = { size: 10, italic: true, color: { argb: 'FF10b981' } };
  sheet.mergeCells('A27:F27');
}

/**
 * Add data table to sheet
 */
async function addDataTable(
  sheet: ExcelJS.Worksheet,
  tableName: string,
  dataset: DatasetResult
): Promise<void> {
  if (dataset.data.length === 0) return;

  // Find next available row
  let startRow = 1;
  while (sheet.getRow(startRow).hasValues) {
    startRow++;
  }

  // Add header row
  const headerRow = sheet.getRow(startRow);
  dataset.columns.forEach((col, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.value = col;
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10b981' },
    };
  });

  // Add data rows
  dataset.data.forEach((row, rowIndex) => {
    const excelRow = sheet.getRow(startRow + 1 + rowIndex);
    dataset.columns.forEach((col, colIndex) => {
      excelRow.getCell(colIndex + 1).value = row[col];
    });
  });

  // Create Excel table
  const tableRange = `A${startRow}:${String.fromCharCode(65 + dataset.columns.length - 1)}${startRow + dataset.data.length}`;

  try {
    sheet.addTable({
      name: tableName,
      ref: tableRange,
      headerRow: true,
      style: {
        theme: 'TableStyleMedium2',
        showRowStripes: true,
      },
      columns: dataset.columns.map((col) => ({ name: col, filterButton: true })),
      rows: dataset.data.map((row) => dataset.columns.map((col) => row[col])),
    });
  } catch (error) {
    // Table creation might fail if name conflicts
    console.warn(`Failed to create table ${tableName}:`, error);
  }

  // Auto-fit columns
  dataset.columns.forEach((col, index) => {
    const column = sheet.getColumn(index + 1);
    let maxLength = col.length;
    dataset.data.forEach((row) => {
      const value = row[col];
      if (value) {
        const length = String(value).length;
        if (length > maxLength) maxLength = length;
      }
    });
    column.width = Math.min(maxLength + 2, 50);
  });
}

/**
 * Add chart placeholders
 * Note: ExcelJS doesn't support full chart creation yet
 */
async function addChartsPlaceholders(
  sheet: ExcelJS.Worksheet,
  charts: ChartConfig[]
): Promise<void> {
  sheet.getCell('A1').value = 'Charts Preview';
  sheet.getCell('A1').font = { bold: true, size: 18, color: { argb: 'FF10b981' } };

  sheet.getCell('A3').value =
    'Note: Charts can be created from the prefetched data using Excel\'s Insert → Chart tools.';
  sheet.getCell('A3').font = { size: 12, italic: true, color: { argb: 'FFf59e0b' } };

  let currentRow = 5;
  charts.forEach((chart, index) => {
    sheet.getCell(`A${currentRow}`).value = `${index + 1}. ${chart.title}`;
    sheet.getCell(`A${currentRow}`).font = { bold: true, size: 14 };

    sheet.getCell(`A${currentRow + 1}`).value = `Type: ${chart.type}`;
    sheet.getCell(`A${currentRow + 2}`).value = `Dataset: ${chart.datasetId}`;
    sheet.getCell(`A${currentRow + 3}`).value = `Position: Sheet "${chart.sheetName}" at Column ${chart.position.col}, Row ${chart.position.row}`;

    currentRow += 5;
  });
}

/**
 * Create instructions sheet
 */
async function createInstructionsSheet(
  sheet: ExcelJS.Worksheet,
  recipe: RecipeV1
): Promise<void> {
  sheet.getCell('A1').value = '📊 CryptoReportKit Instructions';
  sheet.getCell('A1').font = { bold: true, size: 20, color: { argb: 'FF10b981' } };

  sheet.getCell('A3').value = 'How to Use This Workbook';
  sheet.getCell('A3').font = { bold: true, size: 14 };

  const instructions = [
    '',
    '1. Open in Microsoft Excel Desktop',
    '   Data is prefetched and ready to use',
    '   For live data, visit: https://cryptoreportkit.com/live-dashboards',
    '',
    '2. Explore Your Data',
    '   Navigate the data sheets to see prefetched market data',
    '   All values are current as of download time',
    '',
    '3. Create Charts (Optional)',
    '   Select data ranges and use Insert → Chart to visualize',
    '   Excel native charts work with the prefetched data',
    '',
    '4. Live Data',
    '   Visit cryptoreportkit.com/live-dashboards for live updates',
    '   Connect your CoinGecko API key (BYOK) for real-time data',
    '',
    '5. Schedule Exports (Pro)',
    '   Set up scheduled refreshes and email delivery',
    '   Available in Pro plan',
    '',
    'Recipe Information:',
    `- Name: ${recipe.name}`,
    `- Category: ${recipe.category}`,
    `- Datasets: ${recipe.datasets.length}`,
    `- Charts: ${recipe.charts.length}`,
    `- KPIs: ${recipe.kpis.length}`,
    `- Min Refresh Interval: ${recipe.refreshPolicy.minInterval}s`,
    '',
    'Attribution:',
  ];

  // Add attribution info
  const attributionProviders = new Set<string>();
  recipe.datasets.forEach((ds) => {
    if (ds.mode === 'public' && ['alternative', 'defillama', 'fred', 'yahoo'].includes(ds.provider)) {
      attributionProviders.add(ds.provider);
    }
  });

  const attributionMap: Record<string, string> = {
    alternative: '- Fear & Greed Index data powered by Alternative.me',
    defillama: '- DeFi data powered by DeFiLlama',
    fred: '- Economic data powered by Federal Reserve Economic Data (FRED)',
    yahoo: '- Market data powered by Yahoo Finance',
  };

  attributionProviders.forEach((provider) => {
    if (attributionMap[provider]) {
      instructions.push(attributionMap[provider]);
    }
  });

  if (attributionProviders.size === 0) {
    instructions.push('- No attribution required (all data via BYOK or computed)');
  }

  instructions.push('');
  instructions.push('Need Help?');
  instructions.push('- Live Dashboards: https://cryptoreportkit.com/live-dashboards');
  instructions.push('- Support: support@cryptoreportkit.com');
  instructions.push('- Documentation: https://cryptoreportkit.com/docs');

  let row = 4;
  instructions.forEach((line) => {
    sheet.getCell(`A${row}`).value = line;
    if (line.startsWith('-')) {
      sheet.getCell(`A${row}`).font = { size: 11, color: { argb: 'FF6b7280' } };
    } else if (line.endsWith(':')) {
      sheet.getCell(`A${row}`).font = { bold: true, size: 12 };
    } else {
      sheet.getCell(`A${row}`).font = { size: 11 };
    }
    row++;
  });

  sheet.getColumn('A').width = 80;
}
