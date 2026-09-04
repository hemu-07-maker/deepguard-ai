'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import StatusBar from '@/components/StatusBar';
import LiveDetection from '@/components/LiveDetection';
import UploadAnalysis from '@/components/UploadAnalysis';
import HistoryView from '@/components/HistoryView';
import AnalyticsView from '@/components/AnalyticsView';

const STORAGE_KEY = 'dg_history_v1';

export default function ConsolePage() {
  const router = useRouter();
  const [view, setView] = useState('live');
  const [history, setHistory] = useState([]);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(async (res) => {
        if (!res.ok) {
          router.replace('/login');
          return;
        }
        const data = await res.json();
        setUser(data.user);
        setChecking(false);
      })
      .catch(() => router.replace('/login'));
  }, [router]);

  useEffect(() => {
    if (!user) return;
    try {
      const key = `${STORAGE_KEY}_${user.id}`;
      const raw = localStorage.getItem(key) || localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, [user]);

  const persist = useCallback(
    (next) => {
      setHistory(next);
      if (!user) return;
      try {
        localStorage.setItem(`${STORAGE_KEY}_${user.id}`, JSON.stringify(next.slice(0, 100)));
      } catch {}
    },
    [user]
  );

  function handleResult(result) {
    persist([result, ...history].slice(0, 100));
  }

  function clearHistory() {
    persist([]);
  }

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/login');
  }

  if (checking) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text-muted)' }}>
        <span className="mono">Verifying operator session…</span>
      </div>
    );
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <StatusBar user={user} onLogout={logout} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <Sidebar active={view} onNavigate={setView} />
        <main style={{ flex: 1, overflow: 'hidden', background: 'var(--bg)' }}>
          {view === 'live' && <LiveDetection onResult={handleResult} />}
          {view === 'upload' && <UploadAnalysis onResult={handleResult} />}
          {view === 'history' && <HistoryView history={history} onClear={clearHistory} />}
          {view === 'analytics' && <AnalyticsView history={history} />}
        </main>
      </div>
    </div>
  );
}
