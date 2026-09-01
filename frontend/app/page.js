'use client';

import { useRouter } from 'next/navigation';
import WireframeSphere from '@/components/WireframeSphere';

export default function LandingPage() {
  const router = useRouter();

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'radial-gradient(ellipse at 60% 40%, #0a1520 0%, #05070a 65%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Stars */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 2,
              height: 2,
              borderRadius: '50%',
              background: i % 5 === 0 ? 'var(--cyan)' : '#fff',
              opacity: 0.15 + (i % 7) * 0.05,
              left: `${(i * 17 + 3) % 100}%`,
              top: `${(i * 23 + 11) % 100}%`,
            }}
          />
        ))}
      </div>

      {/* Grid floor */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)`,
          backgroundSize: '56px 56px',
          maskImage: 'linear-gradient(to bottom, transparent 30%, black 85%)',
          pointerEvents: 'none',
        }}
      />

      {/* Header */}
      <header style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg, #00e5ff, #0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#001018' }}>
            DG
          </div>
          <span style={{ fontWeight: 700, fontSize: 18 }}>
            DeepGuard<span style={{ color: 'var(--cyan)' }}>AI</span>
          </span>
        </div>
        <button className="btn btn-ghost" onClick={() => router.push('/console')}>
          OPERATOR LOGIN
        </button>
      </header>

      {/* Hero */}
      <main style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '40px 60px 80px', maxWidth: 1200, margin: '0 auto', gap: 40 }}>
        <div style={{ flex: 1, maxWidth: 560 }}>
          <div className="mono" style={{ fontSize: 12, color: 'var(--cyan)', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="status-dot" style={{ width: 6, height: 6 }} />
            MULTI-MODAL FORENSIC DETECTION
            <span style={{ color: 'var(--text-dim)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 4, marginLeft: 4 }}>
              CLAUDE SONNET 4.5
            </span>
          </div>

          <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.04em', marginBottom: 20 }}>
            AI can fake anything.
            <br />
            <span style={{ color: 'var(--cyan)' }}>We prove what&apos;s real.</span>
          </h1>

          <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32, maxWidth: 480 }}>
            Forensic-grade multi-modal deepfake detection across webcam streams, video
            uploads, photos and audio. Verdict, artifact list and reasoning in under a second.
          </p>

          <div style={{ display: 'flex', gap: 12, marginBottom: 48 }}>
            <button className="btn btn-primary" style={{ padding: '14px 24px', fontSize: 14 }} onClick={() => router.push('/console')}>
              DEPLOY CONSOLE →
            </button>
            <button className="btn btn-ghost" style={{ padding: '14px 24px' }} onClick={() => router.push('/console')}>
              READ DOSSIER
            </button>
          </div>

          <div style={{ display: 'flex', gap: 40 }}>
            {[
              { v: '98.6%', l: 'DETECTION ACCURACY' },
              { v: '<40ms', l: 'AVG LATENCY' },
              { v: '3-mode', l: 'MULTI-MODAL' },
            ].map((s) => (
              <div key={s.l}>
                <div style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em' }}>{s.v}</div>
                <div className="mono" style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: '0.08em', marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flexShrink: 0 }}>
          <WireframeSphere size={340} />
        </div>
      </main>
    </div>
  );
}
