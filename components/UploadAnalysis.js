'use client';

import { useState, useRef } from 'react';

const MODES = [
  { id: 'video', label: 'VIDEO', icon: '▶' },
  { id: 'audio', label: 'AUDIO', icon: '♪' },
  { id: 'image', label: 'IMAGE', icon: '▣' },
];

export default function UploadAnalysis({ onResult }) {
  const [mode, setMode] = useState('image');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  function acceptForMode() {
    if (mode === 'video') return 'video/mp4,video/quicktime,video/webm';
    if (mode === 'audio') return 'audio/mpeg,audio/wav,audio/mp3,audio/x-wav';
    return 'image/jpeg,image/png,image/webp,image/jpg';
  }

  function handleFile(f) {
    if (!f) return;
    setFile(f);
    setResult(null);
    setError('');
    if (f.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => setPreview(e.target.result);
      reader.readAsDataURL(f);
    } else {
      setPreview(null);
    }
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  }

  async function runAnalysis() {
    if (!file) return;
    setLoading(true);
    setError('');
    try {
      let base64 = null;
      if (file.type.startsWith('image/')) {
        base64 = await new Promise((resolve, reject) => {
          const r = new FileReader();
          r.onload = () => resolve(r.result.split(',')[1]);
          r.onerror = reject;
          r.readAsDataURL(file);
        });
      }
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          mode,
          base64,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      onResult?.(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ height: '100%', overflow: 'auto', padding: 28 }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 6 }}>Upload & Analyze</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
          Drag & drop video · audio · image → forensic ML inference
        </p>
      </div>

      <div className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14, letterSpacing: '0.06em' }}>
          SELECT FILE TYPE
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => { setMode(m.id); setFile(null); setPreview(null); setResult(null); }}
              className={mode === m.id ? 'btn btn-outline' : 'btn btn-ghost'}
              style={{ minWidth: 100 }}
            >
              {m.icon} {m.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div className="card" style={{ padding: 20 }}>
          <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 14, letterSpacing: '0.06em' }}>
            UPLOAD MEDIA
          </div>
          <div
            className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
            style={{ padding: '48px 24px', textAlign: 'center' }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
          >
            <div style={{ fontSize: 28, marginBottom: 12, opacity: 0.5 }}>↑</div>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Drop file here or click to browse</div>
            <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)' }}>
              Supports MP4 · MOV · MP3 · WAV · JPG · PNG · WEBP
            </div>
            {file && (
              <div style={{ marginTop: 16, color: 'var(--cyan)', fontSize: 13 }}>
                {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </div>
            )}
            <input
              ref={inputRef}
              type="file"
              accept={acceptForMode()}
              style={{ display: 'none' }}
              onChange={(e) => handleFile(e.target.files?.[0])}
            />
          </div>
          {preview && (
            <div style={{ marginTop: 16, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)' }}>
              <img src={preview} alt="preview" style={{ width: '100%', maxHeight: 200, objectFit: 'contain', display: 'block', background: '#000' }} />
            </div>
          )}
          <button
            className="btn btn-primary"
            style={{ width: '100%', marginTop: 16, justifyContent: 'center' }}
            disabled={!file || loading}
            onClick={runAnalysis}
          >
            {loading ? 'Running inference…' : 'Run Forensic Analysis'}
          </button>
          {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 10 }}>{error}</p>}
        </div>

        <div className="card" style={{ padding: 20, minHeight: 320, display: 'flex', flexDirection: 'column' }}>
          {!result ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.3 }}>⬡</div>
              <div style={{ fontWeight: 500, marginBottom: 4 }}>Analysis result will appear here</div>
              <div className="mono" style={{ fontSize: 11 }}>Upload a file to start Python ML inference</div>
            </div>
          ) : (
            <div>
              <div className={result.verdict === 'FAKE' ? 'verdict-fake' : 'verdict-real'} style={{ display: 'inline-block', padding: '6px 14px', borderRadius: 6, fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
                {result.verdict}
              </div>
              <div style={{ fontSize: 36, fontWeight: 700, marginBottom: 4 }}>{result.confidence}%</div>
              <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 16 }}>
                confidence · {result.latencyMs}ms latency · {result.facesDetected} face(s) · {result.mode}
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 16 }}>{result.reasoning}</p>
              {result.artifacts?.length > 0 && (
                <>
                  <div className="mono" style={{ fontSize: 11, color: 'var(--text-dim)', marginBottom: 8, letterSpacing: '0.05em' }}>ARTIFACTS</div>
                  <ul style={{ paddingLeft: 18, fontSize: 12, color: 'var(--text-muted)' }}>
                    {result.artifacts.map((a, i) => <li key={i} style={{ marginBottom: 6 }}>{a}</li>)}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
