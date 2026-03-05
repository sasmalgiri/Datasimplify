'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { X, RotateCcw, Undo2, ChevronDown, FileSpreadsheet } from 'lucide-react';
import { useDataLabStore } from '@/lib/datalab/store';

const ROWS_PER_PAGE = 50;

interface ExcelUploadData {
  id: string;
  filename: string;
  sheet_name: string;
  columns: Array<{ key: string; label: string; source: string }>;
  data: Array<Record<string, string | number | null>>;
  row_count: number;
  coin: string | null;
}

export function DataLabTable() {
  const {
    layers, timestamps, editedCells, editHistory,
    editCell, resetEdits, undoLastEdit, toggleTable,
  } = useDataLabStore();

  const [visibleRows, setVisibleRows] = useState(ROWS_PER_PAGE);
  const editingRef = useRef<{ layerId: string; index: number } | null>(null);

  // Excel upload data (received via custom event from toolbar)
  const [excelData, setExcelData] = useState<ExcelUploadData | null>(null);
  const [viewMode, setViewMode] = useState<'live' | 'excel'>('live');

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail) {
        setExcelData(detail);
        // Fetch full data if we only have metadata
        if (!detail.data) {
          fetch(`/api/datalab/excel-data?id=${detail.id}`)
            .then((r) => r.json())
            .then((res) => { if (res.upload) setExcelData(res.upload); })
            .catch(() => {});
        }
        setViewMode('excel');
      } else {
        setExcelData(null);
        setViewMode('live');
      }
    };
    window.addEventListener('crk-excel-upload', handler);
    return () => window.removeEventListener('crk-excel-upload', handler);
  }, []);

  const visibleLayers = layers.filter((l) => l.visible);

  const blurActiveEditable = () => {
    if (typeof document === 'undefined') return;
    const active = document.activeElement as HTMLElement | null;
    if (active && (active as any).isContentEditable) {
      active.blur();
    }
  };

  const handleCellBlur = useCallback(
    (layerId: string, index: number, el: HTMLTableCellElement) => {
      const text = el.textContent?.trim() ?? '';
      const num = parseFloat(text);
      if (isNaN(num)) {
        const layer = layers.find((l) => l.id === layerId);
        el.textContent = layer?.data[index]?.toFixed(2) ?? '';
        return;
      }
      editCell(layerId, index, num);
      editingRef.current = null;
    },
    [editCell, layers],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTableCellElement>, layerId: string, index: number) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleCellBlur(layerId, index, e.currentTarget);
        e.currentTarget.blur();
      }
      if (e.key === 'Escape') {
        const layer = layers.find((l) => l.id === layerId);
        e.currentTarget.textContent = layer?.data[index]?.toFixed(2) ?? '';
        e.currentTarget.blur();
      }
    },
    [handleCellBlur, layers],
  );

  const formatValue = (v: number | null, source: string): string => {
    if (v == null) return '—';
    if (source === 'rsi' || source === 'fear_greed' || source === 'btc_dominance'
        || source === 'stochastic_k' || source === 'stochastic_d') return v.toFixed(1);
    if (source === 'funding_rate') return v.toFixed(4);
    if (v >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (v >= 1e3) return v.toFixed(0);
    if (v >= 1) return v.toFixed(2);
    return v.toFixed(6);
  };

  const hasLiveData = timestamps.length > 0;
  const hasExcelData = excelData?.data && excelData.data.length > 0;

  if (!hasLiveData && !hasExcelData) {
    return (
      <div className="w-80 border-l border-white/[0.06] bg-white/[0.02] flex items-center justify-center">
        <p className="text-gray-500 text-xs">Load data to see the table</p>
      </div>
    );
  }

  // Excel data columns (skip the first "Date" column for data display)
  const excelColumns = excelData?.columns?.filter((c) => c.source !== 'date') || [];

  return (
    <div className="w-80 flex-shrink-0 border-l border-white/[0.06] bg-white/[0.02] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <h3 className="text-[10px] uppercase tracking-widest text-gray-500 font-medium">
            {viewMode === 'excel' ? 'Excel Data' : 'Data Table'}
          </h3>
          {viewMode === 'live' && editHistory.length > 0 && (
            <span className="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
              {editHistory.length} edit{editHistory.length !== 1 ? 's' : ''}
            </span>
          )}
          {viewMode === 'excel' && excelData && (
            <span className="text-[9px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">
              {excelData.row_count} rows
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {/* Mode toggle (only show if both data sources available) */}
          {hasLiveData && hasExcelData && (
            <button
              type="button"
              onClick={() => setViewMode(viewMode === 'live' ? 'excel' : 'live')}
              className={`px-1.5 py-0.5 rounded text-[9px] transition ${
                viewMode === 'excel'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/[0.04] text-gray-500 border border-white/[0.06]'
              }`}
              title={viewMode === 'excel' ? 'Switch to live data' : 'Switch to Excel data'}
            >
              <FileSpreadsheet className="w-3 h-3" />
            </button>
          )}
          {viewMode === 'live' && (
            <>
              <button
                type="button"
                onClick={() => {
                  blurActiveEditable();
                  setTimeout(() => undoLastEdit(), 0);
                }}
                disabled={editHistory.length === 0}
                className="text-gray-500 hover:text-white disabled:text-gray-700 transition p-1"
                title="Undo last edit"
              >
                <Undo2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => {
                  blurActiveEditable();
                  setTimeout(() => resetEdits(), 0);
                }}
                disabled={editHistory.length === 0}
                className="text-gray-500 hover:text-white disabled:text-gray-700 transition p-1"
                title="Reset all edits"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={toggleTable}
            className="text-gray-500 hover:text-white transition p-1"
            title="Close table"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Help banner */}
      <div className="px-3 py-1 border-b border-white/[0.04] text-[9px] text-gray-600">
        {viewMode === 'excel'
          ? `Showing: ${excelData?.filename || 'uploaded file'}`
          : 'Click any cell to edit \u00B7 Enter to confirm \u00B7 Esc to cancel'}
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto">
        {viewMode === 'excel' && hasExcelData ? (
          /* ── Excel data table ── */
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-emerald-500/[0.06]">
                {excelData!.columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-2 py-1.5 font-medium border-b border-emerald-500/20 ${
                      col.source === 'date' ? 'text-left text-gray-500' : 'text-right text-emerald-400/80'
                    }`}
                  >
                    <span className="truncate max-w-[80px] inline-block">{col.label}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {excelData!.data.slice(0, visibleRows).map((row, i) => (
                <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.03]">
                  {excelData!.columns.map((col) => {
                    const val = row[col.key];
                    return (
                      <td
                        key={col.key}
                        className={`px-2 py-1 whitespace-nowrap ${
                          col.source === 'date' ? 'text-gray-500' : 'text-right font-mono text-gray-300'
                        }`}
                      >
                        {val != null ? String(val) : '—'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          /* ── Live data table (existing) ── */
          <table className="w-full text-[10px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-white/[0.04]">
                <th className="text-left px-2 py-1.5 text-gray-500 font-medium border-b border-white/[0.06]">
                  Date
                </th>
                {visibleLayers.map((layer) => (
                  <th
                    key={layer.id}
                    className="text-right px-2 py-1.5 font-medium border-b border-white/[0.06]"
                  >
                    <div className="flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: layer.color }} />
                      <span className="text-gray-400 truncate max-w-[80px]">{layer.label}</span>
                      {editedCells[layer.id] && Object.keys(editedCells[layer.id]).length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            blurActiveEditable();
                            setTimeout(() => resetEdits(layer.id), 0);
                          }}
                          className="text-amber-400 hover:text-amber-300 ml-0.5"
                          title={`Reset ${layer.label} edits`}
                        >
                          <RotateCcw className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {timestamps.slice(0, visibleRows).map((ts, rowIndex) => {
                const date = new Date(ts);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear().toString().slice(2)}`;

                return (
                  <tr
                    key={ts}
                    className="border-b border-white/[0.03] hover:bg-white/[0.03]"
                  >
                    <td className="px-2 py-1 text-gray-500 whitespace-nowrap">{dateStr}</td>
                    {visibleLayers.map((layer) => {
                      const isEdited = editedCells[layer.id]?.[rowIndex] !== undefined;
                      const value = isEdited
                        ? editedCells[layer.id][rowIndex]
                        : layer.data[rowIndex];
                      const isEditable = layer.source !== 'ohlc';

                      return (
                        <td
                          key={layer.id}
                          contentEditable={isEditable}
                          suppressContentEditableWarning
                          onBlur={(e) => isEditable && handleCellBlur(layer.id, rowIndex, e.currentTarget)}
                          onKeyDown={(e) => isEditable && handleKeyDown(e, layer.id, rowIndex)}
                          onFocus={() => { editingRef.current = { layerId: layer.id, index: rowIndex }; }}
                          className={`px-2 py-1 text-right font-mono whitespace-nowrap ${
                            isEdited
                              ? 'bg-amber-400/10 text-amber-300'
                              : 'text-gray-300'
                          } ${isEditable ? 'cursor-text focus:outline-none focus:bg-white/[0.06]' : 'cursor-default'}`}
                        >
                          {formatValue(value ?? null, layer.source)}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}

        {/* Load more */}
        {(() => {
          const totalRows = viewMode === 'excel' ? (excelData?.data?.length || 0) : timestamps.length;
          return visibleRows < totalRows ? (
            <button
              type="button"
              onClick={() => setVisibleRows((v) => v + ROWS_PER_PAGE)}
              className="w-full py-2 text-center text-[10px] text-gray-500 hover:text-emerald-400 bg-white/[0.02] border-t border-white/[0.06] transition"
            >
              <ChevronDown className="w-3 h-3 inline mr-1" />
              Load more ({totalRows - visibleRows} remaining)
            </button>
          ) : null;
        })()}
      </div>
    </div>
  );
}
