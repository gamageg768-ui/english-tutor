'use client';

import { useState, useEffect, useMemo } from 'react';
import { getVocabulary, deleteVocabulary } from '@/lib/api-client';

interface VocabWord { id: number; word: string; pos: string; definition: string; example: string; source_situation?: string; saved_at: string; review_count: number; mastered: boolean; }
interface Props { theme: 'dark' | 'light'; onBack: () => void; }

export default function VocabularyBuilder({ theme, onBack }: Props) {
  const [vocabulary, setVocabulary] = useState<VocabWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPos, setFilterPos] = useState('');
  const [filterMastery, setFilterMastery] = useState<'all' | 'mastered' | 'learning'>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'alphabetical' | 'most-reviewed'>('recent');
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [selected, setSelected] = useState<VocabWord | null>(null);

  useEffect(() => {
    loadVocabulary();
    try {
      const f = JSON.parse(localStorage.getItem('vocab_favorites') || '[]');
      if (Array.isArray(f)) setFavorites(new Set(f));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    localStorage.setItem('vocab_favorites', JSON.stringify(Array.from(favorites)));
  }, [favorites]);

  const loadVocabulary = async () => {
    try {
      setLoading(true);
      const res = await getVocabulary() as { success: boolean; words: VocabWord[] };
      setVocabulary(res.words || []);
    } catch { setError('Failed to load vocabulary'); }
    finally { setLoading(false); }
  };

  const filtered = useMemo(() => {
    let list = [...vocabulary];
    if (searchTerm) list = list.filter(w => w.word.toLowerCase().includes(searchTerm.toLowerCase()) || w.definition.toLowerCase().includes(searchTerm.toLowerCase()));
    if (filterPos) list = list.filter(w => w.pos === filterPos);
    if (filterMastery === 'mastered') list = list.filter(w => w.mastered);
    else if (filterMastery === 'learning') list = list.filter(w => !w.mastered);
    if (sortBy === 'alphabetical') list.sort((a, b) => a.word.localeCompare(b.word));
    else if (sortBy === 'most-reviewed') list.sort((a, b) => b.review_count - a.review_count);
    else list.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
    return list;
  }, [vocabulary, searchTerm, filterPos, filterMastery, sortBy]);

  const stats = useMemo(() => ({
    total: vocabulary.length,
    mastered: vocabulary.filter(w => w.mastered).length,
    avgReviews: vocabulary.length ? Math.round(vocabulary.reduce((s, w) => s + w.review_count, 0) / vocabulary.length) : 0,
  }), [vocabulary]);

  const uniquePos = Array.from(new Set(vocabulary.map(w => w.pos)));

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this word?')) return;
    try { await deleteVocabulary(id); setVocabulary(v => v.filter(w => w.id !== id)); } catch { alert('Failed to delete'); }
  };

  const exportCsv = () => {
    const rows = [['word','pos','definition','example','review_count','mastered'], ...filtered.map(w => [w.word, w.pos, w.definition, w.example, String(w.review_count), String(w.mastered)])];
    const csv = rows.map(r => r.map(v => `"${v.replace(/"/g,'""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'vocabulary.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const inputCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white placeholder-white/50'}`;

  if (loading) return (
    <div className="max-w-6xl mx-auto text-center py-12">
      <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-400" />
      <p className={`mt-4 text-lg ${theme === 'light' ? 'text-gray-600' : 'text-white'}`}>Loading vocabulary...</p>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto">
      <div className={card}>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="flex-1">
            <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 mb-1">Vocabulary Builder</h2>
            <p className={`text-sm sm:text-lg ${theme === 'light' ? 'text-gray-500' : 'text-white/80'}`}>{vocabulary.length} words saved</p>
          </div>
          <div className="flex gap-2">
            <button onClick={exportCsv} className={`px-4 py-2.5 rounded-2xl text-sm font-medium border transition-all ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20'}`}>Export CSV</button>
            <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-medium border transition-all ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20 hover:bg-white/20'}`}><span>←</span> Back</button>
          </div>
        </div>

        {error && <div className="mb-6 p-4 rounded-2xl bg-red-500/20 border border-red-400/30 text-red-200">{error} <button onClick={loadVocabulary} className="ml-3 underline">Retry</button></div>}

        <div className="mb-6 grid grid-cols-3 gap-4">
          {[['Total Words', stats.total], ['Mastered', stats.mastered], ['Avg Reviews', stats.avgReviews]].map(([l, v]) => (
            <div key={l} className={`rounded-2xl p-4 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
              <p className={`text-xs ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>{l}</p>
              <p className={`text-2xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{v}</p>
            </div>
          ))}
        </div>

        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Search</label><input type="text" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} placeholder="Search..." className={inputCls} /></div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Type</label>
            <select value={filterPos} onChange={e => setFilterPos(e.target.value)} className={inputCls}>
              <option value="" className="bg-slate-800">All Types</option>
              {uniquePos.map(p => <option key={p} value={p} className="bg-slate-800">{p}</option>)}
            </select>
          </div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Mastery</label>
            <select value={filterMastery} onChange={e => setFilterMastery(e.target.value as typeof filterMastery)} className={inputCls}>
              <option value="all" className="bg-slate-800">All</option>
              <option value="learning" className="bg-slate-800">Learning</option>
              <option value="mastered" className="bg-slate-800">Mastered</option>
            </select>
          </div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as typeof sortBy)} className={inputCls}>
              <option value="recent" className="bg-slate-800">Recent</option>
              <option value="alphabetical" className="bg-slate-800">A-Z</option>
              <option value="most-reviewed" className="bg-slate-800">Most Reviewed</option>
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className={`text-center py-16 rounded-3xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/5 border-white/10'}`}>
            <div className="text-7xl mb-6">📚</div>
            <h3 className={`text-2xl font-bold mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{vocabulary.length === 0 ? 'No vocabulary saved yet' : 'No words match your search'}</h3>
            <p className={theme === 'light' ? 'text-gray-500' : 'text-white/70'}>{vocabulary.length === 0 ? 'Words saved during conversations appear here' : 'Try different filters'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(word => (
              <div key={word.id} className={`rounded-3xl p-6 border-2 transition-all hover:shadow-2xl ${theme === 'light' ? 'bg-gray-50 border-gray-200 hover:border-gray-300' : 'backdrop-blur-xl bg-gradient-to-br from-white/15 to-white/5 border-white/20 hover:border-white/30'}`}>
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-purple-300 cursor-pointer" onClick={() => setSelected(word)}>{word.word}</h3>
                    <span className={`inline-block px-3 py-1 text-xs font-bold rounded-xl mt-2 ${theme === 'light' ? 'bg-purple-100 text-purple-700' : 'backdrop-blur-md bg-purple-500/30 text-purple-200 border border-purple-400/30'}`}>{word.pos}</span>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setFavorites(prev => { const n = new Set(prev); n.has(word.id) ? n.delete(word.id) : n.add(word.id); return n; })} className={`text-xs px-2 py-1 rounded-lg border ${theme === 'light' ? 'text-gray-500 border-gray-200' : 'text-white/70 border-white/20'}`}>{favorites.has(word.id) ? '★' : '☆'}</button>
                    <button onClick={() => handleDelete(word.id)} className="text-red-400 hover:text-red-500 text-xl transition-all">×</button>
                  </div>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-blue-300 font-bold mb-1">Definition:</p>
                  <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-white/90'}`}>{word.definition}</p>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-blue-300 font-bold mb-1">Example:</p>
                  <p className={`text-sm italic leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>"{word.example}"</p>
                </div>
                <div className={`mt-4 flex items-center justify-between text-xs ${theme === 'light' ? 'text-gray-400' : 'text-white/60'}`}>
                  <span>Reviewed {word.review_count}×</span>
                  {word.mastered && <span className="px-2 py-1 bg-green-500/30 text-green-300 rounded-xl font-bold border border-green-400/30">✓ Mastered</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-6 z-50">
          <div className="max-w-xl w-full backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-start mb-4">
              <div><h3 className="text-2xl font-bold text-white">{selected.word}</h3><p className="text-sm text-white/70">{selected.pos}</p></div>
              <button onClick={() => setSelected(null)} className="text-white/70 hover:text-white text-xl px-3 py-1">×</button>
            </div>
            <div className="space-y-4 text-white/90">
              <div><p className="text-xs text-white/70">Definition</p><p>{selected.definition}</p></div>
              <div><p className="text-xs text-white/70">Example</p><p className="italic">"{selected.example}"</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
