import { useState } from 'react';
import { openExternalUrl } from '../../lib/tauri';
import { tagColor, categoryColor } from '../../colors';
import type { ReadingListEntry } from '../../types';

interface Props {
  entry:        ReadingListEntry;
  onRemove:     () => void;
  onToggleRead: () => void;
}

export function ReadingListEntryCard({ entry, onRemove, onToggleRead }: Props) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied]   = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(entry.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--card-hover)' : 'var(--card-bg)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        opacity: entry.read ? 0.5 : 1,
        transition: 'background 0.12s, opacity 0.2s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <a
          href={entry.url}
          onClick={e => { e.preventDefault(); openExternalUrl(entry.url); }}
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.4,
            textDecoration: entry.read ? 'line-through' : 'none',
            cursor: 'pointer',
          }}
        >
          {entry.title}
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {/* Mark read toggle */}
          <button
            onClick={e => { e.stopPropagation(); onToggleRead(); }}
            title={entry.read ? 'Mark unread' : 'Mark as read'}
            style={{
              width: 26,
              height: 26,
              borderRadius: 4,
              border: `1px solid ${entry.read ? '#4ade80' : 'var(--border)'}`,
              background: entry.read ? '#4ade8020' : 'transparent',
              color: entry.read ? '#4ade80' : 'var(--text-muted)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'color 0.12s, border-color 0.12s, background 0.12s',
            }}
          >
            ✓
          </button>

          {/* Remove from reading list */}
          <button
            onClick={e => { e.stopPropagation(); onRemove(); }}
            title="Remove from reading list"
            style={{
              width: 26,
              height: 26,
              borderRadius: 4,
              border: '1px solid #94a3b8',
              background: '#94a3b820',
              color: '#94a3b8',
              fontSize: 13,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'color 0.12s, border-color 0.12s, background 0.12s',
            }}
          >
            🔖
          </button>

          {/* Copy URL */}
          <button
            onClick={handleCopy}
            title="Copy URL"
            style={{
              width: 26,
              height: 26,
              borderRadius: 4,
              border: '1px solid var(--border)',
              background: copied ? 'var(--border)' : 'transparent',
              color: copied ? '#4ade80' : 'var(--text-muted)',
              fontSize: 12,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'color 0.12s',
            }}
          >
            {copied ? '✓' : '📋'}
          </button>

          {/* Category badge */}
          <span style={{
            padding: '2px 8px',
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 500,
            borderRadius: 4,
            background: `${categoryColor(entry.category)}20`,
            color: categoryColor(entry.category),
            border: `1px solid ${categoryColor(entry.category)}40`,
            whiteSpace: 'nowrap',
          }}>
            {entry.category}
          </span>
        </div>
      </div>

      {entry.summary && (
        <p style={{
          fontSize: 13,
          color: 'var(--text-secondary)',
          lineHeight: 1.55,
          margin: 0,
        }}>
          {entry.summary}
        </p>
      )}

      {/* Tags — display only, not interactive in reading list context */}
      {entry.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {entry.tags.map(tag => {
            const color = tagColor(tag);
            return (
              <span
                key={tag}
                style={{
                  padding: '2px 8px',
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  borderRadius: 10,
                  border: `1px solid ${color}`,
                  color,
                }}
              >
                {tag}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
