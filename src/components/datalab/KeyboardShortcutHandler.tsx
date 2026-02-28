'use client';

import { useEffect } from 'react';
import { useDataLabStore } from '@/lib/datalab/store';
import { isFeatureAvailable } from '@/lib/datalab/modeConfig';
import { SHORTCUTS, isTypingInInput, matchesShortcut } from '@/lib/datalab/keyboardShortcuts';
import { OVERLAY_PRESETS, PRESET_CATEGORIES } from '@/lib/datalab/presets';
import { isPresetAllowed } from '@/lib/datalab/modeConfig';

interface KeyboardShortcutHandlerProps {
  onOpenCommandPalette: () => void;
}

export function KeyboardShortcutHandler({ onOpenCommandPalette }: KeyboardShortcutHandlerProps) {
  const dataLabMode = useDataLabStore((s) => s.dataLabMode);

  useEffect(() => {
    if (!isFeatureAvailable(dataLabMode, 'keyboardShortcuts')) return;

    function handleKeyDown(e: KeyboardEvent) {
      if (isTypingInInput()) return;

      for (const shortcut of SHORTCUTS) {
        if (!matchesShortcut(e, shortcut)) continue;

        e.preventDefault();
        const store = useDataLabStore.getState();

        switch (shortcut.action) {
          case 'commandPalette':
            onOpenCommandPalette();
            break;
          case 'escape':
            if (store.activeDrawingTool) {
              store.setActiveDrawingTool(null);
            }
            break;
          case 'undo':
            store.undoLastEdit();
            break;
          case 'redo':
            // Redo not yet implemented in basic store — placeholder
            break;
          case 'toggleLogScale':
            store.toggleLogScale();
            break;
          case 'toggleNormalize':
            store.toggleNormalize();
            break;
          case 'toggleTable':
            store.toggleTable();
            break;
          case 'toggleRegimes':
            store.toggleRegimes();
            break;
          case 'toggleEvents':
            store.toggleEvents();
            break;
          case 'toggleDrawing':
            store.setActiveDrawingTool(store.activeDrawingTool ? null : 'hline');
            break;
          case 'drawHline':
            store.setActiveDrawingTool(store.activeDrawingTool === 'hline' ? null : 'hline');
            break;
          case 'preset1':
          case 'preset2':
          case 'preset3':
          case 'preset4':
          case 'preset5': {
            const idx = parseInt(shortcut.action.replace('preset', ''), 10) - 1;
            const allIds = PRESET_CATEGORIES.flatMap((c) => c.presetIds)
              .filter((id) => isPresetAllowed(dataLabMode, id));
            if (allIds[idx]) {
              store.loadPreset(allIds[idx]);
            }
            break;
          }
        }
        return;
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [dataLabMode, onOpenCommandPalette]);

  return null;
}
