'use client';

import { useState, useEffect } from 'react';
import type { ContentType } from '@/lib/templates/generator';
import { CONTENT_OPTIONS, generateDownloadFilename } from '@/lib/constants/contentOptions';
import type { ContentOption } from '@/lib/constants/contentOptions';
import { BYOK_PRIVACY_SHORT } from '@/lib/constants/byokMessages';
import { useAuth } from '@/lib/auth';
import { Turnstile } from '@/components/security/Turnstile';
import { SetupWizard } from '@/components/wizard';
import { Sparkles, Download, ChevronRight } from 'lucide-react';

type DownloadMode = 'select' | 'quick' | 'wizard';

interface TemplateDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateType: string;
  templateName: string;
  userConfig: {
    coins: string[];
    timeframe: string;
    currency: string;
    formulaMode?: 'crk' | 'cryptosheets';
    customizations: Record<string, unknown>;
  };
}

const FREE_DOWNLOAD_LIMIT = 5;

// Content options imported from @/lib/constants/contentOptions

/**
 * Template Download Modal
 *
 * Gates template downloads with clear requirements and warnings.
 * Offers 2 content types: With Charts (native Excel), Data Only (tables)
 */
export function TemplateDownloadModal({
  isOpen,
  onClose,
  templateType,
  templateName,
  userConfig,
}: TemplateDownloadModalProps) {
  const { user } = useAuth();
  const [mode, setMode] = useState<DownloadMode>('select');
  const [understood, setUnderstood] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [format, setFormat] = useState<'xlsx' | 'xlsm'>('xlsx');
  const [contentType, setContentType] = useState<ContentType>('native_charts');
  const [error, setError] = useState<string | null>(null);

  // Email registration state
  const [email, setEmail] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [downloadsRemaining, setDownloadsRemaining] = useState(FREE_DOWNLOAD_LIMIT);
  const [registrationError, setRegistrationError] = useState<string | null>(null);

  // Turnstile CAPTCHA state
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  // Reset mode when modal opens
  useEffect(() => {
    if (isOpen) {
      setMode('select');
    }
  }, [isOpen]);

  // Use logged-in user's email if available
  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      setIsRegistered(true);
      // Fetch download status for logged-in user
      fetchDownloadStatus(user.email);
    } else {
      // Check for previously registered email in localStorage
      const savedEmail = localStorage.getItem('crk_user_email');
      if (savedEmail) {
        setEmail(savedEmail);
        setIsRegistered(true);
        fetchDownloadStatus(savedEmail);
      }
    }
  }, [user]);

  // Fetch current download status
  const fetchDownloadStatus = async (userEmail: string) => {
    try {
      const response = await fetch(`/api/user/track-download?email=${encodeURIComponent(userEmail)}`);
      if (response.ok) {
        const data = await response.json();
        setDownloadsRemaining(data.downloadsRemaining ?? FREE_DOWNLOAD_LIMIT);
      }
    } catch (err) {
      console.error('Error fetching download status:', err);
    }
  };

  // Register email before download
  const handleRegister = async () => {
    if (!email || !email.includes('@')) {
      setRegistrationError('Please enter a valid email address');
      return;
    }

    setIsRegistering(true);
    setRegistrationError(null);

    try {
      const response = await fetch('/api/user/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Save email to localStorage for future visits
      localStorage.setItem('crk_user_email', email.toLowerCase());
      setIsRegistered(true);
      setDownloadsRemaining(data.downloadsRemaining ?? FREE_DOWNLOAD_LIMIT);
    } catch (err) {
      console.error('Registration error:', err);
      setRegistrationError(err instanceof Error ? err.message : 'Registration failed. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDownload = async () => {
    if (!understood) {
      setError('Please confirm you understand the requirements');
      return;
    }

    if (!isRegistered || !email) {
      setError('Please register your email first');
      return;
    }

    if (downloadsRemaining <= 0) {
      setError('Monthly download limit reached. Upgrade for more downloads.');
      return;
    }

    setDownloading(true);
    setError(null);

    try {
      const response = await fetch('/api/templates/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateType,
          ...userConfig,
          contentType,
          format,
          email, // Include email for tracking
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (errorData.upgradeRequired) {
          setDownloadsRemaining(0);
        }
        throw new Error(errorData.message || 'Download failed');
      }

      // Update remaining downloads from response header
      const remaining = response.headers.get('X-Downloads-Remaining');
      if (remaining !== null) {
        setDownloadsRemaining(parseInt(remaining, 10));
      }

      // Download the file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;

      // Include content type in filename
      a.download = generateDownloadFilename(templateType, contentType, format);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Close modal on success
      onClose();
    } catch (err) {
      console.error('[TemplateDownload] Error:', err);
      setError(err instanceof Error ? err.message : 'Download failed. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  if (!isOpen) return null;

  // Show Setup Wizard
  if (mode === 'wizard') {
    return (
      <SetupWizard
        templateId={templateType}
        templateName={templateName}
        onClose={onClose}
      />
    );
  }

  // Show Mode Selection
  if (mode === 'select') {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl max-w-lg w-full p-6 shadow-2xl border border-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">
              Download {templateName}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white p-2 hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-gray-400 mb-6">
            Choose how you&apos;d like to get your template:
          </p>

          {/* Mode Options */}
          <div className="space-y-4">
            {/* Setup Wizard - Recommended */}
            <button
              type="button"
              onClick={() => setMode('wizard')}
              className="w-full p-4 bg-emerald-500/10 border-2 border-emerald-500/50 hover:border-emerald-500 rounded-xl text-left transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-white">Setup Wizard</h3>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-emerald-500 text-white rounded-full">
                      RECOMMENDED
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Guided setup to get everything working perfectly
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-emerald-400">
                    <li className="flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> Configure your report
                    </li>
                    <li className="flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> Download your Excel template
                    </li>
                    <li className="flex items-center gap-1">
                      <ChevronRight className="w-3 h-3" /> Add your CoinGecko API key in Excel
                    </li>
                  </ul>
                </div>
                <ChevronRight className="w-5 h-5 text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            {/* Quick Download */}
            <button
              type="button"
              onClick={() => setMode('quick')}
              className="w-full p-4 bg-gray-800 border-2 border-gray-700 hover:border-gray-600 rounded-xl text-left transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-gray-700 flex items-center justify-center">
                  <Download className="w-6 h-6 text-gray-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">Quick Download</h3>
                  <p className="text-sm text-gray-400 mt-1">
                    Download the template directly (you&apos;ll need to set up manually)
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    For users who already have a CoinGecko API key
                  </p>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </div>

          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            className="w-full mt-4 py-2 text-gray-400 hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // Quick Download Mode (existing modal content)
  const selectedOption = CONTENT_OPTIONS.find(opt => opt.id === contentType);

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl max-w-3xl w-full p-6 max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Quick Download
            </h2>
            <button
              type="button"
              onClick={() => setMode('select')}
              className="text-sm text-emerald-500 hover:text-emerald-400 mt-1"
            >
              &larr; Back to options
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            aria-label="Close"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Template: <span className="font-semibold text-gray-900 dark:text-white">{templateName}</span>
        </div>

        {/* Email Registration Section */}
        {!isRegistered ? (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700 rounded-lg">
            <h3 className="font-bold text-blue-800 dark:text-blue-400 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
              </svg>
              Enter Your Email to Download
            </h3>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              Free users get {FREE_DOWNLOAD_LIMIT} template downloads per month. No spam, just download tracking.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                onKeyDown={(e) => e.key === 'Enter' && handleRegister()}
              />
              <button
                type="button"
                onClick={handleRegister}
                disabled={isRegistering}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 font-medium"
              >
                {isRegistering ? 'Registering...' : 'Continue'}
              </button>
            </div>
            {/* Cloudflare Turnstile CAPTCHA */}
            <Turnstile
              onVerify={(token) => setTurnstileToken(token)}
              onExpire={() => setTurnstileToken(null)}
              theme="auto"
              size="normal"
              className="mt-3"
            />
            {registrationError && (
              <p className="text-sm text-red-600 dark:text-red-400 mt-2">{registrationError}</p>
            )}
          </div>
        ) : (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span className="text-emerald-800 dark:text-emerald-300 font-medium">{email}</span>
              </div>
              <div className="text-right">
                <span className="text-sm text-emerald-700 dark:text-emerald-300">
                  <span className="font-bold text-lg">{downloadsRemaining}</span>/{FREE_DOWNLOAD_LIMIT} downloads remaining
                </span>
              </div>
            </div>
            {downloadsRemaining <= 0 && (
              <div className="mt-3 p-2 bg-red-100 dark:bg-red-900/30 rounded border border-red-300 dark:border-red-600">
                <p className="text-sm text-red-700 dark:text-red-400">
                  You&apos;ve reached your monthly limit. Downloads reset at the start of next month.
                </p>
              </div>
            )}
            {!user && (
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem('crk_user_email');
                  setIsRegistered(false);
                  setEmail('');
                }}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-2"
              >
                Use a different email
              </button>
            )}
          </div>
        )}

        {/* Content Type Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Choose Content Type:
          </label>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {CONTENT_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setContentType(option.id as ContentType)}
                className={`relative p-4 border-2 rounded-lg transition-all text-left ${
                  contentType === option.id
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 ring-2 ring-emerald-500/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                }`}
              >
                {option.badge && (
                  <span className={`absolute -top-2 -right-2 px-2 py-0.5 text-[10px] font-bold text-white rounded-full ${option.badgeColor}`}>
                    {option.badge}
                  </span>
                )}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xl">{option.icon}</span>
                  <span className="font-bold text-gray-900 dark:text-white">{option.name}</span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                  {option.description}
                </p>
                {contentType === option.id && (
                  <div className="absolute top-2 left-2">
                    <svg className="w-5 h-5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Type Specific Info */}
        {contentType === 'native_charts' && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-300 dark:border-emerald-700 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
              <span>📊</span>
              With Charts - Ready to Use
            </h3>
            <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Pre-built Excel charts that auto-update when you refresh data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Works in <strong>Excel 2016+</strong> and Microsoft 365</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Templates include prefetched data - ready to use immediately</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Professional styling ready for presentations</span>
              </li>
            </ul>
          </div>
        )}

        {contentType === 'formulas_only' && (
          <div className="bg-gray-50 dark:bg-gray-700/50 border border-gray-300 dark:border-gray-600 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-gray-800 dark:text-gray-200 mb-2 flex items-center gap-2">
              <span>📝</span>
              Data Only - Lightweight
            </h3>
            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Smallest file size - loads instantly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Just data tables, no charts</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Create your own charts from the data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="mt-0.5">•</span>
                <span>Best for custom analysis or large datasets</span>
              </li>
            </ul>
          </div>
        )}

        {/* Requirements Box */}
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-400 dark:border-emerald-600 rounded-lg p-4 mb-4">
          <h3 className="font-bold text-emerald-800 dark:text-emerald-400 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Requirements
          </h3>
          <ul className="text-sm text-emerald-700 dark:text-emerald-300 space-y-1.5">
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
              <span>Microsoft Excel Desktop (2016 or later)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
              <span>Free CoinGecko API key (paste in Excel&apos;s Settings sheet)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
              <span>Internet connection (for downloading templates)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
              <span>{BYOK_PRIVACY_SHORT}</span>
            </li>
          </ul>
        </div>

        {/* Configuration Summary */}
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            Your Configuration:
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-600 dark:text-gray-400">Coins:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {userConfig.coins.length > 0
                  ? `${userConfig.coins.slice(0, 5).join(', ')}${
                      userConfig.coins.length > 5 ? ` +${userConfig.coins.length - 5} more` : ''
                    }`
                  : 'None selected'}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Timeframe:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {userConfig.timeframe}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Currency:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {userConfig.currency}
              </div>
            </div>
            <div>
              <span className="text-gray-600 dark:text-gray-400">Content:</span>
              <div className="font-medium text-gray-900 dark:text-white">
                {selectedOption?.name}
              </div>
            </div>
          </div>
        </div>

        {/* Format Selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            File Format:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setFormat('xlsx')}
              className={`p-3 border-2 rounded-lg transition-colors ${
                format === 'xlsx'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white">.xlsx (Recommended)</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                No macros, works everywhere
              </div>
            </button>
            <button
              type="button"
              onClick={() => setFormat('xlsm')}
              className={`p-3 border-2 rounded-lg transition-colors ${
                format === 'xlsm'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              }`}
            >
              <div className="font-bold text-gray-900 dark:text-white">.xlsm</div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Auto-refresh on open (requires macros)
              </div>
            </button>
          </div>
        </div>

        {/* Confirmation Checkbox */}
        <label className="flex items-start gap-3 mb-4 cursor-pointer group">
          <input
            type="checkbox"
            checked={understood}
            onChange={(e) => {
              setUnderstood(e.target.checked);
              setError(null);
            }}
            className="mt-1 w-4 h-4 text-emerald-600 rounded focus:ring-2 focus:ring-emerald-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
            I understand this template requires a <strong>free CoinGecko API key</strong> (pasted in Excel&apos;s Settings sheet)
            and <strong>Excel Desktop</strong> to view and analyze data.
          </span>
        </label>

        {/* Requirements Link */}
        <div className="mb-4 text-center">
          <a
            href="/template-requirements"
            target="_blank"
            className="text-sm text-blue-500 hover:text-blue-600 underline"
          >
            View full template requirements →
          </a>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition-colors"
          >
            Cancel
          </button>
          <a
            href="https://www.coingecko.com/en/api/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white transition-colors inline-flex items-center gap-2 font-medium"
          >
            Get Free API Key
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </a>
          <button
            type="button"
            onClick={handleDownload}
            disabled={!understood || downloading || !isRegistered || downloadsRemaining <= 0}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            {downloading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Generating...
              </span>
            ) : !isRegistered ? (
              'Enter email above to download'
            ) : downloadsRemaining <= 0 ? (
              'Download limit reached'
            ) : (
              `Download ${selectedOption?.name} (.${format})`
            )}
          </button>
        </div>

        {/* CRK Attribution */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
          Data powered by{' '}
          <a
            href="/template-requirements"
            className="text-blue-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            CRK
          </a>
          {' • '}
          Template by{' '}
          <span className="text-gray-600 dark:text-gray-300">CryptoReportKit</span>
        </div>
      </div>
    </div>
  );
}
