/**
 * Report Pack Types
 *
 * A Report Pack is a "deliverable" — not a dashboard.
 * It produces: PDF (multi-page), Excel workbook, and CSV bundle.
 */

export type ReportSectionType =
  | 'executive_summary'
  | 'chart'
  | 'table'
  | 'kpi_row'
  | 'appendix';

export type ChartType = 'area' | 'donut' | 'bar' | 'heatmap';

export interface ReportSection {
  id: string;
  type: ReportSectionType;
  title: string;
  config: Record<string, any>;
}

export interface ReportPackDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: 'free' | 'pro';
  sections: ReportSection[];
  requiredData: string[];
  creditCost: number;
}

export interface ReportPackOutput {
  pdf: Blob;
  excel: Blob;
  csvZip: Blob;
}

export type ReportPackProgress =
  | 'idle'
  | 'preparing'
  | 'rendering_charts'
  | 'building_pdf'
  | 'building_excel'
  | 'packaging_csv'
  | 'done'
  | 'error';

export const PROGRESS_LABELS: Record<ReportPackProgress, string> = {
  idle: '',
  preparing: 'Preparing data...',
  rendering_charts: 'Rendering charts...',
  building_pdf: 'Building PDF...',
  building_excel: 'Building Excel...',
  packaging_csv: 'Packaging CSV...',
  done: 'Done!',
  error: 'Export failed',
};

export const PROGRESS_PERCENT: Record<ReportPackProgress, number> = {
  idle: 0,
  preparing: 10,
  rendering_charts: 30,
  building_pdf: 55,
  building_excel: 75,
  packaging_csv: 90,
  done: 100,
  error: 0,
};
