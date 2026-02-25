'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { Download, FileImage, FileText, FileSpreadsheet, FileDown, Loader2, CheckCircle, AlertCircle, Lock, Crown, Zap, ChevronDown } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { useExportGating } from '@/lib/live-dashboard/useExportGating';
import { useCreditStore, CREDIT_COSTS, type CreditAction } from '@/lib/live-dashboard/credits';
import type { ExportFormat } from '@/lib/entitlements';

const FORMAT_TO_CREDIT: Record<ExportFormat, CreditAction> = {
  png: 'export_png',
  pdf: 'export_pdf',
  excel: 'export_excel',
  csv: 'export_csv',
};

interface ExportButtonProps {
  dashboardName: string;
  onOpenKeyModal?: () => void;
}

const EXPORT_GROUPS = [
  {
    key: 'image',
    label: 'Image',
    icon: FileImage,
    iconColor: 'text-blue-400',
    formats: [
      { format: 'png' as ExportFormat, label: 'PNG Image', icon: FileImage, iconColor: 'text-blue-400' },
      { format: 'pdf' as ExportFormat, label: 'PDF Document', icon: FileText, iconColor: 'text-emerald-400' },
    ],
  },
  {
    key: 'data',
    label: 'Data',
    icon: FileSpreadsheet,
    iconColor: 'text-green-400',
    formats: [
      { format: 'excel' as ExportFormat, label: 'Excel (.xlsx)', icon: FileSpreadsheet, iconColor: 'text-green-400' },
      { format: 'csv' as ExportFormat, label: 'CSV (.zip)', icon: FileDown, iconColor: 'text-yellow-400' },
    ],
  },
];

export function ExportButton({ dashboardName, onOpenKeyModal }: ExportButtonProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const data = useLiveDashboardStore((s) => s.data);
  const apiKey = useLiveDashboardStore((s) => s.apiKey);
  const { entitlement, trackExport } = useExportGating();
  const canAfford = useCreditStore((s) => s.canAfford);
  const creditUse = useCreditStore((s) => s.useCredits);

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

  // Reset expanded group when dropdown closes
  useEffect(() => {
    if (!open) setExpandedGroup(null);
  }, [open]);

  const handleExport = async (format: ExportFormat) => {
    // Require user's own API key for exports
    if (!apiKey) {
      setToast({ type: 'info', message: 'Add your free CoinGecko API key to export dashboards.' });
      setOpen(false);
      onOpenKeyModal?.();
      return;
    }

    // Check if format is allowed
    if (!entitlement.allowedFormats.includes(format)) {
      setToast({ type: 'info', message: `${format.toUpperCase()} export requires Pro. Upgrade at /pricing` });
      setOpen(false);
      return;
    }

    // Check download limit
    if (!entitlement.canExport) {
      setToast({ type: 'error', message: `Monthly export limit reached (${entitlement.downloadsLimit}). Upgrade for more.` });
      setOpen(false);
      return;
    }

    // Check credit balance
    const creditAction = FORMAT_TO_CREDIT[format];
    if (!canAfford(creditAction)) {
      setToast({ type: 'info', message: `Not enough credits (need ${CREDIT_COSTS[creditAction]}). Buy more credits.` });
      setOpen(false);
      return;
    }

    setExporting(true);
    setOpen(false);

    const exportOptions = {
      scale: entitlement.scale,
      watermark: entitlement.watermark,
    };

    try {
      if (format === 'pdf' || format === 'png') {
        const { exportDashboardAsPdf, exportDashboardAsPng } = await import('@/lib/live-dashboard/exportPdf');
        if (format === 'pdf') await exportDashboardAsPdf(dashboardName, exportOptions);
        else await exportDashboardAsPng(dashboardName, exportOptions);
      } else {
        const { exportDashboardAsExcel, exportDashboardAsCsv } = await import('@/lib/live-dashboard/exportExcel');
        if (format === 'excel') await exportDashboardAsExcel(dashboardName, data);
        else await exportDashboardAsCsv(dashboardName, data);
      }

      await trackExport(format);
      creditUse(creditAction, `Exported ${dashboardName} as ${format.toUpperCase()}`);
      setToast({ type: 'success', message: `${format.toUpperCase()} exported successfully` });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Export failed';
      setToast({ type: 'error', message });
    } finally {
      setExporting(false);
    }
  };

  const hasData = data.markets !== null;
  const remaining = Math.max(0, entitlement.downloadsLimit - entitlement.downloadsUsed);
  const isFree = entitlement.tier === 'free';

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
        <div className="absolute right-0 bottom-full mb-2 bg-[#0a0a0f] border border-white/[0.1] rounded-xl shadow-2xl overflow-hidden z-50 min-w-[220px]">
          {/* Header */}
          <div className="px-3 py-2 border-b border-white/[0.06]">
            <div className="text-xs font-medium text-white">Export Dashboard</div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {remaining} of {entitlement.downloadsLimit} exports remaining
            </div>
          </div>

          {/* Collapsible groups */}
          {EXPORT_GROUPS.map((group) => {
            const isExpanded = expandedGroup === group.key;
            const GroupIcon = group.icon;

            return (
              <div key={group.key}>
                {/* Group header — clickable toggle */}
                <button
                  type="button"
                  onClick={() => setExpandedGroup(isExpanded ? null : group.key)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-gray-300 hover:bg-white/[0.04] transition"
                >
                  <GroupIcon className={`w-3.5 h-3.5 ${group.iconColor}`} />
                  <span className="flex-1 text-left">{group.label}</span>
                  <ChevronDown className={`w-3 h-3 text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                </button>

                {/* Expanded format options */}
                {isExpanded && (
                  <div className="border-t border-white/[0.04]">
                    {group.formats.map(({ format, label, icon: Icon, iconColor }) => {
                      const allowed = entitlement.allowedFormats.includes(format);
                      const needsData = (format === 'excel' || format === 'csv') && !hasData;
                      const disabled = !allowed || needsData;

                      return (
                        <button
                          key={format}
                          type="button"
                          onClick={() => !disabled && handleExport(format)}
                          className={`w-full flex items-center gap-2 pl-8 pr-3 py-2 text-xs transition ${
                            disabled
                              ? 'text-gray-600 cursor-not-allowed'
                              : 'text-gray-300 hover:bg-white/[0.05] hover:text-white'
                          }`}
                        >
                          {allowed ? (
                            <Icon className={`w-3.5 h-3.5 ${disabled ? 'text-gray-700' : iconColor}`} />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-gray-600" />
                          )}
                          <span className="flex-1 text-left">{label}</span>
                          {!allowed && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-500/70 font-medium">
                              <Crown className="w-2.5 h-2.5" /> PRO
                            </span>
                          )}
                          {allowed && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-400/70 font-medium">
                              <Zap className="w-2.5 h-2.5" />
                              {CREDIT_COSTS[FORMAT_TO_CREDIT[format]]}
                            </span>
                          )}
                          {allowed && format === 'png' && isFree && (
                            <span className="text-[9px] text-gray-600">1x</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {/* Footer */}
          <div className="px-3 py-1.5 border-t border-white/[0.06]">
            {isFree && (
              <div className="text-[10px] text-gray-600">
                <Link href="/pricing" className="text-emerald-500 hover:text-emerald-400">
                  Upgrade for HD + all formats
                </Link>
              </div>
            )}
            <div className="text-[10px] text-gray-600">For personal use only</div>
          </div>
        </div>
      )}

      {/* Toast notification */}
      {toast && (
        <div className={`absolute right-0 top-full mt-2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium whitespace-nowrap ${
          toast.type === 'success'
            ? 'bg-emerald-500/10 border border-emerald-400/20 text-emerald-400'
            : toast.type === 'info'
              ? 'bg-amber-500/10 border border-amber-400/20 text-amber-400'
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
