'use client';

import { useState, type RefObject } from 'react';
import { FileSpreadsheet, FileImage, FileText, FileDown, Braces, Check, X, Loader2 } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

type ExportFormat = 'excel' | 'png' | 'pdf' | 'csv' | 'json';
type ButtonState = 'idle' | 'loading' | 'success' | 'error';

const FORMATS: { key: ExportFormat; label: string; icon: typeof FileSpreadsheet; color: string }[] = [
  { key: 'excel', label: 'XLSX', icon: FileSpreadsheet, color: 'text-green-400' },
  { key: 'png', label: 'PNG', icon: FileImage, color: 'text-blue-400' },
  { key: 'pdf', label: 'PDF', icon: FileText, color: 'text-red-400' },
  { key: 'csv', label: 'CSV', icon: FileDown, color: 'text-yellow-400' },
  { key: 'json', label: 'JSON', icon: Braces, color: 'text-purple-400' },
];

interface UniversalExportProps {
  /** Filename prefix (e.g. "BTC-Technical") */
  name: string;
  /** DOM element ref for PNG/PDF capture. Falls back to #dashboard-content */
  captureRef?: RefObject<HTMLElement | null>;
  /** Data getter for Excel/CSV/JSON. Falls back to live dashboard store data */
  getData?: () => Record<string, any>;
  /** Smaller buttons for inline placement */
  compact?: boolean;
}

export function UniversalExport({ name, captureRef, getData, compact }: UniversalExportProps) {
  const [states, setStates] = useState<Record<ExportFormat, ButtonState>>({
    excel: 'idle', png: 'idle', pdf: 'idle', csv: 'idle', json: 'idle',
  });
  const data = useLiveDashboardStore((s) => s.data);

  const setFormat = (key: ExportFormat, state: ButtonState) =>
    setStates((s) => ({ ...s, [key]: state }));

  const resolveData = () => getData ? getData() : data;

  const handleExport = async (format: ExportFormat) => {
    if (states[format] === 'loading') return;
    setFormat(format, 'loading');

    try {
      switch (format) {
        case 'excel': {
          const { exportDashboardAsExcel } = await import('@/lib/live-dashboard/exportExcel');
          await exportDashboardAsExcel(name, resolveData() as any);
          break;
        }
        case 'png': {
          const el = captureRef?.current ?? document.getElementById('dashboard-content');
          if (!el) throw new Error('No content to capture');
          const { exportDashboardAsPng } = await import('@/lib/live-dashboard/exportPdf');
          // Temporarily set the element ID so the export function finds it
          const hadId = el.id;
          el.id = 'dashboard-content';
          await exportDashboardAsPng(name);
          el.id = hadId;
          break;
        }
        case 'pdf': {
          const el = captureRef?.current ?? document.getElementById('dashboard-content');
          if (!el) throw new Error('No content to capture');
          const { exportDashboardAsPdf } = await import('@/lib/live-dashboard/exportPdf');
          const hadId = el.id;
          el.id = 'dashboard-content';
          await exportDashboardAsPdf(name);
          el.id = hadId;
          break;
        }
        case 'csv': {
          const { exportDashboardAsCsv } = await import('@/lib/live-dashboard/exportExcel');
          await exportDashboardAsCsv(name, resolveData() as any);
          break;
        }
        case 'json': {
          const { exportAsJson } = await import('@/lib/live-dashboard/exportJson');
          exportAsJson(name, resolveData());
          break;
        }
      }
      setFormat(format, 'success');
      setTimeout(() => setFormat(format, 'idle'), 1500);
    } catch {
      setFormat(format, 'error');
      setTimeout(() => setFormat(format, 'idle'), 2000);
    }
  };

  const btnSize = compact ? 'p-1' : 'p-1.5';
  const iconSize = compact ? 'w-3 h-3' : 'w-3.5 h-3.5';
  const textSize = compact ? 'text-[9px]' : 'text-[10px]';

  return (
    <div className="flex items-center gap-0.5">
      {FORMATS.map(({ key, label, icon: Icon, color }) => {
        const state = states[key];
        return (
          <button
            key={key}
            type="button"
            onClick={() => handleExport(key)}
            disabled={state === 'loading'}
            title={`Download as ${label}`}
            className={`flex items-center gap-1 ${btnSize} px-2 rounded-md transition border
              ${state === 'success'
                ? 'bg-emerald-400/10 border-emerald-400/20 text-emerald-400'
                : state === 'error'
                ? 'bg-red-400/10 border-red-400/20 text-red-400'
                : 'bg-white/[0.03] border-white/[0.06] text-gray-500 hover:text-white hover:bg-white/[0.06]'
              } disabled:opacity-40`}
          >
            {state === 'loading' ? (
              <Loader2 className={`${iconSize} animate-spin`} />
            ) : state === 'success' ? (
              <Check className={iconSize} />
            ) : state === 'error' ? (
              <X className={iconSize} />
            ) : (
              <Icon className={`${iconSize} ${color}`} />
            )}
            <span className={`${textSize} font-medium`}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}
