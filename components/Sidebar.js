'use client';

const NAV = [
  { id: 'live', label: 'Live Detection', icon: '◈' },
  { id: 'upload', label: 'Upload Analysis', icon: '↑' },
  { id: 'history', label: 'Detection History', icon: '◷' },
  { id: 'analytics', label: 'Analytics', icon: '▦' },
];

export default function Sidebar({ active, onNavigate }) {
  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        height: '100%',
        background: 'var(--bg-panel)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        padding: '20px 0',
      }}
    >
      <div style={{ padding: '0 20px 28px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: 'linear-gradient(135deg, #00e5ff, #0ea5e9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 800,
            fontSize: 14,
            color: '#001018',
          }}
        >
          DG
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, letterSpacing: '-0.02em' }}>
            DeepGuard<span style={{ color: 'var(--cyan)' }}>AI</span>
          </div>
          <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.06em' }}>
            FORENSIC OPS CONSOLE
          </div>
        </div>
      </div>

      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2, padding: '0 12px' }}>
        {NAV.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 14px',
                borderRadius: 8,
                border: 'none',
                background: isActive ? 'rgba(0, 229, 255, 0.1)' : 'transparent',
                color: isActive ? 'var(--cyan)' : 'var(--text-muted)',
                fontWeight: isActive ? 600 : 500,
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
            >
              <span style={{ fontSize: 16, opacity: isActive ? 1 : 0.6 }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)' }}>
        <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e' }} />
          Next.js · Edge Runtime
        </div>
      </div>
    </aside>
  );
}
