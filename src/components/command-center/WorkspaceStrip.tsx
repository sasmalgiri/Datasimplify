'use client';

import { Plus, Folder } from 'lucide-react';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import { useWorkspaceStore } from '@/lib/workspaces/workspaceStore';
import type { Workspace } from '@/lib/workspaces/types';
import { formatDistanceToNow } from 'date-fns';

interface WorkspaceStripProps {
  onCreateNew: () => void;
}

export function WorkspaceStrip({ onCreateNew }: WorkspaceStripProps) {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];

  const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaceStore();

  return (
    <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
      {workspaces.map((ws) => (
        <WorkspaceCard
          key={ws.id}
          workspace={ws}
          isActive={ws.id === activeWorkspaceId}
          onSelect={() => setActiveWorkspace(ws.id)}
          st={st}
        />
      ))}

      {workspaces.length < 10 && (
        <button
          onClick={onCreateNew}
          className={`flex-shrink-0 w-40 h-20 rounded-xl border-2 border-dashed ${st.subtleBorder} flex flex-col items-center justify-center gap-1 ${st.textDim} hover:text-emerald-400 hover:border-emerald-400/30 transition-colors`}
        >
          <Plus className="w-5 h-5" />
          <span className="text-xs font-medium">New Workspace</span>
        </button>
      )}
    </div>
  );
}

function WorkspaceCard({
  workspace,
  isActive,
  onSelect,
  st,
}: {
  workspace: Workspace;
  isActive: boolean;
  onSelect: () => void;
  st: any;
}) {
  const coinCount = workspace.config?.coins?.length ?? 0;
  const updatedAgo = formatDistanceToNow(new Date(workspace.updated_at), {
    addSuffix: false,
  });

  return (
    <button
      onClick={onSelect}
      className={`flex-shrink-0 w-48 h-20 rounded-xl p-3 text-left transition-all ${
        isActive
          ? `border-2 border-emerald-400/50 bg-emerald-400/5 shadow-[0_0_20px_rgba(52,211,153,0.06)]`
          : `${st.cardClasses} ${st.cardGlow}`
      }`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Folder
          className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : st.textDim}`}
        />
        <span
          className={`text-sm font-medium truncate ${
            isActive ? 'text-emerald-400' : st.textPrimary
          }`}
        >
          {workspace.name}
        </span>
      </div>
      <div className={`flex items-center gap-2 text-[10px] ${st.textDim}`}>
        <span
          className={`px-1 py-0.5 rounded text-[9px] uppercase font-medium ${
            workspace.mode === 'holdings'
              ? 'bg-emerald-400/10 text-emerald-400'
              : 'bg-blue-400/10 text-blue-400'
          }`}
        >
          {workspace.mode}
        </span>
        <span>{coinCount} coins</span>
        <span>{updatedAgo}</span>
      </div>
    </button>
  );
}
