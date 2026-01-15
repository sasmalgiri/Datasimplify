'use client';

import { GitFork, Star, Users, GitPullRequest, Code, Activity, ExternalLink } from 'lucide-react';

interface DeveloperData {
  forks: number;
  stars: number;
  subscribers: number;
  total_issues: number;
  closed_issues: number;
  pull_requests_merged: number;
  pull_request_contributors: number;
  commit_count_4_weeks: number;
  code_additions_4_weeks: number;
  code_deletions_4_weeks: number;
  commit_activity: number[];
}

interface DeveloperStatsProps {
  data: DeveloperData | null;
  githubUrls?: string[];
}

export function DeveloperStats({ data, githubUrls }: DeveloperStatsProps) {
  if (!data) {
    return null;
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const issueCloseRate =
    data.total_issues > 0 ? Math.round((data.closed_issues / data.total_issues) * 100) : 0;

  const issueCloseRateClamped = Math.max(0, Math.min(issueCloseRate, 100));

  // Calculate commit activity sparkline
  const maxCommits = Math.max(...(data.commit_activity || [1]));
  const normalizedActivity = (data.commit_activity || []).map(
    (c) => (c / (maxCommits || 1)) * 100
  );

  const hasGitHub = githubUrls && githubUrls.length > 0;
  const primaryGitHub = hasGitHub ? githubUrls[0] : null;

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <Code className="w-5 h-5 text-purple-400" />
          Developer Activity
        </h3>
        {primaryGitHub && (
          <a
            href={primaryGitHub}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-purple-400 flex items-center gap-1 transition"
          >
            View GitHub
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
            <Star className="w-3.5 h-3.5 text-yellow-400" />
            Stars
          </div>
          <div className="text-lg font-semibold text-white">{formatNumber(data.stars)}</div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
            <GitFork className="w-3.5 h-3.5 text-blue-400" />
            Forks
          </div>
          <div className="text-lg font-semibold text-white">{formatNumber(data.forks)}</div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
            <Users className="w-3.5 h-3.5 text-emerald-400" />
            Contributors
          </div>
          <div className="text-lg font-semibold text-white">
            {formatNumber(data.pull_request_contributors)}
          </div>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-1">
            <GitPullRequest className="w-3.5 h-3.5 text-orange-400" />
            PRs Merged
          </div>
          <div className="text-lg font-semibold text-white">
            {formatNumber(data.pull_requests_merged)}
          </div>
        </div>
      </div>

      {/* Commit Activity (4 weeks) */}
      {normalizedActivity.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5" />
              Commit Activity (4 weeks)
            </span>
            <span className="text-white font-medium">{data.commit_count_4_weeks} commits</span>
          </div>
          <div className="h-8">
            <svg
              viewBox={`0 0 ${normalizedActivity.length} 100`}
              className="w-full h-8"
              preserveAspectRatio="none"
              role="img"
              aria-label="Commit activity chart"
            >
              {normalizedActivity.map((height, i) => {
                const clampedHeight = Math.max(4, Math.min(height, 100));
                return (
                  <rect
                    key={i}
                    x={i + 0.1}
                    y={100 - clampedHeight}
                    width={0.8}
                    height={clampedHeight}
                    rx={0.2}
                    className="fill-purple-500/70 hover:fill-purple-400 transition-colors"
                  />
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Code Changes */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Code Added (4w)</div>
          <div className="text-emerald-400 font-mono text-sm">
            +{formatNumber(data.code_additions_4_weeks)}
          </div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3">
          <div className="text-gray-400 text-xs mb-1">Code Removed (4w)</div>
          <div className="text-red-400 font-mono text-sm">
            -{formatNumber(data.code_deletions_4_weeks)}
          </div>
        </div>
      </div>

      {/* Issue Stats */}
      <div className="bg-gray-900/50 rounded-lg p-3">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Issue Close Rate</span>
          <span className="text-white font-medium">{issueCloseRate}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full">
          <svg
            viewBox="0 0 100 10"
            className="w-full h-2"
            preserveAspectRatio="none"
            role="img"
            aria-label="Issue close rate"
          >
            <rect x="0" y="0" width="100" height="10" rx="5" className="fill-gray-700" />
            <rect
              x="0"
              y="0"
              width={issueCloseRateClamped}
              height="10"
              rx="5"
              className="fill-emerald-500"
            />
          </svg>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>{formatNumber(data.closed_issues)} closed</span>
          <span>{formatNumber(data.total_issues)} total</span>
        </div>
      </div>
    </div>
  );
}
