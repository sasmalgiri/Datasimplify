'use client';

import { RefreshCw, Clock } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import { FEATURES } from '@/lib/featureFlags';
import { useActiveWorkspace } from '@/lib/workspaces/workspaceStore';
import { ReportPackExportButton } from '@/components/report-packs/ReportPackExportButton';
import { UniversalExport } from '@/components/UniversalExport';

interface ActionBarProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function ActionBar({ onRefresh, isRefreshing }: ActionBarProps) {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];
  const lastFetched = useLiveDashboardStore((s) => s.lastFetched);
  const activeWorkspace = useActiveWorkspace();

  const timeAgo = lastFetched
    ? `${Math.round((Date.now() - lastFetched) / 1000)}s ago`
    : null;

  return (
    <div
      className={`${st.cardClasses} p-4 flex flex-col sm:flex-row items-center justify-between gap-3`}
    >
      {/* Left: Status */}
      <div className="flex items-center gap-3">
        {timeAgo && (
          <span className={`text-xs ${st.textFaint} flex items-center gap-1`}>
            <Clock className="w-3 h-3" />
            Last refresh: {timeAgo}
          </span>
        )}
        {activeWorkspace && (
          <span className={`text-xs ${st.textDim}`}>
            {activeWorkspace.name}
          </span>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3">
        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing || !activeWorkspace}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium ${st.buttonSecondary} disabled:opacity-40 disabled:cursor-not-allowed transition`}
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>

        {/* Report Pack */}
        {FEATURES.reportPacks && <ReportPackExportButton />}

        {/* Quick Export */}
        <UniversalExport name={activeWorkspace?.name ?? 'Dashboard'} compact />
      </div>
    </div>
  );
}
