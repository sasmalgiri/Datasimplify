/**
 * CRK Dashboard Sheets
 *
 * Adds CRK formula-powered dashboard sheets to downloaded templates.
 * These formulas work when the CRK Excel add-in is installed.
 * Without the add-in, formulas show #NAME! but Power Query still works.
 *
 * Dual-mode: same xlsx has both CRK formulas AND Power Query connections.
 */

import ExcelJS from 'exceljs';
import type { DashboardType } from './masterGenerator';

// ============================================
// STYLE CONSTANTS (matches website dark theme)
// ============================================

const C = {
  headerBg: '111827',
  headerText: 'FFFFFF',
  emerald: '10B981',
  emeraldDark: '059669',
  bgDark: '1F2937',
  textLight: 'D1D5DB',
  positive: '10B981',
  negative: 'EF4444',
  muted: '6B7280',
};

function styleTitle(row: ExcelJS.Row, color = C.emerald) {
  row.font = { bold: true, size: 16, color: { argb: color } };
  row.height = 28;
}

function styleSectionHeader(row: ExcelJS.Row) {
  row.font = { bold: true, size: 13, color: { argb: C.headerText } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: C.headerBg } };
  row.alignment = { horizontal: 'center' };
  row.height = 24;
}

function styleMetricLabel(cell: ExcelJS.Cell) {
  cell.font = { bold: true, size: 11, color: { argb: C.textLight } };
}

function styleMetricValue(cell: ExcelJS.Cell) {
  cell.font = { size: 12, color: { argb: C.emerald } };
}

function setColWidths(sheet: ExcelJS.Worksheet, widths: number[]) {
  widths.forEach((w, i) => { sheet.getColumn(i + 1).width = w; });
}

// ============================================
// FORMULA HELPERS
// ============================================

function crkFormula(formula: string): { formula: string } {
  return { formula: `CRK.${formula}` };
}

function spillFormula(sheet: ExcelJS.Worksheet, cell: string, formula: string) {
  sheet.getCell(cell).value = crkFormula(formula);
}

function metricRow(sheet: ExcelJS.Worksheet, row: number, label: string, formula: string) {
  const labelCell = sheet.getCell(`A${row}`);
  labelCell.value = label;
  styleMetricLabel(labelCell);
  const valueCell = sheet.getCell(`B${row}`);
  valueCell.value = crkFormula(formula);
  styleMetricValue(valueCell);
}

// ============================================
// MAIN ENTRY POINT
// ============================================

/**
 * Adds CRK formula dashboard sheets to a workbook based on dashboard type.
 * These sheets show live data when the CRK add-in is installed.
 * Without the add-in, they show #NAME! (Power Query still works separately).
 */
export function addCrkDashboardSheets(
  workbook: ExcelJS.Workbook,
  dashboard: DashboardType,
  coins: string[],
): void {
  switch (dashboard) {
    case 'market-overview':
      addMarketOverviewDashboard(workbook);
      break;
    case 'screener':
      addScreenerDashboard(workbook);
      break;
    case 'gainers-losers':
      addGainersLosersDashboard(workbook);
      break;
    case 'fear-greed':
      addFearGreedDashboard(workbook);
      break;
    case 'portfolio-tracker':
      addPortfolioDashboard(workbook);
      break;
    case 'trending':
      addTrendingDashboard(workbook);
      break;
    case 'technical-analysis':
      addTechnicalDashboard(workbook, coins);
      break;
    case 'defi-dashboard':
      addDefiDashboard(workbook);
      break;
    case 'derivatives':
    case 'funding-rates':
      addDerivativesDashboard(workbook);
      break;
    case 'correlation':
      addCorrelationDashboard(workbook, coins);
      break;
    case 'stablecoins':
      addStablecoinsDashboard(workbook);
      break;
    case 'exchanges':
      addExchangesDashboard(workbook);
      break;
    case 'bitcoin-dashboard':
      addBitcoinDashboard(workbook);
      break;
    case 'ethereum-dashboard':
      addEthereumDashboard(workbook);
      break;
    case 'nft-tracker':
      addNftDashboard(workbook);
      break;
    case 'whale-tracker':
    case 'on-chain':
      addOnChainDashboard(workbook, coins);
      break;
    case 'heatmap':
    case 'categories':
      addCategoriesDashboard(workbook);
      break;
    case 'etf-tracker':
      addEtfDashboard(workbook);
      break;
    case 'layer1-compare':
    case 'layer2-compare':
      addLayerCompareDashboard(workbook, coins);
      break;
    case 'meme-coins':
      addMemeCoinsDashboard(workbook);
      break;
    case 'ai-gaming':
      addAIGamingDashboard(workbook);
      break;
    case 'defi-yields':
      addDefiYieldsDashboard(workbook);
      break;
    case 'liquidations':
      addLiquidationsDashboard(workbook);
      break;
    case 'altcoin-season':
      addAltcoinSeasonDashboard(workbook);
      break;
    case 'token-unlocks':
      addTokenUnlocksDashboard(workbook, coins);
      break;
    case 'staking-yields':
      addStakingYieldsDashboard(workbook);
      break;
    case 'social-sentiment':
      addSocialSentimentDashboard(workbook);
      break;
    case 'mining-calc':
      addMiningDashboard(workbook);
      break;
    case 'exchange-reserves':
      addExchangeReservesDashboard(workbook);
      break;
    case 'custom':
      addCustomDashboard(workbook, coins);
      break;
    case 'volatility':
    case 'calculator':
      addVolatilityDashboard(workbook, coins);
      break;
    case 'rwa':
    case 'metaverse':
    case 'privacy-coins':
      addCategoryTokensDashboard(workbook, dashboard);
      break;
    case 'dev-activity':
      addDevActivityDashboard(workbook, coins);
      break;
    default:
      // Fallback: global metrics + top coins
      addMarketOverviewDashboard(workbook);
      break;
  }
}

// ============================================
// DASHBOARD BUILDERS
// ============================================

function addMarketOverviewDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Dashboard');
  setColWidths(sheet, [30, 25, 18]);

  styleTitle(sheet.addRow(['Crypto Market Overview']));
  sheet.addRow([]);

  // Global metrics
  const mh = sheet.addRow(['Global Metrics', '', '']);
  styleSectionHeader(mh);

  metricRow(sheet, 4, 'Total Market Cap', 'GLOBAL("total_market_cap")');
  metricRow(sheet, 5, '24h Volume', 'GLOBAL("total_volume")');
  metricRow(sheet, 6, 'BTC Dominance', 'BTCDOM()');
  metricRow(sheet, 7, 'Fear & Greed Index', 'FEARGREED()');
  metricRow(sheet, 8, 'Fear & Greed Label', 'FEARGREED("class")');
  sheet.addRow([]);

  // Top coins (spill)
  const topHeader = sheet.addRow(['Top 20 Coins by Market Cap']);
  topHeader.font = { bold: true, size: 13, color: { argb: C.emerald } };
  sheet.addRow([]);
  spillFormula(sheet, 'A12', 'TOP(20)');

  // Trending on separate sheet
  const trending = workbook.addWorksheet('CRK Trending');
  setColWidths(trending, [25, 20, 18]);
  styleTitle(trending.addRow(['Trending Coins']));
  trending.addRow([]);
  spillFormula(trending, 'A3', 'TRENDING(7)');
}

function addScreenerDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Screener');
  setColWidths(sheet, [25, 15, 15, 18, 15, 18]);
  styleTitle(sheet.addRow(['Top 50 Coins by Market Cap']));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', 'TOP(50)');

  const gainers = workbook.addWorksheet('CRK Gainers');
  setColWidths(gainers, [25, 15, 15, 18]);
  styleTitle(gainers.addRow(['Top 20 Gainers (24h)']));
  gainers.addRow([]);
  spillFormula(gainers, 'A3', 'GAINERS(20)');

  const losers = workbook.addWorksheet('CRK Losers');
  setColWidths(losers, [25, 15, 15, 18]);
  styleTitle(losers.addRow(['Top 20 Losers (24h)']));
  losers.addRow([]);
  spillFormula(losers, 'A3', 'LOSERS(20)');
}

function addGainersLosersDashboard(workbook: ExcelJS.Workbook) {
  const gainers = workbook.addWorksheet('CRK Gainers');
  setColWidths(gainers, [25, 15, 15, 18]);
  styleTitle(gainers.addRow(['Top 20 Gainers (24h)']));
  gainers.addRow([]);
  spillFormula(gainers, 'A3', 'GAINERS(20)');

  const losers = workbook.addWorksheet('CRK Losers');
  setColWidths(losers, [25, 15, 15, 18]);
  styleTitle(losers.addRow(['Top 20 Losers (24h)']));
  losers.addRow([]);
  spillFormula(losers, 'A3', 'LOSERS(20)');
}

function addFearGreedDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Fear & Greed');
  setColWidths(sheet, [30, 25]);
  styleTitle(sheet.addRow(['Fear & Greed Index']));
  sheet.addRow([]);
  metricRow(sheet, 3, 'Current Value', 'FEARGREED()');
  metricRow(sheet, 4, 'Classification', 'FEARGREED("class")');
  sheet.addRow([]);
  metricRow(sheet, 6, 'BTC Dominance', 'BTCDOM()');
  metricRow(sheet, 7, 'Total Market Cap', 'GLOBAL("total_market_cap")');
}

function addPortfolioDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Portfolio');
  setColWidths(sheet, [25, 20, 20]);
  styleTitle(sheet.addRow(['Portfolio Tracker']));
  sheet.addRow([]);
  metricRow(sheet, 3, 'Total Value', 'PORTFOLIO_VALUE()');
  metricRow(sheet, 4, 'Total PNL', 'PORTFOLIO_PNL()');
  sheet.addRow([]);

  const listHeader = sheet.addRow(['Holdings (auto-populated)']);
  listHeader.font = { bold: true, size: 12, color: { argb: C.emerald } };
  sheet.addRow([]);
  spillFormula(sheet, 'A8', 'PORTFOLIO_LIST()');

  // Tax summary
  const tax = workbook.addWorksheet('CRK Tax');
  setColWidths(tax, [25, 20]);
  styleTitle(tax.addRow(['Tax Summary']));
  tax.addRow([]);
  spillFormula(tax, 'A3', 'TAX_SUMMARY()');
}

function addTrendingDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Trending');
  setColWidths(sheet, [25, 20, 18]);
  styleTitle(sheet.addRow(['Trending Coins']));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', 'TRENDING(7)');
}

function addTechnicalDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  const sheet = workbook.addWorksheet('CRK Technical');
  const headers = ['Coin', 'Price', 'RSI(14)', 'SMA(20)', 'EMA(20)', 'BB Upper', 'BB Lower', 'MACD'];
  setColWidths(sheet, [18, 14, 14, 14, 14, 14, 14, 14]);

  styleTitle(sheet.addRow(['Technical Dashboard']));
  sheet.addRow([]);
  const headerRow = sheet.addRow(headers);
  styleSectionHeader(headerRow);

  const coinList = coins.length > 0 ? coins.slice(0, 10) : [
    'bitcoin', 'ethereum', 'solana', 'binancecoin', 'xrp',
    'cardano', 'dogecoin', 'polkadot', 'avalanche-2', 'chainlink',
  ];

  for (let i = 0; i < coinList.length; i++) {
    const coin = coinList[i];
    const row = i + 4;
    sheet.getCell(`A${row}`).value = coin;
    sheet.getCell(`B${row}`).value = crkFormula(`PRICE("${coin}")`);
    sheet.getCell(`C${row}`).value = crkFormula(`RSI("${coin}", 14)`);
    sheet.getCell(`D${row}`).value = crkFormula(`SMA("${coin}", 20)`);
    sheet.getCell(`E${row}`).value = crkFormula(`EMA("${coin}", 20)`);
    sheet.getCell(`F${row}`).value = crkFormula(`BB("${coin}", "upper", 20)`);
    sheet.getCell(`G${row}`).value = crkFormula(`BB("${coin}", "lower", 20)`);
    sheet.getCell(`H${row}`).value = crkFormula(`MACD("${coin}")`);
  }
}

function addDefiDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK DeFi');
  setColWidths(sheet, [30, 25]);
  styleTitle(sheet.addRow(['DeFi Dashboard']));
  sheet.addRow([]);
  metricRow(sheet, 3, 'DeFi Market Cap', 'DEFI_GLOBAL("market_cap")');
  metricRow(sheet, 4, 'DeFi Volume', 'DEFI_GLOBAL("volume")');
  metricRow(sheet, 5, 'DeFi Dominance', 'DEFI_GLOBAL("dominance")');
  sheet.addRow([]);

  const topTitle = sheet.addRow(['Top DeFi Protocols']);
  topTitle.font = { bold: true, size: 13, color: { argb: C.emerald } };
  sheet.addRow([]);
  spillFormula(sheet, 'A9', 'DEFI(50)');

  // Pools
  const pools = workbook.addWorksheet('CRK Pools');
  setColWidths(pools, [25, 20, 18, 15]);
  styleTitle(pools.addRow(['Top DEX Pools']));
  pools.addRow([]);
  spillFormula(pools, 'A3', 'POOLS("eth", 20)');
}

function addDerivativesDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Derivatives');
  setColWidths(sheet, [25, 18, 15, 15, 18]);
  styleTitle(sheet.addRow(['Derivatives Market']));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', 'DERIVATIVES(50)');
}

function addCorrelationDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  const sheet = workbook.addWorksheet('CRK Prices');
  const coinList = coins.length > 0 ? coins.slice(0, 10) : [
    'bitcoin', 'ethereum', 'solana', 'binancecoin', 'xrp',
  ];
  setColWidths(sheet, [18, 15, 15]);
  styleTitle(sheet.addRow(['Price Watch']));
  sheet.addRow([]);

  for (let i = 0; i < coinList.length; i++) {
    const coin = coinList[i];
    const row = i + 3;
    sheet.getCell(`A${row}`).value = coin;
    sheet.getCell(`B${row}`).value = crkFormula(`PRICE("${coin}")`);
    sheet.getCell(`C${row}`).value = crkFormula(`CHANGE("${coin}", "24h")`);
  }
}

function addStablecoinsDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Stablecoins');
  setColWidths(sheet, [25, 18, 15, 18]);
  styleTitle(sheet.addRow(['Stablecoins']));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', 'STABLECOINS(20)');
}

function addExchangesDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Exchanges');
  setColWidths(sheet, [25, 18, 15, 15, 18]);
  styleTitle(sheet.addRow(['Top Exchanges']));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', 'EXCHANGES(50)');
}

function addBitcoinDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Bitcoin');
  setColWidths(sheet, [30, 25]);
  styleTitle(sheet.addRow(['Bitcoin Dashboard']));
  sheet.addRow([]);
  metricRow(sheet, 3, 'BTC Price', 'PRICE("bitcoin")');
  metricRow(sheet, 4, '24h Change', 'CHANGE("bitcoin", "24h")');
  metricRow(sheet, 5, 'Market Cap', 'MCAP("bitcoin")');
  metricRow(sheet, 6, 'BTC Dominance', 'BTCDOM()');
  metricRow(sheet, 7, 'Fear & Greed', 'FEARGREED()');
  sheet.addRow([]);
  metricRow(sheet, 9, 'RSI(14)', 'RSI("bitcoin", 14)');
  metricRow(sheet, 10, 'SMA(50)', 'SMA("bitcoin", 50)');
  metricRow(sheet, 11, 'SMA(200)', 'SMA("bitcoin", 200)');
}

function addEthereumDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Ethereum');
  setColWidths(sheet, [30, 25]);
  styleTitle(sheet.addRow(['Ethereum Dashboard']));
  sheet.addRow([]);
  metricRow(sheet, 3, 'ETH Price', 'PRICE("ethereum")');
  metricRow(sheet, 4, '24h Change', 'CHANGE("ethereum", "24h")');
  metricRow(sheet, 5, 'Market Cap', 'MCAP("ethereum")');
  sheet.addRow([]);
  metricRow(sheet, 7, 'DeFi Market Cap', 'DEFI_GLOBAL("market_cap")');
  metricRow(sheet, 8, 'DeFi Dominance', 'DEFI_GLOBAL("dominance")');
}

function addNftDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK NFTs');
  setColWidths(sheet, [30, 18, 18, 15, 15]);
  styleTitle(sheet.addRow(['NFT Collections']));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', 'NFTS(50)');
}

function addOnChainDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  const sheet = workbook.addWorksheet('CRK On-Chain');
  setColWidths(sheet, [30, 25]);
  styleTitle(sheet.addRow(['On-Chain Metrics']));
  sheet.addRow([]);

  const coinList = coins.length > 0 ? coins.slice(0, 5) : ['bitcoin', 'ethereum'];
  let row = 3;
  for (const coin of coinList) {
    metricRow(sheet, row, `${coin} Price`, `PRICE("${coin}")`);
    metricRow(sheet, row + 1, `${coin} Market Cap`, `MCAP("${coin}")`);
    row += 3;
  }
}

function addCategoriesDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Categories');
  setColWidths(sheet, [25, 18, 18, 15]);
  styleTitle(sheet.addRow(['Market Categories']));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', 'CATEGORIES(50)');
}

function addEtfDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK ETFs');
  setColWidths(sheet, [30, 25]);
  styleTitle(sheet.addRow(['Crypto ETF Tracker']));
  sheet.addRow([]);
  metricRow(sheet, 3, 'BTC Price', 'PRICE("bitcoin")');
  metricRow(sheet, 4, 'BTC Dominance', 'BTCDOM()');
  metricRow(sheet, 5, 'Total Market Cap', 'GLOBAL("total_market_cap")');
  sheet.addRow([]);
  spillFormula(sheet, 'A7', 'COMPANIES("bitcoin")');

  const ethEtf = workbook.addWorksheet('CRK ETH Holdings');
  setColWidths(ethEtf, [30, 25]);
  styleTitle(ethEtf.addRow(['ETH Corporate Holdings']));
  ethEtf.addRow([]);
  spillFormula(ethEtf, 'A3', 'COMPANIES("ethereum")');
}

function addLayerCompareDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  const sheet = workbook.addWorksheet('CRK Layer Compare');
  setColWidths(sheet, [18, 15, 15, 18, 15]);
  styleTitle(sheet.addRow(['Layer Comparison']));
  sheet.addRow([]);

  const headers = ['Coin', 'Price', '24h Change', 'Market Cap', 'RSI(14)'];
  const headerRow = sheet.addRow(headers);
  styleSectionHeader(headerRow);

  const coinList = coins.length > 0 ? coins.slice(0, 15) : [
    'ethereum', 'solana', 'cardano', 'polkadot', 'avalanche-2',
    'near', 'cosmos', 'algorand', 'aptos', 'sui',
  ];

  for (let i = 0; i < coinList.length; i++) {
    const coin = coinList[i];
    const row = i + 4;
    sheet.getCell(`A${row}`).value = coin;
    sheet.getCell(`B${row}`).value = crkFormula(`PRICE("${coin}")`);
    sheet.getCell(`C${row}`).value = crkFormula(`CHANGE("${coin}", "24h")`);
    sheet.getCell(`D${row}`).value = crkFormula(`MCAP("${coin}")`);
    sheet.getCell(`E${row}`).value = crkFormula(`RSI("${coin}", 14)`);
  }
}

function addMemeCoinsDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Meme Coins');
  setColWidths(sheet, [25, 18, 15, 18]);
  styleTitle(sheet.addRow(['Meme Coins']));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', 'TOP(50, "meme-token")');

  const trending = workbook.addWorksheet('CRK Trending Meme');
  setColWidths(trending, [25, 20, 18]);
  styleTitle(trending.addRow(['Trending']));
  trending.addRow([]);
  spillFormula(trending, 'A3', 'TRENDING(7)');
}

function addAIGamingDashboard(workbook: ExcelJS.Workbook) {
  const ai = workbook.addWorksheet('CRK AI Tokens');
  setColWidths(ai, [25, 18, 15, 18]);
  styleTitle(ai.addRow(['AI Tokens']));
  ai.addRow([]);
  spillFormula(ai, 'A3', 'TOP(30, "artificial-intelligence")');

  const gaming = workbook.addWorksheet('CRK Gaming Tokens');
  setColWidths(gaming, [25, 18, 15, 18]);
  styleTitle(gaming.addRow(['Gaming Tokens']));
  gaming.addRow([]);
  spillFormula(gaming, 'A3', 'TOP(30, "gaming")');
}

function addDefiYieldsDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK DeFi Yields');
  setColWidths(sheet, [25, 18, 15, 15]);
  styleTitle(sheet.addRow(['DeFi Protocols']));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', 'DEFI(50)');

  const stables = workbook.addWorksheet('CRK Stablecoins');
  setColWidths(stables, [25, 18, 15]);
  styleTitle(stables.addRow(['Stablecoins']));
  stables.addRow([]);
  spillFormula(stables, 'A3', 'STABLECOINS(10)');
}

function addLiquidationsDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Liquidations');
  setColWidths(sheet, [25, 18, 15, 15, 18]);
  styleTitle(sheet.addRow(['Derivatives & Liquidations']));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', 'DERIVATIVES(50)');
}

function addAltcoinSeasonDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Altcoin Season');
  setColWidths(sheet, [30, 25]);
  styleTitle(sheet.addRow(['Altcoin Season Analysis']));
  sheet.addRow([]);
  metricRow(sheet, 3, 'BTC Dominance', 'BTCDOM()');
  metricRow(sheet, 4, 'Total Market Cap', 'GLOBAL("total_market_cap")');
  metricRow(sheet, 5, 'Fear & Greed', 'FEARGREED()');
  sheet.addRow([]);

  const topHeader = sheet.addRow(['Top 100 Coins']);
  topHeader.font = { bold: true, size: 13, color: { argb: C.emerald } };
  sheet.addRow([]);
  spillFormula(sheet, 'A9', 'TOP(100)');
}

function addTokenUnlocksDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  const sheet = workbook.addWorksheet('CRK Token Data');
  setColWidths(sheet, [18, 15, 15, 18]);
  styleTitle(sheet.addRow(['Token Data']));
  sheet.addRow([]);

  const headers = ['Coin', 'Price', '24h Change', 'Market Cap'];
  const headerRow = sheet.addRow(headers);
  styleSectionHeader(headerRow);

  const coinList = coins.length > 0 ? coins.slice(0, 10) : [
    'aptos', 'sui', 'arbitrum', 'optimism', 'celestia',
    'sei-network', 'injective-protocol', 'worldcoin-wld', 'pyth-network', 'jito-governance-token',
  ];

  for (let i = 0; i < coinList.length; i++) {
    const coin = coinList[i];
    const row = i + 4;
    sheet.getCell(`A${row}`).value = coin;
    sheet.getCell(`B${row}`).value = crkFormula(`PRICE("${coin}")`);
    sheet.getCell(`C${row}`).value = crkFormula(`CHANGE("${coin}", "24h")`);
    sheet.getCell(`D${row}`).value = crkFormula(`MCAP("${coin}")`);
  }
}

function addStakingYieldsDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Staking');
  setColWidths(sheet, [25, 18, 15, 18]);
  styleTitle(sheet.addRow(['Proof of Stake Tokens']));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', 'TOP(50, "proof-of-stake")');
}

function addSocialSentimentDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Sentiment');
  setColWidths(sheet, [30, 25]);
  styleTitle(sheet.addRow(['Social Sentiment']));
  sheet.addRow([]);
  metricRow(sheet, 3, 'Fear & Greed', 'FEARGREED()');
  metricRow(sheet, 4, 'Classification', 'FEARGREED("class")');
  sheet.addRow([]);

  const trendTitle = sheet.addRow(['Trending Coins']);
  trendTitle.font = { bold: true, size: 13, color: { argb: C.emerald } };
  sheet.addRow([]);
  spillFormula(sheet, 'A8', 'TRENDING(7)');

  const gainers = workbook.addWorksheet('CRK Top Gainers');
  setColWidths(gainers, [25, 15, 15, 18]);
  styleTitle(gainers.addRow(['Gainers (24h)']));
  gainers.addRow([]);
  spillFormula(gainers, 'A3', 'GAINERS(20)');
}

function addMiningDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Mining');
  setColWidths(sheet, [30, 25]);
  styleTitle(sheet.addRow(['Mining & PoW']));
  sheet.addRow([]);
  metricRow(sheet, 3, 'BTC Price', 'PRICE("bitcoin")');
  metricRow(sheet, 4, 'BTC Market Cap', 'MCAP("bitcoin")');
  sheet.addRow([]);

  const powTitle = sheet.addRow(['Proof of Work Coins']);
  powTitle.font = { bold: true, size: 13, color: { argb: C.emerald } };
  sheet.addRow([]);
  spillFormula(sheet, 'A8', 'TOP(20, "proof-of-work")');
}

function addExchangeReservesDashboard(workbook: ExcelJS.Workbook) {
  const sheet = workbook.addWorksheet('CRK Exchanges');
  setColWidths(sheet, [25, 18, 15, 15, 18]);
  styleTitle(sheet.addRow(['Exchange Data']));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', 'EXCHANGES(50)');
}

function addCustomDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  const sheet = workbook.addWorksheet('CRK Watchlist');
  setColWidths(sheet, [18, 15, 15, 18, 15]);
  styleTitle(sheet.addRow(['Custom Watchlist']));
  sheet.addRow([]);

  const headers = ['Coin', 'Price', '24h Change', 'Market Cap', 'Volume'];
  const headerRow = sheet.addRow(headers);
  styleSectionHeader(headerRow);

  const coinList = coins.length > 0 ? coins : ['bitcoin', 'ethereum', 'solana'];

  for (let i = 0; i < coinList.length; i++) {
    const coin = coinList[i];
    const row = i + 4;
    sheet.getCell(`A${row}`).value = coin;
    sheet.getCell(`B${row}`).value = crkFormula(`PRICE("${coin}")`);
    sheet.getCell(`C${row}`).value = crkFormula(`CHANGE("${coin}", "24h")`);
    sheet.getCell(`D${row}`).value = crkFormula(`MCAP("${coin}")`);
    sheet.getCell(`E${row}`).value = crkFormula(`VOL("${coin}")`);
  }
}

function addVolatilityDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  const sheet = workbook.addWorksheet('CRK Volatility');
  setColWidths(sheet, [18, 15, 15, 18]);
  styleTitle(sheet.addRow(['Volatility Analysis']));
  sheet.addRow([]);

  const headers = ['Coin', 'Price', '24h Change', 'ATH'];
  const headerRow = sheet.addRow(headers);
  styleSectionHeader(headerRow);

  const coinList = coins.length > 0 ? coins.slice(0, 10) : ['bitcoin', 'ethereum', 'solana'];

  for (let i = 0; i < coinList.length; i++) {
    const coin = coinList[i];
    const row = i + 4;
    sheet.getCell(`A${row}`).value = coin;
    sheet.getCell(`B${row}`).value = crkFormula(`PRICE("${coin}")`);
    sheet.getCell(`C${row}`).value = crkFormula(`CHANGE("${coin}", "24h")`);
    sheet.getCell(`D${row}`).value = crkFormula(`ATH("${coin}")`);
  }
}

function addCategoryTokensDashboard(workbook: ExcelJS.Workbook, dashboard: DashboardType) {
  const categoryMap: Record<string, { title: string; category: string }> = {
    'rwa': { title: 'Real World Assets', category: 'real-world-assets-rwa' },
    'metaverse': { title: 'Metaverse Tokens', category: 'metaverse' },
    'privacy-coins': { title: 'Privacy Coins', category: 'privacy-coins' },
  };

  const info = categoryMap[dashboard] || { title: 'Tokens', category: dashboard };
  const sheet = workbook.addWorksheet('CRK Tokens');
  setColWidths(sheet, [25, 18, 15, 18]);
  styleTitle(sheet.addRow([info.title]));
  sheet.addRow([]);
  spillFormula(sheet, 'A3', `TOP(50, "${info.category}")`);
}

function addDevActivityDashboard(workbook: ExcelJS.Workbook, coins: string[]) {
  const sheet = workbook.addWorksheet('CRK Dev Activity');
  setColWidths(sheet, [18, 15, 15, 18]);
  styleTitle(sheet.addRow(['Developer Activity']));
  sheet.addRow([]);

  const headers = ['Coin', 'Price', '24h Change', 'Market Cap'];
  const headerRow = sheet.addRow(headers);
  styleSectionHeader(headerRow);

  const coinList = coins.length > 0 ? coins.slice(0, 10) : [
    'ethereum', 'polkadot', 'cardano', 'cosmos', 'solana',
    'near', 'internet-computer', 'chainlink', 'filecoin', 'aptos',
  ];

  for (let i = 0; i < coinList.length; i++) {
    const coin = coinList[i];
    const row = i + 4;
    sheet.getCell(`A${row}`).value = coin;
    sheet.getCell(`B${row}`).value = crkFormula(`PRICE("${coin}")`);
    sheet.getCell(`C${row}`).value = crkFormula(`CHANGE("${coin}", "24h")`);
    sheet.getCell(`D${row}`).value = crkFormula(`MCAP("${coin}")`);
  }
}
