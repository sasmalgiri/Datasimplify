'use client';

import Link from 'next/link';
import { ArrowRight, GraduationCap, BookOpen, BarChart3 } from 'lucide-react';

interface NextStep {
  href: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
}

const DEFAULT_STEPS: NextStep[] = [
  {
    href: '/learn/path',
    icon: <GraduationCap className="w-5 h-5 text-emerald-400" />,
    title: 'Learning Path',
    desc: 'Continue your crypto education with guided lessons',
    color: 'hover:border-emerald-500/40',
  },
  {
    href: '/myths',
    icon: <BookOpen className="w-5 h-5 text-amber-400" />,
    title: 'Myth Busters',
    desc: '15 crypto myths debunked with math and data',
    color: 'hover:border-amber-500/40',
  },
  {
    href: '/glossary',
    icon: <BookOpen className="w-5 h-5 text-blue-400" />,
    title: 'Glossary',
    desc: '100+ crypto terms explained in plain English',
    color: 'hover:border-blue-500/40',
  },
];

export function WhatsNext({
  steps,
  contextLabel,
}: {
  steps?: NextStep[];
  contextLabel?: string;
}) {
  const items = steps || DEFAULT_STEPS;

  return (
    <div className="mt-10 bg-gray-800/40 border border-gray-700/50 rounded-xl p-6">
      <h3 className="text-lg font-bold text-white mb-1">
        What Next?
      </h3>
      {contextLabel && (
        <p className="text-sm text-gray-500 mb-4">{contextLabel}</p>
      )}
      {!contextLabel && (
        <p className="text-sm text-gray-500 mb-4">Keep building your crypto knowledge</p>
      )}
      <div className="grid sm:grid-cols-3 gap-3">
        {items.map((step) => (
          <Link
            key={step.href}
            href={step.href}
            className={`flex items-start gap-3 p-4 rounded-lg bg-gray-700/30 border border-gray-700/50 ${step.color} transition-colors group`}
          >
            <div className="w-9 h-9 rounded-lg bg-gray-700/50 flex items-center justify-center shrink-0 mt-0.5">
              {step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1">
                {step.title}
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="text-xs text-gray-500 mt-0.5">{step.desc}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
