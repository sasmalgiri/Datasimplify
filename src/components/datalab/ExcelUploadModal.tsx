'use client';

import { useState, useRef, useCallback } from 'react';
import { X, Upload, FileSpreadsheet, Loader2, AlertCircle, CheckCircle2, Trash2 } from 'lucide-react';

interface ExcelUpload {
  id: string;
  filename: string;
  sheet_name: string;
  columns: Array<{ key: string; label: string; source: string }>;
  row_count: number;
  coin: string | null;
  days: number | null;
  preset: string | null;
  created_at: string;
}

interface ExcelUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: (upload: ExcelUpload) => void;
  currentUpload: ExcelUpload | null;
  onClearUpload: () => void;
}

export function ExcelUploadModal({
  isOpen,
  onClose,
  onUploadComplete,
  currentUpload,
  onClearUpload,
}: ExcelUploadModalProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    setSuccess(null);

    if (!file.name.endsWith('.xlsx')) {
      setError('Only .xlsx files are accepted. Download your data from CryptoReportKit first.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large (max 5MB).');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/datalab/upload-excel', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Upload failed');
        return;
      }

      setSuccess(`Uploaded ${data.upload.filename} (${data.upload.row_count} rows)`);
      onUploadComplete(data.upload);
    } catch {
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  }, [onUploadComplete]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDelete = async () => {
    if (!currentUpload) return;
    try {
      await fetch(`/api/datalab/upload-excel?id=${currentUpload.id}`, { method: 'DELETE' });
      onClearUpload();
      setSuccess(null);
    } catch {
      // ignore
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-white/[0.1] rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Connect Excel Data</h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-500 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Info */}
          <p className="text-sm text-gray-400">
            Upload a CryptoReportKit Excel file to display your customized data in DataLab.
            Only files downloaded from our site are accepted.
          </p>

          {/* Current upload */}
          {currentUpload && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="text-sm text-emerald-400 font-medium">{currentUpload.filename}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {currentUpload.row_count} rows &middot; Sheet: {currentUpload.sheet_name}
                  {currentUpload.coin && ` &middot; ${currentUpload.coin}`}
                </p>
              </div>
              <button
                type="button"
                onClick={handleDelete}
                className="text-gray-500 hover:text-red-400 transition p-1"
                title="Remove uploaded data"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              isDragging
                ? 'border-emerald-400 bg-emerald-500/10'
                : 'border-white/[0.1] hover:border-white/[0.2] bg-white/[0.02]'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = '';
              }}
            />

            {isUploading ? (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-sm text-gray-400">Processing file...</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Upload className="w-8 h-8 text-gray-500" />
                <p className="text-sm text-gray-300">
                  Drop your .xlsx file here or <span className="text-emerald-400">browse</span>
                </p>
                <p className="text-xs text-gray-600">Max 5MB &middot; Only CryptoReportKit exports</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="flex items-start gap-2 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* How it works */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-lg p-3">
            <p className="text-xs font-medium text-gray-400 mb-2">How it works</p>
            <ol className="text-xs text-gray-500 space-y-1 list-decimal list-inside">
              <li>Export data from DataLab using the <strong className="text-gray-400">Excel</strong> button</li>
              <li>Open the file in Excel and customize values, add rows, or edit data</li>
              <li>Upload the modified file here to see your changes reflected online</li>
            </ol>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-white/[0.06] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
