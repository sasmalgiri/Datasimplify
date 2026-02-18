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
      { header: 'Circulating Supply', key: 'circSupply', width: 20 },
      { header: 'Max Supply', key: 'maxSupply', width: 20 },
      { header: 'Supply %', key: 'supplyPct', width: 12 },
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
        circSupply: c.circulating_supply ?? '',
        maxSupply: c.max_supply ?? '',
        supplyPct:
          c.circulating_supply && c.max_supply
            ? parseFloat(((c.circulating_supply / c.max_supply) * 100).toFixed(1))
            : '',
      });
    });

    formatCurrency(ws, 'D', 4, ws.rowCount);
    formatCurrency(ws, 'I', 4, ws.rowCount);
    formatCurrency(ws, 'J', 4, ws.rowCount);
    formatPercent(ws, 'E', 4, ws.rowCount);
    formatPercent(ws, 'F', 4, ws.rowCount);
    formatNumber(ws, 'G', 4, ws.rowCount);
    formatNumber(ws, 'H', 4, ws.rowCount);
    formatNumber(ws, 'K', 4, ws.rowCount);
    formatNumber(ws, 'L', 4, ws.rowCount);
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
        date: d.toISOString().split('T')[0],
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

  // ── OHLC Data sheet ──
  if (data.ohlc && Object.keys(data.ohlc).length > 0) {
    const ws = workbook.addWorksheet('OHLC Data');
    addHeader(ws, `${dashboardName} — OHLC Data`, date);

    ws.columns = [
      { header: 'Coin', key: 'coin', width: 14 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Open', key: 'open', width: 14 },
      { header: 'High', key: 'high', width: 14 },
      { header: 'Low', key: 'low', width: 14 },
      { header: 'Close', key: 'close', width: 14 },
    ];
    styleHeaderRow(ws, 3);

    for (const [coinId, candles] of Object.entries(data.ohlc)) {
      if (!Array.isArray(candles)) continue;
      for (const candle of candles) {
        ws.addRow({
          coin: coinId,
          date: new Date(candle[0]).toISOString().split('T')[0],
          open: candle[1],
          high: candle[2],
          low: candle[3],
          close: candle[4],
        });
      }
    }

    formatCurrency(ws, 'C', 4, ws.rowCount);
    formatCurrency(ws, 'D', 4, ws.rowCount);
    formatCurrency(ws, 'E', 4, ws.rowCount);
    formatCurrency(ws, 'F', 4, ws.rowCount);
  }

  // ── Historical Data sheet (coinHistory) ──
  if (data.coinHistory) {
    const ws = workbook.addWorksheet('Historical Data');
    addHeader(ws, `${dashboardName} — Historical Price Data`, date);

    ws.columns = [
      { header: 'Date', key: 'date', width: 14 },
      { header: 'Price (USD)', key: 'price', width: 16 },
      { header: 'Market Cap', key: 'marketCap', width: 20 },
      { header: 'Volume', key: 'volume', width: 20 },
    ];
    styleHeaderRow(ws, 3);

    const history = data.coinHistory as Record<string, [number, number][]>;
    const prices: [number, number][] = history.prices || [];
    const mcaps: [number, number][] = history.market_caps || [];
    const vols: [number, number][] = history.total_volumes || [];

    prices.forEach((p, i) => {
      ws.addRow({
        date: new Date(p[0]).toISOString().split('T')[0],
        price: p[1],
        marketCap: mcaps[i]?.[1] ?? '',
        volume: vols[i]?.[1] ?? '',
      });
    });

    formatCurrency(ws, 'B', 4, ws.rowCount);
    formatNumber(ws, 'C', 4, ws.rowCount);
    formatNumber(ws, 'D', 4, ws.rowCount);
  }

  // ── Derivatives sheet ──
  if (data.derivatives?.length) {
    const ws = workbook.addWorksheet('Derivatives');
    addHeader(ws, `${dashboardName} — Derivatives`, date);

    ws.columns = [
      { header: 'Market', key: 'market', width: 20 },
      { header: 'Symbol', key: 'symbol', width: 16 },
      { header: 'Price', key: 'price', width: 14 },
      { header: '24h %', key: 'change', width: 10 },
      { header: 'Funding Rate', key: 'funding', width: 14 },
      { header: 'Open Interest', key: 'oi', width: 18 },
      { header: 'Volume (24h)', key: 'volume', width: 18 },
      { header: 'Type', key: 'type', width: 14 },
    ];
    styleHeaderRow(ws, 3);

    data.derivatives!.forEach((d) => {
      ws.addRow({
        market: d.market,
        symbol: d.symbol,
        price: d.price,
        change: d.price_percentage_change_24h,
        funding: d.funding_rate,
        oi: d.open_interest,
        volume: d.volume_24h,
        type: d.contract_type,
      });
    });
  }

  // ── DeFi Global sheet ──
  if (data.defiGlobal) {
    const ws = workbook.addWorksheet('DeFi Global');
    addHeader(ws, `${dashboardName} — DeFi Global Stats`, date);

    const dg = data.defiGlobal;
    ws.addRow(['DeFi Market Cap', dg.defi_market_cap ?? '']);
    ws.addRow(['ETH Market Cap', dg.eth_market_cap ?? '']);
    ws.addRow(['DeFi to ETH Ratio', dg.defi_to_eth_ratio ?? '']);
    ws.addRow(['DeFi Trading Volume (24h)', dg.trading_volume_24h ?? '']);
    ws.addRow(['DeFi Dominance', dg.defi_dominance ?? '']);
    ws.addRow(['Top Coin', dg.top_coin_name ?? '']);
    ws.addRow(['Top Coin DeFi Dominance', dg.top_coin_defi_dominance ?? '']);

    ws.getColumn(1).width = 28;
    ws.getColumn(2).width = 22;
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
 * Export live dashboard data as a ZIP of CSV files.
 * Each data type gets its own CSV file inside the archive.
 */
export async function exportDashboardAsCsv(
  dashboardName: string,
  data: DashboardData,
): Promise<void> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();
  const slug = dashboardName.toLowerCase().replace(/\s+/g, '-');
  let hasFiles = false;

  // Helper: escape double quotes in CSV fields per RFC 4180
  const q = (v: string) => `"${v.replace(/"/g, '""')}"`;
  // Helper: add UTF-8 BOM for Windows Excel compatibility
  const bom = '\uFEFF';

  // Markets CSV
  if (data.markets?.length) {
    const header = ['Rank', 'Name', 'Symbol', 'Price (USD)', '24h %', '7d %', 'Market Cap', 'Volume (24h)', '24h High', '24h Low', 'Circulating Supply', 'Max Supply', 'Supply %'];
    const rows = data.markets.map((c: MarketCoin) => [
      c.market_cap_rank,
      q(c.name),
      c.symbol.toUpperCase(),
      c.current_price,
      c.price_change_percentage_24h,
      c.price_change_percentage_7d_in_currency ?? '',
      c.market_cap,
      c.total_volume,
      c.high_24h ?? '',
      c.low_24h ?? '',
      c.circulating_supply ?? '',
      c.max_supply ?? '',
      c.circulating_supply && c.max_supply ? ((c.circulating_supply / c.max_supply) * 100).toFixed(1) : '',
    ].join(','));
    zip.file('markets.csv', bom + [header.join(','), ...rows].join('\n') + '\n');
    hasFiles = true;
  }

  // Global CSV
  if (data.global) {
    const g = data.global;
    const lines = [
      'Metric,Value',
      `Total Market Cap (USD),${g.total_market_cap?.usd ?? ''}`,
      `Total Volume (USD),${g.total_volume?.usd ?? ''}`,
      `24h Market Cap Change %,${g.market_cap_change_percentage_24h_usd}`,
      `Active Cryptocurrencies,${g.active_cryptocurrencies}`,
      `Markets,${g.markets}`,
    ];
    if (g.market_cap_percentage) {
      lines.push('', 'Coin,Dominance %');
      Object.entries(g.market_cap_percentage)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10)
        .forEach(([coin, pct]) => lines.push(`${coin.toUpperCase()},${pct}`));
    }
    zip.file('global.csv', bom + lines.join('\n') + '\n');
    hasFiles = true;
  }

  // Trending CSV
  if (data.trending?.length) {
    const header = 'Rank,Name,Symbol,Price,24h %';
    const rows = data.trending.map((t: TrendingCoin) =>
      `${t.item.market_cap_rank},${q(t.item.name)},${t.item.symbol.toUpperCase()},${t.item.data?.price ?? ''},${t.item.data?.price_change_percentage_24h?.usd ?? ''}`,
    );
    zip.file('trending.csv', bom + [header, ...rows].join('\n') + '\n');
    hasFiles = true;
  }

  // Fear & Greed CSV
  if (data.fearGreed?.length) {
    const header = 'Date,Value,Classification';
    const rows = data.fearGreed.map((fg: FearGreedData) => {
      const d = new Date(Number(fg.timestamp) * 1000);
      return `${d.toISOString().split('T')[0]},${fg.value},${q(fg.value_classification)}`;
    });
    zip.file('fear-greed.csv', bom + [header, ...rows].join('\n') + '\n');
    hasFiles = true;
  }

  // Categories CSV
  if (data.categories?.length) {
    const header = 'Category,Market Cap,24h Volume,24h %';
    const rows = data.categories.map((cat: any) =>
      `${q(cat.name)},${cat.market_cap ?? ''},${cat.total_volume ?? ''},${cat.market_cap_change_percentage_24h ?? ''}`,
    );
    zip.file('categories.csv', bom + [header, ...rows].join('\n') + '\n');
    hasFiles = true;
  }

  // Exchanges CSV
  if (data.exchanges?.length) {
    const header = 'Rank,Exchange,Trust Score,24h Volume (BTC),Year Est.';
    const rows = data.exchanges.map((ex: any) =>
      `${ex.trust_score_rank},${q(ex.name)},${ex.trust_score},${ex.trade_volume_24h_btc ?? ''},${ex.year_established ?? ''}`,
    );
    zip.file('exchanges.csv', bom + [header, ...rows].join('\n') + '\n');
    hasFiles = true;
  }

  // OHLC CSV
  if (data.ohlc && Object.keys(data.ohlc).length > 0) {
    const header = 'Coin,Date,Open,High,Low,Close';
    const rows: string[] = [];
    for (const [coinId, candles] of Object.entries(data.ohlc)) {
      if (!Array.isArray(candles)) continue;
      for (const candle of candles) {
        rows.push(`${coinId},${new Date(candle[0]).toISOString().split('T')[0]},${candle[1]},${candle[2]},${candle[3]},${candle[4]}`);
      }
    }
    if (rows.length > 0) {
      zip.file('ohlc.csv', bom + [header, ...rows].join('\n') + '\n');
      hasFiles = true;
    }
  }

  // Historical CSV
  if (data.coinHistory) {
    const history = data.coinHistory as Record<string, [number, number][]>;
    const prices: [number, number][] = history.prices || [];
    if (prices.length > 0) {
      const mcaps: [number, number][] = history.market_caps || [];
      const vols: [number, number][] = history.total_volumes || [];
      const header = 'Date,Price (USD),Market Cap,Volume';
      const rows = prices.map((p, i) =>
        `${new Date(p[0]).toISOString().split('T')[0]},${p[1]},${mcaps[i]?.[1] ?? ''},${vols[i]?.[1] ?? ''}`,
      );
      zip.file('historical.csv', bom + [header, ...rows].join('\n') + '\n');
      hasFiles = true;
    }
  }

  // Derivatives CSV
  if (data.derivatives?.length) {
    const header = 'Market,Symbol,Price,24h %,Funding Rate,Open Interest,Volume 24h,Type';
    const rows = data.derivatives!.map((d) =>
      `${q(d.market)},${q(d.symbol)},${d.price},${d.price_percentage_change_24h},${d.funding_rate},${d.open_interest},${d.volume_24h},${q(d.contract_type)}`,
    );
    zip.file('derivatives.csv', bom + [header, ...rows].join('\n') + '\n');
    hasFiles = true;
  }

  // DeFi Global CSV
  if (data.defiGlobal) {
    const dg = data.defiGlobal;
    const lines = [
      'Metric,Value',
      `DeFi Market Cap,${dg.defi_market_cap ?? ''}`,
      `ETH Market Cap,${dg.eth_market_cap ?? ''}`,
      `DeFi to ETH Ratio,${dg.defi_to_eth_ratio ?? ''}`,
      `DeFi Trading Volume (24h),${dg.trading_volume_24h ?? ''}`,
      `DeFi Dominance,${dg.defi_dominance ?? ''}`,
      `Top Coin,${dg.top_coin_name ?? ''}`,
      `Top Coin DeFi Dominance,${dg.top_coin_defi_dominance ?? ''}`,
    ];
    zip.file('defi-global.csv', bom + lines.join('\n') + '\n');
    hasFiles = true;
  }

  if (!hasFiles) return;

  const blob = await zip.generateAsync({ type: 'blob' });
  downloadBlob(blob, `${slug}-data-${isoDate()}.zip`, 'application/zip');
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

function downloadBlob(data: Blob | BlobPart, filename: string, mimeType: string) {
  const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
