'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  WifiOff,
  Zap,
  Monitor,
  Apple,
  Terminal,
  Download,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Database,
  Key,
  Globe,
  Lock,
  HardDrive,
  Cpu,
  BarChart3,
  Briefcase,
  Star,
  Settings,
} from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';

const APP_VERSION = '1.0.0';

function detectOS(): 'windows' | 'macos' | 'linux' {
  if (typeof navigator === 'undefined') return 'windows';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('mac')) return 'macos';
  if (ua.includes('linux')) return 'linux';
  return 'windows';
}

const PLATFORMS = [
  {
    id: 'windows' as const,
    name: 'Windows',
    icon: Monitor,
    ext: '.exe',
    size: '~3.3 MB',
    req: 'Windows 10 or later',
    downloadUrl: 'https://github.com/sasmalgiri/cryptoreportkit-desktop/releases/download/v1.0.0/CryptoReportKit_1.0.0_x64-setup.exe',
  },
  {
    id: 'macos' as const,
    name: 'macOS',
    icon: Apple,
    ext: '.dmg',
    size: 'Coming Soon',
    req: 'macOS 12 (Monterey) or later',
    downloadUrl: 'https://github.com/sasmalgiri/cryptoreportkit-desktop/releases/tag/v1.0.0',
  },
  {
    id: 'linux' as const,
    name: 'Linux',
    icon: Terminal,
    ext: '.AppImage',
    size: 'Coming Soon',
    req: 'Ubuntu 20.04+ / Fedora 36+',
    downloadUrl: 'https://github.com/sasmalgiri/cryptoreportkit-desktop/releases/tag/v1.0.0',
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: 'True BYOK Privacy',
    description:
      'Your CoinGecko API key is stored in your OS keychain (Windows Credential Manager, macOS Keychain, Linux Secret Service). API calls go directly from your machine to CoinGecko.',
    color: 'emerald',
  },
  {
    icon: WifiOff,
    title: 'Offline Ready',
    description:
      'Market data is cached in a local SQLite database. Portfolio, watchlist, and settings persist on your device. Works fully offline with cached data.',
    color: 'blue',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description:
      'Built with Tauri (Rust + WebView). ~10 MB installed, native performance, minimal memory usage. No Electron bloat.',
    color: 'amber',
  },
];

const COMPARISON = [
  { feature: 'Data Storage', web: 'Cloud (Supabase)', desktop: 'Local (SQLite)' },
  { feature: 'API Key Location', web: 'Browser localStorage', desktop: 'OS Keychain' },
  { feature: 'API Calls', web: 'Via our backend', desktop: 'Direct to CoinGecko' },
  { feature: 'Offline Mode', web: 'No', desktop: 'Yes (cached data)' },
  { feature: 'Performance', web: 'Network-dependent', desktop: 'Native speed' },
  { feature: 'Authentication', web: 'Email / password', desktop: 'License key' },
  { feature: 'System Tray', web: 'N/A', desktop: 'BTC/ETH price ticker' },
  { feature: 'Auto-Update', web: 'Always latest', desktop: 'Built-in updater' },
  { feature: 'Install Size', web: 'None (browser)', desktop: '~10-12 MB' },
];

const FAQ_ITEMS = [
  {
    q: 'Is the desktop app free?',
    a: 'The desktop app is free to download and includes core features (dashboard, watchlist, charts). Portfolio tracking and advanced features require a Pro license, which is included with your CryptoReportKit Pro subscription.',
  },
  {
    q: 'Does it phone home?',
    a: 'The app only makes two types of network requests: (1) CoinGecko API calls using your own key, directly from your machine, and (2) optional license key validation against our server. No telemetry, no analytics, no tracking.',
  },
  {
    q: 'How do updates work?',
    a: 'The app includes a built-in auto-updater. It checks for new versions on launch and every 6 hours. Updates are downloaded and applied automatically with your consent.',
  },
  {
    q: 'Can I use both the web app and desktop app?',
    a: 'Yes! They are fully independent. The web app uses cloud storage and our backend APIs, while the desktop app uses local storage and direct API calls. Your data does not sync between them.',
  },
  {
    q: 'What OS versions are supported?',
    a: 'Windows 10+ (WebView2 required, pre-installed on Windows 11), macOS 12 (Monterey) or later, and Linux with WebKitGTK (Ubuntu 20.04+, Fedora 36+).',
  },
  {
    q: 'Where is my data stored?',
    a: 'All data is stored locally on your computer: SQLite database in your app data folder, API keys in your OS keychain. You can find and backup the database file from Settings > About.',
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-700/50 last:border-b-0">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full py-4 text-left"
      >
        <span className="text-sm font-medium text-white pr-4">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
        )}
      </button>
      {open && (
        <p className="text-sm text-gray-400 leading-relaxed pb-4 -mt-1">{a}</p>
      )}
    </div>
  );
}

export default function DesktopDownloadPage() {
  const [detectedOS, setDetectedOS] = useState<'windows' | 'macos' | 'linux'>('windows');

  useEffect(() => {
    setDetectedOS(detectOS());
  }, []);

  const primaryPlatform = PLATFORMS.find((p) => p.id === detectedOS) ?? PLATFORMS[0];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <FreeNavbar />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-600/10 via-transparent to-transparent" />
        <div className="max-w-6xl mx-auto px-4 pt-12 pb-16 relative">
          <Breadcrumb customTitle="Desktop App" />

          <div className="grid lg:grid-cols-2 gap-12 items-center mt-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs text-emerald-400 mb-4">
                <Lock className="w-3 h-3" />
                Privacy-First Desktop App
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
                CryptoReportKit{' '}
                <span className="text-emerald-400">Desktop</span>
              </h1>

              <p className="text-lg text-gray-400 leading-relaxed mb-6 max-w-lg">
                True BYOK privacy. Your API keys live in your OS keychain. Data
                calls go direct from your machine to CoinGecko. Portfolio stays
                in a local SQLite database. Nothing touches our servers.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <a
                  href={primaryPlatform.downloadUrl}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold transition"
                >
                  <Download className="w-5 h-5" />
                  Download for {primaryPlatform.name}
                  <span className="text-emerald-200 text-sm">
                    ({primaryPlatform.size})
                  </span>
                </a>
                <span className="text-xs text-gray-600 self-center">
                  v{APP_VERSION} &middot; {primaryPlatform.req}
                </span>
              </div>

              <p className="text-xs text-gray-600">
                Also available for{' '}
                {PLATFORMS.filter((p) => p.id !== detectedOS).map((p, i) => (
                  <span key={p.id}>
                    {i > 0 && ' and '}
                    <a href={p.downloadUrl} className="text-emerald-400/70 hover:text-emerald-400 transition">
                      {p.name}
                    </a>
                  </span>
                ))}
              </p>
              <p className="text-xs text-gray-600 mt-2 flex items-center gap-1.5">
                <Shield className="w-3 h-3 text-emerald-500/60" />
                Signed via{' '}
                <a
                  href="https://signpath.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-400/70 hover:text-emerald-400 transition"
                >
                  SignPath Foundation
                </a>
                {' '}&middot;{' '}
                <Link href="/code-signing-policy" className="text-emerald-400/70 hover:text-emerald-400 transition">
                  Signing Policy
                </Link>
              </p>
            </div>

            {/* App mockup */}
            <div className="hidden lg:block">
              <div className="bg-gray-800 border border-gray-700/50 rounded-2xl shadow-2xl overflow-hidden">
                {/* Title bar */}
                <div className="flex items-center gap-2 px-4 py-3 bg-gray-900/80 border-b border-gray-700/50">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-400/80" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                    <div className="w-3 h-3 rounded-full bg-green-400/80" />
                  </div>
                  <span className="text-xs text-gray-500 ml-2">CryptoReportKit Desktop</span>
                </div>
                {/* Mock content */}
                <div className="p-4 flex gap-4">
                  {/* Sidebar */}
                  <div className="w-40 space-y-2 shrink-0">
                    {[
                      { icon: BarChart3, label: 'Dashboard', active: true },
                      { icon: Briefcase, label: 'Portfolio', active: false },
                      { icon: Star, label: 'Watchlist', active: false },
                      { icon: Settings, label: 'Settings', active: false },
                    ].map(({ icon: Icon, label, active }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${
                          active
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'text-gray-500'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </div>
                    ))}
                  </div>
                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'BTC', price: '$96,420', change: '+2.4%', up: true },
                        { label: 'ETH', price: '$3,580', change: '+1.8%', up: true },
                        { label: 'SOL', price: '$142', change: '-0.9%', up: false },
                      ].map((c) => (
                        <div
                          key={c.label}
                          className="bg-gray-900/50 rounded-lg p-2.5"
                        >
                          <div className="text-[10px] text-gray-500">{c.label}</div>
                          <div className="text-sm font-semibold text-white">{c.price}</div>
                          <div
                            className={`text-[10px] ${c.up ? 'text-green-400' : 'text-red-400'}`}
                          >
                            {c.change}
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Mock chart */}
                    <div className="bg-gray-900/50 rounded-lg p-3 h-32 flex items-end gap-px">
                      {Array.from({ length: 30 }).map((_, i) => {
                        const h = 30 + Math.sin(i * 0.5) * 20 + Math.random() * 20;
                        return (
                          <div
                            key={i}
                            className="flex-1 rounded-t-sm bg-emerald-400/20"
                            style={{ height: `${h}%` }}
                          />
                        );
                      })}
                    </div>
                    {/* Status bar */}
                    <div className="flex items-center gap-2 text-[9px] text-gray-600">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Connected &middot; Last updated: 3s ago &middot; v1.0.0
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-white mb-10">
          Why Desktop?
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="bg-gray-800/50 border border-gray-700/50 rounded-xl p-6 hover:border-emerald-400/20 transition"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${
                  f.color === 'emerald'
                    ? 'bg-emerald-500/10 text-emerald-400'
                    : f.color === 'blue'
                      ? 'bg-blue-500/10 text-blue-400'
                      : 'bg-amber-500/10 text-amber-400'
                }`}
              >
                <f.icon className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Platform Downloads */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-white mb-8">
          Download for Your Platform
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {PLATFORMS.map((p) => (
            <a
              key={p.id}
              href={p.downloadUrl}
              className={`bg-gray-800/50 border rounded-xl p-6 text-center hover:border-emerald-400/30 transition group ${
                p.id === detectedOS
                  ? 'border-emerald-400/30 bg-emerald-400/5'
                  : 'border-gray-700/50'
              }`}
            >
              <p.icon className="w-8 h-8 mx-auto mb-3 text-gray-400 group-hover:text-emerald-400 transition" />
              <h3 className="font-semibold text-white mb-1">{p.name}</h3>
              <p className="text-xs text-gray-500 mb-3">{p.req}</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm font-medium">
                <Download className="w-4 h-4" />
                {p.ext} &middot; {p.size}
              </div>
              {p.id === detectedOS && (
                <p className="text-[10px] text-emerald-400/60 mt-2">
                  Recommended for your system
                </p>
              )}
            </a>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-white mb-10">
          How It Works
        </h2>
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              icon: Download,
              title: 'Download & Install',
              desc: 'Download the installer for your OS. Under 15 MB, installs in seconds.',
            },
            {
              step: '2',
              icon: Key,
              title: 'Enter Your API Key',
              desc: 'Add your CoinGecko API key in Settings. It\u2019s stored in your OS keychain, never in a file.',
            },
            {
              step: '3',
              icon: BarChart3,
              title: 'Explore Your Data',
              desc: 'Live dashboard, portfolio tracking, watchlist, charts\u2014all running locally with full privacy.',
            },
          ].map((s) => (
            <div key={s.step} className="text-center">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 font-bold flex items-center justify-center mx-auto mb-4">
                {s.step}
              </div>
              <h3 className="font-semibold text-white mb-2">{s.title}</h3>
              <p className="text-sm text-gray-400">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Comparison Table */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-center text-white mb-8">
          Web App vs Desktop App
        </h2>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-800/80">
                <th className="text-left px-5 py-3 text-gray-400 font-medium">
                  Feature
                </th>
                <th className="text-center px-5 py-3 text-gray-400 font-medium">
                  <div className="flex items-center justify-center gap-1.5">
                    <Globe className="w-3.5 h-3.5" />
                    Web App
                  </div>
                </th>
                <th className="text-center px-5 py-3 text-emerald-400 font-medium">
                  <div className="flex items-center justify-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5" />
                    Desktop App
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr
                  key={row.feature}
                  className="border-t border-gray-700/30 hover:bg-gray-800/30 transition"
                >
                  <td className="px-5 py-3 text-white font-medium">
                    {row.feature}
                  </td>
                  <td className="text-center px-5 py-3 text-gray-400">
                    {row.web}
                  </td>
                  <td className="text-center px-5 py-3 text-emerald-300">
                    {row.desktop}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-16">
        <h2 className="text-2xl font-bold text-center text-white mb-8">
          Frequently Asked Questions
        </h2>
        <div className="bg-gray-800/50 border border-gray-700/50 rounded-xl px-6">
          {FAQ_ITEMS.map((item) => (
            <FAQItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="bg-emerald-400/10 border border-emerald-400/20 rounded-2xl p-10 text-center">
          <Cpu className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Ready for True Privacy?
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-6">
            Download CryptoReportKit Desktop and take full control of your
            crypto analytics. No accounts, no cloud dependency, no compromises.
          </p>
          <a
            href={primaryPlatform.downloadUrl}
            className="inline-flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-semibold transition"
          >
            <Download className="w-5 h-5" />
            Download for {primaryPlatform.name}
          </a>
        </div>
      </section>

      {/* Footer link back */}
      <div className="max-w-6xl mx-auto px-4 pb-12 text-center">
        <Link
          href="/"
          className="text-emerald-400 hover:text-emerald-300 text-sm transition inline-flex items-center gap-1"
        >
          Back to CryptoReportKit Web
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
