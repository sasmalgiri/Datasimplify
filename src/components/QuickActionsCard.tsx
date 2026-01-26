'use client';

import Link from 'next/link';
import { Shield, BarChart3, BookOpen, FileSpreadsheet, Zap, ArrowRight } from 'lucide-react';

interface QuickActionsCardProps {
  className?: string;
}

// A/B/C/D features only
const QUICK_ACTIONS = [
  {
    icon: FileSpreadsheet,
    label: 'Excel Templates',
    description: 'Download report kits (BYOK)',
    href: '/templates',
    color: 'from-emerald-500/20 to-emerald-600/10',
    iconColor: 'text-emerald-400',
  },
  {
    icon: BarChart3,
    label: 'Compare Coins',
    description: 'Side-by-side + market cap calculator',
    href: '/compare',
    color: 'from-purple-500/20 to-purple-600/10',
    iconColor: 'text-purple-400',
  },
  {
    icon: Shield,
    label: 'Verify Contracts',
    description: 'Sourcify + Z3 verification',
    href: '/smart-contract-verifier',
    color: 'from-green-500/20 to-green-600/10',
    iconColor: 'text-green-400',
  },
  {
    icon: BookOpen,
    label: 'Learn',
    description: 'Academy, Glossary, FAQ',
    href: '/learn',
    color: 'from-blue-500/20 to-blue-600/10',
    iconColor: 'text-blue-400',
  },
];

/**
 * QuickActionsCard - Fast navigation to key sections
 * Displayed alongside Template Finder on homepage
 */
export default function QuickActionsCard({ className = '' }: QuickActionsCardProps) {
  return (
    <div className={`bg-gray-800/50 backdrop-blur-sm rounded-xl border border-gray-700/50 flex flex-col h-[450px] ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900/30 to-gray-800/50 border-b border-gray-700/50 px-4 py-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Zap className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-sm">Quick Actions</h3>
            <p className="text-xs text-gray-400">Jump to any section</p>
          </div>
        </div>
      </div>

      {/* Actions Grid */}
      <div className="flex-1 p-4 overflow-y-auto dropdown-scroll">
        <div className="grid grid-cols-1 gap-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.href}
                href={action.href}
                className={`group relative bg-gradient-to-r ${action.color} hover:scale-[1.02] border border-gray-700/50 hover:border-gray-600/50 rounded-xl p-4 transition-all duration-200`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-gray-800/50 flex items-center justify-center ${action.iconColor}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-white text-sm">{action.label}</h4>
                    <p className="text-xs text-gray-400">{action.description}</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Stats preview */}
        <div className="mt-4 p-3 bg-gray-700/30 rounded-lg border border-gray-700/50">
          <p className="text-xs text-gray-400 mb-2">Why CryptoReportKit?</p>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-lg font-bold text-white">6+</div>
              <div className="text-[10px] text-gray-500">Templates</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">100+</div>
              <div className="text-[10px] text-gray-500">Coins</div>
            </div>
            <div>
              <div className="text-lg font-bold text-white">Free</div>
              <div className="text-[10px] text-gray-500">To Start</div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-700/50 p-3 flex-shrink-0">
        <Link
          href="/download"
          className="w-full py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white text-sm font-medium rounded-lg transition-all flex items-center justify-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4" />
          Get Excel Templates
        </Link>
      </div>
    </div>
  );
}
