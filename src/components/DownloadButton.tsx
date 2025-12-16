'use client';

import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown } from 'lucide-react';
import { CoinMarketData } from '@/types/crypto';
import { downloadExcel, downloadCSV } from '@/lib/export';

interface DownloadButtonProps {
  coins: CoinMarketData[];
  filename?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  showDropdown?: boolean;
}

export default function DownloadButton({
  coins,
  filename,
  variant = 'primary',
  size = 'md',
  showDropdown = true,
}: DownloadButtonProps) {
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleDownload = async (format: 'xlsx' | 'csv') => {
    if (coins.length === 0) return;
    
    setLoading(true);
    try {
      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      if (format === 'xlsx') {
        downloadExcel(coins, filename);
      } else {
        downloadCSV(coins, filename);
      }
      
      // Track download (would connect to Supabase)
      console.log(`Downloaded ${coins.length} coins as ${format}`);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  const baseClasses = 'font-medium rounded-xl transition-all flex items-center gap-2';
  
  const variantClasses = {
    primary: 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm hover:shadow',
    secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
    ghost: 'hover:bg-gray-100 text-gray-600',
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg',
  };

  if (!showDropdown) {
    return (
      <button
        onClick={() => handleDownload('xlsx')}
        disabled={loading || coins.length === 0}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Download Excel
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={loading || coins.length === 0}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} disabled:opacity-50`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Download
        <ChevronDown className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-2">
            <button
              onClick={() => handleDownload('xlsx')}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
            >
              <FileSpreadsheet className="w-5 h-5 text-green-600" />
              <div>
                <div className="font-medium text-gray-900">Excel (.xlsx)</div>
                <div className="text-xs text-gray-500">Best for analysis</div>
              </div>
            </button>
            <button
              onClick={() => handleDownload('csv')}
              className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left"
            >
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <div className="font-medium text-gray-900">CSV (.csv)</div>
                <div className="text-xs text-gray-500">Universal format</div>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// Quick download button for specific templates
export function TemplateDownloadButton({
  templateId,
  label,
  coinCount,
}: {
  templateId: string;
  label: string;
  coinCount: number;
}) {
  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/export?template=${templateId}`);
      const blob = await response.blob();
      
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${templateId}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Template download error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={loading}
      className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50"
    >
      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin" />
      ) : (
        <Download className="w-5 h-5" />
      )}
      {label}
      <span className="text-orange-200 text-sm">({coinCount} coins)</span>
    </button>
  );
}
