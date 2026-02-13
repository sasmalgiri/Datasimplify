// Excel Template Generator (safe, template-oriented)
//
// This module intentionally does NOT generate or instruct raw market-data exports.
// CryptoReportKit ships Excel templates with BYOK prefetched data
// (Bring Your Own Key) to fetch data directly within the user's spreadsheet.

import ExcelJS from 'exceljs';

/**
 * Generate a lightweight Excel template containing setup instructions.
 * This is a template file (not a data export).
 */
export async function generateLiveDataTemplate(): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CryptoReportKit';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Instructions');

  const instructionsData = [
    ['CryptoReportKit Template Setup'],
    [''],
    ['WHAT THIS IS'],
    ['• This is an Excel template file (.xlsx). It does not include raw market data exports.'],
    [''],
    ['RECOMMENDED SETUP (EXCEL DESKTOP)'],
    ['1) Open this file in Microsoft Excel Desktop (Windows/Mac).'],
    ['2) Data is prefetched. For live updates, use our web dashboards at cryptoreportkit.com/live-dashboards'],
    ['3) Visit cryptoreportkit.com for live interactive dashboards.'],
    ['4) Use the template sheets as a starting point for your dashboard/report.'],
    [''],
    ['NOTES'],
    ['• Avoid sharing or redistributing third-party market data; follow your data provider\'s terms.'],
  ];

  instructionsData.forEach((row) => {
    sheet.addRow(row);
  });

  // Set column width
  sheet.getColumn(1).width = 90;

  // Style the header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 14 };

  const buffer = await workbook.xlsx.writeBuffer();
  return new Uint8Array(buffer as ArrayBuffer);
}

/**
 * Trigger download of the template in-browser.
 */
export async function downloadLiveDataTemplate(): Promise<void> {
  const data = await generateLiveDataTemplate();
  const blob = new Blob([data.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `CryptoReportKit_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
