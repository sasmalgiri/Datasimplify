'use client';

import type { DashboardData, MarketCoin, GlobalData, TrendingCoin, FearGreedData } from './store';

/**
 * Export live dashboard data as Excel (.xlsx) using ExcelJS.
 * Dynamic import keeps ExcelJS out of the main bundle.
 */
export async function exportDashboardAsExcel(
  dashboardName: string,
  data: DashboardData,
): Promise<void> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CryptoReportKit';
  workbook.created = new Date();

  const date = new Date().toLocaleDateString();
  const slug = dashboardName.toLowerCase().replace(/\s+/g, '-');

  // ── Market Data sheet ──
  if (data.markets?.length) {
    const ws = workbook.addWorksheet('Market Data');
    addHeader(ws, `${dashboardName} — Market Data`, date);

    ws.columns = [
      { header: '#', key: 'rank', width: 6 },
      { header: 'Coin', key: 'name', width: 18 },
      { header: 'Symbol', key: 'symbol', width: 10 },
      { header: 'Price (USD)', key: 'price', width: 16 },
      { header: '24h %', key: 'change24h', width: 10 },
      { header: '7d %', key: 'change7d', width: 10 },
      { header: 'Market Cap', key: 'marketCap', width: 20 },
      { header: 'Volume (24h)', key: 'volume', width: 20 },
      { header: '24h High', key: 'high', width: 16 },
      { header: '24h Low', key: 'low', width: 16 },
    ];
    styleHeaderRow(ws, 3);

    data.markets.forEach((c: MarketCoin) => {
      ws.addRow({
        rank: c.market_cap_rank,
        name: c.name,
        symbol: c.symbol.toUpperCase(),
        price: c.current_price,
        change24h: c.price_change_percentage_24h,
        change7d: c.price_change_percentage_7d_in_currency ?? '',
        marketCap: c.market_cap,
        volume: c.total_volume,
        high: c.high_24h ?? '',
        low: c.low_24h ?? '',
      });
    });

    formatCurrency(ws, 'D', 4, ws.rowCount);
    formatCurrency(ws, 'I', 4, ws.rowCount);
    formatCurrency(ws, 'J', 4, ws.rowCount);
    formatPercent(ws, 'E', 4, ws.rowCount);
    formatPercent(ws, 'F', 4, ws.rowCount);
    formatNumber(ws, 'G', 4, ws.rowCount);
    formatNumber(ws, 'H', 4, ws.rowCount);
  }

  // ── Global Stats sheet ──
  if (data.global) {
    const ws = workbook.addWorksheet('Global Stats');
    addHeader(ws, `${dashboardName} — Global Stats`, date);

    const g: GlobalData = data.global;
    ws.addRow(['Total Market Cap (USD)', g.total_market_cap?.usd ?? '']);
    ws.addRow(['Total Volume (USD)', g.total_volume?.usd ?? '']);
    ws.addRow(['24h Market Cap Change', g.market_cap_change_percentage_24h_usd]);
    ws.addRow(['Active Cryptocurrencies', g.active_cryptocurrencies]);
    ws.addRow(['Markets', g.markets]);
    ws.addRow([]);
    ws.addRow(['Dominance']);

    if (g.market_cap_percentage) {
      Object.entries(g.market_cap_percentage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([coin, pct]) => {
          ws.addRow([coin.toUpperCase(), pct]);
        });
    }

    ws.getColumn(1).width = 28;
    ws.getColumn(2).width = 22;
  }

  // ── Trending sheet ──
  if (data.trending?.length) {
    const ws = workbook.addWorksheet('Trending');
    addHeader(ws, `${dashboardName} — Trending Coins`, date);

    ws.columns = [
      { header: '#', key: 'rank', width: 6 },
      { header: 'Coin', key: 'name', width: 20 },
      { header: 'Symbol', key: 'symbol', width: 10 },
      { header: 'Price (USD)', key: 'price', width: 16 },
      { header: '24h %', key: 'change', width: 10 },
    ];
    styleHeaderRow(ws, 3);

    data.trending.forEach((t: TrendingCoin) => {
      ws.addRow({
        rank: t.item.market_cap_rank,
        name: t.item.name,
        symbol: t.item.symbol.toUpperCase(),
        price: t.item.data?.price ?? '',
        change: t.item.data?.price_change_percentage_24h?.usd ?? '',
      });
    });
  }

  // ── Fear & Greed sheet ──
  if (data.fearGreed?.length) {
    const ws = workbook.addWorksheet('Fear & Greed');
    addHeader(ws, `${dashboardName} — Fear & Greed Index`, date);

    ws.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Value', key: 'value', width: 10 },
      { header: 'Classification', key: 'classification', width: 22 },
    ];
    styleHeaderRow(ws, 3);

    data.fearGreed.forEach((fg: FearGreedData) => {
      const d = new Date(Number(fg.timestamp) * 1000);
      ws.addRow({
        date: d.toLocaleDateString(),
        value: Number(fg.value),
        classification: fg.value_classification,
      });
    });
  }

  // ── Categories sheet ──
  if (data.categories?.length) {
    const ws = workbook.addWorksheet('Categories');
    addHeader(ws, `${dashboardName} — Categories`, date);

    ws.columns = [
      { header: 'Category', key: 'name', width: 30 },
      { header: 'Market Cap', key: 'marketCap', width: 20 },
      { header: '24h Volume', key: 'volume', width: 20 },
      { header: '24h %', key: 'change', width: 10 },
    ];
    styleHeaderRow(ws, 3);

    data.categories.forEach((cat: any) => {
      ws.addRow({
        name: cat.name,
        marketCap: cat.market_cap ?? '',
        volume: cat.total_volume ?? '',
        change: cat.market_cap_change_percentage_24h ?? '',
      });
    });
  }

  // ── Exchanges sheet ──
  if (data.exchanges?.length) {
    const ws = workbook.addWorksheet('Exchanges');
    addHeader(ws, `${dashboardName} — Exchanges`, date);

    ws.columns = [
      { header: '#', key: 'rank', width: 6 },
      { header: 'Exchange', key: 'name', width: 24 },
      { header: 'Trust Score', key: 'trust', width: 12 },
      { header: '24h Volume (BTC)', key: 'volume', width: 20 },
      { header: 'Year Est.', key: 'year', width: 10 },
    ];
    styleHeaderRow(ws, 3);

    data.exchanges.forEach((ex: any) => {
      ws.addRow({
        rank: ex.trust_score_rank,
        name: ex.name,
        trust: ex.trust_score,
        volume: ex.trade_volume_24h_btc ?? '',
        year: ex.year_established ?? '',
      });
    });
  }

  // ── Footer disclaimer on first sheet ──
  if (workbook.worksheets.length > 0) {
    const first = workbook.worksheets[0];
    first.addRow([]);
    const r = first.addRow(['For personal use only. Data sourced from CoinGecko via your API key. cryptoreportkit.com']);
    r.getCell(1).font = { size: 9, italic: true, color: { argb: 'FF999999' } };
  }

  // ── Download ──
  const buf = await workbook.xlsx.writeBuffer();
  downloadBlob(buf, `${slug}-${isoDate()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}

/**
 * Export live dashboard data as CSV.
 * Only exports market data (the primary table).
 */
export function exportDashboardAsCsv(
  dashboardName: string,
  data: DashboardData,
): void {
  if (!data.markets?.length) return;

  const header = ['Rank', 'Name', 'Symbol', 'Price (USD)', '24h %', '7d %', 'Market Cap', 'Volume (24h)', '24h High', '24h Low'];
  const rows = data.markets.map((c: MarketCoin) => [
    c.market_cap_rank,
    `"${c.name}"`,
    c.symbol.toUpperCase(),
    c.current_price,
    c.price_change_percentage_24h,
    c.price_change_percentage_7d_in_currency ?? '',
    c.market_cap,
    c.total_volume,
    c.high_24h ?? '',
    c.low_24h ?? '',
  ].join(','));

  const csv = [header.join(','), ...rows].join('\n');
  const slug = dashboardName.toLowerCase().replace(/\s+/g, '-');
  downloadBlob(csv, `${slug}-${isoDate()}.csv`, 'text/csv;charset=utf-8;');
}

// ── Helpers ──

function addHeader(ws: any, title: string, date: string) {
  const titleRow = ws.addRow([title]);
  titleRow.getCell(1).font = { size: 14, bold: true, color: { argb: 'FF10B981' } };
  const dateRow = ws.addRow([`Generated ${date} — CryptoReportKit`]);
  dateRow.getCell(1).font = { size: 10, italic: true, color: { argb: 'FF999999' } };
  ws.addRow([]);
}

function styleHeaderRow(ws: any, rowNum: number) {
  const row = ws.getRow(rowNum);
  row.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };
  row.eachCell((cell: any) => {
    cell.border = { bottom: { style: 'thin', color: { argb: 'FF374151' } } };
  });
}

function formatCurrency(ws: any, col: string, startRow: number, endRow: number) {
  for (let i = startRow; i <= endRow; i++) {
    ws.getCell(`${col}${i}`).numFmt = '$#,##0.00';
  }
}

function formatPercent(ws: any, col: string, startRow: number, endRow: number) {
  for (let i = startRow; i <= endRow; i++) {
    const cell = ws.getCell(`${col}${i}`);
    cell.numFmt = '0.00"%"';
  }
}

function formatNumber(ws: any, col: string, startRow: number, endRow: number) {
  for (let i = startRow; i <= endRow; i++) {
    ws.getCell(`${col}${i}`).numFmt = '#,##0';
  }
}

function isoDate() {
  return new Date().toISOString().split('T')[0];
}

function downloadBlob(data: any, filename: string, mimeType: string) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
