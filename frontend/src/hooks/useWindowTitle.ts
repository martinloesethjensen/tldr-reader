import { useEffect } from 'react';
import { FEEDS } from '../config/feeds';
import { setWindowTitle } from '../lib/tauri';
import type { ActiveTab, Issue } from '../types';

export function useWindowTitle(issue: Issue | null, activeTab: ActiveTab) {
  useEffect(() => {
    if (issue && activeTab !== 'reading-list') {
      const label = FEEDS.find(f => f.id === activeTab)?.label ?? activeTab;
      setWindowTitle(`TLDR Reader — ${label} · ${issue.date}`);
    }
  }, [issue, activeTab]);
}
