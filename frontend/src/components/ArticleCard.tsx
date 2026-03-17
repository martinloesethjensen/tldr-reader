// PHASE 4
import { useState } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { tagColor, categoryColor } from '../colors';
import type { Article } from '../types';

interface Props {
  article:              Article;
  activeTags:           string[];
  onTagClick:           (tag: string) => void;
  // Phase 5 — reading list (optional so card works standalone too)
  isInReadingList?:     boolean;
  isRead?:              boolean;
  onToggleReadingList?: () => void;
  onToggleRead?:        () => void;
}

async function openLink(url: string) {
  try {
    await openUrl(url);
  } catch {
    window.open(url, '_blank');
  }
}

export function ArticleCard({
  article,
  activeTags,
  onTagClick,
  isInReadingList = false,
  isRead = false,
  onToggleReadingList,
  onToggleRead,
}: Props) {
  const [hovered, setHovered] = useState(false);
  const [copied, setCopied]   = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await navigator.clipboard.writeText(article.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? '#111827' : '#0d1117',
        border: '1px solid #1e2530',
        borderRadius: 8,
        padding: '14px 16px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        opacity: isRead ? 0.5 : 1,
        transition: 'background 0.12s, opacity 0.2s',
      }}
    >
      {/* Header row: title + action buttons + category badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <a
          href={article.url}
          onClick={e => { e.preventDefault(); openLink(article.url); }}
          style={{
            flex: 1,
            fontSize: 14,
            fontWeight: 600,
            color: '#dde4ef',
            lineHeight: 1.4,
            textDecoration: isRead ? 'line-through' : 'none',
            cursor: 'pointer',
          }}
        >
          {article.title}
        </a>

        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
          {/* Mark read button — only when in reading list */}
          {onToggleRead && isInReadingList && (
            <button
              onClick={e => { e.stopPropagation(); onToggleRead(); }}
              title={isRead ? 'Mark unread' : 'Mark as read'}
              style={{
                width: 26,
                height: 26,
                borderRadius: 4,
                border: `1px solid ${isRead ? '#4ade80' : '#1e2530'}`,
                background: isRead ? '#4ade8020' : 'transparent',
                color: isRead ? '#4ade80' : '#64748b',
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
          )}

          {/* Save / bookmark button */}
          {onToggleReadingList && (
            <button
              onClick={e => { e.stopPropagation(); onToggleReadingList(); }}
              title={isInReadingList ? 'Remove from reading list' : 'Save to reading list'}
              style={{
                width: 26,
                height: 26,
                borderRadius: 4,
                border: `1px solid ${isInReadingList ? '#94a3b8' : '#1e2530'}`,
                background: isInReadingList ? '#94a3b820' : 'transparent',
                color: isInReadingList ? '#94a3b8' : '#64748b',
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
          )}

          {/* Copy URL button */}
          <button
            onClick={handleCopy}
            title="Copy URL"
            style={{
              width: 26,
              height: 26,
              borderRadius: 4,
              border: '1px solid #1e2530',
              background: copied ? '#1e2530' : 'transparent',
              color: copied ? '#4ade80' : '#64748b',
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
            background: `${categoryColor(article.category)}20`,
            color: categoryColor(article.category),
            border: `1px solid ${categoryColor(article.category)}40`,
            whiteSpace: 'nowrap',
          }}>
            {article.category}
          </span>
        </div>
      </div>

      {/* Summary */}
      {article.summary && (
        <p style={{
          fontSize: 13,
          color: '#8899aa',
          lineHeight: 1.55,
          margin: 0,
        }}>
          {article.summary}
        </p>
      )}

      {/* Tags */}
      {article.tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {article.tags.map(tag => {
            const color = tagColor(tag);
            const isActive = activeTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => onTagClick(tag)}
                style={{
                  padding: '2px 8px',
                  fontSize: 10,
                  fontFamily: "'JetBrains Mono', monospace",
                  borderRadius: 10,
                  border: `1px solid ${color}`,
                  background: isActive ? color : 'transparent',
                  color: isActive ? '#07090e' : color,
                  cursor: 'pointer',
                  transition: 'background 0.1s, color 0.1s',
                }}
              >
                {tag}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
