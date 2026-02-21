'use client';

import { useState, useCallback } from 'react';
import { Download, FileText, Table, FileSpreadsheet, Check, Loader2, AlertCircle } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import { useWorkspaceStore, useActiveWorkspace } from '@/lib/workspaces/workspaceStore';
import { generateReportPack } from '@/lib/report-packs/reportPackGenerator';
import { REPORT_PACK_DEFINITIONS } from '@/lib/report-packs/packDefinitions';
import type { ReportPackProgress, ReportPackOutput } from '@/lib/report-packs/types';
import { PROGRESS_LABELS, PROGRESS_PERCENT } from '@/lib/report-packs/types';

export function ReportPackExportButton() {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];
  const data = useLiveDashboardStore((s) => s.data);

  const activeWorkspace = useActiveWorkspace();
  const snapshots = useWorkspaceStore((s) => s.snapshots);

  const [progress, setProgress] = useState<ReportPackProgress>('idle');
  const [output, setOutput] = useState<ReportPackOutput | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const packDef = REPORT_PACK_DEFINITIONS[0]; // Portfolio Weekly Pack

  const handleGenerate = useCallback(async () => {
    if (!activeWorkspace || !data.markets) return;

    setError(null);
    setOutput(null);

    try {
      const result = await generateReportPack(
        packDef,
        data,
        activeWorkspace,
        snapshots,
        { onProgress: setProgress },
      );
      setOutput(result);
    } catch (err: any) {
      setError(err.message || 'Export failed');
      setProgress('error');
    }
  }, [activeWorkspace, data, snapshots, packDef]);

  const handleDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const baseName = `${activeWorkspace?.name ?? 'report'}-${new Date().toISOString().split('T')[0]}`
    .toLowerCase()
    .replace(/\s+/g, '-');

  const canGenerate = activeWorkspace && data.markets && data.markets.length > 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen((v) => !v)}
        disabled={!canGenerate}
        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition ${
          canGenerate
            ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
            : `${st.buttonSecondary} opacity-50 cursor-not-allowed`
        }`}
      >
        <Download className="w-4 h-4" />
        Generate Pack
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={`absolute right-0 top-full mt-2 w-80 ${st.cardClasses} p-4 z-50 shadow-xl`}
        >
          <h3 className={`text-sm font-semibold mb-1 ${st.textPrimary}`}>
            {packDef.name}
          </h3>
          <p className={`text-xs mb-4 ${st.textDim}`}>{packDef.description}</p>

          {/* Progress */}
          {progress !== 'idle' && progress !== 'done' && progress !== 'error' && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                <span className={`text-xs ${st.textSecondary}`}>
                  {PROGRESS_LABELS[progress]}
                </span>
              </div>
              <div className={`w-full h-1.5 rounded-full ${st.subtleBg}`}>
                <div
                  className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${PROGRESS_PERCENT[progress]}%` }}
                />
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 mb-4 text-red-400 text-xs">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {/* Download Links */}
          {output && progress === 'done' && (
            <div className="space-y-2 mb-4">
              <p className={`text-xs font-medium ${st.textSecondary} flex items-center gap-1`}>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Ready to download
              </p>
              <button
                onClick={() => handleDownload(output.pdf, `${baseName}.pdf`)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${st.subtleBg} border ${st.subtleBorder} ${st.cardHover} text-left`}
              >
                <FileText className="w-4 h-4 text-red-400" />
                <div>
                  <span className={`text-sm font-medium ${st.textPrimary}`}>PDF Report</span>
                  <span className={`text-xs block ${st.textDim}`}>Multi-page executive report</span>
                </div>
              </button>
              <button
                onClick={() => handleDownload(output.excel, `${baseName}.xlsx`)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${st.subtleBg} border ${st.subtleBorder} ${st.cardHover} text-left`}
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className={`text-sm font-medium ${st.textPrimary}`}>Excel Workbook</span>
                  <span className={`text-xs block ${st.textDim}`}>Summary + Positions sheets</span>
                </div>
              </button>
              <button
                onClick={() => handleDownload(output.csvZip, `${baseName}-csv.zip`)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg ${st.subtleBg} border ${st.subtleBorder} ${st.cardHover} text-left`}
              >
                <Table className="w-4 h-4 text-blue-400" />
                <div>
                  <span className={`text-sm font-medium ${st.textPrimary}`}>CSV Bundle</span>
                  <span className={`text-xs block ${st.textDim}`}>ZIP with summary, positions, metadata</span>
                </div>
              </button>
            </div>
          )}

          {/* Generate Button */}
          {(progress === 'idle' || progress === 'done' || progress === 'error') && (
            <button
              onClick={handleGenerate}
              className={`w-full py-2.5 rounded-lg text-sm font-medium ${st.buttonPrimary} flex items-center justify-center gap-2`}
            >
              <Download className="w-4 h-4" />
              {output ? 'Regenerate' : 'Generate Now'}
            </button>
          )}
        </div>
      )}

      {/* Click-outside overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
      )}
    </div>
  );
}
