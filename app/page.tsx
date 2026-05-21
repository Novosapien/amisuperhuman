'use client';
import { useState } from 'react';
import LandingScreen from '@/components/LandingScreen';
import ProcessingScreen from '@/components/ProcessingScreen';
import ReportScreen from '@/components/ReportScreen';
import type { SuperhumanAnalysis } from '@/lib/types';

type Screen = 'landing' | 'processing' | 'report';

const MIN_PROCESSING_MS = 4000;

export default function Home() {
  const [screen, setScreen] = useState<Screen>('landing');
  const [analysis, setAnalysis] = useState<SuperhumanAnalysis | null>(null);
  const [formData, setFormData] = useState({ name: '', linkedinUrl: '', profileText: '' });
  const [error, setError] = useState('');

  async function handleSubmit(data: { name: string; linkedinUrl: string; profileText: string; turnstileToken: string }) {
    setFormData(data);
    setScreen('processing');
    setError('');

    const startTime = Date.now();

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Analysis failed');

      const elapsed = Date.now() - startTime;
      const remaining = MIN_PROCESSING_MS - elapsed;
      if (remaining > 0) await new Promise(r => setTimeout(r, remaining));

      setAnalysis(json.analysis);
      setScreen('report');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setScreen('landing');
    }
  }

  function handleGradeColleague() {
    setScreen('landing');
    setAnalysis(null);
    setFormData({ name: '', linkedinUrl: '', profileText: '' });
  }

  return (
    <>
      {error && screen === 'landing' && (
        <div style={{ position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: 'rgba(245,200,66,.12)', border: '1px solid rgba(245,200,66,.4)', color: '#F5C842', padding: '10px 20px', borderRadius: 4, fontSize: 13, maxWidth: '90vw', textAlign: 'center' }}>
          {error}
        </div>
      )}
      {screen === 'landing' && <LandingScreen onSubmit={handleSubmit} initialName={formData.name} />}
      {screen === 'processing' && <ProcessingScreen />}
      {screen === 'report' && analysis && (
        <ReportScreen analysis={analysis} formData={formData} onGradeColleague={handleGradeColleague} />
      )}
    </>
  );
}
