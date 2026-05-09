import { useEffect } from 'react';

export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handler = (e) => {
      if (!e.metaKey && !e.ctrlKey) return;
      const key = e.key.toLowerCase();
      for (const shortcut of shortcuts) {
        if (shortcut.key === key && (shortcut.meta ? (e.metaKey || e.ctrlKey) : true)) {
          e.preventDefault();
          shortcut.handler();
          return;
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
