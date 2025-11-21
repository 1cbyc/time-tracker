import { useEffect, useCallback } from 'react';
import rootStore from '../modules/RootStore';

interface KeyboardShortcutsOptions {
  onStartStop?: () => void;
  onCloseModal?: () => void;
  enabled?: boolean;
}

/**
 * Global keyboard shortcuts hook
 * 
 * Shortcuts:
 * - Space: Start/stop timer (when not typing in input fields)
 * - Escape: Close modals/drawers
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
  const { onStartStop, onCloseModal, enabled = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger shortcuts if disabled or when typing in input fields
      if (!enabled) return;

      const target = event.target as HTMLElement;
      const isInputField =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable ||
        target.getAttribute('contenteditable') === 'true';

      // Space: Start/stop timer (only when not typing)
      if (event.key === ' ' && !isInputField && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
        event.preventDefault();
        if (onStartStop) {
          onStartStop();
        } else {
          // Fallback: use store directly
          const { tasksStore } = rootStore;
          if (tasksStore.activeTask) {
            tasksStore.stopTimer();
          }
        }
        return;
      }

      // Escape: Close modals/drawers (only when not typing)
      if (event.key === 'Escape' && !isInputField) {
        if (onCloseModal) {
          onCloseModal();
        }
        return;
      }
    },
    [enabled, onStartStop, onCloseModal]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

export default useKeyboardShortcuts;

