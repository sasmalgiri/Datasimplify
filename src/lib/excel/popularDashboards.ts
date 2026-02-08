/**
 * Popular Dashboard Templates
 *
 * Additional specialized dashboards for crypto analytics.
 */

import ExcelJS from 'exceljs';
import {
  createHorizontalBarChart,
  createPieChartLegend,
  createGauge,
  createSparkline,
  createProgressBar,
  colorHeatmapCell,
} from './charts';

// Color palette
const COLORS = {
  primary: 'FF059669',
  success: 'FF22C55E',
  danger: 'FFEF4444',
  warning: 'FFF59E0B',
  info: 'FF3B82F6',
  purple: 'FF8B5CF6',
  pink: 'FFEC4899',
  cyan: 'FF06B6D4',
  orange: 'FFF97316',
  lime: 'FF84CC16',
  bitcoin: 'FFF7931A',
  ethereum: 'FF627EEA',
  dark: 'FF1F2937',
  darkAlt: 'FF374151',
  light: 'FF6B7280',
  surface: 'FFF3F4F6',
  white: 'FFFFFFFF',
};

const STYLES = {
  header: {
    font: { bold: true, size: 18, color: { argb: COLORS.white } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: COLORS.primary } },
    alignment: { horizontal: 'center' as const, vertical: 'middle' as const },
  },
  columnHeader: {
    font: { bold: true, color: { argb: COLORS.white } },
    fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: COLORS.darkAlt } },
    alignment: { horizontal: 'center' as const },
  },
};

// ============================================
// BITCOIN DASHBOARD
// ============================================

export function addBitcoinDashboard(
  workbook: ExcelJS.Workbook,
  btcData: any,
  globalData: any,
  fearGreedData: any[]
) {
  const sheet = workbook.addWorksheet('Bitcoin', {
    properties: { tabColor: { argb: COLORS.bitcoin } }
  });

  // Column widths
  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 25;
  sheet.getColumn('C').width = 20;
  sheet.getColumn('D').width = 3;
  sheet.getColumn('E').width = 25;
  sheet.getColumn('F').width = 20;
  sheet.getColumn('G').width = 3;
  sheet.getColumn('H').width = 25;
  sheet.getColumn('I').width = 20;

  // Header
  sheet.mergeCells('B2:I2');
  const header = sheet.getCell('B2');
  header.value = '₿ BITCOIN DASHBOARD';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.bitcoin } };
  sheet.getRow(2).height = 45;

  // Current Stats Card
  const stats = [
    { label: 'Price', value: `$${btcData?.current_price?.toLocaleString() || 'N/A'}` },
    { label: 'Market Cap', value: formatCurrency(btcData?.market_cap || 0) },
    { label: '24h Change', value: `${(btcData?.price_change_percentage_24h || 0).toFixed(2)}%`, isChange: true },
    { label: '24h Volume', value: formatCurrency(btcData?.total_volume || 0) },
    { label: 'Circulating Supply', value: `${((btcData?.circulating_supply || 0) / 1e6).toFixed(2)}M BTC` },
    { label: 'Max Supply', value: '21M BTC' },
  ];

  sheet.getCell('B4').value = '📊 CURRENT STATS';
  sheet.getCell('B4').font = { bold: true, size: 14, color: { argb: COLORS.bitcoin } };

  stats.forEach((stat, i) => {
    const row = 5 + i;
    sheet.getCell(`B${row}`).value = stat.label;
    sheet.getCell(`B${row}`).font = { color: { argb: COLORS.dark } };
    sheet.getCell(`C${row}`).value = stat.value;

    if (stat.isChange) {
      const change = btcData?.price_change_percentage_24h || 0;
      sheet.getCell(`C${row}`).font = { bold: true, color: { argb: change >= 0 ? COLORS.success : COLORS.danger } };
    } else {
      sheet.getCell(`C${row}`).font = { bold: true, color: { argb: COLORS.bitcoin } };
    }
  });

  // BTC Dominance Card
  sheet.getCell('E4').value = '🏆 DOMINANCE';
  sheet.getCell('E4').font = { bold: true, size: 14, color: { argb: COLORS.bitcoin } };

  const dominance = globalData?.market_cap_percentage?.btc || 0;
  sheet.getCell('E5').value = 'BTC Dominance';
  sheet.getCell('F5').value = `${dominance.toFixed(2)}%`;
  sheet.getCell('F5').font = { bold: true, size: 20, color: { argb: COLORS.bitcoin } };

  // Visual bar
  createProgressBar(sheet, 6, 5, dominance, 100, { width: 25, color: COLORS.bitcoin });

  sheet.getCell('E8').value = 'Market Share Visualization:';
  sheet.getCell('E8').font = { italic: true, color: { argb: COLORS.light } };

  const btcBar = Math.round(dominance / 2);
  const otherBar = 50 - btcBar;
  sheet.getCell('E9').value = '█'.repeat(btcBar);
  sheet.getCell('E9').font = { color: { argb: COLORS.bitcoin } };
  sheet.getCell('F9').value = '░'.repeat(otherBar) + ' Others';
  sheet.getCell('F9').font = { color: { argb: COLORS.light } };

  // ATH Stats
  sheet.getCell('H4').value = '🎯 ALL-TIME HIGH';
  sheet.getCell('H4').font = { bold: true, size: 14, color: { argb: COLORS.bitcoin } };

  const ath = btcData?.ath || 0;
  const athChange = btcData?.ath_change_percentage || 0;

  sheet.getCell('H5').value = 'ATH Price';
  sheet.getCell('I5').value = `$${ath.toLocaleString()}`;
  sheet.getCell('I5').font = { bold: true, color: { argb: COLORS.success } };

  sheet.getCell('H6').value = 'From ATH';
  sheet.getCell('I6').value = `${athChange.toFixed(2)}%`;
  sheet.getCell('I6').font = { bold: true, color: { argb: COLORS.danger } };

  sheet.getCell('H7').value = 'ATH Date';
  sheet.getCell('I7').value = btcData?.ath_date ? new Date(btcData.ath_date).toLocaleDateString() : 'N/A';

  // Halving Info
  sheet.getCell('B13').value = '⏰ BITCOIN HALVING';
  sheet.getCell('B13').font = { bold: true, size: 14, color: { argb: COLORS.bitcoin } };

  const halvingData = [
    { event: '1st Halving', date: 'Nov 28, 2012', reward: '25 BTC' },
    { event: '2nd Halving', date: 'Jul 9, 2016', reward: '12.5 BTC' },
    { event: '3rd Halving', date: 'May 11, 2020', reward: '6.25 BTC' },
    { event: '4th Halving', date: 'Apr 20, 2024', reward: '3.125 BTC' },
    { event: '5th Halving', date: '~2028', reward: '1.5625 BTC' },
  ];

  halvingData.forEach((h, i) => {
    const row = 14 + i;
    sheet.getCell(`B${row}`).value = h.event;
    sheet.getCell(`C${row}`).value = h.date;
    sheet.getCell(`D${row}`).value = h.reward;

    if (h.event === '4th Halving') {
      ['B', 'C', 'D'].forEach(col => {
        sheet.getCell(`${col}${row}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
        sheet.getCell(`${col}${row}`).font = { bold: true };
      });
    }
  });

  // Fear & Greed for Bitcoin
  sheet.getCell('E13').value = '😱 MARKET SENTIMENT';
  sheet.getCell('E13').font = { bold: true, size: 14, color: { argb: COLORS.bitcoin } };

  if (fearGreedData.length > 0) {
    const current = fearGreedData[0];
    const value = parseInt(current.value);

    sheet.getCell('E14').value = 'Fear & Greed Index';
    sheet.getCell('F14').value = `${value} - ${current.value_classification}`;
    sheet.getCell('F14').font = { bold: true, size: 16, color: { argb: getGaugeColor(value) } };

    createGauge(sheet, 15, 5, value, { width: 25 });
  }

  // Supply Chart
  sheet.getCell('H13').value = '📈 SUPPLY CHART';
  sheet.getCell('H13').font = { bold: true, size: 14, color: { argb: COLORS.bitcoin } };

  const circulating = btcData?.circulating_supply || 19000000;
  const remaining = 21000000 - circulating;

  createPieChartLegend(sheet, 14, 8, [
    { label: 'Circulating', value: circulating, percentage: (circulating / 21000000) * 100, color: COLORS.bitcoin },
    { label: 'Unmined', value: remaining, percentage: (remaining / 21000000) * 100, color: COLORS.light },
  ]);
}

// ============================================
// ETHEREUM DASHBOARD
// ============================================

export function addEthereumDashboard(
  workbook: ExcelJS.Workbook,
  ethData: any,
  defiData: any,
  globalData: any
) {
  const sheet = workbook.addWorksheet('Ethereum', {
    properties: { tabColor: { argb: COLORS.ethereum } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 25;
  sheet.getColumn('C').width = 20;
  sheet.getColumn('D').width = 3;
  sheet.getColumn('E').width = 25;
  sheet.getColumn('F').width = 20;
  sheet.getColumn('G').width = 3;
  sheet.getColumn('H').width = 25;
  sheet.getColumn('I').width = 20;

  // Header
  sheet.mergeCells('B2:I2');
  const header = sheet.getCell('B2');
  header.value = 'Ξ ETHEREUM DASHBOARD';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.ethereum } };
  sheet.getRow(2).height = 45;

  // Current Stats
  sheet.getCell('B4').value = '📊 CURRENT STATS';
  sheet.getCell('B4').font = { bold: true, size: 14, color: { argb: COLORS.ethereum } };

  const stats = [
    { label: 'Price', value: `$${ethData?.current_price?.toLocaleString() || 'N/A'}` },
    { label: 'Market Cap', value: formatCurrency(ethData?.market_cap || 0) },
    { label: '24h Change', value: `${(ethData?.price_change_percentage_24h || 0).toFixed(2)}%`, isChange: true },
    { label: '24h Volume', value: formatCurrency(ethData?.total_volume || 0) },
    { label: 'Circulating Supply', value: `${((ethData?.circulating_supply || 0) / 1e6).toFixed(2)}M ETH` },
  ];

  stats.forEach((stat, i) => {
    const row = 5 + i;
    sheet.getCell(`B${row}`).value = stat.label;
    sheet.getCell(`C${row}`).value = stat.value;

    if (stat.isChange) {
      const change = ethData?.price_change_percentage_24h || 0;
      sheet.getCell(`C${row}`).font = { bold: true, color: { argb: change >= 0 ? COLORS.success : COLORS.danger } };
    } else {
      sheet.getCell(`C${row}`).font = { bold: true, color: { argb: COLORS.ethereum } };
    }
  });

  // ETH Dominance
  sheet.getCell('E4').value = '🏆 DOMINANCE';
  sheet.getCell('E4').font = { bold: true, size: 14, color: { argb: COLORS.ethereum } };

  const dominance = globalData?.market_cap_percentage?.eth || 0;
  sheet.getCell('E5').value = 'ETH Dominance';
  sheet.getCell('F5').value = `${dominance.toFixed(2)}%`;
  sheet.getCell('F5').font = { bold: true, size: 20, color: { argb: COLORS.ethereum } };

  createProgressBar(sheet, 6, 5, dominance, 100, { width: 25, color: COLORS.ethereum });

  // DeFi Stats
  sheet.getCell('H4').value = '🏦 DEFI ON ETHEREUM';
  sheet.getCell('H4').font = { bold: true, size: 14, color: { argb: COLORS.ethereum } };

  const defiStats = [
    { label: 'DeFi Market Cap', value: formatCurrency(parseFloat(defiData?.defi_market_cap || '0')) },
    { label: 'DeFi/ETH Ratio', value: `${parseFloat(defiData?.defi_to_eth_ratio || '0').toFixed(4)}` },
    { label: 'Top Protocol', value: defiData?.top_coin_name || 'Unknown' },
  ];

  defiStats.forEach((stat, i) => {
    sheet.getCell(`H${5 + i}`).value = stat.label;
    sheet.getCell(`I${5 + i}`).value = stat.value;
    sheet.getCell(`I${5 + i}`).font = { bold: true, color: { argb: COLORS.purple } };
  });

  // ETH 2.0 Info
  sheet.getCell('B12').value = '🔷 ETHEREUM 2.0 / PROOF OF STAKE';
  sheet.getCell('B12').font = { bold: true, size: 14, color: { argb: COLORS.ethereum } };

  const eth2Info = [
    { label: 'Consensus', value: 'Proof of Stake (since Sept 2022)' },
    { label: 'Staking APR', value: '~4-5%' },
    { label: 'Min Stake', value: '32 ETH' },
    { label: 'Burn Mechanism', value: 'EIP-1559 (Aug 2021)' },
  ];

  eth2Info.forEach((info, i) => {
    sheet.getCell(`B${13 + i}`).value = info.label;
    sheet.getCell(`C${13 + i}`).value = info.value;
  });

  // Key milestones
  sheet.getCell('E12').value = '📅 KEY MILESTONES';
  sheet.getCell('E12').font = { bold: true, size: 14, color: { argb: COLORS.ethereum } };

  const milestones = [
    { event: 'Launch', date: 'Jul 30, 2015' },
    { event: 'The DAO Fork', date: 'Jul 20, 2016' },
    { event: 'EIP-1559', date: 'Aug 5, 2021' },
    { event: 'The Merge', date: 'Sep 15, 2022' },
    { event: 'Shanghai', date: 'Apr 12, 2023' },
  ];

  milestones.forEach((m, i) => {
    sheet.getCell(`E${13 + i}`).value = m.event;
    sheet.getCell(`F${13 + i}`).value = m.date;
  });

  // ATH Stats
  sheet.getCell('H12').value = '🎯 ALL-TIME HIGH';
  sheet.getCell('H12').font = { bold: true, size: 14, color: { argb: COLORS.ethereum } };

  sheet.getCell('H13').value = 'ATH Price';
  sheet.getCell('I13').value = `$${(ethData?.ath || 0).toLocaleString()}`;
  sheet.getCell('I13').font = { bold: true, color: { argb: COLORS.success } };

  sheet.getCell('H14').value = 'From ATH';
  sheet.getCell('I14').value = `${(ethData?.ath_change_percentage || 0).toFixed(2)}%`;
  sheet.getCell('I14').font = { bold: true, color: { argb: COLORS.danger } };
}

// ============================================
// LAYER 1 COMPARISON
// ============================================

export function addLayer1Comparison(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Layer1_Compare', {
    properties: { tabColor: { argb: COLORS.cyan } }
  });

  const layer1Ids = ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2', 'polkadot', 'near', 'cosmos', 'algorand', 'tezos'];
  const layer1Coins = layer1Ids
    .map(id => marketData.find(c => c.id === id))
    .filter(Boolean);

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 15;
  sheet.getColumn('C').width = 10;
  sheet.getColumn('D').width = 14;
  sheet.getColumn('E').width = 16;
  sheet.getColumn('F').width = 14;
  sheet.getColumn('G').width = 10;
  sheet.getColumn('H').width = 10;
  sheet.getColumn('I').width = 12;
  sheet.getColumn('J').width = 25;

  // Header
  sheet.mergeCells('B2:J2');
  const header = sheet.getCell('B2');
  header.value = '⛓️ LAYER 1 BLOCKCHAIN COMPARISON';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.cyan } };
  sheet.getRow(2).height = 40;

  // Column headers
  const headers = ['Chain', 'Symbol', 'Price', 'Market Cap', 'Volume', '24h %', '7d %', 'Rank', 'Market Share'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(4, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Data
  const totalMcap = layer1Coins.reduce((sum, c) => sum + (c?.market_cap || 0), 0);

  layer1Coins.forEach((coin: any, i: number) => {
    const row = 5 + i;
    const change24h = coin.price_change_percentage_24h || 0;
    const change7d = coin.price_change_percentage_7d_in_currency || 0;
    const marketShare = ((coin.market_cap || 0) / totalMcap) * 100;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };

    sheet.getCell(`C${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`D${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`E${row}`).value = formatCurrency(coin.market_cap);
    sheet.getCell(`F${row}`).value = formatCurrency(coin.total_volume);

    const cell24h = sheet.getCell(`G${row}`);
    cell24h.value = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    cell24h.font = { color: { argb: change24h >= 0 ? COLORS.success : COLORS.danger } };

    const cell7d = sheet.getCell(`H${row}`);
    cell7d.value = `${change7d >= 0 ? '+' : ''}${change7d.toFixed(2)}%`;
    cell7d.font = { color: { argb: change7d >= 0 ? COLORS.success : COLORS.danger } };

    sheet.getCell(`I${row}`).value = coin.market_cap_rank;
    sheet.getCell(`I${row}`).alignment = { horizontal: 'center' };

    // Visual market share bar
    const barWidth = Math.round(marketShare / 2);
    sheet.getCell(`J${row}`).value = '█'.repeat(Math.max(1, barWidth)) + ` ${marketShare.toFixed(1)}%`;
    sheet.getCell(`J${row}`).font = { color: { argb: COLORS.cyan } };

    // Zebra
    if (i % 2 === 0) {
      for (let col = 2; col <= 10; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });

  // Chart visualization
  const chartRow = 5 + layer1Coins.length + 3;
  createHorizontalBarChart(sheet, chartRow, 2, layer1Coins.slice(0, 8).map((c: any) => ({
    label: c.symbol?.toUpperCase(),
    value: c.market_cap,
    color: COLORS.cyan,
  })), { title: '📊 Market Cap Comparison' });
}

// ============================================
// LAYER 2 COMPARISON
// ============================================

export function addLayer2Comparison(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Layer2_Compare', {
    properties: { tabColor: { argb: COLORS.purple } }
  });

  const layer2Ids = ['arbitrum', 'optimism', 'polygon-ecosystem-token', 'immutable-x', 'starknet', 'mantle', 'base'];
  const layer2Coins = layer2Ids
    .map(id => marketData.find(c => c.id === id))
    .filter(Boolean);

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 10;
  sheet.getColumn('D').width = 14;
  sheet.getColumn('E').width = 16;
  sheet.getColumn('F').width = 12;
  sheet.getColumn('G').width = 12;
  sheet.getColumn('H').width = 20;

  // Header
  sheet.mergeCells('B2:H2');
  const header = sheet.getCell('B2');
  header.value = '🔗 LAYER 2 SCALING SOLUTIONS';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.purple } };
  sheet.getRow(2).height = 40;

  // Info
  sheet.getCell('B3').value = 'Layer 2s are built on top of Ethereum to improve scalability';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Column headers
  const headers = ['L2 Solution', 'Symbol', 'Price', 'Market Cap', '24h %', '7d %', 'Technology'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  const techTypes: Record<string, string> = {
    'arbitrum': 'Optimistic Rollup',
    'optimism': 'Optimistic Rollup',
    'polygon-ecosystem-token': 'ZK + POS',
    'immutable-x': 'ZK Rollup',
    'starknet': 'ZK Rollup (STARK)',
    'mantle': 'Optimistic Rollup',
    'base': 'Optimistic Rollup',
  };

  layer2Coins.forEach((coin: any, i: number) => {
    const row = 6 + i;
    const change24h = coin.price_change_percentage_24h || 0;
    const change7d = coin.price_change_percentage_7d_in_currency || 0;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`D${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`E${row}`).value = formatCurrency(coin.market_cap);

    const cell24h = sheet.getCell(`F${row}`);
    cell24h.value = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    cell24h.font = { color: { argb: change24h >= 0 ? COLORS.success : COLORS.danger } };

    const cell7d = sheet.getCell(`G${row}`);
    cell7d.value = `${change7d >= 0 ? '+' : ''}${change7d.toFixed(2)}%`;
    cell7d.font = { color: { argb: change7d >= 0 ? COLORS.success : COLORS.danger } };

    sheet.getCell(`H${row}`).value = techTypes[coin.id] || 'Rollup';

    if (i % 2 === 0) {
      for (let col = 2; col <= 8; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });
}

// ============================================
// MEME COINS DASHBOARD
// ============================================

export function addMemeCoins(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Meme_Coins', {
    properties: { tabColor: { argb: COLORS.orange } }
  });

  const memeIds = ['dogecoin', 'shiba-inu', 'pepe', 'bonk', 'floki', 'dogwifcoin', 'brett', 'mog-coin', 'cat-in-a-dogs-world', 'popcat'];
  const memeCoins = memeIds
    .map(id => marketData.find(c => c.id === id))
    .filter(Boolean);

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 20;
  sheet.getColumn('C').width = 10;
  sheet.getColumn('D').width = 14;
  sheet.getColumn('E').width = 16;
  sheet.getColumn('F').width = 12;
  sheet.getColumn('G').width = 12;
  sheet.getColumn('H').width = 14;

  // Header
  sheet.mergeCells('B2:H2');
  const header = sheet.getCell('B2');
  header.value = '🐕 MEME COINS TRACKER';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.orange } };
  sheet.getRow(2).height = 40;

  // Warning
  sheet.mergeCells('B3:H3');
  sheet.getCell('B3').value = '⚠️ High Risk: Meme coins are extremely volatile. Never invest more than you can afford to lose.';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.warning } };
  sheet.getCell('B3').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };

  // Column headers
  const headers = ['Coin', 'Symbol', 'Price', 'Market Cap', '24h %', '7d %', 'From ATH'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  memeCoins.forEach((coin: any, i: number) => {
    const row = 6 + i;
    const change24h = coin.price_change_percentage_24h || 0;
    const change7d = coin.price_change_percentage_7d_in_currency || 0;
    const fromAth = coin.ath_change_percentage || 0;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`D${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`E${row}`).value = formatCurrency(coin.market_cap);

    const cell24h = sheet.getCell(`F${row}`);
    cell24h.value = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    cell24h.font = { bold: true, color: { argb: change24h >= 0 ? COLORS.success : COLORS.danger } };

    const cell7d = sheet.getCell(`G${row}`);
    cell7d.value = `${change7d >= 0 ? '+' : ''}${change7d.toFixed(2)}%`;
    cell7d.font = { color: { argb: change7d >= 0 ? COLORS.success : COLORS.danger } };

    sheet.getCell(`H${row}`).value = `${fromAth.toFixed(1)}%`;
    sheet.getCell(`H${row}`).font = { color: { argb: COLORS.danger } };

    if (i % 2 === 0) {
      for (let col = 2; col <= 8; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });

  // Meme coin stats
  const statsRow = 6 + memeCoins.length + 2;
  sheet.getCell(`B${statsRow}`).value = '📊 MEME COIN SECTOR STATS';
  sheet.getCell(`B${statsRow}`).font = { bold: true, size: 14, color: { argb: COLORS.orange } };

  const totalMcap = memeCoins.reduce((sum, c: any) => sum + (c?.market_cap || 0), 0);
  const avgChange = memeCoins.reduce((sum, c: any) => sum + (c?.price_change_percentage_24h || 0), 0) / memeCoins.length;

  sheet.getCell(`B${statsRow + 1}`).value = 'Total Market Cap:';
  sheet.getCell(`C${statsRow + 1}`).value = formatCurrency(totalMcap);
  sheet.getCell(`C${statsRow + 1}`).font = { bold: true };

  sheet.getCell(`B${statsRow + 2}`).value = 'Average 24h Change:';
  sheet.getCell(`C${statsRow + 2}`).value = `${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%`;
  sheet.getCell(`C${statsRow + 2}`).font = { color: { argb: avgChange >= 0 ? COLORS.success : COLORS.danger } };
}

// ============================================
// AI & GAMING TOKENS
// ============================================

export function addAIGamingTokens(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('AI_Gaming', {
    properties: { tabColor: { argb: COLORS.pink } }
  });

  const aiIds = ['render-token', 'fetch-ai', 'singularitynet', 'ocean-protocol', 'the-graph', 'bittensor', 'akash-network'];
  const gamingIds = ['immutable-x', 'the-sandbox', 'axie-infinity', 'gala', 'enjincoin', 'illuvium', 'gods-unchained'];

  const aiCoins = aiIds.map(id => marketData.find(c => c.id === id)).filter(Boolean);
  const gamingCoins = gamingIds.map(id => marketData.find(c => c.id === id)).filter(Boolean);

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 20;
  sheet.getColumn('C').width = 10;
  sheet.getColumn('D').width = 14;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 12;
  sheet.getColumn('G').width = 3;
  sheet.getColumn('H').width = 20;
  sheet.getColumn('I').width = 10;
  sheet.getColumn('J').width = 14;
  sheet.getColumn('K').width = 14;
  sheet.getColumn('L').width = 12;

  // Header
  sheet.mergeCells('B2:L2');
  const header = sheet.getCell('B2');
  header.value = '🤖 AI & 🎮 GAMING TOKENS';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.pink } };
  sheet.getRow(2).height = 40;

  // AI Section
  sheet.getCell('B4').value = '🤖 AI & COMPUTE TOKENS';
  sheet.getCell('B4').font = { bold: true, size: 14, color: { argb: COLORS.purple } };

  const aiHeaders = ['Token', 'Symbol', 'Price', 'Market Cap', '24h %'];
  aiHeaders.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  aiCoins.forEach((coin: any, i: number) => {
    const row = 6 + i;
    const change24h = coin.price_change_percentage_24h || 0;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`D${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`E${row}`).value = formatCurrency(coin.market_cap);

    const cell24h = sheet.getCell(`F${row}`);
    cell24h.value = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    cell24h.font = { color: { argb: change24h >= 0 ? COLORS.success : COLORS.danger } };
  });

  // Gaming Section
  sheet.getCell('H4').value = '🎮 GAMING TOKENS';
  sheet.getCell('H4').font = { bold: true, size: 14, color: { argb: COLORS.pink } };

  const gamingHeaders = ['Token', 'Symbol', 'Price', 'Market Cap', '24h %'];
  gamingHeaders.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 8);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  gamingCoins.forEach((coin: any, i: number) => {
    const row = 6 + i;
    const change24h = coin.price_change_percentage_24h || 0;

    sheet.getCell(`H${row}`).value = coin.name;
    sheet.getCell(`H${row}`).font = { bold: true };
    sheet.getCell(`I${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`J${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`K${row}`).value = formatCurrency(coin.market_cap);

    const cell24h = sheet.getCell(`L${row}`);
    cell24h.value = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    cell24h.font = { color: { argb: change24h >= 0 ? COLORS.success : COLORS.danger } };
  });
}

// ============================================
// INVESTMENT CALCULATOR
// ============================================

export function addInvestmentCalculator(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Calculator', {
    properties: { tabColor: { argb: COLORS.success } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 25;
  sheet.getColumn('C').width = 20;
  sheet.getColumn('D').width = 20;
  sheet.getColumn('E').width = 20;
  sheet.getColumn('F').width = 3;
  sheet.getColumn('G').width = 25;
  sheet.getColumn('H').width = 20;

  // Header
  sheet.mergeCells('B2:H2');
  const header = sheet.getCell('B2');
  header.value = '🧮 INVESTMENT CALCULATORS';
  Object.assign(header, STYLES.header);
  sheet.getRow(2).height = 40;

  // DCA Calculator
  sheet.getCell('B4').value = '📈 DCA CALCULATOR';
  sheet.getCell('B4').font = { bold: true, size: 14, color: { argb: COLORS.success } };

  sheet.getCell('B5').value = 'Calculate returns from Dollar-Cost Averaging';
  sheet.getCell('B5').font = { italic: true, color: { argb: COLORS.light } };

  const dcaInputs = [
    { label: 'Weekly Investment', value: 100, format: '$#,##0' },
    { label: 'Number of Weeks', value: 52, format: '0' },
    { label: 'Current BTC Price', value: marketData.find(c => c.id === 'bitcoin')?.current_price || 0, format: '$#,##0.00' },
  ];

  dcaInputs.forEach((input, i) => {
    const row = 7 + i;
    sheet.getCell(`B${row}`).value = input.label;
    const cell = sheet.getCell(`C${row}`);
    cell.value = input.value;
    cell.numFmt = input.format;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  sheet.getCell('B11').value = 'Total Invested:';
  sheet.getCell('C11').value = '=C7*C8';
  sheet.getCell('C11').numFmt = '$#,##0';
  sheet.getCell('C11').font = { bold: true };

  sheet.getCell('B12').value = 'BTC Accumulated:';
  sheet.getCell('C12').value = '=(C7*C8)/C9';
  sheet.getCell('C12').numFmt = '0.00000000';
  sheet.getCell('C12').font = { bold: true, color: { argb: COLORS.bitcoin } };

  // Profit Calculator
  sheet.getCell('G4').value = '💰 PROFIT CALCULATOR';
  sheet.getCell('G4').font = { bold: true, size: 14, color: { argb: COLORS.success } };

  const profitInputs = [
    { label: 'Entry Price', value: 30000, format: '$#,##0.00' },
    { label: 'Current Price', value: marketData.find(c => c.id === 'bitcoin')?.current_price || 0, format: '$#,##0.00' },
    { label: 'Amount Invested', value: 1000, format: '$#,##0' },
  ];

  profitInputs.forEach((input, i) => {
    const row = 7 + i;
    sheet.getCell(`G${row}`).value = input.label;
    const cell = sheet.getCell(`H${row}`);
    cell.value = input.value;
    cell.numFmt = input.format;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  sheet.getCell('G11').value = 'Coins Owned:';
  sheet.getCell('H11').value = '=H9/H7';
  sheet.getCell('H11').numFmt = '0.00000000';
  sheet.getCell('H11').font = { bold: true };

  sheet.getCell('G12').value = 'Current Value:';
  sheet.getCell('H12').value = '=H11*H8';
  sheet.getCell('H12').numFmt = '$#,##0.00';
  sheet.getCell('H12').font = { bold: true };

  sheet.getCell('G13').value = 'Profit/Loss:';
  sheet.getCell('H13').value = '=H12-H9';
  sheet.getCell('H13').numFmt = '$#,##0.00';
  sheet.getCell('H13').font = { bold: true, color: { argb: COLORS.success } };

  sheet.getCell('G14').value = 'ROI:';
  sheet.getCell('H14').value = '=(H12-H9)/H9';
  sheet.getCell('H14').numFmt = '0.00%';
  sheet.getCell('H14').font = { bold: true };

  // Price target calculator
  sheet.getCell('B15').value = '🎯 PRICE TARGET CALCULATOR';
  sheet.getCell('B15').font = { bold: true, size: 14, color: { argb: COLORS.success } };

  sheet.getCell('B17').value = 'Current Price';
  sheet.getCell('C17').value = marketData.find(c => c.id === 'bitcoin')?.current_price || 0;
  sheet.getCell('C17').numFmt = '$#,##0.00';

  const targets = [
    { label: '+10%', multiplier: 1.1 },
    { label: '+25%', multiplier: 1.25 },
    { label: '+50%', multiplier: 1.5 },
    { label: '+100% (2x)', multiplier: 2 },
    { label: '+500% (5x)', multiplier: 5 },
    { label: '+1000% (10x)', multiplier: 10 },
  ];

  targets.forEach((target, i) => {
    const row = 18 + i;
    sheet.getCell(`B${row}`).value = target.label;
    sheet.getCell(`C${row}`).value = `=C17*${target.multiplier}`;
    sheet.getCell(`C${row}`).numFmt = '$#,##0';
  });
}

// ============================================
// VOLATILITY ANALYSIS
// ============================================

export function addVolatilityAnalysis(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Volatility', {
    properties: { tabColor: { argb: COLORS.warning } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 12;
  sheet.getColumn('D').width = 12;
  sheet.getColumn('E').width = 12;
  sheet.getColumn('F').width = 12;
  sheet.getColumn('G').width = 14;
  sheet.getColumn('H').width = 25;

  // Header
  sheet.mergeCells('B2:H2');
  const header = sheet.getCell('B2');
  header.value = '📊 VOLATILITY ANALYSIS';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warning } };
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'Volatility = |High - Low| relative to price. Higher volatility = Higher risk.';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Column headers
  const headers = ['Coin', '24h High', '24h Low', '24h Range', 'Price', 'Volatility %', 'Risk Level'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Calculate volatility for top 30 coins
  const volatileCoins = marketData.slice(0, 30).map((coin: any) => {
    const high = coin.high_24h || coin.current_price;
    const low = coin.low_24h || coin.current_price;
    const range = high - low;
    const volatility = (range / coin.current_price) * 100;
    return { ...coin, high, low, range, volatility };
  }).sort((a, b) => b.volatility - a.volatility);

  volatileCoins.forEach((coin: any, i: number) => {
    const row = 6 + i;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };

    sheet.getCell(`C${row}`).value = formatPrice(coin.high);
    sheet.getCell(`D${row}`).value = formatPrice(coin.low);
    sheet.getCell(`E${row}`).value = formatPrice(coin.range);
    sheet.getCell(`F${row}`).value = formatPrice(coin.current_price);

    const volCell = sheet.getCell(`G${row}`);
    volCell.value = `${coin.volatility.toFixed(2)}%`;

    // Risk level
    const riskCell = sheet.getCell(`H${row}`);
    if (coin.volatility > 10) {
      riskCell.value = '🔴 Very High';
      riskCell.font = { color: { argb: COLORS.danger } };
      volCell.font = { bold: true, color: { argb: COLORS.danger } };
    } else if (coin.volatility > 5) {
      riskCell.value = '🟠 High';
      riskCell.font = { color: { argb: COLORS.orange } };
      volCell.font = { color: { argb: COLORS.orange } };
    } else if (coin.volatility > 3) {
      riskCell.value = '🟡 Medium';
      riskCell.font = { color: { argb: COLORS.warning } };
    } else {
      riskCell.value = '🟢 Low';
      riskCell.font = { color: { argb: COLORS.success } };
    }

    if (i % 2 === 0) {
      for (let col = 2; col <= 8; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatCurrency(value: number): string {
  if (!value || isNaN(value)) return '$0';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString('en-US', { maximumFractionDigits: 2 })}`;
}

function formatPrice(value: number): string {
  if (!value || isNaN(value)) return 'N/A';
  if (value >= 1000) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 1) return `$${value.toFixed(2)}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  if (value >= 0.0001) return `$${value.toFixed(6)}`;
  return `$${value.toFixed(8)}`;
}

function getGaugeColor(value: number): string {
  if (value <= 20) return COLORS.danger;
  if (value <= 40) return COLORS.warning;
  if (value <= 60) return COLORS.light;
  if (value <= 80) return COLORS.lime;
  return COLORS.success;
}

// ============================================
// LIQUIDATIONS DASHBOARD
// ============================================

export function addLiquidationsDashboard(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Liquidations', {
    properties: { tabColor: { argb: COLORS.danger } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 14;
  sheet.getColumn('D').width = 14;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 14;
  sheet.getColumn('G').width = 20;

  // Header
  sheet.mergeCells('B2:G2');
  const header = sheet.getCell('B2');
  header.value = '💥 LIQUIDATIONS TRACKER';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.danger } };
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'Track potential liquidation zones based on price volatility';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Column headers
  const headers = ['Asset', 'Price', '24h High', '24h Low', 'Range %', 'Liq. Risk Zone'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Calculate liquidation zones for major coins
  const majorCoins = ['bitcoin', 'ethereum', 'solana', 'cardano', 'avalanche-2', 'dogecoin', 'polkadot', 'chainlink', 'uniswap', 'litecoin'];
  const coins = majorCoins.map(id => marketData.find(c => c.id === id)).filter(Boolean);

  coins.forEach((coin: any, i: number) => {
    const row = 6 + i;
    const high = coin.high_24h || coin.current_price;
    const low = coin.low_24h || coin.current_price;
    const rangePercent = ((high - low) / coin.current_price) * 100;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`D${row}`).value = formatPrice(high);
    sheet.getCell(`D${row}`).font = { color: { argb: COLORS.success } };
    sheet.getCell(`E${row}`).value = formatPrice(low);
    sheet.getCell(`E${row}`).font = { color: { argb: COLORS.danger } };
    sheet.getCell(`F${row}`).value = `${rangePercent.toFixed(2)}%`;

    // Estimated liquidation risk zones
    const liqZone = `$${(low * 0.9).toFixed(0)} - $${(high * 1.1).toFixed(0)}`;
    sheet.getCell(`G${row}`).value = liqZone;
    sheet.getCell(`G${row}`).font = { color: { argb: COLORS.warning } };

    if (i % 2 === 0) {
      for (let col = 2; col <= 7; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });

  // Legend
  const legendRow = 6 + coins.length + 2;
  sheet.getCell(`B${legendRow}`).value = '⚠️ LIQUIDATION RISK LEVELS';
  sheet.getCell(`B${legendRow}`).font = { bold: true, size: 12, color: { argb: COLORS.danger } };

  const risks = [
    { level: '10x Leverage', risk: '±10% moves = liquidation', color: COLORS.danger },
    { level: '5x Leverage', risk: '±20% moves = liquidation', color: COLORS.orange },
    { level: '3x Leverage', risk: '±33% moves = liquidation', color: COLORS.warning },
    { level: '2x Leverage', risk: '±50% moves = liquidation', color: COLORS.lime },
  ];

  risks.forEach((r, i) => {
    sheet.getCell(`B${legendRow + 1 + i}`).value = r.level;
    sheet.getCell(`C${legendRow + 1 + i}`).value = r.risk;
    sheet.getCell(`C${legendRow + 1 + i}`).font = { color: { argb: r.color } };
  });
}

// ============================================
// FUNDING RATES DASHBOARD
// ============================================

export function addFundingRatesDashboard(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Funding_Rates', {
    properties: { tabColor: { argb: COLORS.purple } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 14;
  sheet.getColumn('D').width = 16;
  sheet.getColumn('E').width = 16;
  sheet.getColumn('F').width = 16;
  sheet.getColumn('G').width = 20;

  // Header
  sheet.mergeCells('B2:G2');
  const header = sheet.getCell('B2');
  header.value = '📊 PERPETUAL FUNDING RATES';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.purple } };
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'Funding rates indicate market sentiment. Positive = Longs pay Shorts, Negative = Shorts pay Longs';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Explanation card
  sheet.getCell('B5').value = '📈 HOW TO READ FUNDING RATES';
  sheet.getCell('B5').font = { bold: true, size: 12, color: { argb: COLORS.purple } };

  const explanations = [
    { condition: 'High Positive (>0.05%)', meaning: 'Market very bullish - potential for correction', color: COLORS.danger },
    { condition: 'Low Positive (0-0.05%)', meaning: 'Healthy bullish sentiment', color: COLORS.success },
    { condition: 'Low Negative (-0.05-0)', meaning: 'Healthy bearish sentiment', color: COLORS.warning },
    { condition: 'High Negative (<-0.05%)', meaning: 'Market very bearish - potential for squeeze', color: COLORS.cyan },
  ];

  explanations.forEach((e, i) => {
    sheet.getCell(`B${6 + i}`).value = e.condition;
    sheet.getCell(`D${6 + i}`).value = e.meaning;
    sheet.getCell(`D${6 + i}`).font = { color: { argb: e.color } };
  });

  // Simulated funding rates data
  const headers = ['Asset', 'Price', 'Est. Funding 8h', 'Est. Annual APR', 'Sentiment', 'Trading Signal'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(12, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  const majorCoins = ['bitcoin', 'ethereum', 'solana', 'dogecoin', 'avalanche-2', 'cardano', 'polkadot', 'chainlink'];
  const coins = majorCoins.map(id => marketData.find(c => c.id === id)).filter(Boolean);

  coins.forEach((coin: any, i: number) => {
    const row = 13 + i;
    // Simulate funding based on 24h change
    const change = coin.price_change_percentage_24h || 0;
    const estFunding = (change / 100) * 0.01; // Simplified estimation
    const annualAPR = estFunding * 3 * 365; // 3 times per day * 365 days

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = formatPrice(coin.current_price);

    const fundingCell = sheet.getCell(`D${row}`);
    fundingCell.value = `${(estFunding * 100).toFixed(4)}%`;
    fundingCell.font = { color: { argb: estFunding >= 0 ? COLORS.success : COLORS.danger } };

    sheet.getCell(`E${row}`).value = `${annualAPR.toFixed(2)}%`;

    const sentimentCell = sheet.getCell(`F${row}`);
    if (estFunding > 0.0005) {
      sentimentCell.value = '🐂 Very Bullish';
      sentimentCell.font = { color: { argb: COLORS.success } };
    } else if (estFunding > 0) {
      sentimentCell.value = '🟢 Bullish';
      sentimentCell.font = { color: { argb: COLORS.lime } };
    } else if (estFunding > -0.0005) {
      sentimentCell.value = '🔴 Bearish';
      sentimentCell.font = { color: { argb: COLORS.warning } };
    } else {
      sentimentCell.value = '🐻 Very Bearish';
      sentimentCell.font = { color: { argb: COLORS.danger } };
    }

    const signalCell = sheet.getCell(`G${row}`);
    if (Math.abs(estFunding) > 0.001) {
      signalCell.value = estFunding > 0 ? '⚠️ Potential Short' : '⚠️ Potential Long';
      signalCell.font = { color: { argb: COLORS.warning } };
    } else {
      signalCell.value = '➡️ Neutral';
      signalCell.font = { color: { argb: COLORS.light } };
    }

    if (i % 2 === 0) {
      for (let col = 2; col <= 7; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });
}

// ============================================
// ALTCOIN SEASON INDEX
// ============================================

export function addAltcoinSeasonDashboard(
  workbook: ExcelJS.Workbook,
  marketData: any[],
  globalData: any
) {
  const sheet = workbook.addWorksheet('Altcoin_Season', {
    properties: { tabColor: { argb: COLORS.cyan } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 25;
  sheet.getColumn('C').width = 18;
  sheet.getColumn('D').width = 3;
  sheet.getColumn('E').width = 25;
  sheet.getColumn('F').width = 18;

  // Header
  sheet.mergeCells('B2:F2');
  const header = sheet.getCell('B2');
  header.value = '🌙 ALTCOIN SEASON INDEX';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.cyan } };
  sheet.getRow(2).height = 40;

  // Calculate altcoin season index
  const btc = marketData.find(c => c.id === 'bitcoin');
  const btcChange = btc?.price_change_percentage_24h || 0;

  // Count how many top 50 altcoins are outperforming BTC
  const top50 = marketData.slice(0, 50).filter(c => c.id !== 'bitcoin');
  const outperforming = top50.filter(c => (c.price_change_percentage_24h || 0) > btcChange);
  const altSeasonIndex = (outperforming.length / top50.length) * 100;

  // Main gauge
  sheet.getCell('B4').value = '📊 CURRENT STATUS';
  sheet.getCell('B4').font = { bold: true, size: 14, color: { argb: COLORS.cyan } };

  sheet.getCell('B6').value = 'Altcoin Season Index:';
  sheet.getCell('C6').value = `${altSeasonIndex.toFixed(0)}%`;
  sheet.getCell('C6').font = { bold: true, size: 24, color: { argb: altSeasonIndex > 50 ? COLORS.cyan : COLORS.bitcoin } };

  createGauge(sheet, 7, 2, altSeasonIndex, { width: 30 });

  // Status
  sheet.getCell('B9').value = 'Current Phase:';
  const statusCell = sheet.getCell('C9');
  if (altSeasonIndex >= 75) {
    statusCell.value = '🌙 ALTCOIN SEASON';
    statusCell.font = { bold: true, color: { argb: COLORS.cyan } };
  } else if (altSeasonIndex >= 50) {
    statusCell.value = '⚖️ MIXED MARKET';
    statusCell.font = { bold: true, color: { argb: COLORS.warning } };
  } else if (altSeasonIndex >= 25) {
    statusCell.value = '₿ BTC LEANING';
    statusCell.font = { bold: true, color: { argb: COLORS.orange } };
  } else {
    statusCell.value = '₿ BITCOIN SEASON';
    statusCell.font = { bold: true, color: { argb: COLORS.bitcoin } };
  }

  // Dominance stats
  sheet.getCell('E4').value = '📈 DOMINANCE';
  sheet.getCell('E4').font = { bold: true, size: 14, color: { argb: COLORS.cyan } };

  const btcDom = globalData?.market_cap_percentage?.btc || 0;
  const ethDom = globalData?.market_cap_percentage?.eth || 0;
  const altDom = 100 - btcDom - ethDom;

  sheet.getCell('E6').value = 'BTC Dominance:';
  sheet.getCell('F6').value = `${btcDom.toFixed(1)}%`;
  sheet.getCell('F6').font = { bold: true, color: { argb: COLORS.bitcoin } };

  sheet.getCell('E7').value = 'ETH Dominance:';
  sheet.getCell('F7').value = `${ethDom.toFixed(1)}%`;
  sheet.getCell('F7').font = { bold: true, color: { argb: COLORS.ethereum } };

  sheet.getCell('E8').value = 'Altcoin Dominance:';
  sheet.getCell('F8').value = `${altDom.toFixed(1)}%`;
  sheet.getCell('F8').font = { bold: true, color: { argb: COLORS.cyan } };

  // Top performers vs BTC
  sheet.getCell('B12').value = '🏆 TOP ALTCOINS OUTPERFORMING BTC (24H)';
  sheet.getCell('B12').font = { bold: true, size: 12, color: { argb: COLORS.success } };

  const topAltPerformers = outperforming
    .sort((a, b) => (b.price_change_percentage_24h || 0) - (a.price_change_percentage_24h || 0))
    .slice(0, 10);

  ['Coin', '24h Change', 'vs BTC'].forEach((h, i) => {
    const cell = sheet.getCell(13, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  topAltPerformers.forEach((coin: any, i: number) => {
    const row = 14 + i;
    const change = coin.price_change_percentage_24h || 0;
    const vsBtc = change - btcChange;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`C${row}`).value = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    sheet.getCell(`C${row}`).font = { color: { argb: change >= 0 ? COLORS.success : COLORS.danger } };
    sheet.getCell(`D${row}`).value = `+${vsBtc.toFixed(2)}%`;
    sheet.getCell(`D${row}`).font = { color: { argb: COLORS.cyan } };
  });
}

// ============================================
// TOKEN UNLOCKS DASHBOARD
// ============================================

export function addTokenUnlocksDashboard(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Token_Unlocks', {
    properties: { tabColor: { argb: COLORS.warning } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 14;
  sheet.getColumn('D').width = 16;
  sheet.getColumn('E').width = 16;
  sheet.getColumn('F').width = 20;
  sheet.getColumn('G').width = 14;

  // Header
  sheet.mergeCells('B2:G2');
  const header = sheet.getCell('B2');
  header.value = '🔓 TOKEN UNLOCKS TRACKER';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.warning } };
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'Track upcoming token unlocks that may impact price. Large unlocks can create selling pressure.';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Info section
  sheet.getCell('B5').value = '📋 HOW TOKEN UNLOCKS WORK';
  sheet.getCell('B5').font = { bold: true, size: 12, color: { argb: COLORS.warning } };

  const info = [
    '• Tokens are often locked for team, investors, and advisors',
    '• Unlocks release these tokens to wallets that can sell',
    '• Large unlocks (>5% supply) can cause price drops',
    '• Watch unlock schedules before making buy decisions',
  ];

  info.forEach((text, i) => {
    sheet.getCell(`B${6 + i}`).value = text;
    sheet.getCell(`B${6 + i}`).font = { color: { argb: COLORS.light } };
  });

  // Simulated unlock data (in real app, would come from API)
  const headers = ['Token', 'Price', 'Circulating %', 'Max Supply', 'Unlock Risk', 'Impact'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(12, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Tokens with known supply dynamics
  const tokensWithUnlocks = [
    { id: 'solana', maxSupply: null, circulatingPercent: 75 },
    { id: 'arbitrum', maxSupply: 10000000000, circulatingPercent: 25 },
    { id: 'optimism', maxSupply: 4294967296, circulatingPercent: 22 },
    { id: 'aptos', maxSupply: null, circulatingPercent: 30 },
    { id: 'sui', maxSupply: 10000000000, circulatingPercent: 28 },
    { id: 'celestia', maxSupply: null, circulatingPercent: 20 },
    { id: 'starknet', maxSupply: 10000000000, circulatingPercent: 15 },
    { id: 'worldcoin-wld', maxSupply: 10000000000, circulatingPercent: 10 },
  ];

  tokensWithUnlocks.forEach((token, i) => {
    const coin = marketData.find(c => c.id === token.id);
    if (!coin) return;

    const row = 13 + i;
    const circulatingPercent = token.circulatingPercent;
    const remainingUnlock = 100 - circulatingPercent;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`D${row}`).value = `${circulatingPercent}%`;

    const supplyCell = sheet.getCell(`E${row}`);
    supplyCell.value = token.maxSupply ? formatCurrency(token.maxSupply) : 'Unlimited';

    const riskCell = sheet.getCell(`F${row}`);
    if (remainingUnlock > 70) {
      riskCell.value = '🔴 Very High Risk';
      riskCell.font = { color: { argb: COLORS.danger } };
    } else if (remainingUnlock > 50) {
      riskCell.value = '🟠 High Risk';
      riskCell.font = { color: { argb: COLORS.orange } };
    } else if (remainingUnlock > 30) {
      riskCell.value = '🟡 Medium Risk';
      riskCell.font = { color: { argb: COLORS.warning } };
    } else {
      riskCell.value = '🟢 Low Risk';
      riskCell.font = { color: { argb: COLORS.success } };
    }

    sheet.getCell(`G${row}`).value = `${remainingUnlock}% to unlock`;

    if (i % 2 === 0) {
      for (let col = 2; col <= 7; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });
}

// ============================================
// STAKING YIELDS DASHBOARD
// ============================================

export function addStakingYieldsDashboard(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Staking_Yields', {
    properties: { tabColor: { argb: COLORS.success } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 12;
  sheet.getColumn('D').width = 14;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 16;
  sheet.getColumn('G').width = 18;

  // Header
  sheet.mergeCells('B2:G2');
  const header = sheet.getCell('B2');
  header.value = '💰 STAKING YIELDS COMPARISON';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.success } };
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'Earn passive income by staking Proof-of-Stake cryptocurrencies';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Staking yields data (approximate values)
  const stakingData = [
    { id: 'ethereum', apy: 4.5, minStake: '32 ETH', lockup: 'Variable' },
    { id: 'solana', apy: 7.0, minStake: 'Any', lockup: '2-3 days' },
    { id: 'cardano', apy: 4.0, minStake: 'Any', lockup: 'None' },
    { id: 'polkadot', apy: 12.0, minStake: '120 DOT', lockup: '28 days' },
    { id: 'cosmos', apy: 15.0, minStake: 'Any', lockup: '21 days' },
    { id: 'near', apy: 9.0, minStake: 'Any', lockup: '2-3 days' },
    { id: 'avalanche-2', apy: 8.0, minStake: '25 AVAX', lockup: '14 days' },
    { id: 'tezos', apy: 5.5, minStake: 'Any', lockup: '2 weeks' },
    { id: 'algorand', apy: 5.0, minStake: 'Any', lockup: 'None' },
    { id: 'sui', apy: 4.0, minStake: 'Any', lockup: 'None' },
  ];

  const headers = ['Asset', 'Price', 'Est. APY', 'Min Stake', 'Lockup', 'Annual Yield ($1000)'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  stakingData.forEach((stake, i) => {
    const coin = marketData.find(c => c.id === stake.id);
    if (!coin) return;

    const row = 6 + i;
    const annualYield = 1000 * (stake.apy / 100);

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = formatPrice(coin.current_price);

    const apyCell = sheet.getCell(`D${row}`);
    apyCell.value = `${stake.apy}%`;
    apyCell.font = { bold: true, color: { argb: stake.apy >= 10 ? COLORS.success : stake.apy >= 5 ? COLORS.lime : COLORS.light } };

    sheet.getCell(`E${row}`).value = stake.minStake;
    sheet.getCell(`F${row}`).value = stake.lockup;

    const yieldCell = sheet.getCell(`G${row}`);
    yieldCell.value = `$${annualYield.toFixed(0)}`;
    yieldCell.font = { bold: true, color: { argb: COLORS.success } };

    if (i % 2 === 0) {
      for (let col = 2; col <= 7; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });

  // Best yields chart
  const chartRow = 6 + stakingData.length + 2;
  createHorizontalBarChart(sheet, chartRow, 2,
    stakingData
      .map(s => {
        const coin = marketData.find(c => c.id === s.id);
        return { label: coin?.symbol?.toUpperCase() || s.id, value: s.apy, color: COLORS.success };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 8),
    { title: '📊 APY Comparison' }
  );
}

// ============================================
// SOCIAL SENTIMENT DASHBOARD
// ============================================

export function addSocialSentimentDashboard(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Social_Sentiment', {
    properties: { tabColor: { argb: COLORS.info } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 12;
  sheet.getColumn('D').width = 12;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 16;
  sheet.getColumn('G').width = 20;

  // Header
  sheet.mergeCells('B2:G2');
  const header = sheet.getCell('B2');
  header.value = '📱 SOCIAL SENTIMENT ANALYSIS';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.info } };
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'Social media buzz and sentiment for major cryptocurrencies';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Headers
  const headers = ['Coin', 'Price', '24h %', 'Trend Score', 'Sentiment', 'Social Signal'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  // Calculate simulated social sentiment based on price action
  const coins = marketData.slice(0, 20);

  coins.forEach((coin: any, i: number) => {
    const row = 6 + i;
    const change = coin.price_change_percentage_24h || 0;
    const volume = coin.total_volume || 0;
    const mcap = coin.market_cap || 1;

    // Simulate sentiment score based on price change and volume ratio
    const volumeRatio = volume / mcap;
    const trendScore = Math.min(100, Math.max(0, 50 + change * 3 + volumeRatio * 100));

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = formatPrice(coin.current_price);

    const changeCell = sheet.getCell(`D${row}`);
    changeCell.value = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    changeCell.font = { color: { argb: change >= 0 ? COLORS.success : COLORS.danger } };

    sheet.getCell(`E${row}`).value = `${trendScore.toFixed(0)}/100`;

    const sentimentCell = sheet.getCell(`F${row}`);
    if (trendScore >= 70) {
      sentimentCell.value = '🟢 Very Bullish';
      sentimentCell.font = { color: { argb: COLORS.success } };
    } else if (trendScore >= 55) {
      sentimentCell.value = '🟢 Bullish';
      sentimentCell.font = { color: { argb: COLORS.lime } };
    } else if (trendScore >= 45) {
      sentimentCell.value = '⚪ Neutral';
      sentimentCell.font = { color: { argb: COLORS.light } };
    } else if (trendScore >= 30) {
      sentimentCell.value = '🔴 Bearish';
      sentimentCell.font = { color: { argb: COLORS.warning } };
    } else {
      sentimentCell.value = '🔴 Very Bearish';
      sentimentCell.font = { color: { argb: COLORS.danger } };
    }

    // Create sparkline-like sentiment bar
    const barLength = Math.round(trendScore / 5);
    sheet.getCell(`G${row}`).value = '█'.repeat(barLength) + '░'.repeat(20 - barLength);
    sheet.getCell(`G${row}`).font = { color: { argb: trendScore >= 50 ? COLORS.success : COLORS.danger } };

    if (i % 2 === 0) {
      for (let col = 2; col <= 7; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });
}

// ============================================
// DEVELOPER ACTIVITY DASHBOARD
// ============================================

export function addDeveloperActivityDashboard(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Dev_Activity', {
    properties: { tabColor: { argb: COLORS.dark } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 14;
  sheet.getColumn('D').width = 16;
  sheet.getColumn('E').width = 16;
  sheet.getColumn('F').width = 20;

  // Header
  sheet.mergeCells('B2:F2');
  const header = sheet.getCell('B2');
  header.value = '👨‍💻 DEVELOPER ACTIVITY';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dark } };
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'GitHub activity indicates project health and development progress';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Simulated dev activity data
  const devData = [
    { id: 'ethereum', commits: 5200, contributors: 890, stars: 45000 },
    { id: 'bitcoin', commits: 3800, contributors: 750, stars: 72000 },
    { id: 'solana', commits: 4100, contributors: 420, stars: 11000 },
    { id: 'polkadot', commits: 3200, contributors: 380, stars: 7000 },
    { id: 'cardano', commits: 2800, contributors: 290, stars: 3500 },
    { id: 'cosmos', commits: 2500, contributors: 310, stars: 5800 },
    { id: 'near', commits: 2100, contributors: 280, stars: 2100 },
    { id: 'avalanche-2', commits: 1900, contributors: 220, stars: 1800 },
    { id: 'chainlink', commits: 1700, contributors: 180, stars: 4200 },
    { id: 'uniswap', commits: 1500, contributors: 150, stars: 4100 },
  ];

  const headers = ['Project', 'Market Cap', 'Commits (Est.)', 'Contributors', 'Dev Score'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  devData.forEach((dev, i) => {
    const coin = marketData.find(c => c.id === dev.id);
    if (!coin) return;

    const row = 6 + i;
    const devScore = Math.min(100, (dev.commits / 50 + dev.contributors / 10 + dev.stars / 1000));

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = formatCurrency(coin.market_cap);
    sheet.getCell(`D${row}`).value = dev.commits.toLocaleString();
    sheet.getCell(`E${row}`).value = dev.contributors.toLocaleString();

    const scoreCell = sheet.getCell(`F${row}`);
    const barLength = Math.round(devScore / 5);
    scoreCell.value = '█'.repeat(barLength) + ` ${devScore.toFixed(0)}`;
    scoreCell.font = { color: { argb: devScore >= 70 ? COLORS.success : devScore >= 40 ? COLORS.warning : COLORS.danger } };

    if (i % 2 === 0) {
      for (let col = 2; col <= 6; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });
}

// ============================================
// EXCHANGE RESERVES DASHBOARD
// ============================================

export function addExchangeReservesDashboard(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Exchange_Reserves', {
    properties: { tabColor: { argb: COLORS.orange } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 20;
  sheet.getColumn('C').width = 16;
  sheet.getColumn('D').width = 16;
  sheet.getColumn('E').width = 16;
  sheet.getColumn('F').width = 18;

  // Header
  sheet.mergeCells('B2:F2');
  const header = sheet.getCell('B2');
  header.value = '🏦 EXCHANGE RESERVES';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.orange } };
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'Decreasing exchange reserves = Less selling pressure (bullish). Increasing = More selling pressure.';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Simulated exchange reserve data
  const reserveData = [
    { id: 'bitcoin', reservePercent: 12.5, trend: 'decreasing' },
    { id: 'ethereum', reservePercent: 11.2, trend: 'decreasing' },
    { id: 'binancecoin', reservePercent: 45.0, trend: 'stable' },
    { id: 'ripple', reservePercent: 38.0, trend: 'increasing' },
    { id: 'solana', reservePercent: 22.0, trend: 'decreasing' },
    { id: 'cardano', reservePercent: 15.0, trend: 'stable' },
    { id: 'dogecoin', reservePercent: 28.0, trend: 'increasing' },
    { id: 'polkadot', reservePercent: 18.0, trend: 'decreasing' },
  ];

  const headers = ['Asset', 'Circulating Supply', 'On Exchanges', 'Trend', 'Signal'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  reserveData.forEach((reserve, i) => {
    const coin = marketData.find(c => c.id === reserve.id);
    if (!coin) return;

    const row = 6 + i;
    const circulatingSupply = coin.circulating_supply || 0;
    const onExchanges = circulatingSupply * (reserve.reservePercent / 100);

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = formatLargeNumber(circulatingSupply);
    sheet.getCell(`D${row}`).value = `${reserve.reservePercent}%`;

    const trendCell = sheet.getCell(`E${row}`);
    if (reserve.trend === 'decreasing') {
      trendCell.value = '📉 Decreasing';
      trendCell.font = { color: { argb: COLORS.success } };
    } else if (reserve.trend === 'increasing') {
      trendCell.value = '📈 Increasing';
      trendCell.font = { color: { argb: COLORS.danger } };
    } else {
      trendCell.value = '➡️ Stable';
      trendCell.font = { color: { argb: COLORS.light } };
    }

    const signalCell = sheet.getCell(`F${row}`);
    if (reserve.trend === 'decreasing') {
      signalCell.value = '🟢 Bullish';
      signalCell.font = { color: { argb: COLORS.success } };
    } else if (reserve.trend === 'increasing') {
      signalCell.value = '🔴 Bearish';
      signalCell.font = { color: { argb: COLORS.danger } };
    } else {
      signalCell.value = '⚪ Neutral';
      signalCell.font = { color: { argb: COLORS.light } };
    }

    if (i % 2 === 0) {
      for (let col = 2; col <= 6; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });
}

// ============================================
// DEFI YIELDS DASHBOARD
// ============================================

export function addDeFiYieldsDashboard(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('DeFi_Yields', {
    properties: { tabColor: { argb: COLORS.purple } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 20;
  sheet.getColumn('C').width = 14;
  sheet.getColumn('D').width = 14;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 18;
  sheet.getColumn('G').width = 14;

  // Header
  sheet.mergeCells('B2:G2');
  const header = sheet.getCell('B2');
  header.value = '🌾 DEFI YIELD OPPORTUNITIES';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.purple } };
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'Top DeFi yield farming opportunities across protocols';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  // Simulated DeFi yield data
  const yieldData = [
    { protocol: 'Aave', chain: 'Ethereum', pool: 'USDC Lending', apy: 4.5, tvl: 8500000000, risk: 'Low' },
    { protocol: 'Compound', chain: 'Ethereum', pool: 'ETH Lending', apy: 2.8, tvl: 3200000000, risk: 'Low' },
    { protocol: 'Lido', chain: 'Ethereum', pool: 'ETH Staking', apy: 4.2, tvl: 25000000000, risk: 'Low' },
    { protocol: 'Curve', chain: 'Ethereum', pool: '3pool', apy: 3.5, tvl: 1800000000, risk: 'Low' },
    { protocol: 'Uniswap', chain: 'Ethereum', pool: 'ETH/USDC LP', apy: 12.0, tvl: 450000000, risk: 'Medium' },
    { protocol: 'GMX', chain: 'Arbitrum', pool: 'GLP', apy: 18.0, tvl: 550000000, risk: 'Medium' },
    { protocol: 'Raydium', chain: 'Solana', pool: 'SOL/USDC LP', apy: 25.0, tvl: 120000000, risk: 'High' },
    { protocol: 'Marinade', chain: 'Solana', pool: 'mSOL', apy: 7.5, tvl: 850000000, risk: 'Low' },
    { protocol: 'Convex', chain: 'Ethereum', pool: 'cvxCRV', apy: 8.0, tvl: 1200000000, risk: 'Medium' },
    { protocol: 'Yearn', chain: 'Ethereum', pool: 'yvUSDC', apy: 5.5, tvl: 420000000, risk: 'Low' },
  ];

  const headers = ['Protocol', 'Chain', 'Pool', 'APY', 'TVL', 'Risk'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  yieldData.forEach((yield_, i) => {
    const row = 6 + i;

    sheet.getCell(`B${row}`).value = yield_.protocol;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = yield_.chain;
    sheet.getCell(`D${row}`).value = yield_.pool;

    const apyCell = sheet.getCell(`E${row}`);
    apyCell.value = `${yield_.apy}%`;
    apyCell.font = { bold: true, color: { argb: yield_.apy >= 15 ? COLORS.success : yield_.apy >= 8 ? COLORS.lime : COLORS.light } };

    sheet.getCell(`F${row}`).value = formatCurrency(yield_.tvl);

    const riskCell = sheet.getCell(`G${row}`);
    if (yield_.risk === 'Low') {
      riskCell.value = '🟢 Low';
      riskCell.font = { color: { argb: COLORS.success } };
    } else if (yield_.risk === 'Medium') {
      riskCell.value = '🟡 Medium';
      riskCell.font = { color: { argb: COLORS.warning } };
    } else {
      riskCell.value = '🔴 High';
      riskCell.font = { color: { argb: COLORS.danger } };
    }

    if (i % 2 === 0) {
      for (let col = 2; col <= 7; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });

  // Warning
  const warnRow = 6 + yieldData.length + 2;
  sheet.mergeCells(`B${warnRow}:G${warnRow}`);
  sheet.getCell(`B${warnRow}`).value = '⚠️ DeFi carries smart contract risk. Higher APY often means higher risk. DYOR!';
  sheet.getCell(`B${warnRow}`).font = { italic: true, color: { argb: COLORS.warning } };
  sheet.getCell(`B${warnRow}`).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
}

// ============================================
// METAVERSE TOKENS DASHBOARD
// ============================================

export function addMetaverseTokensDashboard(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Metaverse', {
    properties: { tabColor: { argb: COLORS.pink } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 10;
  sheet.getColumn('D').width = 14;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 12;
  sheet.getColumn('G').width = 14;
  sheet.getColumn('H').width = 18;

  // Header
  sheet.mergeCells('B2:H2');
  const header = sheet.getCell('B2');
  header.value = '🌐 METAVERSE & VIRTUAL WORLDS';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.pink } };
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'Tokens powering virtual worlds, digital land, and metaverse experiences';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  const metaverseIds = ['the-sandbox', 'decentraland', 'axie-infinity', 'enjincoin', 'render-token', 'gala', 'illuvium', 'ultra', 'highstreet', 'star-atlas'];
  const metaverseCoins = metaverseIds.map(id => marketData.find(c => c.id === id)).filter(Boolean);

  const headers = ['Project', 'Symbol', 'Price', 'Market Cap', '24h %', 'From ATH', 'Category'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  const categories: Record<string, string> = {
    'the-sandbox': 'Virtual World',
    'decentraland': 'Virtual World',
    'axie-infinity': 'Gaming',
    'enjincoin': 'NFT Gaming',
    'render-token': 'Graphics/GPU',
    'gala': 'Gaming Platform',
    'illuvium': 'Gaming',
    'ultra': 'Game Distribution',
    'highstreet': 'Commerce',
    'star-atlas': 'Gaming',
  };

  metaverseCoins.forEach((coin: any, i: number) => {
    const row = 6 + i;
    const change = coin.price_change_percentage_24h || 0;
    const fromAth = coin.ath_change_percentage || 0;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`D${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`E${row}`).value = formatCurrency(coin.market_cap);

    const changeCell = sheet.getCell(`F${row}`);
    changeCell.value = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    changeCell.font = { color: { argb: change >= 0 ? COLORS.success : COLORS.danger } };

    sheet.getCell(`G${row}`).value = `${fromAth.toFixed(1)}%`;
    sheet.getCell(`G${row}`).font = { color: { argb: COLORS.danger } };

    sheet.getCell(`H${row}`).value = categories[coin.id] || 'Metaverse';

    if (i % 2 === 0) {
      for (let col = 2; col <= 8; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });
}

// ============================================
// PRIVACY COINS DASHBOARD
// ============================================

export function addPrivacyCoinsDashboard(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Privacy_Coins', {
    properties: { tabColor: { argb: COLORS.dark } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 18;
  sheet.getColumn('C').width = 10;
  sheet.getColumn('D').width = 14;
  sheet.getColumn('E').width = 14;
  sheet.getColumn('F').width = 12;
  sheet.getColumn('G').width = 20;

  // Header
  sheet.mergeCells('B2:G2');
  const header = sheet.getCell('B2');
  header.value = '🔒 PRIVACY COINS';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.dark } };
  sheet.getRow(2).height = 40;

  sheet.getCell('B3').value = 'Cryptocurrencies focused on transaction privacy and anonymity';
  sheet.getCell('B3').font = { italic: true, color: { argb: COLORS.light } };

  const privacyIds = ['monero', 'zcash', 'dash', 'secret', 'horizen', 'beam', 'pirate-chain', 'haven-protocol'];
  const privacyCoins = privacyIds.map(id => marketData.find(c => c.id === id)).filter(Boolean);

  const headers = ['Coin', 'Symbol', 'Price', 'Market Cap', '24h %', 'Privacy Tech'];
  headers.forEach((h, i) => {
    const cell = sheet.getCell(5, i + 2);
    cell.value = h;
    Object.assign(cell, STYLES.columnHeader);
  });

  const privacyTech: Record<string, string> = {
    'monero': 'Ring Signatures + Stealth',
    'zcash': 'zk-SNARKs',
    'dash': 'CoinJoin (PrivateSend)',
    'secret': 'Encrypted Smart Contracts',
    'horizen': 'zk-SNARKs',
    'beam': 'MimbleWimble',
    'pirate-chain': 'zk-SNARKs (forced)',
    'haven-protocol': 'Ring Signatures',
  };

  privacyCoins.forEach((coin: any, i: number) => {
    const row = 6 + i;
    const change = coin.price_change_percentage_24h || 0;

    sheet.getCell(`B${row}`).value = coin.name;
    sheet.getCell(`B${row}`).font = { bold: true };
    sheet.getCell(`C${row}`).value = coin.symbol?.toUpperCase();
    sheet.getCell(`D${row}`).value = formatPrice(coin.current_price);
    sheet.getCell(`E${row}`).value = formatCurrency(coin.market_cap);

    const changeCell = sheet.getCell(`F${row}`);
    changeCell.value = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    changeCell.font = { color: { argb: change >= 0 ? COLORS.success : COLORS.danger } };

    sheet.getCell(`G${row}`).value = privacyTech[coin.id] || 'Various';

    if (i % 2 === 0) {
      for (let col = 2; col <= 7; col++) {
        sheet.getCell(row, col).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.surface } };
      }
    }
  });

  // Disclaimer
  const disclaimerRow = 6 + privacyCoins.length + 2;
  sheet.mergeCells(`B${disclaimerRow}:G${disclaimerRow}`);
  sheet.getCell(`B${disclaimerRow}`).value = '⚠️ Note: Privacy coins may face regulatory restrictions in some jurisdictions.';
  sheet.getCell(`B${disclaimerRow}`).font = { italic: true, color: { argb: COLORS.warning } };
}

// ============================================
// MINING CALCULATOR
// ============================================

export function addMiningCalculatorDashboard(
  workbook: ExcelJS.Workbook,
  marketData: any[]
) {
  const sheet = workbook.addWorksheet('Mining_Calculator', {
    properties: { tabColor: { argb: COLORS.orange } }
  });

  sheet.getColumn('A').width = 3;
  sheet.getColumn('B').width = 25;
  sheet.getColumn('C').width = 20;
  sheet.getColumn('D').width = 3;
  sheet.getColumn('E').width = 25;
  sheet.getColumn('F').width = 20;

  // Header
  sheet.mergeCells('B2:F2');
  const header = sheet.getCell('B2');
  header.value = '⛏️ MINING PROFITABILITY CALCULATOR';
  Object.assign(header, STYLES.header);
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: COLORS.orange } };
  sheet.getRow(2).height = 40;

  const btc = marketData.find(c => c.id === 'bitcoin');
  const btcPrice = btc?.current_price || 40000;

  // Bitcoin Mining Section
  sheet.getCell('B4').value = '₿ BITCOIN MINING';
  sheet.getCell('B4').font = { bold: true, size: 14, color: { argb: COLORS.bitcoin } };

  const miningInputs = [
    { label: 'Hash Rate (TH/s)', value: 100, note: 'e.g., Antminer S19 Pro = 110 TH/s' },
    { label: 'Power (Watts)', value: 3250, note: 'e.g., Antminer S19 Pro = 3250W' },
    { label: 'Electricity ($/kWh)', value: 0.08, note: 'Average US rate ~$0.08-0.12' },
    { label: 'Pool Fee (%)', value: 2, note: 'Most pools charge 1-3%' },
    { label: 'BTC Price', value: btcPrice, note: 'Current price from CoinGecko' },
  ];

  miningInputs.forEach((input, i) => {
    const row = 6 + i;
    sheet.getCell(`B${row}`).value = input.label;
    const cell = sheet.getCell(`C${row}`);
    cell.value = input.value;
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
    cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
  });

  // Results
  sheet.getCell('B12').value = '📊 ESTIMATED RESULTS';
  sheet.getCell('B12').font = { bold: true, size: 12, color: { argb: COLORS.success } };

  // Simplified calculation (actual would need network difficulty)
  const hashRate = 100;
  const btcPerDayEst = 0.00000682; // Approximate for 100 TH/s
  const dailyBtc = hashRate * btcPerDayEst;
  const dailyRevenue = dailyBtc * btcPrice;
  const dailyPowerCost = (3250 * 24 / 1000) * 0.08;
  const dailyProfit = dailyRevenue - dailyPowerCost;

  const results = [
    { label: 'Est. Daily BTC', value: dailyBtc.toFixed(8), color: COLORS.bitcoin },
    { label: 'Est. Daily Revenue', value: `$${dailyRevenue.toFixed(2)}`, color: COLORS.success },
    { label: 'Daily Power Cost', value: `$${dailyPowerCost.toFixed(2)}`, color: COLORS.danger },
    { label: 'Daily Profit', value: `$${dailyProfit.toFixed(2)}`, color: dailyProfit >= 0 ? COLORS.success : COLORS.danger },
    { label: 'Monthly Profit', value: `$${(dailyProfit * 30).toFixed(2)}`, color: dailyProfit >= 0 ? COLORS.success : COLORS.danger },
    { label: 'Annual Profit', value: `$${(dailyProfit * 365).toFixed(2)}`, color: dailyProfit >= 0 ? COLORS.success : COLORS.danger },
  ];

  results.forEach((result, i) => {
    const row = 13 + i;
    sheet.getCell(`B${row}`).value = result.label;
    sheet.getCell(`C${row}`).value = result.value;
    sheet.getCell(`C${row}`).font = { bold: true, color: { argb: result.color } };
  });

  // ROI Calculator
  sheet.getCell('E4').value = '💵 ROI CALCULATOR';
  sheet.getCell('E4').font = { bold: true, size: 14, color: { argb: COLORS.success } };

  sheet.getCell('E6').value = 'Hardware Cost';
  sheet.getCell('F6').value = 3000;
  sheet.getCell('F6').numFmt = '$#,##0';
  sheet.getCell('F6').fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };

  const monthlyProfit = dailyProfit * 30;
  const roiMonths = 3000 / monthlyProfit;

  sheet.getCell('E8').value = 'Monthly Profit:';
  sheet.getCell('F8').value = `$${monthlyProfit.toFixed(2)}`;
  sheet.getCell('F8').font = { bold: true, color: { argb: COLORS.success } };

  sheet.getCell('E9').value = 'Break-even:';
  sheet.getCell('F9').value = `${roiMonths.toFixed(1)} months`;
  sheet.getCell('F9').font = { bold: true, color: { argb: COLORS.info } };

  // Disclaimer
  sheet.mergeCells('E12:F12');
  sheet.getCell('E12').value = '⚠️ Estimates based on current difficulty. Actual results vary.';
  sheet.getCell('E12').font = { italic: true, size: 10, color: { argb: COLORS.warning } };
}

// ============================================
// HELPER FUNCTIONS (Additional)
// ============================================

function formatLargeNumber(value: number): string {
  if (!value || isNaN(value)) return 'N/A';
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toLocaleString();
}
