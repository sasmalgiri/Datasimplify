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
  'BYOK: Your API key stays in this file. For Excel add-in functions, queries use your key via the CryptoReportKit backend.';

/** Bullet-point note for Important Notes sections in Excel. */
export const BYOK_EXCEL_NOTE = '• Your API key is stored in this file — you control it';

// ─── UI-facing messages (React components) ───

/** Short privacy statement (one line, no period). */
export const BYOK_PRIVACY_SHORT = 'Your API key is stored locally — you control it';

/** Full privacy statement (used in info boxes). */
export const BYOK_PRIVACY_FULL = 'Your API key is stored locally in your browser or Excel workbook. For web dashboards, it is sent to our backend only to fetch data for you.';

/** Standard BYOK heading text. */
export const BYOK_HEADING = 'BYOK - Bring Your Own Key';

/** Architecture heading variant. */
export const BYOK_ARCHITECTURE_HEADING = 'BYOK Architecture';

/** Compact privacy description for feature cards. */
export const BYOK_DESCRIPTION_COMPACT = 'Your API key is stored locally — you bring your own key';
