// Undo/Redo Manager for DataLab
// Uses command pattern (forward/reverse closures), not state snapshots.

import type { UndoableAction, UndoableActionType } from './types';

const MAX_HISTORY = 100;

export class UndoRedoManager {
  private undoStack: UndoableAction[] = [];
  private redoStack: UndoableAction[] = [];

  /** Push a new undoable action */
  push(action: UndoableAction) {
    this.undoStack.push(action);
    if (this.undoStack.length > MAX_HISTORY) {
      this.undoStack.shift();
    }
    // Clear redo stack when new action is performed
    this.redoStack = [];
  }

  /** Undo the last action */
  undo(): UndoableAction | null {
    const action = this.undoStack.pop();
    if (!action) return null;
    action.undo();
    this.redoStack.push(action);
    return action;
  }

  /** Redo the last undone action */
  redo(): UndoableAction | null {
    const action = this.redoStack.pop();
    if (!action) return null;
    action.redo();
    this.undoStack.push(action);
    return action;
  }

  /** Check if undo is available */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /** Check if redo is available */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /** Get undo stack length */
  get undoCount(): number {
    return this.undoStack.length;
  }

  /** Get redo stack length */
  get redoCount(): number {
    return this.redoStack.length;
  }

  /** Get last undo action description */
  get lastUndoDescription(): string | null {
    return this.undoStack.length > 0
      ? this.undoStack[this.undoStack.length - 1].description
      : null;
  }

  /** Get last redo action description */
  get lastRedoDescription(): string | null {
    return this.redoStack.length > 0
      ? this.redoStack[this.redoStack.length - 1].description
      : null;
  }

  /** Clear all history */
  clear() {
    this.undoStack = [];
    this.redoStack = [];
  }
}
