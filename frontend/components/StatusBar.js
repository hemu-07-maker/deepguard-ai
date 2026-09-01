'use client';

export default function StatusBar() {
  const utc = new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  return (
    <div
      style={{
        height: 36,
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        background: 'rgba(5, 7, 10, 0.9)',
        fontSize: 11,
      }}
      className="mono"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)' }}>
        <span className="status-dot" />
        <span>
          SYSTEM ONLINE <span style={{ color: 'var(--text-dim)' }}>//</span> WEB-CONSOLE{' '}
          <span style={{ color: 'var(--text-dim)' }}>•</span>{' '}
          <span style={{ color: 'var(--cyan)' }}>TRACE ACTIVE</span>
        </span>
      </div>
      <div style={{ color: 'var(--text-dim)' }}>{utc}</div>
    </div>
  );
}
