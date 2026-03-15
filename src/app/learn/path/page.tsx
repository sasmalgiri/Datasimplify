'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Map,
  CheckCircle2,
  Circle,
  ExternalLink,
  Clock,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { FreeNavbar } from '@/components/FreeNavbar';
import { Breadcrumb } from '@/components/Breadcrumb';
import {
  LEARNING_LEVELS,
  getProgress,
  toggleTopic,
  getLevelProgress,
  getOverallProgress,
  type LearningLevel,
} from '@/lib/learningPath';

const LEVEL_COLORS: Record<string, { bg: string; border: string; text: string; accent: string; bar: string }> = {
  emerald: {
    bg: 'bg-emerald-500/[0.06]',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    accent: 'bg-emerald-500/20',
    bar: 'bg-emerald-500',
  },
  blue: {
    bg: 'bg-blue-500/[0.06]',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    accent: 'bg-blue-500/20',
    bar: 'bg-blue-500',
  },
  purple: {
    bg: 'bg-purple-500/[0.06]',
    border: 'border-purple-500/20',
    text: 'text-purple-400',
    accent: 'bg-purple-500/20',
    bar: 'bg-purple-500',
  },
  amber: {
    bg: 'bg-amber-500/[0.06]',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    accent: 'bg-amber-500/20',
    bar: 'bg-amber-500',
  },
  cyan: {
    bg: 'bg-cyan-500/[0.06]',
    border: 'border-cyan-500/20',
    text: 'text-cyan-400',
    accent: 'bg-cyan-500/20',
    bar: 'bg-cyan-500',
  },
  rose: {
    bg: 'bg-rose-500/[0.06]',
    border: 'border-rose-500/20',
    text: 'text-rose-400',
    accent: 'bg-rose-500/20',
    bar: 'bg-rose-500',
  },
};

function LevelCard({
  level,
  progress,
  onToggle,
}: {
  level: LearningLevel;
  progress: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(level.level === 0);
  const colors = LEVEL_COLORS[level.color] || LEVEL_COLORS.emerald;
  const { completed, total, percent } = getLevelProgress(level);
  const isComplete = completed === total;

  return (
    <div className="relative">
      {/* Timeline connector */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-800 -z-10" />

      <div className={`border rounded-xl overflow-hidden ${colors.border} bg-gray-800/40`}>
        {/* Level Header */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
        >
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
              isComplete ? 'bg-emerald-500/20' : colors.accent
            }`}
          >
            {isComplete ? <Trophy className="w-6 h-6 text-emerald-400" /> : level.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-mono ${colors.text}`}>Level {level.level}</span>
              <span className="text-xs text-gray-600">|</span>
              <span className="text-xs text-gray-500">
                {completed}/{total} topics
              </span>
            </div>
            <h3 className="text-lg font-semibold text-white">{level.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{level.subtitle}</p>
          </div>
          <div className="flex-shrink-0 w-16 text-right">
            <span className={`text-sm font-semibold ${isComplete ? 'text-emerald-400' : colors.text}`}>
              {percent}%
            </span>
          </div>
        </button>

        {/* Progress bar */}
        <div className="h-1 bg-gray-700/50">
          <div
            className={`h-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : colors.bar}`}
            style={{ width: `${percent}%` }}
          />
        </div>

        {/* Topics */}
        {expanded && (
          <div className="p-4 space-y-1">
            {level.topics.map((topic) => {
              const done = !!progress[topic.id];
              return (
                <div
                  key={topic.id}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                    done ? 'bg-emerald-500/[0.04]' : 'hover:bg-white/[0.02]'
                  }`}
                >
                  <button
                    onClick={() => onToggle(topic.id)}
                    className="mt-0.5 flex-shrink-0"
                    aria-label={done ? `Mark "${topic.title}" incomplete` : `Mark "${topic.title}" complete`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5 text-gray-600 hover:text-gray-400 transition-colors" />
                    )}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span
                        className={`text-sm font-medium ${done ? 'text-gray-500 line-through' : 'text-white'}`}
                      >
                        {topic.title}
                      </span>
                      <span className="text-xs text-gray-600 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {topic.minutes}m
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed">{topic.description}</p>
                    <Link
                      href={topic.link}
                      className={`inline-flex items-center gap-1 mt-1.5 text-xs ${colors.text} hover:underline`}
                    >
                      {topic.linkLabel}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default function LearningPathPage() {
  const [progress, setProgress] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const handleToggle = useCallback((topicId: string) => {
    const updated = toggleTopic(topicId);
    setProgress({ ...updated });
  }, []);

  const overall = getOverallProgress();
  const totalMinutes = LEARNING_LEVELS.flatMap((l) => l.topics).reduce(
    (sum, t) => sum + t.minutes,
    0,
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <FreeNavbar />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pt-24 pb-16">
        <Breadcrumb />

        {/* Hero */}
        <div className="text-center mt-8 mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-400 text-sm mb-5">
            <Map className="w-4 h-4" />
            Self-paced learning
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Your Learning Path
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            From zero knowledge to research pro. 6 levels, {LEARNING_LEVELS.flatMap((l) => l.topics).length} topics,
            ~{totalMinutes} minutes total. No login required — progress saves locally.
          </p>
        </div>

        {/* Overall Progress */}
        <div className="bg-gray-800/60 border border-gray-700/50 rounded-xl p-5 mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Overall Progress</span>
            <span className="text-sm font-semibold text-white">
              {overall.completed}/{overall.total} topics ({overall.percent}%)
            </span>
          </div>
          <div className="h-2.5 bg-gray-700/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${overall.percent}%` }}
            />
          </div>
          {overall.percent === 100 && (
            <p className="text-emerald-400 text-sm mt-3 flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Congratulations! You&apos;ve completed the entire learning path.
            </p>
          )}
        </div>

        {/* Level Cards */}
        <div className="space-y-5">
          {LEARNING_LEVELS.map((level) => (
            <LevelCard
              key={level.level}
              level={level}
              progress={progress}
              onToggle={handleToggle}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-14 text-center">
          <p className="text-gray-500 text-sm mb-4">
            Ready to apply what you&apos;ve learned?
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/live-dashboards"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              Explore Analytics
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/myths"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-800 hover:bg-gray-700 text-white border border-gray-700/50 rounded-lg text-sm font-medium transition-colors"
            >
              Read Myth Busters
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
