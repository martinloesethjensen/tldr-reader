import { useEffect } from 'react';
import type { ActiveTab } from '../types';

interface Params {
  activeTab:   ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onReload:    () => void;
  onEscape:    () => void;
}

export function useKeyboardShortcuts({ activeTab, onTabChange, onReload, onEscape }: Params) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      switch (e.key) {
        case '1': onTabChange('dev');          break;
        case '2': onTabChange('ai');           break;
        case '3': onTabChange('tech');         break;
        case '4': onTabChange('reading-list'); break;
        case 'Escape': onEscape();             break;
        case 'r': case 'R':
          if (activeTab !== 'reading-list') onReload();
          break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab, onTabChange, onReload, onEscape]);
}
