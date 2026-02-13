/**
 * contentOptions.ts — Shared content type definitions and filename generation.
 *
 * Used by TemplateDownloadModal, DownloadStep, and download API route.
 * Single source of truth for content option labels, descriptions, and filename suffixes.
 */

export interface ContentOption {
  id: string;
  name: string;
  description: string;
  icon?: string;
  badge?: string;
  badgeColor?: string;
}

export const CONTENT_OPTIONS: ContentOption[] = [
  {
    id: 'native_charts',
    name: 'With Charts',
    description: 'Includes pre-built Excel charts that auto-update when you refresh data. Works everywhere.',
    icon: '\u{1F4CA}',
    badge: 'Recommended',
    badgeColor: 'bg-emerald-500',
  },
  {
    id: 'formulas_only',
    name: 'Data Only',
    description: 'Just Power Query data tables, no charts. Smallest file size.',
    icon: '\u{1F4DD}',
  },
];

/** Maps content type ID to filename suffix */
const CONTENT_LABEL_MAP: Record<string, string> = {
  formulas_only: '_formulas',
  native_charts: '_native',
};

export function getContentLabel(contentType: string): string {
  return CONTENT_LABEL_MAP[contentType] ?? '';
}

export function generateDownloadFilename(
  templateId: string,
  contentType: string,
  format: string = 'xlsx',
): string {
  const contentLabel = getContentLabel(contentType);
  return `cryptoreportkit_${templateId}${contentLabel}.${format}`;
}

export function generateServerFilename(
  dashboard: string,
): string {
  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `cryptoreportkit_${dashboard}_${timestamp}.xlsx`;
}
