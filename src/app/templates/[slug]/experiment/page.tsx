'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { TEMPLATES, type TemplateType } from '@/lib/templates/templateConfig';
import { getLayoutForTemplate } from '@/lib/templates/experimentLayouts';
import { ExperimentShell } from '@/components/experiment/ExperimentShell';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function ExperimentPage({ params }: PageProps) {
  const { slug } = use(params);

  // Validate the slug is a known template ID
  if (!(slug in TEMPLATES)) {
    notFound();
  }

  const templateId = slug as TemplateType;
  const config = TEMPLATES[templateId];
  const layoutType = getLayoutForTemplate(templateId);

  return (
    <ExperimentShell
      templateId={templateId}
      templateName={config.name}
      templateIcon={config.icon}
      layoutType={layoutType}
    />
  );
}
