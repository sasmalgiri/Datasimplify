'use client';

import { useMemo } from 'react';
import { Clock, Camera, Plus, Minus, Bell, TrendingUp, Folder } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import { useWorkspaceStore } from '@/lib/workspaces/workspaceStore';
import type { SnapshotWithDiff } from '@/lib/workspaces/types';

interface ActivityItem {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  text: string;
  time: string;
  timestamp: number;
}

export function ActivityFeed() {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];
  const { snapshots, workspaces } = useWorkspaceStore();

  const activities = useMemo<ActivityItem[]>(() => {
    const items: ActivityItem[] = [];

    // Workspace creation events
    for (const ws of workspaces) {
      items.push({
        id: `ws-create-${ws.id}`,
        icon: Folder,
        iconColor: 'text-blue-400',
        text: `Created workspace "${ws.name}"`,
        time: formatDistanceToNow(new Date(ws.created_at), { addSuffix: true }),
        timestamp: new Date(ws.created_at).getTime(),
      });
    }

    // Snapshot events
    for (let i = 0; i < Math.min(snapshots.length, 10); i++) {
      const snap = snapshots[i] as SnapshotWithDiff;
      const valueFmt = snap.kpi_value
        ? `$${snap.kpi_value >= 1e9 ? `${(snap.kpi_value / 1e9).toFixed(1)}B` : snap.kpi_value.toLocaleString()}`
        : '';

      items.push({
        id: `snap-${snap.id}`,
        icon: Camera,
        iconColor: 'text-emerald-400',
        text: `Snapshot saved${valueFmt ? ` — ${valueFmt}` : ''}${snap.asset_count ? ` (${snap.asset_count} coins)` : ''}`,
        time: formatDistanceToNow(new Date(snap.created_at), { addSuffix: true }),
        timestamp: new Date(snap.created_at).getTime(),
      });

      // Detect added/removed coins between consecutive snapshots
      if (i < snapshots.length - 1) {
        const prev = snapshots[i + 1] as SnapshotWithDiff;
        const currentCoins = new Set((snap.positions_json ?? []).map((p: any) => p.symbol));
        const prevCoins = new Set((prev.positions_json ?? []).map((p: any) => p.symbol));

        const added = [...currentCoins].filter((c) => !prevCoins.has(c));
        const removed = [...prevCoins].filter((c) => !currentCoins.has(c));

        if (added.length > 0) {
          items.push({
            id: `snap-add-${snap.id}`,
            icon: Plus,
            iconColor: 'text-emerald-400',
            text: `Added ${added.join(', ')} to workspace`,
            time: formatDistanceToNow(new Date(snap.created_at), { addSuffix: true }),
            timestamp: new Date(snap.created_at).getTime() - 1,
          });
        }
        if (removed.length > 0) {
          items.push({
            id: `snap-rm-${snap.id}`,
            icon: Minus,
            iconColor: 'text-red-400',
            text: `Removed ${removed.join(', ')} from workspace`,
            time: formatDistanceToNow(new Date(snap.created_at), { addSuffix: true }),
            timestamp: new Date(snap.created_at).getTime() - 2,
          });
        }
      }

      // Value change highlight
      if (snap.diff?.value_pct_change != null && Math.abs(snap.diff.value_pct_change) > 2) {
        const dir = snap.diff.value_pct_change >= 0 ? 'up' : 'down';
        items.push({
          id: `snap-delta-${snap.id}`,
          icon: TrendingUp,
          iconColor: dir === 'up' ? 'text-emerald-400' : 'text-red-400',
          text: `Portfolio ${dir} ${Math.abs(snap.diff.value_pct_change).toFixed(1)}% since last snapshot`,
          time: formatDistanceToNow(new Date(snap.created_at), { addSuffix: true }),
          timestamp: new Date(snap.created_at).getTime() - 3,
        });
      }
    }

    // Sort by timestamp, newest first, limit to 15
    return items.sort((a, b) => b.timestamp - a.timestamp).slice(0, 15);
  }, [snapshots, workspaces]);

  if (activities.length === 0) {
    return (
      <div className={`${st.cardClasses} p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className={`text-xs font-semibold uppercase tracking-wider ${st.textDim}`}>Activity</span>
        </div>
        <p className={`text-[11px] ${st.textMuted} text-center py-3`}>
          No activity yet. Refresh data and save a snapshot to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className={`${st.cardClasses} p-4`}>
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-gray-500" />
        <span className={`text-xs font-semibold uppercase tracking-wider ${st.textDim}`}>Activity</span>
        <span className="text-[10px] text-gray-500">({activities.length})</span>
      </div>

      <div className="space-y-0 relative">
        {/* Timeline line */}
        <div className="absolute left-[7px] top-2 bottom-2 w-px bg-white/[0.06]" />

        {activities.map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start gap-3 py-1.5 relative">
              <div className="relative z-10 mt-0.5">
                <Icon className={`w-3.5 h-3.5 ${activity.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[11px] leading-relaxed ${st.textSecondary} truncate`}>{activity.text}</p>
                <p className="text-[9px] text-gray-600">{activity.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
