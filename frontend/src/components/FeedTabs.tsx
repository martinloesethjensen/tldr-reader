// PHASE 4
import type { ActiveTab, FeedId, FeedMeta } from '../types';

interface Props {
  feeds:        FeedMeta[];
  active:       ActiveTab;
  loading:      Record<FeedId, boolean>;
  onChange:     (id: ActiveTab) => void;
  unreadCount:  number;
}

export function FeedTabs({ feeds, active, loading, onChange, unreadCount }: Props) {
  return (
    <div style={{
      display: 'flex',
      gap: 4,
      padding: '0 20px',
      borderBottom: '1px solid #1e2530',
    }}>
      {feeds.map(f => {
        const isActive = active === f.id;
        const isLoading = loading[f.id];
        return (
          <button
            key={f.id}
            onClick={() => onChange(f.id)}
            style={{
              padding: '10px 16px',
              fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? f.accent : '#64748b',
              background: isActive ? `${f.accent}15` : 'transparent',
              border: 'none',
              borderBottom: isActive ? `2px solid ${f.accent}` : '2px solid transparent',
              borderRadius: '4px 4px 0 0',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'color 0.15s, background 0.15s',
              marginBottom: -1,
            }}
          >
            <span>{f.emoji}</span>
            <span>{f.label}</span>
            {isLoading && (
              <span style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: f.accent,
                display: 'inline-block',
                animation: 'pulse 1s infinite',
              }} />
            )}
          </button>
        );
      })}

      {/* Reading list tab */}
      <button
        onClick={() => onChange('reading-list')}
        style={{
          padding: '10px 16px',
          fontSize: 13,
          fontWeight: active === 'reading-list' ? 600 : 400,
          color: active === 'reading-list' ? '#94a3b8' : '#64748b',
          background: active === 'reading-list' ? '#94a3b815' : 'transparent',
          border: 'none',
          borderBottom: active === 'reading-list' ? '2px solid #94a3b8' : '2px solid transparent',
          borderRadius: '4px 4px 0 0',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: -1,
          marginLeft: 'auto',
        }}
      >
        <span>🔖</span>
        <span>Saved</span>
        {unreadCount > 0 && (
          <span style={{
            background: '#94a3b8',
            color: '#07090e',
            fontSize: 11,
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 600,
            padding: '1px 6px',
            borderRadius: 10,
            lineHeight: 1.4,
          }}>
            {unreadCount}
          </span>
        )}
      </button>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
