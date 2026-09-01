'use client';

export default function AnalyticsView({ history }) {
  const total = history.length;
  const fakes = history.filter((h) => h.verdict === 'FAKE').length;
  const reals = total - fakes;
  const avgConf = total ? Math.round(history.reduce((s, h) => s + h.confidence, 0) / total) : 0;
  const avgLat = total ? Math.round(history.reduce((s, h) => s + (h.latencyMs || 0), 0) / total) : 0;

  const byMode = { image: 0, video: 0, audio: 0 };
  history.forEach((h) => { if (byMode[h.mode] !== undefined) byMode[h.mode]++; });

  const stats = [
    { label: 'TOTAL SCANS', value: total, sub: 'all time' },
    { label: 'FAKE RATE', value: total ? `${Math.round((fakes / total) * 100)}%` : '—', sub: `${fakes} flagged` },
    { label: 'AVG CONFIDENCE', value: total ? `${avgConf}%` : '—', sub: 'model certainty' },
    { label: 'AVG LATENCY', value: total ? `${avgLat}ms` : '—', sub: 'edge inference' },
  ];

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Analytics</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Session-level forensic metrics</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 28 }}>
        {stats.map((s) => (
          <div key={s.label} className="card" style={{ padding: 20 }}>
            <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.08em', marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{s.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 24 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16, letterSpacing: '0.06em' }}>VERDICT SPLIT</div>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16, background: 'var(--border)' }}>
            {total > 0 && (
              <>
                <div style={{ width: `${(reals / total) * 100}%`, background: '#22c55e' }} />
                <div style={{ width: `${(fakes / total) * 100}%`, background: 'var(--red)' }} />
              </>
            )}
          </div>
          <div style={{ display: 'flex', gap: 24, fontSize: 13 }}>
            <span><span style={{ color: '#22c55e' }}>●</span> REAL {reals}</span>
            <span><span style={{ color: 'var(--red)' }}>●</span> FAKE {fakes}</span>
          </div>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16, letterSpacing: '0.06em' }}>BY MODALITY</div>
          {['image', 'video', 'audio'].map((m) => (
            <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <span style={{ width: 60, fontSize: 12, textTransform: 'uppercase', color: 'var(--text-muted)' }}>{m}</span>
              <div style={{ flex: 1, height: 8, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{ width: total ? `${(byMode[m] / total) * 100}%` : 0, height: '100%', background: 'var(--cyan)', borderRadius: 4 }} />
              </div>
              <span className="mono" style={{ fontSize: 12, width: 28, textAlign: 'right' }}>{byMode[m]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
