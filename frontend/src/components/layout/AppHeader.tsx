import type { Theme } from '../../hooks/useTheme';
import type { ActiveTab } from '../../types';

interface Props {
  activeTab:      ActiveTab;
  loading:        boolean;
  accentColor:    string;
  theme:          Theme;
  onReload:       () => void;
  onToggleTheme:  () => void;
}

export function AppHeader({ activeTab, loading, accentColor, theme, onReload, onToggleTheme }: Props) {
  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      padding: '14px 20px 12px',
      borderBottom: '1px solid var(--border)',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: 16,
        fontWeight: 700,
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: '-0.5px',
        color: 'var(--text-primary)',
      }}>
        tldr.reader
      </span>

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        <button
          onClick={onToggleTheme}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{
            width: 30,
            height: 30,
            borderRadius: 6,
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontSize: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          {theme === 'dark' ? '☀' : '☾'}
        </button>

        {activeTab !== 'reading-list' && (
          <button
            onClick={onReload}
            title="Refresh (R)"
            style={{
              width: 30,
              height: 30,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'transparent',
              color: loading ? accentColor : 'var(--text-muted)',
              fontSize: 15,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'color 0.15s',
            }}
          >
            <span style={{ display: 'inline-block', animation: loading ? 'spin 0.8s linear infinite' : 'none' }}>↺</span>
          </button>
        )}
      </div>
    </header>
  );
}
