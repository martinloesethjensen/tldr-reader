// PHASE 4
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
              border: `1px solid ${isActive ? '#dde4ef' : '#1e2530'}`,
              background: isActive ? '#dde4ef' : 'transparent',
              color: isActive ? '#07090e' : '#64748b',
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
