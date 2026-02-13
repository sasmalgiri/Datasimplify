/**
 * CRK Formula Templates
 *
 * Pre-built template definitions using CRK custom functions.
 * These templates are pre-filled with CRK formulas in cells.
 */

import ExcelJS from 'exceljs';

const COLORS = {
  headerBg: '111827',
  headerText: 'FFFFFF',
  emerald: '10B981',
  emeraldDark: '059669',
  bgDark: '1F2937',
  textLight: 'D1D5DB',
  positive: '10B981',
  negative: 'EF4444',
};

function styleHeader(row: ExcelJS.Row) {
  row.font = { bold: true, color: { argb: COLORS.headerText }, size: 11 };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.headerBg } };
  row.alignment = { horizontal: 'center' };
  row.height = 24;
}

export interface CrkTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  functions: string[];
}

export const CRK_TEMPLATES: CrkTemplate[] = [
  {
    id: 'portfolio-tracker',
    name: 'Portfolio Tracker',
    description: 'Track holdings, current values, and PNL with live CRK formulas',
    icon: '💼',
    functions: ['PORTFOLIO_LIST', 'PORTFOLIO_VALUE', 'PORTFOLIO_PNL'],
  },
  {
    id: 'crypto-screener',
    name: 'Crypto Screener',
    description: 'Top 50 coins with price, change, volume sorted by market cap',
    icon: '🔍',
    functions: ['TOP', 'GAINERS', 'LOSERS'],
  },
  {
    id: 'technical-dashboard',
    name: 'Technical Dashboard',
    description: 'RSI, SMA, EMA, MACD, Bollinger Bands for top 10 coins',
    icon: '📈',
    functions: ['PRICE', 'RSI', 'SMA', 'EMA', 'BB', 'MACD'],
  },
  {
    id: 'defi-monitor',
    name: 'DeFi Monitor',
    description: 'DeFi protocols TVL, global stats, and top pools',
    icon: '🏦',
    functions: ['TVL', 'POOLS', 'DEFI_GLOBAL'],
  },
  {
    id: 'market-overview',
    name: 'Market Overview',
    description: 'Global stats, Fear & Greed, trending coins, BTC dominance',
    icon: '🌍',
    functions: ['GLOBAL', 'FEARGREED', 'TRENDING', 'BTCDOM', 'STABLECOINS'],
  },
];

const TOP_10_COINS = [
  'bitcoin', 'ethereum', 'tether', 'binancecoin', 'solana',
  'xrp', 'dogecoin', 'cardano', 'avalanche-2', 'polkadot',
];

const TOP_DEFI = [
  'lido', 'aave', 'makerdao', 'uniswap', 'curve-finance',
  'compound', 'rocket-pool', 'instadapp', 'convex-finance', 'balancer',
];

export async function generateCrkTemplate(templateId: string): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CryptoReportKit';
  workbook.created = new Date();

  switch (templateId) {
    case 'portfolio-tracker':
      await buildPortfolioTracker(workbook);
      break;
    case 'crypto-screener':
      await buildCryptoScreener(workbook);
      break;
    case 'technical-dashboard':
      await buildTechnicalDashboard(workbook);
      break;
    case 'defi-monitor':
      await buildDefiMonitor(workbook);
      break;
    case 'market-overview':
      await buildMarketOverview(workbook);
      break;
    default:
      throw new Error('Unknown template: ' + templateId);
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as unknown as Buffer;
}

async function buildPortfolioTracker(workbook: ExcelJS.Workbook) {
  workbook.title = 'CRK Portfolio Tracker';

  // Instructions sheet
  const intro = workbook.addWorksheet('START HERE');
  intro.getColumn(1).width = 60;
  intro.addRow(['CRK Portfolio Tracker']);
  intro.getRow(1).font = { bold: true, size: 16, color: { argb: COLORS.emerald } };
  intro.addRow(['']);
  intro.addRow(['1. Data is prefetched and ready to use']);
  intro.addRow(['2. Add holdings: =CRK.PORTFOLIO_ADD("bitcoin", 0.5, 45000)']);
  intro.addRow(['3. Go to "Portfolio" sheet to see live values']);
  intro.addRow(['4. Go to "Tax" sheet for cost basis and gains']);
  intro.addRow(['']);
  intro.addRow(['Quick Add Examples:']);
  intro.addRow(['=CRK.PORTFOLIO_ADD("bitcoin", 1, 42000, "2024-01-15")']);
  intro.addRow(['=CRK.PORTFOLIO_ADD("ethereum", 10, 2200, "2024-03-01")']);
  intro.addRow(['=CRK.PORTFOLIO_ADD("solana", 50, 120, "2024-06-15")']);

  // Portfolio sheet
  const portfolio = workbook.addWorksheet('Portfolio');
  portfolio.getColumn(1).width = 20;
  portfolio.getColumn(2).width = 18;

  const summaryRow1 = portfolio.addRow(['Total Value', '=CRK.PORTFOLIO_VALUE()']);
  summaryRow1.font = { bold: true, size: 14 };
  const summaryRow2 = portfolio.addRow(['Total PNL', '=CRK.PORTFOLIO_PNL()']);
  summaryRow2.font = { bold: true, size: 14 };
  const summaryRow3 = portfolio.addRow(['Cache Status', '=CRK.CACHE_STATUS()']);
  summaryRow3.font = { size: 10, color: { argb: '6B7280' } };
  portfolio.addRow([]);

  const listHeader = portfolio.addRow(['Holdings (auto-populated by CRK.PORTFOLIO_LIST)']);
  listHeader.font = { bold: true, size: 12, color: { argb: COLORS.emerald } };
  portfolio.addRow([]);

  // The PORTFOLIO_LIST formula spills into cells below
  portfolio.getCell('A7').value = { formula: 'CRK.PORTFOLIO_LIST()' };

  // Tax sheet
  const tax = workbook.addWorksheet('Tax');
  tax.getColumn(1).width = 20;
  tax.getColumn(2).width = 18;
  const taxTitle = tax.addRow(['Tax Summary']);
  taxTitle.font = { bold: true, size: 14, color: { argb: COLORS.emerald } };
  tax.addRow([]);
  tax.getCell('A3').value = { formula: 'CRK.TAX_SUMMARY()' };
}

async function buildCryptoScreener(workbook: ExcelJS.Workbook) {
  workbook.title = 'CRK Crypto Screener';

  const top = workbook.addWorksheet('Top 50');
  top.getColumn(1).width = 25;
  const topTitle = top.addRow(['Top 50 Coins by Market Cap']);
  topTitle.font = { bold: true, size: 14, color: { argb: COLORS.emerald } };
  top.addRow([]);
  top.getCell('A3').value = { formula: 'CRK.TOP(50)' };

  const gainers = workbook.addWorksheet('Gainers');
  gainers.getColumn(1).width = 25;
  const gTitle = gainers.addRow(['Top 20 Gainers (24h)']);
  gTitle.font = { bold: true, size: 14, color: { argb: COLORS.positive } };
  gainers.addRow([]);
  gainers.getCell('A3').value = { formula: 'CRK.GAINERS(20)' };

  const losers = workbook.addWorksheet('Losers');
  losers.getColumn(1).width = 25;
  const lTitle = losers.addRow(['Top 20 Losers (24h)']);
  lTitle.font = { bold: true, size: 14, color: { argb: COLORS.negative } };
  losers.addRow([]);
  losers.getCell('A3').value = { formula: 'CRK.LOSERS(20)' };
}

async function buildTechnicalDashboard(workbook: ExcelJS.Workbook) {
  workbook.title = 'CRK Technical Dashboard';

  const sheet = workbook.addWorksheet('Technical');
  const headers = ['Coin', 'Price', 'RSI(14)', 'SMA(20)', 'EMA(20)', 'BB Upper', 'BB Lower', 'MACD'];
  sheet.columns = headers.map((h, i) => ({ width: i === 0 ? 18 : 14 }));

  const headerRow = sheet.addRow(headers);
  styleHeader(headerRow);

  for (let i = 0; i < TOP_10_COINS.length; i++) {
    const coin = TOP_10_COINS[i];
    const row = i + 2; // 1-indexed, after header
    sheet.getCell(`A${row}`).value = coin;
    sheet.getCell(`B${row}`).value = { formula: `CRK.PRICE("${coin}")` };
    sheet.getCell(`C${row}`).value = { formula: `CRK.RSI("${coin}", 14)` };
    sheet.getCell(`D${row}`).value = { formula: `CRK.SMA("${coin}", 20)` };
    sheet.getCell(`E${row}`).value = { formula: `CRK.EMA("${coin}", 20)` };
    sheet.getCell(`F${row}`).value = { formula: `CRK.BB("${coin}", "upper", 20)` };
    sheet.getCell(`G${row}`).value = { formula: `CRK.BB("${coin}", "lower", 20)` };
    sheet.getCell(`H${row}`).value = { formula: `CRK.MACD("${coin}")` };
  }
}

async function buildDefiMonitor(workbook: ExcelJS.Workbook) {
  workbook.title = 'CRK DeFi Monitor';

  // Global DeFi stats
  const global = workbook.addWorksheet('DeFi Global');
  global.getColumn(1).width = 25;
  global.getColumn(2).width = 20;
  const gTitle = global.addRow(['DeFi Global Statistics']);
  gTitle.font = { bold: true, size: 14, color: { argb: COLORS.emerald } };
  global.addRow([]);
  global.addRow(['Total DeFi Market Cap', { formula: 'CRK.DEFI_GLOBAL("market_cap")' }]);
  global.addRow(['DeFi Trading Volume', { formula: 'CRK.DEFI_GLOBAL("volume")' }]);
  global.addRow(['DeFi Dominance', { formula: 'CRK.DEFI_GLOBAL("dominance")' }]);

  // TVL sheet
  const tvl = workbook.addWorksheet('Protocol TVL');
  tvl.columns = [{ width: 20 }, { width: 18 }];
  const tvlHeader = tvl.addRow(['Protocol', 'TVL (USD)']);
  styleHeader(tvlHeader);

  for (let i = 0; i < TOP_DEFI.length; i++) {
    const protocol = TOP_DEFI[i];
    const row = i + 2;
    tvl.getCell(`A${row}`).value = protocol;
    tvl.getCell(`B${row}`).value = { formula: `CRK.TVL("${protocol}")` };
  }

  // Pools sheet
  const pools = workbook.addWorksheet('Top Pools');
  const pTitle = pools.addRow(['Top DEX Pools (Ethereum)']);
  pTitle.font = { bold: true, size: 14, color: { argb: COLORS.emerald } };
  pools.addRow([]);
  pools.getCell('A3').value = { formula: 'CRK.POOLS("eth", 20)' };
}

async function buildMarketOverview(workbook: ExcelJS.Workbook) {
  workbook.title = 'CRK Market Overview';

  const sheet = workbook.addWorksheet('Overview');
  sheet.getColumn(1).width = 30;
  sheet.getColumn(2).width = 25;

  const title = sheet.addRow(['Crypto Market Overview']);
  title.font = { bold: true, size: 16, color: { argb: COLORS.emerald } };
  sheet.addRow([]);

  // Global metrics
  const metricsTitle = sheet.addRow(['Global Metrics']);
  metricsTitle.font = { bold: true, size: 13 };
  sheet.addRow(['Total Market Cap', { formula: 'CRK.GLOBAL("total_market_cap")' }]);
  sheet.addRow(['24h Volume', { formula: 'CRK.GLOBAL("total_volume")' }]);
  sheet.addRow(['BTC Dominance', { formula: 'CRK.BTCDOM()' }]);
  sheet.addRow(['Fear & Greed Index', { formula: 'CRK.FEARGREED()' }]);
  sheet.addRow(['Fear & Greed Label', { formula: 'CRK.FEARGREED("class")' }]);
  sheet.addRow([]);

  // Trending
  const trendTitle = sheet.addRow(['Trending Coins']);
  trendTitle.font = { bold: true, size: 13 };
  sheet.getCell('A11').value = { formula: 'CRK.TRENDING(7)' };

  // Stablecoins on separate sheet
  const stables = workbook.addWorksheet('Stablecoins');
  const sTitle = stables.addRow(['Top Stablecoins']);
  sTitle.font = { bold: true, size: 14, color: { argb: COLORS.emerald } };
  stables.addRow([]);
  stables.getCell('A3').value = { formula: 'CRK.STABLECOINS(20)' };
}
