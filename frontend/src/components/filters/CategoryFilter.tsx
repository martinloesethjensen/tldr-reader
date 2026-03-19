interface Props {
  categories: string[];
  active:     string;
  onChange:   (cat: string) => void;
}

export function CategoryFilter({ categories, active, onChange }: Props) {
  if (categories.length === 0) return null;

  const all = ['All', ...categories];

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {all.map(cat => {
        const isActive = active === cat;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            style={{
              padding: '4px 10px',
              fontSize: 11,
              fontFamily: "'JetBrains Mono', monospace",
              borderRadius: 4,
              border: `1px solid ${isActive ? 'var(--text-primary)' : 'var(--border)'}`,
              background: isActive ? 'var(--text-primary)' : 'transparent',
              color: isActive ? 'var(--bg)' : 'var(--text-muted)',
              cursor: 'pointer',
              transition: 'background 0.12s, color 0.12s, border-color 0.12s',
            }}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
