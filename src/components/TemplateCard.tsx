'use client';

import type { TemplateTier } from '@/lib/templates/templateConfig';

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier?: TemplateTier;
  onSelect: (id: string) => void;
}

/**
 * Template Card Component
 *
 * Displays a template option with icon, name, and description.
 * Shows PRO badge for pro-tier templates.
 */
export function TemplateCard({ id, name, description, icon, tier = 'free', onSelect }: TemplateCardProps) {
  const isPro = tier === 'pro';

  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className={`group relative p-6 bg-white dark:bg-gray-800 border-2 rounded-xl transition-all hover:shadow-lg ${
        isPro
          ? 'border-amber-500/30 dark:border-amber-500/30 hover:border-amber-500 dark:hover:border-amber-500'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500'
      }`}
    >
      {/* PRO Badge - Top Right */}
      {isPro && (
        <div className="absolute top-3 right-3 inline-flex items-center gap-1 px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-sm">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          PRO
        </div>
      )}

      {/* Icon */}
      <div className="flex items-center gap-4 mb-3">
        <div className="text-4xl">{icon}</div>
        <h3 className={`text-xl font-bold ${
          isPro
            ? 'text-gray-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400'
            : 'text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400'
        }`}>
          {name}
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 text-left">{description}</p>

      {/* Arrow indicator */}
      <div className={`absolute top-1/2 right-4 -translate-y-1/2 transition-colors ${
        isPro
          ? 'text-gray-400 group-hover:text-amber-500'
          : 'text-gray-400 group-hover:text-blue-500'
      }`}>
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Badge row */}
      <div className="mt-4 flex items-center gap-2">
        <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
          </svg>
          BYOK Template
        </div>
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full">
          Dual-Mode
        </div>
      </div>
    </button>
  );
}

/**
 * Template Grid - Container for multiple template cards
 * Sorts free templates first, then pro templates
 */
interface TemplateGridProps {
  templates: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    tier?: 'free' | 'pro';
  }>;
  onSelect: (id: string) => void;
}

export function TemplateGrid({ templates, onSelect }: TemplateGridProps) {
  if (templates.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">No templates available</p>
      </div>
    );
  }

  // Sort: free templates first, then pro
  const sorted = [...templates].sort((a, b) => {
    if (a.tier === b.tier) return 0;
    return a.tier === 'free' ? -1 : 1;
  });

  const freeCount = sorted.filter(t => t.tier !== 'pro').length;
  const proCount = sorted.filter(t => t.tier === 'pro').length;

  return (
    <div>
      {proCount > 0 && (
        <div className="flex items-center gap-3 mb-4 text-sm text-gray-400">
          <span className="text-emerald-400 font-medium">{freeCount} Free</span>
          <span>|</span>
          <span className="text-amber-400 font-medium">{proCount} Pro</span>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sorted.map((template) => (
          <TemplateCard
            key={template.id}
            id={template.id}
            name={template.name}
            description={template.description}
            icon={template.icon}
            tier={template.tier}
            onSelect={onSelect}
          />
        ))}
      </div>
    </div>
  );
}
