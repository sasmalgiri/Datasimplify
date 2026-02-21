'use client';

import { useState, useEffect } from 'react';
import {
  Folder,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  X,
  Check,
  Loader2,
  Eye,
  BarChart3,
} from 'lucide-react';
import { useWorkspaceStore } from '@/lib/workspaces/workspaceStore';
import { useLiveDashboardStore } from '@/lib/live-dashboard/store';
import { SITE_THEMES } from '@/lib/live-dashboard/theme';
import type { Workspace } from '@/lib/workspaces/types';
import { formatDistanceToNow } from 'date-fns';

interface WorkspacePanelProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
}

export function WorkspacePanel({ isOpen, onClose, onCreateNew }: WorkspacePanelProps) {
  const siteTheme = useLiveDashboardStore((s) => s.siteTheme);
  const st = SITE_THEMES[siteTheme];

  const {
    workspaces,
    activeWorkspaceId,
    isLoadingWorkspaces,
    error,
    fetchWorkspaces,
    setActiveWorkspace,
    updateWorkspace,
    deleteWorkspace,
    clearError,
  } = useWorkspaceStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchWorkspaces();
    }
  }, [isOpen, fetchWorkspaces]);

  const handleSelect = (ws: Workspace) => {
    setActiveWorkspace(ws.id);
    onClose();
  };

  const handleStartEdit = (ws: Workspace) => {
    setEditingId(ws.id);
    setEditName(ws.name);
  };

  const handleSaveEdit = async (id: string) => {
    if (editName.trim()) {
      await updateWorkspace(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteWorkspace(id);
    setDeletingId(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div
        className={`relative w-full max-w-md ${st.pageBg} border-l ${st.subtleBorder} overflow-y-auto`}
      >
        {/* Header */}
        <div className={`sticky top-0 ${st.pageBg} border-b ${st.subtleBorder} p-4 z-10`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Folder className="w-5 h-5 text-emerald-400" />
              <h2 className={`text-lg font-semibold ${st.textPrimary}`}>Workspaces</h2>
            </div>
            <button
              onClick={onClose}
              className={`p-1.5 rounded-lg ${st.buttonSecondary}`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className={`text-sm mt-1 ${st.textMuted}`}>
            {workspaces.length}/10 workspaces
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className={`mx-4 mt-4 p-3 rounded-lg ${st.errorBg} text-sm`}>
            {error}
            <button onClick={clearError} className="ml-2 underline">
              Dismiss
            </button>
          </div>
        )}

        {/* Loading */}
        {isLoadingWorkspaces && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-emerald-400 animate-spin" />
          </div>
        )}

        {/* Workspace List */}
        {!isLoadingWorkspaces && (
          <div className="p-4 space-y-3">
            {workspaces.length === 0 && (
              <div className={`text-center py-8 ${st.textMuted}`}>
                <Folder className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No workspaces yet</p>
                <p className="text-xs mt-1">Create one to start tracking</p>
              </div>
            )}

            {workspaces.map((ws) => {
              const isActive = ws.id === activeWorkspaceId;
              const isEditing = ws.id === editingId;
              const isDeleting = ws.id === deletingId;
              const coinCount = ws.config?.coins?.length ?? 0;
              const updatedAgo = formatDistanceToNow(new Date(ws.updated_at), {
                addSuffix: true,
              });

              return (
                <div
                  key={ws.id}
                  className={`
                    ${st.cardClasses} p-4 cursor-pointer
                    ${isActive ? 'border-emerald-400/40 shadow-[0_0_20px_rgba(52,211,153,0.08)]' : ''}
                    ${st.cardGlow}
                  `}
                >
                  {/* Delete Confirmation */}
                  {isDeleting && (
                    <div className="flex items-center justify-between">
                      <p className={`text-sm ${st.textPrimary}`}>Delete "{ws.name}"?</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDelete(ws.id)}
                          className="px-3 py-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setDeletingId(null)}
                          className={`px-3 py-1 text-xs rounded-lg ${st.buttonSecondary}`}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Normal View */}
                  {!isDeleting && (
                    <>
                      <div
                        className="flex items-center justify-between"
                        onClick={() => !isEditing && handleSelect(ws)}
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                              ws.mode === 'holdings'
                                ? 'bg-emerald-400/15 text-emerald-400'
                                : 'bg-blue-400/15 text-blue-400'
                            }`}
                          >
                            {ws.mode === 'holdings' ? (
                              <BarChart3 className="w-4 h-4" />
                            ) : (
                              <Eye className="w-4 h-4" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            {isEditing ? (
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleSaveEdit(ws.id);
                                    if (e.key === 'Escape') setEditingId(null);
                                  }}
                                  className={`flex-1 px-2 py-1 text-sm rounded ${st.inputBg}`}
                                  autoFocus
                                  onClick={(e) => e.stopPropagation()}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSaveEdit(ws.id);
                                  }}
                                  className="p-1 text-emerald-400 hover:text-emerald-300"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                              </div>
                            ) : (
                              <>
                                <h3
                                  className={`font-medium text-sm truncate ${st.textPrimary}`}
                                >
                                  {ws.name}
                                </h3>
                                <div className={`flex items-center gap-2 text-xs ${st.textDim}`}>
                                  <span
                                    className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-medium ${
                                      ws.mode === 'holdings'
                                        ? 'bg-emerald-400/10 text-emerald-400'
                                        : 'bg-blue-400/10 text-blue-400'
                                    }`}
                                  >
                                    {ws.mode}
                                  </span>
                                  <span>{coinCount} coins</span>
                                  <span>{updatedAgo}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {!isEditing && (
                          <div className="flex items-center gap-1 ml-2">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(ws);
                              }}
                              className={`p-1.5 rounded-lg opacity-0 group-hover:opacity-100 ${st.buttonSecondary}`}
                              title="Rename"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setDeletingId(ws.id);
                              }}
                              className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 text-red-400 hover:bg-red-400/10"
                              title="Delete"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <ChevronRight
                              className={`w-4 h-4 ${isActive ? 'text-emerald-400' : st.textDim}`}
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}

            {/* Create New Button */}
            {workspaces.length < 10 && (
              <button
                onClick={onCreateNew}
                className={`w-full ${st.cardClasses} ${st.cardGlow} p-4 flex items-center justify-center gap-2 ${st.textMuted} hover:text-emerald-400 transition-colors`}
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm font-medium">New Workspace</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
