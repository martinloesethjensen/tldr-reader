interface Props {
  currentDate:  string;
  accentColor:  string;
  canGoNext:    boolean;
  onPrevDay:    () => void;
  onNextDay:    () => void;
}

export function EmptyState({ currentDate, accentColor, canGoNext, onPrevDay, onNextDay }: Props) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
      padding: 40,
      color: 'var(--text-muted)',
    }}>
      <span style={{ fontSize: 28 }}>📭</span>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: 11,
          fontFamily: "'JetBrains Mono', monospace",
          color: accentColor,
          marginBottom: 6,
        }}>
          {currentDate}
        </div>
        <div style={{ fontSize: 13 }}>No issue published for this date</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={onPrevDay}
          style={{
            padding: '6px 14px',
            border: '1px solid var(--border)',
            borderRadius: 6,
            background: 'transparent',
            color: 'var(--text-subtle)',
            fontSize: 12,
            fontFamily: "'JetBrains Mono', monospace",
            cursor: 'pointer',
          }}
        >◀ previous day</button>
        {canGoNext && (
          <button
            onClick={onNextDay}
            style={{
              padding: '6px 14px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'transparent',
              color: 'var(--text-subtle)',
              fontSize: 12,
              fontFamily: "'JetBrains Mono', monospace",
              cursor: 'pointer',
            }}
          >next day ▶</button>
        )}
      </div>
    </div>
  );
}
