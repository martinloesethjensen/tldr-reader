import { useState, useCallback } from 'react';
import { loadFromStorage, saveToStorage } from '../lib/storage';
import type { Article, FeedId, ReadingListEntry } from '../types';

// Module-level store so state survives tab switches
let stored: ReadingListEntry[] = loadFromStorage();

export interface UseReadingList {
  entries:             ReadingListEntry[];
  add:                 (article: Article, feedId: FeedId, date: string) => void;
  remove:              (url: string) => void;
  toggleRead:          (url: string) => void;
  markAllRead:         () => void;
  clearRead:           () => void;
  isInList:            (url: string) => boolean;
  isRead:              (url: string) => boolean;
  unreadCount:         number;
}

export function useReadingList(): UseReadingList {
  const [entries, setEntries] = useState<ReadingListEntry[]>(stored);

  const commit = useCallback((next: ReadingListEntry[]) => {
    stored = next;
    saveToStorage(next);
    setEntries(next);
  }, []);

  const add = useCallback((article: Article, feedId: FeedId, date: string) => {
    if (stored.some(e => e.url === article.url)) return;
    commit([
      {
        url:      article.url,
        title:    article.title,
        summary:  article.summary,
        tags:     article.tags,
        category: article.category,
        feedId,
        date,
        addedAt:  new Date().toISOString(),
        read:     false,
      },
      ...stored,
    ]);
  }, [commit]);

  const remove = useCallback((url: string) => {
    commit(stored.filter(e => e.url !== url));
  }, [commit]);

  const toggleRead = useCallback((url: string) => {
    commit(stored.map(e => e.url === url ? { ...e, read: !e.read } : e));
  }, [commit]);

  const markAllRead = useCallback(() => {
    commit(stored.map(e => ({ ...e, read: true })));
  }, [commit]);

  const clearRead = useCallback(() => {
    commit(stored.filter(e => !e.read));
  }, [commit]);

  const isInList = useCallback((url: string) => stored.some(e => e.url === url), [entries]); // eslint-disable-line react-hooks/exhaustive-deps
  const isRead   = useCallback((url: string) => stored.find(e => e.url === url)?.read ?? false, [entries]); // eslint-disable-line react-hooks/exhaustive-deps

  const unreadCount = entries.filter(e => !e.read).length;

  return { entries, add, remove, toggleRead, markAllRead, clearRead, isInList, isRead, unreadCount };
}
