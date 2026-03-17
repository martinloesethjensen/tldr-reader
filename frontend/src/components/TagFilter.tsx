// PHASE 4
import { tagColor } from '../colors';

interface Props {
  tags:     string[];
  active:   string[];
  onToggle: (tag: string) => void;
  onClear:  () => void;
}

export function TagFilter({ tags, active, onToggle, onClear }: Props) {
  if (tags.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
      {tags.map(tag => {
        const color = tagColor(tag);
        const isActive = active.includes(tag);
        return (
          <button
            key={tag}
            onClick={() => onToggle(tag)}
            style={{
              padding: '3px 10px',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              fontWeight: 500,
              borderRadius: 12,
              border: `1px solid ${color}`,
              background: isActive ? color : 'transparent',
              color: isActive ? '#07090e' : color,
              cursor: 'pointer',
              transition: 'background 0.12s, color 0.12s',
            }}
          >
            {tag}
          </button>
        );
      })}
      {active.length > 0 && (
        <button
          onClick={onClear}
          style={{
            padding: '3px 8px',
            fontSize: 11,
            color: '#64748b',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
        >
          clear
        </button>
      )}
    </div>
  );
}
