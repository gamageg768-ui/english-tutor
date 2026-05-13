'use client';

import { useState } from 'react';
import { lookupWord, getWordOfDay, getPracticeSentences } from '@/lib/api-client';

interface Props { theme: 'dark' | 'light'; onBack: () => void; }

export default function DictionaryLookup({ theme, onBack }: Props) {
  const [word, setWord] = useState('');
  const [result, setResult] = useState<Record<string,unknown> | null>(null);
  const [wod, setWod] = useState<Record<string,unknown> | null>(null);
  const [sentences, setSentences] = useState<{ sentences?: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [wodLoading, setWodLoading] = useState(false);
  const [sentLoading, setSentLoading] = useState(false);

  const lookup = async () => {
    if (!word.trim()) return;
    setLoading(true); setResult(null); setSentences(null);
    try { setResult((await lookupWord(word) as { word_info: Record<string,unknown> }).word_info); } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const loadWod = async () => {
    setWodLoading(true);
    try { setWod((await getWordOfDay() as { word_of_day: Record<string,unknown> }).word_of_day); } catch { /* ignore */ }
    finally { setWodLoading(false); }
  };

  const loadSentences = async (w: string) => {
    setSentLoading(true);
    try { setSentences(await getPracticeSentences(w) as { sentences?: string[] }); } catch { /* ignore */ }
    finally { setSentLoading(false); }
  };

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;

  const r = result as { word?: string; definition?: string; pos?: string; pronunciation?: string; examples?: string[]; synonyms?: string[]; antonyms?: string[] } | null;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Dictionary</h2>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>

        <div className="flex gap-3 mb-8">
          <input
            type="text"
            value={word}
            onChange={e => setWord(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && lookup()}
            placeholder="Enter a word to look up..."
            className={`flex-1 px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800 placeholder-gray-400' : 'backdrop-blur-md bg-white/10 border-white/20 text-white placeholder-white/50'}`}
          />
          <button onClick={lookup} disabled={loading || !word.trim()} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-105">
            {loading ? '...' : '🔍'}
          </button>
        </div>

        {r && (
          <div className={`rounded-2xl p-6 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/5 border-white/10'}`}>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className={`text-3xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{r.word}</h3>
                {r.pos && <span className={`inline-block mt-2 px-3 py-1 text-xs font-bold rounded-full ${theme === 'light' ? 'bg-purple-100 text-purple-700' : 'bg-purple-500/30 text-purple-200 border border-purple-400/30'}`}>{r.pos}</span>}
                {r.pronunciation && <p className={`mt-2 text-sm ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>{r.pronunciation}</p>}
              </div>
            </div>
            {r.definition && <div className="mb-4"><p className="text-xs text-blue-300 font-bold mb-2">DEFINITION</p><p className={`leading-relaxed ${theme === 'light' ? 'text-gray-700' : 'text-white/90'}`}>{r.definition}</p></div>}
            {r.examples && r.examples.length > 0 && <div className="mb-4"><p className="text-xs text-blue-300 font-bold mb-2">EXAMPLES</p>{r.examples.map((ex, i) => <p key={i} className={`italic mb-1 text-sm ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>"{ex}"</p>)}</div>}
            {r.synonyms && r.synonyms.length > 0 && <div className="mb-4"><p className="text-xs text-blue-300 font-bold mb-2">SYNONYMS</p><div className="flex flex-wrap gap-2">{r.synonyms.map(s => <span key={s} className={`px-3 py-1 rounded-full text-sm ${theme === 'light' ? 'bg-green-100 text-green-700' : 'bg-green-500/20 text-green-200 border border-green-400/30'}`}>{s}</span>)}</div></div>}
            <button onClick={() => loadSentences(r.word || word)} disabled={sentLoading} className={`mt-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${theme === 'light' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'backdrop-blur-sm bg-blue-500/10 text-blue-200 border-blue-400/30'} disabled:opacity-60`}>
              {sentLoading ? 'Loading...' : '📝 Practice Sentences'}
            </button>
            {sentences?.sentences && <div className="mt-4 space-y-2">{sentences.sentences.map((s, i) => <p key={i} className={`text-sm italic p-3 rounded-xl ${theme === 'light' ? 'bg-blue-50 text-blue-800' : 'bg-blue-500/10 text-blue-200'}`}>{s}</p>)}</div>}
          </div>
        )}
      </div>

      <div className={card}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-xl font-bold ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>Word of the Day</h3>
          <button onClick={loadWod} disabled={wodLoading} className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold text-sm disabled:opacity-60 transition-all">
            {wodLoading ? 'Loading...' : '✨ Get Word'}
          </button>
        </div>
        {wod && (
          <div className={`rounded-2xl p-5 border ${theme === 'light' ? 'bg-yellow-50 border-yellow-200' : 'backdrop-blur-md bg-yellow-500/10 border-yellow-400/30'}`}>
            <h4 className={`text-2xl font-bold mb-2 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{(wod as { word?: string }).word}</h4>
            <p className={`text-sm mb-3 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>{(wod as { definition?: string }).definition}</p>
            {(wod as { example?: string }).example && <p className={`text-sm italic ${theme === 'light' ? 'text-gray-500' : 'text-white/70'}`}>"{(wod as { example?: string }).example}"</p>}
          </div>
        )}
      </div>
    </div>
  );
}
