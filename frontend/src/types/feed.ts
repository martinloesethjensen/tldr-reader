export type FeedId = 'dev' | 'ai' | 'tech';

export interface FeedMeta {
  id:     FeedId;
  label:  string;
  emoji:  string;
  accent: string;
}

export type ActiveTab = FeedId | 'reading-list';
