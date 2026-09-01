'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import StatusBar from '@/components/StatusBar';
import LiveDetection from '@/components/LiveDetection';
import UploadAnalysis from '@/components/UploadAnalysis';
import HistoryView from '@/components/HistoryView';
import AnalyticsView from '@/components/AnalyticsView';

const STORAGE_KEY = 'dg_history_v1';

export default function ConsolePage() {
  const [view, setView] = useState('live');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setHistory(JSON.parse(raw));
    } catch {}
  }, []);

  const persist = useCallback((next) => {
    setHistory(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, 100)));
    } catch {}
  }, []);

  function handleResult(result) {
    persist([result, ...history].slice(0, 100));
  }

  function clearHistory() {
    persist([]);
  }

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <StatusBar />
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
