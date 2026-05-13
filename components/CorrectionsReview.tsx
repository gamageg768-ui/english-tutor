'use client';

import { useState, useEffect } from 'react';
import { getAllCorrections } from '@/lib/api-client';

interface Correction { id: number; original?: string; corrected?: string; wrong?: string; correct?: string; fullSentence?: string; explanation?: string; reason?: string; category?: string; created_at?: string; timestamp?: string; situation_title?: string; }
interface Props { theme: 'dark' | 'light'; onBack: () => void; }

export default function CorrectionsReview({ theme, onBack }: Props) {
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const res = await getAllCorrections() as { success: boolean; corrections: Correction[] };
        setCorrections(res.corrections || []);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    })();
  }, []);

  const filtered = corrections.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      (c.original ?? c.wrong ?? '').toLowerCase().includes(q) ||
      (c.corrected ?? c.correct ?? '').toLowerCase().includes(q) ||
      (c.explanation ?? c.reason ?? '').toLowerCase().includes(q) ||
      (c.fullSentence ?? '').toLowerCase().includes(q)
    );
  });

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;

  if (loading) return (
    <div className="max-w-5xl mx-auto text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400" />
      <p className={`mt-4 text-lg ${theme === 'light' ? 'text-gray-600' : 'text-white'}`}>Loading corrections...</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto">
      <div className={card}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">My Corrections</h2>
            <p className={`mt-1 ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>{corrections.length} corrections recorded</p>
          </div>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>← Back</button>
        </div>

        <div className="mb-6">
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search corrections..." className={`w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800 placeholder-gray-400' : 'backdrop-blur-md bg-white/10 border-white/20 text-white placeholder-white/50'}`} />
        </div>

        {filtered.length === 0 ? (
          <div className={`text-center py-16 rounded-3xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/5 border-white/10'}`}>
            <div className="text-7xl mb-6">✏️</div>
            <h3 className={`text-2xl font-bold mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{corrections.length === 0 ? 'No corrections yet' : 'No results found'}</h3>
            <p className={theme === 'light' ? 'text-gray-500' : 'text-white/70'}>{corrections.length === 0 ? 'Your grammar corrections from conversations appear here' : 'Try a different search'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map(c => {
              const wrong = c.original ?? c.wrong ?? '';
              const correct = c.corrected ?? c.correct ?? '';
              const reason = c.explanation ?? c.reason ?? '';
              const date = c.timestamp ?? c.created_at ?? '';
              return (
                <div key={c.id} className={`rounded-2xl p-5 border transition-all ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {c.situation_title && <span className={`text-xs px-3 py-1 rounded-full font-medium ${theme === 'light' ? 'bg-purple-100 text-purple-700' : 'backdrop-blur-sm bg-purple-500/20 text-purple-200 border border-purple-400/30'}`}>{c.situation_title}</span>}
                      {c.category && <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${theme === 'light' ? 'bg-blue-50 text-blue-600' : 'bg-blue-500/20 text-blue-300 border border-blue-400/20'}`}>{c.category}</span>}
                    </div>
                    {date && <span className={`text-xs ${theme === 'light' ? 'text-gray-400' : 'text-white/50'}`}>{new Date(date).toLocaleDateString()}</span>}
                  </div>
                  <div className="space-y-2">
                    <div className={`flex items-start gap-2 text-sm ${theme === 'light' ? 'text-red-600' : 'text-red-300'}`}>
                      <span className="font-bold shrink-0 mt-0.5">✗</span>
                      <span className="line-through">{wrong}</span>
                    </div>
                    <div className={`flex items-start gap-2 text-sm ${theme === 'light' ? 'text-green-700' : 'text-green-300'}`}>
                      <span className="font-bold shrink-0 mt-0.5">✓</span>
                      <span className="font-semibold">{correct}</span>
                    </div>
                    {c.fullSentence && (
                      <div className={`flex items-start gap-2 text-sm ${theme === 'light' ? 'text-indigo-700' : 'text-indigo-300'}`}>
                        <span className="shrink-0 mt-0.5">📝</span>
                        <span className="italic">&ldquo;{c.fullSentence}&rdquo;</span>
                      </div>
                    )}
                    {reason && (
                      <div className={`flex items-start gap-2 text-sm mt-1 pt-2 border-t ${theme === 'light' ? 'border-gray-200 text-gray-600' : 'border-white/10 text-white/60'}`}>
                        <span className="shrink-0 mt-0.5">💡</span>
                        <p className="leading-relaxed">{reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
