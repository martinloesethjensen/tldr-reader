interface Props {
  accentColor: string;
}

export function LoadingSpinner({ accentColor }: Props) {
  return (
    <div style={{
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 60,
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: `3px solid ${accentColor}25`,
        borderTopColor: accentColor,
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  );
}
