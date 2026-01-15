// Excel Template Generator (safe, template-oriented)
//
// This module intentionally does NOT generate or instruct raw market-data exports.
// DataSimplify ships Excel templates that rely on third-party spreadsheet add-ins
// (e.g., CryptoSheets) to fetch data directly within the user’s spreadsheet.

import * as XLSX from 'xlsx';

/**
 * Generate a lightweight Excel template containing setup instructions.
 * This is a template file (not a data export).
 */
export function generateLiveDataTemplate(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const instructionsData = [
    ['DataSimplify Template Setup'],
    [''],
    ['WHAT THIS IS'],
    ['• This is an Excel template file (.xlsx). It does not include raw market data exports.'],
    [''],
    ['RECOMMENDED SETUP (EXCEL DESKTOP)'],
    ['1) Open this file in Microsoft Excel Desktop (Windows/Mac).'],
    ['2) Install and enable your spreadsheet data add-in (e.g., CryptoSheets).'],
    ['3) Sign in to your add-in account.'],
    ['4) Use the template sheets as a starting point for your dashboard/report.'],
    [''],
    ['NOTES'],
    ['• Avoid sharing or redistributing third-party market data; follow your data provider’s terms.'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 90 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}

/**
 * Trigger download of the template in-browser.
 */
export function downloadLiveDataTemplate(): void {
  const data = generateLiveDataTemplate();
  const buffer = new Uint8Array(data);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DataSimplify_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
