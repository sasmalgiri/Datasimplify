import type { OverlayLayer } from './types';

/**
 * Generate CSV string from DataLab chart data.
 * Applies any edited cell values on top of computed data.
 */
export function generateCSV(
  timestamps: number[],
  layers: OverlayLayer[],
  editedCells: Record<string, Record<number, number>>,
): string {
  if (timestamps.length === 0 || layers.length === 0) return '';

  const visibleLayers = layers.filter((l) => l.visible);
  const headers = ['Date', ...visibleLayers.map((l) => l.label)];
  const rows: string[] = [headers.join(',')];

  for (let i = 0; i < timestamps.length; i++) {
    const date = new Date(timestamps[i]).toISOString().split('T')[0];
    const values = visibleLayers.map((layer) => {
      const edits = editedCells[layer.id];
      if (edits && i in edits) return edits[i];
      return layer.data[i];
    });
    rows.push([date, ...values.map((v) => (v != null ? String(v) : ''))].join(','));
  }

  return rows.join('\n');
}

/**
 * Trigger browser download of a CSV string.
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
