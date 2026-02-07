/**
 * Power Query Excel Template Generator
 *
 * Generates Excel files with Power Query connections using user's API key.
 * Supports multiple dashboard templates.
 */

import { NextRequest, NextResponse } from 'next/server';
import ExcelJS from 'exceljs';

// Dashboard template types
type DashboardType =
  | 'market-overview'
  | 'portfolio-tracker'
  | 'technical-analysis'
  | 'defi-dashboard'
  | 'fear-greed'
  | 'gainers-losers'
  | 'trending'
  | 'custom';

interface GenerateRequest {
  dashboard: DashboardType;
  apiKey?: string;
  keyType?: 'demo' | 'pro';
  coins?: string[];
  limit?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { dashboard, apiKey, keyType = 'demo', coins, limit = 100 } = body;

    if (!dashboard) {
      return NextResponse.json({ error: 'dashboard type required' }, { status: 400 });
    }

    // Generate the Excel template
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'CryptoReportKit';
    workbook.created = new Date();

    // Add dashboard-specific sheets
    switch (dashboard) {
      case 'market-overview':
        await addMarketOverviewSheets(workbook, apiKey, keyType, limit);
        break;
      case 'portfolio-tracker':
        await addPortfolioTrackerSheets(workbook, apiKey, keyType, coins || ['bitcoin', 'ethereum', 'solana']);
        break;
      case 'technical-analysis':
        await addTechnicalAnalysisSheets(workbook, apiKey, keyType, coins?.[0] || 'bitcoin');
        break;
      case 'defi-dashboard':
        await addDeFiDashboardSheets(workbook, apiKey, keyType);
        break;
      case 'fear-greed':
        await addFearGreedSheets(workbook, apiKey, keyType);
        break;
      case 'gainers-losers':
        await addGainersLosersSheets(workbook, apiKey, keyType);
        break;
      case 'trending':
        await addTrendingSheets(workbook, apiKey, keyType);
        break;
      case 'custom':
        await addCustomSheets(workbook, apiKey, keyType, coins || [], limit);
        break;
      default:
        return NextResponse.json({ error: 'Invalid dashboard type' }, { status: 400 });
    }

    // Add instructions sheet
    addInstructionsSheet(workbook, dashboard, apiKey);

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="CRK_${dashboard}_${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    });
  } catch (error) {
    console.error('[Generate] Error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}

// ============================================
// MARKET OVERVIEW DASHBOARD
// ============================================
async function addMarketOverviewSheets(
  workbook: ExcelJS.Workbook,
  apiKey: string | undefined,
  keyType: string,
  limit: number
) {
  // Global Stats Sheet
  const globalSheet = workbook.addWorksheet('Global Stats');
  globalSheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 25 },
  ];

  const globalData = [
    { metric: 'Total Market Cap', value: '=PowerQuery_Global[TotalMarketCapUSD]' },
    { metric: 'Total Volume 24h', value: '=PowerQuery_Global[TotalVolumeUSD]' },
    { metric: 'Market Cap Change 24h', value: '=PowerQuery_Global[MarketCapChange24h]' },
    { metric: 'BTC Dominance', value: '=PowerQuery_Global[BTCDominance]' },
    { metric: 'ETH Dominance', value: '=PowerQuery_Global[ETHDominance]' },
    { metric: 'Active Cryptocurrencies', value: '=PowerQuery_Global[ActiveCryptocurrencies]' },
  ];

  globalData.forEach(row => globalSheet.addRow(row));
  styleHeaderRow(globalSheet);

  // Top Coins Sheet
  const marketSheet = workbook.addWorksheet('Top Coins');
  marketSheet.columns = [
    { header: 'Rank', key: 'rank', width: 8 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Symbol', key: 'symbol', width: 10 },
    { header: 'Price', key: 'price', width: 15 },
    { header: 'Market Cap', key: 'marketCap', width: 18 },
    { header: 'Volume 24h', key: 'volume', width: 18 },
    { header: 'Change 24h', key: 'change24h', width: 12 },
    { header: 'Change 7d', key: 'change7d', width: 12 },
  ];

  // Add placeholder rows - Power Query will populate
  for (let i = 1; i <= Math.min(limit, 100); i++) {
    marketSheet.addRow({
      rank: i,
      name: `=INDEX(PowerQuery_Market[Name],${i})`,
      symbol: `=INDEX(PowerQuery_Market[Symbol],${i})`,
      price: `=INDEX(PowerQuery_Market[Price],${i})`,
      marketCap: `=INDEX(PowerQuery_Market[MarketCap],${i})`,
      volume: `=INDEX(PowerQuery_Market[Volume24h],${i})`,
      change24h: `=INDEX(PowerQuery_Market[Change24h],${i})`,
      change7d: `=INDEX(PowerQuery_Market[Change7d],${i})`,
    });
  }

  styleHeaderRow(marketSheet);

  // Power Query Setup Sheet
  addPowerQuerySetupSheet(workbook, 'market', apiKey, keyType, limit);
}

// ============================================
// PORTFOLIO TRACKER
// ============================================
async function addPortfolioTrackerSheets(
  workbook: ExcelJS.Workbook,
  apiKey: string | undefined,
  keyType: string,
  coins: string[]
) {
  const sheet = workbook.addWorksheet('Portfolio');
  sheet.columns = [
    { header: 'Coin', key: 'coin', width: 15 },
    { header: 'Holdings', key: 'holdings', width: 12 },
    { header: 'Price', key: 'price', width: 15 },
    { header: 'Value', key: 'value', width: 15 },
    { header: 'Change 24h', key: 'change24h', width: 12 },
    { header: 'Change 7d', key: 'change7d', width: 12 },
    { header: 'P/L 24h', key: 'pl24h', width: 15 },
    { header: 'ATH', key: 'ath', width: 15 },
    { header: 'From ATH %', key: 'fromAth', width: 12 },
  ];

  // Default portfolio coins
  const defaultCoins = coins.length > 0 ? coins : ['bitcoin', 'ethereum', 'solana', 'cardano', 'polkadot'];

  defaultCoins.forEach((coin, i) => {
    const row = i + 2;
    sheet.addRow({
      coin: coin.charAt(0).toUpperCase() + coin.slice(1),
      holdings: 1, // User edits this
      price: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[Price],1),"Loading...")`,
      value: `=B${row}*C${row}`,
      change24h: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[Change24h],1),"")`,
      change7d: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[Change7d],1),"")`,
      pl24h: `=D${row}*(E${row}/100)`,
      ath: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[ATH],1),"")`,
      fromAth: `=IFERROR((C${row}-H${row})/H${row}*100,"")`,
    });
  });

  // Summary row
  const lastRow = defaultCoins.length + 2;
  sheet.addRow({});
  sheet.addRow({
    coin: 'TOTAL',
    holdings: '',
    price: '',
    value: `=SUM(D2:D${lastRow - 1})`,
    change24h: '',
    change7d: '',
    pl24h: `=SUM(G2:G${lastRow - 1})`,
    ath: '',
    fromAth: '',
  });

  styleHeaderRow(sheet);

  // Add Power Query connections for each coin
  addPortfolioPowerQuerySheet(workbook, defaultCoins, apiKey, keyType);
}

// ============================================
// TECHNICAL ANALYSIS
// ============================================
async function addTechnicalAnalysisSheets(
  workbook: ExcelJS.Workbook,
  apiKey: string | undefined,
  keyType: string,
  coin: string
) {
  // OHLC Data Sheet
  const ohlcSheet = workbook.addWorksheet('OHLC Data');
  ohlcSheet.columns = [
    { header: 'Date', key: 'date', width: 20 },
    { header: 'Open', key: 'open', width: 12 },
    { header: 'High', key: 'high', width: 12 },
    { header: 'Low', key: 'low', width: 12 },
    { header: 'Close', key: 'close', width: 12 },
    { header: 'SMA 20', key: 'sma20', width: 12 },
    { header: 'EMA 12', key: 'ema12', width: 12 },
    { header: 'RSI 14', key: 'rsi14', width: 12 },
  ];

  // Placeholder - Power Query fills this
  for (let i = 1; i <= 30; i++) {
    ohlcSheet.addRow({
      date: `=IFERROR(INDEX(PowerQuery_OHLC[Date],${i}),"")`,
      open: `=IFERROR(INDEX(PowerQuery_OHLC[Open],${i}),"")`,
      high: `=IFERROR(INDEX(PowerQuery_OHLC[High],${i}),"")`,
      low: `=IFERROR(INDEX(PowerQuery_OHLC[Low],${i}),"")`,
      close: `=IFERROR(INDEX(PowerQuery_OHLC[Close],${i}),"")`,
      sma20: i >= 20 ? `=AVERAGE(E${i - 18}:E${i + 1})` : '',
      ema12: '',
      rsi14: '',
    });
  }

  styleHeaderRow(ohlcSheet);

  // Summary Sheet
  const summarySheet = workbook.addWorksheet('Technical Summary');
  summarySheet.columns = [
    { header: 'Indicator', key: 'indicator', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
    { header: 'Signal', key: 'signal', width: 15 },
  ];

  const technicalData = [
    { indicator: `${coin.toUpperCase()} Current Price`, value: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[Price],1),"")`, signal: '' },
    { indicator: 'SMA 20', value: `=AVERAGE('OHLC Data'!E2:E21)`, signal: `=IF(E2>E3,"Bullish","Bearish")` },
    { indicator: 'Highest in 30 days', value: `=MAX('OHLC Data'!C2:C31)`, signal: '' },
    { indicator: 'Lowest in 30 days', value: `=MIN('OHLC Data'!D2:D31)`, signal: '' },
    { indicator: 'ATH', value: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[ATH],1),"")`, signal: '' },
    { indicator: 'Distance from ATH', value: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[ATHChange],1),"")`, signal: '' },
  ];

  technicalData.forEach(row => summarySheet.addRow(row));
  styleHeaderRow(summarySheet);

  // Add Power Query setup
  addTechnicalPowerQuerySheet(workbook, coin, apiKey, keyType);
}

// ============================================
// DEFI DASHBOARD
// ============================================
async function addDeFiDashboardSheets(
  workbook: ExcelJS.Workbook,
  apiKey: string | undefined,
  keyType: string
) {
  const sheet = workbook.addWorksheet('DeFi Protocols');
  sheet.columns = [
    { header: 'Rank', key: 'rank', width: 8 },
    { header: 'Protocol', key: 'name', width: 25 },
    { header: 'Symbol', key: 'symbol', width: 10 },
    { header: 'Price', key: 'price', width: 15 },
    { header: 'Market Cap', key: 'marketCap', width: 18 },
    { header: 'Change 24h', key: 'change24h', width: 12 },
  ];

  // DeFi coins - Power Query populates
  for (let i = 1; i <= 50; i++) {
    sheet.addRow({
      rank: i,
      name: `=IFERROR(INDEX(PowerQuery_DeFi[Name],${i}),"")`,
      symbol: `=IFERROR(INDEX(PowerQuery_DeFi[Symbol],${i}),"")`,
      price: `=IFERROR(INDEX(PowerQuery_DeFi[Price],${i}),"")`,
      marketCap: `=IFERROR(INDEX(PowerQuery_DeFi[MarketCap],${i}),"")`,
      change24h: `=IFERROR(INDEX(PowerQuery_DeFi[Change24h],${i}),"")`,
    });
  }

  styleHeaderRow(sheet);
  addDeFiPowerQuerySheet(workbook, apiKey, keyType);
}

// ============================================
// FEAR & GREED
// ============================================
async function addFearGreedSheets(
  workbook: ExcelJS.Workbook,
  apiKey: string | undefined,
  keyType: string
) {
  const sheet = workbook.addWorksheet('Fear & Greed Index');
  sheet.columns = [
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Value', key: 'value', width: 10 },
    { header: 'Classification', key: 'classification', width: 20 },
  ];

  // 30 days of Fear & Greed data
  for (let i = 1; i <= 30; i++) {
    sheet.addRow({
      date: `=IFERROR(INDEX(PowerQuery_FearGreed[Date],${i}),"")`,
      value: `=IFERROR(INDEX(PowerQuery_FearGreed[Value],${i}),"")`,
      classification: `=IFERROR(INDEX(PowerQuery_FearGreed[Classification],${i}),"")`,
    });
  }

  styleHeaderRow(sheet);

  // Summary sheet
  const summarySheet = workbook.addWorksheet('FG Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 25 },
    { header: 'Value', key: 'value', width: 20 },
  ];

  summarySheet.addRow({ metric: 'Current Index', value: `='Fear & Greed Index'!B2` });
  summarySheet.addRow({ metric: 'Current Classification', value: `='Fear & Greed Index'!C2` });
  summarySheet.addRow({ metric: 'Average (30 days)', value: `=AVERAGE('Fear & Greed Index'!B2:B31)` });
  summarySheet.addRow({ metric: 'High (30 days)', value: `=MAX('Fear & Greed Index'!B2:B31)` });
  summarySheet.addRow({ metric: 'Low (30 days)', value: `=MIN('Fear & Greed Index'!B2:B31)` });

  styleHeaderRow(summarySheet);
  addFearGreedPowerQuerySheet(workbook, apiKey, keyType);
}

// ============================================
// GAINERS & LOSERS
// ============================================
async function addGainersLosersSheets(
  workbook: ExcelJS.Workbook,
  apiKey: string | undefined,
  keyType: string
) {
  // Top Gainers Sheet
  const gainersSheet = workbook.addWorksheet('Top Gainers');
  gainersSheet.columns = [
    { header: '#', key: 'rank', width: 5 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Symbol', key: 'symbol', width: 10 },
    { header: 'Price', key: 'price', width: 15 },
    { header: 'Change 24h', key: 'change24h', width: 12 },
  ];

  for (let i = 1; i <= 20; i++) {
    gainersSheet.addRow({
      rank: i,
      name: `=IFERROR(INDEX(PowerQuery_Gainers[Name],${i}),"")`,
      symbol: `=IFERROR(INDEX(PowerQuery_Gainers[Symbol],${i}),"")`,
      price: `=IFERROR(INDEX(PowerQuery_Gainers[Price],${i}),"")`,
      change24h: `=IFERROR(INDEX(PowerQuery_Gainers[Change24h],${i}),"")`,
    });
  }

  styleHeaderRow(gainersSheet);

  // Top Losers Sheet
  const losersSheet = workbook.addWorksheet('Top Losers');
  losersSheet.columns = [
    { header: '#', key: 'rank', width: 5 },
    { header: 'Name', key: 'name', width: 20 },
    { header: 'Symbol', key: 'symbol', width: 10 },
    { header: 'Price', key: 'price', width: 15 },
    { header: 'Change 24h', key: 'change24h', width: 12 },
  ];

  for (let i = 1; i <= 20; i++) {
    losersSheet.addRow({
      rank: i,
      name: `=IFERROR(INDEX(PowerQuery_Losers[Name],${i}),"")`,
      symbol: `=IFERROR(INDEX(PowerQuery_Losers[Symbol],${i}),"")`,
      price: `=IFERROR(INDEX(PowerQuery_Losers[Price],${i}),"")`,
      change24h: `=IFERROR(INDEX(PowerQuery_Losers[Change24h],${i}),"")`,
    });
  }

  styleHeaderRow(losersSheet);
  addGainersLosersPowerQuerySheet(workbook, apiKey, keyType);
}

// ============================================
// TRENDING
// ============================================
async function addTrendingSheets(
  workbook: ExcelJS.Workbook,
  apiKey: string | undefined,
  keyType: string
) {
  const sheet = workbook.addWorksheet('Trending Coins');
  sheet.columns = [
    { header: 'Trend Rank', key: 'rank', width: 12 },
    { header: 'Name', key: 'name', width: 25 },
    { header: 'Symbol', key: 'symbol', width: 10 },
    { header: 'Market Cap Rank', key: 'mcRank', width: 15 },
  ];

  for (let i = 1; i <= 15; i++) {
    sheet.addRow({
      rank: i,
      name: `=IFERROR(INDEX(PowerQuery_Trending[Name],${i}),"")`,
      symbol: `=IFERROR(INDEX(PowerQuery_Trending[Symbol],${i}),"")`,
      mcRank: `=IFERROR(INDEX(PowerQuery_Trending[MarketCapRank],${i}),"")`,
    });
  }

  styleHeaderRow(sheet);
  addTrendingPowerQuerySheet(workbook, apiKey, keyType);
}

// ============================================
// CUSTOM DASHBOARD
// ============================================
async function addCustomSheets(
  workbook: ExcelJS.Workbook,
  apiKey: string | undefined,
  keyType: string,
  coins: string[],
  limit: number
) {
  // Market data for selected coins
  const sheet = workbook.addWorksheet('Custom Watchlist');
  sheet.columns = [
    { header: 'Coin', key: 'coin', width: 15 },
    { header: 'Price', key: 'price', width: 15 },
    { header: 'Market Cap', key: 'marketCap', width: 18 },
    { header: 'Volume 24h', key: 'volume', width: 18 },
    { header: 'Change 24h', key: 'change24h', width: 12 },
    { header: 'Change 7d', key: 'change7d', width: 12 },
    { header: 'ATH', key: 'ath', width: 15 },
  ];

  const selectedCoins = coins.length > 0 ? coins : ['bitcoin', 'ethereum'];

  selectedCoins.forEach(coin => {
    sheet.addRow({
      coin: coin.charAt(0).toUpperCase() + coin.slice(1),
      price: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[Price],1),"")`,
      marketCap: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[MarketCap],1),"")`,
      volume: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[Volume24h],1),"")`,
      change24h: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[Change24h],1),"")`,
      change7d: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[Change7d],1),"")`,
      ath: `=IFERROR(INDEX(PowerQuery_Coin_${coin}[ATH],1),"")`,
    });
  });

  styleHeaderRow(sheet);
  addCustomPowerQuerySheet(workbook, selectedCoins, apiKey, keyType);
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function styleHeaderRow(sheet: ExcelJS.Worksheet) {
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' },
  };
  headerRow.alignment = { horizontal: 'center' };
}

function addInstructionsSheet(workbook: ExcelJS.Workbook, dashboard: string, apiKey: string | undefined) {
  const sheet = workbook.addWorksheet('Instructions');
  sheet.getColumn(1).width = 80;

  const instructions = [
    ['CryptoReportKit - Power Query Dashboard'],
    [''],
    [`Dashboard Type: ${dashboard.toUpperCase()}`],
    [`Generated: ${new Date().toISOString()}`],
    [`API Key: ${apiKey ? 'Configured ✓' : 'Using free tier (rate limited)'}`],
    [''],
    ['HOW TO REFRESH DATA:'],
    ['1. Go to Data tab → Refresh All'],
    ['2. Or right-click any table → Refresh'],
    ['3. Data refreshes from CoinGecko API'],
    [''],
    ['POWER QUERY CONNECTIONS:'],
    ['This workbook uses Power Query to fetch live crypto data.'],
    ['Go to Data → Queries & Connections to see all connections.'],
    [''],
    ['TROUBLESHOOTING:'],
    ['- If #N/A errors appear, refresh the data (Data → Refresh All)'],
    ['- Rate limit errors: Wait 1 minute, then refresh'],
    ['- For higher limits: Use a CoinGecko Pro API key'],
    [''],
    ['MORE TEMPLATES: https://cryptoreportkit.com/templates'],
    ['DOCUMENTATION: https://cryptoreportkit.com/docs'],
  ];

  instructions.forEach(row => sheet.addRow(row));
  sheet.getRow(1).font = { bold: true, size: 16 };
}

function addPowerQuerySetupSheet(workbook: ExcelJS.Workbook, type: string, apiKey: string | undefined, keyType: string, limit: number) {
  const sheet = workbook.addWorksheet('_PowerQuery_Config');
  sheet.state = 'hidden'; // Hide config sheet

  const baseUrl = 'https://cryptoreportkit.com/api/powerquery';

  sheet.addRow(['Query Name', 'URL', 'Table Name']);
  sheet.addRow(['Market Data', `${baseUrl}/market?limit=${limit}`, 'PowerQuery_Market']);
  sheet.addRow(['Global Stats', `${baseUrl}/global`, 'PowerQuery_Global']);
}

function addPortfolioPowerQuerySheet(workbook: ExcelJS.Workbook, coins: string[], apiKey: string | undefined, keyType: string) {
  const sheet = workbook.addWorksheet('_PowerQuery_Config');
  sheet.state = 'hidden';

  const baseUrl = 'https://cryptoreportkit.com/api/powerquery';

  sheet.addRow(['Query Name', 'URL', 'Table Name']);
  coins.forEach(coin => {
    sheet.addRow([`Coin: ${coin}`, `${baseUrl}/coin?id=${coin}`, `PowerQuery_Coin_${coin}`]);
  });
}

function addTechnicalPowerQuerySheet(workbook: ExcelJS.Workbook, coin: string, apiKey: string | undefined, keyType: string) {
  const sheet = workbook.addWorksheet('_PowerQuery_Config');
  sheet.state = 'hidden';

  const baseUrl = 'https://cryptoreportkit.com/api/powerquery';

  sheet.addRow(['Query Name', 'URL', 'Table Name']);
  sheet.addRow([`Coin: ${coin}`, `${baseUrl}/coin?id=${coin}`, `PowerQuery_Coin_${coin}`]);
  sheet.addRow(['OHLC Data', `${baseUrl}/ohlc?coin=${coin}&days=30`, 'PowerQuery_OHLC']);
}

function addDeFiPowerQuerySheet(workbook: ExcelJS.Workbook, apiKey: string | undefined, keyType: string) {
  const sheet = workbook.addWorksheet('_PowerQuery_Config');
  sheet.state = 'hidden';

  sheet.addRow(['Query Name', 'URL', 'Table Name']);
  sheet.addRow(['DeFi Protocols', 'https://cryptoreportkit.com/api/powerquery/market?limit=100', 'PowerQuery_DeFi']);
}

function addFearGreedPowerQuerySheet(workbook: ExcelJS.Workbook, apiKey: string | undefined, keyType: string) {
  const sheet = workbook.addWorksheet('_PowerQuery_Config');
  sheet.state = 'hidden';

  sheet.addRow(['Query Name', 'URL', 'Table Name']);
  sheet.addRow(['Fear & Greed', 'https://cryptoreportkit.com/api/powerquery/feargreed?limit=30', 'PowerQuery_FearGreed']);
}

function addGainersLosersPowerQuerySheet(workbook: ExcelJS.Workbook, apiKey: string | undefined, keyType: string) {
  const sheet = workbook.addWorksheet('_PowerQuery_Config');
  sheet.state = 'hidden';

  sheet.addRow(['Query Name', 'URL', 'Table Name']);
  sheet.addRow(['Gainers', 'https://cryptoreportkit.com/api/powerquery/market?limit=250', 'PowerQuery_Gainers']);
  sheet.addRow(['Losers', 'https://cryptoreportkit.com/api/powerquery/market?limit=250', 'PowerQuery_Losers']);
}

function addTrendingPowerQuerySheet(workbook: ExcelJS.Workbook, apiKey: string | undefined, keyType: string) {
  const sheet = workbook.addWorksheet('_PowerQuery_Config');
  sheet.state = 'hidden';

  sheet.addRow(['Query Name', 'URL', 'Table Name']);
  sheet.addRow(['Trending', 'https://cryptoreportkit.com/api/powerquery/trending', 'PowerQuery_Trending']);
}

function addCustomPowerQuerySheet(workbook: ExcelJS.Workbook, coins: string[], apiKey: string | undefined, keyType: string) {
  const sheet = workbook.addWorksheet('_PowerQuery_Config');
  sheet.state = 'hidden';

  const baseUrl = 'https://cryptoreportkit.com/api/powerquery';

  sheet.addRow(['Query Name', 'URL', 'Table Name']);
  coins.forEach(coin => {
    sheet.addRow([`Coin: ${coin}`, `${baseUrl}/coin?id=${coin}`, `PowerQuery_Coin_${coin}`]);
  });
}
