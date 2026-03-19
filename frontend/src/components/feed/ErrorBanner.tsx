interface Props {
  error:   string;
  onRetry: () => void;
}

export function ErrorBanner({ error, onRetry }: Props) {
  return (
    <div style={{
      margin: 20,
      padding: '16px 20px',
      background: 'var(--error-bg)',
      border: '1px solid #f8717140',
      borderRadius: 8,
      color: '#f87171',
      fontSize: 13,
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    }}>
      <span>⚠ {error}</span>
      <button
        onClick={onRetry}
        style={{
          marginLeft: 'auto',
          padding: '4px 12px',
          border: '1px solid #f87171',
          borderRadius: 4,
          color: '#f87171',
          background: 'transparent',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        Retry
      </button>
    </div>
  );
}
