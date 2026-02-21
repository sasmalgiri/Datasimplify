'use client';

/**
 * Report Pack Generator
 *
 * Produces PDF, Excel, and CSV bundle from dashboard data + workspace.
 * Uses jsPDF for PDF, ExcelJS for Excel, JSZip for CSV bundle.
 * Charts rendered via hidden DOM → html2canvas → image.
 */

import type { ReportPackDefinition, ReportPackOutput, ReportPackProgress } from './types';
import type { DashboardData, MarketCoin } from '@/lib/live-dashboard/store';
import type { Workspace, SnapshotWithDiff } from '@/lib/workspaces/types';

interface GenerateOptions {
  watermark?: boolean;
  onProgress?: (step: ReportPackProgress) => void;
}

// Colors matching the CRK theme
const COLORS = {
  primary: '#10B981',
  primaryDark: '#059669',
  bgDark: '#111827',
  bgMedium: '#1F2937',
  bgLight: '#374151',
  white: '#FFFFFF',
  gray: '#9CA3AF',
  dimGray: '#6B7280',
  positive: '#10B981',
  negative: '#EF4444',
  warning: '#F59E0B',
};

/**
 * Main entry point: generates all three output formats.
 */
export async function generateReportPack(
  packDef: ReportPackDefinition,
  data: DashboardData,
  workspace: Workspace,
  snapshots: SnapshotWithDiff[],
  options?: GenerateOptions,
): Promise<ReportPackOutput> {
  const report = options?.onProgress ?? (() => {});
  const markets = filterWorkspaceMarkets(data.markets, workspace);

  report('preparing');

  // Compute KPIs
  const kpis = computeKPIs(markets, snapshots);

  report('building_pdf');
  const pdf = await buildPdf(packDef, kpis, markets, workspace, snapshots, options);

  report('building_excel');
  const excel = await buildExcel(packDef, kpis, markets, workspace);

  report('packaging_csv');
  const csvZip = await buildCsvBundle(kpis, markets, workspace);

  report('done');

  return { pdf, excel, csvZip };
}

// ─── KPI Computation ────────────────────────────────────────

interface PackKPIs {
  totalValue: number;
  return7d: number | null;
  return30d: number | null;
  assetCount: number;
  topWinner: { symbol: string; change: number } | null;
  topLoser: { symbol: string; change: number } | null;
  generatedAt: string;
}

function computeKPIs(markets: MarketCoin[], snapshots: SnapshotWithDiff[]): PackKPIs {
  const totalValue = markets.reduce((s, m) => s + (m.market_cap || 0), 0);
  const totalWeight = totalValue || 1;
  const return7d =
    markets.length > 0
      ? markets.reduce(
          (s, m) =>
            s + (m.price_change_percentage_7d_in_currency ?? 0) * ((m.market_cap || 0) / totalWeight),
          0,
        )
      : null;

  let topWinner: PackKPIs['topWinner'] = null;
  let topLoser: PackKPIs['topLoser'] = null;
  for (const m of markets) {
    const ch = m.price_change_percentage_24h ?? 0;
    if (!topWinner || ch > (topWinner.change ?? -Infinity)) {
      topWinner = { symbol: m.symbol.toUpperCase(), change: ch };
    }
    if (!topLoser || ch < (topLoser.change ?? Infinity)) {
      topLoser = { symbol: m.symbol.toUpperCase(), change: ch };
    }
  }

  return {
    totalValue,
    return7d: return7d != null ? Number(return7d.toFixed(2)) : null,
    return30d: snapshots[0]?.kpi_return_30d ?? null,
    assetCount: markets.length,
    topWinner,
    topLoser,
    generatedAt: new Date().toISOString(),
  };
}

function filterWorkspaceMarkets(
  markets: MarketCoin[] | null,
  workspace: Workspace,
): MarketCoin[] {
  if (!markets) return [];
  const coins = workspace.config?.coins ?? [];
  if (coins.length === 0) return markets;
  const coinSet = new Set(coins.map((c) => c.toLowerCase()));
  return markets.filter(
    (m) => coinSet.has(m.id) || coinSet.has(m.symbol.toLowerCase()),
  );
}

// ─── PDF Generation ─────────────────────────────────────────

async function buildPdf(
  packDef: ReportPackDefinition,
  kpis: PackKPIs,
  markets: MarketCoin[],
  workspace: Workspace,
  snapshots: SnapshotWithDiff[],
  options?: GenerateOptions,
): Promise<Blob> {
  const { jsPDF } = await import('jspdf');

  const width = 842; // A4 landscape px
  const height = 595;
  const margin = 40;

  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'px',
    format: [width, height],
  });

  // ── Page 1: Cover ──
  pdf.setFillColor(17, 24, 39); // bgDark
  pdf.rect(0, 0, width, height, 'F');

  // Accent line
  pdf.setFillColor(16, 185, 129);
  pdf.rect(0, 0, 6, height, 'F');

  pdf.setFontSize(32);
  pdf.setTextColor(255, 255, 255);
  pdf.text(packDef.name, margin + 20, 120);

  pdf.setFontSize(16);
  pdf.setTextColor(156, 163, 175);
  pdf.text(workspace.name, margin + 20, 155);

  pdf.setFontSize(12);
  pdf.text(
    `Generated ${new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })}`,
    margin + 20,
    185,
  );

  pdf.setFontSize(11);
  pdf.text(`${kpis.assetCount} assets tracked`, margin + 20, 210);

  // CRK branding at bottom
  pdf.setFontSize(10);
  pdf.setTextColor(107, 114, 128);
  pdf.text('CryptoReportKit — cryptoreportkit.com', margin + 20, height - 40);

  addPageFooter(pdf, 1, width, height);

  // ── Page 2: Executive Summary ──
  pdf.addPage();
  pdf.setFillColor(17, 24, 39);
  pdf.rect(0, 0, width, height, 'F');
  pdf.setFillColor(16, 185, 129);
  pdf.rect(0, 0, 6, height, 'F');

  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Executive Summary', margin + 20, 50);

  // KPI boxes
  const kpiBoxes = [
    { label: 'Total Market Cap', value: formatCompact(kpis.totalValue) },
    { label: '7d Return', value: kpis.return7d != null ? `${kpis.return7d >= 0 ? '+' : ''}${kpis.return7d}%` : '—' },
    { label: '30d Return', value: kpis.return30d != null ? `${kpis.return30d >= 0 ? '+' : ''}${kpis.return30d}%` : '—' },
    { label: 'Assets', value: String(kpis.assetCount) },
    { label: 'Top Winner', value: kpis.topWinner ? `${kpis.topWinner.symbol} +${kpis.topWinner.change.toFixed(1)}%` : '—' },
    { label: 'Top Loser', value: kpis.topLoser ? `${kpis.topLoser.symbol} ${kpis.topLoser.change.toFixed(1)}%` : '—' },
  ];

  const boxW = (width - margin * 2 - 20 * 2 - 30) / 3;
  const boxH = 70;

  kpiBoxes.forEach((kpi, i) => {
    const col = i % 3;
    const row = Math.floor(i / 3);
    const x = margin + 20 + col * (boxW + 15);
    const y = 80 + row * (boxH + 15);

    pdf.setFillColor(31, 41, 55);
    pdf.roundedRect(x, y, boxW, boxH, 8, 8, 'F');

    pdf.setFontSize(10);
    pdf.setTextColor(156, 163, 175);
    pdf.text(kpi.label, x + 12, y + 22);

    pdf.setFontSize(18);
    const isPositive = kpi.value.includes('+');
    const isNegative = kpi.value.includes('-') && kpi.label !== 'Assets';
    if (isPositive) pdf.setTextColor(16, 185, 129);
    else if (isNegative) pdf.setTextColor(239, 68, 68);
    else pdf.setTextColor(255, 255, 255);
    pdf.text(kpi.value, x + 12, y + 50);
  });

  addPageFooter(pdf, 2, width, height);

  // ── Page 3: Positions Table ──
  pdf.addPage();
  pdf.setFillColor(17, 24, 39);
  pdf.rect(0, 0, width, height, 'F');
  pdf.setFillColor(16, 185, 129);
  pdf.rect(0, 0, 6, height, 'F');

  pdf.setFontSize(20);
  pdf.setTextColor(255, 255, 255);
  pdf.text('All Positions', margin + 20, 50);

  // Table header
  const cols = [
    { label: '#', w: 30 },
    { label: 'Coin', w: 100 },
    { label: 'Price', w: 100 },
    { label: '24h', w: 80 },
    { label: '7d', w: 80 },
    { label: 'Market Cap', w: 120 },
    { label: 'Volume', w: 120 },
  ];

  let tableX = margin + 20;
  let tableY = 70;

  pdf.setFillColor(31, 41, 55);
  pdf.rect(tableX, tableY, cols.reduce((s, c) => s + c.w, 0), 24, 'F');
  pdf.setFontSize(9);
  pdf.setTextColor(156, 163, 175);

  let cx = tableX;
  for (const col of cols) {
    pdf.text(col.label, cx + 6, tableY + 16);
    cx += col.w;
  }
  tableY += 24;

  // Table rows (limit to fit page)
  const maxRows = Math.min(markets.length, 18);
  for (let i = 0; i < maxRows; i++) {
    const m = markets[i];
    const rowBg = i % 2 === 0 ? [31, 41, 55] : [17, 24, 39];
    pdf.setFillColor(rowBg[0], rowBg[1], rowBg[2]);
    pdf.rect(tableX, tableY, cols.reduce((s, c) => s + c.w, 0), 22, 'F');

    pdf.setFontSize(9);
    cx = tableX;

    // Rank
    pdf.setTextColor(107, 114, 128);
    pdf.text(String(m.market_cap_rank || i + 1), cx + 6, tableY + 14);
    cx += cols[0].w;

    // Name
    pdf.setTextColor(255, 255, 255);
    pdf.text(`${m.name} (${m.symbol.toUpperCase()})`.slice(0, 20), cx + 6, tableY + 14);
    cx += cols[1].w;

    // Price
    pdf.setTextColor(255, 255, 255);
    pdf.text(formatPrice(m.current_price), cx + 6, tableY + 14);
    cx += cols[2].w;

    // 24h Change
    const ch24 = m.price_change_percentage_24h ?? 0;
    pdf.setTextColor(...(ch24 >= 0 ? [16, 185, 129] : [239, 68, 68]) as [number, number, number]);
    pdf.text(`${ch24 >= 0 ? '+' : ''}${ch24.toFixed(2)}%`, cx + 6, tableY + 14);
    cx += cols[3].w;

    // 7d Change
    const ch7d = m.price_change_percentage_7d_in_currency ?? 0;
    pdf.setTextColor(...(ch7d >= 0 ? [16, 185, 129] : [239, 68, 68]) as [number, number, number]);
    pdf.text(`${ch7d >= 0 ? '+' : ''}${ch7d.toFixed(2)}%`, cx + 6, tableY + 14);
    cx += cols[4].w;

    // Market Cap
    pdf.setTextColor(255, 255, 255);
    pdf.text(formatCompact(m.market_cap), cx + 6, tableY + 14);
    cx += cols[5].w;

    // Volume
    pdf.text(formatCompact(m.total_volume), cx + 6, tableY + 14);

    tableY += 22;
  }

  if (markets.length > maxRows) {
    pdf.setFontSize(9);
    pdf.setTextColor(107, 114, 128);
    pdf.text(
      `... and ${markets.length - maxRows} more positions (see Excel/CSV for full list)`,
      tableX + 6,
      tableY + 20,
    );
  }

  addPageFooter(pdf, 3, width, height);

  return pdf.output('blob');
}

function addPageFooter(pdf: any, pageNum: number, width: number, height: number) {
  pdf.setFontSize(8);
  pdf.setTextColor(75, 85, 99);
  pdf.text(
    `CryptoReportKit — Data sourced via your API key — Page ${pageNum}`,
    40,
    height - 15,
  );
  pdf.text(new Date().toLocaleDateString(), width - 120, height - 15);
}

// ─── Excel Generation ───────────────────────────────────────

async function buildExcel(
  packDef: ReportPackDefinition,
  kpis: PackKPIs,
  markets: MarketCoin[],
  workspace: Workspace,
): Promise<Blob> {
  const ExcelJS = (await import('exceljs')).default;
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CryptoReportKit';
  workbook.created = new Date();
  workbook.title = `${packDef.name} — ${workspace.name}`;

  // ── Summary Sheet ──
  const summary = workbook.addWorksheet('Summary', {
    views: [{ showGridLines: false }],
  });

  summary.columns = [{ width: 25 }, { width: 30 }];

  const summaryRows = [
    ['Report', packDef.name],
    ['Workspace', workspace.name],
    ['Generated', new Date().toLocaleString()],
    ['', ''],
    ['Total Market Cap', formatCompact(kpis.totalValue)],
    ['7d Return', kpis.return7d != null ? `${kpis.return7d}%` : '—'],
    ['30d Return', kpis.return30d != null ? `${kpis.return30d}%` : '—'],
    ['Assets', String(kpis.assetCount)],
    ['Top Winner', kpis.topWinner ? `${kpis.topWinner.symbol} +${kpis.topWinner.change.toFixed(1)}%` : '—'],
    ['Top Loser', kpis.topLoser ? `${kpis.topLoser.symbol} ${kpis.topLoser.change.toFixed(1)}%` : '—'],
  ];

  summaryRows.forEach(([label, value], i) => {
    const row = summary.getRow(i + 1);
    row.getCell(1).value = label;
    row.getCell(1).font = { bold: true, color: { argb: 'FF9CA3AF' } };
    row.getCell(2).value = value;
    row.getCell(2).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    for (let c = 1; c <= 2; c++) {
      row.getCell(c).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF111827' },
      };
    }
  });

  // ── Positions Sheet ──
  const positions = workbook.addWorksheet('Positions', {
    views: [{ state: 'frozen', ySplit: 1, showGridLines: false }],
  });

  positions.columns = [
    { header: '#', width: 6 },
    { header: 'Name', width: 18 },
    { header: 'Symbol', width: 10 },
    { header: 'Price', width: 15 },
    { header: '24h Change', width: 14 },
    { header: '7d Change', width: 14 },
    { header: 'Market Cap', width: 18 },
    { header: 'Volume (24h)', width: 18 },
  ];

  // Style header
  const headerRow = positions.getRow(1);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
    cell.alignment = { horizontal: 'center', vertical: 'middle' };
  });

  markets.forEach((m, i) => {
    const row = positions.addRow([
      m.market_cap_rank || i + 1,
      m.name,
      m.symbol.toUpperCase(),
      m.current_price,
      m.price_change_percentage_24h ?? 0,
      m.price_change_percentage_7d_in_currency ?? 0,
      m.market_cap,
      m.total_volume,
    ]);

    const bg = i % 2 === 0 ? 'FF1F2937' : 'FF111827';
    row.eachCell((cell, colNum) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } };
      cell.font = { color: { argb: 'FFFFFFFF' }, size: 10 };

      if (colNum === 4) cell.numFmt = '"$"#,##0.00';
      if (colNum === 5 || colNum === 6) cell.numFmt = '0.00"%"';
      if (colNum === 7 || colNum === 8) cell.numFmt = '"$"#,##0';
    });
  });

  // ── Metadata Sheet ──
  const meta = workbook.addWorksheet('Metadata');
  meta.columns = [{ width: 20 }, { width: 50 }];
  [
    ['Generator', 'CryptoReportKit Report Pack'],
    ['Pack', packDef.id],
    ['Workspace', workspace.name],
    ['Mode', workspace.mode],
    ['Coins', (workspace.config?.coins ?? []).join(', ')],
    ['Currency', workspace.config?.vsCurrency ?? 'usd'],
    ['Generated', new Date().toISOString()],
  ].forEach(([k, v]) => {
    meta.addRow([k, v]);
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

// ─── CSV Bundle ─────────────────────────────────────────────

async function buildCsvBundle(
  kpis: PackKPIs,
  markets: MarketCoin[],
  workspace: Workspace,
): Promise<Blob> {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';

  // summary.csv
  const summaryRows = [
    ['Metric', 'Value'],
    ['Total Market Cap', String(kpis.totalValue)],
    ['7d Return (%)', String(kpis.return7d ?? '')],
    ['30d Return (%)', String(kpis.return30d ?? '')],
    ['Asset Count', String(kpis.assetCount)],
    ['Top Winner', kpis.topWinner ? `${kpis.topWinner.symbol} ${kpis.topWinner.change}%` : ''],
    ['Top Loser', kpis.topLoser ? `${kpis.topLoser.symbol} ${kpis.topLoser.change}%` : ''],
    ['Generated', kpis.generatedAt],
  ];
  zip.file('summary.csv', BOM + toCsv(summaryRows));

  // positions.csv
  const posHeaders = ['Rank', 'Name', 'Symbol', 'Price', '24h Change %', '7d Change %', 'Market Cap', 'Volume 24h'];
  const posRows = markets.map((m, i) => [
    String(m.market_cap_rank || i + 1),
    m.name,
    m.symbol.toUpperCase(),
    String(m.current_price),
    String(m.price_change_percentage_24h ?? ''),
    String(m.price_change_percentage_7d_in_currency ?? ''),
    String(m.market_cap),
    String(m.total_volume),
  ]);
  zip.file('positions.csv', BOM + toCsv([posHeaders, ...posRows]));

  // metadata.csv
  const metaRows = [
    ['Key', 'Value'],
    ['Generator', 'CryptoReportKit'],
    ['Workspace', workspace.name],
    ['Mode', workspace.mode],
    ['Currency', workspace.config?.vsCurrency ?? 'usd'],
    ['Generated', new Date().toISOString()],
  ];
  zip.file('metadata.csv', BOM + toCsv(metaRows));

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}

function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row.map((cell) => {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      }).join(','),
    )
    .join('\n');
}

// ─── Formatting Helpers ─────────────────────────────────────

function formatCompact(value: number | null | undefined): string {
  if (value == null) return '—';
  const abs = Math.abs(value);
  if (abs >= 1e12) return `$${(value / 1e12).toFixed(1)}T`;
  if (abs >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(value / 1e3).toFixed(1)}K`;
  return `$${value.toFixed(2)}`;
}

function formatPrice(value: number): string {
  if (value >= 1) return `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(6)}`;
}
