'use client';

interface TemplateCardProps {
  id: string;
  name: string;
  description: string;
  icon: string;
  onSelect: (id: string) => void;
}

/**
 * Template Card Component
 *
 * Displays a template option with icon, name, and description.
 * Used for template selection before download.
 */
export function TemplateCard({ id, name, description, icon, onSelect }: TemplateCardProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(id)}
      className="group relative p-6 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl hover:border-blue-500 dark:hover:border-blue-500 transition-all hover:shadow-lg"
    >
      {/* Icon */}
      <div className="flex items-center gap-4 mb-3">
        <div className="text-4xl">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
          {name}
        </h3>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 dark:text-gray-400 text-left">{description}</p>

      {/* Arrow indicator */}
      <div className="absolute top-1/2 right-4 -translate-y-1/2 text-gray-400 group-hover:text-blue-500 transition-colors">
        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </div>

      {/* Badge */}
      <div className="mt-4 inline-flex items-center gap-1.5 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-medium rounded-full">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
        </svg>
        BYOK Template
      </div>
    </button>
  );
}

/**
 * Template Grid - Container for multiple template cards
 */
interface TemplateGridProps {
  templates: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {templates.map((template) => (
        <TemplateCard
          key={template.id}
          id={template.id}
          name={template.name}
          description={template.description}
          icon={template.icon}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
