'use client';

export default function HistoryView({ history, onClear }) {
  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 28 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Detection History</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>{history.length} scan(s) stored locally</p>
        </div>
        {history.length > 0 && (
          <button className="btn btn-ghost" onClick={onClear}>Clear history</button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center', color: 'var(--text-dim)' }}>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>◷</div>
          <p>No detections yet. Run Live Detection or Upload Analysis to populate history.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map((item, idx) => (
            <div key={idx} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 20 }}>
              <div className={item.verdict === 'FAKE' ? 'verdict-fake' : 'verdict-real'} style={{ padding: '4px 10px', borderRadius: 6, fontWeight: 700, fontSize: 12, minWidth: 56, textAlign: 'center' }}>
                {item.verdict}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.fileName}
                </div>
                <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  {new Date(item.timestamp).toLocaleString()} · {item.mode} · {item.latencyMs}ms
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{item.confidence}%</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)' }}>confidence</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
