'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { X, GraduationCap, BarChart3, BookOpen, ArrowRight } from 'lucide-react';

const STORAGE_KEY = 'crk-welcomed';

export function WelcomeOverlay() {
  const [show, setShow] = useState(false);
  const [level, setLevel] = useState<'new' | 'some' | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    // Only show on landing page, not on deep links
    if (pathname !== '/') return;
    if (localStorage.getItem(STORAGE_KEY)) return;
    // Small delay so the page renders first
    const t = setTimeout(() => setShow(true), 800);
    return () => clearTimeout(t);
  }, [pathname]);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1');
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-700/50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📊</span>
            <span className="text-lg font-semibold text-white">Welcome to CryptoReportKit</span>
          </div>
          <button onClick={dismiss} className="text-gray-500 hover:text-white transition-colors p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!level ? (
          /* Step 1: Are you new? */
          <div className="p-6">
            <p className="text-gray-300 text-sm mb-5">
              Free crypto analytics for everyone. No account needed to explore.
            </p>
            <p className="text-white font-medium mb-4">How much do you know about crypto?</p>
            <div className="space-y-2.5">
              <button
                onClick={() => setLevel('new')}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-emerald-500/[0.08] border border-emerald-500/20 hover:border-emerald-500/40 text-left transition-colors group"
              >
                <span className="text-2xl">🌱</span>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm group-hover:text-emerald-400 transition-colors">
                    I&apos;m brand new
                  </div>
                  <div className="text-xs text-gray-500">I want to learn from scratch</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors" />
              </button>
              <button
                onClick={() => setLevel('some')}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-blue-500/[0.08] border border-blue-500/20 hover:border-blue-500/40 text-left transition-colors group"
              >
                <span className="text-2xl">📈</span>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm group-hover:text-blue-400 transition-colors">
                    I know the basics
                  </div>
                  <div className="text-xs text-gray-500">Show me the tools</div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-blue-400 transition-colors" />
              </button>
              <button
                onClick={dismiss}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-gray-700/40 border border-gray-700/50 hover:border-gray-600 text-left transition-colors group"
              >
                <span className="text-2xl">🔬</span>
                <div className="flex-1">
                  <div className="text-white font-medium text-sm">I&apos;m experienced</div>
                  <div className="text-xs text-gray-500">Skip this and explore</div>
                </div>
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Route them */
          <div className="p-6">
            <p className="text-gray-300 text-sm mb-5">
              {level === 'new'
                ? "Great — we'll guide you step by step. No jargon, no hype, just clear explanations."
                : "Nice — here are the tools that matter most. Everything is free to explore."}
            </p>
            <div className="space-y-2">
              {level === 'new' ? (
                <>
                  <OverlayLink
                    href="/learn/path"
                    icon={<GraduationCap className="w-5 h-5 text-emerald-400" />}
                    title="Start the Learning Path"
                    desc="6 levels from zero to research pro — track your progress"
                    onClick={dismiss}
                  />
                  <OverlayLink
                    href="/myths"
                    icon={<BookOpen className="w-5 h-5 text-amber-400" />}
                    title="15 Myths YouTube Won't Tell You"
                    desc="The math behind crypto's biggest misconceptions"
                    onClick={dismiss}
                  />
                  <OverlayLink
                    href="/glossary"
                    icon={<BookOpen className="w-5 h-5 text-blue-400" />}
                    title="Crypto Glossary"
                    desc="100+ terms explained in plain English"
                    onClick={dismiss}
                  />
                </>
              ) : (
                <>
                  <OverlayLink
                    href="/market"
                    icon={<BarChart3 className="w-5 h-5 text-emerald-400" />}
                    title="Market Overview"
                    desc="Top 500+ coins with price, volume, and market cap"
                    onClick={dismiss}
                  />
                  <OverlayLink
                    href="/live-dashboards"
                    icon={<BarChart3 className="w-5 h-5 text-blue-400" />}
                    title="Live Dashboards"
                    desc="83+ dashboards with 90+ customizable widgets"
                    onClick={dismiss}
                  />
                  <OverlayLink
                    href="/screener"
                    icon={<BarChart3 className="w-5 h-5 text-purple-400" />}
                    title="Token Screener"
                    desc="Filter coins by market cap, volume, price change"
                    onClick={dismiss}
                  />
                </>
              )}
            </div>
            <button
              onClick={() => setLevel(null)}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors mt-4"
            >
              &larr; Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function OverlayLink({
  href,
  icon,
  title,
  desc,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 p-3.5 rounded-xl bg-gray-700/30 border border-gray-700/50 hover:border-gray-600 transition-colors group"
    >
      <div className="w-10 h-10 rounded-lg bg-gray-700/50 flex items-center justify-center flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors">{title}</div>
        <div className="text-xs text-gray-500">{desc}</div>
      </div>
      <ArrowRight className="w-4 h-4 text-gray-600 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
    </Link>
  );
}
