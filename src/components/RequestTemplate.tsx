'use client';

import { useState } from 'react';
import { FileSpreadsheet, X, Send, CheckCircle, AlertCircle } from 'lucide-react';

const REPORT_TYPES = [
  { value: 'watchlist', label: 'Watchlist Report' },
  { value: 'screener', label: 'Coin Screener' },
  { value: 'correlation', label: 'Correlation Matrix' },
  { value: 'portfolio', label: 'Portfolio Tracker' },
  { value: 'technical', label: 'Technical Indicators' },
  { value: 'comparison', label: 'Coin Comparison' },
  { value: 'market_overview', label: 'Market Overview' },
  { value: 'other', label: 'Other (specify below)' },
];

const TIMEFRAMES = [
  { value: '1h', label: 'Hourly' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: 'Daily' },
  { value: '1w', label: 'Weekly' },
  { value: '1m', label: 'Monthly' },
];

const PURPOSES = [
  { value: 'research', label: 'Research / Analysis' },
  { value: 'tracking', label: 'Portfolio Tracking' },
  { value: 'study', label: 'Educational / Study' },
  { value: 'reporting', label: 'Reporting / Documentation' },
];

interface RequestTemplateProps {
  pagePath: string;
  pageTitle: string;
  suggestedCoins?: string[];
  variant?: 'button' | 'inline';
}

export function RequestTemplate({
  pagePath,
  pageTitle,
  suggestedCoins = [],
  variant = 'button',
}: RequestTemplateProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [coins, setCoins] = useState(suggestedCoins.join(', '));
  const [reportType, setReportType] = useState('');
  const [timeframe, setTimeframe] = useState('1d');
  const [purpose, setPurpose] = useState('');
  const [details, setDetails] = useState('');
  const [noTradingAdvice, setNoTradingAdvice] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reportType || !purpose || !noTradingAdvice) {
      setError('Please fill in all required fields and confirm the checkbox.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/template-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pagePath,
          pageTitle,
          coins: coins.split(',').map((c) => c.trim()).filter(Boolean),
          reportType,
          timeframe,
          purpose,
          details: details.slice(0, 400),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit request');
      }

      setIsSubmitted(true);
    } catch {
      setError('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setCoins(suggestedCoins.join(', '));
    setReportType('');
    setTimeframe('1d');
    setPurpose('');
    setDetails('');
    setNoTradingAdvice(false);
    setIsSubmitted(false);
    setError(null);
    setIsOpen(false);
  };

  if (variant === 'inline') {
    return (
      <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
        <RequestForm
          coins={coins}
          reportType={reportType}
          timeframe={timeframe}
          purpose={purpose}
          details={details}
          noTradingAdvice={noTradingAdvice}
          isSubmitting={isSubmitting}
          isSubmitted={isSubmitted}
          error={error}
          onCoinsChange={setCoins}
          onReportTypeChange={setReportType}
          onTimeframeChange={setTimeframe}
          onPurposeChange={setPurpose}
          onDetailsChange={setDetails}
          onNoTradingAdviceChange={setNoTradingAdvice}
          onSubmit={handleSubmit}
          onReset={resetForm}
        />
      </div>
    );
  }

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <FileSpreadsheet className="w-4 h-4" />
        Request Excel Report Kit
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={resetForm}
          />

          {/* Modal Content */}
          <div className="relative w-full max-w-lg bg-gray-800 border border-gray-700 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">
                  Request Excel Report Kit
                </h2>
              </div>
              <button
                onClick={resetForm}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <RequestForm
                coins={coins}
                reportType={reportType}
                timeframe={timeframe}
                purpose={purpose}
                details={details}
                noTradingAdvice={noTradingAdvice}
                isSubmitting={isSubmitting}
                isSubmitted={isSubmitted}
                error={error}
                onCoinsChange={setCoins}
                onReportTypeChange={setReportType}
                onTimeframeChange={setTimeframe}
                onPurposeChange={setPurpose}
                onDetailsChange={setDetails}
                onNoTradingAdviceChange={setNoTradingAdvice}
                onSubmit={handleSubmit}
                onReset={resetForm}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

interface RequestFormProps {
  coins: string;
  reportType: string;
  timeframe: string;
  purpose: string;
  details: string;
  noTradingAdvice: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
  error: string | null;
  onCoinsChange: (value: string) => void;
  onReportTypeChange: (value: string) => void;
  onTimeframeChange: (value: string) => void;
  onPurposeChange: (value: string) => void;
  onDetailsChange: (value: string) => void;
  onNoTradingAdviceChange: (value: boolean) => void;
  onSubmit: (e: React.FormEvent) => void;
  onReset: () => void;
}

function RequestForm({
  coins,
  reportType,
  timeframe,
  purpose,
  details,
  noTradingAdvice,
  isSubmitting,
  isSubmitted,
  error,
  onCoinsChange,
  onReportTypeChange,
  onTimeframeChange,
  onPurposeChange,
  onDetailsChange,
  onNoTradingAdviceChange,
  onSubmit,
  onReset,
}: RequestFormProps) {
  if (isSubmitted) {
    return (
      <div className="text-center py-6">
        <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-white mb-2">Request Submitted!</h3>
        <p className="text-gray-400 mb-6">
          We&apos;ve added your request to our backlog. Popular requests get prioritized!
        </p>
        <button
          onClick={onReset}
          className="text-emerald-400 hover:text-emerald-300 transition-colors"
        >
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Coins */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Coin(s) <span className="text-gray-500">(comma-separated)</span>
        </label>
        <input
          type="text"
          value={coins}
          onChange={(e) => onCoinsChange(e.target.value)}
          placeholder="BTC, ETH, SOL..."
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500"
        />
      </div>

      {/* Report Type */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Report Type <span className="text-red-400">*</span>
        </label>
        <select
          value={reportType}
          onChange={(e) => onReportTypeChange(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">Select report type...</option>
          {REPORT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* Timeframe */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Timeframe
        </label>
        <div className="flex flex-wrap gap-2">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => onTimeframeChange(tf.value)}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                timeframe === tf.value
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Purpose */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          What is this for? <span className="text-red-400">*</span>
        </label>
        <select
          value={purpose}
          onChange={(e) => onPurposeChange(e.target.value)}
          required
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-emerald-500"
        >
          <option value="">Select purpose...</option>
          {PURPOSES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      {/* Additional Details */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Additional Details <span className="text-gray-500">(optional)</span>
        </label>
        <textarea
          value={details}
          onChange={(e) => onDetailsChange(e.target.value.slice(0, 400))}
          placeholder="Any specific metrics or features you need..."
          rows={3}
          className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 resize-none"
        />
        <div className="text-right text-xs text-gray-500 mt-1">
          {details.length}/400
        </div>
      </div>

      {/* Disclaimer Checkbox */}
      <label className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg cursor-pointer">
        <input
          type="checkbox"
          checked={noTradingAdvice}
          onChange={(e) => onNoTradingAdviceChange(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded border-gray-600 bg-gray-700 text-emerald-500 focus:ring-emerald-500"
        />
        <span className="text-sm text-yellow-200">
          I understand this is for educational/informational purposes only and does not
          constitute trading or financial advice.
        </span>
      </label>

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || !noTradingAdvice}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
      >
        {isSubmitting ? (
          'Submitting...'
        ) : (
          <>
            <Send className="w-4 h-4" />
            Submit Request
          </>
        )}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Popular requests get prioritized in our roadmap.
      </p>
    </form>
  );
}
