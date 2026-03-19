import { ReadingListEntryCard } from './ReadingListEntryCard';
import type { ReadingListEntry } from '../../types';

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
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 40,
        textAlign: 'center',
      }}>
        <span style={{ fontSize: 36 }}>🔖</span>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-primary)' }}>
            Nothing saved yet
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 280 }}>
            Bookmark articles from any feed with 🔖 and they'll appear here for later reading.
          </div>
        </div>
      </div>
    );
  }

  const sorted = [...entries].sort((a, b) => {
    if (a.read !== b.read) return a.read ? 1 : -1;
    return b.addedAt.localeCompare(a.addedAt);
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '12px 20px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)', fontFamily: "'JetBrains Mono', monospace" }}>
          {unread} unread · {entries.length} saved
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            onClick={onMarkAllRead}
            style={{
              fontSize: 12,
              padding: '4px 10px',
              border: '1px solid var(--border)',
              borderRadius: 4,
              color: 'var(--text-subtle)',
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
              border: '1px solid var(--border)',
              borderRadius: 4,
              color: 'var(--text-muted)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            clear read
          </button>
        </div>
      </div>

      <div className="articles-grid" style={{ padding: '12px 20px' }}>
        {sorted.map(entry => (
          <ReadingListEntryCard
            key={entry.url}
            entry={entry}
            onRemove={() => onRemove(entry.url)}
            onToggleRead={() => onToggleRead(entry.url)}
          />
        ))}
      </div>
    </div>
  );
}
