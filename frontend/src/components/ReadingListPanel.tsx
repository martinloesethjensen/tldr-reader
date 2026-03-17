// PHASE 5
import { ArticleCard } from './ArticleCard';
import type { ReadingListEntry } from '../types';

interface Props {
  entries:       ReadingListEntry[];
  onRemove:      (url: string) => void;
  onToggleRead:  (url: string) => void;
  onMarkAllRead: () => void;
  onClearRead:   () => void;
}

export function ReadingListPanel({ entries, onRemove, onToggleRead, onMarkAllRead, onClearRead }: Props) {
  const unread = entries.filter(e => !e.read).length;

  if (entries.length === 0) {
    return (
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#64748b',
        fontSize: 14,
      }}>
        your reading list is empty · start saving articles with 🔖
      </div>
    );
  }

  // Sort unread first, then by addedAt desc within each group
  const sorted = [...entries].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return b.addedAt.localeCompare(a.addedAt);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 20px',
        borderBottom: '1px solid #1e2530',
      }}>
        <span style={{ fontSize: 13, color: '#64748b', fontFamily: "'JetBrains Mono', monospace" }}>
          {unread} unread · {entries.length} saved
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={onMarkAllRead}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              border: '1px solid #1e2530',
              borderRadius: 4,
              color: '#94a3b8',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            mark all read
          </button>
          <button
            onClick={onClearRead}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              border: '1px solid #1e2530',
              borderRadius: 4,
              color: '#64748b',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            clear read
          </button>
        </div>
      </div>

      {/* Article list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '16px 20px' }}>
        {sorted.map(entry => (
          <ArticleCard
            key={entry.url}
            article={{
              url:      entry.url,
              title:    entry.title,
              summary:  entry.summary,
              category: entry.category,
              tags:     entry.tags,
            }}
            activeTags={[]}
            onTagClick={() => {}}
            isInReadingList
            isRead={entry.read}
            onToggleReadingList={() => onRemove(entry.url)}
            onToggleRead={() => onToggleRead(entry.url)}
          />
        ))}
      </div>
    </div>
  );
}
