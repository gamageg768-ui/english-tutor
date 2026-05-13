'use client';

import { useState, useEffect, useCallback } from 'react';
import { getFlashcards, reviewFlashcard } from '@/lib/api-client';

interface Flashcard { id: number; front: string; back: string; category: string; next_review: string; review_count: number; ease_factor: number; interval: number; }
interface Props { theme: 'dark' | 'light'; onBack: () => void; }

export default function FlashcardReview({ theme, onBack }: Props) {
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [dueCount, setDueCount] = useState(0);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'due' | 'all'>('due');
  const [done, setDone] = useState(false);
  const [stats, setStats] = useState({ reviewed: 0, correct: 0 });
  const [skipped, setSkipped] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [shuffle, setShuffle] = useState(() => localStorage.getItem('fc_shuffle') !== 'false');
  const [autoFlip, setAutoFlip] = useState(() => Number(localStorage.getItem('fc_autoflip') || 0));

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getFlashcards(mode === 'due') as { success: boolean; flashcards: Flashcard[] };
      const all = res.flashcards || [];
      if (mode === 'due') setDueCount(all.length);
      const ordered = shuffle ? [...all].sort(() => Math.random() - 0.5) : all;
      setCards(ordered);
      setIndex(0); setFlipped(false); setDone(false); setStats({ reviewed: 0, correct: 0 }); setSkipped(0); setElapsed(0);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [mode, shuffle]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!done) { const t = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(t); } }, [done]);
  useEffect(() => { localStorage.setItem('fc_shuffle', String(shuffle)); }, [shuffle]);
  useEffect(() => { localStorage.setItem('fc_autoflip', String(autoFlip)); }, [autoFlip]);
  useEffect(() => {
    if (!autoFlip || flipped || done) return;
    const t = setTimeout(() => setFlipped(true), autoFlip * 1000);
    return () => clearTimeout(t);
  }, [autoFlip, index, flipped, done]);

  const handleRate = useCallback(async (quality: number) => {
    const card = cards[index];
    if (!card) return;
    try {
      await reviewFlashcard(card.id, quality);
      setStats(s => ({ reviewed: s.reviewed + 1, correct: s.correct + (quality >= 3 ? 1 : 0) }));
      if (index < cards.length - 1) { setIndex(i => i + 1); setFlipped(false); } else { setDone(true); }
    } catch { alert('Failed to save review'); }
  }, [cards, index]);

  const handleSkip = useCallback(() => {
    setSkipped(s => s + 1);
    if (index < cards.length - 1) { setIndex(i => i + 1); setFlipped(false); } else { setDone(true); }
  }, [cards.length, index]);

  useEffect(() => {
    if (done) return;
    const h = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName.toLowerCase();
      if (['input','textarea','select'].includes(tag)) return;
      if (e.key === ' ') { e.preventDefault(); setFlipped(f => !f); }
      if (!flipped) return;
      if (e.key === '1') handleRate(0);
      if (e.key === '2') handleRate(2);
      if (e.key === '3') handleRate(3);
      if (e.key === '4') handleRate(5);
      if (e.key.toLowerCase() === 's') handleSkip();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [flipped, done, handleRate, handleSkip]);

  const fmt = (s: number) => `${Math.floor(s/60)}m ${s%60}s`;
  const card = `rounded-3xl shadow-2xl border p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;

  if (loading) return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400" />
      <p className={`mt-4 text-lg ${theme === 'light' ? 'text-gray-600' : 'text-white'}`}>Loading flashcards...</p>
    </div>
  );

  if (done) {
    const accuracy = stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : 0;
    return (
      <div className="max-w-4xl mx-auto">
        <div className={`${card} text-center`}>
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 via-blue-400 to-purple-400 mb-6">Review Complete!</h2>
          <div className="mb-8">
            <div className="text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-pink-400 mb-3">{accuracy}%</div>
            <p className={`text-2xl ${theme === 'light' ? 'text-gray-700' : 'text-white/90'}`}>{stats.correct} correct out of {stats.reviewed}</p>
            <p className={`text-sm mt-2 ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>Skipped: {skipped} • Time: {fmt(elapsed)}</p>
          </div>
          <div className="flex gap-4 justify-center">
            <button onClick={load} className="px-8 py-4 backdrop-blur-md bg-purple-500/30 text-white rounded-2xl font-bold hover:bg-purple-500/40 border border-purple-400/30 transition-all transform hover:scale-105">Review Again</button>
            <button onClick={onBack} className={`px-8 py-4 rounded-2xl font-bold border transition-all transform hover:scale-105 ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>Back</button>
          </div>
        </div>
      </div>
    );
  }

  if (cards.length === 0) return (
    <div className="max-w-4xl mx-auto">
      <div className={`${card} text-center`}>
        <div className="text-7xl mb-6">🃏</div>
        <h2 className={`text-3xl font-bold mb-4 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{mode === 'due' ? 'No Cards Due' : 'No Flashcards Yet'}</h2>
        <p className={`mb-8 ${theme === 'light' ? 'text-gray-500' : 'text-white/80'}`}>{mode === 'due' ? 'Great job! All cards reviewed.' : 'Flashcards are created from your corrections.'}</p>
        <div className="flex gap-4 justify-center">
          {mode === 'due' && <button onClick={() => setMode('all')} className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold transition-all">Review All</button>}
          <button onClick={onBack} className={`px-8 py-4 rounded-2xl font-bold border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>Back</button>
        </div>
      </div>
    </div>
  );

  const current = cards[index];
  const progress = ((index + 1) / cards.length) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className={card}>
        <div className="flex justify-between items-center mb-6">
          <button onClick={onBack} className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl font-medium border transition-all ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>← Back</button>
          <div className="flex gap-3">
            {(['due','all'] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} className={`px-5 py-2.5 rounded-2xl font-bold transition-all ${mode === m ? 'backdrop-blur-md bg-purple-500/40 text-white border-2 border-purple-400/50' : theme === 'light' ? 'bg-gray-100 text-gray-600 border border-gray-200' : 'backdrop-blur-md bg-white/10 text-white/80 border border-white/20'}`}>
                {m === 'due' ? `Due (${dueCount})` : 'All'}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center mb-3">
          <h2 className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Flashcard Review</h2>
          <span className={`text-sm px-4 py-2 rounded-xl ${theme === 'light' ? 'bg-gray-100 text-gray-600' : 'backdrop-blur-sm bg-white/10 text-white/80'}`}>Card {index + 1} of {cards.length}</span>
        </div>
        <div className={`w-full rounded-full h-3 mb-8 ${theme === 'light' ? 'bg-gray-200' : 'backdrop-blur-md bg-white/20'}`}>
          <div className="bg-gradient-to-r from-purple-400 to-pink-400 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className={`flex items-center justify-between rounded-2xl px-4 py-3 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
            <div><p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>Shuffle</p><p className={`text-sm font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{shuffle ? 'On' : 'Off'}</p></div>
            <button onClick={() => setShuffle(s => !s)} className={`px-3 py-1.5 rounded-xl text-sm border transition-all ${theme === 'light' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>Toggle</button>
          </div>
          <div className={`rounded-2xl px-4 py-3 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
            <label className={`block text-xs mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>Auto flip (s)</label>
            <select value={autoFlip} onChange={e => setAutoFlip(Number(e.target.value))} className={`w-full px-2 py-1.5 rounded-xl text-sm border ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'border-white/30 text-white backdrop-blur-md bg-white/10'}`}>
              {[0,3,5,8].map(v => <option key={v} value={v} className="bg-slate-800">{v === 0 ? 'Off' : v}</option>)}
            </select>
          </div>
          <div className={`rounded-2xl px-4 py-3 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
            <p className={`text-xs mb-1 ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>Shortcuts</p>
            <p className={`text-xs ${theme === 'light' ? 'text-gray-600' : 'text-white'}`}>Space: flip • 1-4: rate • S: skip</p>
          </div>
        </div>

        <div className="mb-8" onClick={() => setFlipped(f => !f)} style={{ cursor: 'pointer' }}>
          <div className="backdrop-blur-xl bg-gradient-to-br from-purple-500/30 to-blue-500/30 border-4 border-purple-400/50 rounded-3xl p-10 min-h-64 flex items-center justify-center hover:shadow-2xl hover:scale-[1.01] transition-all duration-300">
            <div className="text-center">
              {!flipped ? (
                <div>
                  <div className="text-sm font-bold text-purple-300 mb-4 uppercase tracking-wider">Question</div>
                  <div className={`text-3xl font-bold mb-8 leading-relaxed ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{current.front}</div>
                  <div className={`text-sm px-4 py-2 rounded-xl inline-block ${theme === 'light' ? 'bg-gray-100 text-gray-500' : 'backdrop-blur-sm bg-white/10 text-white/70'}`}>Click to reveal</div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-green-300 mb-4 uppercase tracking-wider">Answer</div>
                  <div className={`text-xl mb-8 whitespace-pre-wrap leading-relaxed ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{current.back}</div>
                  <div className={`text-sm px-4 py-2 rounded-xl inline-block ${theme === 'light' ? 'bg-gray-100 text-gray-500' : 'backdrop-blur-sm bg-white/10 text-white/70'}`}>Rate below</div>
                </div>
              )}
            </div>
          </div>
          <div className={`mt-4 flex justify-between text-xs ${theme === 'light' ? 'text-gray-400' : 'text-white/70'}`}>
            <span>Category: {current.category}</span>
            <span>Reviewed: {current.review_count}×</span>
          </div>
        </div>

        {flipped && (
          <div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { q: 0, label: '❌ Wrong', sub: 'Tomorrow', cls: 'bg-red-500/30 text-red-200 border-red-400/40 hover:bg-red-500/40' },
                { q: 2, label: '😐 Hard', sub: '3 days', cls: 'bg-yellow-500/30 text-yellow-200 border-yellow-400/40 hover:bg-yellow-500/40' },
                { q: 3, label: '👍 Good', sub: '1 week', cls: 'bg-blue-500/30 text-blue-200 border-blue-400/40 hover:bg-blue-500/40' },
                { q: 5, label: '✅ Easy', sub: '2 weeks', cls: 'bg-green-500/30 text-green-200 border-green-400/40 hover:bg-green-500/40' },
              ].map(({ q, label, sub, cls }) => (
                <button key={q} onClick={() => handleRate(q)} className={`px-4 py-4 backdrop-blur-md rounded-2xl font-bold border-2 transition-all transform hover:scale-105 ${cls}`}>
                  {label}<div className="text-xs mt-1 font-normal">{sub}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-end">
              <button onClick={handleSkip} className={`px-6 py-3 rounded-2xl font-medium border transition-all ${theme === 'light' ? 'bg-gray-100 text-gray-600 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>Skip</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
