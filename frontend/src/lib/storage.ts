import type { ReadingListEntry } from '../types';

export const STORAGE_KEY = 'tldr-reading-list';

export function loadFromStorage(): ReadingListEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ReadingListEntry[]) : [];
  } catch {
    return [];
  }
}

export function saveToStorage(entries: ReadingListEntry[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}
