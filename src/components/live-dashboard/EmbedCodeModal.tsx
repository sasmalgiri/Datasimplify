'use client';

import { useState } from 'react';
import { X, Copy, Check, Code, Monitor } from 'lucide-react';

interface EmbedCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  widgetName: string;
  widgetTitle: string;
}

const SIZE_PRESETS = [
  { label: 'Small', width: 400, height: 300 },
  { label: 'Medium', width: 600, height: 400 },
  { label: 'Large', width: 800, height: 600 },
] as const;

type ThemeOption = 'dark' | 'light-blue';

export function EmbedCodeModal({ isOpen, onClose, widgetName, widgetTitle }: EmbedCodeModalProps) {
  const [sizeIndex, setSizeIndex] = useState(1); // Default to Medium
  const [theme, setTheme] = useState<ThemeOption>('dark');
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const { width, height } = SIZE_PRESETS[sizeIndex];
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://cryptoreportkit.com';
  const embedUrl = `${baseUrl}/embed/${widgetName}?theme=${theme}`;
  const iframeCode = `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" style="border-radius:12px;overflow:hidden;" loading="lazy"></iframe>`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(iframeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = iframeCode;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-gray-800 border border-gray-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 rounded-xl bg-emerald-500/10">
            <Code className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Embed Widget</h2>
            <p className="text-sm text-gray-400">{widgetTitle}</p>
          </div>
        </div>

        {/* Size Presets */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Size
          </label>
          <div className="flex gap-2">
            {SIZE_PRESETS.map((preset, i) => (
              <button
                key={preset.label}
                onClick={() => setSizeIndex(i)}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  sizeIndex === i
                    ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                    : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
                }`}
              >
                <span className="block">{preset.label}</span>
                <span className="block text-[10px] opacity-60 mt-0.5">
                  {preset.width} x {preset.height}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="mb-5">
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Theme
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setTheme('dark')}
              className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                theme === 'dark'
                  ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                  : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-gray-900 border border-gray-600" />
              Dark
            </button>
            <button
              onClick={() => setTheme('light-blue')}
              className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                theme === 'light-blue'
                  ? 'bg-emerald-400/20 text-emerald-400 border border-emerald-400/30'
                  : 'bg-white/[0.04] text-gray-400 border border-white/[0.06] hover:bg-white/[0.08]'
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300" />
              Light
            </button>
          </div>
        </div>

        {/* Code Block */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-400 mb-2 uppercase tracking-wider">
            Embed Code
          </label>
          <div className="relative">
            <pre className="bg-gray-900 border border-gray-700 rounded-lg p-3 text-xs text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
              {iframeCode}
            </pre>
            <button
              onClick={handleCopy}
              className={`absolute top-2 right-2 p-1.5 rounded-md transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
              }`}
              title={copied ? 'Copied!' : 'Copy to clipboard'}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Copy Button (full width) */}
        <button
          onClick={handleCopy}
          className={`w-full py-3 rounded-lg font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            copied
              ? 'bg-emerald-500 text-white'
              : 'bg-emerald-500 hover:bg-emerald-600 text-white'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              Copied to Clipboard
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Embed Code
            </>
          )}
        </button>

        {/* Preview Toggle */}
        <div className="mt-4 border-t border-gray-700 pt-4">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-200 transition w-full"
          >
            <Monitor className="w-4 h-4 text-blue-400" />
            <span className="font-medium">{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            <svg
              className={`w-3.5 h-3.5 ml-auto transition-transform ${showPreview ? 'rotate-180' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showPreview && (
            <div className="mt-3">
              <div
                className="rounded-xl overflow-hidden border border-gray-700 bg-gray-900 mx-auto"
                style={{ width: Math.min(width, 480), height: Math.min(height, 400) }}
              >
                <iframe
                  src={embedUrl}
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  style={{ borderRadius: '12px' }}
                  loading="lazy"
                  title={`Preview: ${widgetTitle}`}
                />
              </div>
              <p className="text-[10px] text-gray-500 text-center mt-2">
                Preview scaled to fit modal ({Math.min(width, 480)} x {Math.min(height, 400)})
              </p>
            </div>
          )}
        </div>

        {/* Hint */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <Code className="w-4 h-4 mt-0.5 text-emerald-600 shrink-0" />
          <span>
            Paste this code into any HTML page or CMS. DeFi Llama widgets work without an API key.
            For CoinGecko widgets, add <code className="px-1 py-0.5 rounded bg-gray-900 text-emerald-400 text-[10px]">&amp;key=YOUR_KEY</code> to the URL.
          </span>
        </div>
      </div>
    </div>
  );
}
