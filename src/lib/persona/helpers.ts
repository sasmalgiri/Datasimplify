import { PERSONA_DEFINITIONS } from './definitions';
import type { PersonaId, PersonaDefinition } from './types';

/**
 * Get the full definition for a persona.
 * Returns null for unknown IDs (graceful fallback).
 */
export function getPersonaDefinition(
  id: PersonaId | null | undefined,
): PersonaDefinition | null {
  if (!id) return null;
  return PERSONA_DEFINITIONS[id] ?? null;
}

/**
 * Sort dashboard slugs by persona relevance.
 * Returns: primary first, then secondary, then everything else.
 * If no persona, returns the input array unchanged.
 */
export function sortDashboardsByPersona<T extends { slug: string }>(
  dashboards: T[],
  personaId: PersonaId | null | undefined,
): T[] {
  if (!personaId) return dashboards;
  const def = PERSONA_DEFINITIONS[personaId];
  if (!def) return dashboards;

  const primarySet = new Set(def.primaryDashboards);
  const secondarySet = new Set(def.secondaryDashboards);

  const primary: T[] = [];
  const secondary: T[] = [];
  const rest: T[] = [];

  for (const d of dashboards) {
    if (primarySet.has(d.slug)) {
      primary.push(d);
    } else if (secondarySet.has(d.slug)) {
      secondary.push(d);
    } else {
      rest.push(d);
    }
  }

  // Maintain the priority order from the definition arrays
  primary.sort(
    (a, b) =>
      def.primaryDashboards.indexOf(a.slug) -
      def.primaryDashboards.indexOf(b.slug),
  );
  secondary.sort(
    (a, b) =>
      def.secondaryDashboards.indexOf(a.slug) -
      def.secondaryDashboards.indexOf(b.slug),
  );

  return [...primary, ...secondary, ...rest];
}

/**
 * Sort template kit slugs by persona relevance.
 */
export function sortTemplatesByPersona<T extends { slug: string }>(
  templates: T[],
  personaId: PersonaId | null | undefined,
): T[] {
  if (!personaId) return templates;
  const def = PERSONA_DEFINITIONS[personaId];
  if (!def) return templates;

  const primarySet = new Set(def.primaryTemplates);
  const primary: T[] = [];
  const rest: T[] = [];

  for (const t of templates) {
    if (primarySet.has(t.slug)) {
      primary.push(t);
    } else {
      rest.push(t);
    }
  }

  primary.sort(
    (a, b) =>
      def.primaryTemplates.indexOf(a.slug) -
      def.primaryTemplates.indexOf(b.slug),
  );

  return [...primary, ...rest];
}

/**
 * Check if a dashboard slug is "primary" (recommended) for the given persona.
 */
export function isDashboardRecommended(
  slug: string,
  personaId: PersonaId | null | undefined,
): boolean {
  if (!personaId) return false;
  const def = PERSONA_DEFINITIONS[personaId];
  return def?.primaryDashboards.includes(slug) ?? false;
}

/**
 * Check if a template slug is "primary" (recommended) for the given persona.
 */
export function isTemplateRecommended(
  slug: string,
  personaId: PersonaId | null | undefined,
): boolean {
  if (!personaId) return false;
  const def = PERSONA_DEFINITIONS[personaId];
  return def?.primaryTemplates.includes(slug) ?? false;
}
