'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Download, FileSpreadsheet, FileText, Loader2, ChevronDown, AlertCircle } from 'lucide-react';
import { CoinMarketData } from '@/types/crypto';
import { downloadExcel, downloadCSV } from '@/lib/export';
import EmailCaptureModal from './EmailCaptureModal';

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
  const exportsEnabled = (process.env.NEXT_PUBLIC_ENABLE_DATA_EXPORTS || '').trim().toLowerCase() === 'true';

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [pendingFormat, setPendingFormat] = useState<'xlsx' | 'csv' | null>(null);
  const [downloadsRemaining, setDownloadsRemaining] = useState(3);
  const [limitReached, setLimitReached] = useState(false);

  // Check if user is already registered
  useEffect(() => {
    const email = localStorage.getItem('ds_user_email');
    if (email) {
      setUserEmail(email);
      // Fetch download status
      fetch(`/api/user/track-download?email=${encodeURIComponent(email)}`)
        .then(res => res.json())
        .then(data => {
          setDownloadsRemaining(data.downloadsRemaining ?? 3);
          setLimitReached(data.downloadsRemaining <= 0);
        })
        .catch(() => {});
    }
  }, []);

  const trackDownload = async (format: string) => {
    if (!userEmail) return;

    try {
      const response = await fetch('/api/user/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          downloadType: format,
          fileName: filename || 'crypto_data',
        }),
      });

      const data = await response.json().catch(() => ({} as any));

      if (!response.ok) {
        // Truthfulness: if we can't track, we shouldn't claim the download was persisted.
        console.error('Download tracking failed:', data);
        return false;
      }

      if (data.upgradeRequired) {
        setLimitReached(true);
        setDownloadsRemaining(0);
        return false;
      }

      setDownloadsRemaining(data.downloadsRemaining ?? 0);
      return true;
    } catch (error) {
      console.error('Track download error:', error);
      return false;
    }
  };

  const handleDownload = async (format: 'xlsx' | 'csv') => {
    if (coins.length === 0) return;

    // Check if user has email registered
    if (!userEmail) {
      setPendingFormat(format);
      setShowEmailModal(true);
      return;
    }

    // Check download limit
    if (limitReached) {
      alert('You have reached your monthly download limit. Upgrade to Pro for unlimited downloads!');
      return;
    }

    setLoading(true);
    try {
      // Track the download first
      const canDownload = await trackDownload(format);

      if (!canDownload) {
        alert('Download tracking is unavailable right now, so the download was blocked. Please try again in a moment.');
        return;
      }

      // Small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 300));

      if (format === 'xlsx') {
        downloadExcel(coins, filename);
      } else {
        downloadCSV(coins, filename);
      }

      console.log(`Downloaded ${coins.length} coins as ${format}`);
    } catch (error) {
      console.error('Download error:', error);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  const handleEmailSuccess = (email: string) => {
    setUserEmail(email);
    setShowEmailModal(false);
    setDownloadsRemaining(3);

    // Proceed with pending download
    if (pendingFormat) {
      handleDownload(pendingFormat);
      setPendingFormat(null);
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

  if (!exportsEnabled) {
    return (
      <Link
        href="/templates"
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}
      >
        <FileSpreadsheet className="w-4 h-4" />
        Get Excel Template
      </Link>
    );
  }

  // Show remaining downloads badge
  const DownloadsBadge = () => {
    if (!userEmail) return null;

    return (
      <span className={`ml-1 text-xs px-1.5 py-0.5 rounded-full ${
        downloadsRemaining > 0
          ? 'bg-white/20 text-white'
          : 'bg-red-100 text-red-600'
      }`}>
        {downloadsRemaining} left
      </span>
    );
  };

  if (!showDropdown) {
    return (
      <>
        <button
          onClick={() => handleDownload('xlsx')}
          disabled={loading || coins.length === 0}
          className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} disabled:opacity-50`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : limitReached ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {limitReached ? 'Limit Reached' : 'Download Excel'}
          <DownloadsBadge />
        </button>

        <EmailCaptureModal
          isOpen={showEmailModal}
          onClose={() => {
            setShowEmailModal(false);
            setPendingFormat(null);
          }}
          onSuccess={handleEmailSuccess}
          downloadType="Data"
        />
      </>
    );
  }

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={loading || coins.length === 0}
          className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} disabled:opacity-50`}
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : limitReached ? (
            <AlertCircle className="w-4 h-4" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          {limitReached ? 'Limit Reached' : 'Download'}
          <DownloadsBadge />
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
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-2">
              {/* Downloads remaining info */}
              {userEmail && (
                <div className="px-4 py-2 border-b border-gray-100 mb-2">
                  <p className="text-xs text-gray-500">
                    {downloadsRemaining > 0 ? (
                      <>
                        <span className="font-medium text-gray-700">{downloadsRemaining}</span> free downloads remaining this month
                      </>
                    ) : (
                      <span className="text-red-600">Monthly limit reached</span>
                    )}
                  </p>
                </div>
              )}

              <button
                onClick={() => handleDownload('xlsx')}
                disabled={limitReached}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileSpreadsheet className="w-5 h-5 text-green-600" />
                <div>
                  <div className="font-medium text-gray-900">Excel (.xlsx)</div>
                  <div className="text-xs text-gray-500">Best for analysis</div>
                </div>
              </button>
              <button
                onClick={() => handleDownload('csv')}
                disabled={limitReached}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FileText className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">CSV (.csv)</div>
                  <div className="text-xs text-gray-500">Universal format</div>
                </div>
              </button>

              {limitReached && (
                <div className="px-4 py-2 border-t border-gray-100 mt-2">
                  <a
                    href="/pricing"
                    className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                  >
                    Upgrade to Pro
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => {
          setShowEmailModal(false);
          setPendingFormat(null);
        }}
        onSuccess={handleEmailSuccess}
        downloadType="Data"
      />
    </>
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
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem('ds_user_email');
    if (email) setUserEmail(email);
  }, []);

  const handleDownload = async () => {
    if (!userEmail) {
      setShowEmailModal(true);
      return;
    }

    setLoading(true);
    try {
      // Track download
      await fetch('/api/user/track-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: userEmail,
          downloadType: 'template',
          fileName: templateId,
        }),
      });

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

  const handleEmailSuccess = (email: string) => {
    setUserEmail(email);
    setShowEmailModal(false);
    handleDownload();
  };

  return (
    <>
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

      <EmailCaptureModal
        isOpen={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        onSuccess={handleEmailSuccess}
        downloadType={label}
      />
    </>
  );
}