// PHASE 3
export interface Article {
  title:    string;
  summary:  string;
  url:      string;
  category: string;
  tags:     string[];
}

export interface Issue {
  feed:     string;
  date:     string;
  headline: string;
  articles: Article[];
}

export type FeedId = 'dev' | 'ai' | 'tech';

export interface FeedMeta {
  id:     FeedId;
  label:  string;
  emoji:  string;
  accent: string;
}

// Phase 5 — Reading list
export type ActiveTab = FeedId | 'reading-list';

export interface ReadingListEntry {
  url:      string;
  title:    string;
  summary:  string;
  tags:     string[];   // stored for display in reading list panel
  category: string;     // stored for display in reading list panel
  feedId:   FeedId;
  date:     string;     // issue date e.g. "2026-03-13"
  addedAt:  string;     // ISO timestamp
  read:     boolean;
}
