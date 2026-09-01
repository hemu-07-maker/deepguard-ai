'use client';

import { useState, useRef, useEffect } from 'react';
import WireframeSphere from './WireframeSphere';

export default function LiveDetection({ onResult }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [streaming, setStreaming] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [lastResult, setLastResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => () => stopCamera(), []);

  async function engageCamera() {
    setError('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setStreaming(true);
      }
    } catch (e) {
      setError('Camera access denied or unavailable. Use Upload Analysis instead.');
    }
  }

  function stopCamera() {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  }

  async function captureAndAnalyze() {
    if (!videoRef.current || !streaming) return;
    setAnalyzing(true);
    setError('');
    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fileName: `live-${Date.now()}.jpg`,
          fileSize: base64.length,
          fileType: 'image/jpeg',
          mode: 'image',
          base64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setLastResult(data);
      onResult?.(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  function saveSnapshot() {
    if (!lastResult) return;
    const blob = new Blob([JSON.stringify(lastResult, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `deepguard-snapshot-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div
        style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          background: 'radial-gradient(ellipse at 50% 40%, #0a1520 0%, #05070a 70%)',
          borderBottom: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(var(--grid) 1px, transparent 1px), linear-gradient(90deg, var(--grid) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            maskImage: 'linear-gradient(to bottom, transparent 20%, black 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'absolute', top: 16, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 5 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
          </div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', border: '1px solid var(--border)', padding: '4px 12px', borderRadius: 4 }}>
            DEEPGUARD.AI / CONSOLE
          </div>
        </div>

        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, padding: '60px 40px 40px' }}>
          {!streaming ? (
            <>
              <div style={{ maxWidth: 360 }}>
                <div className="mono" style={{ fontSize: 11, color: 'var(--cyan)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="status-dot" style={{ width: 6, height: 6 }} />
                  OPERATOR DIRECTIVE
                </div>
                <h2 style={{ fontSize: 32, fontWeight: 700, lineHeight: 1.2, marginBottom: 12, letterSpacing: '-0.03em' }}>
                  &quot;Trust <span style={{ color: 'var(--red)' }}>nothing</span>.
                  <br />
                  Verify <span style={{ color: 'var(--cyan)' }}>everything</span>.&quot;
                </h2>
                <p className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
                  — DEEPGUARD AI · FORENSIC OPS DOCTRINE
                </p>
              </div>
              <WireframeSphere size={260} />
            </>
          ) : (
            <div style={{ display: 'flex', gap: 32, alignItems: 'center', width: '100%', maxWidth: 900 }}>
              <div style={{ flex: 1, borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border-bright)', background: '#000', aspectRatio: '4/3', maxHeight: 360 }}>
                <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
              </div>
              <div style={{ width: 280 }}>
                {lastResult ? <ResultCard result={lastResult} /> : (
                  <div className="card" style={{ padding: 24, textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>Camera live. Capture a frame to run forensic analysis.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>

      <div style={{ padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-panel)', borderTop: '1px solid var(--border)' }}>
        <div>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 4 }}>// 01 · LIVE OPS</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.02em' }}>Real-time Deepfake Console</h1>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {error && <span style={{ color: 'var(--red)', fontSize: 12, maxWidth: 220 }}>{error}</span>}
          {!streaming ? (
            <button className="btn btn-primary" onClick={engageCamera}>📷 ENGAGE CAMERA</button>
          ) : (
            <>
              <button className="btn btn-ghost" onClick={stopCamera}>Stop</button>
              <button className="btn btn-primary" onClick={captureAndAnalyze} disabled={analyzing}>
                {analyzing ? 'Analyzing…' : 'Analyze Frame'}
              </button>
            </>
          )}
          <button className="btn btn-ghost" onClick={saveSnapshot} disabled={!lastResult}>💾 SAVE SNAPSHOT</button>
        </div>
      </div>
    </div>
  );
}

function ResultCard({ result }) {
  const isFake = result.verdict === 'FAKE';
  return (
    <div className="card" style={{ padding: 20 }}>
      <div className={isFake ? 'verdict-fake' : 'verdict-real'} style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 6, fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
        {result.verdict}
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>{result.confidence}%</div>
      <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
        confidence · {result.latencyMs}ms · faces: {result.facesDetected}
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{result.reasoning}</p>
      {result.artifacts?.length > 0 && (
        <ul style={{ marginTop: 12, paddingLeft: 16, fontSize: 11, color: 'var(--text-dim)' }}>
          {result.artifacts.slice(0, 3).map((a, i) => <li key={i} style={{ marginBottom: 4 }}>{a}</li>)}
        </ul>
      )}
    </div>
  );
}
