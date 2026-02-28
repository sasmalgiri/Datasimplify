// DataLab Keyboard Shortcut Definitions

export interface ShortcutDef {
  key: string;
  label: string;
  description: string;
  category: 'general' | 'view' | 'tools' | 'presets';
  ctrl?: boolean;
  shift?: boolean;
  action: string; // mapped to store actions
}

export const SHORTCUTS: ShortcutDef[] = [
  // General
  { key: '/', label: '/', description: 'Open command palette', category: 'general', action: 'commandPalette' },
  { key: 'Escape', label: 'ESC', description: 'Cancel drawing / close panels', category: 'general', action: 'escape' },
  { key: 'z', label: 'Ctrl+Z', description: 'Undo last action', category: 'general', ctrl: true, action: 'undo' },
  { key: 'z', label: 'Ctrl+Shift+Z', description: 'Redo last action', category: 'general', ctrl: true, shift: true, action: 'redo' },

  // View toggles
  { key: 'l', label: 'L', description: 'Toggle log scale', category: 'view', action: 'toggleLogScale' },
  { key: 'n', label: 'N', description: 'Toggle normalize mode', category: 'view', action: 'toggleNormalize' },
  { key: 't', label: 'T', description: 'Toggle data table', category: 'view', action: 'toggleTable' },
  { key: 'r', label: 'R', description: 'Toggle regime detection', category: 'view', action: 'toggleRegimes' },
  { key: 'e', label: 'E', description: 'Toggle event markers', category: 'view', action: 'toggleEvents' },

  // Drawing tools
  { key: 'd', label: 'D', description: 'Toggle drawing tools', category: 'tools', action: 'toggleDrawing' },
  { key: 'h', label: 'H', description: 'Horizontal line tool', category: 'tools', action: 'drawHline' },

  // Presets (1-5 for quick access)
  { key: '1', label: '1', description: 'Load first preset', category: 'presets', action: 'preset1' },
  { key: '2', label: '2', description: 'Load second preset', category: 'presets', action: 'preset2' },
  { key: '3', label: '3', description: 'Load third preset', category: 'presets', action: 'preset3' },
  { key: '4', label: '4', description: 'Load fourth preset', category: 'presets', action: 'preset4' },
  { key: '5', label: '5', description: 'Load fifth preset', category: 'presets', action: 'preset5' },
];

/** Check if the active element is a text input (should suppress shortcuts) */
export function isTypingInInput(): boolean {
  if (typeof document === 'undefined') return false;
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

/** Match a KeyboardEvent against a ShortcutDef */
export function matchesShortcut(e: KeyboardEvent, shortcut: ShortcutDef): boolean {
  if (shortcut.ctrl && !e.ctrlKey && !e.metaKey) return false;
  if (shortcut.shift && !e.shiftKey) return false;
  if (!shortcut.ctrl && (e.ctrlKey || e.metaKey)) return false;
  if (!shortcut.shift && e.shiftKey && shortcut.key !== 'Escape') return false;
  return e.key.toLowerCase() === shortcut.key.toLowerCase();
}
