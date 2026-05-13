'use client';

import { useState } from 'react';
import { getCollocations, getCollocationQuiz, lookupCollocations } from '@/lib/api-client';

interface Props { theme: 'dark' | 'light'; onBack: () => void; }
const CATS = ['Business','Academic','Daily Life','Phrasal Verbs','Adjective+Noun','Verb+Noun'];
const LEVELS = ['A2','B1','B2','C1'];

export default function CollocationsPractice({ theme, onBack }: Props) {
  const [category, setCategory] = useState('Business');
  const [level, setLevel] = useState('B1');
  const [tab, setTab] = useState<'learn' | 'quiz' | 'lookup'>('learn');
  const [data, setData] = useState<{ collocations?: { collocation: string; meaning: string; example: string; common_mistake: string }[] } | null>(null);
  const [quiz, setQuiz] = useState<{ questions?: { type: string; sentence: string; options: string[]; correct_answer: string; collocation: string; explanation: string }[] } | null>(null);
  const [lookupWord, setLookupWord] = useState('');
  const [lookupResult, setLookupResult] = useState<{ collocations?: string[]; examples?: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<Record<number,string>>({});
  const [submitted, setSubmitted] = useState(false);

  const load = async () => {
    setLoading(true); setData(null); setQuiz(null); setAnswers({}); setSubmitted(false);
    try {
      if (tab === 'learn') {
        const res = await getCollocations(category, level) as { data: typeof data };
        setData(res.data);
      } else if (tab === 'quiz') {
        const res = await getCollocationQuiz(category, level, 'fill_blank') as { quiz: typeof quiz };
        setQuiz(res.quiz);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const lookup = async () => {
    if (!lookupWord.trim()) return;
    setLoading(true); setLookupResult(null);
    try { setLookupResult(await lookupCollocations(lookupWord) as typeof lookupResult); } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const quizScore = submitted && quiz?.questions ? quiz.questions.filter((q, i) => answers[i] === q.correct_answer).length : 0;

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const selectCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'}`;

  return (
    <div className="max-w-5xl mx-auto">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Collocations</h2>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>

        <div className="flex gap-3 mb-6 flex-wrap">
          {(['learn','quiz','lookup'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setData(null); setQuiz(null); setLookupResult(null); }} className={`px-5 py-2.5 rounded-2xl font-bold capitalize transition-all ${tab === t ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : theme === 'light' ? 'bg-gray-100 text-gray-600' : 'backdrop-blur-md bg-white/10 text-white/80 border border-white/20'}`}>
              {t === 'learn' ? '📚 Learn' : t === 'quiz' ? '🧠 Quiz' : '🔍 Lookup'}
            </button>
          ))}
        </div>

        {tab !== 'lookup' && (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Category</label><select value={category} onChange={e => setCategory(e.target.value)} className={selectCls}>{CATS.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}</select></div>
              <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Level</label><select value={level} onChange={e => setLevel(e.target.value)} className={selectCls}>{LEVELS.map(l => <option key={l} value={l} className="bg-slate-800">{l}</option>)}</select></div>
            </div>
            <button onClick={load} disabled={loading} className="w-full py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-[1.02] mb-8">
              {loading ? 'Loading...' : tab === 'learn' ? '🔗 Learn Collocations' : '🎯 Start Quiz'}
            </button>
          </>
        )}

        {tab === 'lookup' && (
          <div className="mb-6">
            <label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Look up collocations for a word</label>
            <div className="flex gap-3">
              <input type="text" value={lookupWord} onChange={e => setLookupWord(e.target.value)} onKeyDown={e => e.key === 'Enter' && lookup()} placeholder="Enter a word (e.g., make, strong, time)" className={`flex-1 px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800 placeholder-gray-400' : 'backdrop-blur-md bg-white/10 border-white/20 text-white placeholder-white/50'}`} />
              <button onClick={lookup} disabled={loading || !lookupWord.trim()} className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl font-bold disabled:opacity-60 transition-all">
                {loading ? '...' : '🔍'}
              </button>
            </div>
            {lookupResult && (
              <div className={`mt-6 p-5 rounded-2xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
                {lookupResult.collocations && <div className="mb-4"><p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>COMMON COLLOCATIONS:</p><div className="flex flex-wrap gap-2">{lookupResult.collocations.map(c => <span key={c} className={`px-3 py-1 rounded-full text-sm ${theme === 'light' ? 'bg-blue-100 text-blue-700' : 'bg-blue-500/20 text-blue-200'}`}>{c}</span>)}</div></div>}
                {lookupResult.examples && <div><p className={`text-xs font-bold mb-2 ${theme === 'light' ? 'text-gray-500' : 'text-white/60'}`}>EXAMPLES:</p>{lookupResult.examples.map((e, i) => <p key={i} className={`text-sm italic mb-1 ${theme === 'light' ? 'text-gray-700' : 'text-white/80'}`}>"{e}"</p>)}</div>}
              </div>
            )}
          </div>
        )}

        {tab === 'learn' && data?.collocations && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {data.collocations.map((c, i) => (
              <div key={i} className={`rounded-2xl p-5 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
                <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-purple-700' : 'text-purple-300'}`}>{c.collocation}</h3>
                <p className={`text-sm mb-2 ${theme === 'light' ? 'text-gray-700' : 'text-white/90'}`}>{c.meaning}</p>
                <p className={`text-sm italic mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>"{c.example}"</p>
                {c.common_mistake && <p className={`text-xs ${theme === 'light' ? 'text-red-600' : 'text-red-300'}`}>⚠️ {c.common_mistake}</p>}
              </div>
            ))}
          </div>
        )}

        {tab === 'quiz' && quiz?.questions && (
          <div className="space-y-6">
            {submitted && <div className={`p-4 rounded-2xl text-center font-bold ${quizScore >= quiz.questions.length * 0.7 ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'}`}>Score: {quizScore}/{quiz.questions.length}</div>}
            {quiz.questions.map((q, i) => (
              <div key={i} className={`p-5 rounded-2xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
                <p className={`font-semibold mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{i+1}. {q.sentence}</p>
                <div className="grid grid-cols-2 gap-2">
                  {q.options.map((opt, j) => {
                    const isSel = answers[i] === opt;
                    const isCorr = submitted && opt === q.correct_answer;
                    const isWrong = submitted && isSel && !isCorr;
                    return <button key={j} onClick={() => !submitted && setAnswers(a => ({ ...a, [i]: opt }))} className={`px-4 py-3 rounded-2xl text-sm font-medium border-2 text-left transition-all ${isCorr ? 'bg-green-500/30 border-green-400/50 text-green-200' : isWrong ? 'bg-red-500/30 border-red-400/50 text-red-200' : isSel ? 'bg-purple-500/30 border-purple-400/50 text-white' : theme === 'light' ? 'bg-white border-gray-200 text-gray-700' : 'backdrop-blur-sm bg-white/10 border-white/20 text-white/80'}`}>{opt}</button>;
                  })}
                </div>
                {submitted && <p className={`mt-2 text-sm ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>{q.explanation}</p>}
              </div>
            ))}
            {!submitted && <button onClick={() => setSubmitted(true)} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold transition-all">Submit</button>}
          </div>
        )}
      </div>
    </div>
  );
}
