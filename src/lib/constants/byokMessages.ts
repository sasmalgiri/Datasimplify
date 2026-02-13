/**
 * byokMessages.ts — Centralized BYOK (Bring Your Own Key) messaging.
 *
 * Single source of truth for privacy/BYOK copy used across:
 * - Generated Excel files (Settings sheet, setup instructions)
 * - Download UI components (modals, wizards, gates)
 * - Info cards (RequirementsGate)
 */

// ─── Excel-embedded messages (written into generated .xlsx files) ───

/** Full BYOK notice for the Excel Settings sheet. */
export const BYOK_EXCEL_NOTICE =
  'BYOK: Your API key stays in this file. Queries connect directly to CoinGecko. Our server never sees your key or data.';

/** Bullet-point note for Important Notes sections in Excel. */
export const BYOK_EXCEL_NOTE = '• Your API key stays in this file - we never see it';

// ─── UI-facing messages (React components) ───

/** Short privacy statement (one line, no period). */
export const BYOK_PRIVACY_SHORT = 'Your API key stays in your Excel file - we never see it';

/** Full privacy statement with "or store" (used in info boxes). */
export const BYOK_PRIVACY_FULL = 'Your API key stays in your Excel file - we never see or store it.';

/** Standard BYOK heading text. */
export const BYOK_HEADING = 'BYOK - Bring Your Own Key';

/** Architecture heading variant. */
export const BYOK_ARCHITECTURE_HEADING = 'BYOK Architecture';

/** Compact privacy description for feature cards. */
export const BYOK_DESCRIPTION_COMPACT = 'Your API key stays in Excel - complete privacy';
