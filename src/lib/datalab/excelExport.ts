'use client';

import type { OverlayLayer } from './types';

/**
 * Export DataLab chart data as Excel (.xlsx) with CRK metadata.
 * The metadata sheet allows re-upload validation.
 */
export async function exportDataLabAsExcel(
  timestamps: number[],
  layers: OverlayLayer[],
  editedCells: Record<string, Record<number, number>>,
  coin: string,
  days: number,
  preset: string | null,
): Promise<void> {
  if (timestamps.length === 0 || layers.length === 0) return;

  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'CryptoReportKit';
  workbook.created = new Date();

  const visibleLayers = layers.filter((l) => l.visible);

  // ── Data sheet ──
  const ws = workbook.addWorksheet('DataLab');

  // Header row
  ws.columns = [
    { header: 'Date', key: 'date', width: 14 },
    ...visibleLayers.map((l) => ({
      header: l.label,
      key: l.id,
      width: 16,
    })),
  ];

  // Style header
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  headerRow.fill = { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF1a1a2e' } };
  headerRow.alignment = { horizontal: 'center' };

  // Data rows
  for (let i = 0; i < timestamps.length; i++) {
    const date = new Date(timestamps[i]).toISOString().split('T')[0];
    const row: Record<string, string | number | null> = { date };
    for (const layer of visibleLayers) {
      const edits = editedCells[layer.id];
      row[layer.id] = (edits && i in edits) ? edits[i] : (layer.data[i] ?? null);
    }
    ws.addRow(row);
  }

  // Format number columns
  for (let c = 2; c <= visibleLayers.length + 1; c++) {
    ws.getColumn(c).numFmt = '#,##0.00####';
    ws.getColumn(c).alignment = { horizontal: 'right' };
  }

  // Footer
  const footerRow = ws.addRow([]);
  const disclaimerRow = ws.addRow(['For personal use only. Data sourced from CoinGecko via your API key. cryptoreportkit.com']);
  disclaimerRow.font = { italic: true, size: 9, color: { argb: 'FF999999' } };

  // ── CRK Metadata sheet (hidden) ──
  const meta = workbook.addWorksheet('_CRK_META');
  meta.state = 'veryHidden'; // hidden from users, can't unhide via UI

  meta.addRow(['crk_version', '1.0']);
  meta.addRow(['export_type', 'datalab']);
  meta.addRow(['coin', coin]);
  meta.addRow(['days', days]);
  meta.addRow(['preset', preset || '']);
  meta.addRow(['exported_at', new Date().toISOString()]);
  meta.addRow(['column_count', visibleLayers.length]);
  meta.addRow(['row_count', timestamps.length]);

  // Column mapping: id → source → label
  meta.addRow(['--- columns ---']);
  for (const layer of visibleLayers) {
    meta.addRow([layer.id, layer.source, layer.label, layer.chartType, layer.yAxis, layer.color]);
  }

  // Download
  const buf = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `datalab-${coin}-${days}d-${new Date().toISOString().split('T')[0]}.xlsx`;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
