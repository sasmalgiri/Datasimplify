/**
 * Power Query Templates for Live Excel Data
 *
 * Generates Power Query M code that connects to CRK API endpoints
 * for live data refresh in Excel.
 */

// Base URL for API endpoints
const API_BASE = 'https://cryptoreportkit.com/api/powerquery';

// ============================================
// POWER QUERY CODE TEMPLATES
// ============================================

export const POWER_QUERY_TEMPLATES = {
  // Market data - top coins
  market: (limit: number = 100) => `
let
    Source = Json.Document(Web.Contents("${API_BASE}/market?limit=${limit}")),
    #"Converted to Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column1" = Table.ExpandRecordColumn(#"Converted to Table", "Column1",
        {"Rank", "Name", "Symbol", "Price", "MarketCap", "Volume24h", "Change24h", "Change7d", "Change30d", "ATH", "ATHChange", "LastUpdated"},
        {"Rank", "Name", "Symbol", "Price", "MarketCap", "Volume24h", "Change24h", "Change7d", "Change30d", "ATH", "ATHChange", "LastUpdated"})
in
    #"Expanded Column1"
`,

  // Global market stats
  global: () => `
let
    Source = Json.Document(Web.Contents("${API_BASE}/global")),
    #"Converted to Table" = Record.ToTable(Source),
    #"Transposed Table" = Table.Transpose(#"Converted to Table"),
    #"Promoted Headers" = Table.PromoteHeaders(#"Transposed Table", [PromoteAllScalars=true])
in
    #"Promoted Headers"
`,

  // Fear & Greed Index
  fearGreed: (days: number = 30) => `
let
    Source = Json.Document(Web.Contents("${API_BASE}/feargreed?days=${days}")),
    #"Converted to Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column1" = Table.ExpandRecordColumn(#"Converted to Table", "Column1",
        {"Value", "Classification", "Date", "Timestamp"},
        {"Value", "Classification", "Date", "Timestamp"})
in
    #"Expanded Column1"
`,

  // OHLC data for a coin
  ohlc: (coin: string = 'bitcoin', days: number = 30) => `
let
    Source = Json.Document(Web.Contents("${API_BASE}/ohlc?coin=${coin}&days=${days}")),
    #"Converted to Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column1" = Table.ExpandRecordColumn(#"Converted to Table", "Column1",
        {"DateTime", "Date", "Time", "Open", "High", "Low", "Close", "Timestamp"},
        {"DateTime", "Date", "Time", "Open", "High", "Low", "Close", "Timestamp"})
in
    #"Expanded Column1"
`,

  // Coin details
  coin: (coinId: string = 'bitcoin') => `
let
    Source = Json.Document(Web.Contents("${API_BASE}/coin?id=${coinId}")),
    #"Converted to Table" = Record.ToTable(Source),
    #"Transposed Table" = Table.Transpose(#"Converted to Table"),
    #"Promoted Headers" = Table.PromoteHeaders(#"Transposed Table", [PromoteAllScalars=true])
in
    #"Promoted Headers"
`,

  // Trending coins
  trending: () => `
let
    Source = Json.Document(Web.Contents("${API_BASE}/trending")),
    #"Converted to Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column1" = Table.ExpandRecordColumn(#"Converted to Table", "Column1",
        {"Rank", "Name", "Symbol", "MarketCapRank", "Price", "Change24h", "Volume24h"},
        {"Rank", "Name", "Symbol", "MarketCapRank", "Price", "Change24h", "Volume24h"})
in
    #"Expanded Column1"
`,

  // Multiple coins (custom watchlist)
  watchlist: (coins: string[]) => `
let
    CoinList = {"${coins.join('","')}"},
    GetCoinData = (coinId as text) =>
        let
            Source = Json.Document(Web.Contents("${API_BASE}/coin?id=" & coinId))
        in
            Source,
    AllData = List.Transform(CoinList, each GetCoinData(_)),
    #"Converted to Table" = Table.FromList(AllData, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded Column1" = Table.ExpandRecordColumn(#"Converted to Table", "Column1",
        {"ID", "Name", "Symbol", "Rank", "Price", "MarketCap", "Volume24h", "Change24h", "Change7d", "Change30d"},
        {"ID", "Name", "Symbol", "Rank", "Price", "MarketCap", "Volume24h", "Change24h", "Change7d", "Change30d"})
in
    #"Expanded Column1"
`,

  // Gainers and Losers
  gainersLosers: () => `
let
    Source = Json.Document(Web.Contents("${API_BASE}/market?limit=100")),
    #"Converted to Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"Converted to Table", "Column1",
        {"Rank", "Name", "Symbol", "Price", "Change24h"},
        {"Rank", "Name", "Symbol", "Price", "Change24h"}),
    #"Sorted Rows" = Table.Sort(#"Expanded",{{"Change24h", Order.Descending}}),
    TopGainers = Table.FirstN(#"Sorted Rows", 25),
    TopLosers = Table.LastN(#"Sorted Rows", 25)
in
    TopGainers
`,

  // Exchanges
  exchanges: () => `
let
    Source = Json.Document(Web.Contents("${API_BASE}/exchanges")),
    #"Converted to Table" = Table.FromList(Source, Splitter.SplitByNothing(), null, null, ExtraValues.Error),
    #"Expanded" = Table.ExpandRecordColumn(#"Converted to Table", "Column1",
        {"Rank", "Name", "TrustScore", "Volume24hBTC", "Year", "Country"},
        {"Rank", "Name", "TrustScore", "Volume24hBTC", "Year", "Country"})
in
    #"Expanded"
`,
};

// ============================================
// REFRESH CONFIGURATIONS
// ============================================

export interface RefreshConfig {
  intervalMinutes: number;
  refreshOnOpen: boolean;
  backgroundRefresh: boolean;
}

export const REFRESH_PRESETS: Record<string, RefreshConfig> = {
  realtime: {
    intervalMinutes: 5,
    refreshOnOpen: true,
    backgroundRefresh: true,
  },
  frequent: {
    intervalMinutes: 15,
    refreshOnOpen: true,
    backgroundRefresh: true,
  },
  hourly: {
    intervalMinutes: 60,
    refreshOnOpen: true,
    backgroundRefresh: true,
  },
  daily: {
    intervalMinutes: 1440,
    refreshOnOpen: true,
    backgroundRefresh: false,
  },
  manual: {
    intervalMinutes: 0,
    refreshOnOpen: false,
    backgroundRefresh: false,
  },
};

// ============================================
// POWER QUERY SHEET GENERATOR
// ============================================

import ExcelJS from 'exceljs';

/**
 * Adds a Power Query setup sheet with instructions and query code
 */
export function addPowerQuerySetupSheet(
  workbook: ExcelJS.Workbook,
  queries: { name: string; code: string; description: string }[],
  refreshConfig: RefreshConfig = REFRESH_PRESETS.hourly
): void {
  const sheet = workbook.addWorksheet('Power Query Setup', {
    properties: { tabColor: { argb: 'FF8B5CF6' } },
  });

  // Column widths
  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 30;
  sheet.getColumn('C').width = 80;

  // Header
  sheet.mergeCells('B2:C2');
  const header = sheet.getCell('B2');
  header.value = '⚡ POWER QUERY LIVE DATA SETUP';
  header.font = { bold: true, size: 18, color: { argb: 'FFFFFFFF' } };
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF8B5CF6' } };
  header.alignment = { horizontal: 'center', vertical: 'middle' };
  sheet.getRow(2).height = 45;

  // Instructions
  const instructions = [
    '📋 HOW TO ENABLE LIVE DATA REFRESH:',
    '',
    '1. Go to Data tab in Excel',
    '2. Click "Get Data" → "From Other Sources" → "Blank Query"',
    '3. In the Query Editor, click "Advanced Editor"',
    '4. Copy and paste the M code from below',
    '5. Click "Done" then "Close & Load"',
    '6. Right-click the query → Properties → Set refresh interval',
    '',
    '⏰ RECOMMENDED REFRESH SETTINGS:',
    `   • Refresh every ${refreshConfig.intervalMinutes} minutes`,
    `   • Refresh on file open: ${refreshConfig.refreshOnOpen ? 'Yes' : 'No'}`,
    `   • Background refresh: ${refreshConfig.backgroundRefresh ? 'Yes' : 'No'}`,
    '',
    '🔑 NOTE: These queries connect to CryptoReportKit API.',
    '   Free tier: 100 calls/day | Pro: Unlimited',
  ];

  instructions.forEach((text, i) => {
    const cell = sheet.getCell(`B${4 + i}`);
    cell.value = text;
    if (text.startsWith('📋') || text.startsWith('⏰') || text.startsWith('🔑')) {
      cell.font = { bold: true, color: { argb: 'FF8B5CF6' } };
    } else {
      cell.font = { color: { argb: 'FF6B7280' } };
    }
  });

  // Query codes
  let currentRow = 4 + instructions.length + 2;

  queries.forEach((query, index) => {
    // Query header
    sheet.getCell(`B${currentRow}`).value = `📊 Query ${index + 1}: ${query.name}`;
    sheet.getCell(`B${currentRow}`).font = { bold: true, size: 12, color: { argb: 'FF059669' } };

    sheet.getCell(`B${currentRow + 1}`).value = query.description;
    sheet.getCell(`B${currentRow + 1}`).font = { italic: true, color: { argb: 'FF9CA3AF' } };

    // Code box
    const codeStartRow = currentRow + 2;
    const codeLines = query.code.trim().split('\n');

    codeLines.forEach((line, i) => {
      const cell = sheet.getCell(`C${codeStartRow + i}`);
      cell.value = line;
      cell.font = { name: 'Consolas', size: 10, color: { argb: 'FFD1D5DB' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
    });

    currentRow = codeStartRow + codeLines.length + 3;
  });

  // Video tutorial link
  sheet.getCell(`B${currentRow}`).value = '🎥 VIDEO TUTORIAL:';
  sheet.getCell(`B${currentRow}`).font = { bold: true };
  sheet.getCell(`C${currentRow}`).value = 'https://cryptoreportkit.com/tutorials/power-query';
  sheet.getCell(`C${currentRow}`).font = { color: { argb: 'FF3B82F6' }, underline: true };
}

/**
 * Generates all Power Query codes for a dashboard type
 */
export function generateQueriesForDashboard(
  dashboardType: string,
  coins: string[] = ['bitcoin', 'ethereum', 'solana']
): { name: string; code: string; description: string }[] {
  const queries: { name: string; code: string; description: string }[] = [];

  // Always include market data
  queries.push({
    name: 'CRK_Market',
    code: POWER_QUERY_TEMPLATES.market(100),
    description: 'Top 100 cryptocurrencies with price, market cap, and volume',
  });

  // Add based on dashboard type
  switch (dashboardType) {
    case 'complete-suite':
    case 'market-overview':
      queries.push({
        name: 'CRK_Global',
        code: POWER_QUERY_TEMPLATES.global(),
        description: 'Global crypto market statistics',
      });
      queries.push({
        name: 'CRK_Trending',
        code: POWER_QUERY_TEMPLATES.trending(),
        description: 'Currently trending cryptocurrencies',
      });
      break;

    case 'fear-greed':
      queries.push({
        name: 'CRK_FearGreed',
        code: POWER_QUERY_TEMPLATES.fearGreed(90),
        description: 'Fear & Greed Index with 90-day history',
      });
      break;

    case 'technical-analysis':
    case 'bitcoin-dashboard':
      queries.push({
        name: 'CRK_BTC_OHLC',
        code: POWER_QUERY_TEMPLATES.ohlc('bitcoin', 30),
        description: 'Bitcoin OHLC candlestick data (30 days)',
      });
      queries.push({
        name: 'CRK_Bitcoin',
        code: POWER_QUERY_TEMPLATES.coin('bitcoin'),
        description: 'Bitcoin detailed information',
      });
      break;

    case 'ethereum-dashboard':
      queries.push({
        name: 'CRK_ETH_OHLC',
        code: POWER_QUERY_TEMPLATES.ohlc('ethereum', 30),
        description: 'Ethereum OHLC candlestick data (30 days)',
      });
      queries.push({
        name: 'CRK_Ethereum',
        code: POWER_QUERY_TEMPLATES.coin('ethereum'),
        description: 'Ethereum detailed information',
      });
      break;

    case 'portfolio-tracker':
    case 'custom':
      queries.push({
        name: 'CRK_Watchlist',
        code: POWER_QUERY_TEMPLATES.watchlist(coins),
        description: `Your custom watchlist: ${coins.join(', ')}`,
      });
      break;

    case 'exchanges':
      queries.push({
        name: 'CRK_Exchanges',
        code: POWER_QUERY_TEMPLATES.exchanges(),
        description: 'Top cryptocurrency exchanges',
      });
      break;
  }

  return queries;
}
