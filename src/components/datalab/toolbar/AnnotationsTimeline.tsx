'use client';

import { useState } from 'react';
import { X, Pencil, Calendar, BookOpen, Trash2, Filter } from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';
import { isFeatureAvailable } from '@/lib/datalab/modeConfig';

type AnnotationType = 'drawing' | 'event' | 'note';

interface TimelineEntry {
  id: string;
  type: AnnotationType;
  label: string;
  timestamp: number;
  detail?: string;
  onDelete?: () => void;
}

export function AnnotationsTimeline() {
  const dataLabMode = useDataLabStore((s) => s.dataLabMode);
  const showAnnotationsTimeline = useDataLabStore((s) => s.showAnnotationsTimeline);
  const drawings = useDataLabStore((s) => s.drawings);
  const customEvents = useDataLabStore((s) => s.customEvents);
  const labNotes = useDataLabStore((s) => s.labNotes);
  const timestamps = useDataLabStore((s) => s.timestamps);
  const removeDrawing = useDataLabStore((s) => s.removeDrawing);
  const removeCustomEvent = useDataLabStore((s) => s.removeCustomEvent);
  const removeLabNote = useDataLabStore((s) => s.removeLabNote);

  const [filter, setFilter] = useState<AnnotationType | 'all'>('all');

  if (!isFeatureAvailable(dataLabMode, 'annotationsTimeline')) return null;
  if (!showAnnotationsTimeline) return null;

  // Build entries from drawings, events, and notes
  const entries: TimelineEntry[] = [];

  for (const d of drawings) {
    const ts = d.points[0]?.x ?? 0;
    entries.push({
      id: `draw-${d.id}`,
      type: 'drawing',
      label: `${d.type} drawing`,
      timestamp: ts,
      detail: d.label || `${d.type} at ${d.points.map((p) => p.y.toFixed(2)).join(' → ')}`,
      onDelete: () => removeDrawing(d.id),
    });
  }

  for (const evt of customEvents) {
    entries.push({
      id: `event-${evt.date}`,
      type: 'event',
      label: evt.label,
      timestamp: evt.date,
      detail: evt.description,
      onDelete: () => removeCustomEvent(evt.date),
    });
  }

  for (const note of labNotes) {
    entries.push({
      id: `note-${note.id}`,
      type: 'note',
      label: note.hypothesis,
      timestamp: note.timestamp,
      detail: note.evidence,
      onDelete: () => removeLabNote(note.id),
    });
  }

  // Filter
  const filtered = filter === 'all' ? entries : entries.filter((e) => e.type === filter);

  // Sort by timestamp (most recent first)
  filtered.sort((a, b) => b.timestamp - a.timestamp);

  const TYPE_ICON = {
    drawing: Pencil,
    event: Calendar,
    note: BookOpen,
  };

  const TYPE_COLOR = {
    drawing: 'text-emerald-400',
    event: 'text-amber-400',
    note: 'text-purple-400',
  };

  return (
    <div className="border-t border-white/[0.04] bg-white/[0.01] max-w-[1800px] mx-auto">
      <div className="px-4 py-2">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-xs font-semibold text-white flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            Annotations Timeline
            <span className="text-[10px] text-gray-500 font-normal">{filtered.length} items</span>
          </h4>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Filter className="w-3 h-3 text-gray-500" />
              {(['all', 'drawing', 'event', 'note'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFilter(t)}
                  className={`px-1.5 py-0.5 rounded text-[9px] font-medium transition ${
                    filter === t ? 'bg-white/[0.08] text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {t === 'all' ? 'All' : t.charAt(0).toUpperCase() + t.slice(1) + 's'}
                </button>
              ))}
            </div>
            <button
              type="button"
              title="Close timeline"
              onClick={() => useDataLabStore.setState({ showAnnotationsTimeline: false })}
              className="text-gray-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-[11px] text-gray-600 text-center py-3">
            No annotations yet. Add drawings, events, or notes to see them here.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'thin' }}>
            {filtered.map((entry) => {
              const Icon = TYPE_ICON[entry.type];
              const color = TYPE_COLOR[entry.type];
              return (
                <div
                  key={entry.id}
                  className="flex-shrink-0 bg-white/[0.02] border border-white/[0.06] rounded-lg px-3 py-2 min-w-[180px] max-w-[220px] group"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Icon className={`w-3 h-3 ${color}`} />
                    <span className="text-[10px] text-gray-500">
                      {entry.timestamp > 0 ? new Date(entry.timestamp).toLocaleDateString() : 'N/A'}
                    </span>
                    {entry.onDelete && (
                      <button
                        type="button"
                        title="Delete"
                        onClick={entry.onDelete}
                        className="ml-auto text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-300 truncate">{entry.label}</p>
                  {entry.detail && (
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">{entry.detail}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
