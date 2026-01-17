// Excel and CSV export utilities using SheetJS
import * as XLSX from 'xlsx';
import { CoinMarketData } from '@/types/crypto';

// Format helpers
function formatCurrency(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  if (value >= 1000) return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  return `$${value.toFixed(6)}`;
}

function formatPercent(value: number): string {
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

function formatNumber(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 });
}

// Column definitions for export
const COLUMN_CONFIG = [
  { key: 'market_cap_rank', header: 'Rank', width: 8 },
  { key: 'name', header: 'Name', width: 20 },
  { key: 'symbol', header: 'Symbol', width: 10 },
  { key: 'current_price', header: 'Price (USD)', width: 15, format: 'currency' },
  { key: 'price_change_percentage_24h', header: '24h Change %', width: 14, format: 'percent' },
  { key: 'price_change_percentage_7d', header: '7d Change %', width: 14, format: 'percent' },
  { key: 'market_cap', header: 'Market Cap', width: 18, format: 'currency' },
  { key: 'total_volume', header: '24h Volume', width: 18, format: 'currency' },
  { key: 'circulating_supply', header: 'Circulating Supply', width: 20, format: 'number' },
  { key: 'total_supply', header: 'Total Supply', width: 18, format: 'number' },
  { key: 'ath', header: 'All-Time High', width: 15, format: 'currency' },
  { key: 'ath_date', header: 'ATH Date', width: 12, format: 'date' },
  { key: 'atl', header: 'All-Time Low', width: 15, format: 'currency' },
  { key: 'last_updated', header: 'Last Updated', width: 20, format: 'datetime' },
];

// Convert coin data to export rows
function coinsToRows(coins: CoinMarketData[], columns: typeof COLUMN_CONFIG): Record<string, string | number>[] {
  return coins.map(coin => {
    const row: Record<string, string | number> = {};
    
    for (const col of columns) {
      const value = coin[col.key as keyof CoinMarketData];
      
      if (value === null || value === undefined) {
        row[col.header] = 'Unavailable';
        continue;
      }
      
      switch (col.format) {
        case 'currency':
          row[col.header] = typeof value === 'number' ? formatCurrency(value) : value;
          break;
        case 'percent':
          row[col.header] = typeof value === 'number' ? formatPercent(value) : value;
          break;
        case 'number':
          row[col.header] = typeof value === 'number' ? formatNumber(value) : value;
          break;
        case 'date':
          row[col.header] = value ? new Date(value as string).toLocaleDateString() : 'Unavailable';
          break;
        case 'datetime':
          row[col.header] = value ? new Date(value as string).toLocaleString() : 'Unavailable';
          break;
        default:
          row[col.header] = value?.toString().toUpperCase() || 'Unavailable';
      }
    }
    
    return row;
  });
}

// Generate Excel file
export function generateExcel(
  coins: CoinMarketData[],
  options?: {
    filename?: string;
    sheetName?: string;
    includeAllColumns?: boolean;
    columns?: (keyof CoinMarketData)[];
  }
): Uint8Array {
  // Filter columns if specified
  let columns = COLUMN_CONFIG;
  if (options?.columns && !options?.includeAllColumns) {
    columns = COLUMN_CONFIG.filter(c => 
      options.columns!.includes(c.key as keyof CoinMarketData)
    );
  }
  
  // Convert data
  const rows = coinsToRows(coins, columns);
  
  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  
  // Set column widths
  ws['!cols'] = columns.map(c => ({ wch: c.width }));
  
  // Add sheet
  XLSX.utils.book_append_sheet(wb, ws, options?.sheetName || 'Crypto Data');
  
  // Add metadata sheet
  const metaWs = XLSX.utils.aoa_to_sheet([
    ['CryptoReportKit Export'],
    [''],
    ['Generated', new Date().toISOString()],
    ['Total Coins', coins.length],
    ['Data Source', 'CoinGecko + Binance'],
    [''],
    ['Visit cryptoreportkit.com for more data and analysis'],
  ]);
  XLSX.utils.book_append_sheet(wb, metaWs, 'Info');
  
  // Generate buffer
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}

// Generate CSV file
export function generateCSV(
  coins: CoinMarketData[],
  options?: {
    columns?: (keyof CoinMarketData)[];
  }
): string {
  let columns = COLUMN_CONFIG;
  if (options?.columns) {
    columns = COLUMN_CONFIG.filter(c => 
      options.columns!.includes(c.key as keyof CoinMarketData)
    );
  }
  
  const rows = coinsToRows(coins, columns);
  const ws = XLSX.utils.json_to_sheet(rows);
  return XLSX.utils.sheet_to_csv(ws);
}

// Download file in browser
export function downloadFile(
  data: Uint8Array | string,
  filename: string,
  mimeType: string
): void {
  const blobData = data instanceof Uint8Array ? new Uint8Array(data) : data;
  const blob = new Blob([blobData], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Convenience functions
export function downloadExcel(coins: CoinMarketData[], filename?: string): void {
  const data = generateExcel(coins);
  const name = filename || `crypto_data_${new Date().toISOString().split('T')[0]}.xlsx`;
  downloadFile(data, name, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

export function downloadCSV(coins: CoinMarketData[], filename?: string): void {
  const data = generateCSV(coins);
  const name = filename || `crypto_data_${new Date().toISOString().split('T')[0]}.csv`;
  downloadFile(data, name, 'text/csv');
}

// Template exports
export function generateTemplateExport(
  templateId: string,
  coins: CoinMarketData[]
): Uint8Array {
  const templateNames: Record<string, string> = {
    'market-overview': 'Market Overview',
    'defi-dashboard': 'DeFi Dashboard',
    'portfolio-tracker': 'Portfolio Tracker',
  };
  
  return generateExcel(coins, {
    sheetName: templateNames[templateId] || 'Crypto Data',
  });
}
