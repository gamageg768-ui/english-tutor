'use client';

import { useState } from 'react';
import { getIdioms, getIdiomsQuiz } from '@/lib/api-client';

interface Props { theme: 'dark' | 'light'; onBack: () => void; }
const CATEGORIES = ['General','Business','Emotions','Success','Time','Nature','Animals','Sports','Food','Travel'];
const LEVELS = ['A2','B1','B2','C1'];

export default function IdiomsExplorer({ theme, onBack }: Props) {
  const [category, setCategory] = useState('General');
  const [level, setLevel] = useState('B1');
  const [tab, setTab] = useState<'learn' | 'quiz'>('learn');
  const [idioms, setIdioms] = useState<{ idiom: string; meaning: string; examples: string[]; origin?: string }[]>([]);
  const [quiz, setQuiz] = useState<{ idiom: string; question: string; options: string[]; correct_answer: string; explanation: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const load = async () => {
    setLoading(true); setIdioms([]); setQuiz([]); setQuizAnswers({}); setSubmitted(false);
    try {
      if (tab === 'learn') {
        const res = await getIdioms(category, level) as { data: { idioms?: typeof idioms } };
        setIdioms(res.data?.idioms || []);
      } else {
        const res = await getIdiomsQuiz(category, level) as { quiz: { questions?: typeof quiz } };
        setQuiz(res.quiz?.questions || []);
      }
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const card = `rounded-3xl shadow-2xl border p-6 sm:p-8 ${theme === 'light' ? 'bg-white border-gray-200' : 'backdrop-blur-xl bg-white/10 border-white/20'}`;
  const selectCls = `w-full px-4 py-3 rounded-2xl border-2 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition-all ${theme === 'light' ? 'bg-white border-gray-200 text-gray-800' : 'backdrop-blur-md bg-white/10 border-white/20 text-white'}`;

  const score = submitted ? quiz.filter((q, i) => quizAnswers[i] === q.correct_answer).length : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className={card}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">Idioms Explorer</h2>
          <button onClick={onBack} className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl font-medium border ${theme === 'light' ? 'bg-gray-100 text-gray-700 border-gray-200' : 'backdrop-blur-md bg-white/10 text-white border-white/20'}`}>← Back</button>
        </div>

        <div className="flex gap-3 mb-6">
          {(['learn','quiz'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setIdioms([]); setQuiz([]); }} className={`px-5 py-2.5 rounded-2xl font-bold transition-all capitalize ${tab === t ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' : theme === 'light' ? 'bg-gray-100 text-gray-600' : 'backdrop-blur-md bg-white/10 text-white/80 border border-white/20'}`}>{t === 'learn' ? '📚 Learn' : '🧠 Quiz'}</button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Category</label><select value={category} onChange={e => setCategory(e.target.value)} className={selectCls}>{CATEGORIES.map(c => <option key={c} value={c} className="bg-slate-800">{c}</option>)}</select></div>
          <div><label className={`block text-sm font-semibold mb-2 ${theme === 'light' ? 'text-gray-600' : 'text-white/80'}`}>Level</label><select value={level} onChange={e => setLevel(e.target.value)} className={selectCls}>{LEVELS.map(l => <option key={l} value={l} className="bg-slate-800">{l}</option>)}</select></div>
        </div>
        <button onClick={load} disabled={loading} className="w-full py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-2xl font-bold disabled:opacity-60 transition-all transform hover:scale-[1.02] mb-8">
          {loading ? 'Loading...' : tab === 'learn' ? '💡 Explore Idioms' : '🎯 Start Quiz'}
        </button>

        {tab === 'learn' && idioms.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {idioms.map((id, i) => (
              <div key={i} className={`rounded-2xl p-5 border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
                <h3 className={`text-xl font-bold mb-2 ${theme === 'light' ? 'text-purple-700' : 'text-purple-300'}`}>"{id.idiom}"</h3>
                <p className={`text-sm mb-3 ${theme === 'light' ? 'text-gray-700' : 'text-white/90'}`}>{id.meaning}</p>
                {id.examples && id.examples.length > 0 && (
                  <div>
                    <p className="text-xs text-blue-300 font-bold mb-1">EXAMPLES:</p>
                    {id.examples.map((ex, j) => <p key={j} className={`text-sm italic ${theme === 'light' ? 'text-gray-600' : 'text-white/70'}`}>"{ex}"</p>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'quiz' && quiz.length > 0 && (
          <div className="space-y-6">
            {submitted && <div className={`p-4 rounded-2xl text-center font-bold text-lg mb-4 ${score >= quiz.length * 0.7 ? 'bg-green-500/20 text-green-300 border border-green-400/30' : 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'}`}>Score: {score}/{quiz.length} ({Math.round((score/quiz.length)*100)}%)</div>}
            {quiz.map((q, i) => (
              <div key={i} className={`p-5 rounded-2xl border ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'backdrop-blur-md bg-white/10 border-white/20'}`}>
                <p className={`font-semibold mb-3 ${theme === 'light' ? 'text-gray-800' : 'text-white'}`}>{i+1}. {q.question}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, j) => {
                    const isSel = quizAnswers[i] === opt;
                    const isCorrect = submitted && opt === q.correct_answer;
                    const isWrong = submitted && isSel && opt !== q.correct_answer;
                    return (
                      <button key={j} onClick={() => !submitted && setQuizAnswers(a => ({ ...a, [i]: opt }))} className={`px-4 py-3 rounded-2xl text-sm font-medium border-2 text-left transition-all ${isCorrect ? 'bg-green-500/30 border-green-400/50 text-green-200' : isWrong ? 'bg-red-500/30 border-red-400/50 text-red-200' : isSel ? 'bg-purple-500/30 border-purple-400/50 text-white' : theme === 'light' ? 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50' : 'backdrop-blur-sm bg-white/10 border-white/20 text-white/80 hover:bg-white/20'}`}>{opt}</button>
                    );
                  })}
                </div>
                {submitted && <p className={`mt-2 text-sm ${theme === 'light' ? 'text-blue-700' : 'text-blue-300'}`}>{q.explanation}</p>}
              </div>
            ))}
            {!submitted && <button onClick={() => setSubmitted(true)} className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-2xl font-bold transition-all transform hover:scale-[1.02]">Submit Answers</button>}
          </div>
        )}
      </div>
    </div>
  );
}
