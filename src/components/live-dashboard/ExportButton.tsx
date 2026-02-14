'use client';

import { useState, useRef, useEffect } from 'react';
import { Download, FileImage, FileText, FileSpreadsheet, FileDown, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';

interface ExportButtonProps {
  dashboardName: string;
}

export function ExportButton({ dashboardName }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const data = useLiveDashboardStore((s) => s.data);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleExport = async (type: 'pdf' | 'png' | 'excel' | 'csv') => {
    setExporting(true);
    setOpen(false);
    try {
      if (type === 'pdf' || type === 'png') {
        const { exportDashboardAsPdf, exportDashboardAsPng } = await import('@/lib/live-dashboard/exportPdf');
        if (type === 'pdf') await exportDashboardAsPdf(dashboardName);
        else await exportDashboardAsPng(dashboardName);
      } else {
        const { exportDashboardAsExcel, exportDashboardAsCsv } = await import('@/lib/live-dashboard/exportExcel');
        if (type === 'excel') await exportDashboardAsExcel(dashboardName, data);
        else await exportDashboardAsCsv(dashboardName, data);
      }
      setToast({ type: 'success', message: `${type.toUpperCase()} exported successfully` });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Export failed' });
    } finally {
      setExporting(false);
    }
  };

  const hasData = data.markets !== null;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        disabled={exporting}
        className="p-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-gray-400 hover:text-white transition border border-white/[0.06] disabled:opacity-30"
        title="Export dashboard"
      >
        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 bg-[#0a0a0f] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-50 min-w-[200px]">
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-white/[0.05] hover:text-white transition"
          >
            <FileText className="w-4 h-4 text-emerald-400" />
            Export as PDF
          </button>
          <button
            type="button"
            onClick={() => handleExport('png')}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-white/[0.05] hover:text-white transition"
          >
            <FileImage className="w-4 h-4 text-blue-400" />
            Export as PNG
          </button>

          <div className="border-t border-white/[0.06]" />

          <button
            type="button"
            onClick={() => handleExport('excel')}
            disabled={!hasData}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-white/[0.05] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-400" />
            Export as Excel
          </button>
          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={!hasData}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-gray-300 hover:bg-white/[0.05] hover:text-white transition disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <FileDown className="w-4 h-4 text-yellow-400" />
            Export as CSV (ZIP)
          </button>

          <div className="px-4 py-2 border-t border-white/[0.06] text-[10px] text-gray-600">
            For personal use only
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`absolute right-0 top-full mt-14 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium whitespace-nowrap ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-400'
            : 'bg-red-500/10 border border-red-500/20 text-red-400'
        }`}>
          {toast.type === 'success'
            ? <CheckCircle className="w-3.5 h-3.5" />
            : <AlertCircle className="w-3.5 h-3.5" />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
