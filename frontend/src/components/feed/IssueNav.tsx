import { CategoryFilter } from '../filters/CategoryFilter';
import { TagFilter } from '../filters/TagFilter';
import type { Issue } from '../../types';

interface Props {
  issue:        Issue;
  currentDate:  string | null;
  accentColor:  string;
  canGoNext:    boolean;
  isLatest:     boolean;
  onPrevDay:    () => void;
  onNextDay:    () => void;
  onGoToLatest: () => void;
  allCats:      string[];
  catFilter:    string;
  allTags:      string[];
  activeTags:   string[];
  onCatChange:  (cat: string) => void;
  onTagToggle:  (tag: string) => void;
  onTagClear:   () => void;
}

export function IssueNav({
  issue, currentDate, accentColor, canGoNext, isLatest,
  onPrevDay, onNextDay, onGoToLatest,
  allCats, catFilter, allTags, activeTags, onCatChange, onTagToggle, onTagClear,
}: Props) {
  return (
    <div style={{
      padding: '12px 20px 10px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <button
          onClick={onPrevDay}
          title="Previous issue"
          style={{
            padding: '1px 6px',
            border: '1px solid var(--border)',
            borderRadius: 4,
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.6,
          }}
        >◀</button>
        <span style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: accentColor,
          flexShrink: 0,
        }}>
          {currentDate ?? issue.date}
        </span>
        <button
          onClick={onNextDay}
          disabled={!canGoNext}
          title="Next issue"
          style={{
            padding: '1px 6px',
            border: '1px solid var(--border)',
            borderRadius: 4,
            background: 'transparent',
            color: canGoNext ? 'var(--text-muted)' : 'var(--border-disabled)',
            fontSize: 11,
            cursor: canGoNext ? 'pointer' : 'default',
            fontFamily: "'JetBrains Mono', monospace",
            lineHeight: 1.6,
          }}
        >▶</button>
        {!isLatest && (
          <button
            onClick={onGoToLatest}
            title="Jump to latest issue"
            style={{
              padding: '1px 8px',
              border: '1px solid var(--border)',
              borderRadius: 4,
              background: 'transparent',
              color: accentColor,
              fontSize: 10,
              cursor: 'pointer',
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1.6,
            }}
          >today</button>
        )}
        <span style={{ fontSize: 13, color: 'var(--text-secondary)', marginLeft: 2 }}>
          {issue.headline}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <CategoryFilter categories={allCats} active={catFilter} onChange={onCatChange} />
        <TagFilter tags={allTags} active={activeTags} onToggle={onTagToggle} onClear={onTagClear} />
      </div>
    </div>
  );
}
