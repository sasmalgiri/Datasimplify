// Excel Live Data Template Generator
// Creates an Excel file with instructions for Power Query live data connections

import * as XLSX from 'xlsx';

// Base URL - will be configured based on deployment
const getBaseUrl = () => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'https://datasimplify.com'; // Fallback for SSR
};

// Data categories with their API endpoints
const DATA_ENDPOINTS = [
  {
    category: 'Market Overview',
    endpoint: '/api/download?category=market_overview&format=json',
    description: 'Current prices, market cap, volume for all cryptocurrencies',
    refreshRate: 'Every 10 seconds',
  },
  {
    category: 'Historical Prices (OHLCV)',
    endpoint: '/api/download?category=historical_prices&format=json&symbol=BTC&interval=1d&limit=100',
    description: 'Open, High, Low, Close, Volume candlestick data',
    refreshRate: 'Based on interval',
  },
  {
    category: 'DeFi Protocols (TVL)',
    endpoint: '/api/download?category=defi_protocols&format=json&limit=50',
    description: 'Total Value Locked in DeFi protocols',
    refreshRate: 'Every 10 minutes',
  },
  {
    category: 'Fear & Greed Index',
    endpoint: '/api/download?category=fear_greed&format=json',
    description: 'Market sentiment indicator (0-100)',
    refreshRate: 'Daily',
  },
  {
    category: 'Top Gainers & Losers',
    endpoint: '/api/download?category=gainers_losers&format=json&type=both&limit=20',
    description: 'Biggest price movers in 24 hours',
    refreshRate: 'Every minute',
  },
  {
    category: 'Funding Rates',
    endpoint: '/api/download?category=funding_rates&format=json',
    description: 'Perpetual futures funding rates',
    refreshRate: 'Every 8 hours',
  },
  {
    category: 'Open Interest',
    endpoint: '/api/download?category=open_interest&format=json',
    description: 'Total value of outstanding futures contracts',
    refreshRate: 'Real-time',
  },
  {
    category: 'Whale Transactions',
    endpoint: '/api/download?category=whale_transactions&format=json',
    description: 'Large cryptocurrency transactions (>$1M)',
    refreshRate: 'Every 5 minutes',
  },
  {
    category: 'Technical Indicators',
    endpoint: '/api/download?category=technical_indicators&format=json',
    description: 'RSI, MACD, Moving Averages, Bollinger Bands',
    refreshRate: 'Based on interval',
  },
  {
    category: 'NFT Collections',
    endpoint: '/api/download?category=nft_collections&format=json&limit=50',
    description: 'Top NFT collections by volume and floor price',
    refreshRate: 'Every 5 minutes',
  },
];

/**
 * Generate an Excel template with live data connection instructions
 */
export function generateLiveDataTemplate(): Uint8Array {
  const baseUrl = getBaseUrl();
  const wb = XLSX.utils.book_new();

  // =====================
  // Sheet 1: Instructions
  // =====================
  const instructionsData = [
    ['DataSimplify Live Data Template'],
    [''],
    ['HOW TO GET LIVE DATA IN EXCEL'],
    [''],
    ['Method 1: Power Query (Recommended for Excel Desktop)'],
    ['1. Go to Data tab → Get Data → From Other Sources → From Web'],
    ['2. Paste one of the URLs from the "Data URLs" sheet'],
    ['3. Click OK and follow the prompts to transform JSON to table'],
    ['4. Right-click the query → Properties → Enable "Refresh every X minutes"'],
    [''],
    ['Method 2: WEBSERVICE + JSON Functions (Excel 365)'],
    ['1. Use =WEBSERVICE(url) to fetch data'],
    ['2. Parse with FILTERXML or custom functions'],
    [''],
    ['HOW TO GET LIVE DATA IN GOOGLE SHEETS'],
    [''],
    ['Method 1: IMPORTDATA (for CSV)'],
    ['=IMPORTDATA("' + baseUrl + '/api/download?category=market_overview&format=csv")'],
    [''],
    ['Method 2: IMPORTJSON (requires Google Apps Script)'],
    ['1. Go to Extensions → Apps Script'],
    ['2. Add the ImportJSON library'],
    ['3. Use =IMPORTJSON(url) function'],
    [''],
    ['AVAILABLE DATA CATEGORIES'],
    ['See the "Data URLs" sheet for all available endpoints'],
    [''],
    ['NOTES'],
    ['• Free tier: 5 downloads/month limit'],
    ['• Data is refreshed from Binance, DeFiLlama, and other sources'],
    ['• All times are in UTC'],
    ['• For API documentation, visit ' + baseUrl + '/download'],
  ];
  const wsInstructions = XLSX.utils.aoa_to_sheet(instructionsData);
  wsInstructions['!cols'] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // =====================
  // Sheet 2: Data URLs
  // =====================
  const urlsHeader = ['Category', 'JSON URL', 'CSV URL', 'Description', 'Refresh Rate'];
  const urlsData = DATA_ENDPOINTS.map(ep => [
    ep.category,
    baseUrl + ep.endpoint,
    baseUrl + ep.endpoint.replace('format=json', 'format=csv'),
    ep.description,
    ep.refreshRate,
  ]);
  const wsUrls = XLSX.utils.aoa_to_sheet([urlsHeader, ...urlsData]);
  wsUrls['!cols'] = [
    { wch: 25 },
    { wch: 70 },
    { wch: 70 },
    { wch: 45 },
    { wch: 18 },
  ];
  XLSX.utils.book_append_sheet(wb, wsUrls, 'Data URLs');

  // =====================
  // Sheet 3: Power Query Guide
  // =====================
  const powerQueryGuide = [
    ['Power Query Step-by-Step Guide'],
    [''],
    ['STEP 1: Open Power Query Editor'],
    ['• Go to Data tab → Get Data → Launch Power Query Editor'],
    [''],
    ['STEP 2: Create New Query from Web'],
    ['• Click "New Source" → Web'],
    ['• Paste this URL:'],
    [baseUrl + '/api/download?category=market_overview&format=json'],
    [''],
    ['STEP 3: Transform JSON to Table'],
    ['• Click "To Table" if prompted'],
    ['• Expand the "data" column'],
    ['• Select columns you want to keep'],
    [''],
    ['STEP 4: Set Up Auto-Refresh'],
    ['• Right-click your query in the Queries pane'],
    ['• Select "Properties"'],
    ['• Check "Refresh every X minutes"'],
    ['• Check "Refresh data when opening the file"'],
    [''],
    ['STEP 5: Load Data to Worksheet'],
    ['• Click "Close & Load"'],
    ['• Data will appear in a new sheet'],
    ['• It will refresh automatically based on your settings'],
    [''],
    ['TIPS'],
    ['• Create multiple queries for different data types'],
    ['• Use "Append Queries" to combine data sources'],
    ['• Save your workbook as .xlsx (macros not required)'],
  ];
  const wsPowerQuery = XLSX.utils.aoa_to_sheet(powerQueryGuide);
  wsPowerQuery['!cols'] = [{ wch: 70 }];
  XLSX.utils.book_append_sheet(wb, wsPowerQuery, 'Power Query Guide');

  // =====================
  // Sheet 4: Google Sheets Guide
  // =====================
  const googleSheetsGuide = [
    ['Google Sheets Live Data Guide'],
    [''],
    ['METHOD 1: IMPORTDATA (Simple - CSV Format)'],
    [''],
    ['Paste this formula in any cell:'],
    ['=IMPORTDATA("' + baseUrl + '/api/download?category=market_overview&format=csv")'],
    [''],
    ['Other examples:'],
    ['Fear & Greed Index:'],
    ['=IMPORTDATA("' + baseUrl + '/api/download?category=fear_greed&format=csv")'],
    [''],
    ['Top Gainers:'],
    ['=IMPORTDATA("' + baseUrl + '/api/download?category=gainers_losers&format=csv&type=gainers&limit=10")'],
    [''],
    ['DeFi TVL:'],
    ['=IMPORTDATA("' + baseUrl + '/api/download?category=defi_protocols&format=csv&limit=25")'],
    [''],
    ['NOTE: IMPORTDATA refreshes approximately every hour automatically.'],
    [''],
    ['METHOD 2: Apps Script (Advanced - JSON Format)'],
    [''],
    ['1. Go to Extensions → Apps Script'],
    ['2. Create a new script with this code:'],
    [''],
    ['function IMPORTJSON(url) {'],
    ['  var response = UrlFetchApp.fetch(url);'],
    ['  var json = JSON.parse(response.getContentText());'],
    ['  var data = json.data;'],
    ['  if (!data || !data.length) return [["No data"]];'],
    ['  var headers = Object.keys(data[0]);'],
    ['  var rows = data.map(row => headers.map(h => row[h]));'],
    ['  return [headers, ...rows];'],
    ['}'],
    [''],
    ['3. Save and refresh your spreadsheet'],
    ['4. Use =IMPORTJSON("url") in any cell'],
  ];
  const wsGoogleSheets = XLSX.utils.aoa_to_sheet(googleSheetsGuide);
  wsGoogleSheets['!cols'] = [{ wch: 85 }];
  XLSX.utils.book_append_sheet(wb, wsGoogleSheets, 'Google Sheets Guide');

  // Generate buffer
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as Uint8Array;
}

/**
 * Download the live data template in browser
 */
export function downloadLiveDataTemplate(): void {
  const data = generateLiveDataTemplate();
  // Create a new Uint8Array to ensure proper ArrayBuffer type
  const buffer = new Uint8Array(data);
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `DataSimplify_Live_Data_Template_${new Date().toISOString().split('T')[0]}.xlsx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
