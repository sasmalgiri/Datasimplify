'use client';

import { useState } from 'react';
import { FileSpreadsheet } from 'lucide-react';
import { PageContext, PageId, getTemplatesForPage } from '@/lib/templates/pageMapping';
import { TemplateSelectionModal } from './TemplateSelectionModal';

interface TemplateDownloadButtonProps {
  pageContext: PageContext;
  position?: 'inline' | 'floating' | 'header';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  showCount?: boolean;
  className?: string;
}

/**
 * TemplateDownloadButton
 *
 * A reusable button component that opens the template selection modal.
 * Can be placed on any page to offer Excel template downloads with BYOK data.
 *
 * Features:
 * - Multiple visual variants and sizes
 * - Shows count of available templates for the page
 * - Passes page context to template generator
 * - Floating position option for sidebar placement
 */
export function TemplateDownloadButton({
  pageContext,
  position = 'inline',
  variant = 'primary',
  size = 'md',
  label,
  showCount = true,
  className = '',
}: TemplateDownloadButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const templates = getTemplatesForPage(pageContext.pageId);
  const templateCount = templates.length;

  // Don't render if no templates available
  if (templateCount === 0) {
    return null;
  }

  // Size classes
  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2 text-sm gap-2',
    lg: 'px-5 py-2.5 text-base gap-2.5',
  };

  // Variant classes
  const variantClasses = {
    primary:
      'bg-purple-600 hover:bg-purple-700 text-white border border-purple-600',
    secondary:
      'bg-gray-700 hover:bg-gray-600 text-white border border-gray-600',
    outline:
      'bg-transparent hover:bg-purple-600/10 text-purple-400 border border-purple-500/50 hover:border-purple-500',
    ghost:
      'bg-transparent hover:bg-gray-700/50 text-gray-300 hover:text-white border border-transparent',
  };

  // Position classes
  const positionClasses = {
    inline: '',
    floating:
      'fixed bottom-6 right-6 shadow-xl shadow-purple-500/20 z-40 rounded-full',
    header: '',
  };

  // Icon size
  const iconSize = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  // Default label based on position
  const buttonLabel =
    label ||
    (position === 'floating'
      ? ''
      : `Excel Template${templateCount > 1 ? 's' : ''}`);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`
          inline-flex items-center justify-center font-medium rounded-lg transition-all
          ${sizeClasses[size]}
          ${variantClasses[variant]}
          ${positionClasses[position]}
          ${position === 'floating' ? 'p-4' : ''}
          ${className}
        `}
        title={`Download Excel Templates (${templateCount} available)`}
      >
        <FileSpreadsheet className={iconSize[size]} />
        {buttonLabel && <span>{buttonLabel}</span>}
        {showCount && templateCount > 1 && position !== 'floating' && (
          <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-semibold bg-purple-500/30 rounded-full">
            {templateCount}
          </span>
        )}
        {position === 'floating' && showCount && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 text-xs font-semibold bg-purple-500 text-white rounded-full">
            {templateCount}
          </span>
        )}
      </button>

      <TemplateSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pageContext={pageContext}
      />
    </>
  );
}

/**
 * Compact version for use in table headers or tight spaces
 */
export function TemplateDownloadButtonCompact({
  pageContext,
  className = '',
}: {
  pageContext: PageContext;
  className?: string;
}) {
  return (
    <TemplateDownloadButton
      pageContext={pageContext}
      size="sm"
      variant="ghost"
      showCount={false}
      label=""
      className={className}
    />
  );
}

/**
 * Badge-style button with template count
 */
export function TemplateDownloadBadge({
  pageId,
  className = '',
}: {
  pageId: PageId;
  className?: string;
}) {
  const [showModal, setShowModal] = useState(false);
  const templates = getTemplatesForPage(pageId);

  if (templates.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className={`
          inline-flex items-center gap-1.5 px-2.5 py-1
          bg-purple-900/30 hover:bg-purple-900/50
          border border-purple-500/30 hover:border-purple-500/50
          text-purple-300 text-xs font-medium rounded-full
          transition-all cursor-pointer
          ${className}
        `}
      >
        <FileSpreadsheet className="w-3 h-3" />
        <span>Excel</span>
        <span className="px-1.5 py-0.5 bg-purple-500/30 rounded text-[10px]">
          {templates.length}
        </span>
      </button>

      <TemplateSelectionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pageContext={{ pageId }}
      />
    </>
  );
}
