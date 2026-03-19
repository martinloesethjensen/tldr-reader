import type { FeedId } from './feed';

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
